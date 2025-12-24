/**
 * CSRF Token Management
 * Double-submit cookie pattern for CSRF protection
 * Generates, stores, and validates CSRF tokens for state-changing requests
 */

import { logger } from "../services/logger";

/**
 * CSRF configuration constants
 */
export const CSRF_CONFIG = {
  COOKIE_NAME: "x-csrf-token",
  HEADER_NAME: "x-csrf-token",
  STORAGE_KEY: "csrf_token",
  TOKEN_LENGTH: 32,
  MAX_AGE: 86400, // 24 hours in seconds
};

/**
 * Generate a cryptographically secure random token
 * @returns Hex-encoded random token
 */
export function generateCsrfToken(): string {
  if (typeof window !== "undefined" && window.crypto) {
    // Browser environment - use crypto.getRandomValues
    const bytes = new Uint8Array(CSRF_CONFIG.TOKEN_LENGTH);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback for server-side (Node.js) - use dynamic import
  if (typeof global !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      const cryptoModule = require("crypto") as typeof import("crypto");
      return cryptoModule.randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString("hex");
    } catch {
      logger.warn("Crypto module unavailable, using fallback token generation");
    }
  }

  // Fallback: simple random string (less secure, but works)
  return Array.from({ length: CSRF_CONFIG.TOKEN_LENGTH })
    .map(() => Math.random().toString(36)[2])
    .join("");
}

/**
 * Get CSRF token from storage or generate new one
 * Used in client-side code to retrieve token for requests
 *
 * @returns Current CSRF token
 */
export function getCsrfToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  // Try to get from sessionStorage first (more secure)
  let token = sessionStorage.getItem(CSRF_CONFIG.STORAGE_KEY);

  if (!token) {
    // Try localStorage as fallback
    token = localStorage.getItem(CSRF_CONFIG.STORAGE_KEY);
  }

  if (!token) {
    // Generate and store new token if none exists
    token = generateCsrfToken();
    try {
      sessionStorage.setItem(CSRF_CONFIG.STORAGE_KEY, token);
    } catch {
      // If sessionStorage unavailable, use localStorage
      localStorage.setItem(CSRF_CONFIG.STORAGE_KEY, token);
    }
    logger.debug("Generated new CSRF token");
  }

  return token;
}

/**
 * Store CSRF token in storage
 * Called after login to persist token for authenticated session
 *
 * @param token - CSRF token to store
 */
export function storeCsrfToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(CSRF_CONFIG.STORAGE_KEY, token);
  } catch {
    // If sessionStorage unavailable, use localStorage
    try {
      localStorage.setItem(CSRF_CONFIG.STORAGE_KEY, token);
    } catch (error) {
      logger.warn("Cannot store CSRF token:", error);
    }
  }
}

/**
 * Clear CSRF token from storage
 * Called on logout to remove token
 */
export function clearCsrfToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(CSRF_CONFIG.STORAGE_KEY);
    localStorage.removeItem(CSRF_CONFIG.STORAGE_KEY);
  } catch {
    // Ignore errors on clearing
  }
}

/**
 * Add CSRF token to request headers
 * Used in API calls to include token with POST/PUT/DELETE requests
 *
 * @param headers - Existing headers object
 * @returns Headers with CSRF token added
 */
export function addCsrfTokenToHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  const token = getCsrfToken();

  if (!token) {
    logger.warn("No CSRF token available for request");
    return headers;
  }

  return {
    ...headers,
    [CSRF_CONFIG.HEADER_NAME]: token,
  };
}

/**
 * Validate CSRF token from request
 * Server-side validation to check token matches expected value
 *
 * @param requestToken - Token from request header
 * @param expectedToken - Token from cookie
 * @returns true if tokens match
 */
export function validateCsrfToken(
  requestToken: string | undefined,
  expectedToken: string | undefined
): boolean {
  // Both tokens must be present
  if (!requestToken || !expectedToken) {
    logger.warn("Missing CSRF token", {
      hasRequestToken: !!requestToken,
      hasExpectedToken: !!expectedToken,
    });
    return false;
  }

  // Tokens must match exactly
  const isValid = requestToken === expectedToken;

  if (!isValid) {
    logger.warn("CSRF token mismatch - possible CSRF attack", {
      requestTokenLength: requestToken.length,
      expectedTokenLength: expectedToken.length,
    });
  }

  return isValid;
}

/**
 * Extract CSRF token from request
 * Helper for server-side middleware to extract token from headers
 *
 * @param headers - Request headers
 * @returns Token from header or undefined
 */
export function extractCsrfTokenFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const token = headers[CSRF_CONFIG.HEADER_NAME];

  if (typeof token === "string") {
    return token;
  }

  if (Array.isArray(token) && token.length > 0) {
    return token[0];
  }

  return undefined;
}

/**
 * Extract CSRF token from cookie
 * Helper for server-side middleware to extract token from cookies
 *
 * @param cookieHeader - Cookie header value
 * @returns Token from cookie or undefined
 */
export function extractCsrfTokenFromCookie(
  cookieHeader: string | undefined
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_CONFIG.COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }

  return undefined;
}

/**
 * Check if request method requires CSRF validation
 * Only state-changing methods need CSRF protection
 *
 * @param method - HTTP method
 * @returns true if method requires CSRF validation
 */
export function requiresCsrfValidation(method: string): boolean {
  const stateChangingMethods = ["POST", "PUT", "DELETE", "PATCH"];
  return stateChangingMethods.includes(method.toUpperCase());
}

/**
 * Generate Set-Cookie header with CSRF token and security flags
 * Used in server responses to set CSRF token cookie
 *
 * @param token - CSRF token to set
 * @param secure - Use secure flag (HTTPS only)
 * @param sameSite - SameSite attribute value
 * @returns Set-Cookie header value
 */
export function generateCsrfCookieHeader(
  token: string,
  secure: boolean = true,
  sameSite: "Strict" | "Lax" | "None" = "Strict"
): string {
  const flags = [
    `${CSRF_CONFIG.COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `Max-Age=${CSRF_CONFIG.MAX_AGE}`,
    `SameSite=${sameSite}`,
  ];

  if (secure) {
    flags.push("Secure");
  }

  return flags.join("; ");
}

/**
 * Create CSRF error object
 * Standardized error for CSRF validation failures
 *
 * @param reason - Reason for failure
 * @returns Error object
 */
export function createCsrfError(reason: string): Error {
  const error = new Error(`CSRF validation failed: ${reason}`);
  error.name = "CSRFError";
  return error;
}
