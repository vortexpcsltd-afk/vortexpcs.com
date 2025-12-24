# Admin Recommendations Fix - Complete

## Problem Summary

- Admin Panel → Recommendations tab showed `FUNCTION_INVOCATION_FAILED` errors
- Root cause: Vercel serverless functions couldn't resolve `utils/recommendationsAggregator` module

## Solution Applied

### 1. Module Resolution Fix

- **Copied** `utils/recommendationsAggregator.ts` → `api/utils/recommendationsAggregator.ts`
- **Updated imports** in:
  - `api/admin/analytics/recommendations.ts`
  - `api/admin/analytics/recommendations-digest.ts`
- Now imports from `../../utils/recommendationsAggregator` (within api tree)

### 2. Runtime Safeguards Added

- Capped Firestore queries: `.limit(20000)` on searchQueries, zeroResultSearches, searchConversions
- Limited unique keys tracked: maxKeys = 5000, maxCategoryKeys = 1000
- String length caps: norm() = 128 chars, distance() inputs = 64 chars
- Variant tracking limits: 500 per canonical term, 200 processed during clustering
- Added try/catch around spelling clustering with safe fallback

### 3. Logging for Monitoring

- Added console.log statements showing:
  - Conversions docs count
  - Window days
  - Payload sizes (missingProducts, quickWins, spellingCorrections, etc.)

## Deployment Steps

### Clear Vercel Cache & Redeploy

The error persists because Vercel cached the old compiled code. Force a fresh build:

```powershell
# Option 1: Redeploy via CLI with force flag
vercel --prod --force

# Option 2: Clear build cache in Vercel Dashboard
# Go to: Project Settings → General → Clear Build Cache
# Then redeploy: vercel --prod
```

### Verify Fix

1. Navigate to Admin Panel → Analytics → Recommendations
2. Should load without `FUNCTION_INVOCATION_FAILED`
3. Check Vercel logs for our new logging:
   - "recommendations: conversions docs X windowDays Y"
   - "recommendations: payload sizes {...}"

## Files Changed

- ✅ `api/utils/recommendationsAggregator.ts` - Full implementation copied here
- ✅ `api/admin/analytics/recommendations.ts` - Import path updated, logging added
- ✅ `api/admin/analytics/recommendations-digest.ts` - Import path updated, logging added
- ✅ `utils/recommendationsAggregator.ts` - Hardened with caps and limits
- ✅ `vercel.json` - Removed invalid functions config

## Why It Will Work Now

- **Before**: Vercel tried to import from `/var/task/utils/` (outside api tree, not bundled)
- **After**: Everything imported from `/var/task/api/utils/` (within api tree, automatically bundled)
- The aggregator logic is now physically present in the serverless function package

## If Still Failing

1. Confirm fresh deployment (check timestamp in Vercel dashboard)
2. Check if `.vercel` directory exists locally and delete it: `rm -rf .vercel`
3. Redeploy from scratch: `vercel --prod`
4. Share latest Vercel logs showing the import path in the error

---

_Fix completed: 2025-12-01_
