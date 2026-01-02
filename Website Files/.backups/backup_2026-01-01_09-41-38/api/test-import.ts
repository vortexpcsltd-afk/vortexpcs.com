import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSmtpConfig } from "./services/smtp.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const config = getSmtpConfig(req);
    return res.status(200).json({ success: true, config });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
