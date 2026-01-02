import { Card } from "../ui/card";

/**
 * Skeleton loading components for PCBuilder
 * Shows animated placeholders while content loads
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

export const BuildSummarySkeleton = () => {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 sm:p-6 overflow-hidden relative">
      <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
      <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
      <div className="space-y-4">
        <div className="h-16 bg-white/10 rounded"></div>
        <div className="h-12 bg-white/10 rounded"></div>
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    </Card>
  );
};

export const CategoryNavSkeleton = () => {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 overflow-hidden relative">
      <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
      <div className="h-6 bg-white/10 rounded w-28 mb-4"></div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-white/10 rounded"></div>
        ))}
      </div>
    </Card>
  );
};
