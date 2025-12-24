import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import {
  withErrorHandler,
  validateMethod,
} from "../middleware/error-handler.js";
import { isDevelopment, isFirebaseConfigured } from "../services/env-utils.js";

function ensureAdminInitialized() {
  if (admin.apps.length) return;
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
    console.log("[check-ip] Firebase Admin initialized via env vars");
    return;
  }
  const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!credsBase64) {
    throw new Error(
      "Missing Firebase admin credentials (no env vars or base64)"
    );
  }
  const decoded = Buffer.from(credsBase64, "base64").toString("utf-8");
  const creds = JSON.parse(decoded);
  const pid = creds?.project_id || process.env.FIREBASE_PROJECT_ID;
  if (!pid) {
    throw new Error(
      "Missing project_id in service account and FIREBASE_PROJECT_ID env"
    );
  }
  admin.initializeApp({
    credential: admin.credential.cert(creds),
    projectId: pid,
  });
  console.log("[check-ip] Firebase Admin initialized via base64");
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

    // Development mode - return mock data
    if (isDevelopment() || !isFirebaseConfigured()) {
      console.log("[check-ip] Development mode - returning not blocked");
      return res
        .status(200)
        .json({ blocked: false, attempts: 0, ip: "dev-mode" });
    }

    try {
      try {
        ensureAdminInitialized();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(
          "[check-ip] Firebase Admin init failed, returning not blocked:",
          msg
        );
        // Return safe default instead of error - security checks are non-critical
        return res.status(200).json({
          blocked: false,
          attempts: 0,
          ip: "unavailable",
          message: "Security check unavailable",
        });
      }
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
