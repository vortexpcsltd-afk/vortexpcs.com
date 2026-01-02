/**
 * IP Whitelisting Middleware for Admin Routes
 * Blocks access to admin endpoints from non-whitelisted IPs
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Get client IP address from request headers
 */
export function getClientIP(req: VercelRequest): string {
  // Try various headers for IP address
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const ip = forwarded || realIp || "unknown";

  // If forwarded contains multiple IPs, use the first one (original client)
  return typeof ip === "string" ? ip.split(",")[0].trim() : "unknown";
}

/**
 * Check if IP is whitelisted for admin access
 */
export function isIPWhitelisted(ip: string): boolean {
  // Get whitelisted IPs from environment variable
  const whitelist = (process.env.ADMIN_IP_WHITELIST || "")
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);

  // If no whitelist configured, allow all in development
  if (whitelist.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log("[IP Whitelist] Development mode - allowing all IPs");
      return true;
    }
    console.warn(
      "[IP Whitelist] No whitelist configured - blocking all access"
    );
    return false;
  }

  // Check if wildcard is configured (allow all IPs)
  if (whitelist.includes("*")) {
    console.log("[IP Whitelist] Wildcard '*' configured - allowing all IPs");
    return true;
  }

  // Check if IP is in whitelist (supports CIDR notation)
  const isWhitelisted = whitelist.some((whitelistedIP) => {
    // Exact match
    if (ip === whitelistedIP) return true;

    // CIDR range match (basic implementation)
    if (whitelistedIP.includes("/")) {
      const [network, bits] = whitelistedIP.split("/");
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      const ipNum = ipToNumber(ip);
      const networkNum = ipToNumber(network);
      return (ipNum & mask) === (networkNum & mask);
    }

    return false;
  });

  if (!isWhitelisted) {
    console.warn(
      `[IP Whitelist] Blocked access from non-whitelisted IP: ${ip}`
    );
  }

  return isWhitelisted;
}

/**
 * Convert IP address to number for CIDR comparison
 */
function ipToNumber(ip: string): number {
  const parts = ip.split(".").map((part) => parseInt(part, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return 0;
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Middleware to check IP whitelist for admin routes
 */
export function checkAdminIPWhitelist(
  req: VercelRequest,
  res: VercelResponse
): boolean {
  const clientIP = getClientIP(req);

  if (!isIPWhitelisted(clientIP)) {
    res.status(403).json({
      success: false,
      error: "Access denied",
      message: "Your IP address is not authorized to access this resource",
    });
    return false;
  }

  return true;
}

/**
 * Wrapper function for admin routes with IP whitelisting
 */
export function withAdminIPWhitelist(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Check IP whitelist
    if (!checkAdminIPWhitelist(req, res)) {
      return; // Response already sent
    }

    // Continue to handler
    return handler(req, res);
  };
}
