/**
 * Firebase Custom Claims Management
 * Server-side utility for setting user roles via Firebase Custom Claims
 *
 * CRITICAL: Only call this from secure backend endpoints with proper authorization
 * NEVER expose this to client-side code
 *
 * Usage:
 * - Set admin role: await setUserRole(userId, 'admin')
 * - Set moderator: await setUserRole(userId, 'moderator')
 * - Revoke role: await setUserRole(userId, 'user')
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { UserRole } from "../../utils/roleVerification";

let auth: ReturnType<typeof getAuth>;

// Initialize Firebase Admin SDK
try {
  const apps = getApps();
  if (apps.length === 0) {
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
  console.error("Failed to initialize Firebase Admin SDK:", error);
}

interface SetRoleOptions {
  permissions?: string[];
  expiresAt?: number;
  reason?: string; // Audit trail
}

/**
 * Set user role via Firebase Custom Claims
 * CRITICAL: This is the ONLY way to set admin roles
 *
 * @param userId - Firebase user ID
 * @param role - New role (admin, moderator, business, user)
 * @param options - Additional options for permissions and audit trail
 * @returns true if successful, false otherwise
 */
export async function setUserRole(
  userId: string,
  role: UserRole,
  options: SetRoleOptions = {}
): Promise<boolean> {
  try {
    if (!auth) {
      console.error("Firebase Admin SDK not initialized");
      return false;
    }

    // Validate role
    const validRoles: UserRole[] = ["admin", "moderator", "business", "user"];
    if (!validRoles.includes(role)) {
      console.error("Invalid role:", role);
      return false;
    }

    // Build custom claims
    const customClaims: Record<string, unknown> = {
      role,
      updatedAt: Date.now(),
      ...options,
    };

    // Set custom claims
    await auth.setCustomUserClaims(userId, customClaims);
    console.log(`✅ Set role ${role} for user ${userId}`, {
      customClaims,
      reason: options.reason,
    });

    return true;
  } catch (error) {
    console.error(`Failed to set role for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get user role from Firebase Custom Claims
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    if (!auth) {
      console.error("Firebase Admin SDK not initialized");
      return null;
    }

    const userRecord = await auth.getUser(userId);
    const customClaims = userRecord.customClaims || {};
    return (customClaims.role as UserRole) || "user";
  } catch (error) {
    console.error(`Failed to get role for user ${userId}:`, error);
    return null;
  }
}

/**
 * Revoke all custom claims (demote to user)
 */
export async function revokeRole(userId: string): Promise<boolean> {
  try {
    if (!auth) {
      console.error("Firebase Admin SDK not initialized");
      return false;
    }

    await auth.setCustomUserClaims(userId, null);
    console.log(`✅ Revoked role for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to revoke role for user ${userId}:`, error);
    return false;
  }
}

/**
 * List all users with a specific role
 * Useful for admin operations
 */
export async function listUsersByRole(role: UserRole): Promise<string[]> {
  try {
    if (!auth) {
      console.error("Firebase Admin SDK not initialized");
      return [];
    }

    const userIds: string[] = [];
    let pageToken: string | undefined;

    // Firebase's listUsers is paginated (max 1000 per page)
    do {
      const result = await auth.listUsers(1000, pageToken);

      for (const userRecord of result.users) {
        const userRole = (userRecord.customClaims?.role as UserRole) || "user";
        if (userRole === role) {
          userIds.push(userRecord.uid);
        }
      }

      pageToken = result.pageToken;
    } while (pageToken);

    console.log(`Found ${userIds.length} users with role: ${role}`);
    return userIds;
  } catch (error) {
    console.error(`Failed to list users by role ${role}:`, error);
    return [];
  }
}

/**
 * DANGEROUS: Bulk set role for multiple users
 * Only use for administrative operations
 */
export async function bulkSetRole(
  userIds: string[],
  role: UserRole
): Promise<{ successful: string[]; failed: string[] }> {
  const successful: string[] = [];
  const failed: string[] = [];

  for (const userId of userIds) {
    try {
      const success = await setUserRole(userId, role, {
        reason: "Bulk role assignment",
      });
      if (success) {
        successful.push(userId);
      } else {
        failed.push(userId);
      }
    } catch (error) {
      console.error(`Error setting role for ${userId}:`, error);
      failed.push(userId);
    }
  }

  console.log(`Bulk role assignment complete`, {
    role,
    successful: successful.length,
    failed: failed.length,
  });

  return { successful, failed };
}
