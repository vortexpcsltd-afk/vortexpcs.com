# Troubleshooting: Optional Extras Not Showing on Frontend

## Quick Diagnosis Steps

### 1. Check Contentful Entry Status

In Contentful:

1. Go to https://app.contentful.com/spaces/a40jvx2pmnlr/entries
2. Filter by **Content Type**: `Optional Extra`
3. Find your new keyboard entry
4. **Check the status** - it MUST be **Published** (green dot), not just saved as a draft

**Common Issue**: Entries saved as draft won't appear on the frontend. Click **Publish** in the top right.

### 2. Verify Entry Fields

Make sure your keyboard entry has:

- ✅ **extraId**: e.g., `kb-4` (unique, no duplicates)
- ✅ **name**: Full product name
- ✅ **category**: Must use the PLURAL form from dropdown (e.g., `keyboards`, not `keyboard`)
- ✅ **price**: Numeric value
- ✅ **inStock**: Set to `true` (or leave empty, defaults to true)

**Valid Categories** (must match exactly):

- `keyboards` (for keyboards)
- `mice` (for mice/mouse)
- `monitors` (for monitors)
- `gamepads` (for gamepads/controllers)
- `mousepads` (for mousepads)
- `headsets` (for headsets)
- `cables` (for cables)
- `software` (for software)

### 3. Clear Browser Cache

The website may be showing cached data:

**Method 1: Hard Refresh**

- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Method 2: Clear Site Data**

1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Click **Clear site data**
4. Reload the page

### 4. Check Browser Console

1. Open DevTools (`F12`)
2. Go to **Console** tab
3. Reload the page
4. Look for messages like:
   - `🔍 Fetching PC optional extras from Contentful...`
   - `📦 Found X optional extras from CMS`
   - `✅ Loaded X keyboard optional extras`

**What to look for:**

- If you see `Found 0 optional extras`, the API isn't returning your item
- If you see errors in red, there's a configuration issue

### 5. Use the CMS Diagnostics Tool

The website has a built-in diagnostics tool:

1. Add `#cms-diagnostics` to your URL:

   ```
   https://www.vortexpcs.com/#cms-diagnostics
   ```

   Or locally:

   ```
   http://localhost:3000/#cms-diagnostics
   ```

2. Click **Fetch Optional Extras**
3. Check the **keyboard** category
4. Your new entry should appear in the list

### 6. Verify Contentful API Directly

Test the Contentful API directly:

```bash
curl "https://cdn.contentful.com/spaces/a40jvx2pmnlr/entries?access_token=Dw3YkppsnKVQilrvKI5nF2jbVeSo9mXNLWAhEtbx6pU&content_type=optionalExtra&fields.category=keyboards"
```

**Expected**: You should see your keyboard entry in the response JSON.

### 7. Check Network Tab

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Reload the page
4. Filter by **Fetch/XHR**
5. Look for requests to `contentful.com`
6. Click on the request and check the **Response**

**Common Issue**: If you see a 401 error, the API token is invalid.

## Common Solutions

### Solution 1: Republish the Entry

Sometimes Contentful needs entries to be republished:

1. Open your keyboard entry in Contentful
2. Click **Unpublish** (if published)
3. Wait 10 seconds
4. Click **Publish** again

### Solution 2: Wait for CDN Propagation

Contentful uses a CDN that can take 1-5 minutes to update:

- After publishing, wait **5 minutes**
- Then hard refresh your browser

### Solution 3: Check the Fallback Data

If Contentful fails, the website uses fallback data from `components/PCBuilder.tsx` (line ~1040). Your keyboard won't show unless it's in Contentful OR you add it to the fallback data.

To add to fallback (temporary workaround):

1. Open `components/PCBuilder.tsx`
2. Find the `peripheralsData.keyboard` array (around line 1040)
3. Add your keyboard:

```typescript
{
  id: "kb-4",
  name: "Your Keyboard Name",
  price: 199.99,
  type: "Mechanical",
  switches: "Cherry MX Red",
  rgb: true,
  wireless: false,
  rating: 4.8,
  description: "Your keyboard description",
  images: Array(4).fill(PLACEHOLDER_IMAGE),
},
```

4. Save and rebuild: `npm run dev`

### Solution 4: Check Environment Variables

Verify your `.env` file has:

```
VITE_CONTENTFUL_ACCESS_TOKEN="Dw3YkppsnKVQilrvKI5nF2jbVeSo9mXNLWAhEtbx6pU"
VITE_CONTENTFUL_SPACE_ID="a40jvx2pmnlr"
```

If you changed these, restart the dev server:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Debugging Checklist

- [ ] Entry is **Published** in Contentful (not draft)
- [ ] **category** field = `keyboards` (plural form from dropdown)
- [ ] **extraId** is unique (e.g., `kb-4`)
- [ ] **price** is a number
- [ ] Waited 5 minutes after publishing
- [ ] Hard refreshed browser (`Ctrl+Shift+R`)
- [ ] Checked browser console for errors
- [ ] Tested with CMS Diagnostics tool
- [ ] Dev server is running if testing locally

## Still Not Working?

1. **Export your Contentful entry**:

   - In Contentful, click on your entry
   - Copy the entry ID
   - Share the entry ID or screenshot the entry details

2. **Check the browser console** and share:

   - Any red errors
   - The output of the `📦 Found X optional extras` message

3. **Verify the fetch is working**:
   - Open console and run:
   ```javascript
   fetch(
     "https://cdn.contentful.com/spaces/a40jvx2pmnlr/entries?access_token=Dw3YkppsnKVQilrvKI5nF2jbVeSo9mXNLWAhEtbx6pU&content_type=optionalExtra&fields.category=keyboard"
   )
     .then((r) => r.json())
     .then((d) => console.log("Keyboards:", d.items.length, d.items));
   ```
   - Check if your entry appears in the output

## Quick Test

Run this in the browser console on your website:

```javascript
// Check if CMS data is being used
console.log("Using CMS?", window.localStorage.getItem("cms_diagnostics"));

// Force reload CMS data
window.location.reload();
```

---

**Most Common Fix**: Publish the entry in Contentful + hard refresh browser (`Ctrl+Shift+R`) + wait 2 minutes.
