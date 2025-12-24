/**
 * Admin Authentication Helper for API Routes
 * Verifies admin role from Firebase token
 */

import type { VercelRequest } from "@vercel/node";
import admin from "firebase-admin";
import { getClientIP, isIPWhitelisted } from "../middleware/ip-whitelist.js";

// Initialize Firebase Admin SDK if not already initialized
export function ensureFirebaseAdminInitialized() {
  if (!admin.apps.length) {
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const isDev = process.env.NODE_ENV === "development";

    console.log("[Firebase Init] Env check:", {
      hasBase64: !!credsBase64,
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      isDev,
    });

    // Try Base64 first
    if (credsBase64) {
      try {
        const creds = JSON.parse(
          Buffer.from(credsBase64, "base64").toString("utf-8")
        );
        console.log(
          "[Firebase Init] Parsed base64 creds, project:",
          creds.project_id
        );
        admin.initializeApp({
          credential: admin.credential.cert(creds),
        });
        console.log("[Firebase] Initialized with base64 credentials");
        return admin;
      } catch (error) {
        console.error(
          "[Firebase Init] Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:",
          error
        );
      }
    }

    // Try individual environment variables
    if (projectId && clientEmail && privateKey) {
      try {
        console.log(
          "[Firebase Init] Using individual env vars for project:",
          projectId
        );
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
        console.log("[Firebase] Initialized with individual env vars");
        return admin;
      } catch (error) {
        console.error(
          "[Firebase Init] Failed to initialize Firebase with individual env vars:",
          error
        );
      }
    }

    // Development fallback - use emulator or mock
    if (isDev) {
      console.log(
        "[Firebase] Running in development mode - attempting to use Firestore emulator"
      );
      try {
        // Try to connect to emulator if available
        const emulatorsEnv = process.env.FIREBASE_EMULATOR_HUB;
        if (emulatorsEnv) {
          console.log("[Firebase] Emulator hub detected at:", emulatorsEnv);
          admin.initializeApp({
            projectId: projectId || "demo-project",
          });
          // Connect to emulator
          const db = admin.firestore();
          db.useEmulator("localhost", 8080);
          console.log("[Firebase] Connected to Firestore emulator");
          return admin;
        }
      } catch (error) {
        console.error("Failed to initialize emulator:", error);
      }
      // In dev mode, still throw but caller can catch it
      console.log("[Firebase] Development mode - Firebase not available");
      throw new Error("Firebase not configured (dev mode)");
    }

    // If we get here, throw error
    console.error("[Firebase Init] No valid credentials found!");
    throw new Error(
      "Firebase Admin credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY"
    );
  }
  console.log(
    "[Firebase Init] Already initialized, app count:",
    admin.apps.length
  );
  return admin;
}

interface AdminUser {
  uid: string;
  email: string;
  role: string;
}

/**
 * Verify admin token and return user info
 */
export async function verifyAdmin(
  req: VercelRequest
): Promise<AdminUser | null> {
  try {
    // Check IP whitelist for admin routes, but allow email allowlist override later
    const clientIP = getClientIP(req);
    const ipOk = isIPWhitelisted(clientIP);
    if (!ipOk) {
      console.warn(
        `[verifyAdmin] Request from non-whitelisted IP: ${clientIP} (will evaluate email allowlist override)`
      );
    }

    // Initialize Firebase Admin
    const adminSdk = ensureFirebaseAdminInitialized();
    const auth = adminSdk.auth();
    const db = adminSdk.firestore();

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[verifyAdmin] No Authorization header or invalid format");
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      console.log("[verifyAdmin] Empty token after Bearer");
      return null;
    }

    // Verify token with Firebase
    console.log("[verifyAdmin] Verifying token...");
    const decodedToken = await auth.verifyIdToken(token);
    console.log("[verifyAdmin] Token verified for UID:", decodedToken.uid);

    // Load user and claims
    const userRecord = await auth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};
    const email = decodedToken.email || userRecord.email || "";

    // Fallback checks: Firestore profile role or allowlist email
    let firestoreRole: string | undefined;
    try {
      const snap = await db.collection("users").doc(decodedToken.uid).get();
      if (snap.exists) {
        const data = snap.data();
        const roleVal =
          data && typeof data === "object" && "role" in data
            ? (data as { role?: unknown }).role
            : undefined;
        firestoreRole = typeof roleVal === "string" ? roleVal : undefined;
      } else {
        firestoreRole = undefined;
      }
    } catch {
      // best-effort
    }

    const normalizedRole = String(
      (customClaims as { role?: unknown }).role || firestoreRole || ""
    ).toLowerCase();
    const rawAllow = (process.env.ADMIN_ALLOWLIST || "")
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const allowlist = new Set<string>(
      rawAllow.length ? rawAllow : ["admin@vortexpcs.com"]
    );
    const hasAdminBooleanClaim = Boolean(
      (customClaims as { admin?: unknown }).admin === true
    );
    const isEmailAllowlisted = email && allowlist.has(email.toLowerCase());
    const hasAdminRole = normalizedRole === "admin" || hasAdminBooleanClaim;
    // If the user has an explicit admin claim/role, allow without IP whitelist.
    // Otherwise, require either IP whitelist or email allowlist.
    const isAdmin =
      hasAdminRole ||
      ((ipOk || isEmailAllowlisted) &&
        !!(normalizedRole || hasAdminBooleanClaim));

    console.log("[verifyAdmin] Check results:", {
      email,
      normalizedRole,
      hasAdminBooleanClaim,
      allowlist: Array.from(allowlist),
      ipOk,
      isEmailAllowlisted,
      isAdmin,
    });

    if (!isAdmin) return null;

    return {
      uid: decodedToken.uid,
      email,
      role: "admin",
    };
  } catch (error) {
    console.error("[verifyAdmin] Verification error:", error);
    // In development mode, when Firebase is not configured, this is expected
    if (
      process.env.NODE_ENV === "development" &&
      error instanceof Error &&
      error.message.includes("Firebase not configured")
    ) {
      console.log("[verifyAdmin] Development mode - Firebase not available");
    } else {
      console.error("[verifyAdmin] Unexpected error:", error);
    }
    return null;
  }
}

/**
 * Get user from token without admin check
 */
export async function verifyUser(
  req: VercelRequest
): Promise<AdminUser | null> {
  try {
    // Initialize Firebase Admin
    const adminSdk = initializeFirebaseAdmin();
    const auth = adminSdk.auth();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return null;
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || userRecord.email || "",
      role: (customClaims.role as string) || "user",
    };
  } catch (error) {
    console.error("User verification failed:", error);
    return null;
  }
}
