import {
  ImageRef,
  AnyComponent,
  CompatibilityIssue,
  SelectedComponentIds,
  ComponentDataMap,
} from "./types";

/**
 * PCBuilder Utility Functions
 * Extracted from PCBuilder.tsx for better organization
 */

// Dark themed placeholder image
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64," +
  btoa(`
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#grad1)" />
  <rect x="20" y="20" width="360" height="260" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="10,5" rx="8" />
  <circle cx="200" cy="120" r="30" fill="#475569" opacity="0.5" />
  <rect x="170" y="90" width="60" height="60" fill="none" stroke="#64748b" stroke-width="2" rx="4" />
  <text x="200" y="180" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="16" font-weight="600">Image Coming Soon</text>
  <text x="200" y="200" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12">High-quality product image</text>
  <text x="200" y="215" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12">will be available via CMS</text>
</svg>
`);

/**
 * Extract URL from ImageRef (string or object with url/src)
 */
export const getImageUrl = (img: ImageRef): string =>
  typeof img === "string" ? img : img.url || img.src || PLACEHOLDER_IMAGE;

/**
 * Get first image from a component, or fallback to placeholder
 */
export const getComponentImage = (component: AnyComponent): string => {
  if (
    component.images &&
    Array.isArray(component.images) &&
    component.images.length > 0
  ) {
    return getImageUrl(component.images[0]);
  }
  return PLACEHOLDER_IMAGE;
};

/**
 * Check compatibility between selected components
 * Returns array of compatibility issues with severity levels
 */
export const checkCompatibility = (
  selectedComponents: SelectedComponentIds,
  componentData: ComponentDataMap
): CompatibilityIssue[] => {
  const issues: CompatibilityIssue[] = [];

  const cpu = selectedComponents.cpu
    ? componentData.cpu?.find((c) => c.id === selectedComponents.cpu)
    : null;
  const motherboard = selectedComponents.motherboard
    ? componentData.motherboard?.find(
        (c) => c.id === selectedComponents.motherboard
      )
    : null;
  const gpu = selectedComponents.gpu
    ? componentData.gpu?.find((c) => c.id === selectedComponents.gpu)
    : null;
  const ram = selectedComponents.ram
    ? componentData.ram?.find((c) => c.id === selectedComponents.ram)
    : null;
  const pcCase = selectedComponents.case
    ? componentData.case?.find((c) => c.id === selectedComponents.case)
    : null;
  const psu = selectedComponents.psu
    ? componentData.psu?.find((c) => c.id === selectedComponents.psu)
    : null;
  const cooling = selectedComponents.cooling
    ? componentData.cooling?.find((c) => c.id === selectedComponents.cooling)
    : null;

  // CPU & Motherboard Socket Compatibility
  if (
    cpu &&
    motherboard &&
    cpu.socket &&
    motherboard.socket &&
    cpu.socket !== motherboard.socket
  ) {
    issues.push({
      severity: "critical",
      title: "CPU & Motherboard Socket Mismatch",
      description: `The ${cpu.name ?? "CPU"} uses ${
        cpu.socket
      } socket, but the ${motherboard.name ?? "Motherboard"} has ${
        motherboard.socket
      } socket. These components are not compatible.`,
      recommendation:
        "Please select a CPU and motherboard with matching sockets.",
      affectedComponents: [
        cpu.name ?? "CPU",
        motherboard.name ?? "Motherboard",
      ],
    });
  }

  // CPU & Motherboard Generation Compatibility
  if (
    cpu &&
    motherboard &&
    cpu.generation &&
    Array.isArray(motherboard.compatibility) &&
    !motherboard.compatibility.includes(cpu.generation)
  ) {
    issues.push({
      severity: "warning",
      title: "CPU Generation Compatibility",
      description: `The ${
        motherboard.name ?? "Motherboard"
      } may not fully support the ${cpu.name ?? "CPU"} without a BIOS update.`,
      recommendation:
        "Ensure the motherboard BIOS is updated to support this CPU generation.",
      affectedComponents: [
        cpu.name ?? "CPU",
        motherboard.name ?? "Motherboard",
      ],
    });
  }

  // RAM & Motherboard Compatibility
  if (ram && motherboard) {
    const ramType = ram.type;
    const boardSupport = motherboard.ramSupport;
    const ramSupported = !ramType
      ? true
      : Array.isArray(boardSupport)
      ? boardSupport.some((s) => typeof s === "string" && s.includes(ramType))
      : typeof boardSupport === "string"
      ? boardSupport.includes(ramType)
      : true; // unknown support shape => assume OK
    if (!ramSupported) {
      issues.push({
        severity: "critical",
        title: "RAM Type Incompatibility",
        description: `The ${motherboard.name} supports ${
          boardSupport || "(unknown)"
        }, but you've selected ${ramType || "(unspecified)"} memory.`,
        recommendation:
          "Select memory that matches the motherboard's supported type.",
        affectedComponents: [
          ram.name ?? "RAM",
          motherboard.name ?? "Motherboard",
        ],
      });
    }
  }

  // Motherboard & Case Form Factor
  if (
    motherboard &&
    pcCase &&
    motherboard.formFactor &&
    Array.isArray(pcCase.compatibility) &&
    !pcCase.compatibility.includes(motherboard.formFactor.toLowerCase())
  ) {
    issues.push({
      severity: "critical",
      title: "Motherboard & Case Size Mismatch",
      description: `The ${motherboard.name ?? "Motherboard"} (${
        motherboard.formFactor
      }) will not fit in the ${pcCase.name ?? "Case"} case.`,
      recommendation:
        "Select a case that supports your motherboard form factor.",
      affectedComponents: [
        motherboard.name ?? "Motherboard",
        pcCase.name ?? "Case",
      ],
    });
  }

  // GPU & Case Clearance
  if (
    gpu &&
    pcCase &&
    typeof gpu.length === "number" &&
    typeof pcCase.maxGpuLength === "number" &&
    gpu.length > pcCase.maxGpuLength
  ) {
    issues.push({
      severity: "critical",
      title: "GPU Too Large for Case",
      description: `The ${gpu.name ?? "GPU"} (${gpu.length}mm) exceeds the ${
        pcCase.name ?? "Case"
      } maximum GPU clearance (${pcCase.maxGpuLength}mm).`,
      recommendation: "Select a larger case or a more compact graphics card.",
      affectedComponents: [gpu.name ?? "GPU", pcCase.name ?? "Case"],
    });
  }

  // PSU Wattage Check
  if (cpu && gpu && psu) {
    const cpuTdp = typeof cpu.tdp === "number" ? cpu.tdp : 65;
    const gpuPower = typeof gpu.power === "number" ? gpu.power : 150;
    const estimatedPower = cpuTdp + gpuPower + 150; // Base system + peripherals
    const recommendedPower = Math.round(estimatedPower * 1.2); // 20% headroom

    if (typeof psu.wattage === "number" && psu.wattage < recommendedPower) {
      issues.push({
        severity: "warning",
        title: "Insufficient PSU Wattage",
        description: `Your system may consume up to ${Math.round(
          estimatedPower
        )}W, but the ${psu.name ?? "PSU"} only provides ${
          psu.wattage
        }W. We recommend ${recommendedPower}W for optimal performance.`,
        recommendation:
          "Consider upgrading to a higher wattage power supply for better efficiency and headroom.",
        affectedComponents: [
          cpu.name ?? "CPU",
          gpu.name ?? "GPU",
          psu.name ?? "PSU",
        ],
      });
    }
  }

  // CPU Cooler & Case Height Clearance
  if (
    cooling &&
    pcCase &&
    cooling.type === "Air" &&
    typeof cooling.height === "number" &&
    typeof pcCase.maxCpuCoolerHeight === "number" &&
    cooling.height > pcCase.maxCpuCoolerHeight
  ) {
    issues.push({
      severity: "critical",
      title: "CPU Cooler Too Tall",
      description: `The ${cooling.name ?? "Cooler"} (${
        cooling.height
      }mm) exceeds the ${pcCase.name ?? "Case"} maximum CPU cooler height (${
        pcCase.maxCpuCoolerHeight
      }mm).`,
      recommendation: "Select a lower profile cooler or a larger case.",
      affectedComponents: [cooling.name ?? "Cooler", pcCase.name ?? "Case"],
    });
  }

  // CPU Cooler TDP Support
  if (
    cpu &&
    cooling &&
    typeof cpu.tdp === "number" &&
    typeof cooling.tdpSupport === "number" &&
    cpu.tdp > cooling.tdpSupport
  ) {
    issues.push({
      severity: "warning",
      title: "CPU Cooler May Be Inadequate",
      description: `The ${cpu.name ?? "CPU"} has a ${cpu.tdp}W TDP, but the ${
        cooling.name ?? "Cooler"
      } is rated for ${cooling.tdpSupport}W.`,
      recommendation:
        "Consider a more powerful cooling solution for optimal temperatures.",
      affectedComponents: [cpu.name ?? "CPU", cooling.name ?? "Cooler"],
    });
  }

  // PSU & Case Length
  if (
    psu &&
    pcCase &&
    typeof psu.length === "number" &&
    typeof pcCase.maxPsuLength === "number" &&
    psu.length > pcCase.maxPsuLength
  ) {
    issues.push({
      severity: "critical",
      title: "PSU Too Long for Case",
      description: `The ${psu.name ?? "PSU"} (${psu.length}mm) exceeds the ${
        pcCase.name ?? "Case"
      } maximum PSU length (${pcCase.maxPsuLength}mm).`,
      recommendation: "Select a more compact power supply or a larger case.",
      affectedComponents: [psu.name ?? "PSU", pcCase.name ?? "Case"],
    });
  }

  return issues;
};

/**
 * Calculate total price of selected components
 */
export const calculateTotalPrice = (
  selectedComponents: SelectedComponentIds,
  componentData: ComponentDataMap
): number => {
  return Object.entries(selectedComponents).reduce((total, [category, id]) => {
    if (!id) return total;
    const component = componentData[category]?.find((c) => c.id === id);
    return total + (component?.price || 0);
  }, 0);
};

/**
 * Calculate estimated power consumption
 */
export const calculatePowerConsumption = (
  selectedComponents: SelectedComponentIds,
  componentData: ComponentDataMap
): number => {
  const cpu = selectedComponents.cpu
    ? componentData.cpu?.find((c) => c.id === selectedComponents.cpu)
    : null;
  const gpu = selectedComponents.gpu
    ? componentData.gpu?.find((c) => c.id === selectedComponents.gpu)
    : null;

  const cpuTdp = typeof cpu?.tdp === "number" ? cpu.tdp : 65;
  const gpuPower = typeof gpu?.power === "number" ? gpu.power : 150;
  const basePower = 150; // Base system + peripherals

  return cpuTdp + gpuPower + basePower;
};
