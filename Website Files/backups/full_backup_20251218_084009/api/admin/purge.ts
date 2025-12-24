import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
    if (!base64) throw new Error("Missing Firebase admin credentials");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const creds = JSON.parse(json);
    initializeApp({ credential: cert(creds) });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
    throw error;
  }
}
initAdminOnce();

const db = getFirestore();

async function verifyAdmin(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return { ok: false, reason: "missing-bearer" };
  const token = authHeader.split("Bearer ")[1];
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const email = (decodedToken.email || "").toLowerCase();
    const rawAllow = (process.env.ADMIN_ALLOWLIST || "admin@vortexpcs.com")
      .split(/[,\n\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const allow = new Set(rawAllow);
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const firestoreRole = (userDoc.data()?.role || "").toLowerCase();
    const claimsRole = String((decodedToken as any).role || "").toLowerCase();
    const isAdmin =
      allow.has(email) ||
      firestoreRole === "admin" ||
      claimsRole === "admin" ||
      userDoc.data()?.isAdmin === true;
    return { ok: isAdmin, email };
  } catch (e) {
    console.error("Auth verify error", e);
    return { ok: false, reason: "token-invalid" };
  }
}

// Map logical purge categories to Firestore collections
const CATEGORY_COLLECTIONS: Record<string, string[]> = {
  analytics: [
    "analytics",
    "analytics_sessions",
    "analytics_pageviews",
    "analytics_events",
    "searchQueries",
    "zeroResultSearches",
    "security_events",
    "performance_metrics",
    "page_load_metrics",
    "api_metrics",
  ],
  banners: ["admin_banners"],
  competitors: ["admin_competitors", "admin_competitor_prices"],
  orders: ["orders", "deleted_orders", "refund_requests"],
  support: ["support_tickets"],
  users: ["users"], // Be careful; only profiles (does not affect auth accounts)
  settings: ["admin_settings"],
  all: [], // Special case handled separately
};

async function deleteCollectionBatch(colName: string) {
  const ref = db.collection(colName);
  const snap = await ref.limit(500).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

async function purgeCollections(collections: string[], progress: string[]) {
  for (const name of collections) {
    let total = 0;
    // Loop until collection empty (avoid huge reads)
    // Safety cap to prevent infinite loops
    for (let i = 0; i < 200; i++) {
      const deleted = await deleteCollectionBatch(name);
      total += deleted;
      if (deleted === 0) break;
    }
    progress.push(`${name}:${total}`);
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

  const { categories, confirm } =
    req.body && typeof req.body === "object"
      ? (req.body as { categories?: string[]; confirm?: boolean })
      : {};

  if (!confirm) return res.status(400).json({ error: "confirmation-required" });

  let targetCollections: string[] = [];
  if (!categories || categories.length === 0) {
    return res.status(400).json({ error: "no-categories" });
  }

  if (categories.includes("all")) {
    // Flatten all except 'all' sentinel
    const allSets = Object.entries(CATEGORY_COLLECTIONS)
      .filter(([k]) => k !== "all")
      .flatMap(([, cols]) => cols);
    targetCollections = Array.from(new Set(allSets));
  } else {
    categories.forEach((cat) => {
      const cols = CATEGORY_COLLECTIONS[cat];
      if (cols) targetCollections.push(...cols);
    });
    targetCollections = Array.from(new Set(targetCollections));
  }

  if (targetCollections.length === 0) {
    return res.status(400).json({ error: "no-valid-collections" });
  }

  const progress: string[] = [];
  try {
    await purgeCollections(targetCollections, progress);
    // Record purge event (lightweight audit)
    await db.collection("security_events").add({
      type: "admin_purge",
      categories,
      collections: targetCollections,
      progress,
      performedBy: adminCheck.email,
      timestamp: new Date(),
    });
    return res
      .status(200)
      .json({ ok: true, collections: targetCollections, progress });
  } catch (e: any) {
    console.error("Purge failure", e);
    return res.status(500).json({ error: "purge-failed", message: e.message });
  }
}
