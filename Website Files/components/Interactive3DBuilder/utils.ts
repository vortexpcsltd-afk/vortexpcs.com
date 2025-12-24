/**
 * Interactive3DBuilder utility functions
 * Helper functions for 3D calculations and component management
 */

import { PCComponent, SelectedComponents } from "./types";

/**
 * Calculate default positions for components based on case type
 * Mid-tower layout (standard case):
 * - Motherboard: Back panel
 * - GPU: Right side (horizontal slot)
 * - Cooler: Center top
 * - RAM: Center (vertical slots)
 * - Storage: Front bottom
 * - PSU: Bottom rear
 */
export const getDefaultComponentPositions = (
  caseType:
    | "mid-tower"
    | "full-tower"
    | "mini-itx"
    | "atx"
    | "e-atx" = "mid-tower"
): Record<string, [number, number, number]> => {
  // Mid-tower positioning (most common)
  const midTowerPositions: Record<string, [number, number, number]> = {
    motherboard: [0, -0.05, 0.08], // Back panel, slightly lower
    gpu: [-0.05, 0.21, -0.1], // GPU positioned with finalized coordinates
    cooler: [-0.05, 0.15, 0], // Center, mounted on CPU socket
    ram: [-0.018, 0.325, -0.08], // RAM positioned with finalized coordinates (averaged X position)
    storage: [0.1, -0.12, 0], // Front bay area, lower
    psu: [-0.15, -0.15, -0.1], // Bottom rear corner
    case: [0, 0, 0], // Centered reference point
  };

  // Adjust based on case size
  switch (caseType) {
    case "full-tower":
      return {
        ...midTowerPositions,
        gpu: [0.15, 0, 0], // More space for larger cards
        psu: [-0.18, -0.18, -0.12],
        cooler: [-0.05, 0.2, 0], // Taller case
      };
    case "mini-itx":
      return {
        ...midTowerPositions,
        gpu: [0.08, 0, 0], // Compact spacing
        psu: [-0.12, -0.12, -0.08],
        cooler: [-0.05, 0.12, 0], // Lower clearance
      };
    default:
      return midTowerPositions;
  }
};

/**
 * Validate component compatibility
 * @returns { isCompatible: boolean, warnings: string[] }
 */
export const validateBuildCompatibility = (
  components: SelectedComponents
): { isCompatible: boolean; warnings: string[] } => {
  const warnings: string[] = [];

  // Check GPU length vs case type
  if (components.gpu?.specs?.length) {
    if (components.gpu.specs.length > 330) {
      warnings.push("GPU may not fit in mid-tower case");
    }
  }

  // Check power supply adequacy
  if (components.psu) {
    let estimatedPower = 0;
    if (components.gpu?.specs?.tdp) estimatedPower += components.gpu.specs.tdp;
    if (components.cooler?.specs?.tdp)
      estimatedPower += components.cooler.specs.tdp;

    // Estimate PSU wattage from name (simple regex)
    const psuMatch = components.psu.name.match(/(\d{3,4})W/i);
    if (psuMatch) {
      const psuWattage = parseInt(psuMatch[1]);
      // Generally want 20-30% headroom
      if (estimatedPower * 1.3 > psuWattage) {
        warnings.push(
          `PSU may be undersized (estimated need: ${Math.ceil(
            estimatedPower * 1.3
          )}W)`
        );
      }
    }
  }

  // Check for empty essential components
  if (!components.gpu) warnings.push("No GPU selected");
  if (components.ram.length === 0) warnings.push("No RAM selected");
  if (!components.psu) warnings.push("No Power Supply selected");

  return {
    isCompatible: warnings.length === 0,
    warnings,
  };
};

/**
 * Calculate build statistics
 */
export const calculateBuildStats = (
  components: SelectedComponents
): {
  totalPower: number;
  totalCost: number;
  componentCount: number;
} => {
  let totalPower = 0;
  let totalCost = 0;
  let componentCount = 0;

  // Count components
  if (components.gpu) componentCount++;
  if (components.cooler) componentCount++;
  if (components.motherboard) componentCount++;
  if (components.psu) componentCount++;
  componentCount += components.ram.length;
  componentCount += components.storage.length;
  componentCount += components.fans.length;

  // Estimate power
  if (components.gpu?.specs?.tdp) totalPower += components.gpu.specs.tdp;
  if (components.cooler?.specs?.tdp) totalPower += components.cooler.specs.tdp;
  totalPower += 100; // Base system power

  return {
    totalPower,
    totalCost,
    componentCount,
  };
};

/**
 * Export 3D view as data URL
 * Used for generating preview images
 */
export const generatePreviewImage = async (
  canvasElement: HTMLCanvasElement
): Promise<string> => {
  return canvasElement.toDataURL("image/png");
};

/**
 * Create cable route between two components
 */
export const createCableRoute = (
  fromId: string,
  toId: string,
  type: "power" | "data" | "sata" = "data"
) => {
  return {
    id: `cable-${fromId}-${toId}`,
    from: fromId,
    to: toId,
    type,
    points: [],
  };
};

/**
 * Get component color based on type
 */
export const getComponentColor = (type: string): string => {
  const colors: Record<string, string> = {
    gpu: "#0ea5e9",
    cooler: "#10b981",
    ram: "#4f46e5",
    storage: "#f59e0b",
    psu: "#ef4444",
    motherboard: "#8b5cf6",
    case: "#1f2937",
  };
  return colors[type] || "#6b7280";
};

/**
 * Format component name for display
 */
export const formatComponentName = (
  component: PCComponent | null | undefined
): string => {
  if (!component) return "N/A";
  return component.name.split(" ").slice(0, 3).join(" ");
};
