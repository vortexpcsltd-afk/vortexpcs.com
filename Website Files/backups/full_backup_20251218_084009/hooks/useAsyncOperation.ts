/**
 * useAsyncOperation Hook
 * Manages loading, error, and data states for async operations
 * Provides a consistent pattern for handling API calls with loading indicators
 */

import { useState, useCallback, useRef } from "react";

interface UseAsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOperationReturn<T> extends UseAsyncOperationState<T> {
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useAsyncOperation<T = unknown>(
  initialData: T | null = null
): UseAsyncOperationReturn<T> {
  const [state, setState] = useState<UseAsyncOperationState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | null> => {
      setState({ data: state.data, loading: true, error: null });

      try {
        const result = await operation();

        if (isMountedRef.current) {
          setState({ data: result, loading: false, error: null });
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (isMountedRef.current) {
          setState({
            data: state.data,
            loading: false,
            error,
          });
        }

        throw error;
      }
    },
    [state.data]
  );

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return { ...state, execute, reset, setData };
}

/**
 * useCMSPageContent Hook
 * Specialized hook for loading page content from CMS with loading state
 */
import { fetchPageContent } from "../services/cms";
import type { PageContent } from "../services/cms";

export function useCMSPageContent(pageSlug: string) {
  const { data, loading, error, execute } =
    useAsyncOperation<PageContent | null>(null);

  const loadContent = useCallback(async () => {
    return execute(async () => {
      const content = await fetchPageContent(pageSlug);
      if (!content) {
        throw new Error(`Failed to load page content for "${pageSlug}"`);
      }
      return content;
    });
  }, [execute, pageSlug]);

  return {
    content: data,
    loading,
    error,
    loadContent,
  };
}

/**
 * useStripeCheckout Hook
 * Specialized hook for checkout session creation with loading state
 */
import { createCheckoutSession, type CartItem } from "../services/payment";

interface CheckoutOptions {
  customerEmail?: string;
  userId?: string;
  metadata?: Record<string, string>;
  customerName?: string;
  shippingAddress?: unknown;
  shippingMethod?: string;
  shippingCost?: number;
}

export function useStripeCheckout() {
  const { loading, error, execute } = useAsyncOperation();

  const createSession = useCallback(
    async (items: CartItem[], options: CheckoutOptions = {}) => {
      return execute(async () => {
        const session = await createCheckoutSession(
          items,
          options.customerEmail,
          options.userId,
          options.metadata,
          options.customerName,
          options.shippingAddress,
          options.shippingMethod,
          options.shippingCost
        );

        if (!session || !session.url) {
          throw new Error("Invalid checkout session created");
        }

        return session;
      });
    },
    [execute]
  );

  return {
    loading,
    error,
    createSession,
  };
}

/**
 * usePageContentWithFallback Hook
 * Loads page content with automatic fallback to hardcoded defaults
 */
// PageContent type imported from services/cms above

export function usePageContentWithFallback(
  pageSlug: string,
  fallbackContent: PageContent
) {
  const [content, setContent] = useState<PageContent>(fallbackContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedContent = await fetchPageContent(pageSlug);
      if (fetchedContent) {
        setContent(fetchedContent);
      }
      // Use fallback if null is returned
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      // Keep fallback content on error
    } finally {
      setLoading(false);
    }
  }, [pageSlug]);

  return {
    content,
    loading,
    error,
    loadContent,
  };
}
