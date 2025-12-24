import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ApiError, DecodedToken } from "../../../types/api";
import nodemailer from "nodemailer";
import { getSmtpConfig } from "../../services/smtp.js";
import {
  ensureBranded,
  buildPlainTextFromHtml,
} from "../../../services/emailTemplate.js";
import { sendEmailWithRetry } from "../../../services/emailSender.js";
import {
  getFirebaseAdmin,
  getAuth,
  getFirestore,
} from "../../services/firebase";

const admin = getFirebaseAdmin();

type Body = {
  subject?: string;
  html?: string;
  preheader?: string;
  recipients?: string[];
  mode?: "all" | "emails";
};

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  try {
    const auth = getAuth();
    const db = getFirestore();

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!token)
      return res
        .status(401)
        .json({ ok: false, code: "UNAUTHORIZED", message: "Unauthorized" });

    let decoded: DecodedToken;
    try {
      decoded = await auth.verifyIdToken(token);
    } catch (e: unknown) {
      const error = e as ApiError;
      console.error("verifyIdToken failed", error?.message || e);
      return res
        .status(401)
        .json({ ok: false, code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerProfile = callerDoc.exists ? callerDoc.data() : null;
    const callerEmail = decoded.email || callerProfile?.email;
    const isAdmin =
      (callerProfile?.role &&
        String(callerProfile.role).toLowerCase() === "admin") ||
      callerEmail === "admin@vortexpcs.com" ||
      callerEmail === "info@vortexpcs.com";
    if (!isAdmin)
      return res
        .status(403)
        .json({ ok: false, code: "FORBIDDEN", message: "Forbidden" });

    const { subject, html, preheader, recipients, mode }: Body = req.body || {};
    if (!subject || !html) {
      return res.status(400).json({
        ok: false,
        code: "MISSING_FIELDS",
        message: "Validation failed",
      });
    }

    // Load SMTP config via centralized helper
    const {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      pass: smtpPass,
      from: fromAddress,
      warning,
    } = getSmtpConfig(req);

    const missing: string[] = [];
    if (!smtpHost) missing.push("VITE_SMTP_HOST");
    if (!smtpUser) missing.push("VITE_SMTP_USER");
    if (!smtpPass) missing.push("VITE_SMTP_PASS");
    if (missing.length) {
      console.error("Email service not configured; missing:", missing);
      return res.status(503).json({
        ok: false,
        code: "SERVICE_UNAVAILABLE",
        message: "Service temporarily unavailable",
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

    if (warning) {
      console.warn("SMTP host normalized:", warning);
    }

    // Determine recipients
    let toList: string[] = [];
    if (mode === "all" || (!mode && (!recipients || recipients.length === 0))) {
      const snap = await db.collection("users").limit(1000).get();
      toList = snap.docs
        .map((d: { data: () => Record<string, unknown> }) => d.data())
        .filter((u: Record<string, unknown>) => !u?.marketingOptOut)
        .map((u: Record<string, unknown>) => u?.email)
        .filter(
          (e: unknown) => typeof e === "string" && e.includes("@")
        ) as string[];
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
      return res.status(400).json({
        ok: false,
        code: "MISSING_FIELDS",
        message: "Validation failed",
      });
    }

    const brandedHtml = ensureBranded(html, subject, { preheader });

    // Send in batches to respect provider limits
    const BATCH = 50;
    let sent = 0;
    for (let i = 0; i < toList.length; i += BATCH) {
      const chunk = toList.slice(i, i + BATCH);
      // Use BCC to avoid revealing addresses; some providers require at least one 'to'
      try {
        const r = await sendEmailWithRetry(transporter, {
          from: `Vortex PCs <${fromAddress}>`,
          to: fromAddress,
          bcc: chunk,
          subject,
          html: brandedHtml,
          text: buildPlainTextFromHtml(brandedHtml),
          headers: preheader ? { "X-Preheader": preheader } : undefined,
        });
        if (!r.success) throw r.error || new Error("Batch email failed");
      } catch (e: unknown) {
        const err = e as ApiError;
        console.error(
          "sendMail failed for chunk",
          i / BATCH,
          err?.message || e
        );
        return res.status(502).json({
          ok: false,
          code: "EMAIL_DELIVERY_FAILED",
          message: "Email delivery failed",
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
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error("bulk email send error", err);
    return res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
}

export default handler;

// Helpers centralized in services/emailTemplate.ts
