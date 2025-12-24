/**
 * Performance Monitoring Service
 * Tracks page load times, Core Web Vitals, and API response times
 */

import { logger } from "./logger";
import { db } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

// Core Web Vitals thresholds (Google recommended)
const THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100, // First Input Delay (ms)
  CLS: 0.1, // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint (ms)
  TTFB: 600, // Time to First Byte (ms)
  pageLoad: 3000, // Total page load time (ms)
  apiResponse: 1000, // API response time (ms)
};

export interface PerformanceMetric {
  metricName: string;
  value: number;
  timestamp: Date;
  page: string;
  userAgent: string;
  rating: "good" | "needs-improvement" | "poor";
  sessionId?: string;
  userId?: string;
}

export interface PageLoadMetric {
  page: string;
  loadTime: number;
  ttfb: number;
  domContentLoaded: number;
  timestamp: Date;
  userAgent: string;
  rating: "good" | "needs-improvement" | "poor";
}

export interface APIMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  rating: "good" | "needs-improvement" | "poor";
}

/**
 * Get rating based on metric value and threshold
 */
function getRating(
  value: number,
  threshold: number,
  type: "lower-is-better" | "higher-is-better" = "lower-is-better"
): "good" | "needs-improvement" | "poor" {
  if (type === "lower-is-better") {
    if (value <= threshold) return "good";
    if (value <= threshold * 1.5) return "needs-improvement";
    return "poor";
  } else {
    if (value >= threshold) return "good";
    if (value >= threshold * 0.7) return "needs-improvement";
    return "poor";
  }
}

/**
 * Track Core Web Vitals using Web Vitals library
 */
export function initWebVitals() {
  if (typeof window === "undefined") return;

  // Dynamically import web-vitals to avoid SSR issues
  import("web-vitals").then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => {
    // Largest Contentful Paint
    onLCP((metric) => {
      trackMetric({
        metricName: "LCP",
        value: metric.value,
        timestamp: new Date(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        rating: getRating(metric.value, THRESHOLDS.LCP),
      });
    });

    // Interaction to Next Paint (replaces FID)
    onINP((metric) => {
      trackMetric({
        metricName: "FID",
        value: metric.value,
        timestamp: new Date(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        rating: getRating(metric.value, THRESHOLDS.FID),
      });
    });

    // Cumulative Layout Shift
    onCLS((metric) => {
      trackMetric({
        metricName: "CLS",
        value: metric.value,
        timestamp: new Date(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        rating: getRating(metric.value, THRESHOLDS.CLS),
      });
    });

    // First Contentful Paint
    onFCP((metric) => {
      trackMetric({
        metricName: "FCP",
        value: metric.value,
        timestamp: new Date(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        rating: getRating(metric.value, THRESHOLDS.FCP),
      });
    });

    // Time to First Byte
    onTTFB((metric) => {
      trackMetric({
        metricName: "TTFB",
        value: metric.value,
        timestamp: new Date(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        rating: getRating(metric.value, THRESHOLDS.TTFB),
      });
    });
  });
}

/**
 * Track page load performance
 */
export function trackPageLoad() {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    const perfData = window.performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    const ttfb = perfData.responseStart - perfData.navigationStart;
    const domContentLoaded =
      perfData.domContentLoadedEventEnd - perfData.navigationStart;

    const metric: PageLoadMetric = {
      page: window.location.pathname,
      loadTime,
      ttfb,
      domContentLoaded,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      rating: getRating(loadTime, THRESHOLDS.pageLoad),
    };

    trackPageLoadMetric(metric);

    // Alert if page load is slow
    if (metric.rating === "poor") {
      logger.warn(`Slow page load detected: ${window.location.pathname}`, {
        loadTime,
        threshold: THRESHOLDS.pageLoad,
      });
    }
  });
}

/**
 * Track API response time
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  startTime: number,
  statusCode: number
) {
  const responseTime = Date.now() - startTime;
  const rating = getRating(responseTime, THRESHOLDS.apiResponse);

  const metric: APIMetric = {
    endpoint,
    method,
    responseTime,
    statusCode,
    timestamp: new Date(),
    rating,
  };

  trackAPIMetric(metric);

  // Alert if API is slow
  if (rating === "poor") {
    logger.warn(`Slow API response: ${method} ${endpoint}`, {
      responseTime,
      threshold: THRESHOLDS.apiResponse,
    });
  }

  return metric;
}

/**
 * Track custom performance metric
 */
async function trackMetric(metric: PerformanceMetric) {
  try {
    // Log to console in development
    if (import.meta.env.DEV) {
      logger.debug(
        "Performance metric",
        metric as unknown as Record<string, unknown>
      );
    }

    // Save to Firestore if available
    if (db) {
      const cleanMetric = cleanForFirestore({
        ...metric,
        timestamp: serverTimestamp(),
      });
      await addDoc(collection(db, "performance_metrics"), cleanMetric);
    }
  } catch (error) {
    logger.error("Failed to track performance metric", error);
  }
}

/**
 * Track page load metric
 */
async function trackPageLoadMetric(metric: PageLoadMetric) {
  try {
    if (import.meta.env.DEV) {
      logger.debug(
        "Page load metric",
        metric as unknown as Record<string, unknown>
      );
    }

    if (db) {
      const cleanMetric = cleanForFirestore({
        ...metric,
        timestamp: serverTimestamp(),
      });
      await addDoc(collection(db, "page_load_metrics"), cleanMetric);
    }
  } catch (error) {
    logger.error("Failed to track page load metric", error);
  }
}

/**
 * Track API metric
 */
async function trackAPIMetric(metric: APIMetric) {
  try {
    if (import.meta.env.DEV) {
      logger.debug("API metric", metric as unknown as Record<string, unknown>);
    }

    if (db) {
      const cleanMetric = cleanForFirestore({
        ...metric,
        timestamp: serverTimestamp(),
      });
      await addDoc(collection(db, "api_metrics"), cleanMetric);
    }
  } catch (error) {
    logger.error("Failed to track API metric", error);
  }
}

/**
 * Get performance summary for a specific page
 */
export async function getPagePerformanceSummary(page: string) {
  // This would query Firestore for aggregated metrics
  // Implementation depends on your analytics setup
  return {
    page,
    avgLoadTime: 0,
    avgTTFB: 0,
    p95LoadTime: 0,
    p99LoadTime: 0,
    totalPageViews: 0,
  };
}

/**
 * Wrapper for fetch to automatically track API performance
 */
export async function monitoredFetch(
  input: globalThis.RequestInfo | URL,
  init?: globalThis.RequestInit
): Promise<Response> {
  const startTime = Date.now();
  const url = typeof input === "string" ? input : input.toString();
  const method = init?.method || "GET";

  try {
    const response = await fetch(input, init);
    trackAPICall(url, method, startTime, response.status);
    return response;
  } catch (error) {
    trackAPICall(url, method, startTime, 0);
    throw error;
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === "undefined") return;

  logger.info("🔍 Initializing performance monitoring");

  // Track Core Web Vitals
  initWebVitals();

  // Track page load times
  trackPageLoad();

  // Track navigation performance
  if ("PerformanceObserver" in window) {
    const poCtor = window.PerformanceObserver as typeof PerformanceObserver & {
      supportedEntryTypes?: string[];
    };
    const supported: string[] | undefined = poCtor?.supportedEntryTypes;
    const canLongTask = supported?.includes?.("longtask");
    if (canLongTask) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              logger.warn("Long task detected", {
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ["longtask"] });
      } catch {
        // ignore
      }
    }
  }

  logger.info("✅ Performance monitoring initialized");
}
