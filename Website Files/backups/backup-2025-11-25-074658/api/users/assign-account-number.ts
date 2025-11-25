import type { VercelRequest, VercelResponse } from "@vercel/node";

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
        const json = Buffer.from(saB64, "base64").toString("utf-8");
        const creds = JSON.parse(json);
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(creds),
            projectId: creds.project_id,
          });
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
      console.error("Firebase Admin init failed", e);
    }
  }
  return admin;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const adminInstance = await initAdmin();
  if (!initialized || !adminInstance) {
    return res.status(501).json({
      message:
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

    const { uid, accountType } = (req.body || {}) as {
      uid?: string;
      accountType?: "general" | "business";
    };

    if (!uid) return res.status(400).json({ message: "uid is required" });

    // Caller must be the same user or an admin
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerProfile = callerDoc.exists ? callerDoc.data() : null;
    const callerEmail = decoded.email || callerProfile?.email;
    const isAdmin =
      (callerProfile?.role &&
        String(callerProfile.role).toLowerCase() === "admin") ||
      callerEmail === "admin@vortexpcs.com" ||
      callerEmail === "info@vortexpcs.com";

    if (!isAdmin && decoded.uid !== uid) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const userRef = db.collection("users").doc(uid);
    const result = await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("User profile not found");
      const user = userSnap.data() as Record<string, unknown>;

      if (user.accountNumber) {
        return {
          accountNumber: user.accountNumber,
          accountType: user.accountType || accountType || "general",
        };
      }

      const inferredType =
        user && typeof user.accountType === "string"
          ? (user.accountType as string)
          : undefined;
      const type: "general" | "business" =
        inferredType === "business"
          ? "business"
          : inferredType === "general"
          ? "general"
          : accountType || "general";
      const countersRef = db.collection("counters").doc("accountNumbers");
      const countersSnap = await tx.get(countersRef);
      const data = (
        countersSnap.exists
          ? (countersSnap.data() as Record<string, unknown>)
          : {}
      ) as Record<string, unknown>;

      if (type === "business") {
        const current =
          typeof data?.business === "number" ? (data.business as number) : 0;
        const next = current + 1;
        tx.set(countersRef, { business: next }, { merge: true });
        const padded = String(next).padStart(6, "0");
        const accountNumber = `VTXBUS-${padded}`;
        tx.set(
          userRef,
          { accountNumber, accountType: "business" },
          { merge: true }
        );
        return { accountNumber, accountType: "business" };
      } else {
        const current =
          typeof data?.general === "number" ? (data.general as number) : 0;
        const next = current + 1;
        tx.set(countersRef, { general: next }, { merge: true });
        const padded = String(next).padStart(6, "0");
        const accountNumber = `VTX-${padded}`;
        tx.set(
          userRef,
          { accountNumber, accountType: "general" },
          { merge: true }
        );
        return { accountNumber, accountType: "general" };
      }
    });

    // Best-effort audit log
    try {
      await db.collection("admin_audit_logs").add({
        type: "assign_account_number",
        targetUid: uid,
        accountNumber: result.accountNumber,
        accountType: result.accountType,
        performedBy: decoded.uid,
        performedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditError: unknown) {
      console.warn("assign-account-number audit log failed:", auditError);
    }

    return res.status(200).json({ success: true, ...result });
  } catch (e: unknown) {
    console.error("assign-account-number error", e);
    const msg = (e as Error)?.message || "Internal Server Error";
    return res.status(500).json({ message: msg });
  }
}
