/**
 * PayPal Backend API Example - Capture Order
 *
 * This is a reference implementation for the backend API endpoint
 * that captures PayPal orders after customer approval.
 *
 * API Endpoint: POST /api/paypal/capture-order
 *
 * Required Environment Variables:
 * - PAYPAL_CLIENT_ID: Your PayPal app client ID
 * - PAYPAL_CLIENT_SECRET: Your PayPal app secret
 * - PAYPAL_API_URL: https://api-m.sandbox.paypal.com (sandbox) or https://api-m.paypal.com (production)
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL =
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

/**
 * Get PayPal access token
 */
async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(
    `${PAYPAL_API_URL}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}

/**
 * Capture PayPal order after customer approval
 * POST /api/paypal/capture-order
 */
router.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderId } = req.body;

    // Validate order ID
    if (!orderId) {
      return res.status(400).json({
        error: "Missing order ID",
        message: "orderId is required",
      });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = response.data;

    // Extract payment details
    const purchaseUnit = captureData.purchase_units[0];
    const capture = purchaseUnit.payments.captures[0];
    const payer = captureData.payer;

    // Store order in your database here
    // await saveCompletedOrder({
    //   orderId: captureData.id,
    //   status: captureData.status,
    //   payerId: payer.payer_id,
    //   payerEmail: payer.email_address,
    //   amount: capture.amount.value,
    //   currency: capture.amount.currency_code,
    //   captureId: capture.id,
    //   timestamp: capture.create_time,
    // });

    console.log("PayPal order captured:", captureData.id);

    res.json({
      orderId: captureData.id,
      status: captureData.status,
      payerId: payer.payer_id,
      payerEmail: payer.email_address,
      amount: parseFloat(capture.amount.value),
      currency: capture.amount.currency_code,
    });
  } catch (error) {
    console.error(
      "PayPal capture order error:",
      error.response?.data || error.message
    );

    // Handle specific PayPal errors
    if (error.response?.status === 422) {
      return res.status(422).json({
        error: "Order cannot be captured",
        message:
          error.response.data.details?.[0]?.description ||
          "The order has already been captured or cancelled",
      });
    }

    res.status(500).json({
      error: "Failed to capture PayPal order",
      message: error.response?.data?.message || error.message,
    });
  }
});

/**
 * Get order details (useful for verification)
 * GET /api/paypal/order/:orderId
 */
router.get("/api/paypal/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Get order details
    const response = await axios.get(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "PayPal get order error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to get PayPal order",
      message: error.response?.data?.message || error.message,
    });
  }
});

module.exports = router;
