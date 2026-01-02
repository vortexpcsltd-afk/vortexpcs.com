import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { parseQuery, querySchemas } from "../utils/queryValidation";
import { sendEmailWithRetry } from "../../services/emailSender.js";
import { withSecureMethod } from "../middleware/apiSecurity.js";

export default withSecureMethod(
  "GET",
  async (req: VercelRequest, res: VercelResponse) => {
    try {
      const businessEmail =
        process.env.VITE_BUSINESS_EMAIL ||
        process.env.BUSINESS_EMAIL ||
        "info@vortexpcs.com";

      const smtpHost =
        process.env.VITE_SMTP_HOST || process.env.SMTP_HOST || "";
      const smtpUser =
        process.env.VITE_SMTP_USER || process.env.SMTP_USER || "";
      const smtpPass =
        process.env.VITE_SMTP_PASS || process.env.SMTP_PASS || "";
      const smtpPortStr =
        process.env.VITE_SMTP_PORT || process.env.SMTP_PORT || "465";
      const smtpSecureStr =
        process.env.VITE_SMTP_SECURE || process.env.SMTP_SECURE;
      const smtpPort = parseInt(String(smtpPortStr), 10);
      const secure =
        typeof smtpSecureStr === "string"
          ? smtpSecureStr === "true"
          : smtpPort === 465;

      const config = {
        hasHost: Boolean(smtpHost),
        hasUser: Boolean(smtpUser),
        hasPass: Boolean(smtpPass),
        port: smtpPort,
        secure,
        businessEmail,
      };

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.error(
          "SMTP configuration missing in diagnostics endpoint",
          config
        );
        return res.status(503).json({
          ok: false,
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable",
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure,
        auth: { user: smtpUser, pass: smtpPass },
      });

      let verifyOk = false;
      try {
        await transporter.verify();
        verifyOk = true;
      } catch (e: any) {
        console.error("SMTP verification failed in diagnostics endpoint", {
          error: String(e?.message || e),
          config,
        });
        return res.status(503).json({
          ok: false,
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable",
        });
      }

      // Optional send test: /api/email/diagnostics?send=true&to=<address>
      const query = parseQuery(req, res, querySchemas.emailTest);
      if (!query) return; // Validation error already sent

      const { send, to: toParam } = query;
      if (send) {
        const to = String(toParam || businessEmail);
        // Restrict to business domain to avoid abuse
        const allow = new Set([
          businessEmail.toLowerCase(),
          "admin@vortexpcs.com",
          "info@vortexpcs.com",
        ]);
        if (!allow.has(to.toLowerCase())) {
          console.warn("Diagnostics test email recipient not allowed", { to });
          return res.status(400).json({
            ok: false,
            code: "VALIDATION_ERROR",
            message: "Invalid request",
          });
        }
        try {
          const r = await sendEmailWithRetry(transporter, {
            from: `"Vortex PCs Test" <${smtpUser}>`,
            to,
            subject: "SMTP Diagnostics Test",
            text: `This is a test email from Vercel serverless at ${new Date().toISOString()}.`,
          });
          if (!r.success) throw r.error || new Error("Email failed");
          return res
            .status(200)
            .json({ ok: true, stage: "send", config, verifyOk, sentTo: to });
        } catch (e: any) {
          console.error("Diagnostics test email send failed", {
            error: String(e?.message || e),
            to,
          });
          return res.status(502).json({
            ok: false,
            code: "EMAIL_DELIVERY_FAILED",
            message: "Email delivery failed",
          });
        }
      }

      return res
        .status(200)
        .json({ ok: true, stage: "verify", config, verifyOk });
    } catch (error: any) {
      console.error("Diagnostics endpoint error", {
        error: String(error?.message || error),
      });
      return res.status(500).json({
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      });
    }
  }
);
