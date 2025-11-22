/**
 * API endpoint: Get PC build completion analytics
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../../services/auth-admin.js";
import { getCache, setCache } from "../../services/cache.js";
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
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check cache (60 seconds)
    const cacheKey = "build-analytics";
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

    // Query build_complete events with timeout protection
    let buildsSnapshot;
    let totalBuildsCompleted = 0;
    try {
      buildsSnapshot = (await Promise.race([
        db
          .collection("analytics_events")
          .where("eventType", "==", "build_complete")
          .where("timestamp", ">=", startTimestamp)
          .orderBy("timestamp", "desc")
          .limit(1000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
      totalBuildsCompleted = buildsSnapshot.size;
    } catch (error) {
      console.error("Build events query error:", error);
      // Return empty result if query fails
      totalBuildsCompleted = 0;
    }

    // Query sessions that visited PC Builder with timeout protection
    let sessionsSnapshot;
    let totalBuilderVisits = 0;
    try {
      sessionsSnapshot = (await Promise.race([
        db
          .collection("analytics_sessions")
          .where("startTime", ">=", startTimestamp)
          .where("pages", "array-contains", "/pc-builder")
          .limit(1000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
      totalBuilderVisits = sessionsSnapshot.size;
    } catch (error) {
      console.error("Builder visits query error:", error);
      // Return empty result if query fails
      totalBuilderVisits = 0;
    }

    // Query build_share events
    let sharesSnapshot;
    let totalBuildShares = 0;
    try {
      sharesSnapshot = (await Promise.race([
        db
          .collection("analytics_events")
          .where("eventType", "==", "build_share")
          .where("timestamp", ">=", startTimestamp)
          .orderBy("timestamp", "desc")
          .limit(1000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
      totalBuildShares = sharesSnapshot.size;
    } catch (error) {
      console.error("Build share events query error:", error);
      totalBuildShares = 0;
    }

    const completionRate =
      totalBuilderVisits > 0
        ? ((totalBuildsCompleted / totalBuilderVisits) * 100).toFixed(1)
        : "0";
    const shareRate =
      totalBuildsCompleted > 0
        ? ((totalBuildShares / totalBuildsCompleted) * 100).toFixed(1)
        : "0";

    // Analyze build values
    let totalBuildValue = 0;
    const buildsByPrice: Record<string, number> = {
      "0-500": 0,
      "500-1000": 0,
      "1000-1500": 0,
      "1500-2000": 0,
      "2000+": 0,
    };

    // Popular component combos (CPU/GPU brands or models if available)
    const comboCounts: Record<string, number> = {};
    if (buildsSnapshot) {
      buildsSnapshot.forEach((doc) => {
        const data = doc.data();
        const buildData = data.eventData || {};
        const totalPrice = buildData.totalPrice || 0;
        totalBuildValue += totalPrice;

        if (totalPrice < 500) buildsByPrice["0-500"]++;
        else if (totalPrice < 1000) buildsByPrice["500-1000"]++;
        else if (totalPrice < 1500) buildsByPrice["1000-1500"]++;
        else if (totalPrice < 2000) buildsByPrice["1500-2000"]++;
        else buildsByPrice["2000+"]++;

        // derive combos if components array present
        try {
          const components = (buildData.components || []) as Array<{
            category: string;
            id: string;
          }>;
          // try to detect CPU and GPU models
          const cpuId = components.find((c) => c.category === "cpu")?.id;
          const gpuId = components.find((c) => c.category === "gpu")?.id;
          if (cpuId && gpuId) {
            const key = `CPU:${cpuId} + GPU:${gpuId}`;
            comboCounts[key] = (comboCounts[key] || 0) + 1;
          }
        } catch {}
      });
    }

    const avgBuildValue =
      totalBuildsCompleted > 0
        ? Math.round(totalBuildValue / totalBuildsCompleted)
        : 0;

    const popularCombos = Object.entries(comboCounts)
      .map(([combo, count]) => ({ combo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const result = {
      summary: {
        totalBuildsCompleted,
        totalBuilderVisits,
        completionRate,
        avgBuildValue,
        totalBuildShares,
        shareRate,
      },
      buildsByPrice,
      popularCombos,
      period: daysNum,
    };

    setCache(cacheKey, result, 60);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching build analytics:", error);
    return res.status(500).json({
      error: "Failed to fetch build analytics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
