import { useState } from "react";
import { X, Check, Plus, Trash2, ArrowLeftRight } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { PCComponent } from "../services/cms";

// Extend PCComponent to allow indexing
type IndexablePCComponent = PCComponent & { [key: string]: unknown };

interface ProductComparisonProps {
  products: PCComponent[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onAddToCart?: (product: PCComponent) => void;
  category?: string;
}

export function ProductComparison({
  products,
  onRemove,
  onClear,
  onAddToCart,
  category,
}: ProductComparisonProps) {
  const [expandedSpecs, setExpandedSpecs] = useState(true);

  if (products.length === 0) {
    return null;
  }

  // Get all unique specification keys across all products
  const allSpecs = new Set<string>();
  products.forEach((product) => {
    Object.keys(product).forEach((key) => {
      if (
        ![
          "id",
          "name",
          "price",
          "category",
          "description",
          "mainDescription",
          "images",
          "features",
          "supplierName",
          "costPrice",
          "profitMargin",
          "profitAmount",
        ].includes(key)
      ) {
        allSpecs.add(key);
      }
    });
  });

  const specKeys = Array.from(allSpecs).sort();

  // Format specification value for display
  const formatSpecValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "number") return value.toLocaleString();
    return String(value);
  };

  // Get spec label (convert camelCase to Title Case)
  const getSpecLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Determine if a product has the best value for a spec
  const isBestValue = (key: string, product: PCComponent): boolean => {
    const value = (product as IndexablePCComponent)[key];
    if (value === null || value === undefined) return false;

    // Higher is better for these specs
    const higherIsBetter = [
      "cores",
      "threads",
      "ramSlots",
      "pciSlots",
      "m2Slots",
      "maxRam",
      "vram",
      "capacity",
      "wattage",
      "efficiency",
      "readSpeed",
      "writeSpeed",
      "maxGpuLength",
      "maxCpuCoolerHeight",
      "stockLevel",
      "rating",
    ];

    // Lower is better for these specs
    const lowerIsBetter = ["tdp", "power", "price", "latency"];

    const values = products
      .map((p) => (p as IndexablePCComponent)[key])
      .filter(
        (v) => v !== null && v !== undefined && typeof v === "number"
      ) as number[];

    if (values.length < 2) return false;

    if (higherIsBetter.includes(key) && typeof value === "number") {
      return value === Math.max(...values);
    }

    if (lowerIsBetter.includes(key) && typeof value === "number") {
      return value === Math.min(...values);
    }

    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-auto">
      <div className="container mx-auto p-4 min-h-screen">
        <Card className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-sky-500/30 shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ArrowLeftRight className="w-6 h-6 text-sky-400" />
                  Compare {category || "Products"}
                </h2>
                <p className="text-gray-400 mt-1">
                  Side-by-side comparison of {products.length} product
                  {products.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onClear}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  onClick={onClear}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="p-6">
            <div
              className={`grid gap-4 ${
                products.length === 1
                  ? "grid-cols-1 max-w-md mx-auto"
                  : products.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all relative overflow-hidden"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemove(product.id)}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 transition-all group"
                    aria-label="Remove from comparison"
                  >
                    <X className="w-4 h-4 text-white group-hover:text-red-400" />
                  </button>

                  {/* Product Image */}
                  <div className="aspect-square bg-white/5 flex items-center justify-center p-4 border-b border-white/10">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-600 text-4xl">📦</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-lg mb-2 pr-8 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="text-3xl font-bold text-sky-400 mb-3">
                      £{product.price.toFixed(2)}
                    </div>

                    {/* Stock Badge */}
                    {product.inStock ? (
                      <Badge className="bg-green-500/20 border-green-500/40 text-green-400 mb-3">
                        <Check className="w-3 h-3 mr-1" />
                        In Stock
                        {product.stockLevel && product.stockLevel > 0 && (
                          <span className="ml-1">({product.stockLevel})</span>
                        )}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 border-red-500/40 text-red-400 mb-3">
                        <X className="w-3 h-3 mr-1" />
                        Out of Stock
                      </Badge>
                    )}

                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={
                              i < product.rating!
                                ? "text-yellow-400"
                                : "text-gray-600"
                            }
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-gray-400 ml-1">
                          ({product.rating}/5)
                        </span>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    {onAddToCart && (
                      <Button
                        onClick={() => onAddToCart(product)}
                        disabled={!product.inStock}
                        className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Build
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Specifications Table */}
            <div className="mt-8">
              <button
                onClick={() => setExpandedSpecs(!expandedSpecs)}
                className="flex items-center gap-2 text-white font-semibold text-lg mb-4 hover:text-sky-400 transition-colors"
              >
                <span>{expandedSpecs ? "▼" : "▶"}</span>
                Detailed Specifications
              </button>

              {expandedSpecs && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="text-left p-4 text-gray-300 font-medium sticky left-0 bg-gray-900/90 backdrop-blur-xl z-10">
                            Specification
                          </th>
                          {products.map((product) => (
                            <th
                              key={product.id}
                              className="text-left p-4 text-white font-medium min-w-[200px]"
                            >
                              <div className="line-clamp-2 text-sm">
                                {product.name}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {specKeys.map((key, index) => {
                          // Skip if all products have null/undefined for this spec
                          const hasValues = products.some(
                            (p) =>
                              (p as IndexablePCComponent)[key] !== null &&
                              (p as IndexablePCComponent)[key] !== undefined
                          );
                          if (!hasValues) return null;

                          return (
                            <tr
                              key={key}
                              className={`border-b border-white/5 ${
                                index % 2 === 0 ? "bg-white/5" : ""
                              }`}
                            >
                              <td className="p-4 text-gray-300 font-medium sticky left-0 bg-gray-900/90 backdrop-blur-xl z-10">
                                {getSpecLabel(key)}
                              </td>
                              {products.map((product) => {
                                const value = (product as IndexablePCComponent)[
                                  key
                                ];
                                const isBest = isBestValue(key, product);

                                return (
                                  <td
                                    key={product.id}
                                    className={`p-4 ${
                                      isBest
                                        ? "text-green-400 font-semibold"
                                        : value === null || value === undefined
                                        ? "text-gray-600"
                                        : "text-white"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isBest && (
                                        <Check className="w-4 h-4 text-green-400" />
                                      )}
                                      {formatSpecValue(value)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}

                        {/* Features Row */}
                        {products.some(
                          (p) => p.features && p.features.length > 0
                        ) && (
                          <tr className="border-b border-white/5 bg-white/5">
                            <td className="p-4 text-gray-300 font-medium sticky left-0 bg-gray-900/90 backdrop-blur-xl z-10">
                              Features
                            </td>
                            {products.map((product) => (
                              <td key={product.id} className="p-4 align-top">
                                {product.features &&
                                product.features.length > 0 ? (
                                  <ul className="text-sm text-gray-300 space-y-1">
                                    {product.features.map((feature, i) => (
                                      <li
                                        key={i}
                                        className="flex items-start gap-2"
                                      >
                                        <Check className="w-3 h-3 text-sky-400 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        )}

                        {/* Description Row */}
                        {products.some(
                          (p) => p.description || p.mainDescription
                        ) && (
                          <tr className="border-b border-white/5">
                            <td className="p-4 text-gray-300 font-medium sticky left-0 bg-gray-900/90 backdrop-blur-xl z-10">
                              Description
                            </td>
                            {products.map((product) => (
                              <td key={product.id} className="p-4 align-top">
                                <p className="text-sm text-gray-400 line-clamp-4">
                                  {product.mainDescription ||
                                    product.description ||
                                    "—"}
                                </p>
                              </td>
                            ))}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
              <p className="text-sm text-sky-300">
                💡 <strong>Tip:</strong> Green highlighted values indicate the
                best specification in that category. Click "Add to Build" to
                select a product.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Compact comparison button for product cards
interface CompareButtonProps {
  isSelected: boolean;
  onClick: () => void;
}

export function CompareButton({ isSelected, onClick }: CompareButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className={`${
        isSelected
          ? "bg-sky-500/20 border-sky-500/50 text-sky-400"
          : "border-white/20 text-gray-300 hover:border-sky-500/30"
      } transition-all`}
    >
      <ArrowLeftRight className="w-3 h-3 mr-1" />
      {isSelected ? "Remove from Compare" : "Compare"}
    </Button>
  );
}
