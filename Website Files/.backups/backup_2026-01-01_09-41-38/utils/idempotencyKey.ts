/**
 * Idempotency Key Service
 * Prevents duplicate payment processing by generating and tracking idempotency keys
 * https://stripe.com/docs/api/idempotent_requests
 */

import { logger } from "../services/logger";

const IDEMPOTENCY_KEYS_KEY = "vortex_idempotency_keys";
const MAX_CACHED_KEYS = 100;
const KEY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface IdempotencyRecord {
  key: string;
  amount: number;
  currency: string;
  timestamp: number;
  resultId?: string; // Payment intent or session ID
  resultStatus?: "success" | "failed" | "pending";
}

/**
 * Load stored idempotency keys from localStorage
 */
function loadStoredKeys(): IdempotencyRecord[] {
  try {
    const raw = localStorage.getItem(IDEMPOTENCY_KEYS_KEY);
    if (!raw) return [];

    const keys = JSON.parse(raw) as unknown;
    if (!Array.isArray(keys)) return [];

    // Filter out expired keys
    const now = Date.now();
    return (keys as IdempotencyRecord[]).filter(
      (k) => k && k.timestamp && now - k.timestamp < KEY_EXPIRY_MS
    );
  } catch (error) {
    logger.warn("Failed to load idempotency keys", { error });
    return [];
  }
}

/**
 * Save idempotency keys to localStorage
 */
function saveStoredKeys(keys: IdempotencyRecord[]): void {
  try {
    // Keep only the most recent keys
    const recent = keys
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_CACHED_KEYS);

    localStorage.setItem(IDEMPOTENCY_KEYS_KEY, JSON.stringify(recent));
  } catch (error) {
    logger.warn("Failed to save idempotency keys", { error });
  }
}

/**
 * Generate a unique idempotency key for a payment request
 * Returns the same key for identical payment attempts within the same session
 */
export function generateIdempotencyKey(
  amount: number,
  currency: string,
  userId?: string
): string {
  const keys = loadStoredKeys();

  // Check if we already have a key for this exact payment
  const existing = keys.find(
    (k) =>
      k.amount === amount &&
      k.currency === currency &&
      k.resultStatus !== "failed" // Retry if previous attempt failed
  );

  if (existing && existing.resultStatus === "success") {
    logger.info("Using cached idempotency key for successful payment");
    return existing.key;
  }

  // Generate new key: timestamp-random-userid
  // Format: 1234567890-abc123def456-user123
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const userPart = userId ? `-${userId.substring(0, 20)}` : "";
  const newKey = `${timestamp}-${random}${userPart}`;

  // Store the new key
  const record: IdempotencyRecord = {
    key: newKey,
    amount,
    currency,
    timestamp,
  };

  keys.push(record);
  saveStoredKeys(keys);

  logger.info("Generated new idempotency key", { key: newKey });
  return newKey;
}

/**
 * Record the result of an idempotent payment request
 * Call this after successful payment to prevent re-processing
 */
export function recordIdempotencyResult(
  idempotencyKey: string,
  resultId: string,
  status: "success" | "failed" | "pending" = "success"
): void {
  try {
    const keys = loadStoredKeys();
    const index = keys.findIndex((k) => k.key === idempotencyKey);

    if (index !== -1) {
      keys[index].resultId = resultId;
      keys[index].resultStatus = status;
      saveStoredKeys(keys);

      logger.info("Recorded idempotency result", {
        key: idempotencyKey,
        resultId,
        status,
      });
    }
  } catch (error) {
    logger.warn("Failed to record idempotency result", { error });
  }
}

/**
 * Get the result of a previous idempotent request (if it succeeded)
 * Returns null if no previous successful request exists
 */
export function getIdempotencyResult(
  idempotencyKey: string
): { resultId: string; status: string } | null {
  try {
    const keys = loadStoredKeys();
    const record = keys.find((k) => k.key === idempotencyKey);

    if (record && record.resultStatus === "success" && record.resultId) {
      logger.info("Found cached idempotency result", {
        key: idempotencyKey,
        resultId: record.resultId,
      });
      return {
        resultId: record.resultId,
        status: "success",
      };
    }

    return null;
  } catch (error) {
    logger.warn("Failed to get idempotency result", { error });
    return null;
  }
}

/**
 * Clear all stored idempotency keys (for testing or cleanup)
 */
export function clearIdempotencyKeys(): void {
  try {
    localStorage.removeItem(IDEMPOTENCY_KEYS_KEY);
    logger.info("Cleared all idempotency keys");
  } catch (error) {
    logger.warn("Failed to clear idempotency keys", { error });
  }
}

/**
 * Get count of stored idempotency keys
 */
export function getStoredKeyCount(): number {
  return loadStoredKeys().length;
}
