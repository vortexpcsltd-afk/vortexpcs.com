import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { logger } from "../services/logger.js";
import { withSecureHandler } from "../middleware/apiSecurity.js";
import { parseQuery, querySchemas } from "../utils/queryValidation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export default withSecureHandler(
  async (req: VercelRequest, res: VercelResponse) => {
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
      return res.status(405).json({ message: "Method not allowed" });
    }

    try {
      const query = parseQuery(req, res, querySchemas.stripeSessionStatus);
      if (!query) return; // Validation error already sent

      const sessionId = query.session_id as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Invalid session ID" });
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
);
