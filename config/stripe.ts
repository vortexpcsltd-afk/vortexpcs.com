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
 * Note: Use test keys (pk_test_...) for development
 * Updated: Environment variables configured in Vercel
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

// Publishable key - Safe to expose in frontend
export const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_PUBLISHABLE_KEY";

console.log(
  "🔑 Stripe Key Check:",
  stripePublishableKey
    ? `${stripePublishableKey.substring(0, 15)}...`
    : "NOT FOUND"
);

// Initialize Stripe only if properly configured
let stripePromise: Promise<Stripe | null> | null = null;

if (
  stripePublishableKey &&
  stripePublishableKey !== "pk_test_YOUR_PUBLISHABLE_KEY" &&
  stripePublishableKey.startsWith("pk_")
) {
  stripePromise = loadStripe(stripePublishableKey);
  console.log("✅ Stripe initialized successfully");
} else {
  console.warn(
    "Stripe not configured. Payment features will be disabled. See .env.example"
  );
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
// Hardcoded to match production domain - no environment variable needed
export const stripeBackendUrl = 
  typeof window !== 'undefined' 
    ? window.location.origin 
    : "https://www.vortexpcs.com";

console.log("🔧 Stripe Backend URL:", stripeBackendUrl);
