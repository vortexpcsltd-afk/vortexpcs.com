# Admin Permission Fix Commands

## Quick Fix (Firebase Console)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Firestore Database
4. Find or create a document in the `users` collection with your UID
5. Add/update these fields:
   ```
   role: "admin"
   accountType: "admin"
   email: "your-email@example.com"
   ```

## OR Use Firebase CLI

Run these commands in your terminal:

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Update user role (replace YOUR_UID and YOUR_EMAIL)
firebase firestore:write users/YOUR_UID '{
  "role": "admin",
  "accountType": "admin",
  "email": "YOUR_EMAIL",
  "updatedAt": {"_seconds": 1700000000}
}' --merge
```

## Get Your UID

1. **From your app**: Open browser console while logged in and run:

   ```javascript
   firebase.auth().currentUser.uid;
   ```

2. **From Firebase Console**:
   - Go to Authentication
   - Find your user
   - Copy the UID column

## Check Current Orders

Run in Firebase CLI:

```bash
firebase firestore:get orders --limit 10
```

## Current Issue

Based on the Firestore rules, you need:

- `role: "admin"` in your user document (`users/{yourUid}`)
- OR email matching `admin@vortexpcs.com` or `info@vortexpcs.com`

The rules check:

1. Email whitelist (admin@vortexpcs.com, info@vortexpcs.com)
2. Role field in users collection

## After Fix

1. Sign out of your app
2. Sign back in
3. The AuthContext will load your updated role
4. You'll have full admin access

## Troubleshooting

If you still can't see orders:

- Check browser console for specific error messages
- Verify your email matches one of the whitelisted emails
- Ensure the `users` collection document exists for your UID
- Try clearing browser cache and re-logging in
