import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  fetchPCComponents,
  fetchPCOptionalExtras,
  PCComponent,
  PCOptionalExtra,
} from "../services/cms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { AspectRatio } from "./ui/aspect-ratio";
import {
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Fan,
  Keyboard,
  Mouse,
  AlertTriangle,
  CheckCircle,
  Package,
  Settings,
  ShoppingCart,
  Bookmark,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Star,
  Plus,
  Grid,
  List,
  Server,
  AlertCircle,
  Sparkles,
  Trash2,
} from "lucide-react";

// Dark themed placeholder image
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64," +
  btoa(`
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#grad1)" />
  <rect x="20" y="20" width="360" height="260" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="10,5" rx="8" />
  <circle cx="200" cy="120" r="30" fill="#475569" opacity="0.5" />
  <rect x="170" y="90" width="60" height="60" fill="none" stroke="#64748b" stroke-width="2" rx="4" />
  <text x="200" y="180" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="16" font-weight="600">Image Coming Soon</text>
  <text x="200" y="200" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12">High-quality product image</text>
  <text x="200" y="215" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12">will be available via CMS</text>
</svg>
`);

// Enhanced Image Gallery Component
const ComponentImageGallery = ({
  images,
  productName,
  isCompact = false,
  isModal = false,
}: {
  images: any[];
  productName: string;
  isCompact?: boolean;
  isModal?: boolean;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Use placeholder images for now (up to 4)
  const productImages =
    images && images.length > 0 ? images : Array(4).fill(PLACEHOLDER_IMAGE);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length
    );
  };

  return (
    <>
      {/* Main product image */}
      <div
        className="relative group cursor-pointer"
        onClick={(e) => {
          // Only open gallery if clicking the image itself, not buttons or overlays
          if (
            e.target === e.currentTarget ||
            (e.target as HTMLElement).tagName === "IMG"
          ) {
            setIsGalleryOpen(true);
          }
        }}
      >
        {isModal ? (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
            <img
              src={productImages[currentImageIndex]}
              alt={productName}
              loading="lazy"
              className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Overlay Controls */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* View Gallery Button */}
              <div className="absolute top-3 right-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGalleryOpen(true);
                  }}
                  className="bg-black/50 backdrop-blur-md text-white border-white/20 hover:bg-black/70"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Gallery
                </Button>
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-black/50 backdrop-blur-md text-white border-white/20 text-xs"
                >
                  {currentImageIndex + 1}/{productImages.length}
                </Badge>
              </div>

              {/* Navigation arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <AspectRatio
            ratio={isCompact ? 1 : 16 / 9}
            className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900"
          >
            <img
              src={productImages[currentImageIndex]}
              alt={productName}
              width="1920"
              height="1080"
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Overlay Controls */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* View Gallery Button */}
              <div className="absolute top-3 right-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGalleryOpen(true);
                  }}
                  className="bg-black/50 backdrop-blur-md text-white border-white/20 hover:bg-black/70"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Gallery
                </Button>
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-black/50 backdrop-blur-md text-white border-white/20 text-xs"
                >
                  {currentImageIndex + 1}/{productImages.length}
                </Badge>
              </div>

              {/* Navigation arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </AspectRatio>
        )}

        {/* Thumbnail strip for non-compact view */}
        {!isCompact && productImages.length > 1 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {productImages.slice(0, 3).map((image: any, index: number) => (
              <button
                type="button"
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? "border-sky-500 shadow-lg shadow-sky-500/50 scale-105"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <img
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  width="80"
                  height="80"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Gallery Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen} modal={true}>
        <DialogContent
          className="max-w-5xl bg-black/95 border-white/10 text-white"
          style={{ zIndex: 60 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
              {productName} - Image Gallery
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Browse through multiple high-resolution images of this component
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <AspectRatio ratio={16 / 10} className="overflow-hidden rounded-xl">
              <img
                src={productImages[currentImageIndex]}
                alt={productName}
                width="1200"
                height="750"
                loading="eager"
                className="w-full h-full object-cover"
              />
            </AspectRatio>

            {/* Modal Navigation */}
            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black/90 transition-all duration-300 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black/90 transition-all duration-300 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Badge
                variant="secondary"
                className="bg-black/70 backdrop-blur-md text-white border-white/20"
              >
                {currentImageIndex + 1} / {productImages.length}
              </Badge>
            </div>
          </div>

          {/* Gallery thumbnails */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {productImages.map((image: any, index: number) => (
              <button
                type="button"
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? "border-sky-500 shadow-lg shadow-sky-500/25"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <img
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  width="200"
                  height="112"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Enhanced Component Detail Modal - Redesigned for professional, spacious layout (v3)
const ComponentDetailModal = ({
  component,
  category,
  isOpen,
  onClose,
  onSelect,
  isSelected,
}: {
  component: any;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string, componentId: string) => void;
  isSelected: boolean;
}) => {
  // Local image gallery state for the detail modal
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Normalise images with placeholder fallback
  const detailImages: string[] =
    component?.images && component.images.length > 0
      ? (component.images as string[])
      : Array(4).fill(PLACEHOLDER_IMAGE);

  // Reset index when component changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [component?.id]);

  if (!component) return null;

  const getSpecifications = () => {
    const specs = [];

    // Common specs
    if (component.name) specs.push({ label: "Name", value: component.name });
    if (component.brand) specs.push({ label: "Brand", value: component.brand });
    if (component.model) specs.push({ label: "Model", value: component.model });
    if (component.price)
      specs.push({ label: "Price", value: `£${component.price.toFixed(2)}` });
    if (component.rating)
      specs.push({ label: "Rating", value: `${component.rating}/5` });

    // Category-specific specs
    switch (category) {
      case "case":
        if (component.brand)
          specs.push({ label: "Brand", value: component.brand });
        if (component.model)
          specs.push({ label: "Model", value: component.model });
        if (component.colour || component.color)
          specs.push({
            label: "Colour",
            value: component.colour || component.color,
          });
        if (component.formFactor)
          specs.push({ label: "Form Factor", value: component.formFactor });
        if (component.gpuClearance)
          specs.push({
            label: "GPU Clearance",
            value: `${component.gpuClearance}mm`,
          });
        if (component.coolingSupport)
          specs.push({
            label: "Cooling Support",
            value: component.coolingSupport,
          });
        if (component.style)
          specs.push({ label: "Style", value: component.style });
        if (component.maxGpuLength)
          specs.push({
            label: "Max GPU Length",
            value: `${component.maxGpuLength}mm`,
          });
        if (component.maxCpuCoolerHeight)
          specs.push({
            label: "Max CPU Cooler Height",
            value: `${component.maxCpuCoolerHeight}mm`,
          });
        if (component.maxPsuLength)
          specs.push({
            label: "Max PSU Length",
            value: `${component.maxPsuLength}mm`,
          });
        if (component.frontPanelPorts)
          specs.push({
            label: "Front Panel Ports",
            value: component.frontPanelPorts,
          });
        if (component.compatibility)
          specs.push({
            label: "Compatibility",
            value: Array.isArray(component.compatibility)
              ? component.compatibility.join(", ")
              : String(component.compatibility || ""),
          });
        break;

      case "motherboard":
        if (component.formFactor)
          specs.push({ label: "Form Factor", value: component.formFactor });
        if (component.socket)
          specs.push({ label: "Socket", value: component.socket });
        if (component.chipset)
          specs.push({ label: "Chipset", value: component.chipset });
        if (component.ramSupport)
          specs.push({
            label: "RAM Support",
            value: Array.isArray(component.ramSupport)
              ? component.ramSupport.join(", ")
              : component.ramSupport,
          });
        if (component.maxRam)
          specs.push({ label: "Max RAM", value: `${component.maxRam}GB` });
        if (component.ramSlots)
          specs.push({ label: "RAM Slots", value: component.ramSlots });
        if (component.pciSlots)
          specs.push({ label: "PCIe Slots", value: component.pciSlots });
        if (component.m2Slots)
          specs.push({ label: "M.2 Slots", value: component.m2Slots });
        break;

      case "cpu":
        if (component.socket)
          specs.push({ label: "Socket", value: component.socket });
        if (component.cores)
          specs.push({ label: "Cores", value: component.cores });
        if (component.threads)
          specs.push({ label: "Threads", value: component.threads });
        if (component.tdp)
          specs.push({ label: "TDP", value: `${component.tdp}W` });
        if (component.generation)
          specs.push({ label: "Generation", value: component.generation });
        if (component.platform)
          specs.push({ label: "Platform", value: component.platform });
        break;

      case "gpu":
        if (component.vram)
          specs.push({ label: "VRAM", value: `${component.vram}GB` });
        if (component.power)
          specs.push({
            label: "Power Consumption",
            value: `${component.power}W`,
          });
        if (component.length)
          specs.push({ label: "Length", value: `${component.length}mm` });
        if (component.height)
          specs.push({ label: "Height", value: `${component.height}mm` });
        if (component.slots)
          specs.push({ label: "Slots", value: component.slots });
        if (component.platform)
          specs.push({ label: "Platform", value: component.platform });
        if (component.performance)
          specs.push({
            label: "Performance Tier",
            value: component.performance,
          });
        break;

      case "ram":
        if (component.capacity)
          specs.push({ label: "Capacity", value: `${component.capacity}GB` });
        if (component.type)
          specs.push({ label: "Type", value: component.type });
        if (component.speed)
          specs.push({ label: "Speed", value: `${component.speed}MHz` });
        if (component.modules)
          specs.push({ label: "Modules", value: component.modules });
        if (component.latency)
          specs.push({ label: "Latency", value: `CL${component.latency}` });
        if (component.rgb !== undefined)
          specs.push({
            label: "RGB Lighting",
            value: component.rgb ? "Yes" : "No",
          });
        break;

      case "storage":
        if (component.capacity)
          specs.push({ label: "Capacity", value: `${component.capacity}GB` });
        if (component.driveType)
          specs.push({ label: "Drive Type", value: component.driveType });
        if (component.interface)
          specs.push({ label: "Interface", value: component.interface });
        if (component.readSpeed)
          specs.push({
            label: "Read Speed",
            value: `${component.readSpeed}MB/s`,
          });
        if (component.writeSpeed)
          specs.push({
            label: "Write Speed",
            value: `${component.writeSpeed}MB/s`,
          });
        if (component.nand)
          specs.push({ label: "NAND Type", value: component.nand });
        break;

      case "psu":
        if (component.wattage)
          specs.push({ label: "Wattage", value: `${component.wattage}W` });
        if (component.efficiency)
          specs.push({ label: "Efficiency", value: component.efficiency });
        if (component.modular)
          specs.push({ label: "Modular", value: component.modular });
        if (component.length)
          specs.push({ label: "Length", value: `${component.length}mm` });
        break;

      case "cooling":
        if (component.coolerType)
          specs.push({ label: "Type", value: component.coolerType });
        if (component.radiatorSize)
          specs.push({
            label: "Radiator Size",
            value: `${component.radiatorSize}mm`,
          });
        if (component.fanSize)
          specs.push({ label: "Fan Size", value: `${component.fanSize}mm` });
        if (component.tdpSupport)
          specs.push({
            label: "TDP Support",
            value: `${component.tdpSupport}W`,
          });
        if (component.height)
          specs.push({ label: "Height", value: `${component.height}mm` });
        if (component.rgbLighting !== undefined)
          specs.push({
            label: "RGB Lighting",
            value: component.rgbLighting ? "Yes" : "No",
          });
        break;
    }

    return specs;
  };

  const specs = getSpecifications();

  // Group specs into categories for better organization
  const technicalSpecs = specs.filter(
    (spec) =>
      !["Name", "Brand", "Model", "Price", "Rating"].includes(spec.label)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-950 to-black border-2 border-sky-500/40 p-0"
        style={{ maxWidth: "1200px" }}
      >
        <div className="overflow-y-auto max-h-[90vh] p-8">
          {/* MASSIVE IMAGE SECTION - Takes up most of the modal */}
          <div className="mb-8">
            <div className="relative w-full bg-slate-900/50 rounded-2xl overflow-hidden border-2 border-sky-500/20">
              <img
                src={detailImages[currentImageIndex]}
                alt={component.name}
                className="w-full h-auto object-contain"
                style={{ minHeight: "500px", maxHeight: "600px" }}
              />

              {/* Prev/Next Controls */}
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all duration-300 flex items-center justify-center"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-black/60 backdrop-blur-md text-white border-white/20">
                  {currentImageIndex + 1}/{detailImages.length}
                </Badge>
              </div>
            </div>

            {/* Image Gallery Thumbnails */}
            {detailImages.length > 1 && (
              <div className="flex gap-3 mt-4 justify-center flex-wrap">
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
                        ? "border-sky-500 ring-2 ring-sky-500/30"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${component.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO BELOW IMAGE */}
          <div className="space-y-6">
            {/* Title and Stock */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">
                  {component.name}
                </h2>
                <p className="text-gray-400">{component.description}</p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(component.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    ({component.rating}/5)
                  </span>
                  <Badge
                    className={
                      component.inStock !== false &&
                      (component.stockLevel ?? 0) > 0
                        ? (component.stockLevel ?? 0) <= 5
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                          : "bg-green-500/20 text-green-400 border-green-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                    }
                  >
                    {component.inStock !== false &&
                    (component.stockLevel ?? 0) > 0
                      ? (component.stockLevel ?? 0) <= 5
                        ? `Low Stock (${component.stockLevel})`
                        : `✓ In Stock (${component.stockLevel ?? "∞"})`
                      : "Out of Stock"}
                  </Badge>
                </div>
              </div>

              {/* LARGE PRICE DISPLAY */}
              <div className="text-right bg-gradient-to-br from-sky-500/20 to-blue-500/20 px-8 py-6 rounded-xl border-2 border-sky-400/40">
                <div className="text-xs text-sky-400 uppercase tracking-wider mb-2">
                  Price
                </div>
                <div className="flex items-start justify-end gap-1">
                  <span className="text-5xl font-black text-white">
                    £{Math.floor(component.price)}
                  </span>
                  <span className="text-2xl font-bold text-sky-300 mt-1">
                    .{component.price.toFixed(2).split(".")[1]}
                  </span>
                </div>
                {component.brand && (
                  <Badge className="mt-3 bg-sky-500/30 text-sky-300 border-sky-400/50">
                    {component.brand}
                  </Badge>
                )}
              </div>
            </div>

            {/* Main Description Section */}
            {component.mainDescription && (
              <div className="bg-slate-900/60 rounded-xl p-6 border border-sky-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-sky-400"
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
                <div className="text-base text-gray-300 leading-relaxed whitespace-pre-line">
                  {component.mainDescription}
                </div>
              </div>
            )}

            {/* Technical Specs in Clean Grid */}
            <div className="bg-slate-900/60 rounded-xl p-6 border border-sky-500/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-400" />
                Technical Specifications
              </h3>
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
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Section */}
            {component.features && component.features.length > 0 && (
              <div className="bg-gradient-to-br from-sky-900/20 to-blue-900/20 rounded-xl p-6 border border-sky-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-sky-400"
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
                <ul className="space-y-2">
                  {component.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5"
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
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex-1 h-12 bg-white/5 border-white/20 hover:bg-white/10"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onSelect(category, component.id);
                  onClose();
                }}
                className={`flex-1 h-12 ${
                  isSelected
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                }`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isSelected ? "Selected" : "Select This Component"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Enhanced Component Card with images
const ComponentCard = ({
  component,
  category,
  isSelected,
  onSelect,
  viewMode = "grid",
}: {
  component: any;
  category: string;
  isSelected: boolean;
  onSelect: (category: string, componentId: string) => void;
  viewMode?: string;
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

  if (viewMode === "list") {
    return (
      <>
        <Card
          className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${
            isSelected
              ? "ring-2 ring-sky-500 bg-sky-500/10 border-sky-500/50"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
          onClick={() => setShowDetailModal(true)}
        >
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
              {/* Image */}
              <div className="sm:col-span-3">
                <ComponentImageGallery
                  images={componentWithImages.images}
                  productName={component.name}
                  isCompact={true}
                />
              </div>

              {/* Content */}
              <div className="sm:col-span-6 space-y-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {component.name}
                  </h3>
                  <p className="text-gray-400 line-clamp-2 text-sm sm:text-base">
                    {component.description}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {/* Core Component Badges */}
                  {component.capacity && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-blue-500/20 text-blue-300 border-blue-500/30"
                    >
                      {component.capacity}GB
                    </Badge>
                  )}
                  {component.cores && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-green-500/20 text-green-300 border-green-500/30"
                    >
                      {component.cores} Cores
                    </Badge>
                  )}
                  {component.threads && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    >
                      {component.threads} Threads
                    </Badge>
                  )}
                  {component.vram && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-green-500/20 text-green-300 border-green-500/30"
                    >
                      {component.vram}GB VRAM
                    </Badge>
                  )}

                  {/* Storage Specific Badges */}
                  {component.driveType && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-purple-500/20 text-purple-300 border-purple-500/30"
                    >
                      {component.driveType}
                    </Badge>
                  )}
                  {component.interface && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    >
                      {component.interface}
                    </Badge>
                  )}

                  {/* Performance Badges */}
                  {component.wattage && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-orange-500/20 text-orange-300 border-orange-500/30"
                    >
                      {component.wattage}W
                    </Badge>
                  )}
                  {component.tdp && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-red-500/20 text-red-300 border-red-500/30"
                    >
                      {component.tdp}W TDP
                    </Badge>
                  )}

                  {/* Operating System Badges */}
                  {component.version && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-slate-500/20 text-slate-300 border-slate-500/30"
                    >
                      {component.version}
                    </Badge>
                  )}
                  {component.licenseType && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-gray-500/20 text-gray-300 border-gray-500/30"
                    >
                      {component.licenseType}
                    </Badge>
                  )}
                  {component.architecture && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                    >
                      {component.architecture}
                    </Badge>
                  )}

                  {/* GPU Platform Badges */}
                  {component.platform && (
                    <Badge
                      variant="secondary"
                      className="text-sm py-1 px-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    >
                      {component.platform}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="sm:col-span-3 text-left sm:text-right space-y-3">
                <div>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                    £{component.price.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-start sm:justify-end gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(component.rating) ? "fill-current" : ""
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      ({component.rating})
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-start sm:justify-end">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <Bookmark className="w-4 h-4" />
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
        className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.02] group ${
          isSelected
            ? "ring-2 ring-sky-500 bg-sky-500/10 border-sky-500/50"
            : "bg-white/5 border-white/10 hover:bg-white/10"
        }`}
        onClick={() => setShowDetailModal(true)}
      >
        <div className="p-6 space-y-4">
          {/* Image Gallery */}
          <ComponentImageGallery
            images={componentWithImages.images}
            productName={component.name}
          />

          {/* Content */}
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-sky-300 transition-colors">
                  {component.name}
                </h3>
                <div className="flex items-center gap-1 text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(component.rating) ? "fill-current" : ""
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">
                    ({component.rating})
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-gray-400 text-sm line-clamp-2">
              {component.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {/* All the existing badge logic from your original code */}
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
            <div className="flex justify-between items-center pt-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                £{component.price.toFixed(2)}
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isSelected
                    ? "bg-sky-500 text-white"
                    : "bg-white/10 text-gray-300 group-hover:bg-sky-500/20 group-hover:text-sky-300"
                }`}
              >
                {isSelected ? "Selected" : "Select"}
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
}; // Compatibility Alert Dialog Component
const CompatibilityAlert = ({
  compatibilityIssues,
  onAccept,
  onCancel,
}: {
  compatibilityIssues: any[];
  onAccept: () => void;
  onCancel: () => void;
}) => {
  const severityColors = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  const severityIcons = {
    critical: AlertTriangle,
    warning: AlertCircle,
    info: Info,
  };

  return (
    <AlertDialog open={compatibilityIssues.length > 0}>
      <AlertDialogContent className="max-w-2xl bg-black/95 border-white/10 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Compatibility Check Results
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            We've detected some potential compatibility issues with your
            selected components. Please review the details below.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {compatibilityIssues.map((issue: any, index: number) => {
            const Icon =
              severityIcons[issue.severity as keyof typeof severityIcons];
            return (
              <Alert
                key={index}
                className={`border rounded-lg p-4 ${
                  severityColors[issue.severity as keyof typeof severityColors]
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="ml-3">
                  <h4 className="font-bold mb-2">{issue.title}</h4>
                  <AlertDescription className="text-sm opacity-90">
                    {issue.description}
                  </AlertDescription>
                  {issue.recommendation && (
                    <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-sky-300">
                        <strong>Recommendation:</strong> {issue.recommendation}
                      </p>
                    </div>
                  )}
                  {issue.affectedComponents && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {issue.affectedComponents.map(
                        (component: any, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {component}
                          </Badge>
                        )
                      )}
                    </div>
                  )}
                </div>
              </Alert>
            );
          })}
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Review & Fix Issues
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAccept}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Component data - Enhanced with comprehensive compatibility data
const componentData = {
  case: [
    // Premium RGB Cases
    {
      id: "case-1",
      name: "Corsair Xeneon Edge",
      price: 279.99,
      formFactor: "ATX",
      gpuClearance: "400mm",
      coolingSupport: "360mm AIO / 9 fans",
      style: "RGB / Premium",
      compatibility: ["atx", "micro-atx", "mini-itx"],
      rating: 4.8,
      description:
        "Premium ATX case with stunning RGB integration and exceptional airflow performance",
      maxGpuLength: 400,
      maxCpuCoolerHeight: 170,
      maxPsuLength: 200,
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "case-2",
      name: "Hyte X50",
      price: 199.99,
      formFactor: "ATX",
      gpuClearance: "395mm",
      coolingSupport: "360mm AIO / 7 fans",
      style: "RGB / Modern",
      compatibility: ["atx", "micro-atx", "mini-itx"],
      rating: 4.7,
      description:
        "Modern ATX case with sleek RGB aesthetics and great thermal performance",
      maxGpuLength: 395,
      maxCpuCoolerHeight: 165,
      maxPsuLength: 180,
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "case-3",
      name: "Corsair 2500X",
      price: 179.99,
      formFactor: "MicroATX",
      gpuClearance: "400mm",
      coolingSupport: "360mm AIO / 6 fans",
      style: "RGB / Airflow",
      compatibility: ["micro-atx", "mini-itx"],
      rating: 4.5,
      description:
        "Compact MicroATX case with premium RGB lighting and excellent airflow design",
      maxGpuLength: 400,
      maxCpuCoolerHeight: 160,
      maxPsuLength: 160,
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],

  motherboard: [
    {
      id: "mb-1",
      name: "ASUS ROG STRIX Z790-E GAMING",
      price: 449.99,
      formFactor: "ATX",
      socket: "LGA1700",
      chipset: "Z790",
      ramSupport: "DDR5-7800+",
      maxRam: 128,
      ramSlots: 4,
      pciSlots: 3,
      m2Slots: 4,
      compatibility: ["intel-13th", "intel-14th"],
      rating: 4.9,
      description:
        "Premium Z790 motherboard with Wi-Fi 6E, PCIe 5.0, and advanced overclocking features",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "mb-2",
      name: "MSI MAG B650 TOMAHAWK WIFI",
      price: 229.99,
      formFactor: "ATX",
      socket: "AM5",
      chipset: "B650",
      ramSupport: "DDR5-6000+",
      maxRam: 128,
      ramSlots: 4,
      pciSlots: 2,
      m2Slots: 3,
      compatibility: ["amd-7000", "amd-9000"],
      rating: 4.7,
      description:
        "Excellent value AM5 motherboard with built-in Wi-Fi and strong VRM design",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],

  cpu: [
    {
      id: "cpu-1",
      name: "Intel Core Ultra 9 285K",
      price: 589.99,
      cores: 24,
      threads: 24,
      socket: "LGA1700",
      tdp: 125,
      generation: "intel-14th",
      platform: "Intel",
      rating: 4.8,
      description:
        "Latest Intel flagship with P-cores and E-cores for ultimate performance",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "cpu-2",
      name: "AMD Ryzen 9 9950X3D",
      price: 649.99,
      cores: 16,
      threads: 32,
      socket: "AM5",
      tdp: 120,
      generation: "amd-9000",
      platform: "AMD",
      rating: 4.9,
      description:
        "Top-tier AMD processor with 3D V-Cache for exceptional gaming performance",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "cpu-3",
      name: "AMD Ryzen 7 9800X3D",
      price: 449.99,
      cores: 8,
      threads: 16,
      socket: "AM5",
      tdp: 120,
      generation: "amd-9000",
      platform: "AMD",
      rating: 4.9,
      description: "Gaming-focused processor with 3D V-Cache technology",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],

  gpu: [
    {
      id: "gpu-1",
      name: "RTX 4090 FE",
      price: 1599.99,
      vram: 24,
      power: 450,
      length: 304,
      height: 137,
      platform: "NVIDIA",
      performance: "extreme",
      rating: 4.9,
      description: "Ultimate gaming graphics card with 24GB VRAM and DLSS 3.0",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "gpu-2",
      name: "RTX 4070 Ti Super",
      price: 799.99,
      vram: 16,
      power: 285,
      length: 267,
      height: 112,
      platform: "NVIDIA",
      performance: "high",
      rating: 4.7,
      description: "Excellent 1440p gaming with 16GB VRAM and modern features",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "gpu-3",
      name: "RTX 4060 Ti 16GB",
      price: 499.99,
      vram: 16,
      power: 165,
      length: 244,
      height: 112,
      platform: "NVIDIA",
      performance: "mid",
      rating: 4.5,
      description: "Great value 1080p/1440p gaming with generous 16GB VRAM",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],

  ram: [
    {
      id: "ram-1",
      name: "Corsair Dominator DDR5-6400 32GB",
      price: 299.99,
      capacity: 32,
      type: "DDR5",
      speed: 6400,
      sticks: 2,
      rgb: true,
      compatibility: ["ddr5"],
      rating: 4.8,
      description:
        "Premium DDR5 memory with RGB lighting and excellent overclocking potential",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "ram-2",
      name: "G.SKILL Trident Z5 DDR5-6000 32GB",
      price: 249.99,
      capacity: 32,
      type: "DDR5",
      speed: 6000,
      sticks: 2,
      rgb: true,
      compatibility: ["ddr5"],
      rating: 4.7,
      description: "High-performance DDR5 with stunning RGB and tight timings",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],

  storage: [
    {
      id: "storage-1",
      name: "Samsung 990 PRO 2TB",
      price: 199.99,
      capacity: 2000,
      driveType: "NVMe SSD",
      interface: "PCIe 4.0",
      readSpeed: 7450,
      writeSpeed: 6900,
      rating: 4.9,
      description:
        "Flagship PCIe 4.0 SSD with exceptional performance for gaming and creation",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "storage-2",
      name: "WD Black SN850X 1TB",
      price: 129.99,
      capacity: 1000,
      driveType: "NVMe SSD",
      interface: "PCIe 4.0",
      readSpeed: 7300,
      writeSpeed: 6600,
      rating: 4.8,
      description: "Gaming-optimised SSD with consistent high performance",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],

  psu: [
    {
      id: "psu-1",
      name: "Corsair RM1000x",
      price: 179.99,
      wattage: 1000,
      efficiency: "80+ Gold",
      modular: "Fully",
      rating: 4.8,
      description: "High-wattage fully modular PSU with 80+ Gold efficiency",
      length: 160,
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "psu-2",
      name: "Seasonic Focus GX-850",
      price: 149.99,
      wattage: 850,
      efficiency: "80+ Gold",
      modular: "Fully",
      rating: 4.9,
      description: "Reliable 850W power supply with excellent build quality",
      length: 140,
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],

  cooling: [
    {
      id: "cooling-1",
      name: "Corsair H150i Elite LCD",
      price: 279.99,
      type: "AIO",
      radiatorSize: 360,
      height: 27,
      tdpSupport: 250,
      rgb: true,
      rating: 4.8,
      description:
        "Premium 360mm AIO with customisable LCD display and RGB lighting",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "cooling-2",
      name: "Noctua NH-D15",
      price: 109.99,
      type: "Air",
      height: 165,
      tdpSupport: 250,
      rgb: false,
      rating: 4.9,
      description:
        "Legendary air cooler with exceptional performance and quiet operation",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],
};

// Optional peripherals data
const peripheralsData = {
  keyboard: [
    {
      id: "kb-1",
      name: "Corsair K100 RGB Optical",
      price: 229.99,
      type: "Mechanical",
      switches: "Optical",
      rgb: true,
      wireless: false,
      rating: 4.8,
      description:
        "Premium optical-mechanical gaming keyboard with per-key RGB and dedicated macro keys",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "kb-2",
      name: "Logitech G915 TKL Wireless",
      price: 209.99,
      type: "Mechanical",
      switches: "Low-Profile",
      rgb: true,
      wireless: true,
      rating: 4.7,
      description:
        "Tenkeyless wireless mechanical keyboard with low-profile switches and long battery life",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "kb-3",
      name: "Razer BlackWidow V4 Pro",
      price: 199.99,
      type: "Mechanical",
      switches: "Green",
      rgb: true,
      wireless: false,
      rating: 4.6,
      description:
        "Full-featured gaming keyboard with tactile switches and programmable dial",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "kb-4",
      name: "SteelSeries Apex Pro TKL",
      price: 179.99,
      type: "Mechanical",
      switches: "Adjustable",
      rgb: true,
      wireless: false,
      rating: 4.7,
      description:
        "Compact TKL with adjustable mechanical switches for customised actuation",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],
  mouse: [
    {
      id: "mouse-1",
      name: "Logitech G Pro X Superlight 2",
      price: 159.99,
      type: "Wireless",
      dpi: 32000,
      weight: 60,
      rgb: false,
      wireless: true,
      rating: 4.9,
      description:
        "Ultra-lightweight wireless gaming mouse with HERO 2 sensor for professional esports",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "mouse-2",
      name: "Razer Viper V3 Pro",
      price: 149.99,
      type: "Wireless",
      dpi: 30000,
      weight: 54,
      rgb: true,
      wireless: true,
      rating: 4.8,
      description:
        "Ambidextrous wireless mouse with Focus Pro sensor and exceptional battery life",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "mouse-3",
      name: "Corsair Dark Core RGB Pro SE",
      price: 89.99,
      type: "Wireless",
      dpi: 18000,
      weight: 133,
      rgb: true,
      wireless: true,
      rating: 4.6,
      description:
        "Ergonomic wireless gaming mouse with customisable side grips and Qi charging",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "mouse-4",
      name: "SteelSeries Rival 3",
      price: 34.99,
      type: "Wired",
      dpi: 8500,
      weight: 77,
      rgb: true,
      wireless: false,
      rating: 4.5,
      description:
        "Budget-friendly wired gaming mouse with TrueMove Core sensor",
      images: Array(4).fill(PLACEHOLDER_IMAGE),
    },
  ],
  monitor: [
    {
      id: "mon-1",
      name: "Samsung Odyssey OLED G9",
      price: 1799.99,
      size: 49,
      resolution: "5120x1440",
      refreshRate: 240,
      panelType: "OLED",
      curved: true,
      rating: 4.9,
      description:
        '49" super ultrawide OLED with 240Hz refresh rate and quantum HDR for immersive gaming',
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "mon-2",
      name: "ASUS ROG Swift PG27AQDM",
      price: 899.99,
      size: 27,
      resolution: "2560x1440",
      refreshRate: 240,
      panelType: "OLED",
      curved: false,
      rating: 4.8,
      description:
        '27" QHD OLED gaming monitor with 240Hz and 0.03ms response time',
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "mon-3",
      name: "LG UltraGear 27GR95QE-B",
      price: 699.99,
      size: 27,
      resolution: "2560x1440",
      refreshRate: 240,
      panelType: "OLED",
      curved: false,
      rating: 4.7,
      description:
        '27" QHD OLED with exceptional colour accuracy and HDR support',
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "mon-4",
      name: "Dell S2722DGM",
      price: 279.99,
      size: 27,
      resolution: "2560x1440",
      refreshRate: 165,
      panelType: "VA",
      curved: true,
      rating: 4.5,
      description:
        'Affordable curved 27" QHD gaming monitor with 165Hz refresh rate',
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
  ],
  gamepad: [
    {
      id: "pad-1",
      name: "Xbox Elite Series 2 Core",
      price: 129.99,
      platform: "Multi-platform",
      wireless: true,
      batteryLife: "40 hours",
      rating: 4.8,
      description:
        "Premium wireless controller with adjustable tension thumbsticks and trigger locks",
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "pad-2",
      name: "PlayStation DualSense Edge",
      price: 199.99,
      platform: "Multi-platform",
      wireless: true,
      batteryLife: "12 hours",
      rating: 4.7,
      description:
        "Professional wireless controller with swappable stick modules and back buttons",
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "pad-3",
      name: "8BitDo Ultimate Wireless",
      price: 69.99,
      platform: "Multi-platform",
      wireless: true,
      batteryLife: "25 hours",
      rating: 4.6,
      description:
        "Versatile wireless controller with Hall Effect sticks and charging dock",
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "pad-4",
      name: "Razer Wolverine V2 Chroma",
      price: 149.99,
      platform: "PC/Xbox",
      wireless: false,
      batteryLife: "N/A",
      rating: 4.5,
      description:
        "Wired tournament-grade controller with Mecha-Tactile buttons and RGB",
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
  ],
  mousepad: [
    {
      id: "pad-1",
      name: "Corsair MM700 RGB Extended",
      price: 79.99,
      size: "Extended",
      surface: "Hard",
      rgb: true,
      dimensions: "930x400mm",
      rating: 4.7,
      description:
        "Large RGB mousepad with hard surface and dual-sided USB passthrough",
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "pad-2",
      name: "Razer Firefly V2 Pro",
      price: 99.99,
      size: "Medium",
      surface: "Hard",
      rgb: true,
      dimensions: "360x278mm",
      rating: 4.6,
      description:
        "Premium hard gaming mousepad with customisable RGB and wireless charging",
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "pad-3",
      name: "SteelSeries QcK Heavy XXL",
      price: 49.99,
      size: "XXL",
      surface: "Cloth",
      rgb: false,
      dimensions: "1220x610mm",
      rating: 4.8,
      description:
        "Massive cloth mousepad with extra thick 6mm cushioning for full desk coverage",
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
    {
      id: "pad-4",
      name: "Logitech G840 XL",
      price: 39.99,
      size: "XL",
      surface: "Cloth",
      rgb: false,
      dimensions: "900x400mm",
      rating: 4.5,
      description:
        "Large cloth gaming mousepad with consistent surface texture and rubber base",
      images: Array(6).fill(PLACEHOLDER_IMAGE),
    },
  ],
};

// Peripheral Card Component for optional extras
const PeripheralCard = ({
  peripheral,
  category,
  isSelected,
  onToggle,
  viewMode = "grid",
}: {
  peripheral: any;
  category: string;
  isSelected: boolean;
  onToggle: (category: string, peripheralId: string) => void;
  viewMode?: string;
}) => {
  const [isFavorited, setIsFavorited] = useState(false);

  // Use actual images from CMS data, fallback to placeholder if none
  const peripheralImages =
    peripheral.images && peripheral.images.length > 0
      ? peripheral.images
      : Array(4).fill(PLACEHOLDER_IMAGE);

  // Debug logging for image data
  console.log(`🔍 PeripheralCard for ${peripheral.name}:`, {
    hasImages: peripheral.images ? peripheral.images.length : 0,
    firstImage: peripheral.images?.[0]?.substring(0, 50) + "..." || "none",
    usingFallback: !(peripheral.images && peripheral.images.length > 0),
  });

  if (viewMode === "list") {
    return (
      <Card
        className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${
          isSelected
            ? "ring-2 ring-green-500 bg-green-500/10 border-green-500/50"
            : "bg-white/5 border-white/10 hover:bg-white/10"
        }`}
        onClick={() => onToggle(category, peripheral.id)}
      >
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
                <p className="text-gray-400 line-clamp-2 text-sm sm:text-base">
                  {peripheral.description}
                </p>
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
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  £{peripheral.price.toFixed(2)}
                </div>
                <div className="flex items-center justify-end gap-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(peripheral.rating) ? "fill-current" : ""
                      }`}
                    />
                  ))}
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
    );
  }

  // Grid view (default)
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.02] group ${
        isSelected
          ? "ring-2 ring-green-500 bg-green-500/10 border-green-500/50"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
      onClick={() => onToggle(category, peripheral.id)}
    >
      <div className="p-6 space-y-4">
        {/* Image Gallery */}
        <ComponentImageGallery
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
              <div className="flex items-center gap-1 text-yellow-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(peripheral.rating) ? "fill-current" : ""
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  ({peripheral.rating})
                </span>
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

          <p className="text-gray-400 text-sm line-clamp-2">
            {peripheral.description}
          </p>

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
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              £{peripheral.price.toFixed(2)}
            </div>
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
  );
};

// Enhanced compatibility checking system
const checkCompatibility = (selectedComponents: any, componentData: any) => {
  const issues = [];

  const cpu = selectedComponents.cpu
    ? componentData.cpu.find((c: any) => c.id === selectedComponents.cpu)
    : null;
  const motherboard = selectedComponents.motherboard
    ? componentData.motherboard.find(
        (c: any) => c.id === selectedComponents.motherboard
      )
    : null;
  const gpu = selectedComponents.gpu
    ? componentData.gpu.find((c: any) => c.id === selectedComponents.gpu)
    : null;
  const ram = selectedComponents.ram
    ? componentData.ram.find((c: any) => c.id === selectedComponents.ram)
    : null;
  const pcCase = selectedComponents.case
    ? componentData.case.find((c: any) => c.id === selectedComponents.case)
    : null;
  const psu = selectedComponents.psu
    ? componentData.psu.find((c: any) => c.id === selectedComponents.psu)
    : null;
  const cooling = selectedComponents.cooling
    ? componentData.cooling.find(
        (c: any) => c.id === selectedComponents.cooling
      )
    : null;

  // CPU & Motherboard Socket Compatibility
  if (cpu && motherboard && cpu.socket !== motherboard.socket) {
    issues.push({
      severity: "critical",
      title: "CPU & Motherboard Socket Mismatch",
      description: `The ${cpu.name} uses ${cpu.socket} socket, but the ${motherboard.name} has ${motherboard.socket} socket. These components are not compatible.`,
      recommendation:
        "Please select a CPU and motherboard with matching sockets.",
      affectedComponents: [cpu.name, motherboard.name],
    });
  }

  // CPU & Motherboard Generation Compatibility
  if (
    cpu &&
    motherboard &&
    Array.isArray(motherboard.compatibility) &&
    !motherboard.compatibility.includes(cpu.generation)
  ) {
    issues.push({
      severity: "warning",
      title: "CPU Generation Compatibility",
      description: `The ${motherboard.name} may not fully support the ${cpu.name} without a BIOS update.`,
      recommendation:
        "Ensure the motherboard BIOS is updated to support this CPU generation.",
      affectedComponents: [cpu.name, motherboard.name],
    });
  }

  // RAM & Motherboard Compatibility
  if (ram && motherboard) {
    const ramSupported = Array.isArray(motherboard.ramSupport)
      ? motherboard.ramSupport.includes(ram.type)
      : typeof motherboard.ramSupport === "string"
      ? motherboard.ramSupport.includes(ram.type)
      : true; // unknown => don't flag as incompatible
    if (!ramSupported) {
      issues.push({
        severity: "critical",
        title: "RAM Type Incompatibility",
        description: `The ${motherboard.name} supports ${motherboard.ramSupport}, but you've selected ${ram.type} memory.`,
        recommendation:
          "Select memory that matches the motherboard's supported type.",
        affectedComponents: [ram.name, motherboard.name],
      });
    }
  }

  // Motherboard & Case Form Factor
  if (
    motherboard &&
    pcCase &&
    Array.isArray(pcCase.compatibility) &&
    motherboard.formFactor &&
    !pcCase.compatibility.includes(motherboard.formFactor.toLowerCase())
  ) {
    issues.push({
      severity: "critical",
      title: "Motherboard & Case Size Mismatch",
      description: `The ${motherboard.name} (${motherboard.formFactor}) will not fit in the ${pcCase.name} case.`,
      recommendation:
        "Select a case that supports your motherboard form factor.",
      affectedComponents: [motherboard.name, pcCase.name],
    });
  }

  // GPU & Case Clearance
  if (gpu && pcCase && gpu.length > pcCase.maxGpuLength) {
    issues.push({
      severity: "critical",
      title: "GPU Too Large for Case",
      description: `The ${gpu.name} (${gpu.length}mm) exceeds the ${pcCase.name} maximum GPU clearance (${pcCase.maxGpuLength}mm).`,
      recommendation: "Select a larger case or a more compact graphics card.",
      affectedComponents: [gpu.name, pcCase.name],
    });
  }

  // PSU Wattage Check
  if (cpu && gpu && psu) {
    const estimatedPower = (cpu.tdp || 65) + (gpu.power || 150) + 150; // Base system + peripherals
    const recommendedPower = estimatedPower * 1.2; // 20% headroom

    if (psu.wattage < recommendedPower) {
      issues.push({
        severity: "warning",
        title: "Insufficient PSU Wattage",
        description: `Your system may consume up to ${Math.round(
          estimatedPower
        )}W, but the ${psu.name} only provides ${
          psu.wattage
        }W. We recommend ${Math.round(
          recommendedPower
        )}W for optimal performance.`,
        recommendation:
          "Consider upgrading to a higher wattage power supply for better efficiency and headroom.",
        affectedComponents: [cpu.name, gpu.name, psu.name],
      });
    }
  }

  // CPU Cooler & Case Height Clearance
  if (
    cooling &&
    pcCase &&
    cooling.type === "Air" &&
    cooling.height > pcCase.maxCpuCoolerHeight
  ) {
    issues.push({
      severity: "critical",
      title: "CPU Cooler Too Tall",
      description: `The ${cooling.name} (${cooling.height}mm) exceeds the ${pcCase.name} maximum CPU cooler height (${pcCase.maxCpuCoolerHeight}mm).`,
      recommendation: "Select a lower profile cooler or a larger case.",
      affectedComponents: [cooling.name, pcCase.name],
    });
  }

  // CPU Cooler TDP Support
  if (cpu && cooling && cpu.tdp > cooling.tdpSupport) {
    issues.push({
      severity: "warning",
      title: "CPU Cooler May Be Inadequate",
      description: `The ${cpu.name} has a ${cpu.tdp}W TDP, but the ${cooling.name} is rated for ${cooling.tdpSupport}W.`,
      recommendation:
        "Consider a more powerful cooling solution for optimal temperatures.",
      affectedComponents: [cpu.name, cooling.name],
    });
  }

  // PSU & Case Length
  if (psu && pcCase && psu.length > pcCase.maxPsuLength) {
    issues.push({
      severity: "critical",
      title: "PSU Too Long for Case",
      description: `The ${psu.name} (${psu.length}mm) exceeds the ${pcCase.name} maximum PSU length (${pcCase.maxPsuLength}mm).`,
      recommendation: "Select a more compact power supply or a larger case.",
      affectedComponents: [psu.name, pcCase.name],
    });
  }

  return issues;
};

export function PCBuilder({
  recommendedBuild,
  onAddToCart,
  onOpenCart,
}: {
  recommendedBuild?: any;
  onAddToCart?: (item: any) => void;
  onOpenCart?: () => void;
}) {
  const [selectedComponents, setSelectedComponents] = useState<any>({});
  const [selectedPeripherals, setSelectedPeripherals] = useState<any>({});
  const [activeCategory, setActiveCategory] = useState("case");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("price");
  const [compatibilityIssues, setCompatibilityIssues] = useState<any[]>([]);
  const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false);
  const [showIncompatibilityModal, setShowIncompatibilityModal] =
    useState(false);

  // CMS Integration
  const [cmsComponents, setCmsComponents] = useState<{
    case: PCComponent[];
    motherboard: PCComponent[];
    cpu: PCComponent[];
    gpu: PCComponent[];
    ram: PCComponent[];
    storage: PCComponent[];
    psu: PCComponent[];
    cooling: PCComponent[];
  }>({
    case: [],
    motherboard: [],
    cpu: [],
    gpu: [],
    ram: [],
    storage: [],
    psu: [],
    cooling: [],
  });
  const [cmsOptionalExtras, setCmsOptionalExtras] = useState<{
    keyboard: PCOptionalExtra[];
    mouse: PCOptionalExtra[];
    monitor: PCOptionalExtra[];
    gamepad: PCOptionalExtra[];
    mousepad: PCOptionalExtra[];
  }>({
    keyboard: [],
    mouse: [],
    monitor: [],
    gamepad: [],
    mousepad: [],
  });
  const [isLoadingCms, setIsLoadingCms] = useState(true);
  const [useCmsData, setUseCmsData] = useState(false);

  // Fetch components from CMS on mount
  useEffect(() => {
    const loadCmsData = async () => {
      try {
        console.log("🔄 Loading PC components and optional extras from CMS...");
        setIsLoadingCms(true);

        // Load PC components
        const categories = [
          "case",
          "motherboard",
          "cpu",
          "gpu",
          "ram",
          "storage",
          "psu",
          "cooling",
        ];

        const componentResults: any = {};
        for (const category of categories) {
          const components = await fetchPCComponents({ category });
          componentResults[category] = components;
          console.log(
            `✅ Loaded ${components.length} ${category} components from CMS`
          );
        }

        // Load optional extras
        const extraCategories = [
          "keyboard",
          "mouse",
          "monitor",
          "gamepad",
          "mousepad",
        ];

        const extraResults: any = {};
        for (const category of extraCategories) {
          const extras = await fetchPCOptionalExtras({ category });
          extraResults[category] = extras;
          console.log(
            `✅ Loaded ${extras.length} ${category} optional extras from CMS`
          );
        }

        setCmsComponents(componentResults);
        setCmsOptionalExtras(extraResults);

        // Use CMS data if any components or extras were loaded
        const hasComponents = Object.values(componentResults).some(
          (arr: any) => arr.length > 0
        );
        const hasExtras = Object.values(extraResults).some(
          (arr: any) => arr.length > 0
        );
        setUseCmsData(hasComponents || hasExtras);

        if (hasComponents || hasExtras) {
          console.log("✅ Using CMS data for PC Builder");
        } else {
          console.log("ℹ️ No CMS data found, using fallback hardcoded data");
        }
      } catch (error) {
        console.error("❌ Error loading CMS data:", error);
        setUseCmsData(false);
      } finally {
        setIsLoadingCms(false);
      }
    };

    loadCmsData();
  }, []);

  // Import recommended build on mount or when it changes
  useEffect(() => {
    if (recommendedBuild && recommendedBuild.specs) {
      console.log(
        "🔄 Importing recommended build to PC Builder:",
        recommendedBuild
      );

      // Parse the recommended build specs into component selections
      const importedComponents: any = {};

      // Helper function to find best matching component by name/specs
      const findComponentBySpec = (category: string, specString: string) => {
        const components = (useCmsData ? cmsComponents : componentData)[
          category as keyof typeof componentData
        ];
        if (!components || !Array.isArray(components)) return null;

        // Try exact name match first (case-insensitive)
        let match = components.find(
          (c: any) =>
            c.name &&
            specString &&
            c.name
              .toLowerCase()
              .includes(specString.toLowerCase().substring(0, 15))
        );

        // If no match, try to match by key specs
        if (!match && category === "cpu") {
          // Match by cores or model number
          if (specString.includes("9950X"))
            match = components.find((c: any) => c.name?.includes("9950X"));
          else if (specString.includes("9800X"))
            match = components.find((c: any) => c.name?.includes("9800X"));
          else if (specString.includes("9700X"))
            match = components.find((c: any) => c.name?.includes("9700X"));
          else if (specString.includes("9600X"))
            match = components.find((c: any) => c.name?.includes("9600X"));
          else if (specString.includes("285K"))
            match = components.find((c: any) => c.name?.includes("285K"));
          else if (specString.includes("14700K"))
            match = components.find((c: any) => c.name?.includes("14700K"));
          else if (
            specString.includes("Intel") ||
            specString.includes("i7") ||
            specString.includes("i5")
          ) {
            match = components.find((c: any) => c.platform === "Intel");
          } else if (
            specString.includes("AMD") ||
            specString.includes("Ryzen")
          ) {
            match = components.find((c: any) => c.platform === "AMD");
          }
        } else if (category === "gpu") {
          // Match by GPU model
          if (specString.includes("4090"))
            match = components.find((c: any) => c.name?.includes("4090"));
          else if (specString.includes("4080"))
            match = components.find((c: any) => c.name?.includes("4080"));
          else if (specString.includes("4070 Ti"))
            match = components.find((c: any) => c.name?.includes("4070 Ti"));
          else if (specString.includes("4070"))
            match = components.find((c: any) => c.name?.includes("4070"));
          else if (specString.includes("4060 Ti"))
            match = components.find((c: any) => c.name?.includes("4060 Ti"));
          else if (specString.includes("4060"))
            match = components.find((c: any) => c.name?.includes("4060"));
          else if (
            specString.includes("RTX") ||
            specString.includes("NVIDIA")
          ) {
            match = components[0]; // Default to first NVIDIA GPU
          }
        } else if (category === "ram") {
          // Match by capacity
          if (specString.includes("64GB"))
            match = components.find((c: any) => c.capacity === 64);
          else if (specString.includes("32GB"))
            match = components.find((c: any) => c.capacity === 32);
          else if (specString.includes("16GB"))
            match = components.find((c: any) => c.capacity === 16);
          else match = components[0]; // Default to first RAM
        } else if (category === "storage") {
          // Match by capacity and type
          if (specString.includes("4TB"))
            match = components.find((c: any) => c.capacity >= 4000);
          else if (specString.includes("2TB"))
            match = components.find(
              (c: any) => c.capacity >= 2000 && c.capacity < 4000
            );
          else if (specString.includes("1TB"))
            match = components.find(
              (c: any) => c.capacity >= 1000 && c.capacity < 2000
            );
          else if (specString.includes("500GB"))
            match = components.find(
              (c: any) => c.capacity >= 500 && c.capacity < 1000
            );
          else match = components[0]; // Default to first storage
        } else if (category === "psu") {
          // Match by wattage
          if (specString.includes("1000W"))
            match = components.find((c: any) => c.wattage >= 1000);
          else if (specString.includes("850W"))
            match = components.find(
              (c: any) => c.wattage >= 850 && c.wattage < 1000
            );
          else if (specString.includes("750W"))
            match = components.find(
              (c: any) => c.wattage >= 750 && c.wattage < 850
            );
          else match = components[0]; // Default to first PSU
        } else if (category === "cooling") {
          // Match by type and size
          if (specString.includes("360mm"))
            match = components.find(
              (c: any) => c.radiatorSize === 360 || c.name?.includes("360mm")
            );
          else if (specString.includes("280mm"))
            match = components.find(
              (c: any) => c.radiatorSize === 280 || c.name?.includes("280mm")
            );
          else if (specString.includes("240mm"))
            match = components.find(
              (c: any) => c.radiatorSize === 240 || c.name?.includes("240mm")
            );
          else if (specString.includes("AIO"))
            match = components.find(
              (c: any) => c.type === "Liquid" || c.type === "AIO"
            );
          else match = components[0]; // Default to first cooler
        } else if (category === "motherboard") {
          // Match by socket/platform
          if (specString.includes("Z790") || specString.includes("LGA1700")) {
            match = components.find(
              (c: any) => c.socket === "LGA1700" || c.chipset?.includes("Z790")
            );
          } else if (
            specString.includes("B650") ||
            specString.includes("AM5")
          ) {
            match = components.find(
              (c: any) => c.socket === "AM5" || c.chipset?.includes("B650")
            );
          } else match = components[0]; // Default to first motherboard
        } else if (category === "case") {
          // Match by form factor
          if (specString.includes("ATX"))
            match = components.find((c: any) => c.formFactor === "ATX");
          else if (specString.includes("MicroATX"))
            match = components.find((c: any) => c.formFactor === "MicroATX");
          else match = components[0]; // Default to first case
        }

        // Fallback: return first component in category
        return match || components[0];
      };

      // Map each spec to a component
      if (recommendedBuild.specs.cpu) {
        const cpu = findComponentBySpec("cpu", recommendedBuild.specs.cpu);
        if (cpu) {
          importedComponents.cpu = cpu.id;
          console.log(
            `✅ Matched CPU: ${recommendedBuild.specs.cpu} → ${cpu.name}`
          );

          // Auto-select compatible motherboard
          const motherboards = (useCmsData ? cmsComponents : componentData)
            .motherboard;
          const compatibleMB = motherboards?.find(
            (mb: any) => mb.socket === (cpu as any).socket
          );
          if (compatibleMB) {
            importedComponents.motherboard = compatibleMB.id;
            console.log(
              `✅ Auto-selected compatible motherboard: ${compatibleMB.name}`
            );
          }
        }
      }

      if (recommendedBuild.specs.gpu) {
        const gpu = findComponentBySpec("gpu", recommendedBuild.specs.gpu);
        if (gpu) {
          importedComponents.gpu = gpu.id;
          console.log(
            `✅ Matched GPU: ${recommendedBuild.specs.gpu} → ${gpu.name}`
          );
        }
      }

      if (recommendedBuild.specs.ram) {
        const ram = findComponentBySpec("ram", recommendedBuild.specs.ram);
        if (ram) {
          importedComponents.ram = ram.id;
          console.log(
            `✅ Matched RAM: ${recommendedBuild.specs.ram} → ${ram.name}`
          );
        }
      }

      if (recommendedBuild.specs.storage) {
        const storage = findComponentBySpec(
          "storage",
          recommendedBuild.specs.storage
        );
        if (storage) {
          importedComponents.storage = storage.id;
          console.log(
            `✅ Matched Storage: ${recommendedBuild.specs.storage} → ${storage.name}`
          );
        }
      }

      if (recommendedBuild.specs.cooling) {
        const cooling = findComponentBySpec(
          "cooling",
          recommendedBuild.specs.cooling
        );
        if (cooling) {
          importedComponents.cooling = cooling.id;
          console.log(
            `✅ Matched Cooling: ${recommendedBuild.specs.cooling} → ${cooling.name}`
          );
        }
      }

      if (recommendedBuild.specs.psu) {
        const psu = findComponentBySpec("psu", recommendedBuild.specs.psu);
        if (psu) {
          importedComponents.psu = psu.id;
          console.log(
            `✅ Matched PSU: ${recommendedBuild.specs.psu} → ${psu.name}`
          );
        }
      }

      // Auto-select case if not specified
      if (!importedComponents.case) {
        const cases = (useCmsData ? cmsComponents : componentData).case;
        if (cases && cases.length > 0) {
          importedComponents.case = cases[0].id;
          console.log(`✅ Auto-selected case: ${cases[0].name}`);
        }
      }

      setSelectedComponents(importedComponents);
      console.log(
        "✅ Build import complete. Selected components:",
        importedComponents
      );
    }
  }, [recommendedBuild, useCmsData, cmsComponents]);

  // Merge CMS data with fallback componentData
  const activeComponentData = useCmsData ? cmsComponents : componentData;

  // Merge CMS optional extras with fallback peripheralsData
  const activeOptionalExtrasData = useCmsData
    ? cmsOptionalExtras
    : peripheralsData;

  // Check compatibility whenever components change
  useEffect(() => {
    const issues = checkCompatibility(selectedComponents, activeComponentData);
    setCompatibilityIssues(issues);
  }, [selectedComponents, activeComponentData]);

  const categories = [
    {
      id: "case",
      label: "Case",
      icon: Package,
      count: activeComponentData.case?.length || 0,
    },
    {
      id: "motherboard",
      label: "Motherboard",
      icon: Server,
      count: activeComponentData.motherboard?.length || 0,
    },
    {
      id: "cpu",
      label: "CPU",
      icon: Cpu,
      count: activeComponentData.cpu?.length || 0,
    },
    {
      id: "gpu",
      label: "GPU",
      icon: Monitor,
      count: activeComponentData.gpu?.length || 0,
    },
    {
      id: "ram",
      label: "RAM",
      icon: HardDrive,
      count: activeComponentData.ram?.length || 0,
    },
    {
      id: "storage",
      label: "Storage",
      icon: HardDrive,
      count: activeComponentData.storage?.length || 0,
    },
    {
      id: "psu",
      label: "PSU",
      icon: Zap,
      count: activeComponentData.psu?.length || 0,
    },
    {
      id: "cooling",
      label: "Cooling",
      icon: Fan,
      count: activeComponentData.cooling?.length || 0,
    },
  ];

  const handleComponentSelect = (category: string, componentId: string) => {
    setSelectedComponents((prev: any) => ({
      ...prev,
      [category]: componentId,
    }));
  };

  const handleClearBuild = () => {
    setSelectedComponents({});
    setSelectedPeripherals({});
    setCompatibilityIssues([]);
  };

  const getTotalPrice = () => {
    const componentsTotal = Object.entries(selectedComponents).reduce(
      (total, [category, componentId]) => {
        const component = (activeComponentData as any)[category]?.find(
          (c: any) => c.id === componentId
        );
        return total + (component ? component.price : 0);
      },
      0
    );

    const peripheralsTotal = Object.entries(selectedPeripherals).reduce(
      (total, [category, items]) => {
        if (Array.isArray(items)) {
          return (
            total +
            items.reduce((itemTotal, itemId) => {
              const peripheral = (activeOptionalExtrasData as any)[
                category
              ]?.find((p: any) => p.id === itemId);
              return itemTotal + (peripheral ? peripheral.price : 0);
            }, 0)
          );
        }
        return total;
      },
      0
    );

    return componentsTotal + peripheralsTotal;
  };

  const handlePeripheralToggle = (category: string, peripheralId: string) => {
    setSelectedPeripherals((prev: any) => {
      const currentItems = prev[category] || [];
      const isSelected = currentItems.includes(peripheralId);

      if (isSelected) {
        // Remove the peripheral
        return {
          ...prev,
          [category]: currentItems.filter((id: string) => id !== peripheralId),
        };
      } else {
        // Add the peripheral
        return {
          ...prev,
          [category]: [...currentItems, peripheralId],
        };
      }
    });
  };

  const getSelectedComponentsCount = () => {
    return Object.keys(selectedComponents).length;
  };

  // Generate intelligent, personalized expert comments based on selected components
  const generateBuildComments = () => {
    const comments = [];
    const cpu = activeComponentData.cpu?.find(
      (c) => c.id === selectedComponents.cpu
    );
    const gpu = activeComponentData.gpu?.find(
      (c) => c.id === selectedComponents.gpu
    );
    const ram = activeComponentData.ram?.find(
      (c) => c.id === selectedComponents.ram
    );
    const storage = activeComponentData.storage?.find(
      (c) => c.id === selectedComponents.storage
    );
    const cooling = activeComponentData.cooling?.find(
      (c) => c.id === selectedComponents.cooling
    );
    const psu = activeComponentData.psu?.find(
      (c) => c.id === selectedComponents.psu
    );

    // CPU & GPU pairing insights
    if (cpu && gpu) {
      if ((gpu.vram ?? 0) >= 16 && (cpu.cores ?? 0) >= 8) {
        comments.push(
          "Excellent pairing - your high-core-count CPU won't bottleneck the GPU in demanding workloads like 4K gaming or 3D rendering. This combination ensures both components work at peak efficiency."
        );
      } else if ((gpu.vram ?? 0) >= 12 && (cpu.cores ?? 0) >= 6) {
        comments.push(
          "Well-balanced configuration. The CPU and GPU are perfectly matched for 1440p gaming and content creation, ensuring smooth performance without unnecessary overspending on either component."
        );
      }
    }

    // RAM capacity insights
    if (ram) {
      if ((ram.capacity ?? 0) >= 64) {
        comments.push(
          "With 64GB of RAM, you'll handle professional workflows effortlessly – from 4K video editing with multiple layers to running Docker containers and virtual machines simultaneously. This capacity future-proofs your system for years to come."
        );
      } else if ((ram.capacity ?? 0) === 32) {
        comments.push(
          "32GB strikes the perfect balance for gaming and creative work. You'll comfortably edit 4K footage, run multiple Chrome tabs, Discord, and demanding games simultaneously without performance degradation."
        );
      } else if ((ram.capacity ?? 0) === 16) {
        comments.push(
          "16GB is ideal for gaming and general use. Modern games perform excellently at this capacity, and you'll have headroom for background applications and browser tabs."
        );
      }
    }

    // Storage insights
    if (storage) {
      if (storage.interface?.includes("Gen5")) {
        comments.push(
          "Gen5 NVMe storage delivers cutting-edge sequential speeds exceeding 10,000 MB/s – dramatically reducing game load times and enabling real-time 4K video editing without proxies. DirectStorage-enabled games will particularly benefit from this technology."
        );
      } else if (storage.interface?.includes("Gen4")) {
        comments.push(
          "Gen4 NVMe provides exceptional performance for gaming and content creation. With speeds over 7,000 MB/s, you'll experience near-instant boot times and seamless texture loading in modern games."
        );
      }

      if ((storage.capacity ?? 0) >= 2000) {
        comments.push(
          "2TB+ capacity ensures you won't need to juggle game installations. Modern AAA titles often exceed 150GB – with this capacity, you can maintain a substantial library whilst preserving space for creative projects."
        );
      }
    }

    // Cooling insights
    if (cooling && cpu) {
      if (cooling.type === "Liquid" && cooling.name.includes("360mm")) {
        comments.push(
          "The 360mm AIO provides exceptional thermal headroom, keeping your processor cool even under sustained all-core workloads. This ensures maximum boost clock frequencies and extends component lifespan through lower operating temperatures."
        );
      } else if (cooling.type === "Liquid" && cooling.name.includes("280mm")) {
        comments.push(
          "280mm AIO cooling offers an excellent balance of performance and acoustics. Your CPU will maintain optimal temperatures whilst the larger radiator surface area enables quieter fan operation."
        );
      }
    }

    // PSU efficiency insights
    if (psu) {
      if (psu.efficiency === "80+ Gold" || psu.efficiency === "80+ Platinum") {
        comments.push(
          `${psu.efficiency} certification ensures efficient power delivery with minimal waste heat. This translates to lower electricity bills and quieter operation thanks to less aggressive PSU fan curves.`
        );
      }

      if (cpu && gpu && psu.wattage) {
        const estimatedLoad =
          ((cpu.tdp || 65) + (gpu.power || 150) + 150) / psu.wattage;
        if (estimatedLoad < 0.6) {
          comments.push(
            `Your ${
              psu.wattage
            }W PSU provides ample headroom – the system will typically operate at ${Math.round(
              estimatedLoad * 100
            )}% capacity, maximising efficiency and allowing for future GPU upgrades without PSU replacement.`
          );
        }
      }
    }

    // Overall build insights based on total price
    const totalPrice = getTotalPrice();
    if (totalPrice >= 3000) {
      comments.push(
        "This premium configuration represents our highest tier of components. Every part has been selected for maximum performance and reliability, backed by our rigorous 24-hour stress testing protocol and 3-year comprehensive warranty."
      );
    } else if (totalPrice >= 1500 && totalPrice < 3000) {
      comments.push(
        "You've configured an excellent mid-to-high-end system that balances performance and value. This tier offers the best price-to-performance ratio for enthusiast gaming and professional work."
      );
    }

    return comments;
  };

  const handleCheckoutWithCompatibility = () => {
    const issues = checkCompatibility(selectedComponents, activeComponentData);
    if (issues.length > 0) {
      setShowCompatibilityDialog(true);
    } else {
      // Add build to cart and open cart modal
      addBuildToCart();
    }
  };

  const handleCompatibilityAccept = () => {
    setShowCompatibilityDialog(false);
    // Add build to cart despite compatibility issues
    addBuildToCart();
  };

  const addBuildToCart = () => {
    if (!onAddToCart || !onOpenCart) {
      console.error("Cart functions not provided to PCBuilder");
      return;
    }

    // Create cart item from selected components
    const buildComponents = Object.entries(selectedComponents)
      .filter(([_, componentId]) => componentId !== null)
      .map(([category, componentId]: [string, any]) => {
        // Find the actual component data from activeComponentData
        const component = (activeComponentData as any)[category]?.find(
          (c: any) => c.id === componentId
        );

        if (!component) {
          console.warn(`Component not found: ${category} - ${componentId}`);
          return null;
        }

        return {
          name: component.name,
          price: component.price || 0,
          category: category,
        };
      })
      .filter((comp) => comp !== null);

    if (buildComponents.length === 0) {
      return;
    }

    // Calculate total
    const totalPrice = buildComponents.reduce(
      (sum, comp) => sum + (comp?.price || 0),
      0
    );

    // Create a single cart item for the entire build
    const buildItem = {
      id: `custom-build-${Date.now()}`,
      name: "Custom PC Build",
      price: totalPrice,
      image: "/placeholder-pc.png",
      description: `Custom build with ${buildComponents.length} components`,
      components: buildComponents,
    };

    onAddToCart(buildItem);
    onOpenCart();
  };

  const handleCompatibilityCancel = () => {
    setShowCompatibilityDialog(false);
  };

  // Helper function for safe array includes check
  const safeIncludes = (array: any, value: any) => {
    return Array.isArray(array) && array.includes(value);
  };

  // Helper function to get category display label
  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category
      ? category.label
      : categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  };

  // Intelligent component filtering based on compatibility
  const getCompatibleComponents = (
    category: string,
    currentComponents: any
  ) => {
    const allComponents = (activeComponentData as any)[category] || [];

    // If no components selected yet, show all
    if (Object.keys(currentComponents).length === 0) {
      return allComponents;
    }

    return allComponents.filter((component: any) => {
      // CPU-Motherboard Socket Compatibility
      if (category === "cpu" && currentComponents.motherboard) {
        const motherboard = activeComponentData.motherboard.find(
          (mb: any) => mb.id === currentComponents.motherboard
        );
        if (motherboard && component.socket !== motherboard.socket) {
          return false;
        }
      }

      if (category === "motherboard" && currentComponents.cpu) {
        const cpu = activeComponentData.cpu.find(
          (c: any) => c.id === currentComponents.cpu
        );
        if (cpu && component.socket !== cpu.socket) {
          return false;
        }
      }

      // GPU-Case Clearance
      if (category === "gpu" && currentComponents.case) {
        const pcCase = activeComponentData.case.find(
          (c: any) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          component.length &&
          pcCase.maxGpuLength &&
          component.length > pcCase.maxGpuLength
        ) {
          return false;
        }
      }

      if (category === "case" && currentComponents.gpu) {
        const gpu = activeComponentData.gpu.find(
          (g: any) => g.id === currentComponents.gpu
        );
        if (
          gpu &&
          component.maxGpuLength &&
          gpu.length &&
          gpu.length > component.maxGpuLength
        ) {
          return false;
        }
      }

      // RAM-Motherboard Compatibility
      if (category === "ram" && currentComponents.motherboard) {
        const motherboard = activeComponentData.motherboard.find(
          (mb: any) => mb.id === currentComponents.motherboard
        );
        if (
          motherboard &&
          motherboard.ramSupport &&
          !(Array.isArray(motherboard.ramSupport)
            ? motherboard.ramSupport.includes(component.type)
            : motherboard.ramSupport.includes(component.type))
        ) {
          return false;
        }
      }

      if (category === "motherboard" && currentComponents.ram) {
        const ram = activeComponentData.ram.find(
          (r: any) => r.id === currentComponents.ram
        );
        if (
          ram &&
          component.ramSupport &&
          !(Array.isArray(component.ramSupport)
            ? component.ramSupport.includes(ram.type)
            : component.ramSupport.includes(ram.type))
        ) {
          return false;
        }
      }

      // Case-Motherboard Form Factor
      if (category === "case" && currentComponents.motherboard) {
        const motherboard = activeComponentData.motherboard.find(
          (mb: any) => mb.id === currentComponents.motherboard
        );
        if (
          motherboard &&
          !safeIncludes(
            component.compatibility,
            motherboard.formFactor?.toLowerCase()
          )
        ) {
          return false;
        }
      }

      if (category === "motherboard" && currentComponents.case) {
        const pcCase = activeComponentData.case.find(
          (c: any) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          !safeIncludes(
            pcCase.compatibility,
            component.formFactor?.toLowerCase()
          )
        ) {
          return false;
        }
      }

      // CPU Cooler Height-Case Clearance
      if (
        category === "cooling" &&
        currentComponents.case &&
        component.type === "Air"
      ) {
        const pcCase = activeComponentData.case.find(
          (c: any) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          pcCase.maxCpuCoolerHeight &&
          component.height > pcCase.maxCpuCoolerHeight
        ) {
          return false;
        }
      }

      if (category === "case" && currentComponents.cooling) {
        const cooling = activeComponentData.cooling.find(
          (cool: any) => cool.id === currentComponents.cooling
        );
        if (
          cooling &&
          cooling.type === "Air" &&
          cooling.height &&
          component.maxCpuCoolerHeight &&
          cooling.height > component.maxCpuCoolerHeight
        ) {
          return false;
        }
      }

      // PSU Length-Case Compatibility
      if (category === "psu" && currentComponents.case) {
        const pcCase = activeComponentData.case.find(
          (c: any) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          pcCase.maxPsuLength &&
          component.length > pcCase.maxPsuLength
        ) {
          return false;
        }
      }

      if (category === "case" && currentComponents.psu) {
        const psu = activeComponentData.psu.find(
          (p: any) => p.id === currentComponents.psu
        );
        if (
          psu &&
          psu.length &&
          component.maxPsuLength &&
          psu.length > component.maxPsuLength
        ) {
          return false;
        }
      }

      return true;
    });
  };

  // Function to get detailed incompatibility information for the current category
  const getIncompatibilityDetails = (
    category: string,
    currentComponents: any
  ) => {
    const allComponents = (activeComponentData as any)[category] || [];
    const compatibleComponents = getCompatibleComponents(
      category,
      currentComponents
    );
    const incompatibleComponents = allComponents.filter(
      (component: any) =>
        !compatibleComponents.some(
          (compatible: any) => compatible.id === component.id
        )
    );

    const details: any[] = [];

    incompatibleComponents.forEach((component: any) => {
      const issues: string[] = [];

      // CPU-Motherboard Socket Compatibility
      if (category === "cpu" && currentComponents.motherboard) {
        const motherboard = activeComponentData.motherboard.find(
          (mb: any) => mb.id === currentComponents.motherboard
        );
        if (motherboard && component.socket !== motherboard.socket) {
          issues.push(
            `Socket mismatch: ${component.socket} CPU cannot fit in ${motherboard.socket} motherboard socket`
          );
        }
      }

      if (category === "motherboard" && currentComponents.cpu) {
        const cpu = activeComponentData.cpu.find(
          (c: any) => c.id === currentComponents.cpu
        );
        if (cpu && component.socket !== cpu.socket) {
          issues.push(
            `Socket mismatch: ${component.socket} motherboard cannot fit ${cpu.socket} CPU`
          );
        }
      }

      // GPU-Case Clearance
      if (category === "gpu" && currentComponents.case) {
        const pcCase = activeComponentData.case.find(
          (c: any) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          pcCase.maxGpuLength &&
          component.length > pcCase.maxGpuLength
        ) {
          issues.push(
            `Length clearance: ${component.length}mm GPU too long for ${pcCase.maxGpuLength}mm case clearance`
          );
        }
      }

      if (category === "case" && currentComponents.gpu) {
        const gpu = activeComponentData.gpu.find(
          (g: any) => g.id === currentComponents.gpu
        );
        if (
          gpu &&
          gpu.length &&
          component.maxGpuLength &&
          gpu.length > component.maxGpuLength
        ) {
          issues.push(
            `GPU clearance: Selected ${gpu.length}mm GPU won't fit in this case (max: ${component.maxGpuLength}mm)`
          );
        }
      }

      // RAM-Motherboard Compatibility
      if (category === "ram" && currentComponents.motherboard) {
        const motherboard = activeComponentData.motherboard.find(
          (mb: any) => mb.id === currentComponents.motherboard
        );
        if (
          motherboard &&
          motherboard.ramSupport &&
          !(Array.isArray(motherboard.ramSupport)
            ? motherboard.ramSupport.includes(component.type)
            : motherboard.ramSupport.includes(component.type))
        ) {
          issues.push(
            `Memory type mismatch: ${component.type} RAM not supported by motherboard (supports: ${motherboard.ramSupport})`
          );
        }
      }

      if (category === "motherboard" && currentComponents.ram) {
        const ram = activeComponentData.ram.find(
          (r: any) => r.id === currentComponents.ram
        );
        if (
          ram &&
          component.ramSupport &&
          !(Array.isArray(component.ramSupport)
            ? component.ramSupport.includes(ram.type)
            : component.ramSupport.includes(ram.type))
        ) {
          issues.push(
            `Memory type mismatch: Selected ${
              ram.type
            } RAM not supported (supports: ${
              Array.isArray(component.ramSupport)
                ? component.ramSupport.join(", ")
                : component.ramSupport
            })`
          );
        }
      }

      // Case-Motherboard Form Factor
      if (category === "case" && currentComponents.motherboard) {
        const motherboard = activeComponentData.motherboard.find(
          (mb: any) => mb.id === currentComponents.motherboard
        );
        if (
          motherboard &&
          !safeIncludes(
            component.compatibility,
            motherboard.formFactor?.toLowerCase()
          )
        ) {
          issues.push(
            `Form factor mismatch: ${
              motherboard.formFactor
            } motherboard won't fit in this case (supports: ${
              Array.isArray(component.compatibility)
                ? component.compatibility.join(", ")
                : String(component.compatibility || "unknown")
            })`
          );
        }
      }

      if (category === "motherboard" && currentComponents.case) {
        const pcCase = activeComponentData.case.find(
          (c: any) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          !safeIncludes(
            pcCase.compatibility,
            component.formFactor?.toLowerCase()
          )
        ) {
          issues.push(
            `Form factor mismatch: ${component.formFactor} motherboard won't fit in selected case`
          );
        }
      }

      // CPU Cooler Height-Case Clearance
      if (
        category === "cooling" &&
        currentComponents.case &&
        component.type === "Air"
      ) {
        const pcCase = activeComponentData.case.find(
          (c: any) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          pcCase.maxCpuCoolerHeight &&
          component.height > pcCase.maxCpuCoolerHeight
        ) {
          issues.push(
            `Height clearance: ${component.height}mm cooler too tall for ${pcCase.maxCpuCoolerHeight}mm case clearance`
          );
        }
      }

      if (category === "case" && currentComponents.cooling) {
        const cooling = activeComponentData.cooling.find(
          (cool: any) => cool.id === currentComponents.cooling
        );
        if (
          cooling &&
          cooling.type === "Air" &&
          cooling.height &&
          component.maxCpuCoolerHeight &&
          cooling.height > component.maxCpuCoolerHeight
        ) {
          issues.push(
            `Cooler clearance: Selected ${cooling.height}mm cooler won't fit in this case (max: ${component.maxCpuCoolerHeight}mm)`
          );
        }
      }

      if (issues.length > 0) {
        details.push({
          component: component,
          issues: issues,
        });
      }
    });

    return details;
  };

  const filteredComponents = getCompatibleComponents(
    activeCategory,
    selectedComponents
  );

  // Sort components based on selected sort option
  const sortedComponents = [...filteredComponents].sort((a: any, b: any) => {
    switch (sortBy) {
      case "price":
        return (a.price || 0) - (b.price || 0);
      case "price-desc":
        return (b.price || 0) - (a.price || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      default:
        return 0;
    }
  });

  const totalComponentsInCategory = (
    (activeComponentData as any)[activeCategory] || []
  ).length;
  const filteredCount = filteredComponents.length;

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Stunning Hero Section */}
        <div className="relative mb-20 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="relative">
            {/* Top Badge */}
            <div className="flex justify-center mb-8 animate-shimmer">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-cyan-500/20 border border-sky-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                <Settings className="w-5 h-5 text-sky-400 mr-3 animate-spin-slow" />
                <span className="text-sm font-semibold text-sky-300 tracking-wide">
                  CUSTOM PC BUILDER
                </span>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-center mb-6 leading-tight">
              <span className="block bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(14,165,233,0.5)]">
                Build Your
              </span>
              <span className="block bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_50px_rgba(14,165,233,0.8)]">
                Dream PC
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 text-center max-w-3xl mx-auto mb-8 leading-relaxed">
              Configure every component to create the{" "}
              <span className="text-sky-400 font-semibold">perfect PC</span> for
              your needs. From gaming powerhouses to workstation beasts.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/50 transition-all duration-300 group">
                <CheckCircle className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-gray-300">
                  Real-time Compatibility Check
                </span>
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/50 transition-all duration-300 group">
                <Cpu className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-gray-300">
                  Premium Components
                </span>
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/50 transition-all duration-300 group">
                <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-gray-300">
                  Performance Optimized
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => setActiveCategory("case")}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:shadow-[0_0_50px_rgba(14,165,233,0.6)] transition-all duration-300 transform hover:scale-105"
              >
                <Settings className="w-5 h-5 mr-2" />
                Start Building
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 transition-all duration-300">
                <div className="text-3xl font-bold text-sky-400 mb-1">
                  {categories.reduce((sum, cat) => sum + cat.count, 0)}+
                </div>
                <div className="text-sm text-gray-400">Components</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 transition-all duration-300">
                <div className="text-3xl font-bold text-blue-400 mb-1">8</div>
                <div className="text-sm text-gray-400">Categories</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 transition-all duration-300">
                <div className="text-3xl font-bold text-cyan-400 mb-1">
                  100%
                </div>
                <div className="text-sm text-gray-400">Compatible</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 transition-all duration-300">
                <div className="text-3xl font-bold text-sky-400 mb-1">Free</div>
                <div className="text-sm text-gray-400">Building</div>
              </div>
            </div>
          </div>

          {/* Loading CMS Data */}
          {isLoadingCms && (
            <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-400"></div>
                <p className="text-sky-300">Loading components from CMS...</p>
              </div>
            </div>
          )}

          {/* Import notification */}
          {recommendedBuild && (
            <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-300 font-medium">
                    PC Finder Recommendation Imported
                  </p>
                  <p className="text-sm text-gray-400">
                    Starting with {recommendedBuild.name} configuration
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            {/* Build Summary */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                Build Summary
              </h3>

              <div className="space-y-4">
                {/* Recommended Build Price */}
                {recommendedBuild && (
                  <>
                    <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-green-300 font-medium">
                          Recommended Build
                        </span>
                        <span className="text-lg font-bold text-green-300">
                          £{recommendedBuild.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {recommendedBuild.name}
                      </p>
                    </div>
                    <Separator className="border-white/10" />
                  </>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Components</span>
                  <span className="text-white">
                    {getSelectedComponentsCount()}/8
                  </span>
                </div>

                <Progress
                  value={(getSelectedComponentsCount() / 8) * 100}
                  className="h-2"
                />

                <Separator className="border-white/10" />

                <div className="space-y-2">
                  {Object.entries(selectedComponents).map(
                    ([category, componentId]) => {
                      const component = (activeComponentData as any)[
                        category
                      ]?.find((c: any) => c.id === componentId);
                      return component ? (
                        <div
                          key={category}
                          className="flex justify-between items-center text-sm"
                        >
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">
                              {getCategoryLabel(category)}
                            </span>
                            <span className="text-white font-medium truncate max-w-32">
                              {component.name}
                            </span>
                          </div>
                          <span className="text-white font-medium">
                            £{component.price.toFixed(2)}
                          </span>
                        </div>
                      ) : null;
                    }
                  )}

                  {/* Peripherals */}
                  {Object.entries(selectedPeripherals).map(
                    ([category, items]) => {
                      if (!Array.isArray(items) || items.length === 0)
                        return null;
                      return items.map((itemId: any) => {
                        const peripheral = (activeOptionalExtrasData as any)[
                          category
                        ]?.find((p: any) => p.id === itemId);
                        return peripheral ? (
                          <div
                            key={`${category}-${itemId}`}
                            className="flex justify-between items-center text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="text-green-400 text-xs flex items-center gap-1">
                                <Plus className="w-3 h-3" />
                                {getCategoryLabel(category)}
                              </span>
                              <span className="text-white font-medium truncate max-w-32">
                                {peripheral.name}
                              </span>
                            </div>
                            <span className="text-white font-medium">
                              £{peripheral.price.toFixed(2)}
                            </span>
                          </div>
                        ) : null;
                      });
                    }
                  )}
                </div>

                <Separator className="border-white/10" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">
                    Current Total
                  </span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                    £{getTotalPrice().toLocaleString()}
                  </span>
                </div>

                {/* Price difference indicator */}
                {recommendedBuild && getTotalPrice() > 0 && (
                  <div
                    className={`text-sm text-center p-2 rounded-lg ${
                      getTotalPrice() > recommendedBuild.price
                        ? "bg-red-500/10 text-red-300 border border-red-500/20"
                        : getTotalPrice() < recommendedBuild.price
                        ? "bg-green-500/10 text-green-300 border border-green-500/20"
                        : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    }`}
                  >
                    {getTotalPrice() > recommendedBuild.price
                      ? `+£${(
                          getTotalPrice() - recommendedBuild.price
                        ).toLocaleString()} over budget`
                      : getTotalPrice() < recommendedBuild.price
                      ? `£${(
                          recommendedBuild.price - getTotalPrice()
                        ).toLocaleString()} under budget`
                      : "Matches recommended budget"}
                  </div>
                )}

                {/* Expert Build Comments */}
                {getSelectedComponentsCount() >= 3 &&
                  generateBuildComments().length > 0 && (
                    <div className="space-y-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3 h-3 text-sky-400" />
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          Kevin's Insight
                        </h4>
                      </div>
                      <div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-sky-500/30">
                        {generateBuildComments()
                          .slice(0, 3)
                          .map((comment: any, idx: number) => (
                            <p
                              key={idx}
                              className="text-xs sm:text-sm text-gray-300 leading-relaxed break-words"
                            >
                              {comment}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Compatibility Status */}
                {compatibilityIssues.length > 0 && (
                  <Alert className="border-yellow-500/20 bg-yellow-500/10">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-300">
                      {compatibilityIssues.length} compatibility{" "}
                      {compatibilityIssues.length === 1 ? "issue" : "issues"}{" "}
                      detected
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleCheckoutWithCompatibility}
                    className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white"
                    disabled={getSelectedComponentsCount() === 0}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>

                  {getSelectedComponentsCount() > 0 && (
                    <Button
                      onClick={handleClearBuild}
                      variant="outline"
                      className="w-full border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Build
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Category Navigation */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Components</h3>
              <div className="space-y-2">
                {categories.map((category: any) => {
                  const Icon = category.icon;
                  const isSelected = activeCategory === category.id;
                  const hasComponent = selectedComponents[category.id];

                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                        isSelected
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "hover:bg-white/10 text-gray-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{category.label}</span>
                        {hasComponent && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
            {/* Component Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white capitalize">
                  {activeCategory === "case"
                    ? "PC Cases"
                    : activeCategory === "motherboard"
                    ? "Motherboards"
                    : activeCategory === "cpu"
                    ? "Processors"
                    : activeCategory === "gpu"
                    ? "Graphics Cards (GPU)"
                    : activeCategory === "ram"
                    ? "Memory (RAM)"
                    : activeCategory === "psu"
                    ? "Power Supply Units (PSU)"
                    : activeCategory.charAt(0).toUpperCase() +
                      activeCategory.slice(1)}
                </h2>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  Choose the perfect{" "}
                  {activeCategory === "case"
                    ? "PC case"
                    : activeCategory === "motherboard"
                    ? "motherboard"
                    : activeCategory === "cpu"
                    ? "processor"
                    : activeCategory === "gpu"
                    ? "graphics card"
                    : activeCategory === "ram"
                    ? "memory"
                    : activeCategory === "psu"
                    ? "power supply"
                    : activeCategory}{" "}
                  for your build
                </p>
                {/* Compatibility Status */}
                {Object.keys(selectedComponents).length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
                      <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                      <span className="text-xs text-sky-300">
                        {filteredCount} of {totalComponentsInCategory}{" "}
                        compatible
                      </span>
                    </div>
                    {filteredCount < totalComponentsInCategory && (
                      <button
                        onClick={() => setShowIncompatibilityModal(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-300">
                          {totalComponentsInCategory - filteredCount}{" "}
                          incompatible
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
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

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 text-white">
                    <SelectItem value="price">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Components Grid/List */}
            <div
              className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {sortedComponents.map((component: any) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  category={activeCategory}
                  isSelected={
                    selectedComponents[activeCategory] === component.id
                  }
                  onSelect={handleComponentSelect}
                  viewMode={viewMode}
                />
              ))}
            </div>

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
          </div>
        </div>

        {/* Optional Peripherals Section */}
        <div className="mt-8 sm:mt-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 mb-3 sm:mb-4">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm text-green-300">
                Optional Extras
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent px-4">
              Enhance Your Setup
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Complete your gaming experience with premium peripherals
            </p>
          </div>

          <Tabs defaultValue="keyboard" className="space-y-6 sm:space-y-8">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-white/10 backdrop-blur-xl p-2 rounded-xl gap-2 h-auto">
              <TabsTrigger
                value="keyboard"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
              >
                <Keyboard className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Keyboards</span>
                <span className="sm:hidden">Keys</span>
              </TabsTrigger>
              <TabsTrigger
                value="mouse"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
              >
                <Mouse className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Mice</span>
                <span className="sm:hidden">Mice</span>
              </TabsTrigger>
              <TabsTrigger
                value="monitor"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
              >
                <Monitor className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Monitors</span>
                <span className="sm:hidden">Mon</span>
              </TabsTrigger>
              <TabsTrigger
                value="gamepad"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Gamepads</span>
                <span className="sm:hidden">Pad</span>
              </TabsTrigger>
              <TabsTrigger
                value="mousepad"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
              >
                <Package className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Mousepads</span>
                <span className="sm:hidden">Mat</span>
              </TabsTrigger>
            </TabsList>

            {/* Keyboards */}
            <TabsContent value="keyboard" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Gaming Keyboards
                  </h3>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Premium mechanical keyboards for the ultimate typing
                    experience
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-sm self-start sm:self-auto"
                >
                  {(selectedPeripherals.keyboard || []).length} selected
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {activeOptionalExtrasData.keyboard.map((keyboard: any) => (
                  <PeripheralCard
                    key={keyboard.id}
                    peripheral={keyboard}
                    category="keyboard"
                    isSelected={(selectedPeripherals.keyboard || []).includes(
                      keyboard.id
                    )}
                    onToggle={handlePeripheralToggle}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Mice */}
            <TabsContent value="mouse" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Gaming Mice
                  </h3>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Precision gaming mice with cutting-edge sensors
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-sm self-start sm:self-auto"
                >
                  {(selectedPeripherals.mouse || []).length} selected
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {activeOptionalExtrasData.mouse.map((mouse: any) => (
                  <PeripheralCard
                    key={mouse.id}
                    peripheral={mouse}
                    category="mouse"
                    isSelected={(selectedPeripherals.mouse || []).includes(
                      mouse.id
                    )}
                    onToggle={handlePeripheralToggle}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Monitors */}
            <TabsContent value="monitor" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Gaming Monitors
                  </h3>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    High-refresh displays for competitive gaming and immersive
                    visuals
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-sm self-start sm:self-auto"
                >
                  {(selectedPeripherals.monitor || []).length} selected
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {activeOptionalExtrasData.monitor.map((monitor: any) => (
                  <PeripheralCard
                    key={monitor.id}
                    peripheral={monitor}
                    category="monitor"
                    isSelected={(selectedPeripherals.monitor || []).includes(
                      monitor.id
                    )}
                    onToggle={handlePeripheralToggle}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Gamepads */}
            <TabsContent value="gamepad" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Gaming Controllers
                  </h3>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Professional-grade controllers for console and PC gaming
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-sm self-start sm:self-auto"
                >
                  {(selectedPeripherals.gamepad || []).length} selected
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {activeOptionalExtrasData.gamepad.map((gamepad: any) => (
                  <PeripheralCard
                    key={gamepad.id}
                    peripheral={gamepad}
                    category="gamepad"
                    isSelected={(selectedPeripherals.gamepad || []).includes(
                      gamepad.id
                    )}
                    onToggle={handlePeripheralToggle}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Mousepads */}
            <TabsContent value="mousepad" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Gaming Mousepads
                  </h3>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Premium surfaces for optimal mouse tracking and comfort
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-sm self-start sm:self-auto"
                >
                  {(selectedPeripherals.mousepad || []).length} selected
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {activeOptionalExtrasData.mousepad.map((mousepad: any) => (
                  <PeripheralCard
                    key={mousepad.id}
                    peripheral={mousepad}
                    category="mousepad"
                    isSelected={(selectedPeripherals.mousepad || []).includes(
                      mousepad.id
                    )}
                    onToggle={handlePeripheralToggle}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Compatibility Alert Dialog */}
        {showCompatibilityDialog && (
          <CompatibilityAlert
            compatibilityIssues={compatibilityIssues}
            onAccept={handleCompatibilityAccept}
            onCancel={handleCompatibilityCancel}
          />
        )}

        {/* Incompatibility Details Modal */}
        <AlertDialog
          open={showIncompatibilityModal}
          onOpenChange={setShowIncompatibilityModal}
        >
          <AlertDialogContent className="max-w-3xl bg-black/95 border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                Incompatible{" "}
                {activeCategory.charAt(0).toUpperCase() +
                  activeCategory.slice(1)}{" "}
                Components
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                These components are not compatible with your current build.
                Here's why and how to fix it:
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {getIncompatibilityDetails(
                activeCategory,
                selectedComponents
              ).map((detail: any, index: number) => (
                <div
                  key={index}
                  className="border border-amber-500/20 rounded-lg p-4 bg-amber-500/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">
                        {detail.component.name}
                      </h4>
                      <p className="text-sm text-gray-400 mb-3">
                        £{detail.component.price?.toFixed(2)}
                      </p>

                      <div className="space-y-2">
                        {detail.issues.map(
                          (issue: string, issueIndex: number) => (
                            <div
                              key={issueIndex}
                              className="flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-amber-200">{issue}</p>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-3 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
                        <p className="text-sm text-sky-300">
                          <strong>How to fix:</strong>{" "}
                          {detail.issues[0]?.includes("Socket")
                            ? "Choose a compatible CPU and motherboard with matching sockets"
                            : detail.issues[0]?.includes("Length") ||
                              detail.issues[0]?.includes("clearance")
                            ? "Select a larger case or smaller component"
                            : detail.issues[0]?.includes("Memory type")
                            ? "Choose compatible RAM type supported by your motherboard"
                            : detail.issues[0]?.includes("Form factor")
                            ? "Select compatible motherboard and case form factors"
                            : "Review component specifications and choose compatible alternatives"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {getIncompatibilityDetails(activeCategory, selectedComponents)
                .length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No incompatible components found for this category.</p>
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setShowIncompatibilityModal(false)}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                Got it, thanks!
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
