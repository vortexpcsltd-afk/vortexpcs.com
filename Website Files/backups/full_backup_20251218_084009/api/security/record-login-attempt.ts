import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import {
  withErrorHandler,
  validateMethod,
  ApiError,
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
    console.log(
      "[record-login-attempt] Firebase Admin initialized via env vars"
    );
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
  console.log("[record-login-attempt] Firebase Admin initialized via base64");
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
    validateMethod(req, ["POST", "OPTIONS"]);
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      return res.status(200).end();
    }

    // Development mode - return mock success
    if (isDevelopment() || !isFirebaseConfigured()) {
      console.log(
        "[record-login-attempt] Development mode - skipping recording"
      );
      return res.status(200).json({ success: true, message: "dev-mode" });
    }

    try {
      try {
        ensureAdminInitialized();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(
          "[record-login-attempt] Firebase Admin init failed, returning success:",
          msg
        );
        // Return success instead of error - login tracking is non-critical
        return res.status(200).json({
          success: true,
          message: "Login tracking unavailable",
          recorded: false,
        });
      }

      const ip = getRequestIp(req);
      const { outcome, email } = (req.body || {}) as {
        outcome?: "success" | "failure";
        email?: string;
      };
      if (!outcome)
        throw new ApiError("Missing 'outcome' in body (success|failure)", 400);

      const db = admin.firestore();
      const docRef = db
        .collection("security")
        .doc("ip_blocks")
        .collection("entries")
        .doc(ipDocId(ip));

      if (outcome === "failure") {
        const now = admin.firestore.FieldValue.serverTimestamp();
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(docRef);
          const data = snap.exists ? (snap.data() as any) : {};

          // Don't block whitelisted IPs
          const whitelisted = Boolean(data.whitelisted);
          if (whitelisted) {
            // Still record the attempt but don't block
            tx.set(
              docRef,
              {
                ip,
                whitelisted: true,
                attempts: Number(data.attempts || 0) + 1,
                blocked: false,
                lastAttemptAt: now,
                lastEmailTried: email || data.lastEmailTried || null,
                updatedAt: now,
              },
              { merge: true }
            );
            return;
          }

          const attempts = Number(data.attempts || 0) + 1;
          const alreadyBlocked = Boolean(data.blocked);
          const toBlock = attempts >= 5 || alreadyBlocked;
          tx.set(
            docRef,
            {
              ip,
              attempts,
              blocked: toBlock,
              lastAttemptAt: now,
              firstAttemptAt: data.firstAttemptAt || now,
              lastEmailTried: email || data.lastEmailTried || null,
              blockedAt:
                toBlock && !alreadyBlocked ? now : data.blockedAt || null,
              reason: toBlock
                ? "Too many failed login attempts"
                : data.reason || null,
              updatedAt: now,
            },
            { merge: true }
          );
        });
        const updated = await docRef.get();
        const out = updated.data() || {};
        return res.status(200).json({
          recorded: true,
          blocked: Boolean((out as any).blocked),
          attempts: Number((out as any).attempts || 0),
          ip,
        });
      } else {
        // outcome === "success"; optionally reset attempts if not blocked
        const snap = await docRef.get();
        const data = snap.exists ? (snap.data() as any) : null;
        if (data && !data.blocked) {
          await docRef.set(
            {
              ip,
              attempts: 0,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        return res.status(200).json({
          recorded: true,
          blocked: Boolean(data?.blocked),
          attempts: Number(data?.attempts || 0),
          ip,
        });
      }
    } catch (error) {
      console.error("[record-login-attempt] Error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
