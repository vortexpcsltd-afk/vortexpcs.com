/**
 * PayPal Payment Service
 * Handles PayPal payment processing, order creation, and capture
 * Includes Zod validation for payment security
 */

import axios from "axios";
import { logger } from "./logger";
import { paypalBackendUrl, paypalConfig } from "../config/paypal";
import {
  PayPalOrderSchema,
  sanitizeMetadata,
  validateEmail,
} from "../utils/paymentValidation";

export interface PayPalOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface PayPalOrderResponse {
  orderId: string;
  status: string;
  links?: Array<{ href: string; rel: string; method: string }>;
}

export interface PayPalCaptureResponse {
  orderId: string;
  status: string;
  payerId: string;
  payerEmail: string;
  amount: number;
  currency: string;
}

/**
 * Create PayPal order
 */
export const createPayPalOrder = async (
  items: PayPalOrderItem[],
  customerEmail?: string,
  userId?: string,
  metadata?: Record<string, string>
): Promise<PayPalOrderResponse> => {
  try {
    // Validate items
    const validatedOrder = PayPalOrderSchema.parse({
      items,
      customerEmail,
      userId,
      currency: paypalConfig.currency,
      metadata,
    });

    // Validate email if provided
    if (customerEmail && !validateEmail(customerEmail)) {
      throw new Error("Invalid customer email address");
    }

    // Sanitize metadata
    const sanitizedMetadata = sanitizeMetadata(metadata);

    // Use mock for development
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      logger.debug("Using mock PayPal order creation for development");
      return mockCreatePayPalOrder(items);
    }

    const apiUrl = `${paypalBackendUrl}/api/paypal/create-order`;

    const response = await axios.post(apiUrl, {
      items: validatedOrder.items,
      customerEmail,
      userId,
      currency: validatedOrder.currency,
      metadata: {
        ...sanitizedMetadata,
        source: "vortex-pcs-website",
      },
    });

    return response.data;
  } catch (error: unknown) {
    logger.error("Create PayPal order error:", error);

    if (error instanceof Error) {
      throw error;
    }

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to create PayPal order"
      );
    }

    throw new Error("Failed to create PayPal order");
  }
};

/**
 * Capture PayPal order after approval
 */
export const capturePayPalOrder = async (
  orderId: string
): Promise<PayPalCaptureResponse> => {
  // Use mock for development
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    logger.debug("Using mock PayPal order capture for development");
    return mockCapturePayPalOrder(orderId);
  }

  try {
    const apiUrl = `${paypalBackendUrl}/api/paypal/capture-order`;

    const response = await axios.post(apiUrl, { orderId });

    return response.data;
  } catch (error: unknown) {
    logger.error("Capture PayPal order error:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to capture PayPal order"
      );
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to capture PayPal order"
    );
  }
};

/**
 * Calculate total from items with validation
 */
export const calculatePayPalTotal = (items: PayPalOrderItem[]): number => {
  try {
    const validatedOrder = PayPalOrderSchema.parse({
      items,
      currency: paypalConfig.currency,
    });

    return validatedOrder.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  } catch (error) {
    logger.error("PayPal total calculation validation error:", error);
    return 0;
  }
};

/**
 * Format price for PayPal (2 decimal places)
 */
export const formatPayPalPrice = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Mock functions for development
 */
export const mockCreatePayPalOrder = async (
  _items: PayPalOrderItem[]
): Promise<PayPalOrderResponse> => {
  logger.warn("Using mock PayPal order creation for development");

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const orderId = `MOCK_ORDER_${Date.now()}`;

  return {
    orderId,
    status: "CREATED",
    links: [
      {
        href: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
        rel: "approve",
        method: "GET",
      },
    ],
  };
};

export const mockCapturePayPalOrder = async (
  orderId: string
): Promise<PayPalCaptureResponse> => {
  logger.warn("Using mock PayPal order capture for development");

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simulate successful payment by redirecting to success page
  setTimeout(() => {
    window.location.href = `/order-success?paypal_order_id=${orderId}&dev_test=true`;
  }, 1000);

  return {
    orderId,
    status: "COMPLETED",
    payerId: "MOCK_PAYER_123",
    payerEmail: "test@example.com",
    amount: 100.0,
    currency: "GBP",
  };
};
