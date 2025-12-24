import Stripe from "stripe";
import type { StripeErrorData } from "../../types/api.js";
import { logEnvOnce } from "../../services/envValidation.js";
import { applySecurityHeaders } from "../../services/securityHeaders.js";
import { rateLimitMiddleware } from "../../services/rateLimitDistributed.js";
import {
  sanitizeEmail,
  sanitizeName,
  clampAmount,
} from "../../utils/validation.js";
import {
  PaymentIntentSchema,
  CartItemsSchema,
  validatePaymentAmount,
  sanitizeMetadata,
  toPence,
  fromPence,
} from "../../utils/paymentValidation.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { StripeError } from "../../types/api";
import admin from "firebase-admin";
import { generateOrderNumber } from "../utils/orderNumber.js";

// Initialize Stripe lazily on first request - avoids 500 errors from missing keys at load time
let stripe: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (stripe) return stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  stripe = new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
  });
  return stripe;
}

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
  // Set all headers before any potential early returns
  try {
    // Security & CORS headers
    applySecurityHeaders(res);
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
  } catch (headerError) {
    console.error("❌ Error setting security headers:", headerError);
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    logEnvOnce("create-payment-intent");

    // Early validation: ensure Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error(
        "STRIPE_SECRET_KEY not configured - payment processing disabled"
      );
      return res.status(500).json({
        message:
          "Payment service unavailable. Please contact support or try again later.",
        error: "stripe_not_configured",
      });
    }

    // Test Stripe initialization early
    try {
      getStripeInstance();
      console.log("✅ Stripe instance initialized successfully");
    } catch (stripeInitError) {
      console.error("❌ Stripe initialization failed:", stripeInitError);
      return res.status(500).json({
        message: "Payment service initialization failed",
        error: "stripe_init_error",
      });
    }

    // Distributed rate limiting: 30 requests per minute per IP, with suspicious burst detection
    // Required: true = fail closed if Firebase unavailable (payment security critical)
    const rateLimitPassed = await rateLimitMiddleware(req, res, {
      maxRequests: 30,
      windowMs: 60000,
      blockDurationMs: 3600000,
      required: true,
    });
    if (!rateLimitPassed) return;

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
      shippingMethod,
      shippingCost,
      metadata: clientMetadata,
    } = req.body;

    // Validate request body exists
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        message: "Invalid request body",
        error: "invalid_body",
      });
    }

    // Validate Zod schema
    try {
      PaymentIntentSchema.parse({
        amount,
        currency,
        metadata: clientMetadata,
        customerEmail,
        description: customerName,
      });
    } catch (validationError) {
      logger.warn("Payment intent validation failed:", validationError);
      return res.status(400).json({
        message:
          validationError instanceof Error
            ? validationError.message
            : "Invalid payment data",
        error: "validation_error",
      });
    }

    // Validate cart items if provided
    if (Array.isArray(cartItems)) {
      try {
        CartItemsSchema.parse(cartItems);
      } catch (cartError) {
        logger.warn("Cart items validation failed:", cartError);
        return res.status(400).json({
          message:
            cartError instanceof Error ? cartError.message : "Invalid cart items",
          error: "invalid_cart",
        });
      }
    }

    const safeEmail = sanitizeEmail(customerEmail);
    const safeName = sanitizeName(customerName);
    const sanitizedMetadata = sanitizeMetadata(clientMetadata);

    // Validate amount using strict validation
    const normalizedAmount =
      typeof amount === "number" && Number.isFinite(amount) ? amount : 0;

    if (!validatePaymentAmount(normalizedAmount)) {
      logger.error("Invalid payment amount:", {
        originalAmount: amount,
        normalizedAmount,
        type: typeof amount,
      });
      return res.status(400).json({
        message: "Invalid payment amount",
        error: "invalid_amount",
      });
    }

    // Server-side amount validation against cart items
    if (cartItems && Array.isArray(cartItems)) {
      try {
        const validatedItems = CartItemsSchema.parse(cartItems);
        const serverCalculatedSubtotal = validatedItems.reduce(
          (sum: number, item) => sum + item.price * item.quantity,
          0
        );
        const serverShippingCost =
          typeof shippingCost === "number" ? shippingCost : 0;
        const serverCalculatedTotal =
          serverCalculatedSubtotal + serverShippingCost;
        const amountDiscrepancy = Math.abs(
          normalizedAmount - serverCalculatedTotal
        );

        logger.info("Server-side amount validation", {
          clientAmount: normalizedAmount.toFixed(2),
          serverSubtotal: serverCalculatedSubtotal.toFixed(2),
          serverShipping: serverShippingCost.toFixed(2),
          serverTotal: serverCalculatedTotal.toFixed(2),
          discrepancy: amountDiscrepancy.toFixed(2),
          shippingMethod: shippingMethod || "free",
        });

        // Alert on significant discrepancies (> £1 difference)
        if (amountDiscrepancy > 1) {
          logger.warn("Price tampering suspected", {
            clientAmount: normalizedAmount,
            serverTotal: serverCalculatedTotal,
            discrepancy: amountDiscrepancy,
          });
          return res.status(400).json({
            message: "Cart total does not match item prices",
            error: "amount_mismatch",
          });
        }
      } catch (cartValidationError) {
        logger.error("Cart validation during amount check failed:", cartValidationError);
      }
    }

      if (amountDiscrepancy > 0.02) {
        console.error("⚠️ STRIPE AMOUNT MISMATCH!", {
          expected: serverCalculatedTotal,
          received: normalizedAmount,
          difference: amountDiscrepancy,
        });
      }
    }

    // Validation
    if (!normalizedAmount || normalizedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart items are required" });
    }

    if (!safeEmail) {
      return res.status(400).json({ message: "Customer email is required" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // Generate order number based on customer type
    const db = admin.apps.length > 0 ? admin.firestore() : undefined;
    const orderNumber = await generateOrderNumber(userId, db);

    console.log("Creating Payment Intent:", {
      orderNumber,
      userId,
      amount: normalizedAmount,
      customerEmail: safeEmail,
    });

    // Serialize cart and address for metadata (Stripe 500 char limit per field)
    let cartSerialized = "";
    let addressSerialized = "";

    try {
      const cartJson = JSON.stringify(
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
      );
      cartSerialized = Buffer.from(cartJson).toString("base64");

      // Stripe metadata has a 500 char per field limit
      if (cartSerialized.length > 500) {
        console.warn("⚠️ Cart metadata too large, truncating:", {
          size: cartSerialized.length,
          itemCount: cartItems.length,
        });
        cartSerialized = cartSerialized.substring(0, 497) + "...";
      }

      addressSerialized = JSON.stringify(shippingAddress);
      if (addressSerialized.length > 500) {
        console.warn("⚠️ Address metadata too large, truncating:", {
          size: addressSerialized.length,
        });
        addressSerialized = addressSerialized.substring(0, 497) + "...";
      }
    } catch (serializeError) {
      console.error(
        "❌ Error serializing cart/address metadata:",
        serializeError
      );
      return res.status(400).json({
        message: "Invalid cart or address data",
        error: "serialization_error",
      });
    }

    // Create Payment Intent with all order metadata
    let paymentIntent;
    try {
      console.log("📤 Creating Stripe Payment Intent with:", {
        amount: Math.round(normalizedAmount * 100),
        currency: currency.toLowerCase(),
        receipt_email: customerEmail,
        hasMetadata: true,
      });

      paymentIntent = await getStripeInstance().paymentIntents.create({
        amount: Math.round(normalizedAmount * 100), // Convert to pence
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        receipt_email: customerEmail,
        metadata: {
          orderNumber,
          userId,
          customerEmail: safeEmail,
          customerName: safeName || "",
          customerPhone: customerPhone || "",
          cart: cartSerialized,
          shippingAddress: addressSerialized,
          shippingMethod: shippingMethod || "free",
          shippingCost:
            typeof shippingCost === "number" ? String(shippingCost) : "0",
        },
        description: `Order ${orderNumber} - ${safeName || safeEmail}`,
      });

      console.log("✅ Payment Intent created:", {
        id: paymentIntent.id,
        clientSecret: !!paymentIntent.client_secret,
        status: paymentIntent.status,
      });
    } catch (stripeError) {
      console.error("❌ Stripe API error creating payment intent:", {
        error: stripeError,
        message: (stripeError as Error).message,
        code: (stripeError as StripeErrorData).code,
        statusCode: (stripeError as StripeErrorData).statusCode,
        requestId: (stripeError as StripeErrorData).requestId,
      });
      throw stripeError;
    }

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
    console.error("🔴 Stripe payment intent error:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      name: err.name,
    });

    // Determine status code
    let statusCode = err.statusCode || 500;
    let errorMessage = err.message || "Failed to create payment intent";
    const errorType = err.type || "unknown_error";

    // Handle specific error types
    if (errorMessage.includes("STRIPE_SECRET_KEY")) {
      statusCode = 500;
      errorMessage =
        "Payment service not configured: Missing Stripe credentials";
    }
    if (errorMessage.includes("Invalid API Key")) {
      statusCode = 500;
      errorMessage = "Payment service error: Invalid Stripe credentials";
    }

    // Log comprehensive error for debugging
    console.error(
      `💥 Final error response: ${statusCode} - ${errorType}: ${errorMessage}`,
      {
        env: process.env.NODE_ENV,
        stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
        errorCode: err.code,
      }
    );

    res.status(statusCode).json({
      message: errorMessage,
      error: errorType,
      details:
        process.env.NODE_ENV === "development"
          ? {
              code: err.code,
              statusCode: err.statusCode,
              stack: err.stack,
              stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
            }
          : undefined,
    });
  }
}
