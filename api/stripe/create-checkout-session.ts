import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { items, customerEmail, metadata, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            description: item.category || "",
          },
          unit_amount: Math.round(item.price * 100), // Convert pounds to pence
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      customer_email: customerEmail,
      metadata: {
        ...metadata,
        userId: userId || "",
        orderDate: new Date().toISOString(),
      },
      success_url: `${
        process.env.VITE_APP_URL || req.headers.origin
      }/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.VITE_APP_URL || req.headers.origin
      }/?cancelled=true`,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["GB"],
      },
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error);
    res.status(500).json({
      message: error.message || "Failed to create checkout session",
    });
  }
}
