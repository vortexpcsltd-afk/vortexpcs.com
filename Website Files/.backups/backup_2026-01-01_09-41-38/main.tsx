/// <reference types="vite/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

// Import styles BEFORE any other code to ensure CSS loads first
import "./styles/globals.css";
import * as Sentry from "@sentry/react";
import { logger } from "./services/logger";
import { getConsent } from "./utils/consent";
import { initPerformanceMonitoring } from "./services/performanceMonitoring";

// Initialize Sentry for error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || "1.0.0",
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Only send events in production or if debug mode enabled
      enabled:
        import.meta.env.PROD || import.meta.env.VITE_SENTRY_DEBUG === "true",
      beforeSend(event) {
        // Additional security: don't send in dev unless explicitly enabled
        if (
          import.meta.env.DEV &&
          import.meta.env.VITE_SENTRY_DEBUG !== "true"
        ) {
          return null;
        }

        // Filter out sensitive data
        if (event.request?.url) {
          // Remove auth tokens and API keys from URLs
          event.request.url = event.request.url
            .replace(/[?&]token=[^&]*/gi, "?token=***")
            .replace(/[?&]key=[^&]*/gi, "?key=***")
            .replace(/[?&]api_key=[^&]*/gi, "?api_key=***");
        }

        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers["Authorization"];
          delete event.request.headers["X-API-Key"];
          delete event.request.headers["Cookie"];
        }

        return event;
      },
    });
  } catch (error) {
    logger.error("Failed to initialize Sentry:", error);
  }
} else if (import.meta.env.PROD) {
  logger.warn(
    "Sentry DSN not configured. Error tracking disabled in production."
  );
}

// Initialize comprehensive performance monitoring
initPerformanceMonitoring();

// Web Vitals monitoring for Core Web Vitals tracking
if (import.meta.env.PROD) {
  // Dynamically import web-vitals to avoid blocking initial render
  import("web-vitals")
    .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const sendToAnalytics = (metric: {
        name: string;
        value: number;
        rating: string;
      }) => {
        // Send to analytics (Vercel Analytics, Google Analytics, etc.)
        const { analytics: consentAnalytics } = getConsent();
        if (consentAnalytics && window.va) {
          try {
            window.va("track", "Web Vitals", {
              metric: metric.name,
              value: Math.round(metric.value),
              rating: metric.rating,
            });
          } catch {
            // ignore analytics errors
          }
        }

        // Log in development for debugging
        if (import.meta.env.DEV) {
          logger.info(
            `${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`
          );
        }
      };

      onCLS(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
      onINP(sendToAnalytics); // INP replaced FID in web-vitals v3+
    })
    .catch(() => {
      // Silently fail if web-vitals isn't available
    });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

//

// Register service worker for offline caching (only in production & supported browsers)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          logger.debug("Service Worker registered", { scope: reg.scope });
          // Listen for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                logger.debug(
                  "🔄 New version available. Will activate on next reload."
                );
                window.dispatchEvent(
                  new CustomEvent("sw-update", {
                    detail: { waiting: reg.waiting },
                  })
                );
              }
            });
          });
          // Listen for SW messages (activation etc.)
          navigator.serviceWorker.addEventListener("message", (evt) => {
            // Handle sync messages only - don't return true to avoid async response errors
            if (evt.data && evt.data.type === "SW_ACTIVATED") {
              logger.debug("✅ Service worker activated:", evt.data.version);
              // Explicitly handle without indicating async response
            }
            // Never return true from message listener to prevent "message channel closed" errors
          });
        })
        .catch((err) => logger.warn("Service Worker registration failed", err));
    };
    // Delay registration slightly to avoid competing with critical render
    setTimeout(register, 800);
  });
}
