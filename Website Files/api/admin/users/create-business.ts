import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

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

    const {
      email,
      displayName,
      companyName,
      contactName,
      phone,
      tempPassword,
    } = (req.body || {}) as {
      email?: string;
      displayName?: string;
      companyName?: string;
      contactName?: string;
      phone?: string;
      tempPassword?: string;
    };

    if (!email || !displayName || !companyName || !contactName) {
      return res.status(400).json({
        message: "email, displayName, companyName and contactName are required",
      });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      displayName,
      emailVerified: false,
      disabled: false,
      ...(tempPassword ? { password: tempPassword } : {}),
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

    // Generate unique business account number if not already present
    try {
      const userRef = db.collection("users").doc(userRecord.uid);
      await db.runTransaction(async (tx: any) => {
        const userSnap = await tx.get(userRef);
        const current = userSnap.exists ? userSnap.data() : null;
        if (current?.accountNumber) {
          return; // idempotent
        }
        const countersRef = db.collection("counters").doc("accountNumbers");
        const countersSnap = await tx.get(countersRef);
        const data = countersSnap.exists ? countersSnap.data() : {};
        const currentSeq =
          typeof data?.business === "number" ? data.business : 0;
        const nextSeq = currentSeq + 1;
        tx.set(countersRef, { business: nextSeq }, { merge: true });
        const padded = String(nextSeq).padStart(6, "0");
        const accountNumber = `VTXBUS-${padded}`;
        tx.set(userRef, { accountNumber }, { merge: true });
      });
    } catch (e) {
      console.error("Failed to generate business account number:", e);
    }

    // Option A: Admin set a temporary password — skip email and reset link
    let resetLink: string | null = null;
    let appLink: string | null = null;
    if (!tempPassword) {
      // Generate password reset link so the customer can set their password
      const rawLink = await admin.auth().generatePasswordResetLink(email);
      resetLink = rawLink;

      // Build a first-party app link to /set-password using the oobCode
      try {
        const url = new URL(rawLink);
        const oob = url.searchParams.get("oobCode");
        const host =
          (req.headers["x-forwarded-host"] as string) ||
          (req.headers.host as string) ||
          process.env.VERCEL_URL;
        const proto = (req.headers["x-forwarded-proto"] as string) || "https";
        const origin = host
          ? `${host.startsWith("http") ? "" : `${proto}://`}${host}`
          : process.env.PUBLIC_APP_URL || "https://vortexpcs.com";
        if (oob) {
          appLink = `${origin}/set-password?oobCode=${encodeURIComponent(
            oob
          )}&email=${encodeURIComponent(email)}`;
        }
      } catch (e) {
        appLink = null;
      }
    }

    // Attempt to send a branded welcome email with the reset link directly via SMTP
    let emailSent = false;
    let emailError: string | null = null;
    try {
      if (tempPassword) {
        // When admin sets a temporary password, we do NOT include it in email for security.
        // Optionally still send a welcome email without reset link.
      }
      // Try dynamic import of branded email template builder; fallback if unavailable
      let buildBrandedEmailHtml: undefined | ((opts: any) => string);
      try {
        const mod: any = await import(
          "../../../services/emailTemplate.ts"
        ).catch(async () => await import("../../../services/emailTemplate"));
        buildBrandedEmailHtml = mod?.buildBrandedEmailHtml as any;
      } catch (e: any) {
        buildBrandedEmailHtml = undefined;
      }

      const subject = tempPassword
        ? `Welcome to Vortex PCs for Business — Your account is ready`
        : `Welcome to Vortex PCs for Business — Set your password`;
      const preheader = tempPassword
        ? `Hi ${contactName}, your business account has been created. Please sign in and change your password.`
        : `Hi ${contactName}, your business account is ready. Set your password to sign in.`;
      const linkToUse = appLink || resetLink;
      const cta =
        !tempPassword && linkToUse
          ? `<a href="${linkToUse}" style="display:inline-block;padding:12px 22px;border-radius:10px;background:linear-gradient(90deg,#0ea5e9,#2563eb);color:#ffffff;font-weight:700">Set your password</a>`
          : `<a href="https://vortexpcs.com/member" style="display:inline-block;padding:12px 22px;border-radius:10px;background:linear-gradient(90deg,#0ea5e9,#2563eb);color:#ffffff;font-weight:700">Go to Member Area</a>`;

      const contentHtml = `
        <h2 style="margin:0 0 8px 0;color:#e5e7eb;font-size:18px;">Hi ${escapeHtml(
          contactName
        )},</h2>
        <p style="margin:0 0 12px 0;color:#cbd5e1;">We've created your business account for <strong style="color:#fff;">${escapeHtml(
          companyName
        )}</strong> on Vortex PCs.</p>
        ${
          tempPassword
            ? `<p style="margin:0 0 12px 0;color:#cbd5e1;">Your account has been created. Please sign in on our website and change your password from your account settings.</p>`
            : `<p style="margin:0 0 12px 0;color:#cbd5e1;">Please set your password to finish setting up your access. This link will take you to a secure page to choose a password.</p>`
        }
        ${cta}
        ${
          !tempPassword && linkToUse
            ? `<p style="margin:16px 0 0 0;color:#94a3b8;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br/><span style="word-break:break-all;color:#a5b4fc;">${escapeHtml(
                linkToUse
              )}</span></p>`
            : ""
        }
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

      // Send email directly via SMTP (not via HTTP endpoint to avoid deployment protection)
      const smtpHost = process.env.VITE_SMTP_HOST;
      const smtpPort = parseInt(process.env.VITE_SMTP_PORT || "587", 10);
      const smtpSecure = process.env.VITE_SMTP_SECURE === "true";
      const smtpUser = process.env.VITE_SMTP_USER;
      const smtpPass = process.env.VITE_SMTP_PASS;
      const fromAddress =
        process.env.VITE_BUSINESS_EMAIL || smtpUser || "no-reply@vortexpcs.com";

      if (!smtpHost || !smtpUser || !smtpPass) {
        throw new Error(
          "SMTP configuration missing (VITE_SMTP_HOST/USER/PASS)"
        );
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      });

      // Always send a welcome email; when tempPassword is set, no secret is included
      await transporter.sendMail({
        from: `Vortex PCs <${fromAddress}>`,
        to: email,
        subject,
        html,
        text: html
          .replace(/<\/(?:p|div|h\d|li)>/gi, "\n")
          .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
        headers: preheader ? { "X-Preheader": preheader } : undefined,
      });

      emailSent = true;
      console.log(`Welcome email sent to ${email}`);
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
      resetLink: appLink || resetLink,
      passwordSet: !!tempPassword,
      emailSent,
      emailError: emailSent ? undefined : emailError,
    });
  } catch (e: any) {
    console.error("create-business error", e);
    const msg = e?.message || "Internal Server Error";
    return res.status(500).json({ message: msg });
  }
}
