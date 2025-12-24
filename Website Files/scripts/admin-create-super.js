/**
 * Admin Tool: Create/Promote Super Admin
 *
 * Usage examples:
 *   node scripts/admin-create-super.js --email new.admin@vortexpcs.com --password "StrongP@ss!" --displayName "New Admin"
 *   node scripts/admin-create-super.js --email new.admin@vortexpcs.com --sendReset
 *   node scripts/admin-create-super.js --email new.admin@vortexpcs.com --revoke
 *
 * Requires Firebase Admin credentials via environment variables:
 *   - FIREBASE_SERVICE_ACCOUNT_BASE64 (preferred) OR
 *   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import "dotenv/config";
import admin from "firebase-admin";

function initAdmin() {
  if (!admin.apps.length) {
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (credsBase64) {
      try {
        const creds = JSON.parse(
          Buffer.from(credsBase64, "base64").toString("utf-8")
        );
        admin.initializeApp({ credential: admin.credential.cert(creds) });
        console.log("[AdminTool] Initialized Firebase with base64 credentials");
      } catch (e) {
        console.error(
          "[AdminTool] Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:",
          e
        );
        process.exit(1);
      }
      return;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (projectId && clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
        console.log(
          "[AdminTool] Initialized Firebase with individual env vars"
        );
      } catch (e) {
        console.error(
          "[AdminTool] Failed to initialize Firebase with env vars:",
          e
        );
        process.exit(1);
      }
      return;
    }

    console.error(
      "[AdminTool] Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY"
    );
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    email: "",
    password: "",
    displayName: "",
    sendReset: false,
    revoke: false,
    serviceAccountPath: "",
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--email") out.email = args[++i] || "";
    else if (a === "--password") out.password = args[++i] || "";
    else if (a === "--displayName") out.displayName = args[++i] || "";
    else if (a === "--sendReset") out.sendReset = true;
    else if (a === "--revoke") out.revoke = true;
    else if (a === "--serviceAccountPath")
      out.serviceAccountPath = args[++i] || "";
  }
  if (out.serviceAccountPath && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH = out.serviceAccountPath;
  }
  return out;
}

async function ensureUser(auth, email, password, displayName) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log("[AdminTool] User exists:", existing.uid);
    return existing;
  } catch (e) {
    if (e && e.errorInfo && e.errorInfo.code === "auth/user-not-found") {
      if (!password) {
        throw new Error(
          "User not found and no --password provided. Use --sendReset to send a password reset link or provide --password."
        );
      }
      const created = await auth.createUser({
        email,
        password,
        displayName: displayName || undefined,
        emailVerified: true,
      });
      console.log("[AdminTool] Created user:", created.uid);
      return created;
    }
    throw e;
  }
}

async function setAdminClaim(auth, uid) {
  const claims = { role: "admin" };
  await auth.setCustomUserClaims(uid, claims);
  console.log("[AdminTool] Set custom claims:", claims);
}

async function writeFirestoreProfile(db, uid, email) {
  const docRef = db.collection("users").doc(uid);
  const now = new Date();
  await docRef.set(
    {
      email,
      role: "admin",
      updatedAt: now,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log("[AdminTool] Updated Firestore user profile with role=admin");
}

async function maybeSendReset(auth, email, sendReset) {
  if (!sendReset) return;
  const link = await auth.generatePasswordResetLink(email);
  console.log(
    "[AdminTool] Password reset link (send securely to the user):\n",
    link
  );
}

async function maybeRevoke(auth, uid, revoke) {
  if (!revoke) return;
  await auth.revokeRefreshTokens(uid);
  console.log("[AdminTool] Revoked refresh tokens for UID:", uid);
}

async function main() {
  const { email, password, displayName, sendReset, revoke } = parseArgs();
  if (!email) {
    console.error(
      "Usage: --email <email> [--password <password>] [--displayName <name>] [--sendReset] [--revoke]"
    );
    process.exit(1);
  }
  initAdmin();
  const auth = admin.auth();
  const db = admin.firestore();

  const user = await ensureUser(auth, email, password, displayName);
  await setAdminClaim(auth, user.uid);
  await writeFirestoreProfile(db, user.uid, email);
  await maybeSendReset(auth, email, sendReset);
  await maybeRevoke(auth, user.uid, revoke);

  console.log("[AdminTool] Super admin setup complete for:", email);
  console.log(
    "[AdminTool] IMPORTANT: Update your Vercel env ADMIN_ALLOWLIST to include this email, then redeploy."
  );
}

main().catch((e) => {
  console.error("[AdminTool] Error:", e);
  process.exit(1);
});
