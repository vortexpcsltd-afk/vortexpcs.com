/**
 * API endpoint: Get Year-to-Date (YTD) analytics summary
 * Returns comprehensive aggregated data for the current year
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
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const db = admin.firestore();

    // Check cache (refresh every hour)
    const cacheKey = "analytics_ytd";
    const cached = getCache(cacheKey);
    if (cached) {
      return res
        .status(200)
        .json({ success: true, data: cached, cached: true });
    }

    // Calculate YTD date range (Jan 1 to today)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endDate = now;

    // Get all sessions for YTD
    const sessionsSnapshot = await db
      .collection("analytics_sessions")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(startOfYear))
      .where("startTime", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();

    const uniqueUsers = new Set<string>();
    const uniqueIPs = new Set<string>();
    let totalDuration = 0;
    let bounces = 0;
    const deviceBreakdown: Record<string, number> = {};
    const browserBreakdown: Record<string, number> = {};
    const sourceBreakdown: Record<string, number> = {};

    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      uniqueUsers.add(data.userId || data.sessionId);
      if (data.ip) uniqueIPs.add(data.ip);
      totalDuration += data.duration || 0;
      if ((data.pageViews || 0) <= 1) bounces++;

      // Track breakdowns
      const deviceType = data.device?.type || "unknown";
      const browser = data.device?.browser || "unknown";
      const source = data.source || "direct";

      deviceBreakdown[deviceType] = (deviceBreakdown[deviceType] || 0) + 1;
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });

    // Get pageviews for YTD
    const pageviewsSnapshot = await db
      .collection("analytics_pageviews")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfYear))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();

    const pageStats: Record<string, number> = {};
    pageviewsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const page = data.page || "unknown";
      pageStats[page] = (pageStats[page] || 0) + 1;
    });

    // Get top pages
    const topPages = Object.entries(pageStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    // Get events for YTD
    const eventsSnapshot = await db
      .collection("analytics_events")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfYear))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();

    const eventsByType: Record<string, number> = {};
    eventsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const type = data.eventType || "unknown";
      eventsByType[type] = (eventsByType[type] || 0) + 1;
    });

    // Get new users for YTD
    const newUsersSnapshot = await db
      .collection("users")
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfYear))
      .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();

    // Get orders for YTD
    const ordersSnapshot = await db
      .collection("orders")
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfYear))
      .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();

    let totalRevenue = 0;
    const ordersByStatus: Record<string, number> = {};
    ordersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const total =
        typeof data.total === "number"
          ? data.total
          : parseFloat(data.total || "0");
      totalRevenue += total;

      const status = data.status || "unknown";
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    // Get security events for YTD
    const securitySnapshot = await db
      .collection("analytics_security")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfYear))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();

    let successfulLogins = 0;
    let failedLogins = 0;
    securitySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.success) successfulLogins++;
      else failedLogins++;
    });

    // Calculate month-by-month breakdown
    const monthlyBreakdown = [];
    for (let month = 0; month < now.getMonth() + 1; month++) {
      const monthStart = new Date(now.getFullYear(), month, 1);
      const monthEnd = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59);

      const monthSessions = await db
        .collection("analytics_sessions")
        .where(
          "startTime",
          ">=",
          admin.firestore.Timestamp.fromDate(monthStart)
        )
        .where("startTime", "<=", admin.firestore.Timestamp.fromDate(monthEnd))
        .get();

      const monthPageviews = await db
        .collection("analytics_pageviews")
        .where(
          "timestamp",
          ">=",
          admin.firestore.Timestamp.fromDate(monthStart)
        )
        .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(monthEnd))
        .get();

      monthlyBreakdown.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        sessions: monthSessions.size,
        pageviews: monthPageviews.size,
      });
    }

    // Calculate days into year
    const daysIntoYear = Math.ceil(
      (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    );

    const result = {
      period: {
        startDate: startOfYear.toISOString(),
        endDate: endDate.toISOString(),
        daysIntoYear,
        currentYear: now.getFullYear(),
      },
      overview: {
        totalVisitors: uniqueUsers.size,
        totalPageViews: pageviewsSnapshot.size,
        totalSessions: sessionsSnapshot.size,
        totalEvents: eventsSnapshot.size,
        uniqueIPs: uniqueIPs.size,
        avgSessionDuration:
          sessionsSnapshot.size > 0
            ? Math.round(totalDuration / sessionsSnapshot.size / 1000)
            : 0,
        bounceRate:
          sessionsSnapshot.size > 0
            ? Math.round((bounces / sessionsSnapshot.size) * 100)
            : 0,
        avgPageViewsPerSession:
          sessionsSnapshot.size > 0
            ? (pageviewsSnapshot.size / sessionsSnapshot.size).toFixed(2)
            : "0.00",
      },
      users: {
        newUsers: newUsersSnapshot.size,
        returningUsers: uniqueUsers.size - newUsersSnapshot.size,
        avgNewUsersPerDay: Math.round(newUsersSnapshot.size / daysIntoYear),
      },
      revenue: {
        total: totalRevenue,
        orders: ordersSnapshot.size,
        avgOrderValue:
          ordersSnapshot.size > 0
            ? Math.round(totalRevenue / ordersSnapshot.size)
            : 0,
        avgRevenuePerDay: Math.round(totalRevenue / daysIntoYear),
        ordersByStatus,
      },
      security: {
        totalLoginAttempts: successfulLogins + failedLogins,
        successfulLogins,
        failedLogins,
        successRate:
          successfulLogins + failedLogins > 0
            ? `${Math.round(
                (successfulLogins / (successfulLogins + failedLogins)) * 100
              )}%`
            : "0%",
      },
      topPages,
      eventsByType,
      deviceBreakdown,
      browserBreakdown,
      sourceBreakdown,
      monthlyBreakdown,
      dailyAverages: {
        visitors: Math.round(uniqueUsers.size / daysIntoYear),
        pageViews: Math.round(pageviewsSnapshot.size / daysIntoYear),
        sessions: Math.round(sessionsSnapshot.size / daysIntoYear),
        revenue: Math.round(totalRevenue / daysIntoYear),
        orders: (ordersSnapshot.size / daysIntoYear).toFixed(2),
      },
    };

    // Cache for 1 hour
    setCache(cacheKey, result, 3600);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[YTD Analytics] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch YTD analytics",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
