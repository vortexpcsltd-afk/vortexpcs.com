# Email System Setup Guide

## Overview

The admin bulk email feature requires proper configuration in your Vercel deployment. Currently, you're seeing a **501 Not Implemented** error because Firebase Admin SDK cannot initialize without credentials.

## Required Environment Variables (Vercel)

### 1. Firebase Admin SDK

Add these to your Vercel project settings (Project Settings → Environment Variables):

```bash
# Firebase Admin (for server-side auth verification)
FIREBASE_PROJECT_ID=vortexpcs
GOOGLE_APPLICATION_CREDENTIALS=/var/task/service-account.json
```

**Important**: You'll need to upload your Firebase service account key as a secret file or encode it as base64 in an environment variable.

#### Option A: Using Vercel Secrets (Recommended)

1. Download your Firebase service account JSON from Firebase Console → Project Settings → Service Accounts
2. Base64 encode it: `cat service-account.json | base64`
3. Add to Vercel:

```bash
FIREBASE_SERVICE_ACCOUNT_BASE64=<your-base64-encoded-json>
```

Then update `api/admin/email/send.ts` to decode and use it:

```typescript
const serviceAccount = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "",
  "base64"
).toString("utf-8");
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccount)),
});
```

### 2. SMTP Configuration

These should already be set for your contact form:

```bash
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

## Quick Test

Once configured, test by:

1. Going to Admin Panel → Emails tab
2. Create a simple test message
3. Use "Manual List" mode with your own email
4. Send

## Current Status

✅ **Working**:

- Email template rendering
- Live preview
- Client-side UI
- SMTP configuration (assuming contact form works)

❌ **Not Working**:

- Firebase Admin SDK initialization (needs service account)
- Bulk send endpoint returns 501

## Sandbox Warnings (Fixed)

The iframe sandbox warnings you saw are now resolved. The preview iframe now has proper permissions and won't show script blocking errors.

## Next Steps

1. Add Firebase service account credentials to Vercel
2. Redeploy: `vercel --prod`
3. Test the email send feature
4. (Optional) Add rate limiting with Upstash Redis if sending to many users

## Troubleshooting

### 501 Error

- Missing Firebase credentials
- Check Vercel logs: `vercel logs`

### 500 Error with SMTP message

- SMTP credentials not set or incorrect
- Test SMTP with contact form first

### 403 Forbidden

- User doesn't have admin role in Firestore
- Check `users/{uid}` document has `role: "admin"`
