/**
 * Firebase Custom Claims Setup Utility
 * Initialize admin roles for first-time setup
 *
 * CRITICAL: Run this ONCE during initial deployment to set bootstrap admins
 *
 * Usage (from Node.js script):
 * const { setupInitialAdmins } = await import('./api/services/firebaseSetup');
 * await setupInitialAdmins();
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { logger } from "../../services/logger";

let isInitialized = false;

/**
 * Initialize Firebase Admin SDK if not already done
 */
function initializeFirebaseAdmin() {
  if (isInitialized) return;

  try {
    const apps = getApps();
    if (apps.length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (!serviceAccountJson) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable not set"
        );
      }

      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountJson, "base64").toString("utf-8")
      );
      initializeApp({
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      });
    }
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

/**
 * Setup initial admin users from environment variable
 * VORTEX_INITIAL_ADMINS should contain comma-separated email addresses
 */
export async function setupInitialAdmins(): Promise<void> {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();

    const adminEmails = (process.env.VORTEX_INITIAL_ADMINS || "")
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (adminEmails.length === 0) {
      console.log(
        "⚠️  No initial admins configured. Set VORTEX_INITIAL_ADMINS environment variable."
      );
      return;
    }

    console.log(`🔧 Setting up ${adminEmails.length} initial admin(s)...`);

    const results = {
      success: 0,
      failed: 0,
      notFound: 0,
    };

    for (const email of adminEmails) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        const customClaims = userRecord.customClaims || {};
        const currentRole = customClaims.role || "user";

        if (currentRole === "admin") {
          console.log(`✅ ${email} - Already admin`);
          results.success++;
          continue;
        }

        await auth.setCustomUserClaims(userRecord.uid, {
          ...customClaims,
          role: "admin",
          setupAt: new Date().toISOString(),
        });

        console.log(`✅ ${email} - Promoted to admin`);
        results.success++;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("user not found")
        ) {
          console.log(
            `⚠️  ${email} - User not found (will be admin when they sign up)`
          );
          results.notFound++;
        } else {
          console.error(`❌ ${email} - Failed:`, error);
          results.failed++;
        }
      }
    }

    console.log("\n📊 Setup Results:");
    console.log(`✅ Success: ${results.success}`);
    console.log(`⚠️  Not Found: ${results.notFound}`);
    console.log(`❌ Failed: ${results.failed}`);

    if (results.success > 0) {
      console.log(
        "\n🎉 Admin setup complete! Users can now log in with admin access."
      );
    }
  } catch (error) {
    console.error("Admin setup failed:", error);
    throw error;
  }
}

/**
 * Verify a user has admin role
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    const userRecord = await auth.getUser(userId);
    const customClaims = userRecord.customClaims || {};
    return customClaims.role === "admin";
  } catch (error) {
    console.error(`Failed to check admin status for user ${userId}:`, error);
    return false;
  }
}

/**
 * List all admin users
 */
export async function listAdminUsers(): Promise<
  Array<{ uid: string; email: string; displayName: string }>
> {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    const admins: Array<{ uid: string; email: string; displayName: string }> =
      [];
    let pageToken: string | undefined;

    do {
      const result = await auth.listUsers(1000, pageToken);

      for (const userRecord of result.users) {
        const customClaims = userRecord.customClaims || {};
        if (customClaims.role === "admin") {
          admins.push({
            uid: userRecord.uid,
            email: userRecord.email || "unknown",
            displayName: userRecord.displayName || "Unknown",
          });
        }
      }

      pageToken = result.pageToken;
    } while (pageToken);

    return admins;
  } catch (error) {
    console.error("Failed to list admin users:", error);
    return [];
  }
}

/**
 * Remove admin role from user (demote to regular user)
 */
export async function removeAdminRole(userId: string): Promise<boolean> {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    const userRecord = await auth.getUser(userId);
    const customClaims = userRecord.customClaims || {};

    // Remove role from custom claims
    const { role: _role, ...remainingClaims } = customClaims;
    await auth.setCustomUserClaims(userId, remainingClaims);

    console.log(
      `✅ Removed admin role from user ${userId} (${userRecord.email})`
    );
    return true;
  } catch (error) {
    console.error(`Failed to remove admin role from ${userId}:`, error);
    return false;
  }
}
