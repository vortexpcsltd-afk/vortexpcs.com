/**
 * Vercel Serverless Function - Send Contact Form Email
 * This runs on the server, so it can safely use nodemailer and SMTP credentials
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always set CORS headers
  Object.entries(corsHeaders).forEach(([k, v]) =>
    res.setHeader(k, v as string)
  );

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, phone, subject, enquiryType, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !enquiryType || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Load and validate SMTP configuration from environment
    const smtpHost = process.env.VITE_SMTP_HOST;
    const smtpPort = parseInt(process.env.VITE_SMTP_PORT || "587", 10);
    const smtpSecure = process.env.VITE_SMTP_SECURE === "true";
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;
    const businessEmail =
      process.env.VITE_BUSINESS_EMAIL || "info@vortexpcs.com";

    const missing: string[] = [];
    if (!smtpHost) missing.push("VITE_SMTP_HOST");
    if (!smtpUser) missing.push("VITE_SMTP_USER");
    if (!smtpPass) missing.push("VITE_SMTP_PASS");

    if (missing.length) {
      // Don't leak secrets; guide configuration via which keys are missing
      console.error("Email configuration missing:", missing.join(", "));
      return res.status(500).json({
        error: "Email service not configured",
        details: `Missing env vars: ${missing.join(", ")}`,
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    // Optional: verify connection configuration early for clearer errors
    try {
      await transporter.verify();
    } catch (verifyError: any) {
      const { message, code } = verifyError || {};
      console.error("SMTP verify failed:", { message, code });
      let hint = "";
      if (code === "EAUTH")
        hint = "Authentication failed. Check SMTP user/pass.";
      if (code === "ENOTFOUND")
        hint = "SMTP host not found. Check VITE_SMTP_HOST.";
      if (code === "ECONNECTION" || code === "ETIMEDOUT")
        hint = "Connection failed. Check port/secure and provider allows SMTP.";
      return res.status(500).json({
        error: "SMTP connection test failed",
        details: message || "Unknown verify error",
        hint,
      });
    }

    // Email to business
    await transporter.sendMail({
      from: `"Vortex PCs Website" <${smtpUser}>`,
      to: businessEmail,
      replyTo: email,
      subject: `New Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #2563eb; }
              .value { background: white; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name:</div>
                  <div class="value">${name}</div>
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value">${email}</div>
                </div>
                <div class="field">
                  <div class="label">Phone:</div>
                  <div class="value">${phone || "Not provided"}</div>
                </div>
                <div class="field">
                  <div class="label">Enquiry Type:</div>
                  <div class="value">${enquiryType}</div>
                </div>
                <div class="field">
                  <div class="label">Subject:</div>
                  <div class="value">${subject}</div>
                </div>
                <div class="field">
                  <div class="label">Message:</div>
                  <div class="value">${message.replace(/\n/g, "<br>")}</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Auto-reply to customer
    await transporter.sendMail({
      from: `"Vortex PCs" <${smtpUser}>`,
      to: email,
      subject: "Thank you for contacting Vortex PCs",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                line-height: 1.6; 
                color: #ffffff;
                background: #000000;
              }
              .email-wrapper {
                width: 100%;
                background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
                padding: 40px 20px;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(14, 165, 233, 0.2);
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(14, 165, 233, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); 
                padding: 40px 30px;
                text-align: center;
                position: relative;
              }
              .logo-container {
                background: #1e3a8a;
                padding: 20px;
                border-radius: 12px;
                display: inline-block;
                margin-bottom: 20px;
              }
              .logo {
                font-size: 32px;
                font-weight: 900;
                letter-spacing: -0.5px;
                background: linear-gradient(135deg, #0ea5e9, #06b6d4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }
              .header h1 { 
                color: #ffffff; 
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              }
              .content { 
                background: rgba(30, 41, 59, 0.4);
                padding: 40px 30px;
                color: #e2e8f0;
              }
              .content p {
                margin-bottom: 20px;
                font-size: 16px;
                line-height: 1.8;
              }
              .highlight-box { 
                background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(37, 99, 235, 0.1));
                border-left: 4px solid #0ea5e9;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
              }
              .highlight-box strong {
                color: #0ea5e9;
                font-size: 18px;
                display: block;
                margin-bottom: 15px;
              }
              .highlight-box p {
                margin: 8px 0;
                color: #cbd5e1;
              }
              .contact-info {
                background: rgba(14, 165, 233, 0.05);
                border: 1px solid rgba(14, 165, 233, 0.2);
                padding: 25px;
                border-radius: 8px;
                margin: 30px 0;
              }
              .contact-info p {
                margin: 10px 0;
                font-size: 15px;
              }
              .contact-info a {
                color: #0ea5e9;
                text-decoration: none;
                font-weight: 600;
                transition: color 0.2s;
              }
              .contact-info a:hover {
                color: #06b6d4;
              }
              .signature {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(148, 163, 184, 0.2);
              }
              .signature p {
                margin: 5px 0;
                color: #94a3b8;
              }
              .footer {
                background: rgba(15, 23, 42, 0.8);
                padding: 30px;
                text-align: center;
                border-top: 1px solid rgba(148, 163, 184, 0.1);
              }
              .footer p {
                color: #64748b;
                font-size: 13px;
                margin: 5px 0;
              }
              .footer a {
                color: #0ea5e9;
                text-decoration: none;
              }
              @media only screen and (max-width: 600px) {
                .email-wrapper { padding: 20px 10px; }
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
                .header h1 { font-size: 24px; }
                .logo { font-size: 28px; }
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo-container">
                    <div class="logo">VORTEX PCS</div>
                  </div>
                  <h1>Thank You for Contacting Us</h1>
                </div>
                <div class="content">
                  <p>Dear ${name},</p>

                  <p>Thank you for reaching out to Vortex PCs. We have received your message and appreciate you taking the time to contact us.</p>

                  <div class="highlight-box">
                    <strong>Your Enquiry Details</strong>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Enquiry Type:</strong> ${enquiryType}</p>
                  </div>

                  <p>Our expert team will carefully review your message and get back to you within 24 hours during business hours (Monday-Friday, 9AM-6PM GMT).</p>

                  <div class="contact-info">
                    <p><strong>Need immediate assistance?</strong></p>
                    <p>📞 Call us: <a href="tel:+441603975440">01603 975440</a></p>
                    <p>✉️ Email: <a href="mailto:info@vortexpcs.com">info@vortexpcs.com</a></p>
                    <p>🌐 Website: <a href="https://vortexpcs.com">vortexpcs.com</a></p>
                  </div>

                  <div class="signature">
                    <p><strong>Best regards,</strong></p>
                    <p><strong>The Vortex PCs Team</strong></p>
                    <p style="color: #0ea5e9;">Building Your Perfect PC</p>
                  </div>
                </div>
                <div class="footer">
                  <p><strong>Vortex PCs Ltd</strong></p>
                  <p>info@vortexpcs.com | 01603 975440</p>
                  <p><a href="https://vortexpcs.com">www.vortexpcs.com</a></p>
                  <p style="margin-top: 15px; font-size: 11px;">
                    This is an automated response. Please do not reply directly to this email.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error: any) {
    // Enhance error logging for faster diagnosis in Vercel function logs
    const { message, code, command, response } = error || {};
    console.error("Email send error:", { message, code, command, response });
    return res.status(500).json({
      error: "Failed to send email",
      details: message || "Unknown error",
    });
  }
}
