/**
 * API endpoint: Compatibility warnings analytics
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../../services/auth-admin.js";
import { getCache, setCache } from "../../services/cache.js";
import admin from "firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const user = await verifyAdmin(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    const startTs = admin.firestore.Timestamp.fromDate(startDate);

    const cacheKey = `compat:${daysNum}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const db = admin.firestore();

    // Query with timeout protection
    let snap;
    try {
      snap = (await Promise.race([
        db
          .collection("analytics_events")
          .where("timestamp", ">=", startTs)
          .where("eventType", "==", "compatibility_warning")
          .limit(5000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
    } catch (error) {
      console.error("Compatibility events query error:", error);
      // Return empty result
      const payload = {
        success: true,
        data: {
          topIssues: [],
          severityCounts: {},
          totalWarnings: 0,
          period: daysNum,
        },
      };
      setCache(cacheKey, payload, 60_000);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(payload);
    }

    const titleCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      const titles: string[] = Array.isArray(data.eventData?.titles)
        ? data.eventData.titles
        : [];
      const severities: Record<string, number> =
        data.eventData?.severities || {};
      titles.forEach((t) => {
        titleCounts[t] = (titleCounts[t] || 0) + 1;
      });
      Object.entries(severities).forEach(([sev, count]) => {
        severityCounts[sev] = (severityCounts[sev] || 0) + (count as number);
      });
    });

    const topIssues = Object.entries(titleCounts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const payload = {
      success: true,
      data: {
        topIssues,
        severityCounts,
        totalWarnings: snap.size,
        period: daysNum,
      },
    };

    setCache(cacheKey, payload, 60_000);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Compatibility analytics error:", error);
    return res.status(500).json({
      error: "Failed to fetch compatibility analytics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
