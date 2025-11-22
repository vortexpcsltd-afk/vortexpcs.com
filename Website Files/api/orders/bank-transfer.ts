import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import { logger } from "../services/logger";
import {
  sendOrderNotificationEmail,
  sendOrderConfirmationEmail,
} from "../../services/email";

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

    // Create order in Firestore
    if (!admin.apps.length) {
      throw new Error("Firebase not configured");
    }

    const db = admin.firestore();
    const orderData = {
      orderNumber,
      userId,
      customerEmail,
      customerName: customerName || "",
      amount,
      currency: currency.toUpperCase(),
      status: "pending_payment",
      paymentMethod: "bank_transfer",
      items: cartItems.map((item: any) => ({
        productId: item.id,
        name: item.name,
        category: item.category || "",
        price: item.price,
        quantity: item.quantity,
        image: item.image || "",
      })),
      shippingAddress,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      notes: "Awaiting bank transfer payment confirmation",
    };

    const orderRef = await db.collection("orders").add(orderData);

    logger.info("Bank transfer order created", {
      orderId: orderRef.id,
      orderNumber,
      userId,
      amount,
      currency,
    });

    // Send pending payment emails (customer + admin)
    try {
      const simplifiedAddress = {
        line1: String(shippingAddress.address || shippingAddress.line1 || ""),
        city: String(shippingAddress.city || ""),
        postal_code: String(
          shippingAddress.postcode || shippingAddress.postal_code || ""
        ),
        country: String(shippingAddress.country || "GB"),
      };
      const orderEmailPayload = {
        orderNumber,
        customerName:
          orderData.customerName ||
          orderData.customerEmail.split("@")[0] ||
          "Customer",
        customerEmail: orderData.customerEmail,
        totalAmount: orderData.amount,
        paymentStatus: "pending_bank_transfer",
        orderDate: new Date().toISOString(),
        items: orderData.items.map((i: any) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        shippingAddress: simplifiedAddress,
      };
      await sendOrderConfirmationEmail(orderEmailPayload as any); // customer (pending)
      await sendOrderNotificationEmail(
        orderEmailPayload as any,
        process.env.BUSINESS_EMAIL ||
          process.env.VITE_BUSINESS_EMAIL ||
          "orders@vortexpcs.com"
      );
    } catch (emailErr) {
      logger.error(
        "Failed to send bank transfer notification emails",
        emailErr
      );
    }

    return res.status(200).json({
      success: true,
      orderId: orderRef.id,
      orderNumber,
      message: "Order created. Bank transfer details sent to email.",
    });
  } catch (error: unknown) {
    logger.error("Error creating bank transfer order:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create bank transfer order",
    });
  }
}
