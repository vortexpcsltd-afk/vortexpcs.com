import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Email Configuration Verification Endpoint
 * Tests SMTP configuration without sending actual emails
 *
 * Usage: GET /api/email/verify-config
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || "development",
    checks: {
      vite_smtp_host: {
        value: process.env.VITE_SMTP_HOST,
        status: !!process.env.VITE_SMTP_HOST ? "✅ SET" : "❌ NOT SET",
      },
      smtp_host: {
        value: process.env.SMTP_HOST,
        status: !!process.env.SMTP_HOST ? "✅ SET" : "❌ NOT SET",
      },
      vite_smtp_user: {
        value: process.env.VITE_SMTP_USER,
        status: !!process.env.VITE_SMTP_USER ? "✅ SET" : "❌ NOT SET",
      },
      smtp_user: {
        value: process.env.SMTP_USER,
        status: !!process.env.SMTP_USER ? "✅ SET" : "❌ NOT SET",
      },
      vite_smtp_pass: {
        value: process.env.VITE_SMTP_PASS ? "***REDACTED***" : undefined,
        status: !!process.env.VITE_SMTP_PASS ? "✅ SET" : "❌ NOT SET",
      },
      smtp_pass: {
        value: process.env.SMTP_PASS ? "***REDACTED***" : undefined,
        status: !!process.env.SMTP_PASS ? "✅ SET" : "❌ NOT SET",
      },
      vite_smtp_port: {
        value: process.env.VITE_SMTP_PORT,
        status: !!process.env.VITE_SMTP_PORT ? "✅ SET" : "❌ NOT SET",
      },
      smtp_port: {
        value: process.env.SMTP_PORT,
        status: !!process.env.SMTP_PORT ? "✅ SET" : "❌ NOT SET",
      },
      vite_business_email: {
        value: process.env.VITE_BUSINESS_EMAIL,
        status: !!process.env.VITE_BUSINESS_EMAIL ? "✅ SET" : "❌ NOT SET",
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
  const hasViteVars =
    !!process.env.VITE_SMTP_HOST &&
    !!process.env.VITE_SMTP_USER &&
    !!process.env.VITE_SMTP_PASS;

  const hasNonViteVars =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS;

  if (!hasViteVars && !hasNonViteVars) {
    config.recommendation =
      "❌ CRITICAL: No SMTP configuration found! Add environment variables to Vercel.";
    config.warnings.push(
      "Shopping cart emails will NOT work until SMTP is configured"
    );
    config.warnings.push(
      "Add SMTP_HOST, SMTP_USER, SMTP_PASS to Vercel environment variables"
    );
    return res.status(500).json(config);
  }

  if (hasViteVars && !hasNonViteVars) {
    config.recommendation =
      "⚠️ WARNING: Only VITE_ prefixed variables found. Backend APIs need non-VITE versions too.";
    config.warnings.push(
      "Add SMTP_HOST, SMTP_USER, SMTP_PASS (without VITE_ prefix) to environment variables"
    );
    config.warnings.push(
      "Contact form works because it uses VITE_ variables, but webhooks may fail"
    );
  }

  if (!hasViteVars && hasNonViteVars) {
    config.recommendation =
      "⚠️ INFO: Only non-VITE variables found. This is OK for backend, but frontend may not have access.";
    config.warnings.push(
      "Consider adding VITE_SMTP_HOST, VITE_SMTP_USER for frontend consistency"
    );
  }

  if (hasViteVars && hasNonViteVars) {
    config.recommendation =
      "✅ GOOD: Both VITE_ and non-VITE variables configured.";
  }

  return res.status(200).json(config);
}
