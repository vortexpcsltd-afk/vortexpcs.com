import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import admin from "firebase-admin";
import { logger } from "../../services/logger.js";
import { generateOrderNumber } from "../utils/orderNumber.js";

// Initialize Stripe
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecret, {
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
    logger.error("Failed to initialize Firebase Admin:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripeSecret) {
    return res
      .status(503)
      .json({ error: "Stripe not configured (missing STRIPE_SECRET_KEY)" });
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
      } catch (error) {
        logger.warn("Invalid auth token, proceeding as guest");
      }
    }

    const {
      amount,
      currency = "gbp",
      cartItems,
      items,
      shippingAddress,
      customerEmail,
      customerName,
      customerPhone,
      shippingMethod,
      shippingCost,
      metadata: clientMetadata,
    } = req.body;

    const lineItemInput = Array.isArray(cartItems)
      ? cartItems
      : Array.isArray(items)
      ? items
      : [];

    // Validation
    if (!lineItemInput.length) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    const normalizedAmount =
      typeof amount === "number" && amount > 0
        ? amount
        : lineItemInput.reduce(
            (sum: number, item: { price: number; quantity: number }) =>
              sum + Number(item.price || 0) * Number(item.quantity || 1),
            0
          ) + (typeof shippingCost === "number" ? shippingCost : 0);

    if (!normalizedAmount || normalizedAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Generate order number based on customer type
    const db = admin.apps.length > 0 ? admin.firestore() : undefined;
    const orderNumber = await generateOrderNumber(userId, db);

    // Create Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      lineItemInput.map(
        (item: {
          id?: string;
          name: string;
          price: number;
          quantity: number;
          image?: string;
          description?: string;
        }) => ({
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: item.name,
              description: item.description,
              metadata: item.id ? { productId: item.id } : undefined,
            },
            unit_amount: Math.round(Number(item.price || 0) * 100), // Convert to pence
          },
          quantity: Number(item.quantity || 1),
        })
      );

    // Create order in Firestore (pending payment)
    let orderId = "";
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      const orderData = {
        orderNumber,
        userId,
        customerEmail: customerEmail,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        amount: normalizedAmount,
        currency: currency.toUpperCase(),
        status: "pending_payment",
        paymentMethod: "stripe",
        items: lineItemInput.map(
          (item: {
            id?: string;
            name: string;
            category?: string;
            price: number;
            quantity: number;
            image?: string;
            ean?: string;
          }) => ({
            productId: item.id || "", // optional in subscriptions
            name: item.name,
            category: item.category || "",
            price: item.price,
            quantity: item.quantity,
            ean: item.ean || "",
            image: item.image || "",
          })
        ),
        shippingAddress: shippingAddress || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        notes: "Awaiting Stripe payment confirmation",
      };

      const orderRef = await db.collection("orders").add(orderData);
      orderId = orderRef.id;

      logger.info("Pending order created for Stripe checkout", {
        orderId,
        orderNumber,
        userId,
      });
    }

    // Get base URL for success/cancel redirects
    const baseUrl =
      process.env.VITE_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.origin ||
      `https://${req.headers.host}`;

    const cartSerialized = Buffer.from(
      JSON.stringify(
        lineItemInput.map((item: any) => ({
          id: item.id,
          n: item.name,
          p: item.price,
          q: item.quantity,
        }))
      )
    ).toString("base64");

    const shippingSerialized = shippingAddress
      ? JSON.stringify(shippingAddress)
      : undefined;

    const checkoutMetadata = {
      orderNumber,
      orderId,
      userId,
      customerName: customerName || "",
      customerPhone: customerPhone || "",
      shippingAddress: shippingSerialized,
      shippingMethod: shippingMethod || "free",
      shippingCost:
        typeof shippingCost === "number" ? String(shippingCost) : "0",
      source: "vortex-pcs-website",
      ...(clientMetadata && typeof clientMetadata === "object"
        ? clientMetadata
        : {}),
      cart: cartSerialized,
    } as Record<string, string>;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: `${baseUrl}/?cancelled=true`,
      customer_email: customerEmail,
      payment_intent_data: {
        receipt_email: customerEmail,
        metadata: checkoutMetadata,
      },
      metadata: checkoutMetadata,
      shipping_address_collection: {
        allowed_countries: ["GB"],
      },
    });

    logger.info("Stripe checkout session created", {
      sessionId: session.id,
      orderNumber,
      orderId,
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      orderNumber,
      orderId,
    });
  } catch (error: unknown) {
    logger.error("Error creating Stripe checkout session:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session",
    });
  }
}
