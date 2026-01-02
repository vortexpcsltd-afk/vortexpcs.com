import { useState, useCallback } from "react";
import { SelectedComponentIds } from "../types";
import { logger } from "../../../services/logger";

/**
 * Hook for managing component selection state in PCBuilder
 * Handles adding/removing components and tracking selected peripherals
 */
export const useComponentSelection = () => {
  const [selectedComponents, setSelectedComponents] =
    useState<SelectedComponentIds>({});
  const [selectedPeripherals, setSelectedPeripherals] = useState<
    Record<string, string[]>
  >({});

  // Select a component for a category
  const selectComponent = useCallback(
    (category: string, componentId: string) => {
      try {
        setSelectedComponents((prev) => ({
          ...prev,
          [category]: componentId,
        }));
        logger.info("Component selected", { category, componentId });
      } catch (error) {
        logger.error("Failed to select component", {
          error: error instanceof Error ? error.message : String(error),
          category,
          componentId,
        });
      }
    },
    []
  );

  // Toggle peripheral selection (can have multiple per category)
  const togglePeripheral = useCallback(
    (category: string, extraId: string, isSelected: boolean) => {
      try {
        setSelectedPeripherals((prev) => {
          const current = prev[category] || [];
          let updated: string[];

          if (isSelected) {
            // Add to selection
            updated = [...current, extraId];
          } else {
            // Remove from selection
            updated = current.filter((id) => id !== extraId);
          }

          return {
            ...prev,
            [category]: updated,
          };
        });
        logger.info("Peripheral toggled", { category, extraId, isSelected });
      } catch (error) {
        logger.error("Failed to toggle peripheral", {
          error: error instanceof Error ? error.message : String(error),
          category,
          extraId,
        });
      }
    },
    []
  );

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    try {
      setSelectedComponents({});
      setSelectedPeripherals({});
      logger.info("All selections cleared");
    } catch (error) {
      logger.error("Failed to clear selections", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  // Get count of selected core components
  const getComponentCount = useCallback(() => {
    return Object.keys(selectedComponents).filter(
      (key) => selectedComponents[key as keyof typeof selectedComponents]
    ).length;
  }, [selectedComponents]);

  return {
    selectedComponents,
    selectedPeripherals,
    selectComponent,
    togglePeripheral,
    clearAllSelections,
    getComponentCount,
  };
};
