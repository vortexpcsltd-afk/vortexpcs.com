/**
 * Payment Validation Schemas
 * Comprehensive Zod schemas for payment validation
 * Prevents price tampering, invalid amounts, and malicious input
 */

import { z } from "zod";

/**
 * Cart Item Schema
 * Validates individual items in the shopping cart
 */
export const CartItemSchema = z.object({
  id: z
    .string()
    .min(1, "Product ID is required")
    .max(500, "Product ID too long"),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(500, "Product name too long"),
  price: z
    .number()
    .positive("Price must be greater than 0")
    .finite("Price must be a valid number")
    .max(999999.99, "Price exceeds maximum allowed value"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1")
    .max(1000, "Quantity exceeds maximum allowed (1000)"),
  image: z.string().url("Invalid image URL").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  category: z.string().max(200, "Category too long").optional(),
  ean: z.string().max(50, "EAN too long").optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

/**
 * Cart Items Array Schema
 * Validates entire cart with at least one item
 */
export const CartItemsSchema = z
  .array(CartItemSchema)
  .min(1, "Cart must contain at least one item")
  .max(100, "Cart exceeds maximum items (100)");

export type CartItems = z.infer<typeof CartItemsSchema>;

/**
 * Shipping Address Schema
 * Validates shipping address data
 */
export const ShippingAddressSchema = z.object({
  street: z.string().min(1, "Street is required").max(200, "Street too long"),
  city: z.string().min(1, "City is required").max(100, "City too long"),
  postcode: z
    .string()
    .min(1, "Postcode is required")
    .max(20, "Postcode too long"),
  country: z
    .string()
    .length(2, "Country must be 2-character code")
    .toUpperCase(),
  state: z.string().max(100, "State too long").optional(),
  line2: z.string().max(200, "Address line 2 too long").optional(),
});

export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

/**
 * Checkout Session Schema
 * Validates data for creating a Stripe checkout session
 */
export const CheckoutSessionSchema = z.object({
  items: CartItemsSchema,
  customerEmail: z.string().email("Invalid email address"),
  customerName: z.string().min(1, "Name is required").max(200, "Name too long"),
  customerPhone: z
    .string()
    .min(5, "Phone number too short")
    .max(20, "Phone number too long")
    .optional(),
  userId: z.string().max(500, "User ID too long").optional(),
  shippingAddress: ShippingAddressSchema.optional(),
  shippingMethod: z
    .enum(["free", "standard", "express", "overnight"])
    .default("free"),
  shippingCost: z
    .number()
    .nonnegative("Shipping cost cannot be negative")
    .max(9999.99, "Shipping cost exceeds maximum")
    .optional()
    .default(0),
  currency: z
    .string()
    .length(3, "Currency must be 3-character code")
    .toUpperCase()
    .default("GBP"),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;

/**
 * Payment Intent Schema
 * Validates data for creating a Stripe payment intent
 */
export const PaymentIntentSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .finite("Amount must be a valid number")
    .max(999999.99, "Amount exceeds maximum allowed value"),
  currency: z
    .string()
    .length(3, "Currency must be 3-character code")
    .toUpperCase()
    .default("GBP"),
  metadata: z.record(z.string(), z.string()).optional(),
  customerEmail: z.string().email("Invalid email address").optional(),
  description: z.string().max(1000, "Description too long").optional(),
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

/**
 * PayPal Order Schema
 * Validates data for creating a PayPal order
 */
export const PayPalOrderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Product ID is required").max(500),
        name: z.string().min(1, "Product name is required").max(500),
        price: z
          .number()
          .positive("Price must be greater than 0")
          .finite("Price must be a valid number")
          .max(999999.99, "Price exceeds maximum"),
        quantity: z
          .number()
          .int("Quantity must be a whole number")
          .positive("Quantity must be at least 1")
          .max(1000, "Quantity exceeds maximum"),
        description: z.string().max(1000, "Description too long").optional(),
      })
    )
    .min(1, "Order must contain at least one item")
    .max(100, "Order exceeds maximum items"),
  customerEmail: z.string().email("Invalid email address").optional(),
  userId: z.string().max(500, "User ID too long").optional(),
  currency: z
    .string()
    .length(3, "Currency must be 3-character code")
    .toUpperCase()
    .default("GBP"),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type PayPalOrder = z.infer<typeof PayPalOrderSchema>;

/**
 * Server-side price validation utility
 * Ensures cart total matches expected amount (prevents price tampering)
 *
 * @param items - Validated cart items
 * @param expectedAmount - Expected total amount from client
 * @param tolerance - Allowable price difference in pence (default 100 = £1)
 * @returns true if amounts match within tolerance
 */
export function validateCartTotal(
  items: CartItem[],
  expectedAmount: number,
  tolerance: number = 100
): boolean {
  const calculatedTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Convert to pence for integer comparison
  const calculatedPence = Math.round(calculatedTotal * 100);
  const expectedPence = Math.round(expectedAmount * 100);

  return Math.abs(calculatedPence - expectedPence) <= tolerance;
}

/**
 * Validate cart items against database prices
 * Prevents price tampering by verifying items against stored product data
 *
 * @param items - Items to validate
 * @param getPriceFunc - Function to fetch actual price from database
 * @returns Validation result with any price mismatches
 */
export async function validateItemPrices(
  items: CartItem[],
  getPriceFunc: (id: string) => Promise<number>
): Promise<{
  isValid: boolean;
  errors: Array<{ itemId: string; expectedPrice: number; sentPrice: number }>;
}> {
  const errors = [];

  for (const item of items) {
    try {
      const actualPrice = await getPriceFunc(item.id);
      // Allow 1p tolerance for rounding
      if (Math.abs(actualPrice * 100 - item.price * 100) > 1) {
        errors.push({
          itemId: item.id,
          expectedPrice: actualPrice,
          sentPrice: item.price,
        });
      }
    } catch {
      errors.push({
        itemId: item.id,
        expectedPrice: 0,
        sentPrice: item.price,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize metadata for safe storage
 * Removes potentially dangerous characters and enforces max length
 *
 * @param metadata - Raw metadata object
 * @returns Sanitized metadata
 */
export function sanitizeMetadata(
  metadata: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (!metadata) return undefined;

  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Max key/value length
    if (key.length > 40 || value.length > 500) continue;

    // Remove potentially dangerous characters
    const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, "");
    // Remove control characters using Unicode escapes
    const cleanValue = value
      .split("")
      .filter((char) => {
        const code = char.charCodeAt(0);
        // Filter out control characters (0x00-0x1F and 0x7F)
        return code >= 0x20 && code !== 0x7f;
      })
      .join("")
      .trim();

    if (cleanKey && cleanValue) {
      sanitized[cleanKey] = cleanValue;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Validate email address
 * More strict than standard email validation
 *
 * @param email - Email to validate
 * @returns true if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate payment amount
 * Ensures amount is within acceptable range
 *
 * @param amount - Amount in major units (e.g., £1.50 = 1.50)
 * @param minAmount - Minimum allowed amount (default 0.50)
 * @param maxAmount - Maximum allowed amount (default 99999.99)
 * @returns true if amount is valid
 */
export function validatePaymentAmount(
  amount: number,
  minAmount: number = 0.5,
  maxAmount: number = 99999.99
): boolean {
  return (
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount >= minAmount &&
    amount <= maxAmount
  );
}

/**
 * Convert amount to pence (minor currency units)
 * Used for Stripe and other payment processors
 *
 * @param amount - Amount in major units
 * @returns Amount in minor units (pence)
 */
export function toPence(amount: number): number {
  // Round to nearest pence to avoid floating point issues
  return Math.round(amount * 100);
}

/**
 * Convert pence to pounds (major currency units)
 *
 * @param pence - Amount in pence
 * @returns Amount in pounds
 */
export function fromPence(pence: number): number {
  return Math.round(pence) / 100;
}
