/**
 * PayPal Backend API Example - Create Order
 *
 * This is a reference implementation for the backend API endpoint
 * that creates PayPal orders. Deploy this to your backend server.
 *
 * API Endpoint: POST /api/paypal/create-order
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
 * Create PayPal order
 * POST /api/paypal/create-order
 */
router.post("/api/paypal/create-order", async (req, res) => {
  try {
    const {
      items,
      customerEmail,
      userId,
      currency = "GBP",
      metadata = {},
    } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Invalid items array",
        message: "Items must be a non-empty array",
      });
    }

    // Calculate total
    const totalAmount = items
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2);

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Create order payload
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `vortex_${Date.now()}`,
          description: "Vortex PCs Order",
          custom_id: userId || "guest",
          soft_descriptor: "VORTEX PCS",
          amount: {
            currency_code: currency,
            value: totalAmount,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: totalAmount,
              },
            },
          },
          items: items.map((item) => ({
            name: item.name.substring(0, 127), // PayPal limit
            description: item.description?.substring(0, 127) || "",
            unit_amount: {
              currency_code: currency,
              value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
            category: "PHYSICAL_GOODS",
          })),
        },
      ],
      application_context: {
        brand_name: "Vortex PCs",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${
          process.env.FRONTEND_URL || "https://www.vortexpcs.com"
        }/order-success?payment_method=paypal`,
        cancel_url: `${
          process.env.FRONTEND_URL || "https://www.vortexpcs.com"
        }/checkout?cancelled=true`,
      },
    };

    // Create order with PayPal
    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders`,
      orderPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Store order metadata in your database here
    // await saveOrderMetadata(response.data.id, { customerEmail, userId, metadata });

    console.log("PayPal order created:", response.data.id);

    res.json({
      orderId: response.data.id,
      status: response.data.status,
      links: response.data.links,
    });
  } catch (error) {
    console.error(
      "PayPal create order error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to create PayPal order",
      message: error.response?.data?.message || error.message,
    });
  }
});

module.exports = router;
