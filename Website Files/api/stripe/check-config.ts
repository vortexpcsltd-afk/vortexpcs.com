import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  res.status(200).json({
    hasSecretKey: !!secretKey,
    keyPrefix: secretKey ? secretKey.substring(0, 10) + "..." : "NOT SET",
    keyMode: secretKey?.includes("_test_")
      ? "TEST"
      : secretKey?.includes("_live_")
      ? "LIVE"
      : "UNKNOWN",
    timestamp: new Date().toISOString(),
  });
}
