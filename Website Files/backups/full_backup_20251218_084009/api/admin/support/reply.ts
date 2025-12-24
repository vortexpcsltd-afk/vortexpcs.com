import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ApiError, DecodedToken } from "../../../types/api";

// Initialize Firebase Admin once (same pattern as other admin endpoints)
type FirebaseAdmin = typeof import("firebase-admin");
let admin: FirebaseAdmin | null = null;
let initError: string | null = null;

async function getAdmin() {
  if (admin) return admin;
  try {
    const imported = await import("firebase-admin");
    const candidate = (imported as unknown as { default?: FirebaseAdmin })
      .default
      ? (imported as unknown as { default: FirebaseAdmin }).default
      : (imported as unknown as FirebaseAdmin);
    admin = candidate;

    if (!admin.apps || admin.apps.length === 0) {
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (!serviceAccountBase64) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable not set"
        );
      }
      let serviceAccount: any;
      try {
        const serviceAccountJson = Buffer.from(
          serviceAccountBase64,
          "base64"
        ).toString("utf-8");
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_BASE64: ${msg}`);
      }
      const projectId =
        serviceAccount?.project_id || process.env.FIREBASE_PROJECT_ID;
      if (!projectId) {
        throw new Error(
          "Missing project_id in service account and FIREBASE_PROJECT_ID env"
        );
      }
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Firebase admin init failed: ${msg}`);
      }
    }
    return admin;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    initError = errMsg;
    console.error("Firebase Admin initialization failed:", error);
    throw error;
  }
}

type Attachment = {
  name: string;
  url: string;
  size?: number;
  type?: string;
  path: string;
  scanStatus?: "pending" | "clean" | "infected" | "error";
};

type Body = {
  ticketId?: string;
  body?: string;
  internal?: boolean;
  attachments?: Attachment[];
};

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const adm = await getAdmin().catch(() => null);
  if (!adm) {
    res.setHeader("X-Diagnostic", "admin-init-failed");
    return res.status(503).json({
      error: "Service unavailable",
      reason: "FIREBASE_ADMIN_INIT_FAILED",
      details:
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

    let decoded: DecodedToken;
    try {
      decoded = await adm.auth().verifyIdToken(token);
    } catch (e: unknown) {
      const error = e as ApiError;
      console.error("verifyIdToken failed", error?.message || e);
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

    const { ticketId, body, internal, attachments }: Body = req.body || {};
    if (!ticketId || !body) {
      return res
        .status(400)
        .json({ message: "ticketId and body are required" });
    }

    const docRef = db.collection("support_tickets").doc(ticketId);
    const snap = await docRef.get();
    if (!snap.exists)
      return res.status(404).json({ message: "Ticket not found" });

    const data = snap.data() || {};
    const existing = Array.isArray(data.messages) ? data.messages : [];

    const entry = {
      senderId: decoded.uid || null,
      senderName: callerProfile?.displayName || callerEmail || null,
      body,
      internal: !!internal,
      timestamp: adm.firestore.Timestamp.now(),
      attachments: Array.isArray(attachments) ? attachments : [],
    };

    await docRef.update({
      messages: [...existing, entry],
      updatedAt: adm.firestore.Timestamp.now(),
    });

    return res.status(200).json({ success: true, message: entry });
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error("support ticket reply error", err);
    return res
      .status(500)
      .json({ message: err?.message || "Internal Server Error" });
  }
}

export default handler;
