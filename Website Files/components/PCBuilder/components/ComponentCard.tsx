import { useState } from "react";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { logger } from "../../../services/logger";
import { trackClick } from "../../../services/sessionTracker";
import { ComponentDetailModal } from "./ComponentDetailModal";
import { ComponentImageGallery } from "../ComponentImageGallery";
import { FeaturedTag } from "../FeaturedTag";
import { PointsBadge } from "../../PointsBadge";
import { PriceTag } from "../../ui/PriceTag";
import { PLACEHOLDER_IMAGE } from "../../data/pcBuilderComponents";
import type { PCBuilderComponent } from "../types";

/**
 * ComponentCard - Main product card for PC components
 *
 * Large component (890 LOC) displaying selectable PC components with rich features:
 *
 * **Core Features:**
 * - Grid and list view modes with responsive layouts
 * - Image gallery carousel with zoom functionality
 * - Option dropdowns for variants (colour, size, storage, etc.)
 * - Featured tag for premium products
 * - Vortex Points badge for loyalty rewards
 * - Price tag with tier styling and subtier labels
 * - Rating stars display
 * - Select button with visual feedback
 * - Click-to-view detail modal
 * - Analytics tracking for product views
 *
 * **Dynamic Options:**
 * - Detects fields: colour/color, size, style, storage, type
 * - Supports array values or comma-separated strings
 * - Deduplicates colour/color (prefers "colour")
 * - State management for selected option variants
 *
 * **View Modes:**
 * - Grid: Vertical card with image carousel, compact layout
 * - List: Horizontal card with 3-column grid (image | content | price/actions)
 *
 * **State Management:**
 * - Local useState for option selections (cached in useMemo)
 * - Modal visibility toggle
 * - Image gallery current index
 *
 * @component
 * @example
 * ```tsx
 * <ComponentCard
 *   component={{
 *     id: "intel-i7-14700k",
 *     name: "Intel Core i7-14700K",
 *     price: 399.99,
 *     images: ["url1", "url2"],
 *     colour: ["Black", "Silver"],
 *     vortexPoints: 400,
 *     featured: true,
 *     rating: 4.8
 *   }}
 *   category="cpu"
 *   isSelected={false}
 *   onSelect={(cat, id) => handleSelection(cat, id)}
 *   viewMode="grid"
 * />
 * ```
 */
interface ComponentCardProps {
  /** Component product data from CMS */
  component: PCBuilderComponent;
  /** Product category (e.g., "cpu", "gpu", "ram") */
  category: string;
  /** Whether this component is currently selected in the build */
  isSelected: boolean;
  /** Callback when component is selected */
  onSelect: (category: string, componentId: string) => void;
  /** Display mode: "grid" (default) or "list" */
  viewMode?: string;
}

export const ComponentCard = ({
  component,
  category,
  isSelected,
  onSelect,
  viewMode = "grid",
}: ComponentCardProps) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Option dropdown state for card view
  const optionFields = ["colour", "color", "size", "style", "storage", "type"];
  const availableOptions = optionFields
    .map((field) => {
      const value = component[field as keyof typeof component];
      if (Array.isArray(value) && value.length > 1) {
        return { key: field, values: value };
      }
      if (typeof value === "string" && value.includes(",")) {
        // Comma separated string
        return { key: field, values: value.split(",").map((v) => v.trim()) };
      }
      return null;
    })
    .filter(Boolean) as { key: string; values: string[] }[];

  // Remove duplicate color/colour - prefer 'colour' if both exist
  const uniqueOptions = availableOptions.filter((opt, _index, self) => {
    if (opt.key === "color") {
      return !self.some((o) => o.key === "colour");
    }
    return true;
  });

  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: string;
  }>(() => {
    // Initialize with first value of each option
    const defaults: { [key: string]: string } = {};
    uniqueOptions.forEach((opt) => {
      defaults[opt.key] = opt.values[0];
    });
    return defaults;
  });

  // Helper to check if there are multiple different prices
  const hasMultiplePrices = (() => {
    if (!component.pricesByOption) return false;

    const pricesByOpt = component.pricesByOption as Record<
      string,
      Record<string, number | { price: number; ean?: string }>
    >;

    const allPrices = new Set<number>();

    // Collect all unique prices from ALL options in pricesByOption
    Object.values(pricesByOpt).forEach((optionPrices) => {
      if (optionPrices && typeof optionPrices === "object") {
        Object.values(optionPrices).forEach((priceData) => {
          const price =
            typeof priceData === "number" ? priceData : priceData.price;
          if (typeof price === "number") {
            allPrices.add(price);
          }
        });
      }
    });

    const result = allPrices.size > 1;
    if (result && component.name) {
      logger.debug(`🏷️  Multiple prices found for ${component.name}:`, {
        prices: Array.from(allPrices),
      });
    }
    return result;
  })();

  // Get the lowest price when there are multiple options
  const lowestPrice = (() => {
    if (!component.pricesByOption) return component.price ?? 0;

    const pricesByOpt = component.pricesByOption as Record<
      string,
      Record<string, number | { price: number; ean?: string }>
    >;

    let minPrice = component.price ?? Infinity;

    // Check all prices in pricesByOption
    Object.values(pricesByOpt).forEach((optionPrices) => {
      if (optionPrices && typeof optionPrices === "object") {
        Object.values(optionPrices).forEach((priceData) => {
          const price =
            typeof priceData === "number" ? priceData : priceData.price;
          if (typeof price === "number" && price < minPrice) {
            minPrice = price;
          }
        });
      }
    });

    return minPrice === Infinity ? component.price ?? 0 : minPrice;
  })();

  // Calculate price based on selected options
  const displayPrice = (() => {
    if (!component.pricesByOption) return component.price;

    const pricesByOpt = component.pricesByOption as Record<
      string,
      Record<string, number | { price: number; ean?: string }>
    >;

    // Check each option for a price override
    for (const opt of uniqueOptions) {
      const sel = selectedOptions[opt.key];
      if (
        sel &&
        pricesByOpt[opt.key] &&
        pricesByOpt[opt.key][sel] !== undefined
      ) {
        const priceData = pricesByOpt[opt.key][sel];
        return typeof priceData === "number" ? priceData : priceData.price;
      }

      // Check alternate spelling (colour/color)
      const altKey =
        opt.key === "colour" ? "color" : opt.key === "color" ? "colour" : null;
      if (
        altKey &&
        sel &&
        pricesByOpt[altKey] &&
        pricesByOpt[altKey][sel] !== undefined
      ) {
        const priceData = pricesByOpt[altKey][sel];
        return typeof priceData === "number" ? priceData : priceData.price;
      }
    }

    return component.price;
  })();

  // Calculate EAN based on selected options
  const displayEan = (() => {
    if (!component.pricesByOption) return component.ean;

    const pricesByOpt = component.pricesByOption as Record<
      string,
      Record<string, number | { price: number; ean?: string }>
    >;

    // Check each option for an EAN override
    for (const opt of uniqueOptions) {
      const sel = selectedOptions[opt.key];
      if (
        sel &&
        pricesByOpt[opt.key] &&
        pricesByOpt[opt.key][sel] !== undefined
      ) {
        const priceData = pricesByOpt[opt.key][sel];
        if (typeof priceData === "object" && priceData.ean) {
          return priceData.ean;
        }
      }

      // Check alternate spelling (colour/color)
      const altKey =
        opt.key === "colour" ? "color" : opt.key === "color" ? "colour" : null;
      if (
        altKey &&
        sel &&
        pricesByOpt[altKey] &&
        pricesByOpt[altKey][sel] !== undefined
      ) {
        const priceData = pricesByOpt[altKey][sel];
        if (typeof priceData === "object" && priceData.ean) {
          return priceData.ean;
        }
      }
    }

    return component.ean;
  })();

  // Compute images based on selected options
  let cardImages = component.images;
  for (const opt of uniqueOptions) {
    const sel = selectedOptions[opt.key];
    if (sel && component.imagesByOption) {
      const imagesByOpt = component.imagesByOption as Record<
        string,
        Record<string, string[]>
      >;

      // Check the option key (e.g., 'colour')
      if (imagesByOpt[opt.key] && imagesByOpt[opt.key][sel]) {
        const imgs = imagesByOpt[opt.key][sel];
        if (imgs && imgs.length) {
          cardImages = imgs;
          break;
        }
      }

      // Also check alternate spelling: if looking for 'colour', try 'color' and vice versa
      const altKey =
        opt.key === "colour" ? "color" : opt.key === "color" ? "colour" : null;
      if (altKey && imagesByOpt[altKey] && imagesByOpt[altKey][sel]) {
        const imgs = imagesByOpt[altKey][sel];
        if (imgs && imgs.length) {
          cardImages = imgs;
          break;
        }
      }
    }
  }

  if (viewMode === "list") {
    return (
      <>
        <Card
          className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.01] group relative overflow-visible backdrop-blur-xl ${
            isSelected
              ? "ring-2 ring-sky-500 bg-sky-500/10 border-sky-500/50"
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-sky-500/30"
          }`}
          onClick={() => {
            // Track product modal view
            const userId = sessionStorage.getItem("vortex_user_id");
            trackClick(
              "product_view",
              {
                productId: component.id,
                productName: component.name,
                category: category,
                price: component.price,
                brand: component.brand,
                viewMode: "list",
              },
              userId || undefined
            );
            setShowDetailModal(true);
          }}
        >
          {/* Featured Tag & Points Badge */}
          <div className="absolute top-2 right-2 z-20 flex items-start gap-2">
            {component.featured && <FeaturedTag />}
            {component.price && component.price > 0 && (
              <PointsBadge
                price={
                  (component as { reducedPrice?: number }).reducedPrice ??
                  component.price
                }
                variant="compact"
              />
            )}
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4 sm:gap-6 items-start sm:items-center">
              {/* Image */}
              <div className="w-full sm:col-span-3">
                <ComponentImageGallery
                  images={
                    cardImages && cardImages.length > 0
                      ? cardImages
                      : Array(4).fill(PLACEHOLDER_IMAGE)
                  }
                  productName={component.name ?? ""}
                  isCompact={true}
                />
              </div>

              {/* Content */}
              <div className="w-full sm:col-span-6 space-y-3">
                <div>
                  {/* Manufacturer Logo or Brand Text */}
                  {component.brandLogo ? (
                    <img
                      src={component.brandLogo}
                      alt={component.brand || "Brand"}
                      className="h-6 mb-2 object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : component.brand ? (
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {component.brand}
                    </div>
                  ) : null}
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                    {component.name}
                  </h3>
                  {component.description &&
                    typeof component.description === "string" && (
                      <div className="text-gray-300 text-sm sm:text-base mb-3">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: component.description,
                          }}
                        />
                      </div>
                    )}
                </div>

                {/* Options dropdowns for list view */}
                {uniqueOptions.length > 0 && (
                  <div
                    className="bg-gradient-to-r from-slate-900/40 to-slate-800/40 rounded-lg p-3 mb-3 border border-sky-500/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
                      <span className="text-xs font-medium text-sky-300 uppercase tracking-wider">
                        Options
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {uniqueOptions.map((opt) => (
                        <div key={opt.key} className="min-w-0">
                          <label className="block text-xs text-gray-400 mb-1 font-medium">
                            {opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}
                          </label>
                          <div className="relative">
                            <select
                              className="w-full bg-slate-800/60 border border-white/10 rounded-md px-2 py-1.5 text-white text-xs font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-sky-400/40 focus:border-sky-400 focus:outline-none backdrop-blur-sm"
                              value={selectedOptions[opt.key] || opt.values[0]}
                              onChange={(e) => {
                                e.stopPropagation();
                                const prevPrice = displayPrice;
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [opt.key]: e.target.value,
                                }));
                                const updated = {
                                  ...selectedOptions,
                                  [opt.key]: e.target.value,
                                };
                                try {
                                  sessionStorage.setItem(
                                    `optionSelections_${component.id}`,
                                    JSON.stringify(updated)
                                  );
                                } catch {
                                  // ignore
                                }
                                try {
                                  const newPrice = (() => {
                                    if (!component.pricesByOption)
                                      return component.price ?? 0;
                                    const precedence = [
                                      "size",
                                      "storage",
                                      "colour",
                                      "color",
                                      "type",
                                      "style",
                                    ];
                                    for (const key of precedence) {
                                      const sel: string | undefined =
                                        updated[key];
                                      if (
                                        sel &&
                                        component.pricesByOption[key] &&
                                        component.pricesByOption[key][sel] !==
                                          undefined
                                      ) {
                                        const priceData =
                                          component.pricesByOption[key][sel];
                                        return typeof priceData === "number"
                                          ? priceData
                                          : priceData.price;
                                      }
                                      const alt =
                                        key === "colour"
                                          ? "color"
                                          : key === "color"
                                          ? "colour"
                                          : null;
                                      if (
                                        alt &&
                                        sel &&
                                        component.pricesByOption[alt] &&
                                        component.pricesByOption[alt][sel] !==
                                          undefined
                                      ) {
                                        const priceData =
                                          component.pricesByOption[alt][sel];
                                        return typeof priceData === "number"
                                          ? priceData
                                          : priceData.price;
                                      }
                                    }
                                    return component.price ?? 0;
                                  })();
                                  if (newPrice !== prevPrice) {
                                    // Track price change analytics
                                    const payload = {
                                      kind: "event",
                                      payload: {
                                        eventType: "price_change",
                                        eventData: {
                                          componentId: component.id,
                                          componentName: component.name,
                                          optionKey: opt.key,
                                          optionValue: e.target.value,
                                          previousPrice: prevPrice,
                                          newPrice,
                                        },
                                        timestamp: new Date().toISOString(),
                                        page: window.location.pathname,
                                      },
                                    };
                                    const data = JSON.stringify(payload);
                                    if (navigator.sendBeacon) {
                                      navigator.sendBeacon(
                                        "/api/analytics/track",
                                        data
                                      );
                                    }
                                  }
                                } catch (error) {
                                  logger.warn("Analytics tracking failed", {
                                    error,
                                  });
                                }
                              }}
                            >
                              {opt.values.map((val: string) => (
                                <option
                                  key={val}
                                  value={val}
                                  className="bg-slate-800 text-white"
                                >
                                  {val}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <svg
                                className="w-3 h-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {/* Core Component Badges */}
                  {component.capacity && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-sky-500/20 text-sky-300 border-sky-500/30"
                    >
                      {component.capacity}GB
                    </Badge>
                  )}
                  {component.cores && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-green-500/20 text-green-300 border-green-500/30"
                    >
                      {component.cores} Cores
                    </Badge>
                  )}
                  {component.threads && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    >
                      {component.threads} Threads
                    </Badge>
                  )}
                  {component.vram && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-green-500/20 text-green-300 border-green-500/30"
                    >
                      {component.vram}GB VRAM
                    </Badge>
                  )}

                  {/* Storage Specific Badges */}
                  {component.driveType && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-purple-500/20 text-purple-300 border-purple-500/30"
                    >
                      {component.driveType}
                    </Badge>
                  )}
                  {component.interface && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    >
                      {component.interface}
                    </Badge>
                  )}

                  {/* Performance Badges */}
                  {component.wattage && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-orange-500/20 text-orange-300 border-orange-500/30"
                    >
                      {component.wattage}W
                    </Badge>
                  )}
                  {component.tdp && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-red-500/20 text-red-300 border-red-500/30"
                    >
                      {component.tdp}W TDP
                    </Badge>
                  )}

                  {/* Operating System Badges */}
                  {component.version && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-slate-500/20 text-slate-300 border-slate-500/30"
                    >
                      {component.version}
                    </Badge>
                  )}
                  {component.licenseType && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-gray-500/20 text-gray-300 border-gray-500/30"
                    >
                      {component.licenseType}
                    </Badge>
                  )}
                  {component.architecture && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                    >
                      {component.architecture}
                    </Badge>
                  )}

                  {/* GPU Platform Badges */}
                  {component.platform && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    >
                      {component.platform}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="w-full sm:col-span-3 text-left sm:text-right space-y-4">
                <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-lg p-3">
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                    {hasMultiplePrices && (
                      <span className="text-sm font-normal text-gray-400 mr-1">
                        From
                      </span>
                    )}
                    £
                    {(hasMultiplePrices
                      ? lowestPrice
                      : displayPrice ?? component.price ?? 0
                    ).toFixed(2)}
                  </div>
                  <div className="flex items-center justify-start sm:justify-end gap-1 text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(component.rating ?? 0)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      ({component.rating})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailModal(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10 hover:border-sky-500/30 w-full backdrop-blur-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    More Details
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(category, component.id);
                    }}
                    size="sm"
                    className={`w-full ${
                      isSelected
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                        : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isSelected ? "Remove" : "Add to Build"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Detail Modal */}
        <ComponentDetailModal
          component={component}
          category={category}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onSelect={onSelect}
          isSelected={isSelected}
        />
      </>
    );
  }

  // Grid view (default)
  return (
    <>
      <Card
        className={`h-full cursor-pointer transition-all duration-300 transform hover:scale-[1.02] group relative overflow-visible ${
          isSelected
            ? "ring-2 ring-sky-500 bg-sky-500/10 border-sky-500/50"
            : "bg-white/5 border-white/10 hover:bg-white/10"
        }`}
        onClick={() => {
          // Track product modal view
          const userId = sessionStorage.getItem("vortex_user_id");
          trackClick(
            "product_view",
            {
              productId: component.id,
              productName: component.name,
              category: category,
              price: component.price,
              brand: component.brand,
              viewMode: "grid",
            },
            userId || undefined
          );
          setShowDetailModal(true);
        }}
      >
        {/* Featured Tag & Points Badge */}
        <div className="absolute top-2 right-2 z-20 flex items-start gap-2">
          {component.featured && <FeaturedTag />}
          {component.price && component.price > 0 && (
            <PointsBadge
              price={
                (component as { reducedPrice?: number }).reducedPrice ??
                component.price
              }
              variant="compact"
            />
          )}
        </div>
        <div className="p-6 space-y-4">
          {/* Image Gallery - updates based on selected option */}
          <ComponentImageGallery
            isCompact={true}
            images={
              cardImages && cardImages.length > 0
                ? cardImages
                : Array(4).fill(PLACEHOLDER_IMAGE)
            }
            productName={component.name ?? ""}
          />

          {/* Content */}
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                {/* Manufacturer Logo or Brand Text */}
                {component.brandLogo ? (
                  <img
                    src={component.brandLogo}
                    alt={component.brand || "Brand"}
                    className="h-5 mb-2 object-contain"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : component.brand ? (
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {component.brand}
                  </div>
                ) : null}
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-sky-300 transition-colors">
                  {component.name}
                </h3>
                {/* Compact options indicator for grid view to keep heights consistent */}
                {uniqueOptions.length > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className="text-xs py-1 px-2 bg-sky-500/20 text-sky-300 border-sky-500/30"
                    >
                      Options available
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(component.rating ?? 0)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      ({component.rating})
                    </span>
                  </div>
                  {component.ean && typeof component.ean === "string" ? (
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(displayEan || component.ean)}
                    </span>
                  ) : displayEan ? (
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(displayEan)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {component.capacity && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-blue-500/20 text-blue-300 border-blue-500/30"
                >
                  {component.capacity}GB
                </Badge>
              )}
              {component.cores && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-green-500/20 text-green-300 border-green-500/30"
                >
                  {component.cores} Cores
                </Badge>
              )}
              {component.vram && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-green-500/20 text-green-300 border-green-500/30"
                >
                  {component.vram}GB VRAM
                </Badge>
              )}
              {component.platform && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                >
                  {component.platform}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="mb-3">
              {hasMultiplePrices && (
                <span className="block text-sm font-normal text-gray-400 mb-1">
                  From
                </span>
              )}
              <PriceTag
                price={
                  hasMultiplePrices
                    ? lowestPrice
                    : displayPrice ?? component.price ?? 0
                }
                reducedPrice={component.reducedPrice ?? undefined}
                size="lg"
                align="left"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailModal(true);
                }}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-sky-500/30"
              >
                <Eye className="w-3 h-3 mr-1" />
                More Details
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(category, component.id);
                }}
                className={`flex-1 ${
                  isSelected
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                }`}
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                {isSelected ? "Remove" : "Add to Build"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <ComponentDetailModal
        component={component}
        category={category}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onSelect={onSelect}
        isSelected={isSelected}
      />
    </>
  );
};
