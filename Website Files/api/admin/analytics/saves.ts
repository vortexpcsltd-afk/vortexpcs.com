/**
 * API endpoint: Get build save analytics
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../../services/auth-admin.js";
import { getCache, setCache } from "../../services/cache.js";

import { isFirebaseConfigured } from "../../services/env-utils.js";
import admin from "firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isFirebaseConfigured()) {
    console.log("[saves] Firebase not configured");
    return res.status(503).json({
      error: "Analytics not configured",
      message: "Firebase is not configured. Please set environment variables.",
    });
  }

  try {
    // Verify admin authentication
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check cache (60 seconds)
    const cacheKey = "save-analytics";
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const db = admin.firestore();
    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);

    // Query build_saved events with timeout protection
    let savesSnapshot;
    let totalSaves = 0;
    let savedToAccount = 0;
    let savedForComparison = 0;

    try {
      savesSnapshot = (await Promise.race([
        db
          .collection("analytics_events")
          .where("eventType", "==", "build_saved")
          .where("timestamp", ">=", startTimestamp)
          .orderBy("timestamp", "desc")
          .limit(1000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;

      totalSaves = savesSnapshot.size;

      // Analyze save details
      savesSnapshot.forEach((doc) => {
        const data = doc.data();
        const eventData = data.eventData || {};
        if (eventData.savedToAccount) savedToAccount++;
        if (eventData.savedForComparison) savedForComparison++;
      });
    } catch (error) {
      console.error("Build saves query error:", error);
      totalSaves = 0;
    }

    const result = {
      summary: {
        totalSaves,
        savedToAccount,
        savedForComparison,
        accountSaveRate:
          totalSaves > 0
            ? ((savedToAccount / totalSaves) * 100).toFixed(1)
            : "0",
      },
      period: daysNum,
    };

    const payload = {
      success: true,
      data: result,
    };

    setCache(cacheKey, payload, 60);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching save analytics:", error);
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
      error: "Failed to fetch save analytics",
      details: errorMsg,
    });
  }
}

