/**
 * Cart Storage Service
 * Handles all localStorage operations with race condition prevention
 * Uses a simple locking mechanism to prevent concurrent writes
 */

import { CartItem } from "../types";
import { logger } from "../services/logger";

const CART_STORAGE_KEY = "vortex_cart";
const CART_LOCK_KEY = "vortex_cart_lock";
const CART_LOCK_TIMEOUT = 5000; // 5 second timeout

/**
 * Acquire lock to prevent concurrent localStorage writes
 */
async function acquireLock(timeout = CART_LOCK_TIMEOUT): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const lockData = localStorage.getItem(CART_LOCK_KEY);

      if (!lockData) {
        // Lock is free, acquire it
        const lockToken = `${Date.now()}-${Math.random()}`;
        localStorage.setItem(CART_LOCK_KEY, lockToken);

        // Verify we got the lock (another process might have grabbed it)
        const verifyLock = localStorage.getItem(CART_LOCK_KEY);
        if (verifyLock === lockToken) {
          return true;
        }
      } else {
        // Check if lock has timed out
        const lockTime = parseInt(lockData.split("-")[0], 10);
        if (Date.now() - lockTime > timeout) {
          // Lock expired, try to remove it
          localStorage.removeItem(CART_LOCK_KEY);
        }
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      logger.warn("Failed to acquire lock", { error });
      return false;
    }
  }

  return false;
}

/**
 * Release lock
 */
function releaseLock(): void {
  try {
    localStorage.removeItem(CART_LOCK_KEY);
  } catch (error) {
    logger.warn("Failed to release lock", { error });
  }
}

/**
 * Load cart from localStorage with validation
 */
export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;

    // Validate and filter items
    if (!Array.isArray(parsed)) {
      logger.warn("Cart data is not an array, clearing");
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }

    const validatedItems = parsed
      .filter((item) => {
        if (!item || typeof item !== "object") return false;

        const cartItem = item as Record<string, unknown>;

        // Validate all required fields
        return (
          typeof cartItem.id === "string" &&
          cartItem.id.trim() !== "" &&
          typeof cartItem.name === "string" &&
          cartItem.name.trim() !== "" &&
          typeof cartItem.price === "number" &&
          cartItem.price >= 0 &&
          Number.isFinite(cartItem.price) &&
          typeof cartItem.quantity === "number" &&
          cartItem.quantity >= 1 &&
          Number.isInteger(cartItem.quantity) &&
          typeof cartItem.category === "string" &&
          cartItem.category.trim() !== ""
        );
      })
      .map((item) => ({
        id: (item as CartItem).id,
        name: (item as CartItem).name,
        price: Math.max(0, (item as CartItem).price),
        quantity: Math.max(1, Math.floor((item as CartItem).quantity)),
        category: (item as CartItem).category,
        image: (item as CartItem).image,
        sku: (item as CartItem).sku,
      }));

    if (validatedItems.length !== parsed.length) {
      logger.warn(
        `Cart validation removed ${
          parsed.length - validatedItems.length
        } invalid items`
      );
    }

    return validatedItems;
  } catch (error) {
    logger.error("Failed to load cart from localStorage", { error });
    // Clear corrupted data
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore
    }
    return [];
  }
}

/**
 * Save cart to localStorage with lock mechanism
 */
export async function saveCart(items: CartItem[]): Promise<boolean> {
  const hasLock = await acquireLock();

  if (!hasLock) {
    logger.warn("Failed to acquire cart lock, skipping save");
    return false;
  }

  try {
    if (items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      // Ensure clean data before saving
      const cleanItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Math.max(0, item.price),
        quantity: Math.max(1, Math.floor(item.quantity)),
        category: item.category,
        image: item.image,
        sku: item.sku,
      }));

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cleanItems));
    }
    return true;
  } catch (error) {
    logger.error("Failed to save cart to localStorage", { error });

    // If quota exceeded, try to save minimal version
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      try {
        const minimalCart = items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
        }));
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(minimalCart));
        logger.warn("Saved minimal cart due to quota exceeded");
        return true;
      } catch {
        logger.error("Failed to save minimal cart - quota exceeded");
        return false;
      }
    }

    return false;
  } finally {
    releaseLock();
  }
}

/**
 * Clear cart from localStorage
 */
export function clearCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    logger.error("Failed to clear cart", { error });
  }
}
