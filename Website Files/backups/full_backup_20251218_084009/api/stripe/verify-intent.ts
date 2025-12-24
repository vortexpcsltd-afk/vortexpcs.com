import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withSecureHandler } from "../middleware/apiSecurity.js";
import { parseQuery, querySchemas } from "../utils/queryValidation.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default withSecureHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    try {
      const query = parseQuery(req, res, querySchemas.stripePaymentIntent);
      if (!query) return; // Validation error already sent

      const { payment_intent } = query;

      const intent = await stripe.paymentIntents.retrieve(
        String(payment_intent),
        {
          expand: [
            "charges.data.balance_transaction",
            "payment_method",
            "latest_charge",
            "latest_charge.payment_method_details",
          ],
        }
      );

      // Normalize response shape to match verify-payment where possible
      const latestCharge =
        intent.latest_charge && typeof intent.latest_charge !== "string"
          ? intent.latest_charge
          : undefined;
      const billingDetails =
        latestCharge && typeof latestCharge !== "string"
          ? (latestCharge as any).billing_details
          : undefined;
      const shipping = intent.shipping;

      res.status(200).json({
        status: intent.status,
        customerEmail:
          billingDetails?.email || intent.receipt_email || undefined,
        customerName: billingDetails?.name || undefined,
        amountTotal: intent.amount,
        currency: intent.currency,
        shippingAddress: shipping?.address,
        paymentMethod: intent.payment_method,
        metadata: intent.metadata,
      });
    } catch (error: unknown) {
      const err = error as Error & { type?: string; code?: string };
      console.error("Verify payment intent error:", err);
      res.status(500).json({
        message: err.message || "Failed to verify payment",
      });
    }
  }
);
