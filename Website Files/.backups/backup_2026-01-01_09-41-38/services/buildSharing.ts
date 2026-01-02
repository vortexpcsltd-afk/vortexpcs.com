// Build sharing utilities for PCBuilder
// Core components + optional peripherals encoded into a compact URL-safe token.
// Encoding Format (raw before base64url):
//   key=value pairs joined by ';'
//   Components: case=ID;cpu=ID;...
//   Peripherals: periph_keyboard=ID1,ID2;periph_mouse=ID1
// Then base64url (no padding) -> ?build=<token>
// Decoding gracefully skips unknown keys.

import type { SelectedComponentIds } from "../components/PCBuilder";
import { logger } from "./logger";

export interface DecodedFullBuild {
  components: SelectedComponentIds;
  peripherals: Record<string, string[]>; // category -> array of IDs
}

// Base64 URL helpers (avoid padding + URL unsafe chars)
function toUrlBase64(input: string): string {
  return btoa(input).replace(/=+/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromUrlBase64(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return atob(input.replace(/-/g, "+").replace(/_/g, "/") + pad);
}

// Encode only core components
export function encodeBuild(components: SelectedComponentIds): string {
  const entries = Object.entries(components).filter(([_, v]) => !!v);
  if (entries.length === 0) return "";
  const raw = entries
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join(";");
  return toUrlBase64(raw);
}

// Encode full build (components + peripherals)
export function encodeFullBuild(
  components: SelectedComponentIds,
  peripherals: Record<string, string[]>
): string {
  const pairs: string[] = [];
  Object.entries(components).forEach(([k, v]) => {
    if (v) pairs.push(`${k}=${encodeURIComponent(v)}`);
  });
  Object.entries(peripherals).forEach(([k, ids]) => {
    if (Array.isArray(ids) && ids.length > 0) {
      const safeIds = ids.map((id) => encodeURIComponent(id)).join(",");
      pairs.push(`periph_${k}=${safeIds}`);
    }
  });
  if (pairs.length === 0) return "";
  return toUrlBase64(pairs.join(";"));
}

export function decodeBuild(token: string): SelectedComponentIds {
  const result: SelectedComponentIds = {};
  if (!token) return result;
  try {
    const raw = fromUrlBase64(token);
    raw.split(";").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (!k || !v) return;
      if (k.startsWith("periph_")) return; // ignore peripheral keys here
      result[k as keyof SelectedComponentIds] = decodeURIComponent(v);
    });
  } catch (e) {
    logger.warn("Failed to decode build token", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
  return result;
}

export function decodeFullBuild(token: string): DecodedFullBuild {
  const decoded: DecodedFullBuild = { components: {}, peripherals: {} };
  if (!token) return decoded;
  try {
    const raw = fromUrlBase64(token);
    raw.split(";").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (!k || !v) return;
      if (k.startsWith("periph_")) {
        const category = k.replace("periph_", "");
        decoded.peripherals[category] = v
          .split(",")
          .map((id) => decodeURIComponent(id))
          .filter(Boolean);
      } else {
        decoded.components[k as keyof SelectedComponentIds] =
          decodeURIComponent(v);
      }
    });
  } catch (e) {
    logger.warn("Failed to decode full build token", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
  return decoded;
}

export function buildShareUrl(
  baseUrl: string,
  components: SelectedComponentIds
): string {
  const token = encodeBuild(components);
  if (!token) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set("build", token);
  return url.toString();
}

export function buildFullShareUrl(
  baseUrl: string,
  components: SelectedComponentIds,
  peripherals: Record<string, string[]>
): string {
  const token = encodeFullBuild(components, peripherals);
  if (!token) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set("build", token);
  return url.toString();
}
