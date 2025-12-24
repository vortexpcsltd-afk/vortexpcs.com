import { useState, useEffect } from "react";

// Hook to detect exit intent
export function useExitIntent(
  onExitIntent: () => void,
  options: {
    enabled?: boolean;
    sensitivity?: number;
    delayMs?: number;
    triggerOnce?: boolean;
  } = {}
) {
  const {
    enabled = true,
    sensitivity = 20,
    delayMs = 0,
    triggerOnce = true,
  } = options;

  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!enabled || (triggerOnce && hasTriggered)) return;

    let timeoutId: number;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves to top of screen (likely to close tab/window)
      if (e.clientY <= sensitivity && e.relatedTarget === null) {
        if (delayMs > 0) {
          timeoutId = window.setTimeout(() => {
            onExitIntent();
            if (triggerOnce) setHasTriggered(true);
          }, delayMs);
        } else {
          onExitIntent();
          if (triggerOnce) setHasTriggered(true);
        }
      }
    };

    document.addEventListener("mouseout", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseout", handleMouseLeave);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, sensitivity, delayMs, onExitIntent, triggerOnce, hasTriggered]);

  return { hasTriggered, reset: () => setHasTriggered(false) };
}
