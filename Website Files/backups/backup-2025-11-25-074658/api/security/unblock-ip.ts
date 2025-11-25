import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import {
  withErrorHandler,
  validateMethod,
  ApiError,
} from "../middleware/error-handler";

function ensureAdminInitialized() {
  if (!admin.apps.length) {
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!credsBase64) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not found");
    }
    const creds = JSON.parse(
      Buffer.from(credsBase64, "base64").toString("utf-8")
    );
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  }
}

async function verifyIsAdmin(
  req: VercelRequest
): Promise<{ uid: string; email: string; isAdmin: boolean }> {
  ensureAdminInitialized();
  const authHeader = (req.headers.authorization || "") as string;
  if (!authHeader.startsWith("Bearer "))
    throw new ApiError("Missing bearer token", 401);
  const token = authHeader.slice("Bearer ".length);
  const decoded = await admin.auth().verifyIdToken(token);
  const userRecord = await admin.auth().getUser(decoded.uid);
  const email = (decoded.email || userRecord.email || "").toLowerCase();

  // Role by custom claims / Firestore / allowlist
  let firestoreRole: string | undefined;
  try {
    const snap = await admin
      .firestore()
      .collection("users")
      .doc(decoded.uid)
      .get();
    if (snap.exists) {
      const data = snap.data() as any;
      firestoreRole = typeof data?.role === "string" ? data.role : undefined;
    }
  } catch {}
  const claimsRole = String(
    (userRecord.customClaims || {}).role || ""
  ).toLowerCase();
  const rawAllow = (process.env.ADMIN_ALLOWLIST || "")
    .split(/[\,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const allow = new Set<string>(
    rawAllow.length ? rawAllow : ["admin@vortexpcs.com"]
  );
  const isAdmin =
    claimsRole === "admin" ||
    (firestoreRole || "").toLowerCase() === "admin" ||
    (email && allow.has(email));

  if (!isAdmin) throw new ApiError("Admin privileges required", 403);
  return { uid: decoded.uid, email, isAdmin };
}

function ipDocId(ip: string): string {
  return ip.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export default withErrorHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    validateMethod(req, ["POST", "OPTIONS"]);
    if (req.method === "OPTIONS") return res.status(200).end();

    await verifyIsAdmin(req);

    const { ip } = (req.body || {}) as { ip?: string };
    if (!ip) throw new ApiError("Missing 'ip' in body", 400);

    const db = admin.firestore();
    const ref = db
      .collection("security")
      .doc("ip_blocks")
      .collection("entries")
      .doc(ipDocId(ip));
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(200).json({ ok: true, ip, status: "not_found" });
    }
    await ref.set(
      {
        blocked: false,
        blockedAt: null,
        reason: null,
        attempts: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true, ip, status: "unblocked" });
  }
);
