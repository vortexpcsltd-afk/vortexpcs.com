import type { VercelRequest, VercelResponse } from "@vercel/node";

// Serve manifest.json with proper CORS headers to bypass authentication requirements
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== "GET" && req.method !== "OPTIONS") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "public, max-age=600");
    return res.status(200).end();
  }

  // Serve the manifest.json file
  const manifest = {
    name: "Vortex PCs - Custom PC Builder",
    short_name: "Vortex PCs",
    description:
      "Custom high-performance PCs built to order with premium components. Build your dream PC with our expert PC Builder tool.",
    lang: "en-GB",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#000000",
    theme_color: "#0ea5e9",
    categories: ["technology", "shopping", "productivity"],
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/icons/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/icons/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "wide",
      },
    ],
  };

  // Set proper headers for manifest
  res.setHeader("Content-Type", "application/manifest+json");
  res.setHeader("Cache-Control", "public, max-age=600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");

  return res.status(200).json(manifest);
}
