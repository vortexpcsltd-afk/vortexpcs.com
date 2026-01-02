/**
 * @component CategoryNav
 * @description Navigation component for selecting PC builder categories.
 * Displays a list of component categories with icons, descriptions, and selected state.
 * Provides visual feedback for the currently active category and highlights when components are selected.
 *
 * @example
 * ```tsx
 * <CategoryNav
 *   categories={categories}
 *   activeCategory={activeCategory}
 *   onCategoryChange={handleCategoryChange}
 *   selectedComponents={selectedComponents}
 * />
 * ```
 */

import React from "react";
import { Card } from "../../ui/card";
import { CheckCircle } from "lucide-react";
import { SelectedComponentIds, CategoryKey } from "../types";

/**
 * Category object structure
 */
interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  description: string;
}

/**
 * Props for CategoryNav component
 */
interface CategoryNavProps {
  /** Array of available component categories */
  categories: Category[];
  /** Currently active category ID */
  activeCategory: string;
  /** Callback fired when user selects a different category */
  onCategoryChange: (categoryId: CategoryKey) => void;
  /** Map of selected component IDs by category */
  selectedComponents: SelectedComponentIds;
  /** Current page number (for pagination state management) */
  currentPage?: number;
  /** Callback to save current page before category switch */
  onSavePage?: (categoryId: string, page: number) => void;
}

/**
 * CategoryNav Component
 *
 * Renders a vertical list of component categories with:
 * - Category icon and name
 * - Component count badge
 * - Description tooltip on hover
 * - Selected state indicator (green checkmark)
 * - Active category highlighting (sky-500 color)
 *
 * Responsive design:
 * - Mobile: Compact layout with smaller padding
 * - Desktop: Full descriptions visible
 *
 * @param props Component props
 * @returns Rendered category navigation card
 */
export function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
  selectedComponents,
  currentPage = 1,
  onSavePage,
}: CategoryNavProps) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 sm:p-6 lg:block">
      <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
        Components
      </h3>
      <div className="space-y-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = activeCategory === category.id;
          const hasComponent =
            selectedComponents[category.id as keyof SelectedComponentIds];

          return (
            <button
              key={category.id}
              onClick={() => {
                // Save current page before switching categories
                if (onSavePage) {
                  onSavePage(activeCategory, currentPage);
                }
                onCategoryChange(category.id as CategoryKey);
              }}
              className={`w-full flex flex-col items-start p-2.5 sm:p-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                isSelected
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "hover:bg-white/10 text-gray-300 hover:text-white"
              }`}
              title={category.description}
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
}

export default CategoryNav;
