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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    ensureAdminInitialized();
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
      sortCode: typeof data.sortCode === "string" ? data.sortCode : "04-00-04",
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
    return res
      .status(500)
      .json({
        error: "Failed to load bank transfer settings",
        details: (err as Error).message,
      });
  }
}
