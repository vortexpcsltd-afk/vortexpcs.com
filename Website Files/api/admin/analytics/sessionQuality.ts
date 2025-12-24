/**
 * API endpoint: Session Quality Score analytics
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
    console.log("[sessionQuality] Firebase not configured");
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

    const cacheKey = `sessionQuality:${daysNum}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const db = admin.firestore();

    // Fetch recent sessions (cap to 2000 for safety)
    let sessionsSnap;
    try {
      sessionsSnap = (await Promise.race([
        db
          .collection("analytics_sessions")
          .where("startTime", ">=", startTs)
          .limit(2000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
    } catch (error) {
      console.error("Sessions query error:", error);
      const payload = {
        success: true,
        data: {
          avgScore: 0,
          medianScore: 0,
          distribution: {},
          sample: 0,
          period: daysNum,
        },
      };
      setCache(cacheKey, payload, 60_000);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(payload);
    }

    // Fetch events in period (cap to 5000)
    let eventsSnap;
    try {
      eventsSnap = (await Promise.race([
        db
          .collection("analytics_events")
          .where("timestamp", ">=", startTs)
          .orderBy("timestamp", "desc")
          .limit(5000)
          .get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 8000)
        ),
      ])) as FirebaseFirestore.QuerySnapshot;
    } catch (error) {
      console.error("Events query error:", error);
      const payload = {
        success: true,
        data: {
          avgScore: 0,
          medianScore: 0,
          distribution: {},
          sample: 0,
          period: daysNum,
        },
      };
      setCache(cacheKey, payload, 60_000);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(payload);
    }

    // Aggregate events by session
    const actionsBySession = new Map<string, number>();
    const frustrationBySession = new Map<string, number>();
    const conversionBySession = new Set<string>();

    eventsSnap.docs.forEach((d) => {
      const data = d.data();
      const sid = String(data.sessionId || "");
      if (!sid) return;
      actionsBySession.set(sid, (actionsBySession.get(sid) || 0) + 1);
      if (data.eventType === "frustration_signal") {
        frustrationBySession.set(sid, (frustrationBySession.get(sid) || 0) + 1);
      }
      if (
        data.eventType === "build_complete" ||
        data.eventType === "purchase_complete"
      ) {
        conversionBySession.add(sid);
      }
    });

    // Compute quality score per session
    const scores: number[] = [];
    sessionsSnap.docs.forEach((d) => {
      const s = d.data();
      const sid = String(s.sessionId || d.id);
      const start = s.startTime?.toDate
        ? s.startTime.toDate()
        : new Date(s.startTime);
      const last = s.lastActivity?.toDate
        ? s.lastActivity.toDate()
        : new Date(s.lastActivity || start);
      const durationSec = Math.max(
        0,
        Math.round((last.getTime() - start.getTime()) / 1000)
      );
      const pagesCount = Array.isArray(s.pages)
        ? s.pages.length
        : Number(s.pageViews || 0);
      const actions = actionsBySession.get(sid) || 0;
      const frustration = frustrationBySession.get(sid) || 0;
      const converted = conversionBySession.has(sid);

      // Scoring (0-100): duration (25), pages (20), actions (25), conversion (20), frustration penalty (-10 max)
      const durationScore = Math.min(25, (durationSec / 600) * 25); // 10 min caps 25
      const pagesScore = Math.min(20, (pagesCount / 5) * 20); // 5+ pages caps 20
      const actionsScore = Math.min(25, (actions / 10) * 25); // 10+ actions caps 25
      const conversionScore = converted ? 20 : 0;
      const penalty = Math.min(10, frustration * 2); // up to -10
      const score = Math.max(
        0,
        Math.round(
          durationScore + pagesScore + actionsScore + conversionScore - penalty
        )
      );

      scores.push(score);
    });

    const sample = scores.length;
    const avgScore =
      sample > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / sample) : 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const medianScore = sample > 0 ? sorted[Math.floor(sample / 2)] : 0;

    // Distribution buckets (0-20,20-40,40-60,60-80,80-100)
    const distribution: Record<string, number> = {
      "0-20": 0,
      "20-40": 0,
      "40-60": 0,
      "60-80": 0,
      "80-100": 0,
    };
    for (const s of scores) {
      if (s < 20) distribution["0-20"]++;
      else if (s < 40) distribution["20-40"]++;
      else if (s < 60) distribution["40-60"]++;
      else if (s < 80) distribution["60-80"]++;
      else distribution["80-100"]++;
    }

    const payload = {
      success: true,
      data: { avgScore, medianScore, distribution, sample, period: daysNum },
    };

    setCache(cacheKey, payload, 60_000);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching session quality analytics:", error);
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
      error: "Failed to fetch session quality analytics",
      details: errorMsg,
    });
  }
}

