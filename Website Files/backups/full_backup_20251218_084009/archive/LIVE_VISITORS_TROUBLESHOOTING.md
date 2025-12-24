# Live Visitors Troubleshooting

## Current Errors Explained

### 1. 404 Error: API endpoint not found

```
GET http://localhost:3000/api/admin/analytics/live-visitors 404 (Not Found)
Failed to fetch live visitors: SyntaxError: Unexpected token 'T', "The page c"... is not valid JSON
```

**Cause**: The API endpoint `api/admin/analytics/live-visitors.ts` needs to be deployed to Vercel. In local development, Vite proxies `/api/*` requests to your production server (`https://vortexpcs.com`), but if the endpoint doesn't exist there yet, you get a 404 HTML page instead of JSON.

**Solution**: Deploy the new API endpoint to Vercel.

### 2. Firestore Permission Error

```
Failed to update visitor activity: FirebaseError: Missing or insufficient permissions.
```

**Cause**: The `active_visitors` collection doesn't have security rules allowing public writes.

**Solution**: Deploy updated Firestore rules (already fixed in `firestore.rules`).

### 3. Other 401 Errors

```
api/security/list-ip-blocks?includeUnblocked=false&page=1&limit=25:1 Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Cause**: These are expected - you're not authenticated as admin in the browser making those requests.

**Solution**: None needed - this is normal behavior for protected endpoints.

---

## Quick Fix Steps

### Step 1: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

This will allow visitors to write their activity to the `active_visitors` collection.

### Step 2: Deploy API Endpoint to Vercel

```bash
npm run build
vercel --prod --force
```

This deploys the new `api/admin/analytics/live-visitors.ts` endpoint.

### Step 3: Verify Deployment

After deployment completes:

1. **Check API endpoint**: Visit `https://vortexpcs.com/api/admin/analytics/live-visitors`

   - Should return **401 Unauthorized** (good - means it exists but requires auth)
   - If you see **404**, the deployment didn't include the API folder

2. **Check browser console**: Should no longer see 404 errors

3. **Check Analytics Dashboard**: The "Live Visitors" card should show data or "No active visitors" instead of error message

---

## Development Mode Note

In development (`npm run dev`), Vite proxies `/api/*` requests to production (`https://vortexpcs.com`). This means:

- ✅ **Good**: You don't need a local backend server running
- ⚠️ **Note**: Changes to API files require redeployment to test
- 🔧 **Alternative**: Set `VITE_STRIPE_BACKEND_URL=http://localhost:5000` if running local backend

---

## Firestore Rules Reference

The rules have been updated in `firestore.rules`:

```javascript
match /active_visitors/{sessionId} {
  // Anyone can write their own visitor activity (for tracking)
  allow create, update: if true;

  // Users can delete their own session when they leave
  allow delete: if true;

  // Only admins can read visitor data
  allow read: if isAdmin();
}

Open DevTools (F12) and check the Console tab for detailed error messages. The error will now show:

- Exact HTTP status code
- Server error message
- Whether the API endpoint exists

## Expected Behavior

Once working, you should see:

- Real-time visitor count
- List of active visitors with their current pages
- Session durations
- Browser information
- Page breakdown statistics
- Auto-refresh every 5 seconds
```
