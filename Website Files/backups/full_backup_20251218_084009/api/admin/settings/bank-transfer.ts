import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";

function ensureAdminInitialized() {
  if (!admin.apps.length) {
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!credsBase64) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not found");
    }
    let creds: any;
    try {
      const decoded = Buffer.from(credsBase64, "base64").toString("utf-8");
      creds = JSON.parse(decoded);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_BASE64: ${msg}`);
    }
    const projectId = creds?.project_id || process.env.FIREBASE_PROJECT_ID;
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
}

async function isAdminRequest(
  req: VercelRequest
): Promise<{ ok: boolean; email?: string }> {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return { ok: false };
  const token = auth.slice("Bearer ".length);
  const decoded = await admin.auth().verifyIdToken(token);
  const userRecord = await admin.auth().getUser(decoded.uid);
  const email = (decoded.email || userRecord.email || "").toLowerCase();

  // allowlist or custom claims/Firestore role
  const rawAllow = (process.env.ADMIN_ALLOWLIST || "")
    .split(/[\,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const allow = new Set<string>(
    rawAllow.length ? rawAllow : ["admin@vortexpcs.com"]
  );

  let firestoreRole: string | undefined;
  try {
    const snap = await admin
      .firestore()
      .collection("users")
      .doc(decoded.uid)
      .get();
    if (snap.exists) {
      const d = snap.data() || {};
      const r = (d as { role?: unknown }).role;
      firestoreRole = typeof r === "string" ? r.toLowerCase() : undefined;
    }
  } catch {
    // ignore
  }

  const claimsRole = String(
    (userRecord.customClaims || {}).role || ""
  ).toLowerCase();
  const ok =
    claimsRole === "admin" ||
    firestoreRole === "admin" ||
    (!!email && allow.has(email));
  return { ok, email };
}

async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    ensureAdminInitialized();
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    res.setHeader("X-Diagnostic", "admin-init-failed");
    return res.status(503).json({
      error: "Service unavailable",
      reason: "FIREBASE_ADMIN_INIT_FAILED",
      details: msg,
    });
  }

  // AuthN/Z
  try {
    const { ok } = await isAdminRequest(req);
    if (!ok) return res.status(401).json({ error: "Unauthorized" });
  } catch (e) {
    return res
      .status(401)
      .json({ error: "Unauthorized", details: (e as Error).message });
  }

  const fdb = admin.firestore();
  const docRef = fdb.collection("settings").doc("bank_transfer");

  if (req.method === "GET") {
    try {
      const snap = await docRef.get();
      const data = snap.exists ? snap.data() || {} : {};
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({
        error: "Failed to read settings",
        details: (e as Error).message,
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const allowed: Record<string, string | undefined> = {
        accountName:
          typeof body.accountName === "string" ? body.accountName : undefined,
        bankName: typeof body.bankName === "string" ? body.bankName : undefined,
        sortCode: typeof body.sortCode === "string" ? body.sortCode : undefined,
        accountNumber:
          typeof body.accountNumber === "string"
            ? body.accountNumber
            : undefined,
        iban: typeof body.iban === "string" ? body.iban : undefined,
        bic: typeof body.bic === "string" ? body.bic : undefined,
        referenceNote:
          typeof body.referenceNote === "string"
            ? body.referenceNote
            : undefined,
        instructions:
          typeof body.instructions === "string" ? body.instructions : undefined,
      };
      const payload: Record<string, unknown> = Object.fromEntries(
        Object.entries(allowed).filter(
          ([, v]) => typeof v === "string" && v !== ""
        )
      );
      payload.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await docRef.set(payload, { merge: true });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({
        error: "Failed to update settings",
        details: (e as Error).message,
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default handler;
