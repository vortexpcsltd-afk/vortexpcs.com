// Utility: Product ID / raw name to friendly display name mapping
// Extend this map over time with real component IDs.

const PRODUCT_ID_NAME_MAP: Record<string, string> = {
  custom_build: "Custom PC Build (Legacy)",
};

// Optional normalization map for raw names (case-insensitive)
const RAW_NAME_NORMALIZATION_MAP: Record<string, string> = {
  "custom pc build": "Custom PC Build (Legacy)",
};

export function resolveProductName(
  rawName: string | undefined,
  productId?: string,
  category?: string
): string {
  const idKey = (productId || "").trim().toLowerCase();
  if (idKey && PRODUCT_ID_NAME_MAP[idKey]) return PRODUCT_ID_NAME_MAP[idKey];
  const rawKey = (rawName || "").trim().toLowerCase();
  if (rawKey && RAW_NAME_NORMALIZATION_MAP[rawKey]) {
    return RAW_NAME_NORMALIZATION_MAP[rawKey];
  }
  // Basic category-based enhancement
  if (category && rawName && rawName.toLowerCase() === "component") {
    return `${capitalize(category)} Component`;
  }
  return rawName || productId || "Item";
}

export function enrichItems<
  T extends { productName?: string; productId?: string; category?: string }
>(items: T[]): T[] {
  return items.map((it) => ({
    ...it,
    productName: resolveProductName(it.productName, it.productId, it.category),
  }));
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const __PRODUCT_MAPPING_VERSION__ = 1; // bump when map meaningfully grows
