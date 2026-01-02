import React, { useMemo, useState } from "react";
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

const BRAND_LOGOS: Record<string, string> = {
  // Cases
  fractal:
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/Fractal_Design_logo.png",
  "fractal design":
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/Fractal_Design_logo.png",
  corsair:
    "https://upload.wikimedia.org/wikipedia/commons/0/0c/Corsair_logo.png",
  nzxt: "https://upload.wikimedia.org/wikipedia/commons/4/4a/NZXT_Logo.svg",
  "lian li":
    "https://upload.wikimedia.org/wikipedia/commons/4/4f/Lian_Li_logo.png",
  phanteks:
    "https://upload.wikimedia.org/wikipedia/commons/a/a7/Phanteks_Logo.png",
  "cooler master":
    "https://upload.wikimedia.org/wikipedia/commons/e/ed/Cooler_Master_logo.png",
  "be quiet":
    "https://upload.wikimedia.org/wikipedia/commons/8/88/Be_quiet%21_logo.svg",
  // CPUs / GPUs
  intel:
    "https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282006-2020%29.svg",
  amd: "https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg",
  nvidia: "https://upload.wikimedia.org/wikipedia/en/2/21/Nvidia_logo.svg",
  // Memory / storage
  corsairmemory:
    "https://upload.wikimedia.org/wikipedia/commons/0/0c/Corsair_logo.png",
  samsung:
    "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
  crucial:
    "https://upload.wikimedia.org/wikipedia/commons/0/00/Crucial_Technology_logo.svg",
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
  const [hasError, setHasError] = useState(false);

  const normalizedBrand = useMemo(
    () => (brand || "").toLowerCase().trim(),
    [brand]
  );

  const resolvedSrc = useMemo(() => {
    if (hasError) return undefined;
    if (src) return src;
    if (!normalizedBrand) return undefined;
    return (
      BRAND_LOGOS[normalizedBrand] ||
      BRAND_LOGOS[normalizedBrand.replace("!", "")]
    );
  }, [hasError, src, normalizedBrand]);

  const noLogo = !resolvedSrc;

  // If no logo, show brand text as fallback
  if (noLogo && showFallback && brand) {
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

  if (!resolvedSrc) return null;

  const logoElement = (
    <img
      src={resolvedSrc}
      alt={`${brand || "Brand"} logo`}
      className={cn("object-contain", sizeClasses[size], className)}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
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
