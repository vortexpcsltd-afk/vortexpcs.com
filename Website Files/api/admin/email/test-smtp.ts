import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Load SMTP config
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

    // Verify connection
    await transporter.verify();

    // Send test email to the user specified in body, or back to the sender
    const { testEmail } = req.body || {};
    const recipient = testEmail || smtpUser;

    await transporter.sendMail({
      from: `Vortex PCs SMTP Test <${fromAddress}>`,
      to: recipient,
      subject: "SMTP Test from Vortex PCs Admin",
      html: `<p>This is a test email sent at ${new Date().toISOString()}.</p><p>If you received this, your SMTP configuration is working correctly!</p>`,
      text: `This is a test email sent at ${new Date().toISOString()}.\n\nIf you received this, your SMTP configuration is working correctly!`,
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
  } catch (error: any) {
    console.error("SMTP test failed:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "SMTP test failed",
      details: String(error),
    });
  }
}
