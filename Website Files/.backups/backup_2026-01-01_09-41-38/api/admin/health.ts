import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { withErrorHandler } from "../middleware/error-handler.js";

/**
 * Admin Health Check Endpoint
 * Reports Firebase Admin SDK initialization status and required env variables
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const envPresent = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  let adminInitialized = false;
  let authUsable = false;
  let error: string | undefined;
  let initializedNow = false;

  // Check if Firebase Admin is already initialized
  try {
    const apps = getApps();
    adminInitialized = apps.length > 0;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Attempt initialization if not initialized but env is present
  if (!adminInitialized && envPresent && !error) {
    try {
      const decoded = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 as string,
        "base64"
      ).toString("utf-8");
      const serviceAccount = JSON.parse(decoded) as Record<string, unknown>;
      initializeApp({
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      });
      initializedNow = true;
      // Verify initialization was successful
      const appsAfter = getApps();
      adminInitialized = appsAfter.length > 0;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      adminInitialized = false;
    }
  }

  // Only attempt to get auth if initialization succeeded
  if (adminInitialized) {
    try {
      const auth = getAuth();
      authUsable = !!auth;
    } catch (e) {
      authUsable = false;
      if (!error) {
        error = e instanceof Error ? e.message : String(e);
      }
    }
  }

  res.status(200).json({
    ok: envPresent && adminInitialized && authUsable,
    envPresent,
    adminInitialized,
    authUsable,
    initializedNow,
    error,
    timestamp: Date.now(),
  });
}

export default withErrorHandler(handler);
