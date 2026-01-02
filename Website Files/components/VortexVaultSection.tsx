import { useEffect, useState } from "react";
import {
  Zap,
  TrendingUp,
  Gift,
  Clock,
  ArrowRight,
  Package,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import {
  calculatePointsValue,
  isEligibleForRedemption,
  MINIMUM_REDEMPTION_POINTS,
  POINTS_EXPIRY_MONTHS,
  BONUS_POINTS,
  getVortexVaultSummary,
  checkAndExpireInactivePoints,
  getNextTierProgress,
  getNextRedeemMilestone,
  getTierForPoints,
  setVortexVaultAutoApply,
} from "../services/vortexVault";
import type {
  VortexVaultAccount,
  VortexVaultTransaction,
} from "../services/database";
import { logger } from "../services/logger";
import { SeasonalVaultDrops } from "./SeasonalVaultDrops";
import { SocialGiveawaysWidget } from "./SocialGiveawaysWidget";

interface VortexVaultSectionProps {
  userId: string;
  userName?: string;
  userEmail?: string;
}

export function VortexVaultSection({
  userId,
  userName,
  userEmail,
}: VortexVaultSectionProps) {
  const [account, setAccount] = useState<VortexVaultAccount | null>(null);
  const [transactions, setTransactions] = useState<VortexVaultTransaction[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [autoApply, setAutoApply] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadVaultData = async () => {
      try {
        setLoading(true);

        // Check for expired points first
        await checkAndExpireInactivePoints(userId);

        // Load account and transactions
        const summary = await getVortexVaultSummary(userId);
        setAccount(summary.account);
        setTransactions(summary.recentTransactions);
        setAutoApply(summary.autoApplyPreference ?? true);
      } catch (error) {
        logger.error("Error loading Vortex Vault data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVaultData();
  }, [userId]);

  const handleAutoApplyToggle = async () => {
    const next = !autoApply;
    setAutoApply(next);

    try {
      const result = await setVortexVaultAutoApply(userId, next);
      if (!result.success) {
        setAutoApply(!next);
        toast.error("Couldn't save preference. Try again.");
      }
    } catch (error) {
      logger.error("Failed to update auto-apply preference", error);
      setAutoApply(!next);
      toast.error("Couldn't save preference. Try again.");
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin">
            <Zap className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
        <p className="text-gray-400">Failed to load Vortex Vault data</p>
      </Card>
    );
  }

  const currentValue = calculatePointsValue(account.currentBalance);
  const isEligible = isEligibleForRedemption(account.currentBalance);
  const pointsToMinimum = Math.max(
    0,
    MINIMUM_REDEMPTION_POINTS - account.currentBalance
  );
  const minimumValue = calculatePointsValue(MINIMUM_REDEMPTION_POINTS);
  const redeemableValue = calculatePointsValue(
    Math.floor(account.currentBalance / MINIMUM_REDEMPTION_POINTS) *
      MINIMUM_REDEMPTION_POINTS
  );
  const tierProgress = getNextTierProgress(account.currentBalance);
  const { pointsToNextRedeem, nextRedeemValue } = getNextRedeemMilestone(
    account.currentBalance
  );
  const currentTier = getTierForPoints(account.currentBalance);

  return (
    <div className="space-y-6">
      {/* Quick Stats Header */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-200 flex-wrap">
          <Zap className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-white">
            You have {account.currentBalance} pts = £{currentValue.toFixed(2)}
          </span>
          <span className="text-gray-400">
            {isEligible
              ? `£${redeemableValue.toFixed(2)} discount ready to use`
              : `${pointsToMinimum} pts (£${calculatePointsValue(
                  pointsToMinimum
                ).toFixed(2)}) to unlock £${minimumValue.toFixed(2)} off`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">Auto-apply at checkout</span>
          <Button
            variant={autoApply ? "default" : "outline"}
            size="sm"
            onClick={handleAutoApplyToggle}
            className={
              autoApply ? "bg-gradient-to-r from-cyan-600 to-blue-600" : ""
            }
          >
            {autoApply ? "On" : "Off"}
          </Button>
        </div>
      </Card>

      {/* Tabs for different sections */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500"
          >
            <Zap className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="vault-drops"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-purple-500"
          >
            <Package className="w-4 h-4 mr-2" />
            Vault Drops
          </TabsTrigger>
          <TabsTrigger
            value="giveaways"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500"
          >
            <Gift className="w-4 h-4 mr-2" />
            Giveaways
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Vortex Vault
            </h2>
            <p className="text-gray-400">
              Earn points. Unlock rewards. Spend smarter.
            </p>
          </div>

          {/* Main Points Display */}
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Points Balance */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Current Balance
                  </h3>
                </div>
                <div className="text-5xl font-bold text-cyan-400">
                  {account.currentBalance}
                </div>
                <p className="text-gray-400">
                  Equivalent to:{" "}
                  <span className="text-cyan-300 font-semibold">
                    £{currentValue.toFixed(2)}
                  </span>
                </p>
              </div>

              {/* Redemption Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Redemption Status
                  </h3>
                </div>
                {isEligible ? (
                  <>
                    <Badge className="bg-green-500/20 border-green-500/50 text-green-300 w-fit">
                      ✓ Ready to Redeem
                    </Badge>
                    <p className="text-gray-400">
                      You can redeem your points for a discount at checkout!
                    </p>
                  </>
                ) : (
                  <>
                    <Badge className="bg-amber-500/20 border-amber-500/50 text-amber-300 w-fit">
                      {pointsToMinimum} Points Away
                    </Badge>
                    <p className="text-gray-400">
                      Earn{" "}
                      <span className="text-amber-300 font-semibold">
                        {pointsToMinimum} more points
                      </span>{" "}
                      to reach the minimum redemption of{" "}
                      <span className="font-semibold">
                        {MINIMUM_REDEMPTION_POINTS} points (£
                        {minimumValue.toFixed(2)})
                      </span>
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mt-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (account.currentBalance /
                              MINIMUM_REDEMPTION_POINTS) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Tier & Perks */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge className="bg-cyan-500/20 border-cyan-500/50 text-cyan-200">
                    {currentTier.name} Tier
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {tierProgress.nextTier
                      ? `${tierProgress.pointsToNextTier} pts to ${tierProgress.nextTier.name}`
                      : "Top tier unlocked"}
                  </span>
                </div>
                <div className="text-gray-300 text-sm">
                  Perks: {currentTier.perks.join(" · ")}
                </div>
                {tierProgress.nextTier && (
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{
                          width: `${tierProgress.progressToNextTier * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      Progress to {tierProgress.nextTier.name}:{" "}
                      {Math.round(tierProgress.progressToNextTier * 100)}%
                    </div>
                  </div>
                )}
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-white/5 w-full md:w-80 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Gift className="w-5 h-5 text-blue-400" />
                  Next redeem milestone
                </div>
                <div className="text-sm text-gray-300">
                  {pointsToNextRedeem === 0
                    ? `You can redeem £${redeemableValue.toFixed(2)} now.`
                    : `${pointsToNextRedeem} pts (£${calculatePointsValue(
                        pointsToNextRedeem
                      ).toFixed(2)}) to your next £${nextRedeemValue.toFixed(
                        2
                      )} reward.`}
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((MINIMUM_REDEMPTION_POINTS - pointsToNextRedeem) /
                          MINIMUM_REDEMPTION_POINTS) *
                          100
                      ).toFixed(1)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  £{calculatePointsValue(MINIMUM_REDEMPTION_POINTS).toFixed(2)}{" "}
                  unlocked every {MINIMUM_REDEMPTION_POINTS} pts.
                </div>
              </div>
            </div>
          </Card>

          {/* How It Works */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              How Vortex Vault Works
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-cyan-300">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Earn Points</p>
                    <p className="text-sm text-gray-400">
                      Get <span className="text-cyan-300">1 point</span> for
                      every £10 you spend
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-300">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Bonus Actions</p>
                    <p className="text-sm text-gray-400 space-y-1">
                      <div>• Signup: {BONUS_POINTS.SIGNUP} pts</div>
                      <div>• Review: {BONUS_POINTS.VERIFIED_REVIEW} pts</div>
                      <div>
                        • Referral: {BONUS_POINTS.REFERRAL_COMPLETION} pts
                      </div>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-300">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Redeem Points</p>
                    <p className="text-sm text-gray-400">
                      Convert to discounts:{" "}
                      <span className="text-green-300">10 pts = £1</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-300">4</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Auto-Apply</p>
                    <p className="text-sm text-gray-400">
                      Discounts automatically apply at checkout when you reach
                      the minimum
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Account Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <p className="text-xs text-gray-400 mb-2">
                Lifetime Points Earned
              </p>
              <p className="text-3xl font-bold text-cyan-400">
                {account.lifetimePoints}
              </p>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <p className="text-xs text-gray-400 mb-2">Total Redeemed</p>
              <p className="text-3xl font-bold text-green-400">
                {account.pointsRedeemed}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                £{calculatePointsValue(account.pointsRedeemed).toFixed(2)}
              </p>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <p className="text-xs text-gray-400 mb-2">Points Expired</p>
              <p className="text-3xl font-bold text-orange-400">
                {account.pointsExpired}
              </p>
            </Card>
          </div>

          {/* Expiry Notice */}
          <Alert className="border-orange-500/30 bg-orange-500/10">
            <Clock className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-300 ml-2">
              Points expire after {POINTS_EXPIRY_MONTHS} months of inactivity.
              Your last activity was{" "}
              {new Date(account.lastActivityDate).toLocaleDateString()}
            </AlertDescription>
          </Alert>

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {tx.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        tx.pointsAmount >= 0 ? "text-cyan-400" : "text-red-400"
                      }`}
                    >
                      {tx.pointsAmount >= 0 ? "+" : ""}
                      {tx.pointsAmount}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Vault Drops Tab */}
        <TabsContent value="vault-drops">
          <SeasonalVaultDrops userTier={currentTier.id} />
        </TabsContent>

        {/* Giveaways Tab */}
        <TabsContent value="giveaways">
          <SocialGiveawaysWidget
            userId={userId}
            userName={userName}
            userEmail={userEmail}
          />
        </TabsContent>
      </Tabs>

      {/* CTA */}
      {isEligible && activeTab === "overview" && (
        <Card className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Ready to Save?
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                Use your {account.currentBalance} points for a £
                {currentValue.toFixed(2)} discount at checkout
              </p>
            </div>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white gap-2">
              Go to Checkout <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default VortexVaultSection;
