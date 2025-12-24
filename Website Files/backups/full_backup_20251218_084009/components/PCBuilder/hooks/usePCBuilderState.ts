import { useState, useEffect, useCallback } from "react";
import {
  SelectedComponentIds,
  CategoryKey,
  CompatibilityIssue,
  RecommendedBuildSpec,
  ComponentDataMap,
} from "../types";
import { checkCompatibility } from "../utils";
import { logger } from "../../../services/logger";

/**
 * Custom hook for managing PC Builder state
 * Handles component selection, view preferences, and compatibility checking
 */
export const usePCBuilderState = (
  componentData: ComponentDataMap,
  _recommendedBuild?: RecommendedBuildSpec | null
) => {
  const [selectedComponents, setSelectedComponents] =
    useState<SelectedComponentIds>({});
  const [selectedPeripherals, setSelectedPeripherals] = useState<
    Record<string, string[]>
  >({});
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("case");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("price");
  const [compatibilityIssues, setCompatibilityIssues] = useState<
    CompatibilityIssue[]
  >([]);
  const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false);
  const [showIncompatibilityModal, setShowIncompatibilityModal] =
    useState(false);
  const [showBuildDetailsModal, setShowBuildDetailsModal] = useState(false);
  const [showEnthusiastBuilder, setShowEnthusiastBuilder] = useState(false);

  // Check compatibility whenever components change
  useEffect(() => {
    const issues = checkCompatibility(selectedComponents, componentData);
    setCompatibilityIssues(issues);

    if (issues.length > 0) {
      logger.info(
        `[usePCBuilderState] Found ${issues.length} compatibility issues:`,
        { issues: issues.map((i) => i.title) }
      );
    }
  }, [selectedComponents, componentData]);

  // Handle component selection
  const handleComponentSelect = useCallback(
    (category: CategoryKey, componentId: string) => {
      logger.debug(`[usePCBuilderState] Selecting ${category}: ${componentId}`);
      setSelectedComponents((prev) => ({
        ...prev,
        [category]: componentId,
      }));
    },
    []
  );

  // Handle component removal
  const handleComponentRemove = useCallback((category: CategoryKey) => {
    logger.debug(`[usePCBuilderState] Removing ${category}`);
    setSelectedComponents((prev) => {
      const newSelected = { ...prev };
      delete newSelected[category];
      return newSelected;
    });
  }, []);

  // Clear all selections
  const clearBuild = useCallback(() => {
    logger.info("[usePCBuilderState] Clearing all selections");
    setSelectedComponents({});
    setSelectedPeripherals({});
  }, []);

  // Get selected component object by category
  const getSelectedComponent = useCallback(
    (category: CategoryKey) => {
      const componentId = selectedComponents[category];
      if (!componentId) return null;
      return componentData[category]?.find((c) => c.id === componentId) || null;
    },
    [selectedComponents, componentData]
  );

  // Calculate total price
  const calculateTotal = useCallback(() => {
    return Object.entries(selectedComponents).reduce(
      (total, [category, id]) => {
        if (!id) return total;
        const component = componentData[category]?.find((c) => c.id === id);
        return total + (component?.price || 0);
      },
      0
    );
  }, [selectedComponents, componentData]);

  // Check if build is complete (all main components selected)
  const isBuildComplete = useCallback(() => {
    const requiredCategories: CategoryKey[] = [
      "case",
      "motherboard",
      "cpu",
      "ram",
      "storage",
      "psu",
      "cooling",
    ];
    return requiredCategories.every((cat) => selectedComponents[cat]);
  }, [selectedComponents]);

  return {
    // State
    selectedComponents,
    selectedPeripherals,
    activeCategory,
    viewMode,
    sortBy,
    compatibilityIssues,
    showCompatibilityDialog,
    showIncompatibilityModal,
    showBuildDetailsModal,
    showEnthusiastBuilder,

    // Setters
    setSelectedComponents,
    setSelectedPeripherals,
    setActiveCategory,
    setViewMode,
    setSortBy,
    setCompatibilityIssues,
    setShowCompatibilityDialog,
    setShowIncompatibilityModal,
    setShowBuildDetailsModal,
    setShowEnthusiastBuilder,

    // Actions
    handleComponentSelect,
    handleComponentRemove,
    clearBuild,
    getSelectedComponent,
    calculateTotal,
    isBuildComplete,
  };
};
