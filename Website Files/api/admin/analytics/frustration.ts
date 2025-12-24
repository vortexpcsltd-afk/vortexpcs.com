/**
 * API endpoint: User frustration signals analytics
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../../services/auth-admin.js";
import { getCache, setCache } from "../../services/cache.js";

import { isFirebaseConfigured } from "../../services/env-utils.js";
import admin from "firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  if (!isFirebaseConfigured()) {
    console.log("[frustration] Firebase not configured");
    return res.status(503).json({
      error: "Analytics not configured",
      message: "Firebase is not configured. Please set environment variables.",
    });
  }

  try {
    const user = await verifyAdmin(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    const startTs = admin.firestore.Timestamp.fromDate(startDate);

    const cacheKey = `frustration:${daysNum}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const db = admin.firestore();

    // Fetch frustration events
    let snap;
    try {
      snap = (await Promise.race([
        db
          .collection("analytics_events")
          .where("timestamp", ">=", startTs)
          .where("eventType", "==", "frustration_signal")
          .orderBy("timestamp", "desc")
          .limit(5000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
    } catch (error) {
      console.error("Frustration events query error:", error);
      const payload = {
        success: true,
        data: {
          totalSignals: 0,
          bySubtype: {},
          topSelectors: [],
          topPages: [],
          period: daysNum,
        },
      };
      setCache(cacheKey, payload, 60_000);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(payload);
    }

    const bySubtype: Record<string, number> = {};
    const selectorCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      const subtype = String(data.eventData?.subtype || "unknown");
      bySubtype[subtype] = (bySubtype[subtype] || 0) + 1;

      const selector = String(data.eventData?.selector || "");
      if (selector)
        selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;

      const page = String(data.page || data.eventData?.page || "");
      if (page) pageCounts[page] = (pageCounts[page] || 0) + 1;
    });

    const topSelectors = Object.entries(selectorCounts)
      .map(([selector, count]) => ({ selector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topPages = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const payload = {
      success: true,
      data: {
        totalSignals: snap.size,
        bySubtype,
        topSelectors,
        topPages,
        period: daysNum,
      },
    };

    setCache(cacheKey, payload, 60_000);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching frustration analytics:", error);
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
      error: "Failed to fetch frustration analytics",
      details: errorMsg,
    });
  }
}

