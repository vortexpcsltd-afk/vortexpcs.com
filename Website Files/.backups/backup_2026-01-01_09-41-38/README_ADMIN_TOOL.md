# Super Admin Creation Tool

This guide covers using the admin tool to create or promote a super admin user securely.

## Overview

- Tool path: scripts/admin-create-super.js
- Purpose: Create a Firebase Auth user (if missing), set custom claim `role: "admin"`, and write Firestore user role.
- Supports three credential loading methods: Base64 JSON, file path, or individual env vars.

## Credential Options

1. Base64 JSON
   - Set `FIREBASE_SERVICE_ACCOUNT_BASE64` in your environment.
2. JSON Key file
   - Download a service account key from Firebase Console → Project Settings → Service Accounts.
   - Save it locally (e.g., scripts/service-account.json).
   - Use `--serviceAccountPath` or set `FIREBASE_SERVICE_ACCOUNT_PATH`.
3. Individual fields
   - Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

Tip: Use `.env` locally. See `.env.example` for all variables.

## Commands (PowerShell examples)

- Create or promote a user with a password:

```powershell
npm run admin:create-super -- --email new.admin@vortexpcs.com --password "StrongP@ss!" --displayName "New Admin" --serviceAccountPath "./scripts/service-account.json"
```

- Create or promote and send a password reset link:

```powershell
npm run admin:create-super -- --email new.admin@vortexpcs.com --sendReset --serviceAccountPath "./scripts/service-account.json"
```

- Revoke refresh tokens (forces re-login):

```powershell
npm run admin:create-super -- --email new.admin@vortexpcs.com --revoke --serviceAccountPath "./scripts/service-account.json"
```

## Post-Creation Steps

- Add the new email to `ADMIN_ALLOWLIST` in your Vercel project env vars; remove old emails if rotating.
- Redeploy so the allowlist change takes effect.
- Enable MFA for the user via Admin Panel → Security tab.
- Verify admin access works with the new account.

## Security Notes

- Keep service account keys private; never commit real `.env` files or keys to source control.
- Prefer `ADMIN_IP_WHITELIST` in production to restrict admin access by IP.
- Rotate credentials regularly and revoke old tokens when changing admins.

## Troubleshooting

- "Missing Firebase Admin credentials": ensure one of the credential methods is set.
- ESM error: The project uses ESM (`type: module`); the tool already uses `import`.
- Permissions: Make sure your Firebase role has permission to create users and set custom claims.
