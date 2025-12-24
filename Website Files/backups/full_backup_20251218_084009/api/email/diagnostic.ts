import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { parseQuery, querySchemas } from "../utils/queryValidation";
import { sendEmailWithRetry } from "../../services/emailSender.js";

/*
 * SMTP Diagnostic Endpoint
 * GET /api/email/diagnostic
 * Optional query params:
 *   sendTest=true    -> attempt a lightweight test email
 *   to=recipient@...  -> override destination (otherwise BUSINESS_EMAIL)
 * Safety: restrict test email to same domain as BUSINESS_EMAIL if provided.
 */

interface Suggestion {
  code: string;
  message: string;
}

function buildSuggestions(
  err: unknown,
  cfg: { port: number; secure: boolean }
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const msg = err instanceof Error ? err.message : String(err);

  if (/535|authentication failed|Invalid login/i.test(msg)) {
    suggestions.push({
      code: "AUTH_FAILURE",
      message:
        "Verify SMTP_USER and SMTP_PASS. If provider uses 2FA, generate an app password instead of normal login password.",
    });
    suggestions.push({
      code: "USER_FORMAT",
      message:
        "Ensure SMTP_USER matches full mailbox (e.g. accounts@domain.com) not just the local part.",
    });
  }
  if (/handshake|self signed|certificate/i.test(msg)) {
    suggestions.push({
      code: "TLS_CERT",
      message:
        "Certificate issue: for port 587 + STARTTLS set secure=false; for port 465 set secure=true. Consider switching ports or adjusting secure flag.",
    });
  }
  if (/timeout|ETIMEDOUT|ENOTFOUND|ECONNREFUSED/i.test(msg)) {
    suggestions.push({
      code: "NETWORK",
      message:
        "Connection failure: confirm host & port reachable. Some providers require port 587 (STARTTLS).",
    });
  }
  if (!/535/.test(msg) && cfg.port === 465 && !cfg.secure) {
    suggestions.push({
      code: "PORT_SECURE_MISMATCH",
      message: "Port 465 usually requires secure=true.",
    });
  }
  if (!/535/.test(msg) && cfg.port === 587 && cfg.secure) {
    suggestions.push({
      code: "PORT_SECURE_MISMATCH",
      message:
        "Port 587 should typically use secure=false with STARTTLS upgrade.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      code: "GENERAL",
      message:
        "Review SMTP credentials, port, and secure flags; enable debug logging if still failing.",
    });
  }
  return suggestions;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  const query = parseQuery(req, res, querySchemas.emailDiagnostic);
  if (!query) return; // Validation error already sent

  const { sendTest, to: toOverride } = query;
  const smtpHost = process.env.SMTP_HOST || process.env.VITE_SMTP_HOST || "";
  const smtpUser = process.env.SMTP_USER || process.env.VITE_SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || process.env.VITE_SMTP_PASS || "";
  const portRaw = process.env.SMTP_PORT || process.env.VITE_SMTP_PORT || "465";
  const secureRaw = process.env.SMTP_SECURE || process.env.VITE_SMTP_SECURE;
  const port = parseInt(portRaw, 10);
  const secure =
    typeof secureRaw === "string" ? secureRaw === "true" : port === 465;
  const businessEmail =
    process.env.BUSINESS_EMAIL ||
    process.env.VITE_BUSINESS_EMAIL ||
    "info@vortexpcs.com";

  const domain = businessEmail.split("@").pop() || "";
  let testRecipient = businessEmail;
  if (toOverride) {
    // safety: only allow override if same domain
    if (toOverride.endsWith(`@${domain}`)) {
      testRecipient = toOverride;
    }
  }

  const configSummary = {
    host: smtpHost ? "SET" : "MISSING",
    user: smtpUser ? "SET" : "MISSING",
    pass: smtpPass ? "SET" : "MISSING",
    port,
    secure,
    businessEmail,
    testRecipient,
    sendTest,
  };

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error(
      "SMTP configuration missing in diagnostic endpoint",
      configSummary
    );
    return res.status(503).json({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Service temporarily unavailable",
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: { user: smtpUser, pass: smtpPass },
    logger: true,
    debug: true,
  });

  let verifyResult: { ok: boolean; error?: string } = { ok: false };
  try {
    await transporter.verify();
    verifyResult.ok = true;
  } catch (e) {
    verifyResult.ok = false;
    verifyResult.error = e instanceof Error ? e.message : String(e);
  }

  let sendResult: {
    attempted: boolean;
    ok: boolean;
    error?: string;
    messageId?: string;
  } = {
    attempted: false,
    ok: false,
  };

  if (sendTest) {
    sendResult.attempted = true;
    try {
      const r = await sendEmailWithRetry(transporter, {
        from: smtpUser,
        to: testRecipient,
        subject: "SMTP Diagnostic Probe",
        text: "Diagnostic test email from /api/email/diagnostic",
      });
      sendResult.ok = r.success;
      sendResult.messageId = r.info?.messageId;
    } catch (e) {
      sendResult.ok = false;
      sendResult.error = e instanceof Error ? e.message : String(e);
    }
  }

  if (!verifyResult.ok) {
    console.error("SMTP verification failed in diagnostic endpoint", {
      error: verifyResult.error,
      host: smtpHost,
      port,
      secure,
    });
    return res.status(503).json({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Service temporarily unavailable",
    });
  }

  if (sendTest && !sendResult.ok) {
    console.error("Diagnostic test email send failed", {
      error: sendResult.error,
      to: testRecipient,
    });
    return res.status(502).json({
      ok: false,
      code: "EMAIL_DELIVERY_FAILED",
      message: "Email delivery failed",
    });
  }

  const response: Record<string, unknown> = {
    ok: true,
    environment: process.env.VERCEL_ENV || "development",
    timestamp: new Date().toISOString(),
    config: configSummary,
    verify: verifyResult,
    send: sendResult,
  };
  return res.status(200).json(response);
}
