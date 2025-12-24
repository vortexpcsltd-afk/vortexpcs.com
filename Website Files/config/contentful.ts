import { createClient } from "contentful";

const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
const accessToken = import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN;

// Log setup status in development
if (import.meta.env.DEV) {
  const hasSpaceId = !!spaceId;
  const hasToken = !!accessToken;

  if (!hasSpaceId || !hasToken) {
    console.warn(
      "⚠️ Contentful not configured. To enable brand logos in dev mode:"
    );
    if (!hasSpaceId) {
      console.warn("  - Add VITE_CONTENTFUL_SPACE_ID to .env.local");
    }
    if (!hasToken) {
      console.warn("  - Add VITE_CONTENTFUL_ACCESS_TOKEN to .env.local");
    }
    console.warn("  - See CONTENTFUL_DEV_SETUP.md for detailed instructions");
    console.warn("  - Once added, restart: npm run dev");
  }
}

export const contentfulClient =
  spaceId && accessToken
    ? createClient({
        space: spaceId,
        accessToken: accessToken,
        // Add timeout to prevent hanging requests
        timeout: 5000, // 5 seconds timeout
        retryLimit: 2, // Only retry twice
      })
    : undefined;

export const isContentfulEnabled = !!contentfulClient;
