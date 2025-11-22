import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { getSmtpConfig } from "../../services/smtp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
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
      return res.status(500).json({
        success: false,
        message: `Missing SMTP config: ${missing.join(", ")}`,
        config: {
          host: smtpHost || "NOT SET",
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser || "NOT SET",
          from: fromAddress,
        },
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    if (warning) {
      console.warn("SMTP host normalized:", warning);
    }

    // Verify connection
    await transporter.verify();

    // Send test email to the user specified in body, or back to the sender
    const { testEmail } = req.body || {};
    const recipient = testEmail || smtpUser;

    const logoUrl = "https://vortexpcs.com/vortexpcs-logo.png";
    const sentAt = new Date().toISOString();
    const html = `<!DOCTYPE html><html><body style="background:#0b0b0c;margin:0;padding:24px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#e5e7eb;">
      <div style="max-width:520px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:24px;text-align:center">
          <img src="${logoUrl}" alt="Vortex PCs" style="max-width:140px;height:auto;display:block;margin:0 auto 12px;" />
          <div style="font-size:18px;font-weight:700;color:#fff;">SMTP Test from Vortex PCs Admin</div>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px 0;">This is a test email sent at <strong>${sentAt}</strong>.</p>
          <p style="margin:0 0 12px 0;">If you received this, your SMTP configuration is working correctly!</p>
          <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">Environment Host: ${smtpHost} • Port: ${smtpPort} • Secure: ${smtpSecure}</p>
        </div>
        <div style="padding:16px;background:#0b0b0c;color:#9ca3af;text-align:center;font-size:11px">© ${new Date().getFullYear()} Vortex PCs Ltd</div>
      </div>
    </body></html>`;

    await transporter.sendMail({
      from: `Vortex PCs SMTP Test <${fromAddress}>`,
      to: recipient,
      subject: "SMTP Test from Vortex PCs Admin",
      html,
      text: `SMTP Test from Vortex PCs Admin\n\nSent at: ${sentAt}\nHost: ${smtpHost}\nPort: ${smtpPort}\nSecure: ${smtpSecure}\n\nIf you received this, SMTP is working.`,
    });

    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${recipient}`,
      config: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        from: fromAddress,
      },
    });
  } catch (error: unknown) {
    console.error("SMTP test failed:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "SMTP test failed",
      details: String(error),
    });
  }
}
