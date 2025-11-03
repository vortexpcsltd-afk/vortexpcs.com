/**
 * Vercel Serverless Function - Send Repair Service Booking Notifications
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
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
    const { bookingData, customerInfo, totalPrice } = req.body;

    // Validate required fields
    if (!bookingData || !customerInfo || !totalPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Load SMTP configuration
    const smtpHost = process.env.VITE_SMTP_HOST;
    const smtpPort = parseInt(process.env.VITE_SMTP_PORT || "465", 10);
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

    // Verify connection
    try {
      await transporter.verify();
    } catch (verifyError: any) {
      const { message, code } = verifyError || {};
      console.error("SMTP verify failed:", { message, code });
      return res.status(500).json({
        error: "SMTP connection test failed",
        details: message || "Unknown verify error",
      });
    }

    // Generate booking reference
    const bookingRef = `VX-REP-${Date.now().toString(36).toUpperCase()}`;

    // Email to business
    await transporter.sendMail({
      from: `"Vortex PCs Repair Service" <${smtpUser}>`,
      to: businessEmail,
      replyTo: customerInfo.email,
      subject: `🔧 New ${bookingData.urgency} Repair Booking - £${totalPrice}`,
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
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
                padding: 40px 30px;
                text-align: center;
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
              }
              .summary-bar {
                background: linear-gradient(135deg, #fed7aa, #fdba74);
                padding: 20px 30px;
                border-bottom: 2px solid #f97316;
              }
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-top: 10px;
              }
              .summary-item {
                background: rgba(255, 255, 255, 0.9);
                padding: 12px;
                border-radius: 8px;
              }
              .summary-item label {
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #9a3412;
                font-weight: 600;
                margin-bottom: 4px;
              }
              .summary-item value {
                display: block;
                font-size: 15px;
                color: #1e293b;
                font-weight: 600;
              }
              .price-tag {
                font-size: 24px;
                color: #ea580c;
                font-weight: 800;
              }
              .content { 
                padding: 40px 30px;
              }
              .section {
                margin-bottom: 30px;
                padding-bottom: 30px;
                border-bottom: 1px solid #e2e8f0;
              }
              .section:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
              }
              .section h3 {
                color: #0ea5e9;
                font-size: 16px;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .info-grid {
                display: grid;
                gap: 12px;
              }
              .info-item {
                background: #f8fafc;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
              }
              .info-label {
                font-size: 12px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                margin-bottom: 4px;
              }
              .info-value {
                font-size: 15px;
                color: #1e293b;
                font-weight: 600;
              }
              .action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
              }
              .action-button {
                display: inline-block;
                background: linear-gradient(135deg, #0ea5e9, #0284c7);
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
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
              @media only screen and (max-width: 600px) {
                .summary-grid { grid-template-columns: 1fr; }
                .action-buttons { flex-direction: column; }
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
                  <div class="urgent-badge">🔧 New Repair Booking</div>
                  <h1>PC Repair Collection Booked</h1>
                </div>
                
                <div class="summary-bar">
                  <div class="summary-grid">
                    <div class="summary-item">
                      <label>Customer Name</label>
                      <value>${customerInfo.name}</value>
                    </div>
                    <div class="summary-item">
                      <label>Booking Reference</label>
                      <value>${bookingRef}</value>
                    </div>
                    <div class="summary-item">
                      <label>Urgency</label>
                      <value style="text-transform: capitalize">${
                        bookingData.urgency
                      }</value>
                    </div>
                    <div class="summary-item">
                      <label>Collection Fee</label>
                      <value class="price-tag">£${totalPrice}</value>
                    </div>
                  </div>
                </div>

                <div class="content">
                  <div class="section">
                    <h3>👤 Customer Information</h3>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value"><a href="mailto:${
                          customerInfo.email
                        }" style="color: #0ea5e9; text-decoration: none;">${
        customerInfo.email
      }</a></div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Phone</div>
                        <div class="info-value"><a href="tel:${
                          customerInfo.phone
                        }" style="color: #0ea5e9; text-decoration: none;">${
        customerInfo.phone
      }</a></div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Collection Address</div>
                        <div class="info-value">${customerInfo.address}</div>
                      </div>
                    </div>
                  </div>

                  <div class="section">
                    <h3>🔧 Issue Details</h3>
                    <div class="info-item">
                      <div class="info-label">Reported Issues</div>
                      <div class="info-value">${
                        bookingData.issueTypes?.join(", ") || "Not specified"
                      }</div>
                    </div>
                    ${
                      bookingData.description
                        ? `
                    <div class="info-item" style="margin-top: 12px;">
                      <div class="info-label">Additional Details</div>
                      <div class="info-value" style="white-space: pre-wrap;">${bookingData.description}</div>
                    </div>
                    `
                        : ""
                    }
                  </div>

                  <div class="action-buttons">
                    <a href="mailto:${
                      customerInfo.email
                    }?subject=Re: Repair Booking ${bookingRef}" class="action-button">Reply to Customer</a>
                    <a href="tel:${
                      customerInfo.phone
                    }" class="action-button">Call Customer</a>
                  </div>
                </div>

                <div class="footer">
                  <p><strong>Vortex PCs</strong> | Repair Service Notification</p>
                  <p>Received: ${new Date().toLocaleString("en-GB", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Email to customer
    await transporter.sendMail({
      from: `"Vortex PCs Repair Service" <${smtpUser}>`,
      to: customerInfo.email,
      subject: "Your PC Repair Collection is Confirmed - Vortex PCs",
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
              }
              .content { 
                background: rgba(30, 41, 59, 0.4);
                padding: 40px 30px;
                color: #e2e8f0;
              }
              .success-badge {
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2));
                border: 2px solid rgba(34, 197, 94, 0.4);
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                margin-bottom: 30px;
              }
              .success-badge h2 {
                color: #22c55e;
                font-size: 24px;
                margin-bottom: 8px;
              }
              .booking-ref {
                display: inline-block;
                background: rgba(14, 165, 233, 0.2);
                border: 1px solid rgba(14, 165, 233, 0.4);
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 18px;
                font-weight: 700;
                color: #0ea5e9;
                font-family: monospace;
                letter-spacing: 1px;
              }
              .info-box {
                background: rgba(14, 165, 233, 0.05);
                border: 1px solid rgba(14, 165, 233, 0.2);
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
              }
              .info-box h3 {
                color: #0ea5e9;
                font-size: 16px;
                margin-bottom: 15px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                color: #94a3b8;
              }
              .info-value {
                color: #ffffff;
                font-weight: 600;
              }
              .next-steps {
                background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(37, 99, 235, 0.1));
                border-left: 4px solid #0ea5e9;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
              }
              .next-steps h3 {
                color: #0ea5e9;
                margin-bottom: 15px;
              }
              .next-steps ul {
                list-style: none;
                padding: 0;
              }
              .next-steps li {
                padding: 8px 0;
                padding-left: 25px;
                position: relative;
              }
              .next-steps li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #22c55e;
                font-weight: bold;
              }
              .contact-info {
                background: rgba(14, 165, 233, 0.05);
                border: 1px solid rgba(14, 165, 233, 0.2);
                padding: 20px;
                border-radius: 8px;
                margin-top: 30px;
              }
              .contact-info p {
                margin: 8px 0;
              }
              .contact-info a {
                color: #0ea5e9;
                text-decoration: none;
                font-weight: 600;
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
              @media only screen and (max-width: 600px) {
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
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
                  <h1>Repair Collection Confirmed</h1>
                </div>
                
                <div class="content">
                  <div class="success-badge">
                    <h2>✓ Booking Confirmed</h2>
                    <p style="color: #94a3b8; margin-top: 8px;">Your PC repair collection has been successfully booked and paid</p>
                  </div>

                  <p style="font-size: 16px; margin-bottom: 20px;">Dear ${
                    customerInfo.name
                  },</p>
                  
                  <p>Thank you for choosing Vortex PCs for your repair needs. Your booking has been confirmed and payment processed.</p>

                  <div class="info-box">
                    <h3>📋 Booking Details</h3>
                    <div class="info-row">
                      <span class="info-label">Booking Reference</span>
                      <span class="booking-ref">${bookingRef}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Service Type</span>
                      <span class="info-value">${
                        bookingData.urgency
                      } Collection & Return</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Collection Fee</span>
                      <span class="info-value">£${totalPrice}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Issues Reported</span>
                      <span class="info-value">${
                        bookingData.issueTypes?.join(", ") || "Not specified"
                      }</span>
                    </div>
                  </div>

                  <div class="next-steps">
                    <h3>📍 What Happens Next</h3>
                    <ul>
                      <li>Our team will contact you within 2 hours to arrange a convenient collection time</li>
                      <li>We'll collect your PC from: ${
                        customerInfo.address
                      }</li>
                      <li>You'll receive diagnostic results and a quote within 24 hours</li>
                      <li>Once approved, repairs will be completed and your PC returned</li>
                      <li>All work comes with a 12-month warranty</li>
                    </ul>
                  </div>

                  <div class="contact-info">
                    <p><strong>Need to contact us?</strong></p>
                    <p>📞 Phone: <a href="tel:+441603975440">01603 975440</a></p>
                    <p>✉️ Email: <a href="mailto:info@vortexpcs.com">info@vortexpcs.com</a></p>
                    <p>🌐 Website: <a href="https://vortexpcs.com">vortexpcs.com</a></p>
                  </div>

                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(148, 163, 184, 0.2);">
                    <strong>Best regards,</strong><br>
                    <strong>The Vortex PCs Team</strong><br>
                    <span style="color: #0ea5e9;">Expert PC Repairs & Building</span>
                  </p>
                </div>

                <div class="footer">
                  <p><strong>Vortex PCs Ltd</strong></p>
                  <p>info@vortexpcs.com | 01603 975440</p>
                  <p><a href="https://vortexpcs.com" style="color: #0ea5e9; text-decoration: none;">www.vortexpcs.com</a></p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Repair booking notifications sent successfully",
      bookingRef,
    });
  } catch (error: any) {
    console.error("Repair notification error:", error);
    return res.status(500).json({
      error: "Failed to send repair notifications",
      details: error.message,
    });
  }
}
