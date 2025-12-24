/**
 * Admin Role Authorization Middleware
 * Validates user has admin role before allowing access to admin endpoints
 *
 * CRITICAL: All admin endpoints MUST use this middleware
 * Never rely on client-side role checks
 */

import { getAuth } from "firebase-admin/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import type { UserRole } from "../../utils/roleVerification";
import { logger } from "../../services/logger";

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Verify user has admin role
 * Returns true only if:
 * 1. Token is valid
 * 2. User exists in Firebase
 * 3. User has admin role in Custom Claims
 */
export async function requireAdminRole(idToken: string): Promise<{
  success: boolean;
  userId?: string;
  userRole?: UserRole;
  error?: string;
}> {
  try {
    const auth = getAuth();

    // Verify the ID token is valid
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Fetch user record to check Custom Claims
    const userRecord = await auth.getUser(userId);
    const customClaims = userRecord.customClaims || {};
    const userRole = (customClaims.role || "user") as UserRole;

    // Check if user has admin role
    if (userRole !== "admin") {
      logger.warn("Unauthorized admin access attempt", {
        userId,
        requestedRole: "admin",
        actualRole: userRole,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        userId,
        userRole,
        error: "User does not have admin role",
      };
    }

    logger.info("✅ Admin authorization successful", {
      userId,
      userRole,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      userId,
      userRole,
    };
  } catch (error) {
    logger.error("Admin authorization check failed", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Authorization check failed",
    };
  }
}

/**
 * Higher-order function to wrap API handlers with admin authorization
 *
 * Usage:
 * export default withAdminAuth(async (req, res, userId) => {
 *   // Your admin endpoint code here
 * });
 */
export function withAdminAuth(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    userId: string
  ) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Extract Bearer token
      const authHeader = req.headers.authorization;
      const idToken = extractBearerToken(authHeader);

      if (!idToken) {
        return res.status(401).json({
          success: false,
          error: "Missing or invalid Authorization header",
        });
      }

      // Verify admin role
      const authResult = await requireAdminRole(idToken);
      if (!authResult.success) {
        return res.status(403).json({
          success: false,
          error: authResult.error || "Unauthorized",
        });
      }

      // Call the handler with verified userId
      await handler(req, res, authResult.userId!);
    } catch (error) {
      logger.error("Admin auth middleware error", {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
}
