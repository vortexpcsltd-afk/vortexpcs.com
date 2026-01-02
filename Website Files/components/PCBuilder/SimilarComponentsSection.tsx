/**
 * Similar Components Section Component
 * Displays "Users Also Considered" and upgrade recommendations
 */

import React, { useMemo } from "react";
import {
  findSimilarComponents,
  getUpgradeRecommendations,
  getBudgetAlternatives,
  SimilarComponentMatch,
  trackComponentComparison,
} from "../../services/componentRecommendation";
import { PCBuilderComponent } from "../PCBuilder";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { PriceTag } from "../ui/PriceTag";
import { TrendingUp, DollarSign, Star } from "lucide-react";

interface SimilarComponentsProps {
  component: PCBuilderComponent;
  allComponents: PCBuilderComponent[];
  onSelectComponent?: (component: PCBuilderComponent) => void;
}

export const SimilarComponentsSection: React.FC<SimilarComponentsProps> = ({
  component,
  allComponents,
  onSelectComponent,
}) => {
  const similarComponents = useMemo(
    () => findSimilarComponents(component, allComponents, 3),
    [component, allComponents]
  );

  const upgradeOptions = useMemo(
    () => getUpgradeRecommendations(component, allComponents, 2),
    [component, allComponents]
  );

  const budgetOptions = useMemo(
    () => getBudgetAlternatives(component, allComponents, 30, 2),
    [component, allComponents]
  );

  const handleComponentClick = (selectedComponent: PCBuilderComponent) => {
    trackComponentComparison(component.id, selectedComponent.id, "compared");
    onSelectComponent?.(selectedComponent);
  };

  const getImageUrl = (comp: PCBuilderComponent): string => {
    if (Array.isArray(comp.images) && comp.images.length > 0) {
      const img = comp.images[0];
      return typeof img === "string"
        ? img
        : img.url ||
            img.src ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23374151' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23374151' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
  };

  const renderSimilarCard = (match: SimilarComponentMatch) => (
    <Card
      key={match.component.id}
      className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 overflow-hidden"
    >
      <div className="p-4 space-y-3">
        {/* Product Image + Name Section */}
        <div className="flex gap-3">
          {/* Thumbnail Image */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-800/50 border border-white/10 overflow-hidden">
            <img
              src={getImageUrl(match.component)}
              alt={match.component.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl(
                  match.component
                );
              }}
            />
          </div>

          {/* Name & Rating */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate leading-tight">
              {match.component.name}
            </h4>
            {match.component.rating && (
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(match.component.rating!)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  {match.component.rating}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
              {match.component.brand}
            </p>
          </div>
        </div>

        {/* Price Comparison Badge */}
        <div className="flex flex-col gap-2">
          <Badge
            className={`text-xs font-medium w-fit ${
              match.priceComparison === "cheaper"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : match.priceComparison === "more_expensive"
                ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                : "bg-sky-500/20 text-sky-300 border-sky-500/30"
            }`}
          >
            {match.priceComparison === "cheaper"
              ? "💰 Cheaper"
              : match.priceComparison === "more_expensive"
              ? "⬆️ Premium"
              : "≈ Similar Price"}
          </Badge>
          <p className="text-xs text-gray-400">{match.reason}</p>
        </div>

        {/* Price */}
        <div className="pt-2 border-t border-white/10">
          <PriceTag price={match.component.price || 0} size="sm" align="left" />
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs transition-all"
          onClick={() => handleComponentClick(match.component)}
        >
          ✓ Select This Option
        </Button>
      </div>
    </Card>
  );

  // Don't show section if no recommendations
  if (
    similarComponents.length === 0 &&
    upgradeOptions.length === 0 &&
    budgetOptions.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-6 mt-8 pt-6 border-t border-white/10">
      {/* Users Also Considered Section - Sky Blue Theme */}
      {similarComponents.length > 0 && (
        <div className="space-y-3 rounded-xl bg-sky-500/5 border border-sky-500/20 p-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-sky-500 to-blue-500 rounded-full" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Users Also Considered
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Similar products commonly paired with this component
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {similarComponents.map(renderSimilarCard)}
          </div>
        </div>
      )}

      {/* Performance Upgrades Section - Emerald Green Theme */}
      {upgradeOptions.length > 0 && (
        <div className="space-y-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Performance Upgrades
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Better performance at similar price point
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upgradeOptions.map(renderSimilarCard)}
          </div>
        </div>
      )}

      {/* Save Money Section - Amber Gold Theme */}
      {budgetOptions.length > 0 && (
        <div className="space-y-3 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Save Money
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Budget-friendly alternatives with strong compatibility
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgetOptions.map(renderSimilarCard)}
          </div>
        </div>
      )}
    </div>
  );
};
