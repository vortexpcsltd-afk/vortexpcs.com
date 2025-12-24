/**
 * Admin Role Management API
 * Protected endpoint for setting user roles (ADMIN ONLY)
 *
 * POST /api/admin/set-user-role
 *
 * Request body:
 * {
 *   "userId": "firebase-user-id",
 *   "role": "admin" | "moderator" | "business" | "user",
 *   "reason": "Optional audit trail reason"
 * }
 *
 * Response:
 * { "success": true, "message": "Role updated" }
 *
 * CRITICAL: This endpoint requires:
 * 1. Valid Firebase ID token in Authorization header
 * 2. User must have admin role (checked via Custom Claims)
 * 3. All operations logged for audit trail
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { setUserRole, revokeRole } from "../../services/firebaseRoleManager";
import type { UserRole } from "../../../utils/roleVerification";
import { logger } from "../../../services/logger";

interface SetRoleRequest {
  userId: string;
  role: UserRole;
  reason?: string;
}

interface SetRoleResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Extract and verify Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Verify user has admin role from their Custom Claims
 */
async function verifyAdminAccess(idToken: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const userRole = (decodedToken.role || "user") as UserRole;
    return userRole === "admin";
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SetRoleResponse>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
      error: "Only POST requests are supported",
    });
  }

  try {
    // Extract Bearer token
    const authHeader = req.headers.authorization;
    const idToken = extractBearerToken(authHeader);

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "Missing or invalid Authorization header",
      });
    }

    // Verify user is admin
    const isAdmin = await verifyAdminAccess(idToken);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        error: "Only admins can manage user roles",
      });
    }

    // Extract admin user ID from token for audit logging
    let adminUserId = "unknown";
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      adminUserId = decodedToken.uid;
    } catch {
      // Continue with unknown admin user
    }

    // Parse request body
    const { userId, role, reason }: SetRoleRequest = req.body;

    // Validate required fields
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "Bad request",
        error: "userId and role are required",
      });
    }

    // Validate role value
    const validRoles: UserRole[] = ["admin", "moderator", "business", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Bad request",
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Prevent self-demotion (safety measure)
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.uid === userId && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Bad request",
        error: "Cannot demote yourself. Ask another admin to change your role.",
      });
    }

    // Set the role
    const auditReason = reason || `Updated by admin ${adminUserId}`;
    const success = await setUserRole(userId, role, {
      reason: auditReason,
    });

    if (!success) {
      // Log audit trail for failed attempt
      await logger.log("role_assignment_failed", {
        adminUserId,
        targetUserId: userId,
        requestedRole: role,
        reason: auditReason,
        timestamp: new Date().toISOString(),
      });

      return res.status(500).json({
        success: false,
        message: "Failed to update role",
        error: "An error occurred while updating the user role",
      });
    }

    // Log successful audit trail
    await logger.log("role_assignment_successful", {
      adminUserId,
      targetUserId: userId,
      newRole: role,
      reason: auditReason,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: `Successfully updated user role to ${role}`,
    });
  } catch (error) {
    console.error("Role assignment error:", error);

    // Log the error
    await logger.log("role_assignment_error", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "An unexpected error occurred",
    });
  }
}
