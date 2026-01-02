import React from "react";
import { Badge } from "./badge";

export interface PriceTagProps {
  price: number;
  reducedPrice?: number;
  currency?: "GBP" | "USD" | "EUR";
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  align?: "left" | "right";
  className?: string;
  showSavings?: boolean;
}

const currencySymbol = (currency?: PriceTagProps["currency"]) => {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
    default:
      return "£";
  }
};

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  reducedPrice,
  currency = "GBP",
  size = "md",
  showBadge = true,
  align = "left",
  className = "",
  showSavings = true,
}) => {
  const symbol = currencySymbol(currency);
  const isOnSale = typeof reducedPrice === "number" && reducedPrice < price;
  const finalPrice = isOnSale ? (reducedPrice as number) : price;
  const savings = isOnSale ? price - finalPrice : 0;
  const pct = isOnSale && price > 0 ? Math.round((savings / price) * 100) : 0;

  const sizeClasses = (() => {
    switch (size) {
      case "sm":
        return { main: "text-lg", strike: "text-base" };
      case "lg":
        return { main: "text-4xl", strike: "text-2xl" };
      case "md":
      default:
        return { main: "text-xl", strike: "text-lg" };
    }
  })();

  const alignClasses = align === "right" ? "items-end" : "items-start";
  const rowAlign = align === "right" ? "justify-end" : "justify-start";

  return (
    <div className={`flex flex-col ${alignClasses} ${className}`}>
      {isOnSale && showBadge && (
        <div className={`mb-1 ${rowAlign} w-full flex`}>
          <Badge className="bg-red-500/20 border-red-500/40 text-red-300">
            {`Save ${symbol}${savings.toFixed(2)} (${pct}% )`}
          </Badge>
        </div>
      )}
      <div className={`flex items-baseline gap-2 ${rowAlign} w-full`}>
        {isOnSale && (
          <div
            className={`${sizeClasses.strike} text-gray-400/80 line-through decoration-red-500/70 decoration-2`}
          >
            {symbol}
            {price.toFixed(2)}
          </div>
        )}
        <div
          className={`${sizeClasses.main} font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent`}
        >
          {symbol}
          {finalPrice.toFixed(2)}
        </div>
      </div>
      {isOnSale && showSavings && (
        <div className="text-[11px] text-sky-300/90 mt-0.5">
          You save {symbol}
          {savings.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default PriceTag;
