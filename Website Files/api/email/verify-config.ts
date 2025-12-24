import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Email Configuration Verification Endpoint
 * Tests SMTP configuration without sending actual emails
 *
 * Usage: GET /api/email/verify-config
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || "development",
    checks: {
      smtp_host: {
        value: process.env.SMTP_HOST,
        status: !!process.env.SMTP_HOST ? "✅ SET" : "❌ NOT SET",
      },
      smtp_user: {
        value: process.env.SMTP_USER,
        status: !!process.env.SMTP_USER ? "✅ SET" : "❌ NOT SET",
      },
      smtp_pass: {
        value: process.env.SMTP_PASS ? "***REDACTED***" : undefined,
        status: !!process.env.SMTP_PASS ? "✅ SET" : "❌ NOT SET",
      },
      smtp_port: {
        value: process.env.SMTP_PORT,
        status: !!process.env.SMTP_PORT ? "✅ SET" : "❌ NOT SET",
      },
      business_email: {
        value: process.env.BUSINESS_EMAIL,
        status: !!process.env.BUSINESS_EMAIL ? "✅ SET" : "❌ NOT SET",
      },
    },
    recommendation: "",
    warnings: [] as string[],
  };

  // Determine what's configured
  const hasConfig =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS;

  if (!hasViteVars && !hasNonViteVars) {
    console.error("No SMTP configuration found in verify-config endpoint");
    return res.status(503).json({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Service temporarily unavailable",
    });
  }

  config.recommendation = "✅ GOOD: SMTP variables configured.";

  return res.status(200).json(config);
}
