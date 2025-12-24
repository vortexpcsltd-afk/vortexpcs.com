import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  fetchPCComponents,
  fetchPCOptionalExtras,
  PCComponent,
  PCOptionalExtra,
} from "../../../services/cms";
import { logger } from "../../../services/logger";

/**
 * Custom hook for fetching and managing CMS component data
 * Handles loading states, error handling, and data caching
 */
export const useCMSComponents = () => {
  const [cmsComponents, setCmsComponents] = useState<{
    case: PCComponent[];
    motherboard: PCComponent[];
    cpu: PCComponent[];
    gpu: PCComponent[];
    ram: PCComponent[];
    storage: PCComponent[];
    psu: PCComponent[];
    cooling: PCComponent[];
  }>({
    case: [],
    motherboard: [],
    cpu: [],
    gpu: [],
    ram: [],
    storage: [],
    psu: [],
    cooling: [],
  });

  const [cmsOptionalExtras, setCmsOptionalExtras] = useState<PCOptionalExtra[]>(
    []
  );
  const [isLoadingComponents, setIsLoadingComponents] = useState(true);
  const [isLoadingOptionalExtras, setIsLoadingOptionalExtras] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch PC components from CMS
  useEffect(() => {
    const loadComponents = async () => {
      setIsLoadingComponents(true);
      setLoadError(null);
      try {
        logger.info("[useCMSComponents] Fetching PC components from CMS");

        // Fetch each category separately
        const [
          cases,
          motherboards,
          cpus,
          gpus,
          rams,
          storages,
          psus,
          coolings,
        ] = await Promise.all([
          fetchPCComponents({ category: "case" }),
          fetchPCComponents({ category: "motherboard" }),
          fetchPCComponents({ category: "cpu" }),
          fetchPCComponents({ category: "gpu" }),
          fetchPCComponents({ category: "ram" }),
          fetchPCComponents({ category: "storage" }),
          fetchPCComponents({ category: "psu" }),
          fetchPCComponents({ category: "cooling" }),
        ]);

        setCmsComponents({
          case: cases,
          motherboard: motherboards,
          cpu: cpus,
          gpu: gpus,
          ram: rams,
          storage: storages,
          psu: psus,
          cooling: coolings,
        });

        logger.info(
          `[useCMSComponents] Loaded components: ${cases.length} cases, ${motherboards.length} motherboards, ${cpus.length} CPUs, ${gpus.length} GPUs`
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load PC components";
        logger.error("[useCMSComponents] Error loading components:", error);
        setLoadError(message);
        toast.error(message);
      } finally {
        setIsLoadingComponents(false);
      }
    };

    loadComponents();
  }, []);

  // Fetch optional extras from CMS
  useEffect(() => {
    const loadOptionalExtras = async () => {
      setIsLoadingOptionalExtras(true);
      try {
        logger.info("[useCMSComponents] Fetching optional extras from CMS");
        const data = await fetchPCOptionalExtras();
        logger.info(`[useCMSComponents] Loaded ${data.length} optional extras`);
        setCmsOptionalExtras(data);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load optional extras";
        logger.error(
          "[useCMSComponents] Error loading optional extras:",
          error
        );
        toast.error(message);
      } finally {
        setIsLoadingOptionalExtras(false);
      }
    };

    loadOptionalExtras();
  }, []);

  return {
    cmsComponents,
    cmsOptionalExtras,
    isLoadingComponents,
    isLoadingOptionalExtras,
    isLoading: isLoadingComponents || isLoadingOptionalExtras,
    loadError,
  };
};
