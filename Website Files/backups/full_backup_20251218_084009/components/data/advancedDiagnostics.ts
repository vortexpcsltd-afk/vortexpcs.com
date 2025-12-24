/**
 * Advanced Diagnostics System
 *
 * Provides technical bottleneck warnings and optimization recommendations
 * for power users and enthusiasts who want deeper system analysis.
 *
 * Diagnostics cover:
 * - CPU/GPU balance and bottleneck detection
 * - RAM capacity vs core count optimization
 * - PSU efficiency zones and headroom analysis
 * - Cooling adequacy for high-performance CPUs
 * - Storage performance bottlenecks
 * - Component ratio warnings
 */

interface DiagnosticMetrics {
  vram: number;
  cores: number;
  ramCap: number;
  estimatedLoad: number;
  wattage: number;
  tdpCpu: number;
  gpuPower: number;
  cooling?: {
    type?: string;
    name?: string;
  };
  storage?: {
    name?: string;
    interface?: string;
    capacity?: number;
    readSpeed?: number;
    writeSpeed?: number;
    driveType?: string;
    heatsink?: boolean;
  };
  // Optional, for enhanced P0 diagnostics (safe to omit)
  cpuName?: string;
  gpuName?: string;
  ramName?: string; // e.g., "32GB (2x16GB) DDR5-6000 CL30"
  ramSpeed?: number; // MHz
  ramSticks?: number; // 1,2,4 (DIMM count)
  motherboardChipset?: string; // e.g., "B550", "Z790", "B650E"
  motherboardModel?: string; // e.g., "ASUS TUF B650-Plus"
  maxBoardRamSpeed?: number; // BIOS/QVL-limited max
  pcieGen?: number; // Effective GPU slot gen (3|4|5)
  gpuSlotLanes?: number; // 4|8|16
  nvmeSlots?: number; // populated M.2 count
  // Optional P1 thermal context
  ambientTemp?: number; // °C
  caseAirflow?: "Excellent" | "Good" | "Adequate" | "Poor" | "Unknown";
  caseFans?: number; // total installed fans
  caseModel?: string;
  // Optional P3 peripherals & display context
  usbDevices?: string[]; // e.g., ["capture card", "external ssd", "audio interface"]
  displays?: {
    resolution?: string; // "3840x2160", "2560x1440"
    refreshRate?: number; // Hz
    connection?: string; // "HDMI 2.0", "HDMI 2.1", "DisplayPort 1.4"
  }[];
  gpuPorts?: string[]; // e.g., ["HDMI 2.1", "DisplayPort 1.4a"]
}

/**
 * Generate advanced diagnostic warnings based on component analysis
 * Returns array of "ADV:" prefixed technical recommendations
 */
export const getAdvancedDiagnostics = (
  metrics: DiagnosticMetrics
): string[] => {
  const diagnostics: string[] = [];
  const {
    vram,
    cores,
    ramCap,
    estimatedLoad,
    wattage,
    tdpCpu,
    gpuPower,
    cooling,
    storage,
    cpuName,
    gpuName,
    ramName,
    ramSpeed,
    ramSticks,
    motherboardChipset,
    motherboardModel,
    maxBoardRamSpeed,
    pcieGen,
    gpuSlotLanes,
    nvmeSlots,
    ambientTemp,
    caseAirflow,
    caseFans: _caseFans,
    caseModel: _caseModel,
    usbDevices,
    displays,
    gpuPorts,
  } = metrics;

  // CPU Bottleneck Detection - High-end GPU with low core count
  if (vram >= 16 && cores < 8) {
    diagnostics.push(
      "ADV: High-end GPU may be CPU-limited in simulation / strategy titles; consider 10–12 core CPU for frame time stability."
    );
  }

  // RAM Imbalance - Extreme capacity without CPU cores to utilize it
  if (ramCap >= 128 && cores < 12) {
    diagnostics.push(
      "ADV: Extreme RAM capacity without high core count – heavy parallel workloads will cap at CPU threads first."
    );
  }

  // PSU Oversized - Running at very low load reduces efficiency
  if (estimatedLoad > 0 && estimatedLoad < 0.35) {
    diagnostics.push(
      `ADV: PSU typical load ~${Math.round(
        estimatedLoad * 100
      )}% – downsizing could improve efficiency curve & acoustics.`
    );
  }

  // PSU Undersized - Running at very high load risks instability
  if (estimatedLoad > 0.8) {
    diagnostics.push(
      `ADV: PSU headroom tight (~${Math.round(
        estimatedLoad * 100
      )}%). Future GPU upgrades or transient spikes may stress rails.`
    );
  }

  // Cooling Inadequacy - Air cooling on many-core CPUs
  if (cooling?.type === "Air" && cores >= 16) {
    diagnostics.push(
      "ADV: Air cooling on many-core CPU – sustained multi-hour renders may throttle; 360mm AIO or premium dual-tower advised."
    );
  }

  // Storage Missing
  if (!storage) {
    diagnostics.push(
      "ADV: No storage selected – choose fast NVMe for OS & primary workloads."
    );
  }

  // Storage Bottleneck - SATA with high-end GPU
  if (storage?.interface?.includes("SATA") && vram >= 12) {
    diagnostics.push(
      "ADV: SATA SSD in performance build; Gen4 NVMe reduces asset streaming latency & compile times."
    );
  }

  // GPU Bottleneck - High RAM with modest GPU
  if (ramCap >= 64 && vram < 10) {
    diagnostics.push(
      "ADV: High memory with modest GPU – for graphical workloads upgrade GPU before expanding RAM further."
    );
  }

  // RAM Inadequacy - 16GB with high-end GPU
  if (ramCap === 16 && vram >= 12) {
    diagnostics.push(
      "ADV: 16GB may constrain large texture packs / editing sessions; 32GB recommended."
    );
  }

  // Storage/RAM Imbalance - Very high RAM with limited storage
  if (ramCap >= 96 && (storage?.capacity ?? 0) < 1000) {
    diagnostics.push(
      "ADV: Very high RAM but limited storage – larger NVMe improves scratch/project utilisation of memory caching."
    );
  }

  // PSU Transient Headroom - Component power too close to PSU rating
  if (wattage && tdpCpu + gpuPower > wattage - 120) {
    diagnostics.push(
      "ADV: PSU transient headroom limited – next wattage tier increases stability."
    );
  }

  // =====================
  // P0 Enhancements
  // =====================

  // Helper: Extract RAM speed and sticks from name when not provided
  const parsedRamSpeed =
    typeof ramSpeed === "number" && ramSpeed > 0
      ? ramSpeed
      : extractRamSpeedFromName(ramName);
  const parsedRamSticks =
    typeof ramSticks === "number" && ramSticks > 0
      ? ramSticks
      : extractRamSticksFromName(ramName);

  // Helper: Infer PCIe gen from chipset if not provided
  const inferredPcieGen =
    typeof pcieGen === "number" && pcieGen > 0
      ? pcieGen
      : inferPCIeGenFromChipset(motherboardChipset);

  // Helper: GPU tier (flagship/high-end/mid-range/budget) from vram/name
  const gpuTier = getGPUTier(gpuName, vram);

  // 1) Memory Configuration Diagnostics (single-channel, speed/platform match)
  if (parsedRamSticks === 1 && ramCap >= 16) {
    diagnostics.push(
      `ADV: ⚠️ CRITICAL – Single-channel RAM detected (1x${ramCap}GB). Expect 15–30% performance loss in CPU/memory-bound tasks. Use 2x${Math.max(
        4,
        Math.floor(ramCap / 2)
      )}GB for dual-channel (same cost, double bandwidth).`
    );
  }

  // Consumer platforms: 4 DIMMs at moderate capacity can limit attainable speed and upgrades
  if (parsedRamSticks === 4 && ramCap <= 32) {
    diagnostics.push(
      "ADV: 4x DIMMs on consumer dual‑channel platform offers no bandwidth gain vs 2x higher‑capacity sticks and can reduce achievable RAM speed; prefer 2x modules for stability and future upgrades."
    );
  }

  // Ryzen 7000/9000 DDR5 sweet spot ~6000 MT/s
  if (cpuName && /ryzen\s*(7|9)\d{3}/i.test(cpuName)) {
    if (parsedRamSpeed && parsedRamSpeed < 6000) {
      diagnostics.push(
        `ADV: Ryzen DDR5 sweet spot is 6000 MT/s (1:1 IF). Your RAM speed ${parsedRamSpeed} is suboptimal; 6000 CL30 typically yields +5–8% CPU‑bound uplift.`
      );
    }
  }

  // Board RAM speed cap vs kit speed
  if (
    typeof maxBoardRamSpeed === "number" &&
    parsedRamSpeed &&
    parsedRamSpeed > maxBoardRamSpeed
  ) {
    diagnostics.push(
      `ADV: RAM ${parsedRamSpeed} MT/s exceeds motherboard validated max ${maxBoardRamSpeed} MT/s – kit may run downclocked; consider matching speed to QVL.`
    );
  }

  // 2) PCIe Bandwidth Bottlenecks
  if (gpuTier === "flagship" && inferredPcieGen && inferredPcieGen <= 3) {
    diagnostics.push(
      `ADV: ⚠️ PCIe 3.0 may bottleneck a flagship GPU – expect 8–12% FPS loss vs PCIe 4.0 in bandwidth‑heavy titles. Consider a PCIe 4.0 motherboard for ${
        gpuName ?? "GPU"
      }.`
    );
  } else if (
    gpuTier === "high-end" &&
    inferredPcieGen &&
    inferredPcieGen <= 3
  ) {
    diagnostics.push(
      `ADV: PCIe 3.0 with a high‑end GPU can cost ~3–5% performance; acceptable on a budget but suboptimal for £500+ GPUs.`
    );
  }

  if (
    typeof gpuSlotLanes === "number" &&
    gpuSlotLanes === 8 &&
    gpuTier !== "budget"
  ) {
    diagnostics.push(
      "ADV: GPU appears limited to PCIe x8 – verify slot choice and M.2 lane sharing; x8 can reduce performance 2–8% on upper‑tier GPUs."
    );
  }

  if (
    typeof nvmeSlots === "number" &&
    nvmeSlots >= 2 &&
    typeof motherboardChipset === "string" &&
    /B550/i.test(motherboardChipset)
  ) {
    diagnostics.push(
      `ADV: ${motherboardChipset} lane‑sharing note – second M.2 slot can disable SATA ports or reduce GPU to x8; check manual for optimal slot placement.`
    );
  }

  // 3) Motherboard VRM & Platform Warnings (chipset‑level)
  if (motherboardChipset) {
    // Incompatible platform example (AM5 CPU on AM4 board) – conservative wording as names may vary
    if (
      /ryzen\s*7\d{3}/i.test(cpuName ?? "") &&
      /B550|X570/i.test(motherboardChipset)
    ) {
      diagnostics.push(
        `ADV: Platform mismatch risk – ${
          cpuName ?? "CPU"
        } (AM5) requires B650/X670 series. ${
          motherboardModel ?? motherboardChipset
        } is likely AM4.`
      );
    }

    // Entry Intel chipset paired with higher‑tier CPU
    if (/H610/i.test(motherboardChipset) && (tdpCpu >= 125 || cores >= 8)) {
      diagnostics.push(
        `ADV: ${motherboardChipset} chipset is entry‑level – limited features (no OC/XMP on some boards, fewer lanes). Consider B660/B760 or Z790 for ${
          cpuName ?? "CPU"
        } to avoid platform constraints.`
      );
    }
  }

  // =====================
  // P1 Enhancements – Thermal Predictions
  // =====================

  // Derive cooler characteristics
  const coolerType = normalizeCoolerType(cooling?.type, cooling?.name);
  const coolerSize = extractCoolerSizeMm(cooling?.name);
  const totalSystemPower = (tdpCpu || 0) + (gpuPower || 0);

  // Stock/Low-profile cooler with higher TDP CPUs
  if (coolerType === "Stock" && tdpCpu >= 95) {
    diagnostics.push(
      `ADV: ⚠️ THERMAL – Stock cooler with ${tdpCpu}W CPU will run at or near thermal limits under load (90–100°C). Recommend a tower air cooler or 240mm+ AIO.`
    );
  }

  if (coolerType === "Low Profile" && tdpCpu >= 95) {
    diagnostics.push(
      `ADV: Low‑profile cooler is marginal for ${tdpCpu}W CPU; expect high temps in sustained loads. Ensure case clearance for a taller tower or consider 240mm AIO.`
    );
  }

  // 240mm AIO with very high TDP CPUs
  const coolerSizeMm = coolerSize ?? 0;
  if (
    coolerType === "AIO" &&
    coolerSizeMm > 0 &&
    coolerSizeMm <= 240 &&
    tdpCpu >= 170
  ) {
    diagnostics.push(
      `ADV: 240mm AIO is minimal for ${tdpCpu}W class CPUs; consider 280/360mm for better sustained thermals (5–10°C cooler under all‑core workloads).`
    );
  }

  // Case airflow vs power
  if (caseAirflow === "Poor" && totalSystemPower > 400) {
    diagnostics.push(
      `ADV: Case airflow rated poor for ~${totalSystemPower}W system; add intake/exhaust fans or choose a mesh‑front case to avoid heat soak and throttling.`
    );
  }

  // High‑power GPU general thermal guidance if airflow unknown
  if (
    (!caseAirflow || caseAirflow === "Unknown" || caseAirflow === "Adequate") &&
    gpuPower >= 350
  ) {
    diagnostics.push(
      `ADV: High‑power GPU (~${gpuPower}W) benefits from strong case airflow (2–3 front intakes, 1–2 exhaust). Expect higher internal temps without it.`
    );
  }

  // Ambient temperature considerations
  if (
    typeof ambientTemp === "number" &&
    ambientTemp > 25 &&
    totalSystemPower > 450
  ) {
    diagnostics.push(
      `ADV: Ambient ${ambientTemp}°C + ~${totalSystemPower}W system reduces thermal headroom; raise fan curves in summer or consider higher‑capacity cooling.`
    );
  }

  // =====================
  // P2 Enhancements – Overclocking Assessment
  // =====================

  const psuHeadroomPct =
    wattage > 0 ? Math.max(0, 1 - (estimatedLoad || 0)) * 100 : undefined;
  const cpuSku = (cpuName ?? "").toLowerCase();
  const board = (motherboardChipset ?? "").toUpperCase();

  // Locked CPU on OC-capable board (value note)
  if (
    cpuSku &&
    !/\bk\b|\bx\b|x3d/.test(cpuSku) &&
    (board.startsWith("Z") || board.startsWith("X"))
  ) {
    diagnostics.push(
      `ADV: Overclocking note – ${cpuName} is locked (no ratio OC) on ${motherboardChipset}. You pay for OC features you can't fully use. Focus: RAM tuning, power limit/undervolt for efficiency.`
    );
  }

  // OC-capable CPU on locked chipset (Intel)
  if (
    /\bk\b/.test(cpuSku) &&
    (board.startsWith("B") || board.startsWith("H"))
  ) {
    diagnostics.push(
      `ADV: ${cpuName} (unlocked) on ${motherboardChipset} restricts CPU ratio OC. Full OC requires Z‑series. You can still raise power limits and tune RAM.`
    );
  }

  // AMD X3D CPU OC limitations
  if (cpuSku.includes("x3d")) {
    diagnostics.push(
      `ADV: ${cpuName} OC limitations – X3D has locked multipliers/voltages. Best gains from Curve Optimizer (negative offsets) and RAM tuning.`
    );
  }

  // Good OC foundation
  if (
    /(\bk\b|\bx\b)/.test(cpuSku) &&
    (board.startsWith("Z") || board.startsWith("X")) &&
    (coolerType === "AIO" || coolerType === "Air") &&
    (psuHeadroomPct ?? 0) >= 25
  ) {
    diagnostics.push(
      `ADV: ✅ Strong OC foundation – Unlocked CPU on ${motherboardChipset} with adequate cooling and ~${Math.round(
        psuHeadroomPct!
      )}% PSU headroom. Expect modest gains (5–12% multi‑core with voltage increases; memory tuning improves 1% lows).`
    );
  }

  // Insufficient PSU headroom for OC
  if (
    (psuHeadroomPct ?? 0) > 0 &&
    (psuHeadroomPct ?? 0) < 20 &&
    (/(\bk\b|\bx\b)/.test(cpuSku) || coolerType !== "Unknown")
  ) {
    diagnostics.push(
      `ADV: ⚠️ OC headroom limited – PSU margin ~${Math.round(
        psuHeadroomPct!
      )}%. Overclocking raises power draw and transient spikes; keep tuning conservative or upgrade PSU.`
    );
  }

  // Intel specifics: B/H allow power limit increases, Z allows ratio OC
  if (
    (board.startsWith("B") || board.startsWith("H")) &&
    /intel|i\d-\d{4,}/i.test(cpuName ?? "")
  ) {
    diagnostics.push(
      `ADV: Intel tuning on ${motherboardChipset}: CPU ratio OC is locked, but raising power limits (PL1/PL2) and enabling XMP can boost sustained clocks. Monitor temps when lifting limits.`
    );
  }

  // AMD platform specifics: A620 limitations, B650/X670 PBO/CO
  if (/A620/i.test(motherboardChipset ?? "")) {
    diagnostics.push(
      `ADV: ${motherboardChipset} is entry‑level AM5 – limited CPU OC controls; PBO/Curve Optimizer may be restricted depending on board. Focus on EXPO memory tuning for gains.`
    );
  } else if (/B650|X670/i.test(motherboardChipset ?? "")) {
    diagnostics.push(
      `ADV: AMD OC guidance – Enable PBO/Curve Optimizer for efficient boosts; keep SoC voltage conservative (≤1.30–1.35V). EXPO at DDR5‑6000 is ideal for Ryzen 7000/9000.`
    );
  }

  // High‑power Intel K on air cooling caution
  if (
    /\b14900k\b|\b13900k\b|\b13700k\b/i.test(cpuSku) &&
    coolerType === "Air"
  ) {
    diagnostics.push(
      `ADV: High‑power Intel K‑series on air cooling can hit thermal limits under all‑core loads; consider strong dual‑tower or a 280/360mm AIO for sustained OC.`
    );
  }

  // =====================
  // P3 Enhancements – USB & Display
  // =====================

  if (Array.isArray(usbDevices) && usbDevices.length > 0) {
    const usbWarnings = getUSBBandwidthWarnings(usbDevices);
    diagnostics.push(...usbWarnings);
  }

  if (Array.isArray(displays) && displays.length > 0) {
    const displayWarnings = getDisplayWarnings(displays, gpuPorts ?? []);
    diagnostics.push(...displayWarnings);
  }

  // =====================
  // P4 Enhancements – Storage Thermals, Cable QA, Audio/EMI
  // =====================

  // Storage thermals – NVMe Gen4/Gen5 throttling and heatsink guidance
  if (storage) {
    const iface = (storage.interface || "").toLowerCase();
    const sName = (storage.name || "").toLowerCase();
    const read = storage.readSpeed;
    const gen = inferNVMeGen(iface, sName, read);
    const hasHs =
      !!storage.heatsink || /heatsink|heat\s*sink|with\s*heatsink/.test(sName);
    const warmAmbient = typeof ambientTemp === "number" && ambientTemp > 25;
    const weakAirflow = caseAirflow === "Poor" || caseAirflow === "Unknown";

    if ((gen === 4 || gen === 5) && !hasHs) {
      diagnostics.push(
        `ADV: NVMe Gen${gen} without a heatsink is prone to thermal throttling under sustained transfers. Use the motherboard M.2 shield or an aftermarket heatsink and ensure some airflow across the M.2 area.`
      );
    }

    if (gen === 5 && (read || 0) >= 9000 && (warmAmbient || weakAirflow)) {
      diagnostics.push(
        `ADV: Gen5 NVMe at very high speeds in warm/low‑airflow cases can throttle during long installs/exports. A finned heatsink with directed airflow helps sustain performance.`
      );
    }

    if (
      typeof nvmeSlots === "number" &&
      nvmeSlots >= 2 &&
      (gen === 4 || gen === 5)
    ) {
      diagnostics.push(
        `ADV: Multiple Gen${gen} NVMe drives raise motherboard hotspot temps; avoid stacking both under the GPU and provide strong front‑intake airflow.`
      );
    }
  }

  // Audio/EMI guidance
  if (
    Array.isArray(usbDevices) &&
    usbDevices.some((d) => (d || "").toLowerCase().includes("audio interface"))
  ) {
    diagnostics.push(
      `ADV: USB audio best practices – use a rear USB 3.x Type‑A port on a separate controller if available, avoid front‑panel hubs, prefer a powered hub for stability, and route audio cables away from GPU/PSU runs.`
    );
  }

  if (gpuPower >= 350) {
    const loadPct =
      typeof estimatedLoad === "number" && estimatedLoad > 0
        ? Math.round(estimatedLoad * 100)
        : undefined;
    if (
      typeof loadPct === "number" &&
      (estimatedLoad < 0.35 || estimatedLoad > 0.85)
    ) {
      diagnostics.push(
        `ADV: High‑power GPUs can exhibit coil whine; current PSU load ~${loadPct}%. Mitigations: cap FPS or enable V‑Sync/G‑Sync, try light GPU undervolting, and aim for a 40–70% PSU load range during gaming.`
      );
    } else {
      diagnostics.push(
        `ADV: High‑power GPUs can exhibit coil whine at very high FPS. Mitigations: cap FPS or enable V‑Sync/G‑Sync and try light undervolting; coil whine typically decreases under steadier loads.`
      );
    }
  }

  return diagnostics;
};

// =====================
// Helper functions
// =====================

function extractRamSpeedFromName(name?: string): number | undefined {
  if (!name) return undefined;
  const n = name.toLowerCase();
  // Match DDR5-6000 / DDR4-3600 / 6000mhz
  const m1 = n.match(/ddr\d[-\s]?([0-9]{3,5})/i);
  if (m1 && m1[1]) return parseInt(m1[1], 10);
  const m2 = n.match(/([0-9]{3,5})\s*mhz/);
  if (m2 && m2[1]) return parseInt(m2[1], 10);
  return undefined;
}

function extractRamSticksFromName(name?: string): number | undefined {
  if (!name) return undefined;
  const m = name.toLowerCase().match(/(\d)\s*x\s*\d+\s*gb/);
  if (m && m[1]) return parseInt(m[1], 10);
  return undefined;
}

function inferPCIeGenFromChipset(chipset?: string): number | undefined {
  if (!chipset) return undefined;
  const c = chipset.toUpperCase();
  // Broad, conservative mapping focused on Gen3 vs Gen4 alerts
  if (/B450|X470|Z390|H370|B365|B360/.test(c)) return 3;
  if (/B550|X570|Z490|Z590|B560|H570/.test(c)) return 4;
  if (/B650E|X670E/.test(c)) return 5;
  if (/B650|X670|Z690|Z790|B660|B760/.test(c)) return 4; // GPUs effectively Gen4 today
  return undefined;
}

function getGPUTier(
  name?: string,
  vram?: number
): "flagship" | "high-end" | "mid-range" | "budget" {
  const n = (name ?? "").toLowerCase();
  if (n.includes("4090") || n.includes("7900 xtx") || (vram ?? 0) >= 22)
    return "flagship";
  if (
    n.includes("4080") ||
    n.includes("4070 ti") ||
    n.includes("7900 xt") ||
    (vram ?? 0) >= 16
  )
    return "high-end";
  if (n.includes("4070") || n.includes("7800 xt") || n.includes("7700 xt"))
    return "mid-range";
  return "budget";
}

function normalizeCoolerType(
  type?: string,
  name?: string
): "AIO" | "Air" | "Low Profile" | "Stock" | "Unknown" {
  const t = (type ?? "").toLowerCase();
  const n = (name ?? "").toLowerCase();
  if (
    t.includes("aio") ||
    n.includes("aio") ||
    n.includes("liquid") ||
    n.includes("water")
  )
    return "AIO";
  if (
    t.includes("air") ||
    n.includes("air") ||
    n.includes("tower") ||
    n.includes("nh-d15") ||
    n.includes("assassin")
  )
    return "Air";
  if (t.includes("low") || n.includes("low profile") || n.includes("lp"))
    return "Low Profile";
  if (t.includes("stock") || n.includes("stock")) return "Stock";
  return "Unknown";
}

function extractCoolerSizeMm(name?: string): number | undefined {
  if (!name) return undefined;
  const m = name.toLowerCase().match(/(120|240|280|360|420)\s*mm/);
  if (m && m[1]) return parseInt(m[1], 10);
  // Some coolers omit 'mm': e.g., "H100i" (240), "H115" (280), "360 AIO"
  const m2 = name.toLowerCase().match(/\b(120|240|280|360|420)\b/);
  if (m2 && m2[1]) return parseInt(m2[1], 10);
  return undefined;
}

// ===== P3 Helpers =====
function getUSBBandwidthWarnings(usbDevices: string[]): string[] {
  const warnings: string[] = [];
  const list = usbDevices.map((d) => (d || "").toLowerCase());
  const highBw = list.filter(
    (d) =>
      d.includes("capture") ||
      d.includes("external ssd") ||
      d.includes("webcam 4k") ||
      d.includes("audio interface")
  );
  if (highBw.length >= 2) {
    warnings.push(
      `ADV: USB bandwidth congestion risk – ${highBw.length} high‑bandwidth devices detected (capture/SSD/4K webcam/audio). Spread across different controllers; prefer 10–20Gbps ports for capture/SSD.`
    );
  }
  const manyLowSpeed = list.filter(
    (d) =>
      d.includes("keyboard") ||
      d.includes("mouse") ||
      d.includes("dongle") ||
      d.includes("rgb")
  );
  if (manyLowSpeed.length >= 6) {
    warnings.push(
      `ADV: Many low‑speed USB devices (${manyLowSpeed.length}) can cause polling/latency conflicts on shared hubs. Place high‑polling peripherals on USB 3.0 ports or a separate controller.`
    );
  }
  return warnings;
}

function getDisplayWarnings(
  displays: {
    resolution?: string;
    refreshRate?: number;
    connection?: string;
  }[],
  gpuPorts: string[]
): string[] {
  const warnings: string[] = [];
  const ports = gpuPorts.map((p) => (p || "").toLowerCase());

  displays.forEach((m, i) => {
    const res = (m.resolution || "").toLowerCase();
    const conn = (m.connection || "").toLowerCase();
    const hz = m.refreshRate || 60;

    // 4K 120/144 on HDMI 2.0 (bandwidth insufficient)
    if (res.includes("3840x2160") && hz >= 120 && conn.includes("hdmi 2.0")) {
      warnings.push(
        `ADV: Monitor ${
          i + 1
        }: 4K ${hz}Hz needs HDMI 2.1 or DP 1.4+. HDMI 2.0 caps at 4K60.`
      );
    }

    // 4K 120/144 on HDMI 2.1 – cable certification reminder
    if (res.includes("3840x2160") && hz >= 120 && conn.includes("hdmi 2.1")) {
      warnings.push(
        `ADV: Monitor ${
          i + 1
        }: For 4K ${hz}Hz over HDMI 2.1, use an Ultra High Speed HDMI certified cable to avoid intermittent black screens.`
      );
    }

    // 4K 144 on DP 1.4 often relies on DSC – cable quality matters
    if (
      res.includes("3840x2160") &&
      hz >= 144 &&
      conn.includes("displayport 1.4")
    ) {
      warnings.push(
        `ADV: Monitor ${
          i + 1
        }: 4K ${hz}Hz over DP 1.4 typically uses DSC; use a VESA‑certified DP 1.4 cable rated for HBR3 to ensure stability.`
      );
    }

    // 1440p 240 on HDMI 2.0 – insufficient; prefer DP 1.4
    if (res.includes("2560x1440") && hz >= 240 && conn.includes("hdmi 2.0")) {
      warnings.push(
        `ADV: Monitor ${
          i + 1
        }: 1440p ${hz}Hz requires DisplayPort 1.4; HDMI 2.0 is typically limited around 144Hz.`
      );
    }

    // 1080p 240/360 on HDMI 2.0 – prefer DP 1.4
    if (res.includes("1920x1080") && hz >= 240 && conn.includes("hdmi 2.0")) {
      warnings.push(
        `ADV: Monitor ${
          i + 1
        }: 1080p ${hz}Hz is more reliable over DP 1.4; HDMI 2.0 support varies by monitor.`
      );
    }

    // Ultrawide 3440x1440 175Hz on HDMI 2.0 – prefer DP 1.4
    if (res.includes("3440x1440") && hz >= 170 && conn.includes("hdmi 2.0")) {
      warnings.push(
        `ADV: Monitor ${
          i + 1
        }: 3440×1440 ${hz}Hz typically needs DP 1.4; HDMI 2.0 often caps lower.`
      );
    }
  });

  const count4K = displays.filter((m) =>
    (m.resolution || "").includes("3840x2160")
  ).length;
  if (displays.length >= 3 && count4K >= 2) {
    warnings.push(
      `ADV: Multi‑4K setup – heavy display bandwidth can raise idle power and cause desktop stutter; enable DSC or reduce secondary monitors to 60Hz.`
    );
  }

  // Simple GPU port presence checks
  if (
    displays.some(
      (m) =>
        (m.resolution || "").includes("3840x2160") &&
        (m.refreshRate || 60) >= 120
    ) &&
    !ports.some((p) => p.includes("hdmi 2.1") || p.includes("displayport 1.4"))
  ) {
    warnings.push(
      `ADV: GPU ports may limit high‑refresh 4K; ensure HDMI 2.1 or DP 1.4 ports and certified cables are used.`
    );
  }

  return warnings;
}

// ===== P4 Helpers =====
function inferNVMeGen(
  iface?: string,
  name?: string,
  readSpeed?: number
): 3 | 4 | 5 | undefined {
  const i = (iface || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (i.includes("sata") || n.includes("sata")) return undefined;
  if (i.includes("gen5") || i.includes("pci")) {
    if (i.includes("5.0") || n.includes("gen5") || n.includes("gen 5"))
      return 5;
  }
  if (i.includes("gen4") || n.includes("gen4") || n.includes("gen 4")) return 4;
  if (i.includes("gen3") || n.includes("gen3") || n.includes("gen 3")) return 3;
  if (typeof readSpeed === "number") {
    if (readSpeed >= 9000) return 5;
    if (readSpeed >= 5000) return 4;
    if (readSpeed >= 3000) return 3;
  }
  return undefined;
}
