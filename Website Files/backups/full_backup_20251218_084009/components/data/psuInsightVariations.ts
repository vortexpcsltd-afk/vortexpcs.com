// PSU (Power Supply Unit) insight variations
// Organized by efficiency tier and load capacity scenarios

// High-efficiency PSU (Gold/Platinum/Titanium) - positive variations
export const psuEfficiencyVariations = [
  (efficiency: string) =>
    `⚡ ${efficiency} certification ensures efficient power delivery with minimal waste heat. Specific models: Corsair RM750e (£80, Gold, 10yr warranty), Seasonic Focus GX-850 (£110, Gold, 10yr), MSI MAG A850GL (£90, Gold, fully modular). This translates to lower electricity bills (5-10% savings over Bronze = £5-15/year), quieter operation thanks to less aggressive PSU fan curves (semi-passive 0dB modes under 40% load), and better component longevity. Your PSU will run cooler and last longer.`,
  (efficiency: string) =>
    `⚡ ${efficiency} efficiency – smart investment! Premium options: Corsair RM850x (£130, Gold, 10yr warranty), be quiet! Straight Power 11 850W (£140, Gold, 5yr, ultra-quiet), EVGA SuperNOVA 850 G6 (£120, Gold, 10yr). You're wasting less power as heat (90-92% efficiency at typical loads = 80W saved vs Bronze on 800W system), which means lower monthly bills and reduced PSU fan noise. Over 3-5 years, the energy savings often pay for the premium over lower-tier PSUs (£50-150 total savings). Plus it runs cooler, extending lifespan to 10+ years with quality Japanese capacitors (105°C rated).`,
  (efficiency: string) =>
    `⚡ ${efficiency} rated PSU – quality power delivery! ATX 3.0 compatible options: MSI MPG A1000G (£160, Gold, PCIe 5.0 12VHPWR native cable for RTX 4000/5000), Corsair RM1000e (£140, Gold, PCIe 5.0 ready), Thermaltake Toughpower GF3 1000W (£150, Gold, ATX 3.0). This certification guarantees 90%+ efficiency at typical loads, reducing waste heat and electricity costs. Fully modular cables (cleaner builds, better airflow vs non-modular). The PSU fan will spin slower (quieter operation = 0dB mode idle, <25dB gaming), and you're getting enterprise-grade reliability (Japanese capacitors, OEM platforms from Seasonic/CWT). This is the efficiency tier I recommend minimum for builds £800+.`,
  (efficiency: string) =>
    `⚡ ${efficiency} efficiency rating – premium choice! Platinum options: Seasonic Prime PX-850 (£180, 12yr warranty), Corsair HX1000i (£210, Platinum, digital monitoring), Super Flower Leadex Platinum 850W (£160, 10yr). Titanium tier: Corsair AX1600i (£450, 7yr, digital PSU link), Seasonic Prime TX-1000 (£300, 12yr). Superior power conversion (90-94% efficient Platinum, 94-96% Titanium) means minimal waste heat, reduced electricity costs (£10-20/year savings vs Bronze on 700W system, £15-30/year Titanium), and whisper-quiet PSU fan operation (fanless idle modes, <20dB load). Quality PSUs like this often outlast entire system builds (12+ years). Excellent long-term investment.`,
  (efficiency: string) =>
    `⚡ ${efficiency} certified power – efficient delivery! Budget Gold options: Corsair RM650 (£70, 10yr warranty, semi-modular), Thermaltake Smart BM2 650W (£60, Gold, 5yr), MSI MAG A650BN (£65, Gold, 7yr). Mid-range: Seasonic Focus GX-750 (£95, 10yr, fully modular), be quiet! Pure Power 11 FM 750W (£85, Gold, 5yr). Minimal thermal waste thanks to 90-92% typical load efficiency. Translates lower monthly utilities (5-10% reduction versus Bronze tier = £3-8/month at 600W system), quieter acoustics from reduced fan aggression (semi-passive modes <40% load), enhanced component longevity (quality capacitors rated 105°C vs 85°C Bronze). PSU operates cooler (10-15°C lower vs Bronze under load), lasts substantially longer (10-12 years vs 5-7 years Bronze).`,
  (efficiency: string) =>
    `⚡ ${efficiency} efficiency grade – intelligent investment! Reduced power waste as heat (90-92% efficiency standard loads), yielding decreased monthly costs and diminished PSU fan acoustics. 3-5 year timeline, energy savings frequently offset premium over inferior tiers. Furthermore operates cooler, extending operational lifespan beyond 10 years.`,
  (efficiency: string) =>
    `⚡ ${efficiency} certified PSU – quality power architecture! This certification guarantees 90%+ efficiency typical workloads, minimizing waste thermal output and utility expenditure. PSU fan rotates slower (reduced acoustic signature), delivering enterprise-grade dependability. Efficiency tier I recommend minimum for £800+ configurations.`,
  (efficiency: string) =>
    `⚡ ${efficiency} efficiency classification – premium selection! Superior power conversion (90-94% efficient) yields minimal waste heat, reduced electrical costs (£10-20 annual savings versus Bronze), whisper-silent PSU fan characteristics. Quality PSUs frequently outlive complete system lifecycles. Outstanding long-term investment.`,
];

// Optimal PSU headroom (under 60% load) - positive variations
export const psuHeadroomVariations = [
  (wattage: number, loadPercent: number) =>
    `⚡ Your ${wattage}W PSU provides ample headroom – the system will typically operate at ${loadPercent}% capacity, maximising efficiency and allowing for future GPU upgrades without PSU replacement. Sweet spot for PSU efficiency curves is 40-60% load, and you're right in that zone. Recommended models at this wattage: ${
      wattage <= 650
        ? "Corsair RM650e (£70), MSI MAG A650BN (£65)"
        : wattage <= 850
        ? "Seasonic Focus GX-850 (£110), Corsair RM850x (£130), MSI MAG A850GL (£90)"
        : "Corsair RM1000e (£140), Seasonic Focus GX-1000 (£150), MSI MPG A1000G (£160)"
    }. Fully modular cables for clean builds, 10-year warranties typical.`,
  (wattage: number, loadPercent: number) =>
    `⚡ Excellent PSU headroom! Your ${wattage}W unit runs at ~${loadPercent}% typical load, which is the efficiency sweet spot (40-60%). This means: quieter PSU fan (0dB semi-passive modes under 40% load, <25dB gaming), maximum efficiency (less wasted electricity = peak 90-92% conversion at 50% load), and room for future GPU upgrades without replacing the PSU (can handle RTX 5080/RX 8800 XT tier upgrades if currently mid-range). ${
      wattage >= 850
        ? "Your wattage tier supports high-end GPU upgrades (RTX 5090/RX 9070 XT)."
        : "Consider 850W+ only if planning flagship GPU upgrades."
    } Smart planning! Cable management: Fully modular recommended (£10-20 premium worth it for airflow/aesthetics).`,
  (_wattage: number, loadPercent: number) =>
    `⚡ PSU sizing spot-on! Operating at ${loadPercent}% capacity puts you in the optimal efficiency zone (40-60% load = peak efficiency curve 90-92% Gold, 92-94% Platinum). Benefits: PSU fan barely audible (0dB mode idle/light loads, 15-25dB gaming with quality units like Corsair RMx/Seasonic Focus), maximum power efficiency (lowest electricity waste = 8-10% loss vs 12-15% Bronze), and future-proof for next-gen GPU upgrades (150-200W headroom typical). This is professional-level component selection. Build tip: Fully modular cables reduce cable clutter (improves case airflow 5-10°C), easier installation (no unused cables to tuck away).`,
  (wattage: number, loadPercent: number) =>
    `⚡ Perfect PSU headroom! Your ${wattage}W supply operates ${loadPercent}% loaded – the efficiency sweet spot (40-60% band). Translation: minimal PSU fan noise, maximized power conversion efficiency (reduced electrical waste), abundant capacity for future GPU enhancements sans PSU replacement. Intelligent planning!`,
  (wattage: number, loadPercent: number) =>
    `⚡ Optimal PSU capacity! ${wattage}W unit functions ~${loadPercent}% typical loading, precisely within efficiency apex (40-60% zone). Yields: quieter PSU fan operation, peak efficiency (minimal electricity waste), ample margin for subsequent GPU upgrades avoiding PSU swap. Strategic configuration!`,
  (_wattage: number, loadPercent: number) =>
    `⚡ PSU dimensioning impeccable! Operating ${loadPercent}% capacity positions you optimal efficiency region (40-60% loading). Benefits: PSU fan virtually inaudible, maximum power conversion efficiency (lowest utility waste), future-ready for next-generation GPU upgrades. Professional-tier component matching.`,
];

// Adequate PSU capacity (60-75% load) - workable but not optimal
export const psuAdequateVariations = [
  (wattage: number, loadPercent: number) =>
    `⚡ Your ${wattage}W PSU provides adequate power at ~${loadPercent}% typical load. This is workable, though you're outside the optimal 40-60% efficiency zone (efficiency drops 2-5% at 70% load vs 50% load). PSU fan will be more audible under stress (30-35dB vs 20-25dB optimal load), and future GPU upgrades may require PSU replacement. Functional, but minimal headroom (only 25-30% capacity remaining for upgrades). If considering GPU upgrade: ${
      wattage <= 650
        ? "Step up to 750-850W (Seasonic Focus GX-850 £110, Corsair RM850x £130)"
        : "Consider 1000W tier (Corsair RM1000e £140, Seasonic Focus GX-1000 £150)"
    }. Current config: acceptable, but tight.`,
  (wattage: number, loadPercent: number) =>
    `⚡ PSU capacity adequate! ${wattage}W running ~${loadPercent}% loaded. Works, but above ideal efficiency zone (40-60% = peak conversion efficiency). At 65-75% load: efficiency drops to 88-90% Gold (vs 91-92% at 50%), PSU runs 10-15°C hotter, fan spins 1000-1500 RPM faster (audible difference). Expect increased PSU fan noise under load (30-35dB vs 20-25dB optimal), and limited headroom for GPU upgrades (only 25-30% remaining capacity). Sufficient for current config, but tight for future expansion. If upgrading within 12 months: Consider next wattage tier now (saves dual PSU purchase, better efficiency long-term). Quality brands still recommended: Corsair RM series, Seasonic Focus GX, MSI MAG.`,
  (wattage: number, loadPercent: number) =>
    `⚡ Workable PSU sizing! Your ${wattage}W unit operates ${loadPercent}% capacity. Functional yet exceeding optimal efficiency band (40-60%). PSU fan audible during stress, constrained margin for future GPU enhancements. Adequate present configuration, limited expansion flexibility.`,
  (wattage: number, loadPercent: number) =>
    `⚡ PSU power adequate! ${wattage}W functioning ~${loadPercent}% typical loading. Operational, though surpassing ideal efficiency zone (40-60%). Anticipate elevated PSU fan acoustics loaded, minimal headroom GPU upgrades. Sufficient current setup, restricted future scalability.`,
];

// Tight PSU capacity (75%+ load) - warning variations
export const psuTightVariations = [
  (wattage: number, loadPercent: number, recommendedWattage: number) =>
    `⚠️ PSU headroom tight! Your ${wattage}W unit will run at ~${loadPercent}% capacity, which is high (PSU stressed at 75%+ load continuously). Concerns: PSU fan will be loud under load (35-40dB aggressive fan curve, constant whine), reduced efficiency (86-88% vs 90-92% optimal = extra £15-25/year wasted electricity on 700W system), runs hot (15-20°C hotter vs optimal load = reduced lifespan 5-7 years vs 10+ years), and NO room for GPU upgrades (risk system instability/shutdowns during transient power spikes). Consider stepping up to next wattage tier (${recommendedWattage}W+) for reliability and quieter operation. Recommended upgrades: ${
      recommendedWattage <= 750
        ? "Corsair RM750e (£80), Seasonic Focus GX-750 (£95)"
        : recommendedWattage <= 850
        ? "MSI MAG A850GL (£90), Corsair RM850x (£130)"
        : "Corsair RM1000e (£140), Seasonic Focus GX-1000 (£150)"
    }. Worth the investment for stability.`,
  (_wattage: number, loadPercent: number, recommendedWattage: number) =>
    `⚠️ PSU capacity concerning! Operating at ${loadPercent}% is pushing limits (75%+ sustained = stressed operation). Issues: Loud PSU fan (35-45dB aggressive cooling, constant under gaming), reduced efficiency (85-88% vs 90-92% optimal = wastes 20-30W as heat on 600W system), runs hot (capacitor degradation accelerates >85°C = premature failure 5-7 years vs 10+ years), zero upgrade headroom. System stability risks: Random shutdowns during GPU power spikes (RTX 4000/5000 transient spikes 150-200W above TDP), voltage ripple increases (degrades component lifespan), OCP (Over Current Protection) may trigger under stress (instant shutdown mid-game). Strong recommendation: upgrade to ${recommendedWattage}W PSU for stability, acoustics, and future-proofing (Corsair RM series, Seasonic Focus GX, MSI MAG A series all excellent). Current config risks instability under transient loads (GPU rendering, CPU all-core boost simultaneously).`,
  (wattage: number, loadPercent: number, recommendedWattage: number) =>
    `⚠️ PSU headroom constrained! Your ${wattage}W supply operates ~${loadPercent}% loaded, excessively elevated. Concerns: PSU fan acoustically aggressive loaded, diminished efficiency (increased utility waste as thermal output), ZERO margin GPU enhancements. Consider escalating next wattage tier (${recommendedWattage}W+) for dependability and reduced acoustics.`,
  (_wattage: number, loadPercent: number, recommendedWattage: number) =>
    `⚠️ PSU capacity troubling! ${loadPercent}% operation approaches limits. Problems: Loud PSU fan operation, reduced conversion efficiency (heightened electrical waste), absent upgrade capacity. Strong recommendation: upgrade ${recommendedWattage}W PSU for stability, acoustics, future-proofing. Current configuration risks instability transient loading.`,
];

/**
 * Get PSU insights based on efficiency rating and load capacity
 * @param psu - PSU component with efficiency and wattage
 * @param cpu - CPU component for TDP calculation
 * @param gpu - GPU component for power calculation
 * @returns Array of PSU insight strings
 */
export function getPSUInsights(
  psu: { efficiency?: string; wattage?: number } | null,
  cpu: { tdp?: number } | null,
  gpu: { power?: number } | null
): string[] {
  const insights: string[] = [];

  if (!psu) return insights;

  // Efficiency insights for high-tier PSUs
  if (
    psu.efficiency === "80+ Gold" ||
    psu.efficiency === "80+ Platinum" ||
    psu.efficiency === "80+ Titanium"
  ) {
    const efficiencyVariation =
      psuEfficiencyVariations[
        Math.floor(Math.random() * psuEfficiencyVariations.length)
      ];
    insights.push(efficiencyVariation(psu.efficiency));
  }

  // Load capacity insights (headroom analysis)
  if (cpu && gpu && psu.wattage) {
    const cpuTdp = cpu.tdp || 65;
    const gpuPower = gpu.power || 150;
    const otherComponentsPower = 150; // Estimate for RAM, storage, fans, etc.

    const estimatedLoad =
      (cpuTdp + gpuPower + otherComponentsPower) / psu.wattage;
    const loadPercent = Math.round(estimatedLoad * 100);

    if (estimatedLoad < 0.6) {
      // Optimal headroom (under 60%)
      const headroomVariation =
        psuHeadroomVariations[
          Math.floor(Math.random() * psuHeadroomVariations.length)
        ];
      insights.push(headroomVariation(psu.wattage, loadPercent));
    } else if (estimatedLoad >= 0.6 && estimatedLoad < 0.75) {
      // Adequate but not optimal (60-75%)
      const adequateVariation =
        psuAdequateVariations[
          Math.floor(Math.random() * psuAdequateVariations.length)
        ];
      insights.push(adequateVariation(psu.wattage, loadPercent));
    } else if (estimatedLoad >= 0.75) {
      // Too tight (75%+)
      const recommendedWattage = Math.round((psu.wattage + 150) / 100) * 100;
      const tightVariation =
        psuTightVariations[
          Math.floor(Math.random() * psuTightVariations.length)
        ];
      insights.push(
        tightVariation(psu.wattage, loadPercent, recommendedWattage)
      );
    }
  }

  return insights;
}
