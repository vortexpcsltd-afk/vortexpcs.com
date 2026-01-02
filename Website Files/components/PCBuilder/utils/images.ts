/**
 * Image Handling Utilities for PCBuilder
 * Manages component images, galleries, and image references
 */

import { logger } from "../../../services/logger";
import type { ImageRef, AnyComponent } from "../types";
import { PLACEHOLDER_IMAGE } from "../../data/pcBuilderComponents";

// Re-export for convenience
export { PLACEHOLDER_IMAGE };

/**
 * Get URL string from ImageRef (handle both string and object formats)
 */
export const getImageUrl = (img: ImageRef): string => {
  try {
    if (typeof img === "string") {
      return img;
    }
    return img.url || img.src || PLACEHOLDER_IMAGE;
  } catch (error) {
    logger.error("Error getting image URL", {
      error: error instanceof Error ? error.message : String(error),
    });
    return PLACEHOLDER_IMAGE;
  }
};

/**
 * Get the first image from a component, or placeholder if none available
 */
export const getComponentImage = (component: AnyComponent): string => {
  try {
    if (
      component &&
      component.images &&
      Array.isArray(component.images) &&
      component.images.length > 0
    ) {
      return getImageUrl(component.images[0]);
    }
    return PLACEHOLDER_IMAGE;
  } catch (error) {
    logger.error("Error getting component image", {
      error: error instanceof Error ? error.message : String(error),
      componentId: component?.id,
    });
    return PLACEHOLDER_IMAGE;
  }
};

/**
 * Normalize image array, filling with placeholders if needed
 */
export const normalizeImages = (
  images: ImageRef[] | undefined,
  minCount: number = 4
): string[] => {
  try {
    if (!images || images.length === 0) {
      return Array(minCount).fill(PLACEHOLDER_IMAGE);
    }

    const normalized = images.map(getImageUrl);

    // Pad with placeholders if needed
    while (normalized.length < minCount) {
      normalized.push(PLACEHOLDER_IMAGE);
    }

    return normalized;
  } catch (error) {
    logger.error("Error normalizing images", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Array(minCount).fill(PLACEHOLDER_IMAGE);
  }
};

/**
 * Validate if image URL is accessible (non-blocking check)
 */
export const validateImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000); // 5 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      img.src = url;
    } catch (error) {
      logger.error("Error validating image URL", {
        error: error instanceof Error ? error.message : String(error),
        url,
      });
      resolve(false);
    }
  });
};

/**
 * Get images by option variant (e.g., different colors of the same component)
 */
export const getImagesByOption = (
  component: AnyComponent,
  option: string
): string[] => {
  try {
    if (
      !component ||
      !component.imagesByOption ||
      !component.imagesByOption[option]
    ) {
      return normalizeImages(component?.images);
    }

    const optionImages = component.imagesByOption[option];
    if (typeof optionImages === "string") {
      return [optionImages];
    }

    if (Array.isArray(optionImages)) {
      return optionImages.map(getImageUrl);
    }

    return normalizeImages(component?.images);
  } catch (error) {
    logger.error("Error getting images by option", {
      error: error instanceof Error ? error.message : String(error),
      componentId: component?.id,
      option,
    });
    return normalizeImages(component?.images);
  }
};

/**
 * Create a srcSet string for responsive images
 */
export const createSrcSet = (
  baseUrl: string,
  sizes: number[] = [320, 640, 1280]
): string => {
  try {
    return sizes
      .map((size) => {
        // This assumes a URL structure that supports size parameters
        // Adjust based on your actual image service
        const separator = baseUrl.includes("?") ? "&" : "?";
        return `${baseUrl}${separator}w=${size} ${size}w`;
      })
      .join(", ");
  } catch (error) {
    logger.error("Error creating srcSet", {
      error: error instanceof Error ? error.message : String(error),
      baseUrl,
    });
    return baseUrl;
  }
};
