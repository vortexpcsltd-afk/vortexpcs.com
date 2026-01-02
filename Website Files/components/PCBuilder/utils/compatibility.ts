/**
 * Compatibility Checking Utilities for PCBuilder
 * Handles all component compatibility validation logic
 */

import { logger } from "../../../services/logger";
import type {
  SelectedComponentIds,
  ComponentDataMap,
  CompatibilityIssue,
  AnyComponent,
  PCBuilderComponent,
} from "../types";

/**
 * Check compatibility between selected components
 * Validates socket compatibility, wattage requirements, physical constraints, etc.
 */
export const checkCompatibility = (
  selectedComponents: SelectedComponentIds,
  getById: (
    category: keyof ComponentDataMap,
    id?: string | null
  ) => AnyComponent | null
): CompatibilityIssue[] => {
  const issues: CompatibilityIssue[] = [];

  try {
    const cpu = getById(
      "cpu",
      selectedComponents.cpu
    ) as PCBuilderComponent | null;
    const motherboard = getById(
      "motherboard",
      selectedComponents.motherboard
    ) as PCBuilderComponent | null;
    const gpu = getById(
      "gpu",
      selectedComponents.gpu
    ) as PCBuilderComponent | null;
    const ram = getById(
      "ram",
      selectedComponents.ram
    ) as PCBuilderComponent | null;
    const pcCase = getById(
      "case",
      selectedComponents.case
    ) as PCBuilderComponent | null;
    const psu = getById(
      "psu",
      selectedComponents.psu
    ) as PCBuilderComponent | null;
    const cooling = getById(
      "cooling",
      selectedComponents.cooling
    ) as PCBuilderComponent | null;

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

    // CPU Generation Compatibility
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
        } may not fully support the ${
          cpu.name ?? "CPU"
        } without a BIOS update.`,
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

      // Support both string and string[] comparisons safely
      const ramSupported = (() => {
        if (!ramType) return true;
        const ramValues = Array.isArray(ramType) ? ramType : [ramType];
        if (Array.isArray(boardSupport)) {
          const supportValues = boardSupport.filter(
            (s): s is string => typeof s === "string"
          );
          return ramValues.some((rv) =>
            supportValues.some((sv) => sv.includes(rv))
          );
        }
        if (typeof boardSupport === "string") {
          return ramValues.some((rv) => boardSupport.includes(rv));
        }
        return true;
      })();

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
  } catch (error) {
    logger.error("Error checking compatibility", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Get compatibility issues for selected components
 * Returns array of compatibility issues or empty array if all compatible
 */
export const getCompatibilityIssues = (
  selectedComponents: SelectedComponentIds,
  getById: (
    category: keyof ComponentDataMap,
    id?: string | null
  ) => AnyComponent | null
): { critical: CompatibilityIssue[]; warnings: CompatibilityIssue[] } => {
  try {
    const allIssues = checkCompatibility(selectedComponents, getById);
    return {
      critical: allIssues.filter((issue) => issue.severity === "critical"),
      warnings: allIssues.filter((issue) => issue.severity === "warning"),
    };
  } catch (error) {
    logger.error("Error getting compatibility issues", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { critical: [], warnings: [] };
  }
};
