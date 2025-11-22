/**
 * Business quote request endpoint
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
  Object.entries(corsHeaders).forEach(([k, v]) =>
    res.setHeader(k, v as string)
  );

  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      businessName,
      postcode,
      contactName,
      contractNumber,
      email,
      os,
      workstation,
    } = req.body || {};

    if (
      !businessName ||
      !postcode ||
      !contactName ||
      !email ||
      !workstation?.name
    ) {
      return res.status(400).json({ error: "Missing required fields" });
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
      return res.status(500).json({ error: "Email service not configured" });
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
      businessName: escapeHtml(businessName),
      postcode: escapeHtml(postcode),
      contactName: escapeHtml(contactName),
      contractNumber: escapeHtml(contractNumber || "N/A"),
      email: escapeHtml(email),
      os: escapeHtml(os || "Windows 11 Pro"),
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
<body style="margin:0; padding:0; background:#0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial; color:#E2E8F0;">
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
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8; width:180px;">Business Name</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.businessName
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
                    E.email
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Postcode</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.postcode
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Contract Number</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    E.contractNumber
                  }</td>
                </tr>
              </table>

              <h2 style="margin:18px 0 8px; font-size:16px; color:#E2E8F0;">Requested Workstation</h2>
              <div style="margin:12px 0; padding:12px 14px; border:1px solid rgba(148,163,184,0.25); border-radius:10px;">
                <div style="margin-bottom:6px; color:#E2E8F0; font-weight:600;">${
                  E.workstationName
                } ${E.workstationPrice ? `• ${E.workstationPrice}` : ""}</div>
                <div style="color:#94A3B8; font-size:14px; line-height:1.6;">
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

    const text = `New Business Quote Request\n\nBusiness: ${businessName}\nContact: ${contactName}\nEmail: ${email}\nPostcode: ${postcode}\nContract: ${
      contractNumber || "N/A"
    }\nOS: ${os || "Windows 11 Pro"}\nWorkstation: ${workstation?.name} ${
      workstation?.price ? `• £${Number(workstation.price).toFixed(2)}` : ""
    }`;

    await transporter.sendMail({
      from: `"${businessName}" <${smtpUser}>`,
      to: businessEmail,
      replyTo: email,
      subject: `[Business Quote] ${businessName} – ${
        workstation?.name || "Request"
      }`,
      text,
      html,
    });

    return res.status(200).json({ success: true, message: "Quote submitted" });
  } catch (error: unknown) {
    console.error("Business quote error:", error);
    return res.status(500).json({
      error: "Failed to submit quote",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
