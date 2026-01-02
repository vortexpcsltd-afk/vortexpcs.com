/**
 * @component FilterPanel
 * @description Filter and sort controls for PC Builder component selection.
 * Provides search, brand filtering, price range, category-specific option filters,
 * and range filters. Also includes view mode toggle (grid/list) and sort dropdown.
 *
 * Features:
 * - Category-specific search with placeholder text
 * - Brand multi-select checkboxes
 * - Price range slider with display
 * - Dynamic category-specific option filters (e.g., color, type, efficiency)
 * - Numeric range filters (e.g., VRAM, Wattage, Capacity)
 * - View mode toggle (grid/list icons)
 * - Sort dropdown (price low-high, price high-low, rating, name)
 * - Clear filters button
 * - Applied filter count badge on Filters button
 *
 * @example
 * ```tsx
 * <FilterPanel
 *   activeCategory="gpu"
 *   searchQuery={searchQuery}
 *   setSearchQuery={setSearchQuery}
 *   selectedBrands={selectedBrands}
 *   setSelectedBrands={setSelectedBrands}
 *   priceRange={[100, 2000]}
 *   setPriceRange={setPriceRange}
 *   viewMode="grid"
 *   setViewMode={setViewMode}
 *   sortBy="price"
 *   setSortBy={setSortBy}
 *   // ... other props
 * />
 * ```
 */

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Slider } from "../../ui/slider";
import { Grid, List } from "lucide-react";

// Category-specific option filter definitions
const CATEGORY_OPTION_FILTERS: Record<
  string,
  { key: string; label: string }[]
> = {
  cpu: [{ key: "socket", label: "Socket" }],
  motherboard: [
    { key: "socket", label: "Socket" },
    { key: "formFactor", label: "Form Factor" },
  ],
  ram: [{ key: "type", label: "Type" }],
  storage: [{ key: "type", label: "Type" }],
  psu: [
    { key: "efficiency", label: "Efficiency" },
    { key: "modular", label: "Modular" },
  ],
  cooling: [{ key: "type", label: "Type" }],
  case: [{ key: "formFactor", label: "Form Factor" }],
};

// Category-specific range filter definitions
const CATEGORY_RANGE_FILTERS: Record<string, { key: string; label: string }[]> =
  {
    gpu: [{ key: "vram", label: "VRAM (GB)" }],
    psu: [{ key: "wattage", label: "Wattage" }],
    ram: [
      { key: "capacity", label: "Capacity (GB)" },
      { key: "speed", label: "Speed (MHz)" },
    ],
    storage: [{ key: "capacity", label: "Capacity (GB)" }],
    cpu: [
      { key: "cores", label: "Cores" },
      { key: "tdp", label: "TDP (W)" },
    ],
    cooling: [
      { key: "height", label: "Height (mm)" },
      { key: "radiatorSize", label: "Radiator (mm)" },
    ],
  };

/**
 * Props for FilterPanel component
 */
interface FilterPanelProps {
  /** Currently active category (e.g., "gpu", "cpu") */
  activeCategory: string;
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
  /** Available brand options for current category */
  brandOptions: string[];
  /** Possible values for each option filter (e.g., {color: ["Red", "Black"]}) */
  optionFilterValues: Record<string, string[]>;
  /** Selected option filters (e.g., {color: ["Red"]}) */
  optionFilters: Record<string, string[]>;
  /** Callback to update option filters */
  setOptionFilters: (filters: Record<string, string[]>) => void;
  /** Bounds for numeric range filters (e.g., {vram: {min: 2, max: 24}}) */
  rangeFilterBounds: Record<string, { min: number; max: number }>;
  /** Selected range filters (e.g., {vram: [4, 12]}) */
  rangeFilters: Record<string, [number, number]>;
  /** Callback to update range filters */
  setRangeFilters: (filters: Record<string, [number, number]>) => void;
  /** Current view mode ("grid" or "list") */
  viewMode: string;
  /** Callback to update view mode */
  setViewMode: (mode: string) => void;
  /** Current sort option (e.g., "price", "price-desc", "rating", "name") */
  sortBy: string;
  /** Callback to update sort option */
  setSortBy: (sort: string) => void;
  /** Total number of applied filters (for badge) */
  appliedFiltersCount: number;
}

/**
 * FilterPanel Component
 *
 * Renders a side sheet with comprehensive filtering and sorting controls:
 * - Search bar for keyword filtering
 * - Brand multi-select with checkboxes
 * - Price range slider
 * - Category-specific option filters (dynamic based on category)
 * - Category-specific range filters (e.g., VRAM, Wattage)
 * - Clear filters button
 *
 * Also renders inline view mode toggle and sort dropdown for quick access.
 *
 * @param props Component props
 * @returns Rendered filter panel controls
 */
export function FilterPanel({
  activeCategory,
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
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  appliedFiltersCount,
}: FilterPanelProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Filters Drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="border-white/20 bg-white/10 text-gray-200 hover:bg-white/20"
            title="Filter components"
          >
            Filters
            {appliedFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 text-xs">
                {appliedFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-black/90 border-white/10 text-white"
        >
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-6 overflow-auto">
            {/* Search */}
            <div>
              <div className="text-sm text-gray-300 mb-2">Search</div>
              <Input
                placeholder={`Search ${activeCategory}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Brand */}
            {brandOptions.length > 0 && (
              <div>
                <div className="text-sm text-gray-300 mb-2">Brand</div>
                <div className="grid grid-cols-2 gap-2">
                  {brandOptions.map((brand) => {
                    const checked = selectedBrands.includes(brand);
                    return (
                      <label
                        key={brand}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setSelectedBrands(
                              v
                                ? [...selectedBrands, brand]
                                : selectedBrands.filter((b) => b !== brand)
                            )
                          }
                        />
                        <span>{brand}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price */}
            {priceMax > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-300">Price</div>
                  <div className="text-xs text-gray-400">
                    £{priceRange[0]} - £{priceRange[1]}
                  </div>
                </div>
                <Slider
                  min={priceMin}
                  max={priceMax}
                  value={priceRange as unknown as number[]}
                  onValueChange={(vals) =>
                    setPriceRange([Number(vals[0]), Number(vals[1])])
                  }
                />
              </div>
            )}

            {/* Category-specific options */}
            {Object.keys(optionFilterValues).length > 0 && (
              <div className="space-y-4">
                {(CATEGORY_OPTION_FILTERS[activeCategory] || []).map((def) => {
                  const values = optionFilterValues[def.key] || [];
                  if (values.length === 0) return null;
                  const selected = optionFilters[def.key] || [];
                  return (
                    <div key={def.key}>
                      <div className="text-sm text-gray-300 mb-2">
                        {def.label}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {values.map((val) => {
                          const isChecked = selected.includes(val);
                          return (
                            <label
                              key={val}
                              className="flex items-center gap-2 text-sm text-gray-300"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(v) =>
                                  setOptionFilters((prev) => {
                                    const next = { ...prev };
                                    const arr = new Set(next[def.key] || []);
                                    if (v) arr.add(val);
                                    else arr.delete(val);
                                    next[def.key] = Array.from(arr);
                                    return next;
                                  })
                                }
                              />
                              <span>{val}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Category-specific ranges */}
            {Object.keys(rangeFilterBounds).length > 0 && (
              <div className="space-y-4">
                {(CATEGORY_RANGE_FILTERS[activeCategory] || []).map((def) => {
                  const bounds = rangeFilterBounds[def.key];
                  if (!bounds) return null;
                  const current = rangeFilters[def.key] || [
                    bounds.min,
                    bounds.max,
                  ];
                  return (
                    <div key={def.key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-300">{def.label}</div>
                        <div className="text-xs text-gray-400">
                          {current[0]} - {current[1]}
                        </div>
                      </div>
                      <Slider
                        min={bounds.min}
                        max={bounds.max}
                        value={current as unknown as number[]}
                        onValueChange={(vals) =>
                          setRangeFilters((prev) => ({
                            ...prev,
                            [def.key]: [Number(vals[0]), Number(vals[1])] as [
                              number,
                              number
                            ],
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <SheetFooter>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                className="border-white/20 bg-white/5 text-gray-300"
                onClick={() => {
                  setSelectedBrands([]);
                  setSearchQuery("");
                  setOptionFilters({});
                  setRangeFilters({});
                  setPriceRange([priceMin, priceMax]);
                }}
              >
                Clear filters
              </Button>
              <SheetClose asChild>
                <Button className="bg-gradient-to-r from-sky-600 to-blue-600">
                  Close
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode("grid")}
          className={`p-2 ${
            viewMode === "grid" ? "bg-sky-500/20 text-sky-300" : "text-gray-400"
          }`}
        >
          <Grid className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode("list")}
          className={`p-2 ${
            viewMode === "list" ? "bg-sky-500/20 text-sky-300" : "text-gray-400"
          }`}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>

      {/* Sort Dropdown */}
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-black/90 border-white/10 text-white">
          <SelectItem value="price">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
          <SelectItem value="rating">Highest Rated</SelectItem>
          <SelectItem value="name">Name A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default FilterPanel;
