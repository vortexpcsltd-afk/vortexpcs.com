import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Eye,
  Settings,
  CheckCircle,
  Package,
  Server,
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  Fan,
  Star,
} from "lucide-react";
import {
  RecommendedBuildSpec,
  SelectedComponentIds,
  ComponentDataMap,
  PCBuilderComponent,
} from "../types";

interface BuildDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedBuild: RecommendedBuildSpec | null | undefined;
  selectedComponents: SelectedComponentIds;
  componentData: ComponentDataMap;
}

/**
 * BuildDetailsModal - Shows detailed view of recommended build
 * Displays all components with specs and total price
 */
export const BuildDetailsModal = ({
  isOpen,
  onClose,
  recommendedBuild,
  selectedComponents,
  componentData,
}: BuildDetailsModalProps) => {
  if (!recommendedBuild) return null;

  const buildComponents: { category: string; component: PCBuilderComponent }[] =
    Object.entries(selectedComponents)
      .filter(([, componentId]) => !!componentId)
      .map(([category, componentId]) => {
        const component = (componentData[category] || []).find(
          (c) => c.id === componentId
        ) as PCBuilderComponent | undefined;
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
        return Package;
      case "motherboard":
        return Server;
      case "cpu":
        return Cpu;
      case "gpu":
        return Monitor;
      case "ram":
        return HardDrive;
      case "storage":
        return HardDrive;
      case "psu":
        return Zap;
      case "cooling":
        return Fan;
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
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Recommended Build
                </h3>
                <p className="text-gray-300">
                  {recommendedBuild.description ||
                    "Custom configuration optimized for your needs"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Total Price</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
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

            <div className="grid gap-4">
              {buildComponents.map(
                (
                  item: { category: string; component: PCBuilderComponent },
                  index: number
                ) => {
                  const Icon = getCategoryIcon(item.category);
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/30 transition-all duration-300"
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
                            <div className="text-right flex-shrink-0">
                              <div className="text-xl font-bold text-sky-400">
                                £{item.component.price?.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Component Specs */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.category === "cpu" && (
                              <>
                                {item.component.cores && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.cores} Cores
                                  </Badge>
                                )}
                                {item.component.speed && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.speed}
                                  </Badge>
                                )}
                                {(item.component.basePower ||
                                  item.component.processorBasePower ||
                                  item.component.tdp ||
                                  item.component.maximumTurboPower) && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {
                                      (item.component.basePower ||
                                        item.component.processorBasePower ||
                                        item.component.tdp ||
                                        item.component
                                          .maximumTurboPower) as number
                                    }
                                    W CPU Power
                                  </Badge>
                                )}
                              </>
                            )}
                            {item.category === "gpu" && (
                              <>
                                {item.component.vram && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.vram}GB VRAM
                                  </Badge>
                                )}
                                {item.component.chipset && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.chipset}
                                  </Badge>
                                )}
                                {(item.component.powerConsumption ||
                                  item.component.power ||
                                  item.component.powerDraw) && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {
                                      (item.component.powerConsumption ||
                                        item.component.power ||
                                        item.component.powerDraw) as number
                                    }
                                    W Power
                                  </Badge>
                                )}
                              </>
                            )}
                            {item.category === "ram" && (
                              <>
                                {item.component.capacity && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.capacity}GB
                                  </Badge>
                                )}
                                {item.component.speed && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.speed}
                                  </Badge>
                                )}
                              </>
                            )}
                            {item.category === "storage" && (
                              <>
                                {item.component.capacity && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.capacity}GB
                                  </Badge>
                                )}
                                {item.component.type && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.type}
                                  </Badge>
                                )}
                              </>
                            )}
                            {item.category === "psu" && (
                              <>
                                {item.component.wattage && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.wattage}W
                                  </Badge>
                                )}
                                {item.component.efficiency && (
                                  <Badge className="bg-white/10 text-gray-300 border-white/20">
                                    {item.component.efficiency}
                                  </Badge>
                                )}
                              </>
                            )}
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
                }
              )}
            </div>
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
