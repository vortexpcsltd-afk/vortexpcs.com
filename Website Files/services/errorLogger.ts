/**
 * Error Logging Service
 * Centralized error logging and tracking for the application
 */

import { logger } from "./logger";

interface ErrorLogEntry {
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
  userId?: string;
  severity: "low" | "medium" | "high" | "critical";
}

class ErrorLogger {
  private errors: ErrorLogEntry[] = [];
  private maxStoredErrors = 50;

  /**
   * Log an error with context
   */
  log(
    error: Error,
    context?: {
      componentStack?: string;
      userId?: string;
      severity?: ErrorLogEntry["severity"];
      additionalInfo?: Record<string, unknown>;
    }
  ) {
    const errorEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: context?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context?.userId,
      severity: context?.severity || "medium",
    };

    // Add to in-memory store
    this.errors.unshift(errorEntry);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.pop();
    }

    // Log details in development via centralized logger
    if (import.meta.env?.DEV) {
      logger.error(
        `🚨 Error Logged [${errorEntry.severity.toUpperCase()}]`,
        error,
        {
          stack: error.stack,
          componentStack: context?.componentStack,
          additionalInfo: context?.additionalInfo,
        }
      );
    }

    // In production, send to monitoring service
    if (import.meta.env?.PROD) {
      this.sendToMonitoringService(errorEntry, context?.additionalInfo);
    }

    // Store in localStorage for debugging
    try {
      const storedErrors = this.getStoredErrors();
      storedErrors.unshift(errorEntry);
      if (storedErrors.length > 20) storedErrors.pop();
      localStorage.setItem(
        "vortex_error_log",
        JSON.stringify(storedErrors.slice(0, 20))
      );
    } catch (e) {
      logger.warn("Failed to store error in localStorage", {
        error: e as unknown,
      });
    }
  }

  /**
   * Log a warning (non-critical error)
   */
  warn(message: string, additionalInfo?: Record<string, unknown>) {
    const warning = new Error(message);
    this.log(warning, { severity: "low", additionalInfo });
  }

  /**
   * Log a critical error
   */
  critical(error: Error, additionalInfo?: Record<string, unknown>) {
    this.log(error, { severity: "critical", additionalInfo });
  }

  /**
   * Get recent errors from memory
   */
  getRecentErrors(): ErrorLogEntry[] {
    return [...this.errors];
  }

  /**
   * Get stored errors from localStorage
   */
  getStoredErrors(): ErrorLogEntry[] {
    try {
      const stored = localStorage.getItem("vortex_error_log");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear error log
   */
  clear() {
    this.errors = [];
    try {
      localStorage.removeItem("vortex_error_log");
    } catch (e) {
      logger.warn("Failed to clear error log from localStorage", {
        error: e as unknown,
      });
    }
  }

  /**
   * Send error to monitoring service (e.g., Sentry, LogRocket, etc.)
   */
  private async sendToMonitoringService(
    _error: ErrorLogEntry,
    _additionalInfo?: Record<string, unknown>
  ) {
    // Example: Send to your own API endpoint
    try {
      // Uncomment and configure when you have a monitoring endpoint
      /*
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error, additionalInfo }),
      });
      */
      // Example: Sentry integration
      /*
      if (window.Sentry) {
        window.Sentry.captureException(new Error(error.message), {
          tags: { severity: error.severity },
          contexts: {
            error: {
              stack: error.stack,
              componentStack: error.componentStack,
            },
          },
          extra: additionalInfo,
        });
      }
      */
    } catch (e) {
      logger.error("Failed to send error to monitoring service", e as unknown);
    }
  }

  /**
   * Get error statistics
   */
  getStats() {
    const errors = this.getRecentErrors();
    return {
      total: errors.length,
      bySeverity: {
        critical: errors.filter((e) => e.severity === "critical").length,
        high: errors.filter((e) => e.severity === "high").length,
        medium: errors.filter((e) => e.severity === "medium").length,
        low: errors.filter((e) => e.severity === "low").length,
      },
      recent: errors.slice(0, 5),
    };
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Global error handler
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    errorLogger.log(event.error || new Error(event.message), {
      severity: "high",
      additionalInfo: {
        type: "unhandled",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
    errorLogger.log(error, {
      severity: "high",
      additionalInfo: {
        type: "unhandled_promise_rejection",
      },
    });
  });
}

export default errorLogger;
