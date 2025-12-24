/**
 * Optimized Image Component
 * Implements lazy loading, proper sizing, and modern image formats
 */

import { useState, useEffect, useRef, type ReactNode } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  loading = "lazy",
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // If priority or eager loading, start loading immediately
    if (priority || loading === "eager") {
      const img = imgRef.current;
      if (img && img.complete) {
        setIsLoaded(true);
      }
    }
  }, [priority, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : loading}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className={`${className} ${
        isLoaded ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
      }}
    />
  );
}

/**
 * Background Image Component with lazy loading
 */
interface BackgroundImageProps {
  src: string;
  className?: string;
  children?: ReactNode;
}

export function BackgroundImage({
  src,
  className = "",
  children,
}: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" }
    );

    if (divRef.current) {
      observer.observe(divRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div
      ref={divRef}
      className={`${className} ${
        isLoaded ? "opacity-100" : "opacity-0"
      } transition-opacity duration-500`}
      style={
        isLoaded
          ? {
              backgroundImage: `url(${src})`,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
