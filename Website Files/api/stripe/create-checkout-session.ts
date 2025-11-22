import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import admin from "firebase-admin";
import { logger } from "../../services/logger";

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
    logger.error("Failed to initialize Firebase Admin:", error);
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
    return res.status(405).json({ error: "Method not allowed" });
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
      shippingAddress,
      customerEmail,
      customerName,
      customerPhone,
    } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `VPC-${dateStr}-${randomSuffix}`;

    // Create Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cartItems.map(
        (item: { name: string; price: number; quantity: number }) => ({
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.price * 100), // Convert to pence
          },
          quantity: item.quantity,
        })
      );

    // Create order in Firestore (pending payment)
    let orderId = "";
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      const orderData = {
        orderNumber,
        userId,
        customerEmail,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        amount,
        currency: currency.toUpperCase(),
        status: "pending_payment",
        paymentMethod: "stripe",
        items: cartItems.map(
          (item: {
            id: string;
            name: string;
            category?: string;
            price: number;
            quantity: number;
            image?: string;
          }) => ({
            productId: item.id,
            name: item.name,
            category: item.category || "",
            price: item.price,
            quantity: item.quantity,
            image: item.image || "",
          })
        ),
        shippingAddress,
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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: `${baseUrl}/?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        orderNumber,
        orderId,
        userId,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
      },
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
