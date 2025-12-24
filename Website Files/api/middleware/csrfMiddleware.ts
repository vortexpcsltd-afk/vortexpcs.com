/**
 * CSRF Middleware
 * Server-side validation middleware for CSRF protection
 * Validates tokens on all state-changing requests (POST, PUT, DELETE, PATCH)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { logger } from "../services/logger.js";
import {
  CSRF_CONFIG,
  requiresCsrfValidation,
  validateCsrfToken,
  extractCsrfTokenFromHeaders,
  extractCsrfTokenFromCookie,
  generateCsrfToken,
  generateCsrfCookieHeader,
  createCsrfError,
} from "../utils/csrfToken.js";

/**
 * CSRF validation middleware
 * Validates CSRF tokens on state-changing requests
 * Generates new tokens for authenticated sessions
 *
 * Usage in API endpoint:
 * ```typescript
 * export default async function handler(req: VercelRequest, res: VercelResponse) {
 *   // Validate CSRF first (for all POST/PUT/DELETE requests)
 *   const csrfValid = await csrfMiddleware(req, res);
 *   if (!csrfValid) return;
 *
 *   // Rest of handler...
 * }
 * ```
 *
 * @param req - Vercel request object
 * @param res - Vercel response object
 * @returns true if CSRF validation passed (or not required), false if validation failed
 */
export async function csrfMiddleware(
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> {
  const method = req.method || "GET";

  // Enable CORS for preflight requests
  if (method === "OPTIONS") {
    return true; // Skip CSRF validation for OPTIONS
  }

  // Only validate state-changing requests
  if (!requiresCsrfValidation(method)) {
    return true; // Skip CSRF validation for GET/HEAD/OPTIONS
  }

  try {
    // Extract tokens from request
    const requestToken = extractCsrfTokenFromHeaders(
      req.headers as Record<string, string | string[] | undefined>
    );
    const cookieToken = extractCsrfTokenFromCookie(req.headers.cookie);

    // Validate tokens match (double-submit cookie pattern)
    if (!validateCsrfToken(requestToken, cookieToken)) {
      logger.warn("CSRF validation failed", {
        method,
        url: req.url,
        hasRequestToken: !!requestToken,
        hasCookieToken: !!cookieToken,
      });

      res.status(403).json({
        error: "CSRF validation failed",
        message: "Invalid or missing CSRF token",
      });

      return false;
    }

    // Generate new token for next request and set in response
    const newToken = generateCsrfToken();
    const cookieHeader = generateCsrfCookieHeader(
      newToken,
      true, // secure: only over HTTPS
      "Strict" // sameSite: strict protection
    );

    res.setHeader("Set-Cookie", cookieHeader);
    res.setHeader(CSRF_CONFIG.HEADER_NAME, newToken);

    logger.debug("CSRF validation successful", {
      method,
      url: req.url,
    });

    return true;
  } catch (error) {
    logger.error("CSRF middleware error:", error);

    res.status(500).json({
      error: "Internal server error",
      message: "CSRF validation error",
    });

    return false;
  }
}

/**
 * Set CSRF token on successful authentication
 * Call this after user login to set initial CSRF token
 *
 * @param res - Vercel response object
 * @returns CSRF token set in response
 */
export function setCsrfTokenOnAuth(res: VercelResponse): string {
  const token = generateCsrfToken();
  const cookieHeader = generateCsrfCookieHeader(
    token,
    true, // secure: only over HTTPS
    "Strict" // sameSite: strict protection
  );

  res.setHeader("Set-Cookie", cookieHeader);

  logger.debug("CSRF token set on authentication");

  return token;
}

/**
 * Clear CSRF token on logout
 * Call this when user logs out to remove CSRF token
 *
 * @param res - Vercel response object
 */
export function clearCsrfTokenOnLogout(res: VercelResponse): void {
  const expiredCookie = `${CSRF_CONFIG.COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict; Secure`;
  res.setHeader("Set-Cookie", expiredCookie);

  logger.debug("CSRF token cleared on logout");
}

/**
 * Get CSRF error response
 * Returns standardized error response for CSRF failures
 *
 * @param res - Vercel response object
 * @param statusCode - HTTP status code (default 403)
 * @param message - Error message
 */
export function sendCsrfErrorResponse(
  res: VercelResponse,
  statusCode: number = 403,
  message: string = "CSRF validation failed"
): void {
  res.status(statusCode).json({
    error: "CSRF_ERROR",
    message,
  });
}

/**
 * Middleware factory for creating CSRF-protected endpoints
 * Wraps handler with CSRF validation
 *
 * Usage:
 * ```typescript
 * const handler = withCsrfProtection(async (req, res) => {
 *   // Your handler code
 * });
 *
 * export default handler;
 * ```
 *
 * @param handler - Request handler function
 * @returns Wrapped handler with CSRF protection
 */
export function withCsrfProtection(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Enable CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, x-csrf-token, Authorization"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Validate CSRF token
    const csrfValid = await csrfMiddleware(req, res);
    if (!csrfValid) {
      return; // Response already sent by middleware
    }

    // Call actual handler
    return handler(req, res);
  };
}
