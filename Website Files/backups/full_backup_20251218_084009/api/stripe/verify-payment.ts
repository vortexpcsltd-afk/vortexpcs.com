import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { StripeError } from "../../types/api";
import { withSecureHandler } from "../middleware/apiSecurity.js";
import { parseQuery, querySchemas } from "../utils/queryValidation.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default withSecureHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
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

      // Retrieve the checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "customer_details"],
      });

      res.status(200).json({
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        amountTotal: session.amount_total,
        amountSubtotal: session.amount_subtotal,
        currency: session.currency,
        metadata: session.metadata,
        shippingAddress: session.customer_details?.address,
        lineItems: session.line_items?.data,
      });
    } catch (error: unknown) {
      const err = error as StripeError;
      console.error("Verify payment error:", err);
      res.status(500).json({
        message: err.message || "Failed to verify payment",
      });
    }
  }
);
