import type { VercelRequest, VercelResponse } from "@vercel/node";

// Firebase Admin singleton (align with other endpoints)
let admin: any = null;
let initialized = false;

async function getAdmin() {
  if (admin && initialized) return admin;
  const imported = await import("firebase-admin");
  admin = (imported as any).default ? (imported as any).default : imported;

  if (!initialized) {
    try {
      // Prefer explicit base64 credential (Vercel-friendly)
      const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (saB64) {
        const json = Buffer.from(saB64, "base64").toString("utf-8");
        const creds = JSON.parse(json);
        if (!(admin as any).apps?.length) {
          admin.initializeApp({
            credential: admin.credential.cert(creds),
            projectId: creds.project_id,
          });
        }
      } else {
        // Fallback to Application Default Credentials (useful locally)
        if (!(admin as any).apps?.length) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID,
          });
        }
      }
      initialized = true;
    } catch (e) {
      initialized = false;
      console.error("Firebase Admin init failed in delete user", e);
    }
  }
  return admin;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Ensure admin SDK is available
  const adm = await getAdmin();
  if (!initialized) {
    return res.status(501).json({
      message:
        "Firebase Admin SDK not initialized. Configure FIREBASE_SERVICE_ACCOUNT_BASE64 (preferred) or ADC + FIREBASE_PROJECT_ID.",
    });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Missing Bearer token" });
    }

    // Verify the Firebase ID token
    const decoded = await adm.auth().verifyIdToken(token);

    // Fetch the caller's Firestore user profile to check role
    const callerUid = decoded.uid;
    const db = adm.firestore();
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerProfile = callerDoc.exists ? callerDoc.data() : null;
    const callerEmail = decoded.email || callerProfile?.email;
    const isAdmin =
      (callerProfile?.role &&
        String(callerProfile.role).toLowerCase() === "admin") ||
      callerEmail === "admin@vortexpcs.com";

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    const { userId } = (req.body || {}) as { userId?: string };

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Prevent self-deletion for safety
    if (userId === callerUid) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    // Delete user authentication account
    try {
      await adm.auth().deleteUser(userId);
    } catch (authError: any) {
      // If user doesn't exist in Auth, continue with Firestore cleanup
      if (authError.code !== "auth/user-not-found") {
        throw authError;
      }
    }

    // Delete Firestore user document
    await db.collection("users").doc(userId).delete();

    // Delete related data (best-effort cleanup)
    const batch = db.batch();
    let deletedOrders = 0;
    let deletedConfigs = 0;
    let deletedTickets = 0;

    try {
      // Delete user's orders
      const ordersSnapshot = await db
        .collection("orders")
        .where("userId", "==", userId)
        .get();
      ordersSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deletedOrders++;
      });

      // Delete user's saved configurations
      const configsSnapshot = await db
        .collection("configurations")
        .where("userId", "==", userId)
        .get();
      configsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deletedConfigs++;
      });

      // Delete user's support tickets
      const ticketsSnapshot = await db
        .collection("support_tickets")
        .where("userId", "==", userId)
        .get();
      ticketsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deletedTickets++;
      });

      // Commit batch deletion
      await batch.commit();
    } catch (cleanupError) {
      console.error("Cleanup error (non-fatal):", cleanupError);
    }

    // Audit log
    try {
      await db.collection("admin_audit_logs").add({
        type: "user_deletion",
        targetUserId: userId,
        performedBy: callerUid,
        performedAt: adm.firestore.FieldValue.serverTimestamp(),
        cleanup: {
          orders: deletedOrders,
          configurations: deletedConfigs,
          supportTickets: deletedTickets,
        },
      });
    } catch {}

    return res.status(200).json({
      success: true,
      deleted: {
        user: true,
        orders: deletedOrders,
        configurations: deletedConfigs,
        supportTickets: deletedTickets,
      },
    });
  } catch (error: any) {
    console.error("delete-user error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
}
