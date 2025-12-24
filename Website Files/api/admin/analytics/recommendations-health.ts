import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getApps } from "firebase-admin/app";
import { guardFirebaseAdminEnv } from "../../utils/envGuard.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "method-not-allowed" });

  const guard = guardFirebaseAdminEnv();
  const initialized = getApps().length > 0;

  if (!guard.ok) {
    return res.status(503).json({
      ok: false,
      service: "recommendations",
      initialized,
      ready: false,
      error: "firebase-env-missing",
      missing: guard.missing || [],
      message: guard.reason,
    });
  }

  return res.status(200).json({
    ok: true,
    service: "recommendations",
    initialized,
    ready: true,
  });
}

