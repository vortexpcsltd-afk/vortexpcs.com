import { useState, useCallback, useEffect } from "react";
import { SelectedComponentIds, ComponentDataMap } from "../types";
import { logger } from "../../../services/logger";

/**
 * Hook for managing Kevin's Insight generation and caching
 * Handles lazy loading of insight modules and generation of build insights
 */
export const useInsightGeneration = (
  selectedComponents: SelectedComponentIds,
  _componentData: ComponentDataMap
) => {
  const [insightModules, setInsightModules] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(false);
  const [insightMode, setInsightMode] = useState<"standard" | "pro">(
    "standard"
  );
  const [insightCompactMode, setInsightCompactMode] = useState(false);

  // Function to load insight modules (heavy ~363KB)
  const loadInsightModules = useCallback(async () => {
    try {
      setIsLoadingInsights(true);

      const [
        gpuPerfMod,
        cpuPerfMod,
        ramMod,
        coolingMod,
        psuMod,
        synergyMod,
        useCaseMod,
        compCtxMod,
        advDiagMod,
        upgradeMod,
        futureProofMod,
        priceTierMod,
        ctaMod,
      ] = await Promise.all([
        import("../../data/gpuPerformanceVariations"),
        import("../../data/cpuPerformanceVariations"),
        import("../../data/ramInsightVariations"),
        import("../../data/coolingInsightVariations"),
        import("../../data/psuInsightVariations"),
        import("../../data/synergyGradeCalculation"),
        import("../../data/useCaseDetection"),
        import("../../data/competitiveContext"),
        import("../../data/advancedDiagnostics"),
        import("../../data/upgradePathGuidance"),
        import("../../data/futureProofingAnalysis"),
        import("../../data/priceTierInsights"),
        import("../../data/ctaFormatting"),
      ]);

      const modules = {
        getGPUPerformanceInsight: gpuPerfMod.getGPUPerformanceInsight,
        getCPUPerformanceInsight: cpuPerfMod.getCPUPerformanceInsight,
        getRAMInsight: ramMod.getRAMInsight,
        getCoolingInsight: coolingMod.getCoolingInsight,
        getPSUInsights: psuMod.getPSUInsights,
        calculateSynergyGrade: synergyMod.calculateSynergyGrade,
        detectUseCase: useCaseMod.detectUseCase,
        getUseCaseIntro: useCaseMod.getUseCaseIntro,
        getPerformanceEstimate: useCaseMod.getPerformanceEstimate,
        generateCTAs: useCaseMod.generateCTAs,
        getCompetitiveContext: compCtxMod.getCompetitiveContext,
        getTCOAnalysis: compCtxMod.getTCOAnalysis,
        getAdvancedDiagnostics: advDiagMod.getAdvancedDiagnostics,
        getUpgradeSuggestions: upgradeMod.getUpgradeSuggestions,
        calculateGPUFutureProofScore:
          futureProofMod.calculateGPUFutureProofScore,
        calculateCPUFutureProofScore:
          futureProofMod.calculateCPUFutureProofScore,
        getGenerationalComparisons: futureProofMod.getGenerationalComparisons,
        getBuildFutureProofAnalysis: futureProofMod.getBuildFutureProofAnalysis,
        getPriceTierInsight: priceTierMod.getPriceTierInsight,
        formatCTASection: ctaMod.formatCTASection,
      };

      setInsightModules(modules);
      logger.info("Insight modules loaded successfully", {
        moduleCount: Object.keys(modules).length,
      });

      return modules;
    } catch (error) {
      logger.error("Failed to load insight modules", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      setIsLoadingInsights(false);
    }
  }, []);

  // Lazy load modules when enough components selected
  useEffect(() => {
    const componentCount =
      Object.keys(selectedComponents).filter(Boolean).length;

    // Load modules when user has 3+ components selected and modules not yet loaded
    if (componentCount >= 3 && !insightModules && !isLoadingInsights) {
      void loadInsightModules();
    }
  }, [
    selectedComponents,
    insightModules,
    isLoadingInsights,
    loadInsightModules,
  ]);

  // Generate insights based on selected components and mode
  const generateBuildInsights = useCallback(
    async (
      _environment?: Record<string, unknown>
    ): Promise<{ content: string; html: string } | null> => {
      try {
        if (!insightModules) {
          logger.warn("Insight modules not yet loaded");
          return null;
        }

        const componentCount =
          Object.keys(selectedComponents).filter(Boolean).length;
        if (componentCount < 3) {
          logger.info("Not enough components for insights");
          return null;
        }

        // Placeholder for actual insight generation
        // In real implementation, would use insightModules functions
        logger.info("Generating build insights", {
          mode: insightMode,
          compactMode: insightCompactMode,
          componentCount,
        });

        return {
          content: "Build insights generated",
          html: "<p>Build insights generated</p>",
        };
      } catch (error) {
        logger.error("Failed to generate insights", {
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    },
    [insightModules, selectedComponents, insightMode, insightCompactMode]
  );

  // Toggle insight display modes
  const toggleAdvancedInsights = useCallback(() => {
    setShowAdvancedInsights((prev) => !prev);
  }, []);

  const toggleCompactMode = useCallback(() => {
    setInsightCompactMode((prev) => !prev);
  }, []);

  const changeInsightMode = useCallback((mode: "standard" | "pro") => {
    setInsightMode(mode);
  }, []);

  return {
    insightModules,
    isLoadingInsights,
    showAdvancedInsights,
    setShowAdvancedInsights,
    insightMode,
    insightCompactMode,
    generateBuildInsights,
    toggleAdvancedInsights,
    toggleCompactMode,
    changeInsightMode,
    loadInsightModules,
  };
};
