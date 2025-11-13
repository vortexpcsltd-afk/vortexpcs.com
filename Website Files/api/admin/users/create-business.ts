import type { VercelRequest, VercelResponse } from "@vercel/node";

// Firebase Admin singleton
let admin: any = null;
let initialized = false;

async function initAdmin() {
  if (admin && initialized) return admin;
  const imported = await import("firebase-admin");
  admin = (imported as any).default ? (imported as any).default : imported;

  if (!initialized) {
    try {
      // Prefer explicit base64 credential for Vercel
      const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (saB64) {
        const json = Buffer.from(saB64, "base64").toString("utf-8");
        const creds = JSON.parse(json);
        if (!(admin as any).apps?.length) {
          admin.initializeApp({
            credential: admin.credential.cert(creds),
            projectId: creds.project_id,
          });
        }
      } else {
        // Fallback to ADC
        if (!(admin as any).apps?.length) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID,
          });
        }
      }
      initialized = true;
    } catch (e) {
      initialized = false;
      console.error("Firebase Admin init failed", e);
    }
  }
  return admin;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await initAdmin();
  if (!initialized) {
    return res.status(501).json({
      message:
        "Firebase Admin SDK not initialized. Configure FIREBASE_SERVICE_ACCOUNT_BASE64 or ADC + FIREBASE_PROJECT_ID.",
    });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!token)
      return res.status(401).json({ message: "Missing Bearer token" });

    // Verify caller
    const decoded = await admin.auth().verifyIdToken(token);
    const db = admin.firestore();
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerProfile = callerDoc.exists ? callerDoc.data() : null;
    const callerEmail = decoded.email || callerProfile?.email;
    const isAdmin =
      (callerProfile?.role &&
        String(callerProfile.role).toLowerCase() === "admin") ||
      callerEmail === "admin@vortexpcs.com" ||
      callerEmail === "info@vortexpcs.com";
    if (!isAdmin)
      return res.status(403).json({ message: "Admin privileges required" });

    const { email, displayName, companyName, contactName, phone } = (req.body ||
      {}) as {
      email?: string;
      displayName?: string;
      companyName?: string;
      contactName?: string;
      phone?: string;
    };

    if (!email || !displayName || !companyName || !contactName) {
      return res.status(400).json({
        message: "email, displayName, companyName and contactName are required",
      });
    }

    // Create user in Firebase Auth (no password; will send reset link)
    const userRecord = await admin.auth().createUser({
      email,
      displayName,
      emailVerified: false,
      disabled: false,
    });

    // Create Firestore profile with business account type
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set(
        {
          uid: userRecord.uid,
          email,
          displayName,
          companyName,
          contactPerson: contactName,
          phone: phone || null,
          accountType: "business",
          role: "user",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: null,
        },
        { merge: true }
      );

    // Generate password reset link so the customer can set their password
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // Attempt to send a branded welcome email with the reset link using existing bulk email API
    let emailSent = false;
    let emailError: string | null = null;
    try {
      // Try dynamic import of branded email template builder; fallback if unavailable
      let buildBrandedEmailHtml: undefined | ((opts: any) => string);
      try {
        // Prefer dynamic import to avoid bundling issues across workspace boundaries
        const mod: any = await import(
          "../../../services/emailTemplate.ts"
        ).catch(async () => await import("../../../services/emailTemplate"));
        buildBrandedEmailHtml = mod?.buildBrandedEmailHtml as any;
      } catch (e: any) {
        // ignore; will fallback to inline template
        buildBrandedEmailHtml = undefined;
      }

      const subject = `Welcome to Vortex PCs for Business — Set your password`;
      const preheader = `Hi ${contactName}, your business account is ready. Set your password to sign in.`;
      const cta = `<a href="${resetLink}" style="display:inline-block;padding:12px 22px;border-radius:10px;background:linear-gradient(90deg,#0ea5e9,#2563eb);color:#ffffff;font-weight:700">Set your password</a>`;

      const contentHtml = `
        <h2 style="margin:0 0 8px 0;color:#e5e7eb;font-size:18px;">Hi ${escapeHtml(
          contactName
        )},</h2>
        <p style="margin:0 0 12px 0;color:#cbd5e1;">We've created your business account for <strong style="color:#fff;">${escapeHtml(
          companyName
        )}</strong> on Vortex PCs.</p>
        <p style="margin:0 0 12px 0;color:#cbd5e1;">Please set your password to finish setting up your access. This link will take you to a secure page to choose a password.</p>
        ${cta}
        <p style="margin:16px 0 0 0;color:#94a3b8;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br/><span style="word-break:break-all;color:#a5b4fc;">${escapeHtml(
          resetLink
        )}</span></p>
      `;

      const html = buildBrandedEmailHtml
        ? buildBrandedEmailHtml({
            title: "Your Vortex PCs Business Account",
            preheader,
            contentHtml,
          })
        : // Fallback minimal brand styling
          `<!DOCTYPE html><html><body style="background:#0b0b0c;padding:24px;color:#e5e7eb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif">
            <div style="max-width:640px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:24px;text-align:center;color:#fff;font-weight:700">Your Vortex PCs Business Account</div>
              <div style="padding:24px">${contentHtml}</div>
              <div style="padding:16px;background:#0b0b0c;color:#9ca3af;text-align:center;font-size:12px">© ${new Date().getFullYear()} Vortex PCs Ltd</div>
            </div>
          </body></html>`;

      // Determine base URL for calling the internal email API
      const host = String(req.headers.host || "");
      const forwardedProto =
        (req.headers["x-forwarded-proto"] as string) || "https";
      const baseUrlEnv =
        process.env.VITE_SITE_URL ||
        process.env.PUBLIC_BASE_URL ||
        process.env.VERCEL_URL;
      const baseUrl = baseUrlEnv
        ? baseUrlEnv.startsWith("http")
          ? baseUrlEnv
          : `https://${baseUrlEnv}`
        : `${forwardedProto}://${host}`;

      const resp = await fetch(`${baseUrl}/api/admin/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization || "",
        },
        body: JSON.stringify({
          subject,
          html,
          preheader,
          recipients: [email],
          mode: "emails",
        }),
      });

      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(`Email API responded ${resp.status}: ${detail}`);
      }
      emailSent = true;
    } catch (e: any) {
      console.error("Auto-email dispatch failed:", e?.message || e);
      emailError = e?.message || String(e);
    }

    // Best-effort audit log
    try {
      await db.collection("admin_audit_logs").add({
        type: "create_business_user",
        targetEmail: email,
        createdUid: userRecord.uid,
        companyName,
        contactName,
        performedBy: decoded.uid,
        performedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch {}

    return res.status(200).json({
      success: true,
      uid: userRecord.uid,
      resetLink,
      emailSent,
      emailError: emailSent ? undefined : emailError,
    });
  } catch (e: any) {
    console.error("create-business error", e);
    const msg = e?.message || "Internal Server Error";
    return res.status(500).json({ message: msg });
  }
}
