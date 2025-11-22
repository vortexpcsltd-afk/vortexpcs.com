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
}

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

export interface CompanyStats {
  id: number;
  yearsExperience: number;
  customersServed: number;
  pcBuildsCompleted: number;
  warrantyYears: number;
  supportResponseTime: string;
  satisfactionRate: number;
  partsInStock: number;
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
  mainDescription?: string; // Detailed product description from Contentful
  images?: string[];
  inStock?: boolean;
  featured?: boolean;
  stockLevel?: number; // Stock quantity from Contentful

  // Supplier/Admin information (not displayed to customers)
  supplierName?: string;
  costPrice?: number; // What we pay for the product
  profitMargin?: number; // Percentage profit margin
  profitAmount?: number; // GBP profit (price - costPrice)

  // Common fields
  brand?: string;
  model?: string;
  colour?: string;
  color?: string; // Alias for colour
  features?: string[];

  // Case specific
  formFactor?: string;
  gpuClearance?: string;
  coolingSupport?: string;
  style?: string;
  compatibility?: string[];
  maxGpuLength?: number;
  maxCpuCoolerHeight?: number;
  maxPsuLength?: number;
  frontPanelPorts?: string;

  // Motherboard specific
  socket?: string;
  chipset?: string;
  ramSupport?: string;
  maxRam?: number;
  ramSlots?: number;
  pciSlots?: number;
  m2Slots?: number;

  // CPU specific
  cores?: number;
  threads?: number;
  tdp?: number;
  generation?: string;
  platform?: string;

  // GPU specific
  vram?: number;
  power?: number;
  length?: number;
  height?: number;
  slots?: number;
  performance?: string;

  // RAM specific
  capacity?: number;
  speed?: string;
  modules?: number;
  latency?: string;
  type?: string;

  // Storage specific
  storageCapacity?: string;
  interface?: string;
  readSpeed?: string;
  writeSpeed?: string;
  nand?: string;

  // PSU specific
  wattage?: number;
  efficiency?: string;
  modular?: string;
  cables?: string;

  // Cooling specific
  coolerType?: string;
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
  category: string; // keyboard, mouse, monitor, gamepad, mousepad, headset, webcam, microphone, speakers, accessories
  rating?: number;
  description?: string;
  mainDescription?: string; // Long-form description
  features?: string[]; // Array of key features
  techSheet?: string; // URL to tech sheet PDF
  images?: string[];
  inStock?: boolean;
  featured?: boolean;
  stockLevel?: number; // Stock quantity from Contentful

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
  color?: string;

  // Keyboard specific
  switches?: string;
  layout?: string;
  keyCount?: number;

  // Mouse specific
  dpi?: number;
  weight?: number;
  sensor?: string;

  // Monitor specific
  size?: number; // inches
  monitorResolution?: string;
  refreshRate?: number;
  panelType?: string; // IPS, VA, OLED
  curved?: boolean;
  aspectRatio?: string;
  responseTime?: number; // milliseconds

  // Gamepad specific
  platform?: string; // PC, Xbox, PlayStation, Multi-platform
  batteryLife?: string;
  connection?: string;

  // Mousepad specific
  surface?: string; // Cloth, Hard
  dimensions?: string;
  thickness?: number;

  // Audio specific (headset, speakers, microphone)
  frequencyResponse?: string;
  impedance?: number;
  microphone?: boolean;
  surroundSound?: boolean;

  // Webcam/Microphone specific
  resolution?: string; // 1080p, 4K, etc.
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

// -----------------------------
// Safe value helpers (reduce any)
// -----------------------------
const getString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;
const getNumber = (v: unknown): number | undefined =>
  typeof v === "number" && !isNaN(v) ? v : undefined;
const getBoolean = (v: unknown): boolean | undefined =>
  typeof v === "boolean" ? v : undefined;
const getArray = <T = unknown>(v: unknown): T[] | undefined =>
  Array.isArray(v) ? (v as T[]) : undefined;

/**
 * Fetch all products
 */
type ProductEntryFields = Record<string, unknown>;

export const fetchProducts = async (params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> => {
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

    const response = (await contentfulClient!.getEntries(
      query as unknown as Record<string, unknown>
    )) as unknown as ContentfulResponse<ProductEntryFields>;

    return response.items.map((entry) => {
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
  } catch (error: unknown) {
    logger.error("Fetch products error:", error);
    return getMockProducts();
  }
};

/**
 * Fetch single product by ID
 */
export const fetchProduct = async (_id: number): Promise<Product | null> => {
  if (!isContentfulEnabled) {
    return null;
  }

  try {
    const response = (await contentfulClient!.getEntries({
      content_type: "product",
      limit: 1,
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<ProductEntryFields>;

    if (response.items.length === 0) {
      return null;
    }

    const entry = response.items[0];
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
  } catch (error: unknown) {
    logger.error("Fetch product error:", error);
    return null;
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

    const response = (await contentfulClient!.getEntries({
      ...query,
      include: 1, // Include linked assets (images)
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<PCBuildFields> & {
      includes?: {
        Asset?: Array<{
          sys: { id: string };
          fields?: { file?: { url?: string } };
        }>;
      };
    };

    return response.items.map((entry) => {
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
  } catch (error: unknown) {
    logger.error("Fetch PC builds error:", error);
    return getMockPCBuilds();
  }
};

/**
 * Fetch components by type
 */
export const fetchComponents = async (type?: string): Promise<Component[]> => {
  if (!isContentfulEnabled) {
    return getMockComponents(type);
  }

  try {
    const query: ContentfulQuery = {
      content_type: "component",
    };

    if (type) {
      query["fields.type"] = type;
    }

    const response = (await contentfulClient!.getEntries(
      query as unknown as Record<string, unknown>
    )) as unknown as ContentfulResponse<Record<string, unknown>>;

    return response.items.map((entry) => {
      const f = (entry.fields || {}) as Record<string, unknown>;
      return {
        id: getNumericId(entry.sys.id),
        name: getString(f["name"]) ?? "",
        type: getString(f["type"]) ?? "",
        manufacturer: getString(f["manufacturer"]) ?? "",
        price: getNumber(f["price"]) ?? 0,
        stock: getNumber(f["stock"]) ?? 0,
        specs: (f["specs"] as Record<string, unknown> | undefined) || undefined,
      };
    });
  } catch (error: unknown) {
    logger.error("Fetch components error:", error);
    return getMockComponents(type);
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
    const response = (await contentfulClient!.getEntries({
      content_type: "siteSettings",
      limit: 1,
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<SiteSettingsFields> & {
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
  if (!isContentfulEnabled) {
    logger.debug("⚠️ Contentful disabled, using fallback data");
    return null;
  }

  try {
    logger.debug(`🔍 Fetching page content for slug: ${pageSlug}`);
    const response = (await contentfulClient!.getEntries({
      content_type: "pageContent",
      "fields.pageSlug": pageSlug,
      limit: 1,
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<PageContentFields>;

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

    const response = (await contentfulClient!.getEntries(
      query as unknown as Record<string, unknown>
    )) as unknown as ContentfulResponse<FAQItemFields>;

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

    const response = (await contentfulClient!.getEntries(
      query as unknown as Record<string, unknown>
    )) as unknown as ContentfulResponse<ServiceItemFields>;

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

    const response = (await contentfulClient!.getEntries(
      query as unknown as Record<string, unknown>
    )) as unknown as ContentfulResponse<FeatureItemFields>;

    return response.items.map((entry) => {
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
  } catch (error: unknown) {
    logger.error("Fetch feature items error:", error);
    return getMockFeatureItems();
  }
};

/**
 * Fetch company stats
 */
type CompanyStatsFields = Record<string, unknown>;
export const fetchCompanyStats = async (): Promise<CompanyStats | null> => {
  if (!isContentfulEnabled) {
    return getMockCompanyStats();
  }

  try {
    const response = (await contentfulClient!.getEntries({
      content_type: "companyStats",
      limit: 1,
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<CompanyStatsFields>;

    if (response.items.length === 0) {
      return getMockCompanyStats();
    }

    const entry = response.items[0];
    const fields = (entry.fields || {}) as Record<string, unknown>;

    return {
      id: getNumericId(entry.sys.id),
      yearsExperience: getNumber(fields.yearsExperience) ?? 0,
      customersServed: getNumber(fields.customersServed) ?? 0,
      pcBuildsCompleted: getNumber(fields.pcBuildsCompleted) ?? 0,
      warrantyYears: getNumber(fields.warrantyYears) ?? 0,
      supportResponseTime: getString(fields.supportResponseTime) ?? "24 hours",
      satisfactionRate: getNumber(fields.satisfactionRate) ?? 0,
      partsInStock: getNumber(fields.partsInStock) ?? 0,
    };
  } catch (error: unknown) {
    logger.error("Fetch company stats error:", error);
    return getMockCompanyStats();
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

    const response = (await contentfulClient!.getEntries(
      query as unknown as Record<string, unknown>
    )) as unknown as ContentfulResponse<BlogPostFields> & {
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
      total: (response as unknown as { total?: number }).total ?? items.length,
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
    const response = (await contentfulClient!.getEntries({
      content_type: "blogPost",
      "fields.slug": slug,
      limit: 1,
      include: 1,
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<BlogPostFields> & {
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
    const response = (await contentfulClient!.getEntries({
      content_type: "navigationMenu",
      limit: 1,
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<NavigationMenuFields>;

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
      const response = (await contentfulClient!.getEntries({
        content_type: "contactInformation",
        limit: 1,
      } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<ContactInformationFields>;

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
    const response = (await contentfulClient!.getEntries({
      content_type: "pageContent",
      "fields.pageSlug": slug,
      limit: 1,
    } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<LegalPageFields>;

    if (response.items.length === 0) {
      // Fallback: try old legalPage content type for backward compatibility during migration
      try {
        const legacyResponse = (await contentfulClient!.getEntries({
          content_type: "legalPage",
          "fields.pageType": pageType,
          limit: 1,
        } as unknown as Record<string, unknown>)) as unknown as ContentfulResponse<LegalPageFields>;

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
      } catch {
        // legalPage type doesn't exist anymore or failed; fall through to static fallback
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

    return response.items.map((entry) => {
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
    return testimonials;
  } catch (error: unknown) {
    logger.error("Fetch testimonials error:", error);
    return getMockTestimonials();
  }
};

/**
 * Search products and builds
 */
type SearchContentFields = Record<string, unknown>;
export const searchContent = async (
  query: string
): Promise<{
  products: Product[];
  builds: PCBuild[];
}> => {
  if (!isContentfulEnabled) {
    return { products: [], builds: [] };
  }

  try {
    const [productsRes, buildsRes] = await Promise.all([
      contentfulClient!.getEntries({
        content_type: "product",
        query: query,
      } as unknown as Record<string, unknown>) as unknown as Promise<
        ContentfulResponse<SearchContentFields>
      >,
      contentfulClient!.getEntries({
        content_type: "pcBuild",
        query: query,
      } as unknown as Record<string, unknown>) as unknown as Promise<
        ContentfulResponse<SearchContentFields>
      >,
    ]);

    const products = productsRes.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;
      return {
        id: getNumericId(entry.sys.id),
        name: getString(fields.name) ?? "",
        description: getString(fields.description) ?? "",
        price: getNumber(fields.price) ?? 0,
        category: getString(fields.category) ?? "",
        stock: getNumber(fields.stock) ?? 0,
        featured: getBoolean(fields.featured) ?? false,
        specs: fields.specs as Record<string, unknown> | undefined,
        images: getArray(fields.images) as string[] | undefined,
      };
    });

    const builds = buildsRes.items.map((entry) => {
      const fields = (entry.fields || {}) as Record<string, unknown>;
      return {
        id: getNumericId(entry.sys.id),
        name: getString(fields.name) ?? "",
        description: getString(fields.description) ?? "",
        price: getNumber(fields.price) ?? 0,
        category: getString(fields.category) ?? "",
        featured: getBoolean(fields.featured) ?? false,
        components:
          (fields.components as Record<string, string> | undefined) || {},
        images: getArray(fields.images) as string[] | undefined,
      };
    });

    return { products, builds };
  } catch (error: unknown) {
    logger.error("Search content error:", error);
    return { products: [], builds: [] };
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

function getMockComponents(type?: string): Component[] {
  const allComponents: Component[] = [
    {
      id: 1,
      name: "AMD Ryzen 9 7950X",
      type: "CPU",
      manufacturer: "AMD",
      price: 549,
      stock: 15,
    },
    {
      id: 2,
      name: "Intel Core i9-14900K",
      type: "CPU",
      manufacturer: "Intel",
      price: 589,
      stock: 12,
    },
    {
      id: 3,
      name: "NVIDIA RTX 4090",
      type: "GPU",
      manufacturer: "NVIDIA",
      price: 1599,
      stock: 5,
    },
    {
      id: 4,
      name: "NVIDIA RTX 4080",
      type: "GPU",
      manufacturer: "NVIDIA",
      price: 1199,
      stock: 8,
    },
    {
      id: 5,
      name: "G.Skill Trident Z5 32GB",
      type: "RAM",
      manufacturer: "G.Skill",
      price: 189,
      stock: 25,
    },
    {
      id: 6,
      name: "Samsung 990 Pro 2TB",
      type: "Storage",
      manufacturer: "Samsung",
      price: 199,
      stock: 30,
    },
  ];

  if (type) {
    return allComponents.filter((c) => c.type === type);
  }

  return allComponents;
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

function getMockCompanyStats(): CompanyStats {
  return {
    id: 1,
    yearsExperience: 10,
    customersServed: 2500,
    pcBuildsCompleted: 5000,
    warrantyYears: 1,
    supportResponseTime: "24 hours",
    satisfactionRate: 98,
    partsInStock: 1000,
  };
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
      include: 1, // Include linked assets (images)
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
        } catch {
          logger.debug(`ℹ️ No ${category} content type found, skipping...`);
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

  return {
    id: getString(fields.componentId) || getString(fields.id) || item.sys.id,
    name: getString(fields.name) ?? "",
    price: getNumber(fields.price) ?? 0,
    category: category,
    rating: getNumber(fields.rating) ?? undefined,
    description: getString(fields.description) ?? undefined,
    mainDescription: getString(fields.mainDescription) ?? undefined,
    images: images,
    inStock: getBoolean(fields.inStock) ?? true,
    featured: getBoolean(fields.featured) ?? false,
    stockLevel: getNumber(fields.stockLevel) ?? undefined,

    // Supplier/Admin information
    supplierName: getString(fields.supplierName) ?? undefined,
    costPrice: getNumber(fields.costPrice) ?? undefined,
    profitMargin: getNumber(fields.profitMargin) ?? undefined,
    profitAmount: getNumber(fields.profitAmount) ?? undefined,

    // Common fields across all components
    brand: getString(fields.brand) ?? undefined,
    model: getString(fields.model) ?? undefined,
    colour: getString(fields.colour) || getString(fields.color) || undefined,
    color: getString(fields.color) || getString(fields.colour) || undefined,
    features: getArray(fields.features) as string[] | undefined,

    // Case fields
    formFactor: getString(fields.formFactor) ?? undefined,
    gpuClearance: getString(fields.gpuClearance) ?? undefined,
    coolingSupport: getString(fields.coolingSupport) ?? undefined,
    style: getString(fields.style) ?? undefined,
    compatibility: getArray(fields.compatibility) as string[] | undefined,
    maxGpuLength: getNumber(fields.maxGpuLength) ?? undefined,
    maxCpuCoolerHeight:
      getNumber(fields.maxCpuCoolerHeight) ||
      getNumber(fields.maxCoolerHeight) ||
      undefined,
    maxPsuLength: getNumber(fields.maxPsuLength) ?? undefined,
    frontPanelPorts: getString(fields.frontPanelPorts) ?? undefined,

    // Motherboard fields
    socket: getString(fields.socket) ?? undefined,
    chipset: getString(fields.chipset) ?? undefined,
    ramSupport: getString(fields.ramSupport) ?? undefined,
    maxRam: getNumber(fields.maxRam) ?? undefined,
    ramSlots: getNumber(fields.ramSlots) ?? undefined,
    pciSlots: getNumber(fields.pciSlots) ?? undefined,
    m2Slots: getNumber(fields.m2Slots) ?? undefined,

    // CPU fields
    cores: getNumber(fields.cores) ?? undefined,
    threads: getNumber(fields.threads) ?? undefined,
    tdp: getNumber(fields.tdp) ?? undefined,
    generation: getString(fields.generation) ?? undefined,
    platform: getString(fields.platform) ?? undefined,

    // GPU fields
    vram: getNumber(fields.vram) ?? undefined,
    power: getNumber(fields.power) ?? undefined,
    length: getNumber(fields.length) ?? undefined,
    height: getNumber(fields.height) ?? undefined,
    slots: getNumber(fields.slots) ?? undefined,
    performance: getString(fields.performance) ?? undefined,

    // RAM fields
    capacity: getNumber(fields.capacity) ?? undefined,
    speed: getString(fields.speed) ?? undefined,
    modules: getNumber(fields.modules) ?? undefined,
    latency: getString(fields.latency) ?? undefined,
    type: getString(fields.type) ?? undefined,

    // Storage fields
    storageCapacity: getString(fields.storageCapacity) ?? undefined,
    interface: getString(fields.interface) ?? undefined,
    readSpeed: getString(fields.readSpeed) ?? undefined,
    writeSpeed: getString(fields.writeSpeed) ?? undefined,
    nand: getString(fields.nand) ?? undefined,

    // PSU fields
    wattage: getNumber(fields.wattage) ?? undefined,
    efficiency: getString(fields.efficiency) ?? undefined,
    modular: getString(fields.modular) ?? undefined,
    cables: getString(fields.cables) ?? undefined,

    // Cooling fields
    coolerType: getString(fields.coolerType) ?? undefined,
    fanSize: getString(fields.fanSize) ?? undefined,
    tdpSupport: getNumber(fields.tdpSupport) ?? undefined,
    radiatorSize: getString(fields.radiatorSize) ?? undefined,
    rgbLighting: getBoolean(fields.rgbLighting) ?? undefined,

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
      limit: params?.limit || 100,
      include: 1, // Include linked assets (images)
    };

    if (params?.featured !== undefined) {
      query["fields.featured"] = params.featured;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await contentfulClient.getEntries(
      query as unknown as Record<string, unknown>
    );
    logger.debug(`📦 Found ${response.items.length} optional extras from CMS`);

    const extras = response.items.map((item) =>
      mapContentfulToOptionalExtra(
        item,
        response.includes as unknown as ContentfulResponse["includes"]
      )
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

  return {
    id: getString(fields.extraId) || getString(fields.id) || item.sys.id,
    name: getString(fields.name) ?? "",
    price: getNumber(fields.price) ?? 0,
    category: getString(fields.category) ?? "",
    rating: getNumber(fields.rating) ?? undefined,
    description: getString(fields.description) ?? undefined,
    mainDescription: getString(fields.mainDescription) ?? undefined,
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
    connection: getString(fields.connection) ?? undefined,

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
