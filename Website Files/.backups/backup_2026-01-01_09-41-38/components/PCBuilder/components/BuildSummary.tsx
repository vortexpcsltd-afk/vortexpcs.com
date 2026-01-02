import React from "react";
import type {
  PCOptionalExtra,
  RecommendedBuildSpec,
  ComponentDataMap,
} from "../types";
import { BuildSummaryCore, type BuildMetaResult } from "./BuildSummaryCore";
import {
  EnvironmentSettingsPanel,
  type Environment,
} from "./EnvironmentSettingsPanel";
import { BuildInsightsPanel } from "./BuildInsightsPanel";

/**
 * Props for BuildSummary orchestrator component
 */
interface BuildSummaryProps {
  /** Recommended build specification from PC Finder */
  recommendedBuild?: RecommendedBuildSpec | null;
  /** Currently selected component IDs by category */
  selectedComponents: Record<string, string>;
  /** Selected peripheral IDs grouped by category */
  selectedPeripherals: Record<string, string[]>;
  /** Available component data organized by category */
  activeComponentData: ComponentDataMap;
  /** Available optional extras/peripherals organized by category */
  activeOptionalExtrasData: Record<string, PCOptionalExtra[]>;
  /** Total calculated price of current build */
  getTotalPrice: number;
  /** Count of components selected (out of 8 required) */
  getSelectedComponentsCount: number;
  /** Environment settings (temperature, USB devices, monitor) */
  environment: Environment;
  /** Whether to show price tier labels (Budget/Mid-Range/Premium) */
  showPriceSubTierTag: boolean;
  /** Array of insight comment strings */
  generateBuildComments: string[];
  /** Function to generate build metadata */
  generateBuildMeta: () => BuildMetaResult;
  /** Setter for showing build details modal */
  setShowBuildDetailsModal: (show: boolean) => void;
  /** Setter for environment settings */
  setEnvironment: React.Dispatch<React.SetStateAction<Environment>>;
  /** Setter for price tier label visibility */
  setShowPriceSubTierTag: (show: boolean) => void;
  /** Setter for insight panel compact mode */
  setInsightCompactMode: (compact: boolean) => void;
  /** Current compact mode state */
  insightCompactMode: boolean;
  /** Function to get display label for component category */
  getCategoryLabel: (category: string) => string;
}

/**
 * BuildSummary - Orchestrator component that composes build summary sub-components
 *
 * This component combines three main sections:
 * 1. BuildSummaryCore - Displays pricing, component progress, and selected items
 * 2. EnvironmentSettingsPanel - User environment customization (temp, devices, monitor)
 * 3. BuildInsightsPanel - Kevin's Insight™ analysis and recommendations
 *
 * @component
 * @example
 * ```tsx
 * <BuildSummary
 *   recommendedBuild={recommendedBuild}
 *   selectedComponents={selectedComponents}
 *   selectedPeripherals={selectedPeripherals}
 *   getTotalPrice={getTotalPrice()}
 *   environment={environment}
 *   generateBuildComments={generateBuildComments()}
 *   generateBuildMeta={generateBuildMeta}
 *   // ... other props
 * />
 * ```
 */
export const BuildSummary: React.FC<BuildSummaryProps> = ({
  recommendedBuild,
  selectedComponents,
  selectedPeripherals,
  activeComponentData,
  activeOptionalExtrasData,
  getTotalPrice,
  getSelectedComponentsCount,
  environment,
  showPriceSubTierTag,
  generateBuildComments,
  generateBuildMeta,
  setShowBuildDetailsModal,
  setEnvironment,
  setShowPriceSubTierTag,
  setInsightCompactMode,
  insightCompactMode,
  getCategoryLabel,
}) => {
  return (
    <div className="space-y-6">
      {/* Build Summary Core: Price, components, total */}
      <BuildSummaryCore
        recommendedBuild={recommendedBuild}
        selectedComponents={selectedComponents}
        selectedPeripherals={selectedPeripherals}
        activeComponentData={activeComponentData}
        activeOptionalExtrasData={activeOptionalExtrasData}
        getTotalPrice={getTotalPrice}
        getSelectedComponentsCount={getSelectedComponentsCount}
        generateBuildMeta={generateBuildMeta}
        setShowBuildDetailsModal={setShowBuildDetailsModal}
        getCategoryLabel={getCategoryLabel}
      />

      {/* Environment Settings: Room, devices, monitor */}
      <EnvironmentSettingsPanel
        environment={environment}
        showPriceSubTierTag={showPriceSubTierTag}
        setEnvironment={setEnvironment}
        setShowPriceSubTierTag={setShowPriceSubTierTag}
      />

      {/* Build Insights: Kevin's Insight, analysis, actions */}
      <BuildInsightsPanel
        generateBuildComments={generateBuildComments}
        generateBuildMeta={generateBuildMeta}
        setInsightCompactMode={setInsightCompactMode}
        insightCompactMode={insightCompactMode}
        getSelectedComponentsCount={getSelectedComponentsCount}
      />
    </div>
  );
};
