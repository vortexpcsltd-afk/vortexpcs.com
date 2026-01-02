/**
 * Centralized SMTP Configuration Helper
 * Trims environment variables, parses types, and normalizes common typos
 */

function trimOr(val: string | undefined): string {
  if (typeof val === "string") {
    // Trim whitespace
    let trimmed = val.trim();
    // Remove surrounding quotes if present
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      trimmed = trimmed.slice(1, -1);
    }
    return trimmed;
  }
  return val || "";
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  missing: string[];
  normalizedHost?: string;
  warning?: string;
}

export function getSmtpConfig(_req?: unknown): SmtpConfig {
  let host = trimOr(process.env.VITE_SMTP_HOST) || "";
  const port = parseInt(trimOr(process.env.VITE_SMTP_PORT) || "465", 10);
  const secure = (trimOr(process.env.VITE_SMTP_SECURE) || "true") === "true";
  const user = trimOr(process.env.VITE_SMTP_USER) || "";
  const pass = trimOr(process.env.VITE_SMTP_PASS) || "";
  const from =
    trimOr(process.env.VITE_BUSINESS_EMAIL) || user || "no-reply@vortexpcs.com";

  const missing: string[] = [];
  if (!host) missing.push("VITE_SMTP_HOST");
  if (!user) missing.push("VITE_SMTP_USER");
  if (!pass) missing.push("VITE_SMTP_PASS");

  let normalizedHost: string | undefined;
  let warning: string | undefined;
  // Auto-correct common typos: spaceship.com -> spacemail.com
  if (/spaceship\.com/i.test(host)) {
    normalizedHost = host.replace(/spaceship\.com/gi, "spacemail.com");
    warning = `Corrected SMTP host from ${host} to ${normalizedHost}`;
    host = normalizedHost;
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    missing,
    normalizedHost,
    warning,
  };
}
