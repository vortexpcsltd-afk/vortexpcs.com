// Use-case detection and performance estimation for build configurations
// Analyzes component selection to determine build focus and provides tailored insights

export type UseCase = "gaming" | "creation" | "workstation" | "mixed";

export interface PerformanceEstimate {
  fps?: string;
  workload?: string;
  bottleneck?: string;
}

/**
 * Detect primary use-case from component selection
 * Analyzes GPU VRAM, CPU cores, and RAM capacity to determine build focus
 */
export function detectUseCase(
  vram: number,
  cores: number,
  ramCap: number
): UseCase {
  // High-end creation workstation: Premium GPU, high cores, lots of RAM
  if (vram >= 16 && ramCap >= 64 && cores >= 12) return "creation";

  // Compute/VM workstation: High cores and RAM, modest GPU
  if (ramCap >= 64 && cores >= 16 && vram < 12) return "workstation";

  // Gaming focus: Good GPU, moderate cores, standard RAM
  if (vram >= 12 && ramCap <= 32 && cores >= 6) return "gaming";

  // Hybrid gaming + creation: Good balance across all components
  if (vram >= 10 && ramCap >= 32 && cores >= 8) return "mixed";

  // Default to gaming if unclear
  return "gaming";
}

/**
 * Generate use-case specific introduction message
 */
export function getUseCaseIntro(
  useCase: UseCase,
  vram: number,
  cores: number,
  ramCap: number
): string {
  switch (useCase) {
    case "gaming": {
      const gpuTier =
        vram >= 16
          ? "4K Ultra"
          : vram >= 12
          ? "1440p High-Refresh"
          : vram >= 8
          ? "1440p/1080p"
          : "1080p";
      const fpsTarget =
        vram >= 16
          ? "100-144fps 4K"
          : vram >= 12
          ? "144-240fps 1440p"
          : vram >= 8
          ? "144fps 1440p or 240fps 1080p"
          : "60-144fps 1080p";
      const gpuExamples =
        vram >= 16
          ? "RTX 4080/4090, RX 7900 XTX"
          : vram >= 12
          ? "RTX 4070 Ti/4070 Ti Super, RX 7800 XT"
          : vram >= 8
          ? "RTX 4060 Ti, RX 7600 XT"
          : "RTX 4060, RX 7600";
      const competitive =
        vram >= 12
          ? " with competitive gaming capability (esports titles 240-360fps)"
          : "";
      return `🎮 **Detected Focus: Gaming** — I can see you're building a gaming rig optimised for ${gpuTier} gaming (${fpsTarget} target). Your GPU tier (${gpuExamples}) indicates you're targeting high frame rates and visual fidelity${competitive}. Based on your component selection (${cores} CPU cores, ${ramCap}GB RAM, ${vram}GB VRAM), you're aiming for ${
        vram >= 12
          ? "AAA titles at max settings with smooth performance"
          : "excellent 1080p gaming or entry 1440p"
      }. Let me show you exactly what performance to expect (game-specific FPS estimates, 1% low frame times, CPU/GPU bottleneck analysis), how this compares to alternative configurations (£100-200 cheaper/more expensive builds), and where you can optimise further for your budget (best price/performance upgrades, diminishing returns thresholds). I'll also validate your RAM capacity (${ramCap}GB ${
        ramCap >= 32
          ? "excellent for modern gaming + streaming/recording"
          : ramCap >= 16
          ? "sufficient for gaming, tight for multitasking"
          : "minimum acceptable, upgrade recommended"
      }) and cooling solution matches your CPU's thermal requirements.`;
    }

    case "creation": {
      const workloadType =
        ramCap >= 64 && cores >= 12
          ? "professional 3D rendering and 4K video editing"
          : cores >= 8
          ? "1080p/4K video editing and moderate 3D work"
          : "content creation and streaming";
      const softwareExamples =
        cores >= 12
          ? "Blender, Cinema 4D, Premiere Pro 4K/8K, DaVinci Resolve, After Effects"
          : cores >= 8
          ? "Premiere Pro 1080p/4K, Photoshop, Lightroom, OBS streaming"
          : "OBS streaming, basic editing";
      const renderEstimates =
        cores >= 16 && vram >= 16
          ? "Blender BMW benchmark ~2min, Premiere 4K H.265 export ~1.5-2x realtime"
          : cores >= 12 && vram >= 12
          ? "Blender BMW ~3-4min, Premiere 4K H.264 ~1-1.5x realtime"
          : cores >= 8
          ? "Premiere 1080p 60fps ~2-3x realtime"
          : "Entry-level performance";
      const gpuAcceleration =
        vram >= 12
          ? " Your GPU (${vram}GB VRAM) provides excellent CUDA/OpenCL acceleration for effects, color grading, and GPU rendering (OptiX/HIP)."
          : vram >= 8
          ? " GPU acceleration available for basic effects and encoding."
          : " Limited GPU acceleration - CPU will handle most tasks.";
      return `🎨 **Detected Focus: Content Creation** — This build is configured for ${workloadType}. Your high core count (${cores} cores) and ample RAM (${ramCap}GB) indicate you're serious about creative workflows. Software compatibility: ${softwareExamples}.${gpuAcceleration} I'll show you real-world render times (${renderEstimates}), export speeds (CPU vs GPU encoding H.264/H.265/AV1), and timeline performance you can expect (4K stream count, effects stack depth, playback smoothness), plus which components give you the best ROI for creative work (CPU cores vs GPU VRAM vs RAM capacity trade-offs). I'll also analyze your storage configuration (NVMe RAID recommended for 4K/8K footage scratch disks, sustained write speeds 3000+ MB/s) and RAM speed impact on rendering (DDR5 5600+ ideal for Ryzen 7000/9000, DDR5 6000+ for Intel 13th/14th gen).`;
    }

    case "workstation": {
      const workstationType =
        cores >= 16
          ? "enterprise-grade compute (VMs, compilation, data processing)"
          : "professional productivity and development";
      const vmCapacity =
        cores >= 24
          ? "6-8 concurrent VMs"
          : cores >= 16
          ? "4-6 concurrent VMs"
          : cores >= 12
          ? "3-4 VMs"
          : "2-3 VMs";
      const compileSpeed =
        cores >= 16
          ? "Large codebase (Linux kernel) ~10-15min, Chrome ~45-60min"
          : cores >= 12
          ? "Medium projects ~5-10min, large projects 20-30min"
          : "Entry development, longer compile times";
      const platformComparison =
        cores >= 16
          ? " Your core count (${cores}) positions this in Threadripper/Xeon W territory for multi-threaded workflows."
          : " This competes with mainstream HEDT platforms.";
      const ramUtilization =
        ramCap >= 128
          ? "Your 128GB+ RAM enables massive datasets in-memory, Docker/K8s development, or RAM disk acceleration."
          : ramCap >= 64
          ? "64GB RAM sufficient for multiple VMs, data science work (pandas/numpy), or moderate containerization."
          : ramCap >= 32
          ? "32GB acceptable for development, limited for VMs/containers."
          : "RAM may be limiting factor.";
      return `💼 **Detected Focus: Workstation** — Your component selection indicates ${workstationType}. This configuration prioritises CPU power (${cores} cores) and memory capacity (${ramCap}GB) over graphics performance (${vram}GB VRAM). Workload capacity: ${vmCapacity} (2-4GB RAM each), ${compileSpeed}.${platformComparison} ${ramUtilization} I'll analyse multitasking capability (thread scheduler efficiency, memory bandwidth saturation points), compile times (GCC/Clang/MSVC, incremental vs clean builds), VM capacity (ESXi/Hyper-V/Proxmox resource allocation, nested virtualization overhead), and show you how this compares to competing Intel Xeon/AMD EPYC/Threadripper workstation platforms in terms of efficiency (performance per watt, idle power draw 50-150W), TCO (5-year electricity costs £200-800 depending on utilization), and platform longevity (DDR5/PCIe 5.0 support, upgrade paths to 9950X/14900KS). I'll also validate ECC RAM necessity for your workloads (data integrity vs cost premium) and storage configuration (NVMe RAID0 for compile scratch space, TLC vs SLC endurance for databases).`;
    }

    case "mixed": {
      const gamingCapability =
        vram >= 12
          ? "1440p high-refresh (120-165Hz) or 4K 60fps"
          : vram >= 8
          ? "1440p 60-144fps or 1080p high-refresh"
          : "1080p 60-144fps";
      const creationCapability =
        cores >= 12 && ramCap >= 32
          ? "4K video editing (1-2 streams), 3D rendering (Blender/C4D), live streaming 1080p60"
          : cores >= 8 && ramCap >= 32
          ? "1080p/4K editing (1 stream), moderate rendering, streaming"
          : cores >= 6
          ? "Basic editing, encoding, streaming 720p/1080p30"
          : "Limited creation performance";
      const workflowSplit =
        vram >= 12 && cores >= 10
          ? "60/40 gaming/creation"
          : vram >= 10 && cores >= 8
          ? "70/30 gaming/creation"
          : "80/20 gaming/creation (gaming-primary)";
      const compromiseAnalysis =
        vram >= 12 && cores >= 10
          ? "Minimal compromises - excellent balance achieved"
          : vram < 10 && cores >= 12
          ? "Compromise: Prioritized creation over gaming (could upgrade GPU for better gaming performance)"
          : vram >= 12 && cores < 8
          ? "Compromise: Prioritized gaming over creation (more CPU cores would help rendering/encoding)"
          : "Budget constraints evident - both sides could benefit from upgrades";
      return `⚡ **Detected Focus: Hybrid Gaming + Creation** — You're building a versatile system that needs to excel at both gaming and creative work. This is the hardest configuration to get right – you're balancing GPU power for gaming (${vram}GB VRAM = ${gamingCapability}) with CPU cores (${cores} cores) and RAM (${ramCap}GB) for productivity (${creationCapability}). Your current split: ${workflowSplit}. ${compromiseAnalysis}. I'll show you where this build excels in both domains (gaming FPS at target resolution, editing/rendering throughput), which compromises you've made if any (quantified performance delta vs specialized builds), and whether your budget allocation between gaming and creation components is optimal for your workflow split (should you reallocate £100-200 from GPU to CPU or vice versa?). Key insights: Gaming performance (FPS estimates, GPU utilization %), creation performance (render times, export speeds CPU vs GPU), streaming capability (OBS NVENC/AMF vs x264 CPU encoding quality/performance trade-offs), and multitasking headroom (gaming + Discord + browser + OBS simultaneously). I'll also analyze whether 32GB RAM is sufficient or if 64GB would significantly improve your creative workflows (depends on editing 1080p vs 4K, 1-2 streams vs 4+ streams, effects complexity).`;
    }
  }
}

/**
 * Estimate performance based on use-case and components
 */
export function getPerformanceEstimate(
  useCase: UseCase,
  gpu: { name?: string } | null,
  cpu: { cores?: number } | null,
  ramCap: number,
  cores: number
): PerformanceEstimate {
  if (useCase === "gaming" && gpu && cpu) {
    const gpuName = (gpu.name || "").toLowerCase();

    if (gpuName.includes("4090")) {
      return {
        fps: "4K Ultra: 100-144 FPS (most titles) | Cyberpunk 2077 RT Overdrive: 60-80fps with DLSS Quality, 100-120fps with DLSS Balanced | Competitive esports: 360-500fps 1080p (CS2, Valorant, Apex)",
        bottleneck:
          cores >= 8
            ? "None – balanced"
            : "CPU may limit esports FPS (consider 8+ cores for 360Hz+)",
      };
    }

    if (gpuName.includes("4080")) {
      return {
        fps: "4K High: 80-120 FPS (RDR2, Horizon, Elden Ring) | 1440p Ultra: 144-200 FPS (most AAA) | 1440p competitive: 240-360fps (esports titles)",
        bottleneck:
          cores >= 8
            ? "None – balanced"
            : "CPU bottleneck possible in competitive gaming (8+ cores recommended)",
      };
    }

    if (gpuName.includes("4070 ti") || gpuName.includes("4070ti")) {
      return {
        fps: "1440p Ultra: 100-144 FPS (AAA titles, RT medium) | 4K High: 60-80 FPS (with DLSS) | 1080p Ultra: 200-300fps (competitive)",
        bottleneck:
          cores >= 6
            ? "Balanced – good pairing"
            : "CPU limiting in fast-paced titles (6+ cores needed)",
      };
    }

    if (gpuName.includes("4070")) {
      return {
        fps: "1440p Ultra: 90-120 FPS (AAA, RT off) | 1440p High RT: 60-90fps (DLSS Quality) | 1080p Ultra: 144-240 FPS (esports 200+fps)",
        bottleneck:
          cores < 6
            ? "CPU may limit in CPU-heavy titles (6+ cores recommended for 1440p high refresh)"
            : "Balanced – well-matched components",
      };
    }

    if (gpuName.includes("4060 ti")) {
      return {
        fps: "1440p High: 70-100 FPS (AAA) | 1080p Ultra: 100-144 FPS | 1080p competitive: 200-300fps (esports optimized)",
        bottleneck:
          "Balanced for 1080p/1440p – GPU appropriate for resolution target",
      };
    }

    if (gpuName.includes("4060")) {
      return {
        fps: "1080p High/Ultra: 80-120 FPS (modern AAA) | 1440p Medium: 60-80 FPS (esports 144+fps) | Ray tracing: 40-60fps 1080p (DLSS required)",
        bottleneck:
          "GPU is the limit for higher resolutions – expected for this tier, excellent 1080p card",
      };
    }

    // AMD GPU detection
    if (gpuName.includes("7900 xtx")) {
      return {
        fps: "4K Ultra: 90-120 FPS (rasterization) | 1440p Ultra: 144-200 FPS | Strong raster, competitive RT (FSR 3 Frame Gen available)",
        bottleneck:
          cores >= 8
            ? "None – flagship pairing"
            : "CPU bottleneck in competitive scenarios (8+ cores for 240Hz+)",
      };
    }

    if (gpuName.includes("7900 xt") || gpuName.includes("7900xt")) {
      return {
        fps: "4K High: 80-100 FPS | 1440p Ultra: 120-165 FPS | Excellent rasterization, moderate RT performance",
        bottleneck:
          cores >= 8 ? "Balanced" : "Consider 8+ cores for high refresh gaming",
      };
    }

    if (gpuName.includes("7800 xt") || gpuName.includes("7800xt")) {
      return {
        fps: "1440p Ultra: 90-120 FPS (AAA) | 1080p Ultra: 144-240 FPS | Good value for 1440p gaming",
        bottleneck:
          cores >= 6
            ? "Balanced"
            : "6+ cores recommended for optimal performance",
      };
    }

    if (gpuName.includes("7700 xt") || gpuName.includes("7700xt")) {
      return {
        fps: "1440p High: 70-100 FPS | 1080p Ultra: 100-144 FPS | Solid 1440p entry card",
        bottleneck: "Balanced for 1080p/1440p gaming",
      };
    }

    if (gpuName.includes("7600 xt") || gpuName.includes("7600xt")) {
      return {
        fps: "1080p Ultra: 80-120 FPS | 1440p Medium: 60-90 FPS | Budget-friendly 1080p gaming",
        bottleneck: "GPU appropriate for target resolution",
      };
    }
  } else if (useCase === "creation" && ramCap && cores) {
    if (cores >= 16 && ramCap >= 64) {
      return {
        workload:
          "4K/8K video editing: Smooth 2-4 stream playback (Premiere/Resolve) | 3D rendering: Blender BMW 2-3min, Cinema 4D top 10% | Photoshop: 100+ layer files, instant filters | After Effects: Complex compositions 30-50fps preview | OBS streaming: 1080p60 x264 slow preset with zero performance impact",
        bottleneck:
          "None – professional-grade performance. Storage speed (NVMe RAID) now becomes primary bottleneck for 4K/8K media.",
      };
    }

    if (cores >= 12 && ramCap >= 64) {
      return {
        workload:
          "4K video editing: Real-time 1-2 streams (H.264/H.265) | 3D rendering: Blender BMW 3-4min, good performance | Premiere exports: 4K H.265 ~1-1.5x realtime | DaVinci color grading: 4K 30-50fps playback",
        bottleneck:
          "Balanced for 4K workflows. More cores would help rendering/export (16+ cores = 20-30% faster), but current config very capable.",
      };
    }

    if (cores >= 12 && ramCap >= 32) {
      return {
        workload:
          "1080p/4K editing: Excellent performance (Premiere/Vegas/Resolve) | Blender: Above average render times | Photoshop: Fast with 50+ layers | Streaming: 1080p60 medium preset comfortable",
        bottleneck:
          "RAM for 4K timelines with heavy effects (64GB would enable 3-4 streams + effects stacks). Current 32GB sufficient for 1080p or simple 4K edits.",
      };
    }

    if (cores >= 8 && ramCap >= 32) {
      return {
        workload:
          "1080p editing: Excellent (2-4 streams, real-time effects) | Blender: Above average (6-8min BMW benchmark) | Photoshop/Lightroom: Smooth performance | OBS streaming: 1080p60 fast preset",
        bottleneck:
          "More cores beneficial for 4K editing (12+ cores recommended). Current config ideal for 1080p content creation + moderate 3D work.",
      };
    }

    if (cores >= 8 && ramCap >= 16) {
      return {
        workload:
          "1080p editing: Good (single stream, proxy for complex edits) | Basic rendering: Functional | Streaming: 720p/1080p30 comfortable",
        bottleneck:
          "RAM limiting for complex timelines (32GB recommended for professional work). Consider 32GB upgrade for smoother experience.",
      };
    }
  } else if (useCase === "workstation") {
    if (cores >= 24 && ramCap >= 128) {
      return {
        workload:
          "VMs: 8-12 concurrent (ESXi/Proxmox, 2-4GB each) | Compile: Linux kernel 8-12min, LLVM/Chrome 35-50min | Docker: 20-30 containers comfortable | Data science: Large datasets in-memory (pandas 50GB+, GPU acceleration available)",
        bottleneck:
          "Storage speed critical (NVMe RAID0 for compile scratch, 10Gb networking for data transfer). Consider Threadripper/Xeon W for PCIe lanes if using multiple GPUs/NVMe.",
      };
    }

    if (cores >= 16 && ramCap >= 64) {
      return {
        workload:
          "VMs: 4-6 concurrent (Hyper-V/VMware, 4-8GB each) | Compile: Medium projects 5-10min, large 20-30min (GCC/Clang -j16) | Docker: 10-15 containers | Database: SQL Server/PostgreSQL dev instances comfortable",
        bottleneck:
          "Storage speed matters for compile times (NVMe Gen4 recommended). RAM sufficient for most workflows, 128GB beneficial for many VMs or large datasets.",
      };
    }

    if (cores >= 12 && ramCap >= 32) {
      return {
        workload:
          "VMs: 3-4 concurrent | Compile: Small-medium projects good, large projects slower (30-60min) | Development: Multiple IDEs + debuggers comfortable",
        bottleneck:
          "RAM limiting for many VMs (64GB recommended for 5+ VMs). Core count adequate for most development workflows.",
      };
    }

    if (cores >= 8 && ramCap >= 32) {
      return {
        workload:
          "VMs: 2-3 lightweight (4-8GB RAM total) | Compile: Entry-level (small projects <10min) | Development: Single heavy IDE (IntelliJ/Visual Studio) comfortable",
        bottleneck:
          "More cores beneficial for parallel compilation (12+ cores = 30-50% faster large builds). Current config sufficient for single-threaded workflows.",
      };
    }
  }

  return {};
}

/**
 * Generate call-to-action recommendations based on synergy grade
 */
export function generateCTAs(
  grade: string,
  components: {
    ramCap: number;
    cores: number;
    vram: number;
    estimatedLoad: number;
    cooling: { type?: string } | null;
    storage: { interface?: string } | null;
  }
): string[] {
  const ctas: string[] = [];
  const { ramCap, cores, vram, estimatedLoad, cooling, storage } = components;

  if (grade === "A" || grade === "B") {
    ctas.push(
      "✅ Your build is ready! No critical changes needed. Component synergy excellent."
    );

    if (ramCap === 16 && vram >= 12) {
      ctas.push(
        "💡 Optional: Consider 32GB RAM (+£60-80, 2x16GB DDR5 6000 CL30) for content creation (enables 2-3 4K streams + effects), heavy multitasking (gaming + OBS + Discord + browser), or future-proofing. Performance uplift: 0% gaming, 10-20% creative workflows with RAM-heavy effects."
      );
    }

    if (ramCap === 32 && cores >= 12 && vram >= 16) {
      ctas.push(
        "💡 Optional upgrade path: 64GB RAM (+£100-160) if doing professional 4K/8K editing (4+ stream timelines), 3D rendering (large scenes), or running multiple VMs. Performance uplift: 0-5% most workflows, 20-40% RAM-constrained tasks (large Photoshop files, After Effects)."
      );
    }

    if (storage?.interface?.includes("SATA") && vram >= 12) {
      ctas.push(
        "💡 Consider: Upgrade to NVMe Gen4 SSD (+£20-60 vs SATA) for 5-7x faster game loading (Cyberpunk 20s vs 90s), DirectStorage API support (future games), faster level streaming (reduced pop-in). Models: Samsung 980 Pro, WD Black SN850X, Crucial P5 Plus."
      );
    }

    if (!cooling) {
      ctas.push(
        "⚠️ IMPORTANT: Add a CPU cooler – essential for stable performance. Budget: Thermalright PA120 SE £35 (excellent value, 180W TDP), DeepCool AK400 £30 (good), ID-Cooling SE-224-XT £25 (basic). Mid-tier: 240mm AIO £60-90 (quieter, better temps). Without cooler: Immediate thermal throttling 95-100°C, 30-50% performance loss, potential shutdown."
      );
    }

    if (estimatedLoad >= 0.65 && estimatedLoad <= 0.75) {
      ctas.push(
        "💡 PSU note: Running at ~70% load (functional but outside optimal 40-60% efficiency zone). Consider next wattage tier (+£30-60) for quieter operation (fan curves less aggressive), better efficiency (2-3% improvement), and GPU upgrade headroom (can handle RTX 5080/RX 8800 XT without PSU swap)."
      );
    }
  } else if (grade === "C") {
    if (vram >= 12 && cores < 6) {
      ctas.push(
        "🎯 RECOMMENDED: Upgrade to 6+ core CPU (8+ cores ideal) to match your GPU's capabilities. Your high-end GPU (12GB+ VRAM) is bottlenecked by low core count. Expect 15-30% FPS loss in CPU-heavy titles (strategy, simulation, open-world games). Upgrade options: Ryzen 5 7600X (6C, £200), Ryzen 7 7700X (8C, £270), i5-14400F (10C, £180). Performance gain: 15-35% in CPU-bound scenarios."
      );
    }

    if (vram >= 16 && cores < 8) {
      ctas.push(
        "🎯 CRITICAL: Your flagship GPU (16GB+ VRAM) needs 8+ cores minimum (12+ cores ideal for 4K). Current CPU creating 20-40% bottleneck. Upgrade to: Ryzen 7 7800X3D (£350, best gaming), i7-14700K (£320, 20C), Ryzen 9 7900X (£350, 12C). ROI: £150-200 spend unlocks £400-600 of GPU performance currently wasted."
      );
    }

    if (ramCap < 16) {
      ctas.push(
        "🎯 RECOMMENDED: Increase to 16GB RAM minimum (£40-60, 2x8GB DDR4 3200/DDR5 5600) for modern gaming/productivity. Games requiring 16GB: Hogwarts Legacy, Star Citizen, Flight Simulator, Cyberpunk (high textures). Performance impact: Stuttering eliminated, 1% lows improve 40-60%, texture streaming smooth."
      );
    }

    if (ramCap === 16 && vram >= 12) {
      ctas.push(
        "💡 Consider: 32GB RAM (+£60-80) to match your high-end GPU tier. Modern AAA games with high textures can use 12-16GB RAM, leaving minimal headroom for OS/background apps. Upgrade prevents future stuttering as games demand more VRAM/RAM."
      );
    }

    if (storage?.interface?.includes("SATA") && vram >= 10) {
      ctas.push(
        "💡 Consider: Switch to NVMe SSD for 5x faster loading (+£20-40 vs SATA). Your GPU tier indicates AAA gaming where load times matter. Models: Kingston NV2 £35 (budget, 3000MB/s), WD Blue SN580 £45 (good), Samsung 980 £55 (excellent). Benefit: 40-60s load time reductions, DirectStorage ready."
      );
    }

    if (estimatedLoad >= 0.7 && estimatedLoad < 0.8) {
      ctas.push(
        "💡 PSU recommendation: Current unit running 70-80% load (functional but stressed). Upgrade to next wattage tier (+£50-80, +150-200W) for: Quieter operation (fan curves aggressive at >70%), efficiency improvement (currently 88-90%, optimal is 91-92% at 50% load), stability during transient spikes (GPU power spikes 150-200W above TDP), future GPU upgrade headroom."
      );
    }
  } else if (grade === "D" || grade === "E" || grade === "F") {
    ctas.push(
      "⚠️ CRITICAL: This build has significant imbalances causing 30-70% performance loss. Immediate rebalancing required:"
    );

    if (vram >= 16 && cores < 8) {
      ctas.push(
        "   • URGENT: Your flagship GPU (16GB+ VRAM, £700-1600) needs 8+ core CPU minimum (12+ ideal). Current bottleneck: 40-60% GPU performance wasted (GPU usage 50-70% while CPU pinned 100%). You're getting mid-range GPU performance from flagship spend. Mandatory upgrade: Ryzen 7 7700X/7800X3D (£270-350) or i7-14700K (£320). Alternative: Downgrade GPU to RTX 4070/RX 7800 XT tier, save £300-600, reallocate to balanced build. Do NOT build as configured - £500-1000 will be wasted."
      );
    }

    if (vram >= 20 && cores < 12) {
      ctas.push(
        "   • CRITICAL: RTX 4090/RX 7900 XTX tier GPU (£1200-1600) requires 12+ core CPU for 4K gaming. Current CPU causing 50-70% bottleneck. This is catastrophic misallocation. Either: 1) Upgrade to Ryzen 9 7900X/7950X (£350-500) or i9-14900K (£480), or 2) Downgrade GPU to RTX 4080 tier (£700-900), save £400-700, build balanced system. Building as-is wastes £800-1200 of GPU investment."
      );
    }

    if (vram < 8 && cores >= 12) {
      ctas.push(
        "   • REBALANCE NEEDED: High-end CPU (£300-500) paired with budget GPU (£200-300) is reversed priorities. Your CPU will idle at 30-50% while GPU struggles. Recommendation: Downgrade CPU to Ryzen 5 7600/i5-14400F (£180-220, saves £100-300), upgrade GPU to RTX 4070/RX 7800 XT tier (£450-550, invest £150-250 more). Net cost: £50-100 additional, performance gain: 60-100% gaming, 50-80% creative workflows. This rebalancing transforms the build."
      );
    }

    if (ramCap < 16) {
      ctas.push(
        "   • MANDATORY: Increase RAM to minimum 16GB (£40-60 for 2x8GB DDR5 5600). Current 8GB causes constant stuttering, texture streaming failures, system instability. Modern games require 12-16GB, leaving zero headroom. 32GB (£60-100) recommended if budget allows. This is non-negotiable for functional system."
      );
    }

    if (ramCap >= 64 && vram < 10 && cores < 12) {
      ctas.push(
        "   • BUDGET MISALLOCATION: 64GB+ RAM (£150-250) with budget GPU/CPU is wasteful. You've over-invested £100-180 in unused RAM. Downgrade to 32GB (£60-100, saves £60-150), reallocate savings to GPU upgrade (RTX 4070 tier) or CPU upgrade (8-12 cores). This rebalancing yields 40-80% performance improvement for same total cost."
      );
    }

    if (estimatedLoad > 0.85) {
      ctas.push(
        "   • PSU FAILURE RISK: Running at 85%+ load is dangerous. Expect: Random shutdowns during gaming (GPU power spikes trigger overcurrent protection), voltage instability damaging components over time, loud fan noise (45dB+ constant), potential fire hazard with cheap units. IMMEDIATE upgrade required: Add 200-300W headroom (current + 200W minimum). If on 550W, upgrade to 750-850W (£80-120). If on 650W, upgrade to 850-1000W (£90-150). System unusable/unsafe as configured. Do NOT power on until PSU upgraded."
      );
    }

    if (!cooling && cores >= 8) {
      ctas.push(
        "   • NO COOLER CRITICAL: Cannot boot system without CPU cooler. Instant thermal shutdown at 100-105°C within 30 seconds of POST. Intel K/KF series and AMD Ryzen 7000/9000 do NOT include stock cooler. Mandatory purchase: Budget air (£25-35, Thermalright PA120 SE/DeepCool AK400), 240mm AIO (£60-90, quieter/cooler), or premium air (£70-100, Noctua NH-U12S). Without cooler: System literally cannot function. Add to cart before purchasing anything else."
      );
    }

    if (storage?.interface?.includes("SATA") && vram >= 16) {
      ctas.push(
        "   • STORAGE BOTTLENECK: Flagship GPU (16GB+ VRAM) with SATA SSD creates asset streaming bottleneck. Modern games stream 5-10GB/s during level loads (DirectStorage API), SATA maxes at 550MB/s. Result: 3-5 second freezes every 30-60 seconds, texture pop-in, stuttering. Mandatory upgrade: NVMe Gen4 SSD (£50-100 for 1TB, WD Black SN850X/Samsung 980 Pro). Performance: Eliminates stuttering, 60-80% faster load times. Critical for your GPU tier."
      );
    }

    ctas.push(
      "\n🚫 DO NOT PROCEED WITH PURCHASE until rebalancing these critical issues. You risk wasting £300-1000+ on mismatched components that underperform catastrophically. I can help you rebalance this into a functional build for same budget - ask me for specific recommendations based on your total budget (£800/£1200/£1800 typical tiers)."
    );
  }

  return ctas;
}
