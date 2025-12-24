/**
 * StarRating Component
 * Displays and allows selection of star ratings with half-star support
 */

import { Star } from "lucide-react";
import { cn } from "./ui/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleClick = (index: number, half: boolean) => {
    if (!interactive || !onChange) return;
    const newRating = index + (half ? 0.5 : 1);
    onChange(newRating);
  };

  const handleHover = (_index: number, _half: boolean) => {
    if (!interactive) return;
    // You can add hover preview state here if desired
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = rating >= starValue;
          const isHalfFilled = rating >= starValue - 0.5 && rating < starValue;

          return (
            <div
              key={index}
              className={cn("relative", interactive && "cursor-pointer group")}
            >
              {/* Full star or empty star */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-all duration-200",
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-gray-600",
                  interactive && "group-hover:scale-110"
                )}
                onClick={() => handleClick(index, false)}
                onMouseEnter={() => handleHover(index, false)}
              />

              {/* Half star overlay */}
              {isHalfFilled && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: "50%" }}
                  onClick={() => handleClick(index, true)}
                  onMouseEnter={() => handleHover(index, true)}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "fill-yellow-400 text-yellow-400 transition-all duration-200",
                      interactive && "group-hover:scale-110"
                    )}
                  />
                </div>
              )}

              {/* Interactive overlay for half stars */}
              {interactive && (
                <>
                  <div
                    className="absolute inset-0"
                    style={{ width: "50%" }}
                    onClick={() => handleClick(index, true)}
                    onMouseEnter={() => handleHover(index, true)}
                  />
                  <div
                    className="absolute inset-0 left-1/2"
                    onClick={() => handleClick(index, false)}
                    onMouseEnter={() => handleHover(index, false)}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm text-gray-300 ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
