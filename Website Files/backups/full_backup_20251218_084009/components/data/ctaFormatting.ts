/**
 * CTA Formatting & Budget Optimization System
 *
 * Provides structured action plan formatting and contextual budget reallocation tips
 * based on synergy grade and component configuration.
 *
 * Features:
 * - Action plan header and formatting
 * - Grade-based budget optimization suggestions
 * - Confidence boosters for high-quality builds
 * - Use-case specific reallocation strategies
 * - Bottleneck-aware recommendations
 * - Price-to-performance insights
 * - Market timing suggestions
 */

import type { SynergyGrade } from "./synergyGradeCalculation";

interface CTAFormattingParams {
  ctas: string[];
  grade: SynergyGrade;
  vram: number;
  cores: number;
  ramCap: number;
  // Optional extended parameters for enhanced recommendations
  totalPrice?: number;
  useCase?: string;
  hasNVMe?: boolean;
  psuWattage?: number;
  psuEfficiency?: string;
  coolerType?: string;
  storageSpeed?: string;
  ramSpeed?: number;
  cpuBottleneck?: boolean;
  gpuBottleneck?: boolean;
}

/**
 * Detect use case from component specs
 */
const detectUseCaseFromSpecs = (
  vram: number,
  cores: number,
  ramCap: number
): string => {
  // Content creation indicators
  if (cores >= 12 && ramCap >= 32) return "content-creation";
  if (cores >= 8 && ramCap >= 32 && vram >= 12) return "streaming";

  // Gaming indicators
  if (vram >= 10 && cores >= 6) return "gaming";
  if (vram >= 6) return "gaming-budget";

  // General use
  return "general";
};

/**
 * Generate use-case specific budget reallocation advice
 */
const getUseCaseReallocation = (
  useCase: string,
  vram: number,
  _cores: number,
  _ramCap: number,
  _totalPrice?: number
): string => {
  const strategies: Record<string, string> = {
    "content-creation":
      "GPU to a mid-tier option and allocate those savings to 64GB RAM or a faster NVMe SSD. Rendering and editing workflows benefit more from memory and storage speed than raw GPU power",
    streaming:
      "CPU slightly and invest in a GPU with better encoding (NVENC/AV1). Modern GPUs handle encoding efficiently, letting you downgrade the CPU without losing stream quality",
    gaming:
      vram >= 16
        ? "GPU from flagship to upper mid-tier (4080 → 4070 Ti) and reinvest in a faster CPU or high refresh-rate monitor. The performance gap narrows at high settings"
        : "case aesthetics and prioritize a GPU upgrade. Frame rates matter more than RGB in gaming builds",
    "gaming-budget":
      "RGB peripherals and put everything into GPU VRAM. An extra 2-4GB VRAM extends the lifespan of your build significantly",
    general:
      "unnecessary features (RGB, tempered glass) and focus on SSD capacity and RAM. These provide daily-use benefits that outlast visual appeal",
  };

  return strategies[useCase] || strategies["general"];
};

/**
 * Generate bottleneck-specific recommendations
 */
const getBottleneckAdvice = (
  cpuBottleneck?: boolean,
  gpuBottleneck?: boolean,
  cores?: number,
  vram?: number
): string[] => {
  const advice: string[] = [];

  if (cpuBottleneck && cores && cores < 8) {
    advice.push(
      `🔧 **CPU Bottleneck Detected**: Your current CPU (${cores} cores) may limit GPU performance. Consider upgrading to a 6-8 core CPU from current-gen (Intel 14th/AMD 7000 series) for 20-30% better frame times.`
    );
  }

  if (gpuBottleneck && vram && vram < 8) {
    advice.push(
      `🎮 **GPU Constraint**: With ${vram}GB VRAM, you're limited at high settings. Prioritize a GPU upgrade to 12GB+ for 1440p or 16GB+ for 4K gaming to avoid texture streaming issues.`
    );
  }

  return advice;
};

/**
 * Generate price-to-performance insights
 */
const getPricePerformanceInsight = (
  grade: SynergyGrade,
  totalPrice?: number,
  vram?: number
): string | null => {
  if (!totalPrice) return null;

  // High-end diminishing returns
  if (totalPrice > 2500 && vram && vram >= 20) {
    return "💰 **Diminishing Returns Alert**: Flagship GPUs (4090, 7900 XTX) cost 50-70% more than upper mid-tier options but only deliver 20-30% more performance. Consider if that premium matches your needs.";
  }

  // Budget sweet spot
  if (totalPrice >= 800 && totalPrice <= 1200 && grade <= "B") {
    return "💎 **Sweet Spot Build**: You're in the optimal price-to-performance range (£800-£1200). This budget delivers the best value without sacrificing quality – smart building!";
  }

  // Under-spending in critical areas
  if (totalPrice < 700 && grade >= "D") {
    return "⚠️ **Budget Stretch Recommended**: Builds under £700 often require compromises that hurt longevity. If possible, stretch to £800-900 for significantly better future-proofing and component quality.";
  }

  return null;
};

/**
 * Generate market timing suggestions
 */
const getMarketTimingAdvice = (grade: SynergyGrade): string | null => {
  // Note: Update these based on current market conditions
  const currentMonth = new Date().getMonth(); // 0 = January
  const currentYear = new Date().getFullYear();

  // Q1 2025: CES announcements, potential new GPU launches
  if (currentYear === 2025 && currentMonth <= 2 && grade >= "C") {
    return "📅 **Market Timing Tip**: We're in Q1 2025. If your build can wait 1-2 months, upcoming GPU launches typically cause 10-15% price drops on current-gen cards. Consider waiting unless you need it immediately.";
  }

  // Black Friday/Cyber Monday (November)
  if (currentMonth === 10) {
    return "🛍️ **Sale Season**: Black Friday/Cyber Monday is approaching! Delay non-urgent purchases by a few weeks for potential 15-25% discounts on components, especially storage and peripherals.";
  }

  // Back to school sales (August)
  if (currentMonth === 7) {
    return "📚 **Back-to-School Sales**: August brings student discounts on laptops and accessories. Check for bundle deals on monitors, keyboards, and software that could stretch your budget further.";
  }

  return null;
};

/**
 * Generate storage-specific recommendations
 */
const getStorageAdvice = (
  hasNVMe?: boolean,
  storageSpeed?: string
): string | null => {
  if (hasNVMe === false || storageSpeed === "SATA") {
    return "⚡ **Storage Upgrade Priority**: You're using SATA storage. Upgrading to NVMe (Gen3 minimum, Gen4 preferred) provides 3-6x faster load times and significantly improves system responsiveness. This is a high-impact upgrade for £50-100.";
  }

  if (storageSpeed === "HDD") {
    return "🚨 **Critical: No SSD Detected**: Running Windows on a mechanical HDD severely impacts performance. An SSD is the single most impactful upgrade you can make – prioritize this above all else. Even a budget 500GB NVMe costs under £40 and transforms system speed.";
  }

  return null;
};

/**
 * Format CTAs with action plan header and grade-specific advice
 * Returns array of formatted messages including header, CTAs, and tips
 */
export const formatCTASection = (params: CTAFormattingParams): string[] => {
  const {
    ctas,
    grade,
    vram,
    cores,
    ramCap,
    totalPrice,
    useCase: providedUseCase,
    hasNVMe,
    cpuBottleneck,
    gpuBottleneck,
    storageSpeed,
    ramSpeed,
  } = params;

  if (ctas.length === 0) {
    return [];
  }

  const formatted: string[] = [];

  // Add action plan header
  formatted.push(""); // spacing
  formatted.push("🎯 **Kevin's Action Plan**");
  formatted.push(
    "Based on my analysis of your build, here are my prioritised recommendations. I've ordered these by impact – tackle the Critical items first, then work through the others as budget allows:"
  );
  formatted.push(""); // spacing
  formatted.push(...ctas);

  // Critical storage check (highest priority)
  const storageAdvice = getStorageAdvice(hasNVMe, storageSpeed);
  if (storageAdvice) {
    formatted.push(""); // spacing
    formatted.push(storageAdvice);
  }

  // Bottleneck-specific advice
  const bottleneckAdvice = getBottleneckAdvice(
    cpuBottleneck,
    gpuBottleneck,
    cores,
    vram
  );
  if (bottleneckAdvice.length > 0) {
    formatted.push(""); // spacing
    formatted.push(...bottleneckAdvice);
  }

  // Budget optimization for C-F grades (needs improvement)
  if (grade >= "C") {
    formatted.push(""); // spacing

    const useCase =
      providedUseCase || detectUseCaseFromSpecs(vram, cores, ramCap);
    const strategy = getUseCaseReallocation(
      useCase,
      vram,
      cores,
      ramCap,
      totalPrice
    );

    // Differentiate messaging for grade C vs D-F
    const intro =
      grade === "C"
        ? "Your build is acceptable but has room for optimization."
        : "To improve your build's balance,";

    formatted.push(
      `💡 **Budget Reallocation Tip**: ${intro} If locked into your current budget, try this: Downgrade your ${strategy}`
    );
  }

  // RAM speed advisory (if low)
  if (ramSpeed && ramSpeed < 3200) {
    formatted.push(""); // spacing
    formatted.push(
      `🐌 **RAM Speed Notice**: Your RAM runs at ${ramSpeed}MHz. Modern CPUs benefit from 3200MHz+ (DDR4) or 5600MHz+ (DDR5). This is a low-cost upgrade (£10-30 difference) that improves CPU performance by 5-15% in gaming and productivity.`
    );
  }

  // Price-to-performance insights
  const priceInsight = getPricePerformanceInsight(grade, totalPrice, vram);
  if (priceInsight) {
    formatted.push(""); // spacing
    formatted.push(priceInsight);
  }

  // Market timing suggestions
  const timingAdvice = getMarketTimingAdvice(grade);
  if (timingAdvice) {
    formatted.push(""); // spacing
    formatted.push(timingAdvice);
  }

  // Confidence booster for A-B grades (high quality builds)
  if (grade <= "B") {
    formatted.push(""); // spacing
    formatted.push(
      "✨ **You're on the right track!** The suggestions above are nice-to-haves, not must-haves. Your core build is solid. If budget is tight, you can proceed with confidence – you've made smart choices that maximize performance per pound spent."
    );
  }

  return formatted;
};
