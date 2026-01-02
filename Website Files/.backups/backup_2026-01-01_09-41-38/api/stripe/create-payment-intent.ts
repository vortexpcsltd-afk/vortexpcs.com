import Stripe from "stripe";
import type { StripeErrorData } from "../../types/api.js";
import { logEnvOnce } from "../../services/envValidation.js";
import { applySecurityHeaders } from "../../services/securityHeaders.js";
import { ALLOWED_ORIGINS } from "../middleware/apiSecurity.js";
import { rateLimitMiddleware } from "../../services/rateLimitDistributed.js";
import { csrfMiddleware } from "../middleware/csrfMiddleware.js";
import { logger } from "../services/logger.js";
import { sanitizeEmail, sanitizeName } from "../../utils/validation.js";
import {
  PaymentIntentSchema,
  CartItemsSchema,
  ShippingAddressSchema,
  validatePaymentAmount,
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
    const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!base64Key) {
      // Firebase features will be disabled
    } else {
      try {
        const serviceAccount = JSON.parse(
          Buffer.from(base64Key, "base64").toString("utf-8")
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch (parseError) {
        console.error("Firebase_Admin_Init_Failed", {
          reason: "service_account_parse",
          error:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        });
      }
    }
  } catch (error) {
    console.error("Firebase_Admin_Init_Failed", {
      reason: "unexpected",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set all headers before any potential early returns
  try {
    // Security & CORS headers
    applySecurityHeaders(res);

    const requestOrigin = (req.headers?.origin as string | undefined) || "";
    const allow = new Set<string>(ALLOWED_ORIGINS as unknown as string[]);

    if (requestOrigin && allow.has(requestOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      // Default to primary site origin to allow cookies
      res.setHeader("Access-Control-Allow-Origin", "https://vortexpcs.com");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
    );
  } catch (headerError) {
    console.error("Header_Setup_Error", {
      error:
        headerError instanceof Error
          ? headerError.message
          : String(headerError),
    });
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Validate CSRF token (mandatory for payment endpoint)
  const csrfValid = await csrfMiddleware(req, res);
  if (!csrfValid) {
    return; // Response already sent by middleware
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
    } catch (stripeInitError) {
      console.error("Stripe_Init_Error", {
        error:
          stripeInitError instanceof Error
            ? stripeInitError.message
            : String(stripeInitError),
      });
      return res.status(500).json({
        message: "Payment service initialization failed",
        error: "stripe_init_error",
      });
    }

    // Distributed rate limiting: 30 requests per minute per IP, with suspicious burst detection
    // Required: false = fail open if Firebase unavailable (allows guest checkout)
    await rateLimitMiddleware(req, res, {
      maxRequests: 30,
      windowMs: 60000,
      blockDurationMs: 3600000,
      required: false, // Changed from true - allows payments even if Firebase unavailable
    });

    // Extract idempotency key from headers (prevent duplicate charges)
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    if (idempotencyKey) {
      logger.info("Received idempotency key", {
        key: idempotencyKey.substring(0, 10) + "...",
      });
    } else {
      logger.warn("No idempotency key provided - duplicate charge risk");
    }

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
      coupon,
      buildService,
      // Optional loyalty fields from client
      loyaltyPointsApplied,
      loyaltyDiscount,
      loyaltyBalance,
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
        metadata: clientMetadata as Record<string, unknown> | undefined,
        customerEmail,
        description: customerName,
      });
    } catch (validationError) {
      console.error("Zod_Validation_Error", {
        schema: "PaymentIntent",
        hasAmount: amount !== undefined,
        hasCurrency: currency !== undefined,
        hasEmail: customerEmail !== undefined,
      });
      logger.warn(
        "Payment intent validation failed:",
        validationError instanceof Error
          ? { error: validationError.message }
          : undefined
      );
      return res.status(400).json({
        message:
          validationError instanceof Error
            ? validationError.message
            : "Invalid payment data",
        error: "validation_error",
      });
    }

    // Validate cart items FIRST (before amount validation)
    if (Array.isArray(cartItems)) {
      try {
        CartItemsSchema.parse(cartItems as unknown);
      } catch (cartError) {
        console.error("Cart_Validation_Error", {
          itemCount: cartItems.length,
          hasFirstItem: !!cartItems[0],
        });
        logger.warn(
          "Cart items validation failed:",
          cartError instanceof Error ? { error: cartError.message } : undefined
        );
        return res.status(400).json({
          message:
            cartError instanceof Error
              ? cartError.message
              : "Invalid cart items",
          error: "invalid_cart",
        });
      }
    }

    const safeEmail = sanitizeEmail(customerEmail);
    const safeName = sanitizeName(customerName);

    // Validate email matches between shippingAddress and customerEmail
    if (safeEmail && customerEmail) {
      const normalizedFormEmail = customerEmail.trim().toLowerCase();
      const normalizedSafeEmail = safeEmail.toLowerCase();
      if (normalizedFormEmail !== normalizedSafeEmail) {
        console.error("Email_Mismatch", {
          formEmail: normalizedFormEmail,
          sanitizedEmail: normalizedSafeEmail,
        });
        return res.status(400).json({
          message: "Customer email mismatch detected",
          error: "email_mismatch",
        });
      }
    }

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
    let amountDiscrepancy = 0;
    if (cartItems && Array.isArray(cartItems)) {
      try {
        const validatedItems = CartItemsSchema.parse(cartItems as unknown);
        const serverCalculatedSubtotal = validatedItems.reduce(
          (sum: number, item) => sum + item.price * item.quantity,
          0
        );
        const serverShippingCost =
          typeof shippingCost === "number" ? shippingCost : 0;

        // Validate and apply build service fee
        let serverBuildServiceCost = 0;
        if (buildService && typeof buildService === "object") {
          const buildServicePrice = buildService.price;
          if (
            typeof buildServicePrice === "number" &&
            buildServicePrice >= 0 &&
            buildServicePrice <= 500
          ) {
            serverBuildServiceCost = buildServicePrice;
          } else {
            logger.warn("Invalid build service price", { buildService });
          }
        }

        // Validate and apply discount
        let serverDiscountAmount = 0;
        if (coupon && typeof coupon === "object") {
          const discountAmount = coupon.discountAmount;
          const discountPercent = coupon.discountPercent;

          // Validate discount amount is reasonable
          if (
            typeof discountAmount === "number" &&
            discountAmount >= 0 &&
            discountAmount <= serverCalculatedSubtotal + serverBuildServiceCost
          ) {
            serverDiscountAmount = discountAmount;

            // Double-check discount percent calculation matches
            if (typeof discountPercent === "number") {
              const expectedDiscount =
                ((serverCalculatedSubtotal + serverBuildServiceCost) *
                  discountPercent) /
                100;
              const discountDiff = Math.abs(expectedDiscount - discountAmount);
              if (discountDiff > 0.5) {
                logger.warn("Discount calculation mismatch", {
                  expectedDiscount,
                  discountAmount,
                  discountPercent,
                });
                // Use server-calculated discount for safety
                serverDiscountAmount = expectedDiscount;
              }
            }
          } else {
            logger.warn("Invalid discount amount", { coupon });
          }
        }

        const serverCalculatedTotal =
          serverCalculatedSubtotal +
          serverBuildServiceCost +
          serverShippingCost -
          serverDiscountAmount;

        amountDiscrepancy = Math.abs(normalizedAmount - serverCalculatedTotal);

        logger.info("Server-side amount validation", {
          clientAmount: normalizedAmount.toFixed(2),
          serverSubtotal: serverCalculatedSubtotal.toFixed(2),
          serverBuildService: serverBuildServiceCost.toFixed(2),
          serverShipping: serverShippingCost.toFixed(2),
          serverDiscount: serverDiscountAmount.toFixed(2),
          serverTotal: serverCalculatedTotal.toFixed(2),
          discrepancy: amountDiscrepancy.toFixed(2),
          shippingMethod: shippingMethod || "free",
          couponCode: coupon?.code || null,
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
        logger.error(
          "Cart validation during amount check failed:",
          cartValidationError
        );
      }
    } else {
      // Log amount discrepancy when cart items are not provided
      if (amountDiscrepancy > 0.02) {
        console.error("⚠️ STRIPE AMOUNT MISMATCH!", {
          discrepancy: amountDiscrepancy,
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

    // Validate shipping address structure and required fields
    try {
      ShippingAddressSchema.parse(shippingAddress);
    } catch (addressError) {
      console.error("Address_Validation_Error", {
        hasStreet: !!shippingAddress.street,
        hasCity: !!shippingAddress.city,
        hasPostcode: !!shippingAddress.postcode,
        hasCountry: !!shippingAddress.country,
        error:
          addressError instanceof Error
            ? addressError.message
            : String(addressError),
      });
      logger.warn(
        "Shipping address validation failed:",
        addressError instanceof Error
          ? { error: addressError.message }
          : undefined
      );
      return res.status(400).json({
        message:
          addressError instanceof Error
            ? addressError.message
            : "Invalid shipping address format",
        error: "invalid_address",
      });
    }

    // Generate order number based on customer type
    // If idempotency key is provided, check if we've already generated an order number
    const db = admin.apps.length > 0 ? admin.firestore() : undefined;
    let orderNumber: string;

    if (idempotencyKey && db) {
      // Check if we've already processed this idempotency key
      try {
        const idempotencyRef = db
          .collection("idempotency_cache")
          .doc(idempotencyKey);
        const idempotencyDoc = await idempotencyRef.get();

        if (idempotencyDoc.exists) {
          const cachedData = idempotencyDoc.data();
          orderNumber = cachedData?.orderNumber;

          logger.info("Reusing order number from idempotency cache", {
            orderNumber,
            idempotencyKey: idempotencyKey.substring(0, 10) + "...",
          });
        } else {
          // Generate new order number and cache it
          orderNumber = await generateOrderNumber(userId, db);

          // Store in idempotency cache (24 hour TTL)
          await idempotencyRef.set({
            orderNumber,
            userId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          });

          logger.info("Generated and cached new order number", {
            orderNumber,
            idempotencyKey: idempotencyKey.substring(0, 10) + "...",
          });
        }
      } catch (cacheError) {
        logger.warn("Idempotency cache lookup failed, generating new number", {
          error: cacheError,
        });
        orderNumber = await generateOrderNumber(userId, db);
      }
    } else {
      // No idempotency key or no database - generate new order number
      orderNumber = await generateOrderNumber(userId, db);
    }

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
            ean?: string;
          }) => ({
            id: i.id,
            n: i.name,
            p: i.price,
            q: i.quantity,
            img: i.image || "",
            e: i.ean || "",
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
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
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
          // Loyalty metadata (strings only)
          loyaltyPointsApplied:
            typeof loyaltyPointsApplied === "number"
              ? String(loyaltyPointsApplied)
              : String(0),
          loyaltyDiscount:
            typeof loyaltyDiscount === "number"
              ? String(loyaltyDiscount)
              : String(0),
          loyaltyBalance:
            typeof loyaltyBalance === "number"
              ? String(loyaltyBalance)
              : undefined,
        },
        description: `Order ${orderNumber} - ${safeName || safeEmail}`,
      };

      // Add idempotency key to request options if provided
      const requestOptions: Stripe.RequestOptions = {};
      if (idempotencyKey) {
        requestOptions.idempotencyKey = idempotencyKey;
        logger.info("Using idempotency key for payment intent creation", {
          orderNumber,
        });
      }

      paymentIntent = await getStripeInstance().paymentIntents.create(
        paymentIntentParams,
        requestOptions
      );
    } catch (stripeError) {
      console.error("Stripe_API_Error", {
        message: (stripeError as Error).message,
        code: (stripeError as StripeErrorData).code,
        hasStatusCode: !!(stripeError as StripeErrorData).statusCode,
      });
      throw stripeError;
    }

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderNumber,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error: unknown) {
    const err = error as StripeError;
    console.error("PaymentIntent_Error", {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
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
    console.error("PaymentIntent_Final_Response", {
      statusCode,
      errorType,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    });

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
