import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

// Initialize Firebase Admin once
let admin: any = null;
let initError: string | null = null;

async function getAdmin() {
  if (admin) return admin;

  try {
    const imported = await import("firebase-admin");
    // Support both ESM namespace and CommonJS default export shapes
    admin = (imported as any).default ? (imported as any).default : imported;

    if (!admin || typeof admin !== "object") {
      throw new Error("firebase-admin import returned unexpected shape");
    }

    const apps = (admin as any).apps;
    if (Array.isArray(apps) && apps.length > 0) {
      console.log("Firebase Admin already initialized (apps length)");
      return admin;
    }

    if (!apps) {
      console.warn(
        "firebase-admin 'apps' collection missing; proceeding to initialize anyway"
      );
    }

    // Support base64-encoded service account for Vercel
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable not set"
      );
    }

    console.log("Initializing Firebase Admin with base64 credentials...");
    const serviceAccountJson = Buffer.from(
      serviceAccountBase64,
      "base64"
    ).toString("utf-8");
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log("Service account project_id:", serviceAccount.project_id);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized successfully!");
    return admin;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    initError = errMsg;
    console.error("❌ Firebase Admin initialization failed:", error);
    throw error;
  }
}

type Body = {
  subject?: string;
  html?: string;
  preheader?: string;
  recipients?: string[];
  mode?: "all" | "emails";
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const adm = await getAdmin();
  if (!adm) {
    return res.status(501).json({
      message:
        "Firebase Admin SDK not initialized. Check Vercel logs for details.",
    });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!token)
      return res.status(401).json({ message: "Missing Bearer token" });

    let decoded: any;
    try {
      decoded = await adm.auth().verifyIdToken(token);
    } catch (e: any) {
      console.error("verifyIdToken failed", e?.message || e);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    const db = adm.firestore();
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

    const { subject, html, preheader, recipients, mode }: Body = req.body || {};
    if (!subject || !html) {
      return res.status(400).json({ message: "subject and html are required" });
    }

    // Load SMTP config (reusing same env names used in contact function)
    const smtpHost = process.env.VITE_SMTP_HOST;
    const smtpPort = parseInt(process.env.VITE_SMTP_PORT || "587", 10);
    const smtpSecure = process.env.VITE_SMTP_SECURE === "true";
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;
    const fromAddress =
      process.env.VITE_BUSINESS_EMAIL || smtpUser || "no-reply@vortexpcs.com";

    const missing: string[] = [];
    if (!smtpHost) missing.push("VITE_SMTP_HOST");
    if (!smtpUser) missing.push("VITE_SMTP_USER");
    if (!smtpPass) missing.push("VITE_SMTP_PASS");
    if (missing.length) {
      return res.status(500).json({
        message: `Email service not configured: ${missing.join(", ")}`,
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter
      .verify()
      .then(() => {
        console.log(
          "SMTP transporter verified ok (host:",
          smtpHost,
          "port:",
          smtpPort,
          ")"
        );
      })
      .catch((e) => {
        console.warn(
          "SMTP transporter verify failed (continuing):",
          e?.message || e
        );
      });

    // Determine recipients
    let toList: string[] = [];
    if (mode === "all" || (!mode && (!recipients || recipients.length === 0))) {
      const snap = await db.collection("users").limit(1000).get();
      toList = snap.docs
        .map((d: any) => d.data())
        .filter((u: any) => !u?.marketingOptOut)
        .map((u: any) => u?.email)
        .filter((e: any) => typeof e === "string" && e.includes("@"));
    } else {
      toList = Array.from(
        new Set((recipients || []).filter((e) => /@/.test(e)))
      );
    }

    console.log(
      "Bulk email mode:",
      mode || "auto",
      "recipients count:",
      toList.length
    );
    if (toList.length === 0) {
      return res.status(400).json({ message: "No recipients found" });
    }

    // Send in batches to respect provider limits
    const BATCH = 50;
    let sent = 0;
    for (let i = 0; i < toList.length; i += BATCH) {
      const chunk = toList.slice(i, i + BATCH);
      // Use BCC to avoid revealing addresses; some providers require at least one 'to'
      try {
        await transporter.sendMail({
          from: `Vortex PCs <${fromAddress}>`,
          to: fromAddress,
          bcc: chunk,
          subject,
          html,
          text: htmlToText(html),
          headers: preheader ? { "X-Preheader": preheader } : undefined,
        });
      } catch (e: any) {
        console.error("sendMail failed for chunk", i / BATCH, e?.message || e);
        return res.status(502).json({
          message: "SMTP send failed",
          detail: e?.message || String(e),
        });
      }
      sent += chunk.length;
    }

    return res.status(200).json({
      success: true,
      sent,
      batchSize: BATCH,
      batches: Math.ceil(toList.length / BATCH),
      recipients: toList.length,
    });
  } catch (error: any) {
    console.error("bulk email send error", error);
    return res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<\/(?:p|div|h\d|li)>/gi, "\n")
    .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
