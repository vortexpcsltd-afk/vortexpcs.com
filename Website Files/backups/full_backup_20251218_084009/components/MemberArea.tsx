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
  Gift,
  Sparkles,
  Crown,
  Eye,
  Percent,
  ChevronRight,
  Coins,
  BadgeCheck,
  Rocket,
  Layers,
  Box,
  PartyPopper,
  Lightbulb,
  Heart,
  Shield,
  Users,
  Copy,
  CheckCheck,
  Send,
  Share2,
  Star,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
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

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  reward: string;
  date?: string;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  type: "discount" | "freebie" | "priority" | "exclusive";
  value: string;
  expiresAt?: string;
  icon: JSX.Element;
  claimed?: boolean;
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

  // Reward modal state
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

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
      referrals: 0, // TODO: Integrate referrals
      memberSince,
      tier,
    };
  }, [orders, configurations, userProfile]);

  // Achievements system
  const achievements: Achievement[] = useMemo(
    () => [
      {
        id: "first-order",
        title: "First Build",
        description: "Placed your first order with Vortex PCs",
        icon: <Package className="w-6 h-6" />,
        unlocked: userStats.ordersCount >= 1,
        progress: Math.min(userStats.ordersCount, 1),
        maxProgress: 1,
        reward: "50 XP + 5% discount on next order",
        date: orders[0]?.orderDate
          ? new Date(orders[0].orderDate).toLocaleDateString()
          : undefined,
      },
      {
        id: "power-user",
        title: "Power User",
        description: "Order 5 custom PCs",
        icon: <Zap className="w-6 h-6" />,
        unlocked: userStats.ordersCount >= 5,
        progress: Math.min(userStats.ordersCount, 5),
        maxProgress: 5,
        reward: "200 XP + Free RGB upgrade",
      },
      {
        id: "big-spender",
        title: "VIP Customer",
        description: "Spend over £5,000",
        icon: <Crown className="w-6 h-6" />,
        unlocked: userStats.totalSpent >= 5000,
        progress: Math.min(userStats.totalSpent, 5000),
        maxProgress: 5000,
        reward: "Platinum tier + Priority support",
      },
      {
        id: "builder",
        title: "Master Builder",
        description: "Save 10 custom configurations",
        icon: <Layers className="w-6 h-6" />,
        unlocked: configurations.length >= 10,
        progress: Math.min(configurations.length, 10),
        maxProgress: 10,
        reward: "150 XP + Custom builder badge",
      },
      {
        id: "config-saver",
        title: "Configuration Expert",
        description: "Save 5 different PC configurations",
        icon: <Share2 className="w-6 h-6" />,
        unlocked: configurations.length >= 5,
        progress: Math.min(configurations.length, 5),
        maxProgress: 5,
        reward: "100 XP + Exclusive builder badge",
      },
      {
        id: "loyal",
        title: "Loyal Customer",
        description: "Member for over 1 year",
        icon: <Heart className="w-6 h-6" />,
        unlocked: false, // TODO: Calculate based on actual member date
        progress: 0,
        maxProgress: 365,
        reward: "500 XP + Lifetime 10% discount",
      },
    ],
    [userStats, orders, configurations]
  );

  // Rewards system
  const rewards: Reward[] = useMemo(() => {
    const activeRewards: Reward[] = [];

    // Welcome reward - always show for new customers
    activeRewards.push({
      id: "welcome-bonus",
      title: "Welcome Bonus",
      description:
        userStats.ordersCount === 0
          ? "5% off your first order over £500"
          : "Claimed! Used on your first order",
      type: "discount",
      value: "5%",
      icon: <Gift className="w-5 h-5" />,
      claimed: userStats.ordersCount > 0,
    });

    // Level-based rewards - always show
    activeRewards.push({
      id: "level-milestone",
      title: "Level Up Reward",
      description:
        userStats.level >= 2
          ? "10% off your next order"
          : "Reach Level 2 to unlock this reward",
      type: "discount",
      value: "10%",
      icon: <Percent className="w-5 h-5" />,
      claimed: userStats.level >= 2 ? false : undefined,
      expiresAt: "31-03-2026",
    });

    // Configuration reward - always show
    activeRewards.push({
      id: "config-bonus",
      title: "Builder's Reward",
      description:
        configurations.length >= 1
          ? "£25 credit for saving and sharing your configuration"
          : "Save and share 1 configuration to unlock £25 credit",
      type: "discount",
      value: "£25",
      icon: <BadgeCheck className="w-5 h-5" />,
      claimed: configurations.length >= 1 ? false : undefined,
    });

    // Repeat customer bonus - always show
    activeRewards.push({
      id: "repeat-customer",
      title: "Repeat Customer Bonus",
      description:
        userStats.ordersCount >= 2
          ? "15% off your next order"
          : "Place 2 orders to unlock this reward",
      type: "discount",
      value: "15%",
      icon: <Trophy className="w-5 h-5" />,
      claimed: userStats.ordersCount >= 2 ? false : undefined,
      expiresAt: "31-03-2026",
    });

    // Egalitarian support - always active for everyone
    activeRewards.push({
      id: "support-for-all",
      title: "Fast Support For Everyone",
      description:
        "All customers are treated equally with rapid, helpful support—no tiers required",
      type: "priority",
      value: "Included",
      icon: <Rocket className="w-5 h-5" />,
      claimed: true,
    });

    // Free express shipping - always show
    activeRewards.push({
      id: "free-shipping",
      title: "Free Express Shipping",
      description:
        userStats.tier === "platinum" || userStats.tier === "diamond"
          ? "Free express shipping (worth £14.99) on your next order"
          : "Reach Platinum tier (£5,000 spent) to unlock free shipping",
      type: "freebie",
      value: "Worth £14.99",
      icon: <Truck className="w-5 h-5" />,
      claimed:
        userStats.tier === "platinum" || userStats.tier === "diamond"
          ? false
          : undefined,
      expiresAt: "31-03-2026",
    });

    // Early access - always show
    activeRewards.push({
      id: "early-access",
      title: "Early Access",
      description:
        userStats.level >= 3
          ? "Get notified 24 hours early about new launches"
          : "Reach Level 3 to unlock early access",
      type: "exclusive",
      value: userStats.level >= 3 ? "Active" : "Locked",
      icon: <Sparkles className="w-5 h-5" />,
      claimed: userStats.level >= 3,
    });

    // Premium Build Consultation
    activeRewards.push({
      id: "premium-consultation",
      title: "Premium Build Consultation",
      description:
        userStats.tier === "diamond"
          ? "Free 30-minute consultation with our expert builders"
          : "Reach Diamond tier (£10,000 spent) to unlock",
      type: "exclusive",
      value: userStats.tier === "diamond" ? "Worth £50" : "Locked",
      icon: <Star className="w-5 h-5" />,
      claimed: userStats.tier === "diamond" ? false : undefined,
      expiresAt: "31-03-2026",
    });

    // Extended warranty
    activeRewards.push({
      id: "extended-warranty",
      title: "Extended Warranty",
      description:
        userStats.ordersCount >= 3
          ? "Free 1-year warranty extension"
          : "Place 3 orders to unlock extended warranty",
      type: "freebie",
      value: "Worth £99",
      icon: <Shield className="w-5 h-5" />,
      claimed: userStats.ordersCount >= 3 ? false : undefined,
      expiresAt: "31-03-2026",
    });

    // Big Spender Bonus
    activeRewards.push({
      id: "big-spender",
      title: "Big Spender Bonus",
      description: "£50 off your next order for being a valued customer",
      type: "discount",
      value: "£50",
      icon: <Coins className="w-5 h-5" />,
      claimed: false,
      expiresAt: "31-03-2026",
    });

    // Referral bonus
    activeRewards.push({
      id: "referral-bonus",
      title: "Referral Rewards",
      description:
        userStats.referrals >= 1
          ? `You've referred ${userStats.referrals} customers! Earn £25 per referral`
          : "Refer a friend and earn £25 off your next order",
      type: "discount",
      value: "£25 each",
      icon: <Users className="w-5 h-5" />,
      claimed: userStats.referrals >= 1 ? false : undefined,
    });

    // Seasonal offer - always available
    activeRewards.push({
      id: "winter-2025",
      title: "Winter Sale Exclusive",
      description: "Extra 5% off on top of sale prices",
      type: "discount",
      value: "5%",
      icon: <Percent className="w-5 h-5" />,
      claimed: false,
      expiresAt: "31-12-2025",
    });

    // Loyalty milestone
    activeRewards.push({
      id: "loyalty-year",
      title: "Loyalty Milestone",
      description: "Member for 1 year? Unlock 20% lifetime discount!",
      type: "discount",
      value: "20%",
      icon: <Heart className="w-5 h-5" />,
      claimed: undefined,
      expiresAt: "Unlock at 1 year",
    });

    // Free RGB upgrade
    activeRewards.push({
      id: "rgb-upgrade",
      title: "RGB Lighting Upgrade",
      description:
        configurations.length >= 3
          ? "Free RGB lighting kit with your next build"
          : "Save 3 configurations to unlock RGB upgrade",
      type: "freebie",
      value: "Worth £35",
      icon: <Lightbulb className="w-5 h-5" />,
      claimed: configurations.length >= 3 ? false : undefined,
      expiresAt: "31-03-2026",
    });

    return activeRewards;
  }, [userStats, configurations]);

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
          name: userProfile?.displayName || user.displayName || "",
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

  // Generate unique discount code for rewards
  const generateDiscountCode = (rewardId: string) => {
    const prefix = rewardId.toUpperCase().split("-")[0].substring(0, 4);
    const userId = user?.uid.substring(0, 4).toUpperCase() || "USER";
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${userId}${timestamp}`;
  };

  // Copy discount code to clipboard
  const copyDiscountCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    toast.success("Discount code copied to clipboard!");
    setTimeout(() => setCodeCopied(false), 2000);
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
        {/* Premium Header Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-purple-500/10 border-white/20 backdrop-blur-xl overflow-hidden relative group">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="p-6 sm:p-8 lg:p-10 relative">
              {/* Main header section */}
              <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-6 lg:gap-8 mb-8">
                {/* Left: User identity */}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-white/10 relative ring-2 ring-white/5">
                      <AvatarFallback
                        className={`bg-gradient-to-br ${getTierColor(
                          userStats.tier
                        )} text-white text-2xl sm:text-3xl font-bold`}
                      >
                        {profileData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Tier indicator */}
                    {userStats.tier !== "bronze" && (
                      <div
                        className={`absolute -bottom-1 -right-1 bg-gradient-to-r ${getTierColor(
                          userStats.tier
                        )} rounded-full p-2 border-2 border-black shadow-lg`}
                      >
                        {getTierIcon(userStats.tier)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                      {profileData.name || "Welcome"}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {userStats.tier !== "bronze" && (
                        <Badge
                          className={`bg-gradient-to-r ${getTierColor(
                            userStats.tier
                          )} border-0 text-white capitalize px-3 py-1 text-sm font-medium`}
                        >
                          {userStats.tier} Member
                        </Badge>
                      )}
                      <span className="text-sm text-gray-400">
                        Member since {userStats.memberSince}
                      </span>
                    </div>

                    {/* Level and progress bar */}
                    <div className="flex items-center gap-3 max-w-md">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg cursor-help">
                              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-semibold text-yellow-400">
                                Level {userStats.level}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">Account Level</p>
                            <p className="text-xs">
                              Earn XP by placing orders and completing
                              milestones. Higher levels unlock exclusive perks
                              and rewards.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <Progress
                                  value={(userStats.xp % 500) / 5}
                                  className="h-2 bg-white/10"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {userStats.xpForNextLevel} XP to Level{" "}
                                  {userStats.level + 1}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-semibold mb-1">
                                Experience Points (XP)
                              </p>
                              <p className="text-xs mb-2">
                                Track your progress to the next level. Earn XP
                                by:
                              </p>
                              <ul className="text-xs space-y-1">
                                <li>
                                  • Completing purchases (+100 XP per order)
                                </li>
                                <li>• Writing product reviews (+50 XP)</li>
                                <li>• Using PC Builder (+25 XP per build)</li>
                                <li>
                                  • Sharing products on social media (+15 XP)
                                </li>
                                <li>• Unlocking achievements</li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Account stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 w-full lg:w-auto lg:min-w-[400px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-sky-500/30 transition-all duration-300 cursor-pointer group">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-sky-500/10 rounded-lg group-hover:bg-sky-500/20 transition-colors">
                              <Package className="w-4 h-4 text-sky-400" />
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-white mb-0.5">
                            {userStats.ordersCount}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            Total Orders
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total orders placed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer group">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                              <Coins className="w-4 h-4 text-yellow-400" />
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-white mb-0.5">
                            £{userStats.totalSpent.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            Total Spent
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total amount spent</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer group">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                              <Trophy className="w-4 h-4 text-purple-400" />
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-white mb-0.5">
                            {achievements.filter((a) => a.unlocked).length}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            Achievements
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">
                          Achievements Unlocked
                        </p>
                        <p className="text-xs">
                          Complete milestones to earn achievements like "First
                          Order", "PC Enthusiast", and "Build Master". Check the
                          Achievements tab to see all available challenges.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 cursor-pointer group">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                              <Gift className="w-4 h-4 text-pink-400" />
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-white mb-0.5">
                            {rewards.filter((r) => !r.claimed).length}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            Rewards Available
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available rewards to claim</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="sticky top-0 z-30 pb-3">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="bg-gray-900/80 border border-white/10 backdrop-blur-xl rounded-2xl p-1.5 w-full flex gap-1 shadow-lg shadow-black/20">
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-2.5 font-medium"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-2.5 font-medium"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Orders
                </TabsTrigger>
                <TabsTrigger
                  value="builds"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-2.5 font-medium"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  My Builds
                </TabsTrigger>
                <TabsTrigger
                  value="rewards"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-2.5 font-medium"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Rewards
                </TabsTrigger>
                <TabsTrigger
                  value="achievements"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-2.5 font-medium"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-2.5 font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger
                  value="support"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 text-gray-400 hover:text-white transition-all duration-300 rounded-xl px-6 py-2.5 font-medium"
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
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Button
                onClick={() => onNavigate?.("pc-builder")}
                className="h-auto py-4 sm:py-6 flex-col gap-2 bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border-0"
              >
                <Rocket className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="font-semibold text-xs sm:text-sm">
                  Build New PC
                </span>
              </Button>

              <Button
                onClick={() => setActiveTab("orders")}
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-white/20 hover:bg-white/10"
              >
                <Package className="w-8 h-8 text-sky-400" />
                <span className="font-semibold">Track Order</span>
              </Button>

              <Button
                onClick={() => onNavigate?.("pc-finder")}
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-white/20 hover:bg-white/10"
              >
                <Lightbulb className="w-8 h-8 text-yellow-400" />
                <span className="font-semibold">PC Finder</span>
              </Button>

              <Button
                onClick={() => onNavigate?.("support")}
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-white/20 hover:bg-white/10"
              >
                <MessageSquare className="w-8 h-8 text-green-400" />
                <span className="font-semibold">Get Support</span>
              </Button>
            </div>

            {/* Active Orders & Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Active Orders */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                    <span className="truncate">Active Orders</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("orders")}
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {orders.filter((o) => o.status !== "delivered").slice(0, 3)
                  .length > 0 ? (
                  <div className="space-y-4">
                    {orders
                      .filter((o) => o.status !== "delivered")
                      .slice(0, 3)
                      .map((order) => (
                        <div
                          key={order.id}
                          className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-sky-500/50 transition-all cursor-pointer group"
                          onClick={() => setActiveTab("orders")}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-white mb-1 group-hover:text-sky-400 transition-colors">
                                Order #{order.id}
                              </p>
                              <p className="text-sm text-gray-400">
                                {order.orderDate
                                  ? new Date(
                                      order.orderDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                            <Badge
                              className={`${
                                order.status === "pending"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : order.status === "shipped"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : order.status === "delivered"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-purple-500/20 text-purple-400"
                              } border-0`}
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <Progress
                            value={order.progress || 0}
                            className="h-2 mb-2"
                          />
                          <p className="text-xs text-gray-400">
                            {order.progress || 0}% Complete
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-400 mb-4">No active orders</p>
                    <Button
                      onClick={() => onNavigate?.("pc-builder")}
                      size="sm"
                      className="bg-gradient-to-r from-sky-500 to-blue-600"
                    >
                      Build Your First PC
                    </Button>
                  </div>
                )}
              </Card>

              {/* Rewards Spotlight */}
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 backdrop-blur-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Your Rewards
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("rewards")}
                    >
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  {rewards.filter((r) => !r.claimed).length > 0 ? (
                    <div className="space-y-3">
                      {rewards
                        .filter((r) => !r.claimed)
                        .slice(0, 3)
                        .map((reward) => (
                          <div
                            key={reward.id}
                            className="p-4 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                                {reward.icon}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-white mb-1">
                                  {reward.title}
                                </p>
                                <p className="text-sm text-gray-300 mb-2">
                                  {reward.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <Badge className="bg-purple-500/20 text-purple-300 border-0">
                                    {reward.value}
                                  </Badge>
                                  {reward.expiresAt && (
                                    <p className="text-xs text-gray-400">
                                      Expires {reward.expiresAt}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                      <p className="text-gray-300">No active rewards</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Complete achievements to earn rewards!
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Recent Achievements */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Recent Achievements
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("achievements")}
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements
                  .filter((a) => a.unlocked)
                  .slice(0, 3)
                  .map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0">
                        <PartyPopper className="w-8 h-8 text-yellow-500/20" />
                      </div>
                      <div className="relative">
                        <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 w-fit mb-3">
                          {achievement.icon}
                        </div>
                        <p className="font-semibold text-white mb-1">
                          {achievement.title}
                        </p>
                        <p className="text-sm text-gray-300 mb-2">
                          {achievement.description}
                        </p>
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-0 text-xs">
                          {achievement.reward}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
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
                                    £{item.unitPrice.toFixed(2)}
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

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 backdrop-blur-xl p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Gift className="w-6 h-6 text-purple-400" />
                Your Rewards & Perks
              </h3>
              {/* Value message banner */}
              <div className="mb-6 rounded-lg border border-purple-500/40 bg-gradient-to-r from-sky-600/20 to-blue-600/20 p-4">
                <p className="text-white font-semibold">
                  Welcome to Vortex PCs Ltd — where loyalty is rewarded.
                </p>
                <p className="text-gray-300 text-sm">
                  Enjoy exclusive savings, upgrades, and insider access designed
                  to make every build better. No gimmicks — just genuine value
                  for our customers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <Card
                    key={reward.id}
                    className={`${
                      reward.claimed
                        ? "bg-white/5 border-white/10"
                        : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/40"
                    } p-6 relative overflow-hidden`}
                  >
                    {!reward.claimed && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                          NEW
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          reward.claimed
                            ? "bg-white/10"
                            : "bg-gradient-to-br from-purple-500/30 to-pink-500/30"
                        }`}
                      >
                        {reward.icon}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-2">
                          {reward.title}
                        </h4>
                        <p className="text-sm text-gray-300 mb-3">
                          {reward.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <Badge
                            className={`${
                              reward.type === "discount"
                                ? "bg-green-500/20 text-green-300"
                                : reward.type === "freebie"
                                ? "bg-blue-500/20 text-blue-300"
                                : reward.type === "priority"
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-orange-500/20 text-orange-300"
                            } border-0`}
                          >
                            {reward.value}
                          </Badge>

                          {reward.claimed === false && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 to-pink-600"
                              onClick={() => {
                                setSelectedReward(reward);
                                setRewardModalOpen(true);
                                setCodeCopied(false);
                              }}
                            >
                              Claim Now
                            </Button>
                          )}
                          {reward.claimed === undefined && (
                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/40">
                              Locked
                            </Badge>
                          )}
                        </div>

                        {reward.expiresAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Expires {reward.expiresAt}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Achievements
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/40"
                        : "bg-white/5 border-white/10 opacity-60"
                    } p-6 relative overflow-hidden`}
                  >
                    {achievement.unlocked && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`p-3 rounded-full ${
                          achievement.unlocked
                            ? "bg-gradient-to-br from-yellow-500/30 to-orange-500/30"
                            : "bg-white/10"
                        }`}
                      >
                        {achievement.icon}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-gray-300 mb-3">
                          {achievement.description}
                        </p>

                        {achievement.unlocked ? (
                          <div>
                            <Badge className="bg-yellow-500/20 text-yellow-300 border-0 mb-2">
                              {achievement.reward}
                            </Badge>
                            {achievement.date && (
                              <p className="text-xs text-gray-400">
                                Unlocked on {achievement.date}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-400">
                                Progress
                              </span>
                              <span className="text-sm text-gray-400">
                                {achievement.progress} /{" "}
                                {achievement.maxProgress}
                              </span>
                            </div>
                            <Progress
                              value={
                                (achievement.progress /
                                  achievement.maxProgress) *
                                100
                              }
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
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

      {/* Reward Claim Modal */}
      <Dialog open={rewardModalOpen} onOpenChange={setRewardModalOpen}>
        <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-sky-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              {selectedReward?.icon}
              {selectedReward?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedReward?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Reward value badge */}
            <div className="flex justify-center">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 text-lg px-6 py-2">
                {selectedReward?.value}
              </Badge>
            </div>

            {/* Discount code */}
            {selectedReward && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                <Label className="text-white text-sm font-medium">
                  Your Discount Code
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={generateDiscountCode(selectedReward.id)}
                    className="bg-black/50 border-sky-500/30 text-white text-lg font-mono text-center"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-sky-500/30 hover:bg-sky-500/20"
                    onClick={() =>
                      copyDiscountCode(generateDiscountCode(selectedReward.id))
                    }
                  >
                    {codeCopied ? (
                      <CheckCheck className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Copy this code and paste it at checkout to claim your reward
                </p>
              </div>
            )}

            {/* Expiry info */}
            {selectedReward?.expiresAt && (
              <div className="flex items-center justify-center gap-2 text-orange-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Expires {selectedReward.expiresAt}
                </span>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                How to Use
              </h4>
              <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                <li>Copy the discount code above</li>
                <li>Browse our products and add items to your cart</li>
                <li>At checkout, paste the code in the discount field</li>
                <li>Your reward will be automatically applied!</li>
              </ol>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("pc-builder");
                }
                setRewardModalOpen(false);
              }}
            >
              Start Building Now
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                          £{item.lineTotal.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400">
                          £{item.unitPrice.toFixed(2)} × {item.quantity}
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
                        £{selectedOrder.shippingCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-white/20">
                    <span className="text-lg font-semibold text-white">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-sky-400">
                      £{selectedOrder.total.toFixed(2)}
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
