import React, { useState } from "react";
import { Zap } from "lucide-react";
import { Badge } from "./ui/badge";

interface PointsBadgeProps {
  price: number;
  pointsPerPound?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "compact";
}

/**
 * Badge showing how many Vortex Vault points a customer earns when purchasing this product
 * Displays prominently on product cards and modals
 */
export function PointsBadge({
  price,
  pointsPerPound = 2,
  className = "",
  size: _size = "md",
  variant = "compact",
}: PointsBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const points = Math.floor(price * pointsPerPound);

  const tooltipContent = (
    <div className="max-w-xs">
      <p className="font-semibold mb-1">Vortex Vault Points</p>
      <p className="text-sm">
        Earn points with every purchase and redeem them for exclusive rewards,
        discounts, and premium Vortex Vault benefits. Accumulate points across
        all purchases!
      </p>
    </div>
  );

  // Compact variant for product cards - matches Featured tag style
  if (variant === "compact") {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`rounded-full bg-black/30 backdrop-blur-xl border-2 border-cyan-400/70 text-cyan-300 text-xs font-semibold tracking-wide px-3 py-1 shadow-[0_0_20px_rgba(34,211,238,0.25)] flex items-center gap-1.5 cursor-help ${className}`}
        >
          <Zap className="w-3 h-3 fill-cyan-400 text-cyan-400" />
          <span>{points} pts</span>
        </div>
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 z-50 bg-[#0b1b3f] border border-blue-700/60 rounded-lg p-3 w-[420px] max-w-[80vw] text-blue-50 shadow-2xl shadow-blue-500/25 backdrop-blur-md">
            {tooltipContent}
          </div>
        )}
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Badge
          className={`bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500/90 hover:to-blue-500/90 border-cyan-500/50 text-white font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/20 cursor-help ${className}`}
        >
          <Zap className="w-3.5 h-3.5 mr-1.5 fill-cyan-300 text-cyan-300" />
          Earn {points} Vortex Points with this product!
        </Badge>
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 z-50 bg-[#0b1b3f] border border-blue-700/60 rounded-lg p-3 w-[420px] max-w-[80vw] text-blue-50 shadow-2xl shadow-blue-500/25 backdrop-blur-md">
            {tooltipContent}
          </div>
        )}
      </div>
    );
  }

  // No fallback needed - all variants are handled above
  return null;
}

export default PointsBadge;
