// Address lookup service with provider fallbacks
// Primary: getaddress.io (requires VITE_GETADDRESS_IO_API_KEY)
// Fallback: api.postcodes.io (synthesised addresses for coverage only)

import { GETADDRESS_IO_API_KEY } from "../config/address";

// Export a simple indicator so the UI can tell what provider actually served the data
export let lastAddressProvider: string = "";

export async function lookupAddresses(postcode: string): Promise<string[]> {
  const trimmed = (postcode || "").trim();
  if (!trimmed) return [];

  // TEMPORARY PRIORITY: try client getaddress.io FIRST if key exists
  // Goal: deliver real addresses immediately while backend routing propagates
  if (GETADDRESS_IO_API_KEY) {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ADDRESS === "1")
      console.log("📫 Trying getaddress.io (client) first");
    const url = `https://api.getaddress.io/find/${encodeURIComponent(
      trimmed
    )}?api-key=${encodeURIComponent(GETADDRESS_IO_API_KEY)}&expand=true`;
    try {
      const res = await fetch(url);
      if (res.ok) {
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
        } = await res.json();
        const addresses: string[] = (data.addresses || []).map((a) => {
          const parts = [
            a.line_1,
            a.line_2,
            a.line_3,
            a.town_or_city || a.townOrCity,
            a.county,
            data.postcode || trimmed.toUpperCase(),
          ].filter(Boolean);
          return parts.join(", ").replace(/,\s*,/g, ", ").replace(/,\s*$/, "");
        });
        if (addresses.length > 0) {
          lastAddressProvider = "getaddress.io (client)";
          return addresses;
        }
      } else if (
        import.meta.env.DEV ||
        import.meta.env.VITE_DEBUG_ADDRESS === "1"
      ) {
        const text = await res.text().catch(() => "");
        console.warn(`getaddress.io responded ${res.status}: ${text}`);
      }
    } catch (e) {
      if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ADDRESS === "1")
        console.warn("getaddress.io (client) failed, will try backend.", e);
    }
    // If client fails or returns empty, continue to backend attempts below
  }

  // 1) Try backend proxy first (works locally if vercel dev is running, and in production)
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
            console.log("📦 Using backend address proxy");
          lastAddressProvider = "backend proxy";
          return json.addresses;
        } else if (
          Array.isArray(json.addresses) &&
          json.addresses.length === 0 &&
          (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ADDRESS === "1")
        ) {
          console.warn("Backend proxy returned no addresses for:", trimmed);
          lastAddressProvider = "backend proxy (no results)";
        }
      }
    } catch {
      if (import.meta.env.DEV)
        console.warn("Backend address proxy unavailable.");
    }
  }

  // 1b) Try relative path (useful when served behind the same origin, e.g. production)
  try {
    const res = await fetch(
      `/api/address/find?postcode=${encodeURIComponent(trimmed)}`
    );
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.addresses) && json.addresses.length > 0) {
        if (import.meta.env.DEV)
          console.log("📦 Using same-origin backend address proxy");
        lastAddressProvider = "backend proxy (same-origin)";
        return json.addresses;
      } else if (
        Array.isArray(json.addresses) &&
        json.addresses.length === 0 &&
        (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ADDRESS === "1")
      ) {
        console.warn(
          "Same-origin backend proxy returned no addresses for:",
          trimmed
        );
        lastAddressProvider = "backend proxy (same-origin, no results)";
      }
    }
  } catch {
    // ignore
  }

  // Note: client getaddress.io already attempted above; if no key, we'll continue

  // Fallback: use postcodes.io to synthesise plausible addresses for UX
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ADDRESS === "1") {
    console.log("📮 Falling back to postcodes.io synthetic addresses");
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
    return synthetic;
  }
  return [];
}
