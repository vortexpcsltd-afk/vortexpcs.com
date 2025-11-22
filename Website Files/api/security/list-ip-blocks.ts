import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import {
  withErrorHandler,
  validateMethod,
  ApiError,
} from "../middleware/error-handler.js";

function ensureAdminInitialized() {
  if (!admin.apps.length) {
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!credsBase64)
      throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not found");
    const creds = JSON.parse(
      Buffer.from(credsBase64, "base64").toString("utf-8")
    );
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  }
}

async function verifyIsAdmin(
  req: VercelRequest
): Promise<{ uid: string; email: string }> {
  ensureAdminInitialized();
  const authHeader = (req.headers.authorization || "") as string;
  if (!authHeader.startsWith("Bearer "))
    throw new ApiError("Missing bearer token", 401);
  const token = authHeader.slice("Bearer ".length);
  const decoded = await admin.auth().verifyIdToken(token);
  const userRecord = await admin.auth().getUser(decoded.uid);
  const email = (decoded.email || userRecord.email || "").toLowerCase();
  let firestoreRole: string | undefined;
  try {
    const snap = await admin
      .firestore()
      .collection("users")
      .doc(decoded.uid)
      .get();
    firestoreRole =
      typeof snap.data()?.role === "string"
        ? String(snap.data()!.role).toLowerCase()
        : undefined;
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
    claimsRole === "admin" || firestoreRole === "admin" || allow.has(email);
  if (!isAdmin) throw new ApiError("Admin privileges required", 403);
  return { uid: decoded.uid, email };
}

function ipDocId(ip: string): string {
  return ip.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export default withErrorHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    validateMethod(req, ["GET", "OPTIONS"]);
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      return res.status(200).end();
    }

    try {
      await verifyIsAdmin(req);
      ensureAdminInitialized();
      const db = admin.firestore();

      const limitRaw = Number((req.query.limit as string) || 50);
      const limit = Math.min(Math.max(limitRaw, 1), 200);
      const pageRaw = Number((req.query.page as string) || 1);
      const page = Math.max(pageRaw, 1);
      const includeUnblocked =
        (req.query.includeUnblocked as string) === "true";
      const search = ((req.query.search as string) || "").trim().toLowerCase();

      const col = db
        .collection("security")
        .doc("ip_blocks")
        .collection("entries");
      // Fetch up to 500 documents to allow pagination & search; adjust as needed.
      const snap = await col.limit(500).get();
      let entries = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      }));

      // Optional search by ip/id or lastEmailTried substring
      if (search) {
        entries = entries.filter((e) => {
          const ip = String((e as any).ip || e.id || "").toLowerCase();
          const email = String((e as any).lastEmailTried || "").toLowerCase();
          return ip.includes(search) || email.includes(search);
        });
      }

      // Filter blocked only unless includeUnblocked true
      const filtered = includeUnblocked
        ? entries
        : entries.filter((e) => e.blocked);

      // Sort by blockedAt desc then attempts desc
      filtered.sort((a, b) => {
        const toTs = (val: any) =>
          val && val.toDate?.() ? val.toDate().getTime() : 0;
        const aTime = toTs((a as any).blockedAt);
        const bTime = toTs((b as any).blockedAt);
        if (bTime !== aTime) return bTime - aTime;
        return (
          (Number((b as any).attempts) || 0) -
          (Number((a as any).attempts) || 0)
        );
      });

      const total = filtered.length;
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      const start = (page - 1) * limit;
      const pageEntries = filtered.slice(start, start + limit);

      return res.status(200).json({
        entries: pageEntries,
        count: pageEntries.length,
        total,
        page,
        totalPages,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      });
    } catch (error) {
      console.error("[list-ip-blocks] Error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
