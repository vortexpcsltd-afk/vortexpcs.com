// Address lookup service with provider fallbacks
// ⚠️ SECURITY: All address lookups use secure backend proxy
// Primary: Backend proxy (/api/address/find) → getaddress.io API
// Fallback: api.postcodes.io (synthesised addresses for coverage only)

import { logger } from "./logger";

// Export a simple indicator so the UI can tell what provider actually served the data
export let lastAddressProvider: string = "";
export let lastAddressError: string = "";

export async function lookupAddresses(postcode: string): Promise<string[]> {
  const trimmed = (postcode || "").trim();
  if (!trimmed) return [];
  lastAddressError = "";

  // 🔒 SECURITY: Only use backend proxy - NEVER expose API keys client-side
  // Prefer same-origin first to avoid CORS and apex/www mismatches
  try {
    const res = await fetch(
      `/api/address/find?postcode=${encodeURIComponent(trimmed)}`
    );
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.addresses) && json.addresses.length > 0) {
        if (import.meta.env.DEV)
          logger.debug("📦 Using same-origin backend address proxy");
        lastAddressProvider = "backend proxy (same-origin)";
        return json.addresses;
      } else if (
        Array.isArray(json.addresses) &&
        json.addresses.length === 0 &&
        (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ADDRESS === "1")
      ) {
        logger.warn("Same-origin backend proxy returned no addresses", {
          postcode: trimmed,
        });
        lastAddressProvider = "backend proxy (same-origin, no results)";
        lastAddressError = "backend same-origin 200 empty";
      }
    } else {
      lastAddressError = `backend same-origin ${res.status}`;
    }
  } catch {
    // ignore
  }

  // 2) Try configured backend base URL (for mobile or external hosts)
  const backendUrl =
    import.meta.env.VITE_BACKEND_BASE_URL ||
    import.meta.env.VITE_STRIPE_BACKEND_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (backendUrl) {
    try {
      const base = backendUrl.replace(/\/$/, "");
      const url = `${base}/api/address/find?postcode=${encodeURIComponent(
        trimmed
      )}`;
      const proxyRes = await fetch(url);
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (Array.isArray(json.addresses) && json.addresses.length > 0) {
          if (import.meta.env.DEV)
            logger.debug("📦 Using backend address proxy");
          lastAddressProvider = "backend proxy";
          return json.addresses;
        } else if (
          Array.isArray(json.addresses) &&
          json.addresses.length === 0 &&
          (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ADDRESS === "1")
        ) {
          logger.warn("Backend proxy returned no addresses", {
            postcode: trimmed,
          });
          lastAddressProvider = "backend proxy (no results)";
          lastAddressError = "backend 200 empty";
        }
      } else {
        lastAddressError = `backend ${proxyRes.status}`;
      }
    } catch {
      if (import.meta.env.DEV)
        logger.warn("Backend address proxy unavailable.");
      if (!lastAddressError) lastAddressError = "backend unreachable";
    }
  }

  // Note: client getaddress.io already attempted above; if no key, we'll continue

  // Fallback: use postcodes.io to synthesise plausible addresses for UX
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ADDRESS === "1") {
    logger.debug("📮 Falling back to postcodes.io synthetic addresses");
  }
  const normalized = trimmed.replace(/\s+/g, "").toUpperCase();
  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(normalized)}`
  );
  const data = await response.json();
  if (data.status === 200 && data.result) {
    const r = data.result;
    const baseStreet = r.parish || r.admin_ward || "Main Street";
    const district = r.admin_district || "";
    const region = r.region || "";
    const pc = trimmed.toUpperCase();
    const synthetic = [
      `1 ${baseStreet}, ${district}, ${region}, ${pc}`.replace(/,\s*,/g, ", "),
      `2 ${baseStreet}, ${district}, ${region}, ${pc}`.replace(/,\s*,/g, ", "),
      `Flat A, 3 ${baseStreet}, ${district}, ${pc}`.replace(/,\s*,/g, ", "),
      `Unit 4, ${
        r.admin_ward || r.parish || "High Street"
      }, ${district}, ${pc}`.replace(/,\s*,/g, ", "),
    ];
    lastAddressProvider = "postcodes.io (fallback)";
    if (!lastAddressError) lastAddressError = "fallback synthetic";
    return synthetic;
  }
  return [];
}
