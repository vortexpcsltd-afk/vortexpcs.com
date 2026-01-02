/**
 * Account Creation Validation Utilities
 * Pre-payment validation for account creation on checkout
 * Prevents payment completion with invalid account credentials
 */

import { logger } from "../services/logger";

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  strength?: "weak" | "medium" | "strong";
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
  };
}

/**
 * Account existence check result
 */
export interface AccountExistsResult {
  exists: boolean;
  email: string;
  signInMethods?: string[];
}

/**
 * Account creation data for secure storage
 */
export interface AccountCreationData {
  email: string;
  password: string;
  displayName: string;
  timestamp: number;
}

/**
 * Validate password strength with comprehensive requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~]/.test(password),
  };

  // Calculate strength based on requirements met
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  let strength: "weak" | "medium" | "strong";

  if (metRequirements <= 2) {
    strength = "weak";
  } else if (metRequirements <= 4) {
    strength = "medium";
  } else {
    strength = "strong";
  }

  // Validate minimum requirements
  const valid =
    requirements.length &&
    requirements.uppercase &&
    requirements.lowercase &&
    requirements.number;

  let error: string | undefined;
  if (!valid) {
    if (!requirements.length) {
      error = "Password must be at least 8 characters long";
    } else if (!requirements.uppercase) {
      error = "Password must contain at least one uppercase letter";
    } else if (!requirements.lowercase) {
      error = "Password must contain at least one lowercase letter";
    } else if (!requirements.number) {
      error = "Password must contain at least one number";
    }
  }

  // Recommend special character for stronger password
  if (valid && !requirements.specialChar) {
    logger.info(
      "Password valid but lacks special character for extra security"
    );
  }

  return {
    valid,
    error,
    strength,
    requirements,
  };
}

/**
 * Check if account already exists with given email
 * Uses Firebase fetchSignInMethodsForEmail
 */
export async function checkAccountExists(
  email: string
): Promise<AccountExistsResult> {
  try {
    const { auth } = await import("../config/firebase");

    if (!auth) {
      logger.warn("Firebase not initialized, skipping account existence check");
      return { exists: false, email };
    }

    const { fetchSignInMethodsForEmail } = await import("firebase/auth");

    const signInMethods = await fetchSignInMethodsForEmail(auth, email);

    const exists = signInMethods.length > 0;

    if (exists) {
      logger.info("Account already exists for email", {
        email: email.substring(0, 3) + "***", // Partial email for privacy
        methods: signInMethods,
      });
    }

    return {
      exists,
      email,
      signInMethods,
    };
  } catch (error) {
    logger.error("Failed to check account existence", { error });

    // On error, assume account doesn't exist to allow checkout to proceed
    // Server-side will handle duplicate account creation errors
    return { exists: false, email };
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { valid: false, error: "Email is required" };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Additional checks
  if (trimmedEmail.length > 254) {
    return { valid: false, error: "Email is too long" };
  }

  const [localPart, domain] = trimmedEmail.split("@");
  if (localPart.length > 64) {
    return { valid: false, error: "Email local part is too long" };
  }

  // Check for common typos
  const commonTypos = [".con", ".cmo", ".co.k", ".couk"];
  if (commonTypos.some((typo) => domain.endsWith(typo))) {
    return {
      valid: false,
      error: `Possible typo in email domain. Did you mean .com or .co.uk?`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize account creation data before storage
 */
export function sanitizeAccountData(
  email: string,
  password: string,
  displayName: string
): AccountCreationData {
  return {
    email: email.trim().toLowerCase(),
    password: password, // Don't trim password - preserve exact input
    displayName: displayName.trim() || email.trim().split("@")[0], // Fallback to email username
    timestamp: Date.now(),
  };
}

/**
 * Store account creation data securely in sessionStorage (temporary)
 * Only used if payment succeeds but account creation needs retry
 */
export function storeAccountCreationData(data: AccountCreationData): void {
  try {
    // Use sessionStorage so data is cleared when browser closes
    // This is temporary storage for post-payment account creation retry
    const encoded = btoa(JSON.stringify(data)); // Basic encoding (not encryption)
    sessionStorage.setItem("vortex_pending_account", encoded);

    logger.info("Account creation data stored for post-payment processing");
  } catch (error) {
    logger.error("Failed to store account creation data", { error });
  }
}

/**
 * Retrieve and clear stored account creation data
 */
export function retrieveAccountCreationData(): AccountCreationData | null {
  try {
    const encoded = sessionStorage.getItem("vortex_pending_account");
    if (!encoded) return null;

    const data = JSON.parse(atob(encoded)) as AccountCreationData;

    // Clear immediately after retrieval
    sessionStorage.removeItem("vortex_pending_account");

    // Check if data is stale (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (data.timestamp < oneHourAgo) {
      logger.warn("Account creation data expired, discarding");
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to retrieve account creation data", { error });
    return null;
  }
}

/**
 * Clear stored account creation data (e.g., on successful account creation)
 */
export function clearAccountCreationData(): void {
  try {
    sessionStorage.removeItem("vortex_pending_account");
  } catch (error) {
    logger.error("Failed to clear account creation data", { error });
  }
}

/**
 * Comprehensive pre-payment account validation
 * Validates email, password, and checks for existing accounts
 */
export async function validateAccountCreation(
  email: string,
  password: string,
  displayName: string
): Promise<{
  valid: boolean;
  error?: string;
  warnings?: string[];
  accountExists?: boolean;
}> {
  const warnings: string[] = [];

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return { valid: false, error: emailValidation.error };
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { valid: false, error: passwordValidation.error };
  }

  // Warn if password is weak (but don't block)
  if (passwordValidation.strength === "weak") {
    warnings.push("Password is weak. Consider adding special characters.");
  }

  // Check if account already exists
  const accountCheck = await checkAccountExists(email);
  if (accountCheck.exists) {
    return {
      valid: false,
      error:
        "An account with this email already exists. Please log in instead.",
      accountExists: true,
    };
  }

  // Validate display name
  if (!displayName.trim()) {
    warnings.push("Display name is empty, will use email username");
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    accountExists: false,
  };
}
