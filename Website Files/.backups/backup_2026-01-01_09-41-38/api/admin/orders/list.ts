import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import { withErrorHandler } from "../../middleware/error-handler.js";

function ensureAdminInitialized() {
  if (!admin.apps.length) {
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!credsBase64) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not found");
    }
    const creds = JSON.parse(
      Buffer.from(credsBase64, "base64").toString("utf-8")
    );
    admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
  }
}

function normalizeTs(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof admin.firestore.Timestamp) {
    return val.toDate().toISOString();
  }
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "number") return new Date(val).toISOString();
  if (typeof val === "string") return val;
  return null;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  ensureAdminInitialized();

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length);
  const decoded = await admin.auth().verifyIdToken(token);
  const userRecord = await admin.auth().getUser(decoded.uid);
  const email = (decoded.email || userRecord.email || "").toLowerCase();

  // Resolve role from custom claims or Firestore profile
  let firestoreRole: string | undefined;
  try {
    const snap = await admin
      .firestore()
      .collection("users")
      .doc(decoded.uid)
      .get();
    const data = snap.data();
    if (data && typeof data === "object" && "role" in data) {
      const roleVal = (data as { role?: unknown }).role;
      firestoreRole =
        typeof roleVal === "string" ? roleVal.toLowerCase() : undefined;
    }
  } catch (e) {
    console.warn("orders/list Firestore role lookup failed", e);
  }

  const claimsRole = String(
    (userRecord.customClaims || {}).role || ""
  ).toLowerCase();

  const rawAllow = (process.env.ADMIN_ALLOWLIST || "")
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const allow = new Set<string>(
    rawAllow.length ? rawAllow : ["admin@vortexpcs.com"]
  );

  const isAdmin =
    claimsRole === "admin" ||
    (firestoreRole || "") === "admin" ||
    (email && allow.has(email));

  if (!isAdmin) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const limitParam = Number(req.query.limit) || 500;

  // Primary query: orderDate desc
  const db = admin.firestore();
  const primarySnap = await db
    .collection("orders")
    .orderBy("orderDate", "desc")
    .limit(limitParam)
    .get();

  // Legacy query: missing orderDate
  let legacySnap: FirebaseFirestore.QuerySnapshot | null = null;
  try {
    legacySnap = await db
      .collection("orders")
      .where("orderDate", "==", null)
      .orderBy("createdAt", "desc")
      .limit(Math.min(limitParam, 500))
      .get();
  } catch (e) {
    console.warn("orders/list legacy query failed", e);
  }

  const merged = new Map<string, Record<string, unknown>>();

  const pushDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    const key =
      (data.paymentId as string | undefined) || data.orderId || doc.id;
    if (!merged.has(key)) {
      merged.set(key, {
        id: doc.id,
        ...data,
        orderDate: normalizeTs(data.orderDate),
        estimatedCompletion: normalizeTs(data.estimatedCompletion),
        deliveryDate: normalizeTs(data.deliveryDate),
      });
    }
  };

  primarySnap.forEach(pushDoc);
  legacySnap?.forEach(pushDoc);

  const orders = Array.from(merged.values()).sort((a, b) => {
    const ta = a.orderDate ? new Date(String(a.orderDate)).getTime() : 0;
    const tb = b.orderDate ? new Date(String(b.orderDate)).getTime() : 0;
    return tb - ta;
  });

  return res.status(200).json({ orders, count: orders.length });
}

export default withErrorHandler(handler);
