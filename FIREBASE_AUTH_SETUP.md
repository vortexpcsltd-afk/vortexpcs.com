# 🔐 Firebase Authentication Setup Guide

## Overview

This guide will help you set up Firebase Authentication for Vortex PCs, enabling real user registration, login, and password reset functionality.

## Prerequisites

- Firebase project created at https://console.firebase.google.com/
- Node.js and npm installed

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing project
3. Enter project name: "vortexpcs" (or your preference)
4. Disable Google Analytics (optional for this use case)
5. Click "Create Project"

## Step 2: Enable Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Email/Password"
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
5. (Optional) Enable "Google" for social login

## Step 3: Enable Firestore Database

1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location (e.g., us-central)
5. Click "Enable"

## Step 4: Configure Firestore Rules

1. In Firestore Database, click "Rules" tab
2. Replace with these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Public read for products/content
    match /products/{product} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

3. Click "Publish"

## Step 5: Get Firebase Configuration

1. In Firebase Console, click the gear icon → "Project settings"
2. Scroll to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Register app name: "Vortex PCs Website"
5. Don't enable Firebase Hosting (we use Vercel)
6. Click "Register app"
7. Copy the `firebaseConfig` object values

## Step 6: Configure Environment Variables

1. Create `.env` file in project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

2. In Vercel Dashboard:
   - Go to project settings → Environment Variables
   - Add each VITE*FIREBASE*\* variable
   - Apply to Production, Preview, and Development
   - Redeploy

## Step 7: Create Admin Account

### Method 1: Firebase Console (Recommended)

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter:
   - Email: `admin@vortexpcs.com`
   - Password: `VortexAdmin2025!` (change this!)
4. Click "Add user"
5. Copy the User UID
6. Go to Firestore Database
7. Click "Start collection"
8. Collection ID: `users`
9. Document ID: [paste the User UID]
10. Add fields:
    - `email`: `admin@vortexpcs.com`
    - `displayName`: `Admin User`
    - `role`: `admin`
    - `createdAt`: [timestamp]
    - `lastLogin`: [timestamp]
11. Click "Save"

### Method 2: Using Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Run this script (create it first)
node scripts/create-admin.js
```

Create `scripts/create-admin.js`:

```javascript
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const createAdmin = async () => {
  try {
    const userRecord = await admin.auth().createUser({
      email: "admin@vortexpcs.com",
      password: "VortexAdmin2025!",
      displayName: "Admin User",
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: "admin@vortexpcs.com",
      displayName: "Admin User",
      role: "admin",
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@vortexpcs.com");
    console.log("Password: VortexAdmin2025!");
    console.log("UID:", userRecord.uid);
  } catch (error) {
    console.error("Error creating admin:", error);
  }
};

createAdmin();
```

## Step 8: Test Authentication

1. Run locally: `npm run dev`
2. Click "Login" button
3. Click "Sign Up" tab
4. Create test account
5. Verify email sent (check Firebase Console → Authentication → Users)
6. Test login
7. Test password reset

## Step 9: Update App.tsx

The `LoginDialog` component is already integrated with Firebase auth services.
Make sure `App.tsx` handles the user state properly:

```typescript
const handleLoginSuccess = (user: any) => {
  setUser(user);
  setIsLoggedIn(true);
  console.log("User logged in:", user);
};
```

## Security Best Practices

1. **Never commit `.env` to git** - Already in `.gitignore`
2. **Use strong passwords** - Minimum 6 characters
3. **Enable email verification** - Configure in Firebase Console
4. **Rate limiting** - Firebase handles this automatically
5. **HTTPS only** - Vercel provides this
6. **Regular security audits** - Check Firebase Console → Security

## Admin Login Credentials

⚠️ **IMPORTANT: Change these immediately after first login!**

```
Email: admin@vortexpcs.com
Password: VortexAdmin2025!
```

### To Change Admin Password:

1. Login with above credentials
2. Click "Forgot password?" on login screen
3. Enter admin@vortexpcs.com
4. Check email for reset link
5. Set new secure password

## Troubleshooting

### "Firebase not initialized" Error

- Check `.env` file exists and has correct values
- Restart dev server after adding environment variables
- Check Vercel environment variables are set

### "Permission denied" in Firestore

- Check Firestore rules are published
- Verify user is authenticated before Firestore operations
- Check user document has correct `role` field for admin operations

### Email not sending

- Check Firebase Console → Authentication → Templates
- Verify email domain is authorized
- Check spam folder

### "User not found" on login

- User must be created in Firebase Console → Authentication
- Or registered through Sign Up form

## API Usage Examples

### Register User

```typescript
import { registerUser } from "./services/auth";

const user = await registerUser(email, password, displayName);
```

### Login User

```typescript
import { loginUser } from "./services/auth";

const user = await loginUser(email, password);
```

### Reset Password

```typescript
import { resetPassword } from "./services/auth";

await resetPassword(email);
```

### Logout

```typescript
import { logoutUser } from "./services/auth";

await logoutUser();
```

## Support

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
- Vortex PCs Issues: Create issue on GitHub

---

**Status:** Ready for Implementation  
**Last Updated:** October 28, 2025  
**Version:** 1.0
