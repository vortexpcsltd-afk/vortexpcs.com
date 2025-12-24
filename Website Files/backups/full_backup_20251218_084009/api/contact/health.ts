/**
 * Vercel Serverless Function - Test SMTP Configuration
 * Visit /api/contact/health to verify SMTP settings without sending email
 * Last updated: 2025-01-10
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { getSmtpConfig } from "../services/smtp.js";
import type { ApiError } from "../../types/api";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET requests for easy browser testing
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: {},
    smtp: {},
    status: "unknown",
  };

  try {
    // Check environment variables (without leaking values)
    // Use centralized SMTP config (trims values and normalizes host)
    const {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      pass: smtpPass,
    } = getSmtpConfig(req);
    const businessEmail =
      process.env.VITE_BUSINESS_EMAIL || "info@vortexpcs.com";

    results.environment = {
      VITE_SMTP_HOST: smtpHost ? "✓ Set" : "✗ Missing",
      VITE_SMTP_PORT: smtpPort,
      VITE_SMTP_SECURE: smtpSecure,
      VITE_SMTP_USER: smtpUser ? `✓ Set (${smtpUser})` : "✗ Missing",
      VITE_SMTP_PASS: smtpPass
        ? `✓ Set (${smtpPass.length} chars)`
        : "✗ Missing",
      VITE_BUSINESS_EMAIL: businessEmail,
    };

    const missing: string[] = [];
    if (!smtpHost) missing.push("VITE_SMTP_HOST");
    if (!smtpUser) missing.push("VITE_SMTP_USER");
    if (!smtpPass) missing.push("VITE_SMTP_PASS");

    if (missing.length) {
      results.status = "error";
      (
        results.smtp as Record<string, unknown>
      ).error = `Missing required env vars: ${missing.join(", ")}`;
      return res.status(500).json(results);
    }

    // Test SMTP connection
    (results.smtp as Record<string, unknown>).config = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
    };

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    // Verify connection
    const startTime = Date.now();
    await transporter.verify();
    const duration = Date.now() - startTime;

    results.status = "success";
    (results.smtp as Record<string, unknown>).connection =
      "✓ Connected successfully";
    (results.smtp as Record<string, unknown>).verifyDuration = `${duration}ms`;
    (results as Record<string, unknown>).message =
      "SMTP configuration is valid and working!";

    return res.status(200).json(results);
  } catch (error: unknown) {
    const err = error as ApiError & {
      code?: string;
      command?: string;
      response?: unknown;
      responseCode?: unknown;
    };

    results.status = "error";
    (results.smtp as Record<string, unknown>).error = {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
    };

    // Provide helpful hints
    let hint = "";
    if (err?.code === "EAUTH") {
      hint =
        "Authentication failed. Check SMTP username and password in Vercel env vars.";
    } else if (err?.code === "ENOTFOUND" || err?.code === "ENOENT") {
      hint =
        "SMTP host not found. Check VITE_SMTP_HOST is 'mail.privateemail.com'.";
    } else if (err?.code === "ECONNECTION" || err?.code === "ETIMEDOUT") {
      hint =
        "Connection failed. Check port (587 for STARTTLS, 465 for SSL) and VITE_SMTP_SECURE setting.";
    } else if (err?.code === "ESOCKET") {
      hint = "Socket error. Try port 465 with VITE_SMTP_SECURE=true instead.";
    }

    results.hint = hint;

    return res.status(500).json(results);
  }
}
