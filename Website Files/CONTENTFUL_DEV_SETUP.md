# How to Enable Contentful in Dev Mode

To pull brand logos from Contentful even in dev mode, follow these steps:

## Step 1: Get Your Contentful Credentials

1. Log in to your Contentful account at https://app.contentful.com/
2. Go to Settings → API Keys
3. Find or create a Content Delivery API token
4. Copy:
   - **Space ID** (usually shown in the URL or settings)
   - **Access Token** (Delivery API Token - NOT Preview Token)

## Step 2: Update .env.local

Add these lines to your `.env.local` file (replace with your actual values):

```env
# Contentful CMS Configuration
VITE_CONTENTFUL_SPACE_ID=your_space_id_here
VITE_CONTENTFUL_ACCESS_TOKEN=your_delivery_api_token_here
```

For example:

```env
VITE_CONTENTFUL_SPACE_ID=abc123xyz789
VITE_CONTENTFUL_ACCESS_TOKEN=cfpat-xyz123...
```

## Step 3: Restart Dev Server

After adding the credentials, restart your dev server:

```bash
npm run dev
```

The dev server will automatically pick up the new environment variables.

## Step 4: Verify It's Working

In the browser console, you should see:

```
✅ [PCBuilder] Loaded X case components
✅ [PCBuilder] Loaded X motherboard components
...
✅ Using CMS data for PC Builder
```

If you still see "using fallback hardcoded data", double-check your credentials.

## Where to Find Your Credentials

**Space ID:**

- Log in to Contentful
- Go to "Settings" (⚙️ icon top right)
- The Space ID is shown in the URL: `https://app.contentful.com/spaces/[SPACE_ID]/settings/...`

**Access Token:**

- Settings → API Keys → Content Delivery API
- Click the token you want to use
- Copy the "Access Token" value (it looks like `cfpat-...` or similar)

## FAQ

**Q: Will this work with existing mock data?**
A: Yes! If Contentful is unavailable, it will fall back to mock data.

**Q: Why are brand logos missing in dev mode?**
A: Mock data in `components/data/pcBuilderComponents.ts` doesn't include Contentful brandLogo URLs. With Contentful enabled, you get the actual URLs.

**Q: Is this secure?**
A: The Delivery API token is read-only and safe to use in frontend code. Treat it like your repo visibility.

## Troubleshooting

**Logos still not showing?**

1. Clear browser cache (Cmd+Shift+Delete)
2. Check browser console for errors
3. Verify token is correct (copy-paste again)
4. Make sure components actually have brandLogo fields in Contentful

**No components loading at all?**

1. Check that Contentful content types exist (pcCase, pcCpu, etc.)
2. Verify at least one entry is published
3. Look at browser console network tab for 401/403 errors

**Getting "invalid token" error?**

- The token may have wrong permissions
- Generate a new Delivery API token in Contentful Settings → API Keys
