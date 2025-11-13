/**
 * Stripe Payment Service
 * Handles payment processing, checkout sessions, and order confirmations
 * Supports both authenticated and guest checkout flows
 */

import {
  stripePromise,
  stripeConfig,
  stripeBackendUrl,
} from "../config/stripe";
import axios from "axios";
import { logger } from "./logger";

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
  // Use mock for development to avoid CORS issues
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    logger.debug("Using mock checkout session for development");
    return mockCreateCheckoutSession();
  }

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
  } catch (error: unknown) {
    logger.error("Create checkout session error:", error);

    // Type-safe error handling for axios errors
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to create checkout session"
      );
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create checkout session"
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
  } catch (error: unknown) {
    logger.error("Redirect to checkout error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to redirect to checkout"
    );
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
  // Use mock for development to avoid CORS issues
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    logger.debug("Using mock payment intent for development");
    return mockCreatePaymentIntent(amount, currency, metadata);
  }

  try {
    // Use local proxy endpoint that Vite will forward to backend
    const apiUrl = `/api/stripe/create-payment-intent`;

    const response = await axios.post(apiUrl, {
      amount: Math.round(amount * 100), // Convert to pence
      currency,
      metadata,
    });

    return response.data;
  } catch (error: unknown) {
    logger.error("Create payment intent error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create payment intent"
    );
  }
};

/**
 * Verify payment status
 */
export const verifyPayment = async (sessionId: string) => {
  // Use mock for development to avoid CORS issues
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    logger.debug("Using mock payment verification for development");
    return mockVerifyPayment();
  }

  try {
    // Use local proxy endpoint that Vite will forward to backend
    const apiUrl = `/api/stripe/verify-payment`;

    const response = await axios.get(`${apiUrl}?session_id=${sessionId}`);
    return response.data;
  } catch (error: unknown) {
    logger.error("Verify payment error:", error);

    // Type-safe error handling for axios errors
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to verify payment"
      );
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to verify payment"
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
export const mockCreateCheckoutSession = async (): Promise<CheckoutSession> => {
  logger.warn(
    "Using development checkout - redirecting to success page for testing"
  );

  // For development, simulate a successful checkout by redirecting to success page
  // This allows testing the UI flow without real Stripe integration
  const sessionId = "dev_test_" + Date.now();

  // Simulate successful payment by redirecting to success page with test data
  setTimeout(() => {
    window.location.href = `${stripeConfig.successUrl}?session_id=${sessionId}&dev_test=true`;
  }, 1000);

  // Return a mock session (won't be used due to redirect)
  return {
    sessionId: sessionId,
    url: `${stripeConfig.successUrl}?session_id=${sessionId}&dev_test=true`,
  };
};

// Mock payment verification for development
export const mockVerifyPayment = async () => {
  logger.warn("Using mock payment verification for development");

  // Simulate successful payment verification
  return {
    status: "paid",
    customerEmail: "test@example.com",
    amountTotal: 10000, // £100.00 in pence
    currency: "gbp",
    paymentStatus: "paid",
    devTest: true,
  };
};

// Mock payment intent creation for development
export const mockCreatePaymentIntent = async (
  amount: number,
  currency: string = "gbp",
  _metadata?: Record<string, string>
): Promise<PaymentIntent> => {
  logger.warn("Using mock payment intent for development");

  // Simulate payment intent creation
  const clientSecret = `pi_mock_${Date.now()}_secret_${Math.random()
    .toString(36)
    .substring(2)}`;

  return {
    clientSecret,
    amount: Math.round(amount * 100), // Convert to pence
    currency: currency.toUpperCase(),
  };
};

// Development helper to simulate successful payment
export const simulateSuccessfulPayment = () => {
  logger.debug("Payment simulation - redirecting to success page");
  window.location.href = stripeConfig.successUrl;
};
