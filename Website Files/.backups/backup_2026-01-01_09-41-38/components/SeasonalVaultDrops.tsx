import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Clock,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import {
  getActiveVaultDrops,
  getUpcomingVaultDrops,
  type VaultDrop,
} from "../services/vaultDrops";
import type { VortexVaultTierId } from "../services/vortexVault";
import { logger } from "../services/logger";

interface SeasonalVaultDropsProps {
  userTier: VortexVaultTierId;
  onAddToCart?: (drop: VaultDrop) => void;
}

export function SeasonalVaultDrops({
  userTier,
  onAddToCart,
}: SeasonalVaultDropsProps) {
  const [activeDrops, setActiveDrops] = useState<VaultDrop[]>([]);
  const [upcomingDrops, setUpcomingDrops] = useState<VaultDrop[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrops = useCallback(async () => {
    try {
      setLoading(true);
      const [active, upcoming] = await Promise.all([
        getActiveVaultDrops(userTier),
        getUpcomingVaultDrops(),
      ]);

      setActiveDrops(active);
      setUpcomingDrops(upcoming);
    } catch (error) {
      logger.error("Error loading vault drops:", error);
    } finally {
      setLoading(false);
    }
  }, [userTier]);

  useEffect(() => {
    loadDrops();
  }, [loadDrops]);

  const getStockPercentage = (drop: VaultDrop) => {
    return (drop.availableQuantity / drop.totalQuantity) * 100;
  };

  const getStockStatus = (percentage: number) => {
    if (percentage > 50) return { text: "In Stock", color: "text-green-400" };
    if (percentage > 20) return { text: "Low Stock", color: "text-yellow-400" };
    return { text: "Almost Gone!", color: "text-red-400" };
  };

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} days left`;
    if (hours > 0) return `${hours} hours left`;
    return "Ending soon!";
  };

  const getTierBadge = (tier: VortexVaultTierId) => {
    const colors = {
      bronze: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      silver: "bg-gray-400/20 text-gray-300 border-gray-400/40",
      gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    };
    return colors[tier];
  };

  const handleAddToCart = (drop: VaultDrop) => {
    if (onAddToCart) {
      onAddToCart(drop);
      toast.success(`${drop.title} added to cart!`);
    } else {
      toast.info("Add to cart functionality coming soon!");
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-48 bg-white/10 rounded" />
        </div>
      </Card>
    );
  }

  // Check if user has access to vault drops
  const hasAccess = userTier === "silver" || userTier === "gold";

  if (!hasAccess) {
    return (
      <Card className="bg-gradient-to-r from-sky-500/10 to-purple-500/10 border-sky-500/30 backdrop-blur-xl p-8 text-center">
        <Package className="w-16 h-16 text-sky-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          Seasonal Vault Drops
        </h3>
        <p className="text-gray-300 mb-4">
          Exclusive limited bundles with massive savings
        </p>
        <div className="bg-black/30 rounded-lg p-4 mb-4">
          <p className="text-gray-400 text-sm mb-2">
            Unlock access by reaching Silver tier (200 points)
          </p>
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40">
            You're Bronze - Earn {200} more points
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-purple-500 flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Seasonal Vault Drops
            <Badge className={getTierBadge(userTier)}>{userTier} Member</Badge>
          </h3>
          <p className="text-sm text-gray-400">
            Members-only exclusive bundles with limited quantities
          </p>
        </div>
      </div>

      {/* Active Drops */}
      {activeDrops.length > 0 ? (
        <div className="grid gap-6">
          {activeDrops.map((drop) => {
            const stockPercentage = getStockPercentage(drop);
            const stockStatus = getStockStatus(stockPercentage);

            return (
              <Card
                key={drop.id}
                className="bg-gradient-to-r from-sky-500/10 to-purple-500/10 border-sky-500/30 backdrop-blur-xl overflow-hidden hover:border-sky-500/50 transition-all"
              >
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTierBadge(drop.requiredTier)}>
                          {drop.requiredTier}+ Only
                        </Badge>
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/40">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeRemaining(drop.endDate)}
                        </Badge>
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-2">
                        {drop.title}
                      </h4>
                      <p className="text-gray-300">{drop.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text">
                      £{drop.price.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-400 line-through">
                        £{drop.originalPrice.toLocaleString()}
                      </span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
                        Save £{drop.savings}
                      </Badge>
                    </div>
                  </div>

                  {/* Stock Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-semibold ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                      <span className="text-gray-400">
                        {drop.availableQuantity} of {drop.totalQuantity}{" "}
                        remaining
                      </span>
                    </div>
                    <Progress
                      value={stockPercentage}
                      className="h-2 bg-white/10"
                    />
                  </div>

                  {/* What's Included */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      What's Included:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {drop.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-300"
                        >
                          <Sparkles className="w-3 h-3 text-sky-400 flex-shrink-0" />
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {drop.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleAddToCart(drop)}
                      disabled={drop.availableQuantity === 0}
                      className="flex-1 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {drop.availableQuantity > 0 ? "Add to Cart" : "Sold Out"}
                    </Button>
                    {drop.availableQuantity <= 3 &&
                      drop.availableQuantity > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-semibold text-red-300">
                            Only {drop.availableQuantity} left!
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-300 mb-2">No active vault drops right now</p>
          <p className="text-sm text-gray-400">
            New exclusive bundles drop monthly - check back soon!
          </p>
        </Card>
      )}

      {/* Upcoming Drops Preview */}
      {upcomingDrops.length > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            Coming Soon
          </h4>
          <div className="space-y-3">
            {upcomingDrops.map((drop) => (
              <div
                key={drop.id}
                className="flex items-center justify-between p-4 bg-black/20 rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {drop.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    Starts {drop.startDate.toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getTierBadge(drop.requiredTier)}>
                  {drop.requiredTier}+
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
