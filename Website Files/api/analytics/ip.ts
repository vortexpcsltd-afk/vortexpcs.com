import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Allow only GET/HEAD
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const xfwd = (req.headers["x-forwarded-for"] as string) || "";
    const xreal = (req.headers["x-real-ip"] as string) || "";
    const forwarded = xfwd
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ip = forwarded[0] || xreal || req.socket?.remoteAddress || "";

    // Minimal JSON response, no caching
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({ ip });
  } catch (e) {
    return res.status(200).json({ ip: "" });
  }
}
