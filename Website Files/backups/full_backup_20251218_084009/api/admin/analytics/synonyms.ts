import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

let initError: Error | null = null;
let firestoreDb: FirebaseFirestore.Firestore | null = null;

function initAdminOnce() {
  if (getApps().length) return;
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, "\n");
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      return;
    }
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!base64) {
      initError = new Error("Missing Firebase admin credentials (synonyms)");
      return;
    }
    const json = Buffer.from(base64, "base64").toString("utf-8");
    initializeApp({ credential: cert(JSON.parse(json)) });
  } catch (e) {
    console.error("Admin init failed (synonyms)", e);
    initError = e instanceof Error ? e : new Error(String(e));
    // avoid module-scope crash
  }
}
try {
  initAdminOnce();
} catch {}

function getDb() {
  if (firestoreDb) return firestoreDb;
  try {
    firestoreDb = getFirestore();
    return firestoreDb;
  } catch (e) {
    initError = e instanceof Error ? e : new Error(String(e));
    return null;
  }
}

async function verifyAdmin(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return { ok: false, reason: "missing-bearer" };
  const token = authHeader.split("Bearer ")[1];
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    const email = (decoded.email || "").toLowerCase();
    const rawAllow = (process.env.ADMIN_ALLOWLIST || "admin@vortexpcs.com")
      .split(/[\n,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const allow = new Set(rawAllow);
    const db = getDb();
    if (!db) return { ok: false, reason: "db-unavailable" };
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const firestoreRole = (userDoc.data()?.role || "").toLowerCase();
    const claimsRole = String((decoded as any).role || "").toLowerCase();
    const isAdmin =
      allow.has(email) ||
      firestoreRole === "admin" ||
      claimsRole === "admin" ||
      userDoc.data()?.isAdmin === true;
    return { ok: isAdmin, email };
  } catch (e) {
    console.error("verifyAdmin error", e);
    return { ok: false, reason: "token-invalid" };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "method-not-allowed" });

  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.ok)
    return res
      .status(401)
      .json({ error: "not-admin", detail: adminCheck.reason });

  try {
    if (initError) {
      return res.status(500).json({
        error: "firebase-init-failed",
        message: initError.message,
      });
    }
    const db = getDb();
    if (!db)
      return res.status(500).json({
        error: "firestore-unavailable",
        message: "Firestore could not be initialized",
      });
    const { action, canonical, variant } = req.body || {};
    if (!action || !canonical || !variant)
      return res.status(400).json({ error: "missing-fields" });
    const canonicalNorm = String(canonical).trim().toLowerCase();
    const variantNorm = String(variant).trim();

    if (action === "accept") {
      await db.collection("searchSynonyms").add({
        canonical: canonicalNorm,
        variant: variantNorm,
        createdAt: Timestamp.now(),
        createdBy: adminCheck.email,
      });
      await db.collection("security_events").add({
        type: "accept_synonym",
        canonical: canonicalNorm,
        variant: variantNorm,
        performedBy: adminCheck.email,
        timestamp: Timestamp.now(),
      });
      return res.status(200).json({ ok: true, status: "accepted" });
    }
    if (action === "ignore") {
      await db.collection("searchIgnoredCorrections").add({
        canonical: canonicalNorm,
        variant: variantNorm,
        createdAt: Timestamp.now(),
        createdBy: adminCheck.email,
      });
      await db.collection("security_events").add({
        type: "ignore_correction",
        canonical: canonicalNorm,
        variant: variantNorm,
        performedBy: adminCheck.email,
        timestamp: Timestamp.now(),
      });
      return res.status(200).json({ ok: true, status: "ignored" });
    }
    return res.status(400).json({ error: "invalid-action" });
  } catch (e: any) {
    console.error("synonyms endpoint error", e);
    return res.status(500).json({ error: "server-error", message: e.message });
  }
}
