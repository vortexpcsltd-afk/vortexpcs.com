import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureFirebaseAdminInitialized } from "./services/auth-admin.js";
import { getClientIP, isIPWhitelisted } from "./middleware/ip-whitelist.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const clientIP = getClientIP(req);
    const ipOk = isIPWhitelisted(clientIP);

    const adminSdk = ensureFirebaseAdminInitialized();
    const auth = adminSdk.auth();
    const db = adminSdk.firestore();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decoded.uid);
    const claims = userRecord.customClaims || {};
    const email = decoded.email || userRecord.email || "";

    let firestoreRole: string | undefined;
    try {
      const snap = await db.collection("users").doc(decoded.uid).get();
      if (snap.exists) {
        const data = snap.data() as any;
        firestoreRole = typeof data?.role === "string" ? data.role : undefined;
      }
    } catch {}

    const normalizedRole = String(
      (claims as any).role || firestoreRole || ""
    ).toLowerCase();
    const rawAllow = (process.env.ADMIN_ALLOWLIST || "")
      .split(/[\,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const isEmailAllowlisted = email && rawAllow.includes(email.toLowerCase());
    const hasAdminBooleanClaim = Boolean((claims as any).admin === true);
    const isAdminByClaims =
      normalizedRole === "admin" || hasAdminBooleanClaim || isEmailAllowlisted;
    const isAdmin = isAdminByClaims && (ipOk || isEmailAllowlisted);

    return res.status(200).json({
      success: true,
      diagnostics: {
        email,
        normalizedRole,
        hasAdminBooleanClaim,
        ipOk,
        isEmailAllowlisted,
        isAdminByClaims,
        isAdmin,
        allowlist: rawAllow,
        projectId: process.env.FIREBASE_PROJECT_ID || null,
        initSource: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
          ? "base64"
          : process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_PRIVATE_KEY
          ? "env-vars"
          : "unknown",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return res.status(500).json({ success: false, error: message });
  }
}
