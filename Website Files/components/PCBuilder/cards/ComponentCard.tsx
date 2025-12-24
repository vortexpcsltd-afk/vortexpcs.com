import React, { useState, ReactNode } from "react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Heart, Star } from "lucide-react";
import { ComponentDetailModal } from "../modals";
import { ComponentImageGallery } from "../ComponentImageGallery";
import { BrandLogo } from "../../ui/brand-logo";
import { FeaturedTag } from "../FeaturedTag";
import { PCBuilderComponent } from "../types";
import { trackClick } from "../../../services/sessionTracker";
import { logger } from "../../../services/logger";
import { PLACEHOLDER_IMAGE } from "../../data/pcBuilderComponents";
import type { Document } from "@contentful/rich-text-types";

export interface ComponentCardProps {
  component: PCBuilderComponent;
  category: string;
  isSelected: boolean;
  onSelect: (category: string, componentId: string) => void;
  viewMode?: string;
  renderRichText: (content?: string | Document) => ReactNode;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  category,
  isSelected,
  onSelect,
  viewMode = "grid",
  renderRichText,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Add images array to each component (use actual images or placeholders)
  const componentWithImages = {
    ...component,
    images:
      component.images && component.images.length > 0
        ? component.images
        : Array(4).fill(PLACEHOLDER_IMAGE),
  };

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
      logger.info(`💷 Multiple prices found for ${component.name}:`, {
        prices: Array.from(allPrices),
      });
    }
    return result;
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

  const priceToDisplay = displayPrice ?? component.price ?? 0;
  const hasOptionsAvailable =
    hasMultiplePrices || uniqueOptions.length > 0 || !!component.pricesByOption;

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
          {/* Featured Tag */}
          {component.featured && (
            <div className="absolute top-2 right-2 z-20">
              <FeaturedTag />
            </div>
          )}
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
                  <BrandLogo
                    src={component.brandLogo}
                    brand={component.brand}
                    size="sm"
                    className="mb-2"
                    withBackground
                  />
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                    {component.name}
                  </h3>
                  <div className="text-gray-300 text-sm sm:text-base mb-3">
                    {renderRichText(component.description)}
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
                              {opt.key.charAt(0).toUpperCase() +
                                opt.key.slice(1)}
                            </label>
                            <div className="relative">
                              <select
                                className="w-full bg-slate-800/60 border border-white/10 rounded-md px-2 py-1.5 text-white text-xs font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-sky-400/40 focus:border-sky-400 focus:outline-none backdrop-blur-sm"
                                value={
                                  selectedOptions[opt.key] || opt.values[0]
                                }
                                onChange={(
                                  e: React.ChangeEvent<HTMLSelectElement>
                                ) => {
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
                </div>

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
              <div className="col-span-3 text-right space-y-3">
                <div>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    £{(component.price ?? 0).toFixed(2)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => {
                      const ratingValue = component.rating ?? 0;
                      return (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(ratingValue) ? "fill-current" : ""
                          }`}
                        />
                      );
                    })}
                    <span className="text-xs text-gray-400 ml-1">
                      ({component.rating})
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setIsFavorited(!isFavorited);
                    }}
                    className={`p-2 ${
                      isFavorited
                        ? "text-red-400 hover:text-red-300"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </>
    );
  }

  // Grid view (default)
  return (
    <>
      <Card
        className={`h-full cursor-pointer transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden ${
          isSelected
            ? "ring-2 ring-green-500 bg-green-500/10 border-green-500/50"
            : "bg-white/5 border-white/10 hover:bg-white/10"
        }`}
        onClick={() => {
          // Track component modal view
          const userId = sessionStorage.getItem("vortex_user_id");
          trackClick(
            "product_view",
            {
              productId: component.id,
              productName: component.name,
              category: category,
              price: component.price,
              type: component.type,
              productType: "component",
              viewMode: "grid",
            },
            userId || undefined
          );
          setShowDetailModal(true);
        }}
      >
        {/* Featured Tag */}
        {component.featured && (
          <div className="absolute top-2 right-2 z-20">
            <FeaturedTag />
          </div>
        )}
        <div className="p-6 space-y-4">
          {/* Image Gallery */}
          <ComponentImageGallery
            isCompact={true}
            images={componentWithImages.images}
            productName={component.name ?? "Product"}
          />

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                {component.brand && (
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {component.brand}
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-0.5 group-hover:text-green-300 transition-colors">
                  {component.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {component.rating ? (
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => {
                        const ratingValue = component.rating ?? 0;
                        return (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(ratingValue) ? "fill-current" : ""
                            }`}
                          />
                        );
                      })}
                      <span className="text-xs text-gray-400 ml-1">
                        ({component.rating})
                      </span>
                    </div>
                  ) : null}

                  {component.ean && typeof component.ean === "string" ? (
                    <span className="text-[11px] text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(displayEan || component.ean)}
                    </span>
                  ) : displayEan ? (
                    <span className="text-[11px] text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(displayEan)}
                    </span>
                  ) : null}

                  {hasOptionsAvailable && (
                    <Badge className="text-[11px] bg-sky-500/20 border-sky-500/40 text-sky-300">
                      Options available
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  setIsFavorited(!isFavorited);
                }}
                className={`p-2 ${
                  isFavorited
                    ? "text-red-400 hover:text-red-300"
                    : "text-gray-400 hover:text-white"
                }`}
                aria-label={
                  isFavorited ? "Remove from favorites" : "Save to favorites"
                }
              >
                <Heart
                  className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
              </Button>
            </div>

            <p className="text-gray-400 text-sm line-clamp-3">
              {component.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {component.type && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-purple-500/20 text-purple-300 border-purple-500/30"
                >
                  {component.type}
                </Badge>
              )}
              {component.wireless !== undefined && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                >
                  {component.wireless ? "Wireless" : "Wired"}
                </Badge>
              )}
              {component.rgb && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-pink-500/20 text-pink-300 border-pink-500/30"
                >
                  RGB
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                £{priceToDisplay.toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    setShowDetailModal(true);
                  }}
                >
                  More Details
                </Button>
                <Button
                  size="sm"
                  className={`min-w-[110px] bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white ${
                    isSelected ? "shadow-[0_0_15px_rgba(34,197,94,0.35)]" : ""
                  }`}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onSelect(category, component.id);
                  }}
                >
                  {isSelected ? "Selected" : "Add to Build"}
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
        renderRichText={renderRichText}
      />
    </>
  );
};
