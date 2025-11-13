/**
 * Stripe Configuration
 *
 * Setup Instructions:
 * 1. Go to https://dashboard.stripe.com/
 * 2. Create an account or log in
 * 3. Navigate to Developers > API keys
 * 4. Copy your Publishable key (starts with pk_)
 * 5. For backend: Copy Secret key (starts with sk_) - NEVER expose in frontend
 * 6. Set up webhook endpoint for order confirmations
 * 7. Enable Payment Methods: Cards, Apple Pay, Google Pay
 *
 * Note: Currently configured for TEST mode
 * Updated: November 2025
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";
import { logger } from "../services/logger";

// Publishable key - Safe to expose in frontend
export const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_PUBLISHABLE_KEY";

// Enhanced key validation and logging (development only)
if (import.meta.env.DEV) {
  const keyMode = stripePublishableKey.includes("_test_") ? "TEST" : "LIVE";
  const keyPreview = stripePublishableKey.substring(0, 20);
  logger.debug("🔑 Stripe Key Check", {
    preview: stripePublishableKey ? `${keyPreview}...` : "NONE",
    mode: keyMode,
  });
}

// Initialize Stripe only if properly configured
let stripePromise: Promise<Stripe | null> | null = null;

if (
  stripePublishableKey &&
  stripePublishableKey !== "pk_test_YOUR_PUBLISHABLE_KEY" &&
  stripePublishableKey.startsWith("pk_")
) {
  stripePromise = loadStripe(stripePublishableKey);
  if (import.meta.env.DEV) {
    logger.debug("✅ Stripe initialized successfully");
  }
} else {
  if (import.meta.env.DEV) {
    logger.warn(
      "Stripe not configured. Payment features will be disabled. See .env.example"
    );
  }
}

export { stripePromise };

// Stripe configuration
export const stripeConfig = {
  currency: "gbp",
  country: "GB",
  successUrl: `${window.location.origin}/order-success`,
  cancelUrl: `${window.location.origin}/checkout-cancelled`,
};

// Backend API URL for Stripe operations
// Uses environment variable for flexibility between dev and production
export const stripeBackendUrl =
  import.meta.env.VITE_STRIPE_BACKEND_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "https://www.vortexpcs.com");

if (import.meta.env.DEV) {
  logger.debug("🔧 Stripe Backend URL", { url: stripeBackendUrl });
}
