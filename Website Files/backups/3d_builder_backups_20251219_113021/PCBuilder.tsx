import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import {
  documentToReactComponents,
  Options,
} from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, Document } from "@contentful/rich-text-types";
import DOMPurify from "dompurify";
import { buildFullShareUrl, decodeFullBuild } from "../services/buildSharing";
import { toast } from "sonner";
import { logger } from "../services/logger";
import { ComponentErrorBoundary } from "./ErrorBoundary";
import { saveConfiguration } from "../services/database";
import { useAuth } from "../contexts/AuthContext";
const ProductComparison = lazy(() =>
  import("./ProductComparison").then((m) => ({ default: m.ProductComparison }))
);
import { BuildsCompletedToday } from "./SocialProof";
import {
  trackSearch,
  trackZeroResultSearch,
  trackSearchRefinement,
} from "../services/searchTracking";
import { getSessionId, trackClick } from "../services/sessionTracker";
import { getSearchSessionId } from "../utils/searchSessionManager";
import { componentData, PLACEHOLDER_IMAGE } from "./data/pcBuilderComponents";
import { peripheralsData } from "./data/pcBuilderPeripherals";

// Lazy load heavy analysis modules - only loaded when needed for "Kevin's Insight"
const loadInsightModules = async () => {
  const [
    gpuPerfMod,
    cpuPerfMod,
    ramMod,
    coolingMod,
    psuMod,
    synergyMod,
    useCaseMod,
    compCtxMod,
    advDiagMod,
    upgradeMod,
    futureProofMod,
    priceTierMod,
    ctaMod,
  ] = await Promise.all([
    import("./data/gpuPerformanceVariations"),
    import("./data/cpuPerformanceVariations"),
    import("./data/ramInsightVariations"),
    import("./data/coolingInsightVariations"),
    import("./data/psuInsightVariations"),
    import("./data/synergyGradeCalculation"),
    import("./data/useCaseDetection"),
    import("./data/competitiveContext"),
    import("./data/advancedDiagnostics"),
    import("./data/upgradePathGuidance"),
    import("./data/futureProofingAnalysis"),
    import("./data/priceTierInsights"),
    import("./data/ctaFormatting"),
  ]);

  return {
    getGPUPerformanceInsight: gpuPerfMod.getGPUPerformanceInsight,
    getCPUPerformanceInsight: cpuPerfMod.getCPUPerformanceInsight,
    getRAMInsight: ramMod.getRAMInsight,
    getCoolingInsight: coolingMod.getCoolingInsight,
    getPSUInsights: psuMod.getPSUInsights,
    calculateSynergyGrade: synergyMod.calculateSynergyGrade,
    // Use-case helpers (guard missing exports)
    detectUseCase: useCaseMod.detectUseCase,
    getUseCaseIntro: useCaseMod.getUseCaseIntro,
    getPerformanceEstimate: useCaseMod.getPerformanceEstimate,
    generateCTAs: useCaseMod.generateCTAs,
    // Competitive context (exclude missing getBrandPositioning)
    getCompetitiveContext: compCtxMod.getCompetitiveContext,
    getTCOAnalysis: compCtxMod.getTCOAnalysis,
    getAdvancedDiagnostics: advDiagMod.getAdvancedDiagnostics,
    getUpgradeSuggestions: upgradeMod.getUpgradeSuggestions,
    // Future proofing (exclude missing TCO cost helpers)
    calculateGPUFutureProofScore: futureProofMod.calculateGPUFutureProofScore,
    calculateCPUFutureProofScore: futureProofMod.calculateCPUFutureProofScore,
    getGenerationalComparisons: futureProofMod.getGenerationalComparisons,
    getBuildFutureProofAnalysis: futureProofMod.getBuildFutureProofAnalysis,
    getPriceTierInsight: priceTierMod.getPriceTierInsight,
    formatCTASection: ctaMod.formatCTASection,
  };
};

// Rich Text rendering options for Contentful Rich Text fields
const richTextRenderOptions: Options = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node, children) => (
      <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
    ),
    [BLOCKS.UL_LIST]: (_node, children) => (
      <ul className="list-disc list-inside mb-4 space-y-2 pl-4">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (_node, children) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 pl-4">
        {children}
      </ol>
    ),
    [BLOCKS.LIST_ITEM]: (_node, children) => (
      <li className="mb-1">{children}</li>
    ),
    [INLINES.HYPERLINK]: (node, children) => (
      <a
        href={node.data.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-400 hover:text-sky-300 underline transition-colors"
      >
        {children}
      </a>
    ),
  },
  renderText: (text) => {
    // Preserve line breaks in text nodes
    return text
      .split("\n")
      .reduce((children: React.ReactNode[], textSegment, index) => {
        return [...children, index > 0 && <br key={index} />, textSegment];
      }, []);
  },
};

// Helper to render Rich Text from Contentful or plain text fallback
const renderRichText = (content?: string | Document): React.ReactNode => {
  if (!content) return null;

  // If it's a Contentful Rich Text Document object
  if (
    typeof content === "object" &&
    "nodeType" in content &&
    content.nodeType === "document"
  ) {
    return documentToReactComponents(
      content as Document,
      richTextRenderOptions
    );
  }

  // Fallback: plain text with basic markdown-style link conversion
  if (typeof content === "string") {
    // Convert markdown-style links to HTML
    const withLinks = content.replace(
      /\[([^\]]+)\]\((https?:[^)]+)\)/g,
      (_m, text, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline">${text}</a>`;
      }
    );

    // Sanitize with DOMPurify (allows only safe tags and links)
    const sanitized = DOMPurify.sanitize(withLinks, {
      ALLOWED_TAGS: ["a", "br", "p", "strong", "em", "span"],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
      ALLOW_DATA_ATTR: false,
    });

    return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }

  return null;
};

// --- Typed Interfaces to replace implicit any usage ---
export interface PCBuilderComponent {
  id: string;
  name?: string;
  price?: number | null;
  brand?: string;
  brandLogo?: string; // URL to brand/manufacturer logo image
  model?: string;
  category?: string;
  socket?: string;
  chipset?: string;
  generation?: string;
  ramSupport?: string | string[];
  maxRam?: number | null;
  ramSlots?: number;
  cores?: number;
  threads?: number;
  tdp?: number;
  // Extended CPU fields from Contentful
  processorFamily?: string;
  processorGeneration?: string;
  processorOperatingModes?: string;
  baseClock?: number;
  boostClock?: number;
  onBoardGraphicsCardModel?: string;
  processorCache?: string;
  integratedGraphics?: boolean;
  coolerIncluded?: boolean;
  efficientCores?: number;
  performanceCores?: number;
  processorBasePower?: string;
  maximumTurboPower?: string;
  // GPU specific fields
  chipsetManufacturer?: string;
  graphicsChipset?: string;
  memorySize?: string;
  vram?: number;
  memoryType?: string;
  cudaCores?: number;
  gpuBaseClock?: number;
  gpuBoostClock?: number;
  outputs?: string;
  maxDisplaySupport?: number;
  powerConnecters?: string[];
  gpuCooling?: string;
  psuRequirements?: string;
  connectorsRequired?: string;
  power?: number;
  length?: number;
  wattage?: number;
  capacity?: number | null;
  type?: string | string[];
  interface?: string;
  speed?: string | number;
  efficiency?: string;
  // PSU specific fields
  connectors?: string[];
  psuCompatibility?: string;
  pfc?: string;
  acInput?: string;
  fanType?: string;
  fanBearing?: string;
  maxCertification?: string;
  mtbf?: number;
  protection?: string[];
  radiatorSize?: string | number;
  coolerType?: string;
  socketCompatibility?: string[];
  height?: number;
  tdpSupport?: number;
  maxGpuLength?: number | null;
  maxCpuCoolerHeight?: number;
  maxPsuLength?: number;
  formFactor?: string;
  platform?: string;
  // Additional optional fields used across UI
  description?: string;
  mainProductDescription?: string | Document;
  features?: string[] | null;
  compatibility?: string[] | string;
  gpuClearance?: string;
  coolingSupport?: string;
  style?: string;
  pciSlots?: number;
  m2Slots?: number;
  internalIOConnectors?: string[];
  backPanelIOPorts?: string[];
  colour?: string | string[];
  color?: string | string[] | null;
  fanSize?: number;
  rgbLighting?: boolean;
  modules?: number;
  latency?: number;
  // RAM specific fields
  voltage?: number;
  compliance?: string;
  pins?: number;
  casLatency?: string;
  intelXmpCertified?: string;
  dataIntegrityCheck?: string;
  heatsink?: boolean;
  timings?: string;
  driveType?: string;
  readSpeed?: number;
  writeSpeed?: number;
  nand?: string | null;
  // Storage specific fields
  storageMtbf?: number;
  totalBytesWritten?: string;
  operatingTemperatures?: string;
  storageTemperatures?: string;
  shockResistance?: number;
  modular?: string | boolean;
  slots?: number;
  inStock?: boolean;
  stockLevel?: number;
  techSheet?: string;
  version?: string;
  licenseType?: string;
  architecture?: string;
  featured?: boolean | null;
  images?: Array<string | { url?: string; src?: string }>;
  rating?: number;
  performance?: string;
  imagesByOption?: Record<string, Record<string, string[]>>;
  pricesByOption?: Record<
    string,
    Record<string, number | { price: number; ean?: string }>
  >;
  [key: string]: unknown;
}

export interface SelectedComponentIds {
  case?: string;
  motherboard?: string;
  cpu?: string;
  ram?: string;
  gpu?: string;
  storage?: string;
  psu?: string;
  cooling?: string;
  caseFans?: string;
}

type CategoryKey = keyof SelectedComponentIds;
type AnyComponent = PCBuilderComponent | PCComponent;

export interface ComponentDataMap {
  case?: AnyComponent[];
  motherboard?: AnyComponent[];
  cpu?: AnyComponent[];
  gpu?: AnyComponent[];
  ram?: AnyComponent[];
  storage?: AnyComponent[];
  psu?: AnyComponent[];
  cooling?: AnyComponent[];
  caseFans?: AnyComponent[];
  [key: string]: AnyComponent[] | undefined;
}
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ProgressiveImage } from "./ProgressiveImage";
import {
  fetchPCComponents,
  fetchPCOptionalExtras,
  PCComponent,
  PCOptionalExtra,
} from "../services/cms";
import { loadPersistedRecommendation } from "../services/recommendation";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "./ui/sheet";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import type { SavedBuild } from "./BuildComparisonModal";
const EnthusiastBuilder = lazy(() =>
  import("./EnthusiastBuilder").then((m) => ({
    default: m.EnthusiastBuilder,
  }))
);
const BuildComparisonModal = lazy(() =>
  import("./BuildComparisonModal").then((m) => ({
    default: m.BuildComparisonModal,
  }))
);
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { VisuallyHidden } from "./ui/visually-hidden";
import { AspectRatio } from "./ui/aspect-ratio";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Cpu,
  HardDrive,
  Monitor,
  Thermometer,
  Usb,
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
  ChevronUp,
  ChevronDown,
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
  ArrowLeftRight,
  Download,
  RefreshCw,
  Share2,
  X,
  TrendingUp,
  Building2,
  Shield,
  Search,
  Copy,
  Minimize2,
  Maximize2,
  Activity,
  Wind,
  HelpCircle,
  Headphones,
  Cable,
  Box,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProductSchema } from "./seo/ProductSchema";
import { getStorageInsight } from "../utils/storageInsights";
import type { TCOContext } from "./data/competitiveContext";
import { useOptionSelectionsMap } from "../hooks/useOptionSelectionsMap";

// Strict adapter to match expected Component-like inputs for insight helpers
type ComparisonComponent = {
  name?: string;
  price?: number;
  cores?: number;
  tdp?: number;
  vram?: number;
};

const toComparisonComponent = (
  c: AnyComponent | undefined
): ComparisonComponent => {
  const cc = c as PCBuilderComponent | undefined;
  const hasMsrp = cc && "msrp" in cc;
  const priceCandidate =
    typeof cc?.price === "number"
      ? cc?.price
      : hasMsrp && typeof (cc as { msrp?: number }).msrp === "number"
      ? (cc as { msrp?: number }).msrp
      : undefined;
  return {
    name: cc?.name,
    price: typeof priceCandidate === "number" ? priceCandidate : 0,
    cores: cc?.cores,
    tdp: cc?.tdp,
    vram: cc?.vram,
  };
};

// ⚡ PERFORMANCE OPTIMIZATION: Old insight imports removed - now lazy loaded
// These modules totaled ~363KB and are now loaded on-demand when build comments are shown
// See loadInsightModules() function at top of file

// Category-specific simple filters (options and ranges)
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

// Compact corner tag for "Featured" items (gold outline, slightly larger)
const FeaturedTag = ({ label = "Featured" }: { label?: string }) => (
  <div className="rounded-full bg-black/30 backdrop-blur-xl border-2 border-amber-400/70 text-amber-300 text-xs font-semibold tracking-wide px-3 py-1 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
    {label}
  </div>
);

// Build Details Modal Component
// Data shape for a persisted or recommended build (from finder or external source)
interface RecommendedBuildSpec {
  name?: string;
  description?: string;
  price?: number;
  specs?: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    psu?: string;
    cooling?: string;
    case?: string;
  };
  [key: string]: unknown;
}

interface CompatibilityIssue {
  severity: "critical" | "warning";
  title: string;
  description: string;
  recommendation: string;
  affectedComponents: string[];
}

// Skeleton Loading Components
const ComponentCardSkeleton = ({
  viewMode = "grid",
}: {
  viewMode?: string;
}) => {
  if (viewMode === "list") {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
            {/* Image skeleton */}
            <div className="sm:col-span-3">
              <div className="w-full h-32 bg-white/10 rounded-lg"></div>
            </div>
            {/* Content skeleton */}
            <div className="sm:col-span-6 space-y-3">
              <div className="h-6 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-white/10 rounded"></div>
                <div className="h-6 w-24 bg-white/10 rounded"></div>
              </div>
            </div>
            {/* Price skeleton */}
            <div className="sm:col-span-3 space-y-3">
              <div className="h-8 bg-white/10 rounded w-24 ml-auto"></div>
              <div className="h-10 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
      <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
      <div className="p-6 space-y-4">
        {/* Image skeleton */}
        <div className="w-full h-48 bg-white/10 rounded-lg"></div>
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-6 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-white/10 rounded"></div>
            <div className="h-6 w-20 bg-white/10 rounded"></div>
          </div>
          <div className="h-8 bg-white/10 rounded w-24"></div>
          <div className="h-10 bg-white/10 rounded"></div>
        </div>
      </div>
    </Card>
  );
};

const BuildSummarySkeleton = () => {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 sm:p-6 overflow-hidden relative">
      <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
      <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
      <div className="space-y-4">
        <div className="h-16 bg-white/10 rounded"></div>
        <div className="h-12 bg-white/10 rounded"></div>
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    </Card>
  );
};

const CategoryNavSkeleton = () => {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 overflow-hidden relative">
      <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
      <div className="h-6 bg-white/10 rounded w-28 mb-4"></div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-white/10 rounded"></div>
        ))}
      </div>
    </Card>
  );
};

const BuildDetailsModal = ({
  isOpen,
  onClose,
  recommendedBuild,
  selectedComponents,
  componentData,
}: {
  isOpen: boolean;
  onClose: () => void;
  recommendedBuild: RecommendedBuildSpec | null | undefined;
  selectedComponents: SelectedComponentIds;
  componentData: ComponentDataMap;
}) => {
  if (!recommendedBuild) return null;

  const buildComponents: { category: string; component: PCBuilderComponent }[] =
    Object.entries(selectedComponents)
      .filter(([, componentId]) => !!componentId)
      .map(([category, componentId]) => {
        const list = (componentData[category] || []) as PCBuilderComponent[];
        const component = list.find((c) => c.id === componentId) as
          | PCBuilderComponent
          | undefined;
        return component ? { category, component } : null;
      })
      .filter(
        (item): item is { category: string; component: PCBuilderComponent } =>
          !!item
      );

  const totalPrice = buildComponents.reduce(
    (sum, item) => sum + (item?.component?.price || 0),
    0
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "case":
        return Package;
      case "motherboard":
        return Server;
      case "cpu":
        return Cpu;
      case "gpu":
        return Monitor;
      case "ram":
        return HardDrive;
      case "storage":
        return HardDrive;
      case "psu":
        return Zap;
      case "cooling":
        return Fan;
      case "caseFans":
        return Fan;
      default:
        return Package;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      case: "Case",
      motherboard: "Motherboard",
      cpu: "Processor (CPU)",
      gpu: "Graphics Card (GPU)",
      ram: "Memory (RAM)",
      storage: "Storage",
      psu: "Power Supply (PSU)",
      cooling: "Cooling System",
      caseFans: "Case Fans",
    };
    return labels[category] || category;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <Eye className="w-8 h-8 text-sky-400" />
            {recommendedBuild.name || "Recommended Build"}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-lg">
            Complete build specification from PC Finder recommendation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Components List */}
          <div className="space-y-4">
            {buildComponents.map((item) => {
              const Icon = getCategoryIcon(item.category);
              return (
                <div
                  key={item.category}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400 mb-1">
                            {getCategoryLabel(item.category)}
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1 break-words">
                            {item.component.name}
                          </h4>
                        </div>

                        {item.component.rating && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" />
                            {item.component.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Build Imported Successfully
                  </h4>
                  <p className="text-sm text-gray-400">
                    {buildComponents.length} components configured
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Total</div>
                <div className="text-2xl font-bold text-green-400">
                  £{totalPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
            >
              Continue Building
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Enhanced Image Gallery Component
type ImageRef = string | { url?: string; src?: string };
const getImageUrl = (img: ImageRef): string =>
  typeof img === "string" ? img : img.url || img.src || PLACEHOLDER_IMAGE;

// Helper to get first image from a component
const getComponentImage = (component: AnyComponent): string => {
  if (
    component.images &&
    Array.isArray(component.images) &&
    component.images.length > 0
  ) {
    return getImageUrl(component.images[0]);
  }
  return PLACEHOLDER_IMAGE;
};

const ComponentImageGallery = ({
  images,
  productName,
  isCompact = false,
  isModal = false,
}: {
  images: ImageRef[];
  productName: string;
  isCompact?: boolean;
  isModal?: boolean;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Normalize to URL strings; fallback to placeholders (up to 4)
  const productImages: string[] =
    images && images.length > 0
      ? images.map(getImageUrl)
      : Array(4).fill(PLACEHOLDER_IMAGE);

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

            {/* Image Counter and Navigation Only */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Image Counter */}
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-white/10 backdrop-blur-md text-white border-white/20 text-xs"
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
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

            {/* Image Counter and Navigation Only */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Image Counter */}
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-white/10 backdrop-blur-md text-white border-white/20 text-xs"
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
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
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 px-2 pt-2">
            {productImages.slice(0, 3).map((image: string, index: number) => (
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Badge
                variant="secondary"
                className="bg-white/15 backdrop-blur-md text-white border-white/20"
              >
                {currentImageIndex + 1} / {productImages.length}
              </Badge>
            </div>
          </div>

          {/* Gallery thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-2">
            {productImages.map((image: string, index: number) => (
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
  component: PCBuilderComponent;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string, componentId: string) => void;
  isSelected: boolean;
}) => {
  // Option state
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: string;
  }>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Detect available options (color, size, style, etc.)
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

  // Initialize selectedOptions with default values
  useEffect(() => {
    const defaults: { [key: string]: string } = {};
    uniqueOptions.forEach((opt) => {
      if (!selectedOptions[opt.key]) {
        defaults[opt.key] = opt.values[0];
      }
    });
    if (Object.keys(defaults).length > 0) {
      setSelectedOptions((prev) => ({ ...prev, ...defaults }));
    }
  }, [component?.id, selectedOptions, uniqueOptions]);

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

  // Option-based image switching
  const detailImages: string[] = (() => {
    // If images are mapped by option, use selected option
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
          if (imgs && imgs.length) return imgs;
        }

        // Also check alternate spelling: if looking for 'colour', try 'color' and vice versa
        const altKey =
          opt.key === "colour"
            ? "color"
            : opt.key === "color"
            ? "colour"
            : null;
        if (altKey && imagesByOpt[altKey] && imagesByOpt[altKey][sel]) {
          const imgs = imagesByOpt[altKey][sel];
          if (imgs && imgs.length) return imgs;
        }
      }
    }
    // Fallback to default images
    return component?.images && component.images.length > 0
      ? (component.images as string[])
      : Array(4).fill(PLACEHOLDER_IMAGE);
  })();

  // Reset index when component or option changes
  const selectedOptionsStr = JSON.stringify(selectedOptions);
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [component?.id, selectedOptionsStr]);

  if (!component) return null;

  const getSpecifications = () => {
    const specs = [];

    // Common specs
    if (component.name) specs.push({ label: "Name", value: component.name });
    if (component.brand) specs.push({ label: "Brand", value: component.brand });
    if (component.model) specs.push({ label: "Model", value: component.model });
    if (component.price)
      specs.push({
        label: "Price",
        value: `£${(typeof displayPrice === "number"
          ? displayPrice
          : component.price
        ).toFixed(2)}`,
      });
    if (component.rating)
      specs.push({ label: "Rating", value: `${component.rating}/5` });

    // Category-specific specs
    switch (category) {
      case "case":
        if (component.brand)
          specs.push({ label: "Brand", value: component.brand });
        if (component.model)
          specs.push({ label: "Model", value: component.model });
        if (component.colourOptions)
          specs.push({
            label: "Colour Options",
            value: Array.isArray(component.colourOptions)
              ? component.colourOptions.join(", ")
              : component.colourOptions,
          });
        if (component.formFactor)
          specs.push({ label: "Form Factor", value: component.formFactor });
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
        if (component.cpuCompatability)
          specs.push({
            label: "CPU Compatability",
            value: Array.isArray(component.cpuCompatability)
              ? component.cpuCompatability.join(", ")
              : String(component.cpuCompatability),
          });
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
        if (component.internalIOConnectors)
          specs.push({
            label: "Internal I/O Connectors",
            value: component.internalIOConnectors.join(", "),
          });
        if (component.backPanelIOPorts)
          specs.push({
            label: "Back Panel I/O Ports",
            value: component.backPanelIOPorts.join(", "),
          });
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
        if (component.processorFamily)
          specs.push({
            label: "Processor Family",
            value: component.processorFamily,
          });
        if (component.processorGeneration)
          specs.push({
            label: "Generation",
            value: component.processorGeneration,
          });
        if (component.baseClock)
          specs.push({
            label: "Base Clock",
            value: `${component.baseClock} GHz`,
          });
        if (component.boostClock)
          specs.push({
            label: "Boost Clock",
            value: `${component.boostClock} GHz`,
          });
        if (component.processorOperatingModes)
          specs.push({
            label: "Operating Modes",
            value: component.processorOperatingModes,
          });
        if (component.processorCache)
          specs.push({ label: "Cache", value: component.processorCache });
        if (component.performanceCores)
          specs.push({ label: "P-Cores", value: component.performanceCores });
        if (component.efficientCores)
          specs.push({ label: "E-Cores", value: component.efficientCores });
        if (component.integratedGraphics !== undefined)
          specs.push({
            label: "Integrated Graphics",
            value: component.integratedGraphics ? "Yes" : "No",
          });
        if (component.onBoardGraphicsCardModel)
          specs.push({
            label: "iGPU Model",
            value: component.onBoardGraphicsCardModel,
          });
        if (component.processorBasePower)
          specs.push({
            label: "Base Power",
            value: component.processorBasePower,
          });
        if (component.maximumTurboPower)
          specs.push({
            label: "Max Turbo Power",
            value: component.maximumTurboPower,
          });
        if (component.coolerIncluded !== undefined)
          specs.push({
            label: "Cooler Included",
            value: component.coolerIncluded ? "Yes" : "No",
          });
        if (component.generation)
          specs.push({ label: "Generation", value: component.generation });
        if (component.platform)
          specs.push({ label: "Platform", value: component.platform });
        break;

      case "gpu":
        if (component.chipsetManufacturer)
          specs.push({
            label: "Chipset Manufacturer",
            value: component.chipsetManufacturer,
          });
        if (component.graphicsChipset)
          specs.push({
            label: "Graphics Chipset",
            value: component.graphicsChipset,
          });
        if (component.memorySize)
          specs.push({ label: "Memory Size", value: component.memorySize });
        if (component.vram)
          specs.push({ label: "VRAM", value: `${component.vram}GB` });
        if (component.memoryType)
          specs.push({ label: "Memory Type", value: component.memoryType });
        if (component.cudaCores)
          specs.push({ label: "CUDA Cores", value: component.cudaCores });
        if (component.gpuBaseClock)
          specs.push({
            label: "Base Clock",
            value: `${component.gpuBaseClock} MHz`,
          });
        if (component.gpuBoostClock)
          specs.push({
            label: "Boost Clock",
            value: `${component.gpuBoostClock} MHz`,
          });
        if (component.interface)
          specs.push({ label: "Interface", value: component.interface });
        if (component.outputs)
          specs.push({ label: "Outputs", value: component.outputs });
        if (component.maxDisplaySupport)
          specs.push({
            label: "Max Display Support",
            value: component.maxDisplaySupport,
          });
        if (component.powerConnecters)
          specs.push({
            label: "Power Connectors",
            value: component.powerConnecters.join(", "),
          });
        if (component.gpuCooling)
          specs.push({ label: "Cooling", value: component.gpuCooling });
        if (component.psuRequirements)
          specs.push({
            label: "PSU Requirements",
            value: component.psuRequirements,
          });
        if (component.connectorsRequired)
          specs.push({
            label: "Connectors Required",
            value: component.connectorsRequired,
          });
        // Prefer explicit GPU powerConsumption, then power, then powerDraw
        if (
          component.powerConsumption !== undefined ||
          component.power !== undefined ||
          component.powerDraw !== undefined
        ) {
          const gpuPower =
            (typeof component.powerConsumption === "number"
              ? component.powerConsumption
              : undefined) ??
            (typeof component.power === "number"
              ? component.power
              : undefined) ??
            (typeof component.powerDraw === "number"
              ? component.powerDraw
              : undefined);
          if (gpuPower !== undefined) {
            specs.push({ label: "Power Consumption", value: `${gpuPower}W` });
          }
        }
        if (component.length)
          specs.push({ label: "Length", value: `${component.length}mm` });
        if (component.height)
          specs.push({ label: "Height", value: `${component.height}mm` });
        if (component.slots)
          specs.push({ label: "Slots", value: component.slots });
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
        if (component.voltage)
          specs.push({ label: "Voltage", value: `${component.voltage}V` });
        if (component.compliance)
          specs.push({ label: "Compliance", value: component.compliance });
        if (component.pins)
          specs.push({ label: "Pins", value: `${component.pins}-pin` });
        if (component.casLatency)
          specs.push({ label: "CAS Latency", value: component.casLatency });
        if (component.timings)
          specs.push({ label: "Timings", value: component.timings });
        if (component.intelXmpCertified)
          specs.push({
            label: "Intel XMP Certified",
            value: component.intelXmpCertified,
          });
        if (component.dataIntegrityCheck)
          specs.push({
            label: "Data Integrity Check",
            value: component.dataIntegrityCheck,
          });
        if (component.heatsink !== undefined)
          specs.push({
            label: "Heatsink",
            value: component.heatsink ? "Yes" : "No",
          });
        if (component.rgb !== undefined)
          specs.push({
            label: "RGB Lighting",
            value: component.rgb ? "Yes" : "No",
          });
        break;

      case "storage":
        if (component.capacity)
          specs.push({ label: "Capacity", value: `${component.capacity}GB` });
        if (component.type)
          specs.push({ label: "Type", value: component.type });
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
        if (component.storageMtbf)
          specs.push({
            label: "MTBF",
            value: `${component.storageMtbf} hours`,
          });
        if (component.totalBytesWritten)
          specs.push({ label: "TBW", value: component.totalBytesWritten });
        if (component.operatingTemperatures)
          specs.push({
            label: "Operating Temperatures",
            value: component.operatingTemperatures,
          });
        if (component.storageTemperatures)
          specs.push({
            label: "Storage Temperatures",
            value: component.storageTemperatures,
          });
        if (component.shockResistance)
          specs.push({
            label: "Shock Resistance",
            value: `${component.shockResistance}G`,
          });
        break;

      case "psu":
        if (component.wattage)
          specs.push({ label: "Wattage", value: `${component.wattage}W` });
        if (component.efficiency)
          specs.push({ label: "Efficiency", value: component.efficiency });
        if (component.modular)
          specs.push({ label: "Modular", value: component.modular });
        if (component.connectors)
          specs.push({
            label: "Connectors",
            value: component.connectors.join(", "),
          });
        if (component.psuCompatibility)
          specs.push({
            label: "Compatibility",
            value: component.psuCompatibility,
          });
        if (component.pfc) specs.push({ label: "PFC", value: component.pfc });
        if (component.acInput)
          specs.push({ label: "AC Input", value: component.acInput });
        if (component.fanType)
          specs.push({ label: "Fan Type", value: component.fanType });
        if (component.fanBearing)
          specs.push({ label: "Fan Bearing", value: component.fanBearing });
        if (component.maxCertification)
          specs.push({
            label: "Max Certification",
            value: component.maxCertification,
          });
        if (component.mtbf)
          specs.push({ label: "MTBF", value: `${component.mtbf} hours` });
        if (component.protection)
          specs.push({
            label: "Protection",
            value: component.protection.join(", "),
          });
        if (component.length)
          specs.push({ label: "Length", value: `${component.length}mm` });
        break;

      case "cooling":
        if (component.coolerType)
          specs.push({ label: "Type", value: component.coolerType });
        if (component.socketCompatibility)
          specs.push({
            label: "Socket Compatibility",
            value: component.socketCompatibility.join(", "),
          });
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

      case "caseFans":
        if (component.rpm)
          specs.push({ label: "Fan RPM", value: component.rpm });
        if (component.airflow)
          specs.push({ label: "Airflow", value: component.airflow });
        if (component.noiseLevel)
          specs.push({
            label: "Noise Level",
            value: `${component.noiseLevel} dBA`,
          });
        if (component.fanCount)
          specs.push({ label: "Fan Count", value: component.fanCount });
        if (component.connector)
          specs.push({ label: "Connector", value: component.connector });
        if (component.ledType)
          specs.push({ label: "LED Type", value: component.ledType });
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
        style={{ maxWidth: "min(1200px, 95vw)" }}
      >
        <VisuallyHidden>
          <DialogTitle>{component.name} - Component Details</DialogTitle>
        </VisuallyHidden>
        {/* JSON-LD for the component shown in this modal */}
        <ProductSchema product={component} />
        <div className="overflow-y-auto max-h-[90vh] p-4 sm:p-6 lg:p-8">
          {/* MASSIVE IMAGE SECTION - Takes up most of the modal */}
          <div className="mb-6 sm:mb-8">
            <div className="relative w-full bg-slate-900/50 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-sky-500/20">
              <img
                src={detailImages[currentImageIndex]}
                alt={component.name}
                className="w-full h-auto object-contain"
                style={{ minHeight: "300px", maxHeight: "min(400px, 50vh)" }}
              />

              {/* Featured tag in Modal */}
              {component.featured && (
                <div className="absolute top-3 right-3 z-30">
                  <FeaturedTag />
                </div>
              )}

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

              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20">
                  {currentImageIndex + 1}/{detailImages.length}
                </Badge>
              </div>
            </div>

            {/* Image Gallery Thumbnails */}
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Brand Logo above title */}
                {component.brandLogo && (
                  <div className="mb-4">
                    <img
                      src={component.brandLogo}
                      alt={component.brand || "Brand"}
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 break-words">
                  {component.name}
                </h2>
                <div className="text-gray-400">
                  {renderRichText(component.description)}
                </div>

                {/* Option dropdowns */}
                {uniqueOptions.length > 0 && (
                  <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-xl p-4 mt-6 border border-sky-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-4 h-4 text-sky-400" />
                      <h4 className="text-sm font-semibold text-sky-300 uppercase tracking-wider">
                        Configuration Options
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uniqueOptions.map((opt) => (
                        <div key={opt.key} className="group">
                          <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-sky-500/60"></div>
                            {opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}
                          </label>
                          <div className="relative">
                            <select
                              className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm font-medium appearance-none cursor-pointer transition-all duration-300 hover:border-sky-400/50 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:outline-none backdrop-blur-sm shadow-lg"
                              value={selectedOptions[opt.key] || opt.values[0]}
                              onChange={(e) => {
                                const prevPrice = displayPrice;
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [opt.key]: e.target.value,
                                }));
                                const updated = {
                                  ...selectedOptions,
                                  [opt.key]: e.target.value,
                                };
                                // Persist selections for total price computation
                                try {
                                  sessionStorage.setItem(
                                    `optionSelections_${component.id}`,
                                    JSON.stringify(updated)
                                  );
                                } catch {
                                  // ignore storage errors
                                }
                                // Analytics: price change
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
                                    } else {
                                      void fetch("/api/analytics/track", {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: data,
                                        keepalive: true,
                                      });
                                    }
                                  }
                                } catch {
                                  // ignore analytics errors
                                }
                              }}
                            >
                              {opt.values.map((val) => (
                                <option
                                  key={val}
                                  value={val}
                                  className="bg-slate-900 text-white py-1"
                                >
                                  {val}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg
                                className="w-4 h-4 text-sky-400"
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
                <div className="flex items-center gap-3 mt-3">
                  {component.rating && (
                    <>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 text-amber-400 ${
                              i < Math.floor(component.rating ?? 0)
                                ? "fill-amber-400"
                                : ""
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        ({component.rating}/5)
                      </span>
                    </>
                  )}
                  {component.ean && typeof component.ean === "string" ? (
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(displayEan || component.ean)}
                    </span>
                  ) : displayEan ? (
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(displayEan)}
                    </span>
                  ) : null}
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
                        ? "Low Stock"
                        : "✓ In Stock"
                      : "Out of Stock"}
                  </Badge>
                </div>
              </div>

              {/* LARGE PRICE DISPLAY */}
              <div className="text-right bg-gradient-to-br from-sky-500/20 to-blue-500/20 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-xl border-2 border-sky-400/40 w-full sm:w-auto">
                <div className="text-xs text-sky-400 uppercase tracking-wider mb-2">
                  Price
                </div>
                <div className="flex items-start justify-end gap-1">
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white break-all">
                    £{Math.floor((displayPrice ?? component.price) || 0)}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-sky-300 mt-1">
                    .
                    {
                      ((displayPrice ?? component.price) || 0)
                        .toFixed(2)
                        .split(".")[1]
                    }
                  </span>
                </div>
                {!component.brandLogo && component.brand && (
                  <Badge className="mt-3 bg-sky-500/30 text-sky-300 border-sky-400/50">
                    {component.brand}
                  </Badge>
                )}
                <Button
                  onClick={() => {
                    onSelect(category, component.id);
                    onClose();
                  }}
                  className={`w-full mt-4 h-11 ${
                    isSelected
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                      : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isSelected ? "Remove from Build" : "Add to Build"}
                </Button>
              </div>
            </div>

            {/* Main Description Section */}
            {component.mainProductDescription && (
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
                <div className="text-base text-gray-300 leading-relaxed">
                  {renderRichText(component.mainProductDescription)}
                </div>
              </div>
            )}

            {/* Technical Specs in Clean Grid */}
            <div className="bg-slate-900/60 rounded-xl p-6 border border-sky-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-sky-400" />
                  Technical Specifications
                </h3>
                {component.techSheet && (
                  <a
                    href={component.techSheet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-sky-500/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Track tech sheet download
                      logger.info("[PCBuilder] Tech sheet download clicked", {
                        component: component.name,
                        category,
                      });
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
                              componentType: category,
                              componentName: component.name,
                              componentId: component.id,
                              url: component.techSheet,
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
                        console.warn(
                          "[PCBuilder] Fallback analytics tracking failed",
                          err
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
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex-1 h-11 sm:h-12 bg-white/5 border-white/20 hover:bg-white/10 text-sm sm:text-base"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onSelect(category, component.id);
                  onClose();
                }}
                className={`flex-1 h-11 sm:h-12 text-sm sm:text-base ${
                  isSelected
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
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

// Optional Extra Detail Modal - Similar to ComponentDetailModal but for peripherals
const OptionalExtraDetailModal = ({
  extra,
  category,
  isOpen,
  onClose,
  onToggle,
  isSelected,
}: {
  extra: PCOptionalExtra;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onToggle: (category: string, extraId: string) => void;
  isSelected: boolean;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const detailImages: string[] =
    extra?.images && extra.images.length > 0
      ? extra.images
      : Array(4).fill(PLACEHOLDER_IMAGE);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [extra?.id]);

  if (!extra) return null;

  const getSpecifications = () => {
    const specs = [];

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
        {/* JSON-LD for the optional extra shown in this modal */}
        <ProductSchema product={extra} />
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
                {/* Brand Logo above title */}
                {extra.brandLogo && (
                  <div className="mb-4">
                    <img
                      src={extra.brandLogo}
                      alt={extra.brand || "Brand"}
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
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
                        // Track tech sheet download
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
                          console.warn(
                            "[PCBuilder] Fallback analytics tracking failed",
                            err
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
                          d="M5 13l4 4L19 7"
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

// Enhanced Component Card with images
const ComponentCard = ({
  component,
  category,
  isSelected,
  onSelect,
  viewMode = "grid",
}: {
  component: PCBuilderComponent;
  category: string;
  isSelected: boolean;
  onSelect: (category: string, componentId: string) => void;
  viewMode?: string;
}) => {
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
                  {component.brandLogo ? (
                    <img
                      src={component.brandLogo}
                      alt={component.brand || "Brand"}
                      className="h-6 mb-2 object-contain"
                      loading="lazy"
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
                                    console.warn(
                                      "Analytics tracking failed:",
                                      error
                                    );
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
        {/* Featured Tag */}
        {component.featured && (
          <div className="absolute top-2 right-2 z-20">
            <FeaturedTag />
          </div>
        )}
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

            <div className="text-gray-400 text-sm line-clamp-3">
              {renderRichText(component.description)}
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
            <div className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent mb-3">
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

// Compatibility Alert Dialog Component
const CompatibilityAlert = ({
  compatibilityIssues,
  onAccept,
  onCancel,
}: {
  compatibilityIssues: CompatibilityIssue[];
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
          {/* Track compatibility warnings when dialog shows */}
          {(() => {
            try {
              if (compatibilityIssues.length > 0) {
                const userId = sessionStorage.getItem("vortex_user_id");
                const titles = Array.from(
                  new Set(compatibilityIssues.map((i) => i.title))
                );
                const severities = compatibilityIssues.reduce(
                  (acc: Record<string, number>, i) => {
                    acc[i.severity] = (acc[i.severity] || 0) + 1;
                    return acc;
                  },
                  {}
                );
                trackClick(
                  "compatibility_warning",
                  { titles, severities },
                  userId || undefined
                );
              }
            } catch {
              // best-effort analytics
            }
            return null;
          })()}

          {compatibilityIssues.map(
            (issue: CompatibilityIssue, index: number) => {
              const Icon =
                severityIcons[issue.severity as keyof typeof severityIcons];
              return (
                <Alert
                  key={index}
                  className={`border rounded-lg p-4 ${
                    severityColors[
                      issue.severity as keyof typeof severityColors
                    ]
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
                          <strong>Recommendation:</strong>{" "}
                          {issue.recommendation}
                        </p>
                      </div>
                    )}
                    {issue.affectedComponents && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {issue.affectedComponents.map(
                          (component: string, idx: number) => (
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
            }
          )}
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
            className="bg-yellow-600 hover:bg-yellow-500 text-white"
          >
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Peripheral Card Component for optional extras
const PeripheralCard = ({
  peripheral,
  category,
  isSelected,
  onToggle,
  viewMode = "grid",
}: {
  peripheral: PCOptionalExtra;
  category: string;
  isSelected: boolean;
  onToggle: (category: string, peripheralId: string) => void;
  viewMode?: string;
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
          {/* Featured Tag */}
          {peripheral.featured && (
            <div className="absolute top-2 right-2 z-20">
              <FeaturedTag />
            </div>
          )}
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
                  <p className="text-gray-400 text-sm sm:text-base">
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
        {/* Featured Tag */}
        {peripheral.featured && (
          <div className="absolute top-2 right-2 z-20">
            <FeaturedTag />
          </div>
        )}
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

            <p className="text-gray-400 text-sm line-clamp-3">
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

// Memoized heavy list items to reduce re-renders
const MemoComponentCard = memo(
  ComponentCard,
  (prev, next) =>
    prev.component.id === next.component.id &&
    prev.component.price === next.component.price &&
    prev.isSelected === next.isSelected &&
    prev.viewMode === next.viewMode &&
    prev.category === next.category
);

const MemoPeripheralCard = memo(
  PeripheralCard,
  (prev, next) =>
    prev.peripheral.id === next.peripheral.id &&
    prev.peripheral.price === next.peripheral.price &&
    prev.isSelected === next.isSelected &&
    prev.viewMode === next.viewMode &&
    prev.category === next.category
);

// Enhanced compatibility checking system (hardened with null/undefined guards)
const checkCompatibility = (
  selectedComponents: SelectedComponentIds,
  getById: (
    category: keyof ComponentDataMap,
    id?: string | null
  ) => AnyComponent | null
): CompatibilityIssue[] => {
  const issues: CompatibilityIssue[] = [];
  const cpu = getById(
    "cpu",
    selectedComponents.cpu
  ) as PCBuilderComponent | null;
  const motherboard = getById(
    "motherboard",
    selectedComponents.motherboard
  ) as PCBuilderComponent | null;
  const gpu = getById(
    "gpu",
    selectedComponents.gpu
  ) as PCBuilderComponent | null;
  const ram = getById(
    "ram",
    selectedComponents.ram
  ) as PCBuilderComponent | null;
  const pcCase = getById(
    "case",
    selectedComponents.case
  ) as PCBuilderComponent | null;
  const psu = getById(
    "psu",
    selectedComponents.psu
  ) as PCBuilderComponent | null;
  const cooling = getById(
    "cooling",
    selectedComponents.cooling
  ) as PCBuilderComponent | null;

  if (
    cpu &&
    motherboard &&
    cpu.socket &&
    motherboard.socket &&
    cpu.socket !== motherboard.socket
  ) {
    issues.push({
      severity: "critical",
      title: "CPU & Motherboard Socket Mismatch",
      description: `The ${cpu.name ?? "CPU"} uses ${
        cpu.socket
      } socket, but the ${motherboard.name ?? "Motherboard"} has ${
        motherboard.socket
      } socket. These components are not compatible.`,
      recommendation:
        "Please select a CPU and motherboard with matching sockets.",
      affectedComponents: [
        cpu.name ?? "CPU",
        motherboard.name ?? "Motherboard",
      ],
    });
  }

  if (
    cpu &&
    motherboard &&
    cpu.generation &&
    Array.isArray(motherboard.compatibility) &&
    !motherboard.compatibility.includes(cpu.generation)
  ) {
    issues.push({
      severity: "warning",
      title: "CPU Generation Compatibility",
      description: `The ${
        motherboard.name ?? "Motherboard"
      } may not fully support the ${cpu.name ?? "CPU"} without a BIOS update.`,
      recommendation:
        "Ensure the motherboard BIOS is updated to support this CPU generation.",
      affectedComponents: [
        cpu.name ?? "CPU",
        motherboard.name ?? "Motherboard",
      ],
    });
  }

  // RAM & Motherboard Compatibility
  if (ram && motherboard) {
    const ramType = ram.type;
    const boardSupport = motherboard.ramSupport;
    // Support both string and string[] comparisons safely
    const ramSupported = (() => {
      if (!ramType) return true;
      const ramValues = Array.isArray(ramType) ? ramType : [ramType];
      if (Array.isArray(boardSupport)) {
        const supportValues = boardSupport.filter(
          (s): s is string => typeof s === "string"
        );
        return ramValues.some((rv) =>
          supportValues.some((sv) => sv.includes(rv))
        );
      }
      if (typeof boardSupport === "string") {
        return ramValues.some((rv) => boardSupport.includes(rv));
      }
      return true; // unknown shape => assume OK
    })();
    if (!ramSupported) {
      issues.push({
        severity: "critical",
        title: "RAM Type Incompatibility",
        description: `The ${motherboard.name} supports ${
          boardSupport || "(unknown)"
        }, but you've selected ${ramType || "(unspecified)"} memory.`,
        recommendation:
          "Select memory that matches the motherboard's supported type.",
        affectedComponents: [
          ram.name ?? "RAM",
          motherboard.name ?? "Motherboard",
        ],
      });
    }
  }

  // Motherboard & Case Form Factor
  if (
    motherboard &&
    pcCase &&
    motherboard.formFactor &&
    Array.isArray(pcCase.compatibility) &&
    !pcCase.compatibility.includes(motherboard.formFactor.toLowerCase())
  ) {
    issues.push({
      severity: "critical",
      title: "Motherboard & Case Size Mismatch",
      description: `The ${motherboard.name ?? "Motherboard"} (${
        motherboard.formFactor
      }) will not fit in the ${pcCase.name ?? "Case"} case.`,
      recommendation:
        "Select a case that supports your motherboard form factor.",
      affectedComponents: [
        motherboard.name ?? "Motherboard",
        pcCase.name ?? "Case",
      ],
    });
  }

  // GPU & Case Clearance
  if (
    gpu &&
    pcCase &&
    typeof gpu.length === "number" &&
    typeof pcCase.maxGpuLength === "number" &&
    gpu.length > pcCase.maxGpuLength
  ) {
    issues.push({
      severity: "critical",
      title: "GPU Too Large for Case",
      description: `The ${gpu.name ?? "GPU"} (${gpu.length}mm) exceeds the ${
        pcCase.name ?? "Case"
      } maximum GPU clearance (${pcCase.maxGpuLength}mm).`,
      recommendation: "Select a larger case or a more compact graphics card.",
      affectedComponents: [gpu.name ?? "GPU", pcCase.name ?? "Case"],
    });
  }

  // PSU Wattage Check
  if (cpu && gpu && psu) {
    const cpuTdp = typeof cpu.tdp === "number" ? cpu.tdp : 65;
    const gpuPower = typeof gpu.power === "number" ? gpu.power : 150;
    const estimatedPower = cpuTdp + gpuPower + 150; // Base system + peripherals
    const recommendedPower = Math.round(estimatedPower * 1.2); // 20% headroom

    if (typeof psu.wattage === "number" && psu.wattage < recommendedPower) {
      issues.push({
        severity: "warning",
        title: "Insufficient PSU Wattage",
        description: `Your system may consume up to ${Math.round(
          estimatedPower
        )}W, but the ${psu.name ?? "PSU"} only provides ${
          psu.wattage
        }W. We recommend ${recommendedPower}W for optimal performance.`,
        recommendation:
          "Consider upgrading to a higher wattage power supply for better efficiency and headroom.",
        affectedComponents: [
          cpu.name ?? "CPU",
          gpu.name ?? "GPU",
          psu.name ?? "PSU",
        ],
      });
    }
  }

  // CPU Cooler & Case Height Clearance
  if (
    cooling &&
    pcCase &&
    cooling.type === "Air" &&
    typeof cooling.height === "number" &&
    typeof pcCase.maxCpuCoolerHeight === "number" &&
    cooling.height > pcCase.maxCpuCoolerHeight
  ) {
    issues.push({
      severity: "critical",
      title: "CPU Cooler Too Tall",
      description: `The ${cooling.name ?? "Cooler"} (${
        cooling.height
      }mm) exceeds the ${pcCase.name ?? "Case"} maximum CPU cooler height (${
        pcCase.maxCpuCoolerHeight
      }mm).`,
      recommendation: "Select a lower profile cooler or a larger case.",
      affectedComponents: [cooling.name ?? "Cooler", pcCase.name ?? "Case"],
    });
  }

  // CPU Cooler TDP Support
  if (
    cpu &&
    cooling &&
    typeof cpu.tdp === "number" &&
    typeof cooling.tdpSupport === "number" &&
    cpu.tdp > cooling.tdpSupport
  ) {
    issues.push({
      severity: "warning",
      title: "CPU Cooler May Be Inadequate",
      description: `The ${cpu.name ?? "CPU"} has a ${cpu.tdp}W TDP, but the ${
        cooling.name ?? "Cooler"
      } is rated for ${cooling.tdpSupport}W.`,
      recommendation:
        "Consider a more powerful cooling solution for optimal temperatures.",
      affectedComponents: [cpu.name ?? "CPU", cooling.name ?? "Cooler"],
    });
  }

  // PSU & Case Length
  if (
    psu &&
    pcCase &&
    typeof psu.length === "number" &&
    typeof pcCase.maxPsuLength === "number" &&
    psu.length > pcCase.maxPsuLength
  ) {
    issues.push({
      severity: "critical",
      title: "PSU Too Long for Case",
      description: `The ${psu.name ?? "PSU"} (${psu.length}mm) exceeds the ${
        pcCase.name ?? "Case"
      } maximum PSU length (${pcCase.maxPsuLength}mm).`,
      recommendation: "Select a more compact power supply or a larger case.",
      affectedComponents: [psu.name ?? "PSU", pcCase.name ?? "Case"],
    });
  }

  return issues;
};

export function PCBuilder({
  recommendedBuild,
  onAddToCart,
  onOpenCart,
}: {
  recommendedBuild?: RecommendedBuildSpec | null;
  onAddToCart?: (item: PCBuilderComponent) => void;
  onOpenCart?: () => void;
}) {
  const { user } = useAuth();
  const [selectedComponents, setSelectedComponents] =
    useState<SelectedComponentIds>({});
  const [selectedPeripherals, setSelectedPeripherals] = useState<
    Record<string, string[]>
  >({});
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("case");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("price");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 items per page for 3-column grid
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>(
    {}
  );

  // Reset to page 1 when category changes
  useEffect(() => {
    const savedPage = categoryPages[activeCategory] || 1;
    setCurrentPage(savedPage);
  }, [activeCategory, categoryPages]);
  const [compatibilityIssues, setCompatibilityIssues] = useState<
    CompatibilityIssue[]
  >([]);
  const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false);
  const [showIncompatibilityModal, setShowIncompatibilityModal] =
    useState(false);
  const [showBuildDetailsModal, setShowBuildDetailsModal] = useState(false);
  const [showEnthusiastBuilder, setShowEnthusiastBuilder] = useState(false);

  // ⚡ LAZY LOADING: Insight modules loaded on-demand (~363KB saved from initial bundle)
  const [insightModules, setInsightModules] = useState<Awaited<
    ReturnType<typeof loadInsightModules>
  > | null>(null);
  // Insights deferral removed for stability; using direct selections
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // ⚡ LAZY LOADING: Load insight modules when user has selected enough components
  useEffect(() => {
    const componentCount =
      Object.keys(selectedComponents).filter(Boolean).length;

    // Load modules when user has 3+ components selected and modules not yet loaded
    if (componentCount >= 3 && !insightModules && !isLoadingInsights) {
      setIsLoadingInsights(true);
      loadInsightModules()
        .then((modules) => {
          setInsightModules(modules);
          setIsLoadingInsights(false);
          logger.info("Insight modules lazy loaded successfully", {
            componentCount,
          });
        })
        .catch((error) => {
          logger.error("Failed to lazy load insight modules", { error });
          setIsLoadingInsights(false);
        });
    }
  }, [selectedComponents, insightModules, isLoadingInsights]);

  // Build comparison feature
  const [savedBuildsForComparison, setSavedBuildsForComparison] = useState<
    SavedBuild[]
  >([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Product comparison feature
  const [compareProducts, setCompareProducts] = useState<PCComponent[]>([]);
  const [showProductComparison, setShowProductComparison] = useState(false);

  // Cached option selections to avoid repeated sessionStorage reads
  const optionSelectionsCache = useOptionSelectionsMap();

  // User-driven filters
  // Environment settings for diagnostics (P1/P3)
  const [environment, setEnvironment] = useState({
    ambientTemp: 22,
    usb: {
      captureCard: false,
      externalSSD: false,
      webcam4k: false,
      audioInterface: false,
      keyboard: false,
      mouse: false,
    },
    displays: [
      { resolution: "1920x1080", refreshRate: 60, connection: "HDMI 2.0" },
    ] as { resolution: string; refreshRate: number; connection: string }[],
    showPanel: false,
  });
  const [searchQuery, setSearchQuery] = useState(""); // Category-specific search in filters panel
  const [globalSearchQuery, setGlobalSearchQuery] = useState(""); // Global search across all categories
  const [limitToRelevantCategory, setLimitToRelevantCategory] = useState(true); // Default: focus most relevant category
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(false);
  const [showPriceSubTierTag, setShowPriceSubTierTag] = useState(true);
  const [insightMode, setInsightMode] = useState<"standard" | "pro">(
    "standard"
  );
  const [insightCompactMode, setInsightCompactMode] = useState(false);
  const [optionFilters, setOptionFilters] = useState<Record<string, string[]>>(
    {}
  );

  // Persist environment + sub-tier toggle to localStorage
  useEffect(() => {
    try {
      const savedEnv = localStorage.getItem("VORTEX_ENV_SETTINGS");
      if (savedEnv) {
        const parsed = JSON.parse(savedEnv);
        if (parsed && typeof parsed === "object") {
          setEnvironment((e) => ({ ...e, ...parsed }));
        }
      }
      const savedSub = localStorage.getItem("VORTEX_PRICE_SUBTIER_LABEL");
      if (savedSub !== null) {
        setShowPriceSubTierTag(savedSub === "1");
      }
    } catch (err) {
      logger.warn("Failed to parse saved environment settings", { err });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("VORTEX_ENV_SETTINGS", JSON.stringify(environment));
    } catch (err) {
      logger.warn("Failed to persist environment settings", { err });
    }
  }, [environment]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "VORTEX_PRICE_SUBTIER_LABEL",
        showPriceSubTierTag ? "1" : "0"
      );
    } catch (err) {
      logger.warn("Failed to persist price sub-tier preference", { err });
    }
  }, [showPriceSubTierTag]);
  const [rangeFilters, setRangeFilters] = useState<
    Record<string, [number, number]>
  >({});

  // Refinement tracking refs
  const prevGlobalQueryRef = useRef<string>("");
  const prevCategoryQueryRef = useRef<string>("");
  const prevFiltersRef = useRef<Record<string, unknown>>({});
  const prevResultsCountGlobalRef = useRef<number>(0);
  const prevResultsCountCategoryRef = useRef<number>(0);

  const currentFiltersForTracking = useMemo<Record<string, unknown>>(() => {
    return {
      activeCategory,
      selectedBrands,
      priceRange,
      optionFilters,
      rangeFilters,
      limitToRelevantCategory,
    } as Record<string, unknown>;
  }, [
    activeCategory,
    selectedBrands,
    priceRange,
    optionFilters,
    rangeFilters,
    limitToRelevantCategory,
  ]);

  // (moved) refinement tracking effects appear after filtered lists are defined

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
    software: PCOptionalExtra[];
    headset: PCOptionalExtra[];
    cable: PCOptionalExtra[];
  }>({
    keyboard: [],
    mouse: [],
    monitor: [],
    gamepad: [],
    mousepad: [],
    software: [],
    headset: [],
    cable: [],
  });
  const [isLoadingCms, setIsLoadingCms] = useState(true);
  const [useCmsData, setUseCmsData] = useState(false);

  // Ref to scroll into the build section when clicking CTA
  const buildSectionRef = useRef<HTMLDivElement | null>(null);

  // Infer most relevant category from the global query
  const inferCategoryFromQuery = useCallback(
    (q: string): CategoryKey | null => {
      const s = q.trim().toLowerCase();
      if (!s) return null;
      // RAM intent indicators
      const ramSignals = [
        "ddr5",
        "ddr4",
        "cl",
        "latency",
        "mhz",
        "xmp",
        "timings",
        "memory",
        "ram",
      ];
      if (ramSignals.some((k) => s.includes(k))) return "ram";

      // CPU intent indicators
      const cpuSignals = [
        "i9",
        "i7",
        "i5",
        "ryzen",
        "cores",
        "threads",
        "tdp",
        "cpu",
        "processor",
      ];
      if (cpuSignals.some((k) => s.includes(k))) return "cpu";

      // GPU intent indicators
      const gpuSignals = ["rtx", "gtx", "rx", "vram", "graphics", "gpu"];
      if (gpuSignals.some((k) => s.includes(k))) return "gpu";

      // Motherboard intent indicators
      const mbSignals = [
        "z790",
        "b650",
        "x670",
        "am5",
        "lga1700",
        "chipset",
        "motherboard",
        "mobo",
      ];
      if (mbSignals.some((k) => s.includes(k))) return "motherboard";

      // Storage
      const storageSignals = ["ssd", "nvme", "m.2", "hdd", "sata", "storage"];
      if (storageSignals.some((k) => s.includes(k))) return "storage";

      // PSU
      const psuSignals = ["psu", "watt", "80+", "efficiency", "power supply"];
      if (psuSignals.some((k) => s.includes(k))) return "psu";

      // Cooling
      const coolingSignals = [
        "aio",
        "radiator",
        "air cooler",
        "fan",
        "cooling",
      ];
      if (coolingSignals.some((k) => s.includes(k))) return "cooling";

      // Case
      const caseSignals = [
        "atx",
        "micro atx",
        "mid tower",
        "full tower",
        "case",
      ];
      if (caseSignals.some((k) => s.includes(k))) return "case";

      return null;
    },
    []
  );

  // Auto-focus to inferred category when typing global queries
  useEffect(() => {
    const inferred = inferCategoryFromQuery(globalSearchQuery);
    if (inferred) {
      setActiveCategory(inferred);
    }
  }, [globalSearchQuery, inferCategoryFromQuery]);

  // CTA action: focus the user into the components area
  const handleStartBuildingCta = () => {
    setActiveCategory("case");
    setViewMode("grid");
    // Smooth scroll to the main build section
    requestAnimationFrame(() => {
      buildSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  const navigate = useNavigate();

  // Hydrate from ?build= token in URL after components/peripherals load
  useEffect(() => {
    const token = new URL(window.location.href).searchParams.get("build");
    if (!token) return;
    const decoded = decodeFullBuild(token);
    const { components: compDecoded, peripherals: periphDecoded } = decoded;
    if (!compDecoded || Object.keys(compDecoded).length === 0) return;

    // Pick the right dataset (CMS or fallback)
    const data = useCmsData ? cmsComponents : componentData;
    const extrasData: Record<string, Array<{ id: string }>> = useCmsData
      ? cmsOptionalExtras
      : {};

    // Filter components to only IDs that exist in current data
    const filtered: SelectedComponentIds = {} as SelectedComponentIds;
    (Object.keys(compDecoded) as (keyof SelectedComponentIds)[]).forEach(
      (k) => {
        const id = compDecoded[k];
        if (!id) return;
        const list =
          (data as ComponentDataMap)[k as keyof ComponentDataMap] || [];
        if (Array.isArray(list) && list.find((c) => c.id === id)) {
          filtered[k] = id;
        }
      }
    );

    // Filter peripherals similarly
    const filteredPeripherals: Record<string, string[]> = {};
    Object.entries(periphDecoded).forEach(([category, ids]) => {
      if (!Array.isArray(ids) || ids.length === 0) return;
      const list = extrasData[category as keyof typeof cmsOptionalExtras] || [];
      if (Array.isArray(list)) {
        const validIds = ids.filter((id) => list.find((c) => c.id === id));
        if (validIds.length > 0) filteredPeripherals[category] = validIds;
      }
    });

    if (Object.keys(filtered).length > 0) {
      setSelectedComponents(filtered);
      if (Object.keys(filteredPeripherals).length > 0) {
        setSelectedPeripherals((prev) => ({ ...prev, ...filteredPeripherals }));
      }
      // Clean up the URL (keep path without query)
      const url = new URL(window.location.href);
      url.searchParams.delete("build");
      window.history.replaceState({}, "", url.pathname + url.hash);
      logger.debug("✅ Imported build from share link", {
        filtered,
        filteredPeripherals,
      });
    }
  }, [isLoadingCms, useCmsData, cmsComponents, cmsOptionalExtras]);

  // Fetch components from CMS on mount
  useEffect(() => {
    const loadCmsData = async () => {
      logger.info("🔄 [PCBuilder] Starting CMS data load...");
      try {
        logger.debug(
          "🔄 Loading PC components and optional extras - please wait..."
        );
        setIsLoadingCms(true);

        // Load PC components
        interface LoadedComponentsMap {
          case: PCComponent[];
          motherboard: PCComponent[];
          cpu: PCComponent[];
          gpu: PCComponent[];
          ram: PCComponent[];
          storage: PCComponent[];
          psu: PCComponent[];
          cooling: PCComponent[];
          caseFans: PCComponent[];
        }
        const categories: (keyof LoadedComponentsMap)[] = [
          "case",
          "motherboard",
          "cpu",
          "gpu",
          "ram",
          "storage",
          "psu",
          "cooling",
          "caseFans",
        ];
        const componentResults: LoadedComponentsMap = {
          case: [],
          motherboard: [],
          cpu: [],
          gpu: [],
          ram: [],
          storage: [],
          psu: [],
          cooling: [],
          caseFans: [],
        };
        for (const category of categories) {
          logger.info(`🔄 [PCBuilder] Fetching ${category} from CMS...`);
          const components = await fetchPCComponents({ category });
          logger.info(
            `✅ [PCBuilder] Loaded ${components.length} ${category} components`
          );
          componentResults[category] = components;
          logger.debug(`✅ Loaded ${components.length} ${category} components`);
        }

        // Load optional extras
        const extraCategories: (keyof LoadedExtrasMap)[] = [
          "keyboard",
          "mouse",
          "monitor",
          "gamepad",
          "mousepad",
          "software",
          "headset",
          "cable",
        ];

        interface LoadedExtrasMap {
          keyboard: PCOptionalExtra[];
          mouse: PCOptionalExtra[];
          monitor: PCOptionalExtra[];
          gamepad: PCOptionalExtra[];
          mousepad: PCOptionalExtra[];
          software: PCOptionalExtra[];
          headset: PCOptionalExtra[];
          cable: PCOptionalExtra[];
        }
        const extraResults: LoadedExtrasMap = {
          keyboard: [],
          mouse: [],
          monitor: [],
          gamepad: [],
          mousepad: [],
          software: [],
          headset: [],
          cable: [],
        };
        for (const category of extraCategories) {
          let extras = await fetchPCOptionalExtras({ category });

          // Log what we got from CMS
          logger.debug(
            `📦 CMS returned ${extras.length} items for category: ${category}`
          );

          if (category === "software") {
            // If CMS has data, use it; otherwise fallback to hardcoded
            if (!Array.isArray(extras) || extras.length === 0) {
              logger.debug(
                "⚠️ No CMS data for software, using fallback peripheralsData"
              );
              extras = peripheralsData.software as unknown as PCOptionalExtra[];
            } else {
              logger.debug(
                `✅ Using ${extras.length} software items from CMS`,
                { items: extras.map((e) => e.name) }
              );
            }
          }
          extraResults[category] = extras;
          logger.debug(
            `✅ Loaded ${extras.length} ${category} optional extras`
          );
        }

        setCmsComponents(componentResults);
        setCmsOptionalExtras(extraResults);

        // Use CMS data if any components or extras were loaded
        const hasComponents = Object.values(componentResults).some(
          (arr) => arr.length > 0
        );
        const hasExtras = Object.values(extraResults).some(
          (arr) => arr.length > 0
        );
        setUseCmsData(hasComponents || hasExtras);

        if (hasComponents || hasExtras) {
          logger.info("✅ Using CMS data for PC Builder");
        } else {
          logger.info("ℹ️ No CMS data found, using fallback hardcoded data");
        }

        // Process pending PC Finder recommendations if available
        const finderParts = sessionStorage.getItem("finder_parts_pending");
        if (finderParts && hasComponents) {
          try {
            const parts = JSON.parse(finderParts);
            logger.debug(
              "🔧 Auto-importing PC Finder recommendations...",
              parts
            );

            const autoSelected: SelectedComponentIds = {};

            // Smart matching based on recommendation tier names
            // CPU matching - Updated for Intel 14th Gen & AMD Ryzen 9000 series
            if (parts.cpu && componentResults.cpu?.length > 0) {
              const cpuMatch = componentResults.cpu.find(
                (c) =>
                  // Flagship tier (24-core or 9950X/14900KS)
                  (parts.cpu.includes("9950X") && c.name?.includes("9950X")) ||
                  (parts.cpu.includes("14900KS") &&
                    c.name?.includes("14900KS")) ||
                  (parts.cpu.includes("24-Core") &&
                    ((c as PCComponent).cores ?? 0) >= 24) ||
                  // High tier (16-core or 9900X/14900K)
                  (parts.cpu.includes("9900X") && c.name?.includes("9900X")) ||
                  (parts.cpu.includes("14900K") &&
                    c.name?.includes("14900K")) ||
                  (parts.cpu.includes("16-Core") &&
                    ((c as PCComponent).cores ?? 0) >= 16 &&
                    ((c as PCComponent).cores ?? 0) < 24) ||
                  // Mid tier (8-12 core or 9700X/14700K)
                  (parts.cpu.includes("9700X") && c.name?.includes("9700X")) ||
                  (parts.cpu.includes("14700K") &&
                    c.name?.includes("14700K")) ||
                  ((parts.cpu.includes("8-12") ||
                    parts.cpu.includes("12 Core")) &&
                    ((c as PCComponent).cores ?? 0) >= 8 &&
                    ((c as PCComponent).cores ?? 0) < 16) ||
                  // Entry tier (6-core or 7600X/14400F)
                  (parts.cpu.includes("7600X") && c.name?.includes("7600X")) ||
                  (parts.cpu.includes("14400F") &&
                    c.name?.includes("14400F")) ||
                  (parts.cpu.includes("6-Core") &&
                    ((c as PCComponent).cores ?? 0) >= 6 &&
                    ((c as PCComponent).cores ?? 0) < 8)
              );
              if (cpuMatch) autoSelected.cpu = cpuMatch.id;
            }

            // GPU matching
            if (parts.gpu && componentResults.gpu?.length > 0) {
              const gpuMatch = componentResults.gpu.find(
                (c) =>
                  (parts.gpu.includes("5090") && c.name?.includes("5090")) ||
                  (parts.gpu.includes("4090") && c.name?.includes("4090")) ||
                  (parts.gpu.includes("5080") && c.name?.includes("5080")) ||
                  (parts.gpu.includes("4080") && c.name?.includes("4080")) ||
                  (parts.gpu.includes("5070") && c.name?.includes("5070")) ||
                  (parts.gpu.includes("4070") && c.name?.includes("4070")) ||
                  (parts.gpu.includes("5060") && c.name?.includes("5060")) ||
                  (parts.gpu.includes("4060") && c.name?.includes("4060"))
              );
              if (gpuMatch) autoSelected.gpu = gpuMatch.id;
            }

            // RAM matching
            if (parts.memory && componentResults.ram?.length > 0) {
              const ramMatch = componentResults.ram.find(
                (c) =>
                  (parts.memory.includes("128GB") &&
                    ((c as PCComponent).capacity ?? 0) >= 128) ||
                  (parts.memory.includes("64GB") &&
                    ((c as PCComponent).capacity ?? 0) >= 64 &&
                    ((c as PCComponent).capacity ?? 0) < 128) ||
                  (parts.memory.includes("32GB") &&
                    ((c as PCComponent).capacity ?? 0) >= 32 &&
                    ((c as PCComponent).capacity ?? 0) < 64) ||
                  (parts.memory.includes("16GB") &&
                    ((c as PCComponent).capacity ?? 0) >= 16 &&
                    ((c as PCComponent).capacity ?? 0) < 32)
              );
              if (ramMatch) autoSelected.ram = ramMatch.id;
            }

            // Storage matching
            if (parts.storage && componentResults.storage?.length > 0) {
              const storageMatch = componentResults.storage.find(
                (c) =>
                  (parts.storage.includes("4TB") &&
                    ((c as PCComponent).capacity ?? 0) >= 4000) ||
                  (parts.storage.includes("2TB") &&
                    ((c as PCComponent).capacity ?? 0) >= 2000 &&
                    ((c as PCComponent).capacity ?? 0) < 4000) ||
                  (parts.storage.includes("1TB") &&
                    ((c as PCComponent).capacity ?? 0) >= 1000 &&
                    ((c as PCComponent).capacity ?? 0) < 2000)
              );
              if (storageMatch) autoSelected.storage = storageMatch.id;
            }

            // PSU matching - Updated for ATX 3.0/3.1 standards
            if (parts.psu && componentResults.psu?.length > 0) {
              const psuMatch = componentResults.psu.find(
                (c) =>
                  (parts.psu.includes("1200W") &&
                    ((c as PCComponent).wattage ?? 0) >= 1200) ||
                  (parts.psu.includes("1000W") &&
                    ((c as PCComponent).wattage ?? 0) >= 1000 &&
                    ((c as PCComponent).wattage ?? 0) < 1200) ||
                  (parts.psu.includes("850W") &&
                    ((c as PCComponent).wattage ?? 0) >= 850 &&
                    ((c as PCComponent).wattage ?? 0) < 1000) ||
                  (parts.psu.includes("750W") &&
                    ((c as PCComponent).wattage ?? 0) >= 750 &&
                    ((c as PCComponent).wattage ?? 0) < 850)
              );
              if (psuMatch) autoSelected.psu = psuMatch.id;
            }

            // Cooling matching - Updated for larger radiators
            if (parts.cooling && componentResults.cooling?.length > 0) {
              const coolingMatch = componentResults.cooling.find((c) => {
                const size = parseInt(
                  String((c as PCComponent).radiatorSize || "").replace(
                    /[^0-9]/g,
                    ""
                  )
                );
                return (
                  (parts.cooling.includes("420mm") &&
                    (size === 420 || c.name?.includes("420"))) ||
                  (parts.cooling.includes("360mm") &&
                    (size === 360 || c.name?.includes("360"))) ||
                  (parts.cooling.includes("280mm") &&
                    (size === 280 || c.name?.includes("280"))) ||
                  (parts.cooling.includes("140mm") &&
                    (c.name?.toLowerCase().includes("air") ||
                      c.name?.toLowerCase().includes("tower")))
                );
              });
              if (coolingMatch) autoSelected.cooling = coolingMatch.id;
            }

            // Case matching by aesthetic preference
            if (parts.case && componentResults.case?.length > 0) {
              const caseMatch =
                componentResults.case.find(
                  (c) =>
                    (parts.case.includes("RGB") &&
                      c.name?.toLowerCase().includes("rgb")) ||
                    (parts.case.includes("Tempered Glass") &&
                      c.name?.toLowerCase().includes("glass")) ||
                    (parts.case.includes("Stealth") &&
                      c.name?.toLowerCase().includes("black"))
                ) || componentResults.case[0]; // Fallback to first case
              if (caseMatch) autoSelected.case = caseMatch.id;
            }

            if (Object.keys(autoSelected).length > 0) {
              logger.debug("Auto-selected components from PC Finder", {
                autoSelected,
              });
              setSelectedComponents(autoSelected);
              sessionStorage.removeItem("finder_parts_pending"); // Clear after successful import
            }
          } catch (e) {
            logger.warn("Failed to auto-import Finder recommendations", {
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }

        // Process Visual PC Configurator build if available
        const visualBuild = sessionStorage.getItem("visual_configurator_build");
        if (visualBuild && hasComponents) {
          try {
            const buildConfig = JSON.parse(visualBuild);
            logger.debug("Auto-importing Visual Configurator build", {
              buildConfig,
            });

            const autoSelected: SelectedComponentIds = {};

            // Direct mapping from Visual Configurator to PC Builder
            // Visual Configurator already has component IDs selected
            if (buildConfig.case?.id) autoSelected.case = buildConfig.case.id;
            if (buildConfig.motherboard?.id)
              autoSelected.motherboard = buildConfig.motherboard.id;
            if (buildConfig.cpu?.id) autoSelected.cpu = buildConfig.cpu.id;
            if (buildConfig.memory?.id)
              autoSelected.ram = buildConfig.memory.id;
            if (buildConfig.gpu?.id) autoSelected.gpu = buildConfig.gpu.id;
            if (buildConfig.storage?.id)
              autoSelected.storage = buildConfig.storage.id;
            if (buildConfig.psu?.id) autoSelected.psu = buildConfig.psu.id;
            if (buildConfig.cooling?.id)
              autoSelected.cooling = buildConfig.cooling.id;

            if (Object.keys(autoSelected).length > 0) {
              logger.debug(
                "Auto-selected components from Visual Configurator",
                { autoSelected }
              );
              setSelectedComponents(autoSelected);
              // Focus the first selected category so it's visible in the main viewport
              const order = [
                "case",
                "motherboard",
                "cpu",
                "ram",
                "gpu",
                "storage",
                "psu",
                "cooling",
              ];
              const first = order.find((k) =>
                Object.prototype.hasOwnProperty.call(autoSelected, k)
              );
              if (first) setActiveCategory(first as CategoryKey);
              sessionStorage.removeItem("visual_configurator_build"); // Clear after successful import
            }
          } catch (error) {
            logger.error("Failed to parse Visual Configurator build:", error);
          }
        }

        // Load saved build from Member Area
        const savedBuildConfig = localStorage.getItem("loadBuildConfig");
        if (savedBuildConfig && hasComponents) {
          try {
            const buildConfig = JSON.parse(savedBuildConfig);
            logger.debug("Loading saved build from Member Area", {
              buildConfig,
            });

            const autoSelected: SelectedComponentIds = {};

            // Map saved configuration components to builder
            if (buildConfig.components) {
              const comps = buildConfig.components;
              if (comps.case) autoSelected.case = comps.case;
              if (comps.motherboard)
                autoSelected.motherboard = comps.motherboard;
              if (comps.cpu) autoSelected.cpu = comps.cpu;
              if (comps.ram) autoSelected.ram = comps.ram;
              if (comps.gpu) autoSelected.gpu = comps.gpu;
              if (comps.storage) autoSelected.storage = comps.storage;
              if (comps.psu) autoSelected.psu = comps.psu;
              if (comps.cooling) autoSelected.cooling = comps.cooling;
              if (comps.caseFans) autoSelected.caseFans = comps.caseFans;

              // Load peripherals if they exist
              if (comps.peripherals) {
                setSelectedPeripherals(comps.peripherals);
              }
            }

            if (Object.keys(autoSelected).length > 0) {
              logger.debug("Auto-selected components from saved build", {
                autoSelected,
              });
              setSelectedComponents(autoSelected);
              // Focus the first selected category
              const order = [
                "case",
                "motherboard",
                "cpu",
                "ram",
                "gpu",
                "storage",
                "psu",
                "cooling",
              ];
              const first = order.find((k) =>
                Object.prototype.hasOwnProperty.call(autoSelected, k)
              );
              if (first) setActiveCategory(first as CategoryKey);
              toast.success(`Build "${buildConfig.name}" loaded successfully!`);
            }
            localStorage.removeItem("loadBuildConfig"); // Clear after successful import
          } catch (e) {
            logger.warn("Failed to auto-import Visual Configurator build", {
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
      } catch (error) {
        console.error("❌ [PCBuilder] Error loading CMS data:", error);
        logger.error("Error loading CMS data", {
          error: error instanceof Error ? error.message : String(error),
        });
        setUseCmsData(false);
      } finally {
        setIsLoadingCms(false);
      }
    };

    loadCmsData();
  }, []);

  // Hydrate from PC Finder recommendations on mount
  useEffect(() => {
    const persisted = loadPersistedRecommendation();
    if (persisted && persisted.recommendation) {
      logger.debug("Loading PC Finder recommendations into Builder", {
        recommendation: persisted.recommendation,
      });
      const { parts } = persisted.recommendation;

      // Store for later processing once CMS components are loaded
      logger.debug("Recommended parts from Finder", { parts });
      sessionStorage.setItem("finder_parts_pending", JSON.stringify(parts));
    }
  }, []);

  // Handle highlighted product from special offers (Homepage)
  useEffect(() => {
    const highlightedProduct = sessionStorage.getItem(
      "vortex_highlight_product"
    );
    if (highlightedProduct && !isLoadingCms) {
      try {
        const product = JSON.parse(highlightedProduct);
        logger.debug("Highlighting special offer product:", product);

        // Map product category to PCBuilder category key
        const categoryMap: Record<string, CategoryKey> = {
          CPU: "cpu",
          GPU: "gpu",
          RAM: "ram",
          Memory: "ram",
          Storage: "storage",
          SSD: "storage",
          HDD: "storage",
          Motherboard: "motherboard",
          PSU: "psu",
          "Power Supply": "psu",
          Case: "case",
          Cooling: "cooling",
          Cooler: "cooling",
          "Case Fans": "caseFans",
        };

        const pcBuilderCategory = categoryMap[product.category];
        if (pcBuilderCategory) {
          // Set the active category to show the product
          setActiveCategory(pcBuilderCategory);

          // Scroll to the build section after a short delay to ensure rendering
          setTimeout(() => {
            buildSectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);

          logger.debug(`Set active category to: ${pcBuilderCategory}`);
        } else {
          logger.warn(`Unknown product category: ${product.category}`);
        }

        // Clear the sessionStorage item after processing
        sessionStorage.removeItem("vortex_highlight_product");
      } catch (error) {
        logger.error("Failed to parse highlighted product:", error);
        sessionStorage.removeItem("vortex_highlight_product");
      }
    }
  }, [isLoadingCms]);

  // Import recommended build on mount or when it changes
  useEffect(() => {
    if (recommendedBuild && recommendedBuild.specs) {
      logger.debug(
        "🔄 Importing recommended build to PC Builder:",
        recommendedBuild
      );

      // Parse the recommended build specs into component selections
      const importedComponents: SelectedComponentIds = {};

      // Helper function to find best matching component by name/specs
      const findComponentBySpec = (category: string, specString: string) => {
        const components = (useCmsData ? cmsComponents : componentData)[
          category as keyof typeof componentData
        ];
        if (!components || !Array.isArray(components)) return null;

        // Try exact name match first (case-insensitive)
        let match = components.find(
          (c) =>
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
            match = components.find((c) => c.name?.includes("9950X"));
          else if (specString.includes("9800X"))
            match = components.find((c) => c.name?.includes("9800X"));
          else if (specString.includes("9700X"))
            match = components.find((c) => c.name?.includes("9700X"));
          else if (specString.includes("9600X"))
            match = components.find((c) => c.name?.includes("9600X"));
          else if (specString.includes("285K"))
            match = components.find((c) => c.name?.includes("285K"));
          else if (specString.includes("14700K"))
            match = components.find((c) => c.name?.includes("14700K"));
          else if (
            specString.includes("Intel") ||
            specString.includes("i7") ||
            specString.includes("i5")
          ) {
            match = components.find(
              (c) => (c as { platform?: string }).platform === "Intel"
            );
          } else if (
            specString.includes("AMD") ||
            specString.includes("Ryzen")
          ) {
            match = components.find(
              (c) => (c as { platform?: string }).platform === "AMD"
            );
          }
        } else if (category === "gpu") {
          // Match by GPU model
          if (specString.includes("4090"))
            match = components.find((c) => c.name?.includes("4090"));
          else if (specString.includes("4080"))
            match = components.find((c) => c.name?.includes("4080"));
          else if (specString.includes("4070 Ti"))
            match = components.find((c) => c.name?.includes("4070 Ti"));
          else if (specString.includes("4070"))
            match = components.find((c) => c.name?.includes("4070"));
          else if (specString.includes("4060 Ti"))
            match = components.find((c) => c.name?.includes("4060 Ti"));
          else if (specString.includes("4060"))
            match = components.find((c) => c.name?.includes("4060"));
          else if (
            specString.includes("RTX") ||
            specString.includes("NVIDIA")
          ) {
            match = components[0]; // Default to first NVIDIA GPU
          }
        } else if (category === "ram") {
          // Match by capacity
          if (specString.includes("64GB"))
            match = components.find(
              (c) => (c as { capacity?: number }).capacity === 64
            );
          else if (specString.includes("32GB"))
            match = components.find(
              (c) => (c as { capacity?: number }).capacity === 32
            );
          else if (specString.includes("16GB"))
            match = components.find(
              (c) => (c as { capacity?: number }).capacity === 16
            );
          else match = components[0]; // Default to first RAM
        } else if (category === "storage") {
          // Match by capacity and type
          if (specString.includes("4TB"))
            match = components.find(
              (c) =>
                (c as { capacity?: number }).capacity &&
                (c as { capacity?: number }).capacity! >= 4000
            );
          else if (specString.includes("2TB"))
            match = components.find(
              (c) =>
                (c as { capacity?: number }).capacity &&
                (c as { capacity?: number }).capacity! >= 2000 &&
                (c as { capacity?: number }).capacity! < 4000
            );
          else if (specString.includes("1TB"))
            match = components.find(
              (c) =>
                (c as { capacity?: number }).capacity &&
                (c as { capacity?: number }).capacity! >= 1000 &&
                (c as { capacity?: number }).capacity! < 2000
            );
          else if (specString.includes("500GB"))
            match = components.find(
              (c) =>
                (c as { capacity?: number }).capacity &&
                (c as { capacity?: number }).capacity! >= 500 &&
                (c as { capacity?: number }).capacity! < 1000
            );
          else match = components[0]; // Default to first storage
        } else if (category === "psu") {
          // Match by wattage
          if (specString.includes("1000W"))
            match = components.find(
              (c) =>
                (c as { wattage?: number }).wattage &&
                (c as { wattage?: number }).wattage! >= 1000
            );
          else if (specString.includes("850W"))
            match = components.find(
              (c) =>
                (c as { wattage?: number }).wattage &&
                (c as { wattage?: number }).wattage! >= 850 &&
                (c as { wattage?: number }).wattage! < 1000
            );
          else if (specString.includes("750W"))
            match = components.find(
              (c) =>
                (c as { wattage?: number }).wattage &&
                (c as { wattage?: number }).wattage! >= 750 &&
                (c as { wattage?: number }).wattage! < 850
            );
          else match = components[0]; // Default to first PSU
        } else if (category === "cooling") {
          // Match by type and size
          if (specString.includes("360mm"))
            match = components.find(
              (c) =>
                (c as { radiatorSize?: number }).radiatorSize === 360 ||
                c.name?.includes("360mm")
            );
          else if (specString.includes("280mm"))
            match = components.find(
              (c) =>
                (c as { radiatorSize?: number }).radiatorSize === 280 ||
                c.name?.includes("280mm")
            );
          else if (specString.includes("240mm"))
            match = components.find(
              (c) =>
                (c as { radiatorSize?: number }).radiatorSize === 240 ||
                c.name?.includes("240mm")
            );
          else if (specString.includes("AIO"))
            match = components.find(
              (c) =>
                (c as { type?: string }).type === "Liquid" ||
                (c as { type?: string }).type === "AIO"
            );
          else match = components[0]; // Default to first cooler
        } else if (category === "motherboard") {
          // Match by socket/platform
          if (specString.includes("Z790") || specString.includes("LGA1700")) {
            match = components.find(
              (c) =>
                (c as { socket?: string; chipset?: string }).socket ===
                  "LGA1700" ||
                (c as { socket?: string; chipset?: string }).chipset?.includes(
                  "Z790"
                )
            );
          } else if (
            specString.includes("B650") ||
            specString.includes("AM5")
          ) {
            match = components.find(
              (c) =>
                (c as { socket?: string; chipset?: string }).socket === "AM5" ||
                (c as { socket?: string; chipset?: string }).chipset?.includes(
                  "B650"
                )
            );
          } else match = components[0]; // Default to first motherboard
        } else if (category === "case") {
          // Match by form factor
          if (specString.includes("ATX"))
            match = components.find(
              (c) => (c as { formFactor?: string }).formFactor === "ATX"
            );
          else if (specString.includes("MicroATX"))
            match = components.find(
              (c) => (c as { formFactor?: string }).formFactor === "MicroATX"
            );
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
          logger.debug(
            `✅ Matched CPU: ${recommendedBuild.specs.cpu} → ${cpu.name}`
          );

          // Auto-select compatible motherboard
          const motherboards = (useCmsData ? cmsComponents : componentData)
            .motherboard;
          const compatibleMB = motherboards?.find(
            (mb) => mb.socket === (cpu as PCBuilderComponent).socket
          );
          if (compatibleMB) {
            importedComponents.motherboard = compatibleMB.id;
            logger.debug(
              `✅ Auto-selected compatible motherboard: ${compatibleMB.name}`
            );
          }
        }
      }

      if (recommendedBuild.specs.gpu) {
        const gpu = findComponentBySpec("gpu", recommendedBuild.specs.gpu);
        if (gpu) {
          importedComponents.gpu = gpu.id;
          logger.debug(
            `✅ Matched GPU: ${recommendedBuild.specs.gpu} → ${gpu.name}`
          );
        }
      }

      if (recommendedBuild.specs.ram) {
        const ram = findComponentBySpec("ram", recommendedBuild.specs.ram);
        if (ram) {
          importedComponents.ram = ram.id;
          logger.debug(
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
          logger.debug(
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
          logger.debug(
            `✅ Matched Cooling: ${recommendedBuild.specs.cooling} → ${cooling.name}`
          );
        }
      }

      if (recommendedBuild.specs.psu) {
        const psu = findComponentBySpec("psu", recommendedBuild.specs.psu);
        if (psu) {
          importedComponents.psu = psu.id;
          logger.debug(
            `✅ Matched PSU: ${recommendedBuild.specs.psu} → ${psu.name}`
          );
        }
      }

      // Auto-select case if not specified
      if (!importedComponents.case) {
        const cases = (useCmsData ? cmsComponents : componentData).case;
        if (cases && cases.length > 0) {
          importedComponents.case = cases[0].id;
          logger.debug(`✅ Auto-selected case: ${cases[0].name}`);
        }
      }

      setSelectedComponents(importedComponents);
      logger.debug("Build import complete. Selected components", {
        importedComponents,
      });
    }
  }, [recommendedBuild, useCmsData, cmsComponents]);

  // Merge CMS data with fallback componentData
  const activeComponentData = (
    useCmsData ? (cmsComponents as unknown as ComponentDataMap) : componentData
  ) as ComponentDataMap;

  // Merge CMS optional extras with fallback peripheralsData per category
  const activeOptionalExtrasData = useMemo(() => {
    const categories = Object.keys(peripheralsData) as Array<
      keyof typeof peripheralsData
    >;

    const merged: Record<string, PCOptionalExtra[]> = {};
    categories.forEach((category) => {
      const cmsList = (cmsOptionalExtras as Record<string, PCOptionalExtra[]>)[
        category
      ];
      const fallbackList = peripheralsData[category] || [];

      merged[category] =
        useCmsData && Array.isArray(cmsList) && cmsList.length > 0
          ? cmsList
          : fallbackList;
    });

    return merged as typeof peripheralsData;
  }, [useCmsData, cmsOptionalExtras]);

  // Index maps for O(1) id lookups per category
  const componentIdMaps = useMemo(() => {
    const maps: Record<string, Map<string, AnyComponent>> = {};
    (Object.keys(activeComponentData) as (keyof ComponentDataMap)[]).forEach(
      (key) => {
        const list = (activeComponentData[key] || []) as PCBuilderComponent[];
        const map = new Map<string, AnyComponent>();
        for (const item of list) {
          if (item && typeof item.id === "string") {
            map.set(item.id, item);
          }
        }
        maps[String(key)] = map;
      }
    );
    return maps;
  }, [activeComponentData]);

  const getById = useCallback(
    (category: keyof ComponentDataMap, id?: string | null) => {
      if (!id) return null;
      const map = componentIdMaps[String(category)];
      return (map?.get(id) as PCBuilderComponent | undefined) || null;
    },
    [componentIdMaps]
  );

  // Load saved builds from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vortex_saved_builds_comparison");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedBuildsForComparison(parsed.slice(0, 3)); // Max 3 builds
        }
      }
    } catch (e) {
      logger.warn("Failed to load saved builds", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  // Save builds to localStorage whenever they change
  useEffect(() => {
    if (savedBuildsForComparison.length > 0) {
      try {
        localStorage.setItem(
          "vortex_saved_builds_comparison",
          JSON.stringify(savedBuildsForComparison)
        );
      } catch (e) {
        logger.warn("Failed to save builds", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }, [savedBuildsForComparison]);

  // Add current build to comparison
  const handleSaveForComparison = async () => {
    if (getSelectedComponentsCount === 0) {
      toast.warning("Add some components before saving for comparison");
      return;
    }

    if (savedBuildsForComparison.length >= 3) {
      toast.warning("Maximum 3 builds can be compared. Remove one first.");
      return;
    }

    const buildName = `Build ${savedBuildsForComparison.length + 1}`;
    const buildTotalPrice = getTotalPrice;
    const newBuild: SavedBuild = {
      id: Date.now().toString(),
      name: buildName,
      timestamp: Date.now(),
      components: { ...selectedComponents },
      peripherals: { ...selectedPeripherals },
      totalPrice: buildTotalPrice,
    };

    setSavedBuildsForComparison((prev) => [...prev, newBuild]);

    // Track build save
    try {
      const userId = sessionStorage.getItem("vortex_user_id");
      trackClick(
        "build_saved",
        {
          buildName,
          totalPrice: buildTotalPrice,
          componentsCount: Object.keys(selectedComponents).length,
          peripheralsCount: Object.keys(selectedPeripherals).length,
          savedToAccount: !!user,
          savedForComparison: true,
        },
        userId || undefined
      );
    } catch (err) {
      logger.error("Failed to track build save", err);
    }

    // Save to Firebase if user is logged in
    if (user) {
      try {
        const configData = {
          userId: user.uid,
          name: buildName,
          components: {
            ...selectedComponents,
            peripherals: selectedPeripherals,
          },
          totalPrice: buildTotalPrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await saveConfiguration(configData);
        toast.success(`"${buildName}" saved to your account`);
      } catch (error) {
        logger.error("Failed to save build to account:", error);
        toast.error("Failed to save to account, but added for comparison");
      }
    } else {
      toast.success(
        `"${buildName}" saved for comparison (login to save permanently)`
      );
    }
  };

  // Remove build from comparison
  const handleRemoveBuildFromComparison = (buildId: string) => {
    setSavedBuildsForComparison((prev) => prev.filter((b) => b.id !== buildId));
    toast.success("Build removed from comparison");
  };

  // Product comparison handlers - removed unused _handleToggleProductComparison
  const handleRemoveFromComparison = (productId: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleClearComparison = () => {
    setCompareProducts([]);
    setShowProductComparison(false);
    toast.success("Comparison cleared");
  };

  const handleAddComparisonToCart = (product: PCComponent) => {
    if (onAddToCart) {
      // Convert PCComponent to PCBuilderComponent format
      onAddToCart(product as unknown as PCBuilderComponent);
      toast.success(`${product.name} added to build!`);
    }
  };

  // Memoize compatibility check to avoid expensive recalculation on every render
  const memoizedCompatibilityIssues = useMemo(() => {
    return checkCompatibility(selectedComponents, getById);
  }, [selectedComponents, getById]);

  // Sync memoized issues to state
  useEffect(() => {
    setCompatibilityIssues(memoizedCompatibilityIssues);
  }, [memoizedCompatibilityIssues]);

  // Derived lists and filter option sources for active category
  const activeList = useMemo(
    () =>
      ((activeComponentData as ComponentDataMap)[
        activeCategory as keyof ComponentDataMap
      ] || []) as PCBuilderComponent[],
    [activeComponentData, activeCategory]
  );

  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    activeList.forEach((c) => {
      if (c.brand && typeof c.brand === "string") set.add(c.brand);
    });
    return Array.from(set).sort();
  }, [activeList]);

  const priceMin = useMemo(() => {
    const prices = activeList
      .map((c) => (typeof c.price === "number" ? c.price : undefined))
      .filter((n): n is number => typeof n === "number");
    return prices.length ? Math.max(0, Math.floor(Math.min(...prices))) : 0;
  }, [activeList]);

  const priceMax = useMemo(() => {
    const prices = activeList
      .map((c) => (typeof c.price === "number" ? c.price : undefined))
      .filter((n): n is number => typeof n === "number");
    return prices.length ? Math.ceil(Math.max(...prices)) : 0;
  }, [activeList]);

  // Safe key accessor to avoid any (hoisted declaration)
  function getVal(obj: unknown, key: string): unknown {
    if (
      obj &&
      typeof obj === "object" &&
      key in (obj as Record<string, unknown>)
    ) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }

  // Compute option values per current category
  const optionFilterValues = useMemo(() => {
    const defs = CATEGORY_OPTION_FILTERS[activeCategory] || [];
    const result: Record<string, string[]> = {};
    defs.forEach((def) => {
      const set = new Set<string>();
      activeList.forEach((c) => {
        const raw = getVal(c, def.key);
        if (raw === undefined || raw === null) return;
        if (Array.isArray(raw)) {
          raw.forEach((v) => typeof v === "string" && set.add(v));
        } else if (typeof raw === "boolean") {
          set.add(raw ? "Yes" : "No");
        } else if (typeof raw === "string") {
          if (raw.trim()) set.add(raw);
        }
      });
      result[def.key] = Array.from(set).sort();
    });
    return result;
  }, [activeCategory, activeList]);

  // Compute numeric ranges for range filters per category
  const rangeFilterBounds = useMemo(() => {
    const defs = CATEGORY_RANGE_FILTERS[activeCategory] || [];
    const result: Record<string, { min: number; max: number }> = {};
    defs.forEach((def) => {
      const nums = activeList
        .map((c) => Number(getVal(c, def.key)))
        .filter((n) => !Number.isNaN(n));
      if (nums.length) {
        result[def.key] = {
          min: Math.floor(Math.min(...nums)),
          max: Math.ceil(Math.max(...nums)),
        };
      }
    });
    return result;
  }, [activeCategory, activeList]);

  // Reset filters when category changes
  useEffect(() => {
    setSelectedBrands([]);
    setSearchQuery("");
    setOptionFilters({});
    setRangeFilters({});
  }, [activeCategory]);

  // Reset price range to current bounds
  useEffect(() => {
    setPriceRange([priceMin, priceMax]);
  }, [priceMin, priceMax, activeCategory]);

  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    count += selectedBrands.length;
    if (priceMax > 0 && (priceRange[0] > priceMin || priceRange[1] < priceMax))
      count += 1;
    Object.values(optionFilters).forEach((arr) => (count += arr?.length || 0));
    Object.entries(rangeFilters).forEach(([key, range]) => {
      const bounds = rangeFilterBounds[key];
      if (!bounds) return;
      if (range[0] > bounds.min || range[1] < bounds.max) count += 1;
    });
    return count;
  }, [
    searchQuery,
    selectedBrands,
    priceRange,
    priceMin,
    priceMax,
    optionFilters,
    rangeFilters,
    rangeFilterBounds,
  ]);

  const applyUserFilters = useCallback(
    (list: AnyComponent[]) => {
      const lowerQuery = searchQuery.trim().toLowerCase();
      const globalQuery = globalSearchQuery.trim().toLowerCase();
      const brandSet = new Set(selectedBrands);
      return (list as PCBuilderComponent[]).filter((c) => {
        // Build a rich searchable haystack from common fields and specs
        // Collect all string-like values from the component object to ensure
        // schema differences across categories (e.g., RAM) are included.
        const collectStrings = (obj: unknown): string => {
          if (!obj || typeof obj !== "object") return "";
          const parts: string[] = [];
          const visit = (val: unknown) => {
            if (val == null) return;
            if (typeof val === "string" || typeof val === "number") {
              parts.push(String(val));
            } else if (Array.isArray(val)) {
              for (const item of val) visit(item);
            } else if (typeof val === "object") {
              const rec = val as Record<string, unknown>;
              for (const k of Object.keys(rec)) visit(rec[k]);
            }
          };
          visit(obj);
          return parts.join(" ");
        };

        const extraText = collectStrings(c);
        const specsHay = `${c.name ?? ""} ${c.model ?? ""} ${
          c.description ?? c.mainProductDescription ?? ""
        } ${extraText}`
          .trim()
          .toLowerCase();

        // Global Search (across all categories)
        if (globalQuery) {
          if (!specsHay.includes(globalQuery)) return false;
        }

        // Category-specific Search (from filters panel)
        if (lowerQuery) {
          if (!specsHay.includes(lowerQuery)) return false;
        }

        // When global search is active, do not restrict by brand/price
        if (!globalQuery) {
          // Brand (applies when not global)
          if (brandSet.size > 0) {
            if (!c.brand || !brandSet.has(c.brand)) return false;
          }

          // Price (applies when not global)
          if (priceMax > 0 && typeof c.price === "number") {
            if (c.price < priceRange[0] || c.price > priceRange[1])
              return false;
          }
        }

        // Category-specific filters only when NOT doing global search
        if (!globalQuery) {
          // Option filters
          for (const [key, values] of Object.entries(optionFilters)) {
            if (!values || values.length === 0) continue;
            const raw = getVal(c, key);
            if (raw === undefined || raw === null) return false;
            if (Array.isArray(raw)) {
              const match = raw.some(
                (v) => typeof v === "string" && values.includes(v)
              );
              if (!match) return false;
            } else if (typeof raw === "boolean") {
              const label = raw ? "Yes" : "No";
              if (!values.includes(label)) return false;
            } else if (typeof raw === "string" || typeof raw === "number") {
              if (!values.includes(String(raw))) return false;
            } else {
              return false;
            }
          }

          // Range filters
          for (const [key, range] of Object.entries(rangeFilters)) {
            const val = Number(getVal(c, key));
            if (Number.isNaN(val)) return false;
            if (val < range[0] || val > range[1]) return false;
          }
        }

        return true;
      });
    },
    [
      searchQuery,
      globalSearchQuery,
      selectedBrands,
      priceMax,
      priceRange,
      optionFilters,
      rangeFilters,
    ]
  );

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
    {
      id: "caseFans",
      label: "Case Fans",
      icon: Fan,
      count: activeComponentData.caseFans?.length || 0,
    },
  ];

  const handleComponentSelect = (category: string, componentId: string) => {
    setSelectedComponents((prev) => ({
      ...prev,
      [category]: componentId,
    }));
    try {
      const userId = sessionStorage.getItem("vortex_user_id");
      if (componentId) {
        trackClick(
          "component_select",
          { category, componentId },
          userId || undefined
        );
      } else {
        trackClick("component_remove", { category }, userId || undefined);
      }
    } catch {
      // best-effort analytics
    }
  };

  const handleClearBuild = () => {
    setSelectedComponents({});
    setSelectedPeripherals({});
    setCompatibilityIssues([]);
    try {
      // Also clear any persisted recommendations/imports that would auto-restore the build
      sessionStorage.removeItem("finder_parts_pending");
      sessionStorage.removeItem("visual_configurator_build");
      localStorage.removeItem("pcfinder_recommendation");
      logger.debug("🧹 Cleared build and related persisted recommendations");
    } catch (e) {
      logger.warn("Failed to clear persisted recommendation state", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  // Memoize total price calculation to avoid recalculation on every render
  const getTotalPrice = useMemo(() => {
    // Helper to compute dynamic override price with precedence
    const computeDynamicPrice = (
      component: PCBuilderComponent | undefined,
      selections: Record<string, string> | undefined
    ): number => {
      if (!component) return 0;
      if (!component.pricesByOption || !selections) return component.price ?? 0;
      const precedence = [
        "size",
        "storage",
        "colour",
        "color",
        "type",
        "style",
      ];
      for (const key of precedence) {
        const sel: string | undefined = selections[key];
        if (
          sel &&
          component.pricesByOption[key] &&
          component.pricesByOption[key][sel] !== undefined
        ) {
          const priceData = component.pricesByOption[key][sel];
          return typeof priceData === "number" ? priceData : priceData.price;
        }
        // alt spelling fallback
        const alt =
          key === "colour" ? "color" : key === "color" ? "colour" : null;
        if (
          alt &&
          sel &&
          component.pricesByOption[alt] &&
          component.pricesByOption[alt][sel] !== undefined
        ) {
          const priceData = component.pricesByOption[alt][sel];
          return typeof priceData === "number" ? priceData : priceData.price;
        }
      }
      return component.price ?? 0;
    };

    const componentsTotal = Object.entries(selectedComponents).reduce(
      (total, [category, componentId]) => {
        const list =
          (activeComponentData as ComponentDataMap)[
            category as keyof ComponentDataMap
          ] || [];
        const component = list.find((c) => c.id === componentId);
        // Load option selections persisted in sessionStorage (set by cards / modals)
        const selections = componentId
          ? optionSelectionsCache.get(componentId)
          : undefined;
        return (
          total +
          computeDynamicPrice(component as PCBuilderComponent, selections)
        );
      },
      0
    );

    const peripheralsTotal = Object.entries(selectedPeripherals).reduce(
      (total, [category, items]) => {
        if (Array.isArray(items)) {
          const list =
            (activeOptionalExtrasData as Record<string, PCOptionalExtra[]>)[
              category
            ] || [];
          return (
            total +
            items.reduce((itemTotal, itemId) => {
              const peripheral = list.find((p) => p.id === itemId);
              return itemTotal + (peripheral ? peripheral.price ?? 0 : 0);
            }, 0)
          );
        }
        return total;
      },
      0
    );

    return componentsTotal + peripheralsTotal;
  }, [
    selectedComponents,
    selectedPeripherals,
    activeComponentData,
    activeOptionalExtrasData,
    optionSelectionsCache,
  ]);

  // Utility for compatibility checks handling string | string[] combinations
  const hasSupport = (
    container: string | string[] | undefined,
    value: string | string[] | undefined
  ): boolean => {
    if (!container || !value) return false;
    const containerArr = Array.isArray(container) ? container : [container];
    const valueArr = Array.isArray(value) ? value : [value];
    return valueArr.some((v) => containerArr.some((c) => c.includes(v)));
  };

  const handlePeripheralToggle = (category: string, peripheralId: string) => {
    setSelectedPeripherals((prev) => {
      const currentItems = prev[category] || [];
      const isSelected = Array.isArray(currentItems)
        ? currentItems.includes(peripheralId)
        : false;

      if (isSelected) {
        // Remove the peripheral
        try {
          const userId = sessionStorage.getItem("vortex_user_id");
          trackClick(
            "peripheral_toggle",
            { category, peripheralId, action: "remove" },
            userId || undefined
          );
        } catch {
          // best-effort analytics
        }
        return {
          ...prev,
          [category]: Array.isArray(currentItems)
            ? currentItems.filter((id: string) => id !== peripheralId)
            : [],
        };
      } else {
        // Add the peripheral
        try {
          const userId = sessionStorage.getItem("vortex_user_id");
          trackClick(
            "peripheral_toggle",
            { category, peripheralId, action: "add" },
            userId || undefined
          );
        } catch {
          // best-effort analytics
        }
        return {
          ...prev,
          [category]: [...currentItems, peripheralId],
        };
      }
    });
  };

  // Memoize selected components count
  const getSelectedComponentsCount = useMemo(() => {
    return Object.keys(selectedComponents).length;
  }, [selectedComponents]);

  // Memoize generateBuildComments to avoid expensive recalculation
  const generateBuildComments = useMemo(() => {
    // Defer heavy insights if a transition is pending
    // Insights run inline without deferral for stability
    // ⚡ PERFORMANCE: Wait for insight modules to load (lazy loaded for ~363KB bundle savings)
    if (!insightModules) {
      const componentCount =
        Object.keys(selectedComponents).filter(Boolean).length;
      if (componentCount >= 3) {
        return ["⏳ Loading advanced insights..."];
      }
      return ["💡 Select at least 3 components to see Kevin's Insight"];
    }

    // Destructure lazy-loaded functions
    const {
      calculateSynergyGrade,
      detectUseCase,
      getUseCaseIntro,
      getPerformanceEstimate,
      generateCTAs,
      getAdvancedDiagnostics,
      getCompetitiveContext,
      getTCOAnalysis,
      getUpgradeSuggestions,
      getGenerationalComparisons,
      getBuildFutureProofAnalysis,
      getPriceTierInsight,
      formatCTASection,
      getGPUPerformanceInsight,
      getCPUPerformanceInsight,
      getRAMInsight,
      getCoolingInsight,
      getPSUInsights,
    } = insightModules;

    const comments: string[] = [];
    const advanced: string[] = [];
    const cpu = activeComponentData.cpu?.find(
      (c) => c.id === selectedComponents.cpu
    );
    const motherboard = activeComponentData.motherboard?.find(
      (c) => c.id === selectedComponents.motherboard
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
    const pcCase = activeComponentData.case?.find(
      (c) => c.id === selectedComponents.case
    );
    const cooling = activeComponentData.cooling?.find(
      (c) => c.id === selectedComponents.cooling
    );
    const psu = activeComponentData.psu?.find(
      (c) => c.id === selectedComponents.psu
    );
    const caseFanPack = activeComponentData.caseFans?.find(
      (c) => c.id === selectedComponents.caseFans
    );

    // ===== Synergy & Profile =====
    const normalizedStorage = storage
      ? {
          interface: (storage as PCBuilderComponent).interface,
        }
      : null;
    const normalizedRam = ram
      ? {
          capacity: (() => {
            const cap = (ram as PCBuilderComponent).capacity;
            return cap === null ? undefined : cap;
          })() as number | undefined,
        }
      : null;
    const normalizedCooling = cooling
      ? {
          type: (() => {
            const t = (cooling as PCBuilderComponent)?.type;
            return Array.isArray(t) ? t[0] : t;
          })() as string | undefined,
        }
      : null;
    const synergyResult = calculateSynergyGrade(
      cpu || null,
      gpu || null,
      normalizedRam,
      psu || null,
      normalizedCooling,
      normalizedStorage
    );
    comments.push(
      `Synergy Grade: ${synergyResult.grade} (${synergyResult.score}/100) · Profile: ${synergyResult.profile}`
    );
    comments.push(synergyResult.feedback);

    // Extract component metrics for use-case detection and remaining logic
    const cores = cpu?.cores ?? 0;
    const vram = gpu?.vram ?? 0;
    const ramCap = ram?.capacity ?? 0;
    const wattage = psu?.wattage ?? 0;
    const tdpCpu = cpu?.tdp ?? 65;
    const gpuPower = gpu?.power ?? 150;
    const estimatedLoad = wattage ? (tdpCpu + gpuPower + 120) / wattage : 0;
    const grade = synergyResult.grade;

    // Advanced diagnostics
    // Infer simple case airflow rating from model/support strings (optional)
    const caseName = (pcCase?.name ?? "").toLowerCase();
    const caseCoolingSupport = (pcCase?.coolingSupport ?? "").toLowerCase();
    const inferredCaseAirflow:
      | "Excellent"
      | "Good"
      | "Adequate"
      | "Poor"
      | "Unknown" = (() => {
      if (!pcCase) return "Unknown";
      if (caseName.includes("airflow") || caseName.includes("mesh"))
        return "Excellent";
      if (
        caseCoolingSupport.includes("3x120") ||
        caseCoolingSupport.includes("3 x 120")
      )
        return "Good";
      if (caseName.includes("glass") && !caseName.includes("mesh"))
        return "Adequate";
      return "Unknown";
    })();
    const caseFansCount: number | undefined =
      (caseFanPack as { fanCount?: number } | undefined)?.fanCount ?? undefined;

    const usbDevices: string[] = [];
    if (environment.usb.captureCard) usbDevices.push("capture card");
    if (environment.usb.externalSSD) usbDevices.push("external ssd");
    if (environment.usb.webcam4k) usbDevices.push("webcam 4k");
    if (environment.usb.audioInterface) usbDevices.push("audio interface");
    const displays = (environment.displays || []).map((d) => ({
      resolution: d.resolution,
      refreshRate: d.refreshRate,
      connection: d.connection,
    }));

    const diagnostics = getAdvancedDiagnostics({
      vram,
      cores,
      ramCap,
      estimatedLoad,
      wattage,
      tdpCpu,
      gpuPower,
      cooling: cooling
        ? ({
            type: Array.isArray((cooling as PCBuilderComponent)?.type)
              ? (cooling as PCBuilderComponent)?.type?.[0]
              : (cooling as PCBuilderComponent)?.type,
            name: (cooling as PCBuilderComponent)?.name,
          } as { type?: string; name?: string })
        : undefined,
      storage: storage
        ? ({
            name: (storage as PCBuilderComponent)?.name,
            interface: (storage as PCBuilderComponent)?.interface,
            capacity:
              (storage as PCBuilderComponent)?.capacity === null
                ? undefined
                : (storage as PCBuilderComponent)?.capacity,
            readSpeed:
              typeof (storage as PCBuilderComponent)?.readSpeed === "number"
                ? (storage as PCBuilderComponent)?.readSpeed
                : undefined,
            writeSpeed:
              typeof (storage as PCBuilderComponent)?.writeSpeed === "number"
                ? (storage as PCBuilderComponent)?.writeSpeed
                : undefined,
            driveType: (storage as PCBuilderComponent)?.driveType,
            heatsink: (storage as PCBuilderComponent)?.heatsink,
          } as {
            name?: string;
            interface?: string;
            capacity?: number;
            readSpeed?: number;
            writeSpeed?: number;
            driveType?: string;
            heatsink?: boolean;
          })
        : undefined,
      cpuName: cpu?.name,
      gpuName: gpu?.name,
      ramName: ram?.name,
      // Optional platform hints for enhanced diagnostics
      motherboardChipset: motherboard?.chipset,
      motherboardModel: motherboard?.name,
      caseAirflow: inferredCaseAirflow,
      caseFans: caseFansCount,
      caseModel: pcCase?.name,
      ambientTemp: environment.ambientTemp,
      usbDevices,
      displays,
    });
    advanced.push(...diagnostics);

    // Use-case detection and performance estimation
    const useCase = detectUseCase(vram, cores, ramCap);
    const performanceEstimate = getPerformanceEstimate(
      useCase,
      gpu || null,
      cpu || null,
      ramCap,
      cores
    );
    const ctas = generateCTAs(grade, {
      ramCap,
      cores,
      vram,
      estimatedLoad,
      cooling: cooling
        ? ({
            type: Array.isArray((cooling as PCBuilderComponent)?.type)
              ? (cooling as PCBuilderComponent)?.type?.[0]
              : (cooling as PCBuilderComponent)?.type,
          } as { type?: string })
        : null,
      storage: storage
        ? { interface: (storage as PCBuilderComponent)?.interface }
        : null,
    });

    // Use-case intro and competitive context
    const useCaseIntro = getUseCaseIntro(useCase, vram, cores, ramCap);
    comments.push(useCaseIntro);

    // PHASE 2: Add competitive context for selected components
    if (gpu) {
      const gpuComparisons = getCompetitiveContext(
        "gpu",
        toComparisonComponent(gpu)
      );
      comments.push(...gpuComparisons);

      // Add generational comparisons for GPU
      const gpuGenerational = getGenerationalComparisons(
        "gpu",
        toComparisonComponent(gpu)
      );
      if (gpuGenerational.length > 0) {
        comments.push(""); // Add spacing
        comments.push(...gpuGenerational);
      }
    }
    if (cpu) {
      const cpuComparisons = getCompetitiveContext(
        "cpu",
        toComparisonComponent(cpu)
      );
      comments.push(...cpuComparisons);

      // Add generational comparisons for CPU
      const cpuGenerational = getGenerationalComparisons(
        "cpu",
        toComparisonComponent(cpu)
      );
      if (cpuGenerational.length > 0) {
        comments.push(""); // Add spacing
        comments.push(...cpuGenerational);
      }
    }
    if (ram) {
      const ramComparisons = getCompetitiveContext(
        "ram",
        toComparisonComponent(ram),
        ramCap
      );
      comments.push(...ramComparisons);
    }

    // NEW: Storage competitive analysis
    if (storage) {
      const storageComparisons = getCompetitiveContext(
        "storage",
        toComparisonComponent(storage)
      );
      if (storageComparisons.length > 0) {
        comments.push(""); // Add spacing
        comments.push(...storageComparisons);
      }
    }

    // NEW: Cooling competitive analysis
    if (cooling) {
      const coolingComparisons = getCompetitiveContext(
        "cooling",
        toComparisonComponent(cooling)
      );
      if (coolingComparisons.length > 0) {
        comments.push(""); // Add spacing
        comments.push(...coolingComparisons);
      }
    }

    // NEW: PSU competitive analysis
    if (psu) {
      const psuComparisons = getCompetitiveContext(
        "psu",
        toComparisonComponent(psu)
      );
      if (psuComparisons.length > 0) {
        comments.push(""); // Add spacing
        comments.push(...psuComparisons);
      }
    }

    // PHASE 2: Add performance estimates
    if (performanceEstimate.fps) {
      comments.push(
        `📊 **Estimated Gaming Performance**: ${performanceEstimate.fps}`
      );
    }
    if (performanceEstimate.workload) {
      comments.push(
        `📊 **Estimated Workload Performance**: ${performanceEstimate.workload}`
      );
    }
    if (performanceEstimate.bottleneck) {
      comments.push(
        `🔍 **Bottleneck Analysis**: ${performanceEstimate.bottleneck}`
      );
    }

    // GPU-specific real-world performance examples - Externalized to data/gpuPerformanceVariations.ts
    if (gpu) {
      const gpuInsight = getGPUPerformanceInsight(gpu.name || "");
      if (gpuInsight) {
        comments.push(gpuInsight);
      }
    }

    // CPU-specific real-world performance examples - using external variation database
    if (cpu) {
      const cpuInsight = getCPUPerformanceInsight(cpu.name || "");
      if (cpuInsight) {
        comments.push(cpuInsight);
      }
    }

    // CPU & GPU pairing insights with real-world performance - MULTIPLE VARIATIONS
    if (cpu && gpu) {
      const cpuName = cpu.name || "your CPU";
      const gpuName = gpu.name || "your GPU";

      if ((gpu.vram ?? 0) >= 16 && (cpu.cores ?? 0) >= 8) {
        const highEndVariations = [
          `Excellent pairing! Your ${cpuName} and ${gpuName} are perfectly matched for demanding workloads. Here's what this means in the real world: 4K gaming with ray tracing stays smooth (60-80+ FPS in most AAA titles), 3D rendering times are 40-50% faster than mid-tier combos, and you can stream while gaming without frame drops. This is a 'set it and forget it' configuration – it'll handle the next 3-5 years of games and software without breaking a sweat.`,
          `Championship-level combo! 🏆 The ${cpuName} paired with your ${gpuName} is what we call 'no compromises' computing. Real-world translation: Cyberpunk 2077 at 4K Ultra with path tracing? 70+ FPS. Rendering a 10-minute 4K video in DaVinci? 12 minutes instead of 40. Streaming while gaming? Not even breaking a sweat. This is future-proof intelligent design.`,
          `Dream pairing right here! Your ${cpuName} and ${gpuName} together create what I call 'enthusiast paradise'. You're looking at buttery smooth 4K gaming, real-time 4K video scrubbing, and render times that'll make your friends jealous. This combo won't show its age for years. Smart investment!`,
          `Absolute powerhouse! The ${cpuName} + ${gpuName} combination is in my top 3 pairings for 2025. Whether you're gaming at 4K, rendering complex 3D scenes, or running multiple VMs, this setup laughs at the workload. Zero bottlenecks, pure performance. This is exactly what I'd build for myself.`,
        ];
        comments.push(
          highEndVariations[
            Math.floor(Math.random() * highEndVariations.length)
          ]
        );
      } else if ((gpu.vram ?? 0) >= 12 && (cpu.cores ?? 0) >= 6) {
        const midHighVariations = [
          `Smart pairing! The ${cpuName} and ${gpuName} are the sweet spot for 1440p gaming and content creation. Real-world performance: Most games hit 90-120+ FPS at 1440p High/Ultra settings, video editing in 4K is smooth with real-time playback, and you're not wasting money on overkill components. This is exactly what I'd build for a balanced enthusiast system – maximum performance per pound spent.`,
          `The sweet spot! Your ${cpuName} + ${gpuName} combo is what I call 'intelligent value'. You're getting 90% of flagship performance at 60% of the cost. Expect 1440p gaming at ultra settings with headroom to spare, smooth 4K editing, and zero buyer's remorse. This is professional-grade without the professional price tag.`,
          `Goldilocks pairing! 🐻 Not too much, not too little – your ${cpuName} and ${gpuName} are just right. 1440p gaming will be silky smooth (100+ FPS in most titles), content creation workflows stay responsive, and your wallet isn't crying. This is the build I recommend to 60% of my customers. Perfect balance.`,
          `Excellent synergy here! The ${cpuName} paired with ${gpuName} hits that magical performance-per-pound sweet spot. You'll crush 1440p gaming, handle 4K editing without lag, and have enough headroom for demanding productivity. No bottlenecks, no wasted budget. Chef's kiss! 👨‍🍳`,
        ];
        comments.push(
          midHighVariations[
            Math.floor(Math.random() * midHighVariations.length)
          ]
        );
      } else if (cpu && gpu) {
        const basicVariations = [
          `Your ${cpuName} and ${gpuName} will work well together for 1080p gaming and general use. This combination strikes a good balance between cost and capability, delivering smooth performance in today's games and applications.`,
          `Solid entry-level pairing! Your ${cpuName} + ${gpuName} will handle 1080p gaming at 60+ FPS and everyday productivity without issues. It's a sensible starting point that leaves room for future upgrades when budget allows.`,
          `Capable combination! The ${cpuName} and ${gpuName} together provide reliable 1080p performance. You won't be pushing cutting-edge graphics, but for mainstream gaming and work, this does the job well. Consider GPU upgrade first when you're ready to level up.`,
          `Functional pairing for budget-conscious builds. Your ${cpuName} and ${gpuName} won't win performance awards, but they'll run modern games at 1080p medium-high settings comfortably. Perfect for getting into PC gaming without overspending.`,
        ];
        comments.push(
          basicVariations[Math.floor(Math.random() * basicVariations.length)]
        );
      }
    }

    // RAM capacity insights - using external variation database
    if (ram) {
      const ramCap = ram.capacity ?? 0;
      const ramInsights = getRAMInsight(ramCap, cpu, gpu);
      comments.push(...ramInsights);
    }

    // Storage insights with real-world context - MULTIPLE VARIATIONS
    if (storage) {
      // Use dynamic storage insights system with 100+ variations
      const storageInsight = getStorageInsight({
        capacity:
          storage.capacity ??
          (storage as { storageCapacity?: string | number }).storageCapacity ??
          0,
        interface: storage.interface,
        name: storage.name,
        driveType: (storage as { driveType?: string }).driveType,
        price: (storage as { price?: number }).price,
      });
      comments.push(storageInsight);
    }

    // Cooling insights with real-world thermal context - using external variation database
    const coolingInsight = getCoolingInsight(
      cooling
        ? ({
            type: Array.isArray((cooling as PCBuilderComponent)?.type)
              ? (cooling as PCBuilderComponent)?.type?.[0]
              : (cooling as PCBuilderComponent)?.type,
            name: (cooling as PCBuilderComponent)?.name,
          } as { type?: string; name?: string })
        : null,
      cpu?.name || "your CPU",
      cores
    );
    if (coolingInsight) {
      comments.push(coolingInsight);
    }

    // PSU efficiency insights
    const psuInsights = getPSUInsights(
      {
        efficiency: (psu as PCBuilderComponent | undefined)?.efficiency,
        wattage: (psu as PCBuilderComponent | undefined)?.wattage,
      },
      {
        tdp: (cpu as PCBuilderComponent | undefined)?.tdp,
      },
      {
        power: (gpu as PCBuilderComponent | undefined)?.tdp,
      }
    );
    comments.push(...psuInsights);

    // Price tier insights with emotional intelligence and value context
    const totalPrice = getTotalPrice;
    const priceTierInsight = getPriceTierInsight(totalPrice, {
      useCase,
      showSubTier: showPriceSubTierTag,
    });
    if (priceTierInsight) {
      comments.push(priceTierInsight);
    }

    // NEW: Total Cost of Ownership Analysis
    if (cpu && gpu) {
      const tcoContext: TCOContext = {
        usageProfile:
          totalPrice > 2500
            ? "professional"
            : totalPrice > 1500
            ? "heavy"
            : totalPrice > 1000
            ? "moderate"
            : "light",
      };
      const tcoInsights = getTCOAnalysis(
        toComparisonComponent(cpu),
        toComparisonComponent(gpu),
        tcoContext
      );
      if (tcoInsights.length > 0) {
        comments.push(""); // Add spacing
        comments.push("---"); // Visual separator
        comments.push("");
        comments.push(...tcoInsights);
      }
    }

    // NEW: Future-Proofing Analysis
    if (cpu && gpu) {
      const futureProofInsights = getBuildFutureProofAnalysis(
        toComparisonComponent(cpu),
        toComparisonComponent(gpu)
      );
      if (futureProofInsights.length > 0) {
        comments.push(""); // Add spacing
        comments.push(...futureProofInsights);
      }
    }

    // Upgrade path guidance based on current configuration
    if (totalPrice > 0) {
      // Helper: Infer PCIe gen from chipset
      const inferPCIeGenFromChipset = (
        chipset?: string
      ): number | undefined => {
        if (!chipset) return undefined;
        const c = chipset.toUpperCase();
        if (/B450|X470|Z390|H370|B365|B360/.test(c)) return 3;
        if (/B550|X570|Z490|Z590|B560|H570/.test(c)) return 4;
        if (/B650E|X670E/.test(c)) return 5;
        if (/B650|X670|Z690|Z790|B660|B760/.test(c)) return 4;
        return undefined;
      };

      const upgradeNotes = getUpgradeSuggestions(
        {
          ramCap,
          cores,
          vram,
          estimatedLoad,
          wattage,
          cooling: cooling
            ? ({
                type: Array.isArray((cooling as PCBuilderComponent)?.type)
                  ? (cooling as PCBuilderComponent)?.type?.[0]
                  : (cooling as PCBuilderComponent)?.type,
                name: (cooling as PCBuilderComponent)?.name,
              } as { type?: string; name?: string })
            : undefined,
          storage: storage
            ? ({
                capacity:
                  (storage as PCBuilderComponent)?.capacity === null
                    ? undefined
                    : (storage as PCBuilderComponent)?.capacity,
                interface: (storage as PCBuilderComponent)?.interface,
              } as { capacity?: number; interface?: string })
            : undefined,
          // P0/P1 additions
          gpuName: gpu?.name,
          cpuName: cpu?.name,
          motherboardChipset: motherboard?.chipset,
          ramSpeed:
            typeof ram?.speed === "number"
              ? ram.speed
              : typeof ram?.speed === "string"
              ? parseInt(ram.speed, 10)
              : undefined,
          ramType: ram?.type
            ? String(ram.type).toUpperCase().includes("DDR5")
              ? "DDR5"
              : "DDR4"
            : undefined,
          pcieGen:
            typeof motherboard?.chipset === "string"
              ? inferPCIeGenFromChipset(motherboard.chipset)
              : undefined,
          // P2 additions
          tdpCpu,
          gpuPower,
          caseAirflow: inferredCaseAirflow,
          caseFans: caseFansCount,
        },
        totalPrice
      );

      if (upgradeNotes.length > 0) {
        comments.push(...upgradeNotes);
      }
    }

    // Compute ram speed once to avoid nested ternaries causing parser issues
    const ramSpeedValue =
      typeof ram?.speed === "number"
        ? ram.speed
        : typeof ram?.speed === "string"
        ? parseInt(ram.speed, 10)
        : undefined;

    // Format and display actionable CTAs based on analysis
    const formattedCTAs = formatCTASection({
      ctas,
      grade,
      vram,
      cores,
      ramCap,
      totalPrice,
      useCase,
      hasNVMe: storage?.interface?.toLowerCase().includes("nvme") ?? false,
      psuWattage: wattage,
      psuEfficiency: psu?.efficiency,
      coolerType: Array.isArray(cooling?.type)
        ? cooling?.type?.[0]
        : cooling?.type,
      storageSpeed: storage?.interface?.toLowerCase().includes("nvme")
        ? "NVMe"
        : storage?.interface?.toLowerCase().includes("sata")
        ? "SATA"
        : (storage as { driveType?: string })?.driveType?.toLowerCase() ===
          "hdd"
        ? "HDD"
        : undefined,
      ramSpeed: ramSpeedValue,
      cpuBottleneck: performanceEstimate.bottleneck?.includes("CPU") ?? false,
      gpuBottleneck: performanceEstimate.bottleneck?.includes("GPU") ?? false,
    });
    comments.push(...formattedCTAs);

    // Merge advanced insights at end (UI decides visibility)
    comments.push(...advanced);
    return comments;
  }, [
    insightModules, // ⚡ Must recompute when modules load
    // Environment inputs used in diagnostics
    environment.ambientTemp,
    environment.displays,
    environment.usb.captureCard,
    environment.usb.externalSSD,
    environment.usb.webcam4k,
    environment.usb.audioInterface,
    // Pricing/tiering inputs
    getTotalPrice,
    showPriceSubTierTag,
    activeComponentData,
    selectedComponents,
  ]);

  // Extract meta (grade/score/profile) for UI badges
  const generateBuildMeta = () => {
    const first = generateBuildComments[0] || "";
    const m = first.match(
      /Synergy Grade: (A|B|C|D|E|F) \((\d+)\/100\) · Profile: (.*)/
    );
    if (m) return { grade: m[1], score: parseInt(m[2], 10), profile: m[3] };
    return { grade: "N/A", score: 0, profile: "Unknown" };
  };

  const handleCheckoutWithCompatibility = () => {
    const getComponent = (
      category: keyof ComponentDataMap,
      id?: string | null
    ): AnyComponent | null => {
      const list = (activeComponentData[category] || []) as AnyComponent[];
      if (!id) return null;
      const found = list.find((c) => c.id === id);
      return found || null;
    };
    const issues = checkCompatibility(selectedComponents, getComponent);
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
      logger.error("Cart functions not provided to PCBuilder");
      return;
    }

    // Create cart item from selected components
    const buildComponents = Object.entries(selectedComponents)
      .filter(([_, componentId]) => componentId !== null)
      .map(([category, componentId]: [string, string]) => {
        // Find the actual component data from activeComponentData
        const list =
          (activeComponentData as ComponentDataMap)[
            category as keyof ComponentDataMap
          ] || [];
        const component = list.find((c) => c.id === componentId);

        if (!component) {
          logger.warn(`Component not found: ${category} - ${componentId}`);
          return null;
        }
        // Include id for downstream order item persistence and inventory
        let image: string | undefined;
        const imgs = (
          component as {
            images?: Array<string | { url?: string; src?: string }>;
          }
        ).images;
        if (Array.isArray(imgs) && imgs.length) {
          const first: string | { url?: string; src?: string } = imgs[0] as
            | string
            | { url?: string; src?: string };
          image = typeof first === "string" ? first : first.url || first.src;
        }
        return {
          id: component.id,
          name: component.name,
          price: component.price || 0,
          category: category,
          image,
        };
      })
      .filter((comp) => comp !== null);

    if (buildComponents.length === 0) {
      return;
    }

    // Add each selected component as an individual cart line item
    for (const comp of buildComponents) {
      if (!comp) continue;
      onAddToCart({
        id: comp.id,
        name: comp.name,
        price: comp.price,
        category: comp.category,
        image: (comp as { image?: string }).image,
      } as unknown as PCBuilderComponent);
    }
    onOpenCart();
  };

  const handleCompatibilityCancel = () => {
    setShowCompatibilityDialog(false);
  };

  // Helper function for safe array includes check
  const safeIncludes = useCallback(
    (array: string[] | undefined, value: string) => {
      return Array.isArray(array) && array.includes(value);
    },
    []
  );

  // Helper function to get category display label
  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category
      ? category.label
      : categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  };

  // Intelligent component filtering based on compatibility
  const getCompatibleComponents = useCallback(
    (category: string, currentComponents: SelectedComponentIds) => {
      const allComponents =
        (activeComponentData as ComponentDataMap)[
          category as keyof ComponentDataMap
        ] || [];

      // If no components selected yet, show all
      if (Object.keys(currentComponents).length === 0) {
        return allComponents;
      }

      return allComponents.filter((component) => {
        // CPU-Motherboard Socket Compatibility
        if (category === "cpu" && currentComponents.motherboard) {
          const motherboard = (activeComponentData.motherboard ?? []).find(
            (mb) => mb.id === currentComponents.motherboard
          );
          if (motherboard && component.socket !== motherboard.socket) {
            return false;
          }
        }

        if (category === "motherboard" && currentComponents.cpu) {
          const cpu = (activeComponentData.cpu ?? []).find(
            (c) => c.id === currentComponents.cpu
          );
          if (cpu && component.socket !== cpu.socket) {
            return false;
          }
        }

        // GPU-Case Clearance
        if (category === "gpu" && currentComponents.case) {
          const pcCase = (activeComponentData.case ?? []).find(
            (c) => c.id === currentComponents.case
          );
          if (
            pcCase &&
            typeof component.length === "number" &&
            typeof pcCase.maxGpuLength === "number" &&
            component.length > pcCase.maxGpuLength
          ) {
            return false;
          }
        }

        if (category === "case" && currentComponents.gpu) {
          const gpu = (activeComponentData.gpu ?? []).find(
            (g) => g.id === currentComponents.gpu
          );
          if (
            gpu &&
            typeof component.maxGpuLength === "number" &&
            typeof gpu.length === "number" &&
            gpu.length > component.maxGpuLength
          ) {
            return false;
          }
        }

        // RAM-Motherboard Compatibility
        if (category === "ram" && currentComponents.motherboard) {
          const motherboard = activeComponentData.motherboard?.find(
            (mb) => mb.id === currentComponents.motherboard
          );
          if (
            motherboard &&
            motherboard.ramSupport &&
            component.type &&
            !hasSupport(motherboard.ramSupport, component.type)
          ) {
            return false;
          }
        }

        if (category === "motherboard" && currentComponents.ram) {
          const ram = (activeComponentData.ram ?? []).find(
            (r) => r.id === currentComponents.ram
          );
          if (
            ram &&
            component.ramSupport &&
            ram.type &&
            !hasSupport(component.ramSupport, ram.type)
          ) {
            return false;
          }
        }

        // Case-Motherboard Form Factor
        if (category === "case" && currentComponents.motherboard) {
          const motherboard = activeComponentData.motherboard?.find(
            (mb) => mb.id === currentComponents.motherboard
          );
          if (motherboard && motherboard.formFactor) {
            // Case-insensitive compatibility check
            const compatArray = Array.isArray(component.compatibility)
              ? component.compatibility.map((c: string) => c.toLowerCase())
              : [];
            if (
              compatArray.length > 0 &&
              !compatArray.includes(motherboard.formFactor.toLowerCase())
            ) {
              return false;
            }
          }
        }

        if (category === "motherboard" && currentComponents.case) {
          const pcCase = (activeComponentData.case ?? []).find(
            (c) => c.id === currentComponents.case
          );
          if (pcCase && component.formFactor) {
            // Case-insensitive compatibility check
            const compatArray = Array.isArray(pcCase.compatibility)
              ? pcCase.compatibility.map((c: string) => c.toLowerCase())
              : [];
            if (
              compatArray.length > 0 &&
              !compatArray.includes(component.formFactor.toLowerCase())
            ) {
              return false;
            }
          }
        }

        // CPU Cooler Height-Case Clearance
        if (
          category === "cooling" &&
          currentComponents.case &&
          component.type === "Air"
        ) {
          const pcCase = (activeComponentData.case ?? []).find(
            (c) => c.id === currentComponents.case
          );
          if (
            pcCase &&
            pcCase.maxCpuCoolerHeight &&
            (component.height ?? 0) > (pcCase?.maxCpuCoolerHeight ?? 0)
          ) {
            return false;
          }
        }

        if (category === "case" && currentComponents.cooling) {
          const cooling = (activeComponentData.cooling ?? []).find(
            (cool) => cool.id === currentComponents.cooling
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
          const pcCase = (activeComponentData.case ?? []).find(
            (c) => c.id === currentComponents.case
          );
          if (
            pcCase &&
            pcCase.maxPsuLength &&
            (component.length ?? 0) > (pcCase?.maxPsuLength ?? 0)
          ) {
            return false;
          }
        }

        if (category === "case" && currentComponents.psu) {
          const psu = (activeComponentData.psu ?? []).find(
            (p) => p.id === currentComponents.psu
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
    },
    [activeComponentData]
  );

  // Function to get detailed incompatibility information for the current category
  const getIncompatibilityDetails = (
    category: string,
    currentComponents: SelectedComponentIds
  ) => {
    const allComponents =
      (activeComponentData as ComponentDataMap)[
        category as keyof ComponentDataMap
      ] || [];
    const compatibleComponents = getCompatibleComponents(
      category,
      currentComponents
    );
    const incompatibleComponents = allComponents.filter(
      (component) =>
        !compatibleComponents.some(
          (compatible) => compatible.id === component.id
        )
    );

    const details: { component: AnyComponent; issues: string[] }[] = [];

    incompatibleComponents.forEach((component) => {
      const issues: string[] = [];

      // CPU-Motherboard Socket Compatibility
      if (category === "cpu" && currentComponents.motherboard) {
        const motherboard = activeComponentData.motherboard?.find(
          (mb) => mb.id === currentComponents.motherboard
        );
        if (motherboard && component.socket !== motherboard.socket) {
          issues.push(
            `Socket mismatch: ${component.socket} CPU cannot fit in ${motherboard.socket} motherboard socket`
          );
        }
      }

      if (category === "motherboard" && currentComponents.cpu) {
        const cpu = activeComponentData.cpu?.find(
          (c) => c.id === currentComponents.cpu
        );
        if (cpu && component.socket !== cpu.socket) {
          issues.push(
            `Socket mismatch: ${component.socket} motherboard cannot fit ${cpu.socket} CPU`
          );
        }
      }

      // GPU-Case Clearance
      if (category === "gpu" && currentComponents.case) {
        const pcCase = (activeComponentData.case ?? []).find(
          (c) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          typeof pcCase.maxGpuLength === "number" &&
          typeof component.length === "number" &&
          component.length > pcCase.maxGpuLength
        ) {
          issues.push(
            `Length clearance: ${component.length}mm GPU too long for ${pcCase.maxGpuLength}mm case clearance`
          );
        }
      }

      if (category === "case" && currentComponents.gpu) {
        const gpu = (activeComponentData.gpu ?? []).find(
          (g) => g.id === currentComponents.gpu
        );
        if (
          gpu &&
          typeof gpu.length === "number" &&
          typeof component.maxGpuLength === "number" &&
          gpu.length > component.maxGpuLength
        ) {
          issues.push(
            `GPU clearance: Selected ${gpu.length}mm GPU won't fit in this case (max: ${component.maxGpuLength}mm)`
          );
        }
      }

      // RAM-Motherboard Compatibility
      if (category === "ram" && currentComponents.motherboard) {
        const motherboard = (activeComponentData.motherboard ?? []).find(
          (mb) => mb.id === currentComponents.motherboard
        );
        if (
          motherboard &&
          motherboard.ramSupport &&
          component.type &&
          !hasSupport(motherboard.ramSupport, component.type)
        ) {
          issues.push(
            `Memory type mismatch: ${component.type} RAM not supported by motherboard (supports: ${motherboard.ramSupport})`
          );
        }
      }

      if (category === "motherboard" && currentComponents.ram) {
        const ram = (activeComponentData.ram ?? []).find(
          (r) => r.id === currentComponents.ram
        );
        if (
          ram &&
          ram.type &&
          component.ramSupport &&
          !hasSupport(component.ramSupport, ram.type)
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
        const motherboard = (activeComponentData.motherboard ?? []).find(
          (mb) => mb.id === currentComponents.motherboard
        );
        if (
          motherboard &&
          motherboard.formFactor &&
          !safeIncludes(
            Array.isArray(component.compatibility)
              ? component.compatibility
              : undefined,
            motherboard.formFactor.toLowerCase()
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
        const pcCase = (activeComponentData.case ?? []).find(
          (c) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          component.formFactor &&
          !safeIncludes(
            Array.isArray(pcCase.compatibility)
              ? pcCase.compatibility
              : undefined,
            component.formFactor.toLowerCase()
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
        const pcCase = (activeComponentData.case ?? []).find(
          (c) => c.id === currentComponents.case
        );
        if (
          pcCase &&
          pcCase.maxCpuCoolerHeight &&
          component.height &&
          component.height > pcCase.maxCpuCoolerHeight
        ) {
          issues.push(
            `Height clearance: ${component.height}mm cooler too tall for ${pcCase.maxCpuCoolerHeight}mm case clearance`
          );
        }
      }

      if (category === "case" && currentComponents.cooling) {
        const cooling = (activeComponentData?.cooling ?? []).find(
          (cool) => cool.id === currentComponents.cooling
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

  const filteredComponents = useMemo(() => {
    return getCompatibleComponents(activeCategory, selectedComponents);
  }, [activeCategory, selectedComponents, getCompatibleComponents]);

  // When using global search, get components from ALL categories
  const allCategoriesComponents = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];

    const allComponents: PCBuilderComponent[] = [];
    const categoryKeys: (keyof ComponentDataMap)[] = [
      "case",
      "motherboard",
      "cpu",
      "gpu",
      "ram",
      "storage",
      "psu",
      "cooling",
    ];

    categoryKeys.forEach((cat) => {
      const components = activeComponentData[cat] || [];
      allComponents.push(...(components as PCBuilderComponent[]));
    });

    return allComponents;
  }, [globalSearchQuery, activeComponentData]);

  // Apply user-defined filters on top of compatibility
  const userFilteredComponents = useMemo(() => {
    // If global search is active, search across all categories
    if (globalSearchQuery.trim()) {
      let base = applyUserFilters(allCategoriesComponents);
      // If limiting is enabled, narrow to inferred category results
      if (limitToRelevantCategory) {
        const inferred = inferCategoryFromQuery(globalSearchQuery);
        if (inferred) {
          base = base.filter((comp) => {
            const catVal = getVal(comp, "category");
            const cat = typeof catVal === "string" ? catVal : "";
            return cat === inferred;
          });
        }
      }
      return base;
    }
    // Otherwise, search only within the active category
    return applyUserFilters(filteredComponents);
  }, [
    globalSearchQuery,
    allCategoriesComponents,
    filteredComponents,
    applyUserFilters,
    limitToRelevantCategory,
    inferCategoryFromQuery,
  ]);

  // Refinement tracking: now that filtered lists are available, log counts
  useEffect(() => {
    const prevQuery = prevGlobalQueryRef.current;
    const newQuery = globalSearchQuery;
    const prevFilters = prevFiltersRef.current;
    const newFilters = currentFiltersForTracking;
    if (
      prevQuery !== newQuery ||
      JSON.stringify(prevFilters) !== JSON.stringify(newFilters)
    ) {
      const sessionId = getSearchSessionId();
      const currentCount = userFilteredComponents.length;
      const previousCount = prevResultsCountGlobalRef.current;
      trackSearchRefinement(prevQuery, newQuery, prevFilters, newFilters, {
        sessionId,
        previousResultsCount: previousCount,
        newResultsCount: currentCount,
      }).catch(() => {});
      prevGlobalQueryRef.current = newQuery;
      prevFiltersRef.current = newFilters;
      prevResultsCountGlobalRef.current = currentCount;
    }
  }, [
    globalSearchQuery,
    currentFiltersForTracking,
    userFilteredComponents.length,
  ]);

  useEffect(() => {
    const prevQuery = prevCategoryQueryRef.current;
    const newQuery = searchQuery;
    const prevFilters = prevFiltersRef.current;
    const newFilters = currentFiltersForTracking;
    if (
      prevQuery !== newQuery ||
      JSON.stringify(prevFilters) !== JSON.stringify(newFilters)
    ) {
      const sessionId = getSearchSessionId();
      const currentCount = userFilteredComponents.length;
      const previousCount = prevResultsCountCategoryRef.current;
      trackSearchRefinement(prevQuery, newQuery, prevFilters, newFilters, {
        sessionId,
        previousResultsCount: previousCount,
        newResultsCount: currentCount,
      }).catch(() => {});
      prevCategoryQueryRef.current = newQuery;
      prevFiltersRef.current = newFilters;
      prevResultsCountCategoryRef.current = currentCount;
    }
  }, [searchQuery, currentFiltersForTracking, userFilteredComponents.length]);

  // Track search queries for analytics (with debounce to avoid excessive calls)
  useEffect(() => {
    const query = searchQuery.trim();
    // Only track searches with at least 2 characters
    if (!query || query.length < 2) return;

    const timeoutId = setTimeout(async () => {
      try {
        const resultsCount = userFilteredComponents.length;
        const sessionId = getSessionId();

        logger.debug("[PC Builder] Tracking category search", {
          query,
          category: activeCategory,
          resultsCount,
        });

        // Track search asynchronously - don't block UI
        const result = await trackSearch({
          query,
          category: activeCategory,
          resultsCount,
          userId: user?.uid,
          sessionId: sessionId || undefined,
          filters: {
            brands: selectedBrands,
            priceRange,
          },
        });

        if (!result.success) {
          console.warn("[PC Builder] Search tracking failed:", result.error);
        } else {
          logger.debug("[PC Builder] Search tracked successfully");
        }

        // Track zero-result searches
        if (resultsCount === 0) {
          trackZeroResultSearch({
            query,
            category: activeCategory,
            userId: user?.uid,
            sessionId: sessionId || undefined,
          }).catch((err) => {
            console.warn("Zero-result tracking failed:", err);
          });
        }
      } catch (error) {
        // Catch any synchronous errors
        console.warn("Search tracking error:", error);
      }
    }, 2000); // Debounce for 2 seconds - wait for user to finish typing

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    activeCategory,
    userFilteredComponents.length,
    user?.uid,
    selectedBrands,
    priceRange,
  ]);

  // Track global search queries (searches across all categories)
  useEffect(() => {
    const query = globalSearchQuery.trim();
    // Only track searches with at least 2 characters
    if (!query || query.length < 2) return;

    const timeoutId = setTimeout(async () => {
      try {
        const resultsCount = userFilteredComponents.length;
        const sessionId = getSessionId();

        logger.debug("[PC Builder] Tracking global search", {
          query,
          resultsCount,
        });

        // Track global search with "all" as category
        const result = await trackSearch({
          query,
          category: "all", // Special category for global searches
          resultsCount,
          userId: user?.uid,
          sessionId: sessionId || undefined,
          filters: {
            currentCategory: activeCategory, // Track which category user is viewing
            brands: selectedBrands,
            priceRange,
          },
        });

        if (!result.success) {
          console.warn(
            "[PC Builder] Global search tracking failed:",
            result.error
          );
        } else {
          logger.debug("[PC Builder] Global search tracked successfully");
        }

        // Track zero-result global searches
        if (resultsCount === 0) {
          trackZeroResultSearch({
            query,
            category: "all",
            userId: user?.uid,
            sessionId: sessionId || undefined,
          }).catch((err) => {
            console.warn("Global zero-result tracking failed:", err);
          });
        }
      } catch (error) {
        console.warn("Global search tracking error:", error);
      }
    }, 2000); // Debounce for 2 seconds - wait for user to finish typing

    return () => clearTimeout(timeoutId);
  }, [
    globalSearchQuery,
    activeCategory,
    userFilteredComponents.length,
    user?.uid,
    selectedBrands,
    priceRange,
  ]);

  // Sort components based on selected sort option (memoized for performance)
  const sortedComponents = useMemo(() => {
    return [...userFilteredComponents].sort((a, b) => {
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
  }, [userFilteredComponents, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedComponents.length / itemsPerPage);
  const paginatedComponents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedComponents.slice(startIndex, endIndex);
  }, [sortedComponents, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedBrands,
    priceRange,
    optionFilters,
    rangeFilters,
    sortBy,
    globalSearchQuery,
  ]);

  const totalComponentsInCategory = useMemo(() => {
    return (
      (activeComponentData as ComponentDataMap)[
        activeCategory as keyof ComponentDataMap
      ] || []
    ).length;
  }, [activeComponentData, activeCategory]);

  const filteredCount = userFilteredComponents.length;

  return (
    <ComponentErrorBoundary componentName="PCBuilder">
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          {/* Stunning Hero Section */}
          <div className="relative mb-20 overflow-visible max-w-[1300px] mx-auto">
            {/* Removed decorative background to ensure full transparency under the menu bar */}

            <div className="relative">
              {/* Top Badge */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-transparent border border-sky-500/30">
                  <Settings className="w-5 h-5 text-sky-400 mr-3 animate-spin-slow" />
                  <span className="text-sm font-semibold text-sky-300 tracking-wide">
                    CUSTOM PC BUILDER
                  </span>
                </div>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-center mb-6 leading-tight px-4">
                <span className="block bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(14,165,233,0.5)]">
                  Build Your
                </span>
                <span className="block bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_50px_rgba(14,165,233,0.8)]">
                  Dream PC
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg md:text-2xl text-gray-300 text-center max-w-5xl mx-auto mb-12 leading-relaxed px-4">
                Choose your build experience. Dial in every component for total
                control, request bespoke parts through the Enthusiast Builder,
                or bring your rig to life with immersive 3D visualisation.
                Whether you're crafting a gaming powerhouse, a workstation
                monster, or something uniquely yours, Vortex PCs gives you the
                freedom to build without limits.
              </p>

              {/* CTA Buttons - Primary CTAs with prominence */}
              <div className="flex flex-col lg:flex-row gap-4 justify-center mb-16 px-4 max-w-5xl mx-auto">
                <Button
                  onClick={handleStartBuildingCta}
                  className="flex-1 h-[68px] min-h-[68px] border-2 border-transparent bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-8 text-lg lg:text-xl font-semibold rounded-2xl shadow-[0_0_40px_rgba(14,165,233,0.5)] hover:shadow-[0_0_60px_rgba(14,165,233,0.7)] transition-all duration-300 transform hover:scale-105"
                >
                  <Settings className="w-6 h-6 mr-3" />
                  Start Building
                </Button>
                <Button
                  onClick={() => setShowEnthusiastBuilder(true)}
                  className="flex-1 h-[68px] min-h-[68px] border-2 border-blue-500/60 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 hover:text-white px-8 text-lg lg:text-xl font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:border-blue-400/80"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Enthusiast Builder
                </Button>
                <Button
                  onClick={() => navigate("/visual-configurator")}
                  className="flex-1 h-[68px] min-h-[68px] border-2 border-cyan-500/60 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white px-8 text-lg lg:text-xl font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:border-cyan-400/80"
                >
                  <Box className="w-6 h-6 mr-3" />
                  3D Builder
                  <Badge className="ml-3 bg-cyan-500/30 border-cyan-500/50 text-cyan-200 text-xs">
                    Visualization
                  </Badge>
                </Button>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
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
                    Performance Optimised
                  </span>
                </div>
              </div>

              {/* Social Proof - Builds Completed Today */}
              <div className="flex justify-center px-4">
                <BuildsCompletedToday
                  className="max-w-md w-full animate-fade-in"
                  showTrending={true}
                />
              </div>

              {/* Business Solutions Banner */}
              <div className="mt-12 max-w-[1300px] mx-auto px-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                  <div className="relative bg-gradient-to-r from-sky-950/50 to-blue-950/50 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-8 hover:border-sky-400/50 transition-all duration-300">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-sky-400" />
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-2">
                          <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                            Business Solutions
                          </span>
                        </h3>
                        <p className="text-gray-300 mb-4">
                          Need workstations for your team? Explore our
                          pre-configured business PCs with priority support
                          packages.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                          <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                            Volume Discounts
                          </span>
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                            3-5 Year Warranties
                          </span>
                          <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
                            On-Site Support
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate("/business-solutions")}
                        className="flex-shrink-0 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        View Business PCs
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading CMS Data */}
            {isLoadingCms && (
              <div className="grid lg:grid-cols-4 gap-8 mt-8">
                {/* Sidebar Skeletons */}
                <div className="lg:col-span-1 space-y-6">
                  <BuildSummarySkeleton />
                  <CategoryNavSkeleton />
                </div>

                {/* Main Content Skeletons */}
                <div className="lg:col-span-3 space-y-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-48 mb-4"></div>
                    <div className="h-12 bg-white/10 rounded mb-4"></div>
                    <div className="flex gap-4 mb-6">
                      <div className="h-10 bg-white/10 rounded flex-1"></div>
                      <div className="h-10 bg-white/10 rounded w-32"></div>
                    </div>
                  </Card>

                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <ComponentCardSkeleton key={i} viewMode={viewMode} />
                    ))}
                  </div>
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
                            £{(recommendedBuild.price ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                          {recommendedBuild.name}
                        </p>
                        <Button
                          onClick={() => setShowBuildDetailsModal(true)}
                          className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 hover:border-green-500/50"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Build Details
                        </Button>
                      </div>
                      <Separator className="border-white/10" />
                    </>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Components</span>
                    <span className="text-white">
                      {getSelectedComponentsCount}/8
                    </span>
                  </div>

                  <Progress
                    value={(getSelectedComponentsCount / 8) * 100}
                    className="h-2"
                  />

                  <Separator className="border-white/10" />

                  <div className="space-y-2">
                    {Object.entries(selectedComponents).map(
                      ([category, componentId]) => {
                        const component = (
                          activeComponentData as ComponentDataMap
                        )[category as keyof ComponentDataMap]?.find(
                          (c) => c.id === componentId
                        );
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
                              £{(component.price ?? 0).toFixed(2)}
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
                        return items.map((itemId: string) => {
                          const peripheral = (
                            activeOptionalExtrasData as Record<
                              string,
                              PCOptionalExtra[]
                            >
                          )[category]?.find((p) => p.id === itemId);
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
                                £{(peripheral.price ?? 0).toFixed(2)}
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
                      £{getTotalPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Price difference indicator */}
                  {recommendedBuild &&
                    recommendedBuild.price &&
                    getTotalPrice > 0 && (
                      <div
                        className={`text-sm text-center p-2 rounded-lg ${
                          getTotalPrice > recommendedBuild.price
                            ? "bg-red-500/10 text-red-300 border border-red-500/20"
                            : getTotalPrice < recommendedBuild.price
                            ? "bg-green-500/10 text-green-300 border border-green-500/20"
                            : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        }`}
                      >
                        {getTotalPrice > recommendedBuild.price
                          ? `+£${(
                              getTotalPrice - recommendedBuild.price
                            ).toLocaleString()} over budget`
                          : getTotalPrice < recommendedBuild.price
                          ? `£${(
                              recommendedBuild.price - getTotalPrice
                            ).toLocaleString()} under budget`
                          : "Matches recommended budget"}
                      </div>
                    )}

                  {/* Environment Settings (affects thermal & peripheral/display diagnostics) */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 rounded-xl p-3 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-sky-400" />
                        <h4 className="text-white font-semibold text-lg md:text-xl">
                          Your Setup Details
                        </h4>
                      </div>
                    </div>
                    <div className="mt-3 mb-2 flex items-center gap-2">
                      <Button
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs px-3"
                        size="sm"
                        onClick={() =>
                          setEnvironment((e) => ({
                            ...e,
                            showPanel: !e.showPanel,
                          }))
                        }
                      >
                        {environment.showPanel ? (
                          <>
                            <ChevronUp className="w-3 h-3 mr-1" /> Hide
                          </>
                        ) : (
                          <>
                            <Settings className="w-3 h-3 mr-1" /> Customise
                          </>
                        )}
                      </Button>
                      {environment.showPanel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-300 hover:text-white text-xs"
                          onClick={() =>
                            setEnvironment((env) => ({
                              ...env,
                              ambientTemp: 22,
                              usb: {
                                captureCard: false,
                                externalSSD: false,
                                webcam4k: false,
                                audioInterface: false,
                                keyboard: false,
                                mouse: false,
                              },
                              displays: [
                                {
                                  resolution: "1920x1080",
                                  refreshRate: 60,
                                  connection: "HDMI 2.0",
                                },
                              ],
                            }))
                          }
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Reset to
                          defaults
                        </Button>
                      )}
                      {!environment.showPanel && (
                        <p className="text-[11px] text-gray-400">
                          Adjust room, devices & monitor for precise advice
                        </p>
                      )}
                    </div>
                    {!environment.showPanel && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-gray-400">
                          Tell us about your room temperature, peripherals, and
                          monitor for personalised recommendations
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
                              <Thermometer className="w-3 h-3 mr-1" /> Room{" "}
                              {environment.ambientTemp}°C
                            </Badge>
                            <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-300">
                              <Monitor className="w-3 h-3 mr-1" />{" "}
                              {(
                                environment.displays?.[0]?.resolution || "1080p"
                              )
                                .replace("1920x1080", "1080p")
                                .replace("2560x1440", "1440p")
                                .replace("3840x2160", "4K")}{" "}
                              @{" "}
                              {String(
                                environment.displays?.[0]?.refreshRate || 60
                              )}
                              Hz
                            </Badge>
                            <Badge className="bg-cyan-500/20 border-cyan-500/40 text-cyan-300">
                              <Usb className="w-3 h-3 mr-1" />
                              {(environment.usb.captureCard ? 1 : 0) +
                                (environment.usb.externalSSD ? 1 : 0) +
                                (environment.usb.webcam4k ? 1 : 0) +
                                (environment.usb.audioInterface ? 1 : 0)}{" "}
                              devices
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-400">
                                Price insight label
                              </span>
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="inline-flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors">
                                      <HelpCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-xs">
                                      Show "Budget", "Mid-Range", or "Premium"
                                      labels in build analysis
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Switch
                              checked={showPriceSubTierTag}
                              onCheckedChange={(v) =>
                                setShowPriceSubTierTag(Boolean(v))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Animated expand/collapse for the detailed panel */}
                    <div
                      className={`transition-all duration-300 grid ${
                        environment.showPanel
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                      aria-expanded={environment.showPanel}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-3 space-y-4">
                          <p className="text-xs text-gray-400">
                            This helps us provide accurate cooling,
                            connectivity, and performance advice tailored to
                            your setup.
                          </p>
                          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] gap-x-4 gap-y-4 lg:items-start">
                            {/* Ambient temperature */}
                            <div className="flex flex-col">
                              <label className="block text-xs text-gray-300 mb-1 font-medium text-center">
                                Room Temperature
                              </label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={10}
                                  max={40}
                                  step={1}
                                  value={environment.ambientTemp}
                                  onChange={(e) =>
                                    setEnvironment((env) => ({
                                      ...env,
                                      ambientTemp: Number(e.target.value || 0),
                                    }))
                                  }
                                  className="bg-black/40 border-white/10 text-white pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                  °C
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-2 mt-2">
                                <button
                                  onClick={() =>
                                    setEnvironment((env) => ({
                                      ...env,
                                      ambientTemp: Math.max(
                                        10,
                                        (env.ambientTemp ?? 0) - 1
                                      ),
                                    }))
                                  }
                                  className="h-6 w-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm transition-all"
                                >
                                  –
                                </button>
                                <button
                                  onClick={() =>
                                    setEnvironment((env) => ({
                                      ...env,
                                      ambientTemp: Math.min(
                                        40,
                                        (env.ambientTemp ?? 0) + 1
                                      ),
                                    }))
                                  }
                                  className="h-6 w-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm transition-all"
                                >
                                  +
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Warmer rooms need better cooling
                              </p>
                            </div>

                            {/* USB devices quick toggles with tooltips */}
                            <div className="flex flex-col">
                              <label className="block text-xs text-gray-300 mb-1 font-medium text-center">
                                Devices You'll Connect
                              </label>
                              <TooltipProvider delayDuration={150}>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {[
                                    {
                                      k: "captureCard",
                                      label: "Capture Card",
                                      tip: "High bandwidth; use USB 3.2 Gen1+",
                                    },
                                    {
                                      k: "externalSSD",
                                      label: "External SSD",
                                      tip: "Prefer USB 3.2 Gen2/4 or Thunderbolt",
                                    },
                                    {
                                      k: "webcam4k",
                                      label: "4K Webcam",
                                      tip: "UHD webcams need high bitrate; USB 3.0+",
                                    },
                                    {
                                      k: "audioInterface",
                                      label: "Audio Interface",
                                      tip: "Low-latency; USB 2.0 OK, avoid hubs",
                                    },
                                    {
                                      k: "keyboard",
                                      label: "Keyboard",
                                      tip: "Wired keyboards use USB 2.0, wireless may need USB 3.0",
                                    },
                                    {
                                      k: "mouse",
                                      label: "Mouse",
                                      tip: "Gaming mice benefit from USB 3.0 for lower latency",
                                    },
                                  ].map((opt) => (
                                    <Tooltip key={opt.k}>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() =>
                                            setEnvironment((env) => ({
                                              ...env,
                                              usb: {
                                                ...env.usb,
                                                [opt.k]:
                                                  !env.usb[
                                                    opt.k as keyof typeof env.usb
                                                  ],
                                              },
                                            }))
                                          }
                                          className={`min-w-[90px] h-10 px-3 rounded-md border transition-all text-center flex items-center justify-center ${
                                            environment.usb[
                                              opt.k as keyof typeof environment.usb
                                            ]
                                              ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                                              : "bg-black/30 border-white/10 text-gray-300 hover:border-white/20"
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <span className="text-xs">
                                          {opt.tip}
                                        </span>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              </TooltipProvider>
                              <p className="text-xs text-gray-500 mt-1">
                                Helps check USB bandwidth
                              </p>
                            </div>

                            {/* Your Main Monitor with dropdowns */}
                            <div className="flex flex-col min-w-0">
                              <label className="block text-xs text-gray-300 mb-1 font-medium text-center whitespace-normal leading-tight">
                                Your Main Monitor
                              </label>
                              <div className="space-y-2">
                                {/* Resolution */}
                                <div>
                                  <label className="block text-[11px] text-gray-400 mb-1">
                                    Resolution
                                  </label>
                                  <Select
                                    value={
                                      environment.displays[0]?.resolution ||
                                      "1920x1080"
                                    }
                                    onValueChange={(v) =>
                                      setEnvironment((env) => ({
                                        ...env,
                                        displays: [
                                          {
                                            ...env.displays[0],
                                            resolution: v,
                                          },
                                          ...env.displays.slice(1),
                                        ],
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-8 bg-black/40 border-white/10 text-white text-xs">
                                      <SelectValue placeholder="Resolution" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1920x1080">
                                        1080p
                                      </SelectItem>
                                      <SelectItem value="2560x1440">
                                        1440p
                                      </SelectItem>
                                      <SelectItem value="3840x2160">
                                        4K
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Refresh Rate */}
                                <div>
                                  <label className="block text-[11px] text-gray-400 mb-1">
                                    Refresh Rate
                                  </label>
                                  <Select
                                    value={String(
                                      environment.displays[0]?.refreshRate || 60
                                    )}
                                    onValueChange={(v) =>
                                      setEnvironment((env) => ({
                                        ...env,
                                        displays: [
                                          {
                                            ...env.displays[0],
                                            refreshRate: Number(v),
                                          },
                                          ...env.displays.slice(1),
                                        ],
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-8 bg-black/40 border-white/10 text-white text-xs">
                                      <SelectValue placeholder="Refresh Rate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="60">60Hz</SelectItem>
                                      <SelectItem value="120">120Hz</SelectItem>
                                      <SelectItem value="144">144Hz</SelectItem>
                                      <SelectItem value="165">165Hz</SelectItem>
                                      <SelectItem value="240">240Hz</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Connectivity */}
                                <div>
                                  <label className="block text-[11px] text-gray-400 mb-1">
                                    Connectivity
                                  </label>
                                  <Select
                                    value={
                                      environment.displays[0]?.connection ||
                                      "HDMI 2.0"
                                    }
                                    onValueChange={(v) =>
                                      setEnvironment((env) => ({
                                        ...env,
                                        displays: [
                                          {
                                            ...env.displays[0],
                                            connection: v,
                                          },
                                          ...env.displays.slice(1),
                                        ],
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-8 bg-black/40 border-white/10 text-white text-xs">
                                      <SelectValue placeholder="Connectivity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="HDMI 2.0">
                                        HDMI 2.0
                                      </SelectItem>
                                      <SelectItem value="HDMI 2.1">
                                        HDMI 2.1
                                      </SelectItem>
                                      <SelectItem value="DisplayPort 1.4">
                                        DisplayPort 1.4
                                      </SelectItem>
                                      <SelectItem value="DisplayPort 2.0">
                                        DisplayPort 2.0
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expert Build Comments (World-Class Dynamic) */}
                    {getSelectedComponentsCount >= 3 &&
                      generateBuildComments.length > 0 &&
                      (() => {
                        const all = generateBuildComments;
                        const meta = generateBuildMeta();
                        const basic = all.filter((c) => !c.startsWith("ADV:"));
                        const advanced = all
                          .filter((c) => c.startsWith("ADV:"))
                          .map((c) =>
                            c.replace(/^ADV:\s*/, "").replace(/^ADV:/, "")
                          );
                        const basicLimit =
                          insightMode === "standard"
                            ? Math.min(5, basic.length)
                            : basic.length;
                        const gradeClass =
                          meta.grade === "A"
                            ? "bg-green-500/20 border-green-500/40 text-green-200"
                            : meta.grade === "B"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                            : meta.grade === "C"
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                            : meta.grade === "D"
                            ? "bg-orange-500/20 border-orange-500/40 text-orange-200"
                            : meta.grade === "E"
                            ? "bg-red-500/20 border-red-500/40 text-red-200"
                            : "bg-red-700/30 border-red-700/50 text-red-100";
                        const copyInsightSummary = async () => {
                          const summaryText =
                            `Kevin's Insight - ${meta.profile}\n` +
                            `Synergy Grade: ${meta.grade} (${meta.score}/100)\n\n` +
                            basic.slice(0, basicLimit).join("\n\n") +
                            (showAdvancedInsights && advanced.length > 0
                              ? `\n\nAdvanced Analysis:\n${advanced.join(
                                  "\n\n"
                                )}`
                              : "");
                          try {
                            await navigator.clipboard.writeText(summaryText);
                            logger.info("Copied to clipboard", {
                              context: "KevinInsight",
                              profile: meta.profile,
                            });
                          } catch (err) {
                            logger.error("Failed to copy Kevin insight", {
                              error: err,
                              profile: meta.profile,
                            });
                          }
                        };

                        // Helper: Determine FPS tier from GPU
                        const getFPSTier = () => {
                          const gpu = selectedComponents.gpu
                            ? (
                                activeComponentData as ComponentDataMap
                              ).gpu?.find(
                                (g) => g.id === selectedComponents.gpu
                              )
                            : null;
                          if (!gpu || !gpu.name) return null;
                          const gpuName = gpu.name.toLowerCase();
                          const vram = gpu.vram || 0;

                          // RTX 50-series (future-proof)
                          if (
                            gpuName.includes("5090") ||
                            gpuName.includes("5080")
                          )
                            return {
                              tier: "Extreme",
                              fps: "8K 60+ FPS / 4K 240+ FPS",
                              color: "purple",
                            };

                          // RTX 40-series Ultra tier
                          if (
                            gpuName.includes("4090") ||
                            gpuName.includes("4080") ||
                            (gpuName.includes("4070") &&
                              gpuName.includes("ti super"))
                          )
                            return {
                              tier: "Ultra",
                              fps: "4K 120+ FPS",
                              color: "emerald",
                            };

                          // High tier (1440p kings)
                          if (
                            gpuName.includes("4070") ||
                            gpuName.includes("7900 xtx") ||
                            gpuName.includes("7900xtx")
                          )
                            return {
                              tier: "High",
                              fps: "1440p 144+ FPS",
                              color: "sky",
                            };

                          // Medium tier (1080p/1440p)
                          if (
                            gpuName.includes("4060") ||
                            gpuName.includes("7800") ||
                            gpuName.includes("7700")
                          )
                            return {
                              tier: "Medium",
                              fps: "1080p 144 FPS",
                              color: "blue",
                            };

                          // Fallback: Use VRAM as indicator
                          if (vram >= 20)
                            return {
                              tier: "Extreme",
                              fps: "8K 60+ FPS / 4K 240+ FPS",
                              color: "purple",
                            };
                          if (vram >= 16)
                            return {
                              tier: "Ultra",
                              fps: "4K 120+ FPS",
                              color: "emerald",
                            };
                          if (vram >= 12)
                            return {
                              tier: "High",
                              fps: "1440p 144+ FPS",
                              color: "sky",
                            };
                          if (vram >= 8)
                            return {
                              tier: "Medium",
                              fps: "1080p 144 FPS",
                              color: "blue",
                            };

                          return {
                            tier: "Entry",
                            fps: "1080p 60 FPS",
                            color: "cyan",
                          };
                        };

                        const fpsTier = getFPSTier();

                        return (
                          <TooltipProvider>
                            <div className="relative rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 mt-8">
                              <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(circle_at_center,transparent_20%,black)]" />
                              <div className="relative p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
                                {/* Header: Title */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-sky-600/40 to-blue-700/40 border border-sky-500/40 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-200" />
                                  </div>
                                  <h4 className="text-lg sm:text-xl font-bold text-white">
                                    Kevin's Insight
                                    <sup className="text-sm sm:text-base align-top">
                                      ™
                                    </sup>
                                  </h4>
                                </div>
                                {/* Badges & Progress */}
                                {!insightCompactMode && (
                                  <div className="space-y-2 sm:space-y-3">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span
                                            className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border ${gradeClass} flex items-center gap-2 cursor-help`}
                                          >
                                            Synergy Grade {meta.grade} ·{" "}
                                            {meta.score}/100
                                            <Info className="w-3.5 h-3.5 opacity-60" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p className="text-xs">
                                            <strong>Synergy Grade</strong>{" "}
                                            measures how well your components
                                            work together. A-grade = perfect
                                            harmony, F-grade = bottlenecks or
                                            compatibility issues.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border bg-sky-500/15 border-sky-500/30 text-sky-200 flex items-center gap-2 cursor-help">
                                            Build Type {meta.profile}
                                            <Info className="w-3.5 h-3.5 opacity-60" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p className="text-xs">
                                            <strong>Profile</strong> categorizes
                                            your build type: Gaming Powerhouse,
                                            Workstation Beast, Balanced
                                            All-Rounder, Entry Gaming, or
                                            Unclassified.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <div className="pt-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-gray-300">
                                          Harmony Score
                                        </span>
                                        <span className="text-sm font-bold text-sky-400">
                                          {meta.score}/100
                                        </span>
                                      </div>
                                      <Progress
                                        value={meta.score}
                                        className="h-2.5 bg-white/10"
                                      />
                                    </div>
                                    {/* Benchmark Micro-Blocks */}
                                    {fpsTier && (
                                      <div className="grid grid-cols-1 gap-2 pt-2">
                                        <div
                                          className={`p-2 rounded-lg border bg-${fpsTier.color}-500/10 border-${fpsTier.color}-500/30`}
                                        >
                                          <div
                                            className={`text-[10px] sm:text-xs font-semibold text-${fpsTier.color}-300`}
                                          >
                                            {fpsTier.tier} Performance
                                          </div>
                                          <div
                                            className={`text-[10px] sm:text-xs text-${fpsTier.color}-200/80 mt-0.5`}
                                          >
                                            {fpsTier.fps}
                                          </div>
                                        </div>
                                        <div className="p-2 rounded-lg border bg-purple-500/10 border-purple-500/30">
                                          <div className="text-[10px] sm:text-xs font-semibold text-purple-300">
                                            Workload Suitability
                                          </div>
                                          <div className="text-[10px] sm:text-xs text-purple-200/80 mt-0.5">
                                            {meta.grade <= "B"
                                              ? "Gaming + Creative"
                                              : "Gaming Focus"}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {/* PHASE 2: Visual Performance Bars & Bottleneck Indicators */}
                                    {(() => {
                                      const cpu = activeComponentData.cpu?.find(
                                        (c) => c.id === selectedComponents.cpu
                                      );
                                      const gpu = activeComponentData.gpu?.find(
                                        (c) => c.id === selectedComponents.gpu
                                      );
                                      const ram = activeComponentData.ram?.find(
                                        (c) => c.id === selectedComponents.ram
                                      );

                                      const cpuScore = cpu
                                        ? Math.min(
                                            95,
                                            ((cpu.cores || 4) / 16) * 100
                                          )
                                        : 0;
                                      const gpuScore = gpu
                                        ? Math.min(
                                            95,
                                            ((gpu.vram || 4) / 24) * 100
                                          )
                                        : 0;
                                      const ramScore = ram
                                        ? Math.min(
                                            95,
                                            ((ram.capacity || 8) / 128) * 100
                                          )
                                        : 0;

                                      const hasBottleneck =
                                        (gpuScore > 70 && cpuScore < 40) ||
                                        (cpuScore > 70 && gpuScore < 40) ||
                                        (gpuScore > 70 && ramScore < 50);

                                      if (cpu && gpu) {
                                        return (
                                          <div className="pt-2 sm:pt-3 space-y-2">
                                            <div className="text-[10px] sm:text-xs font-semibold text-gray-300 flex items-center gap-1.5 sm:gap-2">
                                              <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                              Component Balance
                                            </div>
                                            {/* CPU Bar */}
                                            <div className="space-y-1">
                                              <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">
                                                  CPU
                                                </span>
                                                <span
                                                  className={
                                                    cpuScore < 40
                                                      ? "text-orange-400"
                                                      : cpuScore < 70
                                                      ? "text-yellow-400"
                                                      : "text-green-400"
                                                  }
                                                >
                                                  {Math.round(cpuScore)}%
                                                </span>
                                              </div>
                                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                  className={`h-full transition-all ${
                                                    cpuScore < 40
                                                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                                                      : cpuScore < 70
                                                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                                                  }`}
                                                  style={{
                                                    width: `${Math.max(
                                                      5,
                                                      cpuScore
                                                    )}%`,
                                                  }}
                                                />
                                              </div>
                                            </div>
                                            {/* GPU Bar */}
                                            <div className="space-y-1">
                                              <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">
                                                  GPU
                                                </span>
                                                <span
                                                  className={
                                                    gpuScore < 40
                                                      ? "text-orange-400"
                                                      : gpuScore < 70
                                                      ? "text-yellow-400"
                                                      : "text-green-400"
                                                  }
                                                >
                                                  {Math.round(gpuScore)}%
                                                </span>
                                              </div>
                                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                  className={`h-full transition-all ${
                                                    gpuScore < 40
                                                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                                                      : gpuScore < 70
                                                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                                                  }`}
                                                  style={{
                                                    width: `${Math.max(
                                                      5,
                                                      gpuScore
                                                    )}%`,
                                                  }}
                                                />
                                              </div>
                                            </div>
                                            {/* RAM Bar */}
                                            {ram && (
                                              <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                  <span className="text-gray-400">
                                                    RAM
                                                  </span>
                                                  <span
                                                    className={
                                                      ramScore < 40
                                                        ? "text-orange-400"
                                                        : ramScore < 70
                                                        ? "text-yellow-400"
                                                        : "text-green-400"
                                                    }
                                                  >
                                                    {Math.round(ramScore)}%
                                                  </span>
                                                </div>
                                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                  <div
                                                    className={`h-full transition-all ${
                                                      ramScore < 40
                                                        ? "bg-gradient-to-r from-orange-500 to-red-500"
                                                        : ramScore < 70
                                                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                                                    }`}
                                                    style={{
                                                      width: `${Math.max(
                                                        5,
                                                        ramScore
                                                      )}%`,
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            )}
                                            {/* Bottleneck Warning */}
                                            {hasBottleneck && (
                                              <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 mt-2">
                                                <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-orange-300 leading-relaxed">
                                                  <strong>
                                                    Bottleneck detected:
                                                  </strong>{" "}
                                                  {gpuScore > cpuScore + 30
                                                    ? "Your GPU may be limited by CPU"
                                                    : cpuScore > gpuScore + 30
                                                    ? "Your CPU may be underutilized"
                                                    : "RAM capacity may limit performance"}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}
                                {/* Row 3: Action Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="col-span-1 sm:col-span-2 h-8 sm:h-9 text-xs sm:text-sm font-medium border-sky-500/40 bg-gradient-to-r from-sky-500/10 to-blue-500/10 text-sky-200 hover:from-sky-500/20 hover:to-blue-500/20 hover:border-sky-400/60 transition-all"
                                          onClick={copyInsightSummary}
                                        >
                                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                                          Copy Summary
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="bg-slate-900 border-slate-700"
                                      >
                                        <p className="text-xs">
                                          Copy full insight analysis to
                                          clipboard
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 sm:h-9 text-xs sm:text-sm font-medium border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-200 hover:from-purple-500/20 hover:to-indigo-500/20 hover:border-purple-400/60 transition-all"
                                          onClick={() =>
                                            setInsightMode((m) =>
                                              m === "standard"
                                                ? "pro"
                                                : "standard"
                                            )
                                          }
                                        >
                                          {insightMode === "standard" ? (
                                            <>
                                              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                                              Pro Detail
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                                              Simple
                                            </>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="bg-slate-900 border-slate-700"
                                      >
                                        <p className="text-xs">
                                          {insightMode === "standard"
                                            ? "Show all insights (no limit)"
                                            : "Show top 5 insights only"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {advanced.length > 0 && (
                                    <TooltipProvider delayDuration={100}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 sm:h-9 text-xs sm:text-sm font-medium border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-200 hover:from-blue-500/20 hover:to-cyan-500/20 hover:border-blue-400/60 transition-all"
                                            onClick={() =>
                                              setShowAdvancedInsights((v) => !v)
                                            }
                                          >
                                            {showAdvancedInsights ? (
                                              <>
                                                <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                                                <span className="hidden xs:inline">
                                                  Hide{" "}
                                                </span>
                                                Technical
                                                <span className="hidden xs:inline">
                                                  {" "}
                                                  Details
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                                                <span className="hidden xs:inline">
                                                  Show{" "}
                                                </span>
                                                Technical
                                                <span className="hidden xs:inline">
                                                  {" "}
                                                  Details
                                                </span>{" "}
                                                ({advanced.length})
                                              </>
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="top"
                                          className="bg-slate-900 border-slate-700 max-w-xs"
                                        >
                                          <p className="text-xs">
                                            {showAdvancedInsights
                                              ? "Hide in-depth technical diagnostics (memory channels, PCIe lanes, thermal predictions, etc.)"
                                              : "View detailed technical analysis including component compatibility checks, upgrade paths, and performance optimization tips"}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                {/* Expand/Collapse button for insight section */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-8 sm:h-9 text-xs sm:text-sm font-medium border-sky-500/40 bg-gradient-to-r from-sky-500/10 to-blue-500/10 text-sky-200 hover:from-sky-500/20 hover:to-blue-500/20 hover:border-sky-400/60 transition-all"
                                  onClick={() =>
                                    setInsightCompactMode((v) => !v)
                                  }
                                >
                                  {insightCompactMode ? (
                                    <>
                                      <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                      Expand Insight
                                    </>
                                  ) : (
                                    <>
                                      <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                      Collapse Insight
                                    </>
                                  )}
                                </Button>
                                {/* Row 4: Summary (conditional on compact mode) */}
                                {!insightCompactMode && (
                                  <div className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                                    Balanced component pairing, contextual
                                    performance & upgrade foresight. Refined for
                                    clarity.
                                  </div>
                                )}
                                {!insightCompactMode && (
                                  <Separator className="border-white/10" />
                                )}
                                {/* Content Section */}
                                <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-sky-500/40 hover:scrollbar-thumb-sky-500/60 pr-1">
                                  {basic
                                    .slice(0, basicLimit)
                                    .map((comment, idx) => (
                                      <div
                                        key={idx}
                                        className="group p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:border-sky-500/40 transition-colors"
                                      >
                                        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                                          {comment}
                                        </p>
                                      </div>
                                    ))}
                                  {showAdvancedInsights &&
                                    advanced.length > 0 && (
                                      <div className="pt-2 sm:pt-3 mt-2 border-t border-blue-500/30 space-y-2 sm:space-y-3">
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                                          <span className="text-[10px] sm:text-xs font-semibold text-blue-300 tracking-wide uppercase">
                                            Technical Details
                                          </span>
                                          <Badge className="ml-auto text-[10px] sm:text-xs bg-blue-500/20 border-blue-500/40 text-blue-300 whitespace-nowrap">
                                            For Tech Enthusiasts
                                          </Badge>
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-blue-200/70 italic mb-2">
                                          Advanced diagnostics covering memory
                                          configuration, PCIe bandwidth, thermal
                                          predictions, overclocking potential,
                                          display connectivity, and more.
                                        </div>
                                        {advanced.map((comment, idx) => (
                                          <div
                                            key={`adv-${idx}`}
                                            className="group p-2 sm:p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:border-blue-400/40 transition-colors"
                                          >
                                            <p className="text-[10px] sm:text-xs text-blue-100 leading-relaxed">
                                              {comment}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          </TooltipProvider>
                        );
                      })()}

                    {/* Compatibility Status */}
                    {compatibilityIssues.length > 0 && (
                      <Alert className="border-yellow-500/20 bg-yellow-500/10">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <AlertDescription className="text-yellow-300">
                          {compatibilityIssues.length} compatibility{" "}
                          {compatibilityIssues.length === 1
                            ? "issue"
                            : "issues"}{" "}
                          detected
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </Card>

              {/* Category Navigation */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 sm:p-6 lg:block">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  Components
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = activeCategory === category.id;
                    const hasComponent =
                      selectedComponents[
                        category.id as keyof SelectedComponentIds
                      ];

                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setCategoryPages((prev) => ({
                            ...prev,
                            [activeCategory]: currentPage,
                          }));
                          setActiveCategory(
                            category.id as keyof SelectedComponentIds
                          );
                        }}
                        className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                          isSelected
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "hover:bg-white/10 text-gray-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium truncate">
                            {category.label}
                          </span>
                          {hasComponent && (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs flex-shrink-0"
                        >
                          {category.count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div
              ref={buildSectionRef}
              className="lg:col-span-3 space-y-6 order-1 lg:order-2"
            >
              {/* Global Search Bar - Search All Components */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Search all components across every category..."
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12 text-base"
                    style={{ paddingLeft: "35px", paddingRight: "40px" }}
                  />
                  {globalSearchQuery && (
                    <button
                      onClick={() => setGlobalSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {globalSearchQuery && (
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-2 text-gray-300">
                      <Checkbox
                        checked={limitToRelevantCategory}
                        onCheckedChange={(v) =>
                          setLimitToRelevantCategory(Boolean(v))
                        }
                        className="border-white/30"
                      />
                      <span>Show only most relevant category</span>
                    </label>
                  </div>
                )}
                {globalSearchQuery && (
                  <div className="mt-2 text-sm text-gray-400">
                    <span className="text-sky-400 font-medium">
                      Searching across all categories:
                    </span>{" "}
                    Found {userFilteredComponents.length} result
                    {userFilteredComponents.length !== 1 ? "s" : ""}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(() => {
                        const counts: Record<string, number> = {};
                        for (const comp of userFilteredComponents) {
                          const catVal = getVal(comp, "category");
                          const cat =
                            typeof catVal === "string" ? catVal : "unknown";
                          counts[cat] = (counts[cat] || 0) + 1;
                        }
                        const order = [
                          "case",
                          "motherboard",
                          "cpu",
                          "gpu",
                          "ram",
                          "storage",
                          "psu",
                          "cooling",
                        ];
                        const labelMap: Record<string, string> = {
                          case: "Case",
                          motherboard: "Motherboard",
                          cpu: "CPU",
                          gpu: "GPU",
                          ram: "RAM",
                          storage: "Storage",
                          psu: "PSU",
                          cooling: "Cooling",
                        };
                        const items = Object.entries(counts)
                          .filter(([, n]) => n > 0)
                          .sort(
                            (a, b) => order.indexOf(a[0]) - order.indexOf(b[0])
                          );
                        return items.map(([cat, n]) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setCategoryPages((prev) => ({
                                ...prev,
                                [activeCategory]: currentPage,
                              }));
                              setActiveCategory(
                                cat as keyof SelectedComponentIds
                              );
                              // Clear global search when navigating via chips
                              setGlobalSearchQuery("");
                              buildSectionRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }}
                            className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/15 px-3 py-1 text-xs text-sky-300 hover:bg-sky-500/25 hover:border-sky-500/60 transition-colors"
                          >
                            {labelMap[cat] ?? cat}: {n}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </Card>

              {/* Build Overview - Selected Components Display */}
              {Object.keys(selectedComponents).length > 0 && (
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
                    {Object.entries(selectedComponents).map(
                      ([category, componentId]) => {
                        const component = (
                          activeComponentData as ComponentDataMap
                        )[category as keyof ComponentDataMap]?.find(
                          (c) => c.id === componentId
                        );

                        if (!component) return null;

                        const categoryLabel = getCategoryLabel(category);
                        const image = getComponentImage(component);

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
                                    <p className="text-sm text-gray-400">
                                      {component.brand}
                                    </p>
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
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {component.cores} Cores
                                    </Badge>
                                  )}
                                  {category === "gpu" && component.vram && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {component.vram}GB VRAM
                                    </Badge>
                                  )}
                                  {category === "ram" && component.capacity && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {component.capacity}GB
                                    </Badge>
                                  )}
                                  {category === "psu" && component.wattage && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {component.wattage}W
                                    </Badge>
                                  )}
                                  {category === "storage" &&
                                  component.storageCapacity ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
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
                                      {component.inStock
                                        ? "In Stock"
                                        : "Out of Stock"}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Price & Actions */}
                              <div className="sm:col-span-3 flex flex-col items-end gap-3">
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-white">
                                    £{(component.price ?? 0).toFixed(0)}
                                  </div>
                                  {component.rating && (
                                    <div className="flex items-center gap-1 text-sm text-yellow-400 justify-end mt-1">
                                      <span>★</span>
                                      <span>{component.rating}/5</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 w-full">
                                  <Button
                                    onClick={() => {
                                      setCategoryPages((prev) => ({
                                        ...prev,
                                        [activeCategory]: currentPage,
                                      }));
                                      setActiveCategory(
                                        category as keyof SelectedComponentIds
                                      );
                                      // Scroll to build section
                                      requestAnimationFrame(() => {
                                        buildSectionRef.current?.scrollIntoView(
                                          {
                                            behavior: "smooth",
                                            block: "start",
                                          }
                                        );
                                      });
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 w-full"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Swap Component
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      const newComponents = {
                                        ...selectedComponents,
                                      };
                                      delete newComponents[
                                        category as keyof SelectedComponentIds
                                      ];
                                      setSelectedComponents(newComponents);
                                    }}
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
                      }
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      onClick={handleCheckoutWithCompatibility}
                      className="flex-1 min-w-[200px] bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white h-12"
                      disabled={getSelectedComponentsCount === 0}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </Button>

                    <Button
                      onClick={handleClearBuild}
                      variant="outline"
                      className="flex-1 min-w-[150px] border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 h-12"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Build
                    </Button>

                    <Button
                      onClick={async () => {
                        logger.debug("Share Build button clicked");
                        try {
                          const base = window.location.href.split("?")[0];
                          const shareUrl = buildFullShareUrl(
                            base,
                            selectedComponents,
                            selectedPeripherals
                          );

                          if (shareUrl === base) {
                            toast.warning("Select parts to share your build.");
                            return;
                          }

                          if (
                            navigator.clipboard &&
                            navigator.clipboard.writeText
                          ) {
                            await navigator.clipboard.writeText(shareUrl);
                            toast.success("Build link copied to clipboard! 🎉");

                            try {
                              const userId =
                                sessionStorage.getItem("vortex_user_id");
                              const buildTotalPrice = getTotalPrice;
                              trackClick(
                                "build_share",
                                {
                                  shareUrl,
                                  totalPrice: buildTotalPrice,
                                  componentsCount:
                                    Object.keys(selectedComponents).length,
                                },
                                userId || undefined
                              );
                              trackClick(
                                "build_complete",
                                {
                                  totalPrice: buildTotalPrice,
                                  componentsCount:
                                    Object.keys(selectedComponents).length,
                                  peripheralsCount:
                                    Object.keys(selectedPeripherals).length,
                                },
                                userId || undefined
                              );
                            } catch (err) {
                              logger.error(
                                "Failed to track build completion",
                                err
                              );
                            }
                          }
                        } catch (e) {
                          logger.error("Failed to copy build link:", e);
                          toast.error("Failed to copy build link.");
                        }
                      }}
                      variant="secondary"
                      className="flex-1 min-w-[150px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 h-12"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Build
                    </Button>

                    <Button
                      onClick={handleSaveForComparison}
                      variant="secondary"
                      className="flex-1 min-w-[200px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 h-12"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save for Comparison
                    </Button>

                    {savedBuildsForComparison.length > 0 && (
                      <Button
                        onClick={() => setShowComparisonModal(true)}
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
                            {8 - Object.keys(selectedComponents).length} more
                            component
                            {8 - Object.keys(selectedComponents).length > 1
                              ? "s"
                              : ""}{" "}
                            to complete your build.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

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
                          <div className="text-sm text-gray-300 mb-2">
                            Search
                          </div>
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
                            <div className="text-sm text-gray-300 mb-2">
                              Brand
                            </div>
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
                                setPriceRange([
                                  Number(vals[0]),
                                  Number(vals[1]),
                                ])
                              }
                            />
                          </div>
                        )}

                        {/* Category-specific options */}
                        {Object.keys(optionFilterValues).length > 0 && (
                          <div className="space-y-4">
                            {(
                              CATEGORY_OPTION_FILTERS[activeCategory] || []
                            ).map((def) => {
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
                            })}
                          </div>
                        )}

                        {/* Category-specific ranges */}
                        {Object.keys(rangeFilterBounds).length > 0 && (
                          <div className="space-y-4">
                            {(CATEGORY_RANGE_FILTERS[activeCategory] || []).map(
                              (def) => {
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
                              }
                            )}
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
              {viewMode === "grid" ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6 items-start">
                  {paginatedComponents.map((component) => (
                    <MemoComponentCard
                      key={(component as PCBuilderComponent).id}
                      component={component as PCBuilderComponent}
                      category={activeCategory}
                      isSelected={
                        selectedComponents[activeCategory] ===
                        (component as PCBuilderComponent).id
                      }
                      onSelect={handleComponentSelect}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedComponents.map((component) => (
                    <MemoComponentCard
                      key={(component as PCBuilderComponent).id}
                      component={component as PCBuilderComponent}
                      category={activeCategory}
                      isSelected={
                        selectedComponents[activeCategory] ===
                        (component as PCBuilderComponent).id
                      }
                      onSelect={handleComponentSelect}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}

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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      sortedComponents.length
                    )}{" "}
                    of {sortedComponents.length} components
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setCurrentPage((prev) => Math.max(1, prev - 1));
                        buildSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              onClick={() => {
                                setCurrentPage(pageNum);
                                buildSectionRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              }}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              className={
                                currentPage === pageNum
                                  ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-0 min-w-[40px]"
                                  : "border-white/20 bg-white/10 text-white hover:bg-white/20 min-w-[40px]"
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        setCurrentPage((prev) =>
                          Math.min(totalPages, prev + 1)
                        );
                        buildSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Peripherals Section */}
          <div className="mt-8 sm:mt-16 max-w-[1503px] mx-auto w-full">
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
                Complete your setup with premium keyboards, mice, displays,
                audio, and software - engineered for gamers, creators, and
                professionals who demand comfort, low latency, and reliable
                performance.
              </p>
            </div>

            <Tabs defaultValue="keyboard" className="space-y-6 sm:space-y-8">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 bg-white/10 backdrop-blur-xl p-2 rounded-xl gap-2 h-auto">
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
                <TabsTrigger
                  value="software"
                  className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">OS</span>
                  <span className="sm:hidden">OS</span>
                </TabsTrigger>
                <TabsTrigger
                  value="headset"
                  className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
                >
                  <Headphones className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Headsets</span>
                  <span className="sm:hidden">Head</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cable"
                  className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
                >
                  <Cable className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Cables</span>
                  <span className="sm:hidden">Cable</span>
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
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOptionalExtrasData.keyboard.map(
                    (keyboard: PCOptionalExtra) => (
                      <MemoPeripheralCard
                        key={keyboard.id}
                        peripheral={keyboard}
                        category="keyboard"
                        isSelected={(
                          selectedPeripherals.keyboard || []
                        ).includes((keyboard as PCOptionalExtra).id)}
                        onToggle={handlePeripheralToggle}
                        viewMode={viewMode}
                      />
                    )
                  )}
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
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOptionalExtrasData.mouse.map(
                    (mouse: PCOptionalExtra) => (
                      <MemoPeripheralCard
                        key={mouse.id}
                        peripheral={mouse}
                        category="mouse"
                        isSelected={(selectedPeripherals.mouse || []).includes(
                          (mouse as PCOptionalExtra).id
                        )}
                        onToggle={handlePeripheralToggle}
                        viewMode={viewMode}
                      />
                    )
                  )}
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
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOptionalExtrasData.monitor.map(
                    (monitor: PCOptionalExtra) => (
                      <MemoPeripheralCard
                        key={monitor.id}
                        peripheral={monitor}
                        category="monitor"
                        isSelected={(
                          selectedPeripherals.monitor || []
                        ).includes((monitor as PCOptionalExtra).id)}
                        onToggle={handlePeripheralToggle}
                        viewMode={viewMode}
                      />
                    )
                  )}
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
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOptionalExtrasData.gamepad.map(
                    (gamepad: PCOptionalExtra) => (
                      <MemoPeripheralCard
                        key={gamepad.id}
                        peripheral={gamepad}
                        category="gamepad"
                        isSelected={(
                          selectedPeripherals.gamepad || []
                        ).includes((gamepad as PCOptionalExtra).id)}
                        onToggle={handlePeripheralToggle}
                        viewMode={viewMode}
                      />
                    )
                  )}
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
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOptionalExtrasData.mousepad.map(
                    (mousepad: PCOptionalExtra) => (
                      <MemoPeripheralCard
                        key={mousepad.id}
                        peripheral={mousepad}
                        category="mousepad"
                        isSelected={(
                          selectedPeripherals.mousepad || []
                        ).includes((mousepad as PCOptionalExtra).id)}
                        onToggle={handlePeripheralToggle}
                        viewMode={viewMode}
                      />
                    )
                  )}
                </div>
              </TabsContent>

              {/* Software / Operating System */}
              <TabsContent value="software" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      Operating System
                    </h3>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">
                      Choose Windows edition for your build
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-sm self-start sm:self-auto"
                  >
                    {(selectedPeripherals.software || []).length} selected
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(activeOptionalExtrasData.software || []).map((software) => (
                    <MemoPeripheralCard
                      key={(software as PCOptionalExtra).id}
                      peripheral={software as PCOptionalExtra}
                      category="software"
                      isSelected={(selectedPeripherals.software || []).includes(
                        (software as PCOptionalExtra).id
                      )}
                      onToggle={handlePeripheralToggle}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Headsets */}
              <TabsContent value="headset" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      Gaming Headsets
                    </h3>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">
                      Immersive audio for gaming and communication
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-sm self-start sm:self-auto"
                  >
                    {(selectedPeripherals.headset || []).length} selected
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(activeOptionalExtrasData.headset || []).map(
                    (headset: PCOptionalExtra) => (
                      <MemoPeripheralCard
                        key={headset.id}
                        peripheral={headset}
                        category="headset"
                        isSelected={(
                          selectedPeripherals.headset || []
                        ).includes((headset as PCOptionalExtra).id)}
                        onToggle={handlePeripheralToggle}
                        viewMode={viewMode}
                      />
                    )
                  )}
                </div>
              </TabsContent>

              {/* Cables */}
              <TabsContent value="cable" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      Cables & Accessories
                    </h3>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">
                      Essential cables and connectivity solutions
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-sm self-start sm:self-auto"
                  >
                    {(selectedPeripherals.cable || []).length} selected
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(activeOptionalExtrasData.cable || []).map(
                    (cable: PCOptionalExtra) => (
                      <MemoPeripheralCard
                        key={cable.id}
                        peripheral={cable}
                        category="cable"
                        isSelected={(selectedPeripherals.cable || []).includes(
                          (cable as PCOptionalExtra).id
                        )}
                        onToggle={handlePeripheralToggle}
                        viewMode={viewMode}
                      />
                    )
                  )}
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
                ).map((detail, index) => (
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
                                <p className="text-sm text-amber-200">
                                  {issue}
                                </p>
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
                  className="bg-sky-600 hover:bg-sky-500 text-white"
                >
                  Got it, thanks!
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Build Details Modal */}
          {showBuildDetailsModal && (
            <BuildDetailsModal
              isOpen={showBuildDetailsModal}
              onClose={() => setShowBuildDetailsModal(false)}
              recommendedBuild={recommendedBuild}
              selectedComponents={selectedComponents}
              componentData={activeComponentData}
            />
          )}

          {/* Enthusiast Builder Modal */}
          {showEnthusiastBuilder && (
            <Suspense fallback={<div />}>
              <EnthusiastBuilder
                isOpen={showEnthusiastBuilder}
                onClose={() => setShowEnthusiastBuilder(false)}
              />
            </Suspense>
          )}

          {/* Build Comparison Modal */}
          {showComparisonModal && (
            <Suspense fallback={<div />}>
              <BuildComparisonModal
                open={showComparisonModal}
                onClose={() => setShowComparisonModal(false)}
                builds={savedBuildsForComparison}
                onRemoveBuild={handleRemoveBuildFromComparison}
                componentData={activeComponentData}
                optionalExtrasData={activeOptionalExtrasData}
              />
            </Suspense>
          )}

          {/* Product Comparison Modal */}
          {showProductComparison && compareProducts.length > 0 && (
            <Suspense fallback={<div />}>
              <ProductComparison
                products={compareProducts}
                onRemove={handleRemoveFromComparison}
                onClear={handleClearComparison}
                onAddToCart={handleAddComparisonToCart}
                category={activeCategory}
              />
            </Suspense>
          )}

          {/* Floating Compare Button */}
          {compareProducts.length > 0 && !showProductComparison && (
            <div className="fixed bottom-6 right-6 z-40">
              <Button
                onClick={() => setShowProductComparison(true)}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-2xl rounded-full px-6 py-6 flex items-center gap-3 animate-pulse hover:animate-none"
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span className="font-semibold">
                  Compare ({compareProducts.length})
                </span>
                {compareProducts.length >= 2 && (
                  <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                    Ready
                  </Badge>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ComponentErrorBoundary>
  );
}
