import React, { useEffect, useRef, useState } from "react";
import { cn } from "./ui/utils";

interface ProgressiveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string; // full resolution
  srcSet?: string; // responsive sources
  sizes?: string; // responsive sizes
  placeholderSrc?: string; // low-res / blurred placeholder (tiny base64 or solid color)
  aspectRatio?: string; // e.g. '16/9'
  transitionDurationMs?: number;
  lazy?: boolean;
  shimmer?: boolean;
  onLoadFull?: () => void;
}

/*
  ProgressiveImage - Blur-up + lazy loading
  - Uses IntersectionObserver when lazy=true
  - Displays a low-res placeholder until full image loaded
  - Adds a subtle shimmer overlay if shimmer=true
  - Falls back gracefully if placeholder not provided
*/
export function ProgressiveImage({
  src,
  alt = "",
  srcSet,
  sizes,
  placeholderSrc,
  aspectRatio,
  transitionDurationMs = 400,
  lazy = true,
  shimmer = true,
  onLoadFull,
  className,
  ...rest
}: ProgressiveImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isInView, setIsInView] = useState(!lazy); // if not lazy, consider in view immediately
  const [loadedFull, setLoadedFull] = useState(false);
  const [hasError, setHasError] = useState(false);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Load full image once in view
  useEffect(() => {
    if (!isInView) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoadedFull(true);
      onLoadFull?.();
    };
    img.onerror = () => setHasError(true);
  }, [isInView, src, onLoadFull]);

  const showPlaceholder = !loadedFull && !hasError;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-md bg-white/5 border border-white/10",
        aspectRatio ? "[aspect-ratio:var(--pi-aspect)]" : "",
        className
      )}
      style={
        aspectRatio
          ? ({ "--pi-aspect": aspectRatio } as React.CSSProperties)
          : undefined
      }
    >
      {/* Placeholder layer */}
      {showPlaceholder && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-white/5",
            placeholderSrc ? "" : "",
            loadedFull ? "opacity-0" : "opacity-100",
            "transition-opacity duration-300"
          )}
        >
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt=""
              aria-hidden
              className={cn(
                "w-full h-full object-cover blur-xl scale-105",
                loadedFull ? "opacity-0" : "opacity-100",
                "transition-opacity duration-300"
              )}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800/40 to-slate-900/40" />
          )}
          {shimmer && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          )}
        </div>
      )}

      {/* Full image (only add when in view) */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={cn(
            "w-full h-full object-cover select-none",
            showPlaceholder ? "opacity-0" : "opacity-100",
            `transition-opacity duration-${transitionDurationMs}`
          )}
          {...rest}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 text-red-400 text-sm">
          Image failed to load
        </div>
      )}
    </div>
  );
}

export default ProgressiveImage;
