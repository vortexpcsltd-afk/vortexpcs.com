/**
 * usePerformanceMonitoring Hook
 * Automatically monitors component render performance
 */

import { useEffect, useRef } from "react";
import { logger } from "../services/logger";

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  renderCount: number;
  slowRenders: number;
}

const SLOW_RENDER_THRESHOLD = 16; // 16ms = one frame at 60fps
const performanceCache = new Map<string, PerformanceMetrics>();

/**
 * Hook to monitor component performance
 * Tracks render times and alerts on slow renders
 */
export function usePerformanceMonitoring(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    const currentRenderCount = ++renderCount.current;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;

      // Get or create metrics for this component
      const metrics = performanceCache.get(componentName) || {
        componentName,
        renderTime: 0,
        renderCount: 0,
        slowRenders: 0,
      };

      // Update metrics
      metrics.renderTime =
        (metrics.renderTime * metrics.renderCount + renderTime) /
        (metrics.renderCount + 1);
      metrics.renderCount++;

      if (renderTime > SLOW_RENDER_THRESHOLD) {
        metrics.slowRenders++;
        logger.warn(`Slow render detected: ${componentName}`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          threshold: `${SLOW_RENDER_THRESHOLD}ms`,
          renderCount: metrics.renderCount,
        });
      }

      performanceCache.set(componentName, metrics);

      // Log detailed stats in development
      if (import.meta.env.DEV && currentRenderCount % 10 === 0) {
        logger.debug(`Component performance: ${componentName}`, {
          avgRenderTime: `${metrics.renderTime.toFixed(2)}ms`,
          totalRenders: metrics.renderCount,
          slowRenders: metrics.slowRenders,
          slowRenderRate: `${(
            (metrics.slowRenders / metrics.renderCount) *
            100
          ).toFixed(1)}%`,
        });
      }
    };
  });

  return {
    getMetrics: () => performanceCache.get(componentName),
    getAllMetrics: () => Array.from(performanceCache.values()),
  };
}

/**
 * Get all component performance metrics
 */
export function getPerformanceReport() {
  const report = Array.from(performanceCache.values())
    .sort((a, b) => b.renderTime - a.renderTime)
    .map((metric) => ({
      ...metric,
      slowRenderRate: (metric.slowRenders / metric.renderCount) * 100,
    }));

  return report;
}

/**
 * Clear performance cache
 */
export function clearPerformanceCache() {
  performanceCache.clear();
}
