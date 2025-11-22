import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildBrandedEmailHtml } from "../../services/emailTemplate";
import nodemailer from "nodemailer";

/**
 * Test Order Email Endpoint
 * Sends a synthetic customer + business order email using current SMTP config.
 * Use: GET /api/email/test-order?to=customer@example.com
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const to = (req.query.to as string) || process.env.TEST_EMAIL_TO || "";

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
    return res.status(500).json({ ok: false, message: "SMTP config missing" });
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
      const info = await transporter.sendMail({
        from: `"Vortex PCs" <${smtpUser}>`,
        to,
        subject: `Diagnostic Order Confirmation ${fakeOrderId}`,
        text: `Diagnostic order test (plain text) id: ${fakeOrderId}`,
        html: customerHtml,
      });
      results.customer = {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
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
    const info = await transporter.sendMail({
      from: `"Vortex PCs Orders" <${smtpUser}>`,
      to: businessEmail,
      subject: `Diagnostic Order Received ${fakeOrderId}`,
      text: `Diagnostic test order received (plain text) id: ${fakeOrderId}`,
      html: businessHtml,
    });
    results.business = {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };
  } catch (err) {
    results.business = { error: (err as Error).message };
  }

  return res.status(200).json(results);
}
