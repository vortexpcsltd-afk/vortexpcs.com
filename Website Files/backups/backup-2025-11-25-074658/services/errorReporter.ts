/**
 * Client-side Error Reporter
 * Automatically logs errors to backend for admin monitoring
 */

import { auth } from "../config/firebase";

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
    const user = auth?.currentUser;
    const token = user ? await user.getIdToken() : null;

    await fetch("/api/errors/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        ...error,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (err) {
    // Fail silently - don't create error loops
    console.error("Failed to report error:", err);
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
