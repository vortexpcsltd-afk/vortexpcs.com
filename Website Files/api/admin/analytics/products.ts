/**
 * Product Analytics API Endpoint
 * Returns product view statistics from analytics_events collection
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
    // Verify admin authentication
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check cache (60 seconds)
    const cacheKey = "product-analytics";
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get Firestore instance
    const db = admin.firestore();

    // Query product_view events from analytics_events
    const eventsRef = db.collection("analytics_events");

    // Convert startDate to Firestore Timestamp for proper comparison
    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);

    const snapshot = await eventsRef
      .where("eventType", "==", "product_view")
      .where("timestamp", ">=", startTimestamp)
      .orderBy("timestamp", "desc")
      .limit(10000) // Reasonable limit
      .get();

    // Aggregate product views
    const productViews: Record<
      string,
      {
        productId: string;
        productName: string;
        category: string;
        views: number;
        price?: number;
        brand?: string;
        viewsByMode: Record<string, number>;
      }
    > = {};

    const dailyViews: Record<string, number> = {};

    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const eventData = data.eventData || {};
      const productId = eventData.productId;
      const productName = eventData.productName || "Unknown Product";
      const category = eventData.category || "Unknown";
      const viewMode = eventData.viewMode || "unknown";

      // Handle Firestore Timestamp
      const timestamp = data.timestamp?.toDate
        ? data.timestamp.toDate()
        : new Date(data.timestamp);
      const dateKey = timestamp.toISOString().split("T")[0];

      // Aggregate by product
      if (!productViews[productId]) {
        productViews[productId] = {
          productId,
          productName,
          category,
          views: 0,
          price: eventData.price,
          brand: eventData.brand,
          viewsByMode: {},
        };
      }
      productViews[productId].views++;
      productViews[productId].viewsByMode[viewMode] =
        (productViews[productId].viewsByMode[viewMode] || 0) + 1;

      // Aggregate by date
      dailyViews[dateKey] = (dailyViews[dateKey] || 0) + 1;
    });

    // Convert to arrays and sort
    const topProducts = Object.values(productViews)
      .sort((a, b) => b.views - a.views)
      .slice(0, 20); // Top 20 products

    const timeSeries = Object.entries(dailyViews)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    Object.values(productViews).forEach((product) => {
      categoryBreakdown[product.category] =
        (categoryBreakdown[product.category] || 0) + product.views;
    });

    const result = {
      summary: {
        totalViews: snapshot.size,
        uniqueProducts: Object.keys(productViews).length,
        avgViewsPerProduct: (
          snapshot.size / Math.max(Object.keys(productViews).length, 1)
        ).toFixed(1),
      },
      topProducts,
      categoryBreakdown,
      timeSeries,
      period: daysNum,
    };

    const payload = {
      success: true,
      data: result,
    };

    // Cache the result
    setCache(cacheKey, payload, 60); // 60 seconds

    return res.status(200).json(payload);
  } catch (error: unknown) {
    console.error("Error fetching product analytics:", error);
    const errorStr = String(error);
    const errorMsg = error instanceof Error ? error.message : errorStr;

    // Log error and return 500
    console.error("[products] Analytics error:", errorMsg);

    // Check for Firebase initialization errors
    if (errorMsg.includes("Firebase") || errorMsg.includes("credentials")) {
      return res.status(503).json({
        error: "Firebase not configured on this deployment",
        message: "Analytics requires Firebase Admin credentials to be set",
        setupRequired: true,
      });
    }

    return res.status(500).json({
      error: "Failed to fetch product analytics",
      details: errorMsg,
    });
  }
}

