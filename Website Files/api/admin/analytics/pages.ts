/**
 * API endpoint: Get page view statistics and rankings
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
    const days = parseInt((req.query.days as string) || "30", 10);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const cacheKey = `pages:${days}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // Get page views
    const pageViewsSnapshot = await db
      .collection("analytics_pageviews")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .orderBy("timestamp", "desc")
      .limit(2000)
      .get();

    // Aggregate page statistics
    const pageStats: Record<
      string,
      {
        views: number;
        uniqueVisitors: Set<string>;
        avgTimeOnPage: number[];
        bounces: number;
      }
    > = {};

    // Build aggregates, last page per session (exits), and per-session sequences for flow
    const lastPageBySession: Record<string, string> = {};
    const viewsBySession: Record<
      string,
      Array<{ page: string; ts: number }>
    > = {};

    pageViewsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const page = data.page || "unknown";
      const sessionId = String(data.sessionId || "unknown");
      const tsVal = data.timestamp as unknown;
      const ts =
        tsVal && typeof (tsVal as any).toDate === "function"
          ? (tsVal as admin.firestore.Timestamp).toDate().getTime()
          : Date.now();

      if (!pageStats[page]) {
        pageStats[page] = {
          views: 0,
          uniqueVisitors: new Set(),
          avgTimeOnPage: [],
          bounces: 0,
        };
      }

      pageStats[page].views += 1;
      pageStats[page].uniqueVisitors.add(sessionId);

      if (data.timeOnPage) {
        pageStats[page].avgTimeOnPage.push(data.timeOnPage);
      }

      // Last page per session (since snapshot is desc by timestamp, first seen wins)
      if (!lastPageBySession[sessionId]) {
        lastPageBySession[sessionId] = page;
      }

      // Build per-session sequence
      if (!viewsBySession[sessionId]) viewsBySession[sessionId] = [];
      viewsBySession[sessionId].push({ page, ts });
    });

    // Convert to sorted array
    const topPages = Object.entries(pageStats)
      .map(([page, stats]) => ({
        page,
        views: stats.views,
        uniqueVisitors: stats.uniqueVisitors.size,
        avgTimeOnPage:
          stats.avgTimeOnPage.length > 0
            ? Math.round(
                stats.avgTimeOnPage.reduce((a, b) => a + b, 0) /
                  stats.avgTimeOnPage.length
              )
            : 0,
      }))
      .sort((a, b) => b.views - a.views);

    // Exit pages: count last page per session
    const exitCounts: Record<string, number> = {};
    Object.values(lastPageBySession).forEach((p) => {
      exitCounts[p] = (exitCounts[p] || 0) + 1;
    });
    const topExitPages = Object.entries(exitCounts)
      .map(([page, exits]) => ({ page, exits }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 15);

    // User flow: transitions and 3-step paths
    const transitionCounts: Record<string, number> = {};
    const path3Counts: Record<string, number> = {};
    for (const sessId of Object.keys(viewsBySession)) {
      const seq = viewsBySession[sessId]
        .sort((a, b) => a.ts - b.ts)
        .map((x) => x.page);
      for (let i = 0; i < seq.length - 1; i++) {
        const key = `${seq[i]} -> ${seq[i + 1]}`;
        transitionCounts[key] = (transitionCounts[key] || 0) + 1;
      }
      for (let i = 0; i < seq.length - 2; i++) {
        const key = `${seq[i]} -> ${seq[i + 1]} -> ${seq[i + 2]}`;
        path3Counts[key] = (path3Counts[key] || 0) + 1;
      }
    }
    const topTransitions = Object.entries(transitionCounts)
      .map(([path, count]) => {
        const [from, to] = path.split(" -> ");
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const topPaths3 = Object.entries(path3Counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Get entry pages (first page in session)
    const sessionsSnapshot = await db
      .collection("analytics_sessions")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .limit(5000)
      .get();

    const entryPages: Record<string, number> = {};
    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const firstPage = data.pages?.[0] || "unknown";
      entryPages[firstPage] = (entryPages[firstPage] || 0) + 1;
    });

    const topEntryPages = Object.entries(entryPages)
      .map(([page, count]) => ({ page, sessions: count }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    // Calculate total page views
    const totalViews = topPages.reduce((sum, page) => sum + page.views, 0);

    const payload = {
      success: true,
      data: {
        topPages: topPages.slice(0, 20),
        topEntryPages,
        topExitPages,
        topTransitions,
        topPaths3,
        totalViews,
        totalUniquePages: topPages.length,
        period: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days,
        },
      },
    };
    setCache(cacheKey, payload, 60_000);
    return res.status(200).json(payload);
  } catch (error: unknown) {
    console.error("Get page analytics error:", error);
    const errorStr = String(error);
    const errorMsg = error instanceof Error ? error.message : errorStr;

    // Log error and return 500
    console.error("[pages] Analytics error:", errorMsg);

    // Check for Firebase initialization errors
    if (errorMsg.includes("Firebase") || errorMsg.includes("credentials")) {
      return res.status(503).json({
        error: "Firebase not configured on this deployment",
        message: "Analytics requires Firebase Admin credentials to be set",
        setupRequired: true,
      });
    }

    type FirestoreErrorLike = { code?: number | string; message?: string };
    const err = error as FirestoreErrorLike;
    const code = err?.code;
    const msg = String(err?.message || "");
    if (code === 8 || msg.includes("RESOURCE_EXHAUSTED")) {
      return res.status(503).json({
        error: "Firestore quota exhausted",
        quota: true,
        retryAfterSeconds: 60,
      });
    }
    return res.status(500).json({
      error: "Failed to fetch page analytics",
      details: errorMsg,
    });
  }
}

