/**
 * Environment utilities for API routes
 */

/**
 * Check if running in development mode
 * Works regardless of NODE_ENV setting
 */
export function isDevelopment(): boolean {
  // Check NODE_ENV first
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Check if running on localhost (Vite dev server)
  if (process.env.VITE_DEV_MODE === "true") {
    return true;
  }

  // Check for Vercel environment
  if (process.env.VERCEL_ENV === "development") {
    return true;
  }

  // If no Firebase credentials, assume development
  if (
    !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 &&
    !process.env.FIREBASE_PROJECT_ID
  ) {
    return true;
  }

  return false;
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY)
  );
}
