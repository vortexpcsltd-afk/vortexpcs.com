import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { getSmtpConfig } from "../../services/smtp.js";
import type { EmailTemplateOptions, ApiError } from "../../../types/api";

type FirebaseAdmin = typeof import("firebase-admin");
// Firebase Admin singleton
let admin: FirebaseAdmin | null = null;
let initialized = false;

async function initAdmin() {
  if (admin && initialized) return admin;
  const imported = await import("firebase-admin");
  const candidate = (imported as unknown as { default?: FirebaseAdmin }).default
    ? (imported as unknown as { default: FirebaseAdmin }).default
    : (imported as unknown as FirebaseAdmin);
  admin = candidate;

  if (!initialized) {
    try {
      const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (saB64) {
        const json = Buffer.from(saB64, "base64").toString("utf-8");
        const creds = JSON.parse(json);
        if (!admin.apps?.length) {
          admin.initializeApp({
            credential: admin.credential.cert(creds),
            projectId: creds.project_id,
          });
        }
      } else {
        if (!admin.apps?.length) {
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
  if (!initialized || !admin) {
    return res.status(501).json({
      message:
        "Firebase Admin SDK not initialized. Configure FIREBASE_SERVICE_ACCOUNT_BASE64 or ADC + FIREBASE_PROJECT_ID.",
    });
  }
  const adminInstance = admin;

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!token)
      return res.status(401).json({ message: "Missing Bearer token" });

    const decoded = await adminInstance.auth().verifyIdToken(token);
    const db = adminInstance.firestore();
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
      email: rawEmail,
      userId,
      sendEmail,
    } = (req.body || {}) as {
      email?: string;
      userId?: string;
      sendEmail?: boolean;
    };

    let email = rawEmail || "";
    if (!email && userId) {
      // Look up email from users collection first, then Auth
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists && userDoc.data()?.email) {
        email = userDoc.data().email;
      } else {
        const authUser = await adminInstance.auth().getUser(userId);
        email = authUser.email || "";
      }
    }
    if (!email)
      return res.status(400).json({ message: "email or userId required" });

    const rawLink = await adminInstance.auth().generatePasswordResetLink(email);
    let appLink: string | null = null;
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
      if (oob)
        appLink = `${origin}/set-password?oobCode=${encodeURIComponent(
          oob
        )}&email=${encodeURIComponent(email)}`;
    } catch {
      appLink = null;
    }

    let emailSent = false;
    let emailError: string | null = null;
    if (sendEmail) {
      try {
        let buildBrandedEmailHtml:
          | undefined
          | ((opts: EmailTemplateOptions) => string);
        try {
          const mod = (await import("../../../services/emailTemplate.js").catch(
            async () => await import("../../../services/emailTemplate")
          )) as unknown;
          if (
            mod &&
            typeof mod === "object" &&
            "buildBrandedEmailHtml" in mod &&
            typeof (mod as { buildBrandedEmailHtml?: unknown })
              .buildBrandedEmailHtml === "function"
          ) {
            buildBrandedEmailHtml = (
              mod as {
                buildBrandedEmailHtml: (opts: EmailTemplateOptions) => string;
              }
            ).buildBrandedEmailHtml;
          } else {
            buildBrandedEmailHtml = undefined;
          }
        } catch {
          buildBrandedEmailHtml = undefined;
        }

        const linkToUse = appLink || rawLink;
        const contentHtml = `
          <p style="margin:0 0 12px 0;color:#cbd5e1;">We received a request to reset the password for your Vortex PCs account.</p>
          <a href="${linkToUse}" style="display:inline-block;padding:12px 22px;border-radius:10px;background:linear-gradient(90deg,#0ea5e9,#2563eb);color:#ffffff;font-weight:700">Set your new password</a>
          <p style="margin:16px 0 0 0;color:#94a3b8;font-size:13px;">If the button doesn't work, copy and paste this link:<br/><span style="word-break:break-all;color:#a5b4fc;">${escapeHtml(
            linkToUse
          )}</span></p>
        `;
        const html = buildBrandedEmailHtml
          ? buildBrandedEmailHtml({
              title: "Reset your Vortex PCs password",
              preheader: "Password reset request",
              contentHtml,
              logoUrl: "https://vortexpcs.com/vortexpcs-logo.png",
            })
          : `<!DOCTYPE html><html><body style="background:#0b0b0c;padding:24px;color:#e5e7eb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif"><div style="max-width:640px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:24px;text-align:center;color:#fff;font-weight:700"><img src="https://vortexpcs.com/vortexpcs-logo.png" alt="Vortex PCs" style="max-width:140px;height:auto;display:block;margin:0 auto 12px;" />Reset your Vortex PCs password</div><div style="padding:24px">${contentHtml}</div><div style="padding:16px;background:#0b0b0c;color:#9ca3af;text-align:center;font-size:12px">© ${new Date().getFullYear()} Vortex PCs Ltd</div></div></body></html>`;

        const {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from: fromAddress,
          warning,
        } = getSmtpConfig(req);
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
        if (warning) {
          console.warn("SMTP host normalized:", warning);
        }
        await transporter.sendMail({
          from: `Vortex PCs <${fromAddress}>`,
          to: email,
          subject: "Reset your Vortex PCs password",
          html,
          text: html
            .replace(/<\/(?:p|div|h\d|li)>/gi, "\n")
            .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim(),
        });
        emailSent = true;
      } catch (e: unknown) {
        const error = e as ApiError;
        emailError = error?.message || String(e);
      }
    }

    // Audit
    try {
      await adminInstance.firestore().collection("admin_audit_logs").add({
        type: "send_password_reset",
        targetEmail: email,
        performedBy: decoded.uid,
        performedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditError) {
      console.warn("send-password-reset audit log failed:", auditError);
    }

    return res.status(200).json({
      success: true,
      resetLink: appLink || rawLink,
      emailSent,
      emailError,
    });
  } catch (e: unknown) {
    const error = e as ApiError;
    console.error("send-password-reset error", error);
    return res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
}
