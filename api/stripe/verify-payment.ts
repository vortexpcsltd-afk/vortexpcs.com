import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
});

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
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ message: "Session ID required" });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
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
  } catch (error: any) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: error.message || "Failed to verify payment",
    });
  }
}
