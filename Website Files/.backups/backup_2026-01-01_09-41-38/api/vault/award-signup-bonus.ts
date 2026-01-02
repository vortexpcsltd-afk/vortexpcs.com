/**
 * DEPRECATED: Award Vortex Vault signup bonus
 *
 * This endpoint is no longer used.
 * Signup bonus is now awarded directly from services/vortexVault.ts using awardSignupBonus()
 * which calls Firestore directly with proper client-side security rules.
 *
 * Kept for historical reference only.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    success: false,
    error:
      "This endpoint is deprecated. Signup bonus is awarded during registration.",
  });
}
