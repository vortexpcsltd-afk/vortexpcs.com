/**
 * Upgrade Path Guidance System
 *
 * Provides contextual upgrade recommendations and future-proofing advice
 * based on current build configuration and price tier.
 *
 * Features (Enhanced):
 *
 * P0 - Critical:
 * - GPU upgrade paths (budget/mid/high-end tier roadmaps with timing)
 * - CPU bottleneck warnings (platform refresh triggers)
 * - Motherboard/platform warnings (PCIe gen, DDR4→DDR5 timing)
 *
 * P1 - High Value:
 * - RAM speed upgrade guidance (DDR4→DDR5 transition strategy)
 * - Storage type upgrades (SATA→NVMe, Gen3→Gen4 with real-world gains)
 * - Monitor/GPU sync warnings (resolution/refresh rate matching)
 * - Cooling upgrade triggers (performance headroom gains)
 *
 * P2 - Strategic:
 * - Platform migration timing (socket EOL, full refresh planning)
 * - Case airflow upgrades (high-power build thermal optimization)
 * - Secondary GPU/capture card guidance (streaming/content creation)
 * - Sequential upgrade roadmaps (12/24/36-month planning)
 * - High-power build infrastructure requirements
 *
 * P3 - Polish:
 * - Price anchoring (upgrade costs as % of build value)
 * - Performance gain estimates (realistic FPS/thermal/speed impacts)
 * - Compatibility pre-checks (DDR5 platform, AIO clearance, QVL)
 * - Resale value notes (depreciation curves, selling timing)
 *
 * Original Features (Preserved):
 * - RAM capacity upgrade paths (16GB → 32GB)
 * - Missing cooling alerts
 * - PSU headroom benefits for future GPU upgrades
 * - Storage expansion planning
 * - Multiple message variations for engagement
 */

interface UpgradeComponents {
  ramCap: number;
  cores: number;
  vram: number;
  estimatedLoad: number;
  wattage: number;
  cooling?: {
    type?: string;
    name?: string;
  };
  storage?: {
    capacity?: number;
    interface?: string;
  };
  // P0/P1 additions
  gpuName?: string;
  cpuName?: string;
  motherboardChipset?: string;
  ramSpeed?: number;
  ramType?: string; // "DDR4" | "DDR5"
  pcieGen?: number;
  // P2 additions
  tdpCpu?: number;
  gpuPower?: number;
  caseAirflow?: "Excellent" | "Good" | "Adequate" | "Poor" | "Unknown";
  caseFans?: number;
}

// RAM upgrade path variations (16GB → 32GB)
const ramUpgradeVariations = [
  "📈 Next upgrade: Add 16GB more RAM (total 32GB) within 6-12 months if you do content creation. Your motherboard likely supports it, and it's a simple plug-and-play upgrade.",
  "📈 RAM upgrade path: When budget allows, double to 32GB. Your motherboard has slots available, and it's literally plug-and-play. Modern games and creative apps increasingly want 32GB. Easy win for £60-80!",
  "📈 Future upgrade: 16GB more RAM to reach 32GB sweet spot. Your board supports it, installation takes 2 minutes, and you'll notice the difference in multitasking and content creation. Next logical step!",
  "📈 Smart upgrade: Another 16GB RAM stick (total 32GB) when funds permit. Simple installation, immediate improvement in creative workflows. Your motherboard is ready for it. Easiest upgrade you'll ever do!",
];

// Missing cooling alert variations
const coolingAlertVariations = [
  "❗ Important: You haven't selected a CPU cooler yet. Most CPUs need one (except if yours includes a stock cooler). For your processor, I'd recommend at minimum a solid tower cooler, or ideally a 240mm+ AIO for best performance and acoustics.",
  "⚠️ Cooling required! Your CPU needs proper cooling. Stock coolers (if included) are barely adequate. Budget: £40-50 tower air cooler. Better: £70-100 240mm AIO. Best: £100-140 280/360mm AIO. Don't skip this!",
  "🚨 Critical: No cooler selected! Your CPU will throttle or shut down without adequate cooling. Minimum: quality air cooler (£40+). Recommended: AIO liquid cooler (£80+). Essential component – add before proceeding!",
  "❗ Missing component: CPU cooler! Your processor generates heat and requires active cooling. Stock coolers struggle. Invest £50-100 in proper cooling for optimal performance and longevity. Non-negotiable!",
];

// PSU headroom bonus variations (future-proofing)
const psuHeadroomVariations = [
  "🔮 Future-proof PSU: Your power supply has excellent headroom for GPU upgrades. In 2-3 years when you want more graphics power, you won't need to replace the PSU – just slot in the new GPU. Forward-thinking choice!",
  "🔮 PSU headroom bonus! You've got 200-300W spare capacity. When next-gen GPUs arrive, you can upgrade without replacing the power supply. That's proper future-proofing. One less thing to budget for later!",
  "🔮 Smart PSU choice! Massive headroom for future GPU upgrades. RTX 6090 in 2027? Your PSU is ready. This is how you build for longevity. You've thought ahead brilliantly!",
  "🔮 Excellent PSU planning! Running at ~40% load means huge upgrade potential. Next-gen GPUs won't require PSU replacement. You've built in flexibility. That's professional-level thinking!",
];

// Storage expansion tip variations
const storageExpansionVariations = [
  "💾 Storage expansion tip: Your motherboard likely has additional M.2 slots. When you need more space (and you will – modern games are huge!), just add another NVMe drive. No need to replace what you have.",
  "💾 Storage upgrade path: Your board probably has 2-3 more M.2 slots. Modern games eat 100-150GB each. When you fill up (you will!), add another NVMe. Simple expansion, no reinstallation needed!",
  "💾 Future storage note: Extra M.2 slots on your motherboard = easy expansion. Star Citizen alone wants 100GB. Flight Sim 150GB. Plan to add another drive within 12 months. Simple plug-and-play!",
  "💾 Storage heads-up: You'll outgrow 1TB quickly (games are massive now). Your board has additional M.2 slots. Adding another drive later is trivial – 5-minute installation. Plan ahead!",
];

// ===== P0: GPU Upgrade Path Variations =====
const gpuUpgradeBudgetVariations = [
  "🎮 GPU upgrade path: In 18-24 months, RTX 50-series mid-range (e.g., 5060/5070) will offer +40% performance for £350-450. Your PSU and CPU can handle it. Timing: wait for price drops 6 months post-launch.",
  "🎮 Next GPU step: Budget for RTX 50-series or RDNA 4 in 2026-2027. Expect £300-400 for a solid uplift. Your current platform supports it. Pro tip: sell your GPU 3 months before new launch for best resale value!",
  "🎮 Future GPU: Current card will serve 2-3 years at 1080p. When upgrading, target £350-500 mid-tier (next-gen 5070 class). Your PSU/CPU ready. Wait for post-launch price stabilization (~6 months).",
];

const gpuUpgradeMidRangeVariations = [
  "🎮 GPU upgrade runway: Your card is solid for 2-3 years at 1440p. Next step: RTX 5080 or RX 8800 XT class in 2027 (£600-700). Your PSU has headroom. Consider timing upgrade with monitor refresh (1440p→4K).",
  "🎮 GPU future-proofing: 1440p 144Hz is this card's sweet spot. In 3-4 years, consider flagship-tier upgrade (RTX 6090 class, £800-1000). Your platform supports it. Strategy: skip one generation for better value jumps.",
  "🎮 Next GPU tier: Excellent 1440p performer now. Upgrade trigger: when you want 4K60 or 1440p 240Hz (2-3 years). Target: £600-800 tier. Your CPU won't bottleneck. Sell current GPU at 50-60% value beforehand.",
];

const gpuUpgradeHighEndVariations = [
  "🎮 GPU longevity: Flagship card = 4-5 year lifespan at high settings. No rush to upgrade. When you do (2028-2029), target next flagship (~£1200-1500). Your platform will still support it. Focus other upgrades first (monitor, storage).",
  "🎮 GPU strategy: You're at the top tier. Minimal upgrade need for 4+ years. If upgrading, skip 1-2 generations for meaningful gains (e.g., RTX 4090 → 6090). Consider selling ~18 months in for best resale (60-70% value).",
  "🎮 GPU future: This card crushes 4K. Upgrade only when you want 8K or 4K 240Hz (3-5 years). Next step: £1500+ flagship. Your PSU/CPU ready. Strategy: wait for compelling new features (better RT, AI upscaling gen).",
];

// ===== P0: CPU Bottleneck Warning Variations =====
const cpuBottleneckWarnings = [
  "⚠️ CPU upgrade constraint: Your current CPU will bottleneck if you upgrade beyond RTX 4070-class GPU. At 1080p/1440p high-refresh, CPU becomes the limit. Consider CPU+motherboard+RAM upgrade before moving to flagship GPUs.",
  "⚠️ CPU bottleneck alert: Pairing a much stronger GPU (e.g., RTX 4080+) will hit CPU limits in esports/simulation titles. Upgrade ceiling: ~RTX 4070 tier. Beyond that, budget for CPU platform refresh (£400-600 total).",
  "⚠️ Platform limitation: Your CPU is the upgrade bottleneck. GPU improvements beyond mid-tier won't yield proportional gains. Solution: Plan CPU+board+RAM upgrade (£500-700) before next flagship GPU purchase.",
];

// ===== P0: Motherboard/Platform Warning Variations =====
const motherboardGenWarnings = [
  "🔧 Platform heads-up: Your motherboard is PCIe 3.0. Fine now, but limits future Gen5 NVMe upgrades and may bottleneck flagship GPUs slightly (5-8%). When CPU upgrading, consider PCIe 4.0/5.0 board (B650/Z790+).",
  "🔧 Motherboard future-proofing: Current board is last-gen (PCIe 3.0/DDR4). Perfectly functional, but limits next-gen upgrades. When refreshing CPU (2-3 years), step to DDR5 + PCIe 4.0 platform for better longevity.",
  "🔧 Platform obsolescence note: Your chipset is aging (PCIe 3.0 era). Works great now, but newer tech (DDR5, Gen5 NVMe, PCIe 5.0 GPUs) won't be supported. Plan platform migration in 2-3 years when CPU upgrading.",
];

const motherboardDDR4Warnings = [
  "🔧 DDR4→DDR5 timing: You're on DDR4 (fine for now). DDR5 transition makes sense when CPU upgrading (2026-2027). Expect £100-150 premium for DDR5 board + RAM, but gains longevity. Don't rush – DDR4 still strong.",
  "🔧 Memory platform note: DDR4 is mature and stable. DDR5 offers 10-15% gains in CPU-bound tasks but costs more. Transition when your CPU needs upgrading (not before). By 2027, DDR5 will be price-competitive.",
];

// ===== P1: RAM Speed Upgrade Variations =====
const ramSpeedUpgradeVariations = [
  "📊 RAM speed upgrade: DDR4-3200 → DDR5-6000 requires motherboard+CPU change. Not worth it standalone. However, when you do platform upgrade (2-3 years), stepping to DDR5-6000 adds 8-12% CPU performance for £20-30 more. Future-proof choice!",
  "📊 RAM speed note: Current speed is solid. Faster RAM (DDR5) needs full platform swap. Wait until CPU upgrade time, then step to DDR5-6000 CL30 (£80-120 for 32GB). Gain: 10-15% in CPU-heavy tasks. Timing: 2026-2027.",
  "📊 Memory speed path: Upgrading RAM speed alone = poor value (requires new board+CPU). Keep current setup. When platform upgrading, go DDR5-6000+ for future-proofing. Incremental cost: £50-80. Performance: +8-15% in productivity.",
];

// ===== P1: Storage Type Upgrade Variations =====
const storageTypeUpgradeVariations = [
  "💽 Storage upgrade trigger: SATA→NVMe Gen4 cuts load times 40-60% (£80-120 for 1TB). Worth it if you do video editing or large file transfers. Gaming: modest 5-10s savings. Install alongside current drive, migrate OS later.",
  "💽 Storage tech upgrade: Your SATA SSD is the bottleneck. NVMe Gen4 (7000MB/s) costs £80-100 for 1TB, saves 30-50s in game loads and drastically speeds creative workflows. Easy upgrade – extra M.2 slot available!",
  "💽 NVMe upgrade path: Gen3→Gen4 NVMe gains 2-3x speed (£90-130 for 1TB). Real-world: faster app launches, quicker file operations. Gaming: minor. Content creation: significant. Upgrade when your workflow justifies it (12-18 months).",
];

const storageGen3toGen4Variations = [
  "💽 Storage Gen4 upgrade: Gen3→Gen4 NVMe doubles speed for £20-30 more (1TB ~£100). Benefit: 20-30s faster in large file transfers, DirectStorage games. Not urgent, but nice-to-have when expanding storage. Future-proof!",
  "💽 Gen4 NVMe timing: Your Gen3 drive is solid. Gen4 offers 2x speed for modest premium. Upgrade trigger: when adding second drive or if doing heavy video work. Cost: £90-120 for 1TB Gen4. Gain: better future game support (DirectStorage).",
];

// ===== P1: Monitor/GPU Sync Warning Variations =====
const monitorGPUSyncWarnings = [
  "🖥️ Monitor bottleneck! Your GPU is overkill for 1080p 60Hz. Upgrade to 1440p 144-165Hz (£250-350) to unlock your card's potential. You're leaving 50-70% performance on the table. This should be your NEXT upgrade – bigger impact than most hardware!",
  "🖥️ Critical: GPU wasted on 1080p! You're bottlenecked by your monitor, not PC. Step to 1440p 144Hz (£280-380) for immediate visual upgrade. Your GPU can push 120+ FPS easily. Biggest bang-for-buck upgrade available – prioritize this!",
  "🖥️ Monitor mismatch: High-end GPU on basic monitor = wasted potential. Upgrade to 1440p 144-165Hz IPS (£300-400) ASAP. Gain: buttery smoothness, better visuals. Your GPU is ready. This is more impactful than any internal component upgrade right now!",
];

const monitorGPUUpgradeSync = [
  "🖥️ Monitor upgrade timing: When you upgrade GPU next (2-3 years), also budget for monitor refresh. If going 4K, add £400-600 for 4K 144Hz. If staying 1440p, consider ultrawide (£500-700). Sync upgrades = better value!",
  "🖥️ Display future-proofing: Your GPU will handle 1440p for years. If upgrading monitor, consider 1440p ultrawide (£450-650) or 4K 144Hz (£500-800). Pair monitor upgrades with GPU refreshes for balanced spending.",
];

// ===== P1: Cooling Upgrade Triggers (not just missing) =====
const coolingUpgradeTriggers = [
  "❄️ Cooling upgrade path: Stock/tower cooler → 240mm AIO gains 10-15°C lower temps, better boost clocks (+100-200MHz sustained). Worth £80-100 if you do long rendering or want quieter operation. Easy installation!",
  "❄️ Cooling improvement: Upgrading to 280/360mm AIO (£100-140) drops temps 15-20°C vs stock, enables better overclocking, and runs quieter. Benefit: sustained boost clocks, component longevity. Upgrade timing: when you want more performance headroom.",
  "❄️ Thermal upgrade trigger: Your cooler is adequate, but AIO upgrade (£90-130) unlocks +5-10% sustained CPU performance in heavy workloads through better thermal headroom. Consider if you do video editing or heavy multitasking.",
];

// ===== P2: Platform Migration Timing =====
const platformMigrationVariations = [
  "🔄 Platform migration roadmap: AM4→AM5 or Intel 12th→14th gen makes sense in 2-3 years when CPU bottlenecks. Expect £500-700 (CPU+board+RAM). Gain: DDR5, PCIe 5.0, 20-30% CPU uplift. Don't rush – current platform has legs!",
  "🔄 Platform refresh timing: Your socket is mature (2-3 gens old). When upgrading CPU next (2026-2027), consider full platform jump vs same-socket upgrade. New platform: +£200-300 but future-proof. Same socket: cheaper but limited headroom.",
  "🔄 Socket migration note: Current platform nearing EOL. Next CPU upgrade = likely platform change (new socket/RAM/board). Budget £600-800 for full refresh vs £250-350 for CPU-only. Benefit: DDR5, modern I/O, better efficiency.",
  "🔄 Platform longevity: You're on last-gen socket. Works great now, but when CPU upgrading (2027+), you'll need motherboard+RAM too. Save accordingly – platform jumps cost 2-3× CPU-only upgrades but last 5-7 years.",
];

// ===== P2: Case Airflow Upgrade Tips =====
const caseAirflowUpgradeVariations = [
  "🌬️ Airflow upgrade tip: Poor case ventilation + high-power build = thermal throttling risk. Add 2-3 intake fans (£30-50 for quality pack). Gain: 5-10°C drop across all components, quieter operation. Easy DIY install!",
  "🌬️ Case cooling note: Your build pushes 400W+. If temps run high, upgrade case fans (3× 120mm intake, £40-60) before replacing cooler. Better airflow = cooler GPU, VRMs, SSD. Bigger impact than you'd think!",
  "🌬️ Thermal optimization: High-power system benefits from mesh-front case or fan pack upgrade (£50-80). Target: 3 front intake, 2 top/rear exhaust. Drops temps 8-12°C system-wide. Consider before CPU cooler upgrade!",
];

// ===== P2: Dual GPU / Capture Card Guidance =====
const secondaryGPUVariations = [
  "🎥 Streaming setup: If you stream, consider dedicated capture card (Elgato 4K60 Pro, £200-250) or second GPU for encoding. Frees up main GPU for gaming. Your motherboard likely has spare PCIe slot. Check clearance first!",
  "🎥 Content creator tip: Dual GPU (old card for encoding, new for gaming) costs £0 if you keep previous GPU. Install in second PCIe slot for OBS NVENC while gaming on primary. Check PSU wattage and case space!",
  "🎥 Capture hardware: Serious streaming? Dedicated capture card (£150-300) offloads encoding from GPU, better quality, lower latency. Requires free PCIe x4 slot. Alternative: AV.io 4K USB capture (no slot needed, £250).",
];

// ===== P2: Sequential Upgrade Roadmap =====
const sequentialRoadmapVariations = [
  "🗓️ 12-month upgrade roadmap: Now→6mo: Monitor (if needed), RAM capacity. 6-12mo: Storage expansion, case fans. 12-24mo: GPU (if prices drop). 24-36mo: CPU platform refresh. Spread costs, maximize value!",
  "🗓️ Upgrade sequence strategy: Prioritize: 1) Monitor (unlocks GPU), 2) RAM (cheap, immediate gain), 3) Storage (as needed), 4) GPU (when next-gen stable), 5) CPU/platform (when bottlenecked). Sequence matters!",
  "🗓️ Smart upgrade timeline: Year 1: Monitor + RAM if needed. Year 2: GPU when prices normalize post-launch. Year 3: CPU + motherboard + RAM platform jump. Avoids costly mistakes and maximizes component lifespan!",
  "🗓️ Long-term build plan: Your current rig: 2-3 years as-is. First upgrade: GPU (2027). Second: Full platform (2028-2029). Meanwhile: add storage/RAM as needed. This spreads £1500-2000 in upgrades over 4-5 years vs all at once.",
];

// ===== P2: High-Power Build Specific =====
const highPowerBuildVariations = [
  "⚡ High-power build note: 500W+ system. Ensure: quality PSU (80+ Gold minimum), good case airflow (3+ intake fans), AIO cooling for CPU. These aren't optional – thermal/power issues cause instability. You're pushing limits!",
  "⚡ Performance build requirements: Your wattage is serious (600W+). Mandatory: 850W+ PSU with headroom, mesh-front case, strong CPU cooling. Skimping here = crashes, throttling, shortened component life. Budget for proper infrastructure!",
];

// ===== P3: Price Anchoring (link upgrade costs to build value) =====
const priceAnchoredUpgradeVariations = [
  "💰 Budget-friendly upgrade: RAM capacity doubling (£60-80) = ~5-8% of your build cost. Immediate multitasking gains, easy install. Best price-to-performance upgrade available right now!",
  "💰 Smart spending: Monitor upgrade (£250-350) = ~15-20% of build cost but transforms experience. More impactful than GPU step-up at this tier. Prioritize display over internal upgrades!",
  "💰 Value upgrade: Adding 1TB NVMe (£80-100) = <10% of build cost. Cheap insurance vs running out of space. Install alongside current drive, no reinstall needed. Future-proof now!",
];

// ===== P3: Performance Gain Estimates =====
const performanceGainEstimates = [
  "📊 Upgrade impact: DDR4-3200→DDR5-6000 = +10-15% CPU-bound performance (productivity, simulation). Gaming: +5-8% at 1080p, minimal at 4K. Real-world: snappier app launches, faster compiles.",
  "📊 Performance math: Gen3→Gen4 NVMe = 2-3× sequential speed but only 10-20% faster game loads (CPU/decompression limited). Content creation: significant. Casual gaming: minor. Set expectations accordingly!",
  "📊 FPS impact: GPU upgrade (4060→4070) = +30-40% average FPS at 1440p. CPU upgrade (R5→R7) = +15-25% in CPU-heavy titles, minimal in GPU-bound. Know your bottleneck before spending!",
  "📊 Real gains: 240mm→360mm AIO = 8-12°C cooler, +100-200MHz sustained boost clocks = +3-5% multi-core performance in long workloads. Gaming: minimal. Rendering/encoding: noticeable.",
];

// ===== P3: Compatibility Pre-Checks =====
const compatibilityPreChecks = [
  "✅ Compatibility reminder: DDR5 requires new motherboard + CPU (AM5/LGA1700+). Can't mix-and-match with DDR4 platform. Budget full platform refresh, not RAM alone. Check socket support first!",
  "✅ Upgrade pre-check: PCIe 5.0 NVMe needs Gen5-capable board (B650E/X670E/Z790). Gen4 boards won't utilize full speed. Verify chipset before buying flagship SSD. Gen4 is plenty for most users!",
  "✅ Before upgrading: AIO coolers need case clearance (240mm = ~280mm length, 360mm = ~400mm). Check case specs + GPU length. Top-mount may hit RAM. Front-mount may limit GPU. Measure first!",
  "✅ Platform check: Your motherboard max RAM speed (check QVL list). Buying 6400MHz RAM on board capped at 5600MHz = wasted money. Match kit to board capability, not wishful thinking!",
];

// ===== P3: Resale Value Notes =====
const resaleValueNotes = [
  "💵 Resale planning: High-end GPUs hold 60-70% value for 12-18 months, then drop sharply. Sell 3-6 months before new gen launch for best return. Mid-tier cards: 50% at 12mo, 35% at 24mo.",
  "💵 Component depreciation: CPUs hold value well (70% at 2yrs). GPUs depreciate fastest (50% at 18mo). RAM/storage stable (60% at 3yrs). Plan upgrades around resale curves – timing is money!",
  "💵 Upgrade economics: Selling old GPU before new gen launch = recover 65-75% cost. Waiting 6mo post-launch = 45-55%. Early sell + wait for price stabilization = best strategy (patience pays).",
  "💵 Resale tip: Keep original box, receipt, warranty. Adds 10-15% resale value. Flagship GPU 18mo old with box = £600-700 vs £500-550 without. Original packaging signals care, commands premium!",
];

/**
 * Generate contextual upgrade recommendations based on current build
 * Returns array of personalised upgrade path suggestions
 */
export const getUpgradeSuggestions = (
  components: UpgradeComponents,
  totalPrice: number
): string[] => {
  const upgradeNotes: string[] = [];
  const {
    ramCap,
    cores,
    vram,
    estimatedLoad,
    wattage,
    cooling,
    storage,
    gpuName,
    cpuName: _cpuName,
    motherboardChipset,
    ramSpeed,
    ramType,
    pcieGen,
    tdpCpu,
    gpuPower,
    caseAirflow,
    caseFans,
  } = components;

  // Helper: Determine GPU tier
  const getGPUTier = (): "budget" | "mid-range" | "high-end" | "flagship" => {
    const name = (gpuName || "").toLowerCase();
    if (name.includes("4090") || name.includes("7900 xtx") || vram >= 20)
      return "flagship";
    if (
      name.includes("4080") ||
      name.includes("4070 ti") ||
      name.includes("7900 xt") ||
      vram >= 16
    )
      return "high-end";
    if (
      name.includes("4070") ||
      name.includes("4060 ti") ||
      name.includes("7800") ||
      vram >= 10
    )
      return "mid-range";
    return "budget";
  };

  // Helper: Determine CPU tier (rough cores-based)
  const getCPUTier = (): "budget" | "mid-range" | "high-end" => {
    if (cores >= 12) return "high-end";
    if (cores >= 8) return "mid-range";
    return "budget";
  };

  const gpuTier = getGPUTier();
  const cpuTier = getCPUTier();

  // ===== P0: GPU Upgrade Paths =====
  if (gpuTier === "budget" && totalPrice >= 800) {
    const variation =
      gpuUpgradeBudgetVariations[
        Math.floor(Math.random() * gpuUpgradeBudgetVariations.length)
      ];
    upgradeNotes.push(variation);
  } else if (gpuTier === "mid-range" && totalPrice >= 1200) {
    const variation =
      gpuUpgradeMidRangeVariations[
        Math.floor(Math.random() * gpuUpgradeMidRangeVariations.length)
      ];
    upgradeNotes.push(variation);
  } else if (gpuTier === "high-end" || gpuTier === "flagship") {
    const variation =
      gpuUpgradeHighEndVariations[
        Math.floor(Math.random() * gpuUpgradeHighEndVariations.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P0: CPU Bottleneck Warnings =====
  // Low-end CPU with high-end GPU = bottleneck warning
  if (
    cpuTier === "budget" &&
    (gpuTier === "high-end" || gpuTier === "flagship")
  ) {
    const variation =
      cpuBottleneckWarnings[
        Math.floor(Math.random() * cpuBottleneckWarnings.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P0: Motherboard/Platform Warnings =====
  // PCIe 3.0 platform with high-tier GPU
  if (
    typeof pcieGen === "number" &&
    pcieGen <= 3 &&
    (gpuTier === "high-end" || gpuTier === "flagship")
  ) {
    const variation =
      motherboardGenWarnings[
        Math.floor(Math.random() * motherboardGenWarnings.length)
      ];
    upgradeNotes.push(variation);
  }

  // DDR4 platform reminder (only for higher-end builds)
  if (
    ramType === "DDR4" &&
    totalPrice >= 1500 &&
    Math.random() < 0.4 // 40% chance to avoid spam
  ) {
    const variation =
      motherboardDDR4Warnings[
        Math.floor(Math.random() * motherboardDDR4Warnings.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P1: RAM Speed Upgrade Guidance =====
  if (
    typeof ramSpeed === "number" &&
    ramSpeed < 3600 &&
    ramType === "DDR4" &&
    totalPrice >= 1000 &&
    Math.random() < 0.3
  ) {
    const variation =
      ramSpeedUpgradeVariations[
        Math.floor(Math.random() * ramSpeedUpgradeVariations.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P1: Storage Type Upgrades =====
  const storageInterface = (storage?.interface || "").toLowerCase();
  if (storageInterface.includes("sata") && totalPrice >= 800) {
    const variation =
      storageTypeUpgradeVariations[
        Math.floor(Math.random() * storageTypeUpgradeVariations.length)
      ];
    upgradeNotes.push(variation);
  } else if (
    storageInterface.includes("nvme") &&
    storageInterface.includes("gen3") &&
    totalPrice >= 1200 &&
    Math.random() < 0.35
  ) {
    const variation =
      storageGen3toGen4Variations[
        Math.floor(Math.random() * storageGen3toGen4Variations.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P1: Monitor/GPU Sync Warnings =====
  // High-end GPU likely wasted on 1080p (we don't have monitor data, but infer from GPU tier)
  if (
    (gpuTier === "high-end" || gpuTier === "flagship") &&
    Math.random() < 0.5
  ) {
    const variation =
      monitorGPUSyncWarnings[
        Math.floor(Math.random() * monitorGPUSyncWarnings.length)
      ];
    upgradeNotes.push(variation);
  } else if (gpuTier === "mid-range" && Math.random() < 0.3) {
    const variation =
      monitorGPUUpgradeSync[
        Math.floor(Math.random() * monitorGPUUpgradeSync.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P1: Cooling Upgrade Triggers =====
  const coolerType = (cooling?.type || "").toLowerCase();
  const coolerName = (cooling?.name || "").toLowerCase();
  const hasBasicCooling =
    coolerType.includes("stock") ||
    coolerType.includes("air") ||
    coolerName.includes("stock");
  if (
    hasBasicCooling &&
    cores >= 8 &&
    totalPrice >= 1000 &&
    Math.random() < 0.35
  ) {
    const variation =
      coolingUpgradeTriggers[
        Math.floor(Math.random() * coolingUpgradeTriggers.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P2: Platform Migration Timing =====
  // Detect old platforms (PCIe 3.0, DDR4 on budget chipsets)
  const isOldPlatform =
    (typeof pcieGen === "number" && pcieGen <= 3) ||
    (ramType === "DDR4" &&
      motherboardChipset &&
      /B450|X470|B550|Z390|Z490/.test(motherboardChipset));
  if (
    isOldPlatform &&
    totalPrice >= 1000 &&
    cpuTier !== "budget" &&
    Math.random() < 0.35
  ) {
    const variation =
      platformMigrationVariations[
        Math.floor(Math.random() * platformMigrationVariations.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P2: Case Airflow Upgrades =====
  const totalSystemPower = (tdpCpu || 0) + (gpuPower || 0);
  const hasWeakAirflow =
    caseAirflow === "Poor" ||
    caseAirflow === "Unknown" ||
    (typeof caseFans === "number" && caseFans < 3);
  if (
    totalSystemPower >= 400 &&
    hasWeakAirflow &&
    totalPrice >= 1000 &&
    Math.random() < 0.3
  ) {
    const variation =
      caseAirflowUpgradeVariations[
        Math.floor(Math.random() * caseAirflowUpgradeVariations.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P2: Secondary GPU / Capture Card =====
  // Only suggest for higher-tier builds where streaming makes sense
  if (
    totalPrice >= 1500 &&
    (gpuTier === "high-end" || gpuTier === "flagship") &&
    Math.random() < 0.15
  ) {
    const variation =
      secondaryGPUVariations[
        Math.floor(Math.random() * secondaryGPUVariations.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P2: Sequential Upgrade Roadmap =====
  // Provide long-term planning for mid-to-high tier builds
  if (totalPrice >= 1200 && totalPrice < 2500 && Math.random() < 0.25) {
    const variation =
      sequentialRoadmapVariations[
        Math.floor(Math.random() * sequentialRoadmapVariations.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P2: High-Power Build Warnings =====
  if (totalSystemPower >= 500 && Math.random() < 0.3) {
    const variation =
      highPowerBuildVariations[
        Math.floor(Math.random() * highPowerBuildVariations.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P3: Price Anchoring =====
  // Contextual upgrade suggestions based on build value
  if (
    totalPrice >= 800 &&
    totalPrice < 1500 &&
    ramCap === 16 &&
    Math.random() < 0.25
  ) {
    upgradeNotes.push(priceAnchoredUpgradeVariations[0]); // RAM upgrade
  } else if (
    (gpuTier === "high-end" || gpuTier === "flagship") &&
    Math.random() < 0.2
  ) {
    upgradeNotes.push(priceAnchoredUpgradeVariations[1]); // Monitor priority
  } else if (
    (storage?.capacity ?? 0) <= 1000 &&
    totalPrice >= 1000 &&
    Math.random() < 0.2
  ) {
    upgradeNotes.push(priceAnchoredUpgradeVariations[2]); // Storage expansion
  }

  // ===== P3: Performance Gain Estimates =====
  // Provide realistic performance expectations (random selection, low probability)
  if (Math.random() < 0.2) {
    const variation =
      performanceGainEstimates[
        Math.floor(Math.random() * performanceGainEstimates.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P3: Compatibility Pre-Checks =====
  // Educational reminders about compatibility (context-specific, low probability)
  if (ramType === "DDR4" && totalPrice >= 1200 && Math.random() < 0.15) {
    upgradeNotes.push(compatibilityPreChecks[0]); // DDR5 platform requirement
  } else if (cooling && cores >= 8 && Math.random() < 0.15) {
    upgradeNotes.push(compatibilityPreChecks[2]); // AIO clearance check
  } else if (Math.random() < 0.1) {
    const variation =
      compatibilityPreChecks[
        Math.floor(Math.random() * compatibilityPreChecks.length)
      ];
    upgradeNotes.push(variation);
  }

  // ===== P3: Resale Value Notes =====
  // Strategic selling guidance for higher-tier builds
  if (
    (gpuTier === "high-end" || gpuTier === "flagship") &&
    Math.random() < 0.2
  ) {
    const variation =
      resaleValueNotes[Math.floor(Math.random() * resaleValueNotes.length)];
    upgradeNotes.push(variation);
  }

  // ===== ORIGINAL FEATURES (preserved) =====

  // RAM upgrade path: 16GB with high-end GPU
  if (ramCap === 16 && vram >= 10) {
    const randomVariation =
      ramUpgradeVariations[
        Math.floor(Math.random() * ramUpgradeVariations.length)
      ];
    upgradeNotes.push(randomVariation);
  }

  // Missing cooling alert: No cooler with 6+ cores
  if (!cooling && cores >= 6) {
    const randomVariation =
      coolingAlertVariations[
        Math.floor(Math.random() * coolingAlertVariations.length)
      ];
    upgradeNotes.push(randomVariation);
  }

  // PSU headroom bonus: Excellent future-proofing
  if (estimatedLoad > 0 && estimatedLoad < 0.5 && wattage >= 850) {
    const randomVariation =
      psuHeadroomVariations[
        Math.floor(Math.random() * psuHeadroomVariations.length)
      ];
    upgradeNotes.push(randomVariation);
  }

  // Storage expansion tip: Small storage in premium build
  if ((storage?.capacity ?? 0) < 1000 && totalPrice >= 1200) {
    const randomVariation =
      storageExpansionVariations[
        Math.floor(Math.random() * storageExpansionVariations.length)
      ];
    upgradeNotes.push(randomVariation);
  }

  return upgradeNotes;
};
