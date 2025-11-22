import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ApiError } from "../../../types/api";

// Lazy import to avoid cold-start overhead when not needed
let admin: typeof import("firebase-admin") | null = null;
let initialized = false;

async function getAdmin() {
  if (!admin) {
    admin = await import("firebase-admin");
  }
  if (!initialized) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      }
      initialized = true;
    } catch (e) {
      // Initialization failed likely due to missing credentials
      initialized = false;
    }
  }
  return admin!;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Ensure admin SDK is available
  const adm = await getAdmin();
  if (!initialized) {
    return res.status(501).json({
      message:
        "Firebase Admin SDK not initialized. Provide GOOGLE_APPLICATION_CREDENTIALS or set up Application Default Credentials and FIREBASE_PROJECT_ID.",
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

    const { userId, role } = (req.body || {}) as {
      userId?: string;
      role?: string;
    };

    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required" });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!["admin", "user"].includes(normalizedRole)) {
      return res
        .status(400)
        .json({ message: "role must be 'admin' or 'user'" });
    }

    // Prevent self role changes through this endpoint for safety
    if (userId === callerUid) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    // Update Firestore profile role
    await db.collection("users").doc(userId).update({
      role: normalizedRole,
      updatedAt: adm.firestore.FieldValue.serverTimestamp(),
    });

    // Optionally, set custom claims (not strictly required by this app, which relies on Firestore role)
    // await adm.auth().setCustomUserClaims(userId, { role: normalizedRole });

    // Audit log (best-effort)
    try {
      await db.collection("admin_audit_logs").add({
        type: "role_update",
        targetUserId: userId,
        newRole: normalizedRole,
        performedBy: callerUid,
        performedAt: adm.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditError) {
      console.warn("update-role audit log failed:", auditError);
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error("update-role error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
}
