/**
 * API endpoint: Get PWA installation statistics
 * Returns aggregated data on PWA installs, dismissals, and install rate
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withErrorHandler } from "../middleware/error-handler.js";
import { verifyAdmin } from "../services/auth-admin.js";
import { isFirebaseConfigured } from "../services/env-utils.js";
import { getCache, setCache } from "../services/cache.js";
import admin from "firebase-admin";
import { createLogger } from "../services/logger.js";

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const logger = createLogger(req);
    res.setHeader("X-Trace-ID", logger.getTraceId());
    if (!isFirebaseConfigured()) {
      logger.info("[pwa-stats] Firebase not configured - returning zeros");
      return res.status(200).json({
        success: true,
        data: {
          installs: 0,
          dismissals: 0,
          promptShown: 0,
          installRate: 0,
          breakdown: {
            installed: 0,
            dismissed: 0,
            promptShown: 0,
          },
        },
        setupRequired: true,
        cached: false,
      });
    }
    // Verify admin authentication
    const user = await verifyAdmin(req);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized - Admin access required" });
    }

    // Check cache first
    const cacheKey = "pwa_stats";
    const cached = getCache(cacheKey);
    if (cached) {
      return res
        .status(200)
        .json({ success: true, data: cached, cached: true });
    }

    // Get Firestore instance
    const db = admin.firestore();

    // Query analytics_events collection for PWA-related events (both legacy "event" and current "eventType" fields)
    const [eventFieldSnapshot, eventTypeSnapshot] = await Promise.all([
      db
        .collection("analytics_events")
        .where("event", "==", "pwa_install")
        .get(),
      db
        .collection("analytics_events")
        .where("eventType", "==", "pwa_install")
        .get(),
    ]);

    // Aggregate by action type
    const stats = {
      installed: 0,
      dismissed: 0,
      promptShownEvents: 0,
    };

    const processedIds = new Set<string>();
    [eventFieldSnapshot, eventTypeSnapshot].forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        if (processedIds.has(doc.id)) return;
        processedIds.add(doc.id);

        const data = doc.data() || {};
        const action = String(
          (data as { action?: unknown }).action ??
            (data as { eventAction?: unknown }).eventAction ??
            ""
        ).toLowerCase();

        if (action === "prompt_shown") {
          stats.promptShownEvents++;
          return;
        }

        if (action === "accepted" || action === "installed") {
          stats.installed++;
          return;
        }

        if (
          action === "dismissed" ||
          action === "prompt_dismissed" ||
          action === "declined"
        ) {
          stats.dismissed++;
        }
      });
    });

    // Calculate metrics for Admin Panel
    const installs = stats.installed;
    const dismissals = stats.dismissed;
    const promptShown =
      stats.promptShownEvents > 0
        ? stats.promptShownEvents
        : installs + dismissals;
    const installRate =
      promptShown > 0 ? Math.round((installs / promptShown) * 100) : 0;

    const result = {
      installs,
      dismissals,
      promptShown,
      installRate,
      breakdown: {
        installed: stats.installed,
        dismissed: stats.dismissed,
        promptShown: stats.promptShownEvents,
      },
    };

    // Cache for 5 minutes (300 seconds)
    setCache(cacheKey, result, 300);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    const logger = createLogger(req);
    logger.error("PWA stats error", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch PWA statistics",
      details: err?.message || String(err),
    });
  }
}

export default withErrorHandler(handler);
