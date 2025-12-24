import type { VercelRequest, VercelResponse } from "@vercel/node";
// Using process in a serverless environment; declare for lint if needed
declare const process: { env: Record<string, string | undefined> };

interface SecureOptions {
  allowOrigins?: string[];
  allowMethods?: string[];
  requireApiKey?: boolean;
  apiKeyEnv?: string; // name of env var holding key
}

function setCors(res: VercelResponse, origins: string[]) {
  res.setHeader("Access-Control-Allow-Origin", origins.join(",") || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-Api-Key"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
}

export function withSecureMethod(
  method: string,
  handler: (
    req: VercelRequest,
    res: VercelResponse
  ) => Promise<void | VercelResponse>,
  opts: SecureOptions = {}
) {
  const allowOrigins = opts.allowOrigins || ["*"];
  const allowMethods = opts.allowMethods || [method, "OPTIONS"];
  const apiKeyEnv = opts.apiKeyEnv || "API_PUBLIC_KEY";

  return async (req: VercelRequest, res: VercelResponse) => {
    setCors(res, allowOrigins);
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    if (!req.method || !allowMethods.includes(req.method)) {
      return res.status(405).json({ error: "Method not allowed" });
    }
    if (req.method !== method) {
      return res.status(405).json({ error: `Use ${method}` });
    }

    // Optional simple API key protection (skips if not required)
    if (opts.requireApiKey) {
      const supplied = (req.headers["x-api-key"] || "") as string;
      const expected = process.env[apiKeyEnv];
      if (!expected || supplied !== expected) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    try {
      return await handler(req, res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[apiSecurity] Handler error", msg);
      return res
        .status(500)
        .json({ error: "Internal server error", details: msg });
    }
  };
}

/**
 * withSecureHandler
 *
 * A simplified wrapper that just applies CORS, handles OPTIONS, and wraps errors.
 * Use this for endpoints that already do method checking themselves.
 */
export function withSecureHandler(
  handler: (
    req: VercelRequest,
    res: VercelResponse
  ) => Promise<void | VercelResponse>,
  opts: SecureOptions = {}
) {
  const allowOrigins = opts.allowOrigins || ["*"];

  return async (req: VercelRequest, res: VercelResponse) => {
    setCors(res, allowOrigins);
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Optional simple API key protection (skips if not required)
    if (opts.requireApiKey) {
      const supplied = (req.headers["x-api-key"] || "") as string;
      const expected = process.env[opts.apiKeyEnv || "API_PUBLIC_KEY"];
      if (!expected || supplied !== expected) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    try {
      return await handler(req, res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[apiSecurity] Handler error", msg);
      return res
        .status(500)
        .json({ error: "Internal server error", details: msg });
    }
  };
}

/**
 * withCorsHandler
 *
 * Even simpler - just CORS + OPTIONS handling.
 * The handler must do all its own security/error work.
 */
export function withCorsHandler(
  handler: (
    req: VercelRequest,
    res: VercelResponse
  ) => Promise<void | VercelResponse>,
  origins: string[] = ["*"]
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    setCors(res, origins);
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    return handler(req, res);
  };
}

/**
 * Helper to check if req includes a simple API key
 */
export function checkApiKey(
  req: VercelRequest,
  envVarName: string = "API_PUBLIC_KEY"
): boolean {
  const supplied = (req.headers["x-api-key"] || "") as string;
  const expected = process.env[envVarName];
  return !!expected && supplied === expected;
}
