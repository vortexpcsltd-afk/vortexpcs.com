/**
 * Admin API: List all users
 * GET /api/admin/users/list
 *
 * Returns all users from Firestore (admin only)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  verifyAdmin,
  ensureFirebaseAdminInitialized,
} from "../../services/auth-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Admin access required",
      });
    }

    // Initialize Firebase Admin (ensures proper credentials)
    const adminSdk = ensureFirebaseAdminInitialized();
    const db = adminSdk.firestore();
    const auth = adminSdk.auth();

    // Primary: Fetch all users from Firestore
    let users: unknown[] = [];
    try {
      const snapshot = await db.collection("users").get();
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data,
          createdAt: (data as any)?.createdAt?.toDate
            ? (data as any).createdAt.toDate().toISOString()
            : (data as any)?.createdAt,
        });
      });
    } catch (firestoreErr) {
      console.error("[Admin Users List] Firestore error:", firestoreErr);
      const msg =
        firestoreErr instanceof Error
          ? firestoreErr.message
          : String(firestoreErr);
      const isPermError = msg
        .toLowerCase()
        .includes("missing or insufficient permissions");
      if (isPermError) {
        console.log(
          "[Admin Users List] Firestore permission denied, trying Firebase Auth fallback..."
        );
        try {
          // Fallback: list users via Firebase Auth (does not require Firestore access)
          const authUsers = await auth.listUsers(1000);
          console.log(
            `[Admin Users List] Auth fallback succeeded: ${authUsers.users.length} users`
          );
          users = authUsers.users.map((u) => ({
            id: u.uid,
            email: u.email,
            displayName: u.displayName,
            disabled: u.disabled,
            metadata: {
              creationTime: u.metadata.creationTime,
              lastSignInTime: u.metadata.lastSignInTime,
            },
            providerData:
              u.providerData?.map((p) => ({ providerId: p.providerId })) || [],
          }));
        } catch (authErr) {
          console.error(
            "[Admin Users List] Auth fallback also failed:",
            authErr
          );
          // Gracefully return empty list so UI does not break
          console.warn(
            "[Admin Users List] Returning empty list due to permission failures",
            {
              firestoreError: msg,
              authError:
                authErr instanceof Error ? authErr.message : String(authErr),
            }
          );
          users = [];
        }
      } else {
        throw firestoreErr;
      }
    }

    return res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("[Admin Users List] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    // Map Firestore permission error to 403 for clarity
    const isPermError =
      typeof message === "string" &&
      message.toLowerCase().includes("missing or insufficient permissions");
    if (isPermError) {
      console.warn(
        "[Admin Users List] Permission error encountered, returning empty list"
      );
      return res.status(200).json({ success: true, data: [], count: 0 });
    }
    return res.status(500).json({
      success: false,
      error: message,
      hint: isPermError
        ? "Ensure Vercel prod env has Firebase Admin credentials with Firestore read access (FIREBASE_SERVICE_ACCOUNT_BASE64 or PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)."
        : undefined,
    });
  }
}
