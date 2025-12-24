/**
 * Price Tier Insights System
 *
 * Provides personalised commentary based on build price tier,
 * highlighting value propositions, warranty coverage, and longevity expectations.
 *
 * Price tiers:
 * - Premium (£3000+): Top-tier components, enterprise quality, 5+ year longevity
 * - Sweet Spot (£1500-3000): Best price-to-performance, enthusiast grade
 * - Value (£800-1500): Smart budget allocation, practical effectiveness
 * - Entry (£0-800): Foundation build with upgrade potential
 */

// 20+ curated variations per tier to keep insights fresh and human
const entryTierMessages: string[] = [
  "🎯 Entry tier: a strong foundation you can grow. Prioritize GPU next, then RAM.",
  "🎯 Smart start – essentials covered without overspending. Plan a GPU upgrade in 6–12 months.",
  "🎯 Entry build with clear path forward: keep it lean now, expand storage and RAM later.",
  "🎯 Great footing for 1080p gaming and daily tasks. Next steps: 32GB RAM + faster NVMe when budget allows.",
  "🎯 Budget well spent. You’re avoiding flashy extras and focusing on core performance.",
  "🎯 Solid baseline. Add a quality 1440p monitor and stronger GPU when prices dip.",
  "🎯 Entry configuration with upgrade headroom. PSU and case give you room to grow.",
  "🎯 Practical today, scalable tomorrow. Keep drivers/BIOS updated to squeeze more value.",
  "🎯 Good call on essentials. Add another NVMe for games/projects when needed.",
  "🎯 Tight budget, smart choices. Focus on thermals and airflow for quiet, reliable use.",
  "🎯 You’ve built a no-frills workhorse. Future-proof via incremental upgrades, not a full refresh.",
  "🎯 Entry tier done right: stable, simple, and easy to maintain.",
  "🎯 Great platform for learning and tinkering. Each upgrade will feel impactful.",
  "🎯 Keep your eye on seasonal deals for a value GPU step-up.",
  "🎯 Perfect student/office baseline with gaming potential. Add RAM when multitasking grows.",
  "🎯 Budget balanced. Invest in a good SSD now; upgrade visuals later.",
  "🎯 Starter rig that won’t fight you. We’ve kept compatibility wide open for future parts.",
  "🎯 Entry price, premium path: this case and PSU can handle bigger components later.",
  "🎯 Efficient spend – no wasted budget on marginal gains.",
  "🎯 You’re building momentum. Small, targeted upgrades will deliver big smiles.",
  "🎯 Aim for silent fans and tidy cabling – comfort matters at every budget.",
  "🎯 Entry doesn’t mean compromise – it means precise priorities. Nice work.",
];

const valueTierMessages: string[] = [
  "💰 Value tier: you’ve put money where it matters – CPU/GPU. Sensible, effective, upgrade-friendly.",
  "💰 Pound-for-pound performance. No vanity spend – just solid parts, smart balance.",
  "💰 Great daily experience and dependable gaming. Clear next steps: 32GB RAM + extra NVMe.",
  "💰 You’ve left headroom for meaningful upgrades without replacing the core.",
  "💰 Balanced build – performance where it counts, quiet where it helps.",
  "💰 Smart choices: quality PSU and case now save money later.",
  "💰 Nice optimization: this spec handles 1080p/1440p beautifully with room to scale.",
  "💰 You’ve avoided diminishing returns. Every pound here earns its keep.",
  "💰 Sensible thermals and acoustics. The system will feel fast for years.",
  "💰 Strong value-floor. Upgrade GPU when the next gen lands for a big jump.",
  "💰 Good storage baseline – add a second NVMe for projects or game libraries.",
  "💰 This is the sweet side of ‘value’: reliable, responsive, and flexible.",
  "💰 No compromises on stability. Great for work by day, gaming by night.",
  "💰 Your time matters: quick boots, quick loads, quiet operation.",
  "💰 Great pick for creators starting out – upgrade RAM/storage as workloads grow.",
  "💰 You’re not paying for badges; you’re paying for experience. Excellent call.",
  "💰 Expect smooth 1440p with the right settings. Lots of upside left.",
  "💰 Easy to maintain, easy to expand. This is how you build long-term value.",
  "💰 In this range, airflow and PSU quality are the hidden heroes – you nailed it.",
  "💰 Smart spend now means painless upgrades later. You’re set up for success.",
  "💰 Value doesn’t mean basic; it means optimized. This build proves it.",
  "💰 Real-world fast – not just on paper. Enjoy the responsiveness.",
];

const sweetSpotTierMessages: string[] = [
  "💎 Sweet spot secured: best price-to-performance without waste. Enthusiast-grade through and through.",
  "💎 You’ve landed in the golden zone – high-end experience with smart economics.",
  "💎 This is the range we recommend most: performance, silence, and style in balance.",
  "💎 Excellent for 1440p high-refresh or 4K entry. Zero weak links, zero regrets.",
  "💎 You’ve paid for what you can feel: stability, speed, and longevity.",
  "💎 Premium where it matters, restrained where it doesn’t. Chef’s kiss.",
  "💎 Expect years of top-tier gaming and smooth creative work.",
  "💎 Great thermal headroom, quiet profiles, and effortless multitasking.",
  "💎 The law of diminishing returns starts above this point – you chose wisely.",
  "💎 Upgrade path is optional here – you can simply enjoy.",
  "💎 Beautiful balance: quality motherboard, capable cooling, reliable PSU.",
  "💎 Built to be fast today and relevant tomorrow. That’s the sweet spot.",
  "💎 Perfect for creators who also game – or gamers who also create.",
  "💎 Thoughtful storage mix and RAM capacity – real-world snappiness.",
  "💎 This spec is weekend-proof: compile, render, game, repeat.",
  "💎 Excellent acoustics under load. Performance doesn’t have to be loud.",
  "💎 You avoided vanity options and focused on experience. Bravo.",
  "💎 1440p 144Hz excellence with headroom for eye candy.",
  "💎 The best kind of premium: engineered, not excessive.",
  "💎 High resale retention if you ever choose to move up again.",
  "💎 You’ve future-proofed sensibly – not expensively. Perfect.",
  "💎 This is where ‘enthusiast-grade’ truly lives. Enjoy it.",
];

const premiumTierMessages: string[] = [
  "🏆 Premium tier: no-compromise spec, enterprise‑grade reliability, and 5+ year runway.",
  "🏆 You’ve bought time: years of elite performance before thinking about upgrades.",
  "🏆 Top-bin components, meticulous thermals, whisper-quiet power delivery.",
  "🏆 Flagship experience: 4K ultra, heavy creation, and AI workflows with ease.",
  "🏆 We stress test hard (CPU/GPU/memory) so you can just enjoy perfection.",
  "🏆 This is luxury engineering: premium acoustics, premium parts, premium feel.",
  "🏆 Built for creators and competitors – uncompromised in any direction.",
  "🏆 You’re buying years of stability, not months of novelty. Wise move.",
  "🏆 A system that looks as serious as it performs. Showcase-grade.",
  "🏆 Thermal headroom everywhere – performance stays at peak for marathon sessions.",
  "🏆 Incredible monitor pairings: multi‑4K, ultrawide, VR – it’s all smooth here.",
  "🏆 Materials and assembly quality you can feel every day.",
  "🏆 You’ve skipped the upgrade treadmill. This spec ends the debate.",
  "🏆 Every subsystem is overbuilt for silence, speed, and longevity.",
  "🏆 From cable management to fan curves – the details are elite.",
  "🏆 Backed by comprehensive warranty and lifetime support – real peace of mind.",
  "🏆 It’s not just fast – it’s consistent under sustained workloads.",
  "🏆 Premium now is cheaper than piecemeal upgrades for 3 years.",
  "🏆 You paid for experience, not just benchmarks. You’ll feel it daily.",
  "🏆 This is the apex of PC building. Enjoy every frame, every render.",
  "🏆 Headroom to spare: overclocking/undervolting flexibility without compromise.",
  "🏆 Confidence built-in: quality that outlasts trends and generations.",
];

import type { UseCase } from "./useCaseDetection";

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)] ?? "";
}

// Generate a concise sub-tier phrase based on price bands within each tier
function subTierSuffix(totalPrice: number): string {
  if (totalPrice <= 0) return "";

  // Premium sub-tiers (£3000+)
  if (totalPrice >= 3000) {
    if (totalPrice < 3500) return "— Lower Premium (\u00A33,000–3,500)";
    if (totalPrice < 5000) return "— Mid Premium (\u00A33,500–5,000)";
    if (totalPrice < 7000) return "— Upper Premium (\u00A35,000–7,000)";
    return "— Ultra Premium (\u00A37,000+)";
  }

  // Sweet spot sub-tiers (£1500–3000)
  if (totalPrice >= 1500) {
    if (totalPrice < 2000) return "— Lower Sweet Spot (\u00A31,500–2,000)";
    if (totalPrice < 2500) return "— Mid Sweet Spot (\u00A32,000–2,500)";
    return "— Upper Sweet Spot (\u00A32,500–3,000)";
  }

  // Value sub-tiers (£800–1500)
  if (totalPrice >= 800) {
    if (totalPrice < 1000) return "— Lower Value (\u00A3800–1,000)";
    if (totalPrice < 1300) return "— Mid Value (\u00A31,000–1,300)";
    return "— Upper Value (\u00A31,300–1,500)";
  }

  // Entry sub-tiers (<£800)
  if (totalPrice < 600) return "— Minimal Entry (\u00A30–600)";
  return "— Upper Entry (\u00A3600–800)";
}

function withSubTier(
  message: string,
  totalPrice: number,
  show: boolean
): string {
  if (!show) return message;
  const suffix = subTierSuffix(totalPrice);
  return suffix ? `${message} ${suffix}` : message;
}

function withUseCaseFlavor(
  message: string,
  useCase?: UseCase | string
): string {
  if (!useCase) return message;
  const flavorMap: Record<string, string> = {
    gaming: "🎮 Gaming focus: tuned for high-refresh, low-latency play.",
    creation:
      "🎨 Creator-ready: faster renders/exports; NVMe scratch recommended.",
    workstation:
      "💼 Workstation-grade: cores, memory, and I/O prioritized for throughput.",
    mixed:
      "⚡ Hybrid build: balanced for play and produce without major compromises.",
  };
  const flavor = flavorMap[String(useCase)] || "";
  return flavor ? `${message} ${flavor}` : message;
}

/**
 * Get personalised price tier insight based on total build cost
 * Returns empty string if price is 0 or negative
 */
export const getPriceTierInsight = (
  totalPrice: number,
  opts?: { useCase?: UseCase | string; showSubTier?: boolean }
): string => {
  if (totalPrice <= 0) return "";

  // Premium tier (£3000+)
  if (totalPrice >= 3000) {
    return withUseCaseFlavor(
      withSubTier(
        pick(premiumTierMessages),
        totalPrice,
        opts?.showSubTier !== false
      ),
      opts?.useCase
    );
  }

  // Sweet spot tier (£1500-3000)
  if (totalPrice >= 1500) {
    return withUseCaseFlavor(
      withSubTier(
        pick(sweetSpotTierMessages),
        totalPrice,
        opts?.showSubTier !== false
      ),
      opts?.useCase
    );
  }

  // Value tier (£800-1500)
  if (totalPrice >= 800) {
    return withUseCaseFlavor(
      withSubTier(
        pick(valueTierMessages),
        totalPrice,
        opts?.showSubTier !== false
      ),
      opts?.useCase
    );
  }

  // Entry tier (<£800)
  return withUseCaseFlavor(
    withSubTier(
      pick(entryTierMessages),
      totalPrice,
      opts?.showSubTier !== false
    ),
    opts?.useCase
  );
};
