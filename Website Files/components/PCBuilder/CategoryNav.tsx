import React from "react";
import { CheckCircle } from "lucide-react";
import { Card } from "../ui/card";

export interface CategoryItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  description: string;
}

interface CategoryNavProps {
  categories: CategoryItem[];
  activeCategory: string;
  selectedComponents: Record<string, unknown>;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * CategoryNav Component
 *
 * Displays a vertical list of component categories with:
 * - Category icons and labels
 * - Component counts per category
 * - Selected state indicators (CheckCircle when component selected)
 * - Category descriptions
 * - Click handler to switch active category
 *
 * @component
 */
export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategory,
  selectedComponents,
  onCategoryChange,
}) => {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 sm:p-6 lg:block">
      <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
        Components
      </h3>
      <div className="space-y-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = activeCategory === category.id;
          const hasComponent = Boolean(selectedComponents[category.id]);

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`w-full flex flex-col items-start p-2.5 sm:p-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                isSelected
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "hover:bg-white/10 text-gray-300 hover:text-white"
              }`}
              aria-pressed={isSelected}
              aria-label={`Select ${category.label} category${
                hasComponent ? " (selected)" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0 w-full">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium truncate">{category.label}</span>
                </div>
                {hasComponent && (
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-7 text-left">
                {category.description}
              </p>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default CategoryNav;
