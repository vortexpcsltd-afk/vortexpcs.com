import { useState, useEffect, useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { toast } from "sonner";
import {
  Package,
  Settings,
  Clock,
  CheckCircle,
  Truck,
  Edit,
  Save,
  Loader2,
  AlertCircle,
  MessageSquare,
  Activity,
  Trophy,
  Zap,
  Award,
  Sparkles,
  Crown,
  Eye,
  ChevronRight,
  Coins,
  BadgeCheck,
  Rocket,
  Layers,
  Box,
  Send,
  Share2,
  Star,
  LogOut,
  Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/formatCurrency";
import { logger } from "../services/logger";
import {
  getUserOrders,
  getUserConfigurations,
  getUserSupportTickets,
  createSupportTicket,
  addSupportTicketMessage,
  setSupportTicketStatus,
  setSupportTicketPriority,
  setSupportTicketCategory,
  SavedConfiguration,
  type SupportTicket as DBSupportTicket,
  type SupportTicketMessage,
  type TicketStatus,
  type TicketPriority,
  type TicketAttachment,
} from "../services/database";
import {
  normalizeOrders,
  NormalizedOrder,
} from "../services/normalizers/orderNormalizer";
import { ReviewForm } from "./ReviewForm";
import {
  uploadTicketAttachment,
  type TicketAttachmentMeta,
} from "../services/storage";
import { VortexVaultSection } from "./VortexVaultSection";
import { VortexVaultReferralCard } from "./VortexVaultReferralCard";
import {
  getReferralStats,
  getReferralLink,
} from "../services/vortexVaultReferrals";
import { getUserVortexVaultAccount } from "../services/vortexVaultDatabase";

interface MemberAreaProps {
  onNavigate?: (route: string) => void;
}

// Gamification types
interface UserStats {
  level: number;
  xp: number;
  xpForNextLevel: number;
  totalSpent: number;
  ordersCount: number;
  buildsShared: number;
  reviewsWritten: number;
  referrals: number;
  memberSince: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
}

export default function MemberArea({ onNavigate }: MemberAreaProps) {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data states
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>(
    []
  );
  const [_supportTickets, _setSupportTickets] = useState<DBSupportTicket[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<NormalizedOrder | null>(
    null
  );
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState<NormalizedOrder | null>(
    null
  );
  // Support dialog state
  const [selectedTicket, setSelectedTicket] = useState<DBSupportTicket | null>(
    null
  );
  const [supportReply, setSupportReply] = useState("");
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    buildUpdates: true,
    orderUpdates: true,
    theme: "dark",
  });

  // Referral state
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
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");

  // Vortex Vault balance state
  const [vaultBalance, setVaultBalance] = useState(0);

  // Calculate user stats and gamification
  const userStats: UserStats = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => {
      const total =
        typeof order.total === "string"
          ? order.total
          : String(order.total || "0");
      return sum + (parseFloat(total.replace(/[£,]/g, "") || "0") || 0);
    }, 0);
    const ordersCount = orders.length;

    // Calculate level based on XP (orders + spending)
    const xp = ordersCount * 100 + Math.floor(totalSpent / 10);
    const level = Math.floor(xp / 500) + 1;
    const xpForNextLevel = level * 500 - xp;

    // Determine tier
    let tier: UserStats["tier"] = "bronze";
    if (totalSpent > 10000) tier = "diamond";
    else if (totalSpent > 5000) tier = "platinum";
    else if (totalSpent > 2500) tier = "gold";
    else if (totalSpent > 1000) tier = "silver";

    // Calculate member since date
    let memberSince = "2024";
    if (userProfile?.createdAt) {
      try {
        const date =
          userProfile.createdAt instanceof Date
            ? userProfile.createdAt
            : new Date(userProfile.createdAt);
        if (!isNaN(date.getTime())) {
          memberSince = date.getFullYear().toString();
        }
      } catch (e) {
        logger.warn("Failed to parse createdAt date", { e });
      }
    }

    return {
      level,
      xp,
      xpForNextLevel,
      totalSpent,
      ordersCount,
      buildsShared: configurations.filter((c) => "shared" in c && c.shared)
        .length,
      reviewsWritten: 0, // TODO: Integrate reviews
      referrals: 0, // Will be loaded separately from Vortex Vault referrals
      memberSince,
      tier,
    };
  }, [orders, configurations, userProfile]);

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load profile data
        setProfileData({
          name:
            userProfile?.displayName ||
            user.displayName ||
            user.email?.split("@")[0] ||
            "User",
          email: userProfile?.email || user.email || "",
          phone: userProfile?.phone || "",
          avatar: "",
        });

        // Load orders
        const userOrders = await getUserOrders(user.uid);
        setOrders(normalizeOrders(userOrders));

        // Load configurations
        const userConfigs = await getUserConfigurations(user.uid);
        setConfigurations(userConfigs);

        // Load support tickets
        const tickets = await getUserSupportTickets(user.uid);
        _setSupportTickets(tickets);

        logger.info("Member Area data loaded", {
          orders: userOrders.length,
          configs: userConfigs.length,
          tickets: tickets.length,
        });
      } catch (error) {
        logger.error("Error loading member area data", error);
        toast.error("Failed to load your data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userProfile]);

  // Load referral data
  useEffect(() => {
    const loadReferralData = async () => {
      if (!user) return;

      try {
        // Get referral code from profile or generate if missing
        let code = userProfile?.referralCode;

        if (!code && userProfile?.displayName) {
          // Generate referral code for legacy accounts that don't have one
          const { generateReferralCode } = await import(
            "../services/vortexVaultReferrals"
          );
          code = generateReferralCode(userProfile.displayName, user.uid);

          // Update user profile with the generated code
          const { doc, updateDoc } = await import("firebase/firestore");
          const { db } = await import("../config/firebase");
          if (db) {
            try {
              await updateDoc(doc(db, "users", user.uid), {
                referralCode: code,
              });
              logger.info(
                "Generated and saved referral code for legacy account",
                {
                  userId: user.uid,
                  code,
                }
              );
            } catch (updateErr) {
              logger.warn("Could not save generated referral code", updateErr);
            }
          }
        }

        if (code) {
          // Get referral stats
          const stats = await getReferralStats(user.uid);
          setReferralStats(stats);

          // Set referral code and link
          setReferralCode(code);
          setReferralLink(getReferralLink(code));

          logger.info("Referral data loaded", {
            code,
            stats,
          });
        }
      } catch (error) {
        logger.error("Error loading referral data", error);
      }
    };

    loadReferralData();
  }, [user, userProfile]);

  // Load Vortex Vault balance
  useEffect(() => {
    const loadVaultBalance = async () => {
      if (!user) return;

      try {
        const account = await getUserVortexVaultAccount(user.uid);
        setVaultBalance(account?.currentBalance || 0);
        logger.info("Vault balance loaded", {
          balance: account?.currentBalance || 0,
        });
      } catch (error) {
        logger.error("Error loading vault balance", error);
      }
    };

    loadVaultBalance();
  }, [user]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "diamond":
        return "from-cyan-400 to-blue-600";
      case "platinum":
        return "from-gray-300 to-gray-500";
      case "gold":
        return "from-yellow-400 to-yellow-600";
      case "silver":
        return "from-gray-400 to-gray-600";
      default:
        return "from-orange-600 to-orange-800";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "diamond":
        return <Sparkles className="w-5 h-5" />;
      case "platinum":
        return <Crown className="w-5 h-5" />;
      case "gold":
        return <Trophy className="w-5 h-5" />;
      case "silver":
        return <Award className="w-5 h-5" />;
      default:
        return <BadgeCheck className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
          <p className="text-gray-400 mb-6">
            You need to be logged in to access the member area
          </p>
          <Button
            onClick={() => onNavigate?.("home")}
            className="bg-gradient-to-r from-sky-500 to-blue-600"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 relative">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_50%)] pointer-events-none" />

      {/* Vertical background text - personalized with user's first name */}
      <div className="fixed left-[900px] top-1/2 -translate-y-1/2 pointer-events-none select-none overflow-hidden">
        <div
          className="text-[7.4rem] font-black text-white/[0.04] whitespace-nowrap"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
          }}
        >
          {profileData.name.split(" ")[0].toUpperCase()}'S AREA
        </div>
      </div>

      <div className="mx-auto px-4 relative" style={{ maxWidth: "1300px" }}>
        {/* Premium Header Section - Redesigned */}
        <div className="mb-8">
          <Card className="relative overflow-hidden border-0 backdrop-blur-xl shadow-2xl">
            {/* Dynamic gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600/40 via-blue-600/25 to-cyan-600/15" />

            {/* Animated gradient orbs */}
            <div className="absolute inset-0">
              <div className="absolute -top-40 right-0 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl opacity-60" />
              <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-40" />
            </div>

            <div className="relative p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
                {/* Left: Premium Avatar & User Info */}
                <div className="flex gap-6 flex-1 min-w-0">
                  {/* Avatar section */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="relative w-16 h-16 border-3 border-white/30 shadow-2xl bg-gradient-to-br from-sky-600 to-blue-700">
                      <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white text-2xl font-black">
                        {profileData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Premium tier badge */}
                    {userStats.tier !== "bronze" && (
                      <div
                        className={`absolute -bottom-2 -right-2 bg-gradient-to-r ${getTierColor(
                          userStats.tier
                        )} rounded-full p-3.5 border-4 border-black/50 shadow-2xl scale-110`}
                      >
                        {getTierIcon(userStats.tier)}
                      </div>
                    )}
                  </div>

                  {/* User info section */}
                  <div className="flex-1 min-w-0 pt-1">
                    {/* Greeting */}
                    <p className="text-xs sm:text-sm font-bold text-sky-300/90 uppercase tracking-[2px] mb-1">
                      Welcome Back
                    </p>

                    {/* Name */}
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight leading-tight">
                      {profileData.name || "Member"}
                    </h1>

                    {/* Tier badge and member info */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      {userStats.tier !== "bronze" && (
                        <Badge
                          className={`bg-gradient-to-r ${getTierColor(
                            userStats.tier
                          )} border border-white/20 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider shadow-lg`}
                        >
                          <Crown className="w-3.5 h-3.5 mr-2" />
                          {userStats.tier} Tier
                        </Badge>
                      )}
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Award className="w-4 h-4 text-amber-400/80" />
                        <span className="text-sm font-medium">
                          Since {userStats.memberSince}
                        </span>
                      </div>
                    </div>

                    {/* Premium level section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-yellow-500/25 to-amber-500/20 border border-yellow-500/50 rounded-lg cursor-help hover:border-yellow-500/70 transition-all shadow-lg">
                                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 flex-shrink-0" />
                                <span className="font-bold text-yellow-200 text-sm">
                                  Level {userStats.level}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-bold mb-1">Account Level</p>
                              <p className="text-xs">
                                Earn XP through orders, reviews, and activity
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="flex-1 max-w-md">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-gray-400">
                                      Level {userStats.level + 1}
                                    </span>
                                    <span className="text-xs font-bold text-sky-300">
                                      {userStats.xpForNextLevel} XP
                                    </span>
                                  </div>
                                  <Progress
                                    value={(userStats.xp % 500) / 5}
                                    className="h-3 bg-white/10 rounded-full"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-bold mb-2">
                                  Progress to Next Level
                                </p>
                                <ul className="text-xs space-y-1">
                                  <li>✓ Orders: +100 XP each</li>
                                  <li>✓ Reviews: +50 XP each</li>
                                  <li>✓ PC Builder: +25 XP per build</li>
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Premium Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full lg:w-auto lg:min-w-[750px]">
                  {/* Vault Points Card */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="group relative overflow-hidden rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-600/25 to-blue-600/15 p-4 hover:border-cyan-500/70 hover:from-cyan-600/40 hover:to-blue-600/30 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl">
                          {/* Hover effect glow */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/50 rounded-full blur-2xl" />
                          </div>

                          <div className="relative space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="p-2 bg-cyan-500/30 rounded-lg group-hover:bg-cyan-500/40 transition-colors shadow-lg">
                                <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                              </div>
                              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                                Vault
                              </span>
                            </div>
                            <p
                              className="text-3xl font-black text-white"
                              style={{ fontFamily: "Orbitron, monospace" }}
                            >
                              {vaultBalance}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              Vortex Vault Points
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-bold">Your loyalty points balance</p>
                        <p className="text-xs mt-1">
                          Earn points with every purchase
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Orders Stat Card */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="group relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-600/20 to-cyan-600/10 p-4 hover:border-sky-500/70 hover:from-sky-600/35 hover:to-cyan-600/25 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl">
                          {/* Hover effect glow */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/50 rounded-full blur-2xl" />
                          </div>

                          <div className="relative space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="p-2 bg-sky-500/30 rounded-lg group-hover:bg-sky-500/40 transition-colors shadow-lg">
                                <Package className="w-4 h-4 text-sky-200" />
                              </div>
                              <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">
                                Orders
                              </span>
                            </div>
                            <p
                              className="text-3xl font-black text-white"
                              style={{ fontFamily: "Orbitron, monospace" }}
                            >
                              {userStats.ordersCount}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              Total Purchases
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-bold">Complete orders with us</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Spent Stat Card */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="group relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-600/20 to-yellow-600/10 p-4 hover:border-amber-500/70 hover:from-amber-600/35 hover:to-yellow-600/25 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl">
                          {/* Hover effect glow */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/50 rounded-full blur-2xl" />
                          </div>

                          <div className="relative space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="p-2 bg-amber-500/30 rounded-lg group-hover:bg-amber-500/40 transition-colors shadow-lg">
                                <Coins className="w-4 h-4 text-amber-200" />
                              </div>
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                                Spent
                              </span>
                            </div>
                            <p
                              className="text-3xl font-black text-white"
                              style={{ fontFamily: "Orbitron, monospace" }}
                            >
                              {formatCurrency(userStats.totalSpent)}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              Lifetime Value
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-bold">
                          Total spending across all orders
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs - Moved to top */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="sticky top-0 z-30 pb-3">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="bg-gray-900/80 border border-white/10 backdrop-blur-xl rounded-2xl p-2.25 w-full flex gap-1 shadow-lg shadow-black/20">
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-4 font-medium"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-4 font-medium"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Orders
                </TabsTrigger>
                <TabsTrigger
                  value="builds"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-4 font-medium"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  My Builds
                </TabsTrigger>
                <TabsTrigger
                  value="rewards"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-4 font-medium"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Vortex Vault
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-4 font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger
                  value="support"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-4 font-medium"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Support
                </TabsTrigger>
                <Button
                  onClick={async () => {
                    try {
                      const { logoutUser } = await import("../services/auth");
                      await logoutUser();
                      window.location.href = "/";
                    } catch (error) {
                      logger.error("Logout error:", error);
                      toast.error("Failed to logout");
                    }
                  }}
                  variant="ghost"
                  className="ml-auto text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 rounded-xl px-6 py-2.5 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </TabsList>
            </div>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Persistent Referral Card Section */}
            {user?.uid && (
              <div className="mb-6">
                {referralCode ? (
                  <VortexVaultReferralCard
                    referralCode={referralCode}
                    referralLink={referralLink}
                    stats={referralStats}
                  />
                ) : (
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                    <div className="flex items-center gap-3 text-gray-300">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                      <p>Loading your referral link...</p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Premium Quick Actions Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Build New PC - Primary CTA */}
              <Button
                onClick={() => onNavigate?.("pc-builder")}
                className="group relative h-auto py-6 sm:py-8 flex-col gap-3 overflow-hidden rounded-xl border-0 bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-600 hover:from-sky-400 hover:via-blue-400 hover:to-cyan-500 shadow-xl hover:shadow-2xl transition-all duration-300 scale-100 hover:scale-105"
              >
                {/* Hover overlay effect */}
                <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
                </div>

                <div className="relative flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors shadow-lg">
                    <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                      Build New PC
                    </p>
                    <p className="text-[10px] text-white/70 mt-1">
                      Create your custom rig
                    </p>
                  </div>
                </div>
              </Button>

              {/* Track Order */}
              <Button
                onClick={() => setActiveTab("orders")}
                className="group relative h-auto py-6 sm:py-8 flex-col gap-3 overflow-hidden rounded-xl border-2 border-sky-500/40 bg-gradient-to-br from-sky-600/20 to-cyan-600/10 hover:border-sky-500/70 hover:from-sky-600/35 hover:to-cyan-600/25 hover:shadow-xl transition-all duration-300 scale-100 hover:scale-105"
              >
                {/* Hover overlay effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl" />
                </div>

                <div className="relative flex flex-col items-center gap-3">
                  <div className="p-3 bg-sky-500/30 rounded-xl group-hover:bg-sky-500/40 transition-colors shadow-lg">
                    <Package className="w-6 h-6 sm:w-7 sm:h-7 text-sky-300 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                      Track Order
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Check shipment
                    </p>
                  </div>
                </div>
              </Button>

              {/* PC Finder */}
              <Button
                onClick={() => onNavigate?.("pc-finder")}
                className="group relative h-auto py-6 sm:py-8 flex-col gap-3 overflow-hidden rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-600/20 to-yellow-600/10 hover:border-amber-500/70 hover:from-amber-600/35 hover:to-yellow-600/25 hover:shadow-xl transition-all duration-300 scale-100 hover:scale-105"
              >
                {/* Hover overlay effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl" />
                </div>

                <div className="relative flex flex-col items-center gap-3">
                  <div className="p-3 bg-amber-500/30 rounded-xl group-hover:bg-amber-500/40 transition-colors shadow-lg">
                    <Search className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                      PC Finder
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Find your match
                    </p>
                  </div>
                </div>
              </Button>

              {/* Support */}
              <Button
                onClick={() => setActiveTab("support")}
                className="group relative h-auto py-6 sm:py-8 flex-col gap-3 overflow-hidden rounded-xl border-2 border-green-500/40 bg-gradient-to-br from-green-600/20 to-emerald-600/10 hover:border-green-500/70 hover:from-green-600/35 hover:to-emerald-600/25 hover:shadow-xl transition-all duration-300 scale-100 hover:scale-105"
              >
                {/* Hover overlay effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-green-500/30 rounded-full blur-3xl" />
                </div>

                <div className="relative flex flex-col items-center gap-3">
                  <div className="p-3 bg-green-500/30 rounded-xl group-hover:bg-green-500/40 transition-colors shadow-lg">
                    <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-green-300 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                      Get Support
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      We're here to help
                    </p>
                  </div>
                </div>
              </Button>
            </div>

            {/* Active Orders & Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Active Orders - Premium Redesign */}
              <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-sky-600/15 to-blue-600/10 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                {/* Background glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/30 rounded-full blur-3xl" />
                </div>

                <div className="relative space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-sky-500/30 rounded-xl">
                        <Package className="w-5 h-5 text-sky-300" />
                      </div>
                      <h3 className="text-xl font-black text-white">
                        Active Orders
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("orders")}
                      className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                    >
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  {orders.filter((o) => o.status !== "delivered").slice(0, 3)
                    .length > 0 ? (
                    <div className="space-y-3 pt-3">
                      {orders
                        .filter((o) => o.status !== "delivered")
                        .slice(0, 3)
                        .map((order) => (
                          <div
                            key={order.id}
                            className="group/item relative p-4 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 hover:border-sky-500/50 hover:from-white/15 hover:to-white/10 transition-all duration-300 cursor-pointer"
                            onClick={() => setActiveTab("orders")}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white mb-1 group-hover/item:text-sky-300 transition-colors truncate">
                                  Order #{order.id}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {order.orderDate
                                    ? new Date(
                                        order.orderDate
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                              <Badge
                                className={`flex-shrink-0 ${
                                  order.status === "pending"
                                    ? "bg-blue-500/30 border-blue-500/50 text-blue-300"
                                    : order.status === "shipped"
                                    ? "bg-orange-500/30 border-orange-500/50 text-orange-300"
                                    : order.status === "delivered"
                                    ? "bg-green-500/30 border-green-500/50 text-green-300"
                                    : "bg-purple-500/30 border-purple-500/50 text-purple-300"
                                } border`}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Progress
                                value={order.progress || 0}
                                className="h-2.5 bg-white/10 rounded-full"
                              />
                              <p className="text-xs text-gray-400 font-semibold">
                                {order.progress || 0}% Complete
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="p-4 bg-sky-500/15 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-sky-400" />
                      </div>
                      <p className="text-gray-400 mb-4 font-medium">
                        No active orders yet
                      </p>
                      <Button
                        onClick={() => onNavigate?.("pc-builder")}
                        size="sm"
                        className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg"
                      >
                        Build Your First PC
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="w-7 h-7 text-cyan-400" />
                  Order History
                </h3>
                {orders.length > 0 && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 text-lg px-4 py-1">
                    {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                  </Badge>
                )}
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card
                      key={order.id}
                      className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 border-white/20 p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                    >
                      {/* Animated background glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-2xl font-bold text-white">
                                Order #{order.displayId}
                              </p>
                              {order.status === "delivered" && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/40 animate-pulse">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Delivered
                                </Badge>
                              )}
                              {order.status === "shipped" && (
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40">
                                  <Truck className="w-3 h-3 mr-1" />
                                  In Transit
                                </Badge>
                              )}
                              {order.status === "building" && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse">
                                  <Activity className="w-3 h-3 mr-1" />
                                  Building
                                </Badge>
                              )}
                              {order.status === "pending" && (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Processing
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {order.orderDate
                                  ? new Date(
                                      order.orderDate
                                    ).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </span>
                              {order.items && order.items.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Box className="w-4 h-4" />
                                  {order.items.length}{" "}
                                  {order.items.length === 1 ? "Item" : "Items"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                              {order.total}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar with Animation */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-300">
                              {order.status === "delivered"
                                ? "🎉 Your order has been delivered!"
                                : order.status === "shipped"
                                ? "📦 On its way to you!"
                                : order.status === "building"
                                ? "⚡ Being built with care..."
                                : "⏳ Order confirmed & processing"}
                            </p>
                            <p className="text-sm font-bold text-cyan-400">
                              {order.progress || 0}%
                            </p>
                          </div>
                          <Progress
                            value={order.progress || 100}
                            className="h-3 bg-gray-800 overflow-hidden"
                          />
                        </div>

                        {/* Order Items Preview */}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/5">
                            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">
                              Order Contents
                            </p>
                            <div className="space-y-1">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-gray-300 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    {item.name}
                                  </span>
                                  <span className="text-gray-400">
                                    {formatCurrency(item.unitPrice)}
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-xs text-gray-500 italic">
                                  +{order.items.length - 3} more items
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Details
                          </Button>

                          {(order.status === "delivered" ||
                            order.status === "shipped") && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all"
                              onClick={() => {
                                setOrderToReview(order);
                                setReviewDialogOpen(true);
                              }}
                            >
                              <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                              Leave a Review
                            </Button>
                          )}

                          {(order.status === "shipped" ||
                            order.status === "building") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all"
                              onClick={() => {
                                toast.info("Tracking feature coming soon!");
                              }}
                            >
                              <Truck className="w-4 h-4 mr-2" />
                              Track Package
                            </Button>
                          )}

                          {(order.status === "building" ||
                            order.status === "pending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                              onClick={() => {
                                toast.info(
                                  "Build progress updates coming soon!"
                                );
                              }}
                            >
                              <Activity className="w-4 h-4 mr-2" />
                              Watch Build Progress
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                            onClick={() => {
                              toast.info("Support chat coming soon!");
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="relative inline-block mb-6">
                    <Package className="w-24 h-24 mx-auto text-gray-600 animate-bounce" />
                    <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-3">
                    No Orders Yet! 🚀
                  </p>
                  <p className="text-lg text-gray-400 mb-6 max-w-md mx-auto">
                    Ready to build the PC of your dreams? Let's get started!
                  </p>
                  <Button
                    onClick={() => onNavigate?.("pc-builder")}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg px-8 py-6 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Build Your First PC
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* My Builds Tab */}
          <TabsContent value="builds" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Saved Configurations</h3>
                <Button
                  onClick={() => onNavigate?.("pc-builder")}
                  className="bg-gradient-to-r from-sky-500 to-blue-600"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>

              {configurations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {configurations.map((config) => (
                    <Card
                      key={config.id}
                      className="bg-white/5 border-white/10 p-4 hover:border-sky-500/50 transition-all group cursor-pointer"
                    >
                      <div className="aspect-video bg-gradient-to-br from-sky-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                        <Box className="w-12 h-12 text-sky-400" />
                      </div>
                      <h4 className="font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">
                        {config.name || "Untitled Build"}
                      </h4>
                      <p className="text-sm text-gray-400 mb-4">
                        {config.createdAt
                          ? new Date(config.createdAt).toLocaleDateString()
                          : "Recently saved"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-white/20"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Layers className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-xl text-gray-400 mb-4">
                    No saved builds yet
                  </p>
                  <Button
                    onClick={() => onNavigate?.("pc-builder")}
                    className="bg-gradient-to-r from-sky-500 to-blue-600"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Start Building
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-7 h-7 text-cyan-400" />
                  Support Tickets
                </h3>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 text-lg px-4 py-1">
                  {_supportTickets.length}{" "}
                  {_supportTickets.length === 1 ? "Ticket" : "Tickets"}
                </Badge>
              </div>

              {/* New Ticket Form */}
              <Card className="bg-black/30 border-white/10 p-4 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Raise a New Ticket
                </h4>
                <form
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const formData = new FormData(form);
                    const subject = String(
                      formData.get("subject") || ""
                    ).trim();
                    const category = String(
                      formData.get("category") || "general"
                    );
                    const message = String(
                      formData.get("message") || ""
                    ).trim();

                    if (subject.length < 5 || message.length < 10) {
                      toast.error(
                        "Please provide a clear subject and message."
                      );
                      return;
                    }

                    try {
                      const userId = user?.uid;
                      const name = profileData.name || user?.displayName || "";
                      const email = profileData.email || user?.email || "";

                      const ticketId = await createSupportTicket({
                        userId,
                        name,
                        email,
                        subject,
                        message,
                        type: "customer",
                        category,
                      });

                      const now = Date.now();
                      const newTicket: DBSupportTicket = {
                        id: ticketId,
                        userId,
                        name,
                        email,
                        subject,
                        message,
                        type: "customer",
                        category,
                        status: "open",
                        createdAt: new Date(now),
                        updatedAt: new Date(now),
                        messages: [
                          {
                            senderId: userId,
                            senderName: name || "you",
                            body: message,
                            internal: false,
                            timestamp: new Date(now),
                          },
                        ],
                      } as DBSupportTicket;

                      _setSupportTickets((prev) => [newTicket, ...prev]);
                      toast.success(
                        "Support ticket created! Our team will reply soon."
                      );
                      form.reset();
                    } catch (err) {
                      const msg =
                        err instanceof Error
                          ? err.message
                          : "Failed to create support ticket";
                      toast.error(msg);
                    }
                  }}
                >
                  <div className="md:col-span-2">
                    <Label htmlFor="subject" className="text-gray-300">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Describe the issue briefly"
                      className="mt-1 bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-gray-300">
                      Category
                    </Label>
                    <select
                      id="category"
                      name="category"
                      className="mt-1 w-full rounded-md bg-white/5 border border-white/10 text-gray-200 px-3 py-2"
                    >
                      <option value="general">General</option>
                      <option value="order">Order</option>
                      <option value="billing">Billing</option>
                      <option value="repair">Repair</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="message" className="text-gray-300">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder="Provide as much detail as possible"
                      className="mt-1 bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-cyan-500 to-blue-600"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Ticket List */}
              <div className="space-y-3">
                {_supportTickets.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    No support tickets yet.
                  </div>
                )}
                {_supportTickets.map((t) => (
                  <Card key={t.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold">{t.subject}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {t.category} •{" "}
                          {new Date(t.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          t.status === "open"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : t.status === "closed"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </div>

                    {/* Last message preview */}
                    {t.messages && t.messages.length > 0 && (
                      <div className="mt-3 text-gray-300 text-sm bg-black/20 rounded-md p-3 border border-white/10">
                        {t.messages[t.messages.length - 1].body}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400"
                        onClick={() => setSelectedTicket(t)}
                      >
                        View Thread
                      </Button>
                      {t.status !== "closed" && (
                        <Button
                          variant="outline"
                          className="border-purple-500/30 text-purple-400"
                          onClick={() => setSelectedTicket(t)}
                        >
                          Add Reply
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Vortex Vault Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-cyan-300 font-semibold">
                    Vortex Vault
                  </p>
                  <p className="text-lg font-bold text-white">
                    Track your accumulated points, next-tier progress, and
                    redemption readiness.
                  </p>
                  <p className="text-sm text-gray-400">
                    View balance, cash value, expiry windows, and upcoming
                    milestones in one place.
                  </p>
                </div>
              </div>
            </Card>

            {user?.uid ? (
              <>
                <VortexVaultSection
                  userId={user.uid}
                  userName={
                    userProfile?.displayName ||
                    user.displayName ||
                    user.email?.split("@")[0] ||
                    "User"
                  }
                  userEmail={user.email || undefined}
                />

                {/* Referral Section */}
                {referralCode && (
                  <VortexVaultReferralCard
                    referralCode={referralCode}
                    referralLink={referralLink}
                    stats={referralStats}
                  />
                )}
              </>
            ) : (
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
                <p className="text-gray-300">
                  Sign in to see your Vortex Vault balance, points history, and
                  next tier progress.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Profile & Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Info */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Profile Information</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="border-white/20"
                  >
                    {editingProfile ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Full Name</Label>
                    <Input
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      disabled={!editingProfile}
                      className="bg-white/5 border-white/10 mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Email Address</Label>
                    <Input
                      value={profileData.email}
                      disabled
                      className="bg-white/5 border-white/10 mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Phone Number</Label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      disabled={!editingProfile}
                      className="bg-white/5 border-white/10 mt-2"
                    />
                  </div>
                </div>
              </Card>

              {/* Preferences */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <h3 className="text-xl font-bold mb-6">Preferences</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        Email Notifications
                      </p>
                      <p className="text-sm text-gray-400">
                        Receive order updates via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Build Updates</p>
                      <p className="text-sm text-gray-400">
                        Get notified about build progress
                      </p>
                    </div>
                    <Switch
                      checked={preferences.buildUpdates}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          buildUpdates: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Marketing Emails</p>
                      <p className="text-sm text-gray-400">
                        Receive deals and promotions
                      </p>
                    </div>
                    <Switch
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          marketingEmails: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Support Ticket Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
            setSupportReply("");
          }
        }}
      >
        <DialogContent className="max-w-3xl bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              {selectedTicket?.subject || "Support Ticket"}
            </DialogTitle>
            {selectedTicket && (
              <DialogDescription className="text-gray-400">
                {selectedTicket.category} •{" "}
                {new Date(selectedTicket.createdAt).toLocaleString()} • Status:{" "}
                {selectedTicket.status}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                  {selectedTicket.messages?.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-black/20 p-3 rounded-md border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium">
                          {(m as SupportTicketMessage).senderName || "Support"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(() => {
                            const ts = (m as SupportTicketMessage).timestamp;
                            const date =
                              ts instanceof Date
                                ? ts
                                : (ts as { toDate?: () => Date })?.toDate?.() ||
                                  new Date();
                            return date.toLocaleString?.() || "";
                          })()}
                        </p>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">
                        {(m as SupportTicketMessage).body}
                      </p>
                      {(m as SupportTicketMessage).attachments &&
                        (m as SupportTicketMessage).attachments!.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-400">
                              Attachments:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(m as SupportTicketMessage).attachments?.map(
                                (att: TicketAttachment, idx: number) => (
                                  <a
                                    key={`att-${idx}`}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-cyan-400 text-xs underline hover:text-cyan-300"
                                  >
                                    {(att.name || "file") +
                                      (att.size
                                        ? ` (${Math.round(att.size / 1024)} KB)`
                                        : "")}
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </Card>

              {selectedTicket.status !== "closed" && (
                <Card className="bg-white/5 border-white/10 p-4">
                  <Label htmlFor="reply" className="text-gray-300">
                    Your Reply
                  </Label>
                  <Textarea
                    id="reply"
                    value={supportReply}
                    onChange={(e) => setSupportReply(e.target.value)}
                    rows={4}
                    className="mt-1 bg-white/5 border-white/10"
                    placeholder="Type your message for our support team"
                  />
                  <div className="mt-3">
                    <Label className="text-gray-300">
                      Attachments (optional)
                    </Label>
                    <input
                      type="file"
                      multiple
                      className="mt-1 block text-gray-300"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSupportFiles(files);
                        const init: Record<string, number> = {};
                        for (const f of files) init[f.name] = 0;
                        setUploadProgress(init);
                      }}
                    />
                    {supportFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {supportFiles.map((f) => (
                          <div
                            key={f.name}
                            className="flex items-center gap-2 text-xs text-gray-300"
                          >
                            <span>{f.name}</span>
                            <div className="flex-1 h-1 bg-white/10 rounded">
                              <div
                                className="h-1 bg-cyan-500 rounded"
                                style={{
                                  width: `${uploadProgress[f.name] || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-gray-500">
                              {Math.round(uploadProgress[f.name] || 0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-300">Status</Label>
                      <select
                        className="rounded-md bg-white/5 border border-white/10 text-gray-200 px-3 py-2"
                        value={selectedTicket.status}
                        onChange={async (e) => {
                          const status = e.target.value as TicketStatus;
                          try {
                            await setSupportTicketStatus(
                              String(selectedTicket.id || ""),
                              status
                            );
                            _setSupportTickets((prev) =>
                              prev.map((t) =>
                                t.id === selectedTicket.id
                                  ? { ...t, status }
                                  : t
                              )
                            );
                            setSelectedTicket({ ...selectedTicket, status });
                            toast.success("Status updated");
                          } catch (err) {
                            const msg =
                              err instanceof Error
                                ? err.message
                                : "Failed to update status";
                            toast.error(msg);
                          }
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-300">Priority</Label>
                      <select
                        className="rounded-md bg-white/5 border border-white/10 text-gray-200 px-3 py-2"
                        value={
                          (
                            selectedTicket as DBSupportTicket & {
                              priority?: string;
                            }
                          ).priority || "normal"
                        }
                        onChange={async (e) => {
                          const priority = e.target.value as TicketPriority;
                          try {
                            await setSupportTicketPriority(
                              String(selectedTicket.id || ""),
                              priority
                            );
                            _setSupportTickets((prev) =>
                              prev.map((t) =>
                                t.id === selectedTicket.id
                                  ? { ...t, priority }
                                  : t
                              )
                            );
                            setSelectedTicket({
                              ...selectedTicket,
                              priority,
                            } as DBSupportTicket);
                            toast.success("Priority updated");
                          } catch (err) {
                            const msg =
                              err instanceof Error
                                ? err.message
                                : "Failed to update priority";
                            toast.error(msg);
                          }
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-300">Category</Label>
                      <select
                        className="rounded-md bg-white/5 border border-white/10 text-gray-200 px-3 py-2"
                        value={selectedTicket.category || "general"}
                        onChange={async (e) => {
                          const category = e.target.value;
                          try {
                            await setSupportTicketCategory(
                              String(selectedTicket.id || ""),
                              category
                            );
                            _setSupportTickets((prev) =>
                              prev.map((t) =>
                                t.id === selectedTicket.id
                                  ? { ...t, category }
                                  : t
                              )
                            );
                            setSelectedTicket({ ...selectedTicket, category });
                            toast.success("Category updated");
                          } catch (err) {
                            const msg =
                              err instanceof Error
                                ? err.message
                                : "Failed to update category";
                            toast.error(msg);
                          }
                        }}
                      >
                        <option value="general">General</option>
                        <option value="order">Order</option>
                        <option value="billing">Billing</option>
                        <option value="repair">Repair</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSupportReply("");
                        setSelectedTicket(null);
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-cyan-500 to-blue-600"
                      onClick={async () => {
                        const text = supportReply.trim();
                        if (text.length < 3 || !selectedTicket) {
                          toast.error("Please enter a meaningful reply.");
                          return;
                        }
                        try {
                          const now = Date.now();
                          const optimistic = {
                            senderId: user?.uid,
                            senderName: profileData.name || "you",
                            body: text,
                            internal: false,
                            timestamp: new Date(now),
                          };
                          setSelectedTicket({
                            ...selectedTicket,
                            messages: [
                              ...(selectedTicket.messages || []),
                              optimistic,
                            ],
                          });
                          // Upload attachments if present and track progress
                          let uploaded: TicketAttachmentMeta[] = [];
                          if (supportFiles.length > 0) {
                            uploaded = [];
                            for (const file of supportFiles) {
                              const meta = await uploadTicketAttachment(
                                String(selectedTicket.id || ""),
                                file,
                                (progress) => {
                                  setUploadProgress((prev) => ({
                                    ...prev,
                                    [file.name]: progress,
                                  }));
                                }
                              );
                              uploaded.push(meta);
                            }
                          }

                          await addSupportTicketMessage(
                            String(selectedTicket.id || ""),
                            {
                              senderId: user?.uid || undefined,
                              senderName: profileData.name || undefined,
                              body: text,
                              internal: false,
                              attachments: uploaded as TicketAttachmentMeta[],
                            }
                          );
                          toast.success("Reply sent");
                          setSupportReply("");
                          setSupportFiles([]);
                          setUploadProgress({});
                          _setSupportTickets((prev) =>
                            prev.map((t) =>
                              t.id === selectedTicket.id
                                ? {
                                    ...t,
                                    messages: [
                                      ...(t.messages || []),
                                      { ...optimistic, attachments: uploaded },
                                    ],
                                    updatedAt: new Date(now),
                                  }
                                : t
                            )
                          );
                        } catch (err) {
                          const msg =
                            err instanceof Error
                              ? err.message
                              : "Failed to send reply";
                          toast.error(msg);
                        }
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              Order Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedOrder && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-semibold text-sky-400">
                    #{selectedOrder.displayId}
                  </span>
                  <span className="text-sm">
                    {selectedOrder.orderDate instanceof Date
                      ? selectedOrder.orderDate.toLocaleDateString()
                      : "N/A"}
                    {selectedOrder.orderDate instanceof Date && (
                      <span className="ml-1 text-gray-500">
                        {selectedOrder.orderDate.toLocaleTimeString?.([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </span>
                  <Badge
                    className={`${
                      selectedOrder.status === "delivered"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : selectedOrder.status === "building"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : selectedOrder.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    }`}
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Order Items */}
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.name}</p>
                        {item.category && (
                          <p className="text-sm text-gray-400">
                            {item.category}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {formatCurrency(item.lineTotal)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Order Summary */}
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="text-white capitalize">
                      {selectedOrder.paymentMethod}
                    </span>
                  </div>
                  {selectedOrder.shippingMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping:</span>
                      <span className="text-white capitalize">
                        {selectedOrder.shippingMethod}
                      </span>
                    </div>
                  )}
                  {selectedOrder.shippingCost !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping Cost:</span>
                      <span className="text-white">
                        {formatCurrency(selectedOrder.shippingCost)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-white/20">
                    <span className="text-lg font-semibold text-white">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-sky-400">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Shipping Info */}
              {selectedOrder.address && (
                <Card className="bg-white/5 border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Shipping Address
                  </h3>
                  <div className="text-gray-300 space-y-1">
                    {selectedOrder.address.line1 && (
                      <p>{selectedOrder.address.line1}</p>
                    )}
                    {selectedOrder.address.line2 && (
                      <p>{selectedOrder.address.line2}</p>
                    )}
                    {selectedOrder.address.city && (
                      <p>{selectedOrder.address.city}</p>
                    )}
                    {selectedOrder.address.postcode && (
                      <p>{selectedOrder.address.postcode}</p>
                    )}
                    {selectedOrder.address.country && (
                      <p>{selectedOrder.address.country}</p>
                    )}
                  </div>
                </Card>
              )}

              {/* Tracking Info */}
              {(selectedOrder.trackingNumber || selectedOrder.courier) && (
                <Card className="bg-white/5 border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Tracking Information
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.courier && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Courier:</span>
                        <span className="text-white">
                          {selectedOrder.courier}
                        </span>
                      </div>
                    )}
                    {selectedOrder.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tracking Number:</span>
                        <span className="text-white font-mono">
                          {selectedOrder.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Build Updates */}
              {selectedOrder.buildUpdates &&
                selectedOrder.buildUpdates.length > 0 && (
                  <Card className="bg-white/5 border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Build Progress
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.buildUpdates.map((update, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-2 h-2 rounded-full bg-sky-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white">{update.note}</p>
                            {update.timestamp && (
                              <p className="text-sm text-gray-400 mt-1">
                                {new Date(update.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                          {update.progress !== undefined && (
                            <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30">
                              {update.progress}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              Leave a Review
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {orderToReview && (
                <span>
                  Share your experience with Order #{orderToReview.displayId}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {orderToReview &&
            orderToReview.items &&
            orderToReview.items.length > 0 && (
              <ReviewForm
                productId={`order-${
                  orderToReview.displayId || orderToReview.id
                }`}
                productName={
                  orderToReview.items.length === 1
                    ? orderToReview.items[0].name
                    : `${orderToReview.items.length} items from Order #${orderToReview.displayId}`
                }
                onSuccess={() => {
                  toast.success("Thank you for your review! 🌟");
                  setReviewDialogOpen(false);
                  setOrderToReview(null);
                }}
                onCancel={() => {
                  setReviewDialogOpen(false);
                  setOrderToReview(null);
                }}
              />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
