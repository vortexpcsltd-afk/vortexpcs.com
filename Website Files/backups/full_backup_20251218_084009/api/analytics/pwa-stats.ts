/**
 * API endpoint: Get PWA installation statistics
 * Returns aggregated data on PWA installs, dismissals, and install rate
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../services/auth-admin.js";
import { getCache, setCache } from "../services/cache.js";
import admin from "firebase-admin";

// Ensure Firebase Admin is initialized
let isInitialized = false;

function ensureAdminInitialized() {
  if (isInitialized) return;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  isInitialized = true;
}

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
    // Verify admin authentication - but don't fail, return basic stats anyway
    let user: unknown;
    try {
      user = await verifyAdmin(req);
    } catch (e) {
      console.debug("PWA stats: admin verification failed", e);
    }
    
    // If no admin user, still allow read-only access to stats
    // (or require it - comment out next block if you want strict admin-only)
    if (!user) {
      // For now, allow unauthenticated read access to PWA stats
      console.debug("PWA stats requested without admin auth");
    const cacheKey = "pwa_stats";
    const cached = getCache(cacheKey);
    if (cached) {
      return res
        .status(200)
        .json({ success: true, data: cached, cached: true });
    }

    // Query analytics_events for pwa_install events
    const eventsSnapshot = await db
      .collection("analytics_events")
      .where("event", "==", "pwa_install")
      .get();

    // Aggregate by action type
    const stats = {
      accepted: 0,
      dismissed: 0,
      installed: 0,
      prompt_dismissed: 0,
    };

    eventsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const action = data.action as string;

      if (action === "accepted") stats.accepted++;
      else if (action === "dismissed") stats.dismissed++;
      else if (action === "installed") stats.installed++;
      else if (action === "prompt_dismissed") stats.prompt_dismissed++;
    });

    // Calculate metrics for Admin Panel
    const installs = stats.installed;
    const dismissals = stats.dismissed + stats.prompt_dismissed;
    const promptShown =
      stats.accepted + stats.dismissed + stats.prompt_dismissed;
    const installRate =
      promptShown > 0 ? Math.round((installs / promptShown) * 100) : 0;

    const result = {
      installs,
      dismissals,
      promptShown,
      installRate,
      breakdown: stats, // Include detailed breakdown
    };

    // Cache for 5 minutes (300 seconds)
    setCache(cacheKey, result, 300);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("PWA stats error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch PWA statistics",
      details: err?.message || String(err),
    });
  }
}
