import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { StripeError } from "../../types/api";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

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
}

interface EmailOrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  items: Array<{ name: string; price: number; quantity: number }>;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
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
// EMAIL SENDING
// =====================================================

async function sendOrderEmails(orderData: EmailOrderData): Promise<void> {
  console.log("📧 Preparing to send emails...");
  console.log("  Customer Email:", orderData.customerEmail);
  console.log("  Order Number:", orderData.orderNumber);
  console.log("  Items Count:", orderData.items.length);
  console.log("  Total Amount:", orderData.totalAmount);

  // Validate SMTP configuration
  const smtpHost = process.env.VITE_SMTP_HOST;
  const smtpUser = process.env.VITE_SMTP_USER;
  const smtpPass = process.env.VITE_SMTP_PASS;
  const smtpPort = process.env.VITE_SMTP_PORT || "465";
  const businessEmail = process.env.VITE_BUSINESS_EMAIL || "info@vortexpcs.com";

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP configuration missing - cannot send emails");
  }

  console.log("  SMTP Host:", smtpHost);
  console.log("  SMTP User:", smtpUser);
  console.log("  SMTP Port:", smtpPort);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Verify transporter configuration
  try {
    await transporter.verify();
    console.log("✅ SMTP transporter verified successfully");
  } catch (verifyError) {
    console.error("❌ SMTP verification failed:", verifyError);
    throw new Error(`SMTP verification failed: ${verifyError}`);
  }

  const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; padding: 40px 20px; text-align: center; }
          .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px 20px; background: #ffffff; }
          .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .total-row { display: flex; justify-content: space-between; padding: 15px 0; font-weight: bold; font-size: 18px; color: #2563eb; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VORTEX<span style="color: #60a5fa;">PCs</span>.com</div>
            <h1 style="margin: 10px 0 0 0; font-size: 28px;">Thank You for Your Order!</h1>
            <p style="margin: 10px 0 0 0;">Order #${orderData.orderNumber}</p>
          </div>
          <div class="content">
            <p>Hi <strong>${orderData.customerName}</strong>,</p>
            <p>Thank you for your order! We've received your payment and will begin processing your custom PC build shortly.</p>
            
            <div class="order-details">
              <h3 style="margin-top: 0;">Order Summary</h3>
              ${orderData.items
                .map(
                  (item) => `
                <div class="item-row">
                  <span>${item.name} × ${item.quantity}</span>
                  <span>£${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `
                )
                .join("")}
              <div class="total-row">
                <span>Total Paid</span>
                <span>£${orderData.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <p>You can track your order progress in your <a href="https://vortexpcs.com/member">Member Area</a>.</p>
            <p>Best regards,<br><strong>The Vortex PCs Team</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const businessEmailHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #dc2626;">🔔 New Order Received</h1>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <strong>⚡ Action Required:</strong> A new custom PC order needs immediate attention
        </div>
        <table style="width: 100%; margin: 20px 0;">
          <tr>
            <td><strong>Order Number:</strong></td>
            <td>${orderData.orderNumber}</td>
          </tr>
          <tr>
            <td><strong>Customer Name:</strong></td>
            <td>${orderData.customerName}</td>
          </tr>
          <tr>
            <td><strong>Customer Email:</strong></td>
            <td>${orderData.customerEmail}</td>
          </tr>
          <tr>
            <td><strong>Total Amount:</strong></td>
            <td>£${orderData.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
        <h3>Items Ordered (${orderData.items.length}):</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.items
              .map(
                (item) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${
                  item.name
                }</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
                  item.quantity
                }</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${item.price.toFixed(
                  2
                )}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${(
                  item.price * item.quantity
                ).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p style="margin-top: 20px;">
          <a href="https://vortexpcs.com/admin" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Open Admin Panel →
          </a>
        </p>
      </body>
    </html>
  `;

  const emailPromises = [];

  // Send customer email if email exists
  if (orderData.customerEmail && orderData.customerEmail.trim()) {
    console.log("  📤 Sending customer email to:", orderData.customerEmail);
    emailPromises.push(
      transporter
        .sendMail({
          from: `"Vortex PCs" <${smtpUser}>`,
          to: orderData.customerEmail,
          subject: `Order Confirmation - ${orderData.orderNumber}`,
          html: customerEmailHtml,
        })
        .then(() => console.log("  ✅ Customer email sent successfully"))
    );
  } else {
    console.warn("  ⚠️ No customer email - skipping customer notification");
  }

  // Always send business notification
  console.log("  📤 Sending business email to:", businessEmail);
  emailPromises.push(
    transporter
      .sendMail({
        from: `"Vortex PCs Orders" <${smtpUser}>`,
        to: businessEmail,
        subject: `New Order: ${
          orderData.orderNumber
        } - £${orderData.totalAmount.toFixed(2)}`,
        html: businessEmailHtml,
      })
      .then(() => console.log("  ✅ Business email sent successfully"))
  );

  await Promise.all(emailPromises);
  console.log("✅ All emails sent successfully");
}

// =====================================================
// ORDER DATA EXTRACTION
// =====================================================

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
      }>;

      if (Array.isArray(parsed) && parsed.length > 0) {
        const items = parsed.map((c) => ({
          productId: c.id || "component",
          productName: c.n || "Component",
          quantity: 1,
          price: c.p,
          category: c.cat || "",
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
      }>;

      if (Array.isArray(parsed) && parsed.length > 0) {
        const items = parsed.map((item) => ({
          productId: item.id || "unknown",
          productName: item.n || "Item",
          quantity: item.q || 1,
          price: item.p,
          image: item.img,
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

// Extract items from a PaymentIntent (custom checkout flow)
function extractOrderItemsFromIntent(
  intent: Stripe.PaymentIntent
): OrderItem[] {
  console.log("📦 Extracting order items from payment intent...");
  const meta = intent.metadata || {};

  // PRIORITY 1: components metadata
  if (meta.components) {
    try {
      const decoded = Buffer.from(meta.components, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded) as Array<{
        id: string;
        n: string;
        p: number;
        cat?: string;
      }>;
      if (Array.isArray(parsed) && parsed.length) {
        console.log(`  ✅ Extracted ${parsed.length} component items`);
        return parsed.map((c) => ({
          productId: c.id || "component",
          productName: c.n || "Component",
          quantity: 1,
          price: c.p,
          category: c.cat,
        }));
      }
    } catch (e) {
      console.warn("  ⚠️ Failed to parse components metadata from intent", e);
    }
  }

  // PRIORITY 2: cart metadata
  if (meta.cart) {
    try {
      const decoded = Buffer.from(meta.cart, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded) as Array<{
        id: string;
        n: string;
        p: number;
        q: number;
        img?: string;
      }>;
      if (Array.isArray(parsed) && parsed.length) {
        console.log(`  ✅ Extracted ${parsed.length} cart items`);
        return parsed.map((item) => ({
          productId: item.id || "unknown",
          productName: item.n || "Item",
          quantity: item.q || 1,
          price: item.p,
          image: item.img,
        }));
      }
    } catch (e) {
      console.warn("  ⚠️ Failed to parse cart metadata from intent", e);
    }
  }

  // FALLBACK generic item
  console.warn("  ⚠️ No item metadata on intent - using generic fallback");
  return [
    {
      productId: "custom_build",
      productName: "Custom PC Build",
      quantity: 1,
      price: (intent.amount || 0) / 100,
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

  if (req.method !== "POST") {
    console.error("❌ Invalid method:", req.method);
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Verify signature
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    console.error("❌ Missing stripe-signature header");
    return res.status(400).json({ message: "Missing stripe-signature" });
  }

  let event: Stripe.Event;

  try {
    const buf = await getRawBody(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log("✅ Signature verified. Event type:", event.type);
  } catch (err: unknown) {
    const error = err as StripeError;
    console.error("❌ Signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle checkout.session.completed (Stripe Checkout flow)
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

      // Extract order data
      const items = extractOrderItems(session);
      const totalAmount = (session.amount_total || 0) / 100;
      const userId = (session.metadata?.userId as string) || "guest";
      const customerEmail =
        session.customer_details?.email || session.customer_email || "";
      const customerName = session.customer_details?.name || "Valued Customer";

      console.log("📋 Order Summary:");
      console.log("  Order ID:", session.id);
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
      try {
        await sendOrderEmails({
          orderNumber: session.id,
          customerName,
          customerEmail,
          totalAmount,
          items: items.map((item) => ({
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
          })),
          shippingAddress: session.customer_details?.address
            ? {
                line1: session.customer_details.address.line1 || "",
                line2: session.customer_details.address.line2 || undefined,
                city: session.customer_details.address.city || "",
                postal_code: session.customer_details.address.postal_code || "",
                country: session.customer_details.address.country || "",
              }
            : undefined,
        });
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        // Don't fail webhook, continue to save order
      }

      // Save to Firestore
      console.log("💾 Saving order to Firestore...");
      const orderRef = db.collection("orders").doc(session.id);
      await orderRef.set({
        orderId: session.id,
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

      console.log("=====================================");
      console.log("✅ WEBHOOK PROCESSED SUCCESSFULLY");
      console.log("=====================================");

      return res.status(200).json({ received: true });
    } catch (error: unknown) {
      console.error("❌ Webhook processing error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Webhook processing failed",
      });
    }
  }

  // Handle payment_intent.succeeded (Custom PaymentIntent flow)
  if (event.type === "payment_intent.succeeded") {
    try {
      console.log("💳 Processing payment_intent.succeeded");
      const db = initializeFirebase();
      console.log("✅ Firebase initialized for intent");
      const intentObj = event.data.object as Stripe.PaymentIntent;
      console.log("  Intent ID:", intentObj.id);
      console.log("  Status:", intentObj.status);
      const items = extractOrderItemsFromIntent(intentObj);
      const totalAmount = (intentObj.amount || 0) / 100;
      const userId = (intentObj.metadata?.userId as string) || "guest";
      const customerEmail =
        intentObj.receipt_email || intentObj.metadata?.customerEmail || "";
      const customerName =
        intentObj.metadata?.customerName || "Valued Customer";

      // Check if order already exists (client may have created it)
      const existingRef = await db.collection("orders").doc(intentObj.id).get();
      if (existingRef.exists) {
        console.log(
          "ℹ️ Order already exists for intent - skipping creation & emails"
        );
        return res.status(200).json({ received: true, skipped: true });
      }

      // Send emails (safe try/catch)
      try {
        await sendOrderEmails({
          orderNumber: intentObj.id,
          customerName,
          customerEmail,
          totalAmount,
          items: items.map((i) => ({
            name: i.productName,
            price: i.price,
            quantity: i.quantity,
          })),
        });
      } catch (emailErr) {
        console.error("❌ PaymentIntent email sending failed", emailErr);
      }

      // Persist order
      await db
        .collection("orders")
        .doc(intentObj.id)
        .set({
          orderId: intentObj.id,
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
            line1: intentObj.shipping?.address?.line1 || "",
            line2: intentObj.shipping?.address?.line2 || "",
            city: intentObj.shipping?.address?.city || "",
            postcode: intentObj.shipping?.address?.postal_code || "",
            country: intentObj.shipping?.address?.country || "GB",
          },
          paymentId: intentObj.id,
          source: "stripe_payment_intent",
          createdAt: admin.firestore.Timestamp.now(),
        });
      console.log("✅ PaymentIntent order saved to Firestore");
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error("❌ payment_intent.succeeded processing error", err);
      return res
        .status(500)
        .json({ message: "PaymentIntent processing failed" });
    }
  }

  // Other event types
  console.log(`ℹ️ Unhandled event type: ${event.type}`);
  return res.status(200).json({ received: true });
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
