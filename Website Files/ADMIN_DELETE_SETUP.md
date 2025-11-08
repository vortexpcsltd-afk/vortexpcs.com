# Admin Customer Account Deletion - Setup Guide

## Overview

You can now delete customer accounts directly from the Admin Panel with full cascade deletion of related data.

## What Gets Deleted

When you delete a customer account, the system automatically removes:

- ✅ Firebase Authentication account
- ✅ Firestore user profile document
- ✅ All customer orders
- ✅ All saved PC configurations
- ✅ All support tickets
- ✅ Audit log entry recording the deletion

## Server-Side Endpoint

**File**: `/api/admin/users/delete.ts`

### Required Environment Variables (Vercel)

Set these in your Vercel project settings:

#### Server-side (Required for Admin SDK)

```bash
FIREBASE_PROJECT_ID=vortex-p-c-support-p-r-268hgl
FIREBASE_ADMIN_CREDENTIALS=<paste entire JSON from service account file>
```

#### Client-side (Required for Firebase Web SDK)

```bash
VITE_FIREBASE_API_KEY=<from Firebase Console>
VITE_FIREBASE_AUTH_DOMAIN=vortex-p-c-support-p-r-268hgl.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vortex-p-c-support-p-r-268hgl
VITE_FIREBASE_STORAGE_BUCKET=vortex-p-c-support-p-r-268hgl.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
VITE_FIREBASE_APP_ID=<from Firebase Console>
```

### Setting FIREBASE_ADMIN_CREDENTIALS

**Option 1: Using your service account JSON (Recommended)**

1. You already have the service account file: `vortex-p-c-support-p-r-268hgl-f8caee319997.json`
2. In Vercel Dashboard:

   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - Name: `FIREBASE_ADMIN_CREDENTIALS`
   - Value: Paste the **entire JSON content** (all lines from the file)
   - Select environments: Production, Preview, Development
   - Click **Save**

3. **Important**: If you get "Invalid PEM formatted message" errors:
   - The endpoint code handles this automatically by normalizing `\n` in the private_key
   - If issues persist, ensure the JSON is pasted exactly as-is with no extra quotes or escaping

**Option 2: Using Application Default Credentials (ADC)**

If you prefer ADC, set:

```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON=<paste service account JSON>
```

And update both `/api/admin/users/delete.ts` and `/api/admin/users/update-role.ts` to:

```typescript
const credentials =
  process.env.FIREBASE_ADMIN_CREDENTIALS ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (credentials) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(credentials)),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}
```

## Security Features

### Server-Side Protection

- ✅ Requires valid Firebase ID token (Bearer auth)
- ✅ Verifies caller has admin role in Firestore or is `admin@vortexpcs.com`
- ✅ Prevents self-deletion (you cannot delete your own account)
- ✅ Creates audit log with deletion details

### Client-Side Protection

- ✅ Only visible to authenticated admins
- ✅ Requires double confirmation with detailed warning
- ✅ Disabled for your own account
- ✅ Shows deletion summary after success

## How to Use (Admin Panel)

1. Navigate to **Admin Panel** → **Customers** tab
2. Find the customer you want to delete
3. Click the red **Delete** button in the Actions column
4. Confirm the deletion in the dialog (shows what will be deleted)
5. Wait for the deletion to complete
6. Success message will show counts of deleted items

## UI Features

- Red-themed delete button with hover effects
- Confirmation dialog lists all data that will be deleted
- Cannot delete your own account (button is disabled)
- Shows detailed deletion summary after completion
- Automatically removes customer from the table

## Testing Locally

```powershell
# Set environment variables (PowerShell)
$env:FIREBASE_PROJECT_ID = "vortex-p-c-support-p-r-268hgl"
$env:FIREBASE_ADMIN_CREDENTIALS = Get-Content "vortex-p-c-support-p-r-268hgl-f8caee319997.json" -Raw

# Or create a .env.local file (for Vite client-side vars only)
# Note: Server-side vars need to be in your shell or Vercel

# Run dev server
npm run dev
```

## Deployment Checklist

- [ ] Set `FIREBASE_PROJECT_ID` in Vercel
- [ ] Set `FIREBASE_ADMIN_CREDENTIALS` (paste full JSON) in Vercel
- [ ] Set all `VITE_FIREBASE_*` variables in Vercel
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Enable Firebase Authentication providers
- [ ] Add your Vercel domain to Firebase authorized domains
- [ ] Set your Firestore user role to "admin"
- [ ] Test deletion on a test account (not your own!)

## Troubleshooting

### 401 Unauthorized

- You're not logged in or token expired
- Re-login through the website
- Check Firebase Auth "Authorized domains" includes your deployment URL

### 403 Forbidden

- Your account doesn't have admin role
- Set `role: "admin"` in your Firestore `users/{uid}` document

### 500/501 Server Error

- Firebase Admin SDK not initialized
- Check `FIREBASE_ADMIN_CREDENTIALS` is set correctly in Vercel
- View function logs in Vercel Dashboard

### "Cannot delete your own account"

- This is intentional for safety
- Ask another admin to delete your account if needed

### Delete button not appearing

- Ensure you're logged in as admin
- Check browser console for errors
- Verify `isAdmin` context is true

## API Reference

### Endpoint

```
POST /api/admin/users/delete
```

### Request Headers

```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

### Request Body

```json
{
  "userId": "firebase-user-uid"
}
```

### Success Response (200)

```json
{
  "success": true,
  "deleted": {
    "user": true,
    "orders": 5,
    "configurations": 2,
    "supportTickets": 1
  }
}
```

### Error Responses

- `400`: Missing userId or trying to delete own account
- `401`: Missing or invalid token
- `403`: Not an admin
- `500`: Server error
- `501`: Firebase Admin SDK not initialized

## Audit Logging

Every deletion is logged to `admin_audit_logs` collection:

```json
{
  "type": "user_deletion",
  "targetUserId": "deleted-user-uid",
  "performedBy": "admin-user-uid",
  "performedAt": "2025-11-03T12:00:00Z",
  "cleanup": {
    "orders": 5,
    "configurations": 2,
    "supportTickets": 1
  }
}
```

## Support

For issues or questions:

1. Check Vercel function logs for server errors
2. Check browser console for client errors
3. Verify all environment variables are set
4. Test with a non-admin test account first
