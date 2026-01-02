import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withSecureMethod } from "../middleware/apiSecurity.js";

export default withSecureMethod(
  "GET",
  async (_req: VercelRequest, res: VercelResponse) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    return res.status(200).json({
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
);
