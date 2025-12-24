# Quick Reference: Monitoring Features

## 🚀 Quick Start

### 1. Get API Keys (5 minutes)

```bash
# Sentry: sentry.io → Create projects → Copy DSNs
# Upstash: upstash.com → Create Redis → Copy REST URL & Token
```

### 2. Add to Vercel (2 minutes)

```bash
vercel env add VITE_SENTRY_DSN
vercel env add SENTRY_DSN
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

### 3. Deploy (1 minute)

```bash
vercel --prod
```

## 📊 Feature Summary

| Feature            | Status   | Files Modified              | Benefit              |
| ------------------ | -------- | --------------------------- | -------------------- |
| Sentry Frontend    | ✅ Ready | `main.tsx`                  | Catch React errors   |
| Sentry Backend     | ✅ Ready | `api/services/sentry.ts`    | Catch API errors     |
| Structured Logging | ✅ Ready | `api/services/logger.ts`    | Debug with trace IDs |
| Rate Limiting      | ✅ Ready | `api/services/ratelimit.ts` | Prevent spam/abuse   |

## 🔧 Updated Endpoints

### Contact Form (`/api/contact/send`)

```typescript
// Now includes:
- ✅ Rate limit: 3 requests/hour per IP
- ✅ Trace ID in response header
- ✅ Structured JSON logs
- ✅ Sentry error tracking
```

### Address Lookup (`/api/address/find`)

```typescript
// Now includes:
- ✅ Rate limit: 10 requests/minute per IP
- ✅ Trace ID in response header
- ✅ Structured JSON logs
- ✅ Sentry error tracking
```

### Repair Booking (`/api/repair/notify`)

```typescript
// Now includes:
- ✅ Rate limit: 3 requests/hour per IP
- ✅ Trace ID in response header
- ✅ Structured JSON logs
- ✅ Sentry error tracking
```

## 🧪 Testing Checklist

### Test Sentry

```bash
# Trigger error → Check Sentry dashboard
curl -X POST https://your-site.com/api/contact/send \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

### Test Logging

```bash
# Make request → Note X-Trace-ID → Search Vercel logs
curl -i https://your-site.com/api/contact/health
# Look for: X-Trace-ID: abc123def456
# Then: vercel logs --search "abc123def456"
```

### Test Rate Limiting

```bash
# Make 4 requests quickly → Should get 429 on 4th
for i in {1..4}; do
  curl -i https://your-site.com/api/address/find?postcode=SW1A1AA
  sleep 1
done
```

## 📝 Response Headers

Every API response now includes:

```http
X-Trace-ID: abc123def456           # For debugging
X-RateLimit-Limit: 3                # Total allowed
X-RateLimit-Remaining: 2            # Requests left
X-RateLimit-Reset: 1730635200000    # Reset timestamp
```

## 🔍 Debugging Workflow

1. **User reports error**
2. **Ask for trace ID** from error message or support
3. **Search Vercel logs**: `vercel logs --search "TRACE_ID"`
4. **See full request flow** with all logs correlated
5. **Check Sentry** for stack trace and context
6. **Fix issue** with complete visibility

## 📚 Documentation Links

- **Full Setup**: [MONITORING_SETUP.md](./MONITORING_SETUP.md)
- **Environment Vars**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- **Implementation Summary**: [MONITORING_IMPLEMENTATION_SUMMARY.md](./MONITORING_IMPLEMENTATION_SUMMARY.md)

## 🎯 Free Tier Limits

### Sentry (Free)

- 5,000 errors/month
- 10,000 performance transactions/month
- 1 GB session replay storage
- ✅ Sufficient for most sites

### Upstash (Free)

- 10,000 requests/day
- 256 MB storage
- ✅ Sufficient for most sites

## ⚠️ Important Notes

1. **Optional Features**: App works without Sentry/Upstash
2. **Graceful Fallback**: Missing keys = warnings but no crashes
3. **Privacy**: Sensitive data excluded from logs/Sentry
4. **CORS**: All headers properly configured
5. **Production Ready**: Tested and documented

## 🆘 Troubleshooting

| Issue                       | Solution                                  |
| --------------------------- | ----------------------------------------- |
| Sentry not receiving events | Check DSN, redeploy after adding env vars |
| Rate limiting not working   | Verify Upstash credentials, check logs    |
| Logs not appearing          | Use `logger.info()` not `console.log()`   |
| Trace ID missing            | Check response headers, may need redeploy |

## 🎉 You're Done!

All monitoring features are:

- ✅ Installed
- ✅ Configured
- ✅ Documented
- ✅ Ready to deploy

Just add the environment variables and deploy! 🚀
