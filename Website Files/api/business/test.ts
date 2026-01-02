/**
 * Test endpoint for business API
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withSecureHandler } from "../middleware/apiSecurity.js";

async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  return res.status(200).json({
    success: true,
    message: "Test endpoint working",
    received: req.body,
  });
}

export default withSecureHandler(handler);
