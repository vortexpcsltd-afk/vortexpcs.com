import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { StripeError } from "../../types/api";
import admin from "firebase-admin";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? JSON.parse(
          Buffer.from(
            process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
            "base64"
          ).toString("utf-8")
        )
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Authenticate user (optional - allows guest checkout)
    let userId = "guest";
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ") && admin.apps.length > 0) {
      try {
        const token = authHeader.substring(7);
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
        console.log("Authenticated user for payment:", userId);
      } catch (error) {
        console.warn("Invalid auth token, proceeding as guest");
      }
    }

    const {
      amount,
      currency = "gbp",
      cartItems,
      shippingAddress,
      customerEmail,
      customerName,
      customerPhone,
    } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart items are required" });
    }

    if (!customerEmail) {
      return res.status(400).json({ message: "Customer email is required" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `VPC-${dateStr}-${randomSuffix}`;

    console.log("Creating Payment Intent:", {
      orderNumber,
      userId,
      amount,
      customerEmail,
    });

    // Serialize cart and address for metadata (Stripe 500 char limit per field)
    const cartSerialized = Buffer.from(
      JSON.stringify(
        cartItems.map(
          (i: {
            id: string;
            name: string;
            price: number;
            quantity: number;
            image?: string;
          }) => ({
            id: i.id,
            n: i.name,
            p: i.price,
            q: i.quantity,
            img: i.image || "",
          })
        )
      )
    ).toString("base64");

    const addressSerialized = JSON.stringify(shippingAddress);

    // Create Payment Intent with all order metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: customerEmail,
      metadata: {
        orderNumber,
        userId,
        customerEmail,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        cart: cartSerialized,
        shippingAddress: addressSerialized,
      },
      description: `Order ${orderNumber} - ${customerName || customerEmail}`,
    });

    console.log("Payment Intent created successfully:", {
      paymentIntentId: paymentIntent.id,
      orderNumber,
      hasClientSecret: !!paymentIntent.client_secret,
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderNumber,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error: unknown) {
    const err = error as StripeError;
    console.error("Stripe payment intent error:", err);
    console.error("Error details:", {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
    });
    res.status(500).json({
      message: err.message || "Failed to create payment intent",
      error: err.type || "unknown_error",
    });
  }
}
