/**
 * API endpoint: Get live active users count
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
    console.log("[live] Firebase not configured");
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

    const db = admin.firestore();

    // Get active sessions (users active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    // Query by lastActivity only (single-field index), then filter isActive in memory
    // This avoids requiring a composite index on (isActive, lastActivity)
    const activeSessionsSnapshot = await db
      .collection("analytics_sessions")
      .where(
        "lastActivity",
        ">=",
        admin.firestore.Timestamp.fromDate(fiveMinutesAgo)
      )
      .limit(5000)
      .get();

    const activeSessions = activeSessionsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        const startTime = data.startTime?.toDate();
        const lastActivityTime = data.lastActivity?.toDate();
        const timeOnSite =
          startTime && lastActivityTime
            ? Math.floor(
                (lastActivityTime.getTime() - startTime.getTime()) / 1000
              )
            : 0;

        // Use referrerSource from data if available, otherwise parse referrer
        let source = data.referrerSource || "Direct";
        if (!data.referrerSource) {
          const referrer = data.referrer || "";
          if (referrer) {
            if (referrer.includes("google")) source = "Google";
            else if (referrer.includes("facebook")) source = "Facebook";
            else if (referrer.includes("instagram")) source = "Instagram";
            else if (referrer.includes("twitter") || referrer.includes("x.com"))
              source = "Twitter/X";
            else if (referrer.includes("linkedin")) source = "LinkedIn";
            else if (referrer.includes("youtube")) source = "YouTube";
            else if (referrer.includes("tiktok")) source = "TikTok";
            else if (referrer.includes("reddit")) source = "Reddit";
            else if (referrer.includes("bing")) source = "Bing";
            else if (referrer.includes("yahoo")) source = "Yahoo";
            else source = "Referral";
          }
        }

        return {
          sessionId: data.sessionId,
          userId: data.userId || "anonymous",
          currentPage: data.pages?.[data.pages.length - 1] || "unknown",
          lastActivity: lastActivityTime?.toISOString(),
          device: data.device,
          browser: data.device?.browser || "Unknown",
          referrer: data.referrer,
          source,
          searchTerm: data.referrerTerm || undefined,
          ip: data.ip || undefined,
          timeOnSite,
          isActive: data.isActive === true,
        };
      })
      .filter((s) => s.isActive);

    // Calculate device breakdown
    const deviceBreakdown = activeSessions.reduce((acc, session) => {
      const deviceType = session.device?.type || "unknown";
      acc[deviceType] = (acc[deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate browser breakdown
    const browserBreakdown = activeSessions.reduce((acc, session) => {
      const browser = session.browser || "Unknown";
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate source breakdown
    const sourceBreakdown = activeSessions.reduce((acc, session) => {
      const source = session.source || "Direct";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get page distribution
    const pageDistribution = activeSessions.reduce((acc, session) => {
      const page = session.currentPage || "unknown";
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const payload = {
      success: true,
      data: {
        totalActive: activeSessions.length,
        deviceBreakdown,
        browserBreakdown,
        sourceBreakdown,
        pageDistribution,
        sessions: activeSessions,
        timestamp: new Date().toISOString(),
      },
    };

    // Short TTL cache for live view (10s)
    setCache("live:default", payload, 10_000);
    // Prevent edge/CDN caching
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (error: unknown) {
    console.error("Get live analytics error:", error);
    const errorStr = String(error);
    const errorMsg = error instanceof Error ? error.message : errorStr;

    // Log error and return 500
    console.error("[live] Analytics error:", errorMsg);

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
        retryAfterSeconds: 30,
      });
    }
    return res.status(500).json({
      error: "Failed to fetch live analytics",
      details: errorMsg,
    });
  }
}
