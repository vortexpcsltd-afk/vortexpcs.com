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
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You for Contacting Vortex PCs</h1>
              </div>
              <div class="content">
                <p>Dear ${name},</p>
                <p>Thank you for reaching out to Vortex PCs. We have received your message and will get back to you within 24 hours.</p>
                <p>If your enquiry is urgent, please call us on +44 20 1234 5678.</p>
                <p>Best regards,<br>The Vortex PCs Team</p>
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
