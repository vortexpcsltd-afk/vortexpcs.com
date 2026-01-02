import { useState, useCallback, useMemo, useEffect } from "react";
import { SelectedComponentIds, ComponentDataMap } from "../types";
import { formatCurrency } from "../utils/specifications";
import { logger } from "../../../services/logger";

/**
 * Hook for managing price calculation and build cost tracking
 * Calculates total build cost, per-component costs, and pricing analytics
 */
export const usePriceCalculation = (
  selectedComponents: SelectedComponentIds,
  selectedPeripherals: Record<string, string[]>,
  componentData: ComponentDataMap
) => {
  const [buildCost, setBuildCost] = useState(0);
  const [peripheralsCost, setPeripheralsCost] = useState(0);
  const [breakdown, setBreakdown] = useState<
    Record<string, { cost: number; reducedPrice?: number }>
  >({});

  // Calculate component costs
  const calculateComponentCost = useCallback(
    (category: string, componentId: string): number => {
      try {
        const components = componentData[category] as
          | Record<string, unknown>[]
          | undefined;
        if (!components) return 0;

        const component = components.find(
          (c: Record<string, unknown>) => c.id === componentId
        ) as Record<string, unknown> | undefined;
        return component ? Number(component.price) || 0 : 0;
      } catch (error) {
        logger.error("Component cost calculation failed", {
          error: error instanceof Error ? error.message : String(error),
          category,
          componentId,
        });
        return 0;
      }
    },
    [componentData]
  );

  // Recalculate build cost when components change
  useEffect(() => {
    try {
      let totalCost = 0;
      const newBreakdown: Record<
        string,
        { cost: number; reducedPrice?: number }
      > = {};

      // Sum component costs
      Object.entries(selectedComponents).forEach(([category, componentId]) => {
        if (componentId) {
          const cost = calculateComponentCost(category, componentId);
          newBreakdown[category] = { cost };
          totalCost += cost;
        }
      });

      setBuildCost(totalCost);
      setBreakdown(newBreakdown);

      logger.info("Build cost calculated", {
        totalCost,
        componentCount: Object.keys(newBreakdown).length,
      });
    } catch (error) {
      logger.error("Build cost calculation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [selectedComponents, calculateComponentCost]);

  // Calculate peripheral costs
  useEffect(() => {
    try {
      let totalPeripheralCost = 0;

      Object.entries(selectedPeripherals).forEach(([category, extraIds]) => {
        const extras = componentData[category] as
          | Record<string, unknown>[]
          | undefined;
        if (!extras) return;

        extraIds.forEach((extraId) => {
          const extra = extras.find(
            (e: Record<string, unknown>) => e.id === extraId
          ) as Record<string, unknown> | undefined;
          if (extra) {
            totalPeripheralCost += Number(extra.price) || 0;
          }
        });
      });

      setPeripheralsCost(totalPeripheralCost);

      logger.info("Peripheral costs calculated", {
        totalCost: totalPeripheralCost,
      });
    } catch (error) {
      logger.error("Peripheral cost calculation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [selectedPeripherals, componentData]);

  // Total cost including peripherals
  const totalCost = useMemo(() => {
    return buildCost + peripheralsCost;
  }, [buildCost, peripheralsCost]);

  // Format costs for display
  const displayCosts = useMemo(() => {
    return {
      build: formatCurrency(buildCost),
      peripherals: formatCurrency(peripheralsCost),
      total: formatCurrency(totalCost),
    };
  }, [buildCost, peripheralsCost, totalCost]);

  // Get cost for specific component
  const getComponentCost = useCallback(
    (category: string): number => {
      return breakdown[category]?.cost || 0;
    },
    [breakdown]
  );

  // Get percentage of total cost per component
  const getComponentCostPercentage = useCallback(
    (category: string): number => {
      if (totalCost === 0) return 0;
      return ((breakdown[category]?.cost || 0) / totalCost) * 100;
    },
    [breakdown, totalCost]
  );

  return {
    buildCost,
    peripheralsCost,
    totalCost,
    breakdown,
    displayCosts,
    calculateComponentCost,
    getComponentCost,
    getComponentCostPercentage,
  };
};
