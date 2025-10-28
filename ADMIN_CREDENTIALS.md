# 🔑 Admin Login Credentials

## Default Admin Account

**IMPORTANT: These are default credentials for initial setup only.**
**You MUST change the password immediately after first login for security.**

### Credentials

```
Email:    admin@vortexpcs.com
Password: VortexAdmin2025!
```

## Setup Instructions

1. **Create Admin Account in Firebase:**

   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Use the credentials above
   - Note the User UID

2. **Add Admin Role in Firestore:**

   - Go to Firestore Database
   - Create/Navigate to `users` collection
   - Create document with User UID
   - Add field: `role` = `admin`
   - Add field: `email` = `admin@vortexpcs.com`
   - Add field: `displayName` = `Admin User`

3. **Change Password After First Login:**
   - Click "Forgot password?" on login screen
   - Enter admin@vortexpcs.com
   - Check email for password reset link
   - Set a new secure password

## Security Recommendations

✅ Change password immediately  
✅ Use strong, unique password  
✅ Enable 2FA if available  
✅ Don't share credentials  
✅ Use password manager  
✅ Regular security audits

## Alternative Admin Creation

You can also use the Firebase CLI script provided in `FIREBASE_AUTH_SETUP.md`

---

**Created:** October 28, 2025  
**For:** Vortex PCs Admin Access  
**Status:** Default - Must Change
