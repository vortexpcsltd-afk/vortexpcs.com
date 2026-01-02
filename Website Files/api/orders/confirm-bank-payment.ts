import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import {
  redeemPoints,
  POINTS_PER_POUND_VALUE,
} from "../../services/vortexVault.js";
import { withSecureMethod } from "../middleware/apiSecurity.js";

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

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate as admin (required for bank payment confirmation)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ") || !admin.apps.length) {
      console.warn("❌ Unauthorized bank payment confirmation attempt");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let adminUser: admin.auth.DecodedIdToken;
    try {
      const token = authHeader.substring(7);
      adminUser = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.warn("❌ Invalid auth token for bank confirmation");
      return res.status(401).json({ error: "Invalid token" });
    }

    // For now, allow any authenticated user; can be restricted to admins via custom claims later
    const { orderId, orderNumber } = req.body || {};

    if (!orderId && !orderNumber) {
      return res.status(400).json({
        error: "Either orderId or orderNumber is required",
      });
    }

    const db = admin.firestore();
    let orderRef: admin.firestore.DocumentReference;
    let orderDoc: admin.firestore.DocumentSnapshot;

    // Fetch order by orderId or orderNumber
    if (orderId) {
      orderRef = db.collection("orders").doc(orderId);
      orderDoc = await orderRef.get();
    } else {
      // Query by orderNumber
      const query = await db
        .collection("orders")
        .where("orderNumber", "==", orderNumber)
        .limit(1)
        .get();

      if (query.empty) {
        return res.status(404).json({
          error: `Order not found: ${orderNumber}`,
        });
      }

      orderRef = query.docs[0].ref;
      orderDoc = query.docs[0];
    }

    if (!orderDoc.exists) {
      return res.status(404).json({
        error: `Order not found: ${orderId}`,
      });
    }

    const orderData = orderDoc.data() as Record<string, any>;

    // Verify it's a bank transfer order with pending_payment status
    if (orderData.paymentMethod !== "bank_transfer") {
      return res.status(400).json({
        error: "Order is not a bank transfer order",
      });
    }

    if (orderData.status !== "pending_payment") {
      return res.status(400).json({
        error: `Order status is ${orderData.status}, cannot confirm already paid order`,
      });
    }

    const userId = orderData.userId;
    const loyaltyData = orderData.loyalty || {};
    const pointsApplied = loyaltyData.pointsApplied || 0;
    const discountApplied = loyaltyData.discount || 0;

    // Calculate points to redeem
    let pointsToRedeem = 0;
    if (pointsApplied > 0) {
      pointsToRedeem = pointsApplied;
    } else if (discountApplied > 0) {
      pointsToRedeem = Math.max(
        0,
        Math.round(discountApplied * POINTS_PER_POUND_VALUE)
      );
    }

    // Attempt to redeem points if applicable
    let redeemResult: {
      success: boolean;
      message?: string;
      newBalance?: number;
    } = { success: true };

    if (userId && userId !== "guest" && pointsToRedeem > 0) {
      try {
        redeemResult = await redeemPoints(userId, pointsToRedeem);
        if (!redeemResult.success) {
          console.warn("⚠️ Vault redemption failed (bank confirmation)", {
            userId,
            orderId: orderDoc.id,
            orderNumber: orderData.orderNumber,
            pointsToRedeem,
            message: redeemResult.message,
          });
        } else {
          console.log("✅ Redeemed points on bank confirmation", {
            userId,
            orderId: orderDoc.id,
            orderNumber: orderData.orderNumber,
            pointsRedeemed: pointsToRedeem,
            newBalance: redeemResult.newBalance,
          });
        }
      } catch (redeemErr) {
        console.error(
          "❌ Error redeeming points on bank confirmation",
          redeemErr
        );
        // Log the error but don't fail the payment confirmation
        redeemResult = {
          success: false,
          message: `Points redemption failed: ${
            redeemErr instanceof Error ? redeemErr.message : String(redeemErr)
          }`,
        };
      }
    } else {
      console.log("ℹ️ No points to redeem on bank confirmation", {
        userId,
        pointsApplied,
        discountApplied,
      });
    }

    // Update order status to paid
    await orderRef.update({
      status: "paid",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentConfirmedBy: adminUser.uid,
      vaultRedemptionResult: redeemResult,
    });

    console.log("✅ Bank payment confirmed and order updated", {
      orderId: orderDoc.id,
      orderNumber: orderData.orderNumber,
      previousStatus: "pending_payment",
      newStatus: "paid",
    });

    // Process referral bonus if user was referred
    if (userId && userId !== "guest") {
      try {
        const { processReferralBonus } = await import(
          "../../services/vortexVaultReferrals"
        );
        await processReferralBonus(userId, orderDoc.id);
        console.log("🎁 Referral bonus check completed (bank transfer)", {
          userId,
          orderId: orderDoc.id,
        });
      } catch (refErr) {
        console.warn("Referral bonus processing failed (non-critical)", refErr);
      }
    }

    return res.status(200).json({
      success: true,
      orderId: orderDoc.id,
      orderNumber: orderData.orderNumber,
      previousStatus: "pending_payment",
      newStatus: "paid",
      vaultRedemption: redeemResult.success
        ? {
            pointsRedeemed: pointsToRedeem,
            newBalance: redeemResult.newBalance,
          }
        : {
            failed: true,
            message: redeemResult.message,
          },
      message: "Bank payment confirmed successfully",
    });
  } catch (error: unknown) {
    console.error("❌ Error confirming bank payment:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm bank payment",
    });
  }
}

export default withSecureMethod("POST", handler);
