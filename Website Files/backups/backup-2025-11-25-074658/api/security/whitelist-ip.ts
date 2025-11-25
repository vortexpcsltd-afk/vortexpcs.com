import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";

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
    throw new Error("Missing bearer token");
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

  if (!isAdmin) throw new Error("Admin privileges required");
  return { uid: decoded.uid, email, isAdmin };
}

function ipDocId(ip: string): string {
  return ip.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await verifyIsAdmin(req);

    const { ip, reason } = (req.body || {}) as {
      ip?: string;
      reason?: string;
    };
    if (!ip) {
      return res.status(400).json({ error: "Missing 'ip' in body" });
    }

    ensureAdminInitialized();
    const db = admin.firestore();
    const ref = db
      .collection("security")
      .doc("ip_blocks")
      .collection("entries")
      .doc(ipDocId(ip));

    await ref.set(
      {
        ip,
        whitelisted: true,
        blocked: false,
        blockedAt: null,
        attempts: 0,
        reason: reason || "Whitelisted by admin",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true, ip, status: "whitelisted" });
  } catch (error: any) {
    console.error("[whitelist-ip] Error:", error);
    return res.status(error.message?.includes("Admin") ? 403 : 500).json({
      error: error.message || "Internal server error",
    });
  }
}
