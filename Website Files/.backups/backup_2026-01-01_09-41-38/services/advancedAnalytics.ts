/**
 * Advanced Analytics Service
 * Tracks visitor sessions, page views, user behavior, and security events
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, firebaseIsConfigured } from "../config/firebase";
import { logger } from "./logger";

// Cache client IP (fetched from our own API so we don't rely on third parties)
let CACHED_CLIENT_IP: string | null = null;
async function getClientIp(): Promise<string | null> {
  try {
    if (CACHED_CLIENT_IP) return CACHED_CLIENT_IP;
    const res = await fetch("/api/analytics/ip", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { ip?: string };
    CACHED_CLIENT_IP = data?.ip || null;
    return CACHED_CLIENT_IP;
  } catch {
    return null;
  }
}

type ClientGeo = {
  ip?: string;
  countryCode?: string;
  city?: string;
  region?: string;
};
let CACHED_CLIENT_GEO: ClientGeo | null = null;
async function getClientGeo(): Promise<ClientGeo> {
  try {
    if (CACHED_CLIENT_GEO) return CACHED_CLIENT_GEO;
    const res = await fetch("/api/analytics/geo", { cache: "no-store" });
    if (!res.ok) return {};
    const data = (await res.json()) as ClientGeo;
    CACHED_CLIENT_GEO = data || {};
    if (data?.ip && !CACHED_CLIENT_IP) CACHED_CLIENT_IP = data.ip;
    return CACHED_CLIENT_GEO;
  } catch {
    return {};
  }
}

// Firefox reliability: optionally force API fallback for Firefox UAs, gated by env flag
const FORCE_API_FOR_FIREFOX = ((): boolean => {
  try {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isFirefox = /Firefox/i.test(ua);
    // Env gating: "true" means enable for Firefox; "false" disables; unset defaults to enabling for Firefox
    // Use a typed-safe access for Vite env
    const metaEnv = import.meta.env as Record<string, string>;
    const flag = metaEnv?.VITE_ANALYTICS_FORCE_API_FIREFOX as
      | string
      | undefined;
    if (flag === "true") return isFirefox;
    if (flag === "false") return false;
    return isFirefox; // default behavior (enabled on Firefox)
  } catch {
    return false;
  }
})();

// Session tracking
export interface AnalyticsSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  pages: string[];
  referrer: string;
  referrerSource?: string; // e.g., "Google", "Facebook", "Direct"
  referrerTerm?: string; // e.g., "custom pcs", "gaming computers"
  userAgent: string;
  ip?: string;
  location?: {
    country?: string;
    countryCode?: string;
    city?: string;
    region?: string;
  };
  device: {
    type: "mobile" | "tablet" | "desktop";
    browser: string;
    os: string;
  };
  isActive: boolean;
}

// Page view tracking
export interface PageView {
  sessionId: string;
  userId?: string;
  page: string;
  title: string;
  timestamp: Date;
  timeOnPage?: number;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
}

// User event tracking
export interface UserEvent {
  sessionId: string;
  userId?: string;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: Date;
  page: string;
}

// Security event tracking
export interface SecurityEvent {
  type:
    | "login_success"
    | "login_failed"
    | "password_reset"
    | "suspicious_activity";
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Remove undefined/null values from object to prevent Firestore errors
 */
function cleanForFirestore<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Initialize or update analytics session
 */
export async function trackSession(
  sessionData: Partial<AnalyticsSession>
): Promise<string> {
  try {
    if (!firebaseIsConfigured || FORCE_API_FOR_FIREFOX) {
      const sessionId = sessionData.sessionId || generateSessionId();
      logger.info(
        "📊 [Analytics] Tracking session via API (Firebase not configured)",
        { sessionId }
      );
      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "session",
          payload: { ...sessionData, sessionId },
        }),
        keepalive: true,
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.text();
        logger.error("❌ [Analytics] Session track failed", undefined, {
          status: response.status,
          body,
        });
      } else {
        logger.success("✅ [Analytics] Session tracked successfully via API");
      }
      return sessionId;
    }

    const sessionId = sessionData.sessionId || generateSessionId();
    const sessionRef = doc(db, "analytics_sessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      // Update existing session
      logger.info("📊 [Analytics] Updating existing session via Firestore", {
        sessionId,
      });
      // Filter out undefined values to prevent Firestore errors
      const updateData: Record<string, unknown> = {
        lastActivity: Timestamp.now(),
        pageViews: (sessionDoc.data().pageViews || 0) + 1,
        pages: [...(sessionDoc.data().pages || []), sessionData.pages?.[0]]
          .filter(Boolean)
          .slice(-50),
        isActive: true,
      };

      // Only include optional fields if they have valid values
      if (sessionData.referrer) updateData.referrer = sessionData.referrer;
      if (sessionData.userAgent) updateData.userAgent = sessionData.userAgent;
      if (
        sessionData.location &&
        Object.keys(sessionData.location).length > 0
      ) {
        updateData.location = sessionData.location;
      }
      if (sessionData.device && Object.keys(sessionData.device).length > 0) {
        updateData.device = sessionData.device;
      }

      // Add IP if the stored doc doesn't have it yet
      try {
        if (!sessionDoc.data().ip) {
          const geo = await getClientGeo();
          const ip = geo.ip || (await getClientIp());
          if (ip) (updateData as { ip?: string }).ip = ip;
        }
        const currentLoc = sessionDoc.data().location || {};
        if (!currentLoc?.country && !currentLoc?.countryCode) {
          const geo = await getClientGeo();
          if (geo?.countryCode) {
            (updateData as { location?: Record<string, unknown> }).location = {
              ...currentLoc,
              countryCode: geo.countryCode,
              city: currentLoc.city || geo.city,
              region: currentLoc.region || geo.region,
            };
          }
        }
      } catch (e) {
        // Non-fatal: if IP fetch fails, continue without it
        logger.debug("[Analytics] Skipping IP backfill on session update", {
          error: e as unknown,
        });
      }

      await updateDoc(sessionRef, updateData);
      logger.success("✅ [Analytics] Session updated via Firestore");
    } else {
      // Create new session
      logger.info("📊 [Analytics] Creating new session via Firestore", {
        sessionId,
      });
      const geo = await getClientGeo();
      const ip = geo.ip || (await getClientIp());
      const sessionDoc = cleanForFirestore({
        sessionId,
        userId: sessionData.userId,
        startTime: Timestamp.now(),
        lastActivity: Timestamp.now(),
        pageViews: 1,
        pages: sessionData.pages || [],
        referrer: sessionData.referrer || "",
        ip: ip || undefined,
        userAgent: sessionData.userAgent || "",
        location:
          sessionData.location ||
          (geo?.countryCode || geo?.city || geo?.region
            ? {
                countryCode: geo.countryCode,
                city: geo.city,
                region: geo.region,
              }
            : {}),
        device: sessionData.device || {
          type: "desktop",
          browser: "unknown",
          os: "unknown",
        },
        isActive: true,
      });
      await setDoc(sessionRef, sessionDoc);
      logger.success("✅ [Analytics] Session created via Firestore");
    }

    return sessionId;
  } catch (error) {
    // Silently handle permission errors (likely due to Firebase rules propagation)
    if (error instanceof Error && error.message.includes("permissions")) {
      logger.warn(
        "⚠️ [Analytics] Session tracking paused (Firebase rules propagating)"
      );
      return sessionData.sessionId || generateSessionId();
    }

    logger.error("❌ [Analytics] Track session error:", error);
    logger.info("📊 [Analytics] Session data attempted:", {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      pageViews: sessionData.pageViews,
      pages: sessionData.pages,
    });
    // Fallback to API
    try {
      const sessionId = sessionData.sessionId || generateSessionId();
      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "session",
          payload: { ...sessionData, sessionId },
        }),
        keepalive: true,
        cache: "no-store",
      });
      if (response.ok) {
        logger.success("✅ [Analytics] Session tracked via API fallback");
      }
      return sessionId;
    } catch {
      // Silently fail - analytics shouldn't break the app
      return "";
    }
  }
}

/**
 * Track page view
 */
export async function trackPageView(pageView: PageView): Promise<void> {
  try {
    if (!firebaseIsConfigured || FORCE_API_FOR_FIREFOX) {
      logger.info(
        "📊 [Analytics] Tracking pageview via API (Firebase not configured)",
        { page: pageView.page }
      );
      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pageview", payload: pageView }),
        keepalive: true,
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.text();
        logger.error("❌ [Analytics] Pageview track failed", undefined, {
          status: response.status,
          body,
        });
      } else {
        logger.success("✅ [Analytics] Pageview tracked successfully via API");
      }
      return;
    }

    logger.info("📊 [Analytics] Tracking pageview via Firestore client SDK", {
      page: pageView.page,
      sessionId: pageView.sessionId,
    });

    // Clean object to remove all undefined/null values
    const ip = await getClientIp();
    const cleanPageView = cleanForFirestore({
      ...pageView,
      timestamp: Timestamp.fromDate(pageView.timestamp),
      ip: ip || undefined,
    });

    const docRef = await addDoc(
      collection(db, "analytics_pageviews"),
      cleanPageView
    );

    logger.success(
      "✅ [Analytics] Pageview tracked successfully via Firestore",
      {
        docId: docRef.id,
        page: pageView.page,
      }
    );
  } catch (error) {
    logger.error("❌ [Analytics] Track page view error:", error);
    // Fallback to API if Firestore write fails
    try {
      logger.info("📊 [Analytics] Retrying pageview via API fallback");
      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pageview", payload: pageView }),
        keepalive: true,
        cache: "no-store",
      });
      if (response.ok) {
        logger.success("✅ [Analytics] Pageview tracked via API fallback");
      } else {
        logger.warn(
          "⚠️ [Analytics] API fallback failed (backend not configured)",
          { status: response.status }
        );
      }
    } catch (fallbackError) {
      logger.warn("⚠️ [Analytics] API not available", { error: fallbackError });
    }
  }
}

/**
 * Track user event (clicks, form submissions, etc.)
 */
export async function trackUserEvent(event: UserEvent): Promise<void> {
  try {
    logger.info("📊 [Analytics] trackUserEvent called", {
      eventType: event.eventType,
      sessionId: event.sessionId,
      eventData: event.eventData,
      page: event.page,
      firebaseConfigured: firebaseIsConfigured,
      forceAPI: FORCE_API_FOR_FIREFOX,
    });

    // Prefer Firestore client SDK when available, only use API if Firebase not configured
    if (!firebaseIsConfigured || FORCE_API_FOR_FIREFOX) {
      logger.info("📊 [Analytics] Tracking event via API", {
        eventType: event.eventType,
        sessionId: event.sessionId,
      });

      const payload = {
        kind: "event",
        payload: {
          ...event,
          timestamp: event.timestamp.toISOString(),
        },
      };

      logger.info("📊 [Analytics] Sending payload", { payload });

      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        cache: "no-store",
      });

      let responseText = "";
      try {
        responseText = await response.text();
      } catch {
        responseText = "Could not read response";
      }

      logger.info("[Analytics] API Response", {
        status: response.status,
        body: responseText,
      });

      if (!response.ok) {
        logger.warn(
          "⚠️ [Analytics] Event track via API failed (backend not configured)",
          { status: response.status }
        );
        // Don't throw - API is optional, fail silently
        return;
      } else {
        logger.success("✅ [Analytics] Event tracked successfully via API");
      }
      return;
    }

    logger.info(
      "📊 [Analytics] Writing event to Firestore analytics_events collection..."
    );
    const cleanEvent = cleanForFirestore({
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp),
    });
    const docRef = await addDoc(collection(db, "analytics_events"), cleanEvent);
    logger.success("✅ [Analytics] Event tracked successfully to Firestore", {
      eventType: event.eventType,
      docId: docRef.id,
      collection: "analytics_events",
    });
  } catch (error) {
    logger.error("❌ [Analytics] Track user event error:", error);
    // Don't throw - fail silently but log for debugging
  }
}

/**
 * Track security event
 */
export async function trackSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    if (!firebaseIsConfigured) {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "security", payload: event }),
      });
      return;
    }

    const cleanEvent = cleanForFirestore({
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp),
    });
    await addDoc(collection(db, "security_events"), cleanEvent);
  } catch (error) {
    logger.error("Track security event error:", error);
  }
}

/**
 * Get active sessions (users currently on site)
 */
export async function getActiveSessions(): Promise<AnalyticsSession[]> {
  try {
    if (!firebaseIsConfigured) return [];

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const q = query(
      collection(db, "analytics_sessions"),
      where("isActive", "==", true),
      where("lastActivity", ">=", Timestamp.fromDate(fiveMinutesAgo)),
      orderBy("lastActivity", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        startTime: data.startTime?.toDate(),
        lastActivity: data.lastActivity?.toDate(),
      } as AnalyticsSession;
    });
  } catch (error) {
    logger.error("Get active sessions error:", error);
    return [];
  }
}

/**
 * Get page views for a time period
 */
export async function getPageViews(
  startDate: Date,
  endDate: Date
): Promise<PageView[]> {
  try {
    if (!firebaseIsConfigured) return [];

    const q = query(
      collection(db, "analytics_pageviews"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate)),
      orderBy("timestamp", "desc"),
      firestoreLimit(1000)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate(),
      } as PageView;
    });
  } catch (error) {
    logger.error("Get page views error:", error);
    return [];
  }
}

/**
 * Get security events
 */
export async function getSecurityEvents(
  startDate: Date,
  maxResults = 100
): Promise<SecurityEvent[]> {
  try {
    if (!firebaseIsConfigured) return [];

    const q = query(
      collection(db, "security_events"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      orderBy("timestamp", "desc"),
      firestoreLimit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate(),
      } as SecurityEvent;
    });
  } catch (error) {
    logger.error("Get security events error:", error);
    return [];
  }
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(days: number = 30) {
  try {
    if (!firebaseIsConfigured) return null;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [pageViews, sessions, events, securityEvents] = await Promise.all([
      getPageViews(startDate, new Date()),
      getSessionsInPeriod(startDate, new Date()),
      getUserEvents(startDate, new Date()),
      getSecurityEvents(startDate),
    ]);

    // Calculate metrics
    const uniqueVisitors = new Set(sessions.map((s) => s.sessionId)).size;
    const totalPageViews = pageViews.length;
    const avgPagesPerSession =
      sessions.length > 0 ? totalPageViews / sessions.length : 0;
    const avgSessionDuration =
      sessions.reduce((acc, s) => {
        const duration = s.lastActivity.getTime() - s.startTime.getTime();
        return acc + duration;
      }, 0) / (sessions.length || 1);

    // Top pages
    const pageCounts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      pageCounts[pv.page] = (pageCounts[pv.page] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    // Traffic sources
    const referrers: Record<string, number> = {};
    sessions.forEach((s) => {
      const ref = s.referrer || "Direct";
      referrers[ref] = (referrers[ref] || 0) + 1;
    });

    // Device breakdown
    const devices = sessions.reduce((acc, s) => {
      acc[s.device.type] = (acc[s.device.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Security summary
    const loginAttempts = securityEvents.filter(
      (e) => e.type === "login_success" || e.type === "login_failed"
    );
    const failedLogins = securityEvents.filter(
      (e) => e.type === "login_failed"
    ).length;
    const successfulLogins = securityEvents.filter(
      (e) => e.type === "login_success"
    ).length;

    return {
      summary: {
        uniqueVisitors,
        totalPageViews,
        totalSessions: sessions.length,
        avgPagesPerSession: avgPagesPerSession.toFixed(2),
        avgSessionDuration: Math.round(avgSessionDuration / 1000), // seconds
        bounceRate: calculateBounceRate(sessions),
      },
      topPages,
      trafficSources: Object.entries(referrers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([source, visits]) => ({ source, visits })),
      devices,
      security: {
        totalAttempts: loginAttempts.length,
        successful: successfulLogins,
        failed: failedLogins,
        suspiciousActivity: securityEvents.filter(
          (e) => e.type === "suspicious_activity"
        ).length,
      },
      events: events.slice(0, 100),
    };
  } catch (error) {
    logger.error("Get analytics summary error:", error);
    return null;
  }
}

/**
 * Get sessions in a period
 */
async function getSessionsInPeriod(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsSession[]> {
  try {
    if (!firebaseIsConfigured) return [];

    const q = query(
      collection(db, "analytics_sessions"),
      where("startTime", ">=", Timestamp.fromDate(startDate)),
      where("startTime", "<=", Timestamp.fromDate(endDate)),
      firestoreLimit(5000)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        startTime: data.startTime?.toDate(),
        lastActivity: data.lastActivity?.toDate(),
      } as AnalyticsSession;
    });
  } catch (error) {
    logger.error("Get sessions error:", error);
    return [];
  }
}

/**
 * Get user events in a period
 */
async function getUserEvents(
  startDate: Date,
  endDate: Date
): Promise<UserEvent[]> {
  try {
    if (!firebaseIsConfigured) return [];

    const q = query(
      collection(db, "analytics_events"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate)),
      orderBy("timestamp", "desc"),
      firestoreLimit(1000)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate(),
      } as UserEvent;
    });
  } catch (error) {
    logger.error("Get user events error:", error);
    return [];
  }
}

/**
 * Calculate bounce rate (sessions with only 1 page view)
 */
function calculateBounceRate(sessions: AnalyticsSession[]): string {
  if (sessions.length === 0) return "0%";
  const bounces = sessions.filter((s) => s.pageViews === 1).length;
  return ((bounces / sessions.length) * 100).toFixed(1) + "%";
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Parse referrer URL to extract source and search term
 */
export function parseReferrer(referrerUrl: string): {
  source: string;
  term?: string;
} {
  if (!referrerUrl || referrerUrl === "") {
    return { source: "Direct" };
  }

  try {
    const url = new URL(referrerUrl);
    const hostname = url.hostname.toLowerCase();

    // Search engines
    if (hostname.includes("google")) {
      const term = url.searchParams.get("q") || undefined;
      return { source: "Google", term };
    }
    if (hostname.includes("bing")) {
      const term = url.searchParams.get("q") || undefined;
      return { source: "Bing", term };
    }
    if (hostname.includes("yahoo")) {
      const term = url.searchParams.get("p") || undefined;
      return { source: "Yahoo", term };
    }
    if (hostname.includes("duckduckgo")) {
      const term = url.searchParams.get("q") || undefined;
      return { source: "DuckDuckGo", term };
    }
    if (hostname.includes("baidu")) {
      const term = url.searchParams.get("wd") || undefined;
      return { source: "Baidu", term };
    }

    // Social media
    if (hostname.includes("facebook") || hostname.includes("fb.com")) {
      return { source: "Facebook" };
    }
    if (hostname.includes("twitter") || hostname.includes("t.co")) {
      return { source: "Twitter" };
    }
    if (hostname.includes("linkedin")) {
      return { source: "LinkedIn" };
    }
    if (hostname.includes("instagram")) {
      return { source: "Instagram" };
    }
    if (hostname.includes("reddit")) {
      return { source: "Reddit" };
    }
    if (hostname.includes("youtube")) {
      return { source: "YouTube" };
    }
    if (hostname.includes("tiktok")) {
      return { source: "TikTok" };
    }

    // Email clients
    if (hostname.includes("mail") || hostname.includes("email")) {
      return { source: "Email" };
    }

    // Other referrers - use the domain name
    const domain = hostname.replace(/^www\./, "");
    return { source: domain };
  } catch {
    return { source: "Direct" };
  }
}

/**
 * Fetch all visitor sessions for a specific date
 */
export async function getSessionsForDate(
  date: string
): Promise<AnalyticsSession[]> {
  try {
    if (!firebaseIsConfigured) {
      logger.warn(
        "⚠️ [Analytics] Firebase not configured, cannot fetch sessions"
      );
      return [];
    }

    // Parse the date and create start/end timestamps for the day
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const startOfDay = Timestamp.fromDate(targetDate);

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    const endOfDay = Timestamp.fromDate(endDate);

    const sessionsRef = collection(db, "analytics_sessions");
    const q = query(
      sessionsRef,
      where("startTime", ">=", startOfDay),
      where("startTime", "<=", endOfDay),
      orderBy("startTime", "desc")
    );

    const snapshot = await getDocs(q);
    const sessions: AnalyticsSession[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        sessionId: data.sessionId,
        userId: data.userId,
        startTime: data.startTime?.toDate() || new Date(),
        lastActivity: data.lastActivity?.toDate() || new Date(),
        pageViews: data.pageViews || 0,
        pages: data.pages || [],
        referrer: data.referrer || "",
        referrerSource: data.referrerSource || "Direct",
        referrerTerm: data.referrerTerm,
        userAgent: data.userAgent || "",
        ip: data.ip,
        location: data.location,
        device: data.device || {
          type: "desktop",
          browser: "unknown",
          os: "unknown",
        },
        isActive: data.isActive || false,
      };
    });

    logger.info(
      `📊 [Analytics] Fetched ${sessions.length} sessions for ${date}`
    );
    return sessions;
  } catch (error) {
    logger.error("❌ [Analytics] Error fetching sessions for date:", error);
    return [];
  }
}
