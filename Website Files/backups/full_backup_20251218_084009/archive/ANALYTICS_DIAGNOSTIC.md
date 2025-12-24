# Analytics Not Recording - Quick Diagnostic

## Issue

You downloaded a tech sheet but it didn't appear in analytics.

## Root Causes

The analytics **IS tracking** - the issue is likely one of these:

### 1. **You're Not Signed In as Admin** (Most Common)

Analytics respects cookie consent for regular users. Only admins bypass this.

**Check:**

1. Open DevTools Console (F12)
2. Run: `JSON.parse(localStorage.getItem('vortex_user') || '{}').role`
3. Should return: `"admin"`

**Fix:** Sign in with your admin account at `/admin`

---

### 2. **Cache Delay**

The admin dashboard caches data for 60 seconds to reduce Firestore reads.

**Check:**

- Wait 60 seconds after download
- Click "Refresh Now" button in Analytics Dashboard

**Fix:** Click the "Refresh Now" button or wait 1 minute

---

### 3. **Wrong Project in Firestore**

Your site might be writing to a different Firebase project than you're viewing.

**Check Firestore:**

1. Go to: https://console.firebase.google.com/project/vortexpcs/firestore/data
2. Open collection: `analytics_events`
3. Look for recent documents with `eventType: "download"`
4. Should see your tech sheet download within last few minutes

**If not there:** Firebase isn't receiving the events (network issue or consent blocking)

---

### 4. **Cookie Consent Not Accepted**

Even though admins bypass consent, you need to be **signed in**.

**Check:**

```javascript
// Run in Console (F12)
const consent = localStorage.getItem("vortex_cookie_consent");
const user = localStorage.getItem("vortex_user");
console.log("Consent:", consent);
console.log("User:", user ? JSON.parse(user).role : "Not signed in");
```

**What you should see:**

- User: `"admin"` ← This is critical
- Consent: Can be anything (admins bypass)

---

## Quick Test

### Step 1: Open Console (F12)

Press F12 in your browser to open DevTools

### Step 2: Run This Test

```javascript
// Test if analytics is working
(async () => {
  console.log("🔍 Analytics Diagnostic Test");

  // Check user status
  const user = localStorage.getItem("vortex_user");
  const userObj = user ? JSON.parse(user) : null;
  console.log("1. User:", userObj?.email, "Role:", userObj?.role);

  // Check session
  const sessionId = sessionStorage.getItem("vortex_session_id");
  console.log("2. Session ID:", sessionId || "NOT INITIALIZED");

  // Check consent
  const consent = localStorage.getItem("vortex_cookie_consent");
  console.log("3. Consent:", consent);

  // Test download tracking
  console.log("4. Sending test download event...");
  const payload = {
    kind: "event",
    payload: {
      sessionId: sessionId || "test_" + Date.now(),
      eventType: "download",
      eventData: {
        fileName: "DIAGNOSTIC_TEST.pdf",
        source: "diagnostic_script",
      },
      timestamp: new Date().toISOString(),
      page: "/diagnostic",
    },
  };

  const response = await fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log(
    "5. Response:",
    response.status,
    response.ok ? "✅ SUCCESS" : "❌ FAILED"
  );

  if (response.ok) {
    console.log("✅ Analytics is working! Check Firestore in 5 seconds.");
    console.log(
      "   https://console.firebase.google.com/project/vortexpcs/firestore/data/analytics_events"
    );
  } else {
    const error = await response.text();
    console.error("❌ Analytics failed:", error);
  }
})();
```

### Step 3: Wait 5 Seconds

### Step 4: Check Firestore

1. Go to: https://console.firebase.google.com/project/vortexpcs/firestore/data/analytics_events
2. Look for a document with:
   - `eventType: "download"`
   - `eventData.fileName: "DIAGNOSTIC_TEST.pdf"`
   - Recent timestamp (last 1 minute)

**If you see it:** ✅ Analytics IS working - the issue is display/cache delay

**If NOT:** ❌ Events aren't reaching Firestore - check network tab for errors

---

## Solutions Based on Test Results

### ✅ Test Passed (Event in Firestore)

**Problem:** Data is recording but not showing in dashboard

**Solutions:**

1. **Wait 60 seconds** - Dashboard cache expires after 1 minute
2. **Click "Refresh Now"** in Analytics Dashboard
3. **Check date range** - Make sure you're viewing "Last 7 Days" or "Last 30 Days"
4. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)

### ❌ Test Failed (No event in Firestore)

**Problem:** Events not reaching backend

**Solutions:**

1. **Check Network Tab** (F12 → Network)

   - Filter by "track"
   - Look for `/api/analytics/track` requests
   - If Status 401: Not signed in as admin
   - If Status 403: Permission denied
   - If Status 500: Server error

2. **Sign In as Admin**

   - Go to: https://your-site.com/admin
   - Sign in with admin credentials
   - Run diagnostic test again

3. **Check Firestore Rules**
   - Go to: https://console.firebase.google.com/project/vortexpcs/firestore/rules
   - Verify `analytics_events` has `allow create: if true;`
   - Should be line ~167 in firestore.rules

---

## Common Mistakes

### ❌ Not Signed In

Analytics requires admin login to bypass consent.

**Fix:** Sign in at `/admin` first

### ❌ Looking at Wrong Dashboard

The AnalyticsDashboard component shows real data.
The AdminPanel statistics might use old data source.

**Fix:** Go to Admin Panel → Analytics tab (the dedicated one)

### ❌ Wrong Time Period

Default is "Last 7 Days" - your download might be outside that.

**Fix:** Change to "Last 30 Days" or "Last 90 Days"

### ❌ Browser Cache

Old JavaScript might be cached.

**Fix:** Hard refresh (Ctrl+Shift+R) or clear cache

---

## Verify Everything is Working

### Check 1: Session Initialized

```javascript
// Console (F12)
sessionStorage.getItem("vortex_session_id");
// Should return: "session_1234567890_xxxxx"
```

### Check 2: User is Admin

```javascript
// Console (F12)
JSON.parse(localStorage.getItem("vortex_user")).role;
// Should return: "admin"
```

### Check 3: Download Events in Firestore

1. Open: https://console.firebase.google.com/project/vortexpcs/firestore/data/analytics_events
2. Filter by `eventType == "download"`
3. Should see recent downloads

### Check 4: Dashboard Shows Data

1. Go to: Admin Panel → Analytics tab
2. Wait 60 seconds (cache expiry)
3. Click "Refresh Now"
4. Should see download stats

---

## Still Not Working?

### Debug Logs

Open Console (F12) and look for these messages when you download a tech sheet:

**Expected:**

```
[PCBuilder] Tech sheet download clicked {component: "...", category: "..."}
📊 [Analytics] Tracking event via API
✅ [Analytics] Event tracked successfully via API
```

**If you see:**

```
❌ [Analytics] Failed to track event
```

Then check Network tab for the error.

### Network Tab

1. Open DevTools → Network tab
2. Download a tech sheet
3. Look for `/api/analytics/track` request
4. Check:
   - **Status:** Should be 200
   - **Response:** Should be `{"success": true}`
   - **Payload:** Should contain `eventType: "download"`

---

## Final Checklist

Before contacting support, verify:

- [ ] Signed in as admin (check localStorage.getItem('vortex_user'))
- [ ] Session initialized (check sessionStorage.getItem('vortex_session_id'))
- [ ] Download creates console log: "[PCBuilder] Tech sheet download clicked"
- [ ] Network request to `/api/analytics/track` returns 200
- [ ] Event appears in Firestore analytics_events collection
- [ ] Waited 60+ seconds and clicked "Refresh Now" in dashboard
- [ ] Checked correct time period (Last 30 Days)

If all checked ✅ but still not showing, the issue is in the admin panel display logic.

---

## Quick Fix Commands

### Force Analytics Initialization

```javascript
// Run in Console (F12)
import { initializeSessionTracking } from "./services/sessionTracker";
const user = JSON.parse(localStorage.getItem("vortex_user") || "{}");
initializeSessionTracking(user.uid);
console.log("Session ID:", sessionStorage.getItem("vortex_session_id"));
```

### Clear All Cache and Reset

```javascript
// Run in Console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then sign in again and test.

---

## Expected Timeline

After downloading a tech sheet:

- **Immediate (0s):** Console log "[PCBuilder] Tech sheet download clicked"
- **0-2s:** Network request completes with 200 status
- **2-5s:** Event appears in Firestore analytics_events collection
- **60s:** Admin dashboard cache expires
- **After "Refresh Now":** Download appears in dashboard stats

---

## Contact Support

If after following this guide you still have issues:

1. Screenshot the Console (F12) showing:

   - User role
   - Session ID
   - Any error messages

2. Screenshot Network tab showing:

   - `/api/analytics/track` request/response
   - Status code and payload

3. Screenshot Firestore showing:
   - analytics_events collection (or that it's empty)
   - Timestamp of last event

This will help debug the specific issue.
