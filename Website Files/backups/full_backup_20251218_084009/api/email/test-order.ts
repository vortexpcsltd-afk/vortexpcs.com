import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildBrandedEmailHtml } from "../../services/emailTemplate.js";
import nodemailer from "nodemailer";
import { parseQuery, querySchemas } from "../utils/queryValidation";
import { sendEmailWithRetry } from "../../services/emailSender.js";

/**
 * Test Order Email Endpoint
 * Sends a synthetic customer + business order email using current SMTP config.
 * Use: GET /api/email/test-order?to=customer@example.com
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const query = parseQuery(req, res, querySchemas.emailTestOrder);
  if (!query) return; // Validation error already sent

  const to = query.to || process.env.TEST_EMAIL_TO || "";

  const smtpHost = process.env.VITE_SMTP_HOST || process.env.SMTP_HOST;
  const smtpUser = process.env.VITE_SMTP_USER || process.env.SMTP_USER;
  const smtpPass = process.env.VITE_SMTP_PASS || process.env.SMTP_PASS;
  const smtpPortStr =
    process.env.VITE_SMTP_PORT || process.env.SMTP_PORT || "465";
  const smtpSecureStr = process.env.VITE_SMTP_SECURE || process.env.SMTP_SECURE;
  const smtpPort = parseInt(smtpPortStr, 10);
  const secure =
    typeof smtpSecureStr === "string"
      ? smtpSecureStr === "true"
      : smtpPort === 465;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("SMTP config missing in test-order endpoint", {
      hasHost: Boolean(smtpHost),
      hasUser: Boolean(smtpUser),
    });
    return res.status(503).json({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Service temporarily unavailable",
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: { user: smtpUser, pass: smtpPass },
    logger: true,
    debug: true,
  });

  try {
    await transporter.verify();
  } catch (err) {
    console.warn("SMTP verify failed (continuing):", err);
  }

  const fakeOrderId = "TEST-" + Date.now();
  const itemsHtml = `<table width='100%' style='border-collapse:collapse;margin:16px 0;background:#0b1220;border:1px solid rgba(255,255,255,0.06);border-radius:10px;overflow:hidden'>
    <thead><tr style='background:rgba(14,165,233,0.08)'>
      <th style='padding:12px;text-align:left;font-size:12px;color:#9ca3af'>Item</th>
      <th style='padding:12px;text-align:center;font-size:12px;color:#9ca3af'>Qty</th>
      <th style='padding:12px;text-align:right;font-size:12px;color:#9ca3af'>Price</th>
    </tr></thead>
    <tbody>
      <tr><td style='padding:12px;color:#e5e7eb;font-size:14px'>Diagnostic Test Build</td><td style='padding:12px;text-align:center;color:#e5e7eb;font-size:14px'>1</td><td style='padding:12px;text-align:right;color:#0ea5e9;font-weight:600;font-size:14px'>£1.00</td></tr>
    </tbody>
  </table>`;

  const customerContent = `<p style='color:#e5e7eb;font-size:16px'>Hi Tester,</p>
  <p style='color:#e5e7eb;font-size:16px'>This is a diagnostic order email using the live template system.</p>
  ${itemsHtml}
  <p style='color:#e5e7eb;font-size:14px'>Total Paid: <strong style='color:#0ea5e9'>£1.00</strong></p>`;

  const customerHtml = buildBrandedEmailHtml({
    title: "Diagnostic Order Confirmation",
    preheader: `Test order ${fakeOrderId} confirmation`,
    contentHtml: customerContent,
    accentFrom: "#0ea5e9",
    accentTo: "#2563eb",
  });

  const businessHtml = buildBrandedEmailHtml({
    title: "Diagnostic Order Received",
    preheader: `Test order ${fakeOrderId}`,
    contentHtml: `<p style='color:#e5e7eb;font-size:14px'>A test order email was triggered.</p>${itemsHtml}`,
    accentFrom: "#059669",
    accentTo: "#10b981",
  });

  const results: any = { ok: true, customer: null, business: null };

  // Send customer email if 'to' provided
  if (to) {
    try {
      const r = await sendEmailWithRetry(transporter, {
        from: `"Vortex PCs" <${smtpUser}>`,
        to,
        subject: `Diagnostic Order Confirmation ${fakeOrderId}`,
        text: `Diagnostic order test (plain text) id: ${fakeOrderId}`,
        html: customerHtml,
      });
      if (!r.success) throw r.error || new Error("Email failed");
      results.customer = {
        messageId: r.info?.messageId,
        accepted: (r.info as any)?.accepted,
        rejected: (r.info as any)?.rejected,
        response: (r.info as any)?.response,
      };
    } catch (err) {
      results.customer = { error: (err as Error).message };
    }
  } else {
    results.customer = { skipped: true, reason: "No ?to= param provided" };
  }

  // Always send business email to business address
  const businessEmail =
    process.env.VITE_BUSINESS_EMAIL || process.env.BUSINESS_EMAIL || smtpUser;
  try {
    const r = await sendEmailWithRetry(transporter, {
      from: `"Vortex PCs Orders" <${smtpUser}>`,
      to: businessEmail,
      subject: `Diagnostic Order Received ${fakeOrderId}`,
      text: `Diagnostic test order received (plain text) id: ${fakeOrderId}`,
      html: businessHtml,
    });
    if (!r.success) throw r.error || new Error("Email failed");
    results.business = {
      messageId: r.info?.messageId,
      accepted: (r.info as any)?.accepted,
      rejected: (r.info as any)?.rejected,
      response: (r.info as any)?.response,
    };
  } catch (err) {
    results.business = { error: (err as Error).message };
  }

  if (
    (results.customer && (results.customer as any).error) ||
    (results.business && (results.business as any).error)
  ) {
    console.error("Test-order email send failed", {
      customer: results.customer,
      business: results.business,
    });
    return res.status(502).json({
      ok: false,
      code: "EMAIL_DELIVERY_FAILED",
      message: "Email delivery failed",
    });
  }

  return res.status(200).json(results);
}
