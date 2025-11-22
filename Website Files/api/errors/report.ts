/**
 * Error Reporting API Endpoint
 * Receives error reports from the frontend and stores them in Firestore
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createLogger } from "../services/logger";
import { logError } from "../services/error-tracking";
import { verifyUser } from "../services/auth-admin";
import {
  withErrorHandler,
  validateMethod,
  validateRequiredFields,
} from "../middleware/error-handler.js";

async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);

  // Validate method
  validateMethod(req, ["POST"]);

  const { message, stack, severity, type, context, timestamp, url, userAgent } =
    req.body as Record<string, unknown>;

  // Validate required fields
  validateRequiredFields(req.body as Record<string, unknown>, [
    "message",
    "severity",
    "type",
  ]);

  // Try to get user info (optional)
  let userInfo = null;
  try {
    const user = await verifyUser(req);
    if (user) {
      userInfo = {
        id: user.uid,
        email: user.email,
        role: user.role,
      };
    }
  } catch (err) {
    // User not authenticated, continue without user info
  }

  // Log error to Firestore
  const errorId = await logError({
    timestamp: timestamp
      ? new Date(timestamp as string | number | Date)
      : new Date(),
    severity: severity as "critical" | "error" | "warning",
    type: type as string,
    message: message as string,
    stack: stack as string | undefined,
    context: context as Record<string, unknown> | undefined,
    user: userInfo || undefined,
    request: url
      ? {
          url: url as string,
          method: req.method || "POST",
          ip:
            (req.headers["x-forwarded-for"] as string) ||
            req.socket?.remoteAddress,
          userAgent: userAgent as string | undefined,
        }
      : undefined,
    resolved: false,
  });

  logger.info("Error reported", { errorId, type, severity });

  return res.status(200).json({
    success: true,
    errorId,
  });
}

export default withErrorHandler(handler);
