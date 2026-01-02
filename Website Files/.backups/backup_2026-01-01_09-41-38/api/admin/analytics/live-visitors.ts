/**
 * API endpoint: Get currently active visitors in real-time
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../../services/auth-admin.js";
import {
  withErrorHandler,
  validateMethod,
} from "../../middleware/error-handler.js";
import { isFirebaseConfigured } from "../../services/env-utils.js";
import admin from "firebase-admin";
import { createLogger } from "../../services/logger.js";

export default withErrorHandler(async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enforce method; CORS + OPTIONS handled by withErrorHandler
  validateMethod(req, ["GET"]);

  const logger = createLogger(req);
  res.setHeader("X-Trace-ID", logger.getTraceId());

  if (!isFirebaseConfigured()) {
    logger.info("[live-visitors] Firebase not configured");
    return res.status(503).json({
      error: "Analytics not configured",
      message: "Firebase is not configured. Please set environment variables.",
    });
  }

  try {
    // Verify admin authentication
    const user = await verifyAdmin(req);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized - Admin access required" });
    }

    // No caching for real-time data
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vary", "Authorization");

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const thirtySecondsAgo = admin.firestore.Timestamp.fromMillis(
      now.toMillis() - 30000
    ); // 30 seconds timeout

    // Get active visitors (last activity within 30 seconds)
    const activeVisitorsSnapshot = await db
      .collection("active_visitors")
      .where("lastActive", ">=", thirtySecondsAgo)
      .orderBy("lastActive", "desc")
      .limit(100)
      .get();

    const activeVisitors = activeVisitorsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        sessionId: data.sessionId || doc.id,
        currentPage: data.currentPage || "Unknown",
        currentActivity: data.currentActivity || "Browsing",
        lastActive:
          data.lastActive?.toDate().toISOString() || new Date().toISOString(),
        isAuthenticated: data.isAuthenticated || false,
        userId: data.userId,
        userName: data.userName,
        userAgent: data.userAgent,
        startTime: data.startTime?.toDate().toISOString(),
        location: data.location,
        ipAddress: data.ipAddress,
        // Journey tracking fields
        entryPage: data.entryPage,
        entryMethod: data.entryMethod,
        referrer: data.referrer,
        searchTerm: data.searchTerm,
        pageViews: data.pageViews || [],
        totalPageViews: data.totalPageViews || 0,
      };
    });

    // Calculate session durations
    const visitorsWithDuration = activeVisitors.map((visitor) => {
      let duration = 0;
      if (visitor.startTime) {
        duration = Math.floor(
          (new Date().getTime() - new Date(visitor.startTime).getTime()) / 1000
        );
      }
      return {
        ...visitor,
        duration, // in seconds
      };
    });

    // Group by page
    const pageBreakdown: Record<string, number> = {};
    visitorsWithDuration.forEach((visitor) => {
      pageBreakdown[visitor.currentPage] =
        (pageBreakdown[visitor.currentPage] || 0) + 1;
    });

    const payload = {
      success: true,
      data: {
        totalActive: visitorsWithDuration.length,
        visitors: visitorsWithDuration,
        pageBreakdown,
        timestamp: new Date().toISOString(),
      },
    };

    return res.status(200).json(payload);
  } catch (error) {
    logger.error("Error fetching live visitors", error);
    const errorStr = String(error);
    const errorMsg = error instanceof Error ? error.message : errorStr;

    // Check for Firebase initialization errors
    if (errorMsg.includes("Firebase") || errorMsg.includes("credentials")) {
      return res.status(503).json({
        error: "Firebase not configured on this deployment",
        message: "Analytics requires Firebase Admin credentials to be set",
        setupRequired: true,
      });
    }

    return res.status(500).json({
      error: "Failed to fetch live visitors",
      details: errorMsg,
    });
  }
});
