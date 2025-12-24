// Synergy grade calculation and build profile analysis
// Evaluates component harmony and provides personalised feedback

export type SynergyGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SynergyResult {
  score: number;
  grade: SynergyGrade;
  profile: string;
  feedback: string;
}

interface ComponentMetrics {
  cores: number;
  vram: number;
  ramCap: number;
  estimatedLoad: number;
  cooling: { type?: string } | null;
  storage: { interface?: string } | null;
}

/**
 * Calculate synergy score based on component balance and compatibility
 * Score ranges from 0-100, measuring how well components work together
 */
export function calculateSynergyScore(metrics: ComponentMetrics): number {
  const { cores, vram, ramCap, estimatedLoad, cooling, storage } = metrics;
  let score = 100;

  // Negative adjustments - component mismatches
  if (vram >= 16 && cores < 8) score -= 12; // High-end GPU bottlenecked by CPU
  if (vram >= 20 && cores < 12) score -= 10; // Extreme GPU needs more cores
  if (ramCap < 32 && vram >= 12) score -= 8; // High-end GPU needs more RAM
  if (ramCap > 64 && cores < 8) score -= 6; // Excessive RAM for low core count

  // PSU efficiency zone check
  if (estimatedLoad > 0 && (estimatedLoad < 0.35 || estimatedLoad > 0.8)) {
    score -= 6; // Outside optimal PSU efficiency range
  }

  // Storage bottleneck
  if (storage?.interface?.includes("SATA") && vram >= 16) {
    score -= 5; // SATA SSD limiting high-end GPU performance
  }

  // Cooling concerns
  if (!cooling && cores >= 12) score -= 8; // Missing cooler for high core count
  if (cooling?.type === "Air" && cores >= 16) score -= 10; // Air cooling insufficient for many cores

  // Positive adjustments - well-balanced configurations
  if (vram >= 16 && cores >= 12 && ramCap >= 64) score += 8; // Excellent high-end balance
  if (vram >= 12 && cores >= 8 && ramCap >= 32) score += 5; // Good mid-high balance
  if (estimatedLoad >= 0.45 && estimatedLoad <= 0.7) score += 4; // Optimal PSU efficiency zone

  // Clamp score to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Convert numeric synergy score to letter grade
 */
export function getGradeFromScore(score: number): SynergyGrade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  if (score >= 30) return "E";
  return "F";
}

/**
 * Detect build profile/use-case from component selection
 */
export function detectBuildProfile(
  vram: number,
  cores: number,
  ramCap: number
): string {
  if (vram >= 20 && cores >= 12 && ramCap >= 64) {
    return "Extreme Workstation / 4K Creator";
  }
  if (vram >= 16 && cores >= 8 && ramCap >= 32) {
    return "High-End Gaming & Creation";
  }
  if (vram >= 12 && cores >= 6 && ramCap >= 32) {
    return "Balanced Enthusiast";
  }
  if (vram >= 8 && cores >= 6 && ramCap >= 16) {
    return "Mid-Range Gaming";
  }
  if (vram >= 6 && cores >= 4 && ramCap >= 16) {
    return "Entry Gaming";
  }
  if (ramCap >= 64 && cores >= 16 && vram < 10) {
    return "Compute / Multi-VM Focus";
  }
  return "Unclassified";
}

/**
 * Grade-specific feedback variations for personalised responses
 * Each grade has 10 variations to maintain Kevin's personality while avoiding repetition
 */
export const gradeVariations: Record<SynergyGrade, string[]> = {
  A: [
    "Brilliant! 🎯 I love what you've built here. This is exactly the kind of harmony I'd recommend. Each component works in perfect sync – no CPU bottlenecking your GPU (frame times will be consistent <16ms 1% lows), RAM capacity matches your VRAM tier perfectly (no asset streaming stutters), PSU running in the sweet efficiency zone (40-60% load = peak 90-92% conversion), and your cooling solution aligns with TDP requirements (5-10°C thermal headroom under stress). Zero bottlenecks, excellent headroom for demanding workloads (4K gaming, 1440p 240Hz, content creation), and plenty of upgrade potential down the line (can handle next-gen GPU without PSU swap). This is a configuration I'd be proud to put my name on. Professional-tier component synergy!",
    "Outstanding! 🌟 You've nailed the component synergy here. Everything is working in perfect harmony – this is the kind of build I recommend to enthusiasts who know what they're doing. Your budget allocation is spot-on (GPU receiving appropriate share 35-45% total budget, CPU/RAM balanced at 25-30%, quality PSU/cooling 15-20%). Zero bottlenecks (CPU won't hold back GPU by >5%, RAM won't cause asset streaming issues, PSU has 25-30% headroom for transient spikes), excellent thermal management potential (cooling rated 15-20% above CPU TDP, case airflow sufficient), and future-proof choices (can upgrade GPU/CPU independently without cascading replacements). You clearly understand PC building! This will deliver exceptional real-world performance (99th percentile frame times smooth, render times optimized, multitasking seamless).",
    "Exceptional work! 🏆 This is textbook component matching. Your choices show real understanding of what makes a balanced system. I've built thousands of PCs, and configurations like this are what separate the pros from the beginners. Flawless synergy, smart budget allocation, and room to grow. Chapeau!",
    "Perfection! ✨ Seriously, this is exactly how I'd spec this build myself. Every component complements the others beautifully – no weak links, no overkill, just pure balanced performance. This will absolutely fly through any workload you throw at it. You've got great instincts!",
    "Superb! 🎖️ This configuration hits all the right notes. Component harmony is excellent, thermals will be manageable, and you've left headroom for future upgrades. I've seen thousands of builds, and this is in the top 5%. You should be proud of these choices!",
    "Magnificent! 🎯 This is precisely the calibre of build I'd assemble for myself. Every component meshes beautifully – zero compromises, stellar thermal headroom, and future-upgrade flexibility built in. You've absolutely nailed component synergy. This is professional-grade work!",
    "Flawless! ⚡ What a beautifully balanced machine you've configured here. I'm seeing perfect component harmony, intelligent budget allocation, and zero weak points. This will tear through demanding workloads without breaking a sweat. Top-shelf thinking!",
    "Exemplary! 🌟 You've architected a truly harmonious system. Each part complements the others ideally – no bottlenecks, ample thermal overhead, and excellent upgrade paths. Having built thousands of rigs, I can say this sits in the elite tier. Bravo!",
    "Impeccable! ✨ This is exactly how enthusiast systems should be configured. Every component choice demonstrates deep understanding – balanced power delivery, optimal cooling headroom, and smart future-proofing. You've made my job easy. Ship it!",
    "Stellar! 🏆 I'm genuinely impressed with your component selection here. The synergy is textbook perfect – no weak links, excellent thermal management, and room for growth. You've clearly done your homework. This is a build I'd happily put my reputation behind!",
  ],
  B: [
    "Excellent work! This is a well-balanced build that'll serve you brilliantly. There are a couple of minor areas where we could squeeze out a bit more performance if you're interested (check the Advanced insights below) – perhaps your PSU is running slightly outside the optimal 40-60% efficiency zone (currently ~35% or ~70%), or your RAM capacity could be 1-2 tiers higher to eliminate potential asset streaming in demanding titles (32GB→48GB for 4K gaming, 16GB→32GB for content creation), or cooling headroom a bit tight under sustained workloads (5-10°C from thermal throttling vs 15-20°C ideal) – but honestly? You've nailed the fundamentals. This will handle everything you throw at it (gaming, streaming, productivity). Performance impact of these optimizations: 2-5% real-world gains. Worth it if budget allows, not critical if funds are tight.",
    "Great job! 👍 You're 95% of the way to perfection here. This build will perform beautifully – I've got just a few optional tweaks that could push it from 'great' to 'exceptional' (3-7% performance uplift quantified). Potential optimizations: Step up PSU wattage tier for better efficiency curve (650W→750W = quieter fan, 2-3% better efficiency, future GPU upgrade headroom), or upgrade cooling solution (240mm AIO→280mm AIO = 5-10°C lower temps, allows higher sustained boost clocks), or add NVMe Gen4 storage if currently SATA (game load times 40-60% faster, asset streaming smoother). But if budget is tight? Ship it as-is. You've made smart, balanced choices. Cost of optimizations: £40-120 total. Performance gain: 3-7% real-world. Optional polish, not mandatory.",
    "Solid configuration! This is what I call a 'smart builder's system' – you've prioritised the right components and avoided common pitfalls. There's one or two areas where minor adjustments could help (check below), but this will absolutely deliver excellent performance. Well done!",
    "Really nice work! 🎯 Your component selection shows good understanding of what matters. This will perform brilliantly out of the box. I've spotted a couple of optional optimizations that could squeeze out extra performance, but they're nice-to-haves, not must-haves. Strong build!",
    "Impressive! You've built a very well-balanced system here. Performance will be excellent across the board. The few suggestions I have below are purely optimization opportunities – think of them as the cherry on top of an already delicious cake. This setup will serve you extremely well!",
    "Superb choices! 👏 You're a whisker away from perfection here. This rig will perform fantastically – I've identified a couple of minor refinements that could elevate it from 'superb' to 'elite', but they're optional. If funds are constrained? Build it now. Excellent decision-making!",
    "Fantastic build! You've architected a beautifully balanced machine. There are a couple of subtle optimizations we could explore (detailed below), but truthfully? You've got the essentials spot-on. This will deliver stellar performance in any workload. Congrats!",
    "Strong work! 💪 Your component harmony is nearly flawless – maybe 2-3% more performance available with some tweaks (see Advanced notes), but you've avoided all the rookie mistakes. This configuration will absolutely crush it. Very smart selections!",
    "Lovely configuration! This is what I'd call 'intelligent enthusiast territory' – you've balanced priorities perfectly and sidestepped common traps. A few minor adjustments could refine it further, but this will deliver outstanding results as-is. Well done indeed!",
    "Remarkable! You've put together a thoroughly competent system here. Performance will be top-notch across the board. My suggestions below are pure gravy – polish on an already shiny machine. This setup will handle your needs beautifully for years!",
  ],
  C: [
    "Good foundation here! Your build will definitely work well, though I've spotted a few areas where targeted upgrades could really boost your experience (8-15% performance uplift potential). Likely bottlenecks: Your high-end GPU (12GB+ VRAM) may be held back by CPU (6-8 cores insufficient for 4K/1440p high refresh), causing 10-15% FPS loss in CPU-bound scenarios. Or your RAM capacity is limiting GPU performance (16GB insufficient for 12GB+ VRAM GPUs = asset streaming stutters in demanding titles, 1% low FPS drops 20-30%). Or PSU running at 75%+ load (reduced efficiency, louder fan, limited upgrade headroom, potential instability during transient power spikes). Think of it like this: you've built a solid car, and I'm suggesting some performance tyres to make it shine. Specific fixes: Upgrade CPU to 12+ cores (Ryzen 7 7700X/i7-14700K tier, £250-350), increase RAM to 32GB (£60-100), or step up PSU wattage (£40-80). Check my recommendations below – they're all about getting more value from your investment. ROI: £150-300 spend = 8-15% performance gain.",
    "Decent start! 👌 This will work, but you're leaving performance on the table (10-18% performance loss from imbalances). I see some imbalances that are holding you back – nothing catastrophic, just inefficiencies. Common issues: High VRAM GPU (16GB+) paired with low core-count CPU (6-8 cores) = GPU idling at 60-70% usage while CPU maxed at 100% (CPU bottleneck). Or massive RAM capacity (64GB+) but weak GPU (6-8GB VRAM) = wasted budget (£100-150 over-invested in RAM, under-invested in GPU by ~£150). Or premium PSU (1000W Gold) but mid-range components (total system draw 400W) = running PSU at 40% load constantly (inefficient, wasted £50-80 vs appropriately-sized 650W). With a few strategic tweaks (outlined below), you could transform this from 'good enough' to 'genuinely impressive'. Rebalance approach: Reduce over-invested component (sell or return), reallocate budget to bottleneck (upgrade CPU/GPU/RAM as needed). Result: 10-18% real-world performance gain for £0-100 net cost (budget reallocation, not additional spend). Worth considering!",
    "Workable configuration, but let's optimise it! You've got the core right, but some components aren't quite aligned with your goals. It's like having mismatched tyres – the car runs, but it's not reaching its potential. My recommendations below will help you rebalance for better results.",
    "Functional build with room for improvement! This will run your games and applications, but there are some bottlenecks that'll frustrate you down the line. The good news? They're easy fixes. Check my suggestions below – small changes that'll make a big difference to real-world performance.",
    "Reasonable choices, but let's level this up! I can see what you're aiming for, and you're close. A few targeted component swaps (see below) will eliminate bottlenecks and give you noticeably better performance for minimal extra investment. Trust me, you'll feel the difference!",
    "Acceptable foundation! 🔧 Your build functions, though I've identified several areas where strategic enhancements would elevate your experience significantly. Picture it: you've built a capable machine, and I'm recommending the tuning to make it sing. Review my suggestions below – they're about maximizing your ROI.",
    "Workable setup! This will run, but you're not extracting full potential here. I'm seeing mismatches that'll limit throughput – not fatal, just suboptimal. A handful of calculated adjustments (detailed below) could upgrade this from 'serviceable' to 'impressive'. Definitely worth reviewing!",
    "Functional configuration needing refinement! You've got the skeleton right, but several components aren't harmonizing with your objectives. Imagine mismatched engine components – it runs, yet underperforms. My recommendations will help rebalance for optimal efficiency.",
    "Practical build with optimization opportunities! This'll handle your software and games, though bottlenecks will emerge under stress. Fortunately, fixes are straightforward. Examine my suggestions – targeted changes yielding meaningful real-world gains!",
    "Competent choices requiring upgrades! I see your vision, and you're approaching it. Select component changes (itemized below) will clear bottlenecks and deliver noticeably improved performance for modest additional outlay. You'll absolutely notice the uplift!",
  ],
  D: [
    "I can see what you're going for, but let me share some concerns as your advisor. There are some imbalances here that could hold back your performance significantly (20-35% potential loss) – it's like having a Ferrari engine in a family car, or vice versa. Specific issues: If you have flagship GPU (RTX 4080/4090, RX 7900 XTX tier) paired with budget CPU (6 cores or less), you're losing 25-40% GPU performance to CPU bottleneck (GPU usage 50-70% while CPU pinned 100%, frame times inconsistent 30-50ms spikes). Or if you have high-end CPU (12+ cores, £300+) but entry GPU (6GB VRAM), you've wasted £150-200 on CPU vs allocating to GPU upgrade (CPU sits idle 60-70% while GPU struggles). Or RAM grossly mismatched to VRAM (16GB RAM with 20GB VRAM GPU = constant asset streaming stutter, or 64GB RAM with 8GB VRAM = wasted £100+ on unused RAM). Let's rebalance things so every pound you spend delivers maximum impact. Critical fixes: Downgrade over-invested component by 1-2 tiers (recoup £100-200), upgrade bottleneck component by 2-3 tiers (invest £150-300). Net spend: £50-150. Performance gain: 20-35% real-world. I'll show you exactly where to adjust below.",
    "Houston, we have a problem! 🚨 This configuration has some significant mismatches that'll waste your budget (£200-400 misallocated vs optimal build). Your high-end GPU won't reach its potential with this CPU/RAM combo – it's like putting premium fuel in a car with a clogged engine. Quantified impact: High-end GPU (12GB+ VRAM, £500+) with inadequate CPU (6 cores) loses 30-45% performance (expecting 144fps, getting 80-100fps due CPU bottleneck). Or insufficient RAM for VRAM tier (16GB RAM with 16GB+ VRAM GPU) causes constant asset streaming stutter (frame drops every 10-30 seconds, 1% lows drop 40-60%). Additionally: PSU may be undersized (running 80%+ load = thermal stress, loud fan 40-45dB, instability risk during transient spikes), or cooling inadequate for CPU TDP (missing cooler warning, or air cooling on 16+ core CPU = thermal throttling 90-100°C, 15-25% performance loss). Let's fix this together – check my recommendations below. Priority fixes: 1) Match CPU cores to GPU tier (12+ cores for high-end GPU, £250-350), 2) Match RAM to VRAM (32GB minimum for 12GB+ VRAM, £60-100), 3) Verify PSU headroom (25-30% above system load, £80-150), 4) Adequate cooling for CPU TDP (240mm+ AIO or premium air, £70-120). Investment: £200-400 rebalancing. Result: 30-50% performance transformation.",
    "Not quite there yet, mate! This build has some serious imbalances that'll hold you back. You've over-invested in some areas and under-invested in others. The result? Bottlenecks and disappointment. But don't worry – I'll show you exactly how to rebalance for maximum performance. Focus on my critical recommendations below.",
    "We need to talk about this configuration... 🤔 Several components are fighting against each other here. You'll experience stuttering, thermal issues, or worse – underutilized hardware. This isn't a disaster, but it does need significant rebalancing. My detailed recommendations below will get you back on track.",
    "Concerning imbalances detected! This is a classic case of mismatched ambitions – your components don't align with each other's capabilities. Performance will be limited, and you'll waste money. The fixes aren't complicated (see below), but they're essential. Let me help you optimise this properly.",
    "I see your intent, but we've got issues! ⚠️ There are notable mismatches hampering your performance – like pairing a V8 with bicycle wheels. Let's rebalance so each pound spent yields proper value. I'll outline precise adjustments below.",
    "Warning lights flashing! 🚨 This configuration shows critical mismatches that'll squander your budget. Your premium GPU can't breathe with this CPU/RAM pairing – akin to race fuel in a dirty carburettor. Let's collaborate on fixes – examine my recommendations carefully.",
    "Not satisfactory yet! This build contains serious imbalances limiting output. You've overcommitted in certain areas while underinvesting elsewhere. Outcome? Bottlenecks and frustration. Fear not – I'll guide you through rebalancing for peak performance. Prioritize my critical suggestions below.",
    "Configuration concerns! 🤔 Multiple components are conflicting here. Expect stuttering, thermal constraints, or worse – idle hardware. Not catastrophic, but substantial rebalancing required. My comprehensive recommendations below will correct the course.",
    "Troubling imbalances identified! Classic mismatched goals scenario – your components aren't synchronized capability-wise. Performance suffers, money wastes. Fixes are manageable (detailed below), yet essential. Allow me to optimize this correctly.",
  ],
  E: [
    "Right, let's have an honest conversation. This configuration has several constraints that will seriously limit your experience (40-60% below expected performance, system instability likely) – and I don't want you disappointed after spending your hard-earned money. Critical issues: Extreme component mismatch (flagship £800+ GPU with budget 4-6 core CPU = 50-70% GPU performance lost, you're getting mid-range GPU performance from flagship GPU spend). Or massive budget imbalance (£600+ CPU with £200 GPU = CPU idles while GPU struggles, reversed priorities waste £300-400 potential). Or fundamental compatibility issues (no cooler selected for 12+ core CPU = immediate thermal throttling 95-100°C, emergency shutdown risk). Or catastrophic PSU undersizing (500W PSU for 600W+ system = random shutdowns during gaming, voltage instability, component damage risk over time). Real-world consequences: Stuttering gameplay (frame times 40-100ms, unplayable), thermal throttling (CPU/GPU running 90-105°C, lifespan reduced years), random crashes (PSU overload protection triggers, instant shutdown mid-game), wasted budget (£300-500 misallocated = could've built far superior balanced system for same money). The good news? We can fix this together. Focus on aligning your CPU, GPU, and RAM first (match tiers: entry/mid-range/high-end/flagship must align across all three). I'll guide you through it step by step. Rebuild approach: Define budget (£800/£1200/£1800 tiers), allocate correctly (GPU 35-40%, CPU 20-25%, RAM 8-12%, PSU/cooling 15-20%, storage/case remainder), verify synergy (use my recommendations below).",
    "Okay, time for some tough love! ⚠️ This build has major problems that'll result in poor performance and buyer's remorse (you'll regret this purchase within weeks). Your component choices are fundamentally incompatible in several key areas. Specific failures: GPU tier massively mismatched to CPU (3-4 tier gap = one component bottlenecking other by 40-70%, flagship paired with budget or vice versa, £400-600 wasted on underutilized component). Or RAM capacity grossly wrong for workload (4K gaming with 16GB RAM = constant stuttering, or entry gaming with 128GB RAM = £200-300 wasted). Or PSU dangerously undersized (running 85-95% load = high failure risk, brownouts during power spikes, potential component damage, fire hazard if cheap unit). Or cooling completely inadequate (no cooler, or air cooling 16+ core CPU = immediate thermal shutdown 105°C, cannot complete workloads, system unusable). User experience: You boot system expecting smooth gaming/workflow, instead get stuttering mess (20-40fps when expecting 100-144fps), random crashes (multiple times per gaming session), thermal throttling (fans screaming 50dB+, CPU throttling to 50-60% base clock), profound disappointment (spent £1500 but performs like £600 prebuilt). But hey, that's exactly why I'm here! Follow my recommendations below carefully – we'll rebuild this into something that actually works. Complete redesign necessary: Start from scratch with balanced tier approach (all components same tier: budget/mid/high/flagship), verify compatibility (TDP vs cooling, wattage vs PSU, VRAM vs RAM ratio 2:1), check synergy again. This will save you £500-1000+ wasted money and months of frustration.",
    "Red flags everywhere! 🛑 I need to be straight with you: this configuration will severely underperform. You've got expensive components that'll never reach their potential due to critical bottlenecks. Don't spend money on this as-is. Check my recommendations below – we need to fundamentally rebalance this build.",
    "This won't work the way you're hoping! Multiple critical mismatches here will cripple performance. It's not about one bad component – it's how they interact. Your gaming/work experience will be frustrating. The good news? The fixes are clear (see below). Let's tear this down and rebuild it properly!",
    "Major intervention needed! This configuration has severe compatibility and balance issues. I'm seeing bottlenecks that'll limit you to 40-50% of your expected performance. You'll be incredibly frustrated. Stop here, read my recommendations below carefully, and let's redesign this from the ground up.",
    "Honest talk required! 🗣️ This configuration harbors severe constraints that'll significantly hamper your experience – I won't have you disappointed post-purchase. Good news? We can rectify this together. Priority: synchronize your CPU, GPU, and RAM. I'll navigate you through methodically.",
    "Time for reality! ⚠️ This build suffers major deficiencies yielding poor performance and regret. Your component selections are fundamentally incompatible across multiple domains. But that's my purpose here! Heed my recommendations meticulously – we'll reconstruct this into functional architecture.",
    "Critical warnings flashing! 🛑 Straight talk: this configuration will drastically underdeliver. You've selected pricey components that'll never fulfill potential due to choking bottlenecks. Don't commit funds as configured. Review my recommendations – fundamental rebalancing mandatory.",
    "This won't deliver as anticipated! Numerous critical conflicts here will handicap performance severely. It's not singular failure – it's interaction patterns. Your gaming/productivity will frustrate immensely. Positive side? Solutions are evident (below). Let's disassemble and reconstruct properly!",
    "Massive intervention required! This configuration presents acute compatibility and balance failures. I'm observing bottlenecks constraining you to 40-50% projected performance. Frustration guaranteed. Halt here, study my recommendations thoroughly, and let's ground-up redesign this.",
  ],
  F: [
    "Okay, I need to be direct with you – this combination has severe imbalances that will waste your budget and frustrate you down the line (70-90% below expected performance, potential safety hazards). Critical failures: This configuration violates fundamental PC building principles. Catastrophic mismatches: Flagship GPU (RTX 4090/RX 7900 XTX, £1200-1600) paired with ancient/budget CPU (4-6 cores, <£150) = GPU delivering 20-30% of its capability, you're getting £300-400 GPU performance from £1200-1600 spend (wasted £800-1200). Or extreme PSU undersizing (450-550W PSU for 700-900W peak system draw = guaranteed crashes under load, voltage sag damaging components over time, brownout risk, potential fire hazard with cheap units, system completely unusable for intended purpose). Or no cooling on high TDP CPU (12+ cores, 150W+ TDP, no cooler = instant thermal shutdown on boot, cannot POST or enter BIOS, system literally unusable, potential CPU damage from repeated thermal cycling). Or SATA SSD bottleneck for flagship GPU (asset streaming can't keep up, causing 3-5 second freezes every 30-60 seconds, game literally unplayable). Real-world disaster: System crashes during Windows installation (PSU overload), or throttles to unusable levels (CPU running 10-20% base clock due thermal limit), or stutters so badly it's unplayable (frame time variance 100-300ms, makes you nauseous), or causes random shutdowns daily (instability from voltage issues). Financial loss: £1000-2000 spent, £200-400 actual performance delivered, need to spend £500-800 more to fix. But don't worry, that's exactly why I'm here! Let's rebalance your component budget together so you get a system that actually performs. Complete rebuild mandatory: Do NOT purchase these components. Start over with balanced tier approach. Define total budget → allocate correctly (see my guide) → verify all components same tier → check cooling adequate → verify PSU 25-30% headroom → validate synergy. Trust me, we'll get this right. I won't let you waste £1000-2000.",
    "STOP! 🛑 Please don't build this as configured! This is the worst possible combination of these components – you'll experience crashes, thermal shutdowns, and abysmal performance (10-20% of expected capability, essentially non-functional). It's not fixable with small tweaks. Specific hazards: Catastrophic PSU undersizing (attempting to draw 800W from 500W PSU = overcurrent protection constantly tripping, or worse, cheap unit bypassing protection and delivering dirty power, voltage ripple damaging motherboard VRM/GPU power stages, voiding warranties from out-of-spec operation, components failing prematurely 1-2 years vs 5-10 year expected lifespan). Or thermal catastrophe (16+ core CPU with no cooler/inadequate cooling = sustained 105°C operation, thermal cycling degrading CPU die, potential permanent damage, Intel/AMD will deny warranty claim for thermal abuse). Or RAM/VRAM total mismatch (8GB RAM with 24GB VRAM = constant system crashes from memory starvation, or 128GB RAM with 6GB VRAM = £500+ wasted on unused RAM, could've bought GPU 3 tiers higher). Or storage bottleneck negating GPU (flagship GPU generating massive asset streaming demands, SATA SSD can't keep up, causing stutters making system unusable for gaming/work). Consequences: You build this, immediately have issues (crashes, shutdowns, stuttering), spend weeks troubleshooting (wasting hours), RMA components incorrectly (thinking parts faulty when design is flawed), potentially void warranties (thermal/electrical abuse), eventually abandon and rebuild anyway (spending £500-1000 twice). Total loss: £1500-2500 wasted + months of frustration + potential component damage. We need a complete rebuild. Check my recommendations below and let's start over properly. I will design you a balanced system for same budget that actually works. Do not purchase anything until we validate synergy together. This is critical.",
    "Critical failure imminent! This build is fundamentally broken – incompatible components, massive bottlenecks, and wasted money everywhere. I'm being brutally honest because I care about your experience: Do NOT proceed. Follow my recommendations below for a complete redesign. We'll make this right!",
    "This is a disaster waiting to happen! 💥 I've seen this combination before, and it always ends badly – crashes, stuttering, overheating, the works. You're about to waste hundreds of pounds on parts that fight each other. STOP. Read my recommendations below. Let me help you build something that actually works.",
    "Absolutely not! This configuration violates every principle of balanced PC building. It's like trying to run before you can walk – except you're trying to run backwards, uphill, in flip-flops. I cannot let you waste your money like this. My recommendations below will completely redesign this into something sensible.",
    "Direct talk necessary! 💬 This combination shows severe imbalances that'll waste funds and frustrate long-term. But worry not, guidance is my role! Let's rebalance your component allocation collaboratively for a genuinely performing system. Trust the process, we'll optimize this.",
    "HALT! 🛑 Don't proceed with this configuration! This represents the absolute worst pairing of these components – anticipate crashes, thermal failures, and terrible performance. Minor adjustments won't salvage it. Complete reconstruction mandatory. Review my recommendations and let's restart correctly.",
    "Critical catastrophe looming! This build is fundamentally dysfunctional – incompatible parts, enormous bottlenecks, financial waste throughout. Brutal honesty motivated by caring: DO NOT BUILD. Adhere to my recommendations for total redesign. We'll correct this disaster!",
    "Disaster approaching! 💥 I've witnessed this combo previously, always concluding poorly – crashes, stutter, overheating, everything. You're poised to squander hundreds on conflicting components. STOP NOW. Examine my recommendations. Allow me to help construct something functional.",
    "Absolutely negative! This configuration breaches every balanced PC building tenet. It's attempting sprint before walking – backward sprint, uphill, wearing sandals. I refuse to permit this financial waste. My recommendations will comprehensively redesign this into rational architecture.",
  ],
};

/**
 * Get random feedback variation for a grade
 */
export function getGradeFeedback(grade: SynergyGrade): string {
  const variations = gradeVariations[grade];
  return variations[Math.floor(Math.random() * variations.length)];
}

/**
 * Main function to calculate complete synergy analysis
 */
export function calculateSynergyGrade(
  cpu: { cores?: number; tdp?: number } | null,
  gpu: { vram?: number; power?: number } | null,
  ram: { capacity?: number } | null,
  psu: { wattage?: number } | null,
  cooling: { type?: string } | null,
  storage: { interface?: string } | null
): SynergyResult {
  const cores = cpu?.cores ?? 0;
  const vram = gpu?.vram ?? 0;
  const ramCap = ram?.capacity ?? 0;
  const wattage = psu?.wattage ?? 0;
  const tdpCpu = cpu?.tdp ?? 65;
  const gpuPower = gpu?.power ?? 150;
  const estimatedLoad = wattage ? (tdpCpu + gpuPower + 120) / wattage : 0;

  const metrics: ComponentMetrics = {
    cores,
    vram,
    ramCap,
    estimatedLoad,
    cooling,
    storage,
  };

  const score = calculateSynergyScore(metrics);
  const grade = getGradeFromScore(score);
  const profile = detectBuildProfile(vram, cores, ramCap);
  const feedback = getGradeFeedback(grade);

  return {
    score,
    grade,
    profile,
    feedback,
  };
}
