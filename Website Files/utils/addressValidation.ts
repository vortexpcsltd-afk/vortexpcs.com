/**
 * Address Validation Service
 * Validates UK and international addresses according to industry standards
 */

import { z } from "zod";

/**
 * UK Postcode validation regex
 * Matches valid UK postcode formats
 */
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number validation regex (basic international)
 */
const PHONE_REGEX =
  /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

/**
 * UK Shipping Address Schema
 * Validates addresses for UK checkout
 */
export const UKShippingAddressSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(200, "Full name too long"),

  email: z.string().email("Invalid email address"),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number too long")
    .refine((val) => PHONE_REGEX.test(val), "Invalid phone number format"),

  line1: z
    .string()
    .min(5, "Street address must be at least 5 characters")
    .max(200, "Street address too long"),

  line2: z.string().max(200, "Address line 2 too long").optional(),

  city: z.string().min(2, "City name too short").max(100, "City name too long"),

  county: z.string().max(100, "County name too long").optional(),

  postcode: z
    .string()
    .min(6, "Postcode must be at least 6 characters")
    .max(8, "Postcode too long")
    .refine(
      (val) => UK_POSTCODE_REGEX.test(val.toUpperCase().replace(/\s/g, "")),
      "Invalid UK postcode format (e.g., SW1A 1AA)"
    ),

  country: z.literal("United Kingdom").default("United Kingdom"),
});

export type UKShippingAddress = z.infer<typeof UKShippingAddressSchema>;

/**
 * Validate UK address
 */
export function validateUKAddress(address: unknown): {
  valid: boolean;
  data?: UKShippingAddress;
  errors?: Record<string, string>;
} {
  try {
    const data = UKShippingAddressSchema.parse(address);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { valid: false, errors };
    }
    return { valid: false, errors: { general: "Invalid address" } };
  }
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  return PHONE_REGEX.test(phone.replace(/\s/g, ""));
}

/**
 * Validate postcode
 */
export function validatePostcode(postcode: string): boolean {
  return UK_POSTCODE_REGEX.test(postcode.toUpperCase().replace(/\s/g, ""));
}

/**
 * Format postcode to standard format (e.g., "SW1A1AA" -> "SW1A 1AA")
 */
export function formatPostcode(postcode: string): string {
  const cleaned = postcode.toUpperCase().replace(/\s/g, "");
  if (cleaned.length !== 6 && cleaned.length !== 7) {
    return postcode; // Return as-is if invalid length
  }

  // Standard UK postcode format: first part 2-4 chars, second part always 3 chars
  const part1 = cleaned.slice(0, -3);
  const part2 = cleaned.slice(-3);
  return `${part1} ${part2}`;
}

/**
 * Sanitize address for API transmission
 * Trims whitespace and formats fields
 */
export function sanitizeAddress(address: UKShippingAddress): UKShippingAddress {
  return {
    fullName: address.fullName.trim(),
    email: address.email.toLowerCase().trim(),
    phone: address.phone.trim(),
    line1: address.line1.trim(),
    line2: address.line2?.trim() || undefined,
    city: address.city.trim(),
    county: address.county?.trim() || undefined,
    postcode: formatPostcode(address.postcode),
    country: "United Kingdom",
  };
}
