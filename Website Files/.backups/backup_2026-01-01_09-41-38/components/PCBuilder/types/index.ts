/**
 * PCBuilder Type Definitions
 * Centralized types extracted from the main PCBuilder component
 * Supports modular component structure and better IDE support
 */

/**
 * Main PC component data structure
 * Represents all possible fields across all component categories
 * (CPU, GPU, RAM, Motherboard, PSU, Case, Cooling, Storage)
 */
export interface PCBuilderComponent {
  id: string;
  sku?: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  badges?: string[];
  description?: string;
  shortDescription?: string;
  images?: Array<{ url?: string; src?: string }>;
  imagesByOption?: Record<
    string,
    string | Array<{ url?: string; src?: string }>
  >;
  pricesByOption?: Record<string, number>;
  ean?: string;
  specs?: Record<string, unknown>;

  // CPU-specific
  cores?: number;
  threads?: number;
  baseClockGhz?: number;
  boostClockGhz?: number;
  tdp?: number;
  cache?: string;
  socket?: string;
  cpuGeneration?: number;
  integratedGraphics?: string;

  // GPU-specific
  vram?: number;
  vramType?: string;
  cudaCores?: number;
  boostClockMhz?: number;
  memoryClockMhz?: number;
  memoryBus?: number;
  powerConsumption?: number;
  requiredPowerConnectors?: string[];
  maxDisplays?: number;
  dlssSupport?: boolean;
  raytracingCores?: number;

  // Motherboard-specific
  chipset?: string;
  formFactorMb?: string;
  ramSlots?: number;
  maxRam?: number;
  m2Slots?: number;
  sataSlots?: number;
  pciSlots?: number;
  supportedRamTypes?: string[];
  supportedRamSpeeds?: number[];
  usbPorts?: Record<string, number>;
  audioCodec?: string;
  wifiStandard?: string;
  bluetoothVersion?: string;
  bios?: string;

  // RAM-specific
  capacity?: number;
  speed?: number;
  type?: string;
  voltage?: number;
  cas?: number;
  ecc?: boolean;
  unbuffered?: boolean;
  heatsink?: boolean;
  modules?: number;

  // Storage-specific
  interface?: string;
  storageCapacity?: number;
  readSpeed?: number;
  writeSpeed?: number;
  nand?: string;
  formFactorStorage?: string;
  encryption?: string;
  warranty?: string;

  // Power Supply-specific
  wattage?: number;
  efficiency?: string;
  efficiency80?: string;
  modular?: string;
  psuFanSize?: number;
  connections?: Record<string, number>;
  psuWarranty?: string;
  psuDimension?: string;
  psuWeight?: string;

  // Case-specific
  formFactorCase?: string;
  maxGpuLength?: number;
  maxCpuCoolerHeight?: number;
  maxPsuLength?: number;
  caseCompatibility?: string[];
  frontPanel?: string;
  materialType?: string;
  color?: string;
  features?: string[];
  caseDimension?: string;
  caseWeight?: string;

  // Cooling-specific
  coolerType?: string;
  radiatorSize?: string | number;
  fanCount?: number;
  coolerFanSize?: number;
  noiseLevelDb?: number;
  tdpSupport?: number;
  coolerCompatibility?: string[];
  maxHeight?: number;
  material?: string;
  heatsinkType?: string;
  tubingLength?: string;

  // Rendering/Display
  richTextDescription?: string;
  featureList?: string[];
  thumbnail?: string;
  featured?: boolean;
  specialOffer?: boolean;
  urlSlug?: string;
}

/**
 * PC component type - simplified version used in some contexts
 */
export interface PCComponent {
  id: string;
  name: string;
  price?: number;
  brand?: string;
  [key: string]: unknown;
}

/**
 * Optional extra component (peripherals, software, warranties)
 */
export interface PCOptionalExtra {
  id: string;
  name: string;
  category?: string;
  price?: number;
  brand?: string;
  description?: string;
  images?: string[];
  ean?: string;
  richTextDescription?: string;
  specs?: Record<string, unknown>;
  featured?: boolean;
}

/**
 * Tracks which components are selected for each category
 */
export interface SelectedComponentIds {
  case?: string | null;
  motherboard?: string | null;
  cpu?: string | null;
  ram?: string | null;
  gpu?: string | null;
  storage?: string | null;
  storage2?: string | null;
  psu?: string | null;
  cooling?: string | null;
  caseFans?: string | null;
  [key: string]: string | null | undefined;
}

/**
 * Map of categories to their component arrays
 */
export interface ComponentDataMap {
  case?: PCBuilderComponent[];
  motherboard?: PCBuilderComponent[];
  cpu?: PCBuilderComponent[];
  ram?: PCBuilderComponent[];
  gpu?: PCBuilderComponent[];
  storage?: PCBuilderComponent[];
  storage2?: PCBuilderComponent[];
  psu?: PCBuilderComponent[];
  cooling?: PCBuilderComponent[];
  caseFans?: PCBuilderComponent[];
  [key: string]: PCBuilderComponent[] | undefined;
}

/**
 * Recommended PC build from PC Finder
 */
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

/**
 * Compatibility issue detected between components
 */
export interface CompatibilityIssue {
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
  recommendation?: string;
  affectedComponents?: string[];
}

/**
 * Simplified component type for compatibility calculations
 */
export interface ComparisonComponent {
  id: string;
  name: string;
  category?: string;
  price?: number;
  specs?: Record<string, unknown>;
  cores?: number;
  tdp?: number;
  vram?: number;
}

/**
 * Valid component categories in the builder
 */
export type CategoryKey =
  | "case"
  | "motherboard"
  | "cpu"
  | "ram"
  | "gpu"
  | "storage"
  | "storage2"
  | "psu"
  | "cooling"
  | "caseFans";

/**
 * Union of component types
 */
export type AnyComponent = PCBuilderComponent | PCComponent;

/**
 * Image reference - can be string or object
 */
export type ImageRef = string | { url?: string; src?: string };

/**
 * Saved build for comparison
 */
export interface SavedBuild {
  id: string;
  name: string;
  timestamp: number;
  components: SelectedComponentIds;
  peripherals: Record<string, string[]>;
  totalPrice: number;
  createdAt?: Date;
  description?: string;
}

/**
 * Option selection for a component
 * Maps option IDs to selected values
 */
export interface OptionSelections {
  [componentId: string]: {
    [optionId: string]: string | number | boolean;
  };
}
