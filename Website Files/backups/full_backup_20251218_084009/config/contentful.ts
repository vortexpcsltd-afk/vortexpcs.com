import { createClient } from "contentful";

const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
const accessToken = import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN;

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
