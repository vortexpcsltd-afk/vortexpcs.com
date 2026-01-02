// Config for address lookup providers
// ⚠️ SECURITY: API keys must NEVER be exposed client-side
// All address lookups go through secure backend proxy at /api/address/find

import { logger } from "../services/logger";

if (import.meta.env.DEV) {
  logger.info("Address Provider", {
    status: "Using secure backend proxy",
    endpoint: "/api/address/find",
  });
}
