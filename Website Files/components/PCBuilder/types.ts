import { PCComponent } from "../../services/cms";

/**
 * PCBuilder Type Definitions
 * Extracted from PCBuilder.tsx for better organization
 */

export interface PCBuilderComponent {
  id: string;
  name?: string;
  price?: number | null;
  brand?: string;
  model?: string;
  category?: string;
  socket?: string;
  chipset?: string;
  generation?: string;
  ramSupport?: string;
  maxRam?: number | null;
  ramSlots?: number;
  cores?: number;
  threads?: number;
  tdp?: number;
  vram?: number;
  power?: number;
  length?: number;
  wattage?: number;
  capacity?: number | null;
  type?: string;
  interface?: string;
  speed?: string | number;
  efficiency?: string;
  radiatorSize?: string | number;
  coolerType?: string;
  height?: number;
  tdpSupport?: number;
  maxGpuLength?: number | null;
  maxCpuCoolerHeight?: number;
  maxPsuLength?: number;
  formFactor?: string;
  platform?: string;
  description?: string;
  mainDescription?: string;
  features?: string[] | null;
  compatibility?: string[] | string;
  gpuClearance?: string;
  coolingSupport?: string;
  style?: string;
  pciSlots?: number;
  m2Slots?: number;
  colour?: string;
  color?: string | null;
  fanSize?: number;
  rgbLighting?: boolean;
  modules?: number;
  latency?: number;
  driveType?: string;
  readSpeed?: number;
  writeSpeed?: number;
  nand?: string | null;
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
