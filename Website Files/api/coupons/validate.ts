import { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import { logger } from "../../services/logger";

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

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).json({});
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const { code } = req.body;

    // Validate input
    if (!code || typeof code !== "string") {
      res.status(400).json({ message: "Coupon code is required" });
      return;
    }

    const normalizedCode = code.trim().toUpperCase();

    // Initialize Firestore
    const db = admin.firestore();

    // Check if coupon exists in member's account
    const couponsSnapshot = await db
      .collection("coupons")
      .where("code", "==", normalizedCode)
      .where("active", "==", true)
      .limit(1)
      .get();

    if (couponsSnapshot.empty) {
      logger.warn("Coupon not found or inactive", { code: normalizedCode });
      res.status(404).json({ message: "Coupon code not found or expired" });
      return;
    }

    const couponDoc = couponsSnapshot.docs[0];
    const couponData = couponDoc.data() as {
      code: string;
      discountPercent: number;
      expiresAt?: admin.firestore.Timestamp;
      maxUses?: number;
      timesUsed?: number;
      active: boolean;
    };

    // Check expiration
    if (couponData.expiresAt) {
      const expiresDate = couponData.expiresAt.toDate();
      if (expiresDate < new Date()) {
        logger.warn("Coupon expired", {
          code: normalizedCode,
          expiresAt: expiresDate,
        });
        res.status(400).json({ message: "Coupon code has expired" });
        return;
      }
    }

    // Check usage limit
    if (
      couponData.maxUses &&
      couponData.timesUsed &&
      couponData.timesUsed >= couponData.maxUses
    ) {
      logger.warn("Coupon usage limit reached", { code: normalizedCode });
      res
        .status(400)
        .json({ message: "Coupon code has reached its usage limit" });
      return;
    }

    logger.info("Coupon validated successfully", {
      code: normalizedCode,
      discountPercent: couponData.discountPercent,
    });

    // Return coupon details
    res.status(200).json({
      code: couponData.code,
      discountPercent: couponData.discountPercent,
    });
  } catch (error) {
    logger.error("Coupon validation error:", error);
    res.status(500).json({
      message: "Failed to validate coupon",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
