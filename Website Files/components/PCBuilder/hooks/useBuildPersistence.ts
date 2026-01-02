import { useState, useCallback, useEffect } from "react";
import { SelectedComponentIds } from "../types";
import { logger } from "../../../services/logger";

/**
 * Hook for managing build persistence (save/load configurations)
 * Handles localStorage persistence of build state and sharing
 */
export const useBuildPersistence = (
  selectedComponents: SelectedComponentIds,
  selectedPeripherals: Record<string, string[]>
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [savedBuilds, setSavedBuilds] = useState<
    Array<{
      id: string;
      name: string;
      timestamp: number;
      components: SelectedComponentIds;
      peripherals: Record<string, string[]>;
    }>
  >([]);

  // Load saved builds from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("VORTEX_SAVED_BUILDS");
      if (stored) {
        const builds = JSON.parse(stored);
        if (Array.isArray(builds)) {
          setSavedBuilds(builds);
          logger.info("Saved builds loaded", { count: builds.length });
        }
      }
    } catch (error) {
      logger.warn("Failed to load saved builds", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  // Save current build to localStorage
  const saveBuild = useCallback(
    (buildName: string): boolean => {
      try {
        setIsSaving(true);

        const newBuild = {
          id: `build_${Date.now()}`,
          name: buildName || `Build ${new Date().toLocaleDateString()}`,
          timestamp: Date.now(),
          components: selectedComponents,
          peripherals: selectedPeripherals,
        };

        const updated = [...savedBuilds, newBuild];
        localStorage.setItem("VORTEX_SAVED_BUILDS", JSON.stringify(updated));
        setSavedBuilds(updated);
        setLastSaveTime(new Date());

        logger.info("Build saved", {
          buildId: newBuild.id,
          buildName: newBuild.name,
        });

        return true;
      } catch (error) {
        logger.error("Failed to save build", {
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [selectedComponents, selectedPeripherals, savedBuilds]
  );

  // Load a saved build
  const loadBuild = useCallback(
    (
      buildId: string
    ): {
      components: SelectedComponentIds;
      peripherals: Record<string, string[]>;
    } | null => {
      try {
        const build = savedBuilds.find((b) => b.id === buildId);
        if (!build) {
          logger.warn("Build not found", { buildId });
          return null;
        }

        logger.info("Build loaded", { buildId, buildName: build.name });
        return {
          components: build.components,
          peripherals: build.peripherals,
        };
      } catch (error) {
        logger.error("Failed to load build", {
          error: error instanceof Error ? error.message : String(error),
          buildId,
        });
        return null;
      }
    },
    [savedBuilds]
  );

  // Delete a saved build
  const deleteBuild = useCallback(
    (buildId: string): boolean => {
      try {
        const updated = savedBuilds.filter((b) => b.id !== buildId);
        localStorage.setItem("VORTEX_SAVED_BUILDS", JSON.stringify(updated));
        setSavedBuilds(updated);

        logger.info("Build deleted", { buildId });
        return true;
      } catch (error) {
        logger.error("Failed to delete build", {
          error: error instanceof Error ? error.message : String(error),
          buildId,
        });
        return false;
      }
    },
    [savedBuilds]
  );

  // Save build to localStorage (auto-save on changes)
  useEffect(() => {
    try {
      localStorage.setItem(
        "VORTEX_CURRENT_BUILD",
        JSON.stringify({
          components: selectedComponents,
          peripherals: selectedPeripherals,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      logger.warn("Failed to auto-save current build", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [selectedComponents, selectedPeripherals]);

  // Load auto-saved build
  const loadAutoSavedBuild = useCallback((): {
    components: SelectedComponentIds;
    peripherals: Record<string, string[]>;
  } | null => {
    try {
      const stored = localStorage.getItem("VORTEX_CURRENT_BUILD");
      if (!stored) return null;

      const build = JSON.parse(stored);
      logger.info("Auto-saved build loaded");
      return {
        components: build.components || {},
        peripherals: build.peripherals || {},
      };
    } catch (error) {
      logger.warn("Failed to load auto-saved build", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }, []);

  return {
    isSaving,
    lastSaveTime,
    savedBuilds,
    saveBuild,
    loadBuild,
    deleteBuild,
    loadAutoSavedBuild,
  };
};
