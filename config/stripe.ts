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
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Publishable key - Safe to expose in frontend
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY';

// Initialize Stripe only if properly configured
let stripePromise: Promise<Stripe | null> | null = null;

if (stripePublishableKey && stripePublishableKey !== 'pk_test_YOUR_PUBLISHABLE_KEY' && stripePublishableKey.startsWith('pk_')) {
  stripePromise = loadStripe(stripePublishableKey);
} else {
  console.warn('Stripe not configured. Payment features will be disabled. See .env.example');
}

export { stripePromise };

// Stripe configuration
export const stripeConfig = {
  currency: 'gbp',
  country: 'GB',
  successUrl: `${window.location.origin}/order-success`,
  cancelUrl: `${window.location.origin}/checkout-cancelled`,
};

// Backend API URL for Stripe operations
// In production, this should point to your serverless functions or backend API
export const stripeBackendUrl = import.meta.env.VITE_STRIPE_BACKEND_URL || 'http://localhost:3001/api/stripe';
