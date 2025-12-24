/**
 * API endpoint: Get download tracking statistics
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

  if (!isFirebaseConfigured()) {
    console.log("[downloads] Firebase not configured");
    return res.status(503).json({
      error: "Analytics not configured",
      message: "Firebase is not configured. Please set environment variables.",
    });
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

    const cacheKey = `downloads:${days}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // Get download events from analytics_events collection
    const downloadsSnapshot = await db
      .collection("analytics_events")
      .where("eventType", "==", "download")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .orderBy("timestamp", "desc")
      .limit(2000)
      .get();

    // Aggregate download statistics
    const downloadsByFile: Record<string, number> = {};
    const downloadsByDay: Record<string, number> = {};
    const downloadsList: Array<{
      file: string;
      userId?: string;
      timestamp: string;
      page: string;
    }> = [];

    downloadsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const url: unknown = data.eventData?.url;
      let fileName: string | undefined =
        data.eventData?.fileName || data.eventData?.file;

      // Fallback: derive file name from URL when not explicitly provided
      if (!fileName && typeof url === "string" && url.length > 0) {
        try {
          // Support absolute and relative URLs
          const parsed = new URL(url, "https://dummy.base");
          const parts = (parsed.pathname || "").split("/").filter(Boolean);
          const last = parts[parts.length - 1];
          if (last) fileName = last;
        } catch {
          // Best-effort: strip query/hash and take basename
          const clean = url.split("?")[0].split("#")[0];
          const parts = clean.split("/");
          const last = parts[parts.length - 1];
          if (last) fileName = last;
        }
      }

      if (!fileName) fileName = "unknown";

      const dateKey =
        data.timestamp?.toDate().toLocaleDateString() || "unknown";

      downloadsByFile[fileName] = (downloadsByFile[fileName] || 0) + 1;
      downloadsByDay[dateKey] = (downloadsByDay[dateKey] || 0) + 1;

      downloadsList.push({
        file: fileName,
        userId: data.userId,
        timestamp: data.timestamp?.toDate().toISOString(),
        page: data.page || "unknown",
      });
    });

    // Sort by popularity
    const topDownloads = Object.entries(downloadsByFile)
      .map(([file, count]) => ({ file, downloads: count }))
      .sort((a, b) => b.downloads - a.downloads);

    // Time series
    const timeSeries = Object.entries(downloadsByDay)
      .map(([date, count]) => ({ date, downloads: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalDownloads = downloadsList.length;
    const avgDownloadsPerDay =
      timeSeries.length > 0 ? totalDownloads / timeSeries.length : 0;

    const payload = {
      success: true,
      data: {
        summary: {
          totalDownloads,
          uniqueFiles: topDownloads.length,
          avgDownloadsPerDay: avgDownloadsPerDay.toFixed(2),
        },
        topDownloads: topDownloads.slice(0, 20),
        timeSeries,
        recentDownloads: downloadsList.slice(0, 50),
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
    console.error("Get download analytics error:\n", error);
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
      error: "Failed to fetch download analytics",
      details: errorMsg,
    });
  }
}

