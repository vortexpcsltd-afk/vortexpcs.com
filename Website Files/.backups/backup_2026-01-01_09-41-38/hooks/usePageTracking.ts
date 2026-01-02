import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { logger } from "../services/logger";

/**
 * Hook to track page views and send them to analytics
 */
export const usePageTracking = () => {
  const location = useLocation();
  const sessionIdRef = useRef<string>("");
  const softFailedRef = useRef(false);

  // Initialize session ID on first load
  useEffect(() => {
    // Get or create session ID
    if (!sessionIdRef.current) {
      const storedSessionId = sessionStorage.getItem("analytics_session_id");
      if (storedSessionId) {
        sessionIdRef.current = storedSessionId;
      } else {
        sessionIdRef.current = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        sessionStorage.setItem("analytics_session_id", sessionIdRef.current);
      }
    }

    // Track pageview
    const trackPageview = async () => {
      try {
        const pageTitle = document.title || "Unknown Page";
        const referrer = document.referrer || "";

        const payload = {
          kind: "pageview",
          payload: {
            page: location.pathname,
            title: pageTitle,
            referrer: referrer,
            url: window.location.href,
            sessionId: sessionIdRef.current,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        };

        logger.debug("Tracking pageview:", payload);

        const response = await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }).catch((error) => {
          if (!softFailedRef.current) {
            softFailedRef.current = true;
            logger.warn("Pageview tracking request failed", { error });
          }
          return null;
        });

        if (!response) return; // network failure or construction error, already logged once

        if (!response.ok) {
          if (!softFailedRef.current) {
            softFailedRef.current = true;
            logger.warn("Pageview tracking failed", {
              status: response.status,
            });
          }
        } else {
          logger.debug("Pageview tracked successfully");
        }
      } catch (error) {
        if (!softFailedRef.current) {
          softFailedRef.current = true;
          logger.warn("Error tracking pageview", { error });
        }
        // Don't throw - analytics failure shouldn't break the app
      }
    };

    trackPageview();
  }, [location.pathname]);
};
