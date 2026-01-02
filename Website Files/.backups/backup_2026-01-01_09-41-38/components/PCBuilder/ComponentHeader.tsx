import React, { memo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Slider } from "../ui/slider";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { AlertTriangle, Grid, List } from "lucide-react";

interface FilterDefinition {
  key: string;
  label: string;
}

interface ComponentHeaderProps {
  activeCategory: string;
  filteredCount: number;
  totalComponentsInCategory: number;
  appliedFiltersCount: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  brandOptions: string[];
  selectedBrands: string[];
  setSelectedBrands: React.Dispatch<React.SetStateAction<string[]>>;
  priceMin: number;
  priceMax: number;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  optionFilterValues: Record<string, string[]>;
  optionFilters: Record<string, string[]>;
  setOptionFilters: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  categoryOptionFilters: Record<string, FilterDefinition[]>;
  rangeFilterBounds: Record<string, { min: number; max: number }>;
  rangeFilters: Record<string, [number, number]>;
  setRangeFilters: React.Dispatch<
    React.SetStateAction<Record<string, [number, number]>>
  >;
  categoryRangeFilters: Record<string, FilterDefinition[]>;
  viewMode: "grid" | "list" | string;
  setViewMode: (mode: "grid" | "list") => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  showCompatibilityStatus: boolean;
  onShowIncompatibilityModal: () => void;
}

const getCategoryTitle = (activeCategory: string) => {
  switch (activeCategory) {
    case "case":
      return "PC Cases";
    case "motherboard":
      return "Motherboards";
    case "cpu":
      return "Processors";
    case "gpu":
      return "Graphics Cards (GPU)";
    case "ram":
      return "Memory (RAM)";
    case "psu":
      return "Power Supply Units (PSU)";
    default:
      return activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
  }
};

const getCategoryDescription = (activeCategory: string) => {
  switch (activeCategory) {
    case "case":
      return "Choose the perfect PC case for your build";
    case "motherboard":
      return "Choose the perfect motherboard for your build";
    case "cpu":
      return "Choose the perfect processor for your build";
    case "gpu":
      return "Choose the perfect graphics card for your build";
    case "ram":
      return "Choose the perfect memory for your build";
    case "psu":
      return "Choose the perfect power supply for your build";
    default:
      return `Choose the perfect ${activeCategory} for your build`;
  }
};

export const ComponentHeader = memo(
  ({
    activeCategory,
    filteredCount,
    totalComponentsInCategory,
    appliedFiltersCount,
    searchQuery,
    setSearchQuery,
    brandOptions,
    selectedBrands,
    setSelectedBrands,
    priceMin,
    priceMax,
    priceRange,
    setPriceRange,
    optionFilterValues,
    optionFilters,
    setOptionFilters,
    categoryOptionFilters,
    rangeFilterBounds,
    rangeFilters,
    setRangeFilters,
    categoryRangeFilters,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    showCompatibilityStatus,
    onShowIncompatibilityModal,
  }: ComponentHeaderProps) => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white capitalize">
            {getCategoryTitle(activeCategory)}
          </h2>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            {getCategoryDescription(activeCategory)}
          </p>
          {showCompatibilityStatus && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
                <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                <span className="text-xs text-sky-300">
                  {filteredCount} of {totalComponentsInCategory} compatible
                </span>
              </div>
              {filteredCount < totalComponentsInCategory && (
                <button
                  onClick={onShowIncompatibilityModal}
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

        <div className="flex items-center gap-3">
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
                <div>
                  <div className="text-sm text-gray-300 mb-2">Search</div>
                  <Input
                    placeholder={`Search ${activeCategory}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

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
                                setSelectedBrands((prev) =>
                                  v
                                    ? [...prev, brand]
                                    : prev.filter((b) => b !== brand)
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

                {Object.keys(optionFilterValues).length > 0 && (
                  <div className="space-y-4">
                    {(categoryOptionFilters[activeCategory] || []).map(
                      (def) => {
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
                                          const arr = new Set(
                                            next[def.key] || []
                                          );
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
                      }
                    )}
                  </div>
                )}

                {Object.keys(rangeFilterBounds).length > 0 && (
                  <div className="space-y-4">
                    {(categoryRangeFilters[activeCategory] || []).map((def) => {
                      const bounds = rangeFilterBounds[def.key];
                      if (!bounds) return null;
                      const current = rangeFilters[def.key] || [
                        bounds.min,
                        bounds.max,
                      ];
                      return (
                        <div key={def.key}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-300">
                              {def.label}
                            </div>
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
                                [def.key]: [
                                  Number(vals[0]),
                                  Number(vals[1]),
                                ] as [number, number],
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

          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`p-2 ${
                viewMode === "grid"
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-gray-400"
              }`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`p-2 ${
                viewMode === "list"
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-gray-400"
              }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

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
      </div>
    );
  }
);

ComponentHeader.displayName = "ComponentHeader";
