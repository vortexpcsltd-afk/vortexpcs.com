/**
 * Real-time visitor tracking service
 * Sends periodic updates about user activity to track live visitors
 */

import { logger } from "./logger";

import { db } from "../config/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
  FieldValue,
  increment,
} from "firebase/firestore";
import {
  safeGetSessionStorage,
  safeSetSessionStorage,
} from "../utils/safeStorage";

interface PageView {
  page: string;
  timestamp: number;
  duration?: number; // seconds spent on previous page
}

interface VisitorActivity {
  sessionId: string;
  currentPage: string;
  currentActivity?: string;
  userAgent: string;
  ipAddress?: string;
  location?: {
    city?: string;
    country?: string;
  };
  lastActive: FieldValue;
  isAuthenticated: boolean;
  userId?: string;
  userName?: string;
  startTime?: FieldValue;
  // New fields for journey tracking
  entryPage?: string;
  entryMethod?: string; // Direct, Search Engine, Social Media, Referral
  referrer?: string;
  searchTerm?: string;
  pageViews?: PageView[] | FieldValue;
  totalPageViews?: number | FieldValue;
}

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let sessionId: string | null = null;
let isTracking = false;
let lastPageView: PageView | null = null;
let cachedIpAddress: string | null = null;
let cachedGeo: { countryCode?: string; city?: string; region?: string } | null =
  null;

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (sessionId) return sessionId;

  // Try to get existing session from sessionStorage (safe with error handling)
  sessionId = safeGetSessionStorage("visitor_session_id");

  if (!sessionId) {
    // Create new session ID
    sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    // Try to store, but fail gracefully if storage unavailable
    // (session will be regenerated on page reload if storage is disabled)
    safeSetSessionStorage("visitor_session_id", sessionId);
  }

  return sessionId;
}

/**
 * Determine entry method from referrer
 */
function getEntryMethod(referrer: string): {
  method: string;
  searchTerm?: string;
} {
  if (!referrer || referrer === "") {
    return { method: "Direct" };
  }

  const ref = referrer.toLowerCase();

  // Search engines
  if (ref.includes("google.")) {
    const url = new URL(referrer);
    const query = url.searchParams.get("q");
    return {
      method: "Search Engine (Google)",
      ...(query && { searchTerm: query }),
    };
  }
  if (ref.includes("bing.")) {
    const url = new URL(referrer);
    const query = url.searchParams.get("q");
    return {
      method: "Search Engine (Bing)",
      ...(query && { searchTerm: query }),
    };
  }
  if (ref.includes("yahoo.")) {
    return { method: "Search Engine (Yahoo)" };
  }
  if (ref.includes("duckduckgo.")) {
    return { method: "Search Engine (DuckDuckGo)" };
  }

  // Social media
  if (
    ref.includes("facebook.") ||
    ref.includes("fb.com") ||
    ref.includes("messenger.")
  ) {
    return { method: "Social Media (Facebook)" };
  }
  if (ref.includes("twitter.") || ref.includes("t.co")) {
    return { method: "Social Media (Twitter/X)" };
  }
  if (ref.includes("linkedin.")) {
    return { method: "Social Media (LinkedIn)" };
  }
  if (ref.includes("instagram.")) {
    return { method: "Social Media (Instagram)" };
  }
  if (ref.includes("reddit.")) {
    return { method: "Social Media (Reddit)" };
  }
  if (ref.includes("youtube.")) {
    return { method: "Social Media (YouTube)" };
  }
  if (ref.includes("tiktok.")) {
    return { method: "Social Media (TikTok)" };
  }

  // Otherwise it's a referral
  try {
    const domain = new URL(referrer).hostname.replace("www.", "");
    return { method: `Referral (${domain})` };
  } catch {
    return { method: "Referral" };
  }
}

/**
 * Get current page info
 */
function getCurrentPageInfo(): { page: string; activity: string } {
  const path = window.location.pathname.replace(/^\/+/, "");

  let page = "Homepage";
  let activity = "Browsing";

  // Determine page and activity based on URL path
  // Check specific routes first, before falling back to home
  if (path.startsWith("admin")) {
    page = "Admin Dashboard";
    activity = "Managing site";
  } else if (path === "analytics" || path.startsWith("analytics/")) {
    page = "Analytics";
    activity = "Viewing analytics";
  } else if (path === "pc-finder" || path.startsWith("pc-finder/")) {
    page = "PC Finder";
    activity = "Finding a PC";
  } else if (path === "pc-builder" || path.startsWith("pc-builder/")) {
    page = "PC Builder";
    activity = "Building a custom PC";
  } else if (path === "builds" || path.startsWith("builds/")) {
    page = "Builds Gallery";
    activity = "Browsing builds";
  } else if (
    path === "repair" ||
    path === "repairs" ||
    path.startsWith("repair/") ||
    path.startsWith("repairs/")
  ) {
    page = "Repairs";
    activity = "Looking at repairs";
  } else if (
    path === "upgrade" ||
    path === "upgrades" ||
    path.startsWith("upgrade/") ||
    path.startsWith("upgrades/")
  ) {
    page = "Upgrades";
    activity = "Browsing upgrades";
  } else if (path === "support" || path.startsWith("support/")) {
    page = "Support";
    activity = "Getting support";
  } else if (path === "contact" || path.startsWith("contact/")) {
    page = "Contact";
    activity = "Contacting us";
  } else if (path === "about" || path.startsWith("about/")) {
    page = "About Us";
    activity = "Learning about us";
  } else if (path === "members" || path.startsWith("members/")) {
    page = "Members Dashboard";
    activity = "Managing account";
  } else if (
    path === "business-solutions" ||
    path.startsWith("business-solutions/")
  ) {
    page = "Business Solutions";
    activity = "Exploring business services";
  } else if (
    path === "enthusiast-builds" ||
    path.startsWith("enthusiast-builds/")
  ) {
    page = "Enthusiast Builds";
    activity = "Viewing enthusiast builds";
  } else if (path === "faq" || path.startsWith("faq/")) {
    page = "FAQ";
    activity = "Reading FAQs";
  } else if (path === "blog" || path.startsWith("blog/")) {
    page = "Blog";
    activity = "Reading blog";
  } else if (path === "order-success" || path.startsWith("order-success/")) {
    page = "Order Success";
    activity = "Completed order";
  } else if (path === "home" || path === "" || path === "/") {
    page = "Homepage";
    activity = "Browsing";
  }

  return { page, activity };
}

/**
 * Update visitor activity in Firestore
 */
async function updateActivity(
  user?: {
    uid: string;
    displayName?: string | null;
  },
  isInitial = false
) {
  if (!db) return;

  try {
    const sid = getSessionId();
    const { page, activity } = getCurrentPageInfo();
    const now = Date.now();

    // Check if page changed
    const pageChanged = lastPageView && lastPageView.page !== page;

    // Calculate duration on previous page if changed
    let duration: number | undefined;
    if (pageChanged && lastPageView) {
      duration = Math.floor((now - lastPageView.timestamp) / 1000);
    }

    const visitorData: VisitorActivity = {
      sessionId: sid,
      currentPage: page,
      currentActivity: activity,
      userAgent: navigator.userAgent,
      lastActive: serverTimestamp(),
      isAuthenticated: !!user,
    };

    // Add IP address if we have it cached or on initial visit
    if (cachedIpAddress || isInitial) {
      if (isInitial) {
        // Fetch geo (includes IP when available)
        try {
          const resp = await fetch("/api/analytics/geo", { cache: "no-store" });
          if (resp.ok) {
            const data = (await resp.json()) as {
              ip?: string;
              countryCode?: string;
              city?: string;
              region?: string;
            };
            if (data?.ip) cachedIpAddress = data.ip;
            cachedGeo = {
              countryCode: data?.countryCode,
              city: data?.city,
              region: data?.region,
            };
          }
        } catch {
          // Silently fail
        }
      }
      if (cachedIpAddress) {
        visitorData.ipAddress = cachedIpAddress;
      }
    }

    if (isInitial && cachedGeo && (cachedGeo.countryCode || cachedGeo.city)) {
      visitorData.location = {
        country: cachedGeo.countryCode,
        city: cachedGeo.city,
      };
    }

    if (user) {
      visitorData.userId = user.uid;
      visitorData.userName = user.displayName || "Unknown User";
    }

    // On initial visit, set entry data
    if (isInitial) {
      const referrer = document.referrer;
      const { method, searchTerm } = getEntryMethod(referrer);

      const initialPageView: PageView = {
        page,
        timestamp: now,
      };

      visitorData.startTime = serverTimestamp();
      visitorData.entryPage = page;
      visitorData.entryMethod = method;
      if (referrer) {
        visitorData.referrer = referrer;
      }
      if (searchTerm) {
        visitorData.searchTerm = searchTerm;
      }
      visitorData.pageViews = [initialPageView];
      visitorData.totalPageViews = 1;

      // Set initial page view tracker
      lastPageView = initialPageView;
    } else if (pageChanged && duration !== undefined) {
      // Page changed - add new page view with duration from previous page
      const newPageView: PageView = {
        page,
        timestamp: now,
        duration, // Duration spent on PREVIOUS page
      };

      visitorData.pageViews = arrayUnion(newPageView);
      visitorData.totalPageViews = increment(1);

      // Update last page view tracker
      lastPageView = {
        page,
        timestamp: now,
      };
    }
    // If page hasn't changed, just update lastActive (heartbeat)

    await setDoc(doc(db, "active_visitors", sid), visitorData, { merge: true });
  } catch (error) {
    logger.error("Failed to update visitor activity:", error);
  }
}

/**
 * Start tracking visitor activity
 */
export function startRealtimeTracking(user?: {
  uid: string;
  displayName?: string | null;
}) {
  if (isTracking) return;

  isTracking = true;

  // Initial update with entry tracking
  updateActivity(user, true);

  // Update every 10 seconds
  heartbeatInterval = setInterval(() => {
    updateActivity(user, false);
  }, 10000);

  // Update on page visibility change
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateActivity(user);
    }
  });

  // Update on React Router navigation (popstate for back/forward buttons)
  window.addEventListener("popstate", () => {
    updateActivity(user);
  });

  // Override pushState and replaceState to detect React Router navigation
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (...args) {
    originalPushState.apply(window.history, args);
    updateActivity(user);
  };

  window.history.replaceState = function (...args) {
    originalReplaceState.apply(window.history, args);
    updateActivity(user);
  };

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    stopRealtimeTracking();
  });
}

/**
 * Stop tracking and remove visitor from active list
 */
export async function stopRealtimeTracking() {
  if (!db) return;

  isTracking = false;

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  try {
    const sid = getSessionId();
    await deleteDoc(doc(db, "active_visitors", sid));
  } catch (error) {
    logger.error("Failed to remove visitor:", error);
  }
}

/**
 * Update activity description (e.g., "Selecting GPU", "Viewing build X")
 */
export function updateActivityDescription(description: string) {
  if (!db || !isTracking) return;

  const sid = getSessionId();
  setDoc(
    doc(db, "active_visitors", sid),
    {
      currentActivity: description,
      lastActive: serverTimestamp(),
    },
    { merge: true }
  ).catch((err) => {
    logger.error("Failed to update activity description:", err);
  });
}
