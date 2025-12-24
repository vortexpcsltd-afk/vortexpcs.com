/**
 * Stripe Payment Service
 * Handles payment processing, checkout sessions, and order confirmations
 * Supports both authenticated and guest checkout flows
 * Includes retry logic and error recovery for network failures
 */

import {
  stripePromise,
  stripeConfig,
  stripeBackendUrl,
} from "../config/stripe";
import axios, { AxiosError } from "axios";
import { logger } from "./logger";

/**
 * Retry configuration for payment operations
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

/**
 * Check if error is retryable (network/timeout issues)
 */
function isRetryableError(error: unknown): boolean {
  // Axios network errors
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      !axiosErr.response ||
      axiosErr.code === "ECONNABORTED" ||
      axiosErr.code === "ETIMEDOUT" ||
      (axiosErr.response?.status >= 500 && axiosErr.response?.status < 600)
    );
  }

  // Generic network errors
  return (
    error instanceof Error &&
    (error.message.includes("network") ||
      error.message.includes("timeout") ||
      error.message.includes("fetch") ||
      error.message.includes("ECONNRESET"))
  );
}

/**
 * Retry operation with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if not a network error or if we're out of retries
      if (!isRetryableError(error) || attempt === retries) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        RETRY_CONFIG.maxDelay
      );

      logger.warn(
        `${operationName} failed, retrying in ${Math.round(delay)}ms`,
        {
          attempt: attempt + 1,
          maxRetries: retries,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if user is online
 */
function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

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
  metadata?: Record<string, string>,
  customerName?: string,
  shippingAddress?: unknown,
  shippingMethod?: string,
  shippingCost?: number
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
      customerName,
      userId,
      shippingAddress,
      shippingMethod,
      shippingCost,
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
      // Check if it's a configuration issue vs loading issue
      if (!isOnline()) {
        throw new Error(
          "No internet connection. Please check your network and try again."
        );
      }
      throw new Error(
        "Stripe failed to load. This may be due to an ad blocker or network issue. Please disable ad blockers and try again."
      );
    }

    // Serialize cart items minimally for metadata (including image)
    const cartSerialized = btoa(
      JSON.stringify(
        items.map((i) => ({
          id: i.id,
          n: i.name,
          p: i.price,
          q: i.quantity,
          img: i.image,
        }))
      )
    );

    // Create checkout session including serialized cart metadata
    const session = await createCheckoutSession(items, customerEmail, userId, {
      cart: cartSerialized,
    });

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

  // Check online status
  if (!isOnline()) {
    throw new Error(
      "No internet connection. Please check your network and try again."
    );
  }

  try {
    // Use local proxy endpoint that Vite will forward to backend
    const apiUrl = `/api/stripe/create-payment-intent`;

    const response = await retryOperation(
      () =>
        axios.post(apiUrl, {
          amount: Math.round(amount * 100), // Convert to pence
          currency,
          metadata,
        }),
      "Create payment intent"
    );

    return response.data;
  } catch (error: unknown) {
    logger.error("Create payment intent error:", error);

    // Check if user went offline
    if (!isOnline()) {
      throw new Error(
        "Lost internet connection. Please check your network and try again."
      );
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;

      if (axiosError.response?.status >= 500) {
        throw new Error(
          "Payment service temporarily unavailable. Please try again in a moment."
        );
      }

      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to initialize payment. Please try again."
      );
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create payment intent. Please try again."
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

    const response = await retryOperation(
      () => axios.get(`${apiUrl}?session_id=${sessionId}`),
      "Verify payment"
    );
    return response.data;
  } catch (error: unknown) {
    logger.error("Verify payment error:", error);

    // Check if user went offline
    if (!isOnline()) {
      throw new Error(
        "Cannot verify payment - no internet connection. Your payment may still have succeeded. Please check your email for confirmation or contact support."
      );
    }

    // Type-safe error handling for axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;

      // Handle specific scenarios
      if (axiosError.response?.status === 404) {
        throw new Error(
          "Payment session not found. It may have expired. Please try again or contact support."
        );
      } else if (axiosError.response?.status >= 500) {
        throw new Error(
          "Unable to verify payment due to a temporary server issue. Your payment may have succeeded. Please check your email or contact support."
        );
      }

      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to verify payment. Please check your email for confirmation or contact support."
      );
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to verify payment. Please check your email for confirmation or contact support."
    );
  }
};

/**
 * Verify payment intent status
 */
export const verifyPaymentIntent = async (paymentIntentId: string) => {
  // Use mock for development to avoid CORS issues
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    logger.debug("Using mock payment intent verification for development");
    return mockVerifyPayment();
  }

  try {
    const apiUrl = `/api/stripe/verify-intent`;
    const response = await axios.get(
      `${apiUrl}?payment_intent=${paymentIntentId}`
    );
    return response.data;
  } catch (error: unknown) {
    logger.error("Verify payment intent error:", error);
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
