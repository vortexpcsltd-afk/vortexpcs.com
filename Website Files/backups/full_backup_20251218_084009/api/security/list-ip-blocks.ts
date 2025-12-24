import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import { isDevelopment, isFirebaseConfigured } from "../services/env-utils.js";

// Query validation inline to avoid import issues
type QuerySchema = {
  [key: string]: {
    type: "string" | "number" | "boolean";
    required?: boolean;
    default?: string | number | boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
};

function parseQuery<T extends QuerySchema>(
  req: VercelRequest,
  res: VercelResponse,
  schema: T
): Record<string, unknown> | null {
  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = req.query[key];

    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`Missing required parameter: ${key}`);
      continue;
    }

    if (
      (value === undefined || value === null || value === "") &&
      rules.default !== undefined
    ) {
      result[key] = rules.default;
      continue;
    }

    if (
      !rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      continue;
    }

    const stringValue = Array.isArray(value) ? value[0] : String(value);

    if (rules.type === "number") {
      const numValue = parseInt(stringValue, 10);
      if (isNaN(numValue)) {
        errors.push(`Invalid number for parameter: ${key}`);
        continue;
      }
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(`Parameter ${key} must be at least ${rules.min}`);
        continue;
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(`Parameter ${key} must be at most ${rules.max}`);
        continue;
      }
      result[key] = numValue;
    } else if (rules.type === "boolean") {
      result[key] = stringValue === "true" || stringValue === "1";
    } else {
      if (rules.pattern && !rules.pattern.test(stringValue)) {
        errors.push(`Invalid format for parameter: ${key}`);
        continue;
      }
      result[key] = stringValue;
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: "Invalid query parameters",
      details: errors,
    });
    return null;
  }

  return result;
}

const ipBlockListSchema = {
  limit: {
    type: "number" as const,
    required: false,
    default: 25,
    min: 1,
    max: 1000,
  },
  page: {
    type: "number" as const,
    required: false,
    default: 1,
    min: 1,
  },
  includeUnblocked: {
    type: "boolean" as const,
    required: false,
    default: false,
  },
  search: {
    type: "string" as const,
    required: false,
  },
} as const;

class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
}

function ensureAdminInitialized(): boolean {
  try {
    if (admin.apps.length) return true;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          project_id: projectId,
          client_email: clientEmail,
          private_key: privateKey,
        }),
        projectId,
      });
      console.log("[list-ip-blocks] Firebase Admin initialized via env vars");
      return true;
    }
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!credsBase64) {
      console.warn("[list-ip-blocks] Missing Firebase credentials");
      return false;
    }
    const decoded = Buffer.from(credsBase64, "base64").toString("utf-8");
    const creds = JSON.parse(decoded);
    const pid = creds?.project_id || process.env.FIREBASE_PROJECT_ID;
    if (!pid) {
      console.warn("[list-ip-blocks] Missing project_id");
      return false;
    }
    admin.initializeApp({
      credential: admin.credential.cert(creds),
      projectId: pid,
    });
    console.log("[list-ip-blocks] Firebase Admin initialized via base64");
    return true;
  } catch (e) {
    console.warn("[list-ip-blocks] Admin init failed:", e);
    return false;
  }
}

async function verifyIsAdmin(
  req: VercelRequest
): Promise<{ uid: string; email: string }> {
  const initialized = ensureAdminInitialized();
  if (!initialized) {
    throw new ApiError("Firebase Admin not initialized", 503);
  }
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers first
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Development mode - return empty list
  if (isDevelopment() || !isFirebaseConfigured()) {
    console.log("[list-ip-blocks] Development mode - returning empty list");
    return res.status(200).json({
      entries: [],
      count: 0,
      total: 0,
      page: 1,
      totalPages: 0,
      limit: 25,
      hasNext: false,
      hasPrev: false,
    });
  }

  try {
    // Check Firebase Admin initialization first
    const initialized = ensureAdminInitialized();
    if (!initialized) {
      console.warn(
        "[list-ip-blocks] Firebase Admin not configured, returning empty list"
      );
      return res.status(200).json({
        entries: [],
        count: 0,
        total: 0,
        page: 1,
        totalPages: 0,
        limit: 25,
        hasNext: false,
        hasPrev: false,
      });
    }

    // Verify admin with comprehensive error handling
    try {
      await verifyIsAdmin(req);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[list-ip-blocks] Auth error:", msg);

      if (msg.includes("Missing bearer token")) {
        return res.status(401).json({ error: "Unauthorized", details: msg });
      }
      if (msg.includes("Admin privileges required")) {
        return res.status(403).json({ error: "Forbidden", details: msg });
      }
      if (
        msg.includes("FIREBASE_SERVICE_ACCOUNT_BASE64") ||
        msg.includes("Firebase admin") ||
        msg.includes("Firebase Admin not initialized") ||
        msg.includes("Missing project_id")
      ) {
        return res.status(503).json({
          error: "Service unavailable",
          reason: "FIREBASE_ADMIN_INIT_FAILED",
          details: msg,
        });
      }
      return res
        .status(401)
        .json({ error: "Authentication failed", details: msg });
    }
    const db = admin.firestore();

    // Parse query parameters with error handling
    const query = parseQuery(req, res, ipBlockListSchema);
    if (!query) return; // Validation error already sent

    const limit = Number(query.limit) || 25;
    const page = Number(query.page) || 1;
    const includeUnblocked = Boolean(query.includeUnblocked);
    const search = query.search ? String(query.search).toLowerCase() : "";

    console.log("[list-ip-blocks] Query params:", {
      limit,
      page,
      includeUnblocked,
      search,
    });

    const col = db
      .collection("security")
      .doc("ip_blocks")
      .collection("entries");

    // Fetch documents with error handling
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
        (Number((b as any).attempts) || 0) - (Number((a as any).attempts) || 0)
      );
    });

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const pageEntries = filtered.slice(start, start + limit);

    console.log("[list-ip-blocks] Success:", { total, page, totalPages });

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
    console.error("[list-ip-blocks] Critical error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
      stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
    });
  }
}
