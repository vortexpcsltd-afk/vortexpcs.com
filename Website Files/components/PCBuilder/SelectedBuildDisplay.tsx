import React from "react";
import {
  CheckCircle,
  RefreshCw,
  X,
  ShoppingCart,
  AlertCircle,
  Trash2,
  Share2,
  Bookmark,
  TrendingUp,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ProgressiveImage } from "../ProgressiveImage";
import { PriceTag } from "../ui/PriceTag";
import { Document } from "@contentful/rich-text-types";
import type { PCComponent } from "../../services/cms";
import type {
  PCBuilderComponent,
  SelectedComponentIds,
  ComponentDataMap,
} from "../PCBuilder";

interface SelectedBuildDisplayProps {
  selectedComponents: SelectedComponentIds;
  selectedPeripherals: Record<string, string[]>;
  activeComponentData: ComponentDataMap;
  getTotalPrice: number;
  getSelectedComponentsCount: number;
  getCategoryLabel: (categoryId: string) => string;
  getComponentImage: (component: PCBuilderComponent | PCComponent) => string;
  renderRichText: (content?: string | Document) => React.ReactNode;
  onComponentSwap: (category: string) => void;
  onComponentRemove: (category: string) => void;
  onCheckoutWithCompatibility: () => void;
  onClearBuild: () => void;
  onShareBuild: () => Promise<void>;
  onSaveForComparison: () => void;
  onComparisonClick: () => void;
  savedBuildsForComparison: Array<{ id?: string }>;
  buildSectionRef?: React.RefObject<HTMLDivElement>;
}

/**
 * SelectedBuildDisplay Component
 *
 * Displays the currently selected build components with:
 * - Component cards with images, details, and pricing
 * - Swap and remove action buttons per component
 * - Build action buttons (Add to Cart, Clear, Share, Save for Comparison)
 * - Missing components warning
 * - Build summary with component count
 *
 * @component
 */
export const SelectedBuildDisplay: React.FC<SelectedBuildDisplayProps> = ({
  selectedComponents,
  activeComponentData,
  getCategoryLabel,
  getComponentImage,
  renderRichText,
  onComponentSwap,
  onComponentRemove,
  onCheckoutWithCompatibility,
  onClearBuild,
  onShareBuild,
  onSaveForComparison,
  onComparisonClick,
  savedBuildsForComparison,
}) => {
  // Only show if components are selected
  if (Object.keys(selectedComponents).length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
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

      <div className="grid gap-4">
        {Object.entries(selectedComponents).map(([category, componentId]) => {
          const component = (activeComponentData as ComponentDataMap)[
            category as keyof ComponentDataMap
          ]?.find((c) => c.id === componentId);

          if (!component) return null;

          const categoryLabel = getCategoryLabel(category);
          const image = getComponentImage(component);

          // Compute base price for display (consider option overrides)
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
              // ignore
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

                  {/* Key Specs */}
                  {component.description && (
                    <div className="text-sm text-gray-300">
                      {renderRichText(component.description)}
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
                    {category === "storage" && component.storageCapacity ? (
                      <Badge variant="secondary" className="text-xs">
                        {String(component.storageCapacity)}
                      </Badge>
                    ) : null}
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
                      onClick={() => onComponentSwap(category)}
                      variant="outline"
                      size="sm"
                      className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Swap Component
                    </Button>
                    <Button
                      onClick={() => onComponentRemove(category)}
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
          onClick={onCheckoutWithCompatibility}
          className="flex-1 min-w-[200px] bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white h-12"
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
          onClick={onShareBuild}
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

        {savedBuildsForComparison.length > 0 && (
          <Button
            onClick={onComparisonClick}
            variant="secondary"
            className="flex-1 min-w-[200px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 h-12"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Compare Builds ({savedBuildsForComparison.length})
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

export default SelectedBuildDisplay;
