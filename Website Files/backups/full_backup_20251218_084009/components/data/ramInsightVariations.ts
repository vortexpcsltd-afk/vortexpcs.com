/**
 * RAM Capacity Insight Variations for Kevin's Insight
 *
 * Contains capacity-based RAM recommendations and real-world use case scenarios.
 * These variations help users understand if their RAM choice is appropriate for their needs.
 *
 * Usage: Import getRAMInsight() and pass RAM capacity, CPU, and GPU data.
 */

// 128GB+ RAM variations - enterprise/workstation tier
export const extreme128Variations = [
  (ramCap: number) =>
    `${ramCap}GB of RAM provides extreme headroom for workstation-class tasks: multi-layer 4K/8K video editing, large game/engine builds, running numerous Docker containers or virtual machines, and in‑memory data processing. For pure gaming it's beyond current requirements, but it eliminates memory bottlenecks and maximises multitasking freedom.`,
  (ramCap: number) =>
    `Absolute unit of RAM! ${ramCap}GB is enterprise-grade memory capacity. You can run 6+ VMs simultaneously, work with 8K RED footage without proxies, or compile massive codebases in RAM. For gaming? Massive overkill. For professional workloads? This is your productivity superpower. No memory warnings ever again!`,
  (ramCap: number) =>
    `${ramCap}GB?! You're not messing around! 🚀 This is what Fortune 500 workstations use. You could have 200 Chrome tabs open, render 8K video, run multiple VMs, and still have headroom. Gaming doesn't need this, but if you're doing serious creative or dev work, you've just eliminated RAM as a bottleneck forever.`,
];

// CPU bottleneck warning for 128GB+ with low core count
export const cpuBottleneckVariations = [
  (ramCap: number) =>
    `Consider a higher‑core CPU if you plan to fully exploit ${ramCap}GB with heavy parallel workloads (rendering, multiple VMs). Your current core count may become the limiting factor before memory capacity does.`,
  (ramCap: number) =>
    `Quick note: With ${ramCap}GB, your CPU might become the bottleneck before RAM does. If you're running heavy parallel workloads (multiple VMs, large renders), consider upgrading to 12+ cores to fully utilize this memory capacity.`,
  (ramCap: number) =>
    `Pro tip: ${ramCap}GB of RAM wants more CPU cores to play with! For workstation workloads (VMs, compilation, rendering), you'll hit CPU limits before memory limits. Consider 12+ core upgrade if budget allows.`,
];

// 96GB RAM variations - professional creative tier
export const high96Variations = [
  (ramCap: number) =>
    `${ramCap}GB is a high‑capacity configuration tailored for demanding creative pipelines (large Unreal/Unity projects, complex timelines, simultaneous VMs). It ensures minimal paging and consistent performance under heavy concurrency.`,
  (ramCap: number) =>
    `${ramCap}GB is serious professional territory. Perfect for 4K/6K multicam editing, large 3D projects, or running multiple development environments. You'll never see 'out of memory' errors. This is what serious creators use to stay productive.`,
  (ramCap: number) =>
    `Impressive RAM allocation! ${ramCap}GB handles professional workflows with ease – think massive Photoshop files, After Effects compositions, or large Unity scenes. Memory will never be your bottleneck. Smart investment for creative professionals.`,
];

// 64GB RAM variations - prosumer/enthusiast tier
export const high64Variations = [
  (ramCap: number) =>
    `${ramCap}GB gives you professional workflow flexibility – 4K video editing with effects, simultaneous development environments, and virtual machines – whilst future‑proofing for next‑gen game memory footprints. DDR5-6000 CL30 is the sweet spot here. Dual-channel 2x32GB config optimal for stability.`,
  (ramCap: number) =>
    `${ramCap}GB is the sweet spot for content creators and power users. You can edit 4K video smoothly, run Docker containers, have 50+ browser tabs, and still game on the side. This is 'pro-grade without the pro-price' territory. Platform note: AM5/LGA1700 with DDR5-6000+ recommended. Excellent choice!`,
  (ramCap: number) =>
    `Future-proof capacity! ${ramCap}GB means you're set for the next 5+ years. 4K editing? Smooth. Heavy multitasking? No problem. Next-gen games? Bring it on. Speed matters: DDR5-5600 minimum, 6000 CL30 ideal. You've invested wisely in the one component that's always worth having extra of.`,
  (ramCap: number) =>
    `${ramCap}GB is what I call 'worry-free computing'. Whether you're rendering, editing, coding, or gaming, you'll never hit memory limits. Pro tip: 2x32GB dual-channel beats 4x16GB for stability. DDR5-6000 CL30 is the productivity sweet spot. This is the professional tier without professional pain!`,
];

// 48GB RAM variations - prosumer creative tier (2x24GB kits)
export const high48Variations = [
  `48GB (2x24GB) is the creative sweet spot many overlook! Perfect for 4K editing, large Photoshop projects, and game development without jumping to 64GB cost. DDR5-6000 CL30 recommended. This capacity hits the value-performance intersection beautifully. More affordable than 64GB, way more capable than 32GB.`,
  `Smart choice! 48GB handles professional workflows that exceed 32GB without the premium of 64GB. Video editors love this capacity – multicam 4K editing stays smooth, RAM preview never stutters. Platform: AM5/LGA1700 with DDR5-6000. The unsung hero of RAM configurations! £120-150 vs £180+ for 64GB.`,
  `48GB is the creative professional's secret weapon! 2x24GB dual-channel gives you editing headroom, VM capacity, and development flexibility. Games use 10-16GB, leaving 30GB+ for creative apps. DDR5-5600 minimum, 6000 CL30 optimal. This is the capacity I recommend for serious creators on realistic budgets.`,
  `Excellent mid-high capacity! 48GB means you're never closing apps to free RAM. 4K Premiere timelines with effects? Smooth. Large Unity/Unreal scenes? No problem. Heavy multitasking? Easy. Platform compatibility: All DDR5 boards support 2x24GB. Better value per GB than 32GB, more affordable than 64GB. Smart buy!`,
];

// 32GB RAM variations - enthusiast sweet spot
export const mid32Variations = [
  `32GB strikes the balance for enthusiast gaming and creation – smooth 4K footage editing, large browser session + Discord + capture tools – without incurring diminishing returns. Speed: DDR5-6000 CL30 ideal (AM5/Intel 13th-15th gen) or DDR4-3600 CL16 (AM4/Intel 12th gen DDR4). Dual-channel 2x16GB configuration essential!`,
  `32GB is the enthusiast sweet spot in 2025. Perfect for gaming + streaming, 1080p/4K editing, and heavy multitasking. You won't hit limits in normal use, and you're not over-paying for capacity you won't use. Platform guide: DDR5-6000 for AM5/LGA1700, DDR4-3600 for AM4/B660. This is the Goldilocks zone! 🐻`,
  `Excellent RAM choice! 32GB handles everything most users need: AAA gaming, content creation, development work, and productivity – all simultaneously. It's the most popular capacity I recommend because it just works for 90% of use cases. Speed tip: AMD benefits from 6000MHz+, Intel happy with 5600-6400MHz. Latency: CL30 or better.`,
  `32GB is what I call 'confident computing'. Game while streaming? Check. Edit 4K footage? Check. 100 Chrome tabs? Still check. You've got headroom without waste. Tech spec: 2x16GB dual-channel mandatory (40-50% faster than single-channel!). DDR5-6000 CL30 is the sweet spot. This is exactly what I'd choose for a balanced enthusiast build.`,
  `32GB future-proofs gaming while enabling creation. Modern games use 10-16GB at 1440p/4K, leaving headroom for OBS, Discord, browser. DDR5 vs DDR4: If building new, DDR5-6000 (AM5/LGA1700). Upgrading AM4? DDR4-3600 CL16 fine. Cost: £80-120 for quality kits. Best capacity-per-pound for enthusiasts Dec 2025.`,
  `Perfect capacity for 95% of gamers and creators! 32GB means games never stutter from memory pressure, creative apps stay responsive, and multitasking is effortless. Speed matters: 7800X3D loves DDR5-6000 CL30, Intel 14th gen happy with 6400-7200MHz. Avoid RGB tax unless aesthetics matter – save £20-40 for same performance. Smart allocation!`,
];

// 24GB RAM variations - awkward middle ground
export const mid24Variations = [
  `24GB is an unusual capacity – likely 2x12GB or 8GB+16GB mixed. Gaming is fine (10-16GB used), but content creation will feel cramped vs 32GB. If budget allows, jump to 32GB for better futureproofing. If upgrading from 16GB, adding another 8GB stick temporarily works but limits dual-channel performance.`,
  `24GB sits awkwardly between tiers. Adequate for gaming but insufficient for serious content work. Upgrade path: If you have 2x8GB, sell and buy 2x16GB (32GB) for dual-channel. If you have 1x16GB + 1x8GB (not ideal), replace with 2x16GB matched kit. Cost: ~£80 for 32GB DDR5-6000. Worth it!`,
  `Borderline capacity in 2025. Games run fine (most use 10-16GB), but 4K editing and heavy multitasking will hit limits. 32GB is only £30-50 more and provides meaningful headroom. If you're on 24GB due to budget, prioritize RAM upgrade after GPU/CPU. Memory pressure causes stuttering even with powerful components.`,
];

// 16GB RAM variations - minimum for modern gaming
export const mid16Variations = [
  `16GB remains solid for modern gaming and everyday multitasking. If you plan heavier creative workloads (Premiere with complex timelines, large texture packs), 32GB is the next sensible step. CRITICAL: Must be dual-channel 2x8GB! Single 1x16GB stick loses 40-50% memory performance. Speed: DDR5-5600 minimum, DDR4-3200 minimum.`,
  `16GB is the minimum I'd recommend in 2025 for gaming. It'll handle AAA titles and moderate multitasking fine. But if you're planning content creation or heavy browser use, consider 32GB – prices have dropped significantly. Think of 16GB as 'baseline adequate' rather than 'comfortable'. Config: 2x8GB dual-channel mandatory. DDR5-6000 or DDR4-3600 optimal.`,
  `16GB works for gaming-focused builds on a budget. Modern games will run smoothly, but you'll want to close background apps for optimal performance. 32GB would give you more breathing room, but this gets the job done if funds are tight. Platform: AM4 DDR4-3200 (£40-50), AM5 DDR5-6000 (£50-65). Upgrade path: Add another 2x8GB kit later for 32GB total.`,
  `Adequate for pure gaming, but borderline for multitasking. 16GB is what I call 'sufficient but not comfortable' in 2025. Games run fine, but content creation or heavy Chrome usage will push limits. Budget allowing, 32GB is worth the upgrade (only £30-40 more). Speed impact: DDR5-6000 gives 5-10% gaming FPS boost vs 4800MHz on Ryzen 7000/9000.`,
  `Minimum viable capacity for 2025 gaming. AAA titles at 1440p/4K use 10-14GB, leaving little headroom. Close Discord/Chrome for optimal FPS. Upgrade priority: If you're at 16GB with high-end GPU (4070+/7800XT+), jump to 32GB next (£80). RAM bottlenecks cause stuttering despite powerful GPU/CPU. Config: 2x8GB dual-channel essential!`,
  `16GB is 2025's baseline, not the target. Flight Sim 2024, Starfield, and modern AAA titles push 12-15GB usage. You'll manage but won't multitask comfortably. Upgrade cost: 2x8GB DDR5-6000 = £50-65 | 2x16GB DDR5-6000 = £80-100. That £30 difference buys massive peace of mind. Speed: AMD Ryzen benefits most from 6000MHz+ (Infinity Fabric sync).`,
];

// Single-channel RAM warning variations
export const singleChannelWarning = [
  `⚠️ **Critical RAM Config Issue**: Running single-channel RAM (1 stick) loses 40-50% memory bandwidth vs dual-channel (2 sticks). This causes FPS drops and stuttering even with powerful GPU/CPU. Always use matched pairs: 2x8GB, 2x16GB, or 2x32GB. Memory bandwidth matters as much as capacity! Install in slots A2+B2 (check motherboard manual).`,
  `🚩 **Single-Channel Detected**: You're leaving massive performance on the table! Memory bandwidth is halved with 1 stick vs 2 matched sticks. Impact: 10-30% FPS loss in CPU-bound games, slower app loading, encoding stutters. Fix: Replace with 2-stick kit or add matching stick. Example: 1x16GB → 2x8GB dual-channel is faster! Slots: A2+B2 or consult manual.`,
  `⚠️ **Memory Bandwidth Warning**: Single-channel configuration detected! This is a common mistake that kills performance. Dual-channel (2 sticks) is mandatory for modern PCs. Performance loss: 15-25% in gaming, 30-40% in productivity. Solution: Buy matched 2-stick kit. Cost: £40-50 for 2x8GB DDR5-6000, £80-100 for 2x16GB. Install in correct slots (usually A2+B2).`,
];

// <16GB RAM variations - insufficient for modern use
export const low8Variations = [
  (ramCap: number) =>
    `${ramCap}GB is entry‑level today. Upgrading to 16GB or 32GB will noticeably improve game minimum frame rates and heavy browser multitasking. Cost: 2x8GB DDR4-3200 = £40-50 | DDR5-6000 = £50-65. This is THE most impactful upgrade for your experience. Priority #1!`,
  (ramCap: number) =>
    `${ramCap}GB is limiting in 2025, mate. Modern games want 16GB minimum, and Windows alone uses 4-6GB. You'll experience stuttering in AAA titles and constant memory warnings. Upgrade to 16GB ASAP (£50-65 for DDR5-6000 2x8GB) – it's the single most impactful change you can make here. Dual-channel mandatory (2 sticks)!`,
  (ramCap: number) =>
    `Red flag! 🚩 ${ramCap}GB isn't enough for modern PC gaming. You'll hit memory limits constantly, causing stuttering and crashes. This is THE critical upgrade needed. 16GB minimum (2x8GB £50-65), 32GB ideal (2x16GB £80-100). Platform: Check if your board supports DDR4 or DDR5. Trust me, your gaming experience will transform overnight!`,
  (ramCap: number) =>
    `${ramCap}GB? That's 2018 spec, not 2025! Even budget builds need 16GB today. You're severely limiting performance here. Games will stutter, apps will crash, and you'll be frustrated. Make RAM upgrade priority #1. Compatibility: AM4/Intel 10th-12th = DDR4-3200/3600 | AM5/Intel 13th-15th = DDR5-6000. Budget: £40-65 transforms your PC.`,
  (ramCap: number) =>
    `Critical bottleneck alert! ${ramCap}GB causes system-wide performance issues. Windows 11 alone wants 8GB, leaving nothing for games/apps. Symptoms: Stuttering, freezing, crashes, slow app switching. Solution: 2x8GB (16GB) minimum = £50-65 | 2x16GB (32GB) recommended = £80-100. This upgrade delivers bigger real-world improvements than GPU in many cases!`,
];

// DDR5 vs DDR4 guidance variations
export const ddr5VsDdr4Variations = [
  `**DDR5 vs DDR4**: If building new (AM5/LGA1700), DDR5-6000 CL30 is the sweet spot (£80-120 for 32GB). DDR5 gives 5-10% gaming boost on Ryzen 7000/9000, less on Intel. If upgrading AM4/older Intel, DDR4-3600 CL16 is fine (£60-80 for 32GB). Don't pay premium for DDR5-7200+ – diminishing returns beyond 6400MHz.`,
  `**Platform RAM Guide**: AM5 (Ryzen 7000/9000) = DDR5-6000 CL30 optimal (FCLK 2000MHz sync). Intel 13th-15th gen = DDR5-5600 to 6400MHz flexible. AM4 (Ryzen 5000) = DDR4-3600 CL16 sweet spot. Intel 10th-12th DDR4 = DDR4-3200/3600. Price: DDR5 32GB = £80-100 | DDR4 32GB = £60-80. DDR5 worth it for new builds, not for AM4 upgrades.`,
  `**Memory Technology**: DDR5 advantages: Higher bandwidth (38-51 GB/s vs 25-29 GB/s DDR4), better scaling for iGPU/APU, lower voltage (1.1V vs 1.35V). Real-world impact: 3-8% gaming FPS, 10-15% productivity. Cost premium: £20-30 for 32GB. Worth it? Yes for AM5/LGA1700 new builds. No for AM4/older Intel upgrades – stick with DDR4-3600.`,
];

// RAM speed/timing variations
export const ramSpeedVariations = [
  `**Speed Matters**: AMD Ryzen 7000/9000 loves DDR5-6000 CL30 (Infinity Fabric sweet spot). Intel 13th-15th gen flexible (5600-6400MHz). Impact: 5-10% gaming FPS, 8-15% productivity. Cost: DDR5-6000 CL30 32GB = £80-100 | DDR5-7200 CL34 32GB = £150+ (not worth premium). Timings: CL30 or CL32 ideal. Avoid CL40+ (cheap but slow).`,
  `**RAM Timings Explained**: CAS Latency (CL) is delay in clock cycles. Lower = faster. DDR5-6000 CL30 beats DDR5-6400 CL40! Calculate true latency: (CL ÷ MHz) × 2000. Target: DDR5-6000 CL30 (10ns) or DDR4-3600 CL16 (8.9ns). Don't overpay for RGB: Same spec non-RGB kit saves £20-40. Performance: Identical.`,
  `**Platform Speed Guide**: Ryzen 9000 (Zen 5): DDR5-6000 CL30 optimal | Ryzen 7000 (Zen 4): DDR5-6000 CL30 optimal | Ryzen 5000 (Zen 3): DDR4-3600 CL16 optimal | Intel 14th gen: DDR5-6000-7200 flexible | Intel 13th gen: DDR5-5600-6400 flexible. XMP/EXPO: Enable in BIOS for rated speeds (most boards auto-detect). Stability: 6000MHz CL30 > 7200MHz CL40.`,
];

/**
 * Get RAM capacity insights with recommendations based on capacity and system specs
 * @param ramCap - RAM capacity in GB
 * @param cpu - CPU object with cores property
 * @param _gpu - GPU object (reserved for future use)
 * @returns Array of insight strings (may include CPU bottleneck warning, DDR5 guidance, speed tips)
 */
export function getRAMInsight(
  ramCap: number,
  cpu?: { cores?: number },
  _gpu?: unknown
): string[] {
  const comments: string[] = [];

  if (ramCap >= 128) {
    // 128GB+ tier - enterprise/workstation
    const variation =
      extreme128Variations[
        Math.floor(Math.random() * extreme128Variations.length)
      ];
    comments.push(variation(ramCap));

    // Add CPU bottleneck warning if CPU has fewer than 12 cores
    if (cpu && (cpu.cores ?? 0) < 12) {
      const bottleneckVariation =
        cpuBottleneckVariations[
          Math.floor(Math.random() * cpuBottleneckVariations.length)
        ];
      comments.push(bottleneckVariation(ramCap));
    }
  } else if (ramCap >= 96) {
    // 96GB tier - professional creative
    const variation =
      high96Variations[Math.floor(Math.random() * high96Variations.length)];
    comments.push(variation(ramCap));
  } else if (ramCap >= 64) {
    // 64GB tier - prosumer/enthusiast
    const variation =
      high64Variations[Math.floor(Math.random() * high64Variations.length)];
    comments.push(variation(ramCap));
  } else if (ramCap >= 48 && ramCap < 64) {
    // 48GB tier - creative sweet spot
    const variation =
      high48Variations[Math.floor(Math.random() * high48Variations.length)];
    comments.push(variation);
  } else if (ramCap >= 32 && ramCap < 48) {
    // 32GB tier - enthusiast sweet spot
    const variation =
      mid32Variations[Math.floor(Math.random() * mid32Variations.length)];
    comments.push(variation);

    // Randomly add DDR5 vs DDR4 or speed guidance (25% chance)
    if (Math.random() < 0.25) {
      const techVariation =
        Math.random() < 0.5
          ? ddr5VsDdr4Variations[
              Math.floor(Math.random() * ddr5VsDdr4Variations.length)
            ]
          : ramSpeedVariations[
              Math.floor(Math.random() * ramSpeedVariations.length)
            ];
      comments.push(techVariation);
    }
  } else if (ramCap >= 24 && ramCap < 32) {
    // 24GB tier - awkward middle ground
    const variation =
      mid24Variations[Math.floor(Math.random() * mid24Variations.length)];
    comments.push(variation);
  } else if (ramCap >= 16 && ramCap < 24) {
    // 16GB tier - minimum for modern gaming
    const variation =
      mid16Variations[Math.floor(Math.random() * mid16Variations.length)];
    comments.push(variation);

    // Randomly add speed guidance for 16GB users (20% chance)
    if (Math.random() < 0.2) {
      const speedTip =
        ramSpeedVariations[
          Math.floor(Math.random() * ramSpeedVariations.length)
        ];
      comments.push(speedTip);
    }
  } else if (ramCap > 0 && ramCap < 16) {
    // <16GB tier - insufficient
    const variation =
      low8Variations[Math.floor(Math.random() * low8Variations.length)];
    comments.push(variation(ramCap));

    // Always add upgrade guidance for low RAM
    const upgradeGuidance =
      ddr5VsDdr4Variations[
        Math.floor(Math.random() * ddr5VsDdr4Variations.length)
      ];
    comments.push(upgradeGuidance);
  }

  // Add single-channel warning randomly (10% chance for 16-32GB, 15% for <16GB)
  const singleChannelChance = ramCap < 16 ? 0.15 : ramCap <= 32 ? 0.1 : 0;
  if (singleChannelChance > 0 && Math.random() < singleChannelChance) {
    const warning =
      singleChannelWarning[
        Math.floor(Math.random() * singleChannelWarning.length)
      ];
    comments.push(warning);
  }

  return comments;
}
