import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { UserProfile } from "../../types/api.js";

// Firebase Admin singleton
let admin: typeof import("firebase-admin") | null = null;
let initialized = false;

async function initAdmin() {
  if (admin && initialized) return admin;
  const imported = await import("firebase-admin");
  admin = imported;

  if (!initialized) {
    try {
      const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (saB64) {
        let creds: any;
        try {
          const json = Buffer.from(saB64, "base64").toString("utf-8");
          creds = JSON.parse(json);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_BASE64: ${msg}`);
        }
        if (!admin.apps.length) {
          const projectId =
            creds?.project_id || process.env.FIREBASE_PROJECT_ID;
          if (!projectId) {
            throw new Error(
              "Missing project_id in service account and FIREBASE_PROJECT_ID env"
            );
          }
          try {
            admin.initializeApp({
              credential: admin.credential.cert(creds),
              projectId,
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(`Firebase admin init failed: ${msg}`);
          }
        }
      } else {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID,
          });
        }
      }
      initialized = true;
    } catch (e: unknown) {
      initialized = false;
      console.error("Firebase Admin init failed (claim-orders)", e);
    }
  }
  return admin;
}

import { withSecureMethod } from "../middleware/apiSecurity.js";

export default withSecureMethod(
  "POST",
  async (req: VercelRequest, res: VercelResponse) => {
    const adminInstance = await initAdmin();
    if (!initialized || !adminInstance) {
      res.setHeader("X-Diagnostic", "admin-init-failed");
      return res.status(503).json({
        error: "Service unavailable",
        reason: "FIREBASE_ADMIN_INIT_FAILED",
        details:
          "Firebase Admin SDK not initialized. Configure FIREBASE_SERVICE_ACCOUNT_BASE64 or ADC + FIREBASE_PROJECT_ID.",
      });
    }

    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;
      if (!token)
        return res.status(401).json({ message: "Missing Bearer token" });

      const decoded = await adminInstance.auth().verifyIdToken(token);
      const db = adminInstance.firestore();

      const { uid, email } = (req.body || {}) as {
        uid?: string;
        email?: string;
      };
      if (!uid || !email) {
        return res.status(400).json({ message: "uid and email are required" });
      }

      // Caller must be same user or admin
      const callerDoc = await db.collection("users").doc(decoded.uid).get();
      const callerProfile = callerDoc.exists
        ? (callerDoc.data() as UserProfile)
        : null;
      const callerEmail = decoded.email || callerProfile?.email;
      const isAdmin =
        (callerProfile?.role &&
          String(callerProfile.role).toLowerCase() === "admin") ||
        callerEmail === "admin@vortexpcs.com" ||
        callerEmail === "info@vortexpcs.com";

      if (!isAdmin && decoded.uid !== uid) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const ordersRef = db.collection("orders");

      // Find any orders by email that are still owned by a guest placeholder
      const snap = await ordersRef.where("customerEmail", "==", email).get();
      let updated = 0;
      const batch = db.batch();
      snap.forEach((doc) => {
        const data = doc.data() as { userId?: string };
        const existingUserId = data.userId || "";
        if (
          existingUserId !== uid &&
          (existingUserId === "guest" ||
            existingUserId === "" ||
            existingUserId.startsWith("guest_"))
        ) {
          batch.update(doc.ref, {
            userId: uid,
            updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
          });
          updated++;
        }
      });

      if (updated > 0) {
        await batch.commit();
      }

      return res.status(200).json({ success: true, updated });
    } catch (e: unknown) {
      console.error("claim-orders error", e);
      const msg = (e as Error)?.message || "Internal Server Error";
      return res.status(500).json({ message: msg });
    }
  }
);
