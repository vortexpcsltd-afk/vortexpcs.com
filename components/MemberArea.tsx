import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  User,
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
} from "lucide-react";
import { updateUserProfile } from "../services/auth";
import {
  getUserOrders,
  getUserConfigurations,
  deleteConfiguration,
  createSupportTicket,
  getUserSupportTickets,
  createRefundRequest,
  Order,
  SavedConfiguration,
} from "../services/database";
import { useAuth } from "../contexts/AuthContext";

interface MemberAreaProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  onNavigate?: (view: string) => void;
}

export function MemberArea({
  isLoggedIn,
  setIsLoggedIn,
  onNavigate,
}: MemberAreaProps) {
  const { user, userProfile } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>(
    []
  );

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [supportForm, setSupportForm] = useState({
    subject: "",
    type: "general",
    message: "",
  });
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  // New state for support tickets and refunds
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [activeSupportTab, setActiveSupportTab] = useState<
    "progress" | "tickets" | "orders"
  >("progress");

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        console.log("📋 Member Area - Loading data for user:", user.uid);

        // Load user profile
        const profile = userProfile;
        console.log("👤 Member Area - User profile:", profile);

        if (profile) {
          setProfileData({
            name: profile.displayName || user.displayName || "",
            email: profile.email || user.email || "",
            phone: profile.phone || "",
            address: profile.address || "",
          });
        }

        // Load orders
        const userOrders = await getUserOrders(user.uid);
        console.log("📦 Member Area - Orders loaded:", userOrders.length);
        setOrders(userOrders);

        // Load saved configurations
        const userConfigs = await getUserConfigurations(user.uid);
        console.log(
          "💾 Member Area - Configurations loaded:",
          userConfigs.length
        );
        setConfigurations(userConfigs);

        // Load support tickets
        const tickets = await getUserSupportTickets(user.uid);
        console.log("🎫 Member Area - Support tickets loaded:", tickets.length);
        setSupportTickets(tickets);
      } catch (err: any) {
        console.error("❌ Member Area - Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && isLoggedIn) {
      loadUserData();
    }
  }, [user, userProfile, isLoggedIn]);

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
    if (userProfile?.createdAt) {
      const date =
        userProfile.createdAt instanceof Date
          ? userProfile.createdAt
          : new Date(userProfile.createdAt);

      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
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
      console.error("Logout error:", error);
    }
    localStorage.removeItem("vortex_user");
    setIsLoggedIn(false);
    onNavigate?.("home");
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await updateUserProfile(user.uid, {
        displayName: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
      });

      setEditingProfile(false);
    } catch (err: any) {
      console.error("❌ Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      await deleteConfiguration(configId);
      setConfigurations((prev) => prev.filter((c) => c.id !== configId));
    } catch (err: any) {
      console.error("❌ Delete configuration error:", err);
    }
  };

  const handleSubmitSupportTicket = async (e: FormEvent) => {
    e.preventDefault();

    if (!supportForm.subject || !supportForm.message) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSupportSubmitting(true);

      const ticketId = await createSupportTicket({
        userId: user?.uid,
        name: profileData.name || user?.displayName || "Member",
        email: profileData.email || user?.email || "",
        subject: supportForm.subject,
        message: supportForm.message,
        type: supportForm.type,
      });

      // Analytics: support_ticket_created (gated by consent)
      try {
        const consent = localStorage.getItem("vortex_cookie_consent");
        if (consent === "accepted") {
          const raw = localStorage.getItem("vortex_user");
          const savedUser = raw ? JSON.parse(raw) : null;
          const uid = savedUser?.uid || null;
          const { trackEvent } = await import("../services/database");
          trackEvent(uid, "support_ticket_created", {
            ticket_id: ticketId,
            type: supportForm.type,
            subject_length: supportForm.subject.length,
          });
        }
      } catch {
        // best-effort analytics only
      }

      setSupportSuccess(true);
      setSupportForm({ subject: "", type: "general", message: "" });

      setTimeout(() => setSupportSuccess(false), 5000);
    } catch (err: any) {
      console.error("❌ Support ticket error:", err);
      alert("Failed to submit support ticket. Please try again.");
    } finally {
      setSupportSubmitting(false);
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
      setOrders(userOrders);
    } catch (error) {
      console.error("Refund request error:", error);
      alert(
        "Failed to submit refund request. Please try again or contact support."
      );
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

  if (!isLoggedIn) {
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
                  Access Required
                </h1>
                <p className="text-gray-400">
                  Please log in to access your member area
                </p>
              </div>

              <Button
                onClick={() => setIsLoggedIn(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              >
                Login to Continue
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                  {getInitials(
                    profileData.name ||
                      user?.displayName ||
                      user?.email ||
                      "User"
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back,{" "}
                  {profileData.name || user?.displayName || "Member"}!
                </h1>
                <p className="text-gray-400">Member since {getMemberSince()}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Logout
            </Button>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 border-white/10">
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-white/10 text-white"
              >
                My Orders
              </TabsTrigger>
              <TabsTrigger
                value="configurations"
                className="data-[state=active]:bg-white/10 text-white"
              >
                Saved Builds
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-white/10 text-white"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="support"
                className="data-[state=active]:bg-white/10 text-white"
              >
                Support
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              {loading ? (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading your orders...</p>
                  </div>
                </Card>
              ) : orders.length === 0 ? (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-12">
                  <div className="text-center">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      No Orders Yet
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Start building your dream PC!
                    </p>
                    <Button
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                      onClick={() => onNavigate?.("pc-finder")}
                    >
                      Open PC Finder
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => (
                    <Card
                      key={order.id}
                      className="bg-white/5 border-white/10 backdrop-blur-xl p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {order.items?.[0]?.productName || "Custom Build"}
                            </h3>
                            <Badge
                              className={`${getStatusColor(
                                order.status
                              )} border`}
                            >
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(order.status)}
                                <span className="capitalize">
                                  {order.status}
                                </span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-gray-400">
                            Order #{order.orderId || order.id}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            £{order.total.toLocaleString()}
                          </div>
                          <p className="text-gray-400 text-sm">
                            Ordered:{" "}
                            {order.orderDate?.toLocaleDateString?.() || "N/A"}
                          </p>
                        </div>
                      </div>

                      {order.status === "building" && (
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
                        </div>
                      )}

                      {order.items && order.items.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {order.items.map((item, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-center"
                            >
                              {item.productName}
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
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Configurations Tab */}
            <TabsContent value="configurations" className="space-y-6">
              {loading ? (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">
                      Loading saved configurations...
                    </p>
                  </div>
                </Card>
              ) : configurations.length === 0 ? (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-12">
                  <div className="text-center">
                    <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      No Saved Builds
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Save your custom PC configurations in the PC Builder!
                    </p>
                    <Button
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
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
                      className="bg-white/5 border-white/10 backdrop-blur-xl p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {config.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            Created:{" "}
                            {config.createdAt &&
                            config.createdAt instanceof Date &&
                            !isNaN(config.createdAt.getTime())
                              ? config.createdAt.toLocaleDateString()
                              : config.createdAt
                              ? new Date(config.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-400">
                            £{config.totalPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {Object.entries(config.components || {}).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-400 capitalize">
                                {key}:
                              </span>
                              <span className="text-white">
                                {String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-500"
                        >
                          Load in Builder
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteConfiguration(config.id!)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white">
                    Profile Information
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() =>
                      editingProfile
                        ? handleSaveProfile()
                        : setEditingProfile(true)
                    }
                    className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/50"
                  >
                    {editingProfile ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label
                        htmlFor="name"
                        className="text-white text-sm font-semibold mb-2 block"
                      >
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
                        className={`bg-white/5 border-white/10 text-white h-12 ${
                          editingProfile
                            ? "focus:border-sky-500/50 focus:ring-sky-500/20"
                            : "opacity-75"
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="email"
                        className="text-white text-sm font-semibold mb-2 block"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        disabled={!editingProfile}
                        className={`bg-white/5 border-white/10 text-white h-12 ${
                          editingProfile
                            ? "focus:border-sky-500/50 focus:ring-sky-500/20"
                            : "opacity-75"
                        }`}
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="phone"
                        className="text-white text-sm font-semibold mb-2 block"
                      >
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
                        className={`bg-white/5 border-white/10 text-white h-12 ${
                          editingProfile
                            ? "focus:border-sky-500/50 focus:ring-sky-500/20"
                            : "opacity-75"
                        }`}
                        placeholder="+44 7XXX XXXXXX"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="address"
                        className="text-white text-sm font-semibold mb-2 block"
                      >
                        Address
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
                        className={`bg-white/5 border-white/10 text-white h-12 ${
                          editingProfile
                            ? "focus:border-sky-500/50 focus:ring-sky-500/20"
                            : "opacity-75"
                        }`}
                        placeholder="Your delivery address"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <Avatar className="w-32 h-32 mx-auto mb-4">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-4xl">
                          {getInitials(
                            profileData.name ||
                              user?.displayName ||
                              user?.email ||
                              "User"
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {editingProfile && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                      )}
                    </div>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-sm p-6">
                      <h4 className="font-bold text-white mb-4 text-lg">
                        Account Status
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-gray-300 font-medium">
                            Member Since:
                          </span>
                          <span className="text-white font-semibold">
                            {getMemberSince()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-gray-300 font-medium">
                            Total Orders:
                          </span>
                          <span className="text-sky-400 font-bold">
                            {orders.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-300 font-medium">
                            Total Spent:
                          </span>
                          <span className="text-green-400 font-bold text-lg">
                            £{getTotalSpent().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
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
                  onValueChange={(v) => setActiveSupportTab(v as any)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-white/5">
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
                  </TabsList>

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
                                    Order #{order.orderId}
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
                                      {order.buildUpdates.map(
                                        (update: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="flex items-start space-x-3 text-sm"
                                          >
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                              <p className="text-white">
                                                {update.note}
                                              </p>
                                              <p className="text-gray-400 text-xs">
                                                {update.timestamp?.toDate
                                                  ? update.timestamp
                                                      .toDate()
                                                      .toLocaleString()
                                                  : "Recently"}
                                              </p>
                                            </div>
                                            <span className="text-sky-400 font-semibold">
                                              {update.progress}%
                                            </span>
                                          </div>
                                        )
                                      )}
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
                                      • {item.productName} x{item.quantity}
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
                      <Button
                        onClick={() => {
                          setSupportForm({ ...supportForm, type: "technical" });
                          // Scroll to form
                          document
                            .getElementById("ticket-form")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        New Ticket
                      </Button>
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
                        <Button
                          onClick={() => {
                            setSupportForm({
                              ...supportForm,
                              type: "technical",
                            });
                            document
                              .getElementById("ticket-form")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                          Create Your First Ticket
                        </Button>
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
                                {ticket.status}
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
                            !order.refundRequested;
                          const isRefundRequested = order.refundRequested;

                          return (
                            <Card
                              key={order.id}
                              className="bg-white/5 border-white/10 backdrop-blur-xl p-6"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="text-lg font-bold text-white mb-1">
                                    Order #{order.orderId}
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
                                        {item.productName} x{item.quantity}
                                      </span>
                                      <span className="text-white font-medium">
                                        £
                                        {(
                                          item.price * item.quantity
                                        ).toLocaleString()}
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

              {/* Support Ticket Form */}
              <Card
                id="ticket-form"
                className="bg-white/5 border-white/10 backdrop-blur-xl p-8"
              >
                <h3 className="text-2xl font-bold text-white mb-6">
                  Submit Support Ticket
                </h3>

                {supportSuccess && (
                  <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-400 font-medium">
                      ✓ Support ticket submitted successfully! We'll respond
                      within 24-48 hours.
                    </p>
                  </div>
                )}

                <form
                  onSubmit={handleSubmitSupportTicket}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="ticket-type"
                        className="text-white text-sm font-semibold mb-2 block"
                      >
                        Type of Issue
                      </Label>
                      <select
                        id="ticket-type"
                        value={supportForm.type}
                        onChange={(e) =>
                          setSupportForm({
                            ...supportForm,
                            type: e.target.value,
                          })
                        }
                        className="w-full h-12 bg-white/5 border border-white/10 text-white rounded-md px-4 focus:border-sky-500/50 focus:ring-sky-500/20 focus:outline-none"
                      >
                        <option value="general" className="bg-slate-900">
                          General Inquiry
                        </option>
                        <option value="order" className="bg-slate-900">
                          Order Tracking
                        </option>
                        <option value="technical" className="bg-slate-900">
                          Technical Support
                        </option>
                        <option value="billing" className="bg-slate-900">
                          Billing & Returns
                        </option>
                        <option value="warranty" className="bg-slate-900">
                          Warranty Claim
                        </option>
                      </select>
                    </div>

                    <div>
                      <Label
                        htmlFor="ticket-subject"
                        className="text-white text-sm font-semibold mb-2 block"
                      >
                        Subject *
                      </Label>
                      <Input
                        id="ticket-subject"
                        value={supportForm.subject}
                        onChange={(e) =>
                          setSupportForm({
                            ...supportForm,
                            subject: e.target.value,
                          })
                        }
                        placeholder="Brief description of your issue"
                        className="bg-white/5 border-white/10 text-white h-12 focus:border-sky-500/50 focus:ring-sky-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="ticket-message"
                      className="text-white text-sm font-semibold mb-2 block"
                    >
                      Message *
                    </Label>
                    <Textarea
                      id="ticket-message"
                      value={supportForm.message}
                      onChange={(e) =>
                        setSupportForm({
                          ...supportForm,
                          message: e.target.value,
                        })
                      }
                      placeholder="Please provide detailed information about your issue..."
                      className="bg-white/5 border-white/10 text-white min-h-[150px] focus:border-sky-500/50 focus:ring-sky-500/20"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={supportSubmitting}
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {supportSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>Submit Ticket</>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
