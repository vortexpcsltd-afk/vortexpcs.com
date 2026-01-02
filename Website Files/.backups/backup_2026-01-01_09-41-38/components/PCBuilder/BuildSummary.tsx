import React, { memo } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Eye, Plus, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { PriceTag } from "../ui/PriceTag";
import type {
  SelectedComponentIds,
  ComponentDataMap,
  RecommendedBuildSpec,
  CompatibilityIssue,
} from "./types";
import type { PCOptionalExtra } from "../../services/cms";

interface BuildSummaryProps {
  // Selected components
  selectedComponents: SelectedComponentIds;
  selectedPeripherals: Record<string, string[]>;
  componentData: ComponentDataMap;
  optionalExtrasData: Record<string, PCOptionalExtra[]>;

  // Build info
  totalPrice: number;
  selectedComponentsCount: number;
  compatibilityIssues: CompatibilityIssue[];
  recommendedBuild?: RecommendedBuildSpec | null;
  onViewBuildDetails?: () => void;
  getCategoryLabel: (category: string) => string;
  children?: React.ReactNode;
}

/**
 * BuildSummary - Displays selected components, total price, and action buttons
 * Extracted from PCBuilder.tsx (Priority 2.2: Component Size Reduction)
 */
export const BuildSummary = memo(
  ({
    selectedComponents,
    selectedPeripherals,
    componentData,
    optionalExtrasData,
    totalPrice,
    selectedComponentsCount,
    compatibilityIssues,
    recommendedBuild,
    onViewBuildDetails,
    getCategoryLabel,
    children,
  }: BuildSummaryProps) => {
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
                  <div className="text-lg font-bold text-green-300">
                    <PriceTag
                      price={recommendedBuild.price ?? 0}
                      size="md"
                      align="right"
                      showBadge={false}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  {recommendedBuild.name}
                </p>
                {onViewBuildDetails && (
                  <Button
                    onClick={onViewBuildDetails}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 hover:border-green-500/50"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Build Details
                  </Button>
                )}
              </div>
              <Separator className="border-white/10" />
            </>
          )}

          {/* Components Progress */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Components</span>
            <span className="text-white">{selectedComponentsCount}/8</span>
          </div>

          <Progress
            value={(selectedComponentsCount / 8) * 100}
            className="h-2"
          />

          <Separator className="border-white/10" />

          {/* Selected Components List */}
          <div className="space-y-2">
            {Object.entries(selectedComponents).map(
              ([category, componentId]) => {
                const component = componentData[
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
                    <PriceTag
                      price={component.price ?? 0}
                      reducedPrice={
                        typeof component.reducedPrice === "number" &&
                        component.reducedPrice < (component.price ?? 0)
                          ? component.reducedPrice
                          : undefined
                      }
                      size="sm"
                      align="right"
                    />
                  </div>
                ) : null;
              }
            )}

            {/* Peripherals */}
            {Object.entries(selectedPeripherals).map(([category, items]) => {
              if (!Array.isArray(items) || items.length === 0) return null;
              return items.map((itemId: string) => {
                const peripheral = optionalExtrasData[category]?.find(
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
                    <PriceTag
                      price={peripheral.price ?? 0}
                      reducedPrice={
                        typeof peripheral.reducedPrice === "number" &&
                        peripheral.reducedPrice < (peripheral.price ?? 0)
                          ? peripheral.reducedPrice
                          : undefined
                      }
                      size="sm"
                      align="right"
                    />
                  </div>
                ) : null;
              });
            })}
          </div>

          <Separator className="border-white/10" />

          {/* Total Price */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-white">Current Total</span>
            <div className="text-2xl font-bold">
              <PriceTag
                price={totalPrice}
                size="lg"
                align="right"
                showBadge={false}
              />
            </div>
          </div>

          {/* Price difference indicator */}
          {recommendedBuild && recommendedBuild.price && totalPrice > 0 && (
            <div
              className={`text-sm text-center p-2 rounded-lg ${
                totalPrice > recommendedBuild.price
                  ? "bg-red-500/10 text-red-300 border border-red-500/20"
                  : totalPrice < recommendedBuild.price
                  ? "bg-green-500/10 text-green-300 border border-green-500/20"
                  : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
              }`}
            >
              {totalPrice > recommendedBuild.price
                ? `+£${(
                    totalPrice - recommendedBuild.price
                  ).toLocaleString()} over budget`
                : totalPrice < recommendedBuild.price
                ? `£${(
                    recommendedBuild.price - totalPrice
                  ).toLocaleString()} under budget`
                : "Matches recommended budget"}
            </div>
          )}

          {/* Compatibility Status */}
          {compatibilityIssues.length > 0 && (
            <Alert className="border-yellow-500/20 bg-yellow-500/10">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                {compatibilityIssues.length} compatibility{" "}
                {compatibilityIssues.length === 1 ? "issue" : "issues"} detected
              </AlertDescription>
            </Alert>
          )}

          {/* Additional sections (environment, insights, etc.) */}
          {children}
        </div>
      </Card>
    );
  }
);

BuildSummary.displayName = "BuildSummary";
