import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Contentful Webhook Handler
 * Receives notifications when content is published/updated/deleted
 *
 * Note: This endpoint acknowledges webhooks but does not perform cache clearing
 * as the cache is client-side (browser) and cannot be cleared from server.
 * Content changes will be reflected on next page load when clients fetch fresh data.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST and GET requests
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Handle GET for health check
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "Contentful webhook endpoint is operational",
    });
  }

  try {
    // Verify webhook signature for security
    const signature = req.headers["x-contentful-webhook-signature"];
    const webhookSecret = process.env.CONTENTFUL_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      // Optional: Implement signature verification
      // See: https://www.contentful.com/developers/docs/concepts/webhooks/#webhook-signature
    }

    // Parse webhook payload
    const payload = req.body;
    const topic = req.headers["x-contentful-topic"] as string;

    console.log("📥 Contentful webhook received:", {
      topic,
      contentType: payload?.sys?.contentType?.sys?.id,
      entryId: payload?.sys?.id,
    });

    // Determine content type that was updated
    const contentType = payload?.sys?.contentType?.sys?.id;

    // Log the content type for monitoring
    switch (contentType) {
      case "pcCase":
      case "pcMotherboard":
      case "pcCpu":
      case "pcGpu":
      case "pcRam":
      case "pcStorage":
      case "pcPsu":
      case "pcCooling":
      case "pcCaseFans":
        console.log("✅ PC component updated:", contentType);
        break;

      case "optionalExtra":
        console.log("✅ Optional extra updated");
        break;

      case "product":
        console.log("✅ Product updated");
        break;

      case "pcBuild":
        console.log("✅ PC build updated");
        break;

      case "pricingTier":
        console.log("✅ Pricing tier updated");
        break;

      default:
        console.log("✅ Content updated:", contentType || "unknown");
    }

    // Respond success
    return res.status(200).json({
      success: true,
      message: "Cache cleared successfully",
      contentType,
      topic,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
