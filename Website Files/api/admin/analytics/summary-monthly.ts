/**
 * API endpoint: Get monthly analytics summary
 * Returns aggregated data by month for multi-month comparison
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

    // Get months parameter (default: 12)
    const months = parseInt((req.query.months as string) || "12", 10);

    // Check cache
    const cacheKey = `analytics_monthly_${months}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res
        .status(200)
        .json({ success: true, data: cached, cached: true });
    }

    // Calculate date ranges for each month
    const now = new Date();
    const monthlyData: Array<{
      month: string;
      year: number;
      visitors: number;
      pageViews: number;
      uniqueUsers: number;
      sessions: number;
      avgSessionDuration: number;
      bounceRate: number;
      newUsers: number;
      revenue: number;
      orders: number;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      );
      const endDate = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      // Get sessions for this month
      const sessionsSnapshot = await db
        .collection("analytics_sessions")
        .where("startTime", ">=", admin.firestore.Timestamp.fromDate(startDate))
        .where("startTime", "<=", admin.firestore.Timestamp.fromDate(endDate))
        .get();

      const uniqueUsers = new Set<string>();
      let totalDuration = 0;
      let bounces = 0;

      sessionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        uniqueUsers.add(data.userId || data.sessionId);
        totalDuration += data.duration || 0;
        if ((data.pageViews || 0) <= 1) bounces++;
      });

      // Get pageviews for this month
      const pageviewsSnapshot = await db
        .collection("analytics_pageviews")
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
        .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endDate))
        .get();

      // Get new users for this month
      const newUsersSnapshot = await db
        .collection("users")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startDate))
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endDate))
        .get();

      // Get orders for this month
      const ordersSnapshot = await db
        .collection("orders")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startDate))
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endDate))
        .get();

      let monthRevenue = 0;
      ordersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const total =
          typeof data.total === "number"
            ? data.total
            : parseFloat(data.total || "0");
        monthRevenue += total;
      });

      monthlyData.push({
        month: monthDate.toLocaleDateString("en-US", { month: "short" }),
        year: monthDate.getFullYear(),
        visitors: uniqueUsers.size,
        pageViews: pageviewsSnapshot.size,
        uniqueUsers: uniqueUsers.size,
        sessions: sessionsSnapshot.size,
        avgSessionDuration:
          sessionsSnapshot.size > 0
            ? Math.round(totalDuration / sessionsSnapshot.size / 1000)
            : 0,
        bounceRate:
          sessionsSnapshot.size > 0
            ? Math.round((bounces / sessionsSnapshot.size) * 100)
            : 0,
        newUsers: newUsersSnapshot.size,
        revenue: monthRevenue,
        orders: ordersSnapshot.size,
      });
    }

    // Calculate trends (compare latest month to previous)
    const trends =
      monthlyData.length >= 2
        ? {
            visitors: calculateTrend(
              monthlyData[monthlyData.length - 1].visitors,
              monthlyData[monthlyData.length - 2].visitors
            ),
            pageViews: calculateTrend(
              monthlyData[monthlyData.length - 1].pageViews,
              monthlyData[monthlyData.length - 2].pageViews
            ),
            sessions: calculateTrend(
              monthlyData[monthlyData.length - 1].sessions,
              monthlyData[monthlyData.length - 2].sessions
            ),
            revenue: calculateTrend(
              monthlyData[monthlyData.length - 1].revenue,
              monthlyData[monthlyData.length - 2].revenue
            ),
            orders: calculateTrend(
              monthlyData[monthlyData.length - 1].orders,
              monthlyData[monthlyData.length - 2].orders
            ),
          }
        : null;

    const result = {
      monthlyData,
      trends,
      summary: {
        totalVisitors: monthlyData.reduce((sum, m) => sum + m.visitors, 0),
        totalPageViews: monthlyData.reduce((sum, m) => sum + m.pageViews, 0),
        totalSessions: monthlyData.reduce((sum, m) => sum + m.sessions, 0),
        totalRevenue: monthlyData.reduce((sum, m) => sum + m.revenue, 0),
        totalOrders: monthlyData.reduce((sum, m) => sum + m.orders, 0),
        avgVisitorsPerMonth: Math.round(
          monthlyData.reduce((sum, m) => sum + m.visitors, 0) /
            monthlyData.length
        ),
        avgRevenuePerMonth: Math.round(
          monthlyData.reduce((sum, m) => sum + m.revenue, 0) /
            monthlyData.length
        ),
      },
    };

    // Cache for 1 hour
    setCache(cacheKey, result, 3600);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[Monthly Analytics] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch monthly analytics",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

// Helper to calculate percentage trend
function calculateTrend(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}

