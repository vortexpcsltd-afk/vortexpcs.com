import type { VercelRequest, VercelResponse } from "@vercel/node";

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
  required?: boolean;
}

interface Bucket {
  count: number;
  resetAt: number;
  blockedUntil: number;
}

// In-memory limiter keeps Stripe endpoint predictable even without Redis
const buckets = new Map<string, Bucket>();

function getClientKey(req: VercelRequest): string {
  const forwarded = (req.headers["x-forwarded-for"] || "") as string;
  if (forwarded) return forwarded.split(",")[0]?.trim();
  const ip = (req.socket as { remoteAddress?: string }).remoteAddress;
  return ip || "unknown";
}

export async function rateLimitMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  opts: RateLimitOptions
): Promise<boolean> {
  const { maxRequests, windowMs, blockDurationMs, required } = opts;
  const key = getClientKey(req);

  // If we cannot determine a client key, allow unless strict mode is required
  if (!key || key === "unknown") {
    if (required) {
      res
        .status(429)
        .json({ message: "Rate limit: unable to identify client" });
      return false;
    }
    return true;
  }

  const now = Date.now();
  const bucket = buckets.get(key) || {
    count: 0,
    resetAt: now + windowMs,
    blockedUntil: 0,
  };

  if (bucket.blockedUntil > now) {
    res.status(429).json({ message: "Too many requests" });
    return false;
  }

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
    bucket.blockedUntil = 0;
  }

  bucket.count += 1;
  if (bucket.count > maxRequests) {
    bucket.blockedUntil = now + blockDurationMs;
    buckets.set(key, bucket);
    res.status(429).json({ message: "Too many requests" });
    return false;
  }

  buckets.set(key, bucket);
  return true;
}
