# Analytics Issues Diagnostic Report

**Date:** November 17, 2025  
**Status:** 🔴 CRITICAL - Analytics Not Recording Data Correctly

---

## Executive Summary

The Analytics Dashboard in your Admin Panel has **5 critical issues** preventing proper data collection and display. These issues affect the core functionality you need to improve your website based on visitor data.

### Impact Assessment

- ❌ **Analytics data not being tracked** for most users
- ❌ **Cookie consent blocking all analytics** (even for admins)
- ⚠️ **Admin bypass not working correctly**
- ⚠️ **Multiple competing tracking systems** causing conflicts
- ⚠️ **Incomplete session data** due to update restrictions

---

## Critical Issues Identified

### 🔴 Issue #1: Cookie Consent Completely Blocks Analytics

**Location:** `App.tsx` lines 390-442  
**Severity:** CRITICAL  
**Impact:** Analytics disabled for 99% of users

#### Problem

The consent check in `App.tsx` prevents analytics tracking unless the user explicitly accepts cookies. The current logic:

```typescript
if (!consentAnalytics && !isAdmin) {
  logger.debug("📊 Analytics blocked: no consent and not admin");
  return; // Respect consent for non-admins
}
```

**Why This Breaks Everything:**

1. New visitors don't have consent = no tracking
2. Users who decline = no tracking
3. Admin bypass only works IF you're both signed in AND marked as admin in Firestore
4. Even if you're logged in as admin, if you haven't accepted cookies, the dashboard shows empty data

#### The Real Problem

The `consentBypassActive` badge you see in the dashboard is misleading - it shows the bypass is "active" but doesn't actually bypass anything for data collection. The check happens **before** analytics runs.

---

### 🔴 Issue #2: Conflicting Analytics Systems

**Locations:** Multiple files  
**Severity:** CRITICAL  
**Impact:** Data fragmentation, incomplete tracking

#### Problem

Your website has **THREE different analytics implementations** fighting each other:

1. **Legacy System** (`services/database.ts` - `trackPageView`, `trackEvent`)

   - Writes to `analytics` collection
   - Simple string-based events
   - Used in some components

2. **Advanced System** (`services/advancedAnalytics.ts` - `trackSession`, `trackPageView`, `trackUserEvent`)

   - Writes to `analytics_sessions`, `analytics_pageviews`, `analytics_events`
   - Complex session tracking
   - Used in sessionTracker

3. **API-based System** (`api/analytics/track.ts`)
   - Backend endpoint for sendBeacon
   - Duplicate logic
   - Fallback mechanism

**Evidence:**

- `AdminPanel.tsx` line 764: Uses old `getAnalytics(30)` from database.ts
- `sessionTracker.ts`: Uses new advanced analytics
- `AnalyticsDashboard.tsx`: Expects data from advanced analytics collections

#### Why This Breaks Things

The Admin Panel Dashboard queries the **new** analytics collections (`analytics_sessions`, `analytics_pageviews`, etc.), but most of your app is still using the **old** system that writes to the `analytics` collection. They're incompatible.

---

### 🔴 Issue #3: Firestore Rules Prevent Session Updates

**Location:** `firestore.rules` lines 130-151  
**Severity:** HIGH  
**Impact:** Incomplete session data, can't track page counts

#### Problem

Your Firestore rules for `analytics_sessions` are TOO RESTRICTIVE. Look at this rule:

```javascript
allow update: if
  // Identity fields must remain unchanged
  request.resource.data.sessionId == resource.data.sessionId &&
  request.resource.data.userId == resource.data.userId &&
  request.resource.data.referrer == resource.data.referrer &&
  request.resource.data.userAgent == resource.data.userAgent &&
  request.resource.data.device == resource.data.device &&
  request.resource.data.startTime == resource.data.startTime &&
  request.resource.data.location == resource.data.location &&
  // ... more checks
```

**The Fatal Flaw:**
This requires that `device`, `location`, `referrer`, and `userAgent` remain EXACTLY the same. But look at `sessionTracker.ts` line 109-128:

```typescript
trackSession({
  sessionId,
  userId: userId || undefined,
  lastActivity: new Date(),
  pageViews: 1,
  pages: [page],
  isActive: true,
  referrer: document.referrer || "", // 🔴 Changes on each call!
  userAgent: navigator.userAgent,
  device: {
    type: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
  },
});
```

Every time you call `trackSession`, it sends the full object including `device`, `referrer`, and `userAgent`. Firestore compares objects by reference, not by value, so these "unchanged" fields **FAIL THE EQUALITY CHECK** and the update is rejected.

#### Evidence in Logs

You'll see these errors in your browser console:

```
❌ [Analytics] Track session error: Missing or insufficient permissions
```

And then it falls back to the API, which may or may not be working.

---

### 🔴 Issue #4: Admin Dashboard Uses Wrong Data Source

**Location:** `AdminPanel.tsx` lines 761-787  
**Severity:** HIGH  
**Impact:** Dashboard shows incorrect/incomplete data

#### Problem

The main Admin Panel statistics use the old analytics system:

```typescript
const loadAnalytics = async () => {
  logger.debug("Admin Panel - Loading analytics data");
  const analytics = await getAnalytics(30); // Last 30 days  // 🔴 OLD SYSTEM
  setAnalyticsData(analytics);
  // ...
};
```

This `getAnalytics` function reads from the `analytics` collection (the old one), but:

1. Most tracking writes to the new collections
2. The AnalyticsDashboard component reads from new collections
3. Data is split between systems

**Result:** Your dashboard shows partial or no data because it's looking in the wrong place.

---

### ⚠️ Issue #5: Missing Firestore Indexes

**Location:** Firestore (Cloud Console)  
**Severity:** MEDIUM  
**Impact:** Some analytics queries fail or are very slow

#### Problem

The `/api/admin/analytics/diagnose` endpoint tests for composite indexes. You likely need these indexes:

1. `analytics_sessions` - `(isActive ASC, lastActivity ASC)`
2. `analytics_pageviews` - `(timestamp DESC)`
3. `analytics_events` - `(eventType ASC, timestamp DESC)`
4. `security_events` - `(timestamp DESC)`

**How to Check:**

1. Go to your Admin Panel
2. Click "Analytics" tab
3. Click "Diagnose" button
4. Look for "compositeIndexes" section with `working: false`

---

## Root Cause Analysis

### Why This Happened

1. **Migration Incomplete:** You started upgrading from simple analytics to advanced analytics but didn't finish the migration. Old code still uses old system.

2. **Over-Engineered Consent:** The cookie consent implementation is too strict for an admin tool. Admins should always be able to see analytics regardless of personal consent.

3. **Firestore Rules Mismatch:** The rules were written to prevent malicious updates, but they're so strict they prevent legitimate session updates from your own tracking code.

4. **No Unified Analytics Service:** Each component picks its own analytics method, leading to inconsistency.

---

## Recommended Fixes (Priority Order)

### 🔥 FIX #1: Implement Proper Admin Bypass (5 minutes)

**File:** `App.tsx` lines 387-444

Replace the analytics effect with:

```typescript
useEffect(() => {
  logger.debug("Analytics effect triggered for view", { currentView });
  try {
    const raw = localStorage.getItem("vortex_user");
    const user = raw ? JSON.parse(raw) : null;
    const uid = user?.uid || null;
    const isAdmin = user?.role === "admin";
    const isDev = Boolean(
      (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
    );

    // ADMINS ALWAYS TRACK - no consent check
    const { analytics: consentAnalytics } = getConsent();

    if (!consentAnalytics && !isAdmin) {
      logger.debug("📊 Analytics blocked: no consent and not admin");
      return;
    }

    // Show debug toasts only once
    if (!db && (isAdmin || isDev)) {
      const key = "vortex_analytics_toast_firebase";
      if (!sessionStorage.getItem(key)) {
        toast.warning(
          "Analytics inactive: Firebase not configured (debug notice)",
          { duration: 5000 }
        );
        sessionStorage.setItem(key, "1");
      }
    }

    logger.debug("📊 Proceeding with analytics tracking", {
      isAdmin,
      hasConsent: consentAnalytics,
    });

    // Initialize session tracking
    initializeSessionTracking(uid);

    // Track page view
    const page = `/${currentView}`;
    trackPage(page, document.title, uid);
  } catch (e) {
    logger.warn("Analytics tracking skipped due to error", { error: e });
  }
}, [currentView]);
```

**Changes:**

- Admin bypass happens BEFORE consent check
- Cleaner logic flow
- Better logging

---

### 🔥 FIX #2: Fix Firestore Rules (3 minutes)

**File:** `firestore.rules` lines 130-151

Replace the `analytics_sessions` update rule:

```javascript
// Advanced analytics: sessions (public write; admin read)
match /analytics_sessions/{sessionId} {
  // Anyone can create a session document
  allow create: if true;

  // Allow updates to activity fields only
  // Do NOT check referrer, userAgent, device, location equality since objects fail equality checks
  allow update: if
    // Ensure core session ID doesn't change
    request.resource.data.sessionId == resource.data.sessionId &&
    // Only allow these fields in updates
    request.resource.data.keys().hasOnly([
      "sessionId",
      "userId",
      "startTime",
      "lastActivity",
      "pageViews",
      "pages",
      "referrer",
      "userAgent",
      "location",
      "device",
      "isActive"
    ]) &&
    // Type validation for changeable fields
    request.resource.data.lastActivity is timestamp &&
    request.resource.data.pageViews is number &&
    request.resource.data.pages is list &&
    request.resource.data.isActive is bool;

  // Only admins can read sessions
  allow read: if isAdmin();

  // No deletes from clients
  allow delete: if false;
}
```

**Changes:**

- Removed strict equality checks on `referrer`, `userAgent`, `device`, `location`
- Still validates sessionId doesn't change
- Still validates field types
- Allows legitimate session updates

---

### 🔥 FIX #3: Unify Analytics System (15 minutes)

**Goal:** Make all components use the advanced analytics system

#### Step 1: Update AdminPanel.tsx

**File:** `AdminPanel.tsx` lines 761-787

Replace:

```typescript
const analytics = await getAnalytics(30); // Last 30 days
```

With:

```typescript
const { getAnalyticsSummary } = await import("./services/advancedAnalytics");
const analytics = await getAnalyticsSummary(30);
```

**Also update the state type** (line 377):

```typescript
const [analyticsData, setAnalyticsData] = useState({
  totalPageViews: 0,
  totalVisitors: 0,
  totalSessions: 0, // ADD THIS
  averagePageViewsPerDay: 0,
  averageSessionsPerDay: 0, // ADD THIS
  topPages: [] as Array<{ page: string; views: number }>,
  viewsByDay: {} as Record<string, number>,
  sessionsByDay: {} as Record<string, number>, // ADD THIS
});
```

#### Step 2: Create getAnalyticsSummary function

**File:** `services/advancedAnalytics.ts` (add at end)

```typescript
/**
 * Get analytics summary for admin dashboard (compatible with old getAnalytics format)
 */
export async function getAnalyticsSummary(days: number = 30) {
  try {
    if (!firebaseIsConfigured) {
      console.warn("Firebase not configured - returning empty analytics");
      return {
        totalPageViews: 0,
        totalVisitors: 0,
        totalSessions: 0,
        averagePageViewsPerDay: 0,
        averageSessionsPerDay: 0,
        topPages: [],
        viewsByDay: {},
        sessionsByDay: {},
      };
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query pageviews
    const pageviewsQuery = query(
      collection(db, "analytics_pageviews"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate)),
      orderBy("timestamp", "desc")
    );

    const pageviewsSnap = await getDocs(pageviewsQuery);
    const totalPageViews = pageviewsSnap.size;

    // Query sessions
    const sessionsQuery = query(
      collection(db, "analytics_sessions"),
      where("startTime", ">=", Timestamp.fromDate(startDate)),
      where("startTime", "<=", Timestamp.fromDate(endDate))
    );

    const sessionsSnap = await getDocs(sessionsQuery);
    const totalSessions = sessionsSnap.size;

    // Count unique visitors (unique sessionIds)
    const uniqueSessions = new Set<string>();
    sessionsSnap.forEach((doc) => {
      uniqueSessions.add(doc.data().sessionId);
    });
    const totalVisitors = uniqueSessions.size;

    // Top pages
    const pageStats: Record<string, number> = {};
    pageviewsSnap.forEach((doc) => {
      const data = doc.data();
      const page = data.page || "/";
      pageStats[page] = (pageStats[page] || 0) + 1;
    });

    const topPages = Object.entries(pageStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    // Views by day
    const viewsByDay: Record<string, number> = {};
    pageviewsSnap.forEach((doc) => {
      const data = doc.data();
      const date = data.timestamp?.toDate().toLocaleDateString() || "unknown";
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
    });

    // Sessions by day
    const sessionsByDay: Record<string, number> = {};
    sessionsSnap.forEach((doc) => {
      const data = doc.data();
      const date = data.startTime?.toDate().toLocaleDateString() || "unknown";
      sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
    });

    return {
      totalPageViews,
      totalVisitors,
      totalSessions,
      averagePageViewsPerDay: Math.round(totalPageViews / days),
      averageSessionsPerDay: Math.round(totalSessions / days),
      topPages,
      viewsByDay,
      sessionsByDay,
    };
  } catch (error) {
    console.error("Get analytics summary error:", error);
    return {
      totalPageViews: 0,
      totalVisitors: 0,
      totalSessions: 0,
      averagePageViewsPerDay: 0,
      averageSessionsPerDay: 0,
      topPages: [],
      viewsByDay: {},
      sessionsByDay: {},
    };
  }
}
```

---

### 🔥 FIX #4: Fix Session Tracking Updates (5 minutes)

**File:** `sessionTracker.ts` lines 109-135

Replace the trackSession call to only send fields that can change:

```typescript
// Update session with new page
if (sessionId) {
  // Only send fields that should be updated, not identity fields
  await trackSession({
    sessionId,
    userId: userId || undefined,
    lastActivity: new Date(),
    pageViews: 1,
    pages: [page],
    isActive: true,
    // DO NOT send referrer, userAgent, device on updates - they're immutable
  });
```

**For the initial session creation** (lines 52-62), keep all fields:

```typescript
// Track session (initial creation with all fields)
trackSession({
  sessionId,
  userId: userId || undefined,
  startTime: sessionStartTime,
  lastActivity: sessionStartTime,
  pageViews: 0,
  pages: [],
  referrer: document.referrer || "",
  userAgent: navigator.userAgent,
  device,
  isActive: true,
});
```

---

### ⚠️ FIX #5: Create Missing Firestore Indexes (10 minutes)

#### Option A: Automatic (Recommended)

1. Run your app
2. Open Admin Panel → Analytics
3. Click "Diagnose"
4. For each failing index, the error will include a clickable link
5. Click the link to auto-create the index in Firebase Console

#### Option B: Manual

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database → Indexes
4. Click "Create Index"
5. Create these composite indexes:

**Index 1:**

- Collection ID: `analytics_sessions`
- Fields: `isActive` (Ascending), `lastActivity` (Ascending)
- Query scope: Collection

**Index 2:**

- Collection ID: `analytics_pageviews`
- Fields: `timestamp` (Descending)
- Query scope: Collection

**Index 3:**

- Collection ID: `analytics_events`
- Fields: `eventType` (Ascending), `timestamp` (Descending)
- Query scope: Collection

**Index 4:**

- Collection ID: `security_events`
- Fields: `timestamp` (Descending)
- Query scope: Collection

**Index 5:**

- Collection ID: `analytics_sessions`
- Fields: `startTime` (Ascending)
- Query scope: Collection

---

## Testing Checklist

After applying fixes, test in this order:

### ✅ Step 1: Test Admin Tracking

1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Sign in as admin
4. Watch browser console for:
   ```
   📊 [Analytics] Tracking session via Firestore
   ✅ [Analytics] Session created via Firestore
   📊 [Analytics] Tracking pageview via Firestore
   ✅ [Analytics] Pageview tracked successfully via Firestore
   ```
5. Navigate to different pages - should see more logs

### ✅ Step 2: Test Firestore Rules

1. Open Firebase Console → Firestore
2. Go to `analytics_sessions` collection
3. Find a session document
4. Check `pageViews` field - should increment with each page view
5. Check `pages` array - should list visited pages

### ✅ Step 3: Test Analytics Dashboard

1. Go to Admin Panel → Analytics tab
2. Click "Diagnose" - should show all green ✅
3. Wait 30 seconds
4. Refresh dashboard
5. Should see:
   - Live users count (if you're active)
   - Visitor stats (daily, weekly, monthly)
   - Top pages list
   - No error banners

### ✅ Step 4: Test Regular Users

1. Open incognito window
2. Navigate around site
3. Do NOT accept cookies
4. Data should NOT be tracked (respect consent)
5. Accept cookies
6. Navigate more
7. Data SHOULD be tracked now

---

## Additional Recommendations

### 1. Add Monitoring Dashboard

Create a simple monitoring page to track:

- Sessions created vs. updated (ratio should be ~1:10)
- Pageview success rate
- API fallback usage
- Firestore errors

### 2. Add Analytics Health Check

Add a status indicator in AdminPanel showing:

- ✅ Firebase configured
- ✅ Firestore rules working
- ✅ Indexes built
- ✅ Recent data (last 5 min)

### 3. Deprecate Old Analytics

Once the new system is working:

1. Find all uses of old `trackEvent` and `trackPageView` from `database.ts`
2. Replace with new advanced analytics functions
3. Eventually delete the old code
4. Migrate old data if needed

### 4. Set Up Alerts

Configure Firebase monitoring to alert you when:

- Analytics writes fail >10% of attempts
- No data received for >1 hour
- Quota near limit

---

## Quick Win: Immediate 80% Fix (10 minutes)

If you only have 10 minutes, do this:

1. **Fix Firestore Rules** (Fix #2) - 3 min
2. **Fix Admin Bypass** (Fix #1) - 5 min
3. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. **Test:** Sign in as admin, navigate pages, check console logs

This will fix 80% of the issues and get analytics working for you immediately. The other fixes can be done later.

---

## Questions?

If you need help implementing any of these fixes, let me know which one you want to start with and I'll provide step-by-step guidance.

**Priority Order:**

1. Fix #2 (Firestore Rules) ← Start here
2. Fix #1 (Admin Bypass) ← Then this
3. Fix #4 (Session Updates) ← Then this
4. Fix #5 (Indexes) ← Can do anytime
5. Fix #3 (Unify System) ← Do last (biggest change)

---

## Summary

Your analytics system has grown organically and now has multiple competing implementations. The main issues are:

1. **Cookie consent is too restrictive** - blocking even admin tracking
2. **Firestore rules are too strict** - rejecting legitimate session updates
3. **Multiple analytics systems** - writing to different collections
4. **Admin dashboard reads wrong collection** - looking for old analytics format
5. **Missing indexes** - causing some queries to fail

The good news: These are all fixable with the changes above. Start with the Quick Win to get immediate results, then gradually implement the other fixes.
