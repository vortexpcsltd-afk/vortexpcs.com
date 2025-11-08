import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createLogger } from "../services/logger";
import {
  checkAddressRateLimit,
  getClientId,
  setRateLimitHeaders,
  createRateLimitError,
} from "../services/ratelimit";
import { captureException, addBreadcrumb } from "../services/sentry";

// Serverless proxy to getaddress.io so we don't expose keys to the client
// Reads GETADDRESS_IO_API_KEY (preferred) or VITE_GETADDRESS_IO_API_KEY from server env

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);

  // Basic CORS for browser use
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
  res.setHeader("X-Trace-ID", logger.getTraceId());

  logger.info("Address lookup request received");

  if (req.method === "OPTIONS") {
    logger.debug("Handling OPTIONS preflight");
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    logger.warn("Invalid method attempted", { method: req.method });
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    // Check rate limit
    const clientId = getClientId(req);
    const rateLimitResult = await checkAddressRateLimit(clientId);
    setRateLimitHeaders(res, rateLimitResult);

    if (!rateLimitResult.success) {
      logger.warn("Rate limit exceeded", {
        clientId,
        limit: rateLimitResult.limit,
      });
      addBreadcrumb("Address lookup rate limit exceeded", { clientId });
      return res.status(429).json(createRateLimitError(rateLimitResult));
    }

    const postcodeRaw = (req.query.postcode as string | undefined) || "";
    const postcode = postcodeRaw.trim();

    logger.info("Processing address lookup", { postcode });

    if (!postcode) {
      logger.warn("Missing postcode parameter");
      res.status(400).json({ message: "Missing postcode", addresses: [] });
      return;
    }

    // Lenient UK postcode pattern for quick validation
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode)) {
      logger.warn("Invalid postcode format", { postcode });
      res
        .status(400)
        .json({ message: "Invalid UK postcode format", addresses: [] });
      return;
    }

    const key =
      process.env.GETADDRESS_IO_API_KEY ||
      process.env.VITE_GETADDRESS_IO_API_KEY;

    if (!key) {
      logger.warn("No getaddress.io API key configured");
      // No key configured on the server: respond gracefully with empty addresses
      res.status(200).json({
        message: "No getaddress.io key configured on server",
        addresses: [],
        provider: "none",
      });
      return;
    }

    addBreadcrumb("Calling getaddress.io API", { postcode });
    logger.debug("Calling getaddress.io API");

    const url = `https://api.getaddress.io/find/${encodeURIComponent(
      postcode
    )}?api-key=${encodeURIComponent(key)}&expand=true`;
    const r = await fetch(url);
    const text = await r.text();

    if (!r.ok) {
      logger.warn("getaddress.io API error", { status: r.status, postcode });
      // Attempt to forward error details from provider
      let details: any = undefined;
      try {
        details = JSON.parse(text);
      } catch {
        // ignore
      }
      res.status(r.status).json({
        message: "getaddress.io lookup failed",
        error: details || text,
        addresses: [],
      });
      return;
    }

    const data: {
      postcode?: string;
      addresses?: Array<{
        line_1?: string;
        line_2?: string;
        line_3?: string;
        town_or_city?: string;
        townOrCity?: string;
        county?: string;
      }>;
    } = JSON.parse(text);

    const addresses: string[] = (data.addresses || []).map((a) => {
      const parts = [
        a.line_1,
        a.line_2,
        a.line_3,
        a.town_or_city || a.townOrCity,
        a.county,
        data.postcode || postcode.toUpperCase(),
      ].filter(Boolean) as string[];
      return parts.join(", ").replace(/,\s*,/g, ", ").replace(/,\s*$/, "");
    });

    logger.info("Address lookup successful", {
      postcode,
      addressCount: addresses.length,
    });

    res.status(200).json({ addresses, provider: "getaddress.io (server)" });
  } catch (err: any) {
    logger.error("Address proxy error", err);
    await captureException(err, {
      context: "Address lookup",
      postcode: req.query.postcode,
    });
    res.status(500).json({
      message: "Internal error during address lookup",
      error: err?.message || String(err),
      addresses: [],
    });
  }
}
