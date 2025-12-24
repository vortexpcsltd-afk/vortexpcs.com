import React from "react";
import { cn } from "./utils";

interface BrandLogoProps {
  src?: string;
  brand?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
  withBackground?: boolean;
}

const sizeClasses = {
  xs: "h-3 w-auto max-w-[40px]",
  sm: "h-4 w-auto max-w-[60px]",
  md: "h-6 w-auto max-w-[80px]",
  lg: "h-8 w-auto max-w-[100px]",
  xl: "h-12 w-auto max-w-[140px]",
};

/**
 * BrandLogo Component
 * Displays manufacturer/brand logos with consistent styling
 *
 * Features:
 * - Multiple size presets (xs, sm, md, lg, xl)
 * - Automatic fallback to brand text when logo unavailable
 * - Optional background for better contrast on dark themes
 * - Maintains aspect ratio
 * - Lazy loading for performance
 *
 * @example
 * <BrandLogo src={component.brandLogo} brand={component.brand} size="md" />
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  src,
  brand,
  size = "md",
  className,
  showFallback = true,
  withBackground = false,
}) => {
  // If no logo, show brand text as fallback
  if (!src && showFallback && brand) {
    return (
      <div
        className={cn(
          "inline-flex items-center px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 font-medium text-xs",
          className
        )}
      >
        {brand}
      </div>
    );
  }

  if (!src) return null;

  const logoElement = (
    <img
      src={src}
      alt={`${brand || "Brand"} logo`}
      className={cn("object-contain", sizeClasses[size], className)}
      loading="lazy"
    />
  );

  // Optional background container for better visibility
  if (withBackground) {
    return (
      <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-white/5 border border-white/10">
        {logoElement}
      </div>
    );
  }

  return logoElement;
};

export default BrandLogo;
