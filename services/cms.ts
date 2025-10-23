/**
 * Strapi CMS Service
 * Handles all CMS data fetching for products, builds, blog posts, etc.
 */

import strapiClient, {
  formatStrapiResponse,
  getStrapiImageUrl,
  strapiEndpoints,
} from "../config/strapi";

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
 * Fetch all products
 */
export const fetchProducts = async (params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> => {
  try {
    let url = strapiEndpoints.products;

    // Build query parameters
    const queryParams: string[] = [];
    if (params?.category) {
      queryParams.push(`filters[category][$eq]=${params.category}`);
    }
    if (params?.featured) {
      queryParams.push(`filters[featured][$eq]=true`);
    }
    if (params?.limit) {
      queryParams.push(`pagination[limit]=${params.limit}`);
    }

    if (queryParams.length > 0) {
      url += "?" + queryParams.join("&");
    }

    const response = await strapiClient.get(url + "&populate=*");
    return formatStrapiResponse(response.data) || [];
  } catch (error: any) {
    console.error("Fetch products error:", error);
    // Return mock data for development
    return getMockProducts();
  }
};

/**
 * Fetch single product by ID
 */
export const fetchProduct = async (id: number): Promise<Product | null> => {
  try {
    const response = await strapiClient.get(
      `${strapiEndpoints.products}/${id}?populate=*`
    );
    return formatStrapiResponse(response.data);
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
  try {
    let url = strapiEndpoints.pcBuilds;

    const queryParams: string[] = [];
    if (params?.category) {
      queryParams.push(`filters[category][$eq]=${params.category}`);
    }
    if (params?.featured) {
      queryParams.push(`filters[featured][$eq]=true`);
    }

    if (queryParams.length > 0) {
      url += "?" + queryParams.join("&");
    }

    const response = await strapiClient.get(url + "&populate=*");
    return formatStrapiResponse(response.data) || [];
  } catch (error: any) {
    console.error("Fetch PC builds error:", error);
    // Return mock data for development
    return getMockPCBuilds();
  }
};

/**
 * Fetch components by type
 */
export const fetchComponents = async (type?: string): Promise<Component[]> => {
  try {
    let url = strapiEndpoints.components;

    if (type) {
      url += `?filters[type][$eq]=${type}&populate=*`;
    } else {
      url += "?populate=*";
    }

    const response = await strapiClient.get(url);
    return formatStrapiResponse(response.data) || [];
  } catch (error: any) {
    console.error("Fetch components error:", error);
    return getMockComponents(type);
  }
};

/**
 * Fetch all categories
 */
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await strapiClient.get(strapiEndpoints.categories);
    const categories = formatStrapiResponse(response.data) || [];
    console.log("✅ Strapi categories fetched:", categories);
    return categories;
  } catch (error: any) {
    console.error("Fetch categories error:", error);
    // Return mock categories for development
    return getMockCategories();
  }
};

/**
 * Fetch site settings
 */
export const fetchSettings = async (): Promise<Settings | null> => {
  try {
    const response = await strapiClient.get(strapiEndpoints.settings);
    const settings = formatStrapiResponse(response.data);
    console.log("✅ Strapi settings fetched:", settings);
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
  try {
    const response = await strapiClient.get(
      `${strapiEndpoints.pageContents}?filters[pageSlug][$eq]=${pageSlug}&populate=*`
    );
    const pages = formatStrapiResponse(response.data);
    return pages && pages.length > 0 ? pages[0] : null;
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
  try {
    let url = strapiEndpoints.faqItems;

    const queryParams: string[] = [];
    if (params?.category) {
      queryParams.push(`filters[category][$eq]=${params.category}`);
    }
    if (params?.featured) {
      queryParams.push(`filters[featured][$eq]=true`);
    }

    if (queryParams.length > 0) {
      url += "?" + queryParams.join("&");
    }

    const response = await strapiClient.get(url + "&sort=order:asc");
    return formatStrapiResponse(response.data) || [];
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
  try {
    let url = strapiEndpoints.serviceItems;

    const queryParams: string[] = [];
    if (params?.category) {
      queryParams.push(`filters[category][$eq]=${params.category}`);
    }
    if (params?.available !== undefined) {
      queryParams.push(`filters[available][$eq]=${params.available}`);
    }

    if (queryParams.length > 0) {
      url += "?" + queryParams.join("&");
    }

    const response = await strapiClient.get(url + "&sort=order:asc");
    return formatStrapiResponse(response.data) || [];
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
  try {
    let url = strapiEndpoints.featureItems;

    const queryParams: string[] = [];
    if (params?.category) {
      queryParams.push(`filters[category][$eq]=${params.category}`);
    }
    if (params?.showOnHomepage !== undefined) {
      queryParams.push(`filters[showOnHomepage][$eq]=${params.showOnHomepage}`);
    }

    if (queryParams.length > 0) {
      url += "?" + queryParams.join("&");
    }

    const response = await strapiClient.get(url + "&sort=order:asc");
    return formatStrapiResponse(response.data) || [];
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
  try {
    let url = strapiEndpoints.teamMembers;

    if (params?.featured) {
      url += "?filters[featured][$eq]=true";
    }

    const response = await strapiClient.get(url + "&sort=order:asc&populate=*");
    return formatStrapiResponse(response.data) || [];
  } catch (error: any) {
    console.error("Fetch team members error:", error);
    return getMockTeamMembers();
  }
};

/**
 * Fetch company stats
 */
export const fetchCompanyStats = async (): Promise<CompanyStats | null> => {
  try {
    const response = await strapiClient.get(strapiEndpoints.companyStats);
    return formatStrapiResponse(response.data);
  } catch (error: any) {
    console.error("Fetch company stats error:", error);
    return getMockCompanyStats();
  }
};

/**
 * Fetch navigation menu
 */
export const fetchNavigationMenu = async (): Promise<NavigationMenu | null> => {
  try {
    const response = await strapiClient.get(strapiEndpoints.navigationMenu);
    return formatStrapiResponse(response.data);
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
    try {
      const response = await strapiClient.get(
        strapiEndpoints.contactInformation
      );
      return formatStrapiResponse(response.data);
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
  try {
    const response = await strapiClient.get(
      `${strapiEndpoints.legalPages}?filters[pageType][$eq]=${pageType}`
    );
    const pages = formatStrapiResponse(response.data);
    return pages && pages.length > 0 ? pages[0] : null;
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
  try {
    let url = strapiEndpoints.pricingTiers;

    if (params?.category) {
      url += `?filters[category][$eq]=${params.category}`;
    }

    const response = await strapiClient.get(url + "&sort=order:asc");
    return formatStrapiResponse(response.data) || [];
  } catch (error: any) {
    console.error("Fetch pricing tiers error:", error);
    return getMockPricingTiers();
  }
};

/**
 * Fetch testimonials
 */
export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const response = await strapiClient.get(strapiEndpoints.testimonials);
    const testimonials = formatStrapiResponse(response.data) || [];
    console.log("✅ Strapi testimonials fetched:", testimonials);
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
  try {
    const [productsRes, buildsRes] = await Promise.all([
      strapiClient.get(
        `${strapiEndpoints.products}?filters[name][$contains]=${query}&populate=*`
      ),
      strapiClient.get(
        `${strapiEndpoints.pcBuilds}?filters[name][$contains]=${query}&populate=*`
      ),
    ]);

    return {
      products: formatStrapiResponse(productsRes.data) || [],
      builds: formatStrapiResponse(buildsRes.data) || [],
    };
  } catch (error: any) {
    console.error("Search content error:", error);
    return { products: [], builds: [] };
  }
};

/**
 * Mock data for development (when Strapi is not connected)
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

export { getStrapiImageUrl };
