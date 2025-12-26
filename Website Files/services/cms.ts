/**
 * Contentful CMS Service
 * Handles all CMS data fetching for products, builds, blog posts, etc.
 *
 * Note: Strategic use of `as any` for Contentful SDK query parameter casting
 * is necessary to bypass strict SDK typing while maintaining type safety
 * on response handling via ContentfulResponse<T> + safe field extractors.
 */

// Note: Avoid explicit `any`; use `unknown` with narrow casts.

import { contentfulClient, isContentfulEnabled } from "../config/contentful";
import { logger } from "./logger";
import type { Document } from "@contentful/rich-text-types";
import type {
  ContentfulImage,
  ContentfulAsset,
  ContentfulEntry,
  ContentfulQuery,
  ContentfulResponse,
} from "../types";

// Debug logging (development only)
if (import.meta.env.DEV) {
  logger.debug("🔧 CMS Service initialized");
  logger.debug("🔧 Contentful enabled:", { isContentfulEnabled });
  logger.debug("🔧 Contentful client:", {
    status: contentfulClient ? "✅ Created" : "❌ Not created",
  });

  // Provide helpful debugging info if Contentful is not enabled
  if (!isContentfulEnabled) {
    const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
    const token = import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN;
    logger.debug("⚠️ Contentful is disabled. To enable in dev mode:", {
      "Space ID configured": !!spaceId,
      "Access Token configured": !!token,
      See: "CONTENTFUL_DEV_SETUP.md for instructions",
    });
  }
}

// Simple in-memory cache for CMS data to prevent redundant API calls
// Cache expires after 5 minutes
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased to reduce API usage)
const cmsCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cmsCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cmsCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cmsCache.set(key, { data, timestamp: Date.now() });
}

function clearCache(): void {
  cmsCache.clear();
}

/**
 * Clear cache entries matching a pattern (for webhook invalidation)
 * @param pattern - String pattern to match cache keys (e.g., 'pcComponents_')
 * @returns Number of cache entries cleared
 */
function clearCacheByPattern(pattern: string): number {
  const keysToDelete: string[] = [];

  cmsCache.forEach((_, key) => {
    if (key.startsWith(pattern)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => cmsCache.delete(key));

  logger.debug(
    `🗑️ Cleared ${keysToDelete.length} cache entries matching "${pattern}"`
  );
  return keysToDelete.length;
}

// Export cache utilities for manual control if needed
export { clearCache, clearCacheByPattern };

// Re-export all interfaces from original cms.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  featured?: boolean;
  specs?: Record<string, unknown>;
  images?: unknown[];
}

export interface PCBuild {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  featured?: boolean;
  components: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    motherboard?: string;
    psu?: string;
    case?: string;
    cooling?: string;
  };
  images?: unknown[];
}

export interface Component {
  id: number;
  name: string;
  type: string;
  manufacturer: string;
  price: number;
  stock: number;
  specs?: Record<string, unknown>;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  slug?: string;
}

export interface Settings {
  id: number;
  siteName: string;
  logoUrl?: string;
  tagline: string;
  metaDescription: string;
  socialLinks?: Record<string, string>;
  businessHours?: string;
  enableMaintenance: boolean;
  maintenanceMessage?: string;
  announcementBar?: string;
  enableAnnouncementBar: boolean;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber?: string;
  // Optional explicit social/meta fields
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterImage?: string;
}

export interface PageContent {
  id: number;
  pageSlug: string;
  pageTitle: string;
  metaDescription?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroBadgeText?: string;
  featuresTitle?: string;
  featuresDescription?: string;
  ctaBadgeText?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  heroBackgroundImage?: ContentfulAsset | ContentfulImage | string;
  heroButtons?: Array<{
    text: string;
    link: string;
    style: string;
  }>;
  sections?: Array<Record<string, unknown>>;
  seo?: Record<string, unknown>;
  lastUpdated?: string;
  // Optional explicit social/meta fields
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: ContentfulImage | string;
  twitterImage?: ContentfulImage | string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  featured: boolean;
  keywords?: string;
  lastUpdated?: string;
}

export interface ServiceItem {
  id: number;
  serviceName: string;
  description: string;
  price?: number;
  priceText?: string;
  duration?: string;
  category: string;
  features?: Array<string>;
  icon: string;
  popular: boolean;
  available: boolean;
  order: number;
}

export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  order: number;
  highlighted: boolean;
  link?: string;
  showOnHomepage: boolean;
}

export interface NavigationMenu {
  id: number;
  primaryMenu: Array<{
    text: string;
    link: string;
    children?: Array<{ text: string; link: string }>;
  }>;
  footerMenu: Array<{
    text: string;
    link: string;
  }>;
  mobileMenu: Array<{
    text: string;
    link: string;
  }>;
  ctaButton: {
    text: string;
    link: string;
    style: string;
  };
}

export interface ContactInformation {
  id: number;
  companyName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  mapEmbedUrl?: string;
  businessHours?: Record<string, string>;
  emergencyContact?: string;
  supportEmail?: string;
  copyrightText?: string;
  companyRegistrationNumber?: string;
}

// PC Builder Component Interface
export interface PCComponent {
  id: string;
  name: string;
  price: number;
  category: string; // case, motherboard, cpu, gpu, ram, storage, psu, cooling, caseFans
  rating?: number;
  description?: string;
  mainProductDescription?: string | Document; // Rich Text field for detailed product descriptions
  images?: string[];
  imagesByOption?: Record<string, Record<string, string[]>>; // Images organized by option (e.g., { colour: { Black: [...], White: [...] } })
  pricesByOption?: Record<
    string,
    Record<string, number | { price: number; ean?: string }>
  >; // Prices by option - supports number OR {price, ean} object
  inStock?: boolean;
  featured?: boolean;
  stockLevel?: number; // Stock quantity from Contentful
  ean?: string; // European Article Number for product identification

  // Supplier/Admin information (not displayed to customers)
  supplierName?: string;
  costPrice?: number; // What we pay for the product
  profitMargin?: number; // Percentage profit margin
  profitAmount?: number; // GBP profit (price - costPrice)

  // Common fields
  brand?: string;
  brandLogo?: string; // URL to brand/manufacturer logo image
  model?: string;
  colour?: string | string[];
  color?: string | string[]; // Alias for colour
  colourOptions?: string | string[]; // Available colour options for display in specs
  features?: string[];
  size?: string | string[]; // Size options
  type?: string | string[]; // Type options
  storage?: string | string[]; // Storage/capacity options

  // Case specific
  formFactor?: string;
  gpuClearance?: string;
  coolingSupport?: string;
  style?: string | string[];
  compatibility?: string[];
  maxGpuLength?: number;
  maxCpuCoolerHeight?: number;
  maxPsuLength?: number;
  frontPanelPorts?: string;

  // Motherboard specific
  socket?: string;
  chipset?: string;
  cpuCompatability?: string | string[];
  ramSupport?: string;
  maxRam?: number;
  ramSlots?: number;
  pciSlots?: number;
  m2Slots?: number;
  internalIOConnectors?: string[]; // Array of internal connectors
  backPanelIOPorts?: string[]; // Array of back panel ports

  // CPU specific
  cores?: number;
  threads?: number;
  tdp?: number;
  generation?: string;
  platform?: string;
  processorFamily?: string; // e.g., "Intel® Core™ i7"
  processorGeneration?: string; // e.g., "14th"
  processorOperatingModes?: string; // e.g., "64-bit"
  baseClock?: number; // GHz
  boostClock?: number; // GHz
  onBoardGraphicsCardModel?: string; // e.g., "Intel UHD Graphics 770"
  processorCache?: string; // e.g., "33 MB Intel Smart Cache"
  integratedGraphics?: boolean; // Yes/No
  coolerIncluded?: boolean; // Yes/No
  efficientCores?: number; // E-cores
  performanceCores?: number; // P-cores
  processorBasePower?: string; // e.g., "125W"
  maximumTurboPower?: string; // e.g., "253W Turbo"

  // GPU specific
  vram?: number;
  power?: number;
  powerConsumption?: number; // Preferred numeric GPU power consumption (W)
  powerDraw?: number; // Alternate numeric GPU power draw (W)
  length?: number;
  height?: number;
  slots?: number;
  performance?: string;
  chipsetManufacturer?: string; // e.g., "NVIDIA", "AMD"
  graphicsChipset?: string; // e.g., "RTX 4090"
  memorySize?: string; // e.g., "24GB"
  memoryType?: string; // e.g., "GDDR6X"
  cudaCores?: number;
  gpuBaseClock?: number; // MHz
  gpuBoostClock?: number; // MHz
  outputs?: string; // e.g., "3x DisplayPort, 1x HDMI"
  maxDisplaySupport?: number; // Number of displays
  powerConnecters?: string[]; // Array of power connectors
  gpuCooling?: string; // Cooling solution description
  psuRequirements?: string; // e.g., "850W"
  connectorsRequired?: string; // e.g., "1x 16-pin"

  // RAM specific
  capacity?: number;
  speed?: string;
  modules?: number;
  latency?: string;
  // type field moved to common fields section above
  voltage?: number; // Voltage in volts
  compliance?: string; // e.g., "JEDEC"
  pins?: number; // Number of pins
  casLatency?: string; // CAS Latency timing
  intelXmpCertified?: string; // XMP certification info
  dataIntegrityCheck?: string; // e.g., "ECC"
  heatsink?: boolean; // Has heatsink or not
  timings?: string; // Memory timings

  // Storage specific
  storageCapacity?: string;
  interface?: string;
  readSpeed?: string;
  writeSpeed?: string;
  nand?: string;
  driveType?: string; // e.g., "SSD", "HDD", "NVMe"
  storageMtbf?: number; // MTBF for storage (hours)
  totalBytesWritten?: string; // TBW rating
  operatingTemperatures?: string; // Operating temp range
  storageTemperatures?: string; // Storage temp range
  shockResistance?: number; // Shock resistance in G

  // PSU specific
  wattage?: number;
  efficiency?: string;
  modular?: string;
  cables?: string;
  connectors?: string[]; // Array of connector types
  psuCompatibility?: string; // General compatibility info
  pfc?: string; // Power Factor Correction
  acInput?: string; // AC input voltage range
  fanType?: string; // Fan type description
  fanBearing?: string; // Fan bearing type
  maxCertification?: string; // e.g., "80+ Gold"
  mtbf?: number; // Mean Time Between Failures (hours)
  protection?: string[]; // Array of protection features

  // Cooling specific
  coolerType?: string;
  socketCompatibility?: string[]; // Array of compatible sockets
  fanSize?: string;
  tdpSupport?: number;
  radiatorSize?: string;
  rgbLighting?: boolean;

  // Case Fans specific
  rpm?: number; // Fan speed
  airflow?: number; // CFM (cubic feet per minute)
  noiseLevel?: number; // dBA
  fanCount?: number; // Number of fans in pack
  connector?: string; // 3-pin, 4-pin PWM, etc.
  ledType?: string; // RGB, ARGB, single colour, none

  // Technical documentation
  techSheet?: string; // URL to downloadable PDF tech sheet
}

// PC Optional Extra Interface
export interface PCOptionalExtra {
  id: string;
  name: string;
  price: number;
  msrp?: number;
  category?: string; // keyboard, mouse, monitor, gamepad, mousepad, headset, webcam, microphone, speakers, accessories
  rating?: number;
  description?: string;
  mainProductDescription?: string | Document; // Rich Text field for detailed product descriptions
  features?: string[]; // Array of key features
  techSheet?: string; // URL to tech sheet PDF
  images?: string[];
  inStock?: boolean;
  featured?: boolean;
  stockLevel?: number; // Stock quantity from Contentful
  warranty?: string;
  compatibility?: string[];
  ean?: string; // European Article Number for product identification

  // Supplier/Admin information (not displayed to customers)
  supplierName?: string;
  costPrice?: number; // What we pay for the product
  profitMargin?: number; // Percentage profit margin
  profitAmount?: number; // GBP profit (price - costPrice)

  // Common fields
  type?: string; // Mechanical, Wireless, Gaming, etc.
  wireless?: boolean;
  rgb?: boolean;
  brand?: string;
  brandLogo?: string; // URL to brand/manufacturer logo image
  color?: string;

  // Keyboard specific
  switches?: string;
  layout?: string;
  keyCount?: number | string;
  connectivity?: string;
  hotswappable?: boolean;
  keycaps?: string;

  // Mouse specific
  dpi?: number | string;
  weight?: number | string;
  sensor?: string;
  sensorModel?: string;
  buttons?: number;
  batteryLife?: string;
  charging?: string;

  // Monitor specific
  size?: number | string; // inches
  monitorResolution?: string;
  resolution?: string;
  refreshRate?: number | string;
  panelType?: string; // IPS, VA, OLED
  curved?: boolean;
  aspectRatio?: string;
  responseTime?: number | string; // milliseconds
  hdr?: string;
  ports?: string[];

  // Gamepad specific
  platform?: string; // PC, Xbox, PlayStation, Multi-platform
  reviewCount?: number;
  stockStatus?: string;

  // Mousepad specific
  surface?: string; // Cloth, Hard
  dimensions?: string;
  thickness?: number | string;

  // Audio specific (headset, speakers, microphone)
  frequencyResponse?: string;
  impedance?: number;
  microphone?: boolean;
  surroundSound?: string | boolean;
  driverSize?: string;
  micType?: string;
  noiseCancellation?: boolean;

  // Webcam/Microphone specific
  frameRate?: number;
  fieldOfView?: number;
}

export interface LegalPage {
  id: number;
  pageType: "terms" | "privacy" | "cookies";
  title: string;
  content: string;
  lastUpdated: string;
  effectiveDate: string;
  version: string;
}

export interface PricingTier {
  id: number;
  tierName: string;
  price: number;
  currency: string;
  interval: "one-time" | "monthly" | "yearly";
  features: Array<string>;
  popular: boolean;
  order: number;
  ctaText: string;
  description?: string;
  category?: string;
}

export interface Testimonial {
  id: number;
  customerName: string;
  rating: number;
  review: string;
  productName?: string;
  customerimage?: ContentfulImage | string;
}

// ---------------------------------
// Blog Types
// ---------------------------------
export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  heroImage?: string;
  authorName?: string;
  authorAvatar?: string;
  publishedDate?: string; // ISO string
  updatedAt?: string; // ISO string
  tags?: string[];
  readingTimeMinutes?: number;
}

export interface BlogPostDetail extends BlogPostSummary {
  contentHtml?: string; // pre-rendered HTML (from CMS or mock)
  contentRich?: Document; // Contentful Rich Text document
}

export interface BlogPostsResult {
  items: BlogPostSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Helper: Convert Contentful ID to numeric ID
 */
const getNumericId = (contentfulId: string): number => {
  return parseInt(contentfulId.slice(0, 8), 16);
};

// ============================================
// Contentful API Response Helpers
// Type-safe wrapper for Contentful SDK queries
// ============================================

/**
 * Type-safe wrapper for Contentful API calls.
 * Converts loose Contentful SDK typing to proper ContentfulResponse<T>
 */
async function fetchFromContentful<T extends Record<string, unknown>>(
  queryFn: () => Promise<unknown>
): Promise<ContentfulResponse<T>> {
  const result = await queryFn();
  // Runtime validation that response has expected structure
  if (
    !result ||
    typeof result !== "object" ||
    !("items" in result) ||
    !("skip" in result)
  ) {
    throw new Error("Invalid Contentful response structure");
  }
  return result as ContentfulResponse<T>;
}

/**
 * Build a type-safe Contentful query object
 */
function buildContentfulQuery(query: ContentfulQuery): Record<string, unknown> {
  return query as Record<string, unknown>;
}

// ============================================
// Safe value helpers (reduce any)
// ============================================
const getString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;
const getNumber = (v: unknown): number | undefined =>
  typeof v === "number" && !isNaN(v) ? v : undefined;
const getBoolean = (v: unknown): boolean | undefined =>
  typeof v === "boolean" ? v : undefined;
const getArray = <T = unknown>(v: unknown): T[] | undefined =>
  Array.isArray(v) ? (v as T[]) : undefined;
const getRichText = (v: unknown): string | Document | undefined => {
  // Check if it's a Contentful Rich Text Document
  if (
    v &&
    typeof v === "object" &&
    "nodeType" in v &&
    v.nodeType === "document"
  ) {
    return v as Document;
  }
  // Fallback to string
  return typeof v === "string" ? v : undefined;
};
/**
 * Fetch all products
 */
type ProductEntryFields = Record<string, unknown>;

export const fetchProducts = async (params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> => {
  // Check cache first
  const cacheKey = `products_${params?.category || "all"}_${
    params?.featured || "all"
  }_${params?.limit || "all"}`;
  const cached = getCached<Product[]>(cacheKey);
  if (cached) {
    logger.debug("✅ Returning cached products", { count: cached.length });
    return cached;
  }

  if (!isContentfulEnabled) {
    return getMockProducts();
  }

  try {
    const query: ContentfulQuery = {
      content_type: "product",
    };

    if (params?.featured) {
      query["fields.featured"] = true;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }
    if (params?.limit) {
      query.limit = params.limit;
    }

    const response = await fetchFromContentful<ProductEntryFields>(() =>
      contentfulClient!.getEntries(buildContentfulQuery(query))
    );

    const products = response.items.map((entry) => {
      const f = (entry.fields || {}) as Record<string, unknown>;
      return {
        id: getNumericId(entry.sys.id),
        name: getString(f["name"]) ?? "Unnamed Product",
        description: getString(f["description"]) ?? "",
        price: getNumber(f["price"]) ?? 0,
        category: getString(f["category"]) ?? "uncategorized",
        stock: getNumber(f["stock"]) ?? 0,
        featured: getBoolean(f["featured"]) ?? false,
        specs: (f["specs"] as Record<string, unknown> | undefined) || undefined,
        images: getArray(f["images"]) ?? [],
      } as Product;
    });

    // Cache the results
    const cacheKey = `products_${params?.category || "all"}_${
      params?.featured || "all"
    }_${params?.limit || "all"}`;
    setCache(cacheKey, products);
    return products;
  } catch (error: unknown) {
    logger.error("Fetch products error:", error);
    return getMockProducts();
  }
};

/**
 * Fetch all PC builds
 */
type PCBuildFields = Record<string, unknown>;
export const fetchPCBuilds = async (params?: {
  category?: string;
  featured?: boolean;
}): Promise<PCBuild[]> => {
  // Check cache first
  const cacheKey = `pcBuilds_${params?.category || "all"}_${
    params?.featured || "all"
  }`;
  const cached = getCached<PCBuild[]>(cacheKey);
  if (cached) {
    logger.debug("✅ Returning cached PC builds", { count: cached.length });
    return cached;
  }

  if (!isContentfulEnabled) {
    return getMockPCBuilds();
  }

  try {
    const query: ContentfulQuery = {
      content_type: "pcBuild",
    };

    if (params?.featured) {
      query["fields.featured"] = true;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = (await fetchFromContentful<PCBuildFields>(() =>
      contentfulClient!.getEntries({
        ...query,
        include: 1, // Include linked assets (images)
      } as Record<string, unknown>)
    )) as ContentfulResponse<PCBuildFields> & {
      includes?: {
        Asset?: Array<{
          sys: { id: string };
          fields?: { file?: { url?: string } };
        }>;
      };
    };

    const builds = response.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;

      // Process images - resolve asset links from includes
      let images: string[] = [];
      if (fields.images && Array.isArray(fields.images)) {
        images = (fields.images as Array<Record<string, unknown>>)
          .map((img) => {
            if (
              img.sys &&
              typeof img.sys === "object" &&
              "linkType" in img.sys &&
              img.sys.linkType === "Asset" &&
              response.includes?.Asset
            ) {
              const imgSys = img.sys as { id?: string };
              const asset = response.includes.Asset.find(
                (a) => a.sys.id === imgSys.id
              );
              return asset?.fields?.file?.url
                ? `https:${asset.fields.file.url}`
                : null;
            }
            if (
              img.fields &&
              typeof img.fields === "object" &&
              "file" in img.fields
            ) {
              const imgFields = img.fields as { file?: { url?: string } };
              return imgFields.file?.url ? `https:${imgFields.file.url}` : null;
            }
            return null;
          })
          .filter((url): url is string => url !== null);
      } else if (fields.image && typeof fields.image === "object") {
        const imgField = fields.image as Record<string, unknown>;
        if (
          imgField.fields &&
          typeof imgField.fields === "object" &&
          "file" in imgField.fields
        ) {
          const imgFields = imgField.fields as { file?: { url?: string } };
          if (imgFields.file?.url) {
            images = [`https:${imgFields.file.url}`];
          }
        }
      }

      return {
        id: getNumericId(entry.sys.id),
        name: getString(fields.name) ?? "Unnamed Build",
        description: getString(fields.description) ?? "",
        price: getNumber(fields.price) ?? 0,
        category: getString(fields.category) ?? "",
        featured: getBoolean(fields.featured) ?? false,
        components:
          (fields.components as Record<string, string> | undefined) || {},
        images: images,
      };
    });

    // Cache the results
    const cacheKey = `pcBuilds_${params?.category || "all"}_${
      params?.featured || "all"
    }`;
    setCache(cacheKey, builds);
    return builds;
  } catch (error: unknown) {
    logger.error("Fetch PC builds error:", error);
    return getMockPCBuilds();
  }
};

/**
 * Fetch all categories
 * Now returns hardcoded categories instead of querying Contentful (to free a content type slot)
 * The Category content type can be safely deleted after this change
 */
export const fetchCategories = async (): Promise<Category[]> => {
  // Return hardcoded categories based on your PC builds
  const hardcodedCategories: Category[] = [
    {
      id: 1,
      name: "Budget PCs",
      description: "Affordable gaming and office PCs under £1000",
      slug: "budget-pcs",
    },
    {
      id: 2,
      name: "Gaming PCs",
      description: "High-performance custom gaming builds",
      slug: "gaming-pcs",
    },
    {
      id: 3,
      name: "Workstation PCs",
      description: "Professional workstations for creators and developers",
      slug: "workstation-pcs",
    },
  ];

  logger.debug("✅ Using hardcoded categories:", {
    count: hardcodedCategories.length,
  });

  return hardcodedCategories;
};

/**
 * Fetch site settings
 */
export const fetchSettings = async (): Promise<Settings | null> => {
  // Check cache first
  const cacheKey = "settings";
  const cached = getCached<Settings>(cacheKey);
  if (cached) {
    logger.debug("✅ Settings loaded from cache");
    return cached;
  }

  // Allow disabling settings fetch explicitly to avoid noisy 400s during setup
  const disableSettings = import.meta.env.VITE_CMS_DISABLE_SETTINGS === "true";
  if (disableSettings) {
    return getMockSettings();
  }

  if (!isContentfulEnabled) {
    return getMockSettings();
  }

  try {
    type SiteSettingsFields = Record<string, unknown>;
    const response = (await fetchFromContentful<SiteSettingsFields>(() =>
      contentfulClient!.getEntries({
        content_type: "siteSettings",
        limit: 1,
      } as Record<string, unknown>)
    )) as ContentfulResponse<SiteSettingsFields> & {
      includes?: {
        Asset?: Array<{
          sys: { id: string };
          fields?: { file?: { url?: string } };
        }>;
      };
    };

    // If not configured yet, fall back to mock
    if (!response.items || response.items.length === 0) {
      logger.debug("ℹ️ siteSettings not found, using mock settings");
      return getMockSettings();
    }

    const entry = response.items[0];
    const f = (entry.fields || {}) as Record<string, unknown>;

    const base = getMockSettings();

    // Resolve logo from simple string or linked asset
    let logoUrl = getString(f["logoUrl"]) || base.logoUrl || "";
    const rawLogo = (f["logo"] as unknown) || undefined;
    if (!logoUrl && rawLogo && typeof rawLogo === "object") {
      const rl = rawLogo as {
        fields?: { file?: { url?: string } };
        sys?: { linkType?: string; id?: string };
      };
      if (rl.fields?.file?.url) {
        logoUrl = `https:${rl.fields.file.url}`;
      } else if (
        rl.sys?.linkType === "Asset" &&
        (
          response as unknown as {
            includes?: {
              Asset?: Array<{
                sys: { id: string };
                fields?: { file?: { url?: string } };
              }>;
            };
          }
        ).includes?.Asset
      ) {
        const asset = (
          response as unknown as {
            includes?: {
              Asset?: Array<{
                sys: { id: string };
                fields?: { file?: { url?: string } };
              }>;
            };
          }
        ).includes!.Asset!.find((a) => a.sys.id === rl.sys?.id);
        if (asset?.fields?.file?.url)
          logoUrl = `https:${asset.fields.file.url}`;
      }
    }

    // Social links may be provided as an object field or individual fields
    const socialObj =
      (f["socialLinks"] as Record<string, string> | undefined) || {};
    const socialLinks: Record<string, string> = {
      ...base.socialLinks,
      ...socialObj,
    } as Record<string, string>;
    const mapIf = (key: string, field: string) => {
      const v = getString(f[field]);
      if (v) socialLinks[key] = v;
    };
    mapIf("facebook", "facebookUrl");
    mapIf("twitter", "twitterUrl");
    mapIf("instagram", "instagramUrl");
    mapIf("linkedin", "linkedinUrl");
    mapIf("youtube", "youtubeUrl");

    const settings: Settings = {
      ...base,
      siteName: getString(f["siteName"]) || base.siteName,
      logoUrl,
      tagline: getString(f["tagline"]) || base.tagline,
      metaDescription: getString(f["metaDescription"]) || base.metaDescription,
      socialLinks,
      announcementBar: getString(f["announcementBar"]) || base.announcementBar,
      enableAnnouncementBar:
        getBoolean(f["enableAnnouncementBar"]) ?? base.enableAnnouncementBar,
      enableMaintenance:
        getBoolean(f["enableMaintenance"]) ?? base.enableMaintenance,
      contactEmail: getString(f["contactEmail"]) || base.contactEmail,
      contactPhone: getString(f["contactPhone"]) || base.contactPhone,
      ogTitle: getString(f["ogTitle"]) || base.ogTitle,
      ogDescription: getString(f["ogDescription"]) || base.ogDescription,
      ogImage: getString(f["ogImage"]) || (base.ogImage as string | undefined),
      twitterImage:
        getString(f["twitterImage"]) ||
        (base.twitterImage as string | undefined),
    };

    logger.debug("✅ siteSettings loaded from CMS");

    // Cache the result
    setCache(cacheKey, settings);

    return settings;
  } catch (error) {
    logger.error("Fetch settings error:", error);
    return getMockSettings();
  }
};
/**
 * Fetch page content by slug
 */
type PageContentFields = Record<string, unknown>;
export const fetchPageContent = async (
  pageSlug: string
): Promise<PageContent | null> => {
  // Check cache first
  const cacheKey = `page:${pageSlug}`;
  const cached = getCached<PageContent>(cacheKey);
  if (cached) {
    logger.debug(`✅ Page content for "${pageSlug}" loaded from cache`);
    return cached;
  }

  if (!isContentfulEnabled) {
    logger.debug("⚠️ Contentful disabled, using fallback data");
    return null;
  }

  try {
    logger.debug(`🔍 Fetching page content for slug: ${pageSlug}`);
    const response = await fetchFromContentful<PageContentFields>(() =>
      contentfulClient!.getEntries({
        content_type: "pageContent",
        "fields.pageSlug": pageSlug,
        limit: 1,
      } as Record<string, unknown>)
    );

    if (response.items.length === 0) {
      logger.debug("📄 No page content found");
      return null;
    }

    const entry = response.items[0];
    const fields = (entry.fields || {}) as Record<string, unknown>;

    const result: PageContent = {
      id: getNumericId(entry.sys.id),
      pageSlug: getString(fields.pageSlug) ?? "",
      pageTitle: getString(fields.pageTitle) ?? "",
      metaDescription: getString(fields.metaDescription) ?? undefined,
      heroTitle: getString(fields.heroTitle) ?? undefined,
      heroSubtitle: getString(fields.heroSubtitle) ?? undefined,
      heroDescription: getString(fields.heroDescription) ?? undefined,
      heroBadgeText: getString(fields.heroBadgeText) ?? undefined,
      featuresTitle: getString(fields.featuresTitle) ?? undefined,
      featuresDescription: getString(fields.featuresDescription) ?? undefined,
      ctaBadgeText: getString(fields.ctaBadgeText) ?? undefined,
      ctaTitle: getString(fields.ctaTitle) ?? undefined,
      ctaDescription: getString(fields.ctaDescription) ?? undefined,
      heroBackgroundImage: getString(fields.heroBackgroundImage) ?? undefined,
      heroButtons: fields.heroButtons as
        | Array<{ text: string; link: string; style: string }>
        | undefined,
      sections: fields.sections as Array<Record<string, unknown>> | undefined,
      seo: fields.seo as Record<string, unknown> | undefined,
      // Map explicit OG/Twitter fields so editors can set them
      ogTitle: getString(fields.ogTitle) ?? undefined,
      ogDescription: getString(fields.ogDescription) ?? undefined,
      ogImage: getString(fields.ogImage) ?? undefined,
      twitterImage: getString(fields.twitterImage) ?? undefined,
      lastUpdated: entry.sys.updatedAt,
    };

    logger.debug("📄 Page content result:", {
      ogTitle: result.ogTitle,
      lastUpdated: result.lastUpdated,
    });

    // Cache the result
    setCache(cacheKey, result);

    return result;
  } catch (error: unknown) {
    logger.error("Fetch page content error:", error);
    return null;
  }
};

/**
 * Fetch all FAQ items
 */
type FAQItemFields = Record<string, unknown>;
export const fetchFAQItems = async (params?: {
  category?: string;
  featured?: boolean;
}): Promise<FAQItem[]> => {
  if (!isContentfulEnabled) {
    return getMockFAQItems();
  }

  try {
    const query: ContentfulQuery = {
      content_type: "faqItem",
      order: ["fields.order"],
    };

    if (params?.featured) {
      query["fields.featured"] = true;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await fetchFromContentful<FAQItemFields>(() =>
      contentfulClient!.getEntries(buildContentfulQuery(query))
    );

    return response.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;
      const keywordsArray = getArray(fields.keywords);
      return {
        id: getNumericId(entry.sys.id),
        question: getString(fields.question) ?? "",
        answer: getString(fields.answer) ?? "",
        category: getString(fields.category) ?? "",
        order: getNumber(fields.order) ?? 0,
        featured: getBoolean(fields.featured) ?? false,
        keywords: keywordsArray ? keywordsArray.join(", ") : undefined,
        lastUpdated: entry.sys.updatedAt,
      };
    });
  } catch (error: unknown) {
    logger.error("Fetch FAQ items error:", error);
    return getMockFAQItems();
  }
};

/**
 * Fetch all service items
 */
type ServiceItemFields = Record<string, unknown>;
export const fetchServiceItems = async (params?: {
  category?: string;
  available?: boolean;
}): Promise<ServiceItem[]> => {
  if (!isContentfulEnabled) {
    return getMockServiceItems();
  }

  try {
    const query: ContentfulQuery = {
      content_type: "serviceItem",
      order: ["fields.order"],
    };

    if (params?.available !== undefined) {
      query["fields.available"] = params.available;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await fetchFromContentful<ServiceItemFields>(() =>
      contentfulClient!.getEntries(buildContentfulQuery(query))
    );

    return response.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;
      return {
        id: getNumericId(entry.sys.id),
        serviceName: getString(fields.serviceName) ?? "",
        description: getString(fields.description) ?? "",
        price: getNumber(fields.price) ?? undefined,
        priceText: getString(fields.priceText) ?? undefined,
        duration: getString(fields.duration) ?? undefined,
        category: getString(fields.category) ?? "",
        features: getArray(fields.features) as string[] | undefined,
        icon: getString(fields.icon) ?? "",
        popular: getBoolean(fields.popular) ?? false,
        available: getBoolean(fields.available) ?? true,
        order: getNumber(fields.order) ?? 0,
      };
    });
  } catch (error: unknown) {
    logger.error("Fetch service items error:", error);
    return getMockServiceItems();
  }
};

/**
 * Fetch all feature items
 */
type FeatureItemFields = Record<string, unknown>;
export const fetchFeatureItems = async (params?: {
  category?: string;
  showOnHomepage?: boolean;
}): Promise<FeatureItem[]> => {
  // Check cache with params
  const cacheKey = `features:${params?.category || "all"}:${
    params?.showOnHomepage || "all"
  }`;
  const cached = getCached<FeatureItem[]>(cacheKey);
  if (cached) {
    logger.debug("✅ Feature items loaded from cache", { cacheKey });
    return cached;
  }

  if (!isContentfulEnabled) {
    return getMockFeatureItems();
  }

  try {
    const query: ContentfulQuery = {
      content_type: "featureItem",
      order: ["fields.order"],
    };

    if (params?.showOnHomepage !== undefined) {
      query["fields.showOnHomepage"] = params.showOnHomepage;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await fetchFromContentful<FeatureItemFields>(() =>
      contentfulClient!.getEntries(buildContentfulQuery(query))
    );

    const items = response.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;
      return {
        id: getNumericId(entry.sys.id),
        title: getString(fields.title) ?? "",
        description: getString(fields.description) ?? "",
        icon: getString(fields.icon) ?? "",
        category: getString(fields.category) ?? "",
        order: getNumber(fields.order) ?? 0,
        highlighted: getBoolean(fields.highlighted) ?? false,
        link: getString(fields.link) ?? undefined,
        showOnHomepage: getBoolean(fields.showOnHomepage) ?? false,
      };
    });

    // Cache the result
    setCache(cacheKey, items);

    return items;
  } catch (error: unknown) {
    logger.error("Fetch feature items error:", error);
    return getMockFeatureItems();
  }
};

/**
 * Fetch blog posts (list)
 */
type BlogPostFields = Record<string, unknown>;
export const fetchBlogPosts = async (params?: {
  page?: number;
  pageSize?: number;
  tag?: string;
  category?: string;
  authorName?: string;
  search?: string;
}): Promise<BlogPostsResult> => {
  if (!isContentfulEnabled) {
    const page = params?.page ?? 1;
    const legacyLimit =
      params && typeof (params as Record<string, unknown>).limit === "number"
        ? ((params as Record<string, unknown>).limit as number)
        : undefined;
    const pageSize = params?.pageSize ?? legacyLimit ?? 12;
    const all = getMockBlogPosts();
    const filtered = all.filter((p) => {
      const tagOk = params?.tag ? p.tags?.includes(params.tag) : true;
      const authorOk = params?.authorName
        ? (p.authorName || "").toLowerCase() === params.authorName.toLowerCase()
        : true;
      const searchOk = params?.search
        ? (p.title + " " + (p.excerpt || ""))
            .toLowerCase()
            .includes(params.search.toLowerCase())
        : true;
      return tagOk && authorOk && searchOk;
    });
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return { items, total: filtered.length, page, pageSize };
  }

  try {
    const page = params?.page ?? 1;
    const legacyLimit2 =
      params && typeof (params as Record<string, unknown>).limit === "number"
        ? ((params as Record<string, unknown>).limit as number)
        : undefined;
    const pageSize = params?.pageSize ?? legacyLimit2 ?? 12;

    const query: ContentfulQuery = {
      content_type: "blogPost",
      order: ["-fields.publishedDate"],
      limit: pageSize,
      skip: (page - 1) * pageSize,
      include: 1,
    };
    if (params?.tag) query["fields.tags[in]"] = params.tag;
    if (params?.category) query["fields.category"] = params.category;
    if (params?.authorName) query["fields.authorName"] = params.authorName;
    if (params?.search) query["query"] = params.search;

    const response = (await fetchFromContentful<BlogPostFields>(() =>
      contentfulClient!.getEntries(buildContentfulQuery(query))
    )) as ContentfulResponse<BlogPostFields> & {
      includes?: {
        Asset?: Array<{
          sys: { id: string };
          fields?: { file?: { url?: string } };
        }>;
      };
    };

    const resolveAssetUrl = (img: unknown): string | undefined => {
      if (!img) return undefined;
      // Linked asset via includes
      if (
        typeof img === "object" &&
        img !== null &&
        (img as { sys?: { linkType?: string } }).sys?.linkType === "Asset" &&
        response.includes?.Asset
      ) {
        const imgSys = (img as { sys?: { id?: string } }).sys;
        const asset = response.includes.Asset.find(
          (a) => a.sys.id === imgSys?.id
        );
        return asset?.fields?.file?.url
          ? `https:${asset.fields.file.url}`
          : undefined;
      }
      // Raw asset object
      if (
        typeof img === "object" &&
        img !== null &&
        (img as { fields?: { file?: { url?: string } } }).fields?.file?.url
      ) {
        return `https:${
          (img as { fields?: { file?: { url?: string } } }).fields!.file!.url
        }`;
      }
      if (typeof img === "string") return img;
      return undefined;
    };

    const items = response.items.map((entry) => {
      const f = (entry.fields || {}) as Record<string, unknown>;
      const imageCandidates = [
        "heroImage",
        "image",
        "featuredImage",
        "coverImage",
        "banner",
        "thumbnail",
        "headerImage",
        "mainImage",
      ] as const;
      const heroSrc = (() => {
        for (const key of imageCandidates) {
          const v = (f as Record<string, unknown>)[key] as unknown;
          if (v) return v;
        }
        return undefined;
      })();
      return {
        id: getNumericId(entry.sys.id),
        title: getString(f["title"]) ?? "Untitled",
        slug: getString(f["slug"]) ?? `post-${getNumericId(entry.sys.id)}`,
        excerpt: getString(f["excerpt"]) ?? undefined,
        heroImage: resolveAssetUrl(heroSrc),
        authorName: getString(f["authorName"]) ?? undefined,
        authorAvatar: resolveAssetUrl(
          (f["authorAvatar"] as unknown) || (f["authorImage"] as unknown)
        ),
        publishedDate: getString(f["publishedDate"]) ?? entry.sys.createdAt,
        updatedAt: entry.sys.updatedAt,
        tags: (getArray(f["tags"]) as string[] | undefined) || undefined,
        readingTimeMinutes: getNumber(f["readingTimeMinutes"]) ?? undefined,
      } as BlogPostSummary;
    });
    return {
      items,
      total: (response.total as number | undefined) ?? items.length,
      page,
      pageSize,
    };
  } catch (error: unknown) {
    logger.error("Fetch blog posts error:", error);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 12;
    const all = getMockBlogPosts();
    return { items: all.slice(0, pageSize), total: all.length, page, pageSize };
  }
};

/**
 * Fetch a single blog post by slug
 */
export const fetchBlogPostBySlug = async (
  slug: string
): Promise<BlogPostDetail | null> => {
  if (!isContentfulEnabled) {
    const mock = getMockBlogPosts();
    const found = mock.find((p) => p.slug === slug);
    if (!found) return null;
    return {
      ...found,
      contentHtml: getMockBlogPostContent(found.slug),
    };
  }

  try {
    const response = (await fetchFromContentful<BlogPostFields>(() =>
      contentfulClient!.getEntries({
        content_type: "blogPost",
        "fields.slug": slug,
        limit: 1,
        include: 1,
      } as Record<string, unknown>)
    )) as ContentfulResponse<BlogPostFields> & {
      includes?: {
        Asset?: Array<{
          sys: { id: string };
          fields?: { file?: { url?: string } };
        }>;
      };
    };

    if (response.items.length === 0) return null;

    const entry = response.items[0];
    const f = (entry.fields || {}) as Record<string, unknown>;

    const resolveAssetUrl = (img: unknown): string | undefined => {
      if (!img) return undefined;
      if (
        typeof img === "object" &&
        img !== null &&
        (img as { sys?: { linkType?: string } }).sys?.linkType === "Asset" &&
        response.includes?.Asset
      ) {
        const imgSys = (img as { sys?: { id?: string } }).sys;
        const asset = response.includes.Asset.find(
          (a) => a.sys.id === imgSys?.id
        );
        return asset?.fields?.file?.url
          ? `https:${asset.fields.file.url}`
          : undefined;
      }
      if (
        typeof img === "object" &&
        img !== null &&
        (img as { fields?: { file?: { url?: string } } }).fields?.file?.url
      ) {
        return `https:${
          (img as { fields?: { file?: { url?: string } } }).fields!.file!.url
        }`;
      }
      if (typeof img === "string") return img;
      return undefined;
    };

    // Try to locate a Rich Text document in common field names OR any field matching Document shape
    const commonRichKeys = [
      "contentRich",
      "content",
      "body",
      "richText",
      "article",
      "main",
    ];
    let contentRich: Document | undefined;
    for (const key of commonRichKeys) {
      const val = f[key] as unknown;
      const doc = val as { nodeType?: string; content?: unknown[] };
      if (
        val &&
        typeof val === "object" &&
        doc.nodeType === "document" &&
        Array.isArray(doc.content)
      ) {
        contentRich = val as Document;
        break;
      }
    }
    if (!contentRich) {
      // Fallback: scan all fields for a Document-like object
      for (const [_, valAny] of Object.entries(f)) {
        const val = valAny as unknown;
        const doc = val as { nodeType?: string; content?: unknown[] };
        if (
          val &&
          typeof val === "object" &&
          doc.nodeType === "document" &&
          Array.isArray(doc.content)
        ) {
          contentRich = val as Document;
          break;
        }
      }
    }

    // HTML fallback across common keys
    const rawHtml =
      getString(f["contentHtml"]) ??
      getString((f as Record<string, unknown>)["bodyHtml"]) ??
      getString((f as Record<string, unknown>)["html"]) ??
      // If a string exists in common keys, use it last
      ((): string | undefined => {
        for (const key of ["content", "body", "article", "main"]) {
          const v = f[key];
          if (typeof v === "string") return v as string;
        }
        return undefined;
      })() ??
      "";

    // Try multiple possible hero image field names for detail view
    const imageCandidates = [
      "heroImage",
      "image",
      "featuredImage",
      "coverImage",
      "banner",
      "thumbnail",
      "headerImage",
      "mainImage",
    ] as const;
    const heroSrc = (() => {
      for (const key of imageCandidates) {
        const v = (f as Record<string, unknown>)[key] as unknown;
        if (v) return v;
      }
      return undefined;
    })();

    return {
      id: getNumericId(entry.sys.id),
      title: getString(f["title"]) ?? "Untitled",
      slug: getString(f["slug"]) ?? slug,
      excerpt: getString(f["excerpt"]) ?? undefined,
      heroImage: resolveAssetUrl(heroSrc),
      authorName: getString(f["authorName"]) ?? undefined,
      authorAvatar: resolveAssetUrl(
        (f["authorAvatar"] as unknown) || (f["authorImage"] as unknown)
      ),
      publishedDate: getString(f["publishedDate"]) ?? entry.sys.createdAt,
      updatedAt: entry.sys.updatedAt,
      tags: (getArray(f["tags"]) as string[] | undefined) || undefined,
      readingTimeMinutes: getNumber(f["readingTimeMinutes"]) ?? undefined,
      contentHtml: rawHtml,
      contentRich,
    } as BlogPostDetail;
  } catch (error: unknown) {
    logger.error("Fetch blog post by slug error:", error);
    return null;
  }
};

/**
 * Fetch navigation menu
 */
type NavigationMenuFields = Record<string, unknown>;
export const fetchNavigationMenu = async (): Promise<NavigationMenu | null> => {
  if (!isContentfulEnabled) {
    return getMockNavigationMenu();
  }

  try {
    const response = await fetchFromContentful<NavigationMenuFields>(() =>
      contentfulClient!.getEntries({
        content_type: "navigationMenu",
        limit: 1,
      } as Record<string, unknown>)
    );

    if (response.items.length === 0) {
      return getMockNavigationMenu();
    }

    const entry = response.items[0];
    const fields = (entry.fields || {}) as Record<string, unknown>;

    return {
      id: getNumericId(entry.sys.id),
      primaryMenu:
        (getArray(fields.primaryMenu) as
          | Array<{
              text: string;
              link: string;
              children?: Array<{ text: string; link: string }>;
            }>
          | undefined) || [],
      footerMenu:
        (getArray(fields.footerMenu) as
          | Array<{
              text: string;
              link: string;
            }>
          | undefined) || [],
      mobileMenu:
        (getArray(fields.mobileMenu) as
          | Array<{
              text: string;
              link: string;
            }>
          | undefined) || [],
      ctaButton: (fields.ctaButton as
        | { text: string; link: string; style: string }
        | undefined) || {
        text: "",
        link: "",
        style: "",
      },
    };
  } catch (error: unknown) {
    logger.error("Fetch navigation menu error:", error);
    return getMockNavigationMenu();
  }
};

/**
 * Fetch contact information
 */
type ContactInformationFields = Record<string, unknown>;
export const fetchContactInformation =
  async (): Promise<ContactInformation | null> => {
    if (!isContentfulEnabled) {
      return getMockContactInformation();
    }

    try {
      const response = await fetchFromContentful<ContactInformationFields>(() =>
        contentfulClient!.getEntries({
          content_type: "contactInformation",
          limit: 1,
        } as Record<string, unknown>)
      );

      if (response.items.length === 0) {
        return getMockContactInformation();
      }

      const entry = response.items[0];
      const fields = (entry.fields || {}) as Record<string, unknown>;

      return {
        id: getNumericId(entry.sys.id),
        companyName: getString(fields.companyName) ?? "",
        email: getString(fields.email) ?? "",
        phone: getString(fields.phone) ?? "",
        whatsapp: getString(fields.whatsapp) ?? undefined,
        address: getString(fields.address) ?? undefined,
        mapEmbedUrl: getString(fields.mapEmbedUrl) ?? undefined,
        businessHours: fields.businessHours as
          | Record<string, string>
          | undefined,
        emergencyContact: getString(fields.emergencyContact) ?? undefined,
        supportEmail: getString(fields.supportEmail) ?? undefined,
        copyrightText: getString(fields.copyrightText) ?? undefined,
        companyRegistrationNumber:
          getString(fields.companyRegistrationNumber) ?? undefined,
      };
    } catch (error: unknown) {
      logger.error("Fetch contact information error:", error);
      return getMockContactInformation();
    }
  };

/**
 * Fetch legal page by type
 * Now uses pageContent instead of legalPage content type (to free a content type slot)
 * Maps pageType to slug: terms → "legal-terms", privacy → "legal-privacy", cookies → "legal-cookies"
 */
type LegalPageFields = Record<string, unknown>;
export const fetchLegalPage = async (
  pageType: "terms" | "privacy" | "cookies"
): Promise<LegalPage | null> => {
  // If Contentful is disabled, prefer rendering the rich built-in static pages
  // rather than a one-line mock snippet that hides the full content.
  if (!isContentfulEnabled) {
    return null;
  }

  try {
    // Map pageType to pageContent slug
    const slugMap: Record<string, string> = {
      terms: "legal-terms",
      privacy: "legal-privacy",
      cookies: "legal-cookies",
    };
    const slug = slugMap[pageType];

    // Try new approach: fetch from pageContent by slug
    const response = await fetchFromContentful<LegalPageFields>(() =>
      contentfulClient!.getEntries({
        content_type: "pageContent",
        "fields.pageSlug": slug,
        limit: 1,
      } as Record<string, unknown>)
    );

    if (response.items.length === 0) {
      // Fallback: try old legalPage content type for backward compatibility during migration
      try {
        const legacyResponse = await fetchFromContentful<LegalPageFields>(() =>
          contentfulClient!.getEntries({
            content_type: "legalPage",
            "fields.pageType": pageType,
            limit: 1,
          } as Record<string, unknown>)
        );

        if (legacyResponse.items.length > 0) {
          const entry = legacyResponse.items[0];
          const fields = (entry.fields || {}) as Record<string, unknown>;
          const content = getString(fields.content) ?? "";
          const minLengthEnv = (
            import.meta as unknown as {
              env?: Record<string, string | undefined>;
            }
          )?.env?.VITE_CMS_LEGAL_MIN_LENGTH;
          const minLength =
            Number(minLengthEnv) > 0 ? Number(minLengthEnv) : 200;
          if (!content || content.trim().length < minLength) {
            return null;
          }
          return {
            id: getNumericId(entry.sys.id),
            pageType:
              (getString(fields.pageType) as
                | "terms"
                | "privacy"
                | "cookies"
                | undefined) ?? pageType,
            title: getString(fields.title) ?? "",
            content,
            lastUpdated: entry.sys.updatedAt,
            effectiveDate: getString(fields.effectiveDate) ?? "",
            version: getString(fields.version) ?? "",
          };
        }
      } catch (error) {
        // legalPage type doesn't exist anymore or failed; log and fall through to static fallback
        logger.warn("Failed to parse legal page content from CMS", {
          error,
          operation: "fetch_legal_page",
          timestamp: new Date().toISOString(),
        });
      }
      // No CMS content – use local static page implementation
      return null;
    }

    const entry = response.items[0];
    const fields = (entry.fields || {}) as Record<string, unknown>;

    // Map pageContent fields to LegalPage format
    // Assume pageContent has: pageTitle, heroDescription (or metaDescription for content), custom fields
    const content =
      getString(fields.legalContent) ||
      getString(fields.content) ||
      getString(fields.heroDescription) ||
      "";
    const title = getString(fields.pageTitle) || getString(fields.title) || "";
    const version = getString(fields.version) || "1.0";
    const effectiveDate =
      getString(fields.effectiveDate) || entry.sys.createdAt.split("T")[0];

    // If the CMS content is suspiciously short (placeholder/excerpt),
    // fall back to the local full static page implementation.
    const minLengthEnv = (
      import.meta as unknown as {
        env?: Record<string, string | undefined>;
      }
    )?.env?.VITE_CMS_LEGAL_MIN_LENGTH;
    const minLength = Number(minLengthEnv) > 0 ? Number(minLengthEnv) : 200;
    if (!content || content.trim().length < minLength) {
      return null;
    }

    return {
      id: getNumericId(entry.sys.id),
      pageType,
      title,
      content,
      lastUpdated: entry.sys.updatedAt,
      effectiveDate,
      version,
    };
  } catch (error: unknown) {
    logger.error("Fetch legal page error:", error);
    // On any error, prefer local static page rendering instead of mock snippet
    return null;
  }
};

/**
 * Fetch pricing tiers
 */
type PricingTierFields = Record<string, unknown>;
export const fetchPricingTiers = async (params?: {
  category?: string;
}): Promise<PricingTier[]> => {
  // Check cache first
  const cacheKey = `pricingTiers_${params?.category || "all"}`;
  const cached = getCached<PricingTier[]>(cacheKey);
  if (cached) {
    logger.debug("✅ Returning cached pricing tiers", { count: cached.length });
    return cached;
  }

  if (!isContentfulEnabled) {
    return getMockPricingTiers();
  }

  try {
    const query: ContentfulQuery = {
      content_type: "pricingTier",
      order: ["fields.order"],
    };

    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = (await contentfulClient!.getEntries(
      query as unknown as Record<string, unknown>
    )) as unknown as ContentfulResponse<PricingTierFields>;

    const tiers = response.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;
      const interval = getString(fields.interval);
      return {
        id: getNumericId(entry.sys.id),
        tierName: getString(fields.tierName) ?? "",
        price: getNumber(fields.price) ?? 0,
        currency: getString(fields.currency) ?? "GBP",
        interval:
          (interval as "one-time" | "monthly" | "yearly" | undefined) ??
          "one-time",
        features: (getArray(fields.features) as string[] | undefined) || [],
        popular: getBoolean(fields.popular) ?? false,
        order: getNumber(fields.order) ?? 0,
        ctaText: getString(fields.ctaText) ?? "",
        description: getString(fields.description) ?? undefined,
        category: getString(fields.category) ?? undefined,
      };
    });

    // Cache the results
    const cacheKey = `pricingTiers_${params?.category || "all"}`;
    setCache(cacheKey, tiers);
    return tiers;
  } catch (error: unknown) {
    logger.error("Fetch pricing tiers error:", error);
    return getMockPricingTiers();
  }
};

/**
 * Fetch testimonials
 */
type TestimonialFields = Record<string, unknown>;
export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  // Check cache first
  const cacheKey = "testimonials";
  const cached = getCached<Testimonial[]>(cacheKey);
  if (cached) {
    logger.debug("✅ Testimonials loaded from cache");
    return cached;
  }

  if (!isContentfulEnabled) {
    return getMockTestimonials();
  }

  try {
    const response = (await contentfulClient!.getEntries({
      content_type: "testimonial",
      order: ["-sys.createdAt"],
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<TestimonialFields>;

    const testimonials = response.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;
      return {
        id: getNumericId(entry.sys.id),
        customerName: getString(fields.customerName) ?? "",
        rating: getNumber(fields.rating) ?? 5,
        review: getString(fields.review) ?? "",
        productName: getString(fields.productName) ?? undefined,
        customerImage: getString(fields.customerImage) ?? undefined,
      };
    });

    logger.debug("✅ Contentful testimonials fetched:", {
      count: testimonials.length,
    });

    // Cache the result
    setCache(cacheKey, testimonials);

    return testimonials;
  } catch (error: unknown) {
    logger.error("Fetch testimonials error:", error);
    return getMockTestimonials();
  }
};

/**
 * Mock data for development (when Contentful is not connected)
 */

function getMockProducts(): Product[] {
  return [
    {
      id: 1,
      name: "AMD Ryzen 9 7950X",
      description: "High-performance 16-core processor",
      price: 549,
      category: "CPU",
      stock: 15,
      featured: true,
      specs: { cores: 16, threads: 32, baseClock: "4.5 GHz" },
    },
    {
      id: 2,
      name: "NVIDIA RTX 4090",
      description: "Ultimate gaming graphics card",
      price: 1599,
      category: "GPU",
      stock: 5,
      featured: true,
      specs: { vram: "24GB GDDR6X", boost: "2.52 GHz" },
    },
    {
      id: 3,
      name: "G.Skill Trident Z5 RGB 32GB",
      description: "DDR5-6000 RGB memory kit",
      price: 189,
      category: "RAM",
      stock: 25,
      specs: { capacity: "32GB", speed: "DDR5-6000" },
    },
  ];
}

function getMockPCBuilds(): PCBuild[] {
  return [
    {
      id: 1,
      name: "Vortex Gaming Beast",
      description: "Ultimate 4K gaming powerhouse",
      price: 3499,
      category: "Gaming",
      featured: true,
      components: {
        cpu: "AMD Ryzen 9 7950X3D",
        gpu: "NVIDIA RTX 4090",
        ram: "64GB DDR5-6000",
        storage: "2TB NVMe Gen5",
        motherboard: "ASUS ROG Crosshair X670E",
        psu: "Corsair HX1000i",
        case: "Lian Li O11 Dynamic",
        cooling: "360mm AIO RGB",
      },
    },
    {
      id: 2,
      name: "Vortex Creator Pro",
      description: "Professional content creation workstation",
      price: 2899,
      category: "Workstation",
      featured: true,
      components: {
        cpu: "AMD Ryzen 9 7950X",
        gpu: "NVIDIA RTX 4080",
        ram: "64GB DDR5-5600",
        storage: "2TB NVMe + 4TB HDD",
        motherboard: "ASUS ProArt X670E",
        psu: "Corsair RM850x",
        case: "Fractal Design Define 7",
        cooling: "280mm AIO",
      },
    },
  ];
}

// getMockCategories removed - now using hardcoded categories in fetchCategories

function getMockSettings(): Settings {
  return {
    id: 1,
    siteName: "Vortex PCs",
    logoUrl: "",
    tagline: "Premium Custom PC Builds",
    metaDescription:
      "Premium custom PC builds and components. Expert assembly, quality guarantee, fast delivery.",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
      linkedin: "",
    },
    businessHours:
      "Monday - Friday: 9:00 AM - 6:00 PM<br>Saturday: 10:00 AM - 4:00 PM<br>Sunday: Closed",
    enableMaintenance: false,
    maintenanceMessage: "",
    announcementBar: "",
    enableAnnouncementBar: false,
    contactEmail: "info@vortexpcs.com",
    contactPhone: "+44 123 456 7890",
    whatsappNumber: "+44 123 456 7890",
  };
}

function getMockFAQItems(): FAQItem[] {
  return [
    {
      id: 1,
      question: "How long does it take to build a custom PC?",
      answer:
        "Typically 3-5 business days from order confirmation to completion.",
      category: "Building Process",
      order: 1,
      featured: true,
      keywords: "build time, delivery, custom pc",
    },
    {
      id: 2,
      question: "What warranty do you provide?",
      answer:
        "We provide a comprehensive 1-year warranty on all custom builds and components.",
      category: "Warranty",
      order: 2,
      featured: true,
      keywords: "warranty, guarantee, support",
    },
    {
      id: 3,
      question: "Can I upgrade my PC later?",
      answer:
        "Absolutely! We design our builds with future upgrades in mind and offer upgrade services.",
      category: "Customization",
      order: 3,
      featured: false,
      keywords: "upgrade, future, expansion",
    },
  ];
}

function getMockServiceItems(): ServiceItem[] {
  return [
    {
      id: 1,
      serviceName: "PC Health Check",
      description: "Comprehensive diagnostic and performance analysis",
      price: 45,
      priceText: "£45",
      duration: "1-2 hours",
      category: "Diagnostic",
      features: [
        "Hardware diagnostics",
        "Performance testing",
        "Temperature monitoring",
        "Detailed report",
      ],
      icon: "Stethoscope",
      popular: true,
      available: true,
      order: 1,
    },
    {
      id: 2,
      serviceName: "Virus Removal",
      description: "Complete malware removal and system cleaning",
      price: 75,
      priceText: "£75",
      duration: "2-4 hours",
      category: "Software Repair",
      features: [
        "Malware removal",
        "System optimization",
        "Security updates",
        "Prevention advice",
      ],
      icon: "Shield",
      popular: true,
      available: true,
      order: 2,
    },
  ];
}

function getMockFeatureItems(): FeatureItem[] {
  return [
    {
      id: 1,
      title: "Expert Assembly",
      description:
        "Professional PC building with premium components and attention to detail",
      icon: "Settings",
      category: "Quality",
      order: 1,
      highlighted: true,
      showOnHomepage: true,
    },
    {
      id: 2,
      title: "Quality Guarantee",
      description:
        "1-year warranty on all custom builds with comprehensive support",
      icon: "Shield",
      category: "Warranty",
      order: 2,
      highlighted: true,
      showOnHomepage: true,
    },
    {
      id: 3,
      title: "Fast Delivery",
      description: "Built and shipped within 3-5 business days",
      icon: "Zap",
      category: "Delivery",
      order: 3,
      highlighted: false,
      showOnHomepage: true,
    },
  ];
}

function getMockNavigationMenu(): NavigationMenu {
  return {
    id: 1,
    primaryMenu: [
      { text: "Home", link: "/" },
      { text: "PC Builder", link: "/pc-builder" },
      { text: "PC Finder", link: "/pc-finder" },
      { text: "Repair Service", link: "/repair-service" },
      { text: "About", link: "/about" },
      { text: "Contact", link: "/contact" },
    ],
    footerMenu: [
      { text: "FAQ", link: "/faq" },
      { text: "Terms", link: "/terms" },
      { text: "Privacy", link: "/privacy" },
      { text: "Cookies", link: "/cookies" },
    ],
    mobileMenu: [
      { text: "Home", link: "/" },
      { text: "Build PC", link: "/pc-builder" },
      { text: "Find PC", link: "/pc-finder" },
      { text: "Repair", link: "/repair-service" },
    ],
    ctaButton: {
      text: "Build Your PC",
      link: "/pc-builder",
      style: "primary",
    },
  };
}

function getMockContactInformation(): ContactInformation {
  return {
    id: 1,
    companyName: "Vortex PCs Ltd",
    email: "info@vortexpcs.com",
    phone: "+44 123 456 7890",
    whatsapp: "+44 123 456 7890",
    address: "123 Tech Street<br>London, UK<br>SW1A 1AA",
    mapEmbedUrl: "",
    businessHours: {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "Closed",
    },
    emergencyContact: "+44 123 456 7890",
    supportEmail: "support@vortexpcs.com",
  };
}

// Removed legacy mock legal page generator; we prefer rendering local static
// pages when CMS content is unavailable or too short.

function getMockPricingTiers(): PricingTier[] {
  return [
    {
      id: 1,
      tierName: "Basic Build",
      price: 899,
      currency: "GBP",
      interval: "one-time",
      features: [
        "Entry-level gaming",
        "1080p performance",
        "Basic warranty",
        "Standard support",
      ],
      popular: false,
      order: 1,
      ctaText: "Get Started",
      description: "Perfect for casual gaming and office work",
      category: "Gaming PCs",
    },
    {
      id: 2,
      tierName: "Performance Build",
      price: 1499,
      currency: "GBP",
      interval: "one-time",
      features: [
        "High-end gaming",
        "1440p performance",
        "Extended warranty",
        "Priority support",
      ],
      popular: true,
      order: 2,
      ctaText: "Most Popular",
      description: "Ideal for serious gamers and content creators",
      category: "Gaming PCs",
    },
  ];
}

function getMockTestimonials(): Testimonial[] {
  return [
    {
      id: 1,
      customerName: "Alex Johnson",
      rating: 5,
      review:
        "Incredible build quality and performance! My RTX 4090 build runs everything at 4K ultra settings flawlessly.",
      productName: "Vortex Gaming Beast",
    },
    {
      id: 2,
      customerName: "Sarah Chen",
      rating: 5,
      review:
        "Outstanding customer service and fast delivery. The PC exceeded my expectations for video editing work.",
      productName: "Vortex Creator Pro",
    },
    {
      id: 3,
      customerName: "Mike Thompson",
      rating: 5,
      review:
        "Best investment I've made! The build quality is exceptional and the performance is mind-blowing.",
      productName: "Vortex Gaming Beast",
    },
  ];
}

// ---------------------------------
// Blog Mock Data (when CMS disabled)
// ---------------------------------
function getMockBlogPosts(): BlogPostSummary[] {
  const posts: BlogPostSummary[] = [
    {
      id: 1001,
      title: "Best Graphics Cards in 2025: What to Buy",
      slug: "best-graphics-cards-2025",
      excerpt:
        "From entry-level 1080p to 4K monsters, here’s our no-nonsense guide to the best GPUs in 2025 for gaming and creators.",
      heroImage:
        "https://images.unsplash.com/photo-1616220586945-755e22377e25?q=80&w=1600&auto=format&fit=crop",
      authorName: "Vortex Editorial Team",
      publishedDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
      tags: ["GPU", "Buying Guide", "2025"],
      readingTimeMinutes: 6,
    },
    {
      id: 1002,
      title: "Gaming PC vs Workstation: Which Is Right for You?",
      slug: "gaming-pc-vs-workstation",
      excerpt:
        "They share components, but priorities differ. We break down the trade-offs so you can choose with confidence.",
      heroImage:
        "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop",
      authorName: "Vortex Editorial Team",
      publishedDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
      tags: ["Workstation", "Gaming", "Guide"],
      readingTimeMinutes: 5,
    },
    {
      id: 1003,
      title: "The Ultimate PC Building Guide (Step-by-Step)",
      slug: "ultimate-pc-building-guide",
      excerpt:
        "From parts list to power-on: a clean, beginner-friendly walkthrough with tips from our build team.",
      heroImage:
        "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1600&auto=format&fit=crop",
      authorName: "Vortex Editorial Team",
      publishedDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
      tags: ["How-To", "Beginner", "Build Guide"],
      readingTimeMinutes: 10,
    },
  ];
  return posts;
}

function getMockVacancies(): Vacancy[] {
  return [
    {
      id: "senior-frontend",
      title: "Senior Frontend Engineer",
      level: "Senior",
      type: "Full-time",
      location: "Hybrid · Norwich / Remote UK",
      summary:
        "Lead premium UI delivery across our React + TypeScript stack with an emphasis on performance, accessibility, and glassmorphism aesthetics.",
      tags: ["React", "TypeScript", "shadcn/ui", "Vite"],
      idealFor: [
        "Operating system installation and optimisation",
        "Custom PC builds and upgrades",
        "Client training and best-practice guidance",
      ],
      featured: true,
      displayOrder: 1,
    },
    {
      id: "backend-engineer",
      title: "Backend Engineer (Node & Payments)",
      level: "Mid/Senior",
      type: "Full-time",
      location: "Hybrid · Norwich / Remote UK",
      summary:
        "Build resilient commerce APIs, payment flows (Stripe/PayPal), and observability pipelines that keep orders moving without downtime.",
      tags: ["Node.js", "Stripe", "PostgreSQL", "Observability"],
      idealFor: [
        "Network setup and connectivity fixes",
        "Data backup and recovery solutions",
        "Security hardening and malware removal",
      ],
      featured: true,
      displayOrder: 2,
    },
    {
      id: "customer-success",
      title: "Customer Success Lead (B2B)",
      level: "Lead",
      type: "Full-time",
      location: "Hybrid · Norwich / Remote UK",
      summary:
        "Own onboarding and retention for our business clients, shaping playbooks that keep SLAs, NPS, and renewals on target.",
      tags: ["B2B", "Onboarding", "SLA", "Playbooks"],
      idealFor: [
        "Remote troubleshooting and support",
        "Client training and best-practice guidance",
        "Custom PC builds and upgrades",
      ],
      featured: false,
      displayOrder: 3,
    },
    {
      id: "content-specialist",
      title: "Technical Content Specialist",
      level: "Mid",
      type: "Contract / Part-time",
      location: "Remote · UK/EU",
      summary:
        "Translate engineering excellence into clear stories—landing pages, release notes, and comparison guides that convert.",
      tags: ["Content", "SEO", "Product Marketing", "Docs"],
      idealFor: [
        "PC hardware diagnostics and repair",
        "Operating system installation and optimisation",
        "Security hardening and malware removal",
      ],
      featured: false,
      displayOrder: 4,
    },
  ];
}

function getMockBlogPostContent(slug: string): string {
  switch (slug) {
    case "best-graphics-cards-2025":
      return `
        <p>The GPU landscape in 2025 is stacked with options. Whether you’re targeting high-refresh 1080p, buttery 1440p, or cinematic 4K, this guide covers the best cards for every budget.</p>
        <h2>Top Picks</h2>
        <ul>
          <li>Best 1080p Value: NVIDIA RTX 4060 / AMD RX 7600</li>
          <li>Best 1440p Sweet Spot: NVIDIA RTX 4070 Super</li>
          <li>Best 4K: NVIDIA RTX 4090</li>
        </ul>
        <p>Remember to match your GPU with a capable CPU and power supply. Need help? Our PC Builder recommends balanced configurations automatically.</p>
      `;
    case "gaming-pc-vs-workstation":
      return `
        <p>Gaming PCs prioritise frame rates and responsiveness. Workstations optimise for reliability, large memory pools, and compute acceleration.</p>
        <h2>When to Choose a Workstation</h2>
        <p>If your workload involves 3D rendering, CUDA/compute, video editing, or scientific simulation, a workstation platform can save hours every week.</p>
      `;
    case "ultimate-pc-building-guide":
      return `
        <p>Building a PC is easier than it looks. Lay out your parts, ground yourself, and follow this sequence: CPU → Cooler → RAM → Motherboard into Case → PSU → GPU → Cables → First Boot.</p>
        <h2>Pro Tips</h2>
        <ul>
          <li>Pre-route front panel cables for a cleaner finish.</li>
          <li>Use two separate PCIe cables for high-end GPUs.</li>
          <li>Run a memory test and a GPU stress test after first boot.</li>
        </ul>
      `;
    default:
      return `<p>Coming soon.</p>`;
  }
}

/**
 * Fetch PC Components from Contentful
 * Updated to use separate content types for each component category
 */
export const fetchPCComponents = async (params?: {
  category?: string;
  limit?: number;
  featured?: boolean;
}): Promise<PCComponent[]> => {
  // Check cache first to reduce API calls
  const cacheKey = `pcComponents_${params?.category || "all"}_${
    params?.limit || "default"
  }_${params?.featured || "all"}`;
  const cached = getCached<PCComponent[]>(cacheKey);
  if (cached) {
    logger.debug("✅ Returning cached PC components", {
      count: cached.length,
      cacheKey,
    });
    return cached;
  }

  if (!isContentfulEnabled || !contentfulClient) {
    logger.debug("📦 Contentful not enabled, returning empty components array");
    return [];
  }

  try {
    logger.debug("🔍 Fetching PC components from Contentful...", params);

    // Map category to content type ID
    const contentTypeMap: Record<string, string> = {
      case: "pcCase",
      motherboard: "pcMotherboard",
      cpu: "pcCpu",
      gpu: "pcGpu",
      ram: "pcRam",
      storage: "pcStorage",
      psu: "pcPsu",
      cooling: "pcCooling",
      caseFans: "pcCaseFans",
    };

    const query: ContentfulQuery = {
      limit: params?.limit || 100,
      include: 2, // Include linked assets (images) - increased to 2 for nested assets like brandLogo
    };

    // If category specified, use specific content type, otherwise fetch all types
    if (params?.category) {
      const contentType = contentTypeMap[params.category];
      if (!contentType) {
        logger.warn(`Unknown category: ${params.category}`);
        return [];
      }
      query.content_type = contentType;
    }

    if (params?.featured !== undefined) {
      query["fields.featured"] = params.featured;
    }

    let allComponents: PCComponent[] = [];

    if (params?.category) {
      // Fetch single category
      const response = await contentfulClient.getEntries(
        query as unknown as Record<string, unknown>
      );
      logger.debug(
        `📦 Found ${response.items.length} ${params.category} components`
      );

      allComponents = response.items.map((item) =>
        mapContentfulToComponent(
          item,
          params.category!,
          response.includes as unknown as ContentfulResponse["includes"]
        )
      );

      // Log sample component for debugging
      if (allComponents.length > 0) {
        logger.debug(`🔍 Sample ${params.category} component:`, {
          id: allComponents[0].id,
          name: allComponents[0].name,
          brandLogo: allComponents[0].brandLogo,
          imagesCount: allComponents[0].images?.length || 0,
          firstImage:
            allComponents[0].images?.[0]?.substring(0, 50) + "..." || "none",
          rawFields: Object.keys(response.items[0].fields),
        });
      }
    } else {
      // Fetch all categories
      for (const [category, contentType] of Object.entries(contentTypeMap)) {
        try {
          const categoryQuery = {
            ...query,
            content_type: contentType,
          } as Record<string, unknown>;
          const response = await contentfulClient.getEntries(categoryQuery);
          logger.debug(
            `📦 Found ${response.items.length} ${category} components`
          );
          const components = response.items.map((item) =>
            mapContentfulToComponent(
              item,
              category,
              response.includes as unknown as ContentfulResponse["includes"]
            )
          );
          allComponents = [...allComponents, ...components];
        } catch (error) {
          // Content type doesn't exist or failed to parse - log and continue
          logger.warn(`No ${category} content type found or failed to parse`, {
            error,
            operation: "fetch_component_content",
            category,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Log sample component to debug image issues
    if (allComponents.length > 0) {
      logger.debug("🔍 Sample component data:", {
        id: allComponents[0].id,
        name: allComponents[0].name,
        imagesCount: allComponents[0].images?.length || 0,
        firstImage:
          allComponents[0].images?.[0]?.substring(0, 50) + "..." || "none",
      });
    }

    // Cache the results before returning
    const cacheKey = `pcComponents_${params?.category || "all"}_${
      params?.limit || "default"
    }_${params?.featured || "all"}`;
    setCache(cacheKey, allComponents);
    logger.debug("💾 Cached PC components", {
      count: allComponents.length,
      cacheKey,
    });

    return allComponents;
  } catch (error: unknown) {
    logger.error("Fetch PC components error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Helper function to map Contentful entry to PCComponent
 */
function mapContentfulToComponent(
  item: ContentfulEntry,
  category: string,
  includes?: ContentfulResponse["includes"]
): PCComponent {
  const fields = (item.fields || {}) as Record<string, unknown>;

  // Helper: parse wattage from number or string like "850W"
  const parseWatt = (v: unknown): number | undefined => {
    if (typeof v === "number" && !isNaN(v)) return v;
    if (typeof v === "string") {
      const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
      return isNaN(n) ? undefined : n;
    }
    return undefined;
  };

  // Process images - resolve asset links from includes
  let images: string[] = [];
  if (fields.images && Array.isArray(fields.images)) {
    // Multiple images field (plural)
    images = (fields.images as Array<Record<string, unknown>>)
      .map((img) => {
        if (
          img.sys &&
          typeof img.sys === "object" &&
          "linkType" in img.sys &&
          img.sys.linkType === "Asset" &&
          includes?.Asset
        ) {
          const imgSys = img.sys as { id?: string };
          const asset = (
            includes.Asset as unknown as Array<Record<string, unknown>>
          ).find(
            (a: Record<string, unknown>) =>
              a.sys &&
              typeof a.sys === "object" &&
              "id" in a.sys &&
              (a.sys as { id?: string }).id === imgSys.id
          );
          if (
            asset &&
            asset.fields &&
            typeof asset.fields === "object" &&
            "file" in asset.fields
          ) {
            const assetFields = asset.fields as { file?: { url?: string } };
            return assetFields.file?.url
              ? `https:${assetFields.file.url}`
              : null;
          }
          return null;
        }
        if (
          img.fields &&
          typeof img.fields === "object" &&
          "file" in img.fields
        ) {
          const imgFields = img.fields as { file?: { url?: string } };
          return imgFields.file?.url ? `https:${imgFields.file.url}` : null;
        }
        return null;
      })
      .filter((url): url is string => url !== null);
  } else if (fields.image && Array.isArray(fields.image)) {
    // Multiple images field named "image" (singular but array)
    images = (fields.image as Array<Record<string, unknown>>)
      .map((img) => {
        if (
          img.sys &&
          typeof img.sys === "object" &&
          "linkType" in img.sys &&
          img.sys.linkType === "Asset" &&
          includes?.Asset
        ) {
          const imgSys = img.sys as { id?: string };
          const asset = (
            includes.Asset as unknown as Array<Record<string, unknown>>
          ).find(
            (a: Record<string, unknown>) =>
              a.sys &&
              typeof a.sys === "object" &&
              "id" in a.sys &&
              (a.sys as { id?: string }).id === imgSys.id
          );
          if (
            asset &&
            asset.fields &&
            typeof asset.fields === "object" &&
            "file" in asset.fields
          ) {
            const assetFields = asset.fields as { file?: { url?: string } };
            return assetFields.file?.url
              ? `https:${assetFields.file.url}`
              : null;
          }
          return null;
        }
        if (
          img.fields &&
          typeof img.fields === "object" &&
          "file" in img.fields
        ) {
          const imgFields = img.fields as { file?: { url?: string } };
          return imgFields.file?.url ? `https:${imgFields.file.url}` : null;
        }
        return null;
      })
      .filter((url): url is string => url !== null);
  } else if (fields.image && typeof fields.image === "object") {
    // Single image field
    const imgField = fields.image as Record<string, unknown>;
    if (
      imgField.fields &&
      typeof imgField.fields === "object" &&
      "file" in imgField.fields
    ) {
      const imgFields = imgField.fields as { file?: { url?: string } };
      if (imgFields.file?.url) {
        images = [`https:${imgFields.file.url}`];
      }
    }
  }

  // Process brand logo (similar to single image processing)
  // Try multiple possible field names for brand logo
  const brandLogoField =
    fields.brandLogo || fields.BrandLogo || fields.brand_logo || fields.logo;
  let brandLogo: string | undefined;

  if (brandLogoField) {
    // Handle if brandLogo is a direct string URL
    if (typeof brandLogoField === "string") {
      brandLogo = brandLogoField.startsWith("//")
        ? `https:${brandLogoField}`
        : brandLogoField;
    } else if (typeof brandLogoField === "object") {
      const logoField = brandLogoField as Record<string, unknown>;

      // Check if it's a linked asset with sys
      if (
        logoField.sys &&
        typeof logoField.sys === "object" &&
        "linkType" in logoField.sys &&
        logoField.sys.linkType === "Asset"
      ) {
        if (includes?.Asset) {
          const logoSys = logoField.sys as { id?: string };
          const asset = (
            includes.Asset as unknown as Array<Record<string, unknown>>
          ).find(
            (a: Record<string, unknown>) =>
              a.sys &&
              typeof a.sys === "object" &&
              "id" in a.sys &&
              (a.sys as { id?: string }).id === logoSys.id
          );
          if (
            asset &&
            asset.fields &&
            typeof asset.fields === "object" &&
            "file" in asset.fields
          ) {
            const assetFields = asset.fields as { file?: { url?: string } };
            brandLogo = assetFields.file?.url
              ? `https:${assetFields.file.url}`
              : undefined;
          }
        }
      }
      // Check if it's an already resolved asset with fields
      else if (
        logoField.fields &&
        typeof logoField.fields === "object" &&
        "file" in logoField.fields
      ) {
        const logoFields = logoField.fields as { file?: { url?: string } };
        brandLogo = logoFields.file?.url
          ? `https:${logoFields.file.url}`
          : undefined;
      }
    }
  }

  // Debug: Log all available fields with prominent styling
  return {
    id: getString(fields.componentId) || getString(fields.id) || item.sys.id,
    name: getString(fields.name) ?? "",
    price: getNumber(fields.price) ?? 0,
    category: category,
    rating: getNumber(fields.rating) ?? undefined,
    description: getString(fields.description) ?? undefined,
    mainProductDescription:
      getRichText(fields.mainProductDescription) ?? undefined,
    images: images,
    imagesByOption: (() => {
      if (!fields.imagesByOption) return undefined;

      const rawData = fields.imagesByOption as Record<
        string,
        Record<string, string[]>
      >;
      const processed: Record<string, Record<string, string[]>> = {};

      // Process each option type (colour, size, etc.)
      for (const optionKey in rawData) {
        processed[optionKey] = {};

        // Process each option value (Black, White, etc.)
        for (const optionValue in rawData[optionKey]) {
          const urls = rawData[optionKey][optionValue];
          // Add https: protocol to URLs that start with //
          processed[optionKey][optionValue] = urls.map((url) =>
            url.startsWith("//") ? `https:${url}` : url
          );
        }
      }

      return processed;
    })(),
    // Support both legacy numeric map and new object map with { price, ean }
    pricesByOption: fields.pricesByOption
      ? (fields.pricesByOption as Record<
          string,
          Record<string, number | { price: number; ean?: string }>
        >)
      : undefined,
    inStock: getBoolean(fields.inStock) ?? true,
    featured: getBoolean(fields.featured) ?? false,
    stockLevel: getNumber(fields.stockLevel) ?? undefined,
    ean: (() => {
      const eanValue = getNumber(fields.ean) ?? getString(fields.ean);
      return eanValue !== undefined ? String(eanValue) : undefined;
    })(),

    // Supplier/Admin information
    supplierName: getString(fields.supplierName) ?? undefined,
    costPrice: getNumber(fields.costPrice) ?? undefined,
    profitMargin: getNumber(fields.profitMargin) ?? undefined,
    profitAmount: getNumber(fields.profitAmount) ?? undefined,

    // Common fields across all components
    brand: getString(fields.brand) ?? undefined,
    brandLogo: brandLogo, // Will come from Contentful when field is populated
    model: getString(fields.model) ?? undefined,
    colour:
      (getArray(fields.colour) as string[] | undefined) ||
      getString(fields.colour) ||
      (getArray(fields.color) as string[] | undefined) ||
      getString(fields.color) ||
      undefined,
    color:
      (getArray(fields.color) as string[] | undefined) ||
      getString(fields.color) ||
      (getArray(fields.colour) as string[] | undefined) ||
      getString(fields.colour) ||
      undefined,
    colourOptions:
      (getArray(fields.colourOptions) as string[] | undefined) ||
      getString(fields.colourOptions) ||
      undefined,
    features: (getArray(fields.features) as string[] | undefined) || undefined,
    size:
      (getArray(fields.size) as string[] | undefined) ||
      getString(fields.size) ||
      undefined,
    type:
      (getArray(fields.type) as string[] | undefined) ||
      getString(fields.type) ||
      undefined,
    storage:
      (getArray(fields.storage) as string[] | undefined) ||
      getString(fields.storage) ||
      undefined,

    // Case fields
    formFactor:
      getString(fields.formFactor ?? fields["Form Factor"]) ?? undefined,
    gpuClearance:
      getString(fields.gpuClearance ?? fields["GPU Clearance"]) ?? undefined,
    coolingSupport:
      getString(fields.coolingSupport ?? fields["Cooling Support"]) ??
      undefined,
    style:
      (getArray(fields.style) as string[] | undefined) ||
      getString(fields.style ?? fields["Style"]) ||
      undefined,
    compatibility: getArray(fields.compatibility ?? fields["Compatability"]) as
      | string[]
      | undefined,
    maxGpuLength:
      getNumber(fields.maxGpuLength ?? fields["MAX GPU Length"]) ?? undefined,
    maxCpuCoolerHeight:
      getNumber(fields.maxCpuCoolerHeight ?? fields["Max CPU Cooler Height"]) ||
      getNumber(fields.maxCoolerHeight) ||
      undefined,
    maxPsuLength:
      getNumber(fields.maxPsuLength ?? fields["Max PSU Length"]) ?? undefined,
    frontPanelPorts:
      getString(fields.frontPanelPorts ?? fields["Front Panel Ports"]) ??
      undefined,

    // Motherboard fields
    socket: getString(fields.socket ?? fields.Socket) ?? undefined,
    chipset: getString(fields.chipset ?? fields.Chipset) ?? undefined,
    cpuCompatability: (() => {
      const arr =
        (getArray(fields.cpuCompatability) as string[] | undefined) ||
        (getArray(fields["CPU Compatability"]) as string[] | undefined) ||
        (getArray(fields.cpuCompatibility) as string[] | undefined) ||
        (getArray(fields["CPU Compatibility"]) as string[] | undefined);
      if (arr && arr.length) return arr;
      const str =
        getString(fields.cpuCompatability) ||
        getString(fields["CPU Compatability"]) ||
        getString(fields.cpuCompatibility) ||
        getString(fields["CPU Compatibility"]) ||
        undefined;
      return str;
    })(),
    ramSupport:
      getString(fields.ramSupport ?? fields["RAM Support"]) ?? undefined,
    maxRam: getNumber(fields.maxRam ?? fields["Max Ram"]) ?? undefined,
    ramSlots: getNumber(fields.ramSlots ?? fields["RAM Slots"]) ?? undefined,
    pciSlots: getNumber(fields.pciSlots ?? fields["PCI Slots"]) ?? undefined,
    m2Slots: getNumber(fields.m2Slots ?? fields["M2 Slots"]) ?? undefined,
    internalIOConnectors: getArray(
      fields.internalIOConnectors ??
        fields.internalIoConnectors ??
        fields["Internal I/O Connectors"]
    ) as string[] | undefined,
    backPanelIOPorts: getArray(
      fields.backPanelIOPorts ??
        fields.backPanelIoPorts ??
        fields["Back Panel I/O Ports"]
    ) as string[] | undefined,

    // CPU fields
    cores: getNumber(fields.cores) ?? undefined,
    threads: getNumber(fields.threads) ?? undefined,
    tdp: getNumber(fields.tdp) ?? undefined,
    generation: getString(fields.generation) ?? undefined,
    platform: getString(fields.platform) ?? undefined,
    processorFamily:
      getString(fields.processorFamily ?? fields["Processor Family"]) ??
      undefined,
    processorGeneration:
      getString(fields.processorGeneration ?? fields["Processor generation"]) ??
      undefined,
    processorOperatingModes:
      getString(
        fields.processorOperatingModes ?? fields["Processor operating modes"]
      ) ?? undefined,
    baseClock: getNumber(fields.baseClock ?? fields["Base Clock"]) ?? undefined,
    boostClock:
      getNumber(fields.boostClock ?? fields["Boost Clock"]) ?? undefined,
    onBoardGraphicsCardModel:
      getString(
        fields.onBoardGraphicsCardModel ??
          fields["On-board graphics card model"]
      ) ?? undefined,
    processorCache:
      getString(fields.processorCache ?? fields["Processor cache"]) ??
      undefined,
    integratedGraphics:
      getBoolean(fields.integratedGraphics ?? fields["Integrated Graphics"]) ??
      undefined,
    coolerIncluded:
      getBoolean(fields.coolerIncluded ?? fields["Cooler included"]) ??
      undefined,
    efficientCores:
      getNumber(fields.efficientCores ?? fields["Efficient cores"]) ??
      undefined,
    performanceCores:
      getNumber(fields.performanceCores ?? fields["Performance cores"]) ??
      undefined,
    processorBasePower:
      getString(fields.processorBasePower ?? fields["Processor base power"]) ??
      undefined,
    maximumTurboPower:
      getString(fields.maximumTurboPower ?? fields["Maximum turbo power"]) ??
      undefined,

    // GPU fields
    vram: getNumber(fields.vram ?? fields.VRAM ?? fields["VRAM"]) ?? undefined,
    power: getNumber(fields.power ?? fields.Power) ?? undefined,
    powerConsumption:
      parseWatt(
        (fields as Record<string, unknown>)["powerConsumption"] ??
          (fields as Record<string, unknown>)["Power Consumption"] ??
          (fields as Record<string, unknown>)["power_consumption"] ??
          (fields as Record<string, unknown>)["Power_Consumption"] ??
          (fields as Record<string, unknown>)["TBP"] ??
          (fields as Record<string, unknown>)["typicalBoardPower"]
      ) ?? undefined,
    powerDraw:
      parseWatt(
        (fields as Record<string, unknown>)["powerDraw"] ??
          (fields as Record<string, unknown>)["Power Draw"] ??
          (fields as Record<string, unknown>)["power_draw"] ??
          (fields as Record<string, unknown>)["Power_Draw"]
      ) ?? undefined,
    length: getNumber(fields.length ?? fields.Length) ?? undefined,
    height: getNumber(fields.height ?? fields.Height) ?? undefined,
    slots: getNumber(fields.slots ?? fields.Slots) ?? undefined,
    performance:
      getString(fields.performance ?? fields.Performance) ?? undefined,
    chipsetManufacturer:
      getString(fields.chipsetManufacturer ?? fields["Chipset Manufacturer"]) ??
      undefined,
    graphicsChipset:
      getString(fields.graphicsChipset ?? fields["Graphics Chipset"]) ??
      undefined,
    memorySize:
      getString(fields.memorySize ?? fields["Memory Size"]) ?? undefined,
    memoryType:
      getString(fields.memoryType ?? fields["Memory Type"]) ?? undefined,
    cudaCores: getNumber(fields.cudaCores ?? fields["CUDA Cores"]) ?? undefined,
    gpuBaseClock:
      getNumber(
        fields.gpuBaseClock ?? fields.baseClock ?? fields["Base Clock"]
      ) ?? undefined,
    gpuBoostClock:
      getNumber(
        fields.gpuBoostClock ?? fields.boostClock ?? fields["Boost Clock"]
      ) ?? undefined,
    outputs: getString(fields.outputs ?? fields.Outputs) ?? undefined,
    maxDisplaySupport:
      getNumber(fields.maxDisplaySupport ?? fields["Max Display Support"]) ??
      undefined,
    powerConnecters: getArray(
      fields.powerConnecters ?? fields["Power Connecters"]
    ) as string[] | undefined,
    gpuCooling:
      getString(fields.gpuCooling ?? fields.cooling ?? fields.Cooling) ??
      undefined,
    psuRequirements:
      getString(fields.psuRequirements ?? fields["PSU Requirements"]) ??
      undefined,
    connectorsRequired:
      getString(fields.connectorsRequired ?? fields["Connectors Required"]) ??
      undefined,

    // RAM fields
    capacity: getNumber(fields.capacity ?? fields.Capacity) ?? undefined,
    speed: getString(fields.speed ?? fields.Speed) ?? undefined,
    modules: getNumber(fields.modules ?? fields.Modules) ?? undefined,
    latency: getString(fields.latency ?? fields.Latency) ?? undefined,
    // type field moved to common fields above to support arrays
    voltage: getNumber(fields.voltage ?? fields.Voltage) ?? undefined,
    compliance: getString(fields.compliance ?? fields.Compliance) ?? undefined,
    pins: getNumber(fields.pins ?? fields.Pins) ?? undefined,
    casLatency:
      getString(fields.casLatency ?? fields["CAS Latency"]) ?? undefined,
    intelXmpCertified:
      getString(fields.intelXmpCertified ?? fields["Intel XMP Certified"]) ??
      undefined,
    dataIntegrityCheck:
      getString(fields.dataIntegrityCheck ?? fields["Data Integrity Check"]) ??
      undefined,
    heatsink: getBoolean(fields.heatsink ?? fields.Heatsink) ?? undefined,
    timings: getString(fields.timings ?? fields.Timings) ?? undefined,

    // Storage fields
    storageCapacity:
      getString(fields.storageCapacity ?? fields.Capacity) ?? undefined,
    interface: getString(fields.interface ?? fields.Interface) ?? undefined,
    readSpeed: getString(fields.readSpeed ?? fields["Read Speed"]) ?? undefined,
    writeSpeed:
      getString(fields.writeSpeed ?? fields["Write Speed"]) ?? undefined,
    nand: getString(fields.nand ?? fields.NAND) ?? undefined,
    driveType: getString(fields.driveType ?? fields["Drive Type"]) ?? undefined,
    storageMtbf: getNumber(fields.storageMtbf ?? fields.MTBF) ?? undefined,
    totalBytesWritten:
      getString(
        fields.totalBytesWritten ?? fields["Total Bytes Written (TBW)"]
      ) ?? undefined,
    operatingTemperatures:
      getString(
        fields.operatingTemperatures ?? fields["Operating Temperatures"]
      ) ?? undefined,
    storageTemperatures:
      getString(fields.storageTemperatures ?? fields["Storage Temperatures"]) ??
      undefined,
    shockResistance:
      getNumber(fields.shockResistance ?? fields["Shock Resistance"]) ??
      undefined,

    // PSU fields
    wattage: getNumber(fields.wattage ?? fields.Wattage) ?? undefined,
    efficiency: getString(fields.efficiency ?? fields.Efficiency) ?? undefined,
    modular: getString(fields.modular ?? fields.Modular) ?? undefined,
    cables: getString(fields.cables ?? fields.Cables) ?? undefined,
    connectors: getArray(fields.connectors ?? fields.Connectors) as
      | string[]
      | undefined,
    psuCompatibility:
      getString(fields.psuCompatibility ?? fields.Compatibility) ?? undefined,
    pfc: getString(fields.pfc ?? fields.PFC) ?? undefined,
    acInput: getString(fields.acInput ?? fields["AC Input"]) ?? undefined,
    fanType: getString(fields.fanType ?? fields["Fan Type"]) ?? undefined,
    fanBearing:
      getString(fields.fanBearing ?? fields["Fan Bearing"]) ?? undefined,
    maxCertification:
      getString(fields.maxCertification ?? fields["Max Certification"]) ??
      undefined,
    mtbf: getNumber(fields.mtbf ?? fields.MTBF) ?? undefined,
    protection: getArray(fields.protection ?? fields.Protection) as
      | string[]
      | undefined,

    // Cooling fields
    coolerType: getString(fields.coolerType ?? fields["Type"]) ?? undefined,
    socketCompatibility: getArray(
      fields.socketCompatibility ?? fields["Socket Compatability"]
    ) as string[] | undefined,
    fanSize: getString(fields.fanSize ?? fields["Fan Size"]) ?? undefined,
    tdpSupport:
      getNumber(fields.tdpSupport ?? fields["TDP Support"]) ?? undefined,
    radiatorSize:
      getString(fields.radiatorSize ?? fields["Radiator Size"]) ?? undefined,
    rgbLighting:
      getBoolean(fields.rgbLighting ?? fields["RGB Lighting"]) ?? undefined,

    // Case Fans fields
    rpm: getNumber(fields.rpm ?? fields.RPM ?? fields.rPM) ?? undefined,
    airflow: getNumber(fields.airflow ?? fields.Airflow) ?? undefined,
    noiseLevel:
      getNumber(fields.noiseLevel ?? fields["Noise Level"]) ?? undefined,
    fanCount: getNumber(fields.fanCount ?? fields["Fan Count"]) ?? undefined,
    connector: getString(fields.connector ?? fields.Connector) ?? undefined,
    ledType:
      getString(fields.ledType ?? fields["LED Type"] ?? fields.lEDType) ??
      undefined,

    // Technical documentation
    techSheet: (() => {
      const ts = fields.techSheet;
      if (
        ts &&
        typeof ts === "object" &&
        "fields" in ts &&
        ts.fields &&
        typeof ts.fields === "object" &&
        "file" in ts.fields
      ) {
        const tsFields = ts.fields as { file?: { url?: string } };
        return tsFields.file?.url ? `https:${tsFields.file.url}` : undefined;
      }
      return undefined;
    })(),
  };
}

/**
 * Fetch PC Optional Extras from Contentful
 */
export const fetchPCOptionalExtras = async (params?: {
  category?: string;
  limit?: number;
  featured?: boolean;
}): Promise<PCOptionalExtra[]> => {
  // Check cache first to reduce API calls
  const cacheKey = `pcOptionalExtras_${params?.category || "all"}_${
    params?.limit || "default"
  }_${params?.featured || "all"}`;
  const cached = getCached<PCOptionalExtra[]>(cacheKey);
  if (cached) {
    logger.debug("✅ Returning cached optional extras", {
      count: cached.length,
      cacheKey,
    });
    return cached;
  }

  if (!isContentfulEnabled || !contentfulClient) {
    logger.debug(
      "📦 Contentful not enabled, returning empty optional extras array"
    );
    return [];
  }

  try {
    logger.debug("🔍 Fetching PC optional extras from Contentful...", params);

    const query: ContentfulQuery = {
      content_type: "optionalExtra",
      limit: params?.limit || 500, // fetch broadly, filter client-side
      include: 1, // Include linked assets (images)
    };

    if (params?.featured !== undefined) {
      query["fields.featured"] = params.featured;
    }

    const response = await contentfulClient.getEntries(
      query as unknown as Record<string, unknown>
    );
    logger.debug(`📦 Found ${response.items.length} optional extras from CMS`);

    // Map entries
    const rawExtras = response.items.map((item) =>
      mapContentfulToOptionalExtra(
        item,
        response.includes as unknown as ContentfulResponse["includes"]
      )
    );

    // Category normalization to align CMS predefined values with internal keys
    const categoryMap: Record<string, string> = {
      cables: "cable",
      cable: "cable",
      keyboards: "keyboard",
      keyboard: "keyboard",
      gamepads: "gamepad",
      gamepad: "gamepad",
      mousepads: "mousepad",
      mousepad: "mousepad",
      headsets: "headset",
      headset: "headset",
      mice: "mouse",
      mouse: "mouse",
      monitors: "monitor",
      monitor: "monitor",
      software: "software",
    };

    const normalize = (val?: string) => {
      if (!val) return "";
      const key = val.trim().toLowerCase();
      return categoryMap[key] ?? key;
    };

    const extras = params?.category
      ? rawExtras.filter(
          (e) => normalize(e.category) === normalize(params.category)
        )
      : rawExtras;

    logger.debug(
      `📦 Optional extras after category filter (${
        params?.category ?? "all"
      }): ${extras.length}`
    );

    // Log sample extra for debugging
    if (extras.length > 0) {
      logger.debug("🔍 Sample optional extra:", {
        id: extras[0].id,
        name: extras[0].name,
        category: extras[0].category,
        imagesCount: extras[0].images?.length || 0,
      });
    }

    // Cache the results before returning
    const cacheKey = `pcOptionalExtras_${params?.category || "all"}_${
      params?.limit || "default"
    }_${params?.featured || "all"}`;
    setCache(cacheKey, extras);
    logger.debug("💾 Cached optional extras", {
      count: extras.length,
      cacheKey,
    });

    return extras;
  } catch (error: unknown) {
    logger.error("Fetch PC optional extras error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Helper function to map Contentful entry to PCOptionalExtra
 */
function mapContentfulToOptionalExtra(
  item: ContentfulEntry,
  includes?: ContentfulResponse["includes"]
): PCOptionalExtra {
  const fields = (item.fields || {}) as Record<string, unknown>;

  // Process images - resolve asset links from includes
  let images: string[] = [];
  if (fields.images && Array.isArray(fields.images)) {
    images = (fields.images as Array<Record<string, unknown>>)
      .map((img) => {
        if (
          img.sys &&
          typeof img.sys === "object" &&
          "linkType" in img.sys &&
          img.sys.linkType === "Asset" &&
          includes?.Asset
        ) {
          const imgSys = img.sys as { id?: string };
          const asset = (
            includes.Asset as unknown as Array<Record<string, unknown>>
          ).find(
            (a: Record<string, unknown>) =>
              a.sys &&
              typeof a.sys === "object" &&
              "id" in a.sys &&
              (a.sys as { id?: string }).id === imgSys.id
          );
          if (
            asset &&
            asset.fields &&
            typeof asset.fields === "object" &&
            "file" in asset.fields
          ) {
            const assetFields = asset.fields as { file?: { url?: string } };
            return assetFields.file?.url
              ? `https:${assetFields.file.url}`
              : null;
          }
          return null;
        }
        if (
          img.fields &&
          typeof img.fields === "object" &&
          "file" in img.fields
        ) {
          const imgFields = img.fields as { file?: { url?: string } };
          return imgFields.file?.url ? `https:${imgFields.file.url}` : null;
        }
        return null;
      })
      .filter((url): url is string => url !== null);
  } else if (fields.image && typeof fields.image === "object") {
    const imgField = fields.image as Record<string, unknown>;
    if (
      imgField.fields &&
      typeof imgField.fields === "object" &&
      "file" in imgField.fields
    ) {
      const imgFields = imgField.fields as { file?: { url?: string } };
      if (imgFields.file?.url) {
        images = [`https:${imgFields.file.url}`];
      }
    }
  }

  // Process brand logo (same as PCComponent)
  let brandLogo: string | undefined;
  if (fields.brandLogo && typeof fields.brandLogo === "object") {
    const logoField = fields.brandLogo as Record<string, unknown>;
    if (
      logoField.sys &&
      typeof logoField.sys === "object" &&
      "linkType" in logoField.sys &&
      logoField.sys.linkType === "Asset" &&
      includes?.Asset
    ) {
      const logoSys = logoField.sys as { id?: string };
      const asset = (
        includes.Asset as unknown as Array<Record<string, unknown>>
      ).find(
        (a: Record<string, unknown>) =>
          a.sys &&
          typeof a.sys === "object" &&
          "id" in a.sys &&
          (a.sys as { id?: string }).id === logoSys.id
      );
      if (
        asset &&
        asset.fields &&
        typeof asset.fields === "object" &&
        "file" in asset.fields
      ) {
        const assetFields = asset.fields as { file?: { url?: string } };
        brandLogo = assetFields.file?.url
          ? `https:${assetFields.file.url}`
          : undefined;
      }
    } else if (
      logoField.fields &&
      typeof logoField.fields === "object" &&
      "file" in logoField.fields
    ) {
      const logoFields = logoField.fields as { file?: { url?: string } };
      brandLogo = logoFields.file?.url
        ? `https:${logoFields.file.url}`
        : undefined;
    }
  }

  return {
    id: getString(fields.extraId) || getString(fields.id) || item.sys.id,
    name: getString(fields.name) ?? "",
    price: getNumber(fields.price) ?? 0,
    category: getString(fields.category) ?? "",
    rating: getNumber(fields.rating) ?? undefined,
    description: getString(fields.description) ?? undefined,
    mainProductDescription:
      getRichText(fields.mainProductDescription) ?? undefined,
    features: Array.isArray(fields.features)
      ? (fields.features as string[])
      : undefined,
    techSheet: (() => {
      const ts = fields.techSheet;
      if (
        ts &&
        typeof ts === "object" &&
        "fields" in ts &&
        ts.fields &&
        typeof ts.fields === "object" &&
        "file" in ts.fields
      ) {
        const tsFields = ts.fields as { file?: { url?: string } };
        return tsFields.file?.url ? `https:${tsFields.file.url}` : undefined;
      }
      return undefined;
    })(),
    images: images,
    inStock: getBoolean(fields.inStock) ?? true,
    featured: getBoolean(fields.featured) ?? false,
    stockLevel: getNumber(fields.stockLevel) ?? undefined,
    ean: (() => {
      const eanValue = getNumber(fields.ean) ?? getString(fields.ean);
      return eanValue !== undefined ? String(eanValue) : undefined;
    })(),

    // Supplier information (admin panel only)
    supplierName: getString(fields.supplierName) ?? undefined,
    costPrice: getNumber(fields.costPrice) ?? undefined,
    profitMargin: getNumber(fields.profitMargin) ?? undefined,
    profitAmount: getNumber(fields.profitAmount) ?? undefined,

    // Common fields
    type: getString(fields.type) ?? undefined,
    wireless: getBoolean(fields.wireless) ?? undefined,
    rgb: getBoolean(fields.rgb) ?? undefined,
    brand: getString(fields.brand) ?? undefined,
    brandLogo: brandLogo,
    color: getString(fields.color) ?? undefined,

    // Keyboard specific
    switches: getString(fields.switches) ?? undefined,
    layout: getString(fields.layout) ?? undefined,
    keyCount: getNumber(fields.keyCount) ?? undefined,

    // Mouse specific
    dpi: getNumber(fields.dpi) ?? undefined,
    weight: getNumber(fields.weight) ?? undefined,
    sensor: getString(fields.sensor) ?? undefined,

    // Monitor specific
    size: getNumber(fields.size) ?? undefined,
    monitorResolution: getString(fields.monitorResolution) ?? undefined,
    refreshRate: getNumber(fields.refreshRate) ?? undefined,
    panelType: getString(fields.panelType) ?? undefined,
    curved: getBoolean(fields.curved) ?? undefined,
    aspectRatio: getString(fields.aspectRatio) ?? undefined,
    responseTime: getNumber(fields.responseTime) ?? undefined,

    // Gamepad specific
    platform: getString(fields.platform) ?? undefined,
    batteryLife: getString(fields.batteryLife) ?? undefined,
    connectivity: getString(fields.connectivity) ?? undefined,

    // Mousepad specific
    surface: getString(fields.surface) ?? undefined,
    dimensions: getString(fields.dimensions) ?? undefined,
    thickness: getNumber(fields.thickness) ?? undefined,

    // Audio specific
    frequencyResponse: getString(fields.frequencyResponse) ?? undefined,
    impedance: getNumber(fields.impedance) ?? undefined,
    microphone: getBoolean(fields.microphone) ?? undefined,
    surroundSound: getBoolean(fields.surroundSound) ?? undefined,

    // Webcam/Microphone specific
    resolution: getString(fields.resolution) ?? undefined,
    frameRate: getNumber(fields.frameRate) ?? undefined,
    fieldOfView: getNumber(fields.fieldOfView) ?? undefined,
  };
}

/**
 * Fetch Gaming Laptops from Contentful and map to PCBuilderComponent
 */
export const fetchLaptops = async (): Promise<
  import("../components/PCBuilder/types").PCBuilderComponent[]
> => {
  const cacheKey = "gamingLaptops_all";
  const cached =
    getCached<import("../components/PCBuilder/types").PCBuilderComponent[]>(
      cacheKey
    );
  if (cached) {
    logger.debug("✅ Returning cached laptops", { count: cached.length });
    return cached;
  }

  if (!isContentfulEnabled || !contentfulClient) {
    logger.debug("📦 Contentful not enabled, returning empty laptops array");
    setCache(cacheKey, []);
    return [];
  }

  try {
    logger.debug("🔍 Fetching laptops from Contentful...");
    const query: ContentfulQuery = {
      content_type: "laptop",
      include: 1,
      limit: 500,
    };
    const response = await contentfulClient.getEntries(
      query as unknown as Record<string, unknown>
    );
    logger.debug(`📦 Found ${response.items.length} laptops from CMS`);

    const includes =
      response.includes as unknown as ContentfulResponse["includes"];

    const items: import("../components/PCBuilder/types").PCBuilderComponent[] =
      response.items.map((item) => {
        const fields = (item.fields || {}) as Record<string, unknown>;

        // Resolve images similar to components
        let images: string[] = [];
        if (fields.images && Array.isArray(fields.images)) {
          images = (fields.images as Array<Record<string, unknown>>)
            .map((img) => {
              if (
                img.sys &&
                typeof img.sys === "object" &&
                "linkType" in img.sys &&
                img.sys.linkType === "Asset" &&
                includes?.Asset
              ) {
                const imgSys = img.sys as { id?: string };
                const asset = (
                  includes.Asset as unknown as Array<Record<string, unknown>>
                ).find(
                  (a: Record<string, unknown>) =>
                    a.sys &&
                    typeof a.sys === "object" &&
                    "id" in a.sys &&
                    (a.sys as { id?: string }).id === imgSys.id
                );
                if (
                  asset &&
                  asset.fields &&
                  typeof asset.fields === "object" &&
                  "file" in asset.fields
                ) {
                  const assetFields = asset.fields as {
                    file?: { url?: string };
                  };
                  return assetFields.file?.url
                    ? `https:${assetFields.file.url}`
                    : null;
                }
                return null;
              }
              if (
                img.fields &&
                typeof img.fields === "object" &&
                "file" in img.fields
              ) {
                const imgFields = img.fields as { file?: { url?: string } };
                return imgFields.file?.url
                  ? `https:${imgFields.file.url}`
                  : null;
              }
              return null;
            })
            .filter((url): url is string => url !== null);
        } else if (fields.image && typeof fields.image === "object") {
          const imgField = fields.image as Record<string, unknown>;
          if (
            imgField.fields &&
            typeof imgField.fields === "object" &&
            "file" in imgField.fields
          ) {
            const imgFields = imgField.fields as { file?: { url?: string } };
            if (imgFields.file?.url) {
              images = [`https:${imgFields.file.url}`];
            }
          }
        }

        // Brand logo
        let brandLogo: string | undefined;
        const brandLogoField =
          fields.brandLogo ||
          fields.BrandLogo ||
          fields.brand_logo ||
          fields.logo;
        if (brandLogoField) {
          if (typeof brandLogoField === "string") {
            brandLogo = brandLogoField.startsWith("//")
              ? `https:${brandLogoField}`
              : brandLogoField;
          } else if (typeof brandLogoField === "object") {
            const logoField = brandLogoField as Record<string, unknown>;
            if (
              logoField.fields &&
              typeof logoField.fields === "object" &&
              "file" in logoField.fields
            ) {
              const logoFields = logoField.fields as {
                file?: { url?: string };
              };
              brandLogo = logoFields.file?.url
                ? `https:${logoFields.file.url}`
                : undefined;
            }
          }
        }

        const richDesc =
          getRichText(fields.mainProductDescription) ??
          getRichText(fields.description);

        // Map to PCBuilderComponent shape
        const pcComp: import("../components/PCBuilder/types").PCBuilderComponent =
          {
            id: getString(fields.slug) || getString(fields.id) || item.sys.id,
            name: getString(fields.name) ?? "Gaming Laptop",
            brand: getString(fields.brand) ?? undefined,
            brandLogo,
            model: getString(fields.model) ?? undefined,
            price: getNumber(fields.price) ?? 0,
            category: "laptop",
            featured: getBoolean(fields.featured) ?? false,
            images,
            mainProductDescription: richDesc,
            description: getString(fields.shortDescription) ?? undefined,
            // Key laptop specs mapped into common fields
            cpuCompatability: getString(fields.cpu) ?? undefined,
            graphicsChipset: getString(fields.gpu) ?? undefined,
            memorySize: getString(fields.ram) ?? undefined,
            storageCapacity: getString(fields.storage) ?? undefined,
            display:
              getString((fields as Record<string, unknown>)["display"]) ??
              undefined,
            refreshRate:
              getNumber((fields as Record<string, unknown>)["refreshRate"]) ??
              undefined,
            resolution:
              getString((fields as Record<string, unknown>)["resolution"]) ??
              undefined,
            weight:
              getNumber((fields as Record<string, unknown>)["weight"]) ??
              undefined,
            battery:
              getString((fields as Record<string, unknown>)["battery"]) ??
              undefined,
            inStock: getBoolean(fields.inStock) ?? true,
            stockLevel: getNumber(fields.stockLevel) ?? undefined,
          } as unknown as import("../components/PCBuilder/types").PCBuilderComponent;

        return pcComp;
      });

    setCache(cacheKey, items);
    return items;
  } catch (error: unknown) {
    logger.error("Fetch laptops error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    setCache(cacheKey, []);
    return [];
  }
};

/**
 * Vacancy type for job postings
 */
export interface Vacancy {
  id: string;
  title: string;
  level: string; // e.g., "Senior", "Mid", "Lead"
  type: string; // e.g., "Full-time", "Contract", "Part-time"
  location: string; // e.g., "Hybrid · Norwich / Remote UK"
  summary: string; // Short 1-2 sentence role description
  tags: string[]; // Skills and technologies
  idealFor?: string[]; // Ideal candidate profiles
  description?: string | Document; // Detailed role description (rich text optional)
  displayOrder?: number; // For sorting vacancies
  featured?: boolean; // Highlight on vacancies page
}

/**
 * Business Workstation type for pre-configured business PCs
 */
export interface BusinessWorkstation {
  id: string;
  name: string;
  tagline: string;
  price: number;
  iconEmoji: string;
  imageUrl?: string;
  recommended?: boolean;
  processor: string;
  ram: string;
  storage: string;
  graphics: string;
  cooler?: string;
  motherboard?: string;
  case?: string;
  psu?: string;
  warranty: string;
  operatingSystem: string;
  formFactor?: string;
  features: string[];
  idealFor: string[];
  officePerformance: number;
  creativePerformance: number;
  dataPerformance: number;
  displayOrder?: number;
  featured?: boolean;
}

/**
 * Fetch vacancies from Contentful
 */
type VacancyFields = Record<string, unknown>;
export const fetchVacancies = async (params?: {
  featured?: boolean;
  limit?: number;
}): Promise<Vacancy[]> => {
  // Check cache first
  const cacheKey = "vacancies";
  const cached = getCached<Vacancy[]>(cacheKey);
  if (cached) {
    logger.debug("✅ Vacancies loaded from cache");
    return cached;
  }

  if (!isContentfulEnabled || !contentfulClient) {
    logger.debug("📋 Contentful not enabled, returning mock vacancies");
    return getMockVacancies();
  }

  try {
    logger.debug("🔍 Fetching vacancies from Contentful...", params);

    const query: ContentfulQuery = {
      content_type: "vacancy",
      order: ["fields.displayOrder", "fields.title"] as unknown as string,
      limit: params?.limit || 100,
    };

    if (params?.featured !== undefined) {
      query["fields.featured"] = params.featured;
    }

    const response = (await contentfulClient.getEntries(
      query as unknown as Record<string, unknown>
    )) as unknown as ContentfulResponse<VacancyFields>;

    logger.debug(`📋 Found ${response.items.length} vacancies from CMS`);

    const vacancies = response.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;
      return {
        id: getString(fields.vacancyId) || entry.sys.id,
        title: getString(fields.title) ?? "",
        level: getString(fields.level) ?? "",
        type: getString(fields.type) ?? "",
        location: getString(fields.location) ?? "",
        summary: getRichText(fields.summary) ?? getString(fields.summary) ?? "",
        tags: (getArray(fields.tags) as string[] | undefined) || [],
        idealFor: (getArray(fields.idealFor) as string[] | undefined) || [],
        description: getRichText(fields.description) ?? undefined,
        displayOrder: getNumber(fields.displayOrder) ?? undefined,
        featured: getBoolean(fields.featured) ?? false,
      } as Vacancy;
    });

    // Cache the result
    setCache(cacheKey, vacancies);

    return vacancies;
  } catch (error: unknown) {
    logger.error("Fetch vacancies error:", error);
    return getMockVacancies();
  }
};

/**
 * Fetch business workstations from Contentful
 */
export const fetchBusinessWorkstations = async (params?: {
  featured?: boolean;
  limit?: number;
}): Promise<BusinessWorkstation[]> => {
  if (!isContentfulEnabled || !contentfulClient) {
    return [];
  }

  try {
    const query: ContentfulQuery = {
      content_type: "businessWorkstation",
      limit: params?.limit || 100,
      order: ["fields.displayOrder", "fields.name"] as unknown as string,
    };

    if (params?.featured !== undefined) {
      query["fields.featured"] = params.featured;
    }

    const response = await contentfulClient.getEntries(
      query as unknown as Record<string, unknown>
    );

    const workstations = response.items.map((item) =>
      mapContentfulToWorkstation(
        item,
        response as unknown as ContentfulResponse<unknown>
      )
    );

    return workstations;
  } catch (error: unknown) {
    logger.error("Fetch business workstations error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Helper function to map Contentful entry to BusinessWorkstation
 */
function mapContentfulToWorkstation(
  item: ContentfulEntry,
  response?: ContentfulResponse<unknown>
): BusinessWorkstation {
  const fields = (item.fields || {}) as Record<string, unknown>;
  const workstationName = getString(fields.name) ?? "Unknown";

  // Helper to get image URL from Contentful
  const getImageUrl = (
    imageUrlField: unknown,
    _fieldName?: string
  ): string | undefined => {
    if (!imageUrlField) {
      return undefined;
    }

    // Check if it's a STRING (direct URL)
    const imageUrl = getString(imageUrlField);
    if (imageUrl) {
      return imageUrl;
    }

    // Check if it's an ARRAY of assets (Contentful multi-asset field)
    if (Array.isArray(imageUrlField) && imageUrlField.length > 0) {
      const firstAsset = imageUrlField[0];

      if (firstAsset && typeof firstAsset === "object") {
        const asset = firstAsset as Record<string, unknown>;

        // Try to get URL from inline asset
        if (
          "fields" in asset &&
          asset.fields &&
          typeof asset.fields === "object"
        ) {
          const assetFields = asset.fields as Record<string, unknown>;
          if (assetFields.file && typeof assetFields.file === "object") {
            const file = assetFields.file as Record<string, unknown>;
            const url = getString(file.url);
            if (url) {
              const finalUrl =
                url.startsWith("//") || url.startsWith("http")
                  ? url
                  : `https:${url}`;

              return finalUrl;
            }
          }
        }

        // Try to resolve from includes if it's a reference
        if ("sys" in asset && asset.sys && typeof asset.sys === "object") {
          const sysMeta = asset.sys as Record<string, unknown>;
          const assetId = sysMeta.id as string | undefined;

          if (
            assetId &&
            response?.includes?.Asset &&
            Array.isArray(response.includes.Asset)
          ) {
            const includesAssets = response.includes.Asset as unknown as Array<
              Record<string, unknown>
            >;
            const resolvedAsset = includesAssets.find((a) => {
              const aSys = a.sys as Record<string, string> | undefined;
              return aSys?.id === assetId;
            });

            if (
              resolvedAsset &&
              resolvedAsset.fields &&
              typeof resolvedAsset.fields === "object"
            ) {
              const assetFields = resolvedAsset.fields as Record<
                string,
                unknown
              >;
              if (assetFields.file && typeof assetFields.file === "object") {
                const file = assetFields.file as Record<string, unknown>;
                const url = getString(file.url);
                if (url) {
                  const finalUrl =
                    url.startsWith("//") || url.startsWith("http")
                      ? url
                      : `https:${url}`;
                  return finalUrl;
                }
              }
            }
          }
        }
      }
    }

    // Check if it's a single OBJECT (not an array)
    if (
      imageUrlField &&
      typeof imageUrlField === "object" &&
      !Array.isArray(imageUrlField)
    ) {
      const asset = imageUrlField as Record<string, unknown>;

      // Check if it's a reference (has sys.id) that needs to be resolved from includes
      if ("sys" in asset && asset.sys && typeof asset.sys === "object") {
        const sysMeta = asset.sys as Record<string, unknown>;
        const assetId = sysMeta.id as string | undefined;

        if (
          assetId &&
          response?.includes?.Asset &&
          Array.isArray(response.includes.Asset)
        ) {
          const includesAssets = response.includes.Asset as unknown as Array<
            Record<string, unknown>
          >;
          const resolvedAsset = includesAssets.find((a) => {
            const aSys = a.sys as Record<string, string> | undefined;
            return aSys?.id === assetId;
          });

          if (
            resolvedAsset &&
            resolvedAsset.fields &&
            typeof resolvedAsset.fields === "object"
          ) {
            const assetFields = resolvedAsset.fields as Record<string, unknown>;
            if (assetFields.file && typeof assetFields.file === "object") {
              const file = assetFields.file as Record<string, unknown>;
              const url = getString(file.url);
              if (url) {
                const finalUrl =
                  url.startsWith("//") || url.startsWith("http")
                    ? url
                    : `https:${url}`;
                return finalUrl;
              }
            }
          }
        }
      }

      // Handle nested asset with direct fields.file.url (inline asset)
      if (
        "fields" in asset &&
        asset.fields &&
        typeof asset.fields === "object"
      ) {
        const assetFields = asset.fields as Record<string, unknown>;
        if (assetFields.file && typeof assetFields.file === "object") {
          const file = assetFields.file as Record<string, unknown>;
          const url = getString(file.url);
          if (url) {
            const finalUrl =
              url.startsWith("//") || url.startsWith("http")
                ? url
                : `https:${url}`;
            return finalUrl;
          }
        }
      }
    }
    return undefined;
  };

  const imageUrlFromField =
    getImageUrl(fields.imageUrl, "imageUrl") ||
    getImageUrl(fields.image, "image") ||
    getImageUrl(fields.images, "images");

  return {
    id: getString(fields.workstationId) || item.sys.id,
    name: workstationName,
    tagline: getString(fields.tagline) ?? "",
    price: getNumber(fields.price) ?? 0,
    iconEmoji: getString(fields.iconEmoji) ?? "💼",
    // Prefer explicit imageUrl, then single image, then images array (use first)
    imageUrl: imageUrlFromField,
    recommended: getBoolean(fields.recommended) ?? false,
    processor: getString(fields.processor) ?? "",
    ram: getString(fields.ram) ?? "",
    storage: getString(fields.storage) ?? "",
    graphics: getString(fields.graphics) ?? "",
    cooler: getString(fields.cooler) ?? undefined,
    motherboard: getString(fields.motherboard) ?? undefined,
    case: getString(fields.case) ?? undefined,
    psu: getString(fields.psu) ?? undefined,
    warranty: getString(fields.warranty) ?? "",
    operatingSystem: getString(fields.operatingSystem) ?? "Windows 11 Pro",
    formFactor: getString(fields.formFactor) ?? undefined,
    features: Array.isArray(fields.features)
      ? (fields.features as string[])
      : [],
    idealFor: Array.isArray(fields.idealFor)
      ? (fields.idealFor as string[])
      : [],
    officePerformance: getNumber(fields.officePerformance) ?? 0,
    creativePerformance: getNumber(fields.creativePerformance) ?? 0,
    dataPerformance: getNumber(fields.dataPerformance) ?? 0,
    displayOrder: getNumber(fields.displayOrder) ?? undefined,
    featured: getBoolean(fields.featured) ?? false,
  };
}
