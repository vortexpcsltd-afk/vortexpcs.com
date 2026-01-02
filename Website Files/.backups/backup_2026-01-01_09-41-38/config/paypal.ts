/**
 * PayPal Configuration
 *
 * Setup Instructions:
 * 1. Go to https://developer.paypal.com/
 * 2. Create an account or log in
 * 3. Navigate to Dashboard > My Apps & Credentials
 * 4. Create a new app or use existing one
 * 5. Copy your Client ID (Safe for frontend)
 * 6. For backend: Copy Secret key - NEVER expose in frontend
 * 7. Set up webhook endpoint for order notifications
 * 8. Enable required payment features in app settings
 *
 * Note: Currently configured for Sandbox (TEST) mode
 * Updated: November 2025
 */

import { logger } from "../services/logger";

// PayPal Client ID - Safe to expose in frontend
export const paypalClientId =
  import.meta.env.VITE_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID";

// PayPal environment (sandbox or production)
export const paypalEnvironment =
  import.meta.env.VITE_PAYPAL_ENVIRONMENT || "sandbox";

// Enhanced validation and logging (development only)
if (import.meta.env.DEV) {
  const keyPreview = paypalClientId.substring(0, 20);
  logger.debug("🔑 PayPal Configuration Check", {
    preview:
      paypalClientId !== "YOUR_PAYPAL_CLIENT_ID"
        ? `${keyPreview}...`
        : "NOT CONFIGURED",
    environment: paypalEnvironment,
  });
}

// Check if PayPal is properly configured
export const isPayPalConfigured =
  paypalClientId &&
  paypalClientId !== "YOUR_PAYPAL_CLIENT_ID" &&
  paypalClientId.length > 20;

if (import.meta.env.DEV) {
  if (isPayPalConfigured) {
    logger.debug("✅ PayPal initialized successfully");
  } else {
    logger.warn(
      "PayPal not configured. PayPal payment option will be hidden. See .env.example"
    );
  }
}

// PayPal configuration
export const paypalConfig = {
  currency: "GBP",
  intent: "capture" as const, // or "authorize" for manual capture
  locale: "en_GB",
  // PayPal script options
  scriptOptions: {
    clientId: paypalClientId,
    currency: "GBP",
    intent: "capture",
    vault: false, // Set to true for subscriptions
    components: "buttons,funding-eligibility", // Load PayPal buttons
  },
};

// Backend API URL for PayPal operations
export const paypalBackendUrl =
  import.meta.env.VITE_PAYPAL_BACKEND_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "https://www.vortexpcs.com");

if (import.meta.env.DEV) {
  logger.debug("🔧 PayPal Backend URL", { url: paypalBackendUrl });
}
