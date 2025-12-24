/**
 * EMERGENCY IP UNBLOCK ENDPOINT
 * This endpoint allows clearing IP blocks without authentication
 *
 * ⚠️ SECURITY WARNING: This bypasses authentication!
 * Only use during emergencies. Delete or disable after use.
 *
 * Usage: POST to /api/security/emergency-unblock with { secret: "YOUR_SECRET" }
 */

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Emergency secret check (set this in Vercel env vars)
    const EMERGENCY_SECRET =
      process.env.EMERGENCY_UNBLOCK_SECRET || "vortex-emergency-2024";
    const { secret } = req.body || {};

    if (secret !== EMERGENCY_SECRET) {
      return res.status(403).json({
        error: "Invalid secret",
        hint: "Set EMERGENCY_UNBLOCK_SECRET in Vercel env vars",
      });
    }
    try {
      ensureAdminInitialized();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.setHeader("X-Diagnostic", "admin-init-failed");
      return res.status(503).json({
        error: "Service unavailable",
        reason: "FIREBASE_ADMIN_INIT_FAILED",
        details: msg,
      });
    }
    const db = admin.firestore();

    console.log("[emergency-unblock] Clearing all IP blocks...");

    // Method 1: Clear the subcollection entries
    const entriesRef = db
      .collection("security")
      .doc("ip_blocks")
      .collection("entries");
    const snapshot = await entriesRef.get();

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`[emergency-unblock] Deleted ${count} IP block entries`);
    }

    // Method 2: Also clear the old flat structure if it exists
    const oldBlockRef = db.collection("security").doc("ip_blocks");
    await oldBlockRef.set(
      {
        blocked: {},
        attempts: {},
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("[emergency-unblock] ✅ All IP blocks cleared!");

    return res.status(200).json({
      success: true,
      message: "All IP blocks have been cleared",
      entriesDeleted: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[emergency-unblock] Error:", error);
    return res.status(500).json({
      error: "Failed to clear IP blocks",
      details: error.message,
    });
  }
}
