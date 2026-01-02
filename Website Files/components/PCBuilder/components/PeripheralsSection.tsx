/**
 * @component PeripheralsSection
 * @description Displays optional peripherals and accessories with tabbed interface.
 * Includes 8 peripheral categories: keyboards, mice, monitors, mousepads,
 * gamepads, headsets, cables, and software/OS options. Each category
 * displays items in a responsive grid with selection tracking.
 *
 * Features:
 * - 8 peripheral categories with icons and labels
 * - Responsive tab interface (mobile-optimized abbreviated labels)
 * - Grid display of peripheral cards (2-3 columns responsive)
 * - Selection count badges per category
 * - Peripheral card component for each item
 * - Glassmorphism design with theme consistency
 *
 * @example
 * ```tsx
 * <PeripheralsSection
 *   selectedPeripherals={peripherals}
 *   activeOptionalExtrasData={extrasMap}
 *   viewMode="grid"
 *   onPeripheralToggle={handleToggle}
 * />
 * ```
 */

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Badge } from "../../ui/badge";
import {
  Keyboard,
  Mouse,
  Monitor,
  Package,
  Gamepad,
  Headphones,
  Cable,
  Shield,
} from "lucide-react";
import { PCOptionalExtra } from "../types";

/**
 * Peripheral categories with their display names and descriptions
 */
const PERIPHERAL_CATEGORIES = {
  keyboard: {
    label: "Keyboards",
    shortLabel: "Keys",
    title: "Gaming Keyboards",
    description:
      "Premium mechanical keyboards for the ultimate typing experience",
    icon: Keyboard,
  },
  mouse: {
    label: "Mice",
    shortLabel: "Mice",
    title: "Gaming Mice",
    description: "Precision gaming mice with cutting-edge sensors",
    icon: Mouse,
  },
  monitor: {
    label: "Monitors",
    shortLabel: "Mon",
    title: "Gaming Monitors",
    description:
      "High-refresh displays for competitive gaming and immersive visuals",
    icon: Monitor,
  },
  mousepad: {
    label: "Mousepads",
    shortLabel: "Mat",
    title: "Gaming Mousepads",
    description: "Premium surfaces for optimal mouse tracking and comfort",
    icon: Package,
  },
  gamepad: {
    label: "Gamepads",
    shortLabel: "Pad",
    title: "Gaming Controllers",
    description: "Professional-grade controllers for console and PC gaming",
    icon: Gamepad,
  },
  headset: {
    label: "Headsets",
    shortLabel: "Head",
    title: "Gaming Headsets",
    description: "Immersive audio for gaming and communication",
    icon: Headphones,
  },
  cable: {
    label: "Cables",
    shortLabel: "Cable",
    title: "Cables & Accessories",
    description: "Essential cables and connectivity solutions",
    icon: Cable,
  },
  software: {
    label: "Operating System",
    shortLabel: "OS",
    title: "Operating System",
    description: "Choose Windows edition for your build",
    icon: Shield,
  },
};

/**
 * Props for PeripheralsSection component
 */
interface PeripheralsSectionProps {
  /** Map of selected peripherals by category */
  selectedPeripherals: Record<string, string[]>;
  /** Map of peripheral data by category */
  activeOptionalExtrasData: Record<string, PCOptionalExtra[]>;
  /** Current view mode (grid or list) */
  viewMode: "grid" | "list";
  /** Callback when peripheral is toggled */
  onPeripheralToggle: (category: string, itemId: string) => void;
  /** Memoized peripheral card component */
  MemoPeripheralCard: React.ComponentType<{
    key: string;
    peripheral: PCOptionalExtra;
    category: string;
    isSelected: boolean;
    onToggle: (category: string, itemId: string) => void;
    viewMode: "grid" | "list";
  }>;
}

/**
 * PeripheralsSection component
 * Displays optional peripherals and accessories with tabbed navigation
 */
export const PeripheralsSection: React.FC<PeripheralsSectionProps> = ({
  selectedPeripherals,
  activeOptionalExtrasData,
  viewMode,
  onPeripheralToggle,
  MemoPeripheralCard,
}) => {
  const tabOrder: Array<keyof typeof PERIPHERAL_CATEGORIES> = [
    "keyboard",
    "mouse",
    "monitor",
    "mousepad",
    "gamepad",
    "headset",
    "cable",
    "software",
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3 sm:space-y-4 px-4">
        <div className="inline-block">
          <Badge className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-500/40 text-green-300 text-sm px-4 py-2">
            Optional Extras
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent px-4">
          Enhance Your Setup
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto px-4">
          Complete your setup with premium keyboards, mice, displays, audio, and
          software - engineered for gamers, creators, and professionals who
          demand comfort, low latency, and reliable performance.
        </p>
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="keyboard" className="space-y-6 sm:space-y-8">
        {/* Tab List */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 bg-white/10 backdrop-blur-xl p-2 rounded-xl gap-2 h-auto">
          {tabOrder.map((category) => {
            const config = PERIPHERAL_CATEGORIES[category];
            const IconComponent = config.icon;
            return (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 rounded-lg transition-all h-auto flex-none whitespace-nowrap"
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{config.shortLabel}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Contents */}
        {tabOrder.map((category) => {
          const config = PERIPHERAL_CATEGORIES[category];
          const items = activeOptionalExtrasData[category] || [];
          const selectedCount = (selectedPeripherals[category] || []).length;

          return (
            <TabsContent key={category} value={category} className="space-y-6">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {config.title}
                  </h3>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    {config.description}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-sm self-start sm:self-auto"
                >
                  {selectedCount} selected
                </Badge>
              </div>

              {/* Items Grid */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item: PCOptionalExtra) => (
                  <MemoPeripheralCard
                    key={item.id}
                    peripheral={item}
                    category={category}
                    isSelected={(selectedPeripherals[category] || []).includes(
                      item.id
                    )}
                    onToggle={onPeripheralToggle}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

PeripheralsSection.displayName = "PeripheralsSection";
