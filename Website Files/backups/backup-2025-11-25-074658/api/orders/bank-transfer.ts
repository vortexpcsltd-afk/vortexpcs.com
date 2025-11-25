import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import { buildBrandedEmailHtml } from "../../services/emailTemplate.js";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? JSON.parse(
          Buffer.from(
            process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
            "base64"
          ).toString("utf-8")
        )
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate user (optional - allows guest checkout)
    let userId = "guest";
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ") && admin.apps.length > 0) {
      try {
        const token = authHeader.substring(7);
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.warn("Invalid auth token, proceeding as guest");
      }
    }

    const {
      amount,
      currency = "gbp",
      cartItems,
      shippingAddress,
      customerEmail,
      customerName,
      shippingMethod,
      shippingCost,
    } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // DIAGNOSTIC: Server-side amount validation
    const serverCalculatedSubtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    const serverShippingCost =
      typeof shippingCost === "number" ? shippingCost : 0;
    const serverCalculatedTotal = serverCalculatedSubtotal + serverShippingCost;
    const amountDiscrepancy = Math.abs(amount - serverCalculatedTotal);

    console.log("🔍 SERVER AMOUNT VALIDATION", {
      clientAmount: amount.toFixed(2),
      serverSubtotal: serverCalculatedSubtotal.toFixed(2),
      serverShipping: serverShippingCost.toFixed(2),
      serverTotal: serverCalculatedTotal.toFixed(2),
      discrepancy: amountDiscrepancy.toFixed(2),
      shippingMethod: shippingMethod || "free",
      itemCount: cartItems.length,
    });

    // Alert if significant discrepancy detected
    if (amountDiscrepancy > 0.02) {
      console.error("⚠️ AMOUNT MISMATCH DETECTED!", {
        expected: serverCalculatedTotal,
        received: amount,
        difference: amountDiscrepancy,
        items: cartItems.map(
          (i: any) => `${i.name}: £${i.price} x${i.quantity}`
        ),
      });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `VPC-${dateStr}-${randomSuffix}`;

    // Create order in Firestore
    if (!admin.apps.length) {
      throw new Error("Firebase not configured");
    }

    const db = admin.firestore();
    const orderData = {
      orderNumber,
      userId,
      customerEmail,
      customerName: customerName || "",
      amount,
      currency: currency.toUpperCase(),
      status: "pending_payment",
      paymentMethod: "bank_transfer",
      items: cartItems.map((item: any) => ({
        productId: item.id,
        name: item.name,
        category: item.category || "",
        price: item.price,
        quantity: item.quantity,
        image: item.image || "",
      })),
      shippingAddress,
      shippingMethod: shippingMethod || "free",
      shippingCost: typeof shippingCost === "number" ? shippingCost : 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      notes: "Awaiting bank transfer payment confirmation",
    };

    const orderRef = await db.collection("orders").add(orderData);

    console.log("✅ Bank transfer order created", {
      orderId: orderRef.id,
      orderNumber,
      userId,
      amount,
      currency,
    });

    // Send pending payment emails (customer + admin)
    try {
      const smtpHost = process.env.VITE_SMTP_HOST || process.env.SMTP_HOST;
      const smtpUser = process.env.VITE_SMTP_USER || process.env.SMTP_USER;
      const smtpPass = process.env.VITE_SMTP_PASS || process.env.SMTP_PASS;
      const smtpPortStr =
        process.env.VITE_SMTP_PORT || process.env.SMTP_PORT || "465";
      const smtpPort = parseInt(smtpPortStr, 10);
      const secure = smtpPort === 465;
      const businessEmail =
        process.env.VITE_BUSINESS_EMAIL ||
        process.env.BUSINESS_EMAIL ||
        "info@vortexpcs.com";

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.error("❌ SMTP not configured - skipping email send");
      } else {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure,
          auth: { user: smtpUser, pass: smtpPass },
        });

        // Build bank transfer instructions HTML
        const bankDetailsHtml = `
          <div style="margin: 24px 0; padding: 20px; background: #0b1220; border: 1px solid rgba(255,165,0,0.3); border-radius: 10px;">
            <p style="margin:0 0 12px; font-size:16px; font-weight:600; color:#ffa500;">⏳ Awaiting Payment</p>
            <p style="margin:0 0 16px; font-size:14px; color:#e5e7eb;">
              Please transfer <strong style="color:#0ea5e9;">£${amount.toFixed(
                2
              )}</strong> to the following account:
            </p>
            <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin:0 0 8px; font-size:12px; color:#9ca3af; text-transform:uppercase;">Bank Details</p>
              <p style="margin:0 0 6px; font-size:14px; color:#fff;"><strong>Account Name:</strong> Vortex PCs Ltd</p>
              <p style="margin:0 0 6px; font-size:14px; color:#fff;"><strong>Bank Name:</strong> ANNA</p>
              <p style="margin:0 0 6px; font-size:14px; color:#fff;"><strong>Sort Code:</strong> 23-11-85</p>
              <p style="margin:0 0 6px; font-size:14px; color:#fff;"><strong>Account Number:</strong> 35445517</p>
              <p style="margin:0; font-size:14px; color:#ffa500;"><strong>Reference:</strong> ${orderNumber}</p>
            </div>
            <p style="margin:0; font-size:13px; color:#9ca3af;">
              ⚠️ <strong>Important:</strong> Please include the reference <strong>${orderNumber}</strong> with your payment so we can match it to your order.
            </p>
          </div>
        `;

        const itemsRows = cartItems
          .map(
            (i: any) =>
              `<tr>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e5e7eb; font-size: 14px;">${
              i.name
            }</td>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center; color: #e5e7eb; font-size: 14px;">${
              i.quantity
            }</td>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; color: #e5e7eb; font-size: 14px;">£${i.price.toFixed(
              2
            )}</td>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; font-weight: 600; color: #0ea5e9; font-size: 15px;">£${(
              i.price * i.quantity
            ).toFixed(2)}</td>
          </tr>`
          )
          .join("");

        const customerContentHtml = `
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #e5e7eb;">
            Hi <strong style="color: #fff;">${
              customerName || "Customer"
            }</strong>,
          </p>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #e5e7eb;">
            Thank you for your order! We're holding your order pending payment confirmation.
          </p>
          <div style="margin:16px 0 24px; padding:14px 16px; background:#0b1220; border:1px solid rgba(255,255,255,0.06); border-radius:8px;">
            <p style="margin:0 0 4px; font-size:12px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.8px;">Shipping Method</p>
            <p style="margin:0; font-size:14px; color:#e5e7eb;">
              <strong style="color:#0ea5e9; text-transform:capitalize;">${(
                shippingMethod || "free"
              ).replace("-", " ")}</strong>
              — £${(typeof shippingCost === "number"
                ? shippingCost
                : 0
              ).toFixed(2)}
            </p>
          </div>
          
          <div style="margin: 24px 0; padding: 18px; background: #0b1220; border: 1px solid rgba(14,165,233,0.3); border-radius: 10px;">
            <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px;">Order Number</p>
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: #0ea5e9;">#${orderNumber}</p>
          </div>

          ${bankDetailsHtml}
          
          <h2 style="margin: 32px 0 16px; font-size: 18px; font-weight: 600; color: #fff;">Order Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #0b1220; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
            <thead>
              <tr style="background: rgba(14,165,233,0.08);">
                <th style="padding: 14px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Item</th>
                <th style="padding: 14px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Qty</th>
                <th style="padding: 14px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Price</th>
                <th style="padding: 14px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              <tr>
                <td colspan="3" style="padding: 18px 12px 16px; text-align: right; font-size: 16px; font-weight: 600; color: #fff; border-top: 2px solid rgba(14,165,233,0.3);">
                  Total:
                </td>
                <td style="padding: 18px 12px 16px; text-align: right; font-size: 20px; font-weight: 700; color: #0ea5e9; border-top: 2px solid rgba(14,165,233,0.3);">
                  £${amount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        `;

        const customerHtml = buildBrandedEmailHtml({
          title: "Order Confirmation - Awaiting Payment",
          preheader: `Order ${orderNumber} - Please complete bank transfer`,
          contentHtml: customerContentHtml,
          accentFrom: "#ffa500",
          accentTo: "#ff8c00",
        });

        // Send customer email
        await transporter.sendMail({
          from: `"Vortex PCs" <${smtpUser}>`,
          to: customerEmail,
          subject: `Order ${orderNumber} - Bank Transfer Instructions`,
          html: customerHtml,
          replyTo: businessEmail,
        });

        // Send business notification
        const businessHtml = buildBrandedEmailHtml({
          title: "New Bank Transfer Order",
          preheader: `Order ${orderNumber} - Awaiting payment`,
          contentHtml: `
            <p style="margin: 0 0 16px; font-size: 16px; color: #e5e7eb;">
              New order received - awaiting bank transfer payment.
            </p>
            <div style="margin: 0 0 16px; padding: 12px 14px; background:#0b1220; border:1px solid rgba(255,255,255,0.06); border-radius:8px;">
              <p style="margin:0; font-size:13px; color:#e5e7eb;"><strong>Shipping:</strong> ${(
                shippingMethod || "free"
              ).replace("-", " ")} (£${(typeof shippingCost === "number"
            ? shippingCost
            : 0
          ).toFixed(2)})</p>
            </div>
            <div style="margin: 16px 0; padding: 16px; background: #0b1220; border: 1px solid rgba(255,165,0,0.3); border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #ffa500;"><strong>Order:</strong> ${orderNumber}</p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #e5e7eb;"><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
              <p style="margin: 0; font-size: 14px; color: #e5e7eb;"><strong>Amount:</strong> £${amount.toFixed(
                2
              )}</p>
            </div>
            ${customerContentHtml}
          `,
          accentFrom: "#ffa500",
          accentTo: "#ff8c00",
        });

        await transporter.sendMail({
          from: `"Vortex PCs Orders" <${smtpUser}>`,
          to: businessEmail,
          subject: `New Bank Transfer Order: ${orderNumber} - £${amount.toFixed(
            2
          )}`,
          html: businessHtml,
        });

        console.log("✅ Bank transfer emails sent successfully");
      }
    } catch (emailErr) {
      console.error("❌ Failed to send bank transfer emails:", emailErr);
    }

    return res.status(200).json({
      success: true,
      orderId: orderRef.id,
      orderNumber,
      message: "Order created. Bank transfer details sent to email.",
    });
  } catch (error: unknown) {
    console.error("❌ Error creating bank transfer order:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create bank transfer order",
    });
  }
}
