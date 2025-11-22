import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ApiError } from "../../../types/api";
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
    admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    ensureAdminInitialized();

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ authenticated: false, reason: "Missing bearer token" });
    }
    const token = authHeader.slice("Bearer ".length);

    const decoded = await admin.auth().verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decoded.uid);
    const email = (decoded.email || userRecord.email || "").toLowerCase();

    // Firestore role best-effort
    let firestoreRole: string | undefined;
    try {
      const snap = await admin
        .firestore()
        .collection("users")
        .doc(decoded.uid)
        .get();
      if (snap.exists) {
        const data = snap.data();
        const roleVal =
          data && typeof data === "object" && "role" in data
            ? (data as { role?: unknown }).role
            : undefined;
        firestoreRole = typeof roleVal === "string" ? roleVal : undefined;
      } else {
        firestoreRole = undefined;
      }
    } catch (e) {
      console.warn("whoami Firestore role lookup failed:", e);
    }

    const claimsRole = String(
      (userRecord.customClaims || {}).role || ""
    ).toLowerCase();

    const rawAllow = (process.env.ADMIN_ALLOWLIST || "")
      .split(/[\,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const allow = new Set<string>(
      rawAllow.length ? rawAllow : ["admin@vortexpcs.com"]
    );

    const isAdmin =
      claimsRole === "admin" ||
      (firestoreRole || "").toLowerCase() === "admin" ||
      (email && allow.has(email));

    return res.status(200).json({
      authenticated: true,
      email,
      claimsRole: claimsRole || null,
      firestoreRole: firestoreRole || null,
      allowlistMatch: email ? allow.has(email) : false,
      isAdmin,
      allowlist: Array.from(allow),
    });
  } catch (err: unknown) {
    const error = err as ApiError;
    return res
      .status(500)
      .json({ error: "whoami failed", details: error?.message || String(err) });
  }
}
