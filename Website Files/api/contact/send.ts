/**
 * Vercel Serverless Function - Send Contact Form Email
 * This runs on the server, so it can safely use nodemailer and SMTP credentials
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { createLogger } from "../services/logger";
import {
  checkEmailRateLimit,
  getClientId,
  setRateLimitHeaders,
  createRateLimitError,
} from "../services/ratelimit";
import { captureException, addBreadcrumb } from "../services/sentry";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);

  // Always set CORS headers
  Object.entries(corsHeaders).forEach(([k, v]) =>
    res.setHeader(k, v as string)
  );

  // Add trace ID header for debugging
  res.setHeader("X-Trace-ID", logger.getTraceId());

  logger.info("Contact form request received");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    logger.debug("Handling OPTIONS preflight request");
    return res.status(200).json({ success: true });
  }

  // Only allow POST
  if (req.method !== "POST") {
    logger.warn("Invalid method attempted", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check rate limit
    const clientId = getClientId(req);
    logger.info("Checking rate limit", { clientId });

    const rateLimitResult = await checkEmailRateLimit(clientId);
    setRateLimitHeaders(res, rateLimitResult);

    if (!rateLimitResult.success) {
      logger.warn("Rate limit exceeded", {
        clientId,
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset,
      });
      addBreadcrumb("Rate limit exceeded", { clientId });
      return res.status(429).json(createRateLimitError(rateLimitResult));
    }

    const { name, email, phone, subject, enquiryType, message } = req.body;

    logger.info("Processing contact form", {
      name,
      email,
      enquiryType,
      hasPhone: !!phone,
    });

    // Validate required fields
    if (!name || !email || !subject || !enquiryType || !message) {
      logger.warn("Missing required fields", {
        hasName: !!name,
        hasEmail: !!email,
        hasSubject: !!subject,
        hasEnquiryType: !!enquiryType,
        hasMessage: !!message,
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    addBreadcrumb("Contact form validated", { name, email, enquiryType });

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
      logger.error("Email configuration missing", undefined, {
        missing: missing.join(", "),
      });
      return res.status(500).json({
        error: "Email service not configured",
        details: `Missing env vars: ${missing.join(", ")}`,
      });
    }

    logger.debug("Creating SMTP transporter", {
      host: smtpHost,
      port: smtpPort,
    });

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
      logger.debug("SMTP connection verified");
    } catch (verifyError: any) {
      const { message, code } = verifyError || {};
      logger.error("SMTP verify failed", verifyError, { code });
      await captureException(verifyError, { context: "SMTP verification" });
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

    addBreadcrumb("Sending emails", { name, email });
    logger.info("Sending email to business");

    // Email to business
    await transporter.sendMail({
      from: `"Vortex PCs Website" <${smtpUser}>`,
      to: businessEmail,
      replyTo: email,
      subject: `🔔 New ${enquiryType} Enquiry: ${subject}`,
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
                color: #1e293b;
                background: #f8fafc;
              }
              .email-wrapper {
                width: 100%;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                padding: 40px 20px;
              }
              .container { 
                max-width: 650px; 
                margin: 0 auto; 
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
                border: 1px solid #e2e8f0;
              }
              .header { 
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                padding: 40px 30px;
                text-align: center;
                position: relative;
              }
              .logo-container {
                background: rgba(0, 0, 0, 0.2);
                padding: 15px;
                border-radius: 12px;
                display: inline-block;
                margin-bottom: 20px;
              }
              .urgent-badge {
                display: inline-block;
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                color: #ffffff;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 15px;
                border: 1px solid rgba(255, 255, 255, 0.3);
              }
              .header h1 { 
                color: #ffffff; 
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              }
              .summary-bar {
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                padding: 20px 30px;
                border-bottom: 2px solid #f59e0b;
              }
              .summary-bar h2 {
                color: #92400e;
                font-size: 16px;
                margin: 0 0 10px 0;
                font-weight: 600;
              }
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-top: 10px;
              }
              .summary-item {
                background: rgba(255, 255, 255, 0.8);
                padding: 12px;
                border-radius: 8px;
                border: 1px solid rgba(245, 158, 11, 0.2);
              }
              .summary-item label {
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #92400e;
                font-weight: 600;
                margin-bottom: 4px;
              }
              .summary-item value {
                display: block;
                font-size: 15px;
                color: #1e293b;
                font-weight: 600;
              }
              .summary-item a {
                color: #0ea5e9;
                text-decoration: none;
                word-break: break-all;
              }
              .content { 
                padding: 40px 30px;
                background: #ffffff;
              }
              .field { 
                margin-bottom: 25px;
                padding-bottom: 25px;
                border-bottom: 1px solid #e2e8f0;
              }
              .field:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
              }
              .label { 
                font-weight: 700;
                color: #0ea5e9;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                display: block;
              }
              .value { 
                background: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                font-size: 15px;
                color: #1e293b;
                line-height: 1.7;
              }
              .value a {
                color: #0ea5e9;
                text-decoration: none;
                font-weight: 600;
              }
              .message-box {
                background: #ffffff;
                border: 2px solid #0ea5e9;
                padding: 20px;
                border-radius: 10px;
                font-size: 15px;
                line-height: 1.8;
                color: #1e293b;
                white-space: pre-wrap;
                word-break: break-word;
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
              }
              .quick-actions {
                background: #f8fafc;
                padding: 25px;
                border-radius: 8px;
                margin-top: 30px;
                border: 1px solid #e2e8f0;
              }
              .quick-actions h3 {
                color: #1e293b;
                font-size: 16px;
                margin: 0 0 15px 0;
              }
              .action-button {
                display: inline-block;
                background: linear-gradient(135deg, #0ea5e9, #0284c7);
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin-right: 10px;
                margin-bottom: 10px;
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
                transition: all 0.2s;
              }
              .action-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
              }
              .footer {
                background: #f8fafc;
                padding: 25px 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
              }
              .footer p {
                color: #64748b;
                font-size: 13px;
                margin: 5px 0;
              }
              .priority-badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.3px;
              }
              .priority-high { background: #fee2e2; color: #991b1b; }
              .priority-medium { background: #fef3c7; color: #92400e; }
              .priority-normal { background: #dbeafe; color: #1e40af; }
              @media only screen and (max-width: 600px) {
                .email-wrapper { padding: 20px 10px; }
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
                .summary-bar { padding: 15px 20px; }
                .summary-grid { grid-template-columns: 1fr; }
                .header h1 { font-size: 24px; }
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo-container">
                    <img src="https://vortexpcs.com/vortexpcs-logo.png" alt="VORTEX PCS" style="max-width: 180px; height: auto;" />
                  </div>
                  <div class="urgent-badge">⚡ New Enquiry Alert</div>
                  <h1>Contact Form Submission</h1>
                </div>
                
                <div class="summary-bar">
                  <h2>📋 Quick Summary</h2>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <label>Customer Name</label>
                      <value>${name}</value>
                    </div>
                    <div class="summary-item">
                      <label>Enquiry Type</label>
                      <value>${enquiryType}</value>
                    </div>
                    <div class="summary-item">
                      <label>Email Address</label>
                      <value><a href="mailto:${email}">${email}</a></value>
                    </div>
                    <div class="summary-item">
                      <label>Phone Number</label>
                      <value>${
                        phone
                          ? `<a href="tel:${phone.replace(
                              /\s/g,
                              ""
                            )}">${phone}</a>`
                          : "Not provided"
                      }</value>
                    </div>
                  </div>
                </div>

                <div class="content">
                  <div class="field">
                    <div class="label">📌 Subject</div>
                    <div class="value">${subject}</div>
                  </div>

                  <div class="field">
                    <div class="label">💬 Customer Message</div>
                    <div class="message-box">${message.replace(
                      /\n/g,
                      "<br>"
                    )}</div>
                  </div>

                  <div class="quick-actions">
                    <h3>⚡ Quick Actions</h3>
                    <a href="mailto:${email}?subject=Re: ${encodeURIComponent(
        subject
      )}" class="action-button">Reply to Customer</a>
                    ${
                      phone
                        ? `<a href="tel:${phone.replace(
                            /\s/g,
                            ""
                          )}" class="action-button">Call Customer</a>`
                        : ""
                    }
                  </div>
                </div>

                <div class="footer">
                  <p><strong>Vortex PCs</strong> | Contact Form Notification</p>
                  <p>Received: ${new Date().toLocaleString("en-GB", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}</p>
                  <p style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
                    This is an automated notification from vortexpcs.com
                  </p>
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
                    <img src="https://vortexpcs.com/vortexpcs-logo.png" alt="VORTEX PCS" style="max-width: 200px; height: auto;" />
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

    logger.info("Email sent successfully to customer", { email });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error: any) {
    // Enhance error logging for faster diagnosis in Vercel function logs
    const { message, code, command, response } = error || {};
    logger.error("Email send error", error, { code, command, response });
    await captureException(error, {
      context: "Contact form email",
      email: req.body?.email,
      enquiryType: req.body?.enquiryType,
    });
    return res.status(500).json({
      error: "Failed to send email",
      details: message || "Unknown error",
    });
  }
}
