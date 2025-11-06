import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

interface Component {
  id: string;
  category: string;
  model: string;
  specifications: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  budget: string;
  useCase: string;
  additionalNotes: string;
}

interface QuoteRequest {
  components: Component[];
  customerInfo: CustomerInfo;
  timestamp: string;
}

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
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { components, customerInfo, timestamp }: QuoteRequest = req.body;

    // Validation
    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ error: "No components provided" });
    }

    if (
      !customerInfo ||
      !customerInfo.name ||
      !customerInfo.email ||
      !customerInfo.phone
    ) {
      return res
        .status(400)
        .json({ error: "Missing required customer information" });
    }

    // Load SMTP configuration from environment
    const smtpHost = process.env.VITE_SMTP_HOST;
    const smtpPort = parseInt(process.env.VITE_SMTP_PORT || "587", 10);
    const smtpSecure = process.env.VITE_SMTP_SECURE === "true";
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;
    const businessEmail =
      process.env.VITE_BUSINESS_EMAIL || "sales@vortexpcs.com";

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
      console.error("SMTP verify failed:", verifyError);
      return res.status(500).json({
        error: "SMTP connection test failed",
        details: verifyError.message || "Unknown verify error",
      });
    }

    // Build component list for email
    const componentList = components
      .map((comp, index) => {
        const categoryLabel = comp.category.toUpperCase();
        let details = `${index + 1}. [${categoryLabel}] ${comp.model}`;
        if (comp.specifications) {
          details += `\n   Specifications: ${comp.specifications}`;
        }
        return details;
      })
      .join("\n\n");

    // Email to business
    const businessEmailHtml = `
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
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              padding: 40px 20px;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: rgba(15, 23, 42, 0.8);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(168, 85, 247, 0.3);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(168, 85, 247, 0.2);
            }
            .header { 
              background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); 
              padding: 40px 30px;
              text-align: center;
              position: relative;
            }
            .badge {
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
              margin: 10px 0 0 0;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            .summary-bar {
              background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(124, 58, 237, 0.2));
              padding: 25px 30px;
              border-bottom: 2px solid rgba(168, 85, 247, 0.5);
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            .summary-item {
              background: rgba(255, 255, 255, 0.05);
              padding: 15px;
              border-radius: 8px;
              border: 1px solid rgba(168, 85, 247, 0.2);
            }
            .summary-item label {
              display: block;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #c084fc;
              font-weight: 600;
              margin-bottom: 5px;
            }
            .summary-item value {
              display: block;
              font-size: 15px;
              color: #ffffff;
              font-weight: 600;
            }
            .summary-item a {
              color: #a78bfa;
              text-decoration: none;
            }
            .content { 
              padding: 40px 30px;
              background: rgba(30, 41, 59, 0.4);
            }
            .section {
              background: rgba(168, 85, 247, 0.1);
              border-left: 4px solid #a855f7;
              padding: 20px;
              margin-bottom: 20px;
              border-radius: 5px;
            }
            .section h2 {
              margin: 0 0 15px 0;
              color: #c084fc;
              font-size: 18px;
            }
            .section p {
              margin: 8px 0;
              color: #e0e7ff;
            }
            .component-list {
              font-family: 'Courier New', monospace;
              background: rgba(0, 0, 0, 0.4);
              padding: 20px;
              border-radius: 8px;
              white-space: pre-wrap;
              color: #e0f2fe;
              font-size: 14px;
              line-height: 1.8;
              border: 1px solid rgba(14, 165, 233, 0.3);
            }
            .footer {
              background: rgba(15, 23, 42, 0.8);
              padding: 25px 30px;
              text-align: center;
              border-top: 1px solid rgba(148, 163, 184, 0.2);
            }
            .footer p {
              color: #94a3b8;
              font-size: 12px;
              margin: 5px 0;
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper { padding: 20px 10px; }
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
              .summary-bar { padding: 20px 15px; }
              .summary-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <div class="badge">✨ ENTHUSIAST BUILDER</div>
                <h1>⚡ New Bespoke Build Quote Request</h1>
              </div>
              
              <div class="summary-bar">
                <h2 style="color: #c084fc; margin: 0 0 10px 0;">📋 Customer Information</h2>
                <div class="summary-grid">
                  <div class="summary-item">
                    <label>Customer Name</label>
                    <value>${customerInfo.name}</value>
                  </div>
                  <div class="summary-item">
                    <label>Email Address</label>
                    <value><a href="mailto:${customerInfo.email}">${
      customerInfo.email
    }</a></value>
                  </div>
                  <div class="summary-item">
                    <label>Phone Number</label>
                    <value><a href="tel:${customerInfo.phone.replace(
                      /\s/g,
                      ""
                    )}">${customerInfo.phone}</a></value>
                  </div>
                  <div class="summary-item">
                    <label>Budget</label>
                    <value>${customerInfo.budget || "Not specified"}</value>
                  </div>
                </div>
              </div>

              <div class="content">
                ${
                  customerInfo.useCase
                    ? `
                <div class="section">
                  <h2>🎯 Use Case</h2>
                  <p>${customerInfo.useCase}</p>
                </div>
                `
                    : ""
                }

                <div class="section">
                  <h2>🔧 Requested Components (${components.length})</h2>
                  <div class="component-list">${componentList}</div>
                </div>

                ${
                  customerInfo.additionalNotes
                    ? `
                <div class="section">
                  <h2>📝 Additional Notes</h2>
                  <p>${customerInfo.additionalNotes}</p>
                </div>
                `
                    : ""
                }

                <div style="background: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e; padding: 20px; margin-top: 20px; border-radius: 5px;">
                  <h3 style="margin: 0 0 10px 0; color: #4ade80; font-size: 16px;">⏱️ Action Required</h3>
                  <p style="margin: 0; color: #d1fae5;">Contact customer within 24 hours with availability and pricing</p>
                </div>
              </div>

              <div class="footer">
                <p>Submitted: ${new Date(timestamp).toLocaleString("en-GB", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}</p>
                <p style="margin-top: 10px;">Vortex PCs - Enthusiast Builder Quote System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Customer confirmation email
    const customerEmailHtml = `
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
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              padding: 40px 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: rgba(15, 23, 42, 0.8);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(168, 85, 247, 0.3);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(168, 85, 247, 0.2);
            }
            .header { 
              background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); 
              padding: 40px 30px;
              text-align: center;
            }
            .badge {
              display: inline-block;
              background: rgba(255, 255, 255, 0.2);
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 15px;
              border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .header h1 { 
              color: #ffffff; 
              font-size: 24px;
              font-weight: 700;
              margin: 0;
            }
            .content { 
              padding: 40px 30px;
              background: rgba(30, 41, 59, 0.4);
              color: #e2e8f0;
            }
            .content p {
              margin-bottom: 20px;
              font-size: 16px;
              line-height: 1.8;
            }
            .highlight-box { 
              background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.1));
              border-left: 4px solid #a855f7;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .highlight-box h2 {
              color: #c084fc;
              font-size: 18px;
              margin: 0 0 10px 0;
              font-weight: 600;
            }
            .highlight-box p {
              margin: 8px 0;
              color: #e0e7ff;
            }
            .success-box {
              background: rgba(34, 197, 94, 0.1);
              border-left: 4px solid #22c55e;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .success-box h3 {
              margin: 0 0 10px 0;
              color: #4ade80;
              font-size: 16px;
            }
            .success-box ul {
              margin: 0;
              padding-left: 20px;
              color: #d1fae5;
            }
            .success-box li {
              margin: 8px 0;
            }
            .contact-info {
              background: rgba(14, 165, 233, 0.1);
              border: 1px solid rgba(14, 165, 233, 0.3);
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .contact-info p {
              margin: 8px 0;
            }
            .contact-info a {
              color: #38bdf8;
              text-decoration: none;
              font-weight: 600;
            }
            .footer {
              background: rgba(15, 23, 42, 0.8);
              padding: 25px 30px;
              text-align: center;
              border-top: 1px solid rgba(148, 163, 184, 0.2);
            }
            .footer p {
              color: #64748b;
              font-size: 13px;
              margin: 5px 0;
            }
            .footer a {
              color: #a855f7;
              text-decoration: none;
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper { padding: 20px 10px; }
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <div class="badge">✨ ENTHUSIAST BUILDER</div>
                <h1>Quote Request Received</h1>
              </div>
              <div class="content">
                <p>Hi ${customerInfo.name},</p>
                
                <p>Thank you for your enthusiast build quote request! Our specialist team has received your component list and will begin sourcing availability and pricing.</p>

                <div class="highlight-box">
                  <h2>Your Build Request</h2>
                  <p><strong>${
                    components.length
                  } components</strong> specified</p>
                  ${
                    customerInfo.budget
                      ? `<p>Budget: <strong>${customerInfo.budget}</strong></p>`
                      : ""
                  }
                </div>

                <div class="success-box">
                  <h3>⏱️ Next Steps</h3>
                  <ul>
                    <li>We'll check availability and pricing for your specified components</li>
                    <li>Our team will contact you within <strong>24 hours</strong></li>
                    <li>We'll provide a detailed quote and lead times</li>
                    <li>If we can't source a specific component, we'll suggest alternatives</li>
                  </ul>
                </div>

                <p>Our enthusiast builder service specialises in sourcing hard-to-find components and delivering premium custom builds for tech-savvy customers like you.</p>

                <div class="contact-info">
                  <p><strong>Need to discuss your build?</strong></p>
                  <p>📞 Call: <a href="tel:+441603975440">01603 975440</a></p>
                  <p>✉️ Email: <a href="mailto:sales@vortexpcs.com">sales@vortexpcs.com</a></p>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(148, 163, 184, 0.2);">
                  <strong>Best regards,</strong><br>
                  The Vortex PCs Specialist Team<br>
                  <span style="color: #a855f7;">Bespoke Component Sourcing</span>
                </p>
              </div>
              <div class="footer">
                <p><strong>Vortex PCs Ltd</strong></p>
                <p>sales@vortexpcs.com | 01603 975440</p>
                <p><a href="https://vortexpcs.com">www.vortexpcs.com</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to business
    await transporter.sendMail({
      from: `"Vortex PCs Enthusiast Builder" <${smtpUser}>`,
      to: businessEmail,
      replyTo: customerInfo.email,
      subject: `⚡ New Enthusiast Build Quote - ${customerInfo.name} - ${components.length} Components`,
      html: businessEmailHtml,
    });

    // Send confirmation to customer
    await transporter.sendMail({
      from: `"Vortex PCs" <${smtpUser}>`,
      to: customerInfo.email,
      subject: "✨ Your Enthusiast Build Quote Request - Vortex PCs",
      html: customerEmailHtml,
    });

    console.log("Enthusiast quote emails sent successfully");

    return res.status(200).json({
      success: true,
      message: "Quote request submitted successfully",
    });
  } catch (error: any) {
    console.error("Enthusiast quote submission error:", error);
    return res.status(500).json({
      error: "Failed to submit quote request",
      details: error.message || "Unknown error",
    });
  }
}
