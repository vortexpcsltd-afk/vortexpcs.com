import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ALLOWED_ORIGINS } from "../middleware/apiSecurity";
import { logger } from "../services/logger";
import {
  CSRF_CONFIG,
  generateCsrfToken,
  generateCsrfCookieHeader,
} from "../../utils/csrfToken";

function setCors(req: VercelRequest, res: VercelResponse): void {
  const requestOrigin = (req.headers?.origin as string | undefined) || "";
  const allow = new Set<string>(ALLOWED_ORIGINS as unknown as string[]);

  if (requestOrigin && allow.has(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://vortexpcs.com");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-CSRF-Token, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const token = generateCsrfToken();
    const cookieHeader = generateCsrfCookieHeader(token, true, "Lax");

    res.setHeader("Set-Cookie", cookieHeader);
    res.setHeader(CSRF_CONFIG.HEADER_NAME, token);

    logger.info("Issued CSRF token", { origin: req.headers.origin });

    res.status(200).json({ token });
  } catch (error) {
    logger.error("Failed to issue CSRF token", error as Error);
    res.status(500).json({ error: "Failed to issue CSRF token" });
  }
}
