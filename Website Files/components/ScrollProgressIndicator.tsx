import { useState, useEffect } from "react";

/**
 * ScrollProgressIndicator - Shows a horizontal progress bar at the top of the page
 * indicating how far the user has scrolled down the page
 */
export function ScrollProgressIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Calculate scroll percentage
      const totalScrollableHeight = scrollHeight - clientHeight;
      const progress =
        totalScrollableHeight > 0 ? scrollTop / totalScrollableHeight : 0;

      setScrollProgress(Math.min(Math.max(progress, 0), 1)); // Clamp between 0 and 1
    };

    // Update on mount
    updateScrollProgress();

    // Update on scroll
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

    // Cleanup
    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-sky-500 to-blue-600 z-50 shadow-lg shadow-sky-500/50"
      style={{
        width: `${scrollProgress * 100}%`,
        transition: "width 0.3s ease-out",
      }}
      aria-hidden="true"
    />
  );
}
