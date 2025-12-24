/**
 * API endpoint: Get PWA installation statistics
 * Returns aggregated data on PWA installs, dismissals, and install rate
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../services/auth-admin.js";
import { getCache, setCache } from "../services/cache.js";
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

  try {
    // Verify admin authentication
    const user = await verifyAdmin(req);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized - Admin access required" });
    }

    // Check cache first
    const cacheKey = "pwa_stats";
    const cached = getCache(cacheKey);
    if (cached) {
      return res
        .status(200)
        .json({ success: true, data: cached, cached: true });
    }

    // Get Firestore instance
    const db = admin.firestore();

    // Query analytics_events collection for PWA-related events
    const analyticsSnapshot = await db
      .collection("analytics_events")
      .where("event", "==", "pwa_install")
      .get();

    // Aggregate by action type
    const stats = {
      installed: 0,
      dismissed: 0,
    };

    analyticsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const action = (data.action || "").toLowerCase();

      if (action === "accepted" || action === "installed") {
        stats.installed++;
      } else if (action === "dismissed" || action === "prompt_dismissed") {
        stats.dismissed++;
      }
    });

    // Calculate metrics for Admin Panel
    const installs = stats.installed;
    const dismissals = stats.dismissed;
    const promptShown = installs + dismissals; // Total prompts shown
    const installRate =
      promptShown > 0 ? Math.round((installs / promptShown) * 100) : 0;

    const result = {
      installs,
      dismissals,
      promptShown,
      installRate,
      breakdown: stats, // Include detailed breakdown
    };

    // Cache for 5 minutes (300 seconds)
    setCache(cacheKey, result, 300);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("PWA stats error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch PWA statistics",
      details: err?.message || String(err),
    });
  }
}
