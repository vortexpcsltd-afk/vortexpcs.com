/**
 * Cart Constants
 * Centralized configuration for cart behavior
 */

/**
 * Maximum quantity allowed per cart item
 * Prevents abuse and ensures reasonable order sizes
 */
export const MAX_CART_ITEM_QUANTITY = 99;

/**
 * Minimum quantity for any cart item
 * Items with quantity < 1 are automatically removed
 */
export const MIN_CART_ITEM_QUANTITY = 1;

/**
 * Maximum total items allowed in cart
 * Prevents performance issues and abuse
 */
export const MAX_CART_ITEMS = 100;

/**
 * Validate if a quantity is within allowed limits
 */
export function isValidQuantity(quantity: number): boolean {
  return (
    Number.isInteger(quantity) &&
    quantity >= MIN_CART_ITEM_QUANTITY &&
    quantity <= MAX_CART_ITEM_QUANTITY
  );
}

/**
 * Clamp quantity to valid range
 */
export function clampQuantity(quantity: number): number {
  return Math.min(
    MAX_CART_ITEM_QUANTITY,
    Math.max(MIN_CART_ITEM_QUANTITY, Math.floor(quantity))
  );
}
