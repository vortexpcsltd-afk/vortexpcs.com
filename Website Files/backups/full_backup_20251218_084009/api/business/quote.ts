/**
 * Business quote request endpoint
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { sendEmailWithRetry } from "../../services/emailSender.js";
import { withSecureMethod } from "../middleware/apiSecurity.js";

export default withSecureMethod(
  "POST",
  async (req: VercelRequest, res: VercelResponse) => {
    try {
      const {
        companyName,
        companyRegistration,
        vatNumber,
        postcode,
        contactName,
        contactEmail,
        contactPhone,
        os,
        quantity = 1,
        workstation,
      } = req.body || {};

      console.log("✅ Quote request received:", {
        companyName,
        postcode,
        contactName,
        contactEmail,
        contactPhone,
        workstation: workstation?.name,
        quantity,
      });

      // Validate required fields
      if (
        !companyName ||
        !postcode ||
        !contactName ||
        !contactEmail ||
        !contactPhone ||
        !workstation?.name
      ) {
        console.warn("❌ Quote request missing required fields");
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // SMTP config
      const smtpHost = process.env.VITE_SMTP_HOST;
      const smtpPort = parseInt(process.env.VITE_SMTP_PORT || "465", 10);
      const smtpSecure = (process.env.VITE_SMTP_SECURE || "true") === "true";
      const smtpUser = process.env.VITE_SMTP_USER;
      const smtpPass = process.env.VITE_SMTP_PASS;
      const businessEmail =
        process.env.VITE_BUSINESS_EMAIL || "info@vortexpcs.com";

      const baseUrl = (
        process.env.VITE_APP_URL || "https://www.vortexpcs.com"
      ).replace(/\/+$/g, "");
      const logoUrl = `${baseUrl}/vortexpcs-logo.png`;

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.error("Email service not configured for business quote", {
          hasHost: Boolean(smtpHost),
          hasUser: Boolean(smtpUser),
        });
        return res.status(503).json({
          success: false,
          message:
            "Email service not configured. Please set VITE_SMTP_HOST/USER/PASS.",
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const escapeHtml = (str: string) =>
        String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const E = {
        companyName: escapeHtml(companyName),
        companyRegistration: escapeHtml(companyRegistration || "N/A"),
        vatNumber: escapeHtml(vatNumber || "N/A"),
        postcode: escapeHtml(postcode),
        contactName: escapeHtml(contactName),
        contactEmail: escapeHtml(contactEmail),
        contactPhone: escapeHtml(contactPhone),
        os: escapeHtml(os || "Windows 11 Pro"),
        quantity: Number(quantity) || 1,
        workstationName: escapeHtml(workstation?.name || ""),
        workstationPrice:
          typeof workstation?.price === "number"
            ? `£${workstation.price.toLocaleString()}`
            : "",
        specs: workstation?.specs ? workstation.specs : {},
      } as const;

      const sentAt = new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London",
      });

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Business Quote Request</title>
</head>
<body style="margin:0; padding:0; background:#0B0F17; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial; color:#E2E8F0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0B0F17; padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background:#0B0F17;">
          <tr>
            <td style="padding:0 24px;" align="center">
              <a href="${baseUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-block;">
                <img src="${logoUrl}" alt="Vortex PCs" width="160" style="display:block; height:auto; max-width:160px; margin:12px auto 8px;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #0ea5e9, #2563eb);"></td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background:#0B0F17;">
          <tr>
            <td style="padding:28px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:16px; backdrop-filter: blur(10px);">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#E2E8F0;">New Business Quote Request</h1>
              <p style="margin:0 0 18px; color:#94A3B8;">You received a new business quote enquiry.</p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate; border-spacing:0; margin:0 0 18px;">
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8; width:200px;">Business Name</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.companyName
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Company Registration</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.companyRegistration
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">VAT Number</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.vatNumber
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Contact Name</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.contactName
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Email</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.contactEmail
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Phone</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.contactPhone
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Postcode</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.postcode
                  }</td>
                </tr>
              </table>

              <h2 style="margin:18px 0 8px; font-size:16px; color:#E2E8F0;">Requested Workstation</h2>
              <div style="margin:12px 0; padding:12px 14px; border:1px solid rgba(148,163,184,0.25); border-radius:10px;">
                <div style="margin-bottom:6px; color:#E2E8F0; font-weight:600;">${
                  E.workstationName
                } ${E.workstationPrice ? `• ${E.workstationPrice}` : ""}</div>
                <div style="color:#94A3B8; font-size:14px; line-height:1.6;">
                  <div><strong>Quantity:</strong> ${E.quantity}</div>
                  <div><strong>OS:</strong> ${E.os}</div>
                  ${
                    E.specs?.processor
                      ? `<div><strong>CPU:</strong> ${escapeHtml(
                          E.specs.processor
                        )}</div>`
                      : ""
                  }
                  ${
                    E.specs?.ram
                      ? `<div><strong>Memory:</strong> ${escapeHtml(
                          E.specs.ram
                        )}</div>`
                      : ""
                  }
                  ${
                    E.specs?.storage
                      ? `<div><strong>Storage:</strong> ${escapeHtml(
                          E.specs.storage
                        )}</div>`
                      : ""
                  }
                  ${
                    E.specs?.graphics
                      ? `<div><strong>Graphics:</strong> ${escapeHtml(
                          E.specs.graphics
                        )}</div>`
                      : ""
                  }
                </div>
              </div>

              <p style="margin:8px 0 0; font-size:12px; color:#64748B;">Received: ${sentAt}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const text = `New Business Quote Request\n\nBusiness: ${companyName}\nCompany Registration: ${
        companyRegistration || "N/A"
      }\nVAT: ${
        vatNumber || "N/A"
      }\nContact: ${contactName}\nEmail: ${contactEmail}\nPhone: ${contactPhone}\nPostcode: ${postcode}\nOS: ${
        os || "Windows 11 Pro"
      }\nQuantity: ${quantity}\nWorkstation: ${workstation?.name} ${
        workstation?.price ? `• £${Number(workstation.price).toFixed(2)}` : ""
      }`;

      const r = await sendEmailWithRetry(transporter, {
        from: `"${companyName}" <${smtpUser}>`,
        to: businessEmail,
        replyTo: contactEmail,
        subject: `[Business Quote] ${companyName} – ${
          workstation?.name || "Request"
        }`,
        text,
        html,
      });
      if (!r.success) throw r.error || new Error("Email failed");

      return res.status(200).json({
        success: true,
        message: "Quote submitted. We'll contact you within 24 hours.",
      });
    } catch (error: unknown) {
      console.error("❌ Quote error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);
