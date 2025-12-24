# API 500 Error Resolution Guide

**Last Updated**: November 29, 2025 11:36 AM

---

## 🆕 Latest Fix: Analytics & Search Tracking (Nov 29, 2025)

### Issues Identified

1. **Search Tracking Permission Errors**

   - Error: `FirebaseError: Missing or insufficient permissions`
   - Search queries not being saved to Firestore
   - Missing security rules for `searchQueries` and `zeroResultSearches` collections

2. **Analytics Session Update Errors**
   - Error: `Function updateDoc() called with invalid data. Unsupported field value: undefined`
   - 500 errors on `/api/analytics/track` endpoint
   - Undefined values being passed to Firestore `updateDoc()`

### Solutions Implemented ✅

1. **Added Firestore Security Rules** (`firestore.rules`):

```javascript
// Search tracking: searchQueries (public write; admin read)
match /searchQueries/{docId} {
  allow create: if true;
  allow read: if isAdmin();
  allow update, delete: if false;
}

// Search tracking: zeroResultSearches (public write; admin read)
match /zeroResultSearches/{docId} {
  allow create: if true;
  allow read: if isAdmin();
  allow update, delete: if false;
}
```

2. **Fixed Analytics Session Updates** (`services/advancedAnalytics.ts`):

```typescript
// Filter out undefined values to prevent Firestore errors
const updateData: Record<string, unknown> = {
  lastActivity: Timestamp.now(),
  pageViews: (sessionDoc.data().pageViews || 0) + 1,
  pages: [...(sessionDoc.data().pages || []), sessionData.pages?.[0]]
    .filter(Boolean)
    .slice(-50),
  isActive: true,
};

// Only include optional fields if they have valid values
if (sessionData.referrer) updateData.referrer = sessionData.referrer;
if (sessionData.userAgent) updateData.userAgent = sessionData.userAgent;
if (sessionData.location && Object.keys(sessionData.location).length > 0) {
  updateData.location = sessionData.location;
}
if (sessionData.device && Object.keys(sessionData.device).length > 0) {
  updateData.device = sessionData.device;
}

await updateDoc(sessionRef, updateData);
```

### Deployment

- ✅ Firestore rules deployed: `firebase deploy --only firestore:rules`
- ✅ Production build successful
- ✅ Deployed to Vercel production

### Result

- Search tracking now fully operational
- Analytics no longer throws 500 errors
- Admin Search Analytics tab will populate with data
- Session tracking accurate and error-free

---

## Previous Issue: Missing Firebase Admin Variables (Resolved Earlier)

## Problem Summary

All API endpoints returning **500 Internal Server Error**:

- `/api/security/check-ip`
- `/api/security/record-login-attempt`
- `/api/security/list-ip-blocks`
- `/api/admin/reports/generate`
- `/api/admin/reports/schedule`
- `/api/admin/crm/segments` (also affected)

## Root Cause

**Missing Firebase Admin environment variables** on Vercel deployment. All APIs attempt to initialize Firebase Admin SDK but fail when these required environment variables are not set:

```typescript
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID, // ❌ MISSING
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL, // ❌ MISSING
    privateKey: process.env.FIREBASE_PRIVATE_KEY, // ❌ MISSING
  }),
});
```

Without these variables:

1. Firebase Admin initialization fails silently (caught in try/catch)
2. Subsequent Firestore operations throw errors
3. APIs return 500 with minimal details

## Solution

### Step 1: Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **Vortex PCs**
3. Click **⚙️ Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file (keep it secure!)

The JSON looks like:

```json
{
  "type": "service_account",
  "project_id": "vortexpcs-xxxxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@vortexpcs-xxxxx.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://..."
}
```

### Step 2: Add Environment Variables to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **vortexpcs.com** project
3. Go to **Settings** > **Environment Variables**
4. Add these three variables (from your JSON file):

| Variable Name           | Value                                                               | Environment                      |
| ----------------------- | ------------------------------------------------------------------- | -------------------------------- |
| `FIREBASE_PROJECT_ID`   | `vortexpcs-xxxxx`                                                   | Production, Preview, Development |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@vortexpcs-xxxxx.iam.gserviceaccount.com`   | Production, Preview, Development |
| `FIREBASE_PRIVATE_KEY`  | `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n` | Production, Preview, Development |

⚠️ **Important for `FIREBASE_PRIVATE_KEY`:**

- Copy the entire private key **including** `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters intact (they represent newlines)
- Paste directly into Vercel - don't modify formatting

#### Option B: Vercel CLI

```bash
vercel env add FIREBASE_PROJECT_ID
# Paste: vortexpcs-xxxxx

vercel env add FIREBASE_CLIENT_EMAIL
# Paste: firebase-adminsdk-xxxxx@vortexpcs-xxxxx.iam.gserviceaccount.com

vercel env add FIREBASE_PRIVATE_KEY
# Paste the entire private key with \n characters
```

### Step 3: Redeploy

After adding environment variables, trigger a new deployment:

```bash
# Option 1: Push to git (if using GitHub integration)
git add .
git commit -m "Trigger redeploy for env vars"
git push

# Option 2: Manual redeploy
vercel --prod
```

Or use Vercel Dashboard:

1. Go to **Deployments** tab
2. Click **⋮** on latest deployment
3. Select **Redeploy**

### Step 4: Verify

Test each endpoint:

```bash
# 1. Check IP (public endpoint)
curl https://vortexpcs.com/api/security/check-ip

# Expected: {"blocked":false,"attempts":0,"ip":"..."}
```

```bash
# 2. Reports (requires auth token)
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://vortexpcs.com/api/admin/reports/schedule

# Expected: {"success":true,"reports":[...]}
```

## Alternative: Environment Variable from Base64 (Used by some APIs)

Some security endpoints use `FIREBASE_SERVICE_ACCOUNT_BASE64` instead. If you see errors about this variable:

### Generate Base64 Encoded Service Account

```bash
# PowerShell (Windows)
$json = Get-Content firebase-service-account.json -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
[Convert]::ToBase64String($bytes) | Set-Clipboard
# Paste from clipboard into Vercel

# Bash/Linux/Mac
base64 -w 0 firebase-service-account.json | pbcopy
# Or: base64 -w 0 firebase-service-account.json
```

Then add to Vercel:

```bash
vercel env add FIREBASE_SERVICE_ACCOUNT_BASE64
# Paste the base64 string (one long line)
```

## Testing Locally with Vercel Dev

To test serverless functions locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run dev server (uses serverless functions)
vercel dev
```

Then visit: `http://localhost:3000/api/security/check-ip`

## Security Best Practices

✅ **Do:**

- Store service account JSON file securely (add to `.gitignore`)
- Use Vercel environment variables (encrypted at rest)
- Restrict service account permissions to minimum required
- Rotate keys periodically

❌ **Don't:**

- Commit service account JSON to git
- Share private keys in plain text
- Use production keys in development
- Store keys in frontend code

## Troubleshooting

### Error: "Invalid FIREBASE_SERVICE_ACCOUNT_BASE64"

**Solution:** Re-encode the JSON file ensuring no extra whitespace or newlines

### Error: "Missing project_id in service account"

**Solution:** Verify `FIREBASE_PROJECT_ID` matches your Firebase project exactly

### Error: "Firebase admin init failed: credential implementation provided"

**Solution:** Check that `FIREBASE_PRIVATE_KEY` includes the header/footer and `\n` characters

### Still getting 500 errors after deploying

**Solution:**

1. Check Vercel deployment logs: **Deployments** > Click deployment > **Function Logs**
2. Verify environment variables are set for **Production** environment
3. Ensure you redeployed **after** adding variables

## Quick Reference

**Files affected:**

- `/api/security/check-ip.ts`
- `/api/security/record-login-attempt.ts`
- `/api/security/list-ip-blocks.ts`
- `/api/admin/reports/generate.ts`
- `/api/admin/reports/schedule.ts`
- `/api/admin/crm/segments.ts`

**Required Environment Variables:**

```env
FIREBASE_PROJECT_ID=vortexpcs-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@vortexpcs-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
```

**Alternative (for some endpoints):**

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJv...
```

---

**Status:** 🔴 Environment variables missing  
**Impact:** All admin panel features non-functional  
**Priority:** 🔥 CRITICAL - Blocks all backend operations  
**ETA to fix:** ~10 minutes after obtaining service account JSON
