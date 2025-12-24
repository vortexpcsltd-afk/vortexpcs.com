import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import admin from "firebase-admin";
import { logger } from "../../services/logger.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import {
  CartItemsSchema,
  validateCartTotal,
  validateEmail,
  sanitizeMetadata,
  toPence,
  fromPence,
} from "../../utils/paymentValidation.js";

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

    // Validation: Validate cart items using Zod schema
    let validatedItems;
    try {
      validatedItems = CartItemsSchema.parse(lineItemInput);
    } catch (validationError) {
      logger.warn("Invalid cart items received:", validationError);
      return res.status(400).json({
        error:
          validationError instanceof Error
            ? validationError.message
            : "Invalid cart items",
      });
    }

    // Validation: Check cart is not empty
    if (!validatedItems.length) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    // Validation: Check email is provided
    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    // Validation: Validate email format
    if (!validateEmail(customerEmail)) {
      return res.status(400).json({ error: "Invalid customer email address" });
    }

    // Validation: Sanitize metadata
    const sanitizedMetadata = sanitizeMetadata(clientMetadata);

    // Validation: Calculate and validate amount
    const calculatedAmount =
      typeof amount === "number" && amount > 0
        ? amount
        : fromPence(
            validatedItems.reduce(
              (sum: number, item) => sum + toPence(item.price * item.quantity),
              0
            )
          ) + (typeof shippingCost === "number" ? shippingCost : 0);

    if (!calculatedAmount || calculatedAmount <= 0) {
      logger.warn("Invalid cart amount", { amount, calculatedAmount });
      return res.status(400).json({ error: "Invalid cart amount" });
    }

    // Validation: Verify cart total hasn't been tampered with
    if (
      typeof amount === "number" &&
      !validateCartTotal(validatedItems, amount, 200)
    ) {
      logger.warn("Price tampering attempt detected", {
        sentAmount: amount,
        calculatedAmount,
        items: validatedItems.map((i) => ({ id: i.id, price: i.price })),
      });
      return res.status(400).json({
        error: "Cart total does not match item prices",
      });
    }

    // Validation: Check shipping cost is non-negative
    if (typeof shippingCost === "number" && shippingCost < 0) {
      logger.warn("Negative shipping cost attempt", { shippingCost });
      return res.status(400).json({ error: "Invalid shipping cost" });
    }

    // Generate order number based on customer type
    const db = admin.apps.length > 0 ? admin.firestore() : undefined;
    const orderNumber = await generateOrderNumber(userId, db);

    // Create Stripe line items from validated data
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      validatedItems.map((item) => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.name,
            description: item.description,
            metadata: item.id ? { productId: item.id } : undefined,
          },
          unit_amount: toPence(item.price), // Convert to pence
        },
        quantity: item.quantity,
      }));

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
        amount: calculatedAmount,
        currency: currency.toUpperCase(),
        status: "pending_payment",
        paymentMethod: "stripe",
        items: validatedItems.map((item) => ({
          productId: item.id || "",
          name: item.name,
          category: item.category || "",
          price: item.price,
          quantity: item.quantity,
          ean: item.ean || "",
          image: item.image || "",
        })),
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
        amount: calculatedAmount,
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
        validatedItems.map((item) => ({
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
      ...(sanitizedMetadata && typeof sanitizedMetadata === "object"
        ? sanitizedMetadata
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
