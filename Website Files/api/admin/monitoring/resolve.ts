/**
 * Admin Monitoring - Resolve Error API
 * Marks an error as resolved in Firestore
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createLogger } from "../../services/logger";
import { verifyAdmin } from "../../services/auth-admin";
import { resolveError } from "../../services/error-tracking";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { errorId, notes } = req.body;

    if (!errorId) {
      return res.status(400).json({ error: "errorId is required" });
    }

    logger.info("Admin resolving error", {
      admin: adminUser.email,
      errorId,
    });

    await resolveError(errorId, adminUser.email, notes);

    return res.status(200).json({
      success: true,
      message: "Error marked as resolved",
    });
  } catch (error: unknown) {
    logger.error("Failed to resolve error", error as Error);
    return res.status(500).json({
      error: "Failed to resolve error",
      details: (error as Error)?.message,
    });
  }
}
