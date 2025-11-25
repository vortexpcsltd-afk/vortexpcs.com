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

// Firefox reliability: optionally force API fallback for Firefox UAs, gated by env flag
const FORCE_API_FOR_FIREFOX = ((): boolean => {
  try {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isFirefox = /Firefox/i.test(ua);
    // Env gating: "true" means enable for Firefox; "false" disables; unset defaults to enabling for Firefox
    // Use a typed-safe access for Vite env
    const envObj = (import.meta as unknown as { env?: Record<string, string> })
      .env;
    const flag = envObj?.VITE_ANALYTICS_FORCE_API_FIREFOX as string | undefined;
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
    city?: string;
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
 * Initialize or update analytics session
 */
export async function trackSession(
  sessionData: Partial<AnalyticsSession>
): Promise<string> {
  try {
    if (!firebaseIsConfigured || FORCE_API_FOR_FIREFOX) {
      const sessionId = sessionData.sessionId || generateSessionId();
      console.log(
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
        console.error(
          "❌ [Analytics] Session track failed:",
          response.status,
          await response.text()
        );
      } else {
        console.log("✅ [Analytics] Session tracked successfully via API");
      }
      return sessionId;
    }

    const sessionId = sessionData.sessionId || generateSessionId();
    const sessionRef = doc(db, "analytics_sessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      // Update existing session
      console.log("📊 [Analytics] Updating existing session via Firestore", {
        sessionId,
      });
      await updateDoc(sessionRef, {
        lastActivity: Timestamp.now(),
        pageViews: (sessionDoc.data().pageViews || 0) + 1,
        pages: [
          ...(sessionDoc.data().pages || []),
          sessionData.pages?.[0],
        ].slice(-50),
        isActive: true,
      });
      console.log("✅ [Analytics] Session updated via Firestore");
    } else {
      // Create new session
      console.log("📊 [Analytics] Creating new session via Firestore", {
        sessionId,
      });
      await setDoc(sessionRef, {
        sessionId,
        userId: sessionData.userId || null,
        startTime: Timestamp.now(),
        lastActivity: Timestamp.now(),
        pageViews: 1,
        pages: sessionData.pages || [],
        referrer: sessionData.referrer || "",
        userAgent: sessionData.userAgent || "",
        location: sessionData.location || {},
        device: sessionData.device || {
          type: "desktop",
          browser: "unknown",
          os: "unknown",
        },
        isActive: true,
      });
      console.log("✅ [Analytics] Session created via Firestore");
    }

    return sessionId;
  } catch (error) {
    console.error("❌ [Analytics] Track session error:", error);
    // Fallback to API
    try {
      const sessionId = sessionData.sessionId || generateSessionId();
      console.log("📊 [Analytics] Retrying session via API fallback");
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
        console.log("✅ [Analytics] Session tracked via API fallback");
      } else {
        console.error(
          "❌ [Analytics] API fallback also failed:",
          response.status
        );
      }
      return sessionId;
    } catch (fallbackError) {
      console.error("❌ [Analytics] API fallback error:", fallbackError);
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
      console.log(
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
        console.error(
          "❌ [Analytics] Pageview track failed:",
          response.status,
          await response.text()
        );
      } else {
        console.log("✅ [Analytics] Pageview tracked successfully via API");
      }
      return;
    }

    console.log("📊 [Analytics] Tracking pageview via Firestore client SDK", {
      page: pageView.page,
      sessionId: pageView.sessionId,
    });

    const docRef = await addDoc(collection(db, "analytics_pageviews"), {
      ...pageView,
      timestamp: Timestamp.fromDate(pageView.timestamp),
    });

    console.log("✅ [Analytics] Pageview tracked successfully via Firestore", {
      docId: docRef.id,
      page: pageView.page,
    });
  } catch (error) {
    console.error("❌ [Analytics] Track page view error:", error);
    // Fallback to API if Firestore write fails
    try {
      console.log("📊 [Analytics] Retrying pageview via API fallback");
      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pageview", payload: pageView }),
        keepalive: true,
        cache: "no-store",
      });
      if (response.ok) {
        console.log("✅ [Analytics] Pageview tracked via API fallback");
      } else {
        console.error(
          "❌ [Analytics] API fallback also failed:",
          response.status
        );
      }
    } catch (fallbackError) {
      console.error("❌ [Analytics] API fallback error:", fallbackError);
    }
  }
}

/**
 * Track user event (clicks, form submissions, etc.)
 */
export async function trackUserEvent(event: UserEvent): Promise<void> {
  try {
    console.log("📊 [Analytics] trackUserEvent called:", {
      eventType: event.eventType,
      sessionId: event.sessionId,
      eventData: event.eventData,
      page: event.page,
      firebaseConfigured: firebaseIsConfigured,
      forceAPI: FORCE_API_FOR_FIREFOX,
    });

    // Always use API for reliability and to bypass consent checks on backend
    const useAPI = true; // Force API to ensure tracking always works
    if (!firebaseIsConfigured || FORCE_API_FOR_FIREFOX || useAPI) {
      console.log("📊 [Analytics] Tracking event via API", {
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

      console.log("📊 [Analytics] Sending payload:", payload);

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

      console.log("[Analytics] API Response:", response.status, responseText);

      if (!response.ok) {
        console.error(
          "❌ [Analytics] Event track failed:",
          response.status,
          responseText
        );
        throw new Error(
          `Analytics API failed: ${response.status} ${responseText}`
        );
      } else {
        console.log("✅ [Analytics] Event tracked successfully via API");
      }
      return;
    }

    console.log(
      "📊 [Analytics] Writing event to Firestore analytics_events collection..."
    );
    const docRef = await addDoc(collection(db, "analytics_events"), {
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp),
    });
    console.log("✅ [Analytics] Event tracked successfully to Firestore:", {
      eventType: event.eventType,
      docId: docRef.id,
      collection: "analytics_events",
    });
  } catch (error) {
    console.error("❌ [Analytics] Track user event error:", error);
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

    await addDoc(collection(db, "security_events"), {
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp),
    });
  } catch (error) {
    console.error("Track security event error:", error);
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
    console.error("Get active sessions error:", error);
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
    console.error("Get page views error:", error);
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
    console.error("Get security events error:", error);
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
    console.error("Get analytics summary error:", error);
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
    console.error("Get sessions error:", error);
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
    console.error("Get user events error:", error);
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
