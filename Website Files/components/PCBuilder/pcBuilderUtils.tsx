import { Document } from "@contentful/rich-text-types";
import {
  documentToReactComponents,
  Options,
} from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES as _INLINES } from "@contentful/rich-text-types";
import DOMPurify from "dompurify";
import React from "react";

// Types
export interface ComparisonComponent {
  name?: string;
  price: number;
  cores?: number;
  tdp?: number;
  vram?: number;
}

export interface RecommendedBuildSpec {
  name?: string;
  description?: string;
  price?: number;
  specs?: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    psu?: string;
    cooling?: string;
    case?: string;
  };
  [key: string]: unknown;
}

export interface CompatibilityIssue {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  recommendation: string;
  affectedComponents: string[];
}

// Rich Text rendering options for Contentful Rich Text fields
export const richTextRenderOptions: Options = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node, children) => (
      <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
    ),
    [BLOCKS.HEADING_1]: (_node, children) => (
      <h1 className="text-2xl font-bold mb-4 text-sky-300">{children}</h1>
    ),
    [BLOCKS.HEADING_2]: (_node, children) => (
      <h2 className="text-xl font-bold mb-3 text-sky-300">{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (_node, children) => (
      <h3 className="text-lg font-bold mb-2 text-sky-300">{children}</h3>
    ),
    [BLOCKS.UL_LIST]: (_node, children) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300">
        {children}
      </ul>
    ),
    [BLOCKS.OL_LIST]: (_node, children) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300">
        {children}
      </ol>
    ),
    [BLOCKS.LIST_ITEM]: (_node, children) => (
      <li className="ml-2">{children}</li>
    ),
    [BLOCKS.QUOTE]: (_node, children) => (
      <blockquote className="border-l-4 border-sky-500 pl-4 italic mb-4 text-gray-300">
        {children}
      </blockquote>
    ),
    [BLOCKS.HR]: () => <hr className="my-6 border-white/10" />,
  },
  renderMark: {
    code: (text) => (
      <code className="bg-slate-900/50 px-2 py-1 rounded font-mono text-sm text-sky-300 break-words">
        {text}
      </code>
    ),
  },
  renderText: (text) => {
    // Use DOMPurify to sanitize HTML in text nodes
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  },
};

/**
 * Convert any component type to a standardized ComparisonComponent format
 * Used for building price comparisons and synergy calculations
 */
export const toComparisonComponent = (
  c: unknown | undefined
): ComparisonComponent => {
  const cc = c as Record<string, unknown> | undefined;
  const hasMsrp = cc && "msrp" in cc;
  const priceCandidate =
    typeof cc?.price === "number"
      ? cc?.price
      : hasMsrp && typeof (cc as { msrp?: number }).msrp === "number"
      ? (cc as { msrp?: number }).msrp
      : undefined;
  return {
    name: cc?.name,
    price: typeof priceCandidate === "number" ? priceCandidate : 0,
    cores: cc?.cores,
    tdp: cc?.tdp,
    vram: cc?.vram,
  };
};

/**
 * Render Contentful Rich Text content to React components
 * Handles both string and Document types with proper sanitization
 */
export const renderRichText = (
  content: string | Document | null | undefined
): React.ReactNode => {
  if (!content) return null;

  if (typeof content === "string") {
    // If it's a string, render it as plain text with sanitization
    return (
      <p className="text-gray-300">
        {DOMPurify.sanitize(content, { ALLOWED_TAGS: [] })}
      </p>
    );
  }

  // If it's a Document, use Contentful's renderer
  try {
    return documentToReactComponents(content, richTextRenderOptions);
  } catch (error) {
    console.error("Error rendering rich text:", error);
    return null;
  }
};

/**
 * Format a number as currency with GBP symbol
 */
export const formatPrice = (price: number | undefined): string => {
  if (!price) return "£0.00";
  return `£${price.toFixed(2)}`;
};

/**
 * Calculate total system power requirement based on component TDP values
 */
export const calculateSystemPower = (
  cpuTdp: number = 65,
  gpuPower: number = 150
): { estimated: number; recommended: number } => {
  const basePower = 150; // Base system power
  const estimated = cpuTdp + gpuPower + basePower;
  const recommended = Math.round(estimated * 1.2); // 20% headroom
  return { estimated, recommended };
};

/**
 * Check if a value is within a safe range (used for PSU wattage checks)
 */
export const isWithinRange = (
  value: number | undefined,
  minValue: number | undefined,
  maxValue: number | undefined
): boolean => {
  if (!value || !minValue || !maxValue) return true;
  return value >= minValue && value <= maxValue;
};

/**
 * Extract dimension data from component safely
 */
export const getDimensionValue = (
  value: unknown,
  defaultValue: number = 0
): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};
