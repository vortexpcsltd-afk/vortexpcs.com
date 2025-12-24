/**
 * Client-side Error Reporter
 * Automatically logs errors to backend for admin monitoring
 */

import { auth } from "../config/firebase";
import { isLocalhost } from "../utils/runtime";

interface ErrorReport {
  message: string;
  stack?: string;
  severity: "critical" | "error" | "warning";
  type: string;
  context?: Record<string, unknown>;
}

/**
 * Send error report to backend
 */
export async function reportError(error: ErrorReport): Promise<void> {
  try {
    // Skip reporting in local preview/dev where API routes are unavailable
    if (isLocalhost()) return;

    const user = auth?.currentUser;
    const token = user ? await user.getIdToken() : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // TODO: Add CSRF token once csrf middleware is implemented
    // See audit report for CSRF protection implementation

    const resp = await fetch("/api/errors/report", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...error,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
    // Swallow non-2xx without noisy console errors in client
    if (!resp.ok) return;
  } catch {
    // Fail silently - don't create error loops
    // Intentionally muted in production; uncomment for debugging
    // console.error("Failed to report error:", err);
  }
}

/**
 * Global error handler setup
 * Call this in your main App component
 */
export function setupGlobalErrorHandler(): void {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    reportError({
      message: event.reason?.message || "Unhandled promise rejection",
      stack: event.reason?.stack,
      severity: "error",
      type: "UnhandledPromiseRejection",
      context: {
        reason: event.reason,
      },
    });
  });

  // Handle global errors
  window.addEventListener("error", (event) => {
    reportError({
      message: event.message || "Global error",
      stack: event.error?.stack,
      severity: "error",
      type: "GlobalError",
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  console.log("✅ Global error handler initialized");
}

/**
 * Manually report an error
 */
export async function logError(
  message: string,
  error?: Error,
  severity: "critical" | "error" | "warning" = "error",
  context?: Record<string, unknown>
): Promise<void> {
  await reportError({
    message,
    stack: error?.stack,
    severity,
    type: error?.name || "ManualError",
    context,
  });
}

/**
 * Report a warning
 */
export async function logWarning(
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  await reportError({
    message,
    severity: "warning",
    type: "Warning",
    context,
  });
}

/**
 * Report a critical error
 */
export async function logCritical(
  message: string,
  error?: Error,
  context?: Record<string, unknown>
): Promise<void> {
  await reportError({
    message,
    stack: error?.stack,
    severity: "critical",
    type: error?.name || "CriticalError",
    context,
  });
}
