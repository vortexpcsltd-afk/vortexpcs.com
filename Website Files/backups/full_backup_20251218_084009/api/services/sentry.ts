// Sentry integration for serverless functions
// NOTE: @sentry/node not installed, using no-op implementations

/**
 * Initialize Sentry for serverless functions
 */
export function initSentry(): void {
  // No-op: @sentry/node not installed
  console.log("Sentry not configured");
}

/**
 * Wrap serverless handler with Sentry error tracking
 */
export function withSentry<T extends (...args: unknown[]) => unknown>(
  handler: T
): T {
  return handler;
}

/**
 * Capture exception and flush
 */
export async function captureException(
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  // No-op: just log to console
  console.error("Error:", error.message, context);
}

/**
 * Capture message and flush
 */
export async function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
): Promise<void> {
  // No-op: just log to console
  console.log(`[${level}]`, message);
}

/**
 * Set user context for Sentry
 */
export function setUser(_user: {
  id?: string;
  email?: string;
  ip?: string;
}): void {
  // No-op
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  // No-op: just log to console
  console.log("Breadcrumb:", message, data);
}

// Initialize Sentry when this module is imported
initSentry();
