import type { VercelRequest, VercelResponse } from "@vercel/node";

// This endpoint has been removed. Keeping a stub to avoid 404-to-200 routing surprises.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  return res
    .status(410)
    .json({ message: "Gone: migrate-order-items has been removed" });
}
