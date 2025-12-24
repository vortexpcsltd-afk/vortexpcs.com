export type BuilderState = {
  initialized: boolean;
};
import { PCComponent } from "../../services/cms";

/**
 * PCBuilder Type Definitions
 * Extracted from PCBuilder.tsx for better organization
 */

import type { Document } from "@contentful/rich-text-types";

export interface PCBuilderComponent {
  id: string;
  name?: string;
  price?: number | null;
  brand?: string;
  brandLogo?: string;
  model?: string;
  category?: string;
  socket?: string;
  chipset?: string;
  cpuCompatability?: string | string[];
  processorFamily?: string;
  processorGeneration?: string;
  processorOperatingModes?: string | string[];
  processorCache?: string | number;
  performanceCores?: number;
  efficientCores?: number;
  integratedGraphics?: boolean;
  onBoardGraphicsCardModel?: string;
  generation?: string;
  ramSupport?: string | string[];
  maxRam?: number | null;
  ramSlots?: number;
  cores?: number;
  threads?: number;
  tdp?: number;
  baseClock?: number;
  boostClock?: number;
  basePower?: number; // CPU base power from CMS
  processorBasePower?: number; // Alternate CPU base power field
  maximumTurboPower?: number; // CPU max turbo power
  coolerIncluded?: boolean;
  vram?: number;
  power?: number;
  powerConsumption?: number; // Explicit power draw from CMS
  powerDraw?: number; // Alternate field name if present
  length?: number;
  wattage?: number;
  capacity?: number | null;
  type?: string;
  size?: string | number | string[];
  storage?: string | number | string[];
  interface?: string;
  speed?: string | number;
  voltage?: number;
  efficiency?: string;
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
  description?: string;
  mainDescription?: string | Document;
  mainProductDescription?: string | Document;
  features?: string[] | null;
  compatibility?: string[] | string;
  gpuClearance?: string;
  coolingSupport?: string;
  colourOptions?: string[] | string;
  style?: string;
  pciSlots?: number;
  m2Slots?: number;
  colour?: string;
  color?: string | null;
  frontPanelPorts?: string | string[];
  fanSize?: number;
  rgbLighting?: boolean;
  modules?: number;
  latency?: number;
  compliance?: string;
  pins?: number;
  casLatency?: number | string;
  timings?: string;
  intelXmpCertified?: boolean | string;
  dataIntegrityCheck?: string | boolean;
  heatsink?: boolean;
  rgb?: boolean;
  driveType?: string;
  readSpeed?: number;
  writeSpeed?: number;
  nand?: string | null;
  storageMtbf?: number;
  totalBytesWritten?: number;
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
  imagesByOption?: Record<string, Record<string, string[]>>;
  pricesByOption?: Record<
    string,
    Record<string, number | { price: number; ean?: string }>
  >;
  rating?: number;
  ean?: string;
  performance?: string;
  internalIOConnectors?: string[];
  backPanelIOPorts?: string[];
  chipsetManufacturer?: string;
  graphicsChipset?: string;
  memorySize?: string | number;
  memoryType?: string;
  cudaCores?: number;
  gpuBaseClock?: number;
  gpuBoostClock?: number;
  outputs?: string | string[];
  maxDisplaySupport?: number | string;
  powerConnecters?: string[];
  gpuCooling?: string;
  psuRequirements?: string;
  connectorsRequired?: string | string[];
  psuCompatibility?: string;
  connectors?: string[];
  pfc?: string | boolean;
  acInput?: string;
  fanType?: string;
  fanBearing?: string;
  maxCertification?: string;
  mtbf?: number;
  protection?: string[];
  connector?: string;
  ledType?: string;
  rpm?: number;
  airflow?: number | string;
  noiseLevel?: number;
  fanCount?: number;
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

export type CategoryKey = keyof SelectedComponentIds;
export type AnyComponent = PCBuilderComponent | PCComponent;

export interface ComponentDataMap {
  case?: AnyComponent[];
  motherboard?: AnyComponent[];
  cpu?: AnyComponent[];
  gpu?: AnyComponent[];
  ram?: AnyComponent[];
  storage?: AnyComponent[];
  psu?: AnyComponent[];
  cooling?: AnyComponent[];
  [key: string]: AnyComponent[] | undefined;
}

export interface RecommendedBuildSpec {
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

export interface CompatibilityIssue {
  severity: "critical" | "warning";
  title: string;
  description: string;
  recommendation: string;
  affectedComponents: string[];
}

export type ImageRef = string | { url?: string; src?: string };

export interface PCBuilderProps {
  recommendedBuild?: RecommendedBuildSpec | null;
  onAddToCart?: (item: PCBuilderComponent) => void;
  onOpenCart?: () => void;
}
