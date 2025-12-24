/**
 * API endpoint: Browser/Device performance issues analytics
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../../services/auth-admin.js";
import { getCache, setCache } from "../../services/cache.js";

import {
  isDevelopment,
  isFirebaseConfigured,
} from "../../services/env-utils.js";
import admin from "firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isFirebaseConfigured()) {
    console.log("[performance] Firebase not configured");
    return res.status(503).json({
      error: "Analytics not configured",
      message: "Firebase is not configured. Please set environment variables.",
    });
  }

  try {
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
    const user = await verifyAdmin(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const period = (req.query.days as string) || "30";
    const daysNum = parseInt(period, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    const startTs = admin.firestore.Timestamp.fromDate(startDate);

    const cacheKey = `performance:${daysNum}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const db = admin.firestore();

    // Fetch perf_issue events
    let snap;
    try {
      snap = (await Promise.race([
        db
          .collection("analytics_events")
          .where("timestamp", ">=", startTs)
          .where("eventType", "==", "perf_issue")
          .orderBy("timestamp", "desc")
          .limit(5000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
    } catch (error) {
      console.error("Performance events query error:", error);
      const payload = {
        success: true,
        data: {
          totalIssues: 0,
          byType: {},
          byBrowser: {},
          byDevice: {},
          topPages: [],
          period: daysNum,
        },
      };
      setCache(cacheKey, payload, 60_000);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(payload);
    }

    const byType: Record<string, number> = {};
    const byBrowser: Record<string, number> = {};
    const byDevice: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      const type = String(data.eventData?.type || "unknown");
      byType[type] = (byType[type] || 0) + 1;

      const browser = String(
        data.eventData?.browser ||
          data.browser ||
          data.eventData?.uaBrowser ||
          ""
      );
      if (browser) byBrowser[browser] = (byBrowser[browser] || 0) + 1;

      const device = String(data.eventData?.device || data.device?.type || "");
      if (device) byDevice[device] = (byDevice[device] || 0) + 1;

      const page = String(data.page || data.eventData?.page || "");
      if (page) pageCounts[page] = (pageCounts[page] || 0) + 1;
    });

    const topPages = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const payload = {
      success: true,
      data: {
        totalIssues: snap.size,
        byType,
        byBrowser,
        byDevice,
        topPages,
        period: daysNum,
      },
    };

    setCache(cacheKey, payload, 60_000);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching performance analytics:", error);
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
      error: "Failed to fetch performance analytics",
      details: errorMsg,
    });
  }
}
