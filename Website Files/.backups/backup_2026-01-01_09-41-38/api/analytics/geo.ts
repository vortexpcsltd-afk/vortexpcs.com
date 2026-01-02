import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
    const ip =
      forwarded[0] || xreal || (req.socket as any)?.remoteAddress || "";

    // Vercel Geo Headers (may be undefined locally)
    const countryCode = (
      (req.headers["x-vercel-ip-country"] as string) || ""
    ).toUpperCase();
    const region = (req.headers["x-vercel-ip-country-region"] as string) || "";
    const city = (req.headers["x-vercel-ip-city"] as string) || "";

    // No-store: always fresh for the current requester
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      ip,
      countryCode: countryCode || undefined,
      region: region || undefined,
      city: city || undefined,
    });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({ ip: "" });
  }
}
