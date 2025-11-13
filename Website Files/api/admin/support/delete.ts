import type { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize Firebase Admin once (same pattern as other admin endpoints)
let admin: any = null;
let initError: string | null = null;

async function getAdmin() {
  if (admin) return admin;
  try {
    const imported = await import("firebase-admin");
    admin = (imported as any).default ? (imported as any).default : imported;

    const apps = (admin as any).apps;
    if (!apps || (Array.isArray(apps) && apps.length === 0)) {
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (!serviceAccountBase64) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable not set"
        );
      }
      const serviceAccountJson = Buffer.from(
        serviceAccountBase64,
        "base64"
      ).toString("utf-8");
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    return admin;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    initError = errMsg;
    console.error("Firebase Admin initialization failed:", error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const adm = await getAdmin().catch(() => null);
  if (!adm) {
    return res.status(501).json({
      message:
        initError ||
        "Firebase Admin SDK not initialized. Check server configuration.",
    });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!token)
      return res.status(401).json({ message: "Missing Bearer token" });

    let decoded: any;
    try {
      decoded = await adm.auth().verifyIdToken(token);
    } catch (e: any) {
      console.error("verifyIdToken failed", e?.message || e);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const db = adm.firestore();
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerProfile = callerDoc.exists ? callerDoc.data() : null;
    const callerEmail = decoded.email || callerProfile?.email;
    const isAdmin =
      (callerProfile?.role &&
        String(callerProfile.role).toLowerCase() === "admin") ||
      callerEmail === "admin@vortexpcs.com" ||
      callerEmail === "info@vortexpcs.com";
    if (!isAdmin)
      return res.status(403).json({ message: "Admin privileges required" });

    const { ticketId } = (req.body || {}) as { ticketId?: string };
    if (!ticketId) {
      return res.status(400).json({ message: "ticketId is required" });
    }

    const docRef = db.collection("support_tickets").doc(ticketId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const data = snap.data() || {};
    const status = String(data.status || "").toLowerCase();
    if (status !== "closed") {
      return res
        .status(400)
        .json({ message: "Only closed tickets can be deleted" });
    }

    // Delete the ticket document
    await docRef.delete();

    // Audit log (best-effort)
    try {
      await db.collection("admin_audit_logs").add({
        type: "support_ticket_deleted",
        ticketId,
        performedBy: decoded.uid,
        performedAt: adm.firestore.FieldValue.serverTimestamp(),
      });
    } catch {}

    return res.status(200).json({ success: true, deleted: true });
  } catch (error: any) {
    console.error("support ticket delete error", error);
    return res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
}
