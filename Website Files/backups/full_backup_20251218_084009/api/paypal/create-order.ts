import type { VercelRequest, VercelResponse } from "@vercel/node";

// PayPal API base URLs
const getPayPalBase = () => {
  const env = (process.env.PAYPAL_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
};

function trimCred(val: string | undefined): string {
  if (!val) return "";
  let trimmed = val.trim();
  // Remove surrounding quotes
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1);
  }
  return trimmed;
}

async function getAccessToken() {
  // Allow either PAYPAL_CLIENT_ID / PAYPAL_SECRET or VITE_ prefixed fallbacks.
  const clientId = trimCred(
    process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID
  );
  const secret = trimCred(
    process.env.PAYPAL_SECRET || process.env.VITE_PAYPAL_SECRET
  );

  if (!clientId || !secret) {
    console.error("❌ PayPal credentials missing", {
      hasClientId: !!clientId,
      hasSecret: !!secret,
    });
    throw new Error(
      "PayPal not configured: missing PAYPAL_CLIENT_ID or PAYPAL_SECRET"
    );
  }

  console.log("🔑 PayPal Auth Attempt", {
    clientIdLength: clientId.length,
    secretLength: secret.length,
    clientIdPreview: clientId.substring(0, 10) + "...",
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
    console.error("❌ PayPal token failed", {
      status: res.status,
      response: text,
      endpoint: `${base}/v1/oauth2/token`,
      clientConfigured: !!clientId,
      secretConfigured: !!secret,
    });
    throw new Error(`Failed to obtain PayPal token: ${res.status} ${text}`);
  }

  console.log("✅ PayPal token obtained");
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

import { withSecureMethod } from "../middleware/apiSecurity.js";

export default withSecureMethod(
  "POST",
  async (req: VercelRequest, res: VercelResponse) => {
    try {
      const {
        items,
        customerEmail,
        currency = "GBP",
        metadata,
      } = req.body || {};

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }

      const total = items.reduce(
        (sum: number, it: { price: number; quantity: number }) =>
          sum + Number(it.price || 0) * Number(it.quantity || 1),
        0
      );

      const accessToken = await getAccessToken();
      const base = getPayPalBase();

      const orderPayload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: String(currency || "GBP").toUpperCase(),
              value: total.toFixed(2),
            },
            custom_id: metadata?.userId || undefined,
            description: "Vortex PCs order",
          },
        ],
        payer: customerEmail ? { email_address: customerEmail } : undefined,
        application_context: {
          brand_name: "Vortex PCs",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${
            process.env.PUBLIC_BASE_URL || "https://www.vortexpcs.com"
          }/order-success`,
          cancel_url: `${
            process.env.PUBLIC_BASE_URL || "https://www.vortexpcs.com"
          }/checkout`,
        },
      } as const;

      const resCreate = await fetch(`${base}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await resCreate.json();

      if (!resCreate.ok) {
        return res
          .status(resCreate.status)
          .json({ message: data?.message || "Failed to create PayPal order" });
      }

      const response = {
        orderId: data.id,
        status: data.status,
        links: Array.isArray(data.links)
          ? data.links.map((l: any) => ({
              href: l.href,
              rel: l.rel,
              method: l.method,
            }))
          : [],
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error("PayPal create-order error:", error);
      const msg = error?.message || "Failed to create PayPal order";
      return res.status(500).json({ message: msg });
    }
  }
);
