import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSmtpConfig } from "../services/smtp.js";
import {
  ensureBranded,
  buildPlainTextFromHtml,
} from "../../services/emailTemplate.js";
import { withSecureMethod } from "../middleware/apiSecurity.js";
import { sendEmailWithRetry } from "../../services/emailSender.js";

const nodemailer = require("nodemailer");

/**
 * POST /api/support/notify-staff
 *
 * Sends email notification to admin staff when a new support ticket is created.
 *
 * Body params:
 * - ticketId: string
 * - subject: string
 * - type: string
 * - priority: string
 * - customerEmail: string
 * - customerName: string
 */
export default withSecureMethod(
  "POST",
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed",
      });
    }

    try {
      const { ticketId, subject, type, priority, customerEmail, customerName } =
        req.body;

      if (!ticketId || !subject || !customerEmail) {
        console.warn("Notify staff missing fields", {
          hasTicketId: Boolean(ticketId),
          hasSubject: Boolean(subject),
          hasCustomerEmail: Boolean(customerEmail),
        });
        return res.status(400).json({
          ok: false,
          code: "MISSING_FIELDS",
          message: "Invalid request",
        });
      }

      // Staff notification email address
      const staffEmail =
        process.env.SMTP_NOTIFICATION_EMAIL || process.env.SMTP_USER;

      if (!staffEmail) {
        console.error("No staff notification email configured");
        return res.status(503).json({
          ok: false,
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable",
        });
      }

      // Build priority badge styling
      const priorityColor =
        priority === "urgent"
          ? "#ef4444"
          : priority === "high"
          ? "#f97316"
          : "#3b82f6";
      const priorityLabel = priority || "normal";

      // Build HTML content with urgent styling
      const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
            🎫 New Support Ticket
          </h1>
        </div>
        
        <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="background: #fef2f2; border-left: 4px solid ${priorityColor}; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 16px;">
              Priority: <span style="text-transform: uppercase;">${priorityLabel}</span>
            </p>
          </div>

          <h2 style="color: #111827; margin: 0 0 24px 0; font-size: 20px; font-weight: 600;">
            Ticket #${ticketId}
          </h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 120px;">Subject:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Type:</td>
                <td style="padding: 8px 0; color: #111827;">${
                  type || "General"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Customer:</td>
                <td style="padding: 8px 0; color: #111827;">${
                  customerName || customerEmail
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
                <td style="padding: 8px 0; color: #0ea5e9;">
                  <a href="mailto:${customerEmail}" style="color: #0ea5e9; text-decoration: none;">
                    ${customerEmail}
                  </a>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              💡 <strong>Action Required:</strong> A new support ticket has been submitted. 
              Log in to the admin dashboard to view the full details and respond to the customer.
            </p>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="https://vortexpcs.com/admin" 
               style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              View in Admin Dashboard
            </a>
          </div>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated notification from Vortex PCs Support System
            </p>
          </div>
        </div>
      </div>
    `;

      const emailSubject = `🎫 New Support Ticket #${ticketId} - ${
        priority === "urgent" ? "URGENT" : priorityLabel.toUpperCase()
      }`;
      const brandedHtml = ensureBranded(htmlContent, emailSubject);
      const plainText = buildPlainTextFromHtml(brandedHtml);

      // Create transporter and send email
      const smtpConfig = getSmtpConfig(req);
      if (smtpConfig.missing?.length > 0) {
        console.error("Missing SMTP config for notify-staff", {
          missing: smtpConfig.missing,
        });
        return res.status(503).json({
          ok: false,
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable",
        });
      }
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: { user: smtpConfig.user, pass: smtpConfig.pass },
      });

      const result = await sendEmailWithRetry(transporter, {
        from: `"Vortex PCs Support" <${smtpConfig.user}>`,
        to: staffEmail,
        subject: emailSubject,
        text: plainText,
        html: brandedHtml,
      });
      if (!result.success) throw result.error || new Error("Email failed");

      return res.status(200).json({
        success: true,
        message: "Staff notification sent",
        notifiedEmail: staffEmail,
      });
    } catch (error: unknown) {
      console.error("Staff notification error:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
      });
    }
  }
);
