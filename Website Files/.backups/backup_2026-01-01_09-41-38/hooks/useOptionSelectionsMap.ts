import { useRef, useCallback } from "react";

export type OptionSelections = Record<string, string>;

export function useOptionSelectionsMap() {
  const cacheRef = useRef<Map<string, OptionSelections>>(new Map());

  const get = useCallback(
    (componentId: string): OptionSelections | undefined => {
      const cached = cacheRef.current.get(componentId);
      if (cached) return cached;
      try {
        const raw = sessionStorage.getItem(`optionSelections_${componentId}`);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as OptionSelections;
        cacheRef.current.set(componentId, parsed);
        return parsed;
      } catch {
        return undefined;
      }
    },
    []
  );

  const set = useCallback(
    (componentId: string, selections: OptionSelections) => {
      cacheRef.current.set(componentId, selections);
      try {
        sessionStorage.setItem(
          `optionSelections_${componentId}`,
          JSON.stringify(selections)
        );
      } catch {
        // ignore storage errors
      }
    },
    []
  );

  const clear = useCallback((componentId?: string) => {
    if (componentId) {
      cacheRef.current.delete(componentId);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  return { get, set, clear };
}
