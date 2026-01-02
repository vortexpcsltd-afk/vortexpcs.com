/**
 * Form Validation Utilities
 * Provides validation functions for common form fields
 */

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length === 0) return true; // Don't validate empty (required is separate)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UK phone number format
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || phone.length === 0) return true;
  // UK phone: 10-11 digits, optional +44, spaces, dashes, parentheses
  const phoneRegex = /^(\+44\s?|0)(\d\s?){9,10}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ""));
}

/**
 * Validate UK postcode format
 */
export function isValidPostcode(postcode: string): boolean {
  if (!postcode || postcode.length === 0) return true;
  // UK postcode format
  const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode);
}

/**
 * Validate name (minimum 2 characters, letters and spaces)
 */
export function isValidName(name: string): boolean {
  if (!name || name.length === 0) return true;
  return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name);
}

/**
 * Validate required field
 */
export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validate message/text area (minimum length)
 */
export function isValidMessage(
  message: string,
  minLength: number = 10
): boolean {
  if (!message || message.length === 0) return true;
  return message.trim().length >= minLength;
}

/**
 * Get error message for email validation
 */
export function getEmailError(
  email: string,
  required: boolean = false
): string | null {
  if (required && !isRequired(email)) {
    return "Email address is required";
  }
  if (email.length > 0 && !isValidEmail(email)) {
    return "Please enter a valid email address";
  }
  return null;
}

/**
 * Get error message for phone validation
 */
export function getPhoneError(
  phone: string,
  required: boolean = false
): string | null {
  if (required && !isRequired(phone)) {
    return "Phone number is required";
  }
  if (phone.length > 0 && !isValidPhone(phone)) {
    return "Please enter a valid UK phone number";
  }
  return null;
}

/**
 * Get error message for postcode validation
 */
export function getPostcodeError(
  postcode: string,
  required: boolean = false
): string | null {
  if (required && !isRequired(postcode)) {
    return "Postcode is required";
  }
  if (postcode.length > 0 && !isValidPostcode(postcode)) {
    return "Please enter a valid UK postcode";
  }
  return null;
}

/**
 * Get error message for name validation
 */
export function getNameError(
  name: string,
  required: boolean = false
): string | null {
  if (required && !isRequired(name)) {
    return "Name is required";
  }
  if (name.length > 0 && !isValidName(name)) {
    return "Name must be at least 2 characters and contain only letters";
  }
  return null;
}

/**
 * Get error message for message validation
 */
export function getMessageError(
  message: string,
  minLength: number = 10,
  required: boolean = false
): string | null {
  if (required && !isRequired(message)) {
    return "Message is required";
  }
  if (message.length > 0 && !isValidMessage(message, minLength)) {
    return `Message must be at least ${minLength} characters`;
  }
  return null;
}
