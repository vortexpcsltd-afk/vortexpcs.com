/**
 * Simple in-memory TTL cache for Vercel serverless functions.
 * Note: Cache lifetime is per-instance and best-effort.
 */

type CacheEntry<T = unknown> = { value: T; expires: number };
const CACHE = new Map<string, CacheEntry>();

export function getCache<T = any>(key: string): T | undefined {
  const now = Date.now();
  const entry = CACHE.get(key);
  if (!entry) return undefined;
  if (entry.expires <= now) {
    CACHE.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCache<T = any>(key: string, value: T, ttlMs = 60000) {
  const expires = Date.now() + Math.max(1000, ttlMs);
  CACHE.set(key, { value, expires });
}
