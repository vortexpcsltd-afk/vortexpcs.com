# Backend Examples Quick Start (Stripe + Firebase)

This folder contains minimal server-side examples for payments and webhooks. Use these to test integrations independently from the main app.

## Contents

- stripe-vercel-functions.ts — Example Next/Vercel API functions (Checkout, Verify, Webhook)
- paypal-create-order.js / paypal-capture-order.js — PayPal examples

## Prerequisites

- Node.js 18+
- Stripe CLI installed and logged in
- Firebase project with Firestore enabled (optional)
- SMTP email provider (optional)
- Strapi (optional for inventory decrement)

## Environment Variables (Server-side)

Set these in your deployment platform (Vercel) or local `.env` for serverless functions. Do not expose secrets to the frontend.

Required for Stripe:

- STRIPE_SECRET_KEY — Your Stripe secret key
- STRIPE_WEBHOOK_SECRET — Signing secret for webhook verification

Optional for Firebase (order storage):

- FIREBASE_SERVICE_ACCOUNT_BASE64 — Base64-encoded Service Account JSON
  - Encode with: `cat service-account.json | base64` (macOS/Linux)
  - Windows PowerShell: `Get-Content service-account.json | Out-String | [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_))`

Optional for Email (order confirmations):

- SMTP_HOST
- SMTP_USER
- SMTP_PASS
- SMTP_PORT (e.g., 465 for SSL, 587 for TLS)
- BUSINESS_EMAIL (e.g., info@vortexpcs.com)

Optional for Strapi (inventory updates):

- STRAPI_URL — Base URL to your Strapi API
- STRAPI_TOKEN — Bearer token if required

## Local Webhook Testing (Stripe CLI)

You can test the webhook without a full checkout flow.

1. Start your API (Next/Vercel) locally so `/api/stripe/webhook` is reachable.
2. Forward Stripe events to your local webhook:

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

3. Trigger a simulated event:

```bash
stripe trigger checkout.session.completed
```

The webhook will:

- Verify the Stripe signature
- Generate an orderNumber
- (If Firebase configured) create a document in orders
- (If SMTP configured) send customer + business emails
- (If Strapi configured) decrement inventory

## Verifying Results

- Firestore: Check orders collection for a new document (fields: orderNumber, customerEmail, amountTotal, items, createdAt, status).
- Email: Check inbox and/or SMTP provider logs for 2 emails (customer + business).
- Logs: Inspect server logs for warnings (missing envs will be logged but not crash the webhook).

## Notes & Recommendations

- Production webhook in `api/stripe/webhook.ts` includes a richer HTML email template and diagnostics; the example here is intentionally lightweight.
- To reuse the production template in this example, import your HTML builder and set `html` on Nodemailer messages.
- Keep secrets server-side only. Never expose STRIPE_SECRET_KEY or service account creds to the client.

## Troubleshooting

- "Webhook signature verification failed": Ensure STRIPE_WEBHOOK_SECRET matches the value from `stripe listen`.
- "SMTP verification failed": Some providers fail `verify()` but still send. Check provider-specific settings and ports.
- "Firebase init failed": Confirm FIREBASE_SERVICE_ACCOUNT_BASE64 is set and valid; service account needs Firestore permissions.

## Deployment

- Vercel: Place files under `/api/stripe/*` for serverless functions. Set env vars in Vercel project settings.
- Other platforms: Map routes accordingly and ensure raw body access for Stripe webhook.
