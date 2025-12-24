/**
 * Role Verification Utility
 * Handles server-side role verification with Firebase Custom Claims
 * Never trust client-side role claims - always verify with server
 */

import { logger } from "../services/logger";

export type UserRole = "admin" | "moderator" | "user" | "business" | "guest";

export interface RoleVerificationResult {
  verified: boolean;
  role: UserRole;
  customClaims: Record<string, unknown>;
  error?: string;
  timestamp: number;
}

/**
 * Verify user role with backend server
 * This is the ONLY way to verify admin access
 * Never trust localStorage or client-side role data
 */
export async function verifyUserRole(
  idToken: string
): Promise<RoleVerificationResult> {
  try {
    if (!idToken) {
      logger.warn("verifyUserRole: No ID token provided");
      return {
        verified: false,
        role: "guest",
        customClaims: {},
        error: "No authentication token",
        timestamp: Date.now(),
      };
    }

    const response = await fetch("/api/admin/verify-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ timestamp: Date.now() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.warn("Role verification failed", {
        status: response.status,
        error: errorData.error || "Unknown error",
      });
      return {
        verified: false,
        role: "guest",
        customClaims: {},
        error: errorData.error || "Role verification failed",
        timestamp: Date.now(),
      };
    }

    const result = (await response.json()) as Partial<RoleVerificationResult>;
    logger.debug("Role verification successful", {
      role: result.role,
      verified: result.verified,
    });

    return {
      verified: result.verified ?? false,
      role: (result.role ?? "guest") as UserRole,
      customClaims: result.customClaims ?? {},
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error("Role verification error", { error });
    return {
      verified: false,
      role: "guest",
      customClaims: {},
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Check if user has admin role
 * CRITICAL: Must verify with server, never trust client-side claims
 */
export async function isUserAdmin(idToken: string): Promise<boolean> {
  const result = await verifyUserRole(idToken);
  return result.verified && result.role === "admin";
}

/**
 * Check if user has specific role or higher
 * Role hierarchy: admin > moderator > business > user > guest
 */
export function hasRoleOrHigher(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 5,
    moderator: 4,
    business: 3,
    user: 2,
    guest: 1,
  };

  return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
}

/**
 * Format role for display
 */
export function formatRole(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    admin: "Administrator",
    moderator: "Moderator",
    business: "Business Account",
    user: "Standard User",
    guest: "Guest",
  };
  return roleLabels[role] || role;
}

/**
 * Get role color for UI display
 */
export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    admin: "bg-red-500",
    moderator: "bg-orange-500",
    business: "bg-blue-500",
    user: "bg-gray-500",
    guest: "bg-gray-400",
  };
  return roleColors[role] || "bg-gray-500";
}

/**
 * Clear cached role verification (forces fresh check on next verification)
 */
export function clearRoleCache(): void {
  try {
    sessionStorage.removeItem("vortex_role_cache");
  } catch {
    // Ignore storage errors
  }
}
