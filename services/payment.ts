/**
 * Stripe Payment Service
 * Handles payment processing, checkout sessions, and order confirmations
 */

import {
  stripePromise,
  stripeConfig,
  stripeBackendUrl,
} from "../config/stripe";
import axios from "axios";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

/**
 * Create Stripe checkout session
 */
export const createCheckoutSession = async (
  items: CartItem[],
  customerEmail?: string,
  userId?: string,
  metadata?: Record<string, string>
): Promise<CheckoutSession> => {
  try {
    // Call backend API endpoint
    const apiUrl = `${stripeBackendUrl}/api/stripe/create-checkout-session`;

    const response = await axios.post(apiUrl, {
      items,
      customerEmail,
      userId,
      metadata: {
        ...metadata,
        source: "vortex-pcs-website",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Create checkout session error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to create checkout session"
    );
  }
};

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = async (
  items: CartItem[],
  customerEmail?: string,
  userId?: string
) => {
  try {
    const stripe = await stripePromise;

    if (!stripe) {
      throw new Error(
        "Stripe failed to load. Please check your internet connection and try again."
      );
    }

    // Create checkout session
    const session = await createCheckoutSession(items, customerEmail, userId);

    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.sessionId,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error: any) {
    console.error("Redirect to checkout error:", error);
    throw new Error(error.message || "Failed to redirect to checkout");
  }
};

/**
 * Create payment intent (for custom checkout forms)
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string = "gbp",
  metadata?: Record<string, string>
): Promise<PaymentIntent> => {
  try {
    const response = await axios.post(
      `${stripeBackendUrl}/create-payment-intent`,
      {
        amount: Math.round(amount * 100), // Convert to pence
        currency,
        metadata,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Create payment intent error:", error);
    throw new Error(error.message || "Failed to create payment intent");
  }
};

/**
 * Verify payment status
 */
export const verifyPayment = async (sessionId: string) => {
  try {
    const apiUrl = `${stripeBackendUrl}/api/stripe/verify-payment`;

    const response = await axios.get(`${apiUrl}?session_id=${sessionId}`);
    return response.data;
  } catch (error: any) {
    console.error("Verify payment error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to verify payment"
    );
  }
};

/**
 * Format price for display
 */
export const formatPrice = (
  amount: number,
  currency: string = "GBP"
): string => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};

/**
 * Calculate cart total
 */
export const calculateCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

/**
 * Mock backend functions for development
 * IMPORTANT: Replace these with real backend API calls in production
 */

// Simulated backend session creation (DEVELOPMENT ONLY)
export const mockCreateCheckoutSession = async (
  _items: CartItem[],
  _customerEmail?: string
): Promise<CheckoutSession> => {
  // This is a mock - in production, implement a proper backend
  console.warn(
    "Using mock checkout session - implement real backend for production!"
  );

  return {
    sessionId: "mock_session_" + Date.now(),
    url: stripeConfig.successUrl + "?session_id=mock_session_" + Date.now(),
  };
};

// Development helper to simulate successful payment
export const simulateSuccessfulPayment = () => {
  console.log("Payment simulation - redirecting to success page");
  window.location.href = stripeConfig.successUrl;
};
