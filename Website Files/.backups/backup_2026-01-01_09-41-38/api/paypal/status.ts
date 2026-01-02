import type { VercelRequest, VercelResponse } from "@vercel/node";

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

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const clientIdRaw =
    process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID;
  const secretRaw = process.env.PAYPAL_SECRET;
  const clientId = trimCred(clientIdRaw);
  const secret = trimCred(secretRaw);
  const env = (
    process.env.PAYPAL_ENVIRONMENT ||
    process.env.VITE_PAYPAL_ENVIRONMENT ||
    "sandbox"
  ).toLowerCase();

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") return res.status(200).end();
  if (_req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  return res.status(200).json({
    success: true,
    environment: env,
    clientConfigured:
      !!clientId &&
      clientId !== "YOUR_PAYPAL_CLIENT_ID" &&
      clientId.length > 20,
    serverConfigured: !!clientId && !!secret,
    clientIdLength: clientId?.length || 0,
    secretLength: secret?.length || 0,
    missing: [
      !clientId ? "PAYPAL_CLIENT_ID" : null,
      !secret ? "PAYPAL_SECRET" : null,
    ].filter(Boolean),
  });
}
