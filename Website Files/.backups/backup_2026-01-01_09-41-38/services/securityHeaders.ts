/**
 * Security Headers Service
 *
 * Applies standard security headers to API responses for enhanced protection
 * against common web vulnerabilities.
 */

import type { VercelResponse } from "@vercel/node";

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  /**
   * Content Security Policy directive
   * Default: "default-src 'self'"
   */
  contentSecurityPolicy?: string;

  /**
   * Enable HSTS (HTTP Strict Transport Security)
   * Default: true
   */
  enableHsts?: boolean;

  /**
   * HSTS max age in seconds
   * Default: 31536000 (1 year)
   */
  hstsMaxAge?: number;

  /**
   * Include subdomains in HSTS
   * Default: true
   */
  hstsIncludeSubdomains?: boolean;

  /**
   * Enable X-Frame-Options header
   * Default: true
   */
  enableFrameOptions?: boolean;

  /**
   * X-Frame-Options value
   * Default: "DENY"
   */
  frameOptions?: "DENY" | "SAMEORIGIN";
}

const defaultConfig: Required<SecurityHeadersConfig> = {
  contentSecurityPolicy: "default-src 'self'",
  enableHsts: true,
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubdomains: true,
  enableFrameOptions: true,
  frameOptions: "DENY",
};

/**
 * Apply standard security headers to a Vercel response
 *
 * Headers applied:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY (or SAMEORIGIN)
 * - X-XSS-Protection: 1; mode=block
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Strict-Transport-Security: max-age=31536000; includeSubDomains
 * - Content-Security-Policy: default-src 'self' (configurable)
 * - Permissions-Policy: camera=(), microphone=(), geolocation=()
 *
 * @param res - Vercel response object
 * @param config - Optional security headers configuration
 */
export function applySecurityHeaders(
  res: VercelResponse,
  config: SecurityHeadersConfig = {}
): void {
  const finalConfig = { ...defaultConfig, ...config };

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS Protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Frame Options (Clickjacking protection)
  if (finalConfig.enableFrameOptions) {
    res.setHeader("X-Frame-Options", finalConfig.frameOptions);
  }

  // HSTS (Force HTTPS)
  if (finalConfig.enableHsts) {
    let hstsValue = `max-age=${finalConfig.hstsMaxAge}`;
    if (finalConfig.hstsIncludeSubdomains) {
      hstsValue += "; includeSubDomains";
    }
    res.setHeader("Strict-Transport-Security", hstsValue);
  }

  // Content Security Policy
  if (finalConfig.contentSecurityPolicy) {
    res.setHeader("Content-Security-Policy", finalConfig.contentSecurityPolicy);
  }

  // Permissions Policy (formerly Feature-Policy)
  // Disable potentially sensitive browser features
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Remove server identification header (if set)
  res.removeHeader("X-Powered-By");
}

/**
 * Apply relaxed security headers for API endpoints
 * (allows JSON responses from external origins)
 *
 * @param res - Vercel response object
 */
export function applyApiSecurityHeaders(res: VercelResponse): void {
  applySecurityHeaders(res, {
    contentSecurityPolicy: "default-src 'none'",
    enableFrameOptions: false, // APIs don't need frame protection
  });
}

/**
 * Get security headers as a plain object (useful for testing)
 *
 * @param config - Optional security headers configuration
 * @returns Object with header names and values
 */
export function getSecurityHeadersObject(
  config: SecurityHeadersConfig = {}
): Record<string, string> {
  const finalConfig = { ...defaultConfig, ...config };
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  };

  if (finalConfig.enableFrameOptions) {
    headers["X-Frame-Options"] = finalConfig.frameOptions;
  }

  if (finalConfig.enableHsts) {
    let hstsValue = `max-age=${finalConfig.hstsMaxAge}`;
    if (finalConfig.hstsIncludeSubdomains) {
      hstsValue += "; includeSubDomains";
    }
    headers["Strict-Transport-Security"] = hstsValue;
  }

  if (finalConfig.contentSecurityPolicy) {
    headers["Content-Security-Policy"] = finalConfig.contentSecurityPolicy;
  }

  return headers;
}
