/**
 * Test endpoint for business API
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({
    success: true,
    message: "Test endpoint working",
    received: req.body,
  });
};
