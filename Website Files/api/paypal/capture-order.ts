import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

const getPayPalBase = () => {
  const env = (process.env.PAYPAL_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
};

function trimCred(val: string | undefined): string {
  if (!val) return "";
  let trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1);
  }
  return trimmed;
}

async function getAccessToken() {
  const clientId = trimCred(
    process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID
  );
  const secret = trimCred(
    process.env.PAYPAL_SECRET || process.env.VITE_PAYPAL_SECRET
  );

  if (!clientId || !secret) {
    console.error("❌ PayPal credentials missing (capture)", {
      hasClientId: !!clientId,
      hasSecret: !!secret,
    });
    throw new Error(
      "PayPal not configured: missing PAYPAL_CLIENT_ID or PAYPAL_SECRET"
    );
  }

  console.log("🔑 PayPal Auth (capture)", {
    clientIdLength: clientId.length,
    secretLength: secret.length,
    environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
    usingFallbackSecret: Boolean(
      !process.env.PAYPAL_SECRET && process.env.VITE_PAYPAL_SECRET
    ),
  });

  const base = getPayPalBase();
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "Accept-Language": "en_GB",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ PayPal token failed (capture)", {
      status: res.status,
      response: text,
      clientConfigured: !!clientId,
      secretConfigured: !!secret,
      endpoint: `${base}/v1/oauth2/token`,
    });
    throw new Error(`Failed to obtain PayPal token: ${res.status} ${text}`);
  }

  console.log("✅ PayPal token obtained (capture)");
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    // Initialize Firebase Admin (if available)
    if (!admin.apps.length) {
      try {
        const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (credsBase64) {
          const creds = JSON.parse(
            Buffer.from(credsBase64, "base64").toString("utf-8")
          );
          admin.initializeApp({ credential: admin.credential.cert(creds) });
        } else {
          const projectId =
            process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
          if (projectId) {
            admin.initializeApp({
              credential: admin.credential.applicationDefault(),
              projectId,
            });
          }
        }
      } catch (e) {
        console.warn("Firebase Admin init skipped for PayPal capture:", e);
      }
    }

    const { orderId } = req.body || {};
    if (!orderId)
      return res.status(400).json({ message: "orderId is required" });

    const accessToken = await getAccessToken();
    const base = getPayPalBase();

    const resCapture = await fetch(
      `${base}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await resCapture.json();

    if (!resCapture.ok) {
      return res
        .status(resCapture.status)
        .json({ message: data?.message || "Failed to capture PayPal order" });
    }

    const payer = data?.payer || {};
    const purchase = Array.isArray(data?.purchase_units)
      ? data.purchase_units[0]
      : undefined;
    const capture = Array.isArray(purchase?.payments?.captures)
      ? purchase.payments.captures[0]
      : undefined;

    const responsePayload = {
      orderId: data?.id,
      status: data?.status || capture?.status,
      payerId: payer?.payer_id,
      payerEmail: payer?.email_address,
      amount: Number(capture?.amount?.value || purchase?.amount?.value || 0),
      currency: (capture?.amount?.currency_code ||
        purchase?.amount?.currency_code ||
        "GBP") as string,
    };

    // Persist order to Firestore (idempotent upsert by PayPal order id)
    try {
      if (admin.apps.length) {
        const fdb = admin.firestore();
        const ref = fdb.collection("orders").doc(String(data?.id));
        const exists = await ref.get();
        const orderPayload: Record<string, unknown> = {
          userId: "guest",
          orderId: String(data?.id),
          customerName: undefined,
          customerEmail: payer?.email_address || "",
          items: [
            {
              productId: "custom_build",
              productName: "Custom PC Build",
              quantity: 1,
              price: Number(
                capture?.amount?.value || purchase?.amount?.value || 0
              ),
            },
          ],
          total: Number(capture?.amount?.value || purchase?.amount?.value || 0),
          status: String(
            data?.status || capture?.status || "COMPLETED"
          ).toLowerCase(),
          progress: 0,
          orderDate: admin.firestore.Timestamp.now(),
          estimatedCompletion: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ),
          address: {
            line1: "",
            line2: "",
            city: "",
            postcode: "",
            country: responsePayload.currency === "GBP" ? "GB" : "",
          },
          paymentId: String(data?.id),
          source: "paypal",
        };
        if (exists.exists) {
          await ref.update({
            ...orderPayload,
            updatedAt: admin.firestore.Timestamp.now(),
          });
        } else {
          await ref.set({
            ...orderPayload,
            createdAt: admin.firestore.Timestamp.now(),
          });
        }
      }
    } catch (dbErr) {
      console.error("PayPal order persistence error:", dbErr);
    }

    // Attempt to send emails (customer + business)
    try {
      const businessEmail =
        process.env.VITE_BUSINESS_EMAIL ||
        process.env.BUSINESS_EMAIL ||
        "info@vortexpcs.com";

      const smtpHost = process.env.VITE_SMTP_HOST || process.env.SMTP_HOST;
      const smtpUser = process.env.VITE_SMTP_USER || process.env.SMTP_USER;
      const smtpPass = process.env.VITE_SMTP_PASS || process.env.SMTP_PASS;
      const smtpPortStr =
        process.env.VITE_SMTP_PORT || process.env.SMTP_PORT || "465";
      const smtpSecureStr =
        process.env.VITE_SMTP_SECURE || process.env.SMTP_SECURE;
      const smtpPort = parseInt(String(smtpPortStr), 10);
      const secure =
        typeof smtpSecureStr === "string"
          ? smtpSecureStr === "true"
          : smtpPort === 465;

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const orderNumber = String(data?.id);
        const items = [
          {
            name: "Custom PC Build",
            quantity: 1,
            price: Number(
              capture?.amount?.value || purchase?.amount?.value || 0
            ),
          },
        ];
        const totalAmount = items[0].price;

        const tableRows = items
          .map(
            (i) =>
              `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">${
                i.name
              }</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb">${
                i.quantity
              }</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">£${i.price.toFixed(
                2
              )}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">£${(
                i.price * i.quantity
              ).toFixed(2)}</td></tr>`
          )
          .join("");

        const customerHtml = `<!doctype html><html><body style="font-family:Arial,sans-serif"><h2>Thank you for your order</h2><p>Order <strong>#${orderNumber}</strong></p><p>We've received your order.</p><table style="width:100%;border-collapse:collapse">${tableRows}</table><p style="font-weight:bold">Total Paid: £${totalAmount.toFixed(
          2
        )}</p></body></html>`;
        const businessHtml = `<!doctype html><html><body style="font-family:Arial,sans-serif"><h2>New Order: #${orderNumber}</h2><p>Customer: ${
          payer?.email_address || "(unknown)"
        }</p><table style="width:100%;border-collapse:collapse">${tableRows}</table><p style="font-weight:bold">Total: £${totalAmount.toFixed(
          2
        )}</p></body></html>`;

        const sendOps: Promise<unknown>[] = [];
        if (payer?.email_address) {
          sendOps.push(
            transporter
              .sendMail({
                from: `"Vortex PCs" <${smtpUser}>`,
                to: payer.email_address,
                subject: `Order Confirmation - ${orderNumber}`,
                html: customerHtml,
              })
              .catch((e) => console.error("PayPal customer email failed", e))
          );
        }
        sendOps.push(
          transporter
            .sendMail({
              from: `"Vortex PCs Orders" <${smtpUser}>`,
              to: businessEmail,
              subject: `New Order: ${orderNumber} - £${totalAmount.toFixed(2)}`,
              html: businessHtml,
            })
            .catch((e) => console.error("PayPal business email failed", e))
        );

        await Promise.all(sendOps);
      } else {
        console.error("SMTP configuration missing - emails skipped (PayPal)", {
          hasHost: !!smtpHost,
          hasUser: !!smtpUser,
          hasPass: !!smtpPass,
        });
      }
    } catch (e) {
      console.error("PayPal email send error:", e);
    }

    return res.status(200).json(responsePayload);
  } catch (error: any) {
    console.error("PayPal capture-order error:", error);
    const msg = error?.message || "Failed to capture PayPal order";
    return res.status(500).json({ message: msg });
  }
}
