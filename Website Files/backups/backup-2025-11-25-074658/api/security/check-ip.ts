import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import {
  withErrorHandler,
  validateMethod,
} from "../middleware/error-handler.js";

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

function getRequestIp(req: VercelRequest): string {
  const xfwd = (req.headers["x-forwarded-for"] || "") as string;
  const xReal = (req.headers["x-real-ip"] || "") as string;
  const ip = xfwd
    ? xfwd.split(",")[0].trim()
    : xReal || (req.socket as any)?.remoteAddress || "unknown";
  return ip;
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
      ensureAdminInitialized();
      const ip = getRequestIp(req);
      const db = admin.firestore();
      const docRef = db
        .collection("security")
        .doc("ip_blocks")
        .collection("entries")
        .doc(ipDocId(ip));
      const snap = await docRef.get();
      if (!snap.exists) {
        return res.status(200).json({ blocked: false, attempts: 0, ip });
      }
      const data = snap.data() || {};

      // If whitelisted, never block
      const whitelisted = Boolean((data as any).whitelisted);
      if (whitelisted) {
        return res
          .status(200)
          .json({ blocked: false, attempts: 0, ip, whitelisted: true });
      }

      const blocked = Boolean((data as any).blocked);
      const attempts = Number((data as any).attempts || 0);
      const blockedAt = (data as any).blockedAt || null;
      return res.status(200).json({ blocked, attempts, ip, blockedAt });
    } catch (error) {
      console.error("[check-ip] Error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
