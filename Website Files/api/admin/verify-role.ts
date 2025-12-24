/**
 * Admin Role Verification Endpoint
 * Server-side verification of Firebase Custom Claims
 * CRITICAL: This is the source of truth for admin/role verification
 *
 * This endpoint:
 * 1. Verifies the Firebase ID token
 * 2. Checks Firebase Custom Claims (set via Firebase Admin SDK)
 * 3. Returns verified role information
 * 4. Logs all verification attempts for audit trail
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { logger } from "../../services/logger";

// Initialize Firebase Admin SDK
let auth: ReturnType<typeof getAuth>;

try {
  const apps = getApps();
  if (apps.length === 0) {
    // Initialize if not already done
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountJson, "base64").toString("utf-8")
      ) as Record<string, unknown>;
      initializeApp({
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      });
    }
  }
  auth = getAuth();
} catch (error) {
  logger.error("Failed to initialize Firebase Admin SDK", { error });
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Allowed admin email addresses for bootstrapping
 * These are emails that can set other users as admins
 * UPDATE: Use Firebase Custom Claims instead - this is for emergency access only
 */
const BOOTSTRAP_ADMIN_EMAILS = new Set([
  process.env.VORTEX_ADMIN_EMAIL || "admin@vortexpcs.com",
]);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Set CORS headers to allow requests from both www and non-www domains
  const origin = req.headers.origin || "";
  const allowedOrigins = [
    "https://vortexpcs.com",
    "https://www.vortexpcs.com",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Extract and validate Bearer token
    const authHeader = req.headers.authorization;
    const idToken = extractBearerToken(authHeader);

    if (!idToken) {
      res.status(401).json({
        error: "Missing or invalid Authorization header",
        verified: false,
        role: "guest",
      });
      return;
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      logger.warn("Invalid or expired ID token", { error });
      res.status(401).json({
        error: "Invalid or expired authentication token",
        verified: false,
        role: "guest",
      });
      return;
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Get custom claims from Firebase
    let userRecord;
    try {
      userRecord = await auth.getUser(userId);
    } catch (error) {
      logger.error("Failed to fetch user record", { userId, error });
      res.status(500).json({
        error: "Failed to verify user role",
        verified: false,
        role: "guest",
      });
      return;
    }

    // Extract role from custom claims
    const customClaims = userRecord.customClaims || {};
    const role = (customClaims.role as string) || "user";
    const isAdmin =
      role === "admin" ||
      (BOOTSTRAP_ADMIN_EMAILS.has(userEmail || "") && role === "moderator"); // Moderator emails can act as admin for setup

    // Verify role is valid
    const validRoles = ["admin", "moderator", "business", "user", "guest"];
    if (!validRoles.includes(role)) {
      logger.warn("Invalid role in custom claims", {
        userId,
        role,
      });
      res.status(400).json({
        error: "Invalid role in user claims",
        verified: false,
        role: "user",
      });
      return;
    }

    // Log verification attempt (security audit trail)
    logger.info("Role verification request", {
      userId,
      userEmail,
      role,
      isAdmin,
      timestamp: new Date().toISOString(),
    });

    // Return verified role information
    res.status(200).json({
      verified: true,
      role: isAdmin ? "admin" : role,
      customClaims: {
        isAdmin,
        role,
        ...(customClaims.permissions && {
          permissions: customClaims.permissions,
        }),
      },
      timestamp: Date.now(),
      expiresAt: decodedToken.iat + 3600, // 1 hour from token issue time
    });
  } catch (error) {
    logger.error("Role verification endpoint error", { error });
    res.status(500).json({
      error: "Internal server error during role verification",
      verified: false,
      role: "guest",
    });
  }
}
