/**
 * Contentful CMS Service
 * Handles all CMS data fetching for products, builds, blog posts, etc.
 */

import { contentfulClient, isContentfulEnabled } from "../config/contentful";

// Debug logging
console.log("🔧 CMS Service initialized");
console.log("🔧 Contentful enabled:", isContentfulEnabled);
console.log(
  "🔧 Contentful client:",
  contentfulClient ? "✅ Created" : "❌ Not created"
);

// Re-export all interfaces from original cms.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  featured?: boolean;
  specs?: Record<string, any>;
  images?: any[];
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
  images?: any[];
}

export interface Component {
  id: number;
  name: string;
  type: string;
  manufacturer: string;
  price: number;
  stock: number;
  specs?: Record<string, any>;
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
  heroBackgroundImage?: any;
  heroButtons?: Array<{
    text: string;
    link: string;
    style: string;
  }>;
  sections?: Array<any>;
  seo?: Record<string, any>;
  lastUpdated?: string;
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

export interface TeamMember {
  id: number;
  name: string;
  position: string;
  bio?: string;
  image?: any;
  email?: string;
  specialties?: Array<string>;
  order: number;
  featured: boolean;
  yearsExperience?: number;
  certifications?: Array<string>;
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
}

// PC Builder Component Interface
export interface PCComponent {
  id: string;
  name: string;
  price: number;
  category: string; // case, motherboard, cpu, gpu, ram, storage, psu, cooling
  rating?: number;
  description?: string;
  images?: string[];
  inStock?: boolean;
  featured?: boolean;

  // Case specific
  formFactor?: string;
  gpuClearance?: string;
  coolingSupport?: string;
  style?: string;
  compatibility?: string[];
  maxGpuLength?: number;
  maxCpuCoolerHeight?: number;
  maxPsuLength?: number;

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
}

// PC Optional Extra Interface
export interface PCOptionalExtra {
  id: string;
  name: string;
  price: number;
  category: string; // keyboard, mouse, monitor, gamepad, mousepad, headset, webcam, microphone, speakers, accessories
  rating?: number;
  description?: string;
  images?: string[];
  inStock?: boolean;
  featured?: boolean;

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
  customerImage?: any;
}

/**
 * Helper: Convert Contentful ID to numeric ID
 */
const getNumericId = (contentfulId: string): number => {
  return parseInt(contentfulId.slice(0, 8), 16);
};

/**
 * Fetch all products
 */
export const fetchProducts = async (params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> => {
  if (!isContentfulEnabled) {
    return getMockProducts();
  }

  try {
    const query: any = {
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

    const response = await contentfulClient!.getEntries(query);

    return response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        name: fields.name,
        description: fields.description,
        price: fields.price,
        category: fields.category,
        stock: fields.stock || 0,
        featured: fields.featured,
        specs: fields.specs,
        images: fields.images,
      };
    });
  } catch (error: any) {
    console.error("Fetch products error:", error);
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
    const response = await contentfulClient!.getEntries({
      content_type: "product",
      limit: 1,
    });

    if (response.items.length === 0) {
      return null;
    }

    const entry = response.items[0];
    const fields = entry.fields as any;

    return {
      id: getNumericId(entry.sys.id),
      name: fields.name,
      description: fields.description,
      price: fields.price,
      category: fields.category,
      stock: fields.stock || 0,
      featured: fields.featured,
      specs: fields.specs,
      images: fields.images,
    };
  } catch (error: any) {
    console.error("Fetch product error:", error);
    return null;
  }
};

/**
 * Fetch all PC builds
 */
export const fetchPCBuilds = async (params?: {
  category?: string;
  featured?: boolean;
}): Promise<PCBuild[]> => {
  if (!isContentfulEnabled) {
    return getMockPCBuilds();
  }

  try {
    const query: any = {
      content_type: "pcBuild",
    };

    if (params?.featured) {
      query["fields.featured"] = true;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await contentfulClient!.getEntries({
      ...query,
      include: 1, // Include linked assets (images)
    });

    return response.items.map((entry) => {
      const fields = entry.fields as any;

      // Process images - resolve asset links from includes
      let images: string[] = [];
      if (fields.images && Array.isArray(fields.images)) {
        images = fields.images
          .map((img: any) => {
            if (img.sys?.linkType === "Asset" && response.includes?.Asset) {
              const asset = response.includes.Asset.find(
                (a: any) => a.sys.id === img.sys.id
              );
              return asset?.fields?.file?.url
                ? `https:${asset.fields.file.url}`
                : null;
            }
            return img.fields?.file?.url
              ? `https:${img.fields.file.url}`
              : null;
          })
          .filter(Boolean);
      } else if (fields.image && fields.image.fields?.file?.url) {
        // Single image field fallback
        images = [`https:${fields.image.fields.file.url}`];
      }

      return {
        id: getNumericId(entry.sys.id),
        name: fields.name,
        description: fields.description,
        price: fields.price,
        category: fields.category,
        featured: fields.featured,
        components: fields.components || {},
        images: images,
      };
    });
  } catch (error: any) {
    console.error("Fetch PC builds error:", error);
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
    const query: any = {
      content_type: "component",
    };

    if (type) {
      query["fields.type"] = type;
    }

    const response = await contentfulClient!.getEntries(query);

    return response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        name: fields.name,
        type: fields.type,
        manufacturer: fields.manufacturer,
        price: fields.price,
        stock: fields.stock || 0,
        specs: fields.specs,
      };
    });
  } catch (error: any) {
    console.error("Fetch components error:", error);
    return getMockComponents(type);
  }
};

/**
 * Fetch all categories
 */
export const fetchCategories = async (): Promise<Category[]> => {
  if (!isContentfulEnabled) {
    return getMockCategories();
  }

  try {
    const response = await contentfulClient!.getEntries({
      content_type: "category",
    });

    const categories = response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        name: fields.name,
        description: fields.description,
        slug: fields.slug,
      };
    });

    console.log("✅ Contentful categories fetched:", categories);
    return categories;
  } catch (error: any) {
    console.error("Fetch categories error:", error);
    return getMockCategories();
  }
};

/**
 * Fetch site settings
 */
export const fetchSettings = async (): Promise<Settings | null> => {
  if (!isContentfulEnabled) {
    return getMockSettings();
  }

  try {
    const response = await contentfulClient!.getEntries({
      content_type: "siteSettings",
      limit: 1,
    });

    if (response.items.length === 0) {
      return getMockSettings();
    }

    const entry = response.items[0];
    const fields = entry.fields as any;

    const settings = {
      id: getNumericId(entry.sys.id),
      siteName: fields.siteName || "Vortex PCs",
      logoUrl: fields.logoUrl,
      tagline: fields.tagline || "",
      metaDescription: fields.metaDescription || "",
      socialLinks: fields.socialLinks,
      businessHours: fields.businessHours,
      enableMaintenance: fields.enableMaintenance || false,
      maintenanceMessage: fields.maintenanceMessage,
      announcementBar: fields.announcementBar,
      enableAnnouncementBar: fields.enableAnnouncementBar || false,
      contactEmail: fields.contactEmail || "",
      contactPhone: fields.contactPhone || "",
      whatsappNumber: fields.whatsappNumber,
    };

    console.log("✅ Contentful settings fetched:", settings);
    return settings;
  } catch (error: any) {
    console.error("Fetch settings error:", error);
    return getMockSettings();
  }
};

/**
 * Fetch page content by slug
 */
export const fetchPageContent = async (
  pageSlug: string
): Promise<PageContent | null> => {
  if (!isContentfulEnabled) {
    console.log("⚠️ Contentful disabled, using fallback data");
    return null;
  }

  try {
    console.log(`🔍 Fetching page content for slug: ${pageSlug}`);
    const response = await contentfulClient!.getEntries({
      content_type: "pageContent",
      "fields.pageSlug": pageSlug,
      limit: 1,
    });

    if (response.items.length === 0) {
      console.log("📄 No page content found");
      return null;
    }

    const entry = response.items[0];
    const fields = entry.fields as any;

    const result: PageContent = {
      id: getNumericId(entry.sys.id),
      pageSlug: fields.pageSlug,
      pageTitle: fields.pageTitle,
      metaDescription: fields.metaDescription,
      heroTitle: fields.heroTitle,
      heroSubtitle: fields.heroSubtitle,
      heroDescription: fields.heroDescription,
      heroBadgeText: fields.heroBadgeText,
      featuresTitle: fields.featuresTitle,
      featuresDescription: fields.featuresDescription,
      ctaBadgeText: fields.ctaBadgeText,
      ctaTitle: fields.ctaTitle,
      ctaDescription: fields.ctaDescription,
      heroBackgroundImage: fields.heroBackgroundImage,
      heroButtons: fields.heroButtons,
      sections: fields.sections,
      seo: fields.seo,
      lastUpdated: entry.sys.updatedAt,
    };

    console.log("📄 Page content result:", result);
    return result;
  } catch (error: any) {
    console.error("Fetch page content error:", error);
    return null;
  }
};

/**
 * Fetch all FAQ items
 */
export const fetchFAQItems = async (params?: {
  category?: string;
  featured?: boolean;
}): Promise<FAQItem[]> => {
  if (!isContentfulEnabled) {
    return getMockFAQItems();
  }

  try {
    const query: any = {
      content_type: "faqItem",
      order: ["fields.order"],
    };

    if (params?.featured) {
      query["fields.featured"] = true;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await contentfulClient!.getEntries(query);

    return response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        question: fields.question,
        answer: fields.answer,
        category: fields.category,
        order: fields.order || 0,
        featured: fields.featured || false,
        keywords: fields.keywords,
        lastUpdated: entry.sys.updatedAt,
      };
    });
  } catch (error: any) {
    console.error("Fetch FAQ items error:", error);
    return getMockFAQItems();
  }
};

/**
 * Fetch all service items
 */
export const fetchServiceItems = async (params?: {
  category?: string;
  available?: boolean;
}): Promise<ServiceItem[]> => {
  if (!isContentfulEnabled) {
    return getMockServiceItems();
  }

  try {
    const query: any = {
      content_type: "serviceItem",
      order: ["fields.order"],
    };

    if (params?.available !== undefined) {
      query["fields.available"] = params.available;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await contentfulClient!.getEntries(query);

    return response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        serviceName: fields.serviceName,
        description: fields.description,
        price: fields.price,
        priceText: fields.priceText,
        duration: fields.duration,
        category: fields.category,
        features: fields.features || [],
        icon: fields.icon,
        popular: fields.popular || false,
        available: fields.available !== false,
        order: fields.order || 0,
      };
    });
  } catch (error: any) {
    console.error("Fetch service items error:", error);
    return getMockServiceItems();
  }
};

/**
 * Fetch all feature items
 */
export const fetchFeatureItems = async (params?: {
  category?: string;
  showOnHomepage?: boolean;
}): Promise<FeatureItem[]> => {
  if (!isContentfulEnabled) {
    return getMockFeatureItems();
  }

  try {
    const query: any = {
      content_type: "featureItem",
      order: ["fields.order"],
    };

    if (params?.showOnHomepage !== undefined) {
      query["fields.showOnHomepage"] = params.showOnHomepage;
    }
    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await contentfulClient!.getEntries(query);

    return response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        title: fields.title,
        description: fields.description,
        icon: fields.icon,
        category: fields.category,
        order: fields.order || 0,
        highlighted: fields.highlighted || false,
        link: fields.link,
        showOnHomepage: fields.showOnHomepage || false,
      };
    });
  } catch (error: any) {
    console.error("Fetch feature items error:", error);
    return getMockFeatureItems();
  }
};

/**
 * Fetch all team members
 */
export const fetchTeamMembers = async (params?: {
  featured?: boolean;
}): Promise<TeamMember[]> => {
  if (!isContentfulEnabled) {
    return getMockTeamMembers();
  }

  try {
    const query: any = {
      content_type: "teamMember",
      order: ["fields.order"],
    };

    if (params?.featured) {
      query["fields.featured"] = true;
    }

    const response = await contentfulClient!.getEntries(query);

    return response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        name: fields.name,
        position: fields.position,
        bio: fields.bio,
        image: fields.image,
        email: fields.email,
        specialties: fields.specialties || [],
        order: fields.order || 0,
        featured: fields.featured || false,
        yearsExperience: fields.yearsExperience,
        certifications: fields.certifications || [],
      };
    });
  } catch (error: any) {
    console.error("Fetch team members error:", error);
    return getMockTeamMembers();
  }
};

/**
 * Fetch company stats
 */
export const fetchCompanyStats = async (): Promise<CompanyStats | null> => {
  if (!isContentfulEnabled) {
    return getMockCompanyStats();
  }

  try {
    const response = await contentfulClient!.getEntries({
      content_type: "companyStats",
      limit: 1,
    });

    if (response.items.length === 0) {
      return getMockCompanyStats();
    }

    const entry = response.items[0];
    const fields = entry.fields as any;

    return {
      id: getNumericId(entry.sys.id),
      yearsExperience: fields.yearsExperience || 0,
      customersServed: fields.customersServed || 0,
      pcBuildsCompleted: fields.pcBuildsCompleted || 0,
      warrantyYears: fields.warrantyYears || 0,
      supportResponseTime: fields.supportResponseTime || "24 hours",
      satisfactionRate: fields.satisfactionRate || 0,
      partsInStock: fields.partsInStock || 0,
    };
  } catch (error: any) {
    console.error("Fetch company stats error:", error);
    return getMockCompanyStats();
  }
};

/**
 * Fetch navigation menu
 */
export const fetchNavigationMenu = async (): Promise<NavigationMenu | null> => {
  if (!isContentfulEnabled) {
    return getMockNavigationMenu();
  }

  try {
    const response = await contentfulClient!.getEntries({
      content_type: "navigationMenu",
      limit: 1,
    });

    if (response.items.length === 0) {
      return getMockNavigationMenu();
    }

    const entry = response.items[0];
    const fields = entry.fields as any;

    return {
      id: getNumericId(entry.sys.id),
      primaryMenu: fields.primaryMenu || [],
      footerMenu: fields.footerMenu || [],
      mobileMenu: fields.mobileMenu || [],
      ctaButton: fields.ctaButton || { text: "", link: "", style: "" },
    };
  } catch (error: any) {
    console.error("Fetch navigation menu error:", error);
    return getMockNavigationMenu();
  }
};

/**
 * Fetch contact information
 */
export const fetchContactInformation =
  async (): Promise<ContactInformation | null> => {
    if (!isContentfulEnabled) {
      return getMockContactInformation();
    }

    try {
      const response = await contentfulClient!.getEntries({
        content_type: "contactInformation",
        limit: 1,
      });

      if (response.items.length === 0) {
        return getMockContactInformation();
      }

      const entry = response.items[0];
      const fields = entry.fields as any;

      return {
        id: getNumericId(entry.sys.id),
        companyName: fields.companyName,
        email: fields.email,
        phone: fields.phone,
        whatsapp: fields.whatsapp,
        address: fields.address,
        mapEmbedUrl: fields.mapEmbedUrl,
        businessHours: fields.businessHours,
        emergencyContact: fields.emergencyContact,
        supportEmail: fields.supportEmail,
      };
    } catch (error: any) {
      console.error("Fetch contact information error:", error);
      return getMockContactInformation();
    }
  };

/**
 * Fetch legal page by type
 */
export const fetchLegalPage = async (
  pageType: "terms" | "privacy" | "cookies"
): Promise<LegalPage | null> => {
  if (!isContentfulEnabled) {
    return getMockLegalPage(pageType);
  }

  try {
    const response = await contentfulClient!.getEntries({
      content_type: "legalPage",
      "fields.pageType": pageType,
      limit: 1,
    });

    if (response.items.length === 0) {
      return getMockLegalPage(pageType);
    }

    const entry = response.items[0];
    const fields = entry.fields as any;

    return {
      id: getNumericId(entry.sys.id),
      pageType: fields.pageType,
      title: fields.title,
      content: fields.content,
      lastUpdated: entry.sys.updatedAt,
      effectiveDate: fields.effectiveDate,
      version: fields.version,
    };
  } catch (error: any) {
    console.error("Fetch legal page error:", error);
    return getMockLegalPage(pageType);
  }
};

/**
 * Fetch pricing tiers
 */
export const fetchPricingTiers = async (params?: {
  category?: string;
}): Promise<PricingTier[]> => {
  if (!isContentfulEnabled) {
    return getMockPricingTiers();
  }

  try {
    const query: any = {
      content_type: "pricingTier",
      order: ["fields.order"],
    };

    if (params?.category) {
      query["fields.category"] = params.category;
    }

    const response = await contentfulClient!.getEntries(query);

    return response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        tierName: fields.tierName,
        price: fields.price,
        currency: fields.currency || "GBP",
        interval: fields.interval,
        features: fields.features || [],
        popular: fields.popular || false,
        order: fields.order || 0,
        ctaText: fields.ctaText,
        description: fields.description,
        category: fields.category,
      };
    });
  } catch (error: any) {
    console.error("Fetch pricing tiers error:", error);
    return getMockPricingTiers();
  }
};

/**
 * Fetch testimonials
 */
export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  if (!isContentfulEnabled) {
    return getMockTestimonials();
  }

  try {
    const response = await contentfulClient!.getEntries({
      content_type: "testimonial",
      order: ["-sys.createdAt"],
    });

    const testimonials = response.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        customerName: fields.customerName,
        rating: fields.rating || 5,
        review: fields.review,
        productName: fields.productName,
        customerImage: fields.customerImage,
      };
    });

    console.log("✅ Contentful testimonials fetched:", testimonials);
    return testimonials;
  } catch (error: any) {
    console.error("Fetch testimonials error:", error);
    return getMockTestimonials();
  }
};

/**
 * Search products and builds
 */
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
      }),
      contentfulClient!.getEntries({
        content_type: "pcBuild",
        query: query,
      }),
    ]);

    const products = productsRes.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        name: fields.name,
        description: fields.description,
        price: fields.price,
        category: fields.category,
        stock: fields.stock || 0,
        featured: fields.featured,
        specs: fields.specs,
        images: fields.images,
      };
    });

    const builds = buildsRes.items.map((entry) => {
      const fields = entry.fields as any;
      return {
        id: getNumericId(entry.sys.id),
        name: fields.name,
        description: fields.description,
        price: fields.price,
        category: fields.category,
        featured: fields.featured,
        components: fields.components || {},
        images: fields.images,
      };
    });

    return { products, builds };
  } catch (error: any) {
    console.error("Search content error:", error);
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

function getMockCategories(): Category[] {
  return [
    {
      id: 1,
      name: "Budget PCs",
      description: "Affordable gaming and office PCs",
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
      description: "Professional workstations for creators",
      slug: "workstation-pcs",
    },
  ];
}

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
    contactEmail: "info@vortexpcs.co.uk",
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

function getMockTeamMembers(): TeamMember[] {
  return [
    {
      id: 1,
      name: "James Wilson",
      position: "Lead PC Builder",
      bio: "10+ years of experience in custom PC building and hardware optimization",
      email: "james@vortexpcs.co.uk",
      specialties: ["Gaming PCs", "Workstations", "Custom Cooling"],
      order: 1,
      featured: true,
      yearsExperience: 10,
      certifications: ["CompTIA A+", "Intel Certified"],
    },
    {
      id: 2,
      name: "Sarah Chen",
      position: "Hardware Specialist",
      bio: "Expert in component selection and compatibility analysis",
      email: "sarah@vortexpcs.co.uk",
      specialties: [
        "Component Selection",
        "Compatibility",
        "Performance Tuning",
      ],
      order: 2,
      featured: true,
      yearsExperience: 7,
      certifications: ["AMD Certified", "NVIDIA Partner"],
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
    email: "info@vortexpcs.co.uk",
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
    supportEmail: "support@vortexpcs.co.uk",
  };
}

function getMockLegalPage(
  pageType: "terms" | "privacy" | "cookies"
): LegalPage {
  const pageData = {
    terms: {
      title: "Terms of Service",
      content:
        "These terms of service govern your use of our website and services...",
    },
    privacy: {
      title: "Privacy Policy",
      content:
        "This privacy policy explains how we collect and use your personal information...",
    },
    cookies: {
      title: "Cookie Policy",
      content:
        "This cookie policy explains how we use cookies and similar technologies...",
    },
  };

  return {
    id: 1,
    pageType,
    title: pageData[pageType].title,
    content: pageData[pageType].content,
    lastUpdated: new Date().toISOString(),
    effectiveDate: new Date().toISOString().split("T")[0],
    version: "1.0",
  };
}

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
    console.log("📦 Contentful not enabled, returning empty components array");
    return [];
  }

  try {
    console.log("🔍 Fetching PC components from Contentful...", params);

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
    };

    const query: any = {
      limit: params?.limit || 100,
      include: 1, // Include linked assets (images)
    };

    // If category specified, use specific content type, otherwise fetch all types
    if (params?.category) {
      const contentType = contentTypeMap[params.category];
      if (!contentType) {
        console.warn(`Unknown category: ${params.category}`);
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
      const response = await contentfulClient.getEntries(query);
      console.log(
        `📦 Found ${response.items.length} ${params.category} components`
      );
      allComponents = response.items.map((item: any) =>
        mapContentfulToComponent(item, params.category!, response.includes)
      );

      // Log sample component for debugging
      if (allComponents.length > 0) {
        console.log(`🔍 Sample ${params.category} component:`, {
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
          const categoryQuery = { ...query, content_type: contentType };
          const response = await contentfulClient.getEntries(categoryQuery);
          console.log(
            `📦 Found ${response.items.length} ${category} components`
          );
          const components = response.items.map((item: any) =>
            mapContentfulToComponent(item, category, response.includes)
          );
          allComponents = [...allComponents, ...components];
        } catch (error) {
          console.log(`ℹ️ No ${category} content type found, skipping...`);
        }
      }
    }

    // Log sample component to debug image issues
    if (allComponents.length > 0) {
      console.log("🔍 Sample component data:", {
        id: allComponents[0].id,
        name: allComponents[0].name,
        imagesCount: allComponents[0].images?.length || 0,
        firstImage:
          allComponents[0].images?.[0]?.substring(0, 50) + "..." || "none",
      });
    }

    return allComponents;
  } catch (error: any) {
    console.error("Fetch PC components error:", error);
    console.error("Error details:", error.message);
    return [];
  }
};

/**
 * Helper function to map Contentful entry to PCComponent
 */
function mapContentfulToComponent(
  item: any,
  category: string,
  includes?: any
): PCComponent {
  const fields = item.fields;

  // Process images - resolve asset links from includes
  let images: string[] = [];
  if (fields.images && Array.isArray(fields.images)) {
    // Multiple images field (plural)
    images = fields.images
      .map((img: any) => {
        if (img.sys?.linkType === "Asset" && includes?.Asset) {
          const asset = includes.Asset.find(
            (a: any) => a.sys.id === img.sys.id
          );
          return asset?.fields?.file?.url
            ? `https:${asset.fields.file.url}`
            : null;
        }
        return img.fields?.file?.url ? `https:${img.fields.file.url}` : null;
      })
      .filter(Boolean);
  } else if (fields.image && Array.isArray(fields.image)) {
    // Multiple images field named "image" (singular but array)
    images = fields.image
      .map((img: any) => {
        if (img.sys?.linkType === "Asset" && includes?.Asset) {
          const asset = includes.Asset.find(
            (a: any) => a.sys.id === img.sys.id
          );
          return asset?.fields?.file?.url
            ? `https:${asset.fields.file.url}`
            : null;
        }
        return img.fields?.file?.url ? `https:${img.fields.file.url}` : null;
      })
      .filter(Boolean);
  } else if (fields.image && fields.image.fields?.file?.url) {
    // Single image field
    images = [`https:${fields.image.fields.file.url}`];
  }

  return {
    id: fields.componentId || fields.id || item.sys.id,
    name: fields.name,
    price: fields.price || 0,
    category: category,
    rating: fields.rating,
    description: fields.description,
    images: images,
    inStock: fields.inStock !== false,
    featured: fields.featured || false,

    // Case fields
    formFactor: fields.formFactor,
    gpuClearance: fields.gpuClearance,
    coolingSupport: fields.coolingSupport,
    style: fields.style,
    compatibility: fields.compatibility,
    maxGpuLength: fields.maxGpuLength,
    maxCpuCoolerHeight: fields.maxCpuCoolerHeight || fields.maxCoolerHeight,
    maxPsuLength: fields.maxPsuLength,

    // Motherboard fields
    socket: fields.socket,
    chipset: fields.chipset,
    ramSupport: fields.ramSupport,
    maxRam: fields.maxRam,
    ramSlots: fields.ramSlots,
    pciSlots: fields.pciSlots,
    m2Slots: fields.m2Slots,

    // CPU fields
    cores: fields.cores,
    threads: fields.threads,
    tdp: fields.tdp,
    generation: fields.generation,
    platform: fields.platform,

    // GPU fields
    vram: fields.vram,
    power: fields.power,
    length: fields.length,
    height: fields.height,
    slots: fields.slots,
    performance: fields.performance,

    // RAM fields
    capacity: fields.capacity,
    speed: fields.speed,
    modules: fields.modules,
    latency: fields.latency,
    type: fields.type,

    // Storage fields
    storageCapacity: fields.storageCapacity,
    interface: fields.interface,
    readSpeed: fields.readSpeed,
    writeSpeed: fields.writeSpeed,
    nand: fields.nand,

    // PSU fields
    wattage: fields.wattage,
    efficiency: fields.efficiency,
    modular: fields.modular,
    cables: fields.cables,

    // Cooling fields
    coolerType: fields.coolerType,
    fanSize: fields.fanSize,
    tdpSupport: fields.tdpSupport,
    radiatorSize: fields.radiatorSize,
    rgbLighting: fields.rgbLighting,
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
    console.log(
      "📦 Contentful not enabled, returning empty optional extras array"
    );
    return [];
  }

  try {
    console.log("🔍 Fetching PC optional extras from Contentful...", params);

    const query: any = {
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

    const response = await contentfulClient.getEntries(query);
    console.log(`📦 Found ${response.items.length} optional extras from CMS`);

    const extras = response.items.map((item: any) =>
      mapContentfulToOptionalExtra(item, response.includes)
    );

    // Log sample extra for debugging
    if (extras.length > 0) {
      console.log("🔍 Sample optional extra:", {
        id: extras[0].id,
        name: extras[0].name,
        category: extras[0].category,
        imagesCount: extras[0].images?.length || 0,
      });
    }

    return extras;
  } catch (error: any) {
    console.error("Fetch PC optional extras error:", error);
    console.error("Error details:", error.message);
    return [];
  }
};

/**
 * Helper function to map Contentful entry to PCOptionalExtra
 */
function mapContentfulToOptionalExtra(
  item: any,
  includes?: any
): PCOptionalExtra {
  const fields = item.fields;

  // Process images - resolve asset links from includes
  let images: string[] = [];
  if (fields.images && Array.isArray(fields.images)) {
    images = fields.images
      .map((img: any) => {
        if (img.sys?.linkType === "Asset" && includes?.Asset) {
          const asset = includes.Asset.find(
            (a: any) => a.sys.id === img.sys.id
          );
          return asset?.fields?.file?.url
            ? `https:${asset.fields.file.url}`
            : null;
        }
        return img.fields?.file?.url ? `https:${img.fields.file.url}` : null;
      })
      .filter(Boolean);
  } else if (fields.image && fields.image.fields?.file?.url) {
    images = [`https:${fields.image.fields.file.url}`];
  }

  return {
    id: fields.extraId || fields.id || item.sys.id,
    name: fields.name,
    price: fields.price || 0,
    category: fields.category,
    rating: fields.rating,
    description: fields.description,
    images: images,
    inStock: fields.inStock !== false,
    featured: fields.featured || false,

    // Common fields
    type: fields.type,
    wireless: fields.wireless,
    rgb: fields.rgb,
    brand: fields.brand,
    color: fields.color,

    // Keyboard specific
    switches: fields.switches,
    layout: fields.layout,
    keyCount: fields.keyCount,

    // Mouse specific
    dpi: fields.dpi,
    weight: fields.weight,
    sensor: fields.sensor,

    // Monitor specific
    size: fields.size,
    monitorResolution: fields.monitorResolution,
    refreshRate: fields.refreshRate,
    panelType: fields.panelType,
    curved: fields.curved,
    aspectRatio: fields.aspectRatio,

    // Gamepad specific
    platform: fields.platform,
    batteryLife: fields.batteryLife,
    connection: fields.connection,

    // Mousepad specific
    surface: fields.surface,
    dimensions: fields.dimensions,
    thickness: fields.thickness,

    // Audio specific
    frequencyResponse: fields.frequencyResponse,
    impedance: fields.impedance,
    microphone: fields.microphone,
    surroundSound: fields.surroundSound,

    // Webcam/Microphone specific
    resolution: fields.resolution,
    frameRate: fields.frameRate,
    fieldOfView: fields.fieldOfView,
  };
}
