import { Card } from "./ui/card";
import { cn } from "./ui/utils";

// Base skeleton building blocks
export const SkeletonBox = ({
  className,
  shimmer = true,
}: {
  className?: string;
  shimmer?: boolean;
}) => (
  <div
    className={cn(
      "bg-white/10 rounded",
      shimmer && "relative overflow-hidden",
      className
    )}
  >
    {shimmer && (
      <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
    )}
  </div>
);

export const SkeletonText = ({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) => (
  <div className={cn("space-y-2", className)}>
    {[...Array(lines)].map((_, i) => (
      <SkeletonBox
        key={i}
        className={cn("h-4", i === lines - 1 && lines > 1 ? "w-2/3" : "w-full")}
      />
    ))}
  </div>
);

export const SkeletonImage = ({ className }: { className?: string }) => (
  <SkeletonBox className={cn("w-full h-48", className)} />
);

export const SkeletonButton = ({ className }: { className?: string }) => (
  <SkeletonBox className={cn("h-10 w-32", className)} />
);

export const SkeletonBadge = ({ className }: { className?: string }) => (
  <SkeletonBox className={cn("h-6 w-20", className)} />
);

// Hero section skeleton
export const HeroSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="max-w-6xl mx-auto text-center space-y-8">
      <SkeletonBox className="h-16 w-3/4 mx-auto" />
      <SkeletonBox className="h-24 w-full max-w-3xl mx-auto" />
      <div className="flex flex-wrap gap-4 justify-center">
        <SkeletonButton className="w-48" />
        <SkeletonButton className="w-48" />
      </div>
    </div>
  </div>
);

// Product card skeleton
export const ProductCardSkeleton = ({
  viewMode = "grid",
}: {
  viewMode?: "grid" | "list";
}) => {
  if (viewMode === "list") {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
            <div className="sm:col-span-3">
              <SkeletonImage className="h-32" />
            </div>
            <div className="sm:col-span-6 space-y-3">
              <SkeletonBox className="h-6 w-3/4" />
              <SkeletonText lines={2} />
              <div className="flex gap-2">
                <SkeletonBadge />
                <SkeletonBadge className="w-24" />
              </div>
            </div>
            <div className="sm:col-span-3 space-y-3">
              <SkeletonBox className="h-8 w-24 ml-auto" />
              <SkeletonButton className="w-full" />
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
        <SkeletonImage />
        <div className="space-y-3">
          <SkeletonBox className="h-6 w-3/4" />
          <SkeletonBox className="h-4 w-1/2" />
          <SkeletonText lines={2} />
          <div className="flex gap-2">
            <SkeletonBadge />
            <SkeletonBadge />
          </div>
          <SkeletonBox className="h-8 w-24" />
          <SkeletonButton className="w-full" />
        </div>
      </div>
    </Card>
  );
};

// Featured build card skeleton
export const FeaturedBuildSkeleton = () => (
  <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative group">
    <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
    <div className="aspect-video relative">
      <SkeletonImage className="h-full" />
    </div>
    <div className="p-6 space-y-4">
      <SkeletonBadge />
      <SkeletonBox className="h-7 w-4/5" />
      <SkeletonText lines={3} />
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-8 w-32" />
        <SkeletonButton />
      </div>
    </div>
  </Card>
);

// Testimonial card skeleton
export const TestimonialSkeleton = () => (
  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 space-y-4 overflow-hidden relative">
    <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
    <div className="flex gap-2">
      {[...Array(5)].map((_, i) => (
        <SkeletonBox key={i} className="h-5 w-5" />
      ))}
    </div>
    <SkeletonText lines={4} />
    <div className="flex items-center gap-4">
      <SkeletonBox className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-4 w-24" />
      </div>
    </div>
  </Card>
);

// FAQ accordion skeleton
export const FAQItemSkeleton = () => (
  <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
    <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
    <div className="p-6">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-6 w-3/4" />
        <SkeletonBox className="h-6 w-6 rounded-full" />
      </div>
    </div>
  </Card>
);

// Form field skeleton
export const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <SkeletonBox className="h-5 w-32" />
    <SkeletonBox className="h-10 w-full" />
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <div
    className="grid gap-4"
    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
  >
    {[...Array(columns)].map((_, i) => (
      <SkeletonBox key={i} className="h-8" />
    ))}
  </div>
);

// Order card skeleton
export const OrderCardSkeleton = () => (
  <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
    <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-6 w-32" />
        <SkeletonBadge />
      </div>
      <SkeletonText lines={2} />
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <SkeletonBox className="h-8 w-24" />
        <SkeletonButton className="w-28" />
      </div>
    </div>
  </Card>
);

// Profile section skeleton
export const ProfileSkeleton = () => (
  <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
    <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SkeletonBox className="h-20 w-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-7 w-48" />
          <SkeletonBox className="h-5 w-64" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
      <SkeletonButton className="w-full sm:w-auto" />
    </div>
  </Card>
);

// Grid layout skeleton
export const GridSkeleton = ({
  count = 6,
  columns = 3,
  SkeletonComponent = ProductCardSkeleton,
}: {
  count?: number;
  columns?: number;
  SkeletonComponent?: typeof ProductCardSkeleton;
}) => (
  <div
    className="grid gap-6"
    style={{
      gridTemplateColumns: `repeat(auto-fill, minmax(${
        columns === 2 ? "300px" : "280px"
      }, 1fr))`,
    }}
  >
    {[...Array(count)].map((_, i) => (
      <SkeletonComponent key={i} />
    ))}
  </div>
);

// List layout skeleton
export const ListSkeleton = ({
  count = 5,
  SkeletonComponent = ProductCardSkeleton,
}: {
  count?: number;
  SkeletonComponent?: typeof ProductCardSkeleton;
}) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <SkeletonComponent key={i} viewMode="list" />
    ))}
  </div>
);

// Checkout summary skeleton
export const CheckoutSummarySkeleton = () => (
  <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
    <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
    <div className="p-6 space-y-4">
      <SkeletonBox className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <SkeletonBox className="h-16 w-16 rounded" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-5 w-3/4" />
              <SkeletonBox className="h-4 w-1/2" />
            </div>
            <SkeletonBox className="h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 pt-4 space-y-2">
        <div className="flex justify-between">
          <SkeletonBox className="h-5 w-20" />
          <SkeletonBox className="h-5 w-16" />
        </div>
        <div className="flex justify-between">
          <SkeletonBox className="h-5 w-24" />
          <SkeletonBox className="h-5 w-16" />
        </div>
        <div className="flex justify-between pt-2 border-t border-white/10">
          <SkeletonBox className="h-7 w-20" />
          <SkeletonBox className="h-7 w-24" />
        </div>
      </div>
    </div>
  </Card>
);

// Repair service option skeleton
export const RepairOptionSkeleton = () => (
  <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative hover:border-sky-500/30 transition-all cursor-pointer">
    <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
    <div className="p-6 space-y-4">
      <SkeletonBox className="h-12 w-12 rounded-lg" />
      <SkeletonBox className="h-6 w-3/4" />
      <SkeletonText lines={3} />
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <SkeletonBox className="h-8 w-32" />
        <SkeletonBox className="h-5 w-24" />
      </div>
    </div>
  </Card>
);

// Page header skeleton
export const PageHeaderSkeleton = () => (
  <div className="text-center space-y-4 mb-12">
    <SkeletonBox className="h-12 w-64 mx-auto" />
    <SkeletonBox className="h-6 w-96 mx-auto" />
  </div>
);
