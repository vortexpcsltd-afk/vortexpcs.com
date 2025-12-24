import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Diagnostic endpoint to verify webhook endpoint is accessible
 * Visit: https://your-domain.vercel.app/api/stripe/webhook-test
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const timestamp = new Date().toISOString();

  res.status(200).json({
    status: "ok",
    message: "Webhook endpoint is accessible",
    timestamp,
    method: req.method,
    url: req.url,
    headers: {
      host: req.headers.host,
      userAgent: req.headers["user-agent"],
    },
    environment: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
        ? `${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...`
        : "NOT SET",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
        ? `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...`
        : "NOT SET",
    },
  });
}
