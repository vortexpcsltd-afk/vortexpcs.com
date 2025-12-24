// Declare process for serverless environment
declare const process: { env: Record<string, string | undefined> };
import { logger } from "./logger";

type EnvCheck = {
  key: string;
  optional?: boolean;
};

// Log env health once per context to avoid noisy output in serverless logs
const logged = new Set<string>();

export function logEnvOnce(context: string): void {
  if (logged.has(context)) return;
  logged.add(context);

  const checks: EnvCheck[] = [
    { key: "STRIPE_SECRET_KEY" },
    { key: "FIREBASE_SERVICE_ACCOUNT_BASE64", optional: true },
  ];

  const missing = checks
    .filter((check) => !process.env[check.key] && !check.optional)
    .map((check) => check.key);

  if (missing.length) {
    logger.warn(
      `[envValidation:${context}] Missing env vars: ${missing.join(", ")}`
    );
  } else {
    // Use warn to satisfy lint rule allowing only warn/error
    logger.warn(`[envValidation:${context}] Stripe env loaded`);
  }
}
