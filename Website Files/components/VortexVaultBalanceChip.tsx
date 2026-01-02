import React, { useEffect, useState } from "react";
import { Zap, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import {
  getVortexVaultSummary,
  calculatePointsValue,
  getTierForPoints,
  MINIMUM_REDEMPTION_POINTS,
} from "../services/vortexVault";
import { logger } from "../services/logger";

interface VortexVaultBalanceChipProps {
  userId?: string;
  compact?: boolean;
  showTier?: boolean;
  onClick?: () => void;
}

/**
 * Compact balance display component for header, product pages, cart
 * Shows points balance, value, and tier at a glance
 * Optional dropdown for quick access to vault section
 */
export function VortexVaultBalanceChip({
  userId,
  compact = false,
  showTier = false,
  onClick,
}: VortexVaultBalanceChipProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [redeemableValue, setRedeemableValue] = useState(0);

  useEffect(() => {
    const loadBalance = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const summary = await getVortexVaultSummary(userId);
        const bal = summary.account?.currentBalance ?? 0;
        setBalance(bal);

        const tierData = getTierForPoints(bal);
        setTier(tierData.name);

        const redeemable =
          Math.floor(bal / MINIMUM_REDEMPTION_POINTS) *
          MINIMUM_REDEMPTION_POINTS;
        setRedeemableValue(calculatePointsValue(redeemable));
      } catch (err) {
        logger.error("Failed to load vault balance chip", err);
        setError("Unable to load");
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, [userId]);

  if (!userId || balance === null) {
    return null;
  }

  if (compact) {
    // Minimal chip for header
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200 group"
      >
        <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300" />
        <span className="text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">
          {balance} pts
        </span>
        <span className="hidden sm:inline text-[10px] text-gray-400">
          £{calculatePointsValue(balance).toFixed(2)}
        </span>
      </button>
    );
  }

  const value = calculatePointsValue(balance);
  const pointsToRedeemable =
    balance >= MINIMUM_REDEMPTION_POINTS
      ? 0
      : MINIMUM_REDEMPTION_POINTS - balance;
  const isRedeemable = balance >= MINIMUM_REDEMPTION_POINTS;

  return (
    <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-sm p-3">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Vortex Vault
            </span>
          </div>
          {loading && (
            <div className="w-3 h-3 rounded-full bg-cyan-400/30 animate-pulse" />
          )}
        </div>

        {/* Balance Display */}
        {error ? (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-cyan-300">{balance}</span>
              <span className="text-xs text-gray-400">pts</span>
              <span className="text-sm font-semibold text-gray-300 ml-auto">
                £{value.toFixed(2)}
              </span>
            </div>

            {/* Status */}
            {isRedeemable ? (
              <div className="text-xs text-green-400 font-medium">
                ✓ £{redeemableValue.toFixed(2)} ready to redeem
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                {pointsToRedeemable} pts to unlock £
                {calculatePointsValue(MINIMUM_REDEMPTION_POINTS).toFixed(2)}
              </div>
            )}

            {/* Tier Badge */}
            {showTier && tier && (
              <div className="pt-1 border-t border-cyan-500/20">
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  {tier} Tier
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
