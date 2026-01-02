/**
 * Search & Filtering Utilities for PCBuilder
 * Handles component searching, filtering, and sorting operations
 */

import { logger } from "../../../services/logger";
import type { AnyComponent } from "../types";

/**
 * Filter components by category/type
 */
export const filterByCategory = (
  components: AnyComponent[],
  category: string
): AnyComponent[] => {
  try {
    return components.filter(
      (comp) =>
        comp.category && comp.category.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    logger.error("Error filtering by category", {
      error: error instanceof Error ? error.message : String(error),
      category,
    });
    return [];
  }
};

/**
 * Filter components by price range
 */
export const filterByPrice = (
  components: AnyComponent[],
  minPrice: number,
  maxPrice: number
): AnyComponent[] => {
  try {
    return components.filter((comp) => {
      const price = comp.price || comp.reducedPrice || 0;
      return price >= minPrice && price <= maxPrice;
    });
  } catch (error) {
    logger.error("Error filtering by price", {
      error: error instanceof Error ? error.message : String(error),
      minPrice,
      maxPrice,
    });
    return [];
  }
};

/**
 * Filter components by specifications
 */
export const filterBySpecs = (
  components: AnyComponent[],
  specKey: string,
  specValue: string | number
): AnyComponent[] => {
  try {
    return components.filter((comp) => {
      // Check direct property
      const directValue = (comp as Record<string, unknown>)[specKey];
      if (directValue === specValue) return true;

      // Check in specs object
      const compRecord = comp as Record<string, unknown>;
      if (compRecord.specs && typeof compRecord.specs === "object") {
        const specsObj = compRecord.specs as Record<string, unknown>;
        return specsObj[specKey] === specValue;
      }

      return false;
    });
  } catch (error) {
    logger.error("Error filtering by specs", {
      error: error instanceof Error ? error.message : String(error),
      specKey,
      specValue,
    });
    return [];
  }
};

/**
 * Search components by name or description
 */
export const searchComponents = (
  components: AnyComponent[],
  query: string
): AnyComponent[] => {
  try {
    if (!query || query.trim() === "") {
      return components;
    }

    const lowerQuery = query.toLowerCase().trim();

    return components.filter((comp) => {
      // Search in name
      if (comp.name && comp.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in brand
      if (comp.brand && comp.brand.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in model
      if (comp.model && comp.model.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in description
      if (
        comp.description &&
        comp.description.toLowerCase().includes(lowerQuery)
      ) {
        return true;
      }

      return false;
    });
  } catch (error) {
    logger.error("Error searching components", {
      error: error instanceof Error ? error.message : String(error),
      query,
    });
    return [];
  }
};

/**
 * Sort components by various criteria
 */
export const sortComponents = (
  components: AnyComponent[],
  sortBy: "price-asc" | "price-desc" | "name" | "rating" = "price-asc"
): AnyComponent[] => {
  try {
    const sorted = [...components];

    switch (sortBy) {
      case "price-asc":
        sorted.sort(
          (a, b) =>
            (a.price || a.reducedPrice || 0) - (b.price || b.reducedPrice || 0)
        );
        break;

      case "price-desc":
        sorted.sort(
          (a, b) =>
            (b.price || b.reducedPrice || 0) - (a.price || a.reducedPrice || 0)
        );
        break;

      case "name":
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;

      case "rating":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;

      default:
        break;
    }

    return sorted;
  } catch (error) {
    logger.error("Error sorting components", {
      error: error instanceof Error ? error.message : String(error),
      sortBy,
    });
    return components;
  }
};

/**
 * Apply multiple filters and search in one operation
 */
export const filterAndSearchComponents = (
  components: AnyComponent[],
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    specs?: Record<string, string | number>;
    search?: string;
    sortBy?: "price-asc" | "price-desc" | "name" | "rating";
  }
): AnyComponent[] => {
  try {
    let filtered = components;

    // Apply category filter
    if (filters.category) {
      filtered = filterByCategory(filtered, filters.category);
    }

    // Apply price filter
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      filtered = filterByPrice(filtered, filters.minPrice, filters.maxPrice);
    }

    // Apply spec filters
    if (filters.specs) {
      Object.entries(filters.specs).forEach(([key, value]) => {
        filtered = filterBySpecs(filtered, key, value);
      });
    }

    // Apply search
    if (filters.search) {
      filtered = searchComponents(filtered, filters.search);
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered = sortComponents(filtered, filters.sortBy);
    }

    return filtered;
  } catch (error) {
    logger.error("Error in filterAndSearchComponents", {
      error: error instanceof Error ? error.message : String(error),
    });
    return components;
  }
};

/**
 * Get unique values for a specification across all components
 */
export const getUniqueSpecValues = (
  components: AnyComponent[],
  specKey: string
): (string | number)[] => {
  try {
    const values = new Set<string | number>();

    components.forEach((comp) => {
      // Check direct property
      const directValue = (comp as Record<string, unknown>)[specKey];
      if (directValue !== undefined && directValue !== null) {
        values.add(directValue as string | number);
      }

      // Check in specs object
      const compRecord = comp as Record<string, unknown>;
      if (compRecord.specs && typeof compRecord.specs === "object") {
        const specsObj = compRecord.specs as Record<string, unknown>;
        const specValue = specsObj[specKey];
        if (specValue !== undefined && specValue !== null) {
          values.add(specValue as string | number);
        }
      }
    });

    return Array.from(values).sort();
  } catch (error) {
    logger.error("Error getting unique spec values", {
      error: error instanceof Error ? error.message : String(error),
      specKey,
    });
    return [];
  }
};
