// Future-proofing and generational value analysis for Kevin's Insight
// Helps customers understand component longevity and when older-gen is better value

export interface Component {
  name?: string;
  price?: number;
  vram?: number;
  cores?: number;
}

export interface FutureProofScore {
  score: number; // 0-100
  grade: "A+" | "A" | "B+" | "B" | "C" | "D";
  reasoning: string[];
  expectedLifespan: string; // e.g., "5-7 years"
  upgradeRecommendation?: string;
}

/**
 * Calculate future-proof score for GPUs
 * Considers VRAM, architecture features, and market positioning
 */
export function calculateGPUFutureProofScore(gpu: Component): FutureProofScore {
  let score = 50; // Start at average
  const reasoning: string[] = [];
  const name = gpu.name?.toLowerCase() || "";

  // VRAM Analysis (Critical Factor)
  const vram = extractVRAM(name);
  if (vram >= 16) {
    score += 25;
    reasoning.push(
      `✅ **16GB+ VRAM**: Future-proof for 4K textures and next-gen games (2025-2030). Games like Starfield, Cyberpunk 2077, Alan Wake 2 already recommend 12GB+ for Ultra settings.`
    );
  } else if (vram >= 12) {
    score += 15;
    reasoning.push(
      `✅ **12GB VRAM**: Solid for 1440p high-refresh and 4K medium settings through 2027-2028. Adequate but not excessive.`
    );
  } else if (vram >= 10) {
    score += 5;
    reasoning.push(
      `⚠️ **10GB VRAM**: Minimum for current AAA gaming. Already limiting in some 2024 titles at Ultra 4K. Expect texture compromises by 2026-2027.`
    );
  } else if (vram <= 8) {
    score -= 15;
    reasoning.push(
      `❌ **8GB VRAM**: Already bottlenecking in 2024-2025 AAA titles (Hogwarts Legacy, The Last of Us, Resident Evil 4 stutter on Ultra). This will age poorly.`
    );
  }

  // Architecture Generation
  if (
    name.includes("rtx 40") ||
    name.includes("rx 7") ||
    name.includes("arc a7")
  ) {
    score += 15;
    reasoning.push(
      `✅ **Current Gen Architecture**: DLSS 3/FSR 3 support extends usable lifespan by 2-3 years. Frame generation tech lets older GPUs stay relevant longer.`
    );
  } else if (name.includes("rtx 30") || name.includes("rx 6")) {
    score += 5;
    reasoning.push(
      `⚠️ **Previous Gen (2020-2022)**: Still capable but lacks frame generation tech. DLSS 2/FSR 2 upscaling helps, but you're missing 50-100% FPS boost from DLSS 3.`
    );
  } else {
    score -= 10;
    reasoning.push(
      `❌ **Older Architecture**: Multiple generations behind. Missing modern features (RT cores, AI upscaling, frame gen). Consider upgrading soon.`
    );
  }

  // Performance Tier Context
  if (
    name.includes("4090") ||
    name.includes("7900 xtx") ||
    name.includes("4080")
  ) {
    score += 15;
    reasoning.push(
      `✅ **Flagship Tier**: Massive performance headroom. What's "Ultra 4K" today will be "Medium 1440p" in 5 years – this card scales down gracefully.`
    );
  } else if (name.includes("4060") || name.includes("7600")) {
    score -= 5;
    reasoning.push(
      `⚠️ **Entry Tier**: Adequate for current 1080p gaming, but minimal headroom. As game requirements increase, you'll be dropping settings aggressively by 2027.`
    );
  }

  // Ray Tracing Capability
  if (name.includes("rtx")) {
    score += 5;
    reasoning.push(
      `✅ **Ray Tracing Hardware**: RT cores future-proof as more games mandate ray tracing (UE5 Lumen, PT games increasing).`
    );
  }

  // Calculate final grade and lifespan
  const grade = getGrade(score);
  const expectedLifespan = calculateLifespan(score, "gpu");

  return {
    score,
    grade,
    reasoning,
    expectedLifespan,
    upgradeRecommendation:
      score < 60 ? getUpgradeRecommendation("gpu", name) : undefined,
  };
}

/**
 * Calculate future-proof score for CPUs
 * Considers core count, architecture, and platform longevity
 */
export function calculateCPUFutureProofScore(cpu: Component): FutureProofScore {
  let score = 50;
  const reasoning: string[] = [];
  const name = cpu.name?.toLowerCase() || "";

  // Core Count (Critical for future software)
  const cores = extractCoreCount(name);
  if (cores >= 16) {
    score += 20;
    reasoning.push(
      `✅ **16+ Cores**: Exceptional for next-gen gaming engines (UE5, REDengine) and heavy multitasking. Games are finally scaling to 12+ threads.`
    );
  } else if (cores >= 12) {
    score += 15;
    reasoning.push(
      `✅ **12+ Cores**: Excellent balance. Modern games use 8-12 threads efficiently, extra cores handle background tasks without FPS impact.`
    );
  } else if (cores >= 8) {
    score += 10;
    reasoning.push(
      `✅ **8 Cores**: Current sweet spot for gaming. Adequate through 2027-2028, but next-gen consoles have 8 cores, so PC ports may soon require more.`
    );
  } else if (cores >= 6) {
    score += 0;
    reasoning.push(
      `⚠️ **6 Cores**: Minimum for modern gaming. Already bottlenecking in CPU-heavy titles (Starfield, Cyberpunk 2077 crowds). Expect limitations by 2026.`
    );
  } else {
    score -= 15;
    reasoning.push(
      `❌ **4 Cores or Less**: Inadequate for 2025+ gaming. Most new games stutter on 4-core CPUs. Upgrade urgently recommended.`
    );
  }

  // Architecture Generation
  if (
    name.includes("14th gen") ||
    name.includes("13th gen") ||
    name.includes("7000 series") ||
    name.includes("ryzen 7")
  ) {
    score += 15;
    reasoning.push(
      `✅ **Current Gen (2022-2024)**: Modern architecture with DDR5 support, PCIe 5.0, and efficiency improvements. Platform has 3-5 year relevance.`
    );
  } else if (
    name.includes("12th gen") ||
    name.includes("5000 series") ||
    name.includes("ryzen 5")
  ) {
    score += 5;
    reasoning.push(
      `⚠️ **Previous Gen (2020-2021)**: Still capable but platform aging. DDR4 limitation, PCIe 4.0 max. Consider this if you're on tight budget and plan to upgrade in 2-3 years.`
    );
  }

  // 3D V-Cache Bonus (Gaming-Specific Future-Proofing)
  if (name.includes("x3d")) {
    score += 10;
    reasoning.push(
      `✅ **3D V-Cache Technology**: Massive L3 cache (96MB+) extends gaming relevance by 2-3 years. As games demand more cache, X3D CPUs age like fine wine.`
    );
  }

  // Platform Longevity
  if (
    name.includes("am5") ||
    name.includes("7000 series") ||
    name.includes("ryzen 7")
  ) {
    score += 10;
    reasoning.push(
      `✅ **AM5 Platform**: AMD committed to supporting AM5 through 2027+ (Zen 6). Upgrade path: Drop in Zen 5/Zen 6 CPU without changing motherboard/RAM.`
    );
  } else if (
    name.includes("lga1700") ||
    name.includes("13th") ||
    name.includes("14th")
  ) {
    score += 5;
    reasoning.push(
      `⚠️ **LGA1700 Platform**: Intel's typical 2-gen socket lifespan. 13th/14th gen supported, but next gen (Arrow Lake) requires new motherboard. Limited upgrade path.`
    );
  }

  const grade = getGrade(score);
  const expectedLifespan = calculateLifespan(score, "cpu");

  return {
    score,
    grade,
    reasoning,
    expectedLifespan,
    upgradeRecommendation:
      score < 60 ? getUpgradeRecommendation("cpu", name) : undefined,
  };
}

/**
 * Generate generational comparison insights
 * Helps customers decide between current gen and previous gen value
 */
export function getGenerationalComparisons(
  componentType: "gpu" | "cpu",
  currentComponent: Component
): string[] {
  const insights: string[] = [];
  const name = currentComponent.name?.toLowerCase() || "";

  if (componentType === "gpu") {
    // RTX 40-series vs RTX 30-series
    if (name.includes("4070")) {
      insights.push(
        `💡 **RTX 4070 vs RTX 3080 (Previous Gen)**: Performance comparison: Similar rasterization (4070 slightly faster), 4070 wins efficiency (200W vs 320W) and has DLSS 3. ` +
          `Value analysis: RTX 3080 10GB can be found used for £400-500 vs RTX 4070 new at £550-600. If you can find a quality 3080 from reputable seller (receipt, warranty transferable) ` +
          `at £420 or less, it's 90% the performance for 70% the price. Trade-off: Higher electricity costs (£40-60/year more at 4hrs daily use), no DLSS 3 frame gen, ` +
          `less VRAM headroom (10GB vs 12GB). My take: If budget-constrained and don't care about DLSS 3, used 3080 from trusted source is smart. If you want efficiency and warranty peace of mind, 4070 new.`
      );
    }

    if (name.includes("4060")) {
      insights.push(
        `💡 **RTX 4060 vs RTX 3060 Ti (Previous Gen)**: This is interesting – the OLDER card (3060 Ti) has better rasterization performance! ` +
          `4060 advantages: 115W vs 200W (half the power!), DLSS 3 frame generation, newer architecture. 3060 Ti advantages: 15-20% faster in traditional gaming, ` +
          `8GB VRAM same as 4060 but wider 256-bit bus = better memory bandwidth. Used market: 3060 Ti £280-320, RTX 4060 new £280-310. ` +
          `Recommendation: If power efficiency matters (SFF build, electricity costs, heat concerns), 4060. If you want maximum FPS per pound and don't mind extra 85W draw, 3060 Ti. ` +
          `Honestly, at similar prices, I'd lean 3060 Ti for pure gaming performance – DLSS 3 isn't worth 15% fps loss in most scenarios.`
      );
    }

    // AMD generational
    if (name.includes("7800 xt")) {
      insights.push(
        `💡 **RX 7800 XT vs RX 6800 XT (Previous Gen)**: AMD's naming is confusing – the 7800 XT is actually a tier BELOW the 6800 XT! ` +
          `Performance: 6800 XT is ~10-15% faster in rasterization, both weak at ray tracing. 7800 XT advantages: Better efficiency (263W vs 300W), ` +
          `newer architecture (better driver support longevity), FSR 3 support. Used market: 6800 XT £380-420, 7800 XT new £450-490. ` +
          `Value pick: If you can grab 6800 XT for £380, that's better price/performance. If within £30, go 7800 XT for newer platform and warranty. ` +
          `Both have 16GB VRAM so equal future-proofing on memory front.`
      );
    }
  } else if (componentType === "cpu") {
    // AMD generational
    if (name.includes("7600")) {
      insights.push(
        `💡 **Ryzen 5 7600X vs Ryzen 7 5800X3D (Previous Gen - Different Tier!)**: This is the most interesting CPU comparison in 2025! ` +
          `Gaming performance: 5800X3D WINS by 5-10% thanks to 3D V-Cache, despite being older generation. 7600X advantages: Newer platform (AM5, DDR5, PCIe 5.0), ` +
          `better productivity (newer architecture), upgrade path to Zen 5/6. Total platform cost: 5800X3D + B550 board + 32GB DDR4 = £480-520. ` +
          `7600X + B650 board + 32GB DDR5 = £580-640. You save £80-120 going previous gen AND get better gaming FPS. The catch: AM4 is end-of-life, ` +
          `no upgrade path beyond 5800X3D. My recommendation: If you're keeping this CPU 4+ years and want maximum gaming FPS now, 5800X3D is legendary value. ` +
          `If you want flexibility to drop in a Zen 5 X3D in 2-3 years, pay the premium for AM5 platform.`
      );
    }

    if (name.includes("7700x")) {
      insights.push(
        `💡 **Ryzen 7 7700X vs Ryzen 9 5900X (Previous Gen - More Cores!)**: The 5900X has 12 cores vs 7700X's 8 cores. ` +
          `Gaming: 7700X wins by 8-12% (better IPC, higher clocks). Productivity: 5900X wins 25-30% in multi-threaded (rendering, compiling). ` +
          `Power: 7700X more efficient (105W vs 142W). Price: Used 5900X £280-320, 7700X new £300-340. Similar total cost. ` +
          `Decision tree: Gaming primary focus? 7700X + AM5 platform. Heavy multitasking/content creation? 5900X is 50% more cores for same price. ` +
          `Platform: AM5 has upgrade path, AM4 is dead end. My take: For gaming + light productivity, 7700X. For workstation use that happens to game, 5900X is insane value.`
      );
    }

    // Intel generational
    if (name.includes("14600k") || name.includes("13600k")) {
      insights.push(
        `💡 **Intel 13600K vs 12600K (Previous Gen)**: The 13600K is essentially a refined 12600K with same core config (6P + 8E cores). ` +
          `Performance difference: ~8-10% faster (better memory controller, higher clocks). Price difference: 12600K £180-210 used, 13600K £250-280 new. ` +
          `That's £70-100 premium for 8-10% performance. Value analysis: If you're budget-constrained, 12600K is excellent value – still crushes gaming, ` +
          `handles streaming well. Both use LGA1700 so same platform (DDR5, PCIe 5.0 capable). Electricity cost identical. ` +
          `My recommendation: 12600K at £180-200 is sweet spot price/performance. Pay up for 13600K only if you're maxing everything else (4080+ GPU, fast DDR5). ` +
          `Otherwise save £80 and invest in better GPU or more storage.`
      );
    }
  }

  return insights;
}

/**
 * Helper function to extract VRAM from GPU name
 */
function extractVRAM(name: string): number {
  if (name.includes("24gb") || name.includes("4090")) return 24;
  if (name.includes("20gb") || name.includes("7900 xt")) return 20;
  if (name.includes("16gb")) return 16;
  if (name.includes("12gb")) return 12;
  if (name.includes("10gb")) return 10;
  if (name.includes("8gb")) return 8;
  if (name.includes("6gb")) return 6;
  if (name.includes("4gb")) return 4;

  // Defaults based on common models
  if (name.includes("4080") || name.includes("7900 xtx")) return 16;
  if (
    name.includes("4070 ti") ||
    name.includes("7800 xt") ||
    name.includes("7700 xt")
  )
    return 12;
  if (name.includes("4070")) return 12;
  if (name.includes("4060 ti")) return 8;
  if (name.includes("4060") || name.includes("7600")) return 8;
  if (name.includes("3090")) return 24;
  if (name.includes("3080")) return 10;
  if (name.includes("3070")) return 8;
  if (name.includes("3060 ti")) return 8;
  if (name.includes("3060")) return 12;

  return 8; // Conservative default
}

/**
 * Helper function to extract core count from CPU name
 */
function extractCoreCount(name: string): number {
  // AMD Ryzen
  if (name.includes("7950x") || name.includes("5950x")) return 16;
  if (name.includes("7900x") || name.includes("5900x")) return 12;
  if (
    name.includes("7800x3d") ||
    name.includes("5800x3d") ||
    name.includes("7700x") ||
    name.includes("5700x")
  )
    return 8;
  if (name.includes("7600x") || name.includes("5600x")) return 6;

  // Intel (P-cores + E-cores, simplified)
  if (name.includes("14900k") || name.includes("13900k")) return 24; // 8P + 16E
  if (name.includes("14700k") || name.includes("13700k")) return 20; // 8P + 12E
  if (
    name.includes("14600k") ||
    name.includes("13600k") ||
    name.includes("12600k")
  )
    return 14; // 6P + 8E

  return 8; // Default estimate
}

/**
 * Convert score to letter grade
 */
function getGrade(score: number): "A+" | "A" | "B+" | "B" | "C" | "D" {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B+";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

/**
 * Calculate expected lifespan based on score
 */
function calculateLifespan(score: number, type: "gpu" | "cpu"): string {
  if (score >= 85) return type === "gpu" ? "5-7 years" : "6-8 years";
  if (score >= 70) return type === "gpu" ? "4-5 years" : "5-6 years";
  if (score >= 55) return type === "gpu" ? "3-4 years" : "4-5 years";
  return type === "gpu" ? "2-3 years" : "3-4 years";
}

/**
 * Generate upgrade recommendation for low-scoring components
 */
function getUpgradeRecommendation(type: "gpu" | "cpu", name: string): string {
  if (type === "gpu") {
    if (name.includes("4060") || name.includes("7600")) {
      return "Consider upgrading to RTX 4070 / RX 7800 XT tier for better longevity (+£150-200, adds 2-3 years useful life).";
    }
    return "Consider a tier upgrade for better future-proofing – 12GB+ VRAM and current-gen architecture recommended.";
  } else {
    if (name.includes("7600") || name.includes("14600")) {
      return "Consider upgrading to 8-core tier (Ryzen 7 7700X / Intel i7-14700K) for better multi-threaded longevity (+£80-120).";
    }
    return "Consider upgrading to 8+ cores with current-gen architecture for better software compatibility in 2-3 years.";
  }
}

/**
 * Get comprehensive future-proofing insight for entire build
 */
export function getBuildFutureProofAnalysis(
  cpu: Component,
  gpu: Component
): string[] {
  const insights: string[] = [];

  const cpuScore = calculateCPUFutureProofScore(cpu);
  const gpuScore = calculateGPUFutureProofScore(gpu);

  const avgScore = (cpuScore.score + gpuScore.score) / 2;
  const avgGrade = getGrade(avgScore);

  // Overall assessment
  insights.push(
    `🔮 **Build Future-Proofing Score: ${avgScore.toFixed(
      0
    )}/100 (Grade ${avgGrade})** - ` +
      `Your ${cpu.name} + ${
        gpu.name
      } combination should remain relevant for **${
        avgScore >= 75
          ? "5-7 years"
          : avgScore >= 60
          ? "4-5 years"
          : "3-4 years"
      }** ` +
      `with these predicted timelines: **Gaming** (High settings): ${gpuScore.expectedLifespan}. **Productivity** (Modern software): ${cpuScore.expectedLifespan}. ` +
      `${
        avgScore >= 80
          ? "Excellent longevity – this build will age gracefully!"
          : avgScore >= 65
          ? "Good longevity with strategic setting adjustments over time."
          : "Adequate for now, plan GPU upgrade in 2-3 years."
      }`
  );

  // Component-specific breakdown
  insights.push(
    `📊 **Component Breakdown**: CPU ${cpuScore.grade} (${cpuScore.score}/100) | GPU ${gpuScore.grade} (${gpuScore.score}/100). ` +
      `${
        Math.abs(cpuScore.score - gpuScore.score) > 20
          ? `⚠️ Imbalance detected: Your ${
              cpuScore.score > gpuScore.score
                ? "CPU is significantly stronger than GPU"
                : "GPU is significantly stronger than CPU"
            }. ` +
            `Consider rebalancing for optimal longevity – ${
              cpuScore.score > gpuScore.score
                ? "invest more in GPU tier"
                : "CPU might bottleneck in CPU-heavy titles"
            }.`
          : "✅ Well-balanced component longevity across the board."
      }`
  );

  // Upgrade path guidance
  const firstToUpgrade = cpuScore.score < gpuScore.score ? "CPU" : "GPU";
  const secondToUpgrade = firstToUpgrade === "CPU" ? "GPU" : "CPU";
  insights.push(
    `🛠️ **Upgrade Path Strategy**: When performance starts feeling slow (expected ~${Math.min(
      parseInt(cpuScore.expectedLifespan),
      parseInt(gpuScore.expectedLifespan)
    )} years), ` +
      `upgrade **${firstToUpgrade} first** (it'll age faster), then **${secondToUpgrade}** 1-2 years later. ` +
      `This staged approach spreads cost over time and ensures you're always upgrading the actual bottleneck. ` +
      `${
        avgScore < 70
          ? cpuScore.upgradeRecommendation ||
            gpuScore.upgradeRecommendation ||
            "Consider tier upgrades for both components if budget allows."
          : "With strategic setting adjustments, you can extend usable life by 1-2 additional years."
      }`
  );

  return insights;
}
