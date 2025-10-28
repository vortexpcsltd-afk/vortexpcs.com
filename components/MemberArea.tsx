import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
} from "lucide-react";
import {
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
} from "../services/auth";
import {
  getUserOrders,
  getUserConfigurations,
  deleteConfiguration,
} from "../services/database";
import type { Order, SavedConfiguration } from "../services/database";

interface MemberAreaProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
}

export function MemberArea({ isLoggedIn, setIsLoggedIn }: MemberAreaProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
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

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = getCurrentUser();
        if (!user) {
          setIsLoggedIn(false);
          return;
        }

        setCurrentUser(user);
        console.log("📋 Member Area - Loading data for user:", user.uid);

        // Load user profile
        const profile = await getUserProfile(user.uid);
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
      } catch (err: any) {
        console.error("❌ Member Area - Error loading data:", err);
        setError(err.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      loadUserData();
    }
  }, [isLoggedIn, setIsLoggedIn]);

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
    if (currentUser?.metadata?.creationTime) {
      return new Date(currentUser.metadata.creationTime).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      );
    }
    return "N/A";
  };

  // Calculate total spent from orders
  const getTotalSpent = () => {
    return orders.reduce((sum, order) => sum + order.total, 0);
  };

  const handleLogout = () => {
    localStorage.removeItem("vortex_user");
    setIsLoggedIn(false);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await updateUserProfile(currentUser.uid, {
        displayName: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
      });

      setSuccess("Profile updated successfully!");
      setEditingProfile(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("❌ Profile update error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      await deleteConfiguration(configId);
      setConfigurations((prev) => prev.filter((c) => c.id !== configId));
      setSuccess("Configuration deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete configuration");
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
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                      currentUser?.displayName ||
                      currentUser?.email ||
                      "User"
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back,{" "}
                  {profileData.name || currentUser?.displayName || "Member"}!
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
                    <Button className="bg-gradient-to-r from-sky-600 to-blue-600">
                      Browse PC Builder
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
                              {order.estimatedCompletion.toLocaleDateString()}
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
                              className="bg-yellow-600 hover:bg-yellow-700"
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
                    <Button className="bg-gradient-to-r from-sky-600 to-blue-600">
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
                            {config.createdAt?.toLocaleDateString?.() || "N/A"}
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
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                              currentUser?.displayName ||
                              currentUser?.email ||
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
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Quick Support
                  </h3>
                  <div className="space-y-3">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                      <Package className="w-4 h-4 mr-3" />
                      Track My Order
                    </Button>
                    <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                      <Settings className="w-4 h-4 mr-3" />
                      Technical Support
                    </Button>
                    <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                      <CreditCard className="w-4 h-4 mr-3" />
                      Billing & Returns
                    </Button>
                  </div>
                </Card>

                <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20 backdrop-blur-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Phone Support:</span>
                      <div className="text-white font-medium">
                        0800 123 4567
                      </div>
                      <div className="text-gray-400 text-xs">
                        Mon-Fri 9AM-6PM
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Email Support:</span>
                      <div className="text-white font-medium">
                        support@vortexpcs.com
                      </div>
                      <div className="text-gray-400 text-xs">
                        24-48 hour response
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Live Chat:</span>
                      <div className="text-white font-medium">
                        Available on website
                      </div>
                      <div className="text-gray-400 text-xs">
                        Mon-Fri 9AM-6PM
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
