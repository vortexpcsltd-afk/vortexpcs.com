import React, { useState, useEffect } from "react";
import { X, Calculator, HelpCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { calculatePointsValue } from "../services/vortexVault";

interface VortexVaultFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FAQ and Calculator modal for Vortex Vault
 * Shows how the points system works and lets users calculate redemption values
 */
export function VortexVaultFAQModal({
  isOpen,
  onClose,
}: VortexVaultFAQModalProps) {
  const [calculatorPoints, setCalculatorPoints] = useState("400");

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calculatedValue = calculatePointsValue(parseInt(calculatorPoints) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-950 border-cyan-500/30 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Vortex Vault Guide
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Learn how to earn and redeem points
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* How It Works */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">🎯</span> How It Works
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      Earn Points
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Earn <strong>1 point for every £10</strong> you spend on
                      any purchase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      Accumulate to Minimum
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Reach <strong>50 points minimum</strong> to unlock
                      redemption (equivalent to <strong>£5</strong>).
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      Redeem at Checkout
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Apply your points as a discount at checkout. They
                      automatically apply if enabled in your preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Conversion & Tiers */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">💰</span> Conversion Rate
              </h3>
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <p className="text-center">
                  <span className="text-2xl font-bold text-cyan-300">
                    50 pts
                  </span>
                  <span className="text-gray-400 text-sm block mt-1">
                    = £1 discount
                  </span>
                </p>
              </div>
              <p className="text-sm text-gray-400">
                Every 50 points can be redeemed for £1 off your order.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">⭐</span> Tier Progression
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded bg-white/5">
                  <span className="text-gray-300">Bronze</span>
                  <span className="font-semibold text-cyan-300">0+ pts</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white/5">
                  <span className="text-gray-300">Silver</span>
                  <span className="font-semibold text-cyan-300">200+ pts</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white/5">
                  <span className="text-gray-300">Gold</span>
                  <span className="font-semibold text-cyan-300">1000+ pts</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Calculator */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              Points Calculator
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter your points:
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={calculatorPoints}
                    onChange={(e) => setCalculatorPoints(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    placeholder="e.g. 800"
                  />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                    <span className="text-sm text-gray-300">= £</span>
                    <span className="text-xl font-bold text-cyan-300">
                      {calculatedValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* FAQs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">❓</span> Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              <details className="group">
                <summary className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="font-medium text-white text-sm">
                    How long do points last?
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-2 p-3 text-sm text-gray-400 bg-white/5 rounded-lg">
                  Points expire after <strong>18 months</strong> of inactivity.
                  Make a purchase to reset your activity timer.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="font-medium text-white text-sm">
                    Can I partially redeem my points?
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-2 p-3 text-sm text-gray-400 bg-white/5 rounded-lg">
                  You can redeem any amount starting from{" "}
                  <strong>50 points</strong> (£5 minimum), in £1 increments (10
                  points). Excess points carry over for next time.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="font-medium text-white text-sm">
                    Do guest purchases earn points?
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-2 p-3 text-sm text-gray-400 bg-white/5 rounded-lg">
                  Points only apply to <strong>signed-in accounts</strong>.
                  Create an account to start earning on your next purchase.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="font-medium text-white text-sm">
                    Can I combine points with coupon codes?
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-2 p-3 text-sm text-gray-400 bg-white/5 rounded-lg">
                  Yes! Points apply <strong>after</strong> coupon discounts,
                  stacking both savings for maximum value.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="font-medium text-white text-sm">
                    What tier perks do I get?
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-2 p-3 text-sm text-gray-400 bg-white/5 rounded-lg">
                  <p className="mb-2">
                    <strong>Silver (200+ pts):</strong> Free shipping on £50+,
                    monthly vault codes
                  </p>
                  <p>
                    <strong>Gold (1000+ pts):</strong> All perks + exclusive
                    giveaways, 48-hour early access to sales, priority support
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-white/10 bg-slate-900/95 backdrop-blur flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
