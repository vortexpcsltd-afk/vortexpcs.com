/**
 * Stripe Vercel Serverless Functions
 * Place these files in /api folder for Vercel deployment
 *
 * File structure:
 * /api
 *   /stripe
 *     create-checkout-session.ts
 *     verify-payment.ts
 *     webhook.ts
 */

import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

interface CheckoutRequestBody {
  items: CartItem[];
  customerEmail: string;
  metadata?: Record<string, string>;
}

// ============================================
// File: /api/stripe/create-checkout-session.ts
// ============================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { items, customerEmail, metadata }: CheckoutRequestBody = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item: CartItem) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            description: item.description || "",
          },
          unit_amount: Math.round(item.price * 100), // Convert to pence
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      customer_email: customerEmail,
      metadata: metadata || {},
      success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout-cancelled`,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["GB"],
      },
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    console.error("Stripe checkout session error:", error);
    res.status(500).json({
      message: message,
    });
  }
}

// ============================================
// File: /api/stripe/verify-payment.ts
// ============================================

import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ message: "Session ID required" });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.status(200).json({
      status: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to verify payment";
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: message,
    });
  }
}

// ============================================
// File: /api/stripe/webhook.ts
// ============================================

import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable bodyParser for this endpoint (required for Stripe webhooks)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errorMsg);
      return res.status(400).send(`Webhook Error: ${errorMsg}`);
    }

    // Helper: initialize Firestore (graceful if not configured)
    function getFirestore() {
      try {
        if (admin.apps.length) return admin.firestore();
        const saBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (!saBase64) return null;
        const creds = JSON.parse(
          Buffer.from(saBase64, "base64").toString("utf-8")
        );
        admin.initializeApp({ credential: admin.credential.cert(creds) });
        return admin.firestore();
      } catch (e) {
        console.warn("Firebase init failed (continuing without Firestore)", e);
        return null;
      }
    }

    // Helper: fetch session with line items for order data
    async function getSessionWithLineItems(sessionId: string) {
      try {
        return await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["line_items", "payment_intent", "customer"],
        });
      } catch (e) {
        console.warn("Failed to expand session line_items", e);
        return null;
      }
    }

    // Helper: generate a human-friendly order number
    function generateOrderNumber(): string {
      const now = new Date();
      const y = String(now.getUTCFullYear()).slice(-2);
      const m = String(now.getUTCMonth() + 1).padStart(2, "0");
      const d = String(now.getUTCDate()).padStart(2, "0");
      const t = now.getTime().toString().slice(-6);
      return `VP-${y}${m}${d}-${t}`;
    }

    // Helper: send basic confirmation emails (customer + business)
    async function sendConfirmationEmails(opts: {
      to: string;
      orderNumber: string;
      amountTotal: number;
    }) {
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
      const businessEmail = process.env.BUSINESS_EMAIL || "info@vortexpcs.com";

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn("SMTP not configured – skipping confirmation emails");
        return;
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const subject = `Your VortexPCs Order ${opts.orderNumber}`;
      const text = `Thank you! Your order ${
        opts.orderNumber
      } has been received. Total £${(opts.amountTotal / 100).toFixed(2)}.`;

      await transporter.sendMail({
        from: businessEmail,
        to: opts.to,
        subject,
        text,
      });

      await transporter.sendMail({
        from: businessEmail,
        to: businessEmail,
        subject: `New Order ${opts.orderNumber}`,
        text: `New order placed. Total £${(opts.amountTotal / 100).toFixed(
          2
        )}. Customer: ${opts.to}.`,
      });
    }

    // Helper: decrement inventory in Strapi (optional)
    async function updateInventoryInStrapi(
      items: Array<{ name?: string; quantity?: number }>
    ) {
      const baseUrl = process.env.STRAPI_URL;
      const token = process.env.STRAPI_TOKEN; // bearer token if needed
      if (!baseUrl) {
        console.info("Strapi not configured – skipping inventory update");
        return;
      }
      try {
        for (const it of items) {
          const res = await fetch(`${baseUrl}/api/inventory/decrement`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ name: it.name, quantity: it.quantity || 1 }),
          });
          if (!res.ok) {
            console.warn("Strapi decrement failed", await res.text());
          }
        }
      } catch (e) {
        console.warn("Strapi inventory update error", e);
      }
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Payment successful:", session.id);

        // Expand session to get line_items
        const expanded = await getSessionWithLineItems(session.id);
        const lineItems = (expanded?.line_items?.data || []).map((li: any) => ({
          name: li.description,
          quantity: li.quantity,
          amount_subtotal: li.amount_subtotal,
          amount_total: li.amount_total,
        }));

        const orderNumber = generateOrderNumber();
        const firestore = getFirestore();

        // Create order in Firebase (graceful if not configured)
        if (firestore) {
          try {
            await firestore.collection("orders").add({
              orderNumber,
              sessionId: session.id,
              customerEmail: session.customer_email,
              amountTotal: session.amount_total,
              currency: session.currency,
              items: lineItems,
              createdAt: admin.firestore.Timestamp.now(),
              status: "paid",
              source: "stripe-checkout",
            });
            console.log("Order stored in Firestore:", orderNumber);
          } catch (e) {
            console.warn("Failed to persist order to Firestore", e);
          }
        }

        // Send confirmation email (if SMTP configured)
        if (session.customer_email) {
          await sendConfirmationEmails({
            to: session.customer_email,
            orderNumber,
            amountTotal: session.amount_total || 0,
          });
        }

        // Optional inventory update in Strapi
        await updateInventoryInStrapi(lineItems);

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed";
    console.error("Webhook error:", error);
    res.status(500).json({
      message: message,
    });
  }
}

// ============================================
// File: /api/stripe/create-payment-intent.ts
// ============================================

import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { amount, currency, metadata } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || "gbp",
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create payment intent";
    console.error("Create payment intent error:", error);
    res.status(500).json({
      message: message,
    });
  }
}
