import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearCache, clearCacheByPattern } from "../../services/cms";

/**
 * Contentful Webhook Handler
 * Receives notifications when content is published/updated/deleted
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

    // Determine which cache keys to clear based on content type
    const contentType = payload?.sys?.contentType?.sys?.id;

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
        console.log("🔄 Clearing PC components cache");
        clearCacheByPattern("pcComponents_");
        break;

      case "optionalExtra":
        console.log("🔄 Clearing optional extras cache");
        clearCacheByPattern("pcOptionalExtras_");
        break;

      case "product":
        console.log("🔄 Clearing products cache");
        clearCacheByPattern("products_");
        break;

      case "pcBuild":
        console.log("🔄 Clearing PC builds cache");
        clearCacheByPattern("pcBuilds_");
        break;

      case "pricingTier":
        console.log("🔄 Clearing pricing tiers cache");
        clearCacheByPattern("pricingTiers_");
        break;

      default:
        console.log("🔄 Clearing all cache (unknown content type)");
        clearCache();
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
