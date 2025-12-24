import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../ui/dialog";
import { VisuallyHidden } from "../../ui/visually-hidden";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ProductSchema } from "../../seo/ProductSchema";
import { BrandLogo } from "../../ui/brand-logo";
import { FeaturedTag } from "../FeaturedTag";
import type { PCOptionalExtra } from "../../../services/cms";
import { PLACEHOLDER_IMAGE } from "../../data/pcBuilderComponents";
import { logger } from "../../../services/logger";
import { getSessionId } from "../../../services/sessionTracker";
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
  Download,
} from "lucide-react";
import { Document } from "@contentful/rich-text-types";

interface OptionalExtraDetailModalProps {
  extra: PCOptionalExtra;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onToggle: (category: string, extraId: string) => void;
  isSelected: boolean;
  renderRichText: (content?: string | Document) => React.ReactNode;
}

const getImageUrl = (img: string | { url?: string; src?: string }): string =>
  typeof img === "string" ? img : img.url || img.src || PLACEHOLDER_IMAGE;

export const OptionalExtraDetailModal = ({
  extra,
  category,
  isOpen,
  onClose,
  onToggle,
  isSelected,
  renderRichText,
}: OptionalExtraDetailModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const detailImages: string[] =
    extra?.images && extra.images.length > 0
      ? (extra.images as string[]).map((img: string) => getImageUrl(img))
      : Array(4).fill(PLACEHOLDER_IMAGE);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [extra?.id]);

  if (!extra) return null;

  const getSpecifications = () => {
    const specs: { label: string; value: string | number }[] = [];

    // Common specs
    if (extra.name) specs.push({ label: "Name", value: extra.name });
    if (extra.brand) specs.push({ label: "Brand", value: extra.brand });
    if (extra.price)
      specs.push({ label: "Price", value: `£${extra.price.toFixed(2)}` });
    if (extra.rating)
      specs.push({ label: "Rating", value: `${extra.rating}/5` });

    // Optional Extra specific specs
    if (extra.type) specs.push({ label: "Type", value: extra.type });
    if (extra.color) specs.push({ label: "Colour", value: extra.color });
    if (extra.wireless !== undefined)
      specs.push({
        label: "Connection",
        value: extra.wireless ? "Wireless" : "Wired",
      });
    if (extra.rgb !== undefined)
      specs.push({ label: "RGB Lighting", value: extra.rgb ? "Yes" : "No" });

    // Keyboard specific
    if (extra.switches)
      specs.push({ label: "Switches", value: extra.switches });
    if (extra.layout) specs.push({ label: "Layout", value: extra.layout });
    if (extra.keyCount)
      specs.push({ label: "Key Count", value: extra.keyCount });

    // Mouse specific
    if (extra.dpi) specs.push({ label: "DPI", value: extra.dpi });
    if (extra.weight)
      specs.push({ label: "Weight", value: `${extra.weight}g` });
    if (extra.sensor) specs.push({ label: "Sensor", value: extra.sensor });

    // Monitor specific
    if (extra.size) specs.push({ label: "Size", value: `${extra.size}"` });
    if (extra.monitorResolution)
      specs.push({ label: "Resolution", value: extra.monitorResolution });
    if (extra.resolution)
      specs.push({ label: "Resolution", value: extra.resolution });
    if (extra.refreshRate)
      specs.push({ label: "Refresh Rate", value: `${extra.refreshRate}Hz` });
    if (extra.panelType)
      specs.push({ label: "Panel Type", value: extra.panelType });
    if (extra.responseTime)
      specs.push({
        label: "Response Time",
        value: `${extra.responseTime}ms`,
      });
    if (extra.curved !== undefined)
      specs.push({ label: "Curved", value: extra.curved ? "Yes" : "No" });
    if (extra.aspectRatio)
      specs.push({ label: "Aspect Ratio", value: extra.aspectRatio });

    // Gamepad specific
    if (extra.platform)
      specs.push({ label: "Platform", value: extra.platform });
    if (extra.batteryLife)
      specs.push({ label: "Battery Life", value: extra.batteryLife });
    if (extra.connectivity)
      specs.push({ label: "Connection Type", value: extra.connectivity });

    // Mousepad specific
    if (extra.surface) specs.push({ label: "Surface", value: extra.surface });
    if (extra.dimensions)
      specs.push({ label: "Dimensions", value: extra.dimensions });
    if (extra.thickness)
      specs.push({ label: "Thickness", value: `${extra.thickness}mm` });

    // Audio specific (headset, speakers, microphone)
    if (extra.frequencyResponse)
      specs.push({
        label: "Frequency Response",
        value: extra.frequencyResponse,
      });
    if (extra.impedance)
      specs.push({ label: "Impedance", value: `${extra.impedance}Ω` });
    if (extra.microphone !== undefined)
      specs.push({
        label: "Microphone",
        value: extra.microphone ? "Yes" : "No",
      });
    if (extra.surroundSound !== undefined)
      specs.push({
        label: "Surround Sound",
        value: extra.surroundSound ? "Yes" : "No",
      });

    // Webcam/Microphone specific
    if (extra.frameRate)
      specs.push({ label: "Frame Rate", value: `${extra.frameRate}fps` });
    if (extra.fieldOfView)
      specs.push({ label: "Field of View", value: `${extra.fieldOfView}°` });

    return specs;
  };

  const specs = getSpecifications();

  const technicalSpecs = specs.filter(
    (spec) => !["Name", "Brand", "Price", "Rating"].includes(spec.label)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-950 to-black border-2 border-green-500/40 p-0"
        style={{ maxWidth: "1200px" }}
      >
        <VisuallyHidden>
          <DialogTitle>{extra.name} - Product Details</DialogTitle>
        </VisuallyHidden>
        <ProductSchema product={extra as PCOptionalExtra} />
        <div className="overflow-y-auto max-h-[90vh] p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <div className="relative w-full bg-slate-900/50 rounded-2xl overflow-hidden border-2 border-green-500/20">
              <img
                src={detailImages[currentImageIndex]}
                alt={extra.name}
                className="w-full h-auto object-contain"
                style={{ minHeight: "300px", maxHeight: "min(400px, 50vh)" }}
              />

              {extra.featured && (
                <div className="absolute top-3 right-3 z-30">
                  <FeaturedTag />
                </div>
              )}

              {detailImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(
                        (prev) =>
                          (prev - 1 + detailImages.length) % detailImages.length
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/25 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(
                        (prev) => (prev + 1) % detailImages.length
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/25 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20">
                  {currentImageIndex + 1}/{detailImages.length}
                </Badge>
              </div>
            </div>

            {detailImages.length > 1 && (
              <div className="flex gap-3 mt-4 justify-center flex-wrap p-2">
                {detailImages.slice(0, 4).map((img: string, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      idx === currentImageIndex
                        ? "border-green-500 ring-2 ring-green-500/30"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${extra.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <BrandLogo
                  src={extra.brandLogo}
                  brand={extra.brand}
                  size="lg"
                  className="mb-4"
                  withBackground
                />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 break-words">
                  {extra.name}
                </h2>
                <p className="text-gray-400">{extra.description}</p>

                <div className="flex items-center gap-3 mt-3">
                  {extra.rating && (
                    <>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 text-amber-400 ${
                              i < Math.floor(extra.rating ?? 0)
                                ? "fill-amber-400"
                                : ""
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        ({extra.rating}/5)
                      </span>
                    </>
                  )}
                  <Badge
                    className={
                      extra.inStock !== false
                        ? "bg-green-500/20 text-green-400 border-green-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                    }
                  >
                    {extra.inStock !== false ? "✓ In Stock" : "Out of Stock"}
                  </Badge>
                </div>
              </div>

              <div className="text-right bg-gradient-to-br from-green-500/20 to-emerald-500/20 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-xl border-2 border-green-400/40 w-full sm:w-auto">
                <div className="text-xs text-green-400 uppercase tracking-wider mb-2">
                  Price
                </div>
                <div className="flex items-start justify-end gap-1">
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white break-all">
                    £{Math.floor(extra.price ?? 0)}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-green-300 mt-1">
                    .{(extra.price ?? 0).toFixed(2).split(".")[1]}
                  </span>
                </div>
                {!extra.brandLogo && extra.brand && (
                  <Badge className="mt-3 bg-green-500/30 text-green-300 border-green-400/50">
                    {extra.brand}
                  </Badge>
                )}
              </div>
            </div>

            {extra.mainProductDescription && (
              <div className="bg-slate-900/60 rounded-xl p-6 border border-green-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Product Description
                </h3>
                <div className="text-base text-gray-300 leading-relaxed">
                  {renderRichText(extra.mainProductDescription)}
                </div>
              </div>
            )}

            {technicalSpecs.length > 0 && (
              <div className="bg-slate-900/60 rounded-xl p-6 border border-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-green-400" />
                    Technical Specifications
                  </h3>
                  {extra.techSheet && (
                    <a
                      href={extra.techSheet}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        logger.info(
                          "[PCBuilder] Extras tech sheet download clicked",
                          {
                            extra: extra.name,
                          }
                        );
                        try {
                          const sessionId =
                            sessionStorage.getItem("vortex_session_id") ||
                            getSessionId() ||
                            "unknown";
                          const eventPayload = {
                            kind: "event",
                            payload: {
                              sessionId,
                              eventType: "download",
                              eventData: {
                                componentType: "extras",
                                componentName: extra.name,
                                componentId: extra.id,
                                url: extra.techSheet,
                                kind: "tech_sheet",
                              },
                              timestamp: new Date().toISOString(),
                              page: window.location.pathname,
                            },
                          };
                          const data = JSON.stringify(eventPayload);
                          if (navigator.sendBeacon) {
                            const ok = navigator.sendBeacon(
                              "/api/analytics/track",
                              data
                            );
                            if (!ok) throw new Error("sendBeacon failed");
                          } else {
                            void fetch("/api/analytics/track", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: data,
                              keepalive: true,
                              cache: "no-store",
                            });
                          }
                        } catch (err) {
                          logger.warn(
                            "[PCBuilder] Fallback analytics tracking failed",
                            { error: err }
                          );
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download Full Tech Sheet
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {technicalSpecs.map((spec, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/60 rounded-lg p-4 border border-white/5"
                    >
                      <div className="text-xs text-gray-500 uppercase mb-1">
                        {spec.label}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {typeof spec.value === "string" ||
                        typeof spec.value === "number"
                          ? spec.value
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extra.features && extra.features.length > 0 && (
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Key Features
                </h3>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {extra.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-base text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 sm:h-12"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onToggle(category, extra.id);
                  onClose();
                }}
                className={`flex-1 h-11 sm:h-12 ${
                  isSelected
                    ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                }`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isSelected ? "Remove from Build" : "Add to Build"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
