import { Card } from "../../ui/card";

/**
 * Skeleton/loading placeholder components for PCBuilder
 *
 * This module provides shimmer-animated skeleton loaders displayed
 * while component data is being fetched from CMS. All skeletons use
 * glassmorphism styling with `animate-shimmer` effect defined in globals.css.
 */

/**
 * ComponentCardSkeleton - Loading placeholder for ComponentCard
 *
 * Features:
 * - Supports grid and list view modes matching ComponentCard layouts
 * - Shimmer animation overlay (animate-shimmer)
 * - Grid mode: Vertical card with image placeholder + content blocks
 * - List mode: Horizontal card with 3-column grid (image, content, price)
 * - Glassmorphism styling (bg-white/5, border-white/10)
 *
 * @component
 * @example
 * ```tsx
 * {isLoading && (
 *   <div className="grid grid-cols-3 gap-4">
 *     {Array.from({ length: 6 }).map((_, i) => (
 *       <ComponentCardSkeleton key={i} viewMode="grid" />
 *     ))}
 *   </div>
 * )}
 * ```
 */
export const ComponentCardSkeleton = ({
  viewMode = "grid",
}: {
  viewMode?: string;
}) => {
  if (viewMode === "list") {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
            {/* Image skeleton */}
            <div className="sm:col-span-3">
              <div className="w-full h-32 bg-white/10 rounded-lg"></div>
            </div>
            {/* Content skeleton */}
            <div className="sm:col-span-6 space-y-3">
              <div className="h-6 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-white/10 rounded"></div>
                <div className="h-6 w-24 bg-white/10 rounded"></div>
              </div>
            </div>
            {/* Price skeleton */}
            <div className="sm:col-span-3 space-y-3">
              <div className="h-8 bg-white/10 rounded w-24 ml-auto"></div>
              <div className="h-10 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
      <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
      <div className="p-6 space-y-4">
        {/* Image skeleton */}
        <div className="w-full h-48 bg-white/10 rounded-lg"></div>
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-6 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-white/10 rounded"></div>
            <div className="h-6 w-20 bg-white/10 rounded"></div>
          </div>
          <div className="h-8 bg-white/10 rounded w-24"></div>
          <div className="h-10 bg-white/10 rounded"></div>
        </div>
      </div>
    </Card>
  );
};

/**
 * BuildSummarySkeleton - Loading placeholder for BuildSummary panel
 *
 * Features:
 * - Simple card layout with 4 content blocks
 * - Glassmorphism styling matching BuildSummary
 * - Block placeholders for title, content, price, button
 * - No shimmer animation (static loading state)
 *
 * @component
 * @example
 * ```tsx
 * {!buildSummaryReady && <BuildSummarySkeleton />}
 * ```
 */
export const BuildSummarySkeleton = () => {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
      <div className="space-y-4">
        <div className="h-6 bg-white/10 rounded w-1/3"></div>
        <div className="h-32 bg-white/10 rounded-lg"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
        <div className="h-8 bg-white/10 rounded w-1/4"></div>
      </div>
    </Card>
  );
};

/**
 * CategoryNavSkeleton - Loading placeholder for category navigation buttons
 *
 * Features:
 * - Horizontal scrollable layout with 6 button placeholders
 * - Matches CategoryNav grid layout
 * - Flex-shrink-0 to prevent width compression
 * - Scrollbar hidden for clean appearance
 * - Simple block placeholders (no shimmer)
 *
 * @component
 * @example
 * ```tsx
 * {categoriesLoading ? (
 *   <CategoryNavSkeleton />
 * ) : (
 *   <CategoryNav categories={categories} />
 * )}
 * ```
 */
export const CategoryNavSkeleton = () => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 h-10 w-32 bg-white/10 rounded-lg"
        ></div>
      ))}
    </div>
  );
};
