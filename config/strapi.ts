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

/**
 * Strapi configuration (deprecated)
 *
 * Strapi usage has been removed from this project in favor of Contentful.
 * This file remains as a harmless stub to avoid import errors in documentation
 * or leftover references. Do not add credentials or active clients here.
 */

export const strapiConfig = {
  enabled: false,
  baseURL: "",
  apiToken: "",
};

export const strapiClient = null as any;

export const strapiEndpoints = {} as Record<string, string>;

export const getStrapiImageUrl = (_: any) => null;

export const formatStrapiResponse = (_: any) => null;

export default null;
