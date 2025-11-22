import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { X, TrendingUp, TrendingDown, Award } from "lucide-react";
import type { SelectedComponentIds, ComponentDataMap } from "./PCBuilder";

export interface SavedBuild {
  id: string;
  name: string;
  timestamp: number;
  components: SelectedComponentIds;
  peripherals: Record<string, string[]>;
  totalPrice: number;
}

interface BuildComparisonModalProps {
  open: boolean;
  onClose: () => void;
  builds: SavedBuild[];
  onRemoveBuild: (buildId: string) => void;
  componentData: ComponentDataMap;
  optionalExtrasData: Record<string, { id: string; price?: number }[]>;
}

export function BuildComparisonModal({
  open,
  onClose,
  builds,
  onRemoveBuild,
  componentData,
  optionalExtrasData,
}: BuildComparisonModalProps) {
  // Helper to get component by ID
  const getComponent = (category: string, id: string) => {
    const list = componentData[category] || [];
    return list.find((c) => c.id === id);
  };

  // Helper to get peripheral by ID
  const getPeripheral = (category: string, id: string) => {
    const list = optionalExtrasData[category] || [];
    return list.find((c) => c.id === id);
  };

  // Calculate total peripherals price
  const getPeripheralsPrice = (build: SavedBuild) => {
    let total = 0;
    Object.entries(build.peripherals).forEach(([category, ids]) => {
      ids.forEach((id) => {
        const item = getPeripheral(category, id);
        if (item?.price) total += item.price;
      });
    });
    return total;
  };

  // Get all unique component categories across builds
  const categories = [
    "case",
    "motherboard",
    "cpu",
    "gpu",
    "ram",
    "storage",
    "psu",
    "cooling",
  ];

  // Price comparison helpers
  const prices = builds.map((b) => b.totalPrice + getPeripheralsPrice(b));
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  // Determine which build is "best value" (subjective: lowest price with most components)
  const getBuildScore = (build: SavedBuild) => {
    const componentCount = Object.keys(build.components).length;
    const peripheralCount = Object.values(build.peripherals).flat().length;
    const totalPrice = build.totalPrice + getPeripheralsPrice(build);
    // Lower price per component = better value
    return (componentCount + peripheralCount) / (totalPrice || 1);
  };

  const buildScores = builds.map((b) => getBuildScore(b));
  const bestValueIndex = buildScores.indexOf(Math.max(...buildScores));

  // Compare specs (CPU cores, GPU VRAM, RAM capacity, storage, etc.)
  const getSpecValue = (
    build: SavedBuild,
    category: string,
    specKey: string
  ): number => {
    const componentId =
      build.components[category as keyof SelectedComponentIds];
    if (!componentId) return 0;
    const component = getComponent(category, componentId);
    if (!component) return 0;
    const value = (component as unknown as Record<string, unknown>)[specKey];
    return typeof value === "number" ? value : 0;
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      case: "Case",
      motherboard: "Motherboard",
      cpu: "CPU",
      gpu: "Graphics Card",
      ram: "Memory",
      storage: "Storage",
      psu: "Power Supply",
      cooling: "Cooling",
    };
    return labels[cat] || cat;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-sky-400" />
            Build Comparison
          </DialogTitle>
        </DialogHeader>

        {builds.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-lg">
              No builds saved for comparison yet.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Use the "Save for Comparison" button to add builds here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Build headers with price comparison */}
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${builds.length}, 1fr)` }}
            >
              {builds.map((build, idx) => {
                const fullPrice = build.totalPrice + getPeripheralsPrice(build);
                const isCheapest = fullPrice === minPrice;
                const isMostExpensive = fullPrice === maxPrice;
                const isBestValue = idx === bestValueIndex;

                return (
                  <Card
                    key={build.id}
                    className="bg-white/5 border-white/10 p-4 relative"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveBuild(build.id)}
                      className="absolute top-2 right-2 w-8 h-8 p-0 text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="pr-8">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {build.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(build.timestamp).toLocaleDateString()}
                      </p>
                      <Separator className="my-3 border-white/10" />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">
                            Total Price
                          </span>
                          <span className="text-xl font-bold text-sky-400">
                            £{fullPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {isBestValue && (
                            <Badge className="bg-green-500/20 border-green-500/40 text-green-300 text-xs">
                              Best Value
                            </Badge>
                          )}
                          {isCheapest && (
                            <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-300 text-xs">
                              Lowest Price
                            </Badge>
                          )}
                          {isMostExpensive && builds.length > 1 && (
                            <Badge className="bg-purple-500/20 border-purple-500/40 text-purple-300 text-xs">
                              Premium
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Component comparison table */}
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Component Comparison
              </h3>
              <div className="space-y-4">
                {categories.map((category) => {
                  // Check if any build has this component
                  const hasComponent = builds.some(
                    (b) => b.components[category as keyof SelectedComponentIds]
                  );
                  if (!hasComponent) return null;

                  // Get prices for this category to determine best value
                  const categoryPrices = builds.map((b) => {
                    const id =
                      b.components[category as keyof SelectedComponentIds];
                    if (!id) return 0;
                    const comp = getComponent(category, id);
                    return comp?.price || 0;
                  });
                  const minCatPrice = Math.min(
                    ...categoryPrices.filter((p) => p > 0)
                  );

                  return (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-sky-400 mb-2">
                        {getCategoryLabel(category)}
                      </h4>
                      <div
                        className="grid gap-3"
                        style={{
                          gridTemplateColumns: `repeat(${builds.length}, 1fr)`,
                        }}
                      >
                        {builds.map((build) => {
                          const componentId =
                            build.components[
                              category as keyof SelectedComponentIds
                            ];
                          if (!componentId) {
                            return (
                              <div
                                key={build.id}
                                className="p-3 rounded-lg bg-white/5 border border-white/5"
                              >
                                <p className="text-sm text-gray-500 italic">
                                  Not selected
                                </p>
                              </div>
                            );
                          }

                          const component = getComponent(category, componentId);
                          const price = component?.price || 0;
                          const isCheapest = price === minCatPrice && price > 0;

                          return (
                            <div
                              key={build.id}
                              className={`p-3 rounded-lg bg-white/5 border transition-colors ${
                                isCheapest
                                  ? "border-green-500/30 bg-green-500/5"
                                  : "border-white/10"
                              }`}
                            >
                              <p className="text-sm font-medium text-white line-clamp-2">
                                {component?.name || "Unknown"}
                              </p>
                              {component?.brand &&
                              typeof component.brand === "string" ? (
                                <p className="text-xs text-gray-400 mt-1">
                                  {component.brand}
                                </p>
                              ) : null}
                              {price > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <span className="text-sm font-semibold text-sky-400">
                                    £{price.toLocaleString()}
                                  </span>
                                  {isCheapest && (
                                    <TrendingDown className="w-3 h-3 text-green-400" />
                                  )}
                                </div>
                              )}

                              {/* Category-specific specs */}
                              {category === "cpu" &&
                                typeof component?.cores === "number" && (
                                  <Badge
                                    variant="secondary"
                                    className="mt-2 text-xs"
                                  >
                                    {component.cores} Cores
                                  </Badge>
                                )}
                              {category === "gpu" &&
                                typeof component?.vram === "number" && (
                                  <Badge
                                    variant="secondary"
                                    className="mt-2 text-xs"
                                  >
                                    {component.vram}GB VRAM
                                  </Badge>
                                )}
                              {category === "ram" &&
                                typeof component?.capacity === "number" && (
                                  <Badge
                                    variant="secondary"
                                    className="mt-2 text-xs"
                                  >
                                    {component.capacity}GB
                                  </Badge>
                                )}
                              {category === "storage" &&
                                typeof component?.capacity === "number" && (
                                  <Badge
                                    variant="secondary"
                                    className="mt-2 text-xs"
                                  >
                                    {component.capacity}GB
                                  </Badge>
                                )}
                              {category === "psu" &&
                                typeof component?.wattage === "number" && (
                                  <Badge
                                    variant="secondary"
                                    className="mt-2 text-xs"
                                  >
                                    {component.wattage}W
                                  </Badge>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Performance comparison (CPU, GPU, RAM) */}
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Performance Highlights
              </h3>
              <div className="space-y-4">
                {/* CPU Comparison */}
                <div>
                  <h4 className="text-sm font-semibold text-sky-400 mb-2">
                    CPU Cores
                  </h4>
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${builds.length}, 1fr)`,
                    }}
                  >
                    {builds.map((build) => {
                      const cores = getSpecValue(build, "cpu", "cores");
                      const maxCores = Math.max(
                        ...builds.map((b) => getSpecValue(b, "cpu", "cores"))
                      );
                      const isMax = cores === maxCores && cores > 0;

                      return (
                        <div key={build.id} className="flex items-center gap-2">
                          {cores > 0 ? (
                            <>
                              <span
                                className={`text-lg font-bold ${
                                  isMax ? "text-green-400" : "text-white"
                                }`}
                              >
                                {cores}
                              </span>
                              {isMax && (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GPU VRAM Comparison */}
                <div>
                  <h4 className="text-sm font-semibold text-sky-400 mb-2">
                    GPU VRAM
                  </h4>
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${builds.length}, 1fr)`,
                    }}
                  >
                    {builds.map((build) => {
                      const vram = getSpecValue(build, "gpu", "vram");
                      const maxVram = Math.max(
                        ...builds.map((b) => getSpecValue(b, "gpu", "vram"))
                      );
                      const isMax = vram === maxVram && vram > 0;

                      return (
                        <div key={build.id} className="flex items-center gap-2">
                          {vram > 0 ? (
                            <>
                              <span
                                className={`text-lg font-bold ${
                                  isMax ? "text-green-400" : "text-white"
                                }`}
                              >
                                {vram}GB
                              </span>
                              {isMax && (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RAM Capacity Comparison */}
                <div>
                  <h4 className="text-sm font-semibold text-sky-400 mb-2">
                    RAM Capacity
                  </h4>
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${builds.length}, 1fr)`,
                    }}
                  >
                    {builds.map((build) => {
                      const capacity = getSpecValue(build, "ram", "capacity");
                      const maxCapacity = Math.max(
                        ...builds.map((b) => getSpecValue(b, "ram", "capacity"))
                      );
                      const isMax = capacity === maxCapacity && capacity > 0;

                      return (
                        <div key={build.id} className="flex items-center gap-2">
                          {capacity > 0 ? (
                            <>
                              <span
                                className={`text-lg font-bold ${
                                  isMax ? "text-green-400" : "text-white"
                                }`}
                              >
                                {capacity}GB
                              </span>
                              {isMax && (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Peripherals comparison */}
            {builds.some(
              (b) => Object.values(b.peripherals).flat().length > 0
            ) && (
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Optional Extras
                </h3>
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${builds.length}, 1fr)`,
                  }}
                >
                  {builds.map((build) => {
                    const peripheralCount = Object.values(
                      build.peripherals
                    ).flat().length;
                    const peripheralPrice = getPeripheralsPrice(build);

                    return (
                      <div
                        key={build.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400">Items</span>
                          <Badge variant="secondary" className="text-xs">
                            {peripheralCount}
                          </Badge>
                        </div>
                        {peripheralPrice > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total</span>
                            <span className="text-sm font-semibold text-sky-400">
                              £{peripheralPrice.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/10 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
