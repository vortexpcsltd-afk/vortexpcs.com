import * as Sentry from "@sentry/node";

/**
 * Initialize Sentry for serverless functions
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn("Sentry DSN not configured - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment:
      process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA || "1.0.0",
    tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG) {
        return null;
      }
      return event;
    },
  });
}

/**
 * Wrap serverless handler with Sentry error tracking
 */
export function withSentry<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      Sentry.captureException(error);
      await Sentry.flush(2000);
      throw error;
    }
  }) as T;
}

/**
 * Capture exception and flush
 */
export async function captureException(
  error: Error,
  context?: Record<string, any>
): Promise<void> {
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
  await Sentry.flush(2000);
}

/**
 * Capture message and flush
 */
export async function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info"
): Promise<void> {
  Sentry.captureMessage(message, level);
  await Sentry.flush(2000);
}

/**
 * Set user context for Sentry
 */
export function setUser(user: {
  id?: string;
  email?: string;
  ip?: string;
}): void {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  });
}

// Initialize Sentry when this module is imported
initSentry();
