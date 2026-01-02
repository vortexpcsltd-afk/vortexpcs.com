/**
 * Checkout Form Reset Utilities
 * Privacy-focused cleanup after successful checkout
 * Prevents previous customer data from being visible to next customer
 */

import { logger } from "../services/logger";

/**
 * Keys used to store checkout-related data in localStorage
 */
const CHECKOUT_STORAGE_KEYS = [
  "vortex_shipping_address",
  "vortex_pending_account",
  "checkout_error",
  "latest_payment_intent",
  "latest_order_number",
  "bank_order_id",
  "vortex_cart", // Clear cart on checkout completion
] as const;

/**
 * Keys used in sessionStorage for checkout
 */
const CHECKOUT_SESSION_KEYS = [
  "vortex_pending_account",
  "checkout_error",
] as const;

/**
 * Initial form data state
 */
export const INITIAL_FORM_DATA = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
  password: "",
} as const;

/**
 * Clear all checkout-related data from localStorage
 * Called after successful checkout to prevent privacy leaks
 */
export function clearCheckoutStorage(): void {
  try {
    CHECKOUT_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        logger.warn(`Failed to remove localStorage key: ${key}`, { err });
      }
    });

    logger.info("Checkout storage cleared");
  } catch (error) {
    logger.error("Failed to clear checkout storage", { error });
  }
}

/**
 * Clear all checkout-related data from sessionStorage
 */
export function clearCheckoutSessionStorage(): void {
  try {
    CHECKOUT_SESSION_KEYS.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch (err) {
        logger.warn(`Failed to remove sessionStorage key: ${key}`, { err });
      }
    });

    logger.info("Checkout session storage cleared");
  } catch (error) {
    logger.error("Failed to clear checkout session storage", { error });
  }
}

/**
 * Complete checkout cleanup
 * Clears all form data, storage, and state
 */
export function performCheckoutCleanup(): void {
  clearCheckoutStorage();
  clearCheckoutSessionStorage();

  logger.info("Complete checkout cleanup performed");
}

/**
 * Clear sensitive data when user navigates away from checkout
 * Less aggressive than full cleanup - preserves shipping address for convenience
 */
export function clearSensitiveCheckoutData(): void {
  try {
    // Clear password and account creation data
    sessionStorage.removeItem("vortex_pending_account");

    // Clear error states
    localStorage.removeItem("checkout_error");
    sessionStorage.removeItem("checkout_error");

    logger.info("Sensitive checkout data cleared");
  } catch (error) {
    logger.error("Failed to clear sensitive checkout data", { error });
  }
}

/**
 * Check if there's stored form data and warn user
 * Returns true if stored data exists
 */
export function hasStoredCheckoutData(): boolean {
  try {
    const shippingAddress = localStorage.getItem("vortex_shipping_address");
    return shippingAddress !== null;
  } catch {
    return false;
  }
}

/**
 * Retrieve stored shipping address if available
 * Used to pre-fill form for returning customers
 */
export function getStoredShippingAddress(): Record<string, string> | null {
  try {
    const stored = localStorage.getItem("vortex_shipping_address");
    if (!stored) return null;

    const data = JSON.parse(stored);

    // Validate that it's an object with expected fields
    if (typeof data !== "object" || !data.email || !data.postcode) {
      logger.warn("Invalid stored shipping address, discarding");
      localStorage.removeItem("vortex_shipping_address");
      return null;
    }

    // Never auto-fill password field (security)
    delete data.password;

    return data;
  } catch (error) {
    logger.error("Failed to retrieve stored shipping address", { error });
    return null;
  }
}

/**
 * Save shipping address for next checkout (convenience feature)
 * ONLY saves non-sensitive data (excludes password)
 */
export function saveShippingAddress(formData: Record<string, string>): void {
  try {
    // Create sanitized copy without password
    const sanitized = { ...formData };
    delete sanitized.password;

    localStorage.setItem("vortex_shipping_address", JSON.stringify(sanitized));
    logger.info("Shipping address saved for convenience");
  } catch (error) {
    logger.warn("Failed to save shipping address", { error });
  }
}

/**
 * Clear form data after successful checkout
 * Privacy-focused: ensures no customer data persists
 */
export function resetFormAfterCheckout(): typeof INITIAL_FORM_DATA {
  logger.info("Resetting form after successful checkout");
  return { ...INITIAL_FORM_DATA };
}
