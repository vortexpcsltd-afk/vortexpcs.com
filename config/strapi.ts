/**
 * Strapi CMS Configuration
 *
 * Setup Instructions:
 * 1. Deploy Strapi CMS:
 *    - Option A: Use Strapi Cloud (https://cloud.strapi.io/)
 *    - Option B: Self-host on Heroku/AWS/DigitalOcean
 *    - Option C: Local development (npx create-strapi-app@latest my-project)
 *
 * 2. Create Content Types in Strapi:
 *    - Products (name, description, price, category, specs, images, stock)
 *    - PC Builds (name, components, price, category, featured)
 *    - Blog Posts (title, content, author, publishedAt)
 *    - Testimonials (customerName, rating, review, productName)
 *
 * 3. Set up API tokens:
 *    - Navigate to Settings > API Tokens
 *    - Create a new token with appropriate permissions
 *    - Use read-only token for frontend
 *
 * 4. Configure CORS in Strapi:
 *    - Allow your domain in Strapi's CORS settings
 */

import axios from "axios";

// Type assertion for Vite environment variables
const env = import.meta.env as any;

// Strapi API configuration
export const strapiConfig = {
  baseURL: env.VITE_STRAPI_URL || "http://localhost:1338",
  apiToken: env.VITE_STRAPI_API_TOKEN || "YOUR_STRAPI_API_TOKEN",
};

// Create axios instance for Strapi API
// Build headers conditionally so public endpoints work without a token
const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};
if (
  strapiConfig.apiToken &&
  strapiConfig.apiToken !== "YOUR_STRAPI_API_TOKEN"
) {
  defaultHeaders.Authorization = `Bearer ${strapiConfig.apiToken}`;
}

export const strapiClient = axios.create({
  baseURL: `${strapiConfig.baseURL}/api`,
  headers: defaultHeaders,
});

// Optional fallback: if a request fails with 401/403 using an Authorization header,
// retry once without the Authorization header to leverage public permissions (dev-friendly)
strapiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalConfig = error?.config || {};

    const hasAuthHeader = !!originalConfig?.headers?.Authorization;
    const alreadyRetried = (originalConfig as any)._retriedWithoutAuth === true;

    if (
      (status === 401 || status === 403) &&
      hasAuthHeader &&
      !alreadyRetried
    ) {
      try {
        const retryConfig = {
          ...originalConfig,
          headers: { ...(originalConfig.headers || {}) },
        };
        delete (retryConfig.headers as any).Authorization;
        (retryConfig as any)._retriedWithoutAuth = true;
        console.warn(
          "Strapi request unauthorized with token; retrying without Authorization header for public access"
        );
        return await strapiClient.request(retryConfig);
      } catch (retryErr) {
        throw retryErr;
      }
    }

    throw error;
  }
);

// API endpoints
export const strapiEndpoints = {
  products: "/products",
  pcBuilds: "/pc-builds",
  components: "/components",
  blogPosts: "/blog-posts",
  testimonials: "/testimonials",
  categories: "/categories",
  settings: "/site-setting",
  pageContents: "/page-contents",
  faqItems: "/faq-items",
  serviceItems: "/service-items",
  featureItems: "/feature-items",
  teamMembers: "/team-members",
  companyStats: "/company-stat",
  navigationMenu: "/navigation-menu",
  contactInformation: "/contact-information",
  legalPages: "/legal-pages",
  pricingTiers: "/pricing-tiers",
  featuredProducts: "/products?filters[featured][$eq]=true",
  orders: "/orders",
};

// Helper function to format Strapi image URLs
export const getStrapiImageUrl = (imageData: any) => {
  if (!imageData) return null;

  const imageUrl = imageData?.data?.attributes?.url || imageData?.url;

  if (!imageUrl) return null;

  // If URL is relative, prepend Strapi base URL
  if (imageUrl.startsWith("/")) {
    return `${strapiConfig.baseURL}${imageUrl}`;
  }

  return imageUrl;
};

// Helper function to format Strapi response for v5
export const formatStrapiResponse = (response: any) => {
  console.log(
    "🔍 formatStrapiResponse - Raw response:",
    JSON.stringify(response, null, 2)
  );

  if (!response?.data) {
    console.log("❌ No data in response");
    return null;
  }

  if (Array.isArray(response.data)) {
    console.log(
      "📋 Processing array response with",
      response.data.length,
      "items"
    );
    return response.data.map((item: any) => {
      // Strapi v5 format - attributes are at the top level of the item
      const formatted = {
        id: item.id,
        ...item.attributes, // Strapi v5 still uses attributes for content
      };
      console.log("✅ Formatted array item:", formatted);
      return formatted;
    });
  }

  // Single item response
  console.log("📄 Processing single item response");
  const formatted = {
    id: response.data.id,
    ...response.data.attributes, // Strapi v5 still uses attributes for content
  };
  console.log("✅ Formatted single item:", formatted);
  return formatted;
};

export default strapiClient;
