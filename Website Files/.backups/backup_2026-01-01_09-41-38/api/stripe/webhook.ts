import Stripe from "stripe";
import nodemailer from "nodemailer";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { StripeError } from "../../types/api";
import admin from "firebase-admin";
import { buildBrandedEmailHtml } from "../../services/emailTemplate.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import {
  awardPurchasePoints,
  triggerVaultOrderReceiptEmail,
  redeemPoints,
  POINTS_PER_POUND_VALUE,
} from "../../services/vortexVault";

// =============================================
// VERSION MARKER (for deployment verification)
// Update this string whenever webhook logic changes.
// =============================================
const WEBHOOK_VERSION = "webhook-v2.1.1-diagnostics";

/**
 * VORTEX PCS - STRIPE WEBHOOK HANDLER V2
 * Complete rewrite for reliable order processing
 *
 * Flow:
 * 1. Verify Stripe signature
 * 2. Extract order data from metadata (primary source)
 * 3. Send confirmation emails (customer + business)
 * 4. Save order to Firestore with correct userId
 * 5. Decrement inventory
 */

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  category?: string;
  image?: string;
  ean?: string;
}

interface EmailOrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  items: Array<{ name: string; price: number; quantity: number; ean?: string }>;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
  shippingMethod?: string;
  shippingCost?: number;
}

// =====================================================
// FIREBASE INITIALIZATION
// =====================================================

function initializeFirebase() {
  if (admin.apps.length) {
    return admin.firestore();
  }

  const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!credsBase64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not configured");
  }

  const creds = JSON.parse(
    Buffer.from(credsBase64, "base64").toString("utf-8")
  );
  admin.initializeApp({ credential: admin.credential.cert(creds) });

  return admin.firestore();
}

// =====================================================
// EMAIL SENDING (Using Nodemailer)
// =====================================================

async function sendOrderEmails(orderData: EmailOrderData): Promise<void> {
  console.log("📧 ============================================");
  console.log("📧 STARTING EMAIL SEND PROCESS");
  console.log("📧 ============================================");
  console.log("📧 Customer Email:", orderData.customerEmail);
  console.log("📧 Customer Name:", orderData.customerName);
  console.log("📧 Order Number:", orderData.orderNumber);
  console.log("📧 Items Count:", orderData.items.length);
  console.log("📧 Total Amount: £", orderData.totalAmount);

  // Try multiple environment variable naming conventions
  const businessEmail = process.env.BUSINESS_EMAIL || "info@vortexpcs.com";

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPortStr = process.env.SMTP_PORT || "465";
  const smtpSecureStr = process.env.SMTP_SECURE;
  const smtpPort = parseInt(smtpPortStr, 10);
  const secure =
    typeof smtpSecureStr === "string"
      ? smtpSecureStr === "true"
      : smtpPort === 465;

  console.log("📧 Environment Variables Check:");
  console.log(
    "   SMTP Host (SMTP_HOST):",
    process.env.SMTP_HOST ? "✓ Set" : "✗ Not Set"
  );
  console.log(
    "   SMTP User (SMTP_USER):",
    process.env.SMTP_USER ? "✓ Set" : "✗ Not Set"
  );
  console.log(
    "   SMTP Pass (SMTP_PASS):",
    process.env.SMTP_PASS ? "✓ Set" : "✗ Not Set"
  );
  console.log("   Business Email:", businessEmail);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("❌ ============================================");
    console.error("❌ CRITICAL: SMTP CONFIGURATION MISSING");
    console.error("❌ ============================================");
    console.error("❌ Configuration Status:");
    console.error("   SMTP Host:", smtpHost || "❌ NOT SET");
    console.error("   SMTP User:", smtpUser || "❌ NOT SET");
    console.error("   SMTP Pass:", smtpPass ? "✓ Set" : "❌ NOT SET");
    console.error("❌ ============================================");
    console.error("❌ ACTION REQUIRED:");
    console.error(
      "   1. Go to Vercel Dashboard → Settings → Environment Variables"
    );
    console.error("   2. Add the following variables for Production:");
    console.error("      - SMTP_HOST (e.g., mail.spacemail.com)");
    console.error("      - SMTP_USER (e.g., accounts@vortexpcs.com)");
    console.error("      - SMTP_PASS (your SMTP password)");
    console.error("      - SMTP_PORT (465 for SSL, 587 for TLS)");
    console.error("      - BUSINESS_EMAIL (e.g., info@vortexpcs.com)");
    console.error("   3. Redeploy the application");
    console.error("❌ ============================================");
    throw new Error(
      "SMTP configuration missing - ORDER CREATED BUT EMAILS NOT SENT! Check Vercel environment variables."
    );
  }

  console.log("✅ SMTP Configuration Found:");
  console.log("   Host:", smtpHost);
  console.log("   User:", smtpUser);
  console.log("   Port:", smtpPort);
  console.log("   Secure:", secure);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: { user: smtpUser, pass: smtpPass },
    logger: true,
    debug: true,
  });
  // Persist email attempt diagnostics to Firestore (best-effort; silent on failure)
  async function logEmailAttempt(entry: {
    kind: "customer" | "business" | "aggregate" | "config";
    orderNumber: string;
    to?: string;
    success: boolean;
    message?: string;
    errorType?: string;
    errorStack?: string;
    smtpHost?: string;
    smtpUser?: string;
    accepted?: unknown;
    rejected?: unknown;
  }) {
    try {
      if (!admin.apps.length) {
        const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (!credsBase64) return; // no credentials => skip logging
        const creds = JSON.parse(
          Buffer.from(credsBase64, "base64").toString("utf-8")
        );
        admin.initializeApp({ credential: admin.credential.cert(creds) });
      }
      const db = admin.firestore();
      await db.collection("email_logs").add({
        ...entry,
        timestamp: admin.firestore.Timestamp.now(),
        env: {
          hostPresent: !!smtpHost,
          userPresent: !!smtpUser,
          passPresent: !!smtpPass,
          port: smtpPort,
          secure,
        },
        webhookVersion: WEBHOOK_VERSION,
      });
    } catch (e) {
      console.warn("⚠️ Failed to persist email log", e);
    }
  }
  // Record configuration success state
  logEmailAttempt({
    kind: "config",
    orderNumber: orderData.orderNumber,
    success: true,
    smtpHost,
    smtpUser,
    message: "SMTP config detected",
  });

  console.log("🔧 Testing SMTP connection...");
  try {
    await transporter.verify();
    console.log("✅ SMTP transporter verified successfully");
    console.log("✅ Connection to", smtpHost, "established");
  } catch (e) {
    console.error("❌ ============================================");
    console.error("❌ SMTP VERIFICATION FAILED");
    console.error("❌ ============================================");
    console.error("❌ Error:", e);
    console.error("❌ This usually means:");
    console.error("   1. SMTP credentials are incorrect");
    console.error("   2. SMTP server is blocking connections");
    console.error("   3. Port", smtpPort, "is not accessible");
    console.error("   4. Authentication method not supported");
    console.error("❌ ============================================");
    console.error("❌ Will attempt to send anyway...");
    // Continue; some providers fail verify but still send
  }

  const itemsRows = orderData.items
    .map(
      (i) =>
        `<tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e5e7eb; font-size: 14px;">${
            i.name
          }${
          i.ean
            ? `<div style="margin-top:6px;color:#9ca3af;font-size:12px;">EAN: ${i.ean}</div>`
            : ""
        }</td>
          <td style="padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center; color: #e5e7eb; font-size: 14px;">${
            i.quantity
          }</td>
          <td style="padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; color: #e5e7eb; font-size: 14px;">£${i.price.toFixed(
            2
          )}</td>
          <td style="padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; font-weight: 600; color: #0ea5e9; font-size: 15px;">£${(
            i.price * i.quantity
          ).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const customerContentHtml = `
    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #e5e7eb;">
      Hi <strong style="color: #fff;">${orderData.customerName}</strong>,
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #e5e7eb;">
      We've received your order and we're getting started on building your custom PC right away!
    </p>
    
    <div style="margin: 24px 0; padding: 18px; background: #0b1220; border: 1px solid rgba(14,165,233,0.3); border-radius: 10px;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px;">Order Number</p>
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #0ea5e9;">#${
        orderData.orderNumber
      }</p>
    </div>
    
    <h2 style="margin: 32px 0 16px; font-size: 18px; font-weight: 600; color: #fff;">Order Details</h2>

    <div style="margin: 0 0 20px; padding:16px; background:#0b1220; border:1px solid rgba(255,255,255,0.06); border-radius:10px;">
      <p style="margin:0 0 6px; font-size:12px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.8px;">Shipping Method</p>
      <p style="margin:0; font-size:14px; color:#e5e7eb;">
        <strong style="color:#0ea5e9; text-transform:capitalize;">${(
          orderData.shippingMethod || "free"
        ).replace("-", " ")}</strong>
        — £${(orderData.shippingCost || 0).toFixed(2)}
      </p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #0b1220; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
      <thead>
        <tr style="background: rgba(14,165,233,0.08);">
          <th style="padding: 14px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Item</th>
          <th style="padding: 14px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Qty</th>
          <th style="padding: 14px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Price</th>
          <th style="padding: 14px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color:#e5e7eb;">Shipping (${(
            orderData.shippingMethod || "free"
          ).replace("-", " ")})</td>
          <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color:#0ea5e9;">£${(
            orderData.shippingCost || 0
          ).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 18px 12px 16px; text-align: right; font-size: 16px; font-weight: 600; color: #fff; border-top: 2px solid rgba(14,165,233,0.3);">
            Total Paid:
          </td>
          <td style="padding: 18px 12px 16px; text-align: right; font-size: 20px; font-weight: 700; color: #0ea5e9; border-top: 2px solid rgba(14,165,233,0.3);">
            £${orderData.totalAmount.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
    ${
      orderData.shippingAddress
        ? `
    <div style="margin: 28px 0 0; padding: 20px; background: #0b1220; border: 1px solid rgba(14,165,233,0.3); border-radius: 10px;">
      <p style="margin:0 0 8px; font-size:14px; font-weight:600; color:#0ea5e9;">Shipping Address</p>
      <p style="margin:0; font-size:14px; line-height:1.7; color:#e5e7eb;">
        ${orderData.customerName}<br/>
        ${orderData.shippingAddress.line1}${
            orderData.shippingAddress.line2
              ? `<br/>${orderData.shippingAddress.line2}`
              : ""
          }<br/>
        ${orderData.shippingAddress.city}<br/>
        ${orderData.shippingAddress.postal_code}<br/>
        ${orderData.shippingAddress.country}
      </p>
    </div>`
        : ""
    }
    
    <div style="margin: 28px 0 0; padding: 20px; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: 10px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #60a5fa;">What's Next?</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #e5e7eb;">
        Our team will begin building your PC immediately. You'll receive updates as your build progresses through assembly, testing, and quality control.
      </p>
    </div>
  `;

  const customerHtml = buildBrandedEmailHtml({
    title: "Thank you for your order!",
    preheader: `Your order #${orderData.orderNumber} has been confirmed`,
    contentHtml: customerContentHtml,
    accentFrom: "#0ea5e9",
    accentTo: "#2563eb",
  });

  const businessContentHtml = `
    <div style="margin: 0 0 24px; padding: 18px; background: #0b1220; border: 1px solid rgba(16,185,129,0.3); border-radius: 10px;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px;">Order Number</p>
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #10b981;">#${
        orderData.orderNumber
      }</p>
    </div>
    
    <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #fff;">Customer Information</h2>
    <div style="margin: 0 0 24px; padding: 16px; background: #0b1220; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #e5e7eb;"><strong style="color: #9ca3af;">Name:</strong> ${
        orderData.customerName
      }</p>
      <p style="margin: 0; font-size: 14px; color: #e5e7eb;"><strong style="color: #9ca3af;">Email:</strong> ${
        orderData.customerEmail
      }</p>
    </div>
    
    <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #fff;">Order Details</h2>

    <div style="margin: 0 0 16px; padding:12px 16px; background:#0b1220; border:1px solid rgba(255,255,255,0.06); border-radius:8px;">
      <p style="margin:0; font-size:13px; color:#e5e7eb;">
        <strong style="color:#10b981;">Shipping:</strong> ${(
          orderData.shippingMethod || "free"
        ).replace("-", " ")} (£${(orderData.shippingCost || 0).toFixed(2)})
      </p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #0b1220; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
      <thead>
        <tr style="background: rgba(16,185,129,0.08);">
          <th style="padding: 14px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Item</th>
          <th style="padding: 14px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Qty</th>
          <th style="padding: 14px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Price</th>
          <th style="padding: 14px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color:#e5e7eb;">Shipping (${(
            orderData.shippingMethod || "free"
          ).replace("-", " ")})</td>
          <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color:#10b981;">£${(
            orderData.shippingCost || 0
          ).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 18px 12px 16px; text-align: right; font-size: 16px; font-weight: 600; color: #fff; border-top: 2px solid rgba(16,185,129,0.3);">
            Order Total:
          </td>
          <td style="padding: 18px 12px 16px; text-align: right; font-size: 20px; font-weight: 700; color: #10b981; border-top: 2px solid rgba(16,185,129,0.3);">
            £${orderData.totalAmount.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
    ${
      orderData.shippingAddress
        ? `
    <div style="margin: 12px 0 24px; padding: 16px; background:#0b1220; border:1px solid rgba(16,185,129,0.3); border-radius:8px;">
      <p style="margin:0 0 6px; font-size:12px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.8px;">Shipping Address</p>
      <p style="margin:0; font-size:14px; line-height:1.6; color:#e5e7eb;">
        ${orderData.customerName}<br/>
        ${orderData.shippingAddress.line1}${
            orderData.shippingAddress.line2
              ? `<br/>${orderData.shippingAddress.line2}`
              : ""
          }<br/>
        ${orderData.shippingAddress.city}<br/>
        ${orderData.shippingAddress.postal_code}<br/>
        ${orderData.shippingAddress.country}
      </p>
    </div>`
        : ""
    }
  `;

  const businessHtml = buildBrandedEmailHtml({
    title: "New Order Received",
    preheader: `Order #${orderData.orderNumber} from ${orderData.customerName}`,
    contentHtml: businessContentHtml,
    accentFrom: "#059669",
    accentTo: "#10b981",
  });

  const sendPromises: Promise<unknown>[] = [];
  if (orderData.customerEmail && orderData.customerEmail.trim()) {
    const customerText = `Thank you for your order\n\nOrder #${
      orderData.orderNumber
    }\n\nHi ${
      orderData.customerName
    }, we've received your order.\n\nItems:\n${orderData.items
      .map(
        (i) =>
          `  ${i.name} x${i.quantity} - £${i.price.toFixed(2)}${
            i.ean ? ` (EAN: ${i.ean})` : ""
          }`
      )
      .join("\n")}\n\nTotal Paid: £${orderData.totalAmount.toFixed(2)}`;

    sendPromises.push(
      (async () => {
        console.log("📤 ============================================");
        console.log("📤 SENDING CUSTOMER EMAIL");
        console.log("📤 ============================================");
        console.log("📤 To:", orderData.customerEmail);
        console.log("📤 Subject: Order Confirmation -", orderData.orderNumber);
        try {
          const info = await transporter.sendMail({
            from: `"Vortex PCs" <${smtpUser}>`,
            to: orderData.customerEmail,
            subject: `Order Confirmation - ${orderData.orderNumber}`,
            text: customerText,
            html: customerHtml,
            replyTo: businessEmail,
          });
          console.log("✅ ============================================");
          console.log("✅ CUSTOMER EMAIL SENT SUCCESSFULLY");
          console.log("✅ ============================================");
          console.log("✅ Message ID:", info.messageId);
          console.log("✅ Accepted:", JSON.stringify(info.accepted));
          console.log("✅ Rejected:", JSON.stringify(info.rejected));
          console.log("✅ Response:", info.response);
          console.log("✅ ============================================");
          if (Array.isArray(info.accepted) && info.accepted.length === 0) {
            console.warn(
              "⚠️ WARNING: Accepted array is empty - email may not have been delivered"
            );
            console.warn(
              "⚠️ This could indicate a provider issue or rate limiting"
            );
          }
          logEmailAttempt({
            kind: "customer",
            orderNumber: orderData.orderNumber,
            to: orderData.customerEmail,
            success: true,
            smtpHost,
            smtpUser,
            accepted: info.accepted,
            rejected: info.rejected,
            message: String(info.response || "sent"),
          });
        } catch (err) {
          console.error("❌ ============================================");
          console.error("❌ CUSTOMER EMAIL FAILED");
          console.error("❌ ============================================");
          console.error("❌ Recipient:", orderData.customerEmail);
          console.error(
            "❌ Error Type:",
            err instanceof Error ? err.constructor.name : typeof err
          );
          console.error(
            "❌ Error Message:",
            err instanceof Error ? err.message : String(err)
          );
          console.error("❌ Full Error:", err);
          console.error("❌ ============================================");
          logEmailAttempt({
            kind: "customer",
            orderNumber: orderData.orderNumber,
            to: orderData.customerEmail,
            success: false,
            smtpHost,
            smtpUser,
            message: err instanceof Error ? err.message : String(err),
            errorType: err instanceof Error ? err.constructor.name : typeof err,
            errorStack: err instanceof Error ? err.stack : undefined,
          });
          throw err;
        }
      })()
    );
  } else {
    console.warn("⚠️ ============================================");
    console.warn("⚠️ NO CUSTOMER EMAIL PROVIDED");
    console.warn("⚠️ ============================================");
    console.warn("⚠️ Order data:", JSON.stringify(orderData, null, 2));
    console.warn("⚠️ Customer will NOT receive order confirmation!");
    console.warn("⚠️ ============================================");
  }

  const businessText = `New Order: #${orderData.orderNumber}\n\nCustomer: ${
    orderData.customerName
  } (${orderData.customerEmail})\n\nItems:\n${orderData.items
    .map(
      (i) =>
        `  ${i.name} x${i.quantity} - £${i.price.toFixed(2)}${
          i.ean ? ` (EAN: ${i.ean})` : ""
        }`
    )
    .join("\n")}\n\nTotal: £${orderData.totalAmount.toFixed(2)}`;

  sendPromises.push(
    (async () => {
      console.log("📤 ============================================");
      console.log("📤 SENDING BUSINESS NOTIFICATION EMAIL");
      console.log("📤 ============================================");
      console.log("📤 To:", businessEmail);
      console.log(
        "📤 Subject: New Order:",
        orderData.orderNumber,
        "- £",
        orderData.totalAmount.toFixed(2)
      );
      try {
        const info = await transporter.sendMail({
          from: `"Vortex PCs Orders" <${smtpUser}>`,
          to: businessEmail,
          subject: `New Order: ${
            orderData.orderNumber
          } - £${orderData.totalAmount.toFixed(2)}`,
          text: businessText,
          html: businessHtml,
        });
        console.log("✅ ============================================");
        console.log("✅ BUSINESS EMAIL SENT SUCCESSFULLY");
        console.log("✅ ============================================");
        console.log("✅ Message ID:", info.messageId);
        console.log("✅ Accepted:", JSON.stringify(info.accepted));
        console.log("✅ Rejected:", JSON.stringify(info.rejected));
        console.log("✅ Response:", info.response);
        console.log("✅ ============================================");
        if (Array.isArray(info.accepted) && info.accepted.length === 0) {
          console.warn("⚠️ WARNING: Business email accepted array empty");
          console.warn("⚠️ Admin may not receive order notification!");
        }
        logEmailAttempt({
          kind: "business",
          orderNumber: orderData.orderNumber,
          to: businessEmail,
          success: true,
          smtpHost,
          smtpUser,
          accepted: info.accepted,
          rejected: info.rejected,
          message: String(info.response || "sent"),
        });
      } catch (err) {
        console.error("❌ ============================================");
        console.error("❌ BUSINESS EMAIL FAILED");
        console.error("❌ ============================================");
        console.error("❌ Recipient:", businessEmail);
        console.error(
          "❌ Error Type:",
          err instanceof Error ? err.constructor.name : typeof err
        );
        console.error(
          "❌ Error Message:",
          err instanceof Error ? err.message : String(err)
        );
        console.error("❌ Full Error:", err);
        console.error("❌ ============================================");
        console.error("❌ CRITICAL: Admin will NOT be notified of this order!");
        console.error("❌ ============================================");
        logEmailAttempt({
          kind: "business",
          orderNumber: orderData.orderNumber,
          to: businessEmail,
          success: false,
          smtpHost,
          smtpUser,
          message: err instanceof Error ? err.message : String(err),
          errorType: err instanceof Error ? err.constructor.name : typeof err,
          errorStack: err instanceof Error ? err.stack : undefined,
        });
        throw err;
      }
    })()
  );

  try {
    await Promise.all(sendPromises);
    console.log("✅ ============================================");
    console.log("✅ ALL EMAILS SENT SUCCESSFULLY");
    console.log("✅ ============================================");
    console.log("✅ Order:", orderData.orderNumber);
    console.log("✅ Customer notified:", !!orderData.customerEmail);
    console.log("✅ Business notified: YES");
    console.log("✅ ============================================");
  } catch (aggregateErr) {
    console.error("❌ ============================================");
    console.error("❌ EMAIL SENDING FAILED (AGGREGATE ERROR)");
    console.error("❌ ============================================");
    console.error("❌ One or more emails failed to send");
    console.error("❌ Aggregate Error:", aggregateErr);
    console.error("❌ ============================================");
    console.error("❌ ORDER WAS CREATED BUT EMAILS FAILED!");
    console.error("❌ Manual notification may be required!");
    console.error("❌ ============================================");
    logEmailAttempt({
      kind: "aggregate",
      orderNumber: orderData.orderNumber,
      success: false,
      smtpHost,
      smtpUser,
      message:
        aggregateErr instanceof Error
          ? aggregateErr.message
          : String(aggregateErr),
      errorType:
        aggregateErr instanceof Error
          ? aggregateErr.constructor.name
          : typeof aggregateErr,
      errorStack:
        aggregateErr instanceof Error ? aggregateErr.stack : undefined,
    });
    throw aggregateErr;
  }
}

// =====================================================
// ORDER DATA EXTRACTION
// =====================================================

/**
 * Generate a readable order ID - now uses generateOrderNumber utility
 * This function is kept for backward compatibility but delegates to the new utility
 */
async function generateOrderId(userId: string = "guest"): Promise<string> {
  try {
    const db = admin.apps.length > 0 ? admin.firestore() : undefined;
    return await generateOrderNumber(userId, db);
  } catch (error) {
    console.error("Failed to generate order number, using fallback:", error);
    // Fallback to simple format if generation fails
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `VXG-${year}${month}${day}-${code}`;
  }
}

function extractOrderItems(session: Stripe.Checkout.Session): OrderItem[] {
  console.log("📦 Extracting order items from session...");
  console.log("  Session metadata:", JSON.stringify(session.metadata, null, 2));

  // PRIORITY 1: metadata.components (most detailed - individual components)
  if (session.metadata?.components) {
    try {
      console.log("  ✓ Found components metadata - using as primary source");
      const decoded = Buffer.from(
        session.metadata.components,
        "base64"
      ).toString("utf-8");
      const parsed = JSON.parse(decoded) as Array<{
        id: string;
        n: string;
        p: number;
        cat: string;
        e?: string;
      }>;

      if (Array.isArray(parsed) && parsed.length > 0) {
        const items = parsed.map((c) => ({
          productId: c.id || "component",
          productName: c.n || "Component",
          quantity: 1,
          price: c.p,
          category: c.cat || "",
          ean: c.e,
        }));
        console.log(
          `  ✅ Extracted ${items.length} items from components metadata`
        );
        return items;
      }
    } catch (e) {
      console.warn("  ⚠️ Failed to parse components metadata:", e);
    }
  }

  // PRIORITY 2: metadata.cart (cart items with names)
  if (session.metadata?.cart) {
    try {
      console.log("  ✓ Found cart metadata - using as secondary source");
      const decoded = Buffer.from(session.metadata.cart, "base64").toString(
        "utf-8"
      );
      const parsed = JSON.parse(decoded) as Array<{
        id: string;
        n: string;
        p: number;
        q: number;
        img?: string;
        e?: string;
      }>;

      if (Array.isArray(parsed) && parsed.length > 0) {
        const items = parsed.map((item) => ({
          productId: item.id || "unknown",
          productName: item.n || "Item",
          quantity: item.q || 1,
          price: item.p,
          image: item.img,
          ean: item.e,
        }));
        console.log(`  ✅ Extracted ${items.length} items from cart metadata`);
        return items;
      }
    } catch (e) {
      console.warn("  ⚠️ Failed to parse cart metadata:", e);
    }
  }

  // FALLBACK: Use line_items (least reliable - generic names)
  if (session.line_items?.data && session.line_items.data.length > 0) {
    console.log("  ⚠️ Using line_items as fallback - names may be generic");
    const items = session.line_items.data.map((li) => ({
      productId: String(li.price?.product || "unknown"),
      productName: li.description || "Custom PC Build",
      quantity: li.quantity || 1,
      price: (li.amount_total || 0) / 100 / Math.max(li.quantity || 1, 1),
    }));
    console.log(`  ✅ Extracted ${items.length} items from line_items`);
    return items;
  }

  // LAST RESORT: Create single generic item
  console.warn("  ⚠️ No item data found - creating generic item");
  return [
    {
      productId: "custom_build",
      productName: "Custom PC Build",
      quantity: 1,
      price: (session.amount_total || 0) / 100,
    },
  ];
}

// =====================================================
// MAIN WEBHOOK HANDLER
// =====================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("=====================================");
  console.log("🔔 WEBHOOK RECEIVED:", new Date().toISOString());
  console.log("=====================================");
  console.log("🚀 Webhook Version:", WEBHOOK_VERSION);
  // Runtime environment diagnostics (non-sensitive truncation)
  try {
    const keyPrefix = process.env.STRIPE_SECRET_KEY
      ? process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")
        ? "sk_test_*"
        : process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")
        ? "sk_live_*"
        : "unknown-format"
      : "missing";
    console.log("🔐 Stripe Secret Key Mode:", keyPrefix);
    console.log(
      "🔐 Webhook Secret Present:",
      webhookSecret ? "yes" : "no",
      "len:",
      webhookSecret?.length || 0
    );
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn(
        "⚠️ STRIPE_SECRET_KEY missing at runtime – webhook will not validate test/live events."
      );
    }
    if (!webhookSecret) {
      console.warn(
        "⚠️ STRIPE_WEBHOOK_SECRET missing – signature verification will fail."
      );
    }
  } catch (diagErr) {
    console.warn("⚠️ Failed to run diagnostics:", diagErr);
  }
  // ===== GLOBAL FAIL-SAFE WRAPPER =====
  try {
    if (req.method !== "POST") {
      console.error("❌ Invalid method:", req.method);
      return res
        .status(405)
        .json({ message: "Method not allowed", version: WEBHOOK_VERSION });
    }

    // Verify signature
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      console.error("❌ Missing stripe-signature header");
      return res.status(400).json({
        message: "Missing stripe-signature",
        version: WEBHOOK_VERSION,
      });
    }

    let event: Stripe.Event;

    try {
      const buf = await getRawBody(req);
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
      console.log("✅ Signature verified. Event type:", event.type);
    } catch (err: unknown) {
      const error = err as StripeError;
      console.error("❌ Signature verification failed:", error.message);
      console.error(
        "🧪 Webhook Version (on signature failure):",
        WEBHOOK_VERSION
      );
      return res.status(400).json({
        message: `Webhook Error: ${error.message}`,
        version: WEBHOOK_VERSION,
      });
    }

    // Handle payment_intent.succeeded (for Payment Intents API)
    if (event.type === "payment_intent.succeeded") {
      try {
        console.log("💳 Processing payment_intent.succeeded");

        // Initialize Firebase (email sending should proceed even if this fails)
        let db: admin.firestore.Firestore | null = null;
        try {
          db = initializeFirebase();
          console.log("✅ Firebase initialized");
        } catch (fbErr) {
          console.error(
            "⚠️ Firebase init failed (will still attempt email send):",
            fbErr
          );
        }

        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("✅ Payment Intent retrieved:", paymentIntent.id);

        // Extract order data from metadata
        const metadata = paymentIntent.metadata || {};
        const userId = metadata.userId || "guest";

        // Generate readable order ID based on customer type
        const orderId = await generateOrderId(userId);
        console.log("📋 Generated Order ID:", orderId);

        const customerEmail = metadata.customerEmail || "";

        // Extract customer name from multiple possible sources
        // Note: Stripe SDK types don't include expanded charges.data[] by default
        const expandedPaymentIntent = paymentIntent as Stripe.PaymentIntent & {
          charges?: {
            data?: Array<{
              billing_details?: { name?: string };
              shipping?: { name?: string };
            }>;
          };
        };
        const customerName =
          metadata.customerName || // First check metadata (passed from checkout form)
          expandedPaymentIntent.charges?.data?.[0]?.billing_details?.name ||
          expandedPaymentIntent.charges?.data?.[0]?.shipping?.name ||
          customerEmail?.split("@")[0] || // Email prefix as fallback
          "Valued Customer";
        const totalAmount = paymentIntent.amount / 100;

        console.log("📋 Order Summary:");
        console.log("  Order ID:", orderId);
        console.log("  Payment Intent ID:", paymentIntent.id);
        console.log("  User ID:", userId);
        console.log("  Customer Email:", customerEmail);
        console.log("  Customer Name:", customerName);
        console.log("  Total Amount: £", totalAmount);

        // Extract items from metadata (serialized cart)
        let items: Array<{
          productId: string;
          productName: string;
          quantity: number;
          price: number;
        }> = [];

        try {
          // Try components first (most detailed)
          if (metadata.components) {
            const decoded = Buffer.from(metadata.components, "base64").toString(
              "utf-8"
            );
            const components = JSON.parse(decoded) as Array<{
              id: string;
              n: string;
              p: number;
              cat?: string;
              e?: string;
            }>;
            items = components.map((c) => ({
              productId: c.id,
              productName: c.n,
              quantity: 1,
              price: c.p,
              ean: c.e,
            }));
            console.log(
              "✅ Extracted items from components metadata:",
              items.length
            );
          }
          // Fall back to cart metadata
          else if (metadata.cart) {
            const decoded = Buffer.from(metadata.cart, "base64").toString(
              "utf-8"
            );
            const cart = JSON.parse(decoded) as Array<{
              id: string;
              n: string;
              p: number;
              q: number;
              e?: string;
            }>;
            items = cart.map((item) => ({
              productId: item.id,
              productName: item.n,
              quantity: item.q,
              price: item.p,
              ean: item.e,
            }));
            console.log("✅ Extracted items from cart metadata:", items.length);
          }
        } catch (metaError) {
          console.error("❌ Failed to extract items from metadata:", metaError);
          // Fallback to generic item
          items = [
            {
              productId: "unknown",
              productName: "Custom PC Build",
              quantity: 1,
              price: totalAmount,
            },
          ];
        }

        console.log("📦 Items:");
        items.forEach((item, idx) => {
          console.log(
            `  ${idx + 1}. ${item.productName} x${item.quantity} @ £${
              item.price
            }`
          );
        });

        // Send emails (customer + business)
        console.log("📧 ========== EMAIL SENDING START ==========");
        try {
          console.log("📧 Calling sendOrderEmails with:");
          console.log("   - Order:", orderId);
          console.log(
            "   - Customer:",
            customerName,
            "<" + customerEmail + ">"
          );
          console.log("   - Total: £", totalAmount);
          console.log("   - Items:", items.length);

          await sendOrderEmails({
            orderNumber: orderId,
            customerName,
            customerEmail,
            totalAmount,
            items: items.map((i) => ({
              name: i.productName,
              price: i.price,
              quantity: i.quantity,
              ean: (i as { ean?: string }).ean,
            })),
            shippingAddress: metadata.shippingAddress
              ? (() => {
                  try {
                    const a = JSON.parse(String(metadata.shippingAddress));
                    return {
                      line1: a.address || a.line1 || "",
                      line2: a.line2 || "",
                      city: a.city || "",
                      postal_code: a.postcode || a.postal_code || "",
                      country: a.country || "GB",
                    };
                  } catch {
                    return undefined as unknown as EmailOrderData["shippingAddress"];
                  }
                })()
              : undefined,
            shippingMethod: metadata.shippingMethod || "free",
            shippingCost: metadata.shippingCost
              ? Number(metadata.shippingCost)
              : 0,
          });
          console.log("✅ ========== EMAIL SENDING COMPLETE ==========");
        } catch (emailError) {
          console.error("❌ ========== EMAIL SENDING FAILED ==========");
          console.error(
            "❌ Error type:",
            emailError instanceof Error
              ? emailError.constructor.name
              : typeof emailError
          );
          console.error(
            "❌ Error message:",
            emailError instanceof Error
              ? emailError.message
              : String(emailError)
          );
          console.error("❌ Full error:", emailError);
          console.error("❌ ============================================");
          // Don't fail webhook, continue to save order
        }

        // Save to Firestore (only if Firebase initialized)
        // IMPORTANT: Use paymentIntent.id as the Firestore document ID so the client
        // can look up the order deterministically (OrderSuccess uses paymentIntentId/sessionId).
        // Store the human friendly readable order number separately (orderNumber).
        if (db) {
          console.log(
            "💾 Saving order to Firestore with paymentIntent.id as doc id..."
          );
          const orderRef = db.collection("orders").doc(paymentIntent.id);

          // Parse shipping address if available
          let address = {
            line1: "",
            line2: "",
            city: "",
            postcode: "",
            country: "GB",
          };

          if (metadata.shippingAddress) {
            try {
              const parsed = JSON.parse(metadata.shippingAddress);
              address = {
                line1: parsed.address || parsed.line1 || "",
                line2: parsed.line2 || "",
                city: parsed.city || "",
                postcode: parsed.postcode || parsed.postal_code || "",
                country: parsed.country || "GB",
              };
              console.log("✅ Parsed shipping address:", address);
            } catch (e) {
              console.warn("Failed to parse shipping address:", e);
            }
          }

          try {
            await orderRef.set({
              // Human readable order number (for display & emails)
              orderNumber: orderId,
              // Legacy field retained for compatibility (was doc id previously)
              orderId: orderId,
              stripePaymentIntentId: paymentIntent.id,
              userId,
              customerName,
              customerEmail,
              items,
              total: totalAmount,
              status: "pending",
              progress: 0,
              orderDate: admin.firestore.Timestamp.now(),
              estimatedCompletion: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              ),
              address,
              paymentId: paymentIntent.id,
              source: "stripe_payment_intent",
              createdAt: admin.firestore.Timestamp.now(),
              shippingMethod: metadata.shippingMethod || "free",
              shippingCost: metadata.shippingCost
                ? Number(metadata.shippingCost)
                : 0,
            });
            console.log(
              "✅ Order saved to Firestore with doc id (paymentIntent.id):",
              paymentIntent.id
            );
          } catch (orderErr) {
            console.error("❌ ORDER SAVE FAILED (payment_intent.succeeded)");
            console.error(
              "❌ Firestore write error:",
              orderErr instanceof Error ? orderErr.message : orderErr
            );
            console.error(
              "❌ Proceeding without persisting order (emails may have been sent)"
            );
          }
        } else {
          console.warn(
            "⚠️ Skipping Firestore save - Firebase not initialized (order emails may still have been sent)."
          );
        }

        // Decrement inventory
        if (db) {
          console.log("📊 Decrementing inventory...");
          try {
            await decrementInventoryOnce(
              orderId, // Use orderId instead of paymentIntent.id
              items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              }))
            );
            console.log("✅ Inventory decremented successfully");
          } catch (invError) {
            console.error("❌ Inventory decrement failed:", invError);
            // Don't fail webhook
          }
        } else {
          console.warn(
            "⚠️ Skipping inventory decrement - Firebase not initialized"
          );
        }

        // Award Vortex Vault points (2 pts/£, auto-created account if missing)
        if (userId && userId !== "guest") {
          try {
            console.log("⚡ Awarding Vortex Vault purchase points...", {
              userId,
              orderId,
              totalAmount,
            });
            const result = await awardPurchasePoints(
              userId,
              orderId,
              totalAmount
            );
            if (!result.success) {
              console.warn("⚠️ Vortex Vault award failed", {
                message: result.message,
                userId,
                orderId,
              });
            } else {
              console.log("✅ Vortex Vault points awarded", {
                pointsAwarded: result.pointsAwarded,
                newBalance: result.newBalance,
              });
              
              // Process referral bonus if user was referred
              try {
                const { processReferralBonus } = await import("../../services/vortexVaultReferrals");
                await processReferralBonus(userId, orderId);
                console.log("🎁 Referral bonus check completed", { userId, orderId });
              } catch (refErr) {
                console.warn("Referral bonus processing failed (non-critical)", refErr);
              }
              });

              // Send order receipt email with points earned
              try {
                console.log(
                  "📧 Triggering order receipt email with vault points...",
                  {
                    userId,
                    customerEmail,
                    pointsEarned: result.pointsAwarded,
                  }
                );
                await triggerVaultOrderReceiptEmail(
                  {
                    userId,
                    email: customerEmail,
                    firstName: customerName?.split(" ")[0],
                    lastName: customerName?.split(" ").slice(1).join(" "),
                  },
                  orderId,
                  totalAmount,
                  result.pointsAwarded
                );
                console.log("✅ Order receipt email triggered successfully");
              } catch (emailErr) {
                console.error(
                  "❌ Failed to trigger order receipt email",
                  emailErr
                );
                // Don't fail webhook if email fails
              }
            }
          } catch (loyaltyErr) {
            console.error("❌ Vortex Vault award error", loyaltyErr);
            // Do not fail webhook
          }
          // Redeem Vortex Vault points if applied in metadata
          try {
            const appliedStr =
              (metadata?.loyaltyPointsApplied as string) || "0";
            const discountStr = (metadata?.loyaltyDiscount as string) || "0";
            let pointsToRedeem = parseInt(appliedStr, 10);
            if ((!pointsToRedeem || pointsToRedeem < 0) && discountStr) {
              const discountVal = Number(discountStr) || 0;
              pointsToRedeem = Math.max(
                0,
                Math.floor(discountVal * POINTS_PER_POUND_VALUE)
              );
            }
            if (userId && userId !== "guest" && pointsToRedeem > 0) {
              const rr = await redeemPoints(userId, pointsToRedeem);
              if (!rr.success) {
                console.warn("⚠️ Vortex Vault redemption failed", {
                  userId,
                  orderId,
                  message: rr.message,
                });
              } else {
                console.log("✅ Vortex Vault points redeemed", {
                  pointsRedeemed: pointsToRedeem,
                  newBalance: rr.newBalance,
                });
              }
            }
          } catch (redeemErr) {
            console.error("❌ Vortex Vault redemption error", redeemErr);
          }
        } else {
          console.log("ℹ️ Skipping Vortex Vault points for guest checkout");
        }

        console.log("=====================================");
        console.log("✅ PAYMENT INTENT WEBHOOK PROCESSED");
        console.log("=====================================");

        return res
          .status(200)
          .json({ received: true, version: WEBHOOK_VERSION });
      } catch (error: unknown) {
        // Convert previously fatal errors into logged warnings so Stripe stops retrying
        console.error("❌ Payment Intent webhook error (non-fatal mode)");
        console.error(
          "❌ Error message:",
          error instanceof Error ? error.message : String(error)
        );
        if (error instanceof Error && error.stack) {
          console.error(
            "❌ Stack:",
            error.stack.split("\n").slice(0, 6).join(" | ")
          );
        }
        console.error("❌ Returning 200 to prevent repeated Stripe retries");
        return res.status(200).json({
          received: true,
          warning: true,
          error: error instanceof Error ? error.message : String(error),
          stage: "payment_intent.succeeded",
          version: WEBHOOK_VERSION,
        });
      }
    }

    // Handle checkout.session.completed (Legacy handler - align IDs to avoid duplicates)
    if (event.type === "checkout.session.completed") {
      try {
        console.log("🛒 Processing checkout.session.completed");

        // Initialize Firebase
        const db = initializeFirebase();
        console.log("✅ Firebase initialized");

        // Retrieve full session with line_items
        const sessionObj = event.data.object as Stripe.Checkout.Session;
        const session = await stripe.checkout.sessions.retrieve(sessionObj.id, {
          expand: ["line_items", "customer_details"],
        });
        console.log("✅ Session retrieved:", session.id);

        // Determine payment intent id (string) if available
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent as Stripe.PaymentIntent | null)?.id;

        // Use Stripe Session ID as the order document ID (legacy) but guard against duplicate
        const orderId = session.id;
        console.log("📝 Using Session ID as Order ID:", orderId);
        console.log("🔍 Related Payment Intent:", paymentIntentId);

        // Duplication guard: if payment intent document already exists OR session doc exists, skip
        if (paymentIntentId) {
          const piDoc = await db
            .collection("orders")
            .doc(paymentIntentId)
            .get();
          if (piDoc.exists) {
            console.log(
              "ℹ️ PaymentIntent order already stored (doc:",
              paymentIntentId,
              ") — skipping session duplication"
            );
            return res.status(200).json({
              received: true,
              skipped: true,
              reason: "payment_intent_exists",
              version: WEBHOOK_VERSION,
            });
          }
        }

        // Extract order data
        const items = extractOrderItems(session);
        const totalAmount = (session.amount_total || 0) / 100;
        const userId = (session.metadata?.userId as string) || "guest";
        const customerEmail =
          session.customer_details?.email || session.customer_email || "";

        // Extract customer name from multiple possible sources
        // Note: Stripe SDK types don't include expanded shipping by default
        const expandedSession = session as Stripe.Checkout.Session & {
          shipping?: { name?: string };
        };
        const customerName =
          session.customer_details?.name || // Embedded checkout name field
          expandedSession.shipping?.name || // Shipping name (often same as billing)
          session.customer_details?.email?.split("@")[0] || // Email prefix as fallback
          "Valued Customer"; // Last resort fallback

        console.log("📋 Order Summary:");
        console.log("  Order ID:", orderId);
        console.log("  Stripe Session:", session.id);
        console.log("  User ID:", userId);
        console.log("  Customer Email:", customerEmail);
        console.log("  Customer Name:", customerName);
        console.log("  Total Amount: £", totalAmount);
        console.log("  Items Count:", items.length);
        items.forEach((item, idx) => {
          console.log(
            `    ${idx + 1}. ${item.productName} x${item.quantity} @ £${
              item.price
            }`
          );
        });

        // Send emails
        console.log("📧 ========== EMAIL SENDING START (Session) ==========");
        try {
          console.log("📧 Calling sendOrderEmails with:");
          console.log("   - Order:", orderId);
          console.log(
            "   - Customer:",
            customerName,
            "<" + customerEmail + ">"
          );
          console.log("   - Total: £", totalAmount);
          console.log("   - Items:", items.length);

          await sendOrderEmails({
            orderNumber: orderId,
            customerName,
            customerEmail,
            totalAmount,
            items: items.map((item) => ({
              name: item.productName,
              price: item.price,
              quantity: item.quantity,
              ean: (item as { ean?: string }).ean,
            })),
            shippingAddress: session.customer_details?.address
              ? {
                  line1: session.customer_details.address.line1 || "",
                  line2: session.customer_details.address.line2 || undefined,
                  city: session.customer_details.address.city || "",
                  postal_code:
                    session.customer_details.address.postal_code || "",
                  country: session.customer_details.address.country || "",
                }
              : undefined,
          });
          console.log(
            "✅ ========== EMAIL SENDING COMPLETE (Session) =========="
          );
        } catch (emailError) {
          console.error(
            "❌ ========== EMAIL SENDING FAILED (Session) =========="
          );
          console.error(
            "❌ Error type:",
            emailError instanceof Error
              ? emailError.constructor.name
              : typeof emailError
          );
          console.error(
            "❌ Error message:",
            emailError instanceof Error
              ? emailError.message
              : String(emailError)
          );
          console.error("❌ Full error:", emailError);
          console.error("❌ ============================================");
          // Don't fail webhook, continue to save order
        }

        // Save to Firestore (skip if already exists)
        console.log("💾 Saving order to Firestore (id:", orderId, ")...");
        const orderRef = db.collection("orders").doc(orderId);
        const exists = await orderRef.get();
        if (exists.exists) {
          console.log(
            "ℹ️ Order document already exists for session id, skipping create"
          );
          return res
            .status(200)
            .json({ received: true, skipped: true, reason: "session_exists" });
        }
        await orderRef.set({
          orderId: orderId,
          stripeSessionId: session.id,
          userId,
          customerName,
          customerEmail,
          items,
          total: totalAmount,
          status: "pending",
          progress: 0,
          orderDate: admin.firestore.Timestamp.now(),
          estimatedCompletion: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ),
          address: {
            line1: session.customer_details?.address?.line1 || "",
            line2: session.customer_details?.address?.line2 || "",
            city: session.customer_details?.address?.city || "",
            postcode: session.customer_details?.address?.postal_code || "",
            country: session.customer_details?.address?.country || "GB",
          },
          paymentId: session.id,
          source: "stripe_checkout",
          createdAt: admin.firestore.Timestamp.now(),
        });
        console.log("✅ Order saved to Firestore");

        // ========================================
        // DECREMENT INVENTORY (CRITICAL!)
        // ========================================
        console.log("📊 Decrementing inventory...");
        try {
          await decrementInventoryOnce(orderId, items);
          console.log("✅ Inventory decremented successfully");
        } catch (invError) {
          console.error("❌ Inventory decrement failed:", invError);
          // Don't fail webhook - log for manual review
          // This allows order to complete even if inventory update fails
        }

        // Attempt to redeem any applied Vortex Vault points from metadata
        try {
          const appliedStr =
            (session.metadata?.loyaltyPointsApplied as string) || "0";
          const discountStr =
            (session.metadata?.loyaltyDiscount as string) || "0";
          let pointsToRedeem = parseInt(appliedStr, 10);
          if ((!pointsToRedeem || pointsToRedeem < 0) && discountStr) {
            const discountVal = Number(discountStr) || 0;
            pointsToRedeem = Math.max(
              0,
              Math.floor(discountVal * POINTS_PER_POUND_VALUE)
            );
          }
          if (userId && userId !== "guest" && pointsToRedeem > 0) {
            const rr = await redeemPoints(userId, pointsToRedeem);
            if (!rr.success) {
              console.warn("⚠️ Vortex Vault redemption failed (session)", {
                userId,
                orderId,
                message: rr.message,
              });
            } else {
              console.log("✅ Vortex Vault points redeemed (session)", {
                pointsRedeemed: pointsToRedeem,
                newBalance: rr.newBalance,
              });
            }
          }
        } catch (redeemErr) {
          console.error(
            "❌ Vortex Vault redemption error (session)",
            redeemErr
          );
        }

        console.log("=====================================");
        console.log("✅ WEBHOOK PROCESSED SUCCESSFULLY");
        console.log("=====================================");

        return res
          .status(200)
          .json({ received: true, version: WEBHOOK_VERSION });
      } catch (error: unknown) {
        console.error("❌ Webhook processing error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return res.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : "Webhook processing failed",
          version: WEBHOOK_VERSION,
        });
      }
    }

    // Other event types
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
    return res.status(200).json({ received: true, version: WEBHOOK_VERSION });
  } catch (fatalErr) {
    console.error("🛑 GLOBAL FAIL-SAFE TRIGGERED");
    console.error(
      "🛑 Unhandled error:",
      fatalErr instanceof Error ? fatalErr.message : String(fatalErr)
    );
    if (fatalErr instanceof Error && fatalErr.stack) {
      console.error(
        "🛑 Stack (top lines):",
        fatalErr.stack.split("\n").slice(0, 6).join(" | ")
      );
    }
    return res.status(200).json({
      received: true,
      fatal: true,
      error: fatalErr instanceof Error ? fatalErr.message : String(fatalErr),
      version: WEBHOOK_VERSION,
      stage: "global_fail_safe",
    });
  }
}

// Helper to get raw body
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// =====================================================
// INVENTORY MANAGEMENT (CRITICAL FOR STOCK CONTROL)
// =====================================================

/**
 * Decrement inventory for purchased items
 * IDEMPOTENT: Uses inventory_transactions collection to prevent double-decrement
 *
 * @param paymentId - Stripe payment/session ID (used as transaction ID)
 * @param items - Array of items with productId and quantity
 */
async function decrementInventoryOnce(
  paymentId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  console.log("📊 ============================================");
  console.log("📊 INVENTORY DECREMENT STARTING");
  console.log("📊 ============================================");
  console.log("  Payment ID:", paymentId);
  console.log("  Items to process:", items.length);

  try {
    if (!admin.apps.length) {
      console.error(
        "❌ Firebase Admin not initialized - INVENTORY NOT DECREMENTED!"
      );
      console.error(
        "   This is a CRITICAL ERROR - stock levels will be incorrect!"
      );
      return;
    }

    const db = admin.firestore();

    // Check if this transaction was already processed (idempotency)
    console.log("🔍 Checking for existing transaction...");
    const txRef = db.collection("inventory_transactions").doc(paymentId);
    const existingTx = await txRef.get();

    if (existingTx.exists) {
      console.log("✅ Transaction already processed (idempotent check passed)");
      console.log(
        "   Transaction data:",
        JSON.stringify(existingTx.data(), null, 2)
      );
      console.log("📊 INVENTORY DECREMENT SKIPPED (already processed)");
      console.log("📊 ============================================");
      return;
    }

    console.log(
      "✅ No existing transaction found - proceeding with inventory update"
    );

    // Use batch for atomic updates
    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();
    const inventoryUpdates: Array<{
      productId: string;
      quantityOrdered: number;
      stockBefore: number;
      stockAfter: number;
      existed: boolean;
    }> = [];

    console.log("📦 Processing individual items:");

    // Decrement stock for each item
    for (const item of items) {
      const invRef = db.collection("inventory").doc(item.productId);
      const invSnap = await invRef.get();

      const currentStock = invSnap.exists ? invSnap.data()?.stock || 0 : 0;
      const newStock = Math.max(0, currentStock - (item.quantity || 1));

      console.log(`  📦 Product ID: ${item.productId}`);
      console.log(`     - Stock BEFORE: ${currentStock}`);
      console.log(`     - Quantity ORDERED: ${item.quantity}`);
      console.log(`     - Stock AFTER: ${newStock}`);
      console.log(
        `     - Document existed: ${
          invSnap.exists ? "YES" : "NO (will create)"
        }`
      );

      if (currentStock === 0 && invSnap.exists) {
        console.warn(
          `     ⚠️ WARNING: Stock was already at 0 before this order!`
        );
      }

      if (!invSnap.exists) {
        console.warn(
          `     ⚠️ WARNING: Product not found in inventory - creating new document`
        );
      }

      inventoryUpdates.push({
        productId: item.productId,
        quantityOrdered: item.quantity,
        stockBefore: currentStock,
        stockAfter: newStock,
        existed: invSnap.exists,
      });

      // Update or create inventory document
      batch.set(
        invRef,
        {
          stock: newStock,
          updatedAt: now,
          lastSaleAt: now,
          productId: item.productId, // Ensure productId is stored
        },
        { merge: true }
      );
    }

    // Record transaction for idempotency
    console.log("💾 Recording transaction for idempotency...");
    batch.set(txRef, {
      paymentId,
      items: inventoryUpdates,
      processedAt: now,
      status: "completed",
    });

    // Commit all updates atomically
    console.log("⚡ Committing batch update (atomic operation)...");
    await batch.commit();

    console.log("✅ ============================================");
    console.log("✅ INVENTORY BATCH COMMITTED SUCCESSFULLY");
    console.log("✅ ============================================");
    console.log("  Transaction ID:", paymentId);
    console.log("  Items processed:", inventoryUpdates.length);
    console.log("  Summary:");
    inventoryUpdates.forEach((update) => {
      console.log(
        `    - ${update.productId}: ${update.stockBefore} → ${update.stockAfter} (ordered: ${update.quantityOrdered})`
      );
    });
    console.log("✅ ============================================");
  } catch (error) {
    console.error("❌ ============================================");
    console.error("❌ INVENTORY DECREMENT FAILED");
    console.error("❌ ============================================");
    console.error("  Error:", error);
    console.error("  Payment ID:", paymentId);
    console.error(
      "  This is CRITICAL - manual inventory adjustment may be needed!"
    );
    console.error("❌ ============================================");
    throw error; // Re-throw so caller can handle
  }
}
