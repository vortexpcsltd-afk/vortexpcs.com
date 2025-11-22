/**
 * API endpoint: Cart/Builder abandonment analytics
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

    const cacheKey = `cart:${daysNum}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const db = admin.firestore();

    // Sessions that visited builder with timeout protection
    let builderSessionsSnap;
    let builderSessionIds = new Set<string>();
    try {
      builderSessionsSnap = (await Promise.race([
        db
          .collection("analytics_sessions")
          .where("startTime", ">=", startTs)
          .where("pages", "array-contains", "/pc-builder")
          .limit(5000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
      builderSessionIds = new Set(
        builderSessionsSnap.docs.map((d) => String(d.id || d.data().sessionId))
      );
    } catch (error) {
      console.error("Builder sessions query error:", error);
      // Continue with empty set
    }

    // Sessions with at least one selection - query each event type separately to avoid "in" operator
    let selectionSnap;
    const sessionsWithSelection = new Set<string>();
    try {
      // Query component_select events
      selectionSnap = (await Promise.race([
        db
          .collection("analytics_events")
          .where("timestamp", ">=", startTs)
          .where("eventType", "==", "component_select")
          .limit(2500)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
      selectionSnap.docs.forEach((doc) => {
        const sid = String(doc.data().sessionId || "");
        if (sid) sessionsWithSelection.add(sid);
      });

      // Also query peripheral_toggle events
      const peripheralSnap = (await Promise.race([
        db
          .collection("analytics_events")
          .where("timestamp", ">=", startTs)
          .where("eventType", "==", "peripheral_toggle")
          .limit(2500)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
      peripheralSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.eventData?.action === "add") {
          const sid = String(data.sessionId || "");
          if (sid) sessionsWithSelection.add(sid);
        }
      });
    } catch (error) {
      console.error("Selection events query error:", error);
      // Continue with empty set
    }

    // Sessions with build completion with timeout protection
    let completeSnap;
    let sessionsWithCompletion = new Set<string>();
    try {
      completeSnap = (await Promise.race([
        db
          .collection("analytics_events")
          .where("timestamp", ">=", startTs)
          .where("eventType", "==", "build_complete")
          .limit(5000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
      sessionsWithCompletion = new Set<string>(
        completeSnap.docs.map((d) => String(d.data().sessionId || ""))
      );
    } catch (error) {
      console.error("Build completion query error:", error);
      // Continue with empty set
    }

    // Intersect with builder sessions to scope
    const considered = Array.from(sessionsWithSelection).filter((sid) =>
      builderSessionIds.has(sid)
    );
    const completed = considered.filter((sid) =>
      sessionsWithCompletion.has(sid)
    );

    const totalWithSelection = considered.length;
    const totalCompleted = completed.length;
    const abandoned = Math.max(totalWithSelection - totalCompleted, 0);
    const abandonmentRate =
      totalWithSelection > 0
        ? ((abandoned / totalWithSelection) * 100).toFixed(1)
        : "0";

    const payload = {
      success: true,
      data: {
        totalBuilderSessions: builderSessionIds.size,
        totalWithSelection,
        totalCompleted,
        abandoned,
        abandonmentRate,
        period: daysNum,
      },
    };
    setCache(cacheKey, payload, 60_000);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Cart analytics error:", error);
    return res.status(500).json({
      error: "Failed to fetch cart analytics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
