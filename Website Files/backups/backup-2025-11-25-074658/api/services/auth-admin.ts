/**
 * Admin Authentication Helper for API Routes
 * Verifies admin role from Firebase token
 */

import type { VercelRequest } from "@vercel/node";
import admin from "firebase-admin";

interface AdminUser {
  uid: string;
  email: string;
  role: string;
}

// Ensure Firebase Admin is initialized wherever this helper is used
function ensureAdminInitialized() {
  if (admin.apps.length) return;

  const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (credsBase64) {
    const creds = JSON.parse(
      Buffer.from(credsBase64, "base64").toString("utf-8")
    );
    admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
    return;
  }

  // Fallback: Application Default Credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
  try {
    const projectId =
      process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (projectId) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
      return;
    }
  } catch (_) {
    // ignore and throw below
  }

  throw new Error(
    "Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or provide Application Default Credentials and FIREBASE_PROJECT_ID."
  );
}

/**
 * Verify admin token and return user info
 */
export async function verifyAdmin(
  req: VercelRequest
): Promise<AdminUser | null> {
  try {
    ensureAdminInitialized();
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
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("[verifyAdmin] Token verified for UID:", decodedToken.uid);

    // Load user and claims
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};
    const email = decodedToken.email || userRecord.email || "";

    // Fallback checks: Firestore profile role or allowlist email
    let firestoreRole: string | undefined;
    try {
      const snap = await admin
        .firestore()
        .collection("users")
        .doc(decodedToken.uid)
        .get();
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
      customClaims.role || firestoreRole || ""
    ).toLowerCase();
    const rawAllow = (process.env.ADMIN_ALLOWLIST || "")
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const allowlist = new Set<string>(
      rawAllow.length ? rawAllow : ["admin@vortexpcs.com"]
    );
    const isAdmin =
      normalizedRole === "admin" ||
      (email && allowlist.has(email.toLowerCase()));

    console.log("[verifyAdmin] Check results:", {
      email,
      normalizedRole,
      allowlist: Array.from(allowlist),
      isAdmin,
    });

    if (!isAdmin) return null;

    return {
      uid: decodedToken.uid,
      email,
      role: "admin",
    };
  } catch (error) {
    console.error("Admin verification failed:", error);
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
    ensureAdminInitialized();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return null;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decodedToken.uid);
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
