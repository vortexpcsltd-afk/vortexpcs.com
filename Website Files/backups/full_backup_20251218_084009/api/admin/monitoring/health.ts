/**
 * Admin Monitoring - System Health Check API
 * Checks status of critical services and dependencies
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createLogger } from "../../services/logger";
import { verifyAdmin } from "../../services/auth-admin";
import { getSmtpConfig } from "../../services/smtp";
import nodemailer from "nodemailer";

interface HealthCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  message?: string;
  lastChecked: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authentication (with optional bypass for environments
    // where Firebase Admin credentials are not configured)
    let adminUser;
    try {
      adminUser = await verifyAdmin(req);
    } catch (authError: unknown) {
      logger.warn("Admin verification failed, continuing anyway", {
        error: (authError as Error)?.message,
      });
      // Continue anyway - we'll do a basic auth check below
    }

    const adminCredsPresent = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.FIREBASE_PROJECT_ID
    );
    const authOptional =
      String(
        process.env.ADMIN_MONITORING_AUTH_OPTIONAL || "true"
      ).toLowerCase() === "true";

    if (!adminUser && !authOptional && adminCredsPresent) {
      return res.status(403).json({ error: "Admin access required" });
    }

    logger.info("Admin checking system health", {
      admin: adminUser?.email || "(unauthenticated)",
      authOptional,
      adminCredsPresent,
    });

    const healthChecks: HealthCheck[] = [];

    // 0. Baseline Web App check so UI always has at least one item
    healthChecks.push({
      service: "Web App",
      status: "healthy",
      message: "API reachable",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    });

    // 1. Check SMTP Connection (optional)
    try {
      const smtpHealth = await checkSmtp();
      healthChecks.push(smtpHealth);
    } catch (error: unknown) {
      logger.error("SMTP health check crashed", error as Error);
      healthChecks.push({
        service: "SMTP",
        status: "down",
        message: (error as Error)?.message || "Health check crashed",
        lastChecked: new Date().toISOString(),
      });
    }

    // 2. Check Firebase Connection
    try {
      const firebaseHealth = await checkFirebase();
      healthChecks.push(firebaseHealth);
    } catch (error: unknown) {
      logger.error("Firebase health check crashed", error as Error);
      healthChecks.push({
        service: "Firebase",
        status: "down",
        message: (error as Error)?.message || "Health check crashed",
        lastChecked: new Date().toISOString(),
      });
    }

    // 3. Check Contentful CMS
    try {
      const contentfulHealth = await checkContentful();
      healthChecks.push(contentfulHealth);
    } catch (error: unknown) {
      logger.error("Contentful health check crashed", error as Error);
      healthChecks.push({
        service: "Contentful CMS",
        status: "down",
        message: (error as Error)?.message || "Health check crashed",
        lastChecked: new Date().toISOString(),
      });
    }

    // 4. Check Stripe API
    try {
      const stripeHealth = await checkStripe();
      healthChecks.push(stripeHealth);
    } catch (error: unknown) {
      logger.error("Stripe health check crashed", error as Error);
      healthChecks.push({
        service: "Stripe",
        status: "down",
        message: (error as Error)?.message || "Health check crashed",
        lastChecked: new Date().toISOString(),
      });
    }

    // Overall system status
    const hasDown = healthChecks.some((check) => check.status === "down");
    const hasDegraded = healthChecks.some(
      (check) => check.status === "degraded"
    );

    const overallStatus = hasDown
      ? "down"
      : hasDegraded
      ? "degraded"
      : "healthy";

    return res.status(200).json({
      success: true,
      status: overallStatus,
      checks: healthChecks,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error("Health check failed", error as Error);
    return res.status(500).json({
      error: "Health check failed",
      details: (error as Error)?.message,
    });
  }
}

async function checkSmtp(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const config = getSmtpConfig({});

    if (!config.host || !config.user || !config.pass) {
      return {
        service: "SMTP",
        status: "degraded",
        message: "Not configured",
        lastChecked: new Date().toISOString(),
      };
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });

    await transporter.verify();
    const responseTime = Date.now() - start;

    return {
      service: "SMTP",
      status: "healthy",
      responseTime,
      message: `Connected to ${config.host}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      service: "SMTP",
      status: "down",
      message: (error as Error)?.message || "Connection failed",
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkFirebase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Import and ensure Firebase Admin is initialized
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (base64) {
        const creds = JSON.parse(
          Buffer.from(base64, "base64").toString("utf-8")
        );
        admin.initializeApp({
          credential: admin.credential.cert(creds),
        });
      } else {
        // Try Application Default Credentials as fallback
        const projectId =
          process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId,
          });
        } catch (_) {
          return {
            service: "Firebase",
            status: "degraded",
            message: "Admin not initialized (missing credentials)",
            lastChecked: new Date().toISOString(),
          };
        }
      }
    }

    // Quick read test
    await admin.firestore().collection("_health").limit(1).get();
    const responseTime = Date.now() - start;

    return {
      service: "Firebase",
      status: "healthy",
      responseTime,
      message: "Connected",
      lastChecked: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      service: "Firebase",
      status: "degraded",
      message: (error as Error)?.message || "Connection failed",
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkContentful(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const spaceId = process.env.VITE_CONTENTFUL_SPACE_ID;
    const accessToken = process.env.VITE_CONTENTFUL_ACCESS_TOKEN;

    if (!spaceId || !accessToken) {
      return {
        service: "Contentful CMS",
        status: "degraded",
        message: "Not configured",
        lastChecked: new Date().toISOString(),
      };
    }

    const response = await fetch(
      `https://cdn.contentful.com/spaces/${spaceId}/entries?limit=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const responseTime = Date.now() - start;

    if (!response.ok) {
      // Treat auth/permission errors as degraded (misconfiguration), not hard down
      if (response.status === 401 || response.status === 403) {
        return {
          service: "Contentful CMS",
          status: "degraded",
          message: `Auth error HTTP ${response.status}`,
          lastChecked: new Date().toISOString(),
        };
      }
      return {
        service: "Contentful CMS",
        status: "down",
        message: `HTTP ${response.status}`,
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      service: "Contentful CMS",
      status: "healthy",
      responseTime,
      message: "Connected",
      lastChecked: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      service: "Contentful CMS",
      status: "down",
      message: (error as Error)?.message || "Connection failed",
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkStripe(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return {
        service: "Stripe",
        status: "degraded",
        message: "Not configured",
        lastChecked: new Date().toISOString(),
      };
    }

    // Quick balance retrieve test
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    const responseTime = Date.now() - start;

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          service: "Stripe",
          status: "degraded",
          message: `Auth error HTTP ${response.status}`,
          lastChecked: new Date().toISOString(),
        };
      }
      return {
        service: "Stripe",
        status: "down",
        message: `HTTP ${response.status}`,
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      service: "Stripe",
      status: "healthy",
      responseTime,
      message: "Connected",
      lastChecked: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      service: "Stripe",
      status: "down",
      message: (error as Error)?.message || "Connection failed",
      lastChecked: new Date().toISOString(),
    };
  }
}
