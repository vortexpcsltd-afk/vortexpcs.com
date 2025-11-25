import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Rate limiting configurations for different endpoint types
export const RATE_LIMITS = {
  // Email endpoints (contact form, repair notifications)
  email: {
    requests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    description: "3 requests per hour per IP",
  },
  // Address lookup (UK postcode API)
  address: {
    requests: 10,
    windowMs: 60 * 1000, // 1 minute
    description: "10 requests per minute per IP",
  },
  // General API endpoints
  api: {
    requests: 30,
    windowMs: 60 * 1000, // 1 minute
    description: "30 requests per minute per IP",
  },
} as const;

/**
 * Initialize Upstash Redis client
 */
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("Upstash Redis not configured - rate limiting disabled");
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

/**
 * Create a rate limiter instance
 */
function createRateLimiter(
  requests: number,
  windowMs: number
): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowMs} ms`),
    analytics: true,
    prefix: "vortexpcs",
  });
}

// Rate limiter instances
const emailLimiter = createRateLimiter(
  RATE_LIMITS.email.requests,
  RATE_LIMITS.email.windowMs
);

const addressLimiter = createRateLimiter(
  RATE_LIMITS.address.requests,
  RATE_LIMITS.address.windowMs
);

const apiLimiter = createRateLimiter(
  RATE_LIMITS.api.requests,
  RATE_LIMITS.api.windowMs
);

/**
 * Get client identifier from request (IP address)
 */
export function getClientId(
  req:
    | Pick<VercelRequest, "headers">
    | { headers?: Record<string, string | string[] | undefined> }
): string {
  // Try various headers for IP address
  const forwarded = req.headers?.["x-forwarded-for"];
  const realIp = req.headers?.["x-real-ip"];
  const ip = forwarded || realIp || "unknown";

  // If forwarded contains multiple IPs, use the first one
  return typeof ip === "string" ? ip.split(",")[0].trim() : "unknown";
}

/**
 * Check rate limit for email endpoints
 */
export async function checkEmailRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!emailLimiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const result = await emailLimiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Check rate limit for address lookup endpoints
 */
export async function checkAddressRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!addressLimiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const result = await addressLimiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Check rate limit for general API endpoints
 */
export async function checkApiRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!apiLimiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const result = await apiLimiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Set rate limit headers on response
 */
export function setRateLimitHeaders(
  res: VercelResponse | { setHeader: (name: string, value: string) => void },
  result: RateLimitResult
): void {
  res.setHeader("X-RateLimit-Limit", result.limit.toString());
  res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
  res.setHeader("X-RateLimit-Reset", result.reset.toString());
}

/**
 * Create rate limit error response
 */
export function createRateLimitError(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
  return {
    error: "Rate limit exceeded",
    message: "Too many requests. Please try again later.",
    retryAfter,
    limit: result.limit,
    reset: new Date(result.reset).toISOString(),
  };
}
