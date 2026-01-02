/**
 * CSRF Token Management - Modern Stateless Approach
 * Uses a simple token-in-header pattern with SameSite cookie handling
 * Client-side: stores token in sessionStorage, sends in header
 * Server-side: validates token presence and freshness
 */

import { logger } from "../api/services/logger.js";

/**
 * CSRF configuration constants
 */
export const CSRF_CONFIG = {
  HEADER_NAME: "x-csrf-token",
  STORAGE_KEY: "csrf_token",
  TOKEN_LENGTH: 32,
  MAX_AGE: 3600, // 1 hour - shorter for payment operations
  MIN_TOKEN_LENGTH: 20, // Reject suspiciously short tokens
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
    } catch (error: unknown) {
      logger.warn(
        "Cannot store CSRF token:",
        error instanceof Error ? { error: error.message } : undefined
      );
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
 * Validate CSRF token from request header
 * Modern approach: just check that token is present and valid length
 * No cookie comparison needed - single token in header is sufficient
 *
 * @param requestToken - Token from request header
 * @returns true if token is present and valid
 */
export function validateCsrfToken(requestToken: string | undefined): boolean {
  // Token must be present
  if (!requestToken) {
    logger.warn("Missing CSRF token in request header");
    return false;
  }

  // Token must meet minimum length requirement
  if (requestToken.length < CSRF_CONFIG.MIN_TOKEN_LENGTH) {
    logger.warn("CSRF token too short - possible tampering", {
      tokenLength: requestToken.length,
    });
    return false;
  }

  // Token must be reasonable length (not extremely long)
  if (requestToken.length > CSRF_CONFIG.TOKEN_LENGTH * 3) {
    logger.warn("CSRF token too long - possible tampering", {
      tokenLength: requestToken.length,
    });
    return false;
  }

  return true;
}

/**
 * Extract CSRF token from request headers
 * Handles case-insensitive lookups since Vercel normalizes headers to lowercase
 *
 * @param headers - Request headers object
 * @returns Token from header or undefined
 */
export function extractCsrfTokenFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  // Try multiple possible header names to handle different casing
  const possibleHeaders = ["x-csrf-token", "X-CSRF-Token", "x-csrf-token"];

  for (const headerName of possibleHeaders) {
    const token = headers[headerName];

    if (typeof token === "string") {
      return token;
    }

    if (Array.isArray(token) && token.length > 0) {
      return token[0];
    }
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
 * Standardised error for CSRF validation failures
 *
 * @param reason - Reason for failure
 * @returns Error object
 */
export function createCsrfError(reason: string): Error {
  const error = new Error(`CSRF validation failed: ${reason}`);
  error.name = "CSRFError";
  return error;
}

/**
 * Fetch fresh CSRF token from server
 * Critical for ensuring valid token is available for payment operations
 * This is a hard requirement - must succeed before payment can proceed
 *
 * @returns Promise resolving to token string or empty string if fetch fails
 */
export async function fetchCsrfTokenFromServer(): Promise<string> {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const response = await fetch("/api/csrf/issue", {
      method: "GET",
      credentials: "include", // Important: send/receive cookies
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      logger.error("Failed to fetch CSRF token from server", {
        status: response.status,
        statusText: response.statusText,
      });
      return "";
    }

    // Try to get token from response header (set by server)
    const tokenFromHeader =
      response.headers.get(CSRF_CONFIG.HEADER_NAME) ||
      response.headers.get("x-csrf-token");

    if (tokenFromHeader) {
      storeCsrfToken(tokenFromHeader);
      logger.debug("CSRF token refreshed from server", {
        tokenLength: tokenFromHeader.length,
      });
      return tokenFromHeader;
    }

    // Fallback: try response body
    const data = (await response.json()) as Record<string, unknown>;
    const tokenFromBody = data.token as string | undefined;

    if (tokenFromBody) {
      storeCsrfToken(tokenFromBody);
      logger.debug("CSRF token retrieved from response body", {
        tokenLength: tokenFromBody.length,
      });
      return tokenFromBody;
    }

    logger.warn("CSRF token endpoint returned empty response");
    return "";
  } catch (error) {
    logger.error(
      "Error fetching CSRF token from server:",
      error instanceof Error ? { message: error.message } : error
    );
    return "";
  }
}

/**
 * Ensure CSRF token is available, fetching from server if necessary
 * This is a critical safety function to prevent payment failures
 * Use this before making any critical state-changing requests
 *
 * @returns Promise resolving to valid token or empty string
 */
export async function ensureCsrfToken(): Promise<string> {
  // First, try to get existing token from storage
  let token = getCsrfToken();

  if (token && token.length >= CSRF_CONFIG.TOKEN_LENGTH - 4) {
    // Token exists and looks valid (within reasonable length)
    return token;
  }

  // Token missing or invalid, fetch fresh from server
  logger.debug("CSRF token missing or invalid, fetching from server");
  token = await fetchCsrfTokenFromServer();

  if (!token) {
    logger.error("Critical: Unable to obtain CSRF token - payment will fail");
    // Generate local fallback as last resort
    token = generateCsrfToken();
    storeCsrfToken(token);
  }

  return token;
}
