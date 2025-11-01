import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Log environment check (first 10 chars only for security)
console.log("STRIPE_SECRET_KEY available:", !!process.env.STRIPE_SECRET_KEY);
console.log(
  "STRIPE_SECRET_KEY prefix:",
  process.env.STRIPE_SECRET_KEY?.substring(0, 7)
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { amount, currency, metadata } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Create payment intent for custom checkout
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
  } catch (error: any) {
    console.error("Stripe payment intent error:", error);
    console.error("Error details:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });
    res.status(500).json({
      message: error.message || "Failed to create payment intent",
      error: error.type || "unknown_error",
    });
  }
}
