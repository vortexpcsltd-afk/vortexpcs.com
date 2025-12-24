/**
 * API endpoint: Get security and login attempt statistics
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

    const cacheKey = `security:${days}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // Get security events
    const securityEventsSnapshot = await db
      .collection("security_events")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .orderBy("timestamp", "desc")
      .limit(1000)
      .get();

    // Categorize events
    const eventsByType: Record<string, number> = {};
    const failedLoginAttempts: Array<{
      email?: string;
      ip?: string;
      timestamp: string;
      details?: Record<string, unknown>;
    }> = [];
    const successfulLogins: Array<{
      email?: string;
      ip?: string;
      timestamp: string;
    }> = [];
    const suspiciousActivity: Array<{
      type: string;
      details: Record<string, unknown>;
      timestamp: string;
    }> = [];

    securityEventsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const eventType = data.type || "unknown";

      eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;

      if (eventType === "login_failed") {
        failedLoginAttempts.push({
          email: data.email,
          ip: data.ip,
          timestamp: data.timestamp?.toDate().toISOString(),
          details: data.details,
        });
      } else if (eventType === "login_success") {
        successfulLogins.push({
          email: data.email,
          ip: data.ip,
          timestamp: data.timestamp?.toDate().toISOString(),
        });
      } else if (eventType === "suspicious_activity") {
        suspiciousActivity.push({
          type: data.details?.type as string,
          details: data.details || {},
          timestamp: data.timestamp?.toDate().toISOString(),
        });
      }
    });

    // Failed attempts by email
    const failedByEmail: Record<string, number> = {};
    failedLoginAttempts.forEach((attempt) => {
      if (attempt.email) {
        failedByEmail[attempt.email] = (failedByEmail[attempt.email] || 0) + 1;
      }
    });

    const topFailedEmails = Object.entries(failedByEmail)
      .map(([email, count]) => ({ email, attempts: count }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    // Failed attempts by IP
    const failedByIP: Record<string, number> = {};
    failedLoginAttempts.forEach((attempt) => {
      if (attempt.ip) {
        failedByIP[attempt.ip] = (failedByIP[attempt.ip] || 0) + 1;
      }
    });

    const topFailedIPs = Object.entries(failedByIP)
      .map(([ip, count]) => ({ ip, attempts: count }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    // Time series for login attempts
    const attemptsByDay: Record<string, { success: number; failed: number }> =
      {};
    [...failedLoginAttempts, ...successfulLogins].forEach((attempt) => {
      const dateKey = new Date(attempt.timestamp).toLocaleDateString();
      if (!attemptsByDay[dateKey]) {
        attemptsByDay[dateKey] = { success: 0, failed: 0 };
      }
      if (
        failedLoginAttempts.includes(attempt as (typeof failedLoginAttempts)[0])
      ) {
        attemptsByDay[dateKey].failed += 1;
      } else {
        attemptsByDay[dateKey].success += 1;
      }
    });

    const loginTimeSeries = Object.entries(attemptsByDay)
      .map(([date, counts]) => ({
        date,
        successful: counts.success,
        failed: counts.failed,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const payload = {
      success: true,
      data: {
        summary: {
          totalLoginAttempts:
            failedLoginAttempts.length + successfulLogins.length,
          successfulLogins: successfulLogins.length,
          failedLogins: failedLoginAttempts.length,
          suspiciousActivity: suspiciousActivity.length,
          successRate:
            failedLoginAttempts.length + successfulLogins.length > 0
              ? (
                  (successfulLogins.length /
                    (failedLoginAttempts.length + successfulLogins.length)) *
                  100
                ).toFixed(1) + "%"
              : "N/A",
        },
        eventsByType,
        topFailedEmails,
        topFailedIPs,
        loginTimeSeries,
        recentFailedAttempts: failedLoginAttempts.slice(0, 20),
        recentSuspiciousActivity: suspiciousActivity.slice(0, 20),
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
    console.error("Get security analytics error:", error);
    const errorStr = String(error);
    const errorMsg = error instanceof Error ? error.message : errorStr;

    // Log error and return 500
    console.error("[security] Analytics error:", errorMsg);

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
      error: "Failed to fetch security analytics",
      details: errorMsg,
    });
  }
}
