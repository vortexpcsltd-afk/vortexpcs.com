/**
 * CSRF Middleware - Modern Stateless Approach
 * Single-token validation: only validates presence and format of token in header
 * No cookie comparison needed - eliminates timing/sync issues
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { logger } from "../services/logger.js";
import { ALLOWED_ORIGINS } from "./apiSecurity.js";
import {
  CSRF_CONFIG,
  requiresCsrfValidation,
  validateCsrfToken,
  extractCsrfTokenFromHeaders,
  generateCsrfToken,
} from "../../utils/csrfToken.js";

/**
 * CSRF validation middleware
 * Validates CSRF tokens on state-changing requests
 * Modern approach: single-token validation (header only)
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

  // Skip validation for OPTIONS (preflight requests)
  if (method === "OPTIONS") {
    return true;
  }

  // Skip validation for safe methods (GET, HEAD)
  if (!requiresCsrfValidation(method)) {
    return true;
  }

  try {
    // Extract request token from header only
    const requestToken = extractCsrfTokenFromHeaders(
      req.headers as Record<string, string | string[] | undefined>
    );

    // Determine request origin for logging
    const requestOrigin = (req.headers.origin as string | undefined) || "";
    const referer = (req.headers.referer as string | undefined) || "";
    const host = (req.headers.host as string | undefined) || "";
    const forwardedHost =
      (req.headers["x-forwarded-host"] as string | undefined) || "";

    let refererOrigin = "";
    if (referer) {
      try {
        const parsed = new URL(referer);
        refererOrigin = `${parsed.protocol}//${parsed.host}`;
      } catch {
        refererOrigin = "";
      }
    }

    const allowSet = new Set<string>(ALLOWED_ORIGINS as unknown as string[]);
    const isAllowedOrigin =
      (!!requestOrigin && allowSet.has(requestOrigin)) ||
      (!!refererOrigin && allowSet.has(refererOrigin)) ||
      (!!host && allowSet.has(`https://${host}`)) ||
      (!!forwardedHost && allowSet.has(`https://${forwardedHost}`));

    // Validate token presence and format
    if (!validateCsrfToken(requestToken)) {
      // Only allow missing token if request is from allowed origin
      // This permits the first request to get a token via bootstrap
      if (!requestToken && isAllowedOrigin) {
        logger.warn("CSRF token missing on first request; allowing bootstrap", {
          method,
          url: req.url,
          origin: requestOrigin || refererOrigin || host || forwardedHost,
        });

        // Return true to allow bootstrap, response will set token for next request
        return true;
      }

      logger.warn("CSRF validation failed", {
        method,
        url: req.url,
        hasRequestToken: !!requestToken,
        tokenLength: requestToken?.length || 0,
        isAllowedOrigin,
      });

      res.status(403).json({
        error: "CSRF validation failed",
        message: "Invalid or missing CSRF token",
      });

      return false;
    }

    // Validation passed - log success
    logger.debug("CSRF validation successful", {
      method,
      url: req.url,
      tokenLength: requestToken.length,
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
    "Lax" // sameSite: Lax allows first-party cookies
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
  const expiredCookie = `${CSRF_CONFIG.COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure`;
  res.setHeader("Set-Cookie", expiredCookie);

  logger.debug("CSRF token cleared on logout");
}

/**
 * Get CSRF error response
 * Returns standardised error response for CSRF failures
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
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    // Enable reflective CORS headers using allowed origins
    const { ALLOWED_ORIGINS } = await import("./apiSecurity.js");
    const requestOrigin = (req.headers?.origin as string | undefined) || "";
    const allow = new Set<string>(ALLOWED_ORIGINS as unknown as string[]);
    if (requestOrigin && allow.has(requestOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "https://vortexpcs.com");
    }
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, x-csrf-token, Authorization"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    // Validate CSRF token
    const csrfValid = await csrfMiddleware(req, res);
    if (!csrfValid) {
      return; // Response already sent by middleware
    }

    // Call actual handler
    await handler(req, res);
  };
}
