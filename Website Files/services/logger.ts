/**
 * Centralized Logging Service
 * Provides environment-aware logging with Sentry integration
 * Replaces all console.log/error/warn statements
 */

import * as Sentry from "@sentry/react";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
  }

  /**
   * Debug logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, context || "");
    }
  }

  /**
   * Info logging - only in development
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, context || "");
    }
  }

  /**
   * Warning logging - development only, tracked in production
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, context || "");
    }

    if (this.isProduction && context) {
      Sentry.captureMessage(message, {
        level: "warning",
        extra: context,
      });
    }
  }

  /**
   * Error logging - always tracked, console only in dev
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, error, context || "");
    }

    // Always send errors to Sentry in production
    if (this.isProduction) {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: {
            message,
            ...context,
          },
        });
      } else {
        Sentry.captureMessage(message, {
          level: "error",
          extra: {
            error,
            ...context,
          },
        });
      }
    }
  }

  /**
   * Track user events (analytics)
   */
  track(eventName: string, properties?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`📊 [TRACK] ${eventName}`, properties || "");
    }

    // Send to analytics service (Vercel Analytics, Google Analytics, etc.)
    if (this.isProduction && window.va) {
      window.va("track", eventName, properties);
    }
  }

  /**
   * Performance logging
   */
  performance(label: string, duration: number): void {
    if (this.isDevelopment) {
      console.log(`⚡ [PERF] ${label}: ${duration.toFixed(2)}ms`);
    }

    if (this.isProduction && duration > 1000) {
      // Log slow operations to Sentry
      Sentry.captureMessage(`Slow operation: ${label}`, {
        level: "warning",
        extra: {
          duration,
          label,
        },
      });
    }
  }

  /**
   * Success logging - development only
   */
  success(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`✅ [SUCCESS] ${message}`, context || "");
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Type augmentation for window.va (Vercel Analytics)
declare global {
  interface Window {
    va?: (
      event: string,
      name: string,
      properties?: Record<string, unknown>
    ) => void;
  }
}
