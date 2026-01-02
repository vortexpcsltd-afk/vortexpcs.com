# Contentful Webhooks Setup Guide

## Overview

Webhooks allow Contentful to notify your application immediately when content is published, updated, or deleted. This eliminates the need for polling and ensures your cache is always fresh.

## Benefits

✅ **Instant Updates** - Content changes appear immediately (no 30-minute cache delay)  
✅ **Reduced API Calls** - No need to poll or manually clear cache  
✅ **Better UX** - Users see latest content without waiting  
✅ **Automatic Cache Invalidation** - Cache clears only when needed

## Architecture

```
Contentful CMS → Webhook Trigger → Your API Endpoint → Clear Cache → Fresh Data
```

---

## Part 1: Create Webhook Endpoint

### Option A: Using Vercel Serverless Functions (Recommended)

**Create:** `api/webhooks/contentful.ts`

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearCache } from "../../services/cms";

/**
 * Contentful Webhook Handler
 * Receives notifications when content is published/updated/deleted
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify webhook signature for security
    const signature = req.headers["x-contentful-webhook-signature"];
    const webhookSecret = process.env.CONTENTFUL_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      // Optional: Implement signature verification
      // See: https://www.contentful.com/developers/docs/concepts/webhooks/#webhook-signature
    }

    // Parse webhook payload
    const payload = req.body;
    const topic = req.headers["x-contentful-topic"] as string;

    console.log("📥 Contentful webhook received:", {
      topic,
      contentType: payload?.sys?.contentType?.sys?.id,
      entryId: payload?.sys?.id,
    });

    // Determine which cache keys to clear based on content type
    const contentType = payload?.sys?.contentType?.sys?.id;

    switch (contentType) {
      case "pcCase":
      case "pcMotherboard":
      case "pcCpu":
      case "pcGpu":
      case "pcRam":
      case "pcStorage":
      case "pcPsu":
      case "pcCooling":
      case "pcCaseFans":
        console.log("🔄 Clearing PC components cache");
        // Clear all PC component caches
        clearCacheByPattern("pcComponents_");
        break;

      case "optionalExtra":
        console.log("🔄 Clearing optional extras cache");
        clearCacheByPattern("pcOptionalExtras_");
        break;

      case "product":
        console.log("🔄 Clearing products cache");
        clearCacheByPattern("products_");
        break;

      case "pcBuild":
        console.log("🔄 Clearing PC builds cache");
        clearCacheByPattern("pcBuilds_");
        break;

      case "pricingTier":
        console.log("🔄 Clearing pricing tiers cache");
        clearCacheByPattern("pricingTiers_");
        break;

      default:
        console.log("🔄 Clearing all cache (unknown content type)");
        clearCache();
    }

    // Respond success
    return res.status(200).json({
      success: true,
      message: "Cache cleared successfully",
      contentType,
      topic,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Clear cache entries matching a pattern
 * Note: This requires updating cms.ts to support pattern-based clearing
 */
function clearCacheByPattern(pattern: string) {
  // Implementation depends on your cache structure
  // For now, just clear all cache
  clearCache();
}
```

### Update `services/cms.ts` to Support Pattern Clearing

Add this function to your `cms.ts` file:

```typescript
// Export cache for webhook access
export function clearCacheByPattern(pattern: string): void {
  const keysToDelete: string[] = [];

  cmsCache.forEach((_, key) => {
    if (key.startsWith(pattern)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => cmsCache.delete(key));

  console.log(
    `🗑️ Cleared ${keysToDelete.length} cache entries matching "${pattern}"`
  );
}
```

### Add Environment Variable

In your `.env` file (and Vercel dashboard):

```bash
# Optional: For webhook signature verification
CONTENTFUL_WEBHOOK_SECRET=your-secret-key-here
```

---

## Part 2: Configure Webhook in Contentful

### Step 1: Access Webhooks Settings

1. Go to [Contentful Dashboard](https://app.contentful.com)
2. Select your **Space** (Vortex PCs)
3. Navigate to **Settings** → **Webhooks**
4. Click **Add Webhook**

### Step 2: Configure Webhook Details

**Name:** `Production Cache Invalidation`

**URL:** `https://vortexpcs.com/api/webhooks/contentful`

- Replace with your actual domain
- Must be HTTPS (required by Contentful)

**Triggers:** Select these events:

- ✅ Entry: `publish`
- ✅ Entry: `unpublish`
- ✅ Entry: `delete`
- ✅ Asset: `publish`
- ✅ Asset: `unpublish`
- ✅ Asset: `delete`

**Content Types:** (Optional - filter specific types)

- If you want webhooks only for PC components:
  - Select: `pcCase`, `pcCpu`, `pcGpu`, etc.
- Or leave blank to trigger on all content types

**Headers:** (Optional)

```
Authorization: Bearer YOUR_SECRET_TOKEN
```

**Payload:**

- Leave default (Full entry payload)

### Step 3: Set Webhook Secret (Optional but Recommended)

1. Generate a random secret key:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add to Contentful webhook **Headers**:

   ```
   X-Webhook-Secret: your-generated-secret
   ```

3. Add same secret to Vercel environment variables:
   ```bash
   vercel env add CONTENTFUL_WEBHOOK_SECRET
   # Paste your secret when prompted
   ```

### Step 4: Save and Test

1. Click **Save**
2. Click **Test** (sends test webhook)
3. Check your Vercel logs:

   ```bash
   # Get your latest deployment URL
   vercel ls --prod

   # View logs for that deployment
   vercel logs https://your-deployment-url.vercel.app
   ```

4. You should see: `📥 Contentful webhook received`

---

## Part 3: Verify It's Working

### Test 1: Update Content

1. Open Contentful
2. Edit any PC component (e.g., change a GPU price)
3. Click **Publish**
4. Check Vercel logs - should see:
   ```
   📥 Contentful webhook received: { topic: 'ContentManagement.Entry.publish', ... }
   🔄 Clearing PC components cache
   🗑️ Cleared 3 cache entries matching "pcComponents_"
   ```

### Test 2: Verify Cache Cleared

1. Open your website
2. Navigate to PC Builder
3. Check browser console - should see:
   ```
   🔍 Fetching PC components from Contentful... (cache miss)
   ```
   Not:
   ```
   ✅ Returning cached PC components (cache hit)
   ```

### Test 3: Verify Fresh Data

1. The updated content should appear immediately
2. No 30-minute wait
3. Success! 🎉

---

## Part 4: Monitoring & Debugging

### View Webhook Logs in Contentful

1. Go to **Settings** → **Webhooks**
2. Click your webhook name
3. Click **Activity Log**
4. See all webhook calls, status codes, and errors

### Common Issues

#### 1. 404 Not Found

- **Cause:** Endpoint doesn't exist
- **Fix:** Ensure `api/webhooks/contentful.ts` is deployed
- **Verify:** Visit `https://vortexpcs.com/api/webhooks/contentful` (should return 405)

#### 2. 500 Internal Server Error

- **Cause:** Error in webhook handler code
- **Fix:** Check Vercel logs: `vercel logs`
- **Debug:** Add more console.log statements

#### 3. Webhook Not Triggering

- **Cause:** Contentful webhook not saved correctly
- **Fix:** Re-save webhook in Contentful dashboard
- **Verify:** Use "Test" button in Contentful

#### 4. Cache Not Clearing

- **Cause:** `clearCache()` not being called
- **Fix:** Ensure `clearCache` is exported from `cms.ts`
- **Verify:** Add console.log before calling clearCache

### Vercel Logs

View runtime logs:

```bash
# Get latest deployment URL
vercel ls --prod

# View logs for that deployment
vercel logs https://your-deployment-url.vercel.app

# Or use deployment ID (from vercel ls output)
vercel logs dpl_YOUR_DEPLOYMENT_ID
```

---

## Part 5: Advanced Configuration

### Multiple Environments

Setup separate webhooks for dev/staging/production:

**Development Webhook:**

- Name: `Dev Cache Invalidation`
- URL: `https://dev.vortexpcs.com/api/webhooks/contentful`

**Production Webhook:**

- Name: `Prod Cache Invalidation`
- URL: `https://vortexpcs.com/api/webhooks/contentful`

### Selective Cache Clearing

Instead of clearing all cache, clear only affected entries:

```typescript
// In webhook handler
const entryId = payload?.sys?.id;
const contentType = payload?.sys?.contentType?.sys?.id;

// Clear only this specific item's cache
clearCacheKey(`${contentType}_${entryId}`);
```

### Batch Updates

If you're updating many entries at once:

```typescript
// Add debouncing to prevent clearing cache too frequently
let clearCacheTimeout: NodeJS.Timeout;

function debouncedClearCache(pattern: string, delay = 5000) {
  clearTimeout(clearCacheTimeout);
  clearCacheTimeout = setTimeout(() => {
    clearCacheByPattern(pattern);
  }, delay);
}
```

### Security Enhancement

Verify webhook signatures:

```typescript
import crypto from "crypto";

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

  return computedSignature === signature;
}

// In handler:
const rawBody = JSON.stringify(req.body);
const signature = req.headers["x-contentful-webhook-signature"] as string;
const secret = process.env.CONTENTFUL_WEBHOOK_SECRET!;

if (!verifyWebhookSignature(rawBody, signature, secret)) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

---

## Part 6: Alternative: Contentful Management API

If you need more control, use Contentful Management API to poll for changes:

```typescript
// api/cron/sync-contentful.ts
import { createClient } from "contentful-management";

export default async function handler(req, res) {
  const client = createClient({
    accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
  });

  const space = await client.getSpace(process.env.VITE_CONTENTFUL_SPACE_ID!);
  const environment = await space.getEnvironment("master");

  // Get entries updated in last 30 minutes
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

  const entries = await environment.getEntries({
    "sys.updatedAt[gte]": thirtyMinsAgo.toISOString(),
  });

  if (entries.items.length > 0) {
    console.log(`Found ${entries.items.length} updated entries`);
    clearCache();
  }

  return res.json({ updated: entries.items.length });
}
```

Then setup Vercel Cron:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-contentful",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

## Summary Checklist

- [ ] Create `api/webhooks/contentful.ts` endpoint
- [ ] Add `clearCacheByPattern()` to `cms.ts`
- [ ] Deploy to Vercel
- [ ] Create webhook in Contentful dashboard
- [ ] Configure webhook URL and triggers
- [ ] Test webhook with sample entry
- [ ] Verify cache clearing in logs
- [ ] Update content and confirm immediate refresh
- [ ] Monitor webhook activity log
- [ ] Document for your team

---

## Resources

- [Contentful Webhooks Documentation](https://www.contentful.com/developers/docs/concepts/webhooks/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Webhook Signature Verification](https://www.contentful.com/developers/docs/concepts/webhooks/#webhook-signature)

---

**Next Steps:**

1. Implement the webhook endpoint (Part 1)
2. Configure webhook in Contentful (Part 2)
3. Test and verify (Part 3)
4. Enjoy instant content updates! 🎉

**Estimated Setup Time:** 30-45 minutes
