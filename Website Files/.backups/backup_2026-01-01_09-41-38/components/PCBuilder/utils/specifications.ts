/**
 * Specifications Utilities for PCBuilder
 * Handles component specifications display and formatting
 */

import { logger } from "../../../services/logger";
import type { AnyComponent, PCBuilderComponent } from "../types";

/**
 * Get readable specifications from a component
 */
export const getComponentSpecs = (
  component: AnyComponent | null | undefined
): Record<string, string | number | boolean> => {
  try {
    if (!component) return {};

    // Cast to full component type to access all properties
    const comp = component as PCBuilderComponent;
    const specs: Record<string, string | number | boolean> = {};

    // CPU Specifications
    if (comp.cores) specs["Cores"] = comp.cores;
    if (comp.threads) specs["Threads"] = comp.threads;
    if (comp.baseClockGhz) specs["Base Clock"] = `${comp.baseClockGhz} GHz`;
    if (comp.boostClockGhz) specs["Boost Clock"] = `${comp.boostClockGhz} GHz`;
    if (comp.tdp) specs["TDP"] = `${comp.tdp}W`;
    if (comp.cache) specs["Cache"] = String(comp.cache);
    if (comp.socket) specs["Socket"] = comp.socket;

    // GPU Specifications
    if (comp.vram) specs["VRAM"] = `${comp.vram}GB`;
    if (comp.vramType) specs["VRAM Type"] = String(comp.vramType);
    if (comp.cudaCores) specs["CUDA Cores"] = comp.cudaCores;
    if (comp.boostClockMhz) specs["Boost Clock"] = `${comp.boostClockMhz} MHz`;
    if (comp.memory) specs["Memory"] = String(comp.memory);

    // Motherboard Specifications
    if (comp.socket) specs["Socket"] = comp.socket;
    if (comp.chipset) specs["Chipset"] = comp.chipset;
    if (comp.formFactor) specs["Form Factor"] = comp.formFactor;
    if (comp.ramSlots) specs["RAM Slots"] = comp.ramSlots;
    if (comp.ramSupport)
      specs["RAM Support"] = Array.isArray(comp.ramSupport)
        ? comp.ramSupport.join(", ")
        : comp.ramSupport;
    if (comp.maxRam) specs["Max RAM"] = `${comp.maxRam}GB`;

    // RAM Specifications
    if (comp.speed) specs["Speed"] = comp.speed;
    if (comp.capacity) specs["Capacity"] = `${comp.capacity}GB`;
    if (comp.modules) specs["Modules"] = comp.modules;
    if (comp.latency) specs["Latency"] = `${comp.latency}CAS`;
    if (comp.voltage) specs["Voltage"] = `${comp.voltage}V`;

    // Storage Specifications
    if (comp.capacity) specs["Capacity"] = `${comp.capacity}GB`;
    if (comp.type) specs["Type"] = comp.type;
    if (comp.interface) specs["Interface"] = comp.interface;
    if (comp.readSpeed) specs["Read Speed"] = `${comp.readSpeed}MB/s`;
    if (comp.writeSpeed) specs["Write Speed"] = `${comp.writeSpeed}MB/s`;

    // Case Specifications
    if (comp.formFactor) specs["Form Factor"] = comp.formFactor;
    if (comp.color || comp.colour)
      specs["Color"] = (comp.color || comp.colour) as string;
    if (comp.maxGpuLength) specs["Max GPU Length"] = `${comp.maxGpuLength}mm`;
    if (comp.maxCpuCoolerHeight)
      specs["Max Cooler Height"] = `${comp.maxCpuCoolerHeight}mm`;
    if (comp.maxPsuLength) specs["Max PSU Length"] = `${comp.maxPsuLength}mm`;

    // PSU Specifications
    if (comp.wattage) specs["Wattage"] = `${comp.wattage}W`;
    if (comp.efficiency) specs["Efficiency"] = comp.efficiency;
    if (comp.modular) specs["Modular"] = comp.modular ? "Yes" : "No";

    // Cooler Specifications
    if (comp.coolerType) specs["Type"] = comp.coolerType;
    if (comp.tdpSupport) specs["TDP Support"] = `${comp.tdpSupport}W`;
    if (comp.height) specs["Height"] = `${comp.height}mm`;
    if (comp.socket) specs["Sockets"] = comp.socket;

    // Generic/Universal Specifications
    if (comp.brand) specs["Brand"] = comp.brand;
    if (comp.model) specs["Model"] = comp.model;

    return specs;
  } catch (error) {
    logger.error("Error getting component specs", {
      error: error instanceof Error ? error.message : String(error),
      componentId: component?.id,
    });
    return {};
  }
};

/**
 * Format a spec value for display
 */
export const formatSpecValue = (value: unknown): string => {
  try {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return value.toString();
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(", ");
    return JSON.stringify(value);
  } catch (error) {
    logger.error("Error formatting spec value", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "N/A";
  }
};

/**
 * Compare specifications between two components
 */
export const compareComponentSpecs = (
  component1: AnyComponent | null | undefined,
  component2: AnyComponent | null | undefined
): {
  common: Record<string, [unknown, unknown]>;
  different: Record<string, [unknown, unknown]>;
} => {
  try {
    const specs1 = getComponentSpecs(component1);
    const specs2 = getComponentSpecs(component2);

    const common: Record<string, [unknown, unknown]> = {};
    const different: Record<string, [unknown, unknown]> = {};

    // Get all unique keys
    const allKeys = new Set([...Object.keys(specs1), ...Object.keys(specs2)]);

    allKeys.forEach((key) => {
      const val1 = specs1[key];
      const val2 = specs2[key];

      if (val1 === val2) {
        common[key] = [val1, val2];
      } else {
        different[key] = [val1 || "N/A", val2 || "N/A"];
      }
    });

    return { common, different };
  } catch (error) {
    logger.error("Error comparing component specs", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { common: {}, different: {} };
  }
};

/**
 * Get price breakdown for a component (original vs reduced)
 */
export const getPriceBreakdown = (
  component: AnyComponent | null | undefined
): { original: number; reduced: number | null; savings: number } => {
  try {
    const original = component?.price || 0;
    const reduced = component?.reducedPrice || null;
    const savings = reduced ? original - reduced : 0;

    return {
      original,
      reduced,
      savings,
    };
  } catch (error) {
    logger.error("Error getting price breakdown", {
      error: error instanceof Error ? error.message : String(error),
      componentId: component?.id,
    });
    return { original: 0, reduced: null, savings: 0 };
  }
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = "USD"
): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch (error) {
    logger.error("Error formatting currency", {
      error: error instanceof Error ? error.message : String(error),
      amount,
      currency,
    });
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Check if a component is in stock
 */
export const isComponentInStock = (
  component: AnyComponent | null | undefined
): boolean => {
  if (!component) return false;
  if (component.inStock === false) return false;
  if (component.stockLevel !== undefined && component.stockLevel <= 0)
    return false;
  return true;
};

/**
 * Get component rating/review summary
 */
export const getComponentRating = (
  component: AnyComponent | null | undefined
): { rating: number; reviews: number; percentage: number } => {
  try {
    const comp = component as PCBuilderComponent | undefined;
    const rating = comp?.rating || 0;
    const reviews = (comp?.reviews as number) || 0;
    const percentage = Math.round(rating * 20); // Convert 0-5 scale to 0-100

    return { rating, reviews, percentage };
  } catch (error) {
    logger.error("Error getting component rating", {
      error: error instanceof Error ? error.message : String(error),
      componentId: component?.id,
    });
    return { rating: 0, reviews: 0, percentage: 0 };
  }
};
