/**
 * Shipping Method Validation and Constants
 *
 * Centralized validation for all shipping method operations
 * Prevents shipping cost tampering and invalid method selection
 */

/**
 * Shipping method definitions with costs and estimates
 */
export const SHIPPING_METHODS = {
  free: {
    id: "free",
    name: "Free Shipping",
    estimate: "5–7 working days",
    cost: 0,
  },
  standard: {
    id: "standard",
    name: "Standard",
    estimate: "2–4 working days",
    cost: 9.99,
  },
  express: {
    id: "express",
    name: "Express",
    estimate: "1–2 working days",
    cost: 14.99,
  },
} as const;

export type ShippingMethodId = keyof typeof SHIPPING_METHODS;

/**
 * Get shipping method by ID with validation
 */
export function getShippingMethod(
  id: unknown
): (typeof SHIPPING_METHODS)[ShippingMethodId] | null {
  if (typeof id !== "string") return null;

  const method = SHIPPING_METHODS[id as ShippingMethodId];
  return method || null;
}

/**
 * Validate shipping method selection
 */
export function validateShippingMethod(
  method: unknown
): method is ShippingMethodId {
  if (typeof method !== "string") return false;
  return method in SHIPPING_METHODS;
}

/**
 * Validate shipping cost matches the selected method
 */
export function validateShippingCost(
  methodId: unknown,
  cost: unknown
): boolean {
  const method = getShippingMethod(methodId);
  if (!method) return false;

  // Allow small floating point differences (within 0.01)
  return typeof cost === "number" && Math.abs(method.cost - cost) < 0.01;
}

/**
 * Get cost for shipping method
 */
export function getShippingCost(methodId: unknown): number | null {
  const method = getShippingMethod(methodId);
  return method?.cost ?? null;
}

/**
 * Get all available shipping methods as array
 */
export function getAvailableShippingMethods() {
  return Object.values(SHIPPING_METHODS);
}

/**
 * Validate complete shipping data
 */
export interface ShippingData {
  method: unknown;
  cost: unknown;
}

export function validateShippingData(data: ShippingData): {
  valid: boolean;
  error?: string;
} {
  // Check if method is valid
  if (!validateShippingMethod(data.method)) {
    return {
      valid: false,
      error: `Invalid shipping method: ${
        data.method
      }. Must be one of: ${Object.keys(SHIPPING_METHODS).join(", ")}`,
    };
  }

  // Check if cost matches method
  if (!validateShippingCost(data.method, data.cost)) {
    const expectedCost = getShippingCost(data.method);
    return {
      valid: false,
      error: `Shipping cost mismatch. Expected £${expectedCost?.toFixed(
        2
      )} for ${data.method}, got £${
        typeof data.cost === "number" ? data.cost.toFixed(2) : "invalid"
      }`,
    };
  }

  return { valid: true };
}
