import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple test endpoint to check environment variables
  const hasBase64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
  const base64Length = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 0;

  // Try to parse if it exists
  let parseResult = "not attempted";
  if (hasBase64) {
    try {
      const decoded = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!,
        "base64"
      ).toString("utf-8");
      const parsed = JSON.parse(decoded);
      parseResult = "success - has " + Object.keys(parsed).length + " keys";
    } catch (error) {
      parseResult =
        "failed: " + (error instanceof Error ? error.message : String(error));
    }
  }

  return res.status(200).json({
    hasBase64Env: hasBase64,
    hasProjectIdEnv: hasProjectId,
    base64Length,
    parseResult,
    // Show a small sample to verify it's the right format
    base64Sample: hasBase64
      ? process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!.substring(0, 50) + "..."
      : "not set",
  });
}
