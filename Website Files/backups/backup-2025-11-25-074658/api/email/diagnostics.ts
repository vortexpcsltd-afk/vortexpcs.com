import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const businessEmail =
      process.env.VITE_BUSINESS_EMAIL ||
      process.env.BUSINESS_EMAIL ||
      "info@vortexpcs.com";

    const smtpHost = process.env.VITE_SMTP_HOST || process.env.SMTP_HOST || "";
    const smtpUser = process.env.VITE_SMTP_USER || process.env.SMTP_USER || "";
    const smtpPass = process.env.VITE_SMTP_PASS || process.env.SMTP_PASS || "";
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
      return res
        .status(200)
        .json({
          ok: false,
          stage: "config",
          config,
          message: "Missing SMTP configuration",
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
      // Some providers fail verify but still work; return diagnostics
      return res
        .status(200)
        .json({
          ok: false,
          stage: "verify",
          config,
          error: String(e?.message || e),
        });
    }

    // Optional send test: /api/email/diagnostics?send=true&to=<address>
    const send = String(req.query.send || "false").toLowerCase() === "true";
    if (send) {
      const to = String(req.query.to || businessEmail);
      // Restrict to business domain to avoid abuse
      const allow = new Set([
        businessEmail.toLowerCase(),
        "admin@vortexpcs.com",
        "info@vortexpcs.com",
      ]);
      if (!allow.has(to.toLowerCase())) {
        return res
          .status(400)
          .json({ ok: false, stage: "send", message: "Recipient not allowed" });
      }
      try {
        await transporter.sendMail({
          from: `\"Vortex PCs Test\" <${smtpUser}>`,
          to,
          subject: "SMTP Diagnostics Test",
          text: `This is a test email from Vercel serverless at ${new Date().toISOString()}.`,
        });
        return res
          .status(200)
          .json({ ok: true, stage: "send", config, verifyOk, sentTo: to });
      } catch (e: any) {
        return res
          .status(200)
          .json({
            ok: false,
            stage: "send",
            config,
            verifyOk,
            error: String(e?.message || e),
          });
      }
    }

    return res
      .status(200)
      .json({ ok: true, stage: "verify", config, verifyOk });
  } catch (error: any) {
    return res
      .status(500)
      .json({ ok: false, error: String(error?.message || error) });
  }
}
