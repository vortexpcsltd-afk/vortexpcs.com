/**
 * API endpoint: Get visitor statistics (daily, weekly, monthly, YTD)
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

  try {
    // Verify admin authentication (ensures Firebase initialized)
    const user = await verifyAdmin(req);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized - Admin access required" });
    }

    // Disable caching for real-time analytics
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vary", "Authorization");

    const db = admin.firestore();
    const period = (req.query.period as string) || "30"; // days
    const days = parseInt(period, 10);

    // Cache key per period
    const cacheKey = `visitors:${days}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // Calculate date ranges
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const yearStartDate = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year

    // Get sessions for the period
    const sessionsSnapshot = await db
      .collection("analytics_sessions")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .where("startTime", "<=", admin.firestore.Timestamp.fromDate(now))
      .orderBy("startTime", "desc")
      .limit(2000)
      .get();

    // Get YTD sessions
    const ytdSessionsSnapshot = await db
      .collection("analytics_sessions")
      .where(
        "startTime",
        ">=",
        admin.firestore.Timestamp.fromDate(yearStartDate)
      )
      .where("startTime", "<=", admin.firestore.Timestamp.fromDate(now))
      .orderBy("startTime", "desc")
      .limit(5000)
      .get();

    // Process sessions
    const sessionsByDay: Record<string, Set<string>> = {};
    const uniqueVisitors = new Set<string>();
    let totalPageViews = 0;
    let totalSessionDuration = 0;
    let bouncedSessions = 0;
    let validSessions = 0;

    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const dateKey =
        data.startTime?.toDate().toLocaleDateString() || "unknown";
      const sessionId = data.sessionId;

      if (!sessionsByDay[dateKey]) {
        sessionsByDay[dateKey] = new Set();
      }
      sessionsByDay[dateKey].add(sessionId);
      uniqueVisitors.add(sessionId);
      totalPageViews += data.pageViews || 0;

      // Calculate session duration
      const startTime = data.startTime?.toDate();
      const lastActivity = data.lastActivity?.toDate();
      if (startTime && lastActivity) {
        const duration = (lastActivity.getTime() - startTime.getTime()) / 1000; // in seconds
        totalSessionDuration += duration;
        validSessions++;
      }

      // Check if bounced (only 1 page view or less)
      if ((data.pageViews || 0) <= 1) {
        bouncedSessions++;
      }
    });

    // Calculate YTD unique visitors
    const ytdUniqueVisitors = new Set<string>();
    ytdSessionsSnapshot.docs.forEach((doc) => {
      ytdUniqueVisitors.add(doc.data().sessionId);
    });

    // Create time series data
    const timeSeries = Object.entries(sessionsByDay)
      .map(([date, sessions]) => ({
        date,
        visitors: sessions.size,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate daily average
    const daysWithData = Object.keys(sessionsByDay).length;
    const avgVisitorsPerDay =
      daysWithData > 0 ? uniqueVisitors.size / daysWithData : 0;

    // Calculate weekly data (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyVisitors = new Set<string>();
    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const sessionDate = data.startTime?.toDate();
      if (sessionDate && sessionDate >= sevenDaysAgo) {
        weeklyVisitors.add(data.sessionId);
      }
    });

    // Calculate monthly data (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthlyVisitors = new Set<string>();
    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const sessionDate = data.startTime?.toDate();
      if (sessionDate && sessionDate >= thirtyDaysAgo) {
        monthlyVisitors.add(data.sessionId);
      }
    });

    const payload = {
      success: true,
      data: {
        summary: {
          daily: Math.round(avgVisitorsPerDay),
          weekly: weeklyVisitors.size,
          monthly: monthlyVisitors.size,
          ytd: ytdUniqueVisitors.size,
          totalPageViews,
          avgPageViewsPerSession:
            uniqueVisitors.size > 0
              ? (totalPageViews / uniqueVisitors.size).toFixed(2)
              : "0",
          avgSessionDuration:
            validSessions > 0
              ? Math.round(totalSessionDuration / validSessions)
              : 0,
          bounceRate:
            uniqueVisitors.size > 0
              ? ((bouncedSessions / uniqueVisitors.size) * 100).toFixed(1)
              : "0",
        },
        timeSeries,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          days,
        },
      },
    };

    // Cache for 60 seconds
    setCache(cacheKey, payload, 60_000);
    return res.status(200).json(payload);
  } catch (error: unknown) {
    console.error("Get visitor analytics error:", error);
    const errorStr = String(error);
    const errorMsg = error instanceof Error ? error.message : errorStr;

    // Log error and return 500
    console.error("[visitors] Analytics error:", errorMsg);

    // Check for Firebase initialization errors
    if (errorMsg.includes("Firebase") || errorMsg.includes("credentials")) {
      return res.status(503).json({
        error: "Firebase not configured on this deployment",
        message: "Analytics requires Firebase Admin credentials to be set",
        setupRequired: true,
      });
    }

    const code = (
      error as { code?: number | string } | Error | unknown as never as {
        code?: number | string;
      }
    )?.code;
    if (code === 8 || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      return res.status(503).json({
        error: "Firestore quota exhausted",
        quota: true,
        retryAfterSeconds: 60,
      });
    }
    return res.status(500).json({
      error: "Failed to fetch visitor analytics",
      details: errorMsg,
    });
  }
}

