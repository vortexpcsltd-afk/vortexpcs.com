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

import { withSecureMethod } from "../middleware/apiSecurity.js";

export default withSecureMethod(
  "GET",
  async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    try {
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
      const fdb = admin.firestore();
      const docRef = fdb.collection("settings").doc("bank_transfer");
      const snap = await docRef.get();
      const data = snap.exists ? snap.data() || {} : {};

      const safe = {
        accountName:
          typeof data.accountName === "string"
            ? data.accountName
            : "Vortex PCs Ltd",
        bankName: typeof data.bankName === "string" ? data.bankName : undefined,
        sortCode:
          typeof data.sortCode === "string" ? data.sortCode : "04-00-04",
        accountNumber:
          typeof data.accountNumber === "string"
            ? data.accountNumber
            : "12345678",
        iban: typeof data.iban === "string" ? data.iban : undefined,
        bic: typeof data.bic === "string" ? data.bic : undefined,
        referenceNote:
          typeof data.referenceNote === "string"
            ? data.referenceNote
            : "We’ll use your Order ID",
        instructions:
          typeof data.instructions === "string" ? data.instructions : undefined,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : undefined,
      };

      return res.status(200).json(safe);
    } catch (err: unknown) {
      return res.status(500).json({
        error: "Failed to load bank transfer settings",
        details: (err as Error).message,
      });
    }
  }
);
