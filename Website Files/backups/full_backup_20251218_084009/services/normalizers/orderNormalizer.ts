import { logger } from "../logger";
import type { Order } from "../database";

// Normalized item shape used throughout UI layers
export interface NormalizedItem {
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  category?: string; // optional component category (case, cpu, gpu, etc.)
}

// Normalized order shape. Retains original snapshot for diagnostics.
export interface NormalizedOrder {
  id: string; // Firestore doc id or derived
  displayId: string; // orderId / orderNumber / fallback id
  total: number; // guaranteed numeric total
  status: Order["status"];
  paymentMethod:
    | NonNullable<Order["paymentMethod"]>
    | "card"
    | "paypal"
    | "bank_transfer"; // ensure present
  items: NormalizedItem[];
  orderDate?: Date; // original order date
  createdAt?: Date; // alias of orderDate for semantic clarity
  progress?: number;
  buildUpdates?: Array<{ note?: string; progress?: number; timestamp?: Date }>;
  estimatedCompletion?: Date;
  deliveryDate?: Date;
  trackingNumber?: string;
  courier?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  notes?: string; // customer notes / internal notes
  shippingMethod?: string;
  shippingCost?: number;
  updatedAt?: Date;
  original: Order; // full raw object (post Firestore mapping)
}

// Convert loosely typed timestamp-like values to Date
function toDateMaybe(value: unknown): Date | undefined {
  try {
    if (
      value !== null &&
      typeof value === "object" &&
      "toDate" in (value as Record<string, unknown>) &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      const d = (value as { toDate: () => Date }).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
    }
    if (value instanceof Date)
      return !isNaN(value.getTime()) ? value : undefined;
    if (typeof value === "string" || typeof value === "number") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

// Normalizes a single Order (already converted from Firestore by database.ts) into a predictable NormalizedOrder.
export function normalizeOrder(raw: Order): NormalizedOrder {
  const displayId = raw.orderId || raw.orderNumber || raw.id || "UNKNOWN";
  const paymentMethod =
    (raw.paymentMethod as NormalizedOrder["paymentMethod"]) || "card";
  let total = typeof raw.total === "number" ? raw.total : 0;

  // Items normalization (support multiple origin schemas: productName | name | description)
  const items: NormalizedItem[] = Array.isArray(raw.items)
    ? raw.items.map((it) => {
        const unitPrice = typeof it.price === "number" ? it.price : 0;
        const quantity = typeof it.quantity === "number" ? it.quantity : 1;
        // Try multiple field names for product name
        const itAny = it as Record<string, unknown>;
        const name =
          it.productName ||
          (itAny.name as string | undefined) ||
          (itAny.description as string | undefined) ||
          it.productId ||
          "Item";

        const category =
          typeof itAny.category === "string"
            ? (itAny.category as string)
            : undefined;

        if (!it.productName && name === "Item") {
          logger.warn("normalizeOrder: item missing productName", {
            displayId,
            itemFields: Object.keys(it),
            item: it,
          });
        }

        return {
          name,
          unitPrice,
          quantity,
          lineTotal: unitPrice * quantity,
          category,
        };
      })
    : [];

  if (total === 0 && items.length > 0) {
    total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  }

  // Build updates normalization
  const buildUpdates = Array.isArray(raw.buildUpdates)
    ? raw.buildUpdates.map((u) => ({
        note: u.note,
        progress: typeof u.progress === "number" ? u.progress : undefined,
        timestamp: toDateMaybe(u.timestamp),
      }))
    : [];

  // Status sanity
  const allowed: Array<Order["status"]> = [
    "pending",
    "pending_payment",
    "building",
    "testing",
    "shipped",
    "delivered",
    "completed",
  ];
  const status: Order["status"] = allowed.includes(raw.status)
    ? raw.status
    : (logger.warn("normalizeOrder: unknown status coerced to pending", {
        received: raw.status,
        displayId,
      }),
      "pending");

  // Additional fields normalization using loose index access
  const rawAny = raw as unknown as { [key: string]: unknown };
  const orderDate =
    toDateMaybe(rawAny.orderDate) || toDateMaybe(rawAny.createdAt);
  const updatedAt = toDateMaybe(rawAny.updatedAt);
  const estimatedCompletion = toDateMaybe(rawAny.estimatedCompletion);
  const deliveryDate = toDateMaybe(rawAny.deliveryDate);
  const trackingNumber =
    typeof rawAny.trackingNumber === "string"
      ? rawAny.trackingNumber
      : undefined;
  const courier =
    typeof rawAny.courier === "string" ? rawAny.courier : undefined;
  const addressRaw = rawAny.address || rawAny.shippingAddress; // support both keys
  const notes = typeof rawAny.notes === "string" ? rawAny.notes : undefined;
  const shippingMethod =
    typeof rawAny.shippingMethod === "string"
      ? rawAny.shippingMethod
      : undefined;
  const shippingCost =
    typeof rawAny.shippingCost === "number" ? rawAny.shippingCost : undefined;
  const address =
    addressRaw && typeof addressRaw === "object"
      ? {
          line1: (addressRaw as Record<string, unknown>).line1 as
            | string
            | undefined,
          line2: (addressRaw as Record<string, unknown>).line2 as
            | string
            | undefined,
          city: (addressRaw as Record<string, unknown>).city as
            | string
            | undefined,
          postcode: (addressRaw as Record<string, unknown>).postcode as
            | string
            | undefined,
          country: (addressRaw as Record<string, unknown>).country as
            | string
            | undefined,
        }
      : undefined;

  return {
    id: String(raw.id || displayId),
    displayId: String(displayId),
    total,
    status,
    paymentMethod,
    items,
    orderDate,
    createdAt: orderDate,
    updatedAt,
    progress: typeof raw.progress === "number" ? raw.progress : undefined,
    buildUpdates,
    estimatedCompletion,
    deliveryDate,
    trackingNumber,
    courier,
    address,
    notes,
    shippingMethod,
    shippingCost,
    original: raw,
  };
}

export function normalizeOrders(raws: Order[]): NormalizedOrder[] {
  return raws.map((r) => normalizeOrder(r));
}
