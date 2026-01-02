import React from "react";
import {
  Activity,
  CheckCircle,
  Cpu,
  Eye,
  Fan,
  HardDrive,
  MemoryStick,
  Monitor,
  Package,
  Settings,
  Star,
  Video,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

import type {
  RecommendedBuildSpec,
  SelectedComponentIds,
  ComponentDataMap,
  PCBuilderComponent,
} from "../types";

/**
 * BuildDetailsModal - Modal displaying full recommended build specification
 *
 * Features:
 * - Dialog modal triggered from "View Build Details" button
 * - Build header with name, price, and estimated performance score
 * - Component list with category icons (CPU, GPU, RAM, etc.)
 * - Checkmark indicators for selected components
 * - Price breakdown per component
 * - Close button
 * - Glassmorphism styling with dark theme
 *
 * Component Icons:
 * - CPU → Cpu, GPU → Video, RAM → MemoryStick, Storage → HardDrive
 * - PSU → Zap, Motherboard → Settings, Cooling → Fan, Case → Package
 *
 * @component
 * @example
 * ```tsx
 * <BuildDetailsModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   recommendedBuild={{
 *     name: "Gaming Beast",
 *     price: 1499,
 *     estimatedPerformance: 95
 *   }}
 *   selectedComponents={{ cpu: "intel-i7-14700k", gpu: "rtx-4070-ti" }}
 *   componentData={allComponentData}
 * />
 * ```
 */
interface BuildDetailsModalProps {
  /** Whether the modal is currently visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Recommended build specification from PC Finder */
  recommendedBuild: RecommendedBuildSpec | null | undefined;
  /** Map of category → selected component ID */
  selectedComponents: SelectedComponentIds;
  /** Component data indexed by category */
  componentData: ComponentDataMap;
}

export const BuildDetailsModal: React.FC<BuildDetailsModalProps> = ({
  isOpen,
  onClose,
  recommendedBuild,
  selectedComponents,
  componentData,
}) => {
  if (!recommendedBuild) return null;

  const buildComponents: { category: string; component: PCBuilderComponent }[] =
    Object.entries(selectedComponents)
      .filter(([, componentId]) => !!componentId)
      .map(([category, componentId]) => {
        const list = (componentData[category] || []) as PCBuilderComponent[];
        const component = list.find((c) => c.id === componentId) as
          | PCBuilderComponent
          | undefined;
        return component ? { category, component } : null;
      })
      .filter(
        (item): item is { category: string; component: PCBuilderComponent } =>
          !!item
      );

  const totalPrice = buildComponents.reduce(
    (sum, item) => sum + (item?.component?.price || 0),
    0
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "case":
        return Monitor;
      case "motherboard":
        return Activity;
      case "cpu":
        return Cpu;
      case "gpu":
        return Video;
      case "ram":
        return MemoryStick;
      case "storage":
        return HardDrive;
      case "psu":
        return Zap;
      case "cooling":
        return Fan;
      case "caseFans":
        return Activity;
      default:
        return Package;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      case: "Case",
      motherboard: "Motherboard",
      cpu: "Processor (CPU)",
      gpu: "Graphics Card (GPU)",
      ram: "Memory (RAM)",
      storage: "Storage",
      psu: "Power Supply (PSU)",
      cooling: "Cooling System",
      caseFans: "Case Fans",
    };
    return labels[category] || category;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <Eye className="w-8 h-8 text-sky-400" />
            {recommendedBuild.name || "Recommended Build"}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-lg">
            Complete build specification from PC Finder recommendation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Build Overview */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Recommended Build
                </h3>
                <p className="text-gray-300 mb-3">
                  {recommendedBuild.description ||
                    "Custom configuration optimised for your needs"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Total Price</div>
                <div className="text-3xl font-bold text-green-400">
                  £{totalPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Components List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-400" />
              Build Components
            </h3>
            {buildComponents.map((item) => {
              const Icon = getCategoryIcon(item.category);
              return (
                <div
                  key={item.category}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400 mb-1">
                            {getCategoryLabel(item.category)}
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1 break-words">
                            {item.component.name}
                          </h4>
                        </div>

                        {item.component.rating && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" />
                            {item.component.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Build Imported Successfully
                  </h4>
                  <p className="text-sm text-gray-400">
                    {buildComponents.length} components configured
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Total</div>
                <div className="text-2xl font-bold text-green-400">
                  £{totalPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
            >
              Continue Building
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
