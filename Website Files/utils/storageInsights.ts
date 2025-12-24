/**
 * Dynamic storage insights generator
 * Provides 100+ unique, contextual messages based on storage type and capacity
 */

interface StorageConfig {
  capacity?: number | string; // accepts GB number or string like "8TB"/"8192GB"
  interface?: string;
  name?: string;
  driveType?: string;
  price?: number;
}

/**
 * Determines storage type from interface string
 */
function getStorageType(
  storageInterface?: string,
  name?: string,
  driveType?: string
): "hdd" | "sata-ssd" | "gen3-nvme" | "gen4-nvme" | "gen5-nvme" {
  const i = (storageInterface || "").toLowerCase();
  const n = (name || "").toLowerCase();
  const d = (driveType || "").toLowerCase();

  // Interface-first detection
  if (i.includes("gen5") || i.includes("pcie 5") || i.includes("5.0"))
    return "gen5-nvme";
  if (i.includes("gen4") || i.includes("pcie 4") || i.includes("4.0"))
    return "gen4-nvme";
  if (i.includes("gen3") || i.includes("pcie 3") || i.includes("3.0"))
    return "gen3-nvme";
  if (i.includes("nvme")) return "gen3-nvme"; // Generic NVMe without version
  if (i.includes("hdd") || i.includes("7200") || i.includes("5400"))
    return "hdd";
  if (i.includes("sata")) return "sata-ssd";

  // Name-based detection with generation indicators
  // Check for Gen5 indicators in name (Samsung 990 Pro, 9100 Pro, etc.)
  if (
    n.includes("gen5") ||
    n.includes("pcie 5") ||
    n.includes("5.0") ||
    n.includes("990 pro") ||
    n.includes("9100") ||
    n.includes("980 evo")
  ) {
    return "gen5-nvme";
  }

  // Check for Gen4 indicators in name (980 Pro, SN850X, etc.)
  if (
    n.includes("gen4") ||
    n.includes("pcie 4") ||
    n.includes("4.0") ||
    n.includes("980 pro") ||
    n.includes("sn850") ||
    n.includes("sn770")
  ) {
    return "gen4-nvme";
  }

  // Name/driveType heuristics - fallback to Gen3
  if (n.includes("nvme") || n.includes("m.2") || d.includes("nvme")) {
    return "gen3-nvme";
  }
  if (n.includes("hdd") || d.includes("hdd") || n.includes("hard drive"))
    return "hdd";
  if (n.includes("sata")) return "sata-ssd";

  // Fallback
  return "sata-ssd";
}

/**
 * Get capacity tier for messaging
 */
function getCapacityTier(
  capacity: number
): "tiny" | "small" | "adequate" | "good" | "great" | "massive" {
  if (capacity < 500) return "tiny";
  if (capacity < 1000) return "small";
  if (capacity < 1500) return "adequate";
  if (capacity < 2500) return "good";
  if (capacity < 4500) return "great";
  return "massive";
}

/**
 * Generate a random storage insight based on type and capacity
 */
export function getStorageInsight(storage: StorageConfig): string {
  const capacityGB = normalizeCapacityGB(storage.capacity, storage.name);
  const type = getStorageType(
    storage.interface,
    storage.name,
    storage.driveType
  );
  const tier = getCapacityTier(capacityGB);

  // If capacity is very large, prefer a precise, non-generic message
  if (tier === "massive" && capacityGB > 0) {
    const capTB = (capacityGB / 1000).toFixed(1).replace(/\.0$/, "");
    const typeLabel =
      type === "gen5-nvme"
        ? "Gen5 NVMe"
        : type === "gen4-nvme"
        ? "Gen4 NVMe"
        : type === "gen3-nvme"
        ? "Gen3 NVMe"
        : type === "sata-ssd"
        ? "SATA SSD"
        : "HDD";
    const priceText =
      typeof storage.price === "number" && storage.price > 0
        ? ` (£${storage.price.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })})`
        : "";

    return `📦 ${capTB}TB ${typeLabel}${priceText}: Top-tier capacity with fast access. Ideal for huge game libraries, content creation, VMs and datasets. Ensure a solid backup plan at this scale.`;
  }

  const messages = getMessagesForTypeAndTier(type, tier);

  // Return random message from appropriate array
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Normalize capacity to GB from number or string (e.g., "8TB", "8192GB")
 */
function normalizeCapacityGB(raw?: number | string, name?: string): number {
  if (typeof raw === "number" && raw > 0) return raw;
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    const tbMatch = s.match(/([\d,.]+)\s*tb/i);
    const gbMatch = s.match(/([\d,.]+)\s*gb/i);
    if (tbMatch) {
      const val = parseFloat(tbMatch[1].replace(/,/g, ""));
      if (!isNaN(val)) return Math.round(val * 1000); // use 1000 GB per TB for UI thresholds
    }
    if (gbMatch) {
      const val = parseFloat(gbMatch[1].replace(/,/g, ""));
      if (!isNaN(val)) return Math.round(val);
    }
    // plain number string
    const num = parseFloat(s.replace(/,/g, ""));
    if (!isNaN(num) && num > 0) return Math.round(num);
  }
  // Fallback to parse capacity hints from name
  if (name) {
    const n = name.toLowerCase();
    // Match TB with word boundary to avoid matching model numbers
    // Pattern: space/start + digits + optional space + tb + word boundary
    const tbMatch = n.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*tb\b/i);
    if (tbMatch) {
      const val = parseFloat(tbMatch[1]);
      if (!isNaN(val)) return Math.round(val * 1000);
    }
    // Match GB with word boundary
    const gbMatch = n.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*gb\b/i);
    if (gbMatch) {
      const val = parseFloat(gbMatch[1]);
      if (!isNaN(val)) return Math.round(val);
    }
  }
  return 0;
}

/**
 * Get appropriate messages based on storage type and capacity
 */
function getMessagesForTypeAndTier(type: string, tier: string): string[] {
  const key = `${type}_${tier}`;

  // Storage type explanations for different scenarios
  const typeExplanations = {
    // HDD Messages (generally discouraged for modern systems)
    hdd_tiny: [
      "⚠️ HDD under 500GB: This is problematic on multiple levels. HDDs are mechanical (100-150 MB/s vs 7,000+ MB/s for NVMe), meaning 60-second boot times and 30+ second game loads. Plus you'll run out of space instantly. Strongly recommend a 1TB NVMe SSD instead – it's faster AND cheaper per GB now!",
      "⚠️ Small HDD alert: HDDs are legacy tech – spinning platters are 50-70x slower than NVMe SSDs. Your boot time will be 50-80 seconds vs 8-10 seconds with an SSD. Modern games will stutter loading assets. At this capacity, you're getting the worst of both worlds. Upgrade to at least a 1TB SATA SSD (£40) or Gen3 NVMe (£50).",
      "⚠️ Critical storage issue: HDDs are painfully slow for OS/games (Windows itself recommends SSD). Under 500GB means you'll fit Windows + 2-3 modern games max. This combo will frustrate you daily. A 1TB NVMe costs £45-60 and transforms the experience – 70x faster loads, instant responsiveness, more space. Worth every penny!",
      "⚠️ Sub-500GB HDD: Expect long waits and constant space pressure. NVMe drives obliterate HDDs for everyday tasks. Move to 1TB NVMe for a huge quality-of-life upgrade.",
      "⚠️ Tiny HDD detected: Modern titles exceed 100GB each. Mechanical latency will slow everything down. Swap to SSD/NVMe immediately for sane performance.",
      "⚠️ Entry-capacity HDD: Boot times will feel endless and installs crawl. A 1TB Gen3 NVMe is cheap, fast, and the right fix.",
      "⚠️ Legacy HDD bottleneck: Under 500GB is impractical in 2025. Upgrade to NVMe so Windows and games feel instant.",
      "⚠️ Minimal HDD capacity: Space and speed constraints collide here. A budget NVMe solves both problems.",
      "⚠️ Mechanical drive at tiny size: Not recommended for OS or gaming. Move to SSD/NVMe for 40-70x faster loads.",
      "⚠️ Small mechanical system drive: Strongly advise a 1TB NVMe boot drive and retire the HDD to secondary storage.",
      "⚠️ Very small HDD: Expect sluggishness, patience-testing updates, and limited installs. NVMe fixes all three.",
      "⚠️ Compact HDD storage: Functionally obsolete for primary use. An NVMe upgrade is the right call.",
      "⚠️ Undersized HDD: The fastest fix is a 1TB NVMe boot drive; keep HDD for backups only.",
      "⚠️ Low-cap HDD: Mechanical latency dominates experience. SSD/NVMe modernizes the PC overnight.",
      "⚠️ Tiny HDD footprint: Better suited as cold storage; NVMe should be your active drive.",
    ],
    hdd_small: [
      "⚠️ 500-1000GB HDD: I have to be honest – HDDs are obsolete for primary storage. Loading times are brutal: 60+ second boots, 20-40 second game launches, texture pop-in during gameplay. You'd be better served by a 1TB NVMe (same price range, 50x faster). HDDs are only viable now as bulk storage for media/archives.",
      "⚠️ HDD for OS/gaming: This isn't 2015 anymore! Mechanical drives bottleneck modern systems severely. Example: Cyberpunk 2077 loads in 45 seconds on HDD vs 8 seconds on NVMe. You'll experience stuttering when streaming assets. Swap to a 1TB Gen3 NVMe (£50-60) – night and day difference!",
      "⚠️ Mechanical drive warning: HDDs max out at ~150 MB/s. NVMe SSDs hit 3,500-7,000 MB/s. That's not a 10% difference – it's 20-50x slower! Windows updates take forever, game installs crawl, loading screens feel eternal. At 500-1000GB, you're not even saving money vs modern SSDs. Upgrade to NVMe!",
      "⚠️ HDD primary drive: Acceptable only for archives. For daily use, NVMe is the modern baseline.",
      "⚠️ Mid-size HDD: Consider NVMe for OS/games and keep HDD for media libraries.",
      "⚠️ 1TB HDD trade-off: Capacity OK, speed terrible. Pair with a 1TB NVMe for a balanced setup.",
      "⚠️ HDD detected: Move to SSD/NVMe to eliminate long boot and load times.",
      "⚠️ Mechanical storage chosen: Recommend adding a fast NVMe boot drive and reassigning HDD to secondary.",
      "⚠️ HDD bottleneck: NVMe pricing now rivals HDD. Upgrade for dramatic responsiveness gains.",
      "⚠️ Moderate HDD capacity: Use as archive; NVMe for performance-critical tasks.",
      "⚠️ HDD baseline: Viable for bulk storage only. Add NVMe for OS and active projects.",
    ],
    hdd_adequate: [
      "⚠️ 1TB+ HDD: You've got space, but speed is your enemy here. HDDs are mechanical – moving parts create latency. Modern games stream assets constantly (texture pop-in, stuttering). Boot times: 60+ seconds. Load times: 30-50 seconds. An equivalent NVMe costs £10-20 more but loads 40x faster. Use HDDs for backup/media storage, not primary drives!",
      "⚠️ Large HDD consideration: While 1TB+ solves capacity issues, you're sacrificing massive performance. Example: Launching Fortnite from HDD = 45 seconds, from NVMe = 6 seconds. That's 39 seconds wasted EVERY launch. Over a year of gaming, that's hours lost to loading screens. Invest £60 in a 1TB Gen3 NVMe – you'll thank me!",
      "⚠️ HDD at 1TB+: Capacity strong, speed weak. Add an NVMe as C: and keep HDD as D: for archives.",
      "⚠️ Big HDD storage: Fine for cold data. For hot data (OS/games/projects), NVMe is mandatory in 2025.",
      "⚠️ Adequate HDD volume: Pair with NVMe to prevent stutter and long loads.",
      "⚠️ HDD for bulk: Move live workloads to NVMe; keep this for media backup.",
    ],
    hdd_good: [
      "⚠️ 2TB+ HDD as primary: This is a speed vs capacity trade-off, and honestly? You're losing. HDDs are fine for mass media storage (movies, music, photos), but as your main drive? Windows will feel sluggish, games stutter, productivity apps lag. Smart move: 1TB NVMe for OS/games (£60), keep this HDD as D: drive for archives. Best of both worlds!",
      "⚠️ High-capacity HDD: Space isn't everything! You've got room for 20+ games, but each one loads 40x slower than on NVMe. Your system boot: 60+ seconds. File transfers: crawling. Modern SSDs have near-zero failure rates too. Recommendation: Use this as secondary storage, add a fast 1TB NVMe boot drive (£50-70). Massive upgrade for minimal cost!",
      "⚠️ HDD with big capacity: Ideal as secondary storage. Add NVMe for OS and active workloads.",
      "⚠️ Large HDD strategy: Tiered storage recommended – NVMe for speed, HDD for bulk.",
      "⚠️ 2TB HDD role: Archive-friendly, performance-poor. NVMe primary changes the experience.",
      "⚠️ Big HDD detected: Keep for media; install OS on NVMe for responsiveness.",
    ],
    hdd_great: [
      "⚠️ 4TB+ HDD: Impressive capacity, but are you using this as your main drive or bulk storage? If main: please reconsider – you're bottlenecking your entire system. HDDs introduce 100ms+ latency on every operation. If secondary: perfect! HDDs excel at cheap bulk storage for media/backups. Just ensure your OS/games live on an NVMe SSD (1TB minimum)!",
      "⚠️ Massive HDD detected: If this is secondary storage alongside an NVMe boot drive, brilliant strategy! £50-80 for 4TB+ of archive space is unbeatable. But if this is your only drive, we need to talk – you're crippling an otherwise good system. Add a 1TB Gen4 NVMe (£70) for OS/active games. Use the HDD for media libraries. Problem solved!",
      "⚠️ 4TB HDD plan: Keep as archive volume, pair with NVMe primary for a responsive system.",
      "⚠️ High-cap HDD role: Excellent for backups. Ensure OS/games are on NVMe for smooth performance.",
      "⚠️ Large HDD volume: Great cold storage; NVMe should host OS and workloads.",
      "⚠️ 4TB+ HDD: Sensible as secondary only; NVMe must be your main drive.",
    ],
    hdd_massive: [
      "📦 6TB+ HDD: This better be a secondary drive! With this much capacity, you're clearly archiving media, backups, or large datasets. Perfect use case for HDDs. Just confirm you have a fast NVMe as your C: drive for OS/applications. If not, add a 1TB Gen4 NVMe (£70) – you'll have both speed AND space. That's a proper setup!",
      "📦 Enormous HDD array: At 6TB+, you're into data hoarding territory (I respect it!). HDDs are cost-effective for bulk storage. But remember: access speed matters for active files. Best practice: NVMe for hot data (current projects/games), HDD for cold storage (completed projects/media libraries). Tiered storage = optimal performance + capacity!",
      "📦 Massive HDD vault: Great for media libraries and backups. Pair with NVMe for active workloads.",
      "📦 Huge HDD capacity: Treat as cold storage; run OS and current projects from a fast NVMe.",
      "📦 6TB HDD tier: Perfect archive drive; complement with NVMe boot for speed.",
      "📦 Enormous HDD store: Capacity king, speed pauper. NVMe balances the equation.",
    ],

    // SATA SSD Messages (acceptable but dated)
    "sata-ssd_tiny": [
      "⚠️ SATA SSD under 500GB: You've avoided the HDD trap (good!), but you're severely capacity-limited. Modern games: Call of Duty (150GB), MS Flight Sim (170GB), Starfield (125GB). You'll fit Windows + 2-3 games max. Consider upgrading to 1TB minimum – NVMe costs nearly the same now (£50-60) and is 6x faster than SATA!",
      "⚠️ Small SATA SSD: At least it's an SSD! But under 500GB is brutal with modern game sizes. You'll spend hours uninstalling/reinstalling games constantly. SATA tops out at 550 MB/s vs 3,500+ for Gen3 NVMe. Same price point, 6x faster, 2x capacity. Upgrade path clear: 1TB Gen3 NVMe for £50-60. Future-proof properly!",
      "⚠️ Tiny SATA drive: SSDs are great, SATA is okay, but this capacity is painful. Black Myth Wukong alone wants 130GB! You're looking at 3-4 games total. SATA is also legacy now – motherboards are dropping SATA ports for more M.2 slots. Swap to 1TB Gen3/Gen4 NVMe (£50-70). Same budget, better everything!",
      "⚠️ Minimal SATA SSD: Capacity restricts you more than speed helps. Move to 1TB NVMe for balanced performance.",
      "⚠️ Entry SATA capacity: Space will run out quickly. NVMe offers more speed and similar pricing.",
      "⚠️ Tiny SATA footprint: Upgrade to 1TB NVMe to avoid constant game juggling.",
      "⚠️ Small SATA setup: Fine as secondary; NVMe is ideal for OS/games.",
      "⚠️ SATA under 500GB: Consider NVMe for both speed and breathing room.",
    ],
    "sata-ssd_small": [
      "⚠️ 500-1000GB SATA SSD: Decent reliability, but SATA is showing its age. At 550 MB/s, you're 6x slower than budget NVMe. You'll fit 5-8 modern games. Playable? Yes. Optimal? No. Gen3 NVMe costs the same (£50-60 for 1TB) and loads games 6x faster. DirectStorage won't work on SATA either – future-proofing issue!",
      "⚠️ SATA SSD detected: It's functional but outdated tech. SATA was great in 2015, but NVMe is now the standard. Your motherboard likely has 2-3 M.2 slots going unused while you occupy a SATA port. Same price gets you Gen3 NVMe with 3,500 MB/s vs 550 MB/s. That's: faster boots, faster loads, better asset streaming. Easy upgrade!",
      "⚠️ 500-1000GB SATA: Adequate for today, limiting tomorrow. SATA maxes at 550 MB/s – DirectStorage games need 2,000+ MB/s for instant texture streaming. You're locked out of next-gen features. Capacity-wise, you'll play 'storage Tetris' within months. Recommendation: 1TB Gen4 NVMe (£65-75). Modern interface, 12x faster, future-proof!",
      "⚠️ Modest SATA SSD: Suitable as secondary storage. Prefer NVMe for boot and gaming.",
      "⚠️ SATA baseline: Works, but NVMe is the modern default for speed-critical tasks.",
      "⚠️ Small SATA drive: Consider 1TB Gen3 NVMe for a smoother, future-ready experience.",
      "⚠️ SATA starter: Upgrade to NVMe when possible for noticeable load time gains.",
      "⚠️ 1TB SATA option: Good capacity; NVMe brings the speed your system deserves.",
    ],
    "sata-ssd_adequate": [
      "💾 1-1.5TB SATA SSD: Respectable capacity for 8-12 games, but SATA is legacy tech now. At 550 MB/s, you miss out on DirectStorage (instant texture loads), faster boots, and optimal asset streaming. Your motherboard probably has M.2 slots – use them! 1TB Gen3 NVMe costs the same as SATA and delivers 6x speed. No-brainer upgrade path!",
      "💾 1TB SATA SSD: Gets the job done, but you're leaving performance on the table. SATA = 550 MB/s. Gen3 NVMe = 3,500 MB/s. Game load time difference: 12 seconds (SATA) vs 4 seconds (NVMe). Over a year of gaming, that's HOURS saved. Plus, NVMe enables DirectStorage. When you upgrade, donate this SATA as external backup drive!",
      "💾 1-1.5TB SATA: Solid baseline, but tech has moved on. SATA was the standard 5 years ago – NVMe is today's baseline. Benefits you're missing: 6x faster sequential reads, lower latency, DirectStorage compatibility, M.2 form factor (no cables!). Keep this as secondary drive (D:), add 1TB Gen4 NVMe as primary (C:). Easy migration!",
      "💾 Adequate SATA capacity: Comfortable space; consider NVMe for performance-critical workloads.",
      "💾 SATA as secondary: Great paired with NVMe primary to balance speed and capacity.",
      "💾 1TB+ SATA baseline: Keep for storage; add Gen4 NVMe for daily speed.",
      "💾 SATA adequate tier: Sensible, but NVMe unlocks modern features and responsiveness.",
    ],
    "sata-ssd_good": [
      "💾 2TB SATA SSD: Excellent capacity for 15+ games! But I must ask: why SATA? NVMe costs the same per GB now and is 6-13x faster depending on gen. You'll fit all your games but load them slower than necessary. Pro tip: Your mobo has M.2 slots – when budget allows, add a Gen4 NVMe for OS/active games, demote this SATA to storage duty. You'll notice the difference!",
      "💾 2TB SATA: Great space management! You won't run out anytime soon. But here's the thing: SATA caps at 550 MB/s. Gen3 NVMe hits 3,500 MB/s for the same price. Loading Cyberpunk 2077: SATA = 15 seconds, NVMe = 5 seconds. That's not nitpicking – it's tangible. Next upgrade: match this capacity in NVMe. You'll wonder why you waited!",
      "💾 2-2.5TB SATA SSD: Fantastic for storage volume, but dated interface. SATA was cutting-edge in 2015. We're in 2025 now – NVMe is ubiquitous and price-competitive. You're getting great capacity at mediocre speed. Upgrade path: Keep this as game library/archives, add 1TB Gen4 NVMe as primary. Total storage increases, speed skyrockets. Win-win!",
      "💾 High-cap SATA: Keep as archive drive; install OS/games on NVMe for best results.",
      "💾 SATA volume strong: Pair with Gen4 NVMe to remove performance bottlenecks.",
      "💾 2TB SATA role: Excellent as secondary; NVMe should lead for active tasks.",
      "💾 Big SATA SSD: Balance this with an NVMe boot drive for a snappy system.",
    ],
    "sata-ssd_great": [
      "📦 4TB SATA SSD: Massive capacity (20+ AAA games!), but let's talk efficiency. At this capacity, you're likely doing content creation or heavy multitasking. SATA's 550 MB/s bottlenecks large file transfers and project loads. A 2TB Gen4 NVMe (£150) + keeping this as secondary gives you speed where it counts, capacity where you need it. Tiered storage strategy!",
      "📦 4TB SATA: You're serious about storage! But SATA? At this tier, you deserve Gen4 NVMe speed. Consider: 4TB Gen4 costs £250-300 vs £200-250 for SATA. That's £50-75 more for 12x speed boost. If budget's tight, keep this, add a 1TB Gen4 NVMe boot drive (£70). Run OS/active projects from NVMe, archive completed work here. Optimal setup!",
      "📦 Large SATA capacity: Excellent as bulk storage; complement with NVMe for active workloads.",
      "📦 SATA at 4TB: For creators, NVMe primary + SATA secondary is the ideal pairing.",
      "📦 4TB SATA tier: Keep for archives; Gen4 NVMe should host your live projects.",
      "📦 Big SATA pool: Tiered storage wins—NVMe for speed, SATA for volume.",
    ],
    "sata-ssd_massive": [
      "📦 6TB+ SATA SSD: This is clearly a data storage drive, not a performance drive, right? At this capacity, SATA makes economic sense – NVMe prices explode above 4TB. Smart play: Use this for media libraries/archives/backups. Pair with a 1-2TB Gen4/Gen5 NVMe for OS/applications/active projects. You get speed AND space without breaking the bank. Properly architected!",
      "📦 Enormous SATA array: At 6TB+, cost per GB matters more than raw speed. SATA SSDs hit a price/capacity sweet spot here that NVMe can't match yet. Legitimate strategy for bulk storage! Just ensure your primary drive (C:) is a fast NVMe. Let SATA handle the heavy lifting for archives. Well planned if that's your setup!",
      "📦 Massive SATA pool: Economical bulk storage. Keep hot data on NVMe for responsiveness.",
      "📦 Huge SATA capacity: Ideal for archives and backups; NVMe should serve OS and active projects.",
      "📦 6TB+ SATA tier: Excellent economics—pair with NVMe for live workloads.",
      "📦 Enormous SATA store: Archive champion; NVMe remains your day-to-day performance engine.",
    ],

    // Gen3 NVMe Messages (budget sweet spot)
    "gen3-nvme_tiny": [
      "⚠️ Gen3 NVMe under 500GB: Great interface choice, but severe capacity crunch! Gen3 delivers 3,500 MB/s (7x faster than SATA), so performance is solid. Problem: modern games are 100-150GB each. You'll fit 2-4 games max. Upgrade to 1TB Gen3 (£50-60) – same tech, more room. You've made the right interface choice; just need more space!",
      "⚠️ Small Gen3 NVMe: Performance is there (3,500 MB/s = excellent for gaming), but capacity will bite you fast. Call of Duty: 150GB. Flight Sim: 170GB. Windows + apps: 50-70GB. You're fitting 3 games tops. Gen3 NVMe 1TB drives cost £50-60 – same price per GB at scale. Upgrade path clear: more capacity, keep this as secondary drive!",
      "⚠️ Gen3 but tiny: You understand NVMe speed matters (smart!), but undersized capacity hurts. 256-480GB means constant game juggling. Modern titles are HUGE. Recommendation: 1TB Gen3 NVMe is £50-60 (same tech, better value). You'll fit 8-12 games comfortably. Keep this drive as a Windows-to-Go or cache drive – don't waste good NVMe!",
      "⚠️ Tiny Gen3 NVMe: Speed is great, capacity isn't. Move to 1TB for a balanced setup.",
      "⚠️ Minimal Gen3 NVMe: Consider 1TB to avoid constant uninstall/reinstall cycles.",
      "⚠️ Small Gen3 baseline: Capacity holds you back—upgrade for comfort.",
      "⚠️ Gen3 under 500GB: NVMe is right; size isn't. Choose 1TB minimum.",
    ],
    "gen3-nvme_small": [
      "💾 500-1000GB Gen3 NVMe: This is the budget gaming sweet spot! 3,500 MB/s sequential reads mean: 8-second Windows boots, 4-6 second game loads, smooth open-world asset streaming. You'll fit 6-10 games. Smart choice if you're value-focused – Gen4 is only 10-15% faster in real use but costs 30-40% more. Spend savings on GPU/RAM!",
      "💾 Gen3 NVMe (1TB): Excellent price/performance balance! Here's why this is smart: Gen3 costs £50-60, Gen4 costs £75-90, Gen5 costs £120-150. Real-world gaming difference? Negligible (1-2 seconds). You've optimized correctly – 3,500 MB/s is plenty for gaming. If budget is tight, this is THE choice. Upgrade later if doing heavy video/3D work!",
      "💾 1TB Gen3: The pragmatist's choice! Gen3 delivers 3,500 MB/s – that's 6x faster than SATA, 90% as fast as Gen4 in real use, at 60% the price. You'll load games fast enough to never care about the 1-2 second difference Gen4 offers. 1TB fits 8-12 modern games. When you need more space, add a second M.2 drive. Perfect starter setup!",
      "💾 500-1000GB Gen3 NVMe: Smart budget allocation! Gen3 was the flagship standard 2 years ago – still crushes gaming workloads today. Games load in seconds, Windows feels snappy, asset streaming is smooth. The Gen4 'upgrade' is mostly marketing for gamers. Save that £30-40, invest in better GPU or more RAM. You've prioritized correctly!",
      "💾 Gen3 NVMe 1TB: The enthusiast community's secret? Most people can't tell Gen3 from Gen4 blind. Both load Elden Ring in 3-5 seconds. Gen3 just does it at 3,500 MB/s vs 7,000 MB/s – imperceptible to humans! You'll fit 10-12 games, spend £40 less than Gen4, and have zero buyer's remorse. When Gen5 drops to Gen3 prices, THEN upgrade!",
      "💾 Gen3 1TB baseline: Fantastic gaming value. Add capacity later as needed.",
      "💾 1TB Gen3 NVMe: Spend savings on GPU/RAM; storage speed is already ample.",
      "💾 Gen3 1TB tier: Balanced, quick, and cost-effective for most builds.",
      "💾 Budget NVMe sweet spot: Gen3 hits the mark for speed and price.",
    ],
    "gen3-nvme_adequate": [
      "💾 1-1.5TB Gen3 NVMe: Great balance of speed, capacity, and cost! 3,500 MB/s is more than enough for gaming/productivity. You'll comfortably fit 10-15 games, Windows, apps, and media. Gen3's 'limitation'? It's only 2x slower than Gen5 (which costs 2.5x more). Diminishing returns! This is smart buying. When you need more space, add another drive – your mobo has slots!",
      "💾 1.5TB Gen3: Goldilocks capacity! Not too small (storage anxiety), not too large (overspending). 3,500 MB/s handles everything: 4K video editing, game development, simulations, gaming. Gen4/Gen5 matter for 8K raw footage or massive database queries – if you're not doing that, you've saved £50-100 without sacrificing experience. Well optimized!",
      "💾 Gen3 NVMe 1-1.5TB: This is what I recommend to 60% of my customers! Why? It hits the price/performance sweet spot perfectly. You get NVMe speed (crucial), adequate capacity (no storage anxiety for 12+ months), and budget left over for components that matter more (GPU, CPU, RAM). Gen4 is 5-10% faster in synthetic tests, imperceptible in reality. Smart choice!",
      "💾 Adequate Gen3 capacity: Balanced choice for gaming and productivity.",
      "💾 Gen3 sweet spot: Plenty of speed; capacity fits growing libraries.",
      "💾 1TB+ Gen3 tier: Reliable performance and comfortable space for modern use.",
      "💾 Gen3 adequate pool: Sensible baseline—expand later with another M.2 as needed.",
    ],
    "gen3-nvme_good": [
      "💾 2TB+ Gen3 NVMe: Excellent capacity planning! You'll fit 15-20 AAA games, all productivity software, and media projects. At 3,500 MB/s, Gen3 is plenty fast for gaming. The Gen4 vs Gen3 debate? Marketing hype mostly. You've saved £40-60 vs equivalent Gen4 capacity. That's a GPU upgrade fund! When you fill this up, add another M.2 drive. Expandability is beautiful!",
      "💾 2-2.5TB Gen3 NVMe: You won't worry about storage for years! 20+ games, Windows, apps, media – all on fast NVMe. Gen3's 'weakness'? It's only 2x slower than Gen5 (the 'fastest' option). In practice, loading Fortnite: Gen3 = 5 seconds, Gen5 = 4 seconds. Worth £80 more? Nope. You've allocated budget wisely. Add RAM/GPU with the savings!",
      "💾 2TB Gen3: Future-proof capacity, sensible speed! You're not cutting corners (it's NVMe!), just avoiding the Gen4/Gen5 'early adopter tax'. Games will load blazingly fast, you'll have breathing room for years, and you've saved enough to upgrade GPU sooner. When game sizes inevitably balloon in 2027, add another 2TB drive. That's the beauty of M.2 – easy expansion!",
      "💾 Gen3 at 2TB+: Strong capacity, great value. Add drives as your needs grow.",
      "💾 Large Gen3 NVMe: Perfect for big libraries without overspending on speed.",
      "💾 2TB Gen3 tier: Sensible capacity that keeps performance and budget in check.",
      "💾 Big Gen3 pool: Expand easily later; current speed is already ample.",
    ],
    "gen3-nvme_great": [
      "📦 4TB Gen3 NVMe: Massive capacity meets solid performance! 4TB means 30+ AAA games installed simultaneously – storage anxiety eliminated! At 3,500 MB/s, Gen3 is no slouch. Yes, Gen4 is faster, but at 4TB capacity, you'd pay £300+ vs £200-250 for Gen3. That's £50-100 saved. For gaming-focused builds, Gen3 at this capacity is genuinely smart spending. Respectable choice!",
      "📦 4TB Gen3: You're planning ahead! This capacity handles: massive game libraries (30+ titles), 4K video projects, photography RAW archives, and VM images. Gen3's 3,500 MB/s is adequate for all of that. Gen4/Gen5 help with 8K editing or database work – if that's not your workload, you've avoided overspending. High capacity + proven tech = sensible build!",
      "📦 4TB Gen3 NVMe: Big, fast enough, and cost-efficient. Excellent for gamers and creators alike.",
      "📦 Gen3 at 4TB: Prioritizes capacity while keeping performance strong for real-world tasks.",
      "📦 4TB Gen3 tier: Install everything; speed remains solid for daily use.",
      "📦 Large Gen3 capacity: Great planning—room for projects and games without premium pricing.",
    ],
    "gen3-nvme_massive": [
      "📦 6TB+ Gen3 NVMe: This is a data hoarder's dream! At this capacity, Gen3 vs Gen4 matters less – you're clearly prioritizing storage volume. 3,500 MB/s is respectable for accessing archives, running VMs, or managing media libraries. Cost difference: £300+ for Gen4 vs £400-500 for Gen3 at 6TB+. If you don't need peak sequential speeds, you've saved hundreds. Value-focused power user move!",
      "📦 Massive Gen3 array: 6TB+ on NVMe is serious storage! Gen3 is perfect here – you get SSD reliability + NVMe speeds without the Gen4/Gen5 premium. Use case clearly: content creation archives, game libraries, VM storage, or development environments. Speed is 'fast enough', capacity is king. Well planned! Just ensure you have proper backups at this data volume!",
      "📦 Huge Gen3 pool: Prioritize redundancy and backups at this scale. Performance remains very usable.",
      "📦 Gen3 massive capacity: Sensible economics for NVMe at high volumes. Pair with a secondary drive for expansion.",
      "📦 6TB+ Gen3 tier: Capacity-first strategy; ensure robust backup hygiene.",
      "📦 Enormous Gen3 NVMe: Impressive volume—speed is sufficient, redundancy is essential.",
    ],

    // Gen4 NVMe Messages (current sweet spot)
    "gen4-nvme_tiny": [
      "⚡ Gen4 NVMe under 500GB: You've chosen flagship speed (7,000 MB/s!) but undersized capacity. Gen4 shines for DirectStorage games and heavy workloads, but you'll only fit 2-4 modern games. Counterintuitive recommendation: drop to 1TB Gen3 (£50-60). You'll gain capacity, lose ~5% real-world speed. OR, wait for deals on 1TB Gen4 (£65-75). Speed is useless when you're out of space!",
      "⚡ Small Gen4 NVMe: Premium speed, budget capacity. Gen4's 7,000 MB/s is amazing for DirectStorage, but at 256-480GB you're fitting 3 games max. That's like buying a Ferrari with a 5-gallon tank! Either: upgrade to 1TB Gen4 (£70-80) for proper balance, OR get 1TB Gen3 (£55) and use the savings elsewhere. Don't bottleneck speed with no space!",
      "⚡ Tiny Gen4 drive: You understand performance (Gen4 is current-gen standard), but capacity will frustrate you daily. Modern games: 100-150GB each. You're constantly uninstalling. Solution: 1TB Gen4 is £70-80 – sweet spot pricing. OR, if budget-conscious, 1TB Gen3 (£50-60) loses 10% speed but doubles/triples space. Speed means nothing if you can't install games!",
      "⚡ Gen4 but tiny: Upgrade capacity to unlock the speed you paid for.",
      "⚡ Minimal Gen4 NVMe: Move to 1TB for a balanced, modern baseline.",
      "⚡ Small Gen4 tier: Capacity is the bottleneck—solve it with 1TB+.",
      "⚡ Compact Gen4 NVMe: Great speed; insufficient size. Prioritize capacity.",
    ],
    "gen4-nvme_small": [
      "⚡ 500-1000GB Gen4 NVMe: Solid mid-tier choice! 7,000 MB/s = fast boots, instant game loads, DirectStorage compatibility. You'll fit 8-12 modern games. Is Gen4 necessary vs Gen3? For gaming: barely. For video editing/development: yes. If you're gaming-only, Gen3 1TB (£50) is 90% as good. If you're creating content, Gen4 is justified. You're on the right track!",
      "⚡ 1TB Gen4 NVMe: The 2025 sweet spot! This is what I recommend most often. Why? 7,000 MB/s handles everything: DirectStorage games, 4K video, large compiles. 1TB fits 10-15 games comfortably. Price: £70-80 (fair for cutting-edge speed). You've balanced speed + capacity + cost optimally. When you need more space, add a second drive. Perfect foundational choice!",
      "⚡ Gen4 NVMe 1TB: Excellent choice for gaming + creation! Gen4's benefits: 2x faster than Gen3, DirectStorage ready, lower latency, cooler temps. Real-world impact: Game loads in 3 seconds (vs 5 on Gen3), 4K video scrubbing is smooth, large file transfers fly. Worth 30% price premium? If you multitask beyond gaming, absolutely! You've invested wisely!",
      "⚡ 500-1000GB Gen4: Current-generation standard! Gen4 is what enthusiasts choose in 2025 – it's fast enough to eliminate storage bottlenecks entirely. You'll notice: instant application launches, seamless game world loading (no texture pop-in), fast project saves. 1TB capacity is the baseline I recommend. You've hit the target! Upgrade to 2TB Gen4 later if needed!",
      "⚡ 1TB Gen4 NVMe: Smart, balanced build! Gen4 gives you headroom for next-gen games (DirectStorage becoming standard), 4K/8K editing, and fast VM operations. 1TB means 12-15 games + Windows + apps. This is 'buy once, cry once' territory – you won't need to upgrade for 3-4 years. When you do, it'll be for capacity, not speed. Well done!",
      "⚡ Gen4 1TB baseline: Great all-rounder for modern workloads and gaming.",
      "⚡ 1TB Gen4 choice: Fast, future-ready, and balanced for most users.",
      "⚡ 1TB Gen4 tier: Eliminates bottlenecks; capacity covers modern game libraries.",
      "⚡ Gen4 small tier: Practical and performant—ideal starting point.",
    ],
    "gen4-nvme_adequate": [
      "⚡ 1-1.5TB Gen4 NVMe: Fantastic balance! 7,000 MB/s + ample capacity = no compromises. You'll load games in 2-4 seconds, edit 4K footage smoothly, and fit 15+ AAA games. Gen4 vs Gen5? Gen5 is 40% faster, 80% more expensive. Diminishing returns! You've optimized perfectly. This drive will serve you well for years. Add capacity later if needed, but speed is locked in!",
      "⚡ 1.5TB Gen4: Premium capacity with flagship speed! Gen4's 7,000 MB/s is the current standard for high-performance builds. You've got: DirectStorage support, fast boots, instant loads, ample space for 18-20 games. This is 'no-excuses' storage. Gen5 exists but offers minimal real-world gains for 60-80% cost increase. You're at the optimal price/perf point. Excellent choice!",
      "⚡ Gen4 NVMe 1-1.5TB: This is what I run personally! Why? Gen4 eliminates ALL storage bottlenecks. Your GPU/CPU will be the limit, not your SSD. 1.5TB is comfortable for 18+ games without anxiety. Future-proof for DirectStorage, fast for content creation, and priced reasonably (£90-110). You've made a pro-level choice without overspending. Respect!",
      "⚡ Adequate Gen4 capacity: Plenty of space and peak real-world speed.",
      "⚡ Gen4 balanced tier: Locks in performance while keeping costs reasonable.",
      "⚡ 1TB+ Gen4 tier: Smooth experience across gaming and productivity workloads.",
      "⚡ Gen4 adequate pool: Roomy, responsive, and well-priced for its capability.",
    ],
    "gen4-nvme_good": [
      "⚡ 2TB+ Gen4 NVMe: Power user setup! 7,000 MB/s + 2TB capacity means: 20-25 AAA games installed, massive media projects, fast database access, smooth VM operations. You won't worry about storage for years. Gen4 is the 'Goldilocks' gen – fast enough to max out real-world use cases, not as overpriced as Gen5. This is enthusiast-grade done right!",
      "⚡ 2-2.5TB Gen4 NVMe: This is a complete storage solution! Fast enough to handle anything (7,000+ MB/s), spacious enough to eliminate anxiety (20+ games), and priced reasonably (£130-160). Gen5 is faster on paper, but you'd pay £250+ for 2TB. Not worth it! You've bought the LAST storage drive you'll need for 3-5 years. Future-proof complete!",
      "⚡ 2TB Gen4: Professional-grade choice! Whether you're gaming, creating content, or developing software, this covers all bases. Gen4 speed ensures zero bottlenecks, 2TB means you install everything you want. When drives are this fast, capacity becomes the only limitation. You've eliminated that too! Add a second drive later only if you're hoarding media archives!",
      "⚡ 2TB+ Gen4 NVMe: You've built for longevity! Gen4's 7,000 MB/s is more than sufficient through 2027-2028. 2TB holds: your entire gaming library (20+ titles), work projects, media, and OS. This is 'set it and forget it' tier. No upgrades needed for years. When you fill this up, you'll add a secondary drive, not replace this one. Forward-thinking purchase!",
      "⚡ Gen4 at 2TB+: Ideal capacity for creators and enthusiasts; speed remains uncompromised.",
      "⚡ Large Gen4 NVMe: A long-term solution balancing performance and space.",
      "⚡ 2TB Gen4 tier: Significant headroom, sustained speed—ready for anything.",
      "⚡ Big Gen4 pool: Eliminates storage anxiety while keeping workflows snappy.",
    ],
    "gen4-nvme_great": [
      "📦 4TB Gen4 NVMe: Elite storage tier! This is what content creators, developers, and hardcore gamers choose. 7,000 MB/s + 4TB = install everything, access everything instantly. You'll fit 40+ AAA games, multiple 4K video projects, development environments, and VM images. Price: £250-300. Worth it? If storage bottlenecks frustrate you, absolutely! This is 'buy once, upgrade never' territory!",
      "📦 4TB Gen4: This is my dream setup! Gen4 speed removes all bottlenecks, 4TB eliminates all anxiety. You can: maintain a complete game library (40+ titles), run multiple OS VMs simultaneously, edit 8K footage smoothly, compile huge codebases fast. It's overkill for gaming-only, but if you do ANY content creation, it's justified. Premium tier, premium experience!",
      "📦 4TB Gen4 NVMe: You're not messing around! This is professional workstation storage. Use cases: video editors (4K/8K footage), game developers (large project files + builds), 3D artists (high-poly models + textures), or serious sim racers with massive game installs. Gen4 ensures speed never bottlenecks you. 4TB means space never bottlenecks you. Well equipped!",
      "📦 Gen4 at 4TB: Ultimate practicality – install everything, wait for nothing.",
      "📦 4TB Gen4 choice: Premium capacity meets sustained, top-tier performance.",
      "📦 4TB Gen4 tier: Professional-grade headroom and responsiveness for complex workflows.",
      "📦 Large Gen4 volume: Capacity luxury with true workstation speed.",
    ],
    "gen4-nvme_massive": [
      "📦 6TB+ Gen4 NVMe: This is data center/workstation territory! At this capacity + speed, you're clearly doing professional work: massive video libraries, extensive game development, 3D asset archives, or server hosting. Cost is high (£400-600+), but you get: instant access to everything, no compromises. Ensure proper backups – losing 6TB+ would be catastrophic! Premium storage for premium workflows!",
      "📦 Massive Gen4 array: 6TB+ on Gen4 NVMe is serious business! This screams: professional content creator, game developer, or serious enthusiast. Gen4's 7,000 MB/s means zero wait time accessing any file in your 6TB library. This is top 1% storage. Just remember: at this scale, backup strategy is critical. RAID? Cloud? External? Plan for redundancy!",
      "📦 Huge Gen4 NVMe: Enterprise-class capacity and speed. Treat backups as non-negotiable.",
      "📦 Gen4 massive tier: If your workflow needs it, this is flawless. Ensure redundancy.",
      "📦 6TB+ Gen4 tier: Professional scope—pair with robust, multi-layer backup strategy.",
      "📦 Enormous Gen4 setup: Astonishing speed/space; reliability planning is essential.",
    ],

    // Gen5 NVMe Messages (cutting edge, often overkill)
    "gen5-nvme_tiny": [
      "⚡ Gen5 NVMe under 500GB: You've bought the FASTEST storage (10,000+ MB/s) but smallest capacity. This is like owning a Bugatti with a tiny trunk! Gen5 costs 2x more than Gen4 for minimal real-world gains in gaming. Recommendation: Return this, get 1TB Gen4 (£70-80). You'll have double the space, 'only' 7,000 MB/s, and £50-70 refund for other components. Speed is useless if you can't install anything!",
      "⚡ Small Gen5 NVMe: Bleeding-edge speed (10,000+ MB/s), impractical capacity. Gen5 is for 8K video editing, high-speed data logging, or bragging rights. At 256-480GB, you're fitting 2-4 games. That's absurd for the price premium! Honest advice: downgrade to 1TB Gen4 (£75), save £50-100, get usable space. Gen5 is overkill for 99% of users anyway!",
      "⚡ Tiny Gen5 drive: You're an early adopter! Gen5's 10GB/s is incredible, but real-world gaming difference vs Gen4? 1-2 seconds. At this capacity, you can't even exploit the speed – you're constantly managing storage. Smart move: exchange for 2TB Gen4 (£140). You'll have 4x space, lose 30% speed (imperceptible), and save £50+. Think capacity-first at this price tier!",
      "⚡ Gen5 at tiny size: Capacity undermines the speed advantage. Prefer 1TB+.",
      "⚡ Minimal Gen5 NVMe: Downsize to Gen4 or upsize capacity for practical gains.",
      "⚡ Small Gen5 baseline: Speed headline, capacity footnote—fix the latter.",
      "⚡ Compact Gen5 NVMe: Brilliant on paper, awkward in practice. Choose 1TB+.",
    ],
    "gen5-nvme_small": [
      "⚡ 500-1000GB Gen5 NVMe: Flagship speed, questionable capacity! Gen5's 10,000+ MB/s is amazing on benchmarks, but in gaming? You'll load Cyberpunk in 3 seconds vs 4 seconds on Gen4. That's £50-80 extra for 1 second. At 1TB, you're fitting 10-12 games. Consider: 2TB Gen4 (£140) vs 1TB Gen5 (£150-180). I'd take 2x space over 1 second load time. Your call!",
      "⚡ 1TB Gen5 NVMe: Early adopter territory! Gen5 is THE fastest consumer storage – 10GB/s reads are wild! Real talk: DirectStorage games don't need this yet. You're paying £150-200 for 1TB (vs £70-80 for Gen4 1TB). That's 2x cost for 10-15% real-world improvement. Justified only if: you edit 8K RAW footage, run high-speed data logging, or want ultimate bragging rights! Otherwise, overspending.",
      "⚡ Gen5 NVMe 1TB: You've bought the future before it's necessary! Gen5 is fantastic tech – 10,000 MB/s is absurd. But practical benefits today? Minimal. Games: 1-2 seconds faster than Gen4. Video editing: noticeable if 8K RAW, not if 4K H.265. If money is no object, enjoy the cutting edge! If budget matters, 1TB Gen4 (£70) is 90% as good for half the price. Honest feedback!",
      "⚡ 1TB Gen5: The benchmark king! You'll crush CrystalDiskMark tests and flex on Reddit. Real-world gaming? Imperceptibly faster than Gen4. Gen5 shines for: 8K video (yes), massive database queries (yes), gaming (no). At £150-200 for 1TB, you're paying the 'first adopter tax'. If that doesn't bother you, enjoy the speed! If value matters, Gen4 is smarter. Your choice!",
      "⚡ Small Gen5 capacity: Consider Gen4 for value or 2TB Gen5 for practicality.",
      "⚡ Gen5 1TB: Premium speed, modest capacity – weigh needs vs cost carefully.",
      "⚡ Gen5 small tier: Incredible bandwidth; capacity may frustrate daily use.",
      "⚡ 1TB Gen5 baseline: Niche value—phenomenal for pro workloads, marginal for gaming.",
    ],
    "gen5-nvme_adequate": [
      "⚡ 1-1.5TB Gen5 NVMe: Premium tier! Gen5's 10,000+ MB/s is extreme – you've got: instant texture streaming (DirectStorage games), 8K video scrubbing, near-zero latency. Capacity is decent (15+ games). Cost: £200-250. Worth it? Depends. Content creators: maybe. Gamers: probably not (Gen4 is 90% as good). You've future-proofed maximally. No regrets if budget allows!",
      "⚡ 1.5TB Gen5: Cutting-edge choice! At 10GB/s, this is the fastest consumer storage available. You'll have bragging rights and benchmark screenshots that make people jealous. Practical benefit vs Gen4 in games? 1 second load time difference. For 4K/8K video? Significant! Price: £250+. If you're creating content daily, justified. If gaming-focused, Gen4 is better value. High-end, no question though!",
      "⚡ Gen5 NVMe 1.5TB: You've maxed storage speed! Gen5 is what pros use for: 8K RED RAW footage, real-time 3D rendering, high-frequency trading systems (seriously). For gaming? Overkill. But if you want ZERO compromises and money isn't a concern, this is it. You'll never think 'I wish my storage was faster'. Future-proof? Absolutely. Necessary? Debatable. Premium? Undeniably!",
      "⚡ Adequate Gen5 capacity: High speed meets usable space; ensure your workflow benefits.",
      "⚡ Gen5 balanced tier: Best reserved for professional workloads needing peak throughput.",
      "⚡ 1TB+ Gen5 tier: Premium feel; evaluate ROI vs Gen4 for your tasks.",
      "⚡ Gen5 adequate pool: Superb bandwidth with sensible capacity—creator-friendly.",
    ],
    "gen5-nvme_good": [
      "⚡ 2TB+ Gen5 NVMe: Top-tier, no-compromises build! 10,000 MB/s + 2TB = install everything, access everything instantly. This is what professional editors, 3D artists, and high-end gamers choose when budget is flexible. Cost: £300-400. Value proposition: questionable for gaming (Gen4 is 95% as good for half price), strong for content creation. If you've made this investment, you understand what you're getting. Respect!",
      "⚡ 2TB Gen5 NVMe: Elite performance tier! Gen5 is bleeding-edge – most motherboards still don't fully utilize it! At 2TB, you've combined ultimate speed with generous capacity. Use cases where this makes sense: professional 8K video editing, game development (fast asset loading), massive simulation work. For gaming alone? Honestly, Gen4 is 90% as good. But if you want THE BEST, this is it!",
      "⚡ 2-2.5TB Gen5: You've bought the absolute pinnacle of consumer storage! 10GB/s is mind-blowing – transferring 100GB takes ~10 seconds. 2TB holds 25+ AAA games. Cost: £350-450. This is for people who: hate waiting, work professionally with huge files, or want maximum performance in everything. No bottlenecks exist here. Future-proof for 5+ years easily. Premium experience, premium price!",
      "⚡ 2TB+ Gen5 NVMe: Pro workstation storage! This screams: I edit 8K professionally, I develop AAA games, or I'm a serious enthusiast who values time. Gen5 eliminates wait times entirely – every operation is instant. 2TB means no capacity anxiety. Price: £350+. Overkill? For most people, yes. But 'most people' aren't building custom rigs. You've chosen top 0.1% storage. Own it!",
      "⚡ Large Gen5 NVMe: Ultimate speed with practical capacity – niche but formidable.",
      "⚡ Gen5 2TB+: If your workflow demands it, this is unmatched performance.",
      "⚡ 2TB Gen5 tier: Blazing throughput meets real capacity—creator-centric pick.",
      "⚡ Big Gen5 pool: For serious production pipelines; gaming sees minimal gains.",
    ],
    "gen5-nvme_great": [
      "📦 4TB Gen5 NVMe: This is enterprise-level storage for consumers! 10GB/s + 4TB = you've eliminated all storage limitations. Cost: £600-800+. Who needs this? Professional editors handling multiple 8K projects, game developers with massive build folders, data scientists with huge datasets. For gaming? Absolute overkill. For professional work? Justified. You've bought THE BEST. Make sure you're using it to its potential!",
      "📦 4TB Gen5: Extreme, unapologetic performance! At this tier, you're not shopping for value – you're shopping for capability. Use cases: running multiple 4K/8K video timelines simultaneously, massive game development projects (100GB+ builds), scientific simulation data. This is top 0.1% storage. Price is high (£650-900), but performance is unmatched. If your workflow justifies it, brilliant. If not, you've overspent magnificently!",
      "📦 4TB Gen5 NVMe: Flagship everything! You've built or are building a no-compromises system. Gen5's 10,000+ MB/s means: instant access to any file in your 4TB library, real-time 8K editing, fast VM provisioning, zero bottlenecks. This is what I'd buy if money was no object. But real talk: most workflows won't notice difference vs 4TB Gen4 (£280-350 cheaper). If you're using it, awesome. If not, consider downgrades!",
      "📦 Gen5 at 4TB: Overkill for gaming; essential for high-end production workflows.",
      "📦 4TB Gen5 tier: If you need it, nothing else compares.",
      "📦 4TB Gen5 scope: Enterprise-class feel—ensure you truly leverage the bandwidth.",
      "📦 Large Gen5 capacity: Stunning capability; creators benefit most, gamers least.",
    ],
    "gen5-nvme_massive": [
      "📦 6TB+ Gen5 NVMe: This is datacenter/enterprise SAN territory! At this capacity + speed, you're running: professional post-production studio, game development team, or serious home lab. Cost: £1,000-1,500+. This is top 0.01% storage. Benefits over Gen4 at this scale? Marginal for most workflows. But if you NEED 10GB/s across 6TB+, you know who you are. Backup strategy critical at this data volume!",
      "📦 Massive Gen5 array: 6TB+ on Gen5 NVMe is absurd (complimentary)! You're either: filthy rich and don't care, running a professional studio, or doing cutting-edge research. Gen5's speed advantage over Gen4 matters here ONLY if moving multi-TB datasets regularly. Otherwise, diminishing returns! Cost: £1,200-2,000+. If you understand why you need this, no explanation needed. If not, you've overspent massively. Impressive though!",
      "📦 Huge Gen5 capacity: Truly elite tier – ensure enterprise-grade backup and redundancy.",
      "📦 Gen5 extreme scale: The pinnacle of consumer NVMe setups; niche but astonishing.",
      "📦 6TB+ Gen5 scope: Utterly premium—design backups before you fill it.",
      "📦 Enormous Gen5 tier: Awe-inspiring; practical only for specific professional pipelines.",
    ],
  };

  // Type safety fallback
  return (
    typeExplanations[key as keyof typeof typeExplanations] || [
      "💾 Interesting storage choice! Check the specs carefully to ensure it matches your performance needs and capacity requirements.",
    ]
  );
}

/**
 * Get a brief type comparison for a specific storage config
 */
export function getStorageTypeComparison(storage: StorageConfig): string {
  const type = getStorageType(
    storage.interface,
    storage.name,
    storage.driveType
  );

  const comparisons: Record<string, string> = {
    hdd: "🐌 HDD: 100-150 MB/s. Pros: Cheap bulk storage. Cons: 40-70x slower than NVMe, mechanical (noise/heat/failure risk). Use for: Archive/backup drives ONLY.",
    "sata-ssd":
      "💾 SATA SSD: 550 MB/s. Pros: Reliable, affordable. Cons: Legacy interface, 6-13x slower than NVMe. Use for: Budget builds or secondary storage.",
    "gen3-nvme":
      "⚡ Gen3 NVMe: 3,500 MB/s. Pros: Fast, affordable, mainstream standard. Cons: Half Gen4 speed (rarely matters). Use for: Gaming, productivity, value builds.",
    "gen4-nvme":
      "⚡ Gen4 NVMe: 7,000 MB/s. Pros: Current-gen standard, DirectStorage ready, fast for everything. Cons: Costs 30% more than Gen3. Use for: Gaming + creation, enthusiast builds.",
    "gen5-nvme":
      "🚀 Gen5 NVMe: 10,000+ MB/s. Pros: Absolute fastest available. Cons: Expensive, overkill for gaming, needs motherboard support. Use for: 8K video editing, bragging rights.",
  };

  return (
    comparisons[type] || "💾 Check storage specs for speed and interface type!"
  );
}

/**
 * Get quick upgrade recommendation based on current storage
 */
export function getStorageUpgradeRecommendation(
  storage: StorageConfig
): string | null {
  const capacityGB = normalizeCapacityGB(storage.capacity, storage.name);
  const type = getStorageType(
    storage.interface,
    storage.name,
    storage.driveType
  );
  const tier = getCapacityTier(capacityGB);

  // HDDs: always recommend upgrading to NVMe
  if (type === "hdd") {
    return "⬆️ Upgrade Path: Swap to 1TB Gen3 NVMe (£50-60). You'll get 40x faster speeds + more capacity. HDDs are obsolete for primary drives in 2025!";
  }

  // SATA SSDs: recommend NVMe if capacity is adequate
  if (type === "sata-ssd" && (tier === "adequate" || tier === "good")) {
    return "⬆️ Upgrade Path: Add a 1TB Gen4 NVMe (£70-80) as your primary drive. Move SATA to secondary storage duty. 12x speed boost!";
  }

  // Small capacities: recommend more space
  if (tier === "tiny" || tier === "small") {
    return "⬆️ Upgrade Path: Increase capacity to 1-2TB. Modern games are 100-150GB each – you need breathing room!";
  }

  // Gen3/Gen4 with good capacity: no upgrade needed
  if (
    (type === "gen3-nvme" || type === "gen4-nvme") &&
    (tier === "good" || tier === "great" || tier === "massive")
  ) {
    return null; // No upgrade needed
  }

  // Gen5: probably overspent, no upgrade recommendation
  if (type === "gen5-nvme") {
    return null;
  }

  return null;
}
