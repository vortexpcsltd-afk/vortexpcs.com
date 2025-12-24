/**
 * Admin Monitoring - Error Logs API
 * Retrieves recent errors from Firestore for admin dashboard
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createLogger } from "../../services/logger";
import { verifyAdmin } from "../../services/auth-admin";
import { getErrorLogs, type ErrorLog } from "../../services/error-tracking";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return res.status(403).json({ error: "Admin access required" });
    }

    logger.info("Admin fetching error logs", { admin: adminUser.email });

    // Get query parameters
    const limit = parseInt(req.query.limit as string) || 50;
    const severity = req.query.severity as string | undefined;
    const startDate = req.query.startDate as string | undefined;

    // Fetch error logs
    const errors = await getErrorLogs({
      limit,
      severity,
      startDate: startDate ? new Date(startDate) : undefined,
    });

    // Group errors by type for summary
    const errorSummary = errors.reduce(
      (
        acc: Record<string, { count: number; lastOccurred: Date }>,
        error: ErrorLog
      ) => {
        const key = error.type || "unknown";
        if (!acc[key]) {
          acc[key] = { count: 0, lastOccurred: error.timestamp };
        }
        acc[key].count++;
        if (error.timestamp > acc[key].lastOccurred) {
          acc[key].lastOccurred = error.timestamp;
        }
        return acc;
      },
      {} as Record<string, { count: number; lastOccurred: Date }>
    );

    return res.status(200).json({
      success: true,
      errors,
      summary: errorSummary,
      total: errors.length,
    });
  } catch (error: unknown) {
    logger.error("Failed to fetch error logs", error as Error);
    return res.status(500).json({
      error: "Failed to fetch error logs",
      details: (error as Error)?.message,
    });
  }
}
