/**
 * @component SelectedBuildDisplay
 * @description Displays selected PC components with details, prices, and action buttons.
 * Shows each selected component as a card with image, specs, price, and actions
 * (swap, remove). Includes build-level actions (checkout, clear, share, save).
 *
 * Features:
 * - Component cards with images, names, brands, and specs
 * - Category-specific badges (cores, VRAM, capacity, wattage)
 * - Stock status indicators
 * - Price display with ratings
 * - Swap component button (navigate to category)
 * - Remove component button
 * - Build-level action buttons (Add to Cart, Clear, Share, Save, Compare)
 * - Missing components warning when build incomplete
 * - Component count display (x/8)
 *
 * @example
 * ```tsx
 * <SelectedBuildDisplay
 *   selectedComponents={{ gpu: "nvidia-4090", cpu: "intel-i9" }}
 *   activeComponentData={componentMap}
 *   getCategoryLabel={getCategoryLabel}
 *   getComponentImage={getImageFn}
 *   renderRichText={renderFn}
 *   getTotalPrice={5000}
 *   getSelectedComponentsCount={2}
 *   onCheckout={handleCheckout}
 *   onClearBuild={handleClear}
 *   onShareBuild={handleShare}
 *   onSaveForComparison={handleSave}
 *   onShowComparison={handleShowComparison}
 *   onRemoveComponent={handleRemove}
 *   onSwapComponent={handleSwap}
 *   onCategoryChange={handleCategoryChange}
 *   buildSectionRef={ref}
 *   savedBuildsCount={1}
 *   activeCategory="gpu"
 *   currentPage={1}
 * />
 * ```
 */

import React, { Ref } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  CheckCircle,
  RefreshCw,
  X,
  ShoppingCart,
  Trash2,
  Share2,
  Bookmark,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { PriceTag } from "../../ui/PriceTag";
import { ProgressiveImage } from "../../ProgressiveImage";
import { toast } from "sonner";
import { buildFullShareUrl } from "../../../services/buildSharing";
import { logger } from "../../../services/logger";
import { trackClick } from "../../../services/sessionTracker";
import {
  PCBuilderComponent,
  SelectedComponentIds,
  ComponentDataMap,
} from "../types";

/**
 * Props for SelectedBuildDisplay component
 */
interface SelectedBuildDisplayProps {
  /** Map of selected components by category */
  selectedComponents: SelectedComponentIds;
  /** Map of component data by category for lookup */
  activeComponentData: ComponentDataMap;
  /** Function to get display label for category */
  getCategoryLabel: (category: string) => string;
  /** Function to get image URL for component */
  getComponentImage: (component: PCBuilderComponent) => string;
  /** Function to render rich text descriptions */
  renderRichText: (text: string) => React.ReactNode;
  /** Total price of selected components */
  getTotalPrice: number;
  /** Number of selected components */
  getSelectedComponentsCount: number;
  /** Callback when adding to cart */
  onCheckout: () => Promise<void>;
  /** Callback when clearing entire build */
  onClearBuild: () => void;
  /** Callback when sharing build */
  onShareBuild: (url: string) => void;
  /** Callback when saving for comparison */
  onSaveForComparison: () => void;
  /** Callback when showing comparison modal */
  onShowComparison: () => void;
  /** Callback when removing a component */
  onRemoveComponent: (category: string) => void;
  /** Callback when swapping a component */
  onSwapComponent: (category: string) => void;
  /** Callback when changing active category */
  onCategoryChange: (category: string) => void;
  /** Ref to build section for scroll */
  buildSectionRef: Ref<HTMLDivElement>;
  /** Number of saved builds for comparison */
  savedBuildsCount: number;
  /** Map of selected peripherals (for share URL) */
  selectedPeripherals: Record<string, string>;
}

/**
 * SelectedBuildDisplay component
 * Shows cards for each selected component with actions and build-level controls
 */
export const SelectedBuildDisplay: React.FC<SelectedBuildDisplayProps> = ({
  selectedComponents,
  activeComponentData,
  getCategoryLabel,
  getComponentImage,
  renderRichText: _renderRichText,
  getTotalPrice,
  getSelectedComponentsCount,
  onCheckout,
  onClearBuild,
  onShareBuild,
  onSaveForComparison,
  onShowComparison,
  onRemoveComponent,
  onSwapComponent,
  onCategoryChange,
  buildSectionRef,
  savedBuildsCount,
  selectedPeripherals,
}) => {
  // Don't render if no components selected
  if (Object.keys(selectedComponents).length === 0) {
    return null;
  }

  const handleSwapClick = (category: string) => {
    onSwapComponent(category);
    onCategoryChange(category);
    requestAnimationFrame(() => {
      if (buildSectionRef && "current" in buildSectionRef) {
        (buildSectionRef.current as HTMLDivElement)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  };

  const handleShareBuild = async () => {
    logger.debug("Share Build button clicked");
    try {
      const base = window.location.href.split("?")[0];
      const shareUrl = buildFullShareUrl(
        base,
        selectedComponents,
        selectedPeripherals as unknown as Record<string, string[]>
      );

      if (shareUrl === base) {
        toast.warning("Select parts to share your build.");
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Build link copied to clipboard! 🎉");

        try {
          const userId = sessionStorage.getItem("vortex_user_id");
          const buildTotalPrice = getTotalPrice;
          trackClick(
            "build_share",
            {
              shareUrl,
              totalPrice: buildTotalPrice,
              componentsCount: Object.keys(selectedComponents).length,
            },
            userId || undefined
          );
          trackClick(
            "build_complete",
            {
              totalPrice: buildTotalPrice,
              componentsCount: Object.keys(selectedComponents).length,
              peripheralsCount: Object.keys(selectedPeripherals).length,
            },
            userId || undefined
          );
        } catch (err) {
          logger.error("Failed to track build completion", err);
        }

        onShareBuild(shareUrl);
      }
    } catch (e) {
      logger.error("Failed to copy build link:", e);
      toast.error("Failed to copy build link.");
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Your Build Components
          </h2>
          <p className="text-gray-400 mt-1">
            Review your selections and swap components as needed
          </p>
        </div>
        <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
          {Object.keys(selectedComponents).length}/8 Components
        </Badge>
      </div>

      {/* Component Cards Grid */}
      <div className="grid gap-4">
        {Object.entries(selectedComponents).map(([category, componentId]) => {
          const categoryData = (activeComponentData as ComponentDataMap)[
            category as keyof ComponentDataMap
          ];
          const component = categoryData?.find((c) => c.id === componentId) as
            | PCBuilderComponent
            | undefined;

          if (!component) return null;

          const categoryLabel = getCategoryLabel(category);
          const image = getComponentImage(component);

          // Compute base price from session storage selections
          const basePriceForDisplay = (() => {
            const base =
              typeof component.price === "number" ? component.price : 0;
            const pricesByOpt = (
              component as {
                pricesByOption?: Record<
                  string,
                  Record<string, number | { price: number; ean?: string }>
                >;
              }
            ).pricesByOption;

            try {
              if (pricesByOpt && component.id) {
                const raw = sessionStorage.getItem(
                  `optionSelections_${component.id}`
                );
                const selections = raw
                  ? (JSON.parse(raw) as Record<string, string>)
                  : undefined;
                const precedence = [
                  "size",
                  "storage",
                  "colour",
                  "color",
                  "type",
                  "style",
                ];

                for (const key of precedence) {
                  const sel = selections?.[key];
                  if (
                    sel &&
                    pricesByOpt[key] &&
                    pricesByOpt[key][sel] !== undefined
                  ) {
                    const pd = pricesByOpt[key][sel];
                    return typeof pd === "number" ? pd : pd.price;
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
                    pricesByOpt[alt] &&
                    pricesByOpt[alt][sel] !== undefined
                  ) {
                    const pd = pricesByOpt[alt][sel];
                    return typeof pd === "number" ? pd : pd.price;
                  }
                }
              }
            } catch {
              // ignore errors and fall back to base price
            }

            return base;
          })();

          return (
            <Card
              key={category}
              className="bg-white/5 border-white/10 p-4 hover:border-sky-500/30 transition-all"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Image */}
                <div className="sm:col-span-2">
                  <div className="relative aspect-square w-full max-w-[120px] rounded-lg overflow-hidden bg-white/5 border border-white/10">
                    <ProgressiveImage
                      src={image}
                      alt={component.name || "Component"}
                      className="w-full h-full p-2"
                      shimmer
                      lazy
                      aspectRatio="1/1"
                      placeholderSrc="/vortexpcs-logo.png"
                      srcSet={`${image}?w=64 64w, ${image}?w=96 96w, ${image}?w=128 128w, ${image}?w=160 160w`}
                      sizes="(max-width: 640px) 25vw, 120px"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="sm:col-span-7 space-y-2">
                  <div>
                    <Badge
                      variant="outline"
                      className="mb-2 text-xs border-sky-500/30 text-sky-400"
                    >
                      {categoryLabel}
                    </Badge>
                    <h3 className="text-lg font-bold text-white">
                      {component.name}
                    </h3>
                    {component.brand && (
                      <p className="text-sm text-gray-400">{component.brand}</p>
                    )}
                  </div>

                  {/* Description */}
                  {component.description &&
                    typeof component.description === "string" && (
                      <div className="text-sm text-gray-300">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: component.description,
                          }}
                        />
                      </div>
                    )}

                  {/* Category-specific specs */}
                  <div className="flex flex-wrap gap-2">
                    {category === "cpu" && component.cores && (
                      <Badge variant="secondary" className="text-xs">
                        {component.cores} Cores
                      </Badge>
                    )}
                    {category === "gpu" && component.vram && (
                      <Badge variant="secondary" className="text-xs">
                        {component.vram}GB VRAM
                      </Badge>
                    )}
                    {category === "ram" && component.capacity && (
                      <Badge variant="secondary" className="text-xs">
                        {component.capacity}GB
                      </Badge>
                    )}
                    {category === "psu" && component.wattage && (
                      <Badge variant="secondary" className="text-xs">
                        {component.wattage}W
                      </Badge>
                    )}
                    {category === "storage" &&
                      component.storageCapacity !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {component.storageCapacity as number}
                        </Badge>
                      )}
                    {component.inStock !== undefined && (
                      <Badge
                        className={
                          component.inStock
                            ? "bg-green-500/20 border-green-500/40 text-green-400"
                            : "bg-red-500/20 border-red-500/40 text-red-400"
                        }
                      >
                        {component.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="sm:col-span-3 flex flex-col items-end gap-3">
                  <div className="text-right">
                    <PriceTag
                      price={basePriceForDisplay}
                      reducedPrice={
                        (component as { reducedPrice?: number }).reducedPrice
                      }
                      size="lg"
                      align="right"
                    />
                    {component.rating && (
                      <div className="flex items-center gap-1 text-sm text-yellow-400 justify-end mt-1">
                        <span>★</span>
                        <span>{component.rating}/5</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      onClick={() => handleSwapClick(category)}
                      variant="outline"
                      size="sm"
                      className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Swap Component
                    </Button>
                    <Button
                      onClick={() => onRemoveComponent(category)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={onCheckout}
          className="flex-1 min-w-[200px] bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white h-12"
          disabled={getSelectedComponentsCount === 0}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </Button>

        <Button
          onClick={onClearBuild}
          variant="outline"
          className="flex-1 min-w-[150px] border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 h-12"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Build
        </Button>

        <Button
          onClick={handleShareBuild}
          variant="secondary"
          className="flex-1 min-w-[150px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 h-12"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Build
        </Button>

        <Button
          onClick={onSaveForComparison}
          variant="secondary"
          className="flex-1 min-w-[200px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 h-12"
        >
          <Bookmark className="w-4 h-4 mr-2" />
          Save for Comparison
        </Button>

        {savedBuildsCount > 0 && (
          <Button
            onClick={onShowComparison}
            variant="secondary"
            className="flex-1 min-w-[200px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 h-12"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Compare Builds ({savedBuildsCount})
          </Button>
        )}
      </div>

      {/* Missing Components Warning */}
      {Object.keys(selectedComponents).length < 8 && (
        <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-300">
                Incomplete Build
              </p>
              <p className="text-sm text-yellow-400/80 mt-1">
                You still need to select{" "}
                {8 - Object.keys(selectedComponents).length} more component
                {8 - Object.keys(selectedComponents).length > 1 ? "s" : ""} to
                complete your build.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

SelectedBuildDisplay.displayName = "SelectedBuildDisplay";
