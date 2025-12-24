import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function initAdminOnce() {
  if (getApps().length) return;
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
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
const storage = getStorage();

// Collections considered critical for backup (exclude extremely high-volume if needed)
const CRITICAL_COLLECTIONS: string[] = [
  "users",
  "orders",
  "support_tickets",
  "admin_banners",
  "admin_competitors",
  "admin_competitor_prices",
  "admin_settings",
  "analytics_sessions",
  "analytics_pageviews",
  "analytics_events",
  "searchQueries",
  "zeroResultSearches",
  "security_events",
  "performance_metrics",
  "page_load_metrics",
  "api_metrics",
];

async function fetchCollection(name: string) {
  const snap = await db.collection(name).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function safeSerialize(value: any): any {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map((v) => safeSerialize(v));
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = safeSerialize(v);
    return out;
  }
  return value;
}

async function performBackup() {
  const result: Record<string, any> = {};
  for (const col of CRITICAL_COLLECTIONS) {
    try {
      const data = await fetchCollection(col);
      result[col] = data.map((doc) => safeSerialize(doc));
    } catch (e: any) {
      console.error("Backup collection error", col, e.message);
      result[col] = { error: e.message };
    }
  }
  return result;
}

function encryptIfEnabled(plain: string) {
  const keyB64 = process.env.BACKUP_ENCRYPTION_KEY; // 32 bytes base64 recommended
  if (!keyB64) return { data: plain, encrypted: false };
  try {
    const key = Buffer.from(keyB64, "base64");
    if (key.length !== 32) {
      console.warn("Invalid BACKUP_ENCRYPTION_KEY length; skipping encryption");
      return { data: plain, encrypted: false };
    }
    const crypto = require("crypto");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const packed = Buffer.concat([iv, tag, enc]).toString("base64");
    return { data: packed, encrypted: true, algorithm: "AES-256-GCM" };
  } catch (e) {
    console.error("Encryption failed, storing plain text", e);
    return { data: plain, encrypted: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Restrict to cron or explicit secret
  const isCron = !!req.headers["x-vercel-cron"];
  const secret = req.query.secret || req.headers["x-backup-secret"];
  const required = process.env.BACKUP_CRON_TOKEN;
  if (!isCron && (!required || secret !== required)) {
    return res
      .status(403)
      .json({ error: "forbidden", reason: "cron-or-secret-required" });
  }

  const started = Date.now();
  try {
    const snapshot = await performBackup();
    const ts = new Date();
    const iso = ts.toISOString().replace(/[:]/g, "-");
    const year = ts.getUTCFullYear();
    const month = String(ts.getUTCMonth() + 1).padStart(2, "0");
    const day = String(ts.getUTCDate()).padStart(2, "0");
    const path = `backups/${year}/${month}/${day}/backup-${iso}.json`; // Cloud Storage object path

    // Write to Cloud Storage
    const bucket = storage.bucket(
      process.env.FIREBASE_STORAGE_BUCKET || undefined
    );
    const file = bucket.file(path);
    const rawPayload = {
      meta: {
        createdAt: ts.toISOString(),
        collections: CRITICAL_COLLECTIONS,
        split: [] as string[],
      },
      data: snapshot,
    };

    // Split large collections into separate files if > size threshold
    const SIZE_THRESHOLD = 2_000_000; // ~2MB
    for (const col of Object.keys(rawPayload.data)) {
      const serialized = JSON.stringify(rawPayload.data[col]);
      if (serialized.length > SIZE_THRESHOLD) {
        const colPath = `backups/${year}/${month}/${day}/backup-${iso}-${col}.json`;
        const bucket = storage.bucket(
          process.env.FIREBASE_STORAGE_BUCKET || undefined
        );
        const { data: encColData, encrypted: encColFlag } =
          encryptIfEnabled(serialized);
        await bucket
          .file(colPath)
          .save(encColData, { contentType: "application/json" });
        rawPayload.meta.split.push(col);
        // Replace in main payload with pointer
        rawPayload.data[col] = {
          __external: true,
          path: colPath,
          encrypted: encColFlag,
        };
      }
    }

    const mainJson = JSON.stringify(rawPayload, null, 2);
    const {
      data: storedData,
      encrypted,
      algorithm,
    } = encryptIfEnabled(mainJson);
    await file.save(storedData, { contentType: "application/json" });

    // Record backup metadata in Firestore (lightweight index)
    await db.collection("admin_backups").add({
      path,
      collections: CRITICAL_COLLECTIONS,
      createdAt: ts,
      durationMs: Date.now() - started,
      sizeBytes: Buffer.byteLength(mainJson),
      encrypted,
      algorithm: encrypted ? algorithm : undefined,
    });

    return res
      .status(200)
      .json({ ok: true, path, durationMs: Date.now() - started, encrypted });
  } catch (e: any) {
    console.error("Nightly backup failed", e);
    return res.status(500).json({ error: "backup-failed", message: e.message });
  }
}
