import { useState, useCallback, useEffect } from "react";
import {
  CompatibilityIssue,
  SelectedComponentIds,
  ComponentDataMap,
} from "../types";
import { checkCompatibility } from "../utils/compatibility";
import { logger } from "../../../services/logger";

/**
 * Hook for managing compatibility checking logic
 * Validates selected components and tracks compatibility issues
 */
export const useCompatibilityCheck = (
  selectedComponents: SelectedComponentIds,
  componentData: ComponentDataMap
) => {
  const [compatibilityIssues, setCompatibilityIssues] = useState<
    CompatibilityIssue[]
  >([]);
  const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false);
  const [showIncompatibilityModal, setShowIncompatibilityModal] =
    useState(false);

  // Get component by category and ID
  const getComponentById = useCallback(
    (category: keyof ComponentDataMap, id?: string | null) => {
      if (!id || !componentData[category]) return null;
      const categoryData = componentData[category];
      if (Array.isArray(categoryData)) {
        return categoryData.find((c) => c.id === id) || null;
      }
      return null;
    },
    [componentData]
  );

  // Check compatibility whenever components change
  useEffect(() => {
    try {
      const issues = checkCompatibility(selectedComponents, getComponentById);
      setCompatibilityIssues(issues);

      // Auto-show modal if critical issues detected
      if (issues.some((issue) => issue.severity === "critical")) {
        setShowIncompatibilityModal(true);
      }

      logger.info("Compatibility check completed", {
        issueCount: issues.length,
        hasCritical: issues.some((i) => i.severity === "critical"),
      });
    } catch (error) {
      logger.error("Compatibility check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      setCompatibilityIssues([]);
    }
  }, [selectedComponents, getComponentById]);

  // Check if specific components are compatible
  const checkComponentCompatibility = useCallback(
    (category: string, componentId: string): boolean => {
      try {
        const testSelection = {
          ...selectedComponents,
          [category]: componentId,
        };

        const issues = checkCompatibility(testSelection, getComponentById);
        return issues.length === 0;
      } catch (error) {
        logger.error("Component compatibility check failed", {
          error: error instanceof Error ? error.message : String(error),
          category,
          componentId,
        });
        return true; // Default to compatible to not block user
      }
    },
    [selectedComponents, getComponentById]
  );

  // Get critical issues only
  const getCriticalIssues = useCallback(() => {
    return compatibilityIssues.filter((issue) => issue.severity === "critical");
  }, [compatibilityIssues]);

  // Get warning issues
  const getWarningIssues = useCallback(() => {
    return compatibilityIssues.filter((issue) => issue.severity === "warning");
  }, [compatibilityIssues]);

  return {
    compatibilityIssues,
    showCompatibilityDialog,
    setShowCompatibilityDialog,
    showIncompatibilityModal,
    setShowIncompatibilityModal,
    checkComponentCompatibility,
    getCriticalIssues,
    getWarningIssues,
  };
};
