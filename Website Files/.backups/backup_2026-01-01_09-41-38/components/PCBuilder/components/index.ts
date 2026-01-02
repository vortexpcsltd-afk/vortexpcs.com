/**
 * PCBuilder Component Exports
 *
 * This directory contains extracted sub-components from PCBuilder.tsx.
 * Each component is independently manageable and follows the established
 * modular architecture pattern.
 *
 * Phase 6: Component Extraction Progress (COMPLETE)
 * - CategoryNav ✅ Extracted
 * - FilterPanel ✅ Extracted
 * - ComponentGrid ✅ Extracted
 * - SelectedBuildDisplay ✅ Extracted
 * - PeripheralsSection ✅ Extracted
 */

export { ComponentDetailModal } from "./ComponentDetailModal";
export { ComponentCard } from "./ComponentCard";
export { CategoryNav } from "./CategoryNav";
export { FilterPanel } from "./FilterPanel";
export { ComponentGrid } from "./ComponentGrid";
export { SelectedBuildDisplay } from "./SelectedBuildDisplay";
export { PeripheralsSection } from "./PeripheralsSection";
export { PeripheralCard } from "./PeripheralCard";
export { ComponentImageGallery } from "./ComponentImageGallery";
export { CompatibilityAlert } from "./CompatibilityAlert";
export { BuildDetailsModal } from "./BuildDetailsModal";
export {
  ComponentCardSkeleton,
  BuildSummarySkeleton,
  CategoryNavSkeleton,
} from "./SkeletonComponents";
export { BuildSummary } from "./BuildSummary";
export { BuildSummaryCore } from "./BuildSummaryCore";
export { EnvironmentSettingsPanel } from "./EnvironmentSettingsPanel";
export { BuildInsightsPanel } from "./BuildInsightsPanel";
// Lazy load remaining components as they are extracted
// export { SortingPanel } from "./SortingPanel";
// export { CompatibilityWarningPanel } from "./CompatibilityWarningPanel";
// export { InsightPanel } from "./InsightPanel";
