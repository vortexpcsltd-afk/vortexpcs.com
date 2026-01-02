/**
 * Admin API: List Vortex Vault referrals
 * GET /api/admin/referrals/list
 * Optional query params: status=pending|completed, referrerId, referredUserId
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Query, DocumentData } from "firebase-admin/firestore";
import { withErrorHandler } from "../../middleware/error-handler.js";
import {
  verifyAdmin,
  ensureFirebaseAdminInitialized,
} from "../../services/auth-admin.js";
import { createLogger } from "../../services/logger.js";

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const logger = createLogger(req);
  res.setHeader("X-Trace-ID", logger.getTraceId());

  // Verify admin
  const adminUser = await verifyAdmin(req);
  if (!adminUser) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // Initialize Firebase Admin
  let adminSdk;
  try {
    adminSdk = ensureFirebaseAdminInitialized();
  } catch (initErr) {
    logger.warn("[Admin Referrals List] Firebase not configured", {
      error: initErr instanceof Error ? initErr.message : String(initErr),
    });
    return res.status(200).json({ success: true, data: [], count: 0 });
  }
  const db = adminSdk.firestore();

  try {
    const { status, referrerId, referredUserId, startDate, endDate } =
      req.query as Record<string, string | undefined>;

    let queryRef: Query<DocumentData> = db.collection("vortex_vault_referrals");

    // Apply basic filters if provided
    if (status) queryRef = queryRef.where("status", "==", status);
    if (referrerId) queryRef = queryRef.where("referrerId", "==", referrerId);
    if (referredUserId)
      queryRef = queryRef.where("referredUserId", "==", referredUserId);

    // Date range filters (createdAt)
    try {
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          queryRef = queryRef.where("createdAt", ">=", start);
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          queryRef = queryRef.where("createdAt", "<=", end);
        }
      }
    } catch (e) {
      // If date parsing fails, ignore date filters and continue
      logger.warn("[Admin Referrals List] Invalid date filters provided", {
        startDate,
        endDate,
      });
    }

    const snapshot = await queryRef
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const referrals: unknown[] = [];
    snapshot.forEach((doc: DocumentData) => {
      const data = doc.data() as Record<string, any>;
      referrals.push({
        id: doc.id,
        referrerId: data.referrerId,
        referredUserId: data.referredUserId,
        referralCode: data.referralCode,
        status: data.status,
        bonusAwarded: !!data.bonusAwarded,
        orderId: data.orderId || null,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
        completedAt: data.completedAt?.toDate
          ? data.completedAt.toDate().toISOString()
          : data.completedAt,
      });
    });

    return res
      .status(200)
      .json({ success: true, data: referrals, count: referrals.length });
  } catch (error) {
    logger.error("[Admin Referrals List] Error", error as unknown as Error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const isPermError = message
      .toLowerCase()
      .includes("missing or insufficient permissions");
    if (isPermError) {
      logger.warn(
        "[Admin Referrals List] Permission error, returning empty list"
      );
      return res.status(200).json({ success: true, data: [], count: 0 });
    }
    return res.status(500).json({ success: false, error: message });
  }
}

export default withErrorHandler(handler);
