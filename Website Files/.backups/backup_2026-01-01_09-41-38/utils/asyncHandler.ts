import { logger } from "../services/logger";

/**
 * Wraps async operations with proper error handling
 * Prevents silent failures and ensures logging
 */
export async function handleAsync<T>(
  operation: Promise<T>,
  context: {
    operationName: string;
    severity?: "critical" | "error" | "warn";
    shouldThrow?: boolean;
    fallback?: T;
  }
): Promise<T | null> {
  try {
    return await operation;
  } catch (error) {
    const {
      operationName,
      severity = "error",
      shouldThrow,
      fallback,
    } = context;

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (severity === "critical") {
      logger.error(`[CRITICAL] ${operationName} failed`, error);
    } else {
      logger.warn(`${operationName} failed: ${errorMessage}`);
    }

    if (shouldThrow) {
      throw error;
    }

    return fallback ?? null;
  }
}

/**
 * Async function wrapper for components
 * Prevents "can't perform React state update on unmounted component"
 */
export function useSafeAsync(isMounted: boolean) {
  return async function <T>(
    operation: Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const result = await operation;
      if (isMounted) onSuccess?.(result);
      return result;
    } catch (error) {
      if (isMounted) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  };
}
