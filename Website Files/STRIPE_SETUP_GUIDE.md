# Stripe Integration Guide

This guide explains how to set up Stripe payment processing for the Vortex PCs website.

## Setup Steps

### 1. Create Stripe Account

1. Go to https://stripe.com and create an account
2. Verify your business information
3. Navigate to Dashboard > Developers > API keys

### 2. Get API Keys

#### For Development (Test Mode):

- **Publishable Key**: `pk_test_...` (frontend - safe to expose)
- **Secret Key**: `sk_test_...` (backend - MUST be kept secret!)

#### For Production:

- **Publishable Key**: `pk_live_...`
- **Secret Key**: `sk_live_...`

### 3. Configure Environment Variables

#### Frontend (.env file in root):

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

#### Backend (Vercel Environment Variables):

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
VITE_APP_URL=https://your-domain.com
```

### 4. Deploy to Vercel

The `/api` folder contains serverless functions that will be automatically deployed by Vercel:

- `/api/stripe/create-checkout-session.ts` - Creates checkout sessions
- `/api/stripe/verify-payment.ts` - Verifies payment status
- `/api/stripe/webhook.ts` - Handles Stripe webhooks

### 5. Set Up Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret and add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### 6. Configure Vercel Environment Variables

In your Vercel project settings:

1. Go to Settings > Environment Variables
2. Add the following variables:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your webhook signing secret
   - `VITE_APP_URL`: Your production URL

### 7. Test Payment Flow

#### Test Cards:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC.

## How It Works

### Payment Flow:

1. User adds items to cart
2. User clicks "Proceed to Checkout"
3. System checks if user is logged in
4. If logged in, creates Stripe checkout session with cart items
5. User is redirected to Stripe-hosted checkout page
6. User enters payment information
7. On success, redirects to `/order-success?session_id=...`
8. Order success page verifies payment and displays confirmation
9. Webhook receives event and creates order in Firebase

### Security Features:

- Secret key never exposed to frontend
- Webhook signature verification prevents tampering
- User must be logged in to checkout
- HTTPS required for production
- CORS headers properly configured

## Testing Locally

To test locally with ngrok:

1. Install ngrok: `npm install -g ngrok`
2. Start dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Use the ngrok URL for webhook endpoint in Stripe Dashboard
5. Update `VITE_APP_URL` in api/.env to ngrok URL

## Troubleshooting

### "Stripe failed to load"

- Check `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Ensure key starts with `pk_test_` or `pk_live_`
- Check browser console for errors

### "Failed to create checkout session"

- Verify `STRIPE_SECRET_KEY` is set in Vercel
- Check API endpoint is deployed correctly
- Look at Vercel function logs for errors

### Webhook not receiving events

- Verify webhook URL is correct (include https://)
- Check `STRIPE_WEBHOOK_SECRET` is set
- Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
