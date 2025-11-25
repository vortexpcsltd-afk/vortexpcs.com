import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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
  CreditCard,
  Clock,
  CheckCircle,
  Truck,
  Star,
  Edit,
  Save,
  Camera,
  Loader2,
  AlertCircle,
  MessageSquare,
  XCircle,
  Activity,
  User,
  ChevronDown,
  Calendar,
} from "lucide-react";
import {
  updateUserProfile,
  getCurrentUser,
  changeUserPassword,
  changeUserEmail,
} from "../services/auth";
import {
  getUserOrders,
  getUserConfigurations,
  deleteConfiguration,
  getUserSupportTickets,
  createRefundRequest,
  getUserRefundRequests,
  claimGuestOrders,
  claimGuestOrdersForUser,
  SavedConfiguration,
  type SupportTicket as DBSupportTicket,
  type RefundRequest,
} from "../services/database";
import {
  normalizeOrders,
  NormalizedOrder,
} from "../services/normalizers/orderNormalizer";
import { useAuth } from "../contexts/AuthContext";
import { ProfileSkeleton, OrderCardSkeleton } from "./SkeletonComponents";
import TicketCenter from "./customer/TicketCenter";
import { logger } from "../services/logger";

interface MemberAreaProps {
  onNavigate?: (route: string) => void;
}

interface ProfileDataState {
  name: string;
  email: string;
  phone: string;
  address: string;
  marketingOptOut: boolean;
}

export default function MemberArea({ onNavigate }: MemberAreaProps) {
  const { user, userProfile, loading: authLoading } = useAuth();

  // Authentication gate (manual login simulation retained)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!user);

  // Local UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileDataState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    marketingOptOut: false,
  });

  // Orders & related
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<NormalizedOrder | null>(
    null
  );
  const [lastOrdersUpdate, setLastOrdersUpdate] = useState<Date | null>(null);
  const [ordersRefreshing, setOrdersRefreshing] = useState<boolean>(false);

  // Configurations & support
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>(
    []
  );
  const [supportTickets, setSupportTickets] = useState<DBSupportTicket[]>([]);
  // Underscore prefix to intentionally suppress unused variable warnings until refund view implemented
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "orders"
    | "configurations"
    | "support"
    | "profile"
    | "refunds"
  >("dashboard");
  const [emailNew, setEmailNew] = useState("");
  const [emailCurrentPwd, setEmailCurrentPwd] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [activeSupportTab, setActiveSupportTab] = useState<
    "orders" | "center" | "refunds" | "progress" | "tickets"
  >("orders");
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  // Collection (Repair) Service Request Modal state
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [collectionDeviceType, setCollectionDeviceType] = useState("");
  const [collectionIssueSummary, setCollectionIssueSummary] = useState("");
  const [collectionPreferredDate, setCollectionPreferredDate] = useState("");
  const [collectionTimeWindow, setCollectionTimeWindow] = useState("Any");
  const [collectionPhone, setCollectionPhone] = useState("");
  const [collectionConsent, setCollectionConsent] = useState(false);
  const [collectionSubmitting, setCollectionSubmitting] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState<
    null | "success" | "error"
  >(null);
  const [collectionUrgency, setCollectionUrgency] = useState("standard");
  const [collectionPrice, setCollectionPrice] = useState("25");

  // Mark collection request state as used to satisfy strict unused-var linting
  void (
    showCollectionDialog ||
    collectionDeviceType ||
    collectionIssueSummary ||
    collectionPreferredDate ||
    collectionTimeWindow ||
    collectionPhone ||
    collectionConsent ||
    collectionSubmitting ||
    collectionStatus ||
    collectionUrgency ||
    collectionPrice
  );

  // Adjust suggested price when urgency changes (simple mapping)
  useEffect(() => {
    const suggestion =
      collectionUrgency === "emergency"
        ? "65"
        : collectionUrgency === "priority"
        ? "45"
        : "25";
    // Only auto-update if user hasn't manually changed price beyond suggestions
    if (["25", "45", "65"].includes(collectionPrice)) {
      setCollectionPrice(suggestion);
    }
  }, [collectionUrgency, collectionPrice]);

  // Redirect business accounts to business dashboard
  useEffect(() => {
    if (userProfile?.accountType === "business" && onNavigate) {
      logger.info(
        "Business account detected, redirecting to business dashboard"
      );
      onNavigate("business-dashboard");
    }
  }, [userProfile, onNavigate]);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        logger.debug("Member Area - Loading data for user", { uid: user.uid });

        // Load user profile
        const profile = userProfile;
        logger.debug("Member Area - User profile", { profile });

        if (profile) {
          setProfileData({
            name: profile.displayName || user.displayName || "",
            email: profile.email || user.email || "",
            phone: profile.phone || "",
            address: profile.address || "",
            marketingOptOut: !!profile.marketingOptOut,
          });
        }

        // Load orders (attempt claim if none)
        let userOrders = await getUserOrders(user.uid);
        if (userOrders.length === 0 && user.email) {
          try {
            await claimGuestOrdersForUser(user.uid, user.email);
            userOrders = await getUserOrders(user.uid);
          } catch (e) {
            logger.warn("Order claim attempt during load failed", {
              err: String(e),
            });
          }
        }
        logger.debug("Member Area - Orders loaded", {
          count: userOrders.length,
        });
        setOrders(normalizeOrders(userOrders));
        setLastOrdersUpdate(new Date());

        // Load saved configurations
        const userConfigs = await getUserConfigurations(user.uid);
        logger.debug("Member Area - Configurations loaded", {
          count: userConfigs.length,
        });
        setConfigurations(userConfigs);

        // Load support tickets
        const tickets = await getUserSupportTickets(user.uid);
        logger.debug("Member Area - Support tickets loaded", {
          count: tickets.length,
        });
        setSupportTickets(tickets);

        // Load refund requests
        const refunds = await getUserRefundRequests(user.uid);
        logger.debug("Member Area - Refund requests loaded", {
          count: refunds.length,
        });
        setRefundRequests(refunds);
      } catch (err: unknown) {
        logger.error("❌ Member Area - Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && isLoggedIn) {
      loadUserData();
    }
  }, [user, userProfile, isLoggedIn]);

  // Manual refresh handler
  const refreshOrders = async (showToast = true) => {
    if (!user) return;
    setOrdersRefreshing(true);
    try {
      let userOrders = await getUserOrders(user.uid);
      if (userOrders.length === 0 && user.email) {
        // First try client-side claim (Firestore rules based)
        try {
          await claimGuestOrdersForUser(user.uid, user.email);
          userOrders = await getUserOrders(user.uid);
        } catch (e) {
          logger.warn("Client-side claimGuestOrdersForUser failed", {
            err: String(e),
          });
        }

        // If still none, fall back to server-side claim via Admin SDK
        if (userOrders.length === 0) {
          try {
            const current = getCurrentUser();
            const getIdToken =
              current && typeof (current as unknown) === "object"
                ? (current as unknown as { getIdToken?: () => Promise<string> })
                    .getIdToken
                : undefined;
            const idToken =
              typeof getIdToken === "function" ? await getIdToken() : undefined;
            if (!idToken) {
              logger.warn("No ID token available for claim-orders call");
            }
            const resp = await fetch("/api/users/claim-orders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
              },
              body: JSON.stringify({ uid: user.uid, email: user.email }),
            });
            if (resp.ok) {
              const data = await resp.json();
              logger.info("Server-side claim result", data);
              userOrders = await getUserOrders(user.uid);
            } else {
              const errText = await resp.text();
              logger.warn("Server-side claim failed", {
                status: resp.status,
                text: errText,
              });
            }
          } catch (srvErr) {
            logger.error("Server-side claim-orders error", {
              err: String(srvErr),
            });
          }
        }
      }
      setOrders(normalizeOrders(userOrders));
      setLastOrdersUpdate(new Date());
      if (showToast) toast.success("Orders refreshed");
    } catch (e) {
      toast.error("Could not refresh orders");
      logger.error("Orders refresh error", e);
    } finally {
      setOrdersRefreshing(false);
    }
  };

  // Helper function to get user initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Calculate member since date
  const getMemberSince = () => {
    // Try userProfile.createdAt first
    if (userProfile?.createdAt) {
      try {
        // Handle Firestore Timestamp
        const createdAt = userProfile.createdAt as unknown;
        const date =
          typeof createdAt === "object" &&
          createdAt !== null &&
          "toDate" in createdAt &&
          typeof (createdAt as { toDate: unknown }).toDate === "function"
            ? (createdAt as { toDate: () => Date }).toDate()
            : userProfile.createdAt instanceof Date
            ? userProfile.createdAt
            : new Date(userProfile.createdAt as string | number);

        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });
        }
      } catch (e) {
        logger.error("Error parsing createdAt", { error: e });
      }
    } // Fallback: Try to get creation date from Firebase user metadata
    if (user && "metadata" in user) {
      try {
        const metadata = (user as { metadata?: { creationTime?: string } })
          .metadata;
        if (metadata?.creationTime) {
          const date = new Date(metadata.creationTime);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            });
          }
        }
      } catch (e) {
        logger.error("Error parsing metadata", { error: e });
      }
    }

    // Last resort: Use first order date if available
    if (orders.length > 0) {
      try {
        const sortedOrders = [...orders].sort((a, b) => {
          const dateA = a.orderDate || new Date(0);
          const dateB = b.orderDate || new Date(0);
          return dateA.getTime() - dateB.getTime();
        });
        const firstOrder = sortedOrders[0];
        if (firstOrder?.orderDate) {
          const date = new Date(firstOrder.orderDate);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            });
          }
        }
      } catch (e) {
        logger.error("Error parsing order date", { error: e });
      }
    }

    return "N/A";
  };

  // Calculate total spent from orders
  const getTotalSpent = () => {
    return orders.reduce((sum, order) => sum + order.total, 0);
  };

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import("../services/auth");
      await logoutUser();
    } catch (error) {
      logger.error("Logout error:", error);
    }
    localStorage.removeItem("vortex_user");
    setIsLoggedIn(false);
    onNavigate?.("logged-out");
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await updateUserProfile(user.uid, {
        displayName: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        marketingOptOut: !!profileData.marketingOptOut,
      });

      setEditingProfile(false);
    } catch (err: unknown) {
      logger.error("❌ Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      await deleteConfiguration(configId);
      setConfigurations((prev) => prev.filter((c) => c.id !== configId));
    } catch (err: unknown) {
      logger.error("❌ Delete configuration error:", err);
    }
  };

  // Handle refund request
  const handleRefundRequest = async (orderId: string) => {
    if (!user) return;

    const reason = prompt("Please provide a reason for the refund request:");
    if (!reason || reason.trim() === "") return;

    try {
      await createRefundRequest(orderId, user.uid, reason);
      alert(
        "Refund request submitted successfully! We'll review it and contact you soon."
      );

      // Analytics: refund_requested (gated by consent)
      try {
        const consent = localStorage.getItem("vortex_cookie_consent");
        if (consent === "accepted") {
          const raw = localStorage.getItem("vortex_user");
          const savedUser = raw ? JSON.parse(raw) : null;
          const uid = savedUser?.uid || null;
          const { trackEvent } = await import("../services/database");
          trackEvent(uid, "refund_requested", { order_id: orderId });
        }
      } catch {
        // best-effort analytics only
      }

      // Reload orders to show updated status
      const userOrders = await getUserOrders(user.uid);
      setOrders(normalizeOrders(userOrders));
    } catch (error) {
      logger.error("Refund request error:", error);
      alert(
        "Failed to submit refund request. Please try again or contact support."
      );
    }
  };

  // Manual claim of guest orders (user-triggered)
  const handleManualClaim = async () => {
    if (!user) return;
    try {
      setLoading(true);
      logger.info("Manual guest order claim initiated", {
        uid: user.uid,
        email: user.email,
      });
      const result = await claimGuestOrders(user.uid, user.email);
      if (result.claimed > 0) {
        const refreshed = await getUserOrders(user.uid);
        setOrders(normalizeOrders(refreshed));
        toast.success(
          `Linked ${result.claimed} past order${result.claimed > 1 ? "s" : ""}.`
        );
        logger.info("Manual guest order claim success", {
          claimed: result.claimed,
        });
      } else {
        toast.info("No unclaimed guest orders found for your email.");
        logger.info("Manual guest order claim: none found");
      }
    } catch (e) {
      logger.error("Manual guest order claim error", e);
      toast.error("Failed to link past orders.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "building":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "delivered":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-blue-400" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "building":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "delivered":
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "shipped":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const formatStatus = (status: string) => {
    // Convert status strings to readable format
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Diagnostics: log selected order when changed for crash tracing
  useEffect(() => {
    if (selectedOrder) {
      logger.debug("MemberArea: rendering selectedOrder dialog", {
        displayId: selectedOrder.displayId,
        status: selectedOrder.status,
        items: selectedOrder.items?.length || 0,
        total: selectedOrder.total,
      });
    }
  }, [selectedOrder]);

  // Check both isLoggedIn prop AND actual Firebase user from context
  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Loading...
                </h1>
                <p className="text-gray-400">Checking authentication status</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {!isLoggedIn ? "Access Required" : "Loading Account..."}
                </h1>
                <p className="text-gray-400">
                  {!isLoggedIn
                    ? "Please log in to access your member area"
                    : "Connecting to your account, please wait..."}
                </p>
              </div>

              {!isLoggedIn && (
                <Button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                >
                  Login to Continue
                </Button>
              )}

              {isLoggedIn && !user && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-white/10 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-8 w-48 bg-white/10 rounded"></div>
                <div className="h-5 w-64 bg-white/10 rounded"></div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-32 bg-white/10 rounded"></div>
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6">
              <ProfileSkeleton />
              <div className="grid md:grid-cols-2 gap-6">
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 sm:py-16 md:py-20 relative">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Header with glassmorphism */}
          <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-2xl shadow-2xl mb-6 sm:mb-8 overflow-hidden group hover:border-sky-500/30 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-purple-500 rounded-full blur-lg opacity-50 animate-pulse" />
                    <Avatar className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0 border-2 border-white/20 relative">
                      <AvatarFallback className="bg-gradient-to-br from-sky-500 via-blue-500 to-purple-600 text-white text-lg sm:text-xl md:text-2xl font-bold shadow-inner">
                        {getInitials(
                          profileData.name ||
                            user?.displayName ||
                            user?.email ||
                            "User"
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-sky-200 to-white bg-clip-text text-transparent truncate mb-1">
                      Welcome back,{" "}
                      {profileData.name || user?.displayName || "Member"}!
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm sm:text-base text-gray-300 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        Member since {getMemberSince()}
                      </p>
                      {userProfile?.accountNumber && (
                        <span className="text-xs sm:text-sm px-2 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 font-mono">
                          #{userProfile.accountNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="border-white/30 text-white hover:bg-white/20 hover:border-white/50 flex-shrink-0 h-10 sm:h-11 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  Logout
                </Button>
              </div>
            </div>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(
                v as
                  | "dashboard"
                  | "orders"
                  | "configurations"
                  | "profile"
                  | "support"
              )
            }
            className="space-y-4 sm:space-y-6"
          >
            <div className="overflow-x-auto snap-x snap-mandatory">
              <TabsList className="flex w-full justify-between bg-white/5 border border-white/15 backdrop-blur-xl shadow-lg rounded-xl px-4 py-3 space-x-2">
                <TabsTrigger
                  value="dashboard"
                  className="flex-1 text-center font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 hover:text-white text-[11px] sm:text-sm transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="flex-1 text-center font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 hover:text-white text-[11px] sm:text-sm transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md"
                >
                  My Orders
                </TabsTrigger>
                <TabsTrigger
                  value="configurations"
                  className="flex-1 text-center font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 hover:text-white text-[11px] sm:text-sm transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md"
                >
                  Saved Builds
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="flex-1 text-center font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 hover:text-white text-[11px] sm:text-sm transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="support"
                  className="flex-1 text-center font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 hover:text-white text-[11px] sm:text-sm transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md"
                >
                  Support
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
              {/* Quick Actions */}
              <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl p-4 sm:p-6 hover:shadow-2xl hover:border-white/30 transition-all duration-500 group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Quick Actions
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-sky-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <Button
                      className="h-12 sm:h-14 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-sm sm:text-base shadow-lg hover:shadow-sky-500/50 hover:scale-105 transition-all duration-300 border border-sky-400/20"
                      onClick={() => {
                        setActiveTab("support");
                        setActiveSupportTab("orders");
                        setTimeout(() => {
                          document
                            .getElementById("support-root")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }, 50);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Start a return / refund
                    </Button>
                    <Button
                      className="h-12 sm:h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-sm sm:text-base shadow-lg hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 border border-emerald-400/20"
                      onClick={() => {
                        setActiveTab("support");
                        setActiveSupportTab("center");
                        setTimeout(() => {
                          document
                            .getElementById("support-root")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }, 50);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open a support ticket
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 sm:h-14 border-white/30 text-white hover:bg-white/20 hover:border-white/50 text-sm sm:text-base backdrop-blur-sm hover:scale-105 transition-all duration-300"
                      onClick={() => setActiveTab("orders")}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      View order invoices
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Active Builds Snapshot */}
              <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl p-4 sm:p-6 hover:shadow-2xl hover:border-white/30 transition-all duration-500 group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Active Builds
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
                      <Settings
                        className="w-5 h-5 text-orange-400 animate-spin"
                        style={{ animationDuration: "3s" }}
                      />
                    </div>
                  </div>
                  {orders.filter((o) =>
                    ["pending", "building", "testing"].includes(o.status)
                  ).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
                      <p className="text-sm sm:text-base text-gray-400">
                        No builds in progress right now.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {orders
                        .filter((o) =>
                          ["pending", "building", "testing"].includes(o.status)
                        )
                        .slice(0, 4)
                        .map((o) => (
                          <div
                            key={o.id}
                            className="rounded-xl border border-white/20 p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm hover:border-sky-500/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group/item"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm sm:text-base text-white font-semibold truncate mr-2">
                                Order #{o.displayId}
                              </div>
                              <Badge
                                className={`${getStatusColor(
                                  o.status
                                )} border text-xs flex-shrink-0`}
                              >
                                {formatStatus(o.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-sky-400 font-semibold">
                                {o.progress}%
                              </span>
                            </div>
                            <Progress value={o.progress} className="h-2" />
                            {o.buildUpdates && o.buildUpdates.length > 0 && (
                              <div className="mt-2 text-xs text-gray-400">
                                Last update:{" "}
                                {(() => {
                                  const last =
                                    o.buildUpdates![o.buildUpdates!.length - 1];
                                  const ts = last?.timestamp as
                                    | { toDate?: () => Date }
                                    | Date
                                    | string
                                    | number
                                    | null
                                    | undefined;
                                  try {
                                    if (
                                      ts &&
                                      typeof ts === "object" &&
                                      "toDate" in (ts as object) &&
                                      typeof (ts as { toDate?: unknown })
                                        .toDate === "function"
                                    ) {
                                      return (ts as { toDate: () => Date })
                                        .toDate()
                                        .toLocaleString();
                                    }
                                    const d =
                                      ts instanceof Date
                                        ? ts
                                        : new Date(ts as string | number);
                                    return !isNaN(d.getTime())
                                      ? d.toLocaleString()
                                      : "Recently";
                                  } catch {
                                    return "Recently";
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl p-4 sm:p-6 hover:shadow-2xl hover:border-white/30 transition-all duration-500 group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Recent Activity
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-center py-8 text-gray-400">
                    <p>Activity timeline coming soon</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white/90">
                    My Orders
                  </h3>
                  {lastOrdersUpdate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last updated: {lastOrdersUpdate.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={ordersRefreshing}
                  onClick={() => refreshOrders(true)}
                >
                  {ordersRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Clock className="w-4 h-4 mr-2" />
                  )}
                  Refresh Orders
                </Button>
              </div>
              {loading ? (
                <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl p-12">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-sky-500/30 blur-xl rounded-full" />
                      <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4 relative" />
                    </div>
                    <p className="text-gray-300 font-medium">
                      Loading your orders...
                    </p>
                  </div>
                </Card>
              ) : orders.length === 0 ? (
                <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl p-12 hover:border-sky-500/30 transition-all duration-500">
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full" />
                      <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center">
                        <Package className="w-10 h-10 text-sky-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                      No Orders Yet
                    </h3>
                    <p className="text-gray-400 mb-8 text-lg">
                      Start building your dream PC!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-lg hover:shadow-sky-500/50 hover:scale-105 transition-all duration-300 h-12 px-8"
                        onClick={() => onNavigate?.("pc-finder")}
                      >
                        <Settings className="w-5 h-5 mr-2" />
                        Open PC Finder
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 px-8 border-sky-500/40 text-sky-300 hover:bg-sky-500/10 hover:border-sky-500/60 backdrop-blur-sm transition-all duration-300"
                        onClick={handleManualClaim}
                      >
                        <Package className="w-5 h-5 mr-2" />
                        Link Past Orders
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-6 max-w-md mx-auto">
                      If you previously purchased as a guest using this email,
                      click{" "}
                      <span className="text-sky-400">Link Past Orders</span> to
                      attach them.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => (
                    <Card
                      key={order.id}
                      className="relative overflow-hidden bg-white/5 border border-white/15 rounded-2xl backdrop-blur-xl shadow-lg px-6 pt-6 pb-5 hover:shadow-xl hover:border-sky-500/40 transition-all duration-300 group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                      <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                                {order.items?.[0]?.name || "Custom Build"}
                              </h3>
                              <Badge
                                className={`${getStatusColor(
                                  order.status
                                )} border shadow-lg`}
                              >
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(order.status)}
                                  <span className="capitalize">
                                    {formatStatus(order.status)}
                                  </span>
                                </div>
                              </Badge>
                            </div>
                            <p className="text-gray-400 font-mono text-sm">
                              Order # {order.displayId}
                            </p>
                            <TooltipProvider>
                              <div className="mt-3 flex items-center gap-2 text-xs">
                                {[
                                  {
                                    step: "pending",
                                    label: "Order Received",
                                    desc: "Your order has been received and is awaiting confirmation",
                                  },
                                  {
                                    step: "pending_payment",
                                    label: "Payment Processing",
                                    desc: "Payment is being verified and processed",
                                  },
                                  {
                                    step: "building",
                                    label: "Building",
                                    desc: "Your PC is currently being assembled by our technicians",
                                  },
                                  {
                                    step: "testing",
                                    label: "Testing",
                                    desc: "Quality assurance testing and stress testing in progress",
                                  },
                                  {
                                    step: "shipped",
                                    label: "Shipped",
                                    desc: "Your PC has been dispatched and is on its way to you",
                                  },
                                  {
                                    step: "delivered",
                                    label: "Delivered",
                                    desc: "Your PC has been delivered to your address",
                                  },
                                  {
                                    step: "completed",
                                    label: "Completed",
                                    desc: "Order is complete - enjoy your new PC!",
                                  },
                                ].map((stepInfo, idx) => {
                                  const reachedIndex = [
                                    "pending",
                                    "pending_payment",
                                    "building",
                                    "testing",
                                    "shipped",
                                    "delivered",
                                    "completed",
                                  ].indexOf(order.status);
                                  const reached = reachedIndex >= idx;
                                  const isCurrent = reachedIndex === idx;
                                  return (
                                    <div
                                      key={stepInfo.step}
                                      className="flex items-center"
                                    >
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                                              isCurrent
                                                ? "bg-sky-500 border-sky-300 text-white shadow-lg shadow-sky-500/50 scale-110"
                                                : reached
                                                ? "bg-sky-600 border-sky-400 text-white hover:scale-105"
                                                : "bg-white/5 border-white/20 text-gray-400 hover:bg-white/10"
                                            }`}
                                          >
                                            {reached ? (
                                              <CheckCircle className="w-3 h-3" />
                                            ) : (
                                              <Clock className="w-3 h-3" />
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="bottom"
                                          className="bg-slate-900 border-sky-500/30"
                                        >
                                          <div className="text-center">
                                            <p className="font-semibold text-sky-400">
                                              {stepInfo.label}
                                            </p>
                                            <p className="text-xs text-gray-300 mt-1">
                                              {stepInfo.desc}
                                            </p>
                                            {isCurrent && (
                                              <Badge className="mt-2 bg-sky-500/20 text-sky-400 border-sky-500/40 text-xs">
                                                Current Step
                                              </Badge>
                                            )}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                      {idx < 6 && (
                                        <div
                                          className={`w-8 h-0.5 mx-1 transition-all ${
                                            reached
                                              ? "bg-sky-600"
                                              : "bg-white/10"
                                          }`}
                                        ></div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </TooltipProvider>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">
                              £{order.total.toLocaleString()}
                            </div>
                            {(() => {
                              const rawShipping = (
                                order as unknown as { shippingCost?: unknown }
                              ).shippingCost;
                              const shipping =
                                typeof rawShipping === "number"
                                  ? rawShipping
                                  : 0;
                              if (shipping > 0) {
                                return (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    incl. £{shipping.toFixed(2)} shipping
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            <p className="text-gray-400 text-sm">
                              Ordered:{" "}
                              {order.orderDate?.toLocaleDateString?.() || "N/A"}
                              {order.orderDate && (
                                <span className="text-gray-500 ml-1">
                                  {order.orderDate.toLocaleTimeString?.([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {(order.status === "building" ||
                          order.status === "testing") && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-400">
                                Build Progress
                              </span>
                              <span className="text-white">
                                {order.progress || 0}%
                              </span>
                            </div>
                            <Progress
                              value={order.progress || 0}
                              className="h-2"
                            />
                            {order.estimatedCompletion && (
                              <p className="text-sm text-gray-400 mt-2">
                                Estimated completion:{" "}
                                {order.estimatedCompletion instanceof Date &&
                                !isNaN(order.estimatedCompletion.getTime())
                                  ? order.estimatedCompletion.toLocaleDateString()
                                  : "N/A"}
                              </p>
                            )}
                            {order.buildUpdates &&
                              order.buildUpdates.length > 0 && (
                                <div className="mt-3 text-xs text-gray-300">
                                  Latest update:{" "}
                                  {
                                    order.buildUpdates[
                                      order.buildUpdates.length - 1
                                    ].note
                                  }
                                </div>
                              )}
                          </div>
                        )}
                        {order.items && order.items.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {order.items.slice(0, 8).map((item, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                title={item.category || item.name}
                                className="bg-blue-500/15 border border-blue-500/30 text-blue-300 text-center px-2 py-1 rounded-md"
                              >
                                <span>{item.name}</span>
                                {item.category && (
                                  <span className="block text-[10px] uppercase opacity-70 tracking-wide">
                                    {item.category}
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                          <div className="text-sm text-gray-400">
                            {order.deliveryDate &&
                              order.deliveryDate instanceof Date &&
                              !isNaN(order.deliveryDate.getTime()) &&
                              `Delivered: ${order.deliveryDate.toLocaleDateString()}`}
                            {order.trackingNumber && (
                              <span className="ml-4">
                                Tracking: {order.trackingNumber}
                              </span>
                            )}
                          </div>
                          <div className="space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => {
                                logger.info("MemberArea: open order details", {
                                  displayId: order.displayId,
                                  status: order.status,
                                  total: order.total,
                                });
                                setSelectedOrder(order);
                              }}
                            >
                              View Details
                            </Button>
                            {order.status === "delivered" && (
                              <Button
                                size="sm"
                                className="bg-yellow-600 hover:bg-yellow-500"
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Configurations Tab */}
            <TabsContent value="configurations" className="space-y-6">
              {loading ? (
                <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl p-12">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-sky-500/30 blur-xl rounded-full" />
                      <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4 relative" />
                    </div>
                    <p className="text-gray-300 font-medium">
                      Loading saved configurations...
                    </p>
                  </div>
                </Card>
              ) : configurations.length === 0 ? (
                <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl p-12 hover:border-sky-500/30 transition-all duration-500">
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
                      <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                        <Settings
                          className="w-10 h-10 text-purple-400 animate-spin"
                          style={{ animationDuration: "3s" }}
                        />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                      No Saved Builds
                    </h3>
                    <p className="text-gray-400 mb-8 text-lg">
                      Save your custom PC configurations in the PC Builder!
                    </p>
                    <Button
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-lg hover:shadow-sky-500/50 hover:scale-105 transition-all duration-300 h-12 px-8"
                      onClick={() => onNavigate?.("pc-builder")}
                    >
                      Open PC Builder
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {configurations.map((config) => (
                    <Card
                      key={config.id}
                      className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl p-6 hover:shadow-2xl hover:border-purple-500/40 transition-all duration-500 group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                      <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                              {config.name}
                            </h3>
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {config.createdAt &&
                              config.createdAt instanceof Date &&
                              !isNaN(config.createdAt.getTime())
                                ? config.createdAt.toLocaleDateString()
                                : config.createdAt
                                ? new Date(
                                    config.createdAt
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                              £{config.totalPrice.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
                          {Object.entries(config.components || {}).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between text-sm items-center"
                              >
                                <span className="text-gray-400 capitalize flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                  {key}:
                                </span>
                                <span className="text-white font-medium truncate ml-4 max-w-[200px]">
                                  {String(value)}
                                </span>
                              </div>
                            )
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 h-10 shadow-lg hover:shadow-sky-500/50 hover:scale-105 transition-all duration-300"
                            onClick={() => {
                              // Store the configuration in localStorage to be loaded by PCBuilder
                              localStorage.setItem(
                                "loadBuildConfig",
                                JSON.stringify(config)
                              );
                              toast.success(
                                `Loading "${config.name}" in PC Builder...`
                              );
                              onNavigate?.("pc-builder");
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Load in Builder
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 h-10 px-4 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                            onClick={() =>
                              handleDeleteConfiguration(config.id!)
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {/* Header Card */}
              <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/10 backdrop-blur-xl overflow-hidden">
                <div className="relative">
                  {/* Decorative Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-purple-500/10" />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

                  <div className="relative p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      {/* Profile Header */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="w-24 h-24 border-4 border-white/10 shadow-2xl ring-4 ring-sky-500/20">
                            <AvatarFallback className="bg-gradient-to-br from-sky-500 via-blue-500 to-purple-600 text-white text-3xl font-bold">
                              {getInitials(
                                profileData.name ||
                                  user?.displayName ||
                                  user?.email ||
                                  "User"
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {editingProfile && (
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 border-2 border-white/20 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110">
                              <Camera className="w-5 h-5 text-white" />
                            </button>
                          )}
                        </div>

                        <div>
                          <h2 className="text-3xl font-bold text-white mb-2">
                            {profileData.name || user?.displayName || "Member"}
                          </h2>
                          <p className="text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Active Member
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Member since {getMemberSince()}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() =>
                          editingProfile
                            ? handleSaveProfile()
                            : setEditingProfile(true)
                        }
                        className={`h-12 px-6 ${
                          editingProfile
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                            : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                        } shadow-lg transition-all duration-300 hover:shadow-xl`}
                      >
                        {editingProfile ? (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Changes
                          </>
                        ) : (
                          <>
                            <Edit className="w-5 h-5 mr-2" />
                            Edit Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-500/30 backdrop-blur-xl p-6 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium mb-1">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {orders.length}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-sky-500/20 flex items-center justify-center">
                      <Package className="w-7 h-7 text-sky-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            (orders.length / 10) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.min(orders.length, 10)}/10
                    </span>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 backdrop-blur-xl p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium mb-1">
                        Total Spent
                      </p>
                      <p className="text-3xl font-bold text-white">
                        £{getTotalSpent().toLocaleString()}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <CreditCard className="w-7 h-7 text-green-400" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-400">
                    Lifetime value •{" "}
                    <span className="text-green-400 font-semibold">
                      Valued Customer
                    </span>
                  </p>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 backdrop-blur-xl p-6 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium mb-1">
                        Collection Service
                      </p>
                      <p className="text-3xl font-bold text-white">Book</p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Truck className="w-7 h-7 text-amber-400" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-400">
                    Schedule a collect & return repair.
                  </p>
                  <Button
                    onClick={() => {
                      setShowCollectionDialog(true);
                      setCollectionPhone(profileData.phone || "");
                    }}
                    className="mt-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                  >
                    Request Collection
                  </Button>
                </Card>
              </div>

              {/* Profile Information Card */}
              <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-white/30 transition-all duration-500 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="p-6 sm:p-8 relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                        Personal Information
                      </h3>
                      <p className="text-sm text-gray-400">
                        Manage your account details
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    {/* Email (read-only; use Change Email below) */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-gray-300 text-sm font-medium flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-sky-400" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        disabled={!editingProfile}
                        className={`bg-white/5 border-white/10 text-white h-12 rounded-lg transition-all duration-300 ${
                          editingProfile
                            ? "focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 hover:border-white/20"
                            : "opacity-60 cursor-not-allowed"
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email (read-only; use Change Email below) */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-gray-300 text-sm font-medium flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        readOnly
                        disabled
                        className="bg-white/5 border-white/10 text-white h-12 rounded-lg opacity-60 cursor-not-allowed"
                        placeholder="your.email@example.com"
                      />
                      <div className="text-xs text-gray-400">
                        To change your sign-in email, use the Change Email
                        section below.
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-gray-300 text-sm font-medium flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        disabled={!editingProfile}
                        className={`bg-white/5 border-white/10 text-white h-12 rounded-lg transition-all duration-300 ${
                          editingProfile
                            ? "focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 hover:border-white/20"
                            : "opacity-60 cursor-not-allowed"
                        }`}
                        placeholder="+44 7XXX XXXXXX"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="address"
                        className="text-gray-300 text-sm font-medium flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Delivery Address
                      </Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        disabled={!editingProfile}
                        className={`bg-white/5 border-white/10 text-white h-12 rounded-lg transition-all duration-300 ${
                          editingProfile
                            ? "focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 hover:border-white/20"
                            : "opacity-60 cursor-not-allowed"
                        }`}
                        placeholder="Your delivery address"
                      />
                    </div>

                    {/* Marketing Preferences */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5h18M8 5v14m8-14v14M3 19h18"
                          />
                        </svg>
                        Marketing Emails
                      </Label>
                      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="mr-4">
                          <div className="text-white font-medium">
                            Receive news & offers
                          </div>
                          <div className="text-xs text-gray-400">
                            Toggle to opt in/out of marketing emails. You can
                            change this anytime.
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`border ${
                              profileData.marketingOptOut
                                ? "bg-red-500/20 text-red-300 border-red-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {profileData.marketingOptOut
                              ? "Opted out"
                              : "Opted in"}
                          </Badge>
                          <Switch
                            checked={!profileData.marketingOptOut}
                            disabled={!editingProfile}
                            onCheckedChange={(checked) =>
                              setProfileData((prev) => ({
                                ...prev,
                                marketingOptOut: !checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingProfile && (
                    <div className="mt-6 p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-sky-300 font-medium">
                          Remember to save your changes
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Your information will be updated across all services
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
              {/* Account Security */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Account Security
                      </h3>
                      <p className="text-sm text-gray-400">
                        Update your password and sign-in email
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Change Password */}
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">
                        Change Password
                      </h4>
                      <div className="space-y-2">
                        <Label className="text-gray-300">
                          Current Password
                        </Label>
                        <Input
                          type="password"
                          value={pwdCurrent}
                          onChange={(e) => setPwdCurrent(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">New Password</Label>
                        <Input
                          type="password"
                          value={pwdNew}
                          onChange={(e) => setPwdNew(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">
                          Confirm New Password
                        </Label>
                        <Input
                          type="password"
                          value={pwdConfirm}
                          onChange={(e) => setPwdConfirm(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          disabled={pwdBusy}
                          onClick={async () => {
                            if (!pwdCurrent || !pwdNew || !pwdConfirm) {
                              alert("Please complete all password fields.");
                              return;
                            }
                            if (pwdNew !== pwdConfirm) {
                              alert("New passwords do not match.");
                              return;
                            }
                            try {
                              setPwdBusy(true);
                              await changeUserPassword(pwdCurrent, pwdNew);
                              setPwdCurrent("");
                              setPwdNew("");
                              setPwdConfirm("");
                              alert("Password updated successfully.");
                            } catch (e) {
                              alert(
                                e instanceof Error
                                  ? e.message
                                  : "Failed to change password"
                              );
                            } finally {
                              setPwdBusy(false);
                            }
                          }}
                          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                        >
                          {pwdBusy ? "Updating…" : "Update Password"}
                        </Button>
                      </div>
                    </div>

                    {/* Change Email */}
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">Change Email</h4>
                      <div className="space-y-2">
                        <Label className="text-gray-300">
                          New Email Address
                        </Label>
                        <Input
                          type="email"
                          value={emailNew}
                          onChange={(e) => setEmailNew(e.target.value)}
                          placeholder="new.email@example.com"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">
                          Current Password
                        </Label>
                        <Input
                          type="password"
                          value={emailCurrentPwd}
                          onChange={(e) => setEmailCurrentPwd(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        We’ll send a verification link to your new email. Your
                        sign-in email updates after you confirm.
                      </div>
                      <div className="flex justify-end">
                        <Button
                          disabled={emailBusy}
                          onClick={async () => {
                            if (!emailNew || !emailCurrentPwd) {
                              alert(
                                "Please provide your new email and current password."
                              );
                              return;
                            }
                            try {
                              setEmailBusy(true);
                              await changeUserEmail(emailCurrentPwd, emailNew);
                              setEmailNew("");
                              setEmailCurrentPwd("");
                              alert(
                                "Verification link sent to your new email."
                              );
                            } catch (e) {
                              alert(
                                e instanceof Error
                                  ? e.message
                                  : "Failed to start email change"
                              );
                            } finally {
                              setEmailBusy(false);
                            }
                          }}
                          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                        >
                          {emailBusy ? "Sending…" : "Send Verification"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              {/* Support Sub-Tabs */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <Tabs
                  value={activeSupportTab}
                  onValueChange={(v) =>
                    setActiveSupportTab(
                      v as
                        | "orders"
                        | "center"
                        | "refunds"
                        | "progress"
                        | "tickets"
                    )
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-5 bg-white/5">
                    <TabsTrigger value="progress">
                      <Activity className="w-4 h-4 mr-2" />
                      Build Progress
                    </TabsTrigger>
                    <TabsTrigger value="tickets">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Technical Support
                    </TabsTrigger>
                    <TabsTrigger value="orders">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing & Returns
                    </TabsTrigger>
                    <TabsTrigger value="center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ticket Center (New)
                    </TabsTrigger>
                    <TabsTrigger value="refunds">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Refund Requests
                    </TabsTrigger>
                  </TabsList>
                  {/* Refund Requests Tab */}
                  <TabsContent value="refunds" className="p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Your Refund Requests
                    </h3>
                    {refundRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-white mb-2">
                          No Refund Requests
                        </h4>
                        <p className="text-gray-400 max-w-md mx-auto">
                          You have not submitted any refund requests yet. You
                          can request a refund on an eligible order from the
                          Billing & Returns tab.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {refundRequests.map((r) => {
                          const statusClass =
                            r.status === "approved"
                              ? "bg-green-500/20 text-green-400 border-green-500/40"
                              : r.status === "rejected"
                              ? "bg-red-500/20 text-red-400 border-red-500/40"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
                          return (
                            <div
                              key={r.id}
                              className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Order</p>
                                <p className="text-white font-medium">
                                  #{r.orderId}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Requested:{" "}
                                  {r.createdAt
                                    ? new Date(r.createdAt).toLocaleDateString(
                                        "en-GB"
                                      )
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <p className="text-sm text-gray-400 mb-1">
                                  Reason
                                </p>
                                <p className="text-xs text-gray-300 whitespace-pre-wrap">
                                  {r.reason}
                                </p>
                              </div>
                              <div className="flex flex-col items-start md:items-end">
                                <span
                                  className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${statusClass}`}
                                >
                                  {formatStatus(r.status)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                  {/* Ticket Center (New) */}
                  <TabsContent value="center" className="p-6 space-y-4">
                    <TicketCenter />
                  </TabsContent>

                  {/* Build Progress Tab */}
                  <TabsContent value="progress" className="p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Your Build Progress
                    </h3>
                    {orders.filter((o) =>
                      ["pending", "building", "testing"].includes(o.status)
                    ).length === 0 ? (
                      <div className="text-center py-12">
                        <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-white mb-2">
                          No Active Builds
                        </h4>
                        <p className="text-gray-400">
                          You don't have any builds in progress at the moment.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {orders
                          .filter((o) =>
                            ["pending", "building", "testing"].includes(
                              o.status
                            )
                          )
                          .map((order) => (
                            <Card
                              key={order.id}
                              className="bg-white/5 border-white/10 backdrop-blur-xl p-6"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="text-lg font-bold text-white mb-1">
                                    Order # {order.displayId}
                                  </h4>
                                  <p className="text-gray-400 text-sm">
                                    {order.orderDate &&
                                    !isNaN(new Date(order.orderDate).getTime())
                                      ? new Date(
                                          order.orderDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                                <Badge
                                  className={`${getStatusColor(
                                    order.status
                                  )} border`}
                                >
                                  {order.status.charAt(0).toUpperCase() +
                                    order.status.slice(1)}
                                </Badge>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-white font-medium">
                                    Build Progress
                                  </span>
                                  <span className="text-sky-400 font-bold text-lg">
                                    {order.progress}%
                                  </span>
                                </div>
                                <Progress
                                  value={order.progress}
                                  className="h-3"
                                />
                              </div>

                              {/* Build Timeline */}
                              {order.buildUpdates &&
                                order.buildUpdates.length > 0 && (
                                  <div className="mt-4 border-t border-white/10 pt-4">
                                    <h5 className="text-white font-semibold mb-3">
                                      Build Updates:
                                    </h5>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {order.buildUpdates.map((update, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-start space-x-3 text-sm"
                                        >
                                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1">
                                            <p className="text-white">
                                              {typeof update.note === "string"
                                                ? update.note
                                                : ""}
                                            </p>
                                            <p className="text-gray-400 text-xs">
                                              {(() => {
                                                const ts = update.timestamp;
                                                try {
                                                  if (
                                                    ts &&
                                                    typeof ts === "object"
                                                  ) {
                                                    const maybeFn = (
                                                      ts as {
                                                        toDate?: () => Date;
                                                      }
                                                    ).toDate;
                                                    if (
                                                      typeof maybeFn ===
                                                      "function"
                                                    ) {
                                                      const d = maybeFn();
                                                      if (d instanceof Date)
                                                        return d.toLocaleString();
                                                    }
                                                  }
                                                  if (ts instanceof Date)
                                                    return ts.toLocaleString();
                                                  if (
                                                    typeof ts === "string" ||
                                                    typeof ts === "number"
                                                  ) {
                                                    const d = new Date(ts);
                                                    if (!isNaN(d.getTime()))
                                                      return d.toLocaleString();
                                                  }
                                                } catch {
                                                  /* ignore */
                                                }
                                                return "Recently";
                                              })()}
                                            </p>
                                          </div>
                                          <span className="text-sky-400 font-semibold">
                                            {typeof update.progress === "number"
                                              ? `${update.progress}%`
                                              : ""}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Products in Order */}
                              <div className="mt-4 border-t border-white/10 pt-4">
                                <h5 className="text-white font-semibold mb-2">
                                  Components:
                                </h5>
                                <div className="space-y-1">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="text-sm text-gray-300"
                                    >
                                      • {item.name} x{item.quantity}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Technical Support Tab */}
                  <TabsContent value="tickets" className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white">
                        Support Tickets
                      </h3>
                    </div>

                    {supportTickets.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-white mb-2">
                          No Support Tickets
                        </h4>
                        <p className="text-gray-400 mb-4">
                          You haven't submitted any support tickets yet.
                        </p>
                        <p className="text-gray-500 text-sm">
                          Use the ticket composer above to create your first
                          ticket.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {supportTickets.map((ticket) => (
                          <Card
                            key={ticket.id}
                            className="bg-white/5 border-white/10 backdrop-blur-xl p-6"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-lg font-bold text-white mb-1">
                                  {ticket.subject}
                                </h4>
                                <p className="text-gray-400 text-sm">
                                  {ticket.createdAt &&
                                  !isNaN(new Date(ticket.createdAt).getTime())
                                    ? new Date(
                                        ticket.createdAt
                                      ).toLocaleString()
                                    : "Recently"}
                                </p>
                              </div>
                              <Badge
                                className={`${
                                  ticket.status === "open"
                                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                                    : ticket.status === "in-progress"
                                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                    : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                } border`}
                              >
                                {formatStatus(ticket.status)}
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm mb-2">
                              {ticket.message}
                            </p>
                            <div className="flex items-center text-xs text-gray-400">
                              <Package className="w-3 h-3 mr-1" />
                              Type: {ticket.type}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Billing & Returns Tab */}
                  <TabsContent value="orders" className="p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Order History & Returns
                    </h3>
                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-white mb-2">
                          No Orders Yet
                        </h4>
                        <p className="text-gray-400">
                          Your order history will appear here once you make a
                          purchase.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const canCancel =
                            ["pending", "building"].includes(order.status) &&
                            !order.original?.refundRequested;
                          const isRefundRequested =
                            !!order.original?.refundRequested;

                          return (
                            <Card
                              key={order.id}
                              className="bg-white/5 border-white/10 backdrop-blur-xl p-6"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="text-lg font-bold text-white mb-1">
                                    Order # {order.displayId}
                                  </h4>
                                  <p className="text-gray-400 text-sm">
                                    {order.orderDate &&
                                    !isNaN(new Date(order.orderDate).getTime())
                                      ? new Date(
                                          order.orderDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <Badge
                                    className={`${getStatusColor(
                                      order.status
                                    )} border`}
                                  >
                                    {order.status.charAt(0).toUpperCase() +
                                      order.status.slice(1)}
                                  </Badge>
                                  {isRefundRequested && (
                                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 border">
                                      Refund Requested
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Total Amount
                                  </p>
                                  <p className="text-green-400 font-bold text-lg">
                                    £{order.total.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">Items</p>
                                  <p className="text-white font-semibold">
                                    {order.items.length} item(s)
                                  </p>
                                </div>
                              </div>

                              {/* Order Items */}
                              <div className="border-t border-white/10 pt-3 mb-4">
                                <div className="space-y-1">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-sm"
                                    >
                                      <span className="text-gray-300">
                                        {item.name} x{item.quantity}
                                      </span>
                                      <span className="text-white font-medium">
                                        £{item.lineTotal.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              {canCancel && (
                                <Button
                                  onClick={() => handleRefundRequest(order.id!)}
                                  variant="outline"
                                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Request Cancellation / Refund
                                </Button>
                              )}
                              {isRefundRequested && (
                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                                  <p className="text-orange-300 text-sm flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Your refund request is being reviewed by our
                                    team. We'll contact you within 24-48 hours.
                                  </p>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Order ID</p>
                  <p className="text-white font-semibold">
                    {selectedOrder.displayId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Order Date</p>
                  <p className="text-white font-semibold">
                    {selectedOrder.orderDate instanceof Date
                      ? selectedOrder.orderDate.toLocaleDateString()
                      : "N/A"}
                    {selectedOrder.orderDate instanceof Date && (
                      <span className="text-gray-500 ml-2 text-sm">
                        {selectedOrder.orderDate.toLocaleTimeString?.([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <Badge
                    className={`mt-1 ${
                      selectedOrder.status === "delivered"
                        ? "bg-green-500/20 border-green-500/40 text-green-400"
                        : selectedOrder.status === "building"
                        ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                        : selectedOrder.status === "pending"
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                        : "bg-gray-500/20 border-gray-500/40 text-gray-400"
                    }`}
                  >
                    {formatStatus(selectedOrder.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-green-400 font-bold text-xl">
                    £{selectedOrder.total.toLocaleString()}
                  </p>
                  {(() => {
                    const rawShipping = (
                      selectedOrder as unknown as { shippingCost?: unknown }
                    ).shippingCost;
                    const shipping =
                      typeof rawShipping === "number" ? rawShipping : 0;
                    if (shipping > 0) {
                      const itemsOnly = selectedOrder.total - shipping;
                      return (
                        <p className="text-xs text-gray-500 mt-1">
                          Items: £{itemsOnly.toFixed(2)} + Shipping: £
                          {shipping.toFixed(2)}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              {selectedOrder.progress !== undefined && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Build Progress</p>
                  <Progress value={selectedOrder.progress} className="h-3" />
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedOrder.progress}% Complete
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400 mb-3">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-3"
                      >
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-sm text-gray-400">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="text-white font-semibold">
                          £{item.lineTotal.toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No items</p>
                  )}
                </div>
              </div>
              {selectedOrder.address && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Shipping Address</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-white">{selectedOrder.address.line1}</p>
                    {selectedOrder.address.line2 && (
                      <p className="text-white">
                        {selectedOrder.address.line2}
                      </p>
                    )}
                    <p className="text-white">
                      {selectedOrder.address.city},{" "}
                      {selectedOrder.address.postcode}
                    </p>
                    <p className="text-white">
                      {selectedOrder.address.country}
                    </p>
                  </div>
                </div>
              )}
              {selectedOrder.trackingNumber && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Tracking Number</p>
                  <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sky-400 font-mono">
                        {selectedOrder.trackingNumber}
                      </p>
                      <Truck className="w-5 h-5 text-sky-400" />
                    </div>
                    {selectedOrder.courier && (
                      <p className="text-xs text-gray-400">
                        Courier:{" "}
                        <span className="text-gray-300">
                          {selectedOrder.courier}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
              {selectedOrder.buildUpdates &&
                selectedOrder.buildUpdates.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">Build Updates</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedOrder.buildUpdates.map((update, index) => (
                        <div
                          key={index}
                          className="bg-white/5 border border-white/10 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm text-gray-400">
                              {update.timestamp instanceof Date
                                ? update.timestamp.toLocaleDateString()
                                : "N/A"}
                            </p>
                            {update.progress !== undefined && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                {update.progress}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-white">{update.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              <div className="flex justify-end pt-4 border-t border-white/10">
                <Button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Collection Service Booking Dialog */}
      <Dialog
        open={showCollectionDialog}
        onOpenChange={(open) => {
          if (!open && !collectionSubmitting) {
            setShowCollectionDialog(false);
          } else if (open) {
            setCollectionStatus(null);
          }
        }}
      >
        <DialogContent className="bg-gradient-to-br from-black/80 via-slate-900 to-black border-amber-500/30 text-white w-full max-w-[750px] max-h-[90vh] overflow-y-auto overflow-x-visible p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Request Collection & Return Service
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (collectionSubmitting) return;
              setCollectionSubmitting(true);
              setCollectionStatus(null);
              try {
                const payload = {
                  bookingData: {
                    urgency: collectionUrgency,
                    issueTypes: [collectionIssueSummary || ""],
                    description: collectionIssueSummary,
                  },
                  customerInfo: {
                    name: profileData.name,
                    email: profileData.email,
                    phone: collectionPhone || profileData.phone,
                    address: profileData.address,
                  },
                  // Estimated collection fee (not charged here)
                  totalPrice: parseFloat(collectionPrice) || 0,
                };
                await fetch("/api/repair/notify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                toast.success("Collection request submitted");
                setCollectionStatus("success");
                setShowCollectionDialog(false);
                // basic reset
                setCollectionDeviceType("");
                setCollectionIssueSummary("");
                setCollectionPreferredDate("");
                setCollectionTimeWindow("Any");
                setCollectionConsent(false);
                setCollectionUrgency("standard");
                setCollectionPrice("25");
              } catch (err) {
                console.error("Collection request failed", err);
                toast.error("Failed to submit collection request");
                setCollectionStatus("error");
              } finally {
                setCollectionSubmitting(false);
              }
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Device Type</Label>
                <Input
                  value={collectionDeviceType}
                  onChange={(e) => setCollectionDeviceType(e.target.value)}
                  placeholder="e.g. Gaming PC"
                  className="bg-white/5 border-white/15 focus:border-amber-500/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">
                  Preferred Pickup Date
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={collectionPreferredDate}
                    onChange={(e) => setCollectionPreferredDate(e.target.value)}
                    className="bg-white/5 border-white/15 focus:border-amber-500/50 text-white pr-10 appearance-none hide-native-date-icon"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Time Window</Label>
                <div className="relative">
                  <select
                    value={collectionTimeWindow}
                    onChange={(e) => setCollectionTimeWindow(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-amber-500/50 outline-none appearance-none pr-9 text-white"
                  >
                    <option className="bg-slate-800 text-white">Any</option>
                    <option className="bg-slate-800 text-white">Morning</option>
                    <option className="bg-slate-800 text-white">
                      Afternoon
                    </option>
                    <option className="bg-slate-800 text-white">Evening</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Contact Phone</Label>
                <Input
                  value={collectionPhone}
                  onChange={(e) => setCollectionPhone(e.target.value)}
                  placeholder="Phone number"
                  className="bg-white/5 border-white/15 focus:border-amber-500/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Urgency</Label>
                <div className="relative">
                  <select
                    value={collectionUrgency}
                    onChange={(e) => setCollectionUrgency(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-amber-500/50 outline-none appearance-none pr-10 text-white"
                  >
                    <option
                      value="standard"
                      className="bg-slate-800 text-white"
                    >
                      Standard (24-48h)
                    </option>
                    <option
                      value="priority"
                      className="bg-slate-800 text-white"
                    >
                      Priority (Next Day)
                    </option>
                    <option
                      value="emergency"
                      className="bg-slate-800 text-white"
                    >
                      Emergency (Same Day)
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label className="text-gray-300 text-sm">
                  Estimated Collection Fee (£)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={collectionPrice}
                  onChange={(e) => setCollectionPrice(e.target.value)}
                  className="bg-white/5 border-white/15 focus:border-amber-500/50"
                  required
                />
                <p className="text-[11px] text-gray-400">
                  Auto-filled by urgency. Adjust if quoted differently.
                </p>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-gray-300 text-sm">
                  Issue Summary / Symptoms
                </Label>
                <textarea
                  value={collectionIssueSummary}
                  onChange={(e) => setCollectionIssueSummary(e.target.value)}
                  placeholder="Describe the issue you're experiencing..."
                  rows={5}
                  className="w-full min-h-[140px] bg-white/5 border border-white/15 rounded-md px-4 py-3 text-sm leading-relaxed resize-y focus:border-amber-500/50 outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <input
                id="collectionConsent"
                type="checkbox"
                checked={collectionConsent}
                onChange={(e) => setCollectionConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5"
                required
              />
              <Label
                htmlFor="collectionConsent"
                className="text-xs text-gray-400 leading-relaxed"
              >
                I confirm I am the owner of this device and agree to the
                standard diagnostic terms. A team member will contact me to
                confirm collection details.
              </Label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  !collectionSubmitting && setShowCollectionDialog(false)
                }
                className="border-white/20 text-gray-300 hover:bg-white/10"
                disabled={collectionSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  collectionSubmitting ||
                  !collectionConsent ||
                  !collectionDeviceType ||
                  !collectionIssueSummary ||
                  !collectionPreferredDate
                }
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
              >
                {collectionSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </span>
                ) : (
                  <span>Submit Request</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
