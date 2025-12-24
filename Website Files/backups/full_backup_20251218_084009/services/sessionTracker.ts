/**
 * Session Tracker - Frontend analytics tracking
 * Tracks user sessions, page views, and interactions
 */

import {
  trackSession,
  trackPageView,
  trackUserEvent,
} from "./advancedAnalytics";

let sessionId: string | null = null;
let sessionStartTime: Date | null = null;
let currentPage: string | null = null;
let pageStartTime: Date | null = null;
let lastClicks: Array<{ t: number; x: number; y: number; target: string }> = [];
let rageClickCooldownUntil = 0;
let rapidClickCooldownUntil = 0;
let perfFlags = {
  lcpReported: false,
  ttfbReported: false,
  clsReported: false,
  longTaskReported: false,
};

/**
 * Initialize session tracking
 */
export function initializeSessionTracking(userId?: string) {
  if (sessionId) {
    console.log("📊 [SessionTracker] Session already initialized:", sessionId);
    return sessionId;
  }

  // Generate session ID
  sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 15)}`;
  sessionStartTime = new Date();

  // Store session ID in sessionStorage for components to access
  sessionStorage.setItem("vortex_session_id", sessionId);

  console.log("📊 [SessionTracker] Initializing new session:", {
    sessionId,
    userId,
  });

  // Get device info
  const device = {
    type: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
  };

  // Parse referrer to extract source and search term
  const referrer = document.referrer || "";
  let referrerSource: string | undefined;
  let referrerTerm: string | undefined;

  if (referrer) {
    try {
      const url = new URL(referrer);
      const hostname = url.hostname.toLowerCase();

      // Search engines
      if (hostname.includes("google")) {
        referrerSource = "Google";
        referrerTerm = url.searchParams.get("q") || undefined;
      } else if (hostname.includes("bing")) {
        referrerSource = "Bing";
        referrerTerm = url.searchParams.get("q") || undefined;
      } else if (hostname.includes("yahoo")) {
        referrerSource = "Yahoo";
        referrerTerm = url.searchParams.get("p") || undefined;
      } else if (hostname.includes("duckduckgo")) {
        referrerSource = "DuckDuckGo";
        referrerTerm = url.searchParams.get("q") || undefined;
      } else if (hostname.includes("baidu")) {
        referrerSource = "Baidu";
        referrerTerm = url.searchParams.get("wd") || undefined;
      }
      // Social media
      else if (hostname.includes("facebook") || hostname.includes("fb.com")) {
        referrerSource = "Facebook";
      } else if (hostname.includes("twitter") || hostname.includes("t.co")) {
        referrerSource = "Twitter";
      } else if (hostname.includes("linkedin")) {
        referrerSource = "LinkedIn";
      } else if (hostname.includes("instagram")) {
        referrerSource = "Instagram";
      } else if (hostname.includes("reddit")) {
        referrerSource = "Reddit";
      } else if (hostname.includes("youtube")) {
        referrerSource = "YouTube";
      } else if (hostname.includes("tiktok")) {
        referrerSource = "TikTok";
      }
      // Email
      else if (hostname.includes("mail") || hostname.includes("email")) {
        referrerSource = "Email";
      }
      // Other
      else {
        referrerSource = hostname.replace(/^www\./, "");
      }
    } catch {
      referrerSource = "Unknown";
    }
  } else {
    referrerSource = "Direct";
  }

  // Fallback: if no referrerTerm is available, use utm_term from landing URL
  if (!referrerTerm) {
    const utmTerm = getUrlParam("utm_term");
    if (utmTerm) referrerTerm = utmTerm;
  }

  // Track session
  trackSession({
    sessionId,
    userId: userId || undefined,
    startTime: sessionStartTime,
    lastActivity: sessionStartTime,
    pageViews: 0,
    pages: [],
    referrer,
    referrerSource,
    referrerTerm,
    userAgent: navigator.userAgent,
    device,
    isActive: true,
  });

  // Update session on activity
  setupActivityTracking();

  // Setup frustration + performance tracking
  setupFrustrationTracking();
  setupPerformanceTracking();

  return sessionId;
}

/**
 * Track page view
 */
export function trackPage(page: string, _title?: string, userId?: string) {
  console.log("📊 [SessionTracker] trackPage called:", { page, sessionId });

  if (!sessionId) {
    console.log("📊 [SessionTracker] No session, initializing...");
    initializeSessionTracking(userId);
  }

  // Track time on previous page
  if (currentPage && pageStartTime) {
    const timeOnPage = Date.now() - pageStartTime.getTime();
    console.log("📊 [SessionTracker] Tracking previous page:", {
      currentPage,
      timeOnPage,
    });
    trackPageView({
      sessionId: sessionId!,
      userId: userId || undefined,
      page: currentPage,
      title: document.title,
      timestamp: pageStartTime,
      timeOnPage: Math.round(timeOnPage / 1000), // seconds
      referrer: document.referrer || "",
      utmSource: getUrlParam("utm_source"),
      utmMedium: getUrlParam("utm_medium"),
      utmCampaign: getUrlParam("utm_campaign"),
      utmTerm: getUrlParam("utm_term"),
    });
  }

  // Start tracking new page
  currentPage = page;
  pageStartTime = new Date();

  console.log("📊 [SessionTracker] Starting new page track:", {
    page,
    sessionId,
  });

  // Update session with new page
  // Only send fields that should be updated, not identity fields (referrer, userAgent, device)
  if (sessionId) {
    trackSession({
      sessionId,
      userId: userId || undefined,
      lastActivity: new Date(),
      pageViews: 1,
      pages: [page],
      isActive: true,
      // DO NOT send referrer, userAgent, device on updates - they're immutable after creation
    });

    // Immediately log a page view for the new page so dashboards update without waiting for a navigation/unload event
    console.log("📊 [SessionTracker] Tracking immediate pageview for new page");
    trackPageView({
      sessionId,
      userId: userId || undefined,
      page,
      title: document.title,
      timestamp: pageStartTime,
      referrer: document.referrer || "",
      utmSource: getUrlParam("utm_source"),
      utmMedium: getUrlParam("utm_medium"),
      utmCampaign: getUrlParam("utm_campaign"),
      utmTerm: getUrlParam("utm_term"),
    });
  }
}

/**
 * Track user event
 */
export function trackClick(
  eventType: string,
  eventData: Record<string, unknown>,
  userId?: string
) {
  // Ensure we have a session ID - generate one if needed
  let effectiveSessionId = sessionId;
  if (!effectiveSessionId) {
    // Try to get from sessionStorage first
    effectiveSessionId = sessionStorage.getItem("vortex_session_id");
    if (!effectiveSessionId) {
      // Generate temporary session for tracking
      effectiveSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      sessionStorage.setItem("vortex_session_id", effectiveSessionId);
      sessionId = effectiveSessionId;
      console.log(
        "📊 [SessionTracker] Generated session for event tracking:",
        effectiveSessionId
      );
    } else {
      sessionId = effectiveSessionId;
    }
  }

  console.log("📊 [SessionTracker] Tracking event:", {
    eventType,
    sessionId: effectiveSessionId,
    eventData,
  });

  trackUserEvent({
    sessionId: effectiveSessionId,
    userId: userId || undefined,
    eventType,
    eventData,
    timestamp: new Date(),
    page: currentPage || window.location.pathname,
  });
}

/**
 * Track download event
 */
export function trackDownload(fileName: string, userId?: string) {
  trackClick(
    "download",
    {
      fileName,
      fileUrl: fileName,
    },
    userId
  );
}

/**
 * Setup activity tracking
 */
function setupActivityTracking() {
  // Throttle activity updates to max once per 30 seconds
  let lastActivityUpdate = 0;
  const ACTIVITY_THROTTLE_MS = 30000; // 30 seconds

  // Update last activity on user interaction
  const updateActivity = () => {
    if (sessionId) {
      const now = Date.now();
      if (now - lastActivityUpdate < ACTIVITY_THROTTLE_MS) {
        return; // Skip if we updated recently
      }
      lastActivityUpdate = now;

      trackSession({
        sessionId,
        lastActivity: new Date(),
        isActive: true,
        referrer: "",
        userAgent: navigator.userAgent,
        device: {
          type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
        },
      });
    }
  };

  // Track various user interactions (throttled)
  document.addEventListener("click", updateActivity);
  document.addEventListener("scroll", updateActivity);
  document.addEventListener("keypress", updateActivity);
  document.addEventListener("mousemove", updateActivity);

  // Track when user leaves the page (sendBeacon improves reliability on Firefox/Safari)
  window.addEventListener("beforeunload", () => {
    if (sessionId && currentPage && pageStartTime) {
      const timeOnPage = Date.now() - pageStartTime.getTime();
      const payload = {
        sessionId,
        page: currentPage,
        title: document.title,
        timestamp: pageStartTime,
        timeOnPage: Math.round(timeOnPage / 1000),
        referrer: document.referrer || "",
        utmTerm: getUrlParam("utm_term"),
      };
      try {
        if (navigator.sendBeacon) {
          const data = JSON.stringify({ kind: "pageview", payload });
          // sendBeacon with string ensures broad UA compatibility (Firefox/Safari)
          navigator.sendBeacon("/api/analytics/track", data);
        } else {
          // Fallback if sendBeacon not available
          void fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "pageview", payload }),
            keepalive: true,
            cache: "no-store",
          });
        }
      } catch {
        // best-effort only on unload
      }
    }
  });

  // Detect page reloads (frustration signal) once per page load
  try {
    const navEntries = (performance.getEntriesByType("navigation") ||
      []) as PerformanceNavigationTiming[];
    const navType = navEntries[0]?.type;
    const isReload = navType === "reload";
    if (isReload) {
      trackClick("frustration_signal", {
        subtype: "page_reload",
        page: window.location.pathname,
      });
    }
  } catch {
    // ignore navigation type errors
  }

  // Mark session inactive after 5 minutes of inactivity
  let inactivityTimer: ReturnType<typeof setTimeout>;
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (sessionId) {
        trackSession({
          sessionId,
          lastActivity: new Date(),
          isActive: false,
          referrer: "",
          userAgent: navigator.userAgent,
          device: {
            type: getDeviceType(),
            browser: getBrowser(),
            os: getOS(),
          },
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  document.addEventListener("click", resetInactivityTimer);
  document.addEventListener("scroll", resetInactivityTimer);
  document.addEventListener("keypress", resetInactivityTimer);
  document.addEventListener("mousemove", resetInactivityTimer);

  resetInactivityTimer();
}

/**
 * Frustration tracking: rage clicks and rapid click sequences
 */
function setupFrustrationTracking() {
  const getSelector = (el: Element | null): string => {
    if (!el) return "unknown";
    const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : "";
    const cls = (el as HTMLElement).className
      ? "." +
        String((el as HTMLElement).className)
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .join(".")
      : "";
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  document.addEventListener(
    "click",
    (e) => {
      const now = Date.now();
      const targetEl = e.target as Element | null;
      const selector = getSelector(targetEl);
      const x = (e as MouseEvent).clientX || 0;
      const y = (e as MouseEvent).clientY || 0;

      // keep 2s window of clicks
      lastClicks = lastClicks.filter((c) => now - c.t <= 2000);
      lastClicks.push({ t: now, x, y, target: selector });

      // Rage click: >=3 clicks within 1s on roughly same element/area
      const recent = lastClicks.filter((c) => now - c.t <= 1000);
      const onSameTarget = recent.filter(
        (c) => c.target === selector && Math.hypot(c.x - x, c.y - y) <= 50
      );
      if (onSameTarget.length >= 3 && now > rageClickCooldownUntil) {
        rageClickCooldownUntil = now + 5000; // 5s cooldown
        trackClick("frustration_signal", {
          subtype: "rage_click",
          selector,
          count: onSameTarget.length,
          page: window.location.pathname,
        });
      }

      // Rapid click sequence: >=5 clicks anywhere within 2s
      if (lastClicks.length >= 5 && now > rapidClickCooldownUntil) {
        rapidClickCooldownUntil = now + 5000;
        trackClick("frustration_signal", {
          subtype: "rapid_clicks",
          count: lastClicks.length,
          page: window.location.pathname,
        });
      }
    },
    { capture: true }
  );
}

/**
 * Performance tracking: LCP, CLS, TTFB, Long Tasks
 */
function setupPerformanceTracking() {
  try {
    // TTFB
    const nav =
      (performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming) || null;
    if (
      nav &&
      typeof nav.responseStart === "number" &&
      !perfFlags.ttfbReported
    ) {
      const ttfb = nav.responseStart;
      if (ttfb > 600) {
        perfFlags.ttfbReported = true;
        trackClick("perf_issue", {
          type: "TTFB",
          value: Math.round(ttfb),
          page: window.location.pathname,
        });
      }
    }

    // LCP
    if ("PerformanceObserver" in window) {
      const poCtor =
        window.PerformanceObserver as typeof PerformanceObserver & {
          supportedEntryTypes?: string[];
        };
      const supported: string[] | undefined = poCtor?.supportedEntryTypes;
      const canLcp = supported?.includes?.("largest-contentful-paint");
      const canLayoutShift = supported?.includes?.("layout-shift");
      const canLongTask = supported?.includes?.("longtask");
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };
        if (!last || perfFlags.lcpReported) return;
        const lcp = last.renderTime || last.loadTime || last.startTime;
        if (lcp && lcp > 2500) {
          perfFlags.lcpReported = true;
          trackClick("perf_issue", {
            type: "LCP",
            value: Math.round(lcp),
            page: window.location.pathname,
          });
        }
      });
      if (canLcp) {
        try {
          lcpObserver.observe({
            type: "largest-contentful-paint",
            buffered: true,
          });
        } catch {
          // ignore
        }
      }

      // CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          const shift = entry as PerformanceEntry & {
            value?: number;
            hadRecentInput?: boolean;
          };
          if (!shift.hadRecentInput) {
            clsValue += shift.value || 0;
          }
        }
        if (!perfFlags.clsReported && clsValue > 0.25) {
          perfFlags.clsReported = true;
          trackClick("perf_issue", {
            type: "CLS",
            value: Number(clsValue.toFixed(3)),
            page: window.location.pathname,
          });
        }
      });
      if (canLayoutShift) {
        try {
          clsObserver.observe({ type: "layout-shift", buffered: true });
        } catch {
          // ignore
        }
      }

      // Long tasks
      const ltObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const severe = entries.some((e) => (e.duration || 0) > 1000);
        const many = entries.filter((e) => (e.duration || 0) > 200).length >= 5;
        if ((severe || many) && !perfFlags.longTaskReported) {
          perfFlags.longTaskReported = true;
          trackClick("perf_issue", {
            type: "LONG_TASKS",
            count: entries.length,
            page: window.location.pathname,
          });
        }
      });
      if (canLongTask) {
        try {
          ltObserver.observe({ type: "longtask", buffered: true });
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Feature adoption helper
 */
export function trackFeatureUse(
  featureKey: string,
  details?: Record<string, unknown>,
  userId?: string
) {
  trackClick(
    "feature_use",
    { feature: featureKey, ...(details || {}) },
    userId
  );
}

/**
 * Get device type
 */
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Get browser name
 */
function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Unknown";
}

/**
 * Get OS name
 */
function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "MacOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    return "iOS";
  return "Unknown";
}

/**
 * Get URL parameter
 */
function getUrlParam(param: string): string | undefined {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || undefined;
}

/**
 * Get current session ID
 */
export function getSessionId(): string | null {
  return sessionId;
}
