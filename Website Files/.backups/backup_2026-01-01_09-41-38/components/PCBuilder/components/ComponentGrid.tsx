/**
 * @component ComponentGrid
 * @description Renders PC components in grid or list view with pagination controls.
 * Handles component display, view mode toggle, pagination, and empty state messaging.
 *
 * Features:
 * - Component header with category title and compatibility status
 * - Grid (3-column on XL) or list view rendering
 * - Pagination with smart page range calculation (shows up to 5 pages)
 * - Automatic scroll to top on page change
 * - No components found state with message
 * - Component count display
 * - Compatible/incompatible component counts
 * - Responsive layout (mobile-friendly)
 *
 * @example
 * ```tsx
 * <ComponentGrid
 *   activeCategory="gpu"
 *   viewMode="grid"
 *   paginatedComponents={componentsList}
 *   sortedComponents={allComponents}
 *   selectedComponents={{gpu: "nvidia-4090"}}
 *   currentPage={1}
 *   setCurrentPage={setCurrentPage}
 *   itemsPerPage={12}
 *   totalPages={5}
 *   filteredCount={48}
 *   totalComponentsInCategory={120}
 *   onComponentSelect={handleSelect}
 *   onShowIncompatibility={() => setShowModal(true)}
 *   buildSectionRef={ref}
 * />
 * ```
 */

import React, { memo, Ref } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ComponentCard } from "./ComponentCard";
import { FilterPanel } from "./FilterPanel";
import { PCBuilderComponent } from "../types";

/**
 * Props for ComponentGrid component
 */
interface ComponentGridProps {
  /** Currently active category (e.g., "gpu", "cpu") */
  activeCategory: string;
  /** Current view mode: "grid" or "list" */
  viewMode: string;
  /** Components to display on current page */
  paginatedComponents: (PCBuilderComponent | unknown)[];
  /** All sorted components (used for length calculation) */
  sortedComponents: (PCBuilderComponent | unknown)[];
  /** Map of selected components by category */
  selectedComponents: Record<string, string>;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Callback to update current page */
  setCurrentPage: (page: number) => void;
  /** Number of items per page */
  itemsPerPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of components passing filters */
  filteredCount: number;
  /** Total components in category before filtering */
  totalComponentsInCategory: number;
  /** Callback when component is selected */
  onComponentSelect: (category: string, componentId: string) => void;
  /** Callback to show incompatibility modal */
  onShowIncompatibility: () => void;
  /** Ref to build section for scroll-to-top */
  buildSectionRef: Ref<HTMLDivElement>;
  // FilterPanel props
  /** Category-specific search query */
  searchQuery: string;
  /** Callback to update search query */
  setSearchQuery: (query: string) => void;
  /** Array of selected brand names */
  selectedBrands: string[];
  /** Callback to update selected brands */
  setSelectedBrands: (brands: string[]) => void;
  /** Price range [min, max] in GBP */
  priceRange: [number, number];
  /** Callback to update price range */
  setPriceRange: (range: [number, number]) => void;
  /** Minimum price in current category (for slider bounds) */
  priceMin: number;
  /** Maximum price in current category (for slider bounds) */
  priceMax: number;
  /** Available brands for current category */
  brandOptions: string[];
  /** Available option filter values per filter key */
  optionFilterValues: Record<string, string[]>;
  /** Selected option filters by key */
  optionFilters: Record<string, string[]>;
  /** Callback to update option filters */
  setOptionFilters: (filters: Record<string, string[]>) => void;
  /** Bounds for range filters */
  rangeFilterBounds: Record<string, { min: number; max: number }>;
  /** Selected range filters by key */
  rangeFilters: Record<string, [number, number]>;
  /** Callback to update range filters */
  setRangeFilters: (filters: Record<string, [number, number]>) => void;
  /** Current view mode: "grid" or "list" */
  viewMode: string;
  /** Callback to update view mode */
  setViewMode: (mode: string) => void;
  /** Current sort mode */
  sortBy: string;
  /** Callback to update sort mode */
  setSortBy: (sort: string) => void;
  /** Number of applied filters */
  appliedFiltersCount: number;
}

/**
 * Maps category name to display label
 * @param category - Category key (e.g., "gpu", "cpu")
 * @returns Human-readable category label
 */
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    case: "PC Cases",
    motherboard: "Motherboards",
    cpu: "Processors",
    gpu: "Graphics Cards (GPU)",
    ram: "Memory (RAM)",
    psu: "Power Supply Units (PSU)",
    cooler: "CPU Coolers",
    storage: "Storage Drives",
  };
  return (
    labels[category] || category.charAt(0).toUpperCase() + category.slice(1)
  );
};

/**
 * Maps category name to singular form for messaging
 * @param category - Category key
 * @returns Singular form of category
 */
const getCategorySingular = (category: string): string => {
  const singular: Record<string, string> = {
    case: "PC case",
    motherboard: "motherboard",
    cpu: "processor",
    gpu: "graphics card",
    ram: "memory",
    psu: "power supply",
    cooler: "CPU cooler",
    storage: "storage drive",
  };
  return singular[category] || category;
};

/**
 * Memoized component to prevent re-renders when props haven't changed
 * (uses strict equality checking on component data, selection state, and view mode)
 */
const MemoComponentCard = memo(
  ComponentCard,
  (prev, next) =>
    (prev.component as PCBuilderComponent).id ===
      (next.component as PCBuilderComponent).id &&
    (prev.component as PCBuilderComponent).price ===
      (next.component as PCBuilderComponent).price &&
    prev.isSelected === next.isSelected &&
    prev.viewMode === next.viewMode
);

/**
 * ComponentGrid component
 * Renders components in grid or list view with pagination and empty state handling
 */
export const ComponentGrid: React.FC<ComponentGridProps> = ({
  activeCategory,
  viewMode,
  setViewMode,
  paginatedComponents,
  sortedComponents,
  selectedComponents,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  totalPages,
  filteredCount,
  totalComponentsInCategory,
  onComponentSelect,
  onShowIncompatibility,
  buildSectionRef,
  searchQuery,
  setSearchQuery,
  selectedBrands,
  setSelectedBrands,
  priceRange,
  setPriceRange,
  priceMin,
  priceMax,
  brandOptions,
  optionFilterValues,
  optionFilters,
  setOptionFilters,
  rangeFilterBounds,
  rangeFilters,
  setRangeFilters,
  sortBy,
  setSortBy,
  appliedFiltersCount,
}) => {
  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    if (buildSectionRef && "current" in buildSectionRef) {
      (
        buildSectionRef as React.RefObject<HTMLDivElement>
      ).current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Component Header - Title and Compatibility Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-white capitalize">
            {getCategoryLabel(activeCategory)}
          </h2>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Choose the perfect {getCategorySingular(activeCategory)} for your
            build
          </p>

          {/* Compatibility Status Badge */}
          {Object.keys(selectedComponents).length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
                <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                <span className="text-xs text-sky-300">
                  {filteredCount} of {totalComponentsInCategory} compatible
                </span>
              </div>
              {filteredCount < totalComponentsInCategory && (
                <button
                  onClick={onShowIncompatibility}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-amber-300">
                    {totalComponentsInCategory - filteredCount} incompatible
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        <FilterPanel
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          priceMin={priceMin}
          priceMax={priceMax}
          brandOptions={brandOptions}
          optionFilterValues={optionFilterValues}
          optionFilters={optionFilters}
          setOptionFilters={setOptionFilters}
          rangeFilterBounds={rangeFilterBounds}
          rangeFilters={rangeFilters}
          setRangeFilters={setRangeFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          appliedFiltersCount={appliedFiltersCount}
        />
      </div>

      {/* Grid/List View */}
      {viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6 items-start">
          {paginatedComponents.map((component) => (
            <MemoComponentCard
              key={(component as PCBuilderComponent).id}
              component={component as PCBuilderComponent}
              category={activeCategory}
              isSelected={
                selectedComponents[activeCategory] ===
                (component as PCBuilderComponent).id
              }
              onSelect={onComponentSelect}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedComponents.map((component) => (
            <MemoComponentCard
              key={(component as PCBuilderComponent).id}
              component={component as PCBuilderComponent}
              category={activeCategory}
              isSelected={
                selectedComponents[activeCategory] ===
                (component as PCBuilderComponent).id
              }
              onSelect={onComponentSelect}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* No Components Found State */}
      {sortedComponents.length === 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            No Components Found
          </h3>
          <p className="text-gray-400">
            No {activeCategory} components match your current filters.
          </p>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            Showing{" "}
            {sortedComponents.length > 0
              ? `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(
                  currentPage * itemsPerPage,
                  sortedComponents.length
                )} of ${sortedComponents.length}`
              : "0"}{" "}
            components
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-0 min-w-[40px]"
                        : "border-white/20 bg-white/10 text-white hover:bg-white/20 min-w-[40px]"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

ComponentGrid.displayName = "ComponentGrid";
