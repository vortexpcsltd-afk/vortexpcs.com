export type Consent = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  accepted: boolean; // historical banner format
};

import { safeGetLocalStorage } from "./safeStorage";

function readCookie(name: string): string | null {
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return match
      ? decodeURIComponent(match.split("=").slice(1).join("="))
      : null;
  } catch {
    return null;
  }
}

export function writeConsentCookie(consent: Consent, days = 180) {
  try {
    const expires = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toUTCString();
    const value = encodeURIComponent(JSON.stringify(consent));
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `vortex_cookie_consent=${value}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
  } catch {
    // ignore cookie write errors
  }
}

/**
 * Read consent from localStorage in a backwards-compatible way.
 * Supports legacy string values ("accepted"/"declined") and the
 * newer JSON shape saved from the Cookie Policy page.
 */
export function getConsent(): Consent {
  // Helper to normalize any raw string to Consent
  const normalize = (raw: string): Consent | null => {
    try {
      if (raw === "accepted") {
        return {
          essential: true,
          analytics: true,
          marketing: true,
          accepted: true,
        };
      }
      if (raw === "declined") {
        return {
          essential: true,
          analytics: false,
          marketing: false,
          accepted: false,
        };
      }
      const parsed = JSON.parse(raw);
      const essential = Boolean(parsed.essential) || raw === "accepted";
      const analytics = Boolean(parsed.analytics) || raw === "accepted";
      const marketing = Boolean(parsed.marketing) || raw === "accepted";
      const accepted =
        raw === "accepted" || (essential && (analytics || marketing));
      return { essential, analytics, marketing, accepted };
    } catch {
      return null;
    }
  };

  // Try localStorage first (with safe access)
  const raw = safeGetLocalStorage("vortex_cookie_consent");
  const fromLs = raw ? normalize(raw) : null;
  if (fromLs) return fromLs;

  // Fallback to cookie
  const rawCookie = readCookie("vortex_cookie_consent");
  const fromCookie = rawCookie ? normalize(rawCookie) : null;
  if (fromCookie) return fromCookie;

  // Default conservative
  return {
    essential: false,
    analytics: false,
    marketing: false,
    accepted: false,
  };
}
