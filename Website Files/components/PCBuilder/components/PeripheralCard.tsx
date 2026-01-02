import React, { useState } from "react";
import { Star, Heart, Plus, CheckCircle } from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { logger } from "../../../services/logger";
import { trackClick } from "../../../services/sessionTracker";
import { ComponentImageGallery } from "../ComponentImageGallery";
import { FeaturedTag } from "../FeaturedTag";
import { PointsBadge } from "../../PointsBadge";
import { PriceTag } from "../../ui/PriceTag";
import { OptionalExtraDetailModal } from "../modals/OptionalExtraDetailModal";
import { PLACEHOLDER_IMAGE } from "../../data/pcBuilderComponents";
import type { PCOptionalExtra } from "../../../services/cms";

/**
 * PeripheralCard - Displays optional peripheral/accessory products
 *
 * Features:
 * - Grid and list view modes
 * - Image gallery carousel with 4 images
 * - Featured tag for premium products
 * - Vortex Points badge for loyalty rewards
 * - Price tag with tier styling
 * - Add/Remove toggle button (green checkmark when selected)
 * - Favorite heart button
 * - Click-to-view detail modal
 * - Analytics tracking for product views
 * - Fallback placeholder image handling
 *
 * View Modes:
 * - Grid: Compact card with image, title, price, quick actions
 * - List: Wide card with horizontal layout, more details visible
 *
 * @component
 * @example
 * ```tsx
 * <PeripheralCard
 *   peripheral={{
 *     id: "logitech-g502",
 *     name: "Logitech G502 HERO",
 *     price: 79.99,
 *     images: ["url1", "url2"],
 *     vortexPoints: 80,
 *     featured: true
 *   }}
 *   category="mouse"
 *   isSelected={false}
 *   onToggle={(cat, id) => handleToggle(cat, id)}
 *   viewMode="grid"
 * />
 * ```
 */
interface PeripheralCardProps {
  /** Peripheral product data from CMS */
  peripheral: PCOptionalExtra;
  /** Product category (e.g., "mouse", "keyboard", "monitor") */
  category: string;
  /** Whether this peripheral is currently selected */
  isSelected: boolean;
  /** Callback when peripheral is added/removed */
  onToggle: (category: string, peripheralId: string) => void;
  /** Display mode: "grid" (default) or "list" */
  viewMode?: string;
}

export const PeripheralCard: React.FC<PeripheralCardProps> = ({
  peripheral,
  category,
  isSelected,
  onToggle,
  viewMode = "grid",
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Use actual images from CMS data, fallback to placeholder if none
  const peripheralImages =
    peripheral.images && peripheral.images.length > 0
      ? peripheral.images
      : Array(4).fill(PLACEHOLDER_IMAGE);

  // Debug logging for image data
  const firstImage = peripheral.images?.[0];
  let firstImagePreview = "none";
  if (typeof firstImage === "string" && firstImage) {
    firstImagePreview = (firstImage as string).substring(0, 50) + "...";
  }

  logger.debug(`🔍 PeripheralCard for ${peripheral.name}:`, {
    hasImages: peripheral.images ? peripheral.images.length : 0,
    firstImage: firstImagePreview,
    usingFallback: !(peripheral.images && peripheral.images.length > 0),
  });

  if (viewMode === "list") {
    return (
      <>
        <Card
          className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.01] relative overflow-visible ${
            isSelected
              ? "ring-2 ring-green-500 bg-green-500/10 border-green-500/50"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
          onClick={() => {
            // Track peripheral modal view
            const userId = sessionStorage.getItem("vortex_user_id");
            trackClick(
              "product_view",
              {
                productId: peripheral.id,
                productName: peripheral.name,
                category: category,
                price: peripheral.price,
                type: peripheral.type,
                productType: "peripheral",
                viewMode: "list",
              },
              userId || undefined
            );
            setShowDetailModal(true);
          }}
        >
          {/* Featured Tag & Points Badge */}
          <div className="absolute top-2 right-2 z-20 flex items-start gap-2">
            {peripheral.featured && <FeaturedTag />}
            {peripheral.price && peripheral.price > 0 && (
              <PointsBadge
                price={peripheral.reducedPrice ?? peripheral.price}
                variant="compact"
              />
            )}
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
              {/* Image */}
              <div className="sm:col-span-3">
                <ComponentImageGallery
                  images={peripheralImages}
                  productName={peripheral.name}
                  isCompact={true}
                />
              </div>

              {/* Content */}
              <div className="sm:col-span-6 space-y-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {peripheral.name}
                  </h3>
                  {peripheral.description &&
                    typeof peripheral.description === "string" && (
                      <div className="text-gray-400 text-sm sm:text-base">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: peripheral.description,
                          }}
                        />
                      </div>
                    )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {peripheral.type && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-purple-500/20 text-purple-300 border-purple-500/30"
                    >
                      {peripheral.type}
                    </Badge>
                  )}
                  {peripheral.wireless !== undefined && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    >
                      {peripheral.wireless ? "Wireless" : "Wired"}
                    </Badge>
                  )}
                  {peripheral.rgb && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-pink-500/20 text-pink-300 border-pink-500/30"
                    >
                      RGB
                    </Badge>
                  )}
                  {peripheral.size && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-blue-500/20 text-blue-300 border-blue-500/30"
                    >
                      {peripheral.size}
                    </Badge>
                  )}
                  {peripheral.refreshRate && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-green-500/20 text-green-300 border-green-500/30"
                    >
                      {peripheral.refreshRate}Hz
                    </Badge>
                  )}
                  {peripheral.resolution && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    >
                      {peripheral.resolution}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="col-span-3 text-right space-y-3">
                <div>
                  {/* Use PriceTag to reflect reduced price when available */}
                  <PriceTag
                    price={peripheral.price ?? 0}
                    reducedPrice={peripheral.reducedPrice}
                    size="md"
                    align="right"
                  />
                  <div className="flex items-center justify-end gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => {
                      const ratingValue = peripheral.rating ?? 0;
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
                      ({peripheral.rating})
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
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
          // Track peripheral modal view
          const userId = sessionStorage.getItem("vortex_user_id");
          trackClick(
            "product_view",
            {
              productId: peripheral.id,
              productName: peripheral.name,
              category: category,
              price: peripheral.price,
              type: peripheral.type,
              productType: "peripheral",
              viewMode: "grid",
            },
            userId || undefined
          );
          setShowDetailModal(true);
        }}
      >
        {/* Featured Tag & Points Badge */}
        <div className="absolute top-2 right-2 z-20 flex items-start gap-2">
          {peripheral.featured && <FeaturedTag />}
          {peripheral.price && peripheral.price > 0 && (
            <PointsBadge
              price={peripheral.reducedPrice ?? peripheral.price}
              variant="compact"
            />
          )}
        </div>
        <div className="p-6 space-y-4">
          {/* Image Gallery */}
          <ComponentImageGallery
            isCompact={true}
            images={peripheralImages}
            productName={peripheral.name}
          />

          {/* Content */}
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-300 transition-colors">
                  {peripheral.name}
                </h3>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => {
                      const ratingValue = peripheral.rating ?? 0;
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
                      ({peripheral.rating})
                    </span>
                  </div>
                  {peripheral.ean && typeof peripheral.ean === "string" ? (
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(peripheral.ean)}
                    </span>
                  ) : null}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
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

            {peripheral.description &&
              typeof peripheral.description === "string" && (
                <div className="text-gray-400 text-sm line-clamp-3">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: peripheral.description,
                    }}
                  />
                </div>
              )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {peripheral.type && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-purple-500/20 text-purple-300 border-purple-500/30"
                >
                  {peripheral.type}
                </Badge>
              )}
              {peripheral.wireless !== undefined && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                >
                  {peripheral.wireless ? "Wireless" : "Wired"}
                </Badge>
              )}
              {peripheral.rgb && (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-2 bg-pink-500/20 text-pink-300 border-pink-500/30"
                >
                  RGB
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="flex justify-between items-center pt-2">
              {/* Use PriceTag to reflect reduced price when available */}
              <PriceTag
                price={peripheral.price ?? 0}
                reducedPrice={peripheral.reducedPrice}
                size="lg"
                align="left"
              />
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  isSelected
                    ? "bg-green-500 text-white"
                    : "bg-white/10 text-gray-300 group-hover:bg-green-500/20 group-hover:text-green-300"
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    Add
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <OptionalExtraDetailModal
        extra={peripheral}
        category={category}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onToggle={onToggle}
        isSelected={isSelected}
      />
    </>
  );
};
