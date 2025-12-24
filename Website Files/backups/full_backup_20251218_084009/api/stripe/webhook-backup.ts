import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { StripeError } from "../../types/api";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

// Inline enrichItems to avoid module resolution issues in Vercel
function enrichItems<T extends { productName?: string; productId?: string }>(
  items: T[]
): T[] {
  return items.map((item) => ({
    ...item,
    productName: item.productName || item.productId || "Item",
  }));
}

// Server-side email sender (bypasses client-side email service)
async function sendOrderEmails(orderData: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  items: Array<{ name: string; price: number; quantity: number }>;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.VITE_SMTP_HOST || "mail.spacemail.com",
    port: parseInt(process.env.VITE_SMTP_PORT || "465"),
    secure: (process.env.VITE_SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.VITE_SMTP_USER,
      pass: process.env.VITE_SMTP_PASS,
    },
  });

  const businessEmail = process.env.VITE_BUSINESS_EMAIL || "info@vortexpcs.com";

  // Customer confirmation email with Vortex PCs branding
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; padding: 40px 20px; text-align: center; }
          .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .logo-vortex { color: #ffffff; }
          .logo-pcs { color: #60a5fa; }
          .content { padding: 30px 20px; background: #ffffff; }
          .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .item-name { font-weight: 500; color: #1e293b; }
          .total-row { display: flex; justify-content: space-between; padding: 15px 0; font-weight: bold; font-size: 18px; color: #2563eb; margin-top: 10px; }
          .footer { text-align: center; padding: 30px 20px; background-color: #f8f9fa; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          .section-title { color: #1e293b; font-size: 20px; font-weight: 600; margin: 25px 0 15px 0; }
          ul { padding-left: 20px; }
          li { margin: 8px 0; color: #475569; }
          a { color: #2563eb; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span class="logo-vortex">VORTEX</span><span class="logo-pcs">PCs</span>.com
            </div>
            <h1 style="margin: 10px 0 0 0; font-size: 28px; font-weight: 600;">Thank You for Your Order!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${
              orderData.orderNumber
            }</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #1e293b;">Hi <strong>${
              orderData.customerName
            }</strong>,</p>
            <p>Thank you for your order! We've received your payment and will begin processing your custom PC build shortly.</p>
            
            <div class="order-details">
              <h3 class="section-title" style="margin-top: 0;">Order Summary</h3>
              ${orderData.items
                .map(
                  (item) => `
                <div class="item-row">
                  <span class="item-name">${item.name} × ${item.quantity}</span>
                  <span style="font-weight: 500;">£${(
                    item.price * item.quantity
                  ).toFixed(2)}</span>
                </div>
              `
                )
                .join("")}
              <div class="total-row">
                <span>Total Paid</span>
                <span>£${orderData.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <h3 class="section-title">What happens next?</h3>
            <ul>
              <li>Our team will review your specifications</li>
              <li>We'll source and quality-check all components</li>
              <li>Your PC will be assembled by our expert technicians</li>
              <li>Rigorous testing will be performed</li>
              <li>You'll receive shipping notification with tracking</li>
            </ul>

            <p>You can track your order progress in your <a href="https://vortexpcs.com/member" style="color: #2563eb;">Member Area</a>.</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br><strong>The Vortex PCs Team</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;"><strong style="color: #1e293b; font-size: 16px;">VORTEX<span style="color: #2563eb;">PCs</span>.com</strong></p>
            <p style="margin: 5px 0;">High-Performance Custom PC Builds</p>
            <p style="margin: 5px 0;">Email: <a href="mailto:info@vortexpcs.com">info@vortexpcs.com</a> | Phone: 01603 975440</p>
            <p style="margin: 5px 0;"><a href="https://vortexpcs.com">www.vortexpcs.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Business notification email - optimized for all email clients including dark mode
  const businessEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="color-scheme" content="light only">
        <meta name="supported-color-schemes" content="light only">
      </head>
      <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="700" cellpadding="0" cellspacing="0" border="0" style="max-width: 700px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 25px; text-align: center;">
                    <div style="color: #ffffff; font-size: 28px; font-weight: bold; margin-bottom: 10px;">
                      VORTEX<span style="color: #60a5fa;">PCs</span>.com
                    </div>
                    <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: 600;">🔔 New Order Received</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px 25px;">
                    
                    <!-- Alert Banner -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin-bottom: 25px; border-radius: 4px;">
                      <tr>
                        <td style="padding: 15px; color: #92400e; font-size: 14px;">
                          <strong>⚡ Action Required:</strong> A new custom PC order needs immediate attention
                        </td>
                      </tr>
                    </table>

                    <!-- Order Info Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
                      <tr>
                        <td width="48%" valign="top" style="padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 5px; font-weight: 600;">ORDER NUMBER</div>
                          <div style="color: #1e293b; font-size: 14px; font-weight: 600; word-break: break-all;">${
                            orderData.orderNumber
                          }</div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" valign="top" style="padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 5px; font-weight: 600;">ORDER TOTAL</div>
                          <div style="color: #1e293b; font-size: 16px; font-weight: 600;">£${orderData.totalAmount.toFixed(
                            2
                          )}</div>
                        </td>
                      </tr>
                      <tr><td colspan="3" height="15"></td></tr>
                      <tr>
                        <td width="48%" valign="top" style="padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 5px; font-weight: 600;">CUSTOMER NAME</div>
                          <div style="color: #1e293b; font-size: 14px; font-weight: 600;">${
                            orderData.customerName
                          }</div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" valign="top" style="padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 5px; font-weight: 600;">CUSTOMER EMAIL</div>
                          <div style="color: #1e293b; font-size: 13px; font-weight: 600; word-break: break-all;">${
                            orderData.customerEmail
                          }</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Items Section -->
                    <div style="margin: 25px 0;">
                      <div style="color: #1e293b; font-size: 18px; font-weight: 600; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
                        📦 Items Ordered (${orderData.items.length})
                      </div>
                      <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #f1f5f9;">
                            <th align="left" style="padding: 12px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Product</th>
                            <th align="center" style="padding: 12px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Qty</th>
                            <th align="right" style="padding: 12px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Unit Price</th>
                            <th align="right" style="padding: 12px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${
                            orderData.items.length > 0
                              ? orderData.items
                                  .map(
                                    (item) => `
                          <tr>
                            <td align="left" style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;"><strong>${
                              item.name
                            }</strong></td>
                            <td align="center" style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${
                              item.quantity
                            }</td>
                            <td align="right" style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">£${item.price.toFixed(
                              2
                            )}</td>
                            <td align="right" style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">£${(
                              item.price * item.quantity
                            ).toFixed(2)}</td>
                          </tr>`
                                  )
                                  .join("")
                              : `
                          <tr>
                            <td colspan="4" align="center" style="padding: 20px; color: #64748b;">No items found</td>
                          </tr>`
                          }
                          <tr style="background-color: #eff6ff;">
                            <td colspan="3" align="right" style="padding: 15px 12px; font-weight: 600; font-size: 16px; color: #1e40af;">Order Total:</td>
                            <td align="right" style="padding: 15px 12px; font-weight: 600; font-size: 16px; color: #1e40af;">£${orderData.totalAmount.toFixed(
                              2
                            )}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Shipping Address -->
                    ${
                      orderData.shippingAddress
                        ? `
                    <div style="margin: 25px 0;">
                      <div style="color: #1e293b; font-size: 18px; font-weight: 600; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
                        📍 Shipping Address
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <tr>
                          <td style="padding: 15px; color: #1e293b; line-height: 1.6;">
                            <strong style="display: block; margin-bottom: 5px;">${
                              orderData.customerName
                            }</strong>
                            ${orderData.shippingAddress.line1}<br>
                            ${
                              orderData.shippingAddress.line2
                                ? orderData.shippingAddress.line2 + "<br>"
                                : ""
                            }
                            ${orderData.shippingAddress.city}, ${
                            orderData.shippingAddress.postal_code
                          }<br>
                            ${orderData.shippingAddress.country}
                          </td>
                        </tr>
                      </table>
                    </div>
                    `
                        : ""
                    }

                    <!-- Action List -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          <div style="color: #92400e; font-size: 16px; font-weight: 600; margin-bottom: 12px;">✅ Next Steps:</div>
                          <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                            <li style="margin: 8px 0;"><strong>Review order details</strong> in the Admin Panel</li>
                            <li style="margin: 8px 0;"><strong>Verify component availability</strong> and stock levels</li>
                            <li style="margin: 8px 0;"><strong>Send order acknowledgment</strong> to customer within 24 hours</li>
                            <li style="margin: 8px 0;"><strong>Begin build process</strong> and update order status</li>
                            <li style="margin: 8px 0;"><strong>Keep customer informed</strong> with progress updates</li>
                          </ul>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="https://vortexpcs.com/admin" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                            Open Admin Panel →
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <div style="color: #64748b; font-size: 13px; line-height: 1.6;">
                      <strong style="color: #1e293b;">Vortex PCs Ltd</strong><br>
                      High-Performance Custom PC Builds<br>
                      📧 info@vortexpcs.com | 📞 01603 975440<br>
                      <a href="https://vortexpcs.com" style="color: #2563eb; text-decoration: none;">www.vortexpcs.com</a>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // Send emails (customer email only if email address exists)
  const emailPromises = [];

  if (orderData.customerEmail && orderData.customerEmail.trim()) {
    emailPromises.push(
      transporter.sendMail({
        from: `"Vortex PCs" <${process.env.VITE_SMTP_USER}>`,
        to: orderData.customerEmail,
        subject: `Order Confirmation - ${orderData.orderNumber}`,
        html: customerEmailHtml,
      })
    );
  } else {
    console.warn("⚠️ Skipping customer email - no email address provided");
  }

  // Always send business notification
  emailPromises.push(
    transporter.sendMail({
      from: `"Vortex PCs Orders" <${process.env.VITE_SMTP_USER}>`,
      to: businessEmail,
      subject: `New Order: ${
        orderData.orderNumber
      } - £${orderData.totalAmount.toFixed(2)}`,
      html: businessEmailHtml,
    })
  );

  await Promise.all(emailPromises);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("🔔 Webhook received:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));

  if (req.method !== "POST") {
    console.error("❌ Invalid method:", req.method);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("❌ Missing stripe-signature header");
    return res.status(400).json({ message: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    // Get the raw body
    const buf = await getRawBody(req);
    console.log("📦 Raw body size:", buf.length, "bytes");

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log("✅ Signature verified. Event type:", event.type);
  } catch (err: unknown) {
    const error = err as StripeError;
    console.error("❌ Webhook signature verification failed:", error.message);
    console.error("Webhook secret configured:", !!webhookSecret);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Initialize Firebase Admin (using same pattern as analytics API)
  function ensureAdminInitialized() {
    if (admin.apps.length) return;
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (credsBase64) {
      const creds = JSON.parse(
        Buffer.from(credsBase64, "base64").toString("utf-8")
      );
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      return;
    }
    const projectId =
      process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (projectId) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
      return;
    }
    throw new Error(
      "Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or provide Application Default Credentials and FIREBASE_PROJECT_ID."
    );
  }

  // Handle the event
  try {
    console.log("🔥 Initializing Firebase Admin...");
    ensureAdminInitialized();
    const fdb = admin.firestore();
    console.log("✅ Firebase initialized successfully");

    async function upsertOrder(
      docId: string,
      payload: Record<string, unknown>
    ) {
      const ref = fdb.collection("orders").doc(docId);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({
          ...payload,
          updatedAt: admin.firestore.Timestamp.now(),
        });
      } else {
        await ref.set({
          ...payload,
          createdAt: admin.firestore.Timestamp.now(),
        });
      }
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const sessionObj = event.data.object as Stripe.Checkout.Session;
        // Retrieve expanded session to get line items and full customer details
        const session = await stripe.checkout.sessions.retrieve(sessionObj.id, {
          expand: ["line_items", "customer_details"],
        });
        console.log("✅ Payment successful:", session.id);
        console.log("Customer email:", session.customer_details?.email);
        console.log("Amount total:", session.amount_total);
        console.log("Line items count:", session.line_items?.data?.length || 0);
        console.log("Metadata:", JSON.stringify(session.metadata, null, 2));

        // Send order confirmation email to customer
        console.log("📧 Attempting to send order emails...");
        console.log(
          "Session line items:",
          JSON.stringify(session.line_items?.data || [], null, 2)
        );

        // Extract items - PRIORITIZE metadata cart over line_items for accurate product names
        let emailItems: Array<{
          name: string;
          price: number;
          quantity: number;
        }> = [];

        // Try metadata cart FIRST (has actual product names)
        if (session.metadata?.cart) {
          try {
            const decoded = Buffer.from(
              session.metadata.cart,
              "base64"
            ).toString("utf-8");
            const parsed = JSON.parse(decoded) as Array<{
              n: string;
              p: number;
              q: number;
            }>;
            emailItems = parsed.map((item) => ({
              name: item.n || "Item",
              price: item.p || 0,
              quantity: item.q || 1,
            }));
          } catch (e) {
            console.warn("Failed to parse cart metadata for email", e);
          }
        }

        // If still empty, create a generic item
        if (emailItems.length === 0) {
          emailItems = [
            {
              name: "Custom PC Build",
              price: (session.amount_total || 0) / 100,
              quantity: 1,
            },
          ];
        }

        console.log(
          "Email items prepared:",
          JSON.stringify(emailItems, null, 2)
        );

        const orderData = {
          orderNumber: session.id,
          customerName: session.customer_details?.name || "Valued Customer",
          customerEmail:
            session.customer_details?.email || session.customer_email || "",
          totalAmount: (session.amount_total || 0) / 100,
          paymentStatus: "Paid",
          orderDate: new Date().toISOString(),
          items: emailItems,
          shippingAddress: session.customer_details?.address
            ? {
                line1: session.customer_details.address.line1 || "",
                line2: session.customer_details.address.line2 || undefined,
                city: session.customer_details.address.city || "",
                postal_code: session.customer_details.address.postal_code || "",
                country: session.customer_details.address.country || "",
              }
            : undefined,
        };

        // Validate customer email exists
        if (!orderData.customerEmail) {
          console.warn(
            "⚠️ No customer email found in session. Sending business notification only."
          );
          // Send only business notification if customer email is missing
          const transporter = nodemailer.createTransport({
            host: process.env.VITE_SMTP_HOST || "mail.spacemail.com",
            port: parseInt(process.env.VITE_SMTP_PORT || "465"),
            secure: (process.env.VITE_SMTP_SECURE || "true") === "true",
            auth: {
              user: process.env.VITE_SMTP_USER,
              pass: process.env.VITE_SMTP_PASS,
            },
          });
          // Send business email only - customer email will use existing template in sendOrderEmails
        } else {
          console.log("✅ Customer email found:", orderData.customerEmail);
        }

        // Send emails using server-side function (wrapped in try/catch)
        try {
          console.log("📧 Calling sendOrderEmails with data:", {
            orderNumber: orderData.orderNumber,
            customerEmail: orderData.customerEmail,
            itemCount: orderData.items.length,
            totalAmount: orderData.totalAmount,
          });
          await sendOrderEmails(orderData);
          console.log(
            "✅ Order emails sent successfully to:",
            orderData.customerEmail || "business only"
          );
        } catch (emailError) {
          console.error("❌ Failed to send order emails:", emailError);
          console.error(
            "Email error details:",
            JSON.stringify(emailError, null, 2)
          );
          console.error("SMTP config:", {
            host: process.env.VITE_SMTP_HOST,
            port: process.env.VITE_SMTP_PORT,
            user: process.env.VITE_SMTP_USER ? "SET" : "NOT SET",
            pass: process.env.VITE_SMTP_PASS ? "SET" : "NOT SET",
          });
          // Don't fail the webhook, just log the error
        }

        // Create/Update order in Firestore (server-side, reliable persistence)
        console.log("💾 Attempting to save order to Firestore...");
        try {
          let items: Array<{
            productId: string;
            productName: string;
            quantity: number;
            price: number;
            image?: string;
            category?: string;
          }> = (session.line_items?.data || []).map((li) => ({
            productId: String(li.price?.product || "unknown"),
            productName: li.description || "Custom PC Build",
            quantity: li.quantity || 1,
            price: (li.amount_total || 0) / 100 / Math.max(li.quantity || 1, 1),
          }));

          // If metadata cart exists, prefer reconstructed items for richer detail
          if (session.metadata?.cart) {
            try {
              const decoded = Buffer.from(
                session.metadata.cart,
                "base64"
              ).toString("utf-8");
              const parsed = JSON.parse(decoded) as Array<{
                id: string;
                n: string;
                p: number;
                q: number;
                img?: string; // image URL if available
              }>;
              if (Array.isArray(parsed) && parsed.length) {
                items = parsed.map((it) => ({
                  productId: it.id || "unknown",
                  productName: it.n || "Item",
                  quantity: it.q || 1,
                  price: it.p,
                  ...(it.img ? { image: it.img } : {}),
                }));
              }
            } catch (metaErr) {
              console.warn("Failed to parse checkout cart metadata", metaErr);
            }
          }

          // If component-level metadata exists, replace items with individual components
          if (session.metadata?.components) {
            try {
              const decodedComponents = Buffer.from(
                session.metadata.components,
                "base64"
              ).toString("utf-8");
              const parsedComponents = JSON.parse(decodedComponents) as Array<{
                id: string;
                n: string;
                p: number;
                cat: string;
                img?: string;
              }>;
              if (Array.isArray(parsedComponents) && parsedComponents.length) {
                items = parsedComponents.map((c) => ({
                  productId: c.id || "component",
                  productName: c.n || "Component",
                  quantity: 1,
                  price: c.p,
                  category: c.cat || "",
                  ...(c.img ? { image: c.img } : {}),
                }));
              }
            } catch (e) {
              console.warn("Failed to parse component metadata", e);
            }
          }

          // Enrich product names with mapping
          items = enrichItems(items);

          // Consolidated diagnostic log for order + inventory context
          console.log(
            "🧪 Order Diagnostic",
            JSON.stringify(
              {
                userIdMeta: session.metadata?.userId || "guest",
                lineItemCount: items.length,
                productIds: items.map((i) => i.productId),
                hasCartMeta: !!session.metadata?.cart,
                hasComponentsMeta: !!session.metadata?.components,
                amountTotal: (session.amount_total || 0) / 100,
              },
              null,
              2
            )
          );

          const userId = (session.metadata?.userId as string) || "guest";
          console.log(
            "💾 Saving order with userId:",
            userId,
            "customerEmail:",
            session.customer_details?.email || session.customer_email
          );

          const orderPayload = {
            userId: userId,
            orderId: session.id,
            customerName: session.customer_details?.name || "Guest Customer",
            customerEmail:
              session.customer_details?.email || session.customer_email || "",
            items,
            total: (session.amount_total || 0) / 100,
            status: "pending",
            progress: 0,
            orderDate: admin.firestore.Timestamp.now(),
            estimatedCompletion: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            ),
            address: {
              line1: session.customer_details?.address?.line1 || "",
              line2: session.customer_details?.address?.line2 || undefined,
              city: session.customer_details?.address?.city || "",
              postcode: session.customer_details?.address?.postal_code || "",
              country: session.customer_details?.address?.country || "GB",
            },
            paymentId: session.id,
            source: "stripe_checkout",
          } as Record<string, unknown>;

          console.log("💾 Calling upsertOrder with ID:", session.id);
          await upsertOrder(session.id, orderPayload);
          console.log("✅ Order upserted successfully");

          // Log before inventory decrement to show pre-state
          console.log(
            "🔎 Inventory Pre-Check",
            JSON.stringify(
              {
                paymentId: session.id,
                items: items.map((i) => ({
                  productId: i.productId,
                  quantity: i.quantity,
                })),
              },
              null,
              2
            )
          );

          // Attempt inventory decrement (idempotent)
          console.log("📊 Attempting inventory decrement...");
          try {
            await decrementInventoryOnce(session.id, items);
            console.log("✅ Inventory decremented successfully");
          } catch (invErr) {
            console.error(
              "❌ Inventory decrement failed (checkout session):",
              invErr
            );
            console.error(
              "Inventory error details:",
              JSON.stringify(invErr, null, 2)
            );
          }
          console.log("✅ Order saved to Firestore (checkout session)");
        } catch (dbErr) {
          console.error(
            "❌ Failed to persist order (checkout session):",
            dbErr
          );
          console.error(
            "Database error details:",
            JSON.stringify(dbErr, null, 2)
          );
        }

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

          // Send emails using server-side function
          await sendOrderEmails(orderData);

          console.log("✅ PaymentIntent order emails sent successfully");
        } catch (emailError) {
          console.error(
            "❌ Failed to send PaymentIntent order emails:",
            emailError
          );
        }

        // Create/Update order in Firestore for PaymentIntent flow
        try {
          const shipping = paymentIntent.shipping;
          // Reconstruct items from metadata cart if available
          let items: Array<{
            productId: string;
            productName: string;
            quantity: number;
            price: number;
            category?: string;
          }> = [];
          if (paymentIntent.metadata?.cart) {
            try {
              const decoded = Buffer.from(
                paymentIntent.metadata.cart,
                "base64"
              ).toString("utf-8");
              const parsed = JSON.parse(decoded) as Array<{
                id: string;
                n: string;
                p: number;
                q: number;
              }>;
              if (Array.isArray(parsed)) {
                items = parsed.map((it) => ({
                  productId: it.id || "custom_build",
                  productName: it.n || "Custom PC Item",
                  quantity: it.q || 1,
                  price: it.p,
                }));
              }
            } catch (e) {
              console.warn("Failed to parse PaymentIntent cart metadata", e);
            }
          }
          // If component-level metadata exists, prefer detailed components
          if (paymentIntent.metadata?.components) {
            try {
              const decodedComponents = Buffer.from(
                paymentIntent.metadata.components,
                "base64"
              ).toString("utf-8");
              const parsedComponents = JSON.parse(decodedComponents) as Array<{
                id: string;
                n: string;
                p: number;
                cat?: string;
              }>;
              if (Array.isArray(parsedComponents) && parsedComponents.length) {
                items = parsedComponents.map((c) => ({
                  productId: c.id || "component",
                  productName: c.n || "Component",
                  quantity: 1,
                  price: c.p,
                  category: c.cat || "",
                }));
              }
            } catch (e) {
              console.warn(
                "Failed to parse PaymentIntent component metadata",
                e
              );
            }
          }
          // Fallback to single item if metadata missing
          if (!items.length) {
            items = [
              {
                productId: "custom_build",
                productName: "Custom PC Build",
                quantity: 1,
                price: (paymentIntent.amount || 0) / 100,
              },
            ];
          }

          // Enrich product names with mapping
          items = enrichItems(items);

          const orderPayload = {
            userId: (paymentIntent.metadata?.userId as string) || "guest",
            orderId: paymentIntent.id,
            customerName: shipping?.name || "Guest Customer",
            customerEmail:
              paymentIntent.receipt_email ||
              (paymentIntent.metadata?.customerEmail as string) ||
              "",
            items,
            total: (paymentIntent.amount || 0) / 100,
            status: "pending",
            progress: 0,
            orderDate: admin.firestore.Timestamp.now(),
            estimatedCompletion: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            ),
            address: {
              line1: shipping?.address?.line1 || "",
              line2: shipping?.address?.line2 || "",
              city: shipping?.address?.city || "",
              postcode: shipping?.address?.postal_code || "",
              country: shipping?.address?.country || "GB",
            },
            paymentId: paymentIntent.id,
            source: "stripe_payment_intent",
          } as Record<string, unknown>;

          await upsertOrder(paymentIntent.id, orderPayload);
          // Attempt inventory decrement (idempotent)
          try {
            await decrementInventoryOnce(paymentIntent.id, items);
          } catch (invErr) {
            console.warn("Inventory decrement failed (payment intent)", invErr);
          }
          console.log("✅ Order saved to Firestore (payment intent)");
        } catch (dbErr) {
          console.error("❌ Failed to persist order (payment intent):", dbErr);
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

    console.log("✅ Webhook processed successfully");
    res.status(200).json({ received: true });
  } catch (error: unknown) {
    const err = error as StripeError;
    console.error("❌ Webhook handler error:", err);
    console.error("Full error details:", JSON.stringify(err, null, 2));
    res.status(500).json({
      message: err.message || "Webhook handler failed",
      error: String(err),
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

// Inventory decrement helper (idempotent via transactions collection)
async function decrementInventoryOnce(
  paymentId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  try {
    if (!admin.apps.length) return; // admin should be initialized already
    const fdb = admin.firestore();
    const txRef = fdb.collection("inventory_transactions").doc(paymentId);
    const existing = await txRef.get();
    if (existing.exists) {
      return; // already processed
    }
    const batch = fdb.batch();
    const now = admin.firestore.Timestamp.now();
    for (const item of items) {
      const invRef = fdb.collection("inventory").doc(item.productId);
      const snap = await invRef.get();
      const currentStock = snap.exists ? snap.data()?.stock || 0 : 0;
      const newStock = Math.max(0, currentStock - (item.quantity || 1));
      console.log(
        "[Inventory] Decrement",
        JSON.stringify({
          paymentId,
          productId: item.productId,
          quantity: item.quantity,
          before: currentStock,
          after: newStock,
          existed: snap.exists,
        })
      );
      batch.set(
        invRef,
        {
          stock: newStock,
          updatedAt: now,
          lastSaleAt: now,
        },
        { merge: true }
      );
    }
    batch.set(txRef, { createdAt: now, items });
    await batch.commit();
  } catch (e) {
    console.warn("decrementInventoryOnce error", e);
  }
}
