/**
 * Analytics Reset API - Admin Only
 * DELETE /api/admin/analytics/reset
 *
 * Allows admin to reset analytics data for testing or privacy compliance
 * Options: all, sessions, pageviews, events, or date range
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../../services/auth-admin.js";
import admin from "firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
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

  if (req.method !== "DELETE" && req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Admin access required",
      });
    }

    const db = admin.firestore();

    // Parse request body
    const {
      type = "all", // Options: "all", "sessions", "pageviews", "events", "security", "custom"
      startDate,
      endDate,
      collections = [], // For custom reset
      confirm = false, // Safety flag
    } = req.body || {};

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: "Confirmation required - set confirm: true in request body",
      });
    }

    console.log(`[Analytics Reset] Admin initiating reset - Type: ${type}`);

    let deletedCount = 0;
    const deletedCollections: string[] = [];

    // Helper function to delete documents in batches
    async function deleteCollection(
      collectionName: string,
      startDate?: string,
      endDate?: string
    ) {
      const collectionRef = db.collection(collectionName);
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
        collectionRef;

      // Add date filters if provided
      if (startDate) {
        query = query.where("timestamp", ">=", new Date(startDate));
      }
      if (endDate) {
        query = query.where("timestamp", "<=", new Date(endDate));
      }

      const snapshot = await query.get();
      const batchSize = 500;
      let batch = db.batch();
      let batchCount = 0;
      let totalDeleted = 0;

      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        totalDeleted++;

        if (batchCount >= batchSize) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Commit remaining documents
      if (batchCount > 0) {
        await batch.commit();
      }

      return totalDeleted;
    }

    // Determine which collections to reset
    const collectionsToReset: string[] = [];

    switch (type) {
      case "all":
        collectionsToReset.push(
          "analytics_sessions",
          "analytics_pageviews",
          "analytics_events",
          "analytics_downloads",
          "analytics_security",
          "analytics_products",
          "analytics_builds",
          "analytics_saves",
          "analytics_cart",
          "analytics_compat",
          "analytics_quality",
          "analytics_frustration",
          "analytics_performance",
          "analytics_adoption"
        );
        break;
      case "sessions":
        collectionsToReset.push("analytics_sessions");
        break;
      case "pageviews":
        collectionsToReset.push("analytics_pageviews");
        break;
      case "events":
        collectionsToReset.push("analytics_events");
        break;
      case "security":
        collectionsToReset.push("analytics_security");
        break;
      case "custom":
        if (Array.isArray(collections) && collections.length > 0) {
          collectionsToReset.push(...collections);
        } else {
          return res.status(400).json({
            success: false,
            error: "Custom reset requires collections array",
          });
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid reset type",
        });
    }

    // Execute deletion
    for (const collectionName of collectionsToReset) {
      try {
        const deleted = await deleteCollection(
          collectionName,
          startDate,
          endDate
        );
        deletedCount += deleted;
        deletedCollections.push(collectionName);
        console.log(
          `[Analytics Reset] Deleted ${deleted} documents from ${collectionName}`
        );
      } catch (error) {
        console.error(
          `[Analytics Reset] Error deleting ${collectionName}:`,
          error
        );
      }
    }

    // Log the reset action
    await db.collection("admin_audit_log").add({
      action: "analytics_reset",
      type,
      startDate: startDate || null,
      endDate: endDate || null,
      deletedCount,
      collections: deletedCollections,
      timestamp: new Date(),
      adminUid: user.uid, // Log admin user ID for audit
    });

    return res.status(200).json({
      success: true,
      data: {
        deletedCount,
        collections: deletedCollections,
        type,
        dateRange: startDate && endDate ? { startDate, endDate } : null,
      },
      message: `Successfully reset analytics data. Deleted ${deletedCount} documents.`,
    });
  } catch (error) {
    console.error("[Analytics Reset] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
