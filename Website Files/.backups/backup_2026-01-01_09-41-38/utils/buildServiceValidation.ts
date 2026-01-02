/**
 * Build Service and Coupon Validation
 *
 * Validates build service selections and coupon discounts
 * Prevents price tampering by reconciling client and server calculations
 */

import { logger } from "../services/logger";

/**
 * Build service option definition
 */
export interface BuildServiceOption {
  id: string;
  name: string;
  price: number;
  positioning?: string;
  campaign?: string;
  includes?: string[];
  idealFor?: string;
  badge?: string;
  accent?: string;
}

/**
 * Coupon data for validation
 */
export interface CouponData {
  code: string;
  discountPercent: number;
  discountAmount: number;
}

/**
 * Validate build service selection
 */
export function validateBuildService(
  service: unknown
): service is BuildServiceOption {
  if (!service || typeof service !== "object") return false;

  const s = service as Record<string, unknown>;

  return (
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.price === "number" &&
    s.price >= 0 &&
    Number.isFinite(s.price)
  );
}

/**
 * Validate coupon data
 */
export function validateCoupon(coupon: unknown): coupon is CouponData {
  if (!coupon || typeof coupon !== "object") return false;

  const c = coupon as Record<string, unknown>;

  return (
    typeof c.code === "string" &&
    c.code.trim().length > 0 &&
    typeof c.discountPercent === "number" &&
    c.discountPercent >= 0 &&
    c.discountPercent <= 100 &&
    typeof c.discountAmount === "number" &&
    c.discountAmount >= 0 &&
    Number.isFinite(c.discountAmount)
  );
}

/**
 * Validate discount amount is consistent with discount percent and subtotal
 */
export function validateDiscountCalculation(
  subtotal: number,
  discountPercent: number,
  discountAmount: number
): { valid: boolean; error?: string } {
  // Allow small floating point differences
  const expectedAmount = (subtotal * discountPercent) / 100;
  const tolerance = 0.01; // $0.01

  if (Math.abs(expectedAmount - discountAmount) > tolerance) {
    return {
      valid: false,
      error: `Discount amount mismatch. Expected £${expectedAmount.toFixed(
        2
      )} (${discountPercent}% of £${subtotal.toFixed(
        2
      )}), got £${discountAmount.toFixed(2)}`,
    };
  }

  return { valid: true };
}

/**
 * Validate complete order pricing
 */
export interface OrderPricingData {
  subtotal: number;
  buildServiceCost: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
}

export function validateOrderPricing(data: OrderPricingData): {
  valid: boolean;
  error?: string;
} {
  const { subtotal, buildServiceCost, discountAmount, shippingCost, total } =
    data;

  // Validate individual amounts
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { valid: false, error: "Invalid subtotal" };
  }
  if (!Number.isFinite(buildServiceCost) || buildServiceCost < 0) {
    return { valid: false, error: "Invalid build service cost" };
  }
  if (!Number.isFinite(discountAmount) || discountAmount < 0) {
    return { valid: false, error: "Invalid discount amount" };
  }
  if (!Number.isFinite(shippingCost) || shippingCost < 0) {
    return { valid: false, error: "Invalid shipping cost" };
  }
  if (!Number.isFinite(total) || total < 0) {
    return { valid: false, error: "Invalid total" };
  }

  // Validate total calculation
  const expectedTotal =
    subtotal + buildServiceCost - discountAmount + shippingCost;
  const tolerance = 0.01; // $0.01

  if (Math.abs(expectedTotal - total) > tolerance) {
    return {
      valid: false,
      error: `Order total mismatch. Expected £${expectedTotal.toFixed(
        2
      )}, got £${total.toFixed(2)}`,
    };
  }

  // Prevent negative discounts exceeding subtotal
  if (discountAmount > subtotal) {
    return {
      valid: false,
      error: `Discount (£${discountAmount.toFixed(
        2
      )}) exceeds subtotal (£${subtotal.toFixed(2)})`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize build service data for transmission
 */
export function sanitizeBuildService(
  service: BuildServiceOption | null
): { id: string; name: string; price: number } | null {
  if (!service) return null;

  if (!validateBuildService(service)) {
    logger.error("Invalid build service data", { service });
    return null;
  }

  return {
    id: service.id,
    name: service.name,
    price: Math.round(service.price * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Sanitize coupon data for transmission
 */
export function sanitizeCoupon(coupon: CouponData | null): CouponData | null {
  if (!coupon) return null;

  if (!validateCoupon(coupon)) {
    logger.error("Invalid coupon data", { coupon });
    return null;
  }

  return {
    code: coupon.code.trim().toUpperCase(),
    discountPercent: Math.min(100, Math.max(0, coupon.discountPercent)),
    discountAmount: Math.round(coupon.discountAmount * 100) / 100,
  };
}

/**
 * Create audit trail for pricing
 */
export interface PricingAuditEntry {
  timestamp: number;
  subtotal: number;
  buildServiceCost: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  buildServiceId?: string;
  couponCode?: string;
}

export function createPricingAuditEntry(
  data: OrderPricingData,
  buildServiceId?: string,
  couponCode?: string
): PricingAuditEntry {
  return {
    timestamp: Date.now(),
    subtotal: data.subtotal,
    buildServiceCost: data.buildServiceCost,
    discountAmount: data.discountAmount,
    shippingCost: data.shippingCost,
    total: data.total,
    buildServiceId,
    couponCode,
  };
}
