export type SendBulkEmailPayload = {
  subject: string;
  html: string;
  preheader?: string;
  recipients?: string[]; // if omitted and mode=all, server will load all customers
  mode: "all" | "emails";
};

export async function sendBulkEmail(
  payload: SendBulkEmailPayload
): Promise<{ success: boolean; sent: number }> {
  let idToken: string | null = null;
  try {
    const { auth } = await import("../config/firebase");
    if (auth?.currentUser) {
      const { getIdToken } = await import("firebase/auth");
      idToken = await getIdToken(auth.currentUser, true);
    }
  } catch {
    /* ignore token retrieval failure; endpoint will reject if not authorized */
  }

  const res = await fetch("/api/admin/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || err?.error || `Email send failed (${res.status})`
    );
  }

  return res.json();
}
/**
 * Email Service
 * Handles sending emails for contact forms, order confirmations, and business notifications
 */

import nodemailer from "nodemailer";
import { logger } from "./logger";
import { sendEmailWithRetry } from "./emailSender";

// Email configuration function (called at runtime)
type EnvMap = Record<string, string | undefined>;
const safeMetaEnv = (import.meta as unknown as { env?: EnvMap }).env || {};
const readEnv = (key: string): string | undefined =>
  safeMetaEnv[key] ?? process.env[key];

const getEmailConfig = () => ({
  host: readEnv("VITE_SMTP_HOST") || readEnv("SMTP_HOST") || "smtp.gmail.com",
  port: parseInt(readEnv("VITE_SMTP_PORT") || readEnv("SMTP_PORT") || "587"),
  secure:
    (readEnv("VITE_SMTP_SECURE") || readEnv("SMTP_SECURE") || "false") ===
    "true", // true for 465, false otherwise
  auth: {
    user: readEnv("VITE_SMTP_USER") || readEnv("SMTP_USER"), // SMTP username
    pass: readEnv("VITE_SMTP_PASS") || readEnv("SMTP_PASS"), // SMTP password or app password
  },
});

// Business contact information function (called at runtime)
const getBusinessInfo = () => ({
  name: "Vortex PCs Ltd",
  email:
    (readEnv("VITE_BUSINESS_EMAIL") || readEnv("BUSINESS_EMAIL")) ??
    "info@vortexpcs.com",
  phone: "01603 975440",
  address: "123 Tech Street, London, UK",
  website: "https://www.vortexpcs.com",
});

// Create transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    const emailConfig = getEmailConfig();
    // Check if email is configured
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      logger.warn(
        "Email service not configured. Set VITE_SMTP_USER and VITE_SMTP_PASS environment variables."
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
};

// Email templates
const emailTemplates = {
  contactFormSubmission: (data: ContactFormData) => {
    const businessInfo = getBusinessInfo();
    return {
      subject: `New Contact Form Submission: ${data.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background: #000000; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(6, 182, 212, 0.15); }
              .header { background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%); color: white; padding: 32px 24px; text-align: center; position: relative; }
              .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent); }
              .logo { max-width: 180px; height: auto; margin-bottom: 20px; position: relative; z-index: 1; }
              .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; position: relative; z-index: 1; }
              .header p { font-size: 16px; opacity: 0.9; position: relative; z-index: 1; }
              .content { padding: 32px 24px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); }
              .field { margin-bottom: 20px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 16px; transition: all 0.3s; }
              .field:hover { border-color: rgba(6, 182, 212, 0.3); background: rgba(30, 41, 59, 0.7); }
              .label { font-weight: 600; color: #38bdf8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
              .value { color: #f1f5f9; font-size: 15px; line-height: 1.6; }
              .footer { padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; background: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(148, 163, 184, 0.1); }
              .footer a { color: #38bdf8; text-decoration: none; }
              .footer a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://www.vortexpcs.com/vortexpcs-logo.png" alt="Vortex PCs" class="logo">
                <h1>New Contact Submission</h1>
                <p>You have received a new message from your website</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name</div>
                  <div class="value">${data.name}</div>
                </div>
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value">${data.email}</div>
                </div>
                <div class="field">
                  <div class="label">Phone</div>
                  <div class="value">${data.phone || "Not provided"}</div>
                </div>
                <div class="field">
                  <div class="label">Enquiry Type</div>
                  <div class="value">${data.enquiryType}</div>
                </div>
                <div class="field">
                  <div class="label">Subject</div>
                  <div class="value">${data.subject}</div>
                </div>
                <div class="field">
                  <div class="label">Message</div>
                  <div class="value">${data.message.replace(
                    /\n/g,
                    "<br>"
                  )}</div>
                </div>
              </div>
              <div class="footer">
                <p>This message was sent from the contact form on <a href="${
                  businessInfo.website
                }">${businessInfo.website}</a></p>
                <p style="margin-top: 12px; color: #64748b;">© ${new Date().getFullYear()} ${
        businessInfo.name
      }. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },

  contactFormAutoReply: (data: ContactFormData) => {
    const businessInfo = getBusinessInfo();
    return {
      subject: "Thank you for contacting Vortex PCs",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank you for contacting Vortex PCs</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background: #000000; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(6, 182, 212, 0.15); }
              .header { background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%); color: white; padding: 40px 24px; text-align: center; position: relative; }
              .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent); }
              .logo { max-width: 180px; height: auto; margin-bottom: 20px; position: relative; z-index: 1; }
              .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; position: relative; z-index: 1; }
              .content { padding: 32px 24px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); }
              .content p { margin-bottom: 16px; color: #cbd5e1; font-size: 15px; }
              .highlight { background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(37, 99, 235, 0.15)); padding: 20px; border-radius: 12px; border-left: 4px solid #38bdf8; margin: 24px 0; border: 1px solid rgba(56, 189, 248, 0.2); }
              .highlight strong { color: #38bdf8; font-size: 16px; display: block; margin-bottom: 12px; }
              .highlight-text { color: #e0f2fe; line-height: 1.8; }
              .cta-box { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
              .cta-box p { margin-bottom: 12px; color: #cbd5e1; }
              .cta-link { display: inline-block; color: #38bdf8; text-decoration: none; font-weight: 600; padding: 12px 24px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; transition: all 0.3s; }
              .cta-link:hover { background: rgba(56, 189, 248, 0.2); border-color: rgba(56, 189, 248, 0.5); }
              .signature { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(148, 163, 184, 0.2); }
              .signature p { color: #94a3b8; margin-bottom: 4px; }
              .footer { padding: 24px; text-align: center; color: #64748b; font-size: 13px; background: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(148, 163, 184, 0.1); }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://www.vortexpcs.com/vortexpcs-logo.png" alt="Vortex PCs" class="logo">
                <h1>Thank You for Contacting Us</h1>
              </div>
              <div class="content">
                <p>Dear ${data.name},</p>

                <p>Thank you for reaching out to Vortex PCs. We have received your message and appreciate you taking the time to contact us.</p>

                <div class="highlight">
                  <strong>Your Enquiry Details</strong>
                  <div class="highlight-text">
                    Subject: ${data.subject}<br>
                    Enquiry Type: ${data.enquiryType}
                  </div>
                </div>

                <p>Our team will review your message and get back to you within <strong style="color: #38bdf8;">24 hours</strong> during business hours (Monday-Friday, 9AM-6PM GMT).</p>

                <div class="cta-box">
                  <p style="font-weight: 600; color: #f1f5f9;">Need immediate assistance?</p>
                  <a href="tel:${businessInfo.phone.replace(
                    /\s/g,
                    ""
                  )}" class="cta-link">Call ${businessInfo.phone}</a>
                </div>

                <div class="signature">
                  <p style="color: #e0f2fe; font-weight: 600;">Best regards,</p>
                  <p style="color: #94a3b8;">The Vortex PCs Team</p>
                  <p style="color: #64748b; font-size: 14px; margin-top: 8px;">${
                    businessInfo.email
                  } | ${businessInfo.phone}</p>
                </div>
              </div>
              <div class="footer">
                <p>${businessInfo.name} | ${businessInfo.address}</p>
                <p style="margin-top: 8px;"><a href="${
                  businessInfo.website
                }" style="color: #38bdf8; text-decoration: none;">${
        businessInfo.website
      }</a></p>
                <p style="margin-top: 12px;">© ${new Date().getFullYear()} ${
        businessInfo.name
      }. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },

  orderConfirmation: (orderData: OrderData) => {
    const businessInfo = getBusinessInfo();
    return {
      subject: `Order Confirmation - Order #${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background: #000000; padding: 20px; }
              .container { max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(16, 185, 129, 0.15); }
              .header { background: linear-gradient(135deg, #10b981 0%, #0891b2 100%); color: white; padding: 48px 24px; text-align: center; position: relative; }
              .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent); }
              .logo { max-width: 180px; height: auto; margin-bottom: 20px; position: relative; z-index: 1; }
              .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; }
              .header p { font-size: 18px; opacity: 0.95; position: relative; z-index: 1; }
              .content { padding: 32px 24px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); }
              .content p { margin-bottom: 16px; color: #cbd5e1; font-size: 15px; }
              .order-number { text-align: center; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2)); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0; }
              .order-number-label { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
              .order-number-value { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #10b981, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
              .detail-card { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 16px; }
              .detail-label { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
              .detail-value { color: #f1f5f9; font-size: 16px; font-weight: 600; }
              .status-badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
              .total-amount { font-size: 28px; font-weight: 700; color: #34d399; }
              .section-title { color: #38bdf8; font-size: 20px; font-weight: 600; margin: 32px 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid rgba(56, 189, 248, 0.2); }
              .items-list { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 20px; margin: 16px 0; }
              .item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
              .item:last-child { border-bottom: none; }
              .item-name { color: #e0f2fe; font-weight: 500; }
              .item-price { color: #34d399; font-weight: 600; }
              .address-box { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 20px; margin: 16px 0; color: #cbd5e1; line-height: 1.8; }
              .next-steps { background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(37, 99, 235, 0.1)); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 24px; margin: 32px 0; }
              .next-steps h4 { color: #38bdf8; font-size: 18px; margin-bottom: 16px; }
              .next-steps ul { list-style: none; padding: 0; }
              .next-steps li { color: #cbd5e1; padding: 10px 0; padding-left: 32px; position: relative; }
              .next-steps li:before { content: '✓'; position: absolute; left: 0; color: #34d399; font-weight: bold; font-size: 18px; }
              .signature { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(148, 163, 184, 0.2); }
              .signature p { color: #94a3b8; margin-bottom: 4px; }
              .footer { padding: 24px; text-align: center; color: #64748b; font-size: 13px; background: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(148, 163, 184, 0.1); }
              .footer a { color: #38bdf8; text-decoration: none; }
              @media only screen and (max-width: 600px) {
                .details-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://www.vortexpcs.com/vortexpcs-logo.png" alt="Vortex PCs" class="logo">
                <h1>Order Confirmed!</h1>
                <p>Thank you for choosing Vortex PCs</p>
              </div>
              <div class="content">
                <p style="font-size: 16px;">Dear <strong style="color: #f1f5f9;">${
                  orderData.customerName
                }</strong>,</p>

                <p>Thank you for your purchase! Your order has been successfully processed and confirmed. We're excited to build your dream PC!</p>

                <div class="order-number">
                  <div class="order-number-label">Order Number</div>
                  <div class="order-number-value">${orderData.orderNumber}</div>
                </div>

                <div class="details-grid">
                  <div class="detail-card">
                    <div class="detail-label">Order Date</div>
                    <div class="detail-value">${new Date(
                      orderData.orderDate
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}</div>
                  </div>
                  <div class="detail-card">
                    <div class="detail-label">Payment Status</div>
                    <div class="detail-value"><span class="status-badge">${
                      orderData.paymentStatus
                    }</span></div>
                  </div>
                </div>

                <div class="detail-card" style="text-align: center; margin: 24px 0;">
                  <div class="detail-label">Total Amount</div>
                  <div class="total-amount">£${orderData.totalAmount.toFixed(
                    2
                  )}</div>
                </div>

                <h3 class="section-title">Items Ordered</h3>
                <div class="items-list">
                  ${orderData.items
                    .map(
                      (item) => `
                    <div class="item">
                      <div>
                        <div class="item-name">${item.name}</div>
                        <div style="color: #94a3b8; font-size: 13px;">Quantity: ${
                          item.quantity
                        }</div>
                      </div>
                      <div class="item-price">£${(
                        item.price * item.quantity
                      ).toFixed(2)}</div>
                    </div>
                  `
                    )
                    .join("")}
                </div>

                <h3 class="section-title">Shipping Address</h3>
                <div class="address-box">
                  ${orderData.shippingAddress.line1}<br>
                  ${orderData.shippingAddress.city}<br>
                  ${orderData.shippingAddress.postal_code}<br>
                  ${orderData.shippingAddress.country}
                </div>

                <div class="next-steps">
                  <h4>What Happens Next?</h4>
                  <ul>
                    <li>Your order is being prepared for building</li>
                    <li>Our expert technicians will carefully assemble your PC</li>
                    <li>Rigorous testing and quality checks (24-hour stress test)</li>
                    <li>You'll receive tracking information once dispatched</li>
                    <li>Estimated delivery: 5-7 business days from completion</li>
                  </ul>
                </div>

                <p style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; padding: 16px; color: #fbbf24; margin-top: 24px;">
                  <strong>Need Help?</strong><br>
                  Contact us anytime at <a href="mailto:${
                    businessInfo.email
                  }" style="color: #38bdf8; text-decoration: none;">${
        businessInfo.email
      }</a> or call <a href="tel:${businessInfo.phone.replace(
        /\s/g,
        ""
      )}" style="color: #38bdf8; text-decoration: none;">${
        businessInfo.phone
      }</a>
                </p>

                <div class="signature">
                  <p style="color: #e0f2fe; font-weight: 600;">Best regards,</p>
                  <p style="color: #94a3b8;">The Vortex PCs Team</p>
                  <p style="color: #64748b; font-size: 14px; margin-top: 8px;">${
                    businessInfo.email
                  } | ${businessInfo.phone}</p>
                </div>
              </div>
              <div class="footer">
                <p>${businessInfo.name} | ${businessInfo.address}</p>
                <p style="margin-top: 8px;"><a href="${businessInfo.website}">${
        businessInfo.website
      }</a></p>
                <p style="margin-top: 12px;">© ${new Date().getFullYear()} ${
        businessInfo.name
      }. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },

  orderNotification: (orderData: OrderData) => {
    const businessInfo = getBusinessInfo();
    return {
      subject: `NEW ORDER RECEIVED - £${orderData.totalAmount.toFixed(2)} - ${
        orderData.customerName
      }`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Order Received</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background: #000000; padding: 20px; }
              .container { max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%); border: 2px solid rgba(245, 158, 11, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(245, 158, 11, 0.2); }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 48px 24px; text-align: center; position: relative; animation: pulse 2s ease-in-out infinite; }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.95; } }
              .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent); }
              .logo { max-width: 180px; height: auto; margin-bottom: 20px; position: relative; z-index: 1; }
              .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
              .header p { font-size: 18px; opacity: 0.95; position: relative; z-index: 1; }
              .content { padding: 32px 24px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); }
              .urgent-banner { background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(220, 38, 38, 0.2)); border: 2px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 28px; margin: 24px 0; text-align: center; }
              .urgent-banner h2 { color: #fbbf24; font-size: 24px; margin-bottom: 16px; }
              .total-highlight { font-size: 42px; font-weight: 700; background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 12px 0; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
              .info-card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 16px; }
              .info-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
              .info-value { color: #f1f5f9; font-size: 15px; font-weight: 600; }
              .section-title { color: #fbbf24; font-size: 20px; font-weight: 600; margin: 32px 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid rgba(251, 191, 36, 0.2); }
              .items-list { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 20px; margin: 16px 0; }
              .item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
              .item:last-child { border-bottom: none; }
              .item-name { color: #e0f2fe; font-weight: 500; }
              .item-price { color: #fbbf24; font-weight: 600; }
              .address-box { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 20px; margin: 16px 0; color: #cbd5e1; line-height: 1.8; }
              .action-required { background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15)); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 24px; margin: 32px 0; }
              .action-required h4 { color: #f87171; font-size: 18px; margin-bottom: 16px; }
              .action-required ul { list-style: none; padding: 0; }
              .action-required li { color: #cbd5e1; padding: 10px 0; padding-left: 32px; position: relative; font-weight: 500; }
              .action-required li:before { content: '⚡'; position: absolute; left: 0; color: #fbbf24; font-size: 18px; }
              .priority-notice { background: rgba(220, 38, 38, 0.1); border: 2px solid rgba(220, 38, 38, 0.3); border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center; }
              .priority-notice p { color: #fca5a5; font-weight: 600; font-size: 15px; }
              .footer { padding: 24px; text-align: center; color: #64748b; font-size: 13px; background: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(148, 163, 184, 0.1); }
              @media only screen and (max-width: 600px) {
                .info-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://www.vortexpcs.com/vortexpcs-logo.png" alt="Vortex PCs" class="logo">
                <h1>NEW ORDER RECEIVED</h1>
                <p>Action Required: A new order has been placed and paid for</p>
              </div>
              <div class="content">
                <div class="urgent-banner">
                  <h2>Order Summary</h2>
                  <div class="total-highlight">£${orderData.totalAmount.toFixed(
                    2
                  )}</div>
                  <p style="color: #fbbf24; font-size: 14px; margin-top: 8px;">Payment Confirmed</p>
                </div>

                <div class="info-grid">
                  <div class="info-card">
                    <div class="info-label">Order Number</div>
                    <div class="info-value">${orderData.orderNumber}</div>
                  </div>
                  <div class="info-card">
                    <div class="info-label">Customer</div>
                    <div class="info-value">${orderData.customerName}</div>
                  </div>
                  <div class="info-card">
                    <div class="info-label">Email</div>
                    <div class="info-value" style="font-size: 13px;">${
                      orderData.customerEmail
                    }</div>
                  </div>
                  <div class="info-card">
                    <div class="info-label">Order Date</div>
                    <div class="info-value">${new Date(
                      orderData.orderDate
                    ).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</div>
                  </div>
                </div>

                <h3 class="section-title">Items Ordered</h3>
                <div class="items-list">
                  ${orderData.items
                    .map(
                      (item) => `
                    <div class="item">
                      <div>
                        <div class="item-name">${item.name}</div>
                        <div style="color: #94a3b8; font-size: 13px;">Quantity: ${
                          item.quantity
                        }</div>
                      </div>
                      <div class="item-price">£${(
                        item.price * item.quantity
                      ).toFixed(2)}</div>
                    </div>
                  `
                    )
                    .join("")}
                </div>

                <h3 class="section-title">Shipping Address</h3>
                <div class="address-box">
                  <strong style="color: #f1f5f9;">${
                    orderData.customerName
                  }</strong><br>
                  ${orderData.shippingAddress.line1}<br>
                  ${orderData.shippingAddress.city}<br>
                  ${orderData.shippingAddress.postal_code}<br>
                  ${orderData.shippingAddress.country}
                </div>

                <div class="action-required">
                  <h4>Action Required - Process This Order</h4>
                  <ul>
                    <li>Log into your order management system immediately</li>
                    <li>Send build confirmation email to customer</li>
                    <li>Update inventory and reserve components</li>
                    <li>Schedule build with your technicians</li>
                    <li>Set up project tracking and quality checkpoints</li>
                  </ul>
                </div>

                <div class="priority-notice">
                  <p>HIGH PRIORITY: Customer expects confirmation within 2 hours</p>
                </div>

                <p style="margin-top: 32px; color: #94a3b8; font-size: 14px; text-align: center; font-style: italic;">
                  This is an automated notification from your Vortex PCs Order Management System
                </p>
              </div>
              <div class="footer">
                <p style="font-weight: 600; color: #94a3b8;">${
                  businessInfo.name
                } - Internal Order Notification</p>
                <p style="margin-top: 8px;">© ${new Date().getFullYear()} ${
        businessInfo.name
      }. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },
};

// Types
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  enquiryType: string;
  message: string;
}

export interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: string;
  orderDate: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    line1: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

/**
 * Send contact form email
 */
export const sendContactFormEmail = async (
  data: ContactFormData
): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.error("Email service not configured");
    return false;
  }

  const emailConfig = getEmailConfig();
  const businessInfo = getBusinessInfo();

  try {
    // Send email to business
    const businessEmail = emailTemplates.contactFormSubmission(data);
    {
      const result = await sendEmailWithRetry(transporter, {
        from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
        to: businessInfo.email,
        subject: businessEmail.subject,
        html: businessEmail.html,
      });
      if (!result.success) throw result.error || new Error("Email failed");
    }

    // Send auto-reply to customer
    const autoReply = emailTemplates.contactFormAutoReply(data);
    {
      const result = await sendEmailWithRetry(transporter, {
        from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
        to: data.email,
        subject: autoReply.subject,
        html: autoReply.html,
      });
      if (!result.success) throw result.error || new Error("Email failed");
    }

    logger.debug("✅ Contact form emails sent successfully");
    return true;
  } catch (error) {
    logger.error("❌ Failed to send contact form emails:", error);
    return false;
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
  orderData: OrderData
): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.error("Email service not configured");
    return false;
  }

  const emailConfig = getEmailConfig();
  const businessInfo = getBusinessInfo();

  try {
    const emailTemplate = emailTemplates.orderConfirmation(orderData);
    const result = await sendEmailWithRetry(transporter, {
      from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
      to: orderData.customerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
    if (!result.success) throw result.error || new Error("Email failed");

    logger.debug("✅ Order confirmation email sent successfully");
    return true;
  } catch (error) {
    logger.error("❌ Failed to send order confirmation email:", error);
    return false;
  }
};

/**
 * Send order notification to business
 */
export const sendOrderNotificationEmail = async (
  orderData: OrderData,
  businessEmail?: string
): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.error("Email service not configured");
    return false;
  }

  const emailConfig = getEmailConfig();
  const businessInfo = getBusinessInfo();

  try {
    const emailTemplate = emailTemplates.orderNotification(orderData);
    const result = await sendEmailWithRetry(transporter, {
      from: `"${businessInfo.name}" <${emailConfig.auth.user}>`,
      to: businessEmail || businessInfo.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
    if (!result.success) throw result.error || new Error("Email failed");

    logger.debug("✅ Order notification email sent successfully");
    return true;
  } catch (error) {
    logger.error("❌ Failed to send order notification email:", error);
    return false;
  }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async (): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    logger.debug("✅ Email configuration is valid");
    return true;
  } catch (error) {
    logger.error("❌ Email configuration test failed:", error);
    return false;
  }
};

export default {
  sendContactFormEmail,
  sendOrderConfirmationEmail,
  sendOrderNotificationEmail,
  testEmailConfiguration,
};
