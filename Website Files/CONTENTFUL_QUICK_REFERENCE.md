# ⚡ Quick Start: Contentful in Dev Mode

**Goal:** Pull brand logos from Contentful even when developing locally

## TL;DR - 2 Minutes

1. **Get your Contentful credentials:**

   - Go to https://app.contentful.com/ → Settings → API Keys
   - Copy **Space ID** and **Access Token**

2. **Add to `.env.local`:**

   ```env
   VITE_CONTENTFUL_SPACE_ID=your_space_id_here
   VITE_CONTENTFUL_ACCESS_TOKEN=your_delivery_api_token_here
   ```

3. **Restart dev server:**

   ```bash
   npm run dev
   ```

4. **Check browser console:**
   - You should see: `✅ Using CMS data for PC Builder`
   - Brand logos should now load from Contentful ✅

---

## Why This Matters

| Scenario                  | Result                                   |
| ------------------------- | ---------------------------------------- |
| Without Contentful in dev | Fallback brand-name map (Wikipedia SVGs) |
| With Contentful in dev    | **Actual Contentful brandLogo URLs**     |
| Without this setup        | Logos inconsistent between dev and prod  |
| With this setup           | Logos always from Contentful ✅          |

---

## Verify Setup

Run to check your configuration:

```bash
node scripts/verify-contentful.js
```

Expected output:

```
✅ Space ID configured: abc123...
✅ Access Token configured: cfpat...
✅ Configuration looks good!
```

---

## Troubleshooting

| Issue                      | Solution                                          |
| -------------------------- | ------------------------------------------------- |
| Logos still missing        | Clear cache (Cmd+Shift+Del), restart browser      |
| No components loading      | Verify Space ID is correct                        |
| 401/403 error in console   | Regenerate Access Token in Contentful Settings    |
| Still seeing fallback data | Check console for warnings about missing env vars |

---

## Where Logos Come From

1. **Contentful** has components with `brandLogo` field (e.g., Corsair, NZXT)
2. **cms.ts** fetches these and extracts the `brandLogo` URL
3. **BrandLogo component** renders the image with fallback handling
4. **PCBuilder** uses this across all product cards

**With Contentful in dev:** You get actual URLs from Contentful  
**Without Contentful in dev:** You get Wikipedia SVG fallbacks

---

## File Locations

- **Setup guide:** `CONTENTFUL_DEV_SETUP.md` (detailed)
- **Env template:** `.env.local` (add credentials here)
- **Verify script:** `scripts/verify-contentful.js`
- **Config:** `config/contentful.ts`
- **CMS service:** `services/cms.ts`
- **Component renderer:** `components/ui/brand-logo.tsx`

---

## Security Notes

✅ **Safe to add to .env.local:**

- Space ID (public, identifies which account)
- Delivery API Token (read-only, frontend-safe)

❌ **Never commit:**

- .env.local file (use .gitignore)
- Preview tokens or secret keys

---

## Questions?

1. See `CONTENTFUL_DEV_SETUP.md` for detailed instructions
2. Check browser console → Console tab for debug messages
3. Look for warnings like: "⚠️ Contentful not configured..."

---

**Status:** Once configured, brand logos will automatically pull from Contentful in both dev and prod modes! 🎉
