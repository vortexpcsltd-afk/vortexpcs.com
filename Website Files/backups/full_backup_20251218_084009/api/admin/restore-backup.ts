import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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

async function verifyAdmin(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return { ok: false };
  const token = authHeader.split("Bearer ")[1];
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    const email = (decoded.email || "").toLowerCase();
    const allow = new Set(
      (process.env.ADMIN_ALLOWLIST || "admin@vortexpcs.com")
        .split(/[,\n\s]+/)
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    );
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const isAdmin =
      allow.has(email) ||
      userDoc.data()?.role === "admin" ||
      userDoc.data()?.isAdmin === true;
    return { ok: isAdmin, email };
  } catch (e) {
    return { ok: false };
  }
}

function decryptIfNeeded(content: Buffer) {
  const keyB64 = process.env.BACKUP_ENCRYPTION_KEY;
  if (!keyB64) return content.toString("utf-8");
  try {
    const key = Buffer.from(keyB64, "base64");
    if (key.length !== 32) return content.toString("utf-8");
    const crypto = require("crypto");
    const raw = Buffer.from(content.toString("utf-8"), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString("utf-8");
  } catch (e) {
    console.error("Decrypt failed; returning raw", e);
    return content.toString("utf-8");
  }
}

async function readFile(path: string) {
  const bucket = storage.bucket(
    process.env.FIREBASE_STORAGE_BUCKET || undefined
  );
  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) throw new Error("backup-file-not-found");
  const [buf] = await file.download();
  return decryptIfNeeded(buf);
}

async function restoreCollection(
  name: string,
  docs: any[],
  { overwrite }: { overwrite: boolean }
) {
  const batch = db.batch();
  for (const doc of docs) {
    if (!doc.id) continue;
    const ref = db.collection(name).doc(doc.id);
    if (!overwrite) {
      const existing = await ref.get();
      if (existing.exists) continue;
    }
    const copy = { ...doc };
    delete copy.id;
    batch.set(ref, copy, { merge: overwrite });
  }
  await batch.commit();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "method-not-allowed" });
  const admin = await verifyAdmin(req);
  if (!admin.ok) return res.status(401).json({ error: "not-admin" });

  const { path, purgeFirst, overwrite } = (req.body || {}) as {
    path: string;
    purgeFirst?: boolean;
    overwrite?: boolean;
  };
  if (!path) return res.status(400).json({ error: "missing-path" });

  try {
    const mainJson = JSON.parse(await readFile(path));
    const meta = mainJson.meta || {};
    const data = mainJson.data || {};

    if (purgeFirst) {
      for (const col of meta.collections || Object.keys(data)) {
        try {
          // Delete in batches of 500
          for (let i = 0; i < 100; i++) {
            const snap = await db.collection(col).limit(500).get();
            if (snap.empty) break;
            const batch = db.batch();
            snap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (e) {
          console.warn("Purge failed for", col, e);
        }
      }
    }

    // Load external split files
    if (Array.isArray(meta.split)) {
      for (const col of meta.split) {
        const pointer = data[col];
        if (pointer && pointer.__external && pointer.path) {
          const externalRaw = JSON.parse(await readFile(pointer.path));
          data[col] = externalRaw; // Replace pointer with actual data array
        }
      }
    }

    const restored: string[] = [];
    for (const [col, docs] of Object.entries(data)) {
      if (Array.isArray(docs)) {
        await restoreCollection(col, docs as any[], { overwrite: !!overwrite });
        restored.push(col);
      } else if (docs && (docs as any).__external) {
        // External already replaced or skipped; ignore
      }
    }

    await db.collection("security_events").add({
      type: "admin_restore",
      path,
      restored,
      performedBy: admin.email,
      overwrite: !!overwrite,
      purgeFirst: !!purgeFirst,
      timestamp: new Date(),
    });

    res.status(200).json({ ok: true, restored });
  } catch (e: any) {
    console.error("Restore failed", e);
    res.status(500).json({ error: "restore-failed", message: e.message });
  }
}
