import { useState, useCallback, useEffect, useMemo } from "react";
import { CategoryKey } from "../types";
import { logger } from "../../../services/logger";

/**
 * Hook for managing filtering, searching, and sorting of components
 * Handles category-specific and global search, price filtering, and brand filtering
 */
export const useComponentFiltering = (
  componentData: Record<string, unknown[]>,
  activeCategory: CategoryKey
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [optionFilters, setOptionFilters] = useState<Record<string, string[]>>(
    {}
  );
  const [rangeFilters, setRangeFilters] = useState<
    Record<string, [number, number]>
  >({});
  const [sortBy, setSortBy] = useState("price");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>(
    {}
  );

  // Reset to page 1 when category changes
  useEffect(() => {
    const savedPage = categoryPages[activeCategory] || 1;
    setCurrentPage(savedPage);
  }, [activeCategory, categoryPages]);

  // Get components for current category
  const categoryComponents = useMemo(() => {
    const comps = componentData[activeCategory] as
      | Record<string, unknown>[]
      | undefined;
    return comps || [];
  }, [componentData, activeCategory]);

  // Apply all filters and search
  const filteredComponents = useMemo(() => {
    try {
      // Start with category components
      let filtered = [...categoryComponents];

      // Apply brand filter
      if (selectedBrands.length > 0) {
        filtered = filtered.filter((comp: Record<string, unknown>) =>
          selectedBrands.includes(String(comp.brand || ""))
        );
      }

      // Apply price range filter
      if (priceRange[0] > 0 || priceRange[1] > 0) {
        filtered = filtered.filter((comp: Record<string, unknown>) => {
          const price = Number(comp.price) || 0;
          return price >= priceRange[0] && price <= priceRange[1];
        });
      }

      // Apply option filters
      if (Object.keys(optionFilters).length > 0) {
        filtered = filtered.filter((comp: Record<string, unknown>) => {
          return Object.entries(optionFilters).every(([key, values]) => {
            if (values.length === 0) return true;
            const compValue = String(comp[key as keyof typeof comp] || "");
            return values.some((v) => compValue.includes(v));
          });
        });
      }

      // Apply range filters (specs like cores, vram, etc.)
      if (Object.keys(rangeFilters).length > 0) {
        filtered = filtered.filter((comp: Record<string, unknown>) => {
          return Object.entries(rangeFilters).every(([key, [min, max]]) => {
            const value = Number(comp[key as keyof typeof comp]) || 0;
            return value >= min && value <= max;
          });
        });
      }

      // Apply search query (category-specific)
      if (searchQuery.trim()) {
        filtered = filtered.filter((comp: Record<string, unknown>) => {
          const searchFields = ["name", "brand", "model", "description"];
          const queryLower = searchQuery.toLowerCase();
          return searchFields.some((field) =>
            String(comp[field as keyof typeof comp] || "")
              .toLowerCase()
              .includes(queryLower)
          );
        });
      }

      // Apply sorting
      if (sortBy === "price") {
        filtered.sort(
          (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)
        );
      } else if (sortBy === "price-desc") {
        filtered.sort(
          (a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)
        );
      } else if (sortBy === "name") {
        filtered.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        );
      } else if (sortBy === "rating") {
        filtered.sort(
          (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)
        );
      }

      logger.info("Components filtered", {
        category: activeCategory,
        resultCount: filtered.length,
        originalCount: categoryComponents.length,
      });

      return filtered;
    } catch (error) {
      logger.error("Component filtering failed", {
        error: error instanceof Error ? error.message : String(error),
        category: activeCategory,
      });
      return categoryComponents;
    }
  }, [
    categoryComponents,
    selectedBrands,
    priceRange,
    optionFilters,
    rangeFilters,
    searchQuery,
    sortBy,
    activeCategory,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredComponents.length / itemsPerPage);
  const paginatedComponents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredComponents.slice(startIndex, endIndex);
  }, [filteredComponents, currentPage, itemsPerPage]);

  // Get unique brands for filter UI
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    categoryComponents.forEach((comp: Record<string, unknown>) => {
      const brand = String(comp.brand || "");
      if (brand) brands.add(brand);
    });
    return Array.from(brands).sort();
  }, [categoryComponents]);

  // Update page and save to cache
  const updatePage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
      setCategoryPages((prev) => ({
        ...prev,
        [activeCategory]: page,
      }));
    },
    [totalPages, activeCategory]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    try {
      setSearchQuery("");
      setGlobalSearchQuery("");
      setSelectedBrands([]);
      setPriceRange([0, 0]);
      setOptionFilters({});
      setRangeFilters({});
      setSortBy("price");
      setCurrentPage(1);
      logger.info("All filters cleared");
    } catch (error) {
      logger.error("Failed to clear filters", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  return {
    // Queries
    searchQuery,
    setSearchQuery,
    globalSearchQuery,
    setGlobalSearchQuery,
    // Filters
    selectedBrands,
    setSelectedBrands,
    priceRange,
    setPriceRange,
    optionFilters,
    setOptionFilters,
    rangeFilters,
    setRangeFilters,
    // Sorting & Display
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    // Pagination
    currentPage,
    updatePage,
    totalPages,
    itemsPerPage,
    categoryPages,
    // Results
    filteredComponents,
    paginatedComponents,
    uniqueBrands,
    // Actions
    clearAllFilters,
  };
};
