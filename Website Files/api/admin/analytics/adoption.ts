/**
 * API endpoint: Feature Adoption analytics
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
    console.log("[adoption] Firebase not configured");
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

    const cacheKey = `adoption:${daysNum}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const db = admin.firestore();

    // Fetch feature_use events
    let snap;
    try {
      snap = (await Promise.race([
        db
          .collection("analytics_events")
          .where("timestamp", ">=", startTs)
          .where("eventType", "==", "feature_use")
          .orderBy("timestamp", "desc")
          .limit(5000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
    } catch (error) {
      console.error("Feature events query error:", error);
      const payload = {
        success: true,
        data: { totalFeatures: 0, items: [], period: daysNum },
      };
      setCache(cacheKey, payload, 60_000);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(payload);
    }

    // Count unique sessions per feature
    const sessionsByFeature = new Map<string, Set<string>>();
    const usesByFeature = new Map<string, number>();

    snap.docs.forEach((d) => {
      const data = d.data();
      const key = String(data.eventData?.feature || "unknown");
      const sid = String(data.sessionId || "");
      if (!key || !sid) return;
      if (!sessionsByFeature.has(key)) sessionsByFeature.set(key, new Set());
      sessionsByFeature.get(key)!.add(sid);
      usesByFeature.set(key, (usesByFeature.get(key) || 0) + 1);
    });

    // Total sessions in period
    let sessionsSnap;
    let totalSessions = 0;
    try {
      sessionsSnap = (await Promise.race([
        db
          .collection("analytics_sessions")
          .where("startTime", ">=", startTs)
          .limit(5000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
      totalSessions = sessionsSnap.size;
    } catch (error) {
      console.error("Total sessions query error:", error);
    }

    const items = Array.from(sessionsByFeature.entries())
      .map(([feature, sessions]) => {
        const uniqueUsers = sessions.size;
        const uses = usesByFeature.get(feature) || 0;
        const adoptionRate =
          totalSessions > 0
            ? ((uniqueUsers / totalSessions) * 100).toFixed(1)
            : "0";
        return { feature, uniqueUsers, uses, adoptionRate };
      })
      .sort((a, b) => Number(b.adoptionRate) - Number(a.adoptionRate));

    const payload = {
      success: true,
      data: {
        totalFeatures: items.length,
        items,
        period: daysNum,
      },
    };

    setCache(cacheKey, payload, 60_000);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching adoption analytics:", error);
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
      error: "Failed to fetch adoption analytics",
      details: errorMsg,
    });
  }
}

