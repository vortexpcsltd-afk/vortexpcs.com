import { memo, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  AlertCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Info,
  Maximize2,
  Minimize2,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { logger } from "../../services/logger";
import type { ComponentDataMap, SelectedComponentIds } from "../PCBuilder";

type BuildMeta = { grade: string; score: number; profile: string };

interface InsightsPanelProps {
  comments: string[];
  getMeta: () => BuildMeta;
  insightMode: "standard" | "pro";
  setInsightMode: Dispatch<SetStateAction<"standard" | "pro">>;
  showAdvancedInsights: boolean;
  setShowAdvancedInsights: Dispatch<SetStateAction<boolean>>;
  insightCompactMode: boolean;
  setInsightCompactMode: Dispatch<SetStateAction<boolean>>;
  selectedComponents: SelectedComponentIds;
  activeComponentData: ComponentDataMap;
  getSelectedComponentsCount: number;
}

const getFPSTier = (
  selectedComponents: SelectedComponentIds,
  activeComponentData: ComponentDataMap
) => {
  const gpu = selectedComponents.gpu
    ? activeComponentData.gpu?.find((g) => g.id === selectedComponents.gpu)
    : null;

  if (!gpu || !gpu.name) return null;

  const gpuName = gpu.name.toLowerCase();
  const vram = gpu.vram || 0;

  if (gpuName.includes("5090") || gpuName.includes("5080")) {
    return {
      tier: "Extreme",
      fps: "8K 60+ FPS / 4K 240+ FPS",
      color: "purple",
    } as const;
  }

  if (
    gpuName.includes("4090") ||
    gpuName.includes("4080") ||
    (gpuName.includes("4070") && gpuName.includes("ti super"))
  ) {
    return { tier: "Ultra", fps: "4K 120+ FPS", color: "emerald" } as const;
  }

  if (
    gpuName.includes("4070") ||
    gpuName.includes("7900 xtx") ||
    gpuName.includes("7900xtx")
  ) {
    return { tier: "High", fps: "1440p 144+ FPS", color: "sky" } as const;
  }

  if (
    gpuName.includes("4060") ||
    gpuName.includes("7800") ||
    gpuName.includes("7700")
  ) {
    return { tier: "Medium", fps: "1080p 144 FPS", color: "blue" } as const;
  }

  if (vram >= 20) {
    return {
      tier: "Extreme",
      fps: "8K 60+ FPS / 4K 240+ FPS",
      color: "purple",
    } as const;
  }
  if (vram >= 16) {
    return { tier: "Ultra", fps: "4K 120+ FPS", color: "emerald" } as const;
  }
  if (vram >= 12) {
    return { tier: "High", fps: "1440p 144+ FPS", color: "sky" } as const;
  }
  if (vram >= 8) {
    return { tier: "Medium", fps: "1080p 144 FPS", color: "blue" } as const;
  }

  return { tier: "Entry", fps: "1080p 60 FPS", color: "cyan" } as const;
};

export const InsightsPanel = memo(function InsightsPanel({
  comments,
  getMeta,
  insightMode,
  setInsightMode,
  showAdvancedInsights,
  setShowAdvancedInsights,
  insightCompactMode,
  setInsightCompactMode,
  selectedComponents,
  activeComponentData,
  getSelectedComponentsCount,
}: InsightsPanelProps) {
  const meta = useMemo(() => getMeta(), [getMeta]);

  const { basic, advanced } = useMemo(() => {
    const basicComments = comments.filter((c) => !c.startsWith("ADV:"));
    const advancedComments = comments
      .filter((c) => c.startsWith("ADV:"))
      .map((c) => c.replace(/^ADV:\s*/, "").replace(/^ADV:/, ""));
    return { basic: basicComments, advanced: advancedComments };
  }, [comments]);

  const basicLimit =
    insightMode === "standard" ? Math.min(5, basic.length) : basic.length;

  const fpsTier = useMemo(
    () => getFPSTier(selectedComponents, activeComponentData),
    [activeComponentData, selectedComponents]
  );

  const componentBalance = useMemo(() => {
    const cpu = activeComponentData.cpu?.find(
      (c) => c.id === selectedComponents.cpu
    );
    const gpu = activeComponentData.gpu?.find(
      (c) => c.id === selectedComponents.gpu
    );
    const ram = activeComponentData.ram?.find(
      (c) => c.id === selectedComponents.ram
    );

    if (!cpu || !gpu) return null;

    const cpuScore = Math.min(95, ((cpu.cores || 4) / 16) * 100);
    const gpuScore = Math.min(95, ((gpu.vram || 4) / 24) * 100);
    const ramScore = ram ? Math.min(95, ((ram.capacity || 8) / 128) * 100) : 0;

    const hasBottleneck =
      (gpuScore > 70 && cpuScore < 40) ||
      (cpuScore > 70 && gpuScore < 40) ||
      (gpuScore > 70 && ramScore < 50);

    return {
      cpuScore,
      gpuScore,
      ramScore,
      hasBottleneck,
      ram,
    };
  }, [activeComponentData, selectedComponents]);

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
      logger.success("Copied to clipboard!");
    } catch (err) {
      logger.error("Failed to copy", err);
    }
  };

  if (getSelectedComponentsCount < 3 || comments.length === 0) {
    return null;
  }

  const gradeClass =
    meta.grade === "A"
      ? "bg-green-500/20 border-green-500/40 text-green-200"
      : meta.grade === "B"
      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
      : meta.grade === "C"
      ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
      : meta.grade === "D"
      ? "bg-orange-500/20 border-orange-500/40 text-orange-200"
      : meta.grade === "E"
      ? "bg-red-500/20 border-red-500/40 text-red-200"
      : "bg-red-700/30 border-red-700/50 text-red-100";

  return (
    <TooltipProvider>
      <div className="relative rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 mt-8">
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(circle_at_center,transparent_20%,black)]" />
        <div className="relative p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-sky-600/40 to-blue-700/40 border border-sky-500/40 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-200" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-white">
              Kevin's Insight
              <sup className="text-sm sm:text-base align-top">™</sup>
            </h4>
          </div>

          {!insightCompactMode && (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border ${gradeClass} flex items-center gap-2 cursor-help`}
                    >
                      Synergy Grade {meta.grade} · {meta.score}/100
                      <Info className="w-3.5 h-3.5 opacity-60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>Synergy Grade</strong> measures how well your
                      components work together. A-grade = perfect harmony,
                      F-grade = bottlenecks or compatibility issues.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border bg-sky-500/15 border-sky-500/30 text-sky-200 flex items-center gap-2 cursor-help">
                      Build Type {meta.profile}
                      <Info className="w-3.5 h-3.5 opacity-60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>Profile</strong> categorizes your build type:
                      Gaming Powerhouse, Workstation Beast, Balanced
                      All-Rounder, Entry Gaming, or Unclassified.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-300">
                    Harmony Score
                  </span>
                  <span className="text-sm font-bold text-sky-400">
                    {meta.score}/100
                  </span>
                </div>
                <Progress value={meta.score} className="h-2.5 bg-white/10" />
              </div>

              {fpsTier && (
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <div
                    className={`p-2 rounded-lg border bg-${fpsTier.color}-500/10 border-${fpsTier.color}-500/30`}
                  >
                    <div
                      className={`text-[10px] sm:text-xs font-semibold text-${fpsTier.color}-300`}
                    >
                      {fpsTier.tier} Performance
                    </div>
                    <div
                      className={`text-[10px] sm:text-xs text-${fpsTier.color}-200/80 mt-0.5`}
                    >
                      {fpsTier.fps}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg border bg-purple-500/10 border-purple-500/30">
                    <div className="text-[10px] sm:text-xs font-semibold text-purple-300">
                      Workload Suitability
                    </div>
                    <div className="text-[10px] sm:text-xs text-purple-200/80 mt-0.5">
                      {meta.grade <= "B" ? "Gaming + Creative" : "Gaming Focus"}
                    </div>
                  </div>
                </div>
              )}

              {componentBalance && (
                <div className="pt-2 sm:pt-3 space-y-2">
                  <div className="text-[10px] sm:text-xs font-semibold text-gray-300 flex items-center gap-1.5 sm:gap-2">
                    <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Component Balance
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">CPU</span>
                      <span
                        className={
                          componentBalance.cpuScore < 40
                            ? "text-orange-400"
                            : componentBalance.cpuScore < 70
                            ? "text-yellow-400"
                            : "text-green-400"
                        }
                      >
                        {Math.round(componentBalance.cpuScore)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          componentBalance.cpuScore < 40
                            ? "bg-gradient-to-r from-orange-500 to-red-500"
                            : componentBalance.cpuScore < 70
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                        style={{
                          width: `${Math.max(5, componentBalance.cpuScore)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">GPU</span>
                      <span
                        className={
                          componentBalance.gpuScore < 40
                            ? "text-orange-400"
                            : componentBalance.gpuScore < 70
                            ? "text-yellow-400"
                            : "text-green-400"
                        }
                      >
                        {Math.round(componentBalance.gpuScore)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          componentBalance.gpuScore < 40
                            ? "bg-gradient-to-r from-orange-500 to-red-500"
                            : componentBalance.gpuScore < 70
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                        style={{
                          width: `${Math.max(5, componentBalance.gpuScore)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {componentBalance.ram && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">RAM</span>
                        <span
                          className={
                            componentBalance.ramScore < 40
                              ? "text-orange-400"
                              : componentBalance.ramScore < 70
                              ? "text-yellow-400"
                              : "text-green-400"
                          }
                        >
                          {Math.round(componentBalance.ramScore)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            componentBalance.ramScore < 40
                              ? "bg-gradient-to-r from-orange-500 to-red-500"
                              : componentBalance.ramScore < 70
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                              : "bg-gradient-to-r from-green-500 to-emerald-500"
                          }`}
                          style={{
                            width: `${Math.max(5, componentBalance.ramScore)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {componentBalance.hasBottleneck && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 mt-2">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-300 leading-relaxed">
                        <strong>Bottleneck detected:</strong>{" "}
                        {componentBalance.gpuScore >
                        componentBalance.cpuScore + 30
                          ? "Your GPU may be limited by CPU"
                          : componentBalance.cpuScore >
                            componentBalance.gpuScore + 30
                          ? "Your CPU may be underutilized"
                          : "RAM capacity may limit performance"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              <TooltipContent
                side="top"
                className="bg-slate-900 border-slate-700"
              >
                <p className="text-xs">
                  Copy full insight analysis to clipboard
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 sm:h-9 text-xs sm:text-sm font-medium border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-200 hover:from-purple-500/20 hover:to-indigo-500/20 hover:border-purple-400/60 transition-all"
                  onClick={() =>
                    setInsightMode((m) =>
                      m === "standard" ? "pro" : "standard"
                    )
                  }
                >
                  {insightMode === "standard" ? (
                    <>
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                      Pro Detail
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                      Simple
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-slate-900 border-slate-700"
              >
                <p className="text-xs">
                  {insightMode === "standard"
                    ? "Show all insights (no limit)"
                    : "Show top 5 insights only"}
                </p>
              </TooltipContent>
            </Tooltip>

            {advanced.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 sm:h-9 text-xs sm:text-sm font-medium border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-200 hover:from-blue-500/20 hover:to-cyan-500/20 hover:border-blue-400/60 transition-all"
                    onClick={() => setShowAdvancedInsights((v) => !v)}
                  >
                    {showAdvancedInsights ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden xs:inline">Hide </span>
                        Technical
                        <span className="hidden xs:inline"> Details</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden xs:inline">Show </span>
                        Technical
                        <span className="hidden xs:inline"> Details</span> (
                        {advanced.length})
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-slate-900 border-slate-700 max-w-xs"
                >
                  <p className="text-xs">
                    {showAdvancedInsights
                      ? "Hide in-depth technical diagnostics (memory channels, PCIe lanes, thermal predictions, etc.)"
                      : "View detailed technical analysis including component compatibility checks, upgrade paths, and performance optimization tips"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 sm:h-9 text-xs sm:text-sm font-medium border-sky-500/40 bg-gradient-to-r from-sky-500/10 to-blue-500/10 text-sky-200 hover:from-sky-500/20 hover:to-blue-500/20 hover:border-sky-400/60 transition-all"
            onClick={() => setInsightCompactMode((v) => !v)}
          >
            {insightCompactMode ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Expand Insight
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Collapse Insight
              </>
            )}
          </Button>

          {!insightCompactMode && (
            <div className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Balanced component pairing, contextual performance & upgrade
              foresight. Refined for clarity.
            </div>
          )}

          {!insightCompactMode && <Separator className="border-white/10" />}

          <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-sky-500/40 hover:scrollbar-thumb-sky-500/60 pr-1">
            {basic.slice(0, basicLimit).map((comment, idx) => (
              <div
                key={idx}
                className="group p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:border-sky-500/40 transition-colors"
              >
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                  {comment}
                </p>
              </div>
            ))}

            {showAdvancedInsights && advanced.length > 0 && (
              <div className="pt-2 sm:pt-3 mt-2 border-t border-blue-500/30 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="text-[10px] sm:text-xs font-semibold text-blue-300 tracking-wide uppercase">
                    Technical Details
                  </span>
                  <Badge className="ml-auto text-[10px] sm:text-xs bg-blue-500/20 border-blue-500/40 text-blue-300 whitespace-nowrap">
                    For Tech Enthusiasts
                  </Badge>
                </div>
                <div className="text-[10px] sm:text-xs text-blue-200/70 italic mb-2">
                  Advanced diagnostics covering memory configuration, PCIe
                  bandwidth, thermal predictions, overclocking potential,
                  display connectivity, and more.
                </div>
                {advanced.map((comment, idx) => (
                  <div
                    key={`adv-${idx}`}
                    className="group p-2 sm:p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:border-blue-400/40 transition-colors"
                  >
                    <p className="text-[10px] sm:text-xs text-blue-100 leading-relaxed">
                      {comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});
