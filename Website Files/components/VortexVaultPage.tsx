import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Gift,
  ShoppingBag,
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  Users,
  Zap,
  Calendar,
  ArrowRight,
  Crown,
  Coins,
} from "lucide-react";
import { PageHero } from "./PageHero";
import { BONUS_POINTS, POINTS_EXPIRY_MONTHS } from "../services/vortexVault";
import { useNavigation } from "../contexts/NavigationContext";
import { VortexVaultReferralCard } from "./VortexVaultReferralCard";
import { logger } from "../services/logger";

interface VortexVaultPageProps {
  isLoggedIn?: boolean;
  userId?: string;
  userProfile?: { referralCode?: string; displayName?: string };
  onNavigate?: (view: string) => void;
  onTriggerSignup?: () => void;
}

export function VortexVaultPage({
  isLoggedIn = false,
  userId,
  userProfile,
  onNavigate,
  onTriggerSignup,
}: VortexVaultPageProps) {
  const { navigate } = useNavigation();
  const [selectedTier, setSelectedTier] = useState<string>("bronze");
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    pointsEarned: 0,
    referrals: [] as Array<{
      referrerId: string;
      referredUserId: string;
      referralCode: string;
      status: "pending" | "completed";
      displayName?: string;
      email?: string;
      bonusAwarded?: boolean;
      createdAt?: unknown;
      completedAt?: unknown;
      orderId?: string;
    }>,
  });
  const [referralLink, setReferralLink] = useState("");

  // Load referral stats for logged-in users
  useEffect(() => {
    if (isLoggedIn && userId && userProfile?.referralCode) {
      import("../services/vortexVaultReferrals").then(
        ({ getReferralStats, getReferralLink }) => {
          getReferralStats(userId).then((stats) => {
            setReferralStats(stats);
            logger.info("Loaded referral stats", stats);
          });
          const refCode = userProfile?.referralCode;
          if (refCode) {
            setReferralLink(getReferralLink(refCode));
          }
        }
      );
    }
  }, [isLoggedIn, userId, userProfile?.referralCode]);

  // Handle navigation with fallback
  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    } else if (navigate) {
      navigate(view);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateAccount = () => {
    if (isLoggedIn) {
      handleNavigate("member");
    } else {
      // Trigger sign up modal
      if (onTriggerSignup) {
        onTriggerSignup();
      }
    }
  };

  const tiers = [
    {
      id: "bronze",
      name: "Bronze",
      threshold: 0,
      color: "from-orange-600/20 to-amber-600/20",
      borderColor: "border-orange-500/30",
      textColor: "text-orange-400",
      icon: Award,
      benefits: [
        "Earn 1 point per £10 spent",
        `${BONUS_POINTS.SIGNUP} welcome bonus points`,
        `${BONUS_POINTS.VERIFIED_REVIEW} points for verified reviews`,
        "Exclusive member offers",
      ],
    },
    {
      id: "silver",
      name: "Silver",
      threshold: 200,
      color: "from-gray-400/20 to-slate-400/20",
      borderColor: "border-gray-400/30",
      textColor: "text-gray-300",
      icon: Star,
      benefits: [
        "All Bronze benefits",
        "1.25 points per £10 spent",
        "Priority email support",
        "Early access to sales",
      ],
    },
    {
      id: "gold",
      name: "Gold",
      threshold: 1000,
      color: "from-yellow-600/20 to-amber-500/20",
      borderColor: "border-yellow-500/30",
      textColor: "text-yellow-400",
      icon: Crown,
      benefits: [
        "All Silver benefits",
        "1.5 points per £10 spent",
        "Priority phone support",
        "Free express shipping",
        "Exclusive VIP offers",
      ],
    },
  ];

  const earningMethods = [
    {
      icon: ShoppingBag,
      title: "Make Purchases",
      points: `1 point per £10`,
      description: "Earn points on every purchase you make",
      color: "sky",
    },
    {
      icon: Users,
      title: "Sign Up",
      points: `${BONUS_POINTS.SIGNUP} points`,
      description: "Welcome bonus when you create your account",
      color: "green",
    },
    {
      icon: Star,
      title: "Write Reviews",
      points: `${BONUS_POINTS.VERIFIED_REVIEW} points`,
      description: "Share your experience with verified purchases",
      color: "purple",
    },
    {
      icon: Gift,
      title: "Refer Friends",
      points: `${BONUS_POINTS.REFERRAL_COMPLETION} points`,
      description: "When your referral makes their first purchase",
      color: "cyan",
    },
  ];

  const redemptionSteps = [
    {
      step: 1,
      title: "Earn Points",
      description: "Shop, review, and refer to accumulate points",
      icon: Coins,
    },
    {
      step: 2,
      title: "Reach Minimum",
      description: `Collect at least 50 points (£5)`,
      icon: TrendingUp,
    },
    {
      step: 3,
      title: "Apply at Checkout",
      description: "Select how many points to redeem for instant discount",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageHero
        title="Vortex Vault Points"
        subtitle="Earn rewards with every purchase and unlock exclusive benefits"
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        {/* Main Value Proposition */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 border border-sky-500/30 rounded-full px-6 py-2 mb-6">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300 font-semibold">
              10 Points = £1 Discount
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Turn Every Purchase Into Rewards
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Join thousands of satisfied customers earning points with every
            order. Redeem for discounts, enjoy exclusive perks, and get rewarded
            for your loyalty.
          </p>

          {/* CTA Button */}
          {!isLoggedIn && (
            <div className="mt-8">
              <Button
                size="lg"
                onClick={handleCreateAccount}
                className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
              >
                <Gift className="w-5 h-5 mr-2" />
                Create Free Account & Earn {BONUS_POINTS.SIGNUP} Points
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                No credit card required • Instant rewards • Free forever
              </p>
            </div>
          )}
        </div>

        {/* How to Earn Points */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              How to Earn Points
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Multiple ways to grow your points balance and unlock bigger
              rewards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {earningMethods.map((method, index) => (
              <Card
                key={index}
                className="relative group overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-sky-500/30 transition-all duration-300 p-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-${method.color}-500/20 to-${method.color}-600/10 border border-${method.color}-500/30 mb-4`}
                  >
                    <method.icon
                      className={`w-7 h-7 text-${method.color}-400`}
                    />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {method.title}
                  </h3>
                  <div className="inline-block bg-sky-500/20 border border-sky-500/30 rounded-full px-3 py-1 mb-3">
                    <span className="text-sky-300 font-semibold text-sm">
                      {method.points}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{method.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Referral Program - Only for logged-in users */}
        {isLoggedIn && userProfile?.referralCode && (
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Share & Earn More
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Invite friends to join Vortex Vault and earn bonus points when
                they make their first purchase
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <VortexVaultReferralCard
                referralCode={userProfile.referralCode}
                referralLink={referralLink}
                stats={referralStats}
              />
            </div>
          </section>
        )}

        {/* Membership Tiers */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Membership Tiers
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Climb the ranks and unlock enhanced earning rates and exclusive
              benefits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedTier === tier.id
                    ? `bg-gradient-to-br ${tier.color} border-2 ${tier.borderColor} scale-105`
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <tier.icon className={`w-8 h-8 ${tier.textColor}`} />
                      <h3 className={`text-2xl font-bold ${tier.textColor}`}>
                        {tier.name}
                      </h3>
                    </div>
                    {selectedTier === tier.id && (
                      <CheckCircle className={`w-6 h-6 ${tier.textColor}`} />
                    )}
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-400 text-sm">
                      {tier.threshold === 0
                        ? "Starting tier for all members"
                        : `Reach ${tier.threshold} lifetime points`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {tier.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* How to Redeem */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              How to Redeem Your Points
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Simple 3-step process to turn your points into instant savings
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {redemptionSteps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-6 h-full">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500/30 to-cyan-500/20 border-2 border-sky-500/50 flex items-center justify-center">
                          <step.icon className="w-8 h-8 text-sky-300" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                          {step.step}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {step.description}
                      </p>
                    </div>
                  </Card>

                  {/* Connecting Arrow */}
                  {index < redemptionSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-8 h-8 text-sky-500/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Information Cards */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-sky-600/10 to-blue-600/5 border border-sky-500/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Points Value
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Every 10 points = £1 in discount
                  </p>
                  <p className="text-gray-400 text-xs">
                    Minimum redemption: 50 points (£5)
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/10 to-pink-600/5 border border-purple-500/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Points Expiry
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Points expire after {POINTS_EXPIRY_MONTHS} months of account
                    inactivity
                  </p>
                  <p className="text-gray-400 text-xs">
                    Keep your account active by making purchases or logging in
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        {!isLoggedIn && (
          <section className="max-w-4xl mx-auto">
            <Card className="relative overflow-hidden bg-gradient-to-br from-sky-600/20 via-blue-600/10 to-cyan-600/20 border border-sky-500/30 p-8 md:p-12 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-cyan-500/10" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-500/30 to-cyan-500/20 border-2 border-sky-500/50 mb-6">
                  <Gift className="w-10 h-10 text-sky-300" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Start Earning?
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Create your free account today and get {BONUS_POINTS.SIGNUP}{" "}
                  welcome bonus points instantly
                </p>

                <Button
                  size="lg"
                  onClick={handleCreateAccount}
                  className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white px-10 py-6 text-lg font-semibold shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
                >
                  Create Free Account Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Free forever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Instant rewards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>No hidden fees</span>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
