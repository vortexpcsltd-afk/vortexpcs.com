/**
 * Simple test endpoint to verify API functions work
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    success: true,
    message: "API endpoint working",
    timestamp: new Date().toISOString(),
    env: {
      hasSmtpHost: !!process.env.VITE_SMTP_HOST || !!process.env.SMTP_HOST,
      hasSmtpUser: !!process.env.VITE_SMTP_USER || !!process.env.SMTP_USER,
      smtpPort: process.env.VITE_SMTP_PORT || process.env.SMTP_PORT || "",
      smtpSecure: process.env.VITE_SMTP_SECURE || process.env.SMTP_SECURE || "",
      hasFirebaseCredentials: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    },
  });
}
