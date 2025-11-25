# Environment Variables Reference

Complete list of environment variables for Vortex PCs application.

## 📝 Quick Setup

Create a `.env.local` file in the root directory with these variables:

```env
# ========================================
# MONITORING & ERROR TRACKING (New!)
# ========================================

# Sentry - Frontend Error Tracking
VITE_SENTRY_DSN=https://your-project-id@o1234567.ingest.sentry.io/1234567
VITE_SENTRY_DEBUG=false
VITE_APP_VERSION=1.0.0

# Sentry - Backend Error Tracking (Vercel Functions)
SENTRY_DSN=https://your-project-id@o1234567.ingest.sentry.io/1234567
SENTRY_DEBUG=false

# Upstash Redis - Rate Limiting
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# ========================================
# FIREBASE - AUTHENTICATION & DATABASE
# ========================================

VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=vortex-pcs.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vortex-pcs
VITE_FIREBASE_STORAGE_BUCKET=vortex-pcs.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# ========================================
# STRIPE - PAYMENT PROCESSING
# ========================================

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_BACKEND_URL=https://your-backend.vercel.app

# ========================================
# STRAPI CMS - CONTENT MANAGEMENT
# ========================================

VITE_STRAPI_URL=https://your-strapi-instance.herokuapp.com
VITE_STRAPI_API_TOKEN=your-strapi-api-token

# ========================================
# EMAIL - SMTP CONFIGURATION
# ========================================

VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-specific-password
VITE_BUSINESS_EMAIL=info@vortexpcs.com

# ========================================
# ADDRESS LOOKUP - UK POSTCODE API
# ========================================

GETADDRESS_IO_API_KEY=your-getaddress-api-key
# Or use the VITE_ prefix version
VITE_GETADDRESS_IO_API_KEY=your-getaddress-api-key
```

---

## 🔑 Getting API Keys

### Sentry (Error Tracking) - **NEW**

**Sign up:** [sentry.io](https://sentry.io)

1. Create account
2. Create two projects:
   - Project 1: "Vortex PCs Frontend" (React)
   - Project 2: "Vortex PCs Backend" (Node.js)
3. Get DSN from each project settings
4. Use frontend DSN for `VITE_SENTRY_DSN`
5. Use backend DSN for `SENTRY_DSN`

**Optional:** Use the same DSN for both if you prefer single project

### Upstash Redis (Rate Limiting) - **NEW**

**Sign up:** [upstash.com](https://upstash.com)

1. Create account
2. Create new Redis database:
   - Name: "vortex-rate-limiting"
   - Type: Global (for worldwide access)
   - Region: Choose closest to your users
3. Go to database details
4. Copy **REST URL** → `UPSTASH_REDIS_REST_URL`
5. Copy **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

**Free tier:** 10,000 requests/day (sufficient for most sites)

### Firebase (Authentication & Database)

**Sign up:** [console.firebase.google.com](https://console.firebase.google.com/)

1. Create project
2. Add web app
3. Copy all config values
4. Enable Authentication (Email/Password, Google)
5. Create Firestore database

See [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) for detailed setup.

### Stripe (Payments)

**Sign up:** [stripe.com](https://stripe.com)

1. Create account
2. Get publishable key from Dashboard
3. Use test keys for development
4. Switch to live keys for production

See [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md) for detailed setup.

### Strapi (CMS)

**Deploy:** [strapi.io](https://strapi.io)

1. Deploy Strapi instance (Heroku, Railway, etc.)
2. Create API token in Strapi admin
3. Configure content types

See [CONTENTFUL_SETUP.md](./CONTENTFUL_SETUP.md) for alternative CMS.

### Email (SMTP)

**Using Gmail:**

1. Enable 2-factor authentication
2. Generate app-specific password
3. Use app password for `VITE_SMTP_PASS`

**Using SendGrid/Mailgun:**

- Get SMTP credentials from provider
- Update host, port, and credentials accordingly

See [SPACESHIP_EMAIL_SETUP.md](./SPACESHIP_EMAIL_SETUP.md) for detailed email setup.

### GetAddress.io (UK Postcodes)

**Sign up:** [getaddress.io](https://getaddress.io)

1. Create account
2. Get API key from dashboard
3. Free tier: 20 lookups/day
4. Paid plans for higher volumes

---

## 🚀 Vercel Deployment

### Add Environment Variables

**Via Vercel Dashboard:**

1. Go to project settings
2. Navigate to "Environment Variables"
3. Add each variable above
4. Set environment: Production, Preview, Development
5. Redeploy after adding variables

**Via Vercel CLI:**

```bash
# Add variable one by one
vercel env add VITE_SENTRY_DSN
vercel env add SENTRY_DSN
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# Pull environment variables locally
vercel env pull .env.local
```

---

## 🔒 Security Best Practices

### Variables Starting with `VITE_`

⚠️ **WARNING:** These are exposed to the client browser!

- Only use for public/publishable keys
- Never put secret keys in `VITE_` variables
- Examples: Stripe publishable key, Firebase config

### Variables WITHOUT `VITE_` Prefix

✅ **SAFE:** Only accessible in serverless functions

- Use for secret keys and tokens
- Examples: SMTP passwords, API secrets, rate limiting

### Never Commit

Add to `.gitignore`:

```
.env
.env.local
.env.production
.env.development
```

---

## 🧪 Testing Configuration

### Check Frontend Variables

```typescript
// In any React component
console.log("Sentry DSN:", import.meta.env.VITE_SENTRY_DSN);
console.log("Stripe Key:", import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

### Check Backend Variables

```typescript
// In any API function (api/*.ts)
console.log("Sentry DSN:", process.env.SENTRY_DSN);
console.log("Upstash URL:", process.env.UPSTASH_REDIS_REST_URL);
```

### Test Endpoints

```bash
# Test with monitoring
curl -i https://your-site.vercel.app/api/contact/health

# Check response headers
# X-Trace-ID: should be present
# X-RateLimit-Limit: should show rate limit info
```

---

## 📊 Optional vs Required

### Required for Core Functionality

✅ **Email (SMTP)** - Contact form and notifications

- `VITE_SMTP_HOST`
- `VITE_SMTP_USER`
- `VITE_SMTP_PASS`

### Recommended for Production

⭐ **Sentry** - Error tracking and debugging

- `VITE_SENTRY_DSN` (frontend)
- `SENTRY_DSN` (backend)

⭐ **Upstash** - Rate limiting protection

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Optional Integrations

🔧 **Firebase** - User authentication
🔧 **Stripe** - Payment processing
🔧 **Strapi** - Content management
🔧 **GetAddress.io** - Address lookup

---

## 🔄 Environment-Specific Config

### Development (.env.local)

```env
# Use test/development keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SENTRY_DEBUG=true  # See Sentry events in dev
```

### Production (Vercel)

```env
# Use production keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_SENTRY_DEBUG=false  # Don't log in production
```

---

## ❓ Troubleshooting

### Variables Not Loading

1. Restart dev server after adding variables
2. Check variable names (case-sensitive)
3. Ensure no trailing spaces
4. Verify `.env.local` is in root directory

### Sentry Not Working

1. Check DSN is correct
2. Verify not blocked by `SENTRY_DEBUG=false` in dev
3. Redeploy after adding env vars
4. Check Sentry project quota

### Rate Limiting Not Working

1. Verify Upstash credentials
2. Check Redis database is active
3. Look for "Upstash Redis not configured" in logs
4. Test with multiple rapid requests

---

## 📚 Related Documentation

- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Sentry & rate limiting setup
- [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) - Firebase, Stripe, Strapi
- [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md) - Payment processing
- [SPACESHIP_EMAIL_SETUP.md](./SPACESHIP_EMAIL_SETUP.md) - Email configuration
- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Deployment guide

---

## 🎯 Minimal Setup (Just Get Started)

If you want to get started quickly with just the essentials:

```env
# Minimum for development
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

Everything else is optional and can be added later as needed!

---

**Last Updated:** November 2025
**Version:** 2.0.0 (includes monitoring features)
