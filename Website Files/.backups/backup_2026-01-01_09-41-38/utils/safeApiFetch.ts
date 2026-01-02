import { logger } from "../services/logger";

/**
 * Safe API fetch with proper error handling
 * Prevents unhandled promise rejections and ensures logging
 */
export async function safeApiFetch<T>(
  url: string,
  options?: Record<string, unknown>,
  context?: { operationName?: string; isOptional?: boolean }
): Promise<T | null> {
  const { operationName = url, isOptional = false } = context ?? {};

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      let errorData: { message?: string } = {};
      try {
        errorData = await response.json();
      } catch {
        // JSON parsing failed, that's okay
      }

      const errorMessage = errorData.message || `HTTP ${response.status}`;
      const error = new Error(`${operationName} failed: ${errorMessage}`);

      if (isOptional) {
        logger.warn(errorMessage, { url, status: response.status });
        return null;
      }

      throw error;
    }

    return (await response.json()) as T;
  } catch (_error) {
    logger.error(operationName, _error, { url });

    if (isOptional) {
      return null;
    }

    throw _error;
  }
}

/**
 * Parse JSON response with proper error handling
 */
export async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    logger.warn("Failed to parse response as JSON", {
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    return null;
  }
}
