import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Premium Button Component System for Vortex PCs
 *
 * Features:
 * - Modern gradient backgrounds with smooth hover effects
 * - 3D depth with dynamic shadows
 * - Smooth scale animations on hover
 * - Shimmer effect on premium variant
 * - Consistent sizing and spacing
 *
 * Variants:
 * - primary/default: Sky-blue gradient (main CTA buttons)
 * - secondary: Cyan-blue gradient (alternative actions)
 * - success: Green gradient (confirmations, success states)
 * - danger: Red gradient (deletions, warnings)
 * - warning: Amber-orange gradient (caution actions)
 * - outline: Transparent with sky border (secondary actions)
 * - ghost: Subtle glassmorphism (tertiary actions)
 * - link: Text-only link style
 * - premium: Animated purple-pink-blue gradient (special features)
 *
 * Sizes:
 * - sm: Small, compact buttons
 * - default: Standard size for most use cases
 * - lg: Large buttons for primary actions
 * - xl: Extra large for hero sections and CTAs
 * - icon: Square icon-only buttons
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 relative overflow-hidden min-h-[44px] md:min-h-[40px] min-w-[44px] md:min-w-[40px]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 hover:scale-105 active:scale-[0.98] btn-premium-glow btn-3d",
        primary:
          "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 hover:scale-105 active:scale-[0.98] btn-premium-glow btn-3d",
        secondary:
          "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105 active:scale-[0.98] btn-premium-glow btn-3d",
        success:
          "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-[0.98] btn-premium-glow btn-3d",
        danger:
          "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 active:scale-[0.98] btn-premium-glow btn-3d",
        warning:
          "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 active:scale-[0.98] btn-premium-glow btn-3d",
        outline:
          "border-2 border-sky-500 bg-transparent text-sky-400 hover:bg-sky-500 hover:text-white hover:border-sky-400 shadow-md hover:shadow-lg hover:shadow-sky-500/20 hover:scale-105 active:scale-[0.98] transition-all duration-300",
        ghost:
          "bg-white/5 backdrop-blur-sm text-gray-300 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 hover:scale-105 active:scale-[0.98] transition-all duration-300",
        link: "text-sky-400 underline-offset-4 hover:underline hover:text-sky-300 transition-colors min-h-[unset] min-w-[unset]",
        premium:
          "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105 active:scale-[0.98] btn-shimmer btn-3d animate-gradient bg-[length:200%_100%]",
      },
      size: {
        default: "h-11 px-5 py-2.5 has-[>svg]:px-4 text-base md:text-sm",
        sm: "h-9 rounded-md gap-1.5 px-4 text-sm md:text-xs has-[>svg]:px-3",
        lg: "h-12 rounded-lg px-7 text-lg md:text-base has-[>svg]:px-5",
        xl: "h-14 rounded-xl px-8 text-xl md:text-lg has-[>svg]:px-6",
        icon: "size-11 md:size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
