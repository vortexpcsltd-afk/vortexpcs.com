import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { pi } = req.query;

    if (!pi || typeof pi !== "string") {
      return res.status(400).json({ message: "PaymentIntent ID required" });
    }

    const intent = await stripe.paymentIntents.retrieve(pi, {
      expand: [
        "charges.data.balance_transaction",
        "payment_method",
        "latest_charge",
        "latest_charge.payment_method_details",
      ],
    });

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
      customerEmail: billingDetails?.email || intent.receipt_email || undefined,
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
