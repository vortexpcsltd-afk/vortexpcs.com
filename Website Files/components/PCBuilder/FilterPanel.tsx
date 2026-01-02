import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Grid, List, Sliders } from "lucide-react";
import type { CategoryKey } from "../PCBuilder";
import {
  CATEGORY_OPTION_FILTERS,
  CATEGORY_RANGE_FILTERS,
} from "./filterConstants";

interface FilterPanelProps {
  activeCategory: CategoryKey;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBrands: string[];
  setSelectedBrands: (brands: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  optionFilters: Record<string, string[]>;
  setOptionFilters: (filters: Record<string, string[]>) => void;
  rangeFilters: Record<string, [number, number]>;
  setRangeFilters: (filters: Record<string, [number, number]>) => void;
  brandOptions: string[];
  priceMin: number;
  priceMax: number;
  optionFilterValues: Record<string, string[]>;
  rangeFilterBounds: Record<string, { min: number; max: number }>;
  appliedFiltersCount: number;
  viewMode: string;
  setViewMode: (mode: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

/**
 * FilterPanel Component
 *
 * Renders the filters drawer with search, brand, price, and category-specific filters.
 * Also includes view mode toggle (grid/list) and sort dropdown.
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  activeCategory,
  searchQuery,
  setSearchQuery,
  selectedBrands,
  setSelectedBrands,
  priceRange,
  setPriceRange,
  optionFilters,
  setOptionFilters,
  rangeFilters,
  setRangeFilters,
  brandOptions,
  priceMin,
  priceMax,
  optionFilterValues,
  rangeFilterBounds,
  appliedFiltersCount,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
}) => {
  return (
    <div className="flex items-center gap-3">
      {/* Filters Drawer */}
      <Sheet>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-gray-200 hover:bg-white/20 transition-colors"
            title="Filter components"
          >
            <Sliders className="w-4 h-4" />
            Filters
            {appliedFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 text-xs">
                {appliedFiltersCount}
              </span>
            )}
          </button>
        </div>

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
                          onCheckedChange={(v: boolean) => {
                            const newBrands = v
                              ? [...selectedBrands, brand]
                              : selectedBrands.filter(
                                  (b: string) => b !== brand
                                );
                            setSelectedBrands(newBrands);
                          }}
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
                                onCheckedChange={(v: boolean) => {
                                  const next = { ...optionFilters };
                                  const arr = new Set(next[def.key] || []);
                                  if (v) arr.add(val);
                                  else arr.delete(val);
                                  next[def.key] = Array.from(arr);
                                  setOptionFilters(next);
                                }}
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
                        onValueChange={(vals: number[]) => {
                          const next = {
                            ...rangeFilters,
                            [def.key]: [Number(vals[0]), Number(vals[1])] as [
                              number,
                              number
                            ],
                          };
                          setRangeFilters(next);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <SheetFooter>
            <div className="flex items-center justify-between gap-2 w-full">
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
};

export default FilterPanel;
