# Monitoring & Rate Limiting Setup Guide

This guide covers the setup of Sentry error tracking, structured logging, and rate limiting for the Vortex PCs application.

## 🚨 Sentry Error Tracking

### Overview

Sentry provides real-time error tracking and performance monitoring for both frontend and serverless functions.

### Environment Variables

Add these to your `.env.local` (development) and Vercel environment variables (production):

```env
# Frontend Sentry
VITE_SENTRY_DSN=https://your-project-id@o1234567.ingest.sentry.io/1234567
VITE_SENTRY_DEBUG=false  # Set to 'true' to enable Sentry in development
VITE_APP_VERSION=1.0.0   # Optional: for release tracking

# Backend Sentry (Vercel Functions)
SENTRY_DSN=https://your-project-id@o1234567.ingest.sentry.io/1234567
SENTRY_DEBUG=false       # Set to 'true' to enable Sentry in development
```

### Getting Your Sentry DSN

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project:
   - **Frontend**: Choose "React" as the platform
   - **Backend**: Choose "Node.js" as the platform
3. Copy the DSN from project settings
4. You can use the same DSN for both or create separate projects

### Features Implemented

#### Frontend (`main.tsx`)

- ✅ Automatic error boundary
- ✅ Performance monitoring
- ✅ Session replay (10% of sessions, 100% on errors)
- ✅ Release tracking via git commit SHA
- ✅ Environment-based sample rates

#### Backend (`api/services/sentry.ts`)

- ✅ Serverless function error tracking
- ✅ Automatic error capture and flush
- ✅ Context enrichment (user, breadcrumbs)
- ✅ Integration with structured logging

### Vercel Setup

Add environment variables in Vercel dashboard:

```bash
# Via Vercel CLI
vercel env add VITE_SENTRY_DSN
vercel env add SENTRY_DSN
vercel env add VITE_APP_VERSION

# Or via Vercel Dashboard
# Settings > Environment Variables
```

---

## 📊 Structured Logging

### Overview

All API endpoints now use structured JSON logging with trace IDs for request correlation.

### Features

- **Trace IDs**: Every request gets a unique 12-character ID
- **Correlation**: Same trace ID across all logs for a single request
- **JSON Output**: Vercel automatically parses and indexes JSON logs
- **Log Levels**: `debug`, `info`, `warn`, `error`
- **Context**: Automatic inclusion of IP, user agent, method, endpoint

### Usage in API Functions

```typescript
import { createLogger } from "../services/logger";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);

  // Add trace ID to response headers for client debugging
  res.setHeader("X-Trace-ID", logger.getTraceId());

  logger.info("Processing request", { userId: "123" });
  logger.warn("Potential issue detected", { details: "..." });
  logger.error("Operation failed", error, { context: "data" });

  // Logs output as JSON:
  // {
  //   "timestamp": "2025-11-03T10:30:00.000Z",
  //   "level": "info",
  //   "message": "Processing request",
  //   "context": {
  //     "traceId": "abc123def456",
  //     "method": "POST",
  //     "endpoint": "/api/contact/send",
  //     "ip": "192.168.1.1",
  //     "userId": "123"
  //   }
  // }
}
```

### Viewing Logs

**Vercel Dashboard:**

```bash
# Real-time logs
vercel logs --follow

# Filter by function
vercel logs api/contact/send.ts

# Search by trace ID
vercel logs --search "abc123def456"
```

**In Browser:**

- Check response header `X-Trace-ID`
- Use trace ID to search Vercel logs for complete request flow

---

## 🛡️ Rate Limiting

### Overview

Upstash Redis-based rate limiting protects sensitive endpoints from abuse.

### Environment Variables

```env
# Upstash Redis (required for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Getting Upstash Credentials

1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database:
   - **Type**: Choose "Global" for worldwide access
   - **Region**: Choose closest to your users
3. Go to database details
4. Copy **REST URL** and **REST Token**
5. Add to Vercel environment variables

### Rate Limit Configuration

Defined in `api/services/ratelimit.ts`:

```typescript
export const RATE_LIMITS = {
  // Email endpoints (contact, repair)
  email: {
    requests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Address lookup
  address: {
    requests: 10,
    windowMs: 60 * 1000, // 1 minute
  },

  // General API endpoints
  api: {
    requests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
};
```

### Protected Endpoints

| Endpoint             | Limit       | Window   | Identifier |
| -------------------- | ----------- | -------- | ---------- |
| `/api/contact/send`  | 3 requests  | 1 hour   | IP Address |
| `/api/repair/notify` | 3 requests  | 1 hour   | IP Address |
| `/api/address/find`  | 10 requests | 1 minute | IP Address |

### Rate Limit Response

When rate limit is exceeded, API returns:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 3456,
  "limit": 3,
  "reset": "2025-11-03T11:00:00.000Z"
}
```

**Response Headers:**

```
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1730635200000
```

### Graceful Degradation

If Upstash is not configured:

- ⚠️ Warning logged: "Upstash Redis not configured - rate limiting disabled"
- ✅ Endpoints continue to work normally
- 🔓 No rate limiting applied (dev mode behavior)

---

## 🚀 Deployment Checklist

### 1. Install Dependencies (Already Done)

```bash
# Frontend
npm install @sentry/react @sentry/vite-plugin

# Backend
cd api
npm install @sentry/node @upstash/ratelimit @upstash/redis nanoid
```

### 2. Set Environment Variables

**Vercel Dashboard** (Settings > Environment Variables):

```env
# Sentry
VITE_SENTRY_DSN=<your-frontend-dsn>
SENTRY_DSN=<your-backend-dsn>
VITE_APP_VERSION=1.0.0

# Upstash Redis
UPSTASH_REDIS_REST_URL=<your-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>
```

### 3. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploys via GitHub integration)
git add .
git commit -m "Add Sentry, logging, and rate limiting"
git push origin main
```

### 4. Verify Setup

#### Test Sentry

1. Trigger an intentional error
2. Check Sentry dashboard for error report
3. Verify source maps are uploaded

#### Test Logging

1. Make API request
2. Note `X-Trace-ID` from response headers
3. Search Vercel logs for that trace ID
4. Verify structured JSON logs appear

#### Test Rate Limiting

1. Make multiple requests to `/api/contact/send`
2. After 3 requests in 1 hour, should receive 429 error
3. Check response headers for rate limit info

---

## 📈 Monitoring Dashboard

### Sentry Dashboard

**Key Metrics to Monitor:**

- Error rate (should be < 1%)
- Performance (p75, p95, p99 response times)
- Session replay for user debugging
- Release comparison

### Upstash Dashboard

**Key Metrics to Monitor:**

- Request count
- Rate limit hits
- Redis memory usage
- Response latency

### Vercel Analytics

**Key Metrics to Monitor:**

- Function invocations
- Error rate by function
- Execution time
- Log volume

---

## 🔧 Advanced Configuration

### Customize Rate Limits

Edit `api/services/ratelimit.ts`:

```typescript
export const RATE_LIMITS = {
  email: {
    requests: 5, // Allow 5 requests
    windowMs: 30 * 60 * 1000, // per 30 minutes
  },
};
```

### Add Rate Limiting to New Endpoint

```typescript
import {
  checkApiRateLimit,
  getClientId,
  setRateLimitHeaders,
  createRateLimitError,
} from "../services/ratelimit";

export default async function handler(req, res) {
  const clientId = getClientId(req);
  const rateLimitResult = await checkApiRateLimit(clientId);
  setRateLimitHeaders(res, rateLimitResult);

  if (!rateLimitResult.success) {
    return res.status(429).json(createRateLimitError(rateLimitResult));
  }

  // ... rest of handler
}
```

### Custom Sentry Context

```typescript
import { addBreadcrumb, setUser } from "../services/sentry";

// Add debugging breadcrumbs
addBreadcrumb("User clicked checkout", { cartTotal: 299.99 });

// Set user context for error tracking
setUser({ id: "user_123", email: "user@example.com" });
```

---

## ❓ Troubleshooting

### Sentry Not Receiving Events

**Check:**

- ✅ DSN is correct in environment variables
- ✅ `SENTRY_DEBUG` not blocking events in dev mode
- ✅ Redeploy after adding env vars

**Test:**

```typescript
// Add to any API function
import * as Sentry from "@sentry/node";
Sentry.captureMessage("Test message");
await Sentry.flush(2000);
```

### Rate Limiting Not Working

**Check:**

- ✅ Upstash credentials are correct
- ✅ Redis database is active
- ✅ Check logs for "Upstash Redis not configured" warning

**Test:**

```bash
# Make multiple requests quickly
for i in {1..15}; do curl https://your-site.com/api/address/find?postcode=SW1A1AA; done
```

### Logs Not Appearing

**Check:**

- ✅ Using `logger.info()` instead of `console.log()`
- ✅ Vercel deployment successful
- ✅ Function is being invoked

**View Logs:**

```bash
vercel logs --follow
```

---

## 📚 Additional Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node.js Docs](https://docs.sentry.io/platforms/node/)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [Vercel Logs](https://vercel.com/docs/observability/runtime-logs)

---

## 🎯 Next Steps

1. **Set up Sentry projects** for frontend and backend
2. **Create Upstash Redis database** for rate limiting
3. **Add environment variables** to Vercel
4. **Deploy and test** all three features
5. **Monitor dashboards** for first 24-48 hours
6. **Adjust rate limits** based on actual traffic patterns

Need help? Check the [Vortex PCs Documentation](./BACKEND_INTEGRATION_GUIDE.md) or reach out to the development team.
