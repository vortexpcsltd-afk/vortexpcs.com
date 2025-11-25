import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { logger } from "../services/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sessionId = req.query.session_id as string;

    if (!sessionId) {
      return res.status(400).json({ error: "session_id is required" });
    }

    // Retrieve the Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    logger.info("Session status retrieved", {
      sessionId,
      status: session.status,
      paymentStatus: session.payment_status,
    });

    return res.status(200).json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
    });
  } catch (error: unknown) {
    logger.error("Error retrieving session status:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve session status",
    });
  }
}
