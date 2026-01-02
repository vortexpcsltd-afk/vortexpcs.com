import React from "react";
import { Eye, Plus } from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Separator } from "../../ui/separator";
import type {
  PCOptionalExtra,
  RecommendedBuildSpec,
  ComponentDataMap,
} from "../types";

/**
 * BuildMetaResult - Metadata for build analysis
 *
 * Contains aggregate information about a PC build including pricing,
 * component count, and synergy analysis results.
 */
export interface BuildMetaResult {
  /** Total price of all selected components and peripherals */
  totalPrice: number;
  /** Number of core components selected (out of 8 required) */
  componentCount: number;
  /** Synergy grade (A-F) from Kevin's Insight™ analysis */
  synergyGrade?: string;
  /** Build profile category (e.g., "Balanced Gaming", "Workstation") */
  profile?: string;
  /** Alternative grade format */
  grade?: string;
  /** Numeric score (0-100) for build quality */
  score?: number;
}

/**
 * BuildSummaryCore - Displays build pricing summary and component progress
 *
 * Features:
 * - Recommended build price badge with "View Details" button
 * - Component progress bar (X/8 components selected)
 * - List of selected components with prices
 * - List of selected peripherals with green "+" indicators
 * - Total price display with gradient styling
 * - Budget comparison indicator (over/under/matches recommended price)
 *
 * @component
 * @example
 * ```tsx
 * <BuildSummaryCore
 *   recommendedBuild={recommendedBuild}
 *   selectedComponents={selectedComponents}
 *   selectedPeripherals={selectedPeripherals}
 *   activeComponentData={componentData}
 *   activeOptionalExtrasData={peripheralData}
 *   getTotalPrice={1299.99}
 *   getSelectedComponentsCount={6}
 *   generateBuildMeta={() => ({ totalPrice: 1299.99, componentCount: 6 })}
 *   setShowBuildDetailsModal={setShowModal}
 *   getCategoryLabel={(cat) => cat.toUpperCase()}
 * />
 * ```
 */
interface BuildSummaryCoreProps {
  /** Recommended build specification from PC Finder */
  recommendedBuild?: RecommendedBuildSpec | null;
  /** Map of category → selected component ID */
  selectedComponents: Record<string, string>;
  /** Map of category → array of selected peripheral IDs */
  selectedPeripherals: Record<string, string[]>;
  /** Component data indexed by category */
  activeComponentData: ComponentDataMap;
  /** Peripheral data indexed by category */
  activeOptionalExtrasData: Record<string, PCOptionalExtra[]>;
  /** Total price of all selected items */
  getTotalPrice: number;
  /** Count of selected core components (0-8) */
  getSelectedComponentsCount: number;
  /** Function to generate build metadata */
  generateBuildMeta: () => BuildMetaResult;
  /** Function to show/hide build details modal */
  setShowBuildDetailsModal: (show: boolean) => void;
  /** Function to get human-readable category label */
  getCategoryLabel: (category: string) => string;
}

export const BuildSummaryCore: React.FC<BuildSummaryCoreProps> = ({
  recommendedBuild,
  selectedComponents,
  selectedPeripherals,
  activeComponentData,
  activeOptionalExtrasData,
  getTotalPrice,
  getSelectedComponentsCount,
  _generateBuildMeta,
  setShowBuildDetailsModal,
  getCategoryLabel,
}) => {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
        Build Summary
      </h3>

      <div className="space-y-4">
        {/* Recommended Build Price */}
        {recommendedBuild && (
          <>
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-green-300 font-medium">
                  Recommended Build
                </span>
                <span className="text-lg font-bold text-green-300">
                  £{(recommendedBuild.price ?? 0).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {recommendedBuild.name}
              </p>
              <Button
                onClick={() => setShowBuildDetailsModal(true)}
                className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 hover:border-green-500/50"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Build Details
              </Button>
            </div>
            <Separator className="border-white/10" />
          </>
        )}

        {/* Component Progress */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Components</span>
          <span className="text-white">{getSelectedComponentsCount}/8</span>
        </div>

        <Progress
          value={(getSelectedComponentsCount / 8) * 100}
          className="h-2"
        />

        <Separator className="border-white/10" />

        {/* Selected Components List */}
        <div className="space-y-2">
          {Object.entries(selectedComponents).map(([category, componentId]) => {
            const component = activeComponentData[
              category as keyof ComponentDataMap
            ]?.find((c) => c.id === componentId);
            return component ? (
              <div
                key={category}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">
                    {getCategoryLabel(category)}
                  </span>
                  <span className="text-white font-medium truncate max-w-32">
                    {component.name}
                  </span>
                </div>
                <span className="text-white font-medium">
                  £{(component.price ?? 0).toFixed(2)}
                </span>
              </div>
            ) : null;
          })}

          {/* Peripherals */}
          {Object.entries(selectedPeripherals).map(([category, items]) => {
            if (!Array.isArray(items) || items.length === 0) return null;
            return items.map((itemId: string) => {
              const peripheral = activeOptionalExtrasData[category]?.find(
                (p) => p.id === itemId
              );
              return peripheral ? (
                <div
                  key={`${category}-${itemId}`}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-green-400 text-xs flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      {getCategoryLabel(category)}
                    </span>
                    <span className="text-white font-medium truncate max-w-32">
                      {peripheral.name}
                    </span>
                  </div>
                  <span className="text-white font-medium">
                    £{(peripheral.price ?? 0).toFixed(2)}
                  </span>
                </div>
              ) : null;
            });
          })}
        </div>

        <Separator className="border-white/10" />

        {/* Total Price */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-white">Current Total</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
            £{getTotalPrice.toLocaleString()}
          </span>
        </div>

        {/* Price Difference Indicator */}
        {recommendedBuild && recommendedBuild.price && getTotalPrice > 0 && (
          <div
            className={`text-sm text-center p-2 rounded-lg ${
              getTotalPrice > recommendedBuild.price
                ? "bg-red-500/10 text-red-300 border border-red-500/20"
                : getTotalPrice < recommendedBuild.price
                ? "bg-green-500/10 text-green-300 border border-green-500/20"
                : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
            }`}
          >
            {getTotalPrice > recommendedBuild.price
              ? `+£${(
                  getTotalPrice - recommendedBuild.price
                ).toLocaleString()} over budget`
              : getTotalPrice < recommendedBuild.price
              ? `£${(
                  recommendedBuild.price - getTotalPrice
                ).toLocaleString()} under budget`
              : "Matches recommended budget"}
          </div>
        )}
      </div>
    </Card>
  );
};
