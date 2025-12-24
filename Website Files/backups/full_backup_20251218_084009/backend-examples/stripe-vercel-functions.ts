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

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Payment successful:", session.id);

        // TODO: Create order in Firebase
        // TODO: Send confirmation email
        // TODO: Update inventory in Strapi

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
