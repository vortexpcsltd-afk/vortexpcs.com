// Recommendation rules engine for PC Finder -> Component suggestions
// Provides deterministic mapping from questionnaire answers to component tier selections.
// Falls back to generic labels if CMS component data unavailable.
import { logger } from "./logger";

export interface FinderAnswers {
  purpose?: string; // gaming | creative | content_creation | professional | development | home
  budget?: number; // numeric budget in GBP
  performance_ambition?: string; // maximum | high | balanced | efficient
  priority_component?: string; // gpu | cpu | memory | storage
  aesthetics?: string; // rgb_max | rgb_moderate | minimal
  timeline?: string; // rush | standard | flexible
}

export type Tier = "entry" | "mid" | "high" | "flagship";

export interface RecommendedPartSummary {
  cpu: string;
  gpu: string;
  memory: string;
  storage: string;
  cooling: string;
  psu: string;
  case: string;
  caseFans?: string;
}

export interface FulfilmentMeta {
  etaDays: number;
  surcharge: number;
  priorityFlag: boolean;
}

export interface RecommendationResult {
  parts: RecommendedPartSummary;
  fulfilment: FulfilmentMeta;
  notes: string[];
}

// Tier dictionaries - Updated for 2025 Hardware
const CPU_TIERS: Record<Tier, string> = {
  entry: "Intel Core i5-14400F / AMD Ryzen 5 7600X (6-Core)",
  mid: "Intel Core i7-14700K / AMD Ryzen 7 9700X (8-12 Core)",
  high: "Intel Core i9-14900K / AMD Ryzen 9 9900X (16-Core)",
  flagship: "Intel Core i9-14900KS / AMD Ryzen 9 9950X (24-Core)",
};
const GPU_GAMING_TIERS: Record<Tier, string> = {
  entry: "RTX 4060 Ti / RTX 5060 8GB Performance GPU",
  mid: "RTX 4070 Ti Super / RTX 5070 12GB Graphics Engine",
  high: "RTX 4080 Super / RTX 5080 16GB Gaming Monster",
  flagship: "RTX 4090 / RTX 5090 24GB Ultimate Graphics",
};
const GPU_CREATIVE_ALT: Record<Tier, string> = {
  entry: "RTX 4060 Ti / RTX 5060 Creator Ready",
  mid: "RTX 4070 Ti Super / RTX 5070 Ti Render Accelerator",
  high: "RTX 4080 Super / RTX 5080 Studio GPU",
  flagship: "RTX 4090 / RTX 5090 Production Powerhouse",
};
const MEMORY_TIERS: Record<Tier, string> = {
  entry: "16GB DDR5 5600MHz CL36",
  mid: "32GB DDR5 6000MHz CL30",
  high: "64GB DDR5 6400MHz CL32",
  flagship: "128GB DDR5 6800MHz CL34",
};
const STORAGE_TIERS: Record<Tier, string> = {
  entry: "1TB NVMe Gen4 (7000MB/s)",
  mid: "2TB NVMe Gen4 (7400MB/s)",
  high: "2TB NVMe Gen5 (12000MB/s)",
  flagship: "4TB NVMe Gen5 (14000MB/s) Dual Drive",
};
const COOLING_TIERS: Record<Tier, string> = {
  entry: "Dual-Tower Air Cooler 140mm",
  mid: "280mm Performance AIO Liquid Cooler",
  high: "360mm RGB AIO Liquid Cooler",
  flagship: "420mm Premium LCD AIO Custom Loop",
};
const PSU_TIERS: Record<Tier, string> = {
  entry: "750W 80+ Gold Modular PSU",
  mid: "850W 80+ Gold Fully Modular PSU",
  high: "1000W 80+ Platinum ATX 3.0 PSU",
  flagship: "1200W 80+ Titanium ATX 3.1 PSU",
};
const CASE_STYLES: Record<string, string> = {
  rgb_max: "Panoramic Tempered Glass RGB Showcase Case",
  rgb_moderate: "Elegant Accent Lighting Mesh Case",
  minimal: "Stealth Black Silent Performance Case",
};
const CASE_FAN_TIERS: Record<Tier, string> = {
  entry: "2x 120mm Performance Fans",
  mid: "3x 120mm High-Airflow Fans",
  high: "3x 140mm RGB Fans",
  flagship: "6x 120mm ARGB Premium Fans",
};
const CASE_FAN_RGB: Record<string, string> = {
  rgb_max: "Full ARGB Fan Kit (6x 120mm)",
  rgb_moderate: "3x 120mm RGB Fans",
  minimal: "3x 120mm Silent Fans",
};

function deriveTier(
  budget: number | undefined,
  ambition: string | undefined
): Tier {
  const b = budget ?? 1500;
  if (ambition === "maximum" && b >= 3500) return "flagship";
  if (b >= 2800) return "high";
  if (b >= 1800) return "mid";
  if (b >= 1200) return "mid"; // mid threshold
  return "entry";
}

function maybeBoost(baseTier: Tier): Tier {
  const order: Tier[] = ["entry", "mid", "high", "flagship"];
  const idx = order.indexOf(baseTier);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : baseTier;
}

function selectGPU(purpose: string | undefined, tier: Tier): string {
  const source =
    purpose === "creative" || purpose === "content_creation"
      ? GPU_CREATIVE_ALT
      : GPU_GAMING_TIERS;
  return source[tier];
}

export function generateRecommendation(
  answers: FinderAnswers
): RecommendationResult {
  const tier = deriveTier(answers.budget, answers.performance_ambition);

  let cpuTier: Tier = tier;
  let gpuTier: Tier = tier;
  let memoryTier: Tier = tier;
  let storageTier: Tier = tier;
  let coolingTier: Tier = tier;
  let psuTier: Tier = tier;
  let caseFanTier: Tier = tier;

  // Priority component boost
  if (answers.priority_component === "cpu") cpuTier = maybeBoost(cpuTier);
  if (answers.priority_component === "gpu") gpuTier = maybeBoost(gpuTier);
  if (answers.priority_component === "memory")
    memoryTier = maybeBoost(memoryTier);
  if (answers.priority_component === "storage")
    storageTier = maybeBoost(storageTier);

  // Use-case memory scaling
  if (
    answers.purpose === "content_creation" ||
    answers.purpose === "development"
  ) {
    if (memoryTier === "mid") memoryTier = "high";
    else if (memoryTier === "high") memoryTier = "flagship";
  }

  // Cooling synergy with CPU
  if (cpuTier === "high" && coolingTier === "mid") coolingTier = "high";
  if (cpuTier === "flagship") coolingTier = "flagship";

  // PSU scaling with GPU
  if (gpuTier === "high" && psuTier === "mid") psuTier = "high";
  if (gpuTier === "flagship") psuTier = "flagship";

  // Case fan selection based on aesthetics or tier
  let caseFanSelection: string;
  if (answers.aesthetics && CASE_FAN_RGB[answers.aesthetics]) {
    caseFanSelection = CASE_FAN_RGB[answers.aesthetics];
  } else {
    caseFanSelection = CASE_FAN_TIERS[caseFanTier];
  }

  const parts: RecommendedPartSummary = {
    cpu: CPU_TIERS[cpuTier],
    gpu: selectGPU(answers.purpose, gpuTier),
    memory: MEMORY_TIERS[memoryTier],
    storage: STORAGE_TIERS[storageTier],
    cooling: COOLING_TIERS[coolingTier],
    psu: PSU_TIERS[psuTier],
    case: CASE_STYLES[answers.aesthetics || "minimal"],
    caseFans: caseFanSelection,
  };

  // Fulfilment mapping
  let fulfilment: FulfilmentMeta = {
    etaDays: 5,
    surcharge: 0,
    priorityFlag: false,
  };
  if (answers.timeline === "rush")
    fulfilment = { etaDays: 3, surcharge: 150, priorityFlag: true };
  else if (answers.timeline === "flexible")
    fulfilment = { etaDays: 7, surcharge: 0, priorityFlag: false };

  const notes: string[] = [];
  if (answers.budget && answers.budget >= 3000)
    notes.push("Premium stability tier: extended stress testing included.");
  if (answers.performance_ambition === "efficient")
    notes.push("Balanced for efficiency: prioritised performance-per-watt.");
  if (answers.priority_component)
    notes.push(
      `Budget emphasis applied to ${answers.priority_component.toUpperCase()}.`
    );
  if (fulfilment.priorityFlag)
    notes.push("Express build prioritised in production queue.");

  return { parts, fulfilment, notes };
}

// Persistence helpers (browser only)
export function persistRecommendation(
  answers: FinderAnswers,
  recommendation: RecommendationResult
) {
  try {
    const payload = { answers, recommendation, timestamp: Date.now() };
    localStorage.setItem("pcfinder_recommendation", JSON.stringify(payload));
  } catch (e) {
    logger.warn("Failed to persist recommendation", { error: e });
  }
}

export function loadPersistedRecommendation(): {
  answers: FinderAnswers;
  recommendation: RecommendationResult;
} | null {
  try {
    const raw = localStorage.getItem("pcfinder_recommendation");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    logger.warn("Failed to load persisted recommendation", { error: e });
    return null;
  }
}
