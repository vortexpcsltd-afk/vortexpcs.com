/**
 * Input Validation & Sanitization Utilities
 * Provides comprehensive protection against XSS and data corruption
 */

import DOMPurify from "dompurify";
import { logger } from "../services/logger";

/**
 * Strict DOMPurify configuration for safe HTML rendering
 * Only allows essential formatting tags and safe attributes
 */
export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "class"],
  KEEP_CONTENT: true,
  FORCE_BODY: false,
  // Disallow data URLs to prevent JavaScript injection
  ALLOW_DATA_ATTR: false,
};

/**
 * Validate email address format and length
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  try {
    const trimmed = email.trim();
    // RFC 5322 simplified email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check basic format
    if (!emailRegex.test(trimmed)) {
      return false;
    }

    // Check length constraints per RFC 5321
    const [localPart, domain] = trimmed.split("@");
    if (!localPart || !domain) return false;

    // Local part max 64 chars, total max 254 chars
    if (localPart.length > 64 || trimmed.length > 254) {
      return false;
    }

    // Domain part max 255 chars
    if (domain.length > 255) {
      return false;
    }

    return true;
  } catch (error) {
    logger.warn("Email validation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Sanitize HTML/rich text content using DOMPurify
 * Removes potentially malicious scripts, iframes, event handlers
 * @param content - HTML content to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeRichText(content: string): string {
  try {
    if (!content || typeof content !== "string") {
      return "";
    }

    const sanitized = DOMPurify.sanitize(content, SANITIZE_CONFIG);

    // Verify output is valid
    if (typeof sanitized !== "string") {
      logger.warn("Sanitization produced invalid output", {
        inputLength: content.length,
      });
      return "";
    }

    return sanitized;
  } catch (error) {
    logger.error("Rich text sanitization failed", {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content?.length || 0,
    });
    return "";
  }
}

/**
 * Sanitize plain text input (removes HTML/scripts)
 * @param text - Text input to sanitize
 * @param maxLength - Maximum allowed length (default 500)
 * @returns Sanitized plain text
 */
export function sanitizeText(text: string, maxLength = 500): string {
  try {
    if (!text || typeof text !== "string") {
      return "";
    }

    // Remove HTML tags using DOMPurify
    const temp = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });

    // Trim to max length
    return temp.slice(0, maxLength).trim();
  } catch (error) {
    logger.warn("Text sanitization error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "";
  }
}

/**
 * Validate form input data object
 * @param data - Form data to validate
 * @param rules - Validation rules per field
 * @returns Object with validation result and errors
 */
export function validateFormData(
  data: Record<string, unknown>,
  rules: Record<
    string,
    {
      required?: boolean;
      type?: string;
      maxLength?: number;
      pattern?: RegExp;
      validator?: (value: unknown) => boolean;
    }
  >
): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Check required
    if (rule.required && !value) {
      errors[field] = `${field} is required`;
      continue;
    }

    if (!value) continue; // Skip validation if not required and empty

    const stringValue = String(value).trim();

    // Check type
    if (rule.type === "email" && !validateEmail(stringValue)) {
      errors[field] = "Invalid email format";
      continue;
    }

    // Check max length
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      errors[field] = `${field} must be ${rule.maxLength} characters or less`;
      continue;
    }

    // Check pattern
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      errors[field] = `${field} format is invalid`;
      continue;
    }

    // Custom validator
    if (rule.validator && !rule.validator(value)) {
      errors[field] = `${field} validation failed`;
      continue;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize user input for safe display
 * Handles both rich text and plain text appropriately
 * @param input - User input to sanitize
 * @param options - Sanitization options
 * @returns Sanitized input
 */
export function sanitizeUserInput(
  input: string,
  options: {
    type?: "text" | "html" | "email";
    maxLength?: number;
  } = {}
): string {
  const { type = "text", maxLength = 500 } = options;

  try {
    if (!input || typeof input !== "string") {
      return "";
    }

    let result = input.trim();

    // Apply type-specific sanitization
    switch (type) {
      case "email":
        result = result.toLowerCase();
        // Email can contain limited special chars
        if (!validateEmail(result)) {
          throw new Error("Invalid email format");
        }
        break;

      case "html":
        result = sanitizeRichText(result);
        break;

      case "text":
      default:
        result = sanitizeText(result, maxLength);
        break;
    }

    return result;
  } catch (error) {
    logger.warn("User input sanitization failed", {
      type,
      error: error instanceof Error ? error.message : String(error),
    });
    return "";
  }
}

/**
 * Check if string contains potentially dangerous content
 * @param str - String to check
 * @returns true if dangerous content detected
 */
export function containsDangerousContent(str: string): boolean {
  if (!str || typeof str !== "string") return false;

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // Scripts
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers
    /<iframe/gi, // Iframes
    /<embed/gi, // Embeds
    /<object/gi, // Objects
    /data:/gi, // Data URIs (can contain JS)
  ];

  return dangerousPatterns.some((pattern) => pattern.test(str));
}

/**
 * Escape HTML special characters for safe text rendering
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  const htmlMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(text).replace(/[&<>"']/g, (char) => htmlMap[char] || char);
}
