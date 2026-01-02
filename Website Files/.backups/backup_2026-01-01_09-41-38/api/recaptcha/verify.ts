import type { VercelRequest, VercelResponse } from "@vercel/node";

interface RecaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  score: number;
  action: string;
  error_codes?: string[];
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY is not configured");
      return res.status(500).json({ error: "reCAPTCHA not configured" });
    }

    // Verify token with Google's reCAPTCHA API
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const googleResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    if (!googleResponse.ok) {
      throw new Error("Failed to verify token with Google");
    }

    const data: RecaptchaResponse = await googleResponse.json();

    // Check if verification was successful
    if (!data.success) {
      console.warn("reCAPTCHA verification failed:", data.error_codes);
      return res
        .status(400)
        .json({ error: "reCAPTCHA verification failed", details: data });
    }

    // Check score (v3 returns a score from 0.0 to 1.0)
    // Higher scores indicate more likely legitimate requests
    // Typical threshold is 0.5, but you may adjust based on your needs
    const scoreThreshold = parseFloat(
      process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5"
    );

    if (data.score < scoreThreshold) {
      console.warn(
        `reCAPTCHA score ${data.score} below threshold ${scoreThreshold}`
      );
      return res.status(400).json({
        error: "Verification score too low",
        score: data.score,
      });
    }

    // Verify action matches expected value
    if (data.action !== "mfa_sms") {
      console.warn(`Unexpected action: ${data.action}, expected: mfa_sms`);
      return res.status(400).json({
        error: "Invalid action",
        expectedAction: "mfa_sms",
        receivedAction: data.action,
      });
    }

    // Token verified successfully
    return res.status(200).json({
      success: true,
      score: data.score,
      action: data.action,
      message: "reCAPTCHA verification successful",
    });
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during verification" });
  }
}

export default handler;
