import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ message: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    // Get the raw body
    const buf = await getRawBody(req);

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ Payment successful:", session.id);
        console.log("Customer email:", session.customer_details?.email);
        console.log("Amount total:", session.amount_total);

        // Send order confirmation email to customer
        try {
          const orderData = {
            orderNumber: session.id,
            customerName: session.customer_details?.name || "Valued Customer",
            customerEmail: session.customer_details?.email || "",
            totalAmount: (session.amount_total || 0) / 100, // Convert from pence to pounds
            paymentStatus: "Paid",
            orderDate: new Date().toISOString(),
            items:
              session.line_items?.data?.map((item) => ({
                name: item.description || "Custom PC Build",
                price: (item.amount_total || 0) / 100 / (item.quantity || 1),
                quantity: item.quantity || 1,
              })) || [],
            shippingAddress: {
              line1: session.customer_details?.address?.line1 || "",
              city: session.customer_details?.address?.city || "",
              postal_code: session.customer_details?.address?.postal_code || "",
              country: session.customer_details?.address?.country || "",
            },
          };

          // Import email service dynamically
          const { sendOrderConfirmationEmail, sendOrderNotificationEmail } =
            await import("../../services/email");

          // Send confirmation email to customer
          await sendOrderConfirmationEmail(orderData);

          // Send notification email to business
          await sendOrderNotificationEmail(orderData);

          console.log("✅ Order emails sent successfully");
        } catch (emailError) {
          console.error("❌ Failed to send order emails:", emailError);
          // Don't fail the webhook, just log the error
        }

        // TODO: Create order in Firebase Firestore
        // TODO: Update inventory if using Strapi CMS

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("✅ PaymentIntent succeeded:", paymentIntent.id);

        // Send order confirmation for custom payment forms
        try {
          const orderData = {
            orderNumber: paymentIntent.id,
            customerName: paymentIntent.shipping?.name || "Valued Customer",
            customerEmail: paymentIntent.receipt_email || "",
            totalAmount: (paymentIntent.amount || 0) / 100, // Convert from pence to pounds
            paymentStatus: "Paid",
            orderDate: new Date().toISOString(),
            items: [], // For custom forms, we'd need to get this from metadata
            shippingAddress: {
              line1: paymentIntent.shipping?.address?.line1 || "",
              city: paymentIntent.shipping?.address?.city || "",
              postal_code: paymentIntent.shipping?.address?.postal_code || "",
              country: paymentIntent.shipping?.address?.country || "",
            },
          };

          // Import email service dynamically
          const { sendOrderConfirmationEmail, sendOrderNotificationEmail } =
            await import("../../services/email");

          // Send confirmation email to customer
          await sendOrderConfirmationEmail(orderData);

          // Send notification email to business
          await sendOrderNotificationEmail(orderData);

          console.log("✅ PaymentIntent order emails sent successfully");
        } catch (emailError) {
          console.error(
            "❌ Failed to send PaymentIntent order emails:",
            emailError
          );
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("❌ PaymentIntent failed:", paymentIntent.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("💸 Charge refunded:", charge.id);
        // TODO: Update order status in database
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    res.status(500).json({
      message: error.message || "Webhook handler failed",
    });
  }
}

// Helper function to get raw body for webhook signature verification
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
