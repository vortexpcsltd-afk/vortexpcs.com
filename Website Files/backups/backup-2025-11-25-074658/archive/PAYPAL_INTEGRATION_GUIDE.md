# PayPal Integration Setup Guide

## Overview

This guide explains how to integrate PayPal payments into your Vortex PCs website alongside Stripe.

## Frontend Setup (Already Complete)

The following files have been created/updated:

### New Files Created:

1. **`config/paypal.ts`** - PayPal configuration and initialization
2. **`services/paypal.ts`** - PayPal payment service functions
3. **`components/PaymentMethodSelector.tsx`** - UI component for choosing between Stripe and PayPal
4. **`backend-examples/paypal-create-order.js`** - Backend API example for creating orders
5. **`backend-examples/paypal-capture-order.js`** - Backend API example for capturing payments

### Updated Files:

1. **`components/SubscriptionModal.tsx`** - Now supports both Stripe and PayPal
2. **`components/CheckoutPage.tsx`** - Now supports both payment methods

## Environment Variables

Add these to your `.env` file:

```env
# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here
VITE_PAYPAL_ENVIRONMENT=sandbox  # or 'production' for live

# Backend URLs (if different from main site)
VITE_PAYPAL_BACKEND_URL=https://your-backend-api.com
```

## PayPal Developer Setup

### 1. Create PayPal Developer Account

1. Go to https://developer.paypal.com/
2. Sign up or log in with your PayPal account
3. Navigate to **Dashboard**

### 2. Create an App

1. Go to **My Apps & Credentials**
2. Click **Create App**
3. Enter app details:
   - **App Name**: Vortex PCs Website
   - **App Type**: Merchant
4. Click **Create App**

### 3. Get API Credentials

After creating the app, you'll see:

**Sandbox Credentials** (for testing):

- Client ID: `starts with Ab...`
- Secret: Keep this secret, only use on backend

**Live Credentials** (for production):

- Switch to "Live" tab
- Client ID: Different from sandbox
- Secret: Different from sandbox

### 4. Configure App Settings

1. In your app settings, enable:
   - ✅ **Accept payments**
   - ✅ **Process payments**
2. Under **Features**:

   - ✅ Enable **Orders** (for payment processing)
   - ✅ Enable **Checkout** (for redirect flow)

3. Under **Return URL** (optional):
   - Add: `https://www.vortexpcs.com/order-success`
   - Add: `https://www.vortexpcs.com/checkout`

### 5. Test with Sandbox

PayPal provides sandbox accounts for testing:

1. Go to **Sandbox > Accounts**
2. You'll see test **Business** and **Personal** accounts
3. Use personal account to test payments:
   - Email: shown in dashboard
   - Password: click "..." to view

## Backend Implementation

### Option 1: Node.js/Express (Recommended)

1. Install dependencies:

```bash
npm install express axios cors dotenv
```

2. Create backend server file (`server.js`):

```javascript
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const paypalCreateOrder = require("./backend-examples/paypal-create-order");
const paypalCaptureOrder = require("./backend-examples/paypal-capture-order");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);
app.use(express.json());

// PayPal routes
app.use(paypalCreateOrder);
app.use(paypalCaptureOrder);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

3. Create `.env` file:

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_API_URL=https://api-m.sandbox.paypal.com
FRONTEND_URL=http://localhost:3000
PORT=3001
```

4. Start server:

```bash
node server.js
```

### Option 2: Vercel Serverless Functions

1. Create `api/paypal/create-order.ts`:

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL =
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, currency = "GBP" } = req.body;

    const totalAmount = items
      .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
      .toFixed(2);

    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: totalAmount,
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      orderId: response.data.id,
      status: response.data.status,
      links: response.data.links,
    });
  } catch (error: any) {
    console.error("PayPal error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create order" });
  }
}
```

2. Add environment variables in Vercel dashboard

## Testing the Integration

### 1. Development Mode

When running locally (`localhost`), the frontend will:

- Use mock PayPal functions
- Simulate successful payments
- Redirect to success page with test data

### 2. Test with Sandbox

1. Set `VITE_PAYPAL_CLIENT_ID` to your sandbox client ID
2. Start your backend server
3. Test checkout flow:
   - Add items to cart
   - Go to checkout
   - Select PayPal payment method
   - You'll be redirected to PayPal sandbox
   - Log in with test personal account
   - Complete payment
   - You'll be redirected back with order ID

### 3. Verify Payments

In PayPal Dashboard:

1. Go to **Sandbox > Accounts**
2. Click on your **Business** account
3. Click **View details**
4. See transaction history

## Payment Flow

### Checkout Page Flow:

1. User adds items to cart
2. Goes to checkout page
3. Fills in shipping information
4. Selects payment method (Stripe or PayPal)
5. **If Stripe**: Enters card details, pays immediately
6. **If PayPal**:
   - Clicks "Place Order"
   - Redirected to PayPal
   - Logs in and approves payment
   - Redirected back to success page

### Subscription Flow:

1. User selects support plan
2. Fills in business information
3. Selects payment method
4. **If Stripe**: Redirected to Stripe Checkout
5. **If PayPal**:
   - Creates PayPal order
   - Redirected to PayPal for approval
   - Completes subscription setup

## Going Live

### 1. Switch to Production

1. In PayPal Dashboard, switch to **Live** tab
2. Copy your **Live Client ID** and **Secret**
3. Update environment variables:

```env
VITE_PAYPAL_CLIENT_ID=your_live_client_id
VITE_PAYPAL_ENVIRONMENT=production
PAYPAL_API_URL=https://api-m.paypal.com  # Remove 'sandbox'
```

### 2. Test Live Payments

1. Use real PayPal account
2. Use real payment methods
3. Verify funds arrive in your business account

### 3. Enable PayPal Features

In your PayPal Business account:

1. Complete business verification
2. Enable payment receiving
3. Set up bank account for withdrawals

## Security Best Practices

1. **Never expose secrets**: Keep `PAYPAL_CLIENT_SECRET` on backend only
2. **Validate webhooks**: Implement webhook signature verification
3. **Verify amounts**: Always validate payment amounts on backend
4. **Use HTTPS**: Only process payments over secure connections
5. **Log transactions**: Keep audit trail of all payment attempts

## Troubleshooting

### PayPal button not showing

- Check `isPayPalConfigured` returns `true`
- Verify `VITE_PAYPAL_CLIENT_ID` is set correctly
- Check browser console for errors

### Order creation fails

- Verify backend is running
- Check backend logs for errors
- Ensure PayPal credentials are correct
- Verify `PAYPAL_API_URL` points to correct environment

### Redirect fails

- Check return URLs in PayPal app settings
- Verify `FRONTEND_URL` environment variable
- Check browser console for errors

### Payment not completing

- Check PayPal dashboard for transaction status
- Verify capture endpoint is working
- Check backend logs for errors

## Support

- **PayPal Developer Docs**: https://developer.paypal.com/docs/
- **PayPal Support**: https://www.paypal.com/support
- **Integration Issues**: Check backend logs and PayPal dashboard

## Next Steps

1. ✅ Frontend integration complete
2. ⏳ Deploy backend API endpoints
3. ⏳ Configure PayPal app in developer dashboard
4. ⏳ Test with sandbox accounts
5. ⏳ Switch to production when ready
