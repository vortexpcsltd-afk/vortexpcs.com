/**
 * Cooling Insight Variations for Kevin's Insight
 *
 * Contains real-world thermal performance insights for different cooling solutions.
 * Helps users understand temperature ranges, noise levels, and upgrade recommendations.
 *
 * Usage: Import getCoolingInsight() and pass cooling type, CPU name, and core count.
 */

// 360mm AIO cooling variations - flagship tier
export const cooling360Variations = [
  (cpuName: string) =>
    `❄️ **360mm AIO – premium cooling choice!** Your ${cpuName} will run remarkably cool: expect ~65-70°C under full gaming load, ~75-80°C during all-core rendering (vs 85-90°C+ with basic cooling). Why this matters: cooler temps mean higher sustained boost clocks (+100-200MHz), quieter operation (fans run slower), and longer component lifespan. Top picks: Arctic Liquid Freezer III 360 (£100, best value), Corsair H150i Elite (£140), NZXT Kraken 360 RGB (£150). Case requirement: 360mm rad mount (top/front). This is the cooling I use in my personal rig.`,
  (cpuName: string) =>
    `❄️ **360mm AIO – absolute thermal champion!** Your ${cpuName} will barely break a sweat: 60-70°C gaming, 75-80°C under full render loads. The massive radiator surface area means fans whisper-quiet even under stress. Performance: 450W+ TDP capable (handles even 14900K/9950X overclocked). Pump lifespan: 5-7 years typical. Maintenance: Check coolant every 3-4 years (top-up if needed). This is overkill for most CPUs, but brilliant overkill. Your processor will boost higher and last longer. Premium choice! 🏆`,
  (cpuName: string) =>
    `❄️ **360mm AIO – the flagship cooling solution!** ${cpuName} will stay ice-cold: sub-70°C gaming, ~80°C max under torture tests. Three 120mm fans move massive airflow at low RPM = silent operation (25-30 dBA typical). Radiator thickness: 27-40mm (ensure case clearance). RGB sync: Most support motherboard RGB headers (aRGB). Budget: £90-180 depending on brand/RGB. If you're serious about overclocking or heavy workloads, this is the gold standard. Worth every penny!`,
  (cpuName: string) =>
    `❄️ 360mm AIO – enthusiast-tier thermal management! Your ${cpuName} will maintain peak boost clocks all day long thanks to temps in the 65-75°C range. The huge radiator dissipates heat so efficiently that fans barely spin up. Plus it looks absolutely stunning. This is what I install in high-end creator workstations.`,
  (cpuName: string) =>
    `❄️ 360mm AIO – elite cooling grade! Your ${cpuName} operates frigidly cool: anticipate ~65-70°C during intense gaming, ~75-80°C throughout full-core rendering (versus 85-90°C+ with basic solutions). Significance: lower thermals enable sustained turbo frequencies (+100-200MHz), whisper-quiet acoustics (reduced fan speeds), extended component longevity. Plus visually stunning through tempered glass! My personal rig runs this calibre cooling.`,
  (cpuName: string) =>
    `❄️ 360mm AIO – thermal dominance personified! Your ${cpuName} scarcely exerts: 60-70°C gaming workloads, 75-80°C under comprehensive render stress. The enormous radiator surface facilitates near-silent fans even maximally loaded. Overkill? Absolutely. Glorious overkill? Indeed. Processor boosts higher, operates longer. Premium-tier selection! 🏆`,
  (cpuName: string) =>
    `❄️ 360mm AIO – flagship thermal architecture! ${cpuName} maintains arctic temperatures: below 70°C gaming, approximately 80°C ceiling under stress testing. Triple 120mm fans deliver substantial airflow at minimal RPM = virtually silent operation. Serious about overclocking or sustained workloads? This represents the industry gold standard. Investment worthwhile!`,
  (cpuName: string) =>
    `❄️ 360mm AIO – enthusiast-grade thermal control! Your ${cpuName} sustains maximum turbo frequencies indefinitely courtesy of 65-75°C operational range. The substantial radiator dissipates thermal output so efficiently fans barely activate. Furthermore, aesthetically spectacular. This configuration powers my high-performance creative workstations.`,
];

// 280mm AIO cooling variations - sweet spot tier
export const cooling280Variations = [
  (cpuName: string) =>
    `❄️ **280mm AIO – the sweet spot for most builds!** Your ${cpuName} will stay comfortable: ~70-75°C gaming, ~80-85°C heavy workloads. The larger radiator surface area means fans spin slower (quieter!), and you get excellent performance without the premium 360mm price tag. Top picks: Arctic Liquid Freezer II 280 (£80, best performance/£), DeepCool LT520 (£90), Corsair H115i RGB (£120). TDP rating: 300W+. Case note: 280mm rad less common than 240/360mm – verify compatibility! This is what I recommend to 80% of my customers – maximum value, zero compromises on cooling.`,
  (cpuName: string) =>
    `❄️ **280mm AIO – intelligent cooling choice!** ${cpuName} will run 70-80°C under load, which is ideal. The dual 140mm fans are inherently quieter than 120mm equivalents whilst moving more air (CFM: 140mm ~70 CFM vs 120mm ~60 CFM at same RPM). You get 95% of 360mm performance at 70% of the cost (£80-120 vs £130-180). Acoustics: 28-32 dBA under load. Installation: Front mount ideal for GPU cooling, top mount for CPU priority. This is the definition of smart spending!`,
  (cpuName: string) =>
    `❄️ 280mm AIO – Goldilocks tier cooling! Not overkill like 360mm, not undersized like 240mm, but just right. Your ${cpuName} maintains healthy temps (70-80°C) with minimal noise. The two large fans operate at low RPM for near-silent acoustics. This is my go-to recommendation for balanced builds.`,
  (cpuName: string) =>
    `❄️ 280mm AIO – value meets performance! ${cpuName} will stay cool enough (70-80°C range) to sustain maximum boost clocks without breaking your budget or eardrums. The efficiency of 140mm fans means excellent cooling with great acoustics. Pragmatic excellence!`,
  (cpuName: string) =>
    `❄️ 280mm AIO – optimal equilibrium for majority builds. Your ${cpuName} maintains comfortable thermals: ~70-75°C gaming loads, ~80-85°C intensive workloads. Enlarged radiator surface facilitates slower fan speeds (reduced acoustics), delivering outstanding performance without premium 360mm pricing. My recommendation to 80% clientele – maximum value, zero thermal compromises.`,
  (cpuName: string) =>
    `❄️ 280mm AIO – intelligent thermal selection! ${cpuName} operates 70-80°C loaded, which proves ideal. Dual 140mm fans inherently quieter than 120mm counterparts whilst displacing equivalent airflow. Achieving 95% of 360mm capability at 70% expenditure. Smart spending exemplified!`,
  (cpuName: string) =>
    `❄️ 280mm AIO – Goldilocks-tier thermal solution! Neither excessive (360mm), nor constrained (240mm), but precisely calibrated. Your ${cpuName} sustains healthy operating temperatures (70-80°C) with minimal acoustic signature. Twin large-diameter fans operate reduced RPM for near-silent operation. My default recommendation for balanced configurations.`,
  (cpuName: string) =>
    `❄️ 280mm AIO – value intersecting performance! ${cpuName} maintains adequate cooling (70-80°C band) for sustained turbo frequencies without budgetary strain or acoustic penalty. 140mm fan efficiency delivers excellent thermal management with superior acoustics. Pragmatic optimization!`,
];

// 240mm AIO cooling variations - entry liquid cooling
export const cooling240Variations = [
  (_cpuName: string) =>
    `❄️ **240mm AIO – solid choice for most CPUs.** Expect ~75-80°C under load, which is perfectly healthy. TDP rating: 200-250W (fine for i5/i7-14700K, Ryzen 7 7700X, not ideal for 14900K/9950X). Popular options: ID-Cooling Frostflow X (£60, budget king), MSI MAG CoreLiquid 240R (£70), Corsair H100i RGB (£90). Case compatibility: Nearly universal (most cases support 240mm front/top). If you're running a higher-end processor (10+ cores) under sustained heavy workloads, you might consider stepping up to 280mm for better acoustics and thermal headroom. But for gaming and mixed use? This is perfectly adequate.`,
  (cpuName: string) =>
    `❄️ **240mm AIO – entry-level liquid cooling done right.** Your ${cpuName} will see 75-85°C under gaming loads – perfectly safe. The twin 120mm fans can get a bit audible under stress (32-38 dBA), but it's manageable. For 6-8 core CPUs in gaming builds, this hits the sweet spot between cost and performance. Pump noise: Modern AIOs near-silent (<25 dBA pump). Warranty: Typically 2-5 years depending on brand. Budget: £60-100. Installation tip: Front-mount radiator with tubes-down orientation prevents air buildup in pump.`,
  (cpuName: string) =>
    `❄️ 240mm AIO – budget-friendly liquid cooling. ${cpuName} will run 75-85°C which is within spec, though you'll hear the fans working under heavy load. If you're on a tight budget, this works. If you've got £30 more, 280mm is noticeably better for thermals and acoustics. Adequate but not exceptional.`,
  (_cpuName: string) =>
    `❄️ 240mm AIO – baseline liquid cooling option. Temps will hover 75-85°C under load – functional but not impressive. Fine for gaming on mid-range CPUs, but high-core-count processors deserve better. Think of this as the minimum viable AIO rather than the optimal choice.`,
  (_cpuName: string) =>
    `❄️ 240mm AIO – competent selection for mainstream CPUs. Anticipate ~75-80°C loaded, perfectly acceptable thermals. Running premium processor (10+ cores) under sustained intensive tasks? Consider 280mm upgrade for superior acoustics and thermal margin. Gaming and general use? This suffices admirably.`,
  (cpuName: string) =>
    `❄️ 240mm AIO – entry-grade liquid cooling executed properly. Your ${cpuName} experiences 75-85°C gaming thermals – entirely safe operational range. Twin 120mm fans moderately audible under duress, yet tolerable. For 6-8 core CPUs gaming-focused, balances expenditure versus performance effectively.`,
  (cpuName: string) =>
    `❄️ 240mm AIO – budget-conscious liquid thermal solution. ${cpuName} operates 75-85°C within specification parameters, though fan noise perceptible under stress. Budget-constrained? Functional. £30 additional budget? 280mm delivers noticeably enhanced thermals and acoustics. Adequate, not exceptional.`,
  (_cpuName: string) =>
    `❄️ 240mm AIO – foundational liquid cooling tier. Temperatures hover 75-85°C loaded – operational yet unspectacular. Suitable gaming on mid-tier CPUs, but elevated core-count processors merit superior cooling. Consider this minimum viable AIO rather than optimal selection.`,
];

// Air cooling for high core count (12+ cores) - warning variations
export const coolingAirHighCoreVariations = [
  (cores: number) =>
    `🌬️ **Air cooling on a ${cores}-core CPU – let's talk about this.** For gaming and light workloads, you'll be fine (temps in the 75-85°C range). But if you're doing sustained all-core rendering or heavy compilation, you might see thermal throttling (90°C+) which reduces performance. Premium air coolers capable of handling 12+ cores: Noctua NH-D15 (£90, 220W TDP), be quiet! Dark Rock Pro 5 (£90, 250W TDP), DeepCool Assassin IV (£100, 280W TDP). But at £90-100, a 280mm AIO (£80-120) often performs better and quieter. My recommendation: consider upgrading to 240mm+ AIO for better sustained performance and much quieter operation. Your processor will thank you!`,
  (cores: number) =>
    `🌬️ **Air cooling on ${cores} cores – bold choice!** Gaming? Fine, 75-85°C. Sustained all-core rendering? You'll hit 90°C+ and throttle, losing 10-20% performance. Premium dual-tower air coolers can handle it (Noctua NH-D15 chromax, be quiet! Dark Rock Pro 5, Thermalright Peerless Assassin 120 SE – £35-90 range). But consider: Dual-tower height 165-170mm (check case clearance!), RAM clearance issues possible, no RGB. At £90 price point, 280mm AIOs (£80-120) perform better and quieter (28 dBA vs 35 dBA). Worth reconsidering!`,
  (cores: number) =>
    `🌬️ Air cooling ${cores} cores is ambitious! For burst workloads (gaming, light editing), you'll manage 80-90°C. For sustained multi-hour renders or compilation, you'll thermal throttle. Air cooling works for 6-8 cores, struggles with 12+. My honest advice: invest in 280/360mm AIO for this chip. Your productivity will improve measurably.`,
  (cores: number) =>
    `🌬️ ${cores}-core CPU on air cooling – let's be realistic. Gaming: acceptable (80-85°C). Heavy productivity: problematic (90-95°C with throttling). Unless you've chosen a premium dual-tower cooler (£80+), you're limiting your CPU's potential. AIO cooling unlocks 10-15% more sustained performance. Consider upgrading!`,
  (cores: number) =>
    `🌬️ Air cooling ${cores}-core processor – discussion warranted. Gaming and moderate workloads: acceptable (75-85°C band). Sustained all-core rendering or intensive compilation? Thermal throttling likely (90°C+) reducing performance output. Recommendation: upgrade to 240mm+ AIO for enhanced sustained performance and significantly quieter operation. Your processor appreciates this!`,
  (cores: number) =>
    `🌬️ Air cooling ${cores} cores – audacious selection! Gaming? Manageable, 75-85°C. Sustained comprehensive rendering? Anticipate 90°C+ with throttling, forfeiting 10-20% performance. Premium dual-tower coolers capable (Noctua NH-D15, be quiet! Dark Rock Pro 4), but at comparable pricing, 280mm AIOs deliver superior performance and acoustics. Reconsider worthwhile!`,
  (cores: number) =>
    `🌬️ Air cooling ${cores} cores proves ambitious! Burst workloads (gaming, casual editing): manageable 80-90°C. Sustained multi-hour rendering or compilation: thermal throttling inevitable. Air cooling adequate 6-8 cores, struggles 12+ cores. Candid advice: invest 280/360mm AIO for this chip. Productivity enhancement measurable.`,
  (cores: number) =>
    `🌬️ ${cores}-core CPU on air – realism required. Gaming: tolerable (80-85°C). Intensive productivity: problematic (90-95°C with performance throttling). Unless premium dual-tower selected (£80+), constraining processor potential. AIO cooling unlocks 10-15% additional sustained throughput. Upgrade consideration advised!`,
];

// Air cooling standard (under 12 cores) - positive variations
export const coolingAirStandardVariations = [
  (_cpuName: string) =>
    `🌬️ **Air cooling – a reliable, maintenance-free choice!** Quality air coolers are excellent for gaming: expect ~70-80°C under load, virtually silent operation (28-35 dBA), and zero risk of pump failure or leaks. Budget options: Thermalright Peerless Assassin 120 SE (£35, 180W TDP, giant killer!), DeepCool AK400 (£30, 150W TDP), ID-Cooling SE-224-XT (£25, 150W TDP). Mid-tier: Noctua NH-U12S (£70, 165W TDP, 158mm height). Sometimes simple is better. Just make sure your case has good airflow (front intake + rear exhaust fans).`,
  (cpuName: string) =>
    `🌬️ **Air cooling – the old reliable!** No pumps to fail, no liquid to leak, just solid metal and fans. Your ${cpuName} will run 70-80°C which is perfectly healthy. Premium air coolers (Noctua NH-D15 chromax £90, be quiet! Dark Rock 4 £70) rival 240mm AIOs for performance whilst being whisper-quiet (25-30 dBA). Advantages: Zero maintenance, 10+ year lifespan, no coolant evaporation, resale value (can reuse across builds). Weight consideration: 1-1.5kg (ensure motherboard supports). Plus they last 10+ years. Pragmatic choice!`,
  (cpuName: string) =>
    `🌬️ **Air cooling – minimalist excellence!** Why complicate things? A quality tower cooler keeps your ${cpuName} at 70-80°C, costs less than AIOs (£25-90 vs £60-180), makes zero pump noise, and never needs maintenance. Installation: Easier than AIOs (no radiator mounting). Thermal paste: Pre-applied on most, or use Arctic MX-6 (£8). Fan orientation: Rear exhaust setup (push cool air through heatsink toward case rear). Sometimes the simple solution is the best solution. Ensure good case airflow and you're golden!`,
  (cpuName: string) =>
    `🌬️ Air cooling – dependable and quiet! Your ${cpuName} will sit comfortably at 70-80°C under gaming loads. No pump whine, no coolant concerns, just reliable physics at work. Quality air coolers have the best long-term reliability of any cooling solution. Set-and-forget perfection!`,
  (_cpuName: string) =>
    `🌬️ Air cooling – reliable, maintenance-zero selection! Quality air solutions excellent gaming: anticipate ~70-80°C loaded, virtually silent operation, absolute zero pump failure or leakage risk. Simplicity sometimes superior. Ensure case features adequate airflow (frontal intake + rear exhaust configuration).`,
  (cpuName: string) =>
    `🌬️ Air cooling – time-tested reliability! Zero pumps failing, zero liquid leaking, purely solid metal plus fans. Your ${cpuName} operates 70-80°C perfectly healthy range. Premium air (Noctua, be quiet!) rivals 240mm AIOs performance-wise whilst whisper-silent. Furthermore 10+ year lifespan. Pragmatic selection!`,
  (cpuName: string) =>
    `🌬️ Air cooling – minimalist sophistication! Why overcomplicate? Quality tower cooler maintains your ${cpuName} at 70-80°C, costs less than AIOs, generates zero pump acoustics, requires zero maintenance. Simple solution occasionally optimal solution. Confirm adequate case airflow and succeed!`,
  (cpuName: string) =>
    `🌬️ Air cooling – dependable plus tranquil! Your ${cpuName} sits comfortably 70-80°C gaming loads. Zero pump whine, zero coolant anxieties, purely reliable thermodynamics functioning. Quality air coolers possess supreme long-term reliability among cooling solutions. Configure-and-forget excellence!`,
];

// No cooling selected - warning variations
export const noCoolingVariations = [
  (cores: number) =>
    `⚠️ **Cooling alert: You haven't selected a CPU cooler yet!** Most modern CPUs require aftermarket cooling (Intel K/KF series need cooler, AMD Ryzen 7000/9000 need cooler, check if yours includes stock cooler). For your ${cores}-core processor, I'd strongly recommend: Budget air: Thermalright PA120 SE (£35, 180W TDP) | Mid-tier air: Noctua NH-U12S (£70, 165W TDP) | Entry AIO: 240mm (£60-90, 220W TDP) | Best AIO: 280mm (£80-120, 300W TDP). Don't skip this – inadequate cooling will throttle your performance significantly!`,
  (cores: number) =>
    `🚨 **CRITICAL: No CPU cooler selected!** Your ${cores}-core processor will overheat and shut down without proper cooling. Thermal throttling occurs at 95-100°C, emergency shutdown at 105°C. Minimum requirement: tower air cooler (£40+, 150W TDP minimum). Recommended: 240mm+ AIO (£70+, 220W+ TDP). Performance impact without proper cooling: 30-60% reduction due to thermal throttling. Stock coolers: Intel 12th-15th gen K/KF = none included | AMD Ryzen 7000/9000 = none included | AMD 5000 series = included but basic. This isn't optional – it's essential. Add cooling before proceeding!`,
  (cores: number) =>
    `⚠️ Missing cooler detected! Your ${cores}-core CPU generates significant heat and absolutely requires aftermarket cooling. Budget: £40-60 tower air cooler. Optimal: £80-120 280mm AIO. Without this, your system will thermal throttle or shut down. Priority #1 addition!`,
  (cores: number) =>
    `🛑 Cooler required! You can't run a ${cores}-core CPU without proper cooling – it will throttle or damage itself. Minimum: quality air cooler (£40-50). Better: 240mm AIO (£70-90). Best: 280/360mm AIO (£100-130). Don't overlook this critical component!`,
];

/**
 * Get cooling insights based on cooling type, CPU details, and core count
 * @param cooling - Cooling object with type and name properties
 * @param cpuName - CPU name for personalised messaging
 * @param cores - CPU core count for air cooling recommendations
 * @returns Cooling insight string, or null if no cooling data
 */
export function getCoolingInsight(
  cooling: {
    type?: string;
    name?: string | unknown;
    // CMS-mapped fields
    coolerType?: string;
    radiatorSize?: string | number;
  } | null,
  cpuName: string,
  cores: number
): string | null {
  if (!cooling) {
    // No cooling selected - warning if 6+ cores
    if (cores >= 6) {
      const variation =
        noCoolingVariations[
          Math.floor(Math.random() * noCoolingVariations.length)
        ];
      return variation(cores);
    }
    return null;
  }

  const coolingName = typeof cooling.name === "string" ? cooling.name : "";

  // Normalize cooling type across local data (type: "AIO"|"Air") and CMS (coolerType: "AIO"|"Liquid"|"Air")
  const rawType = (cooling.type || cooling.coolerType || "")
    .toString()
    .toLowerCase();
  const isAio = rawType.includes("aio") || rawType.includes("liquid");
  const isAir = rawType.includes("air");

  // Determine radiator size from explicit field or name, fallback to 0 if unknown
  const parseRadSize = (): number => {
    const rs = cooling.radiatorSize;
    if (typeof rs === "number") return rs;
    if (typeof rs === "string") {
      const m = rs.toLowerCase().match(/(120|240|280|360|420)/);
      if (m) return parseInt(m[1], 10);
    }
    const lowerName = coolingName.toLowerCase();
    const m1 = lowerName.match(/(120|240|280|360|420)\s*mm/);
    if (m1) return parseInt(m1[1], 10);
    const m2 = lowerName.match(/\b(120|240|280|360|420)\b/);
    if (m2) return parseInt(m2[1], 10);
    return 0;
  };
  const radSize = parseRadSize();

  // 360mm AIO
  if (isAio && (radSize === 360 || coolingName.includes("360mm"))) {
    const variation =
      cooling360Variations[
        Math.floor(Math.random() * cooling360Variations.length)
      ];
    return variation(cpuName);
  }
  // 280mm AIO
  else if (isAio && (radSize === 280 || coolingName.includes("280mm"))) {
    const variation =
      cooling280Variations[
        Math.floor(Math.random() * cooling280Variations.length)
      ];
    return variation(cpuName);
  }
  // 240mm AIO
  else if (isAio && (radSize === 240 || coolingName.includes("240mm"))) {
    const variation =
      cooling240Variations[
        Math.floor(Math.random() * cooling240Variations.length)
      ];
    return variation(cpuName);
  }
  // Air cooling
  else if (isAir) {
    if (cores >= 12) {
      // High core count - warning about air cooling limitations
      const variation =
        coolingAirHighCoreVariations[
          Math.floor(Math.random() * coolingAirHighCoreVariations.length)
        ];
      return variation(cores);
    } else {
      // Standard core count - positive air cooling message
      const variation =
        coolingAirStandardVariations[
          Math.floor(Math.random() * coolingAirStandardVariations.length)
        ];
      return variation(cpuName);
    }
  }

  return null;
}
