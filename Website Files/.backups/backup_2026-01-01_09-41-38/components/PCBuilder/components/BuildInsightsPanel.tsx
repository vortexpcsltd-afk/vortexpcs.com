import React, { useState } from "react";
import {
  Copy,
  Minimize2,
  Maximize2,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { Alert, AlertDescription } from "../../ui/alert";
import { logger } from "../../../services/logger";

export interface BuildMetaResult {
  totalPrice: number;
  componentCount: number;
  synergyGrade?: string;
  profile?: string;
  grade?: string;
  score?: number;
}

/**
 * Props for BuildInsightsPanel component
 */
interface BuildInsightsPanelProps {
  /** Array of insight comment strings to display */
  generateBuildComments: string[];
  /** Function that returns build metadata including synergy grade and profile */
  generateBuildMeta: () => BuildMetaResult;
  /** Setter for toggling compact/expanded mode */
  setInsightCompactMode: (compact: boolean) => void;
  /** Current compact mode state */
  insightCompactMode: boolean;
  /** Number of selected components (minimum 3 required to show insights) */
  getSelectedComponentsCount: number;
}

const GRADE_CLASS_MAP: Record<string, string> = {
  A: "bg-green-500/20 border-green-500/40 text-green-200",
  B: "bg-emerald-500/20 border-emerald-500/40 text-emerald-200",
  C: "bg-amber-500/20 border-amber-500/40 text-amber-200",
  D: "bg-orange-500/20 border-orange-500/40 text-orange-200",
  E: "bg-red-500/20 border-red-500/40 text-red-200",
  F: "bg-red-700/30 border-red-700/50 text-red-100",
};

/**
 * BuildInsightsPanel - Displays Kevin's Insight™ analysis with synergy grading and build recommendations
 *
 * Features:
 * - Synergy grade display (A-F) with color-coded badges
 * - Build profile categorization (Gaming Powerhouse, Workstation, etc.)
 * - Basic and advanced insight comments with filtering
 * - Copy summary to clipboard functionality
 * - Compact/expanded mode toggle
 * - Standard/Pro detail mode toggle
 *
 * @component
 * @example
 * ```tsx
 * <BuildInsightsPanel
 *   generateBuildComments={comments}
 *   generateBuildMeta={() => ({ grade: 'A', score: 95, profile: 'Gaming' })}
 *   setInsightCompactMode={setCompact}
 *   insightCompactMode={false}
 *   getSelectedComponentsCount={5}
 * />
 * ```
 */
export const BuildInsightsPanel: React.FC<BuildInsightsPanelProps> = ({
  generateBuildComments,
  generateBuildMeta,
  setInsightCompactMode,
  insightCompactMode,
  getSelectedComponentsCount,
}) => {
  // Internal state for UI controls
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(false);
  const [insightMode, setInsightMode] = useState<"standard" | "pro">(
    "standard"
  );
  if (getSelectedComponentsCount < 3 || generateBuildComments.length === 0) {
    return null;
  }

  const all = generateBuildComments;
  const meta = generateBuildMeta();
  const basic = all.filter((c) => !c.startsWith("ADV:"));
  const advanced = all
    .filter((c) => c.startsWith("ADV:"))
    .map((c) => c.replace(/^ADV:\s*/, "").replace(/^ADV:/, ""));
  const basicLimit =
    insightMode === "standard" ? Math.min(5, basic.length) : basic.length;
  const gradeClass = GRADE_CLASS_MAP[meta.grade || "F"] || GRADE_CLASS_MAP.F;

  const copyInsightSummary = async () => {
    const summaryText =
      `Kevin's Insight - ${meta.profile}\n` +
      `Synergy Grade: ${meta.grade} (${meta.score}/100)\n\n` +
      basic.slice(0, basicLimit).join("\n\n") +
      (showAdvancedInsights && advanced.length > 0
        ? `\n\nAdvanced Analysis:\n${advanced.join("\n\n")}`
        : "");

    try {
      await navigator.clipboard.writeText(summaryText);
      logger.info("Copied to clipboard", {
        context: "KevinInsight",
        profile: meta.profile,
      });
    } catch (err) {
      logger.error("Failed to copy Kevin insight", {
        error: err,
        profile: meta.profile,
      });
    }
  };

  return (
    <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white text-sm">
            Kevin's Insight
          </span>
          <Badge className={`text-xs font-bold ${gradeClass}`}>
            Grade {meta.grade} ({meta.score}/100)
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="col-span-1 sm:col-span-2 h-8 sm:h-9 text-xs sm:text-sm font-medium border-sky-500/40 bg-gradient-to-r from-sky-500/10 to-blue-500/10 text-sky-200 hover:from-sky-500/20 hover:to-blue-500/20 hover:border-sky-400/60 transition-all"
                  onClick={copyInsightSummary}
                >
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                  Copy Summary
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Copy full insight to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                  onClick={() =>
                    setInsightMode(
                      insightMode === "standard" ? "pro" : "standard"
                    )
                  }
                >
                  {insightMode === "standard" ? (
                    <Zap className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {insightMode === "standard"
                    ? "Show all insights"
                    : "Show top 5 only"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {advanced.length > 0 && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10"
                    onClick={() =>
                      setShowAdvancedInsights(!showAdvancedInsights)
                    }
                  >
                    {showAdvancedInsights ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">
                    {showAdvancedInsights ? "Hide" : "Show"} technical details (
                    {advanced.length})
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm font-medium border-sky-500/40 bg-gradient-to-r from-sky-500/10 to-blue-500/10 text-sky-200 hover:from-sky-500/20 hover:to-blue-500/20 hover:border-sky-400/60 transition-all"
                  onClick={() => setInsightCompactMode(!insightCompactMode)}
                >
                  {insightCompactMode ? (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Expand Insight
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Compact View
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {insightCompactMode
                    ? "Show full analysis"
                    : "Hide detailed analysis"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Build Profile */}
      {meta.profile && (
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <p className="text-sm text-purple-300">
            <span className="font-semibold">Profile:</span> {meta.profile}
          </p>
        </div>
      )}

      {/* Basic Comments */}
      <div className="space-y-2">
        {basic.slice(0, basicLimit).map((comment, idx) => (
          <Alert key={idx} className="bg-white/5 border-white/10">
            <AlertDescription className="text-sm text-gray-300">
              {comment}
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Advanced Section */}
      {showAdvancedInsights && advanced.length > 0 && (
        <div className={`space-y-2 ${insightCompactMode ? "hidden" : "block"}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-400">
              Advanced Analysis
            </span>
          </div>
          {advanced.map((comment, idx) => (
            <Alert
              key={idx}
              className="bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
            >
              <AlertDescription className="text-sm">{comment}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Show more indicator */}
      {insightMode === "standard" && basic.length > basicLimit && (
        <p className="text-xs text-gray-500 text-center">
          +{basic.length - basicLimit} more insights available
        </p>
      )}
    </div>
  );
};
