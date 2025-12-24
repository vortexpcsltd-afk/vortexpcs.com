/**
 * Contact form endpoint - sends customer enquiries to business email
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { sendEmailWithRetry } from "../../services/emailSender";
import {
  withErrorHandler,
  ApiError,
  validateMethod,
  validateRequiredFields,
} from "../middleware/error-handler.js";

async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate method
  validateMethod(req, ["POST"]);

  const { name, email, phone, subject, enquiryType, message } =
    req.body as Record<string, unknown>;

  // Validate required fields
  validateRequiredFields(req.body as Record<string, unknown>, [
    "name",
    "email",
    "subject",
    "enquiryType",
    "message",
  ]);

  // Backend uses server-side env vars (no VITE_ prefix)
  const smtpHost = process.env.SMTP_HOST;
  const smtpPortRaw = process.env.SMTP_PORT || "465";
  const smtpPort = parseInt(smtpPortRaw, 10);
  // Auto derive secure if not explicitly set: true when port 465 else false
  const smtpSecureRaw = process.env.SMTP_SECURE;
  const smtpSecure =
    typeof smtpSecureRaw === "string"
      ? smtpSecureRaw === "true"
      : smtpPort === 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const businessEmail = process.env.BUSINESS_EMAIL || "info@vortexpcs.com";

  // Build base URL for assets (logo)
  const baseUrl = (
    process.env.VITE_APP_URL || "https://www.vortexpcs.com"
  ).replace(/\/+$/g, "");
  const logoUrl = `${baseUrl}/vortexpcs-logo.png`;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new ApiError(
      `Email service not configured. Missing: ${!smtpHost ? "host " : ""}${
        !smtpUser ? "user " : ""
      }${!smtpPass ? "pass" : ""}`.trim(),
      500
    );
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    logger: true,
    debug: true,
  });

  // Verify connection (non-fatal if fails)
  try {
    await transporter.verify();
  } catch (e) {
    console.error(
      "SMTP verify failed (continuing):",
      e instanceof Error ? e.message : e
    );
  }

  // Escape HTML to prevent injection
  const escapeHtml = (str: string) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const e = {
    name: escapeHtml(String(name)),
    email: escapeHtml(String(email)),
    phone: escapeHtml(String(phone || "N/A")),
    subject: escapeHtml(String(subject)),
    enquiryType: escapeHtml(String(enquiryType)),
    message: escapeHtml(String(message)).replace(/\n/g, "<br>"),
  };

  const sentAt = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
  });

  // Build HTML email (responsive-friendly with inline styles)
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Enquiry</title>
  <style>
    /* Fallbacks for some clients; most styles are inlined on elements */
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif; color:#0f172a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0B0F17; padding:20px 0;">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background:#0B0F17;">
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

        <table class="container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background:#0B0F17;">
          <tr>
            <td class="content" style="padding:28px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:16px; backdrop-filter: blur(10px);">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#E2E8F0;">
                New Contact Form Submission
              </h1>
              <p style="margin:0 0 18px; color:#94A3B8;">You have received a new enquiry via the website.</p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate; border-spacing:0; margin:0 0 18px;">
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8; width:160px;">Enquiry Type</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    e.enquiryType
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Name</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    e.name
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Email</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    e.email
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Phone</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    e.phone
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Subject</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${
                    e.subject
                  }</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-right:none; border-top-left-radius:10px; border-bottom-left-radius:10px; color:#94A3B8;">Received</td>
                  <td style="padding:10px 12px; border:1px solid rgba(148,163,184,0.25); border-top-right-radius:10px; border-bottom-right-radius:10px; color:#E2E8F0;">${sentAt}</td>
                </tr>
              </table>

              <div style="margin:18px 0; padding:14px 16px; border-left:3px solid #0ea5e9; background: rgba(14,165,233,0.08); border-radius:10px; color:#E2E8F0;">
                <div style="margin-bottom:8px; color:#94A3B8; font-size:13px; text-transform:uppercase; letter-spacing:0.3px;">Message</div>
                <div style="line-height:1.65; font-size:15px;">${
                  e.message
                }</div>
              </div>

              <p style="margin:0; font-size:12px; color:#64748B;">
                Reply directly to this email to contact the sender.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 6px; text-align:center; color:#94A3B8; font-size:12px;">
              <span style="color:#64748B;">© ${new Date().getFullYear()} Vortex PCs</span>
              <span style="color:#334155;"> • </span>
              <a href="${baseUrl}" style="color:#38bdf8; text-decoration:none;">vortexpcs.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `New Contact Form Submission\n\nEnquiry Type: ${String(
    enquiryType
  )}\nName: ${String(name)}\nEmail: ${String(email)}\nPhone: ${String(
    phone || "N/A"
  )}\nSubject: ${String(subject)}\nReceived: ${sentAt}\n\nMessage:\n${String(
    message
  )}`;

  // Send email
  try {
    const r = await sendEmailWithRetry(transporter, {
      from: `"${String(name)}" <${smtpUser}>`,
      to: businessEmail,
      replyTo: String(email),
      subject: `[${String(enquiryType)}] ${String(subject)}`,
      text,
      html,
    });
    if (!r.success) throw r.error || new Error("Email failed");
  } catch (err) {
    const authHint =
      smtpPort === 587 && smtpSecure === false
        ? "Using STARTTLS on 587; ensure server supports it."
        : smtpPort === 465 && smtpSecure === true
        ? "Using implicit TLS on 465; verify certificate & creds."
        : `Port ${smtpPort} secure=${smtpSecure}`;
    console.error("Contact form send failed:", err);
    throw new ApiError(
      `Failed to send contact email: ${
        err instanceof Error ? err.message : String(err)
      } | ${authHint}`,
      500
    );
  }

  return res.status(200).json({
    success: true,
    message: "Email sent successfully",
  });
}

export default withErrorHandler(handler);
