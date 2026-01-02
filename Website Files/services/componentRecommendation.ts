/**
 * Similar Components Recommendation Service
 * Provides "Users Also Considered" suggestions based on component attributes and comparison data
 */

import { PCBuilderComponent } from "../components/PCBuilder";
import { logger } from "./logger";

export interface SimilarComponentMatch {
  component: PCBuilderComponent;
  score: number; // 0-100 similarity score
  reason: string; // Why this is similar
  priceComparison: "cheaper" | "similar" | "more_expensive";
}

/**
 * Track component comparisons for analytics
 */
export function trackComponentComparison(
  fromComponentId: string,
  toComponentId: string,
  action: "viewed" | "compared" | "selected"
): void {
  try {
    const comparisons = JSON.parse(
      localStorage.getItem("componentComparisons") || "{}"
    );

    const key = `${fromComponentId}→${toComponentId}`;
    comparisons[key] = (comparisons[key] || 0) + 1;

    localStorage.setItem("componentComparisons", JSON.stringify(comparisons));

    logger.debug("Component comparison tracked", {
      fromComponentId,
      toComponentId,
      action,
    });
  } catch (error) {
    logger.error("Failed to track component comparison", error);
  }
}

/**
 * Get popular comparison pairs (users often compare X with Y)
 */
export function getPopularComparisons(
  componentId: string,
  limit = 5
): string[] {
  try {
    const comparisons = JSON.parse(
      localStorage.getItem("componentComparisons") || "{}"
    );

    const relatedPairs = Object.entries(comparisons)
      .filter(([key]) => key.includes(componentId))
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, limit)
      .map(([key]) => {
        const [from, to] = key.split("→");
        return from === componentId ? to : from;
      });

    return relatedPairs;
  } catch (error) {
    logger.error("Failed to get popular comparisons", error);
    return [];
  }
}

/**
 * Calculate similarity score between two components
 */
function calculateSimilarityScore(
  component1: PCBuilderComponent,
  component2: PCBuilderComponent
): number {
  let score = 0;

  // Same brand bonus (high relevance)
  if (component1.brand?.toLowerCase() === component2.brand?.toLowerCase()) {
    score += 30;
  }

  // Similar price range (within 20%)
  const price1 = component1.price || 0;
  const price2 = component2.price || 0;
  if (price1 > 0 && price2 > 0) {
    const priceDiff = Math.abs(price1 - price2) / Math.max(price1, price2);
    if (priceDiff < 0.2) {
      score += 25;
    } else if (priceDiff < 0.5) {
      score += 15;
    }
  }

  // Same category type
  if (component1.type === component2.type) {
    score += 20;
  }

  // Similar specs (cores, VRAM, storage, etc.)
  if (
    component1.cores &&
    component2.cores &&
    Math.abs(component1.cores - component2.cores) <= 4
  ) {
    score += 15;
  }
  if (
    component1.vram &&
    component2.vram &&
    Math.abs(component1.vram - component2.vram) <= 8
  ) {
    score += 10;
  }
  if (
    component1.capacity &&
    component2.capacity &&
    Math.abs(component1.capacity - component2.capacity) <= 500
  ) {
    score += 10;
  }

  // Similar features
  const features1 = [
    component1.rgb,
    component1.wireless,
    component1.modular,
  ].filter(Boolean).length;
  const features2 = [
    component2.rgb,
    component2.wireless,
    component2.modular,
  ].filter(Boolean).length;

  if (Math.abs(features1 - features2) <= 1) {
    score += 10;
  }

  // Rating similar
  if (
    component1.rating &&
    component2.rating &&
    Math.abs(component1.rating - component2.rating) < 0.5
  ) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Find similar components based on various criteria
 */
export function findSimilarComponents(
  component: PCBuilderComponent,
  allComponents: PCBuilderComponent[],
  limit = 3
): SimilarComponentMatch[] {
  try {
    const price1 = component.price || 0;

    const matches = allComponents
      .filter((c) => c.id !== component.id && c.price !== undefined)
      .map((c) => {
        const score = calculateSimilarityScore(component, c);
        const price2 = c.price || 0;

        let priceComparison: "cheaper" | "similar" | "more_expensive";
        const priceDiff = ((price2 - price1) / price1) * 100;
        if (priceDiff < -10) {
          priceComparison = "cheaper";
        } else if (priceDiff > 10) {
          priceComparison = "more_expensive";
        } else {
          priceComparison = "similar";
        }

        const reasons = [];
        if (component.brand === c.brand) reasons.push("Same brand");
        if (component.type === c.type) reasons.push("Same type");
        if (
          component.cores &&
          c.cores &&
          Math.abs(component.cores - c.cores) <= 2
        ) {
          reasons.push("Similar performance");
        }
        if (
          component.rating &&
          c.rating &&
          Math.abs(component.rating - c.rating) < 0.5
        ) {
          reasons.push("Similar rating");
        }

        return {
          component: c,
          score,
          reason:
            reasons.length > 0 ? reasons.join(", ") : "Popular alternative",
          priceComparison,
        };
      })
      .filter((match) => match.score >= 40) // Only include reasonably similar components
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return matches;
  } catch (error) {
    logger.error("Failed to find similar components", error);
    return [];
  }
}

/**
 * Get recommended upgrades (higher performance in same price range)
 */
export function getUpgradeRecommendations(
  component: PCBuilderComponent,
  allComponents: PCBuilderComponent[],
  limit = 3
): SimilarComponentMatch[] {
  try {
    const basePrice = component.price || 0;
    const priceRange = basePrice * 0.3; // ±30% price range

    const upgrades = allComponents
      .filter(
        (c): c is PCBuilderComponent & { price: number } =>
          c.id !== component.id &&
          c.price !== undefined &&
          c.price !== null &&
          c.price <= basePrice + priceRange &&
          c.price >= basePrice - priceRange
      )
      .map((c) => {
        // Score based on better performance
        let performanceBoost = 0;

        if (component.cores && c.cores && c.cores > component.cores) {
          performanceBoost += Math.min(20, (c.cores - component.cores) * 2);
        }
        if (component.vram && c.vram && c.vram > component.vram) {
          performanceBoost += Math.min(15, (c.vram - component.vram) * 1.5);
        }
        if (
          component.capacity &&
          c.capacity &&
          c.capacity > component.capacity
        ) {
          performanceBoost += Math.min(
            10,
            (c.capacity - component.capacity) / 50
          );
        }

        const score = Math.min(100, performanceBoost + 50);
        const componentPrice = c.price ?? 0;
        const priceDiff = componentPrice - basePrice;
        const priceComparison: "cheaper" | "similar" | "more_expensive" =
          priceDiff > 50
            ? "more_expensive"
            : priceDiff < -50
            ? "cheaper"
            : "similar";

        return {
          component: c,
          score,
          reason: "Better performance, similar price",
          priceComparison,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return upgrades;
  } catch (error) {
    logger.error("Failed to get upgrade recommendations", error);
    return [];
  }
}

/**
 * Get budget-friendly alternatives
 */
export function getBudgetAlternatives(
  component: PCBuilderComponent,
  allComponents: PCBuilderComponent[],
  maxPriceDrop = 30, // Max 30% cheaper
  limit = 3
): SimilarComponentMatch[] {
  try {
    const basePrice = component.price || 0;
    const minPrice = basePrice * ((100 - maxPriceDrop) / 100);

    const alternatives = allComponents
      .filter(
        (c): c is PCBuilderComponent & { price: number } =>
          c.id !== component.id &&
          c.price !== undefined &&
          c.price !== null &&
          c.price >= minPrice &&
          c.price < basePrice &&
          c.type === component.type // Same category
      )
      .map((c) => {
        const componentPrice = c.price ?? 0;
        const savings = basePrice - componentPrice;
        const savingsPercent = basePrice > 0 ? (savings / basePrice) * 100 : 0;

        return {
          component: c,
          score: Math.min(100, 50 + savingsPercent / 2),
          reason: `Save £${Math.round(savings)}`,
          priceComparison: "cheaper" as const,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return alternatives;
  } catch (error) {
    logger.error("Failed to get budget alternatives", error);
    return [];
  }
}
