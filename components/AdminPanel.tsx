import { useState, useEffect, type ComponentType } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  AlertTriangle,
  Package,
  Users,
  DollarSign,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  Download,
  BarChart3,
  Settings,
  Shield,
  Loader2,
  ExternalLink,
  FileText,
  Image,
  MessageSquare,
  Code,
  Globe,
  Upload,
  RefreshCw,
} from "lucide-react";
import {
  getAllOrders,
  getAllUsers,
  getDashboardStats,
  getAnalytics,
  updateBuildProgress,
  getAllSupportTickets,
  updateSupportTicket,
  getAllRefundRequests,
} from "../services/database";
import type { Order } from "../services/database";
import { fetchPCComponents, type PCComponent } from "../services/cms";
import { useAuth } from "../contexts/AuthContext";
import { updateUserProfile } from "../services/auth";

export function AdminPanel() {
  const { isAdmin, user } = useAuth();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Meta tags state
  const [metaTags, setMetaTags] = useState({
    siteName: "Vortex PCs",
    siteDescription: "Custom PC Building & Gaming Systems",
    siteKeywords: "custom pc, gaming pc, pc builder, gaming systems",
    ogImage: "https://vortexpcs.com/og-image.jpg",
    twitterHandle: "@VortexPCs",
  });

  // Real data states
  const [dashboardStats, setDashboardStats] = useState({
    orders: { total: 0, change: "+0%", trend: "up" as const },
    revenue: { total: 0, change: "+0%", trend: "up" as const },
    customers: { total: 0, change: "+0%", trend: "up" as const },
    builds: { total: 0, change: "+0%", trend: "up" as const },
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  type CustomerRow = {
    id: string;
    name: string;
    email: string;
    orders: number;
    spent: number;
    joined: Date | null;
    role: string;
  };
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [inventory, setInventory] = useState<PCComponent[]>([]);
  const [analyticsData, setAnalyticsData] = useState({
    totalPageViews: 0,
    totalVisitors: 0,
    averagePageViewsPerDay: 0,
    topPages: [] as Array<{ page: string; views: number }>,
    viewsByDay: {} as Record<string, number>,
  });

  // New states for build progress, tickets, and refunds
  const [showBuildProgressModal, setShowBuildProgressModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildStatus, setBuildStatus] = useState<Order["status"]>("pending");
  const [buildNote, setBuildNote] = useState("");
  type SupportTicket = {
    id: string;
    status: string;
    type?: string;
    subject: string;
    name: string;
    email: string;
    message: string;
    createdAt?: Date | string | number | null;
  };
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  type RefundRequest = {
    id: string;
    status: string;
    orderId: string;
    reason: string;
    createdAt?: Date | string | number | null;
  };
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);

  // Load admin data on component mount
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        console.log("📊 Admin Panel - Loading dashboard data...");

        // Load dashboard statistics
        const stats = await getDashboardStats();
        setDashboardStats(stats);
        console.log("📊 Dashboard stats loaded:", stats);

        // Load all orders
        const orders = await getAllOrders(100);
        setAllOrders(orders);
        setRecentOrders(orders.slice(0, 5)); // Show top 5 for dashboard
        console.log("📦 Admin Panel - Orders loaded:", orders.length);

        // Load all users
        const users = await getAllUsers();
        console.log("👥 Raw users from database:", users);

        // Calculate customer stats from users and orders
        type RawUser = {
          id: string;
          email?: string;
          displayName?: string;
          createdAt?: Date | string | number | null;
          role?: unknown;
        };
        const customersWithStats: CustomerRow[] = users.map((user: RawUser) => {
          const userOrders = orders.filter((order) => order.userId === user.id);
          const totalSpent = userOrders.reduce(
            (sum, order) => sum + order.total,
            0
          );

          console.log(`📊 Processing user ${user.email}:`, {
            orders: userOrders.length,
            spent: totalSpent,
            createdAt: user.createdAt,
          });

          return {
            id: user.id,
            name: user.displayName || user.email?.split("@")[0] || "Unknown",
            email: user.email || "",
            orders: userOrders.length,
            spent: totalSpent,
            joined: (user.createdAt as Date) || null,
            role: (user?.role ? String(user.role) : "user").toLowerCase(),
          };
        });

        setCustomers(customersWithStats);
        console.log(
          "👥 Admin Panel - Customers loaded:",
          customersWithStats.length,
          customersWithStats
        );
      } catch (error) {
        console.error("❌ Admin Panel - Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadInventory = async () => {
      try {
        setInventoryLoading(true);
        console.log("📦 Admin Panel - Loading inventory from Contentful...");

        // Fetch all components from Contentful
        const components = await fetchPCComponents();
        setInventory(components);
        console.log("📦 Admin Panel - Inventory loaded:", components.length);
      } catch (error) {
        console.error("❌ Admin Panel - Error loading inventory:", error);
      } finally {
        setInventoryLoading(false);
      }
    };

    const loadAnalytics = async () => {
      try {
        console.log("📊 Admin Panel - Loading analytics data...");
        const analytics = await getAnalytics(30); // Last 30 days
        setAnalyticsData(analytics);
        console.log("📊 Analytics loaded:", analytics);
      } catch (error) {
        console.error("❌ Admin Panel - Error loading analytics:", error);
      }
    };

    const loadTicketsAndRefunds = async () => {
      try {
        console.log(
          "🎫 Admin Panel - Loading support tickets and refund requests..."
        );
        const tickets = await getAllSupportTickets();
        const refunds = await getAllRefundRequests();
        setSupportTickets(tickets);
        setRefundRequests(refunds);
        console.log(
          `📋 Loaded ${tickets.length} tickets and ${refunds.length} refund requests`
        );
      } catch (error) {
        console.error("❌ Admin Panel - Error loading tickets/refunds:", error);
      }
    };

    if (isAdmin) {
      loadAdminData();
      loadInventory();
      loadAnalytics();
      loadTicketsAndRefunds();
    } else {
      // For non-admins, avoid permission errors by skipping protected reads
      console.warn("🔐 Non-admin user: skipping admin data loads.");
      setLoading(false);
    }
  }, [isAdmin]);

  // Get filtered inventory based on selected category
  const getFilteredInventory = () => {
    if (selectedCategory === "all") {
      return inventory;
    }
    return inventory.filter((item) => item.category === selectedCategory);
  };

  // Get inventory status based on stock
  const getInventoryStatus = (item: PCComponent) => {
    const stockLevel = item.stockLevel;
    if (!item.inStock || stockLevel === 0) {
      return "out-of-stock";
    }
    if (typeof stockLevel === "number" && stockLevel <= 5) {
      return "low-stock";
    }
    return "in-stock";
  };

  // Get unique categories from inventory
  const getCategories = () => {
    const categories = new Set(inventory.map((item) => item.category));
    return Array.from(categories).sort();
  };

  // Handle editing inventory in Contentful
  const handleEditInContentful = (product: PCComponent) => {
    // Open Contentful web app to edit the product
    const contentfulSpaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
    if (contentfulSpaceId) {
      const contentfulUrl = `https://app.contentful.com/spaces/${contentfulSpaceId}/entries/${product.id}`;
      window.open(contentfulUrl, "_blank");
    } else {
      alert(
        "Contentful is not configured. Please set up your environment variables."
      );
    }
  };

  // Show info about inventory management
  const handleInventoryInfo = () => {
    alert(
      "Inventory Management Info:\n\n" +
        "• Products are managed in Contentful CMS\n" +
        '• Click "Edit in Contentful" to modify products\n' +
        "• Changes sync automatically within minutes\n" +
        "• To add new products, use Contentful's interface"
    );
  };

  // Handle opening build progress modal
  const handleOpenBuildProgress = (order: Order) => {
    setSelectedOrder(order);
    setBuildProgress(order.progress || 0);
    setBuildStatus(order.status);
    setBuildNote("");
    setShowBuildProgressModal(true);
  };

  // Handle updating build progress
  const handleUpdateBuildProgress = async () => {
    if (!selectedOrder?.id) return;

    try {
      await updateBuildProgress(
        selectedOrder.id,
        buildProgress,
        buildStatus,
        buildNote
      );

      // Reload orders to show updates
      const orders = await getAllOrders(100);
      setAllOrders(orders);
      setRecentOrders(orders.slice(0, 5));

      setShowBuildProgressModal(false);
      alert("Build progress updated successfully!");
    } catch (error) {
      console.error("Error updating build progress:", error);
      alert("Failed to update build progress. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "building":
      case "testing":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "shipped":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "completed":
      case "delivered":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "pending":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "in-stock":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "low-stock":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "out-of-stock":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const StatCard = ({
    title,
    value,
    change,
    trend,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number;
    change: string;
    trend: "up" | "down";
    icon: ComponentType<{ className?: string }>;
    color: string;
  }) => (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">
              {typeof value === "number" &&
              title.toLowerCase().includes("revenue")
                ? `£${value.toLocaleString()}`
                : value.toLocaleString()}
            </span>
            <Badge
              className={`${
                trend === "up"
                  ? "bg-green-500/20 text-green-300"
                  : "bg-red-500/20 text-red-300"
              } border-0`}
            >
              {change}
            </Badge>
          </div>

          {!isAdmin && (
            <Card className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border-amber-500/30 backdrop-blur-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="text-white font-semibold">
                    Admin access required
                  </h3>
                  <p className="text-gray-300 text-sm">
                    You’re viewing a limited version of the Admin Panel. Sign in
                    with an administrator account to manage orders, customers,
                    and content.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-gray-400">
                  Manage your Vortex PCs operations
                </p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-5 bg-white/5 border-white/10">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-white/10 text-white"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-white/10 text-white"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="data-[state=active]:bg-white/10 text-white"
              >
                Inventory
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="data-[state=active]:bg-white/10 text-white"
              >
                Customers
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="data-[state=active]:bg-white/10 text-white"
              >
                Content
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Orders"
                  value={dashboardStats.orders.total}
                  change={dashboardStats.orders.change}
                  trend={dashboardStats.orders.trend}
                  icon={Package}
                  color="from-blue-500 to-cyan-500"
                />
                <StatCard
                  title="Revenue"
                  value={dashboardStats.revenue.total}
                  change={dashboardStats.revenue.change}
                  trend={dashboardStats.revenue.trend}
                  icon={DollarSign}
                  color="from-green-500 to-emerald-500"
                />
                <StatCard
                  title="Customers"
                  value={dashboardStats.customers.total}
                  change={dashboardStats.customers.change}
                  trend={dashboardStats.customers.trend}
                  icon={Users}
                  color="from-purple-500 to-pink-500"
                />
                <StatCard
                  title="Active Builds"
                  value={dashboardStats.builds.total}
                  change={dashboardStats.builds.change}
                  trend={dashboardStats.builds.trend}
                  icon={Settings}
                  color="from-orange-500 to-red-500"
                />
              </div>

              {/* Alert Cards for Refunds and Tickets */}
              {(refundRequests.length > 0 ||
                supportTickets.filter((t) => t.status === "open").length >
                  0) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {refundRequests.length > 0 && (
                    <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 backdrop-blur-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-1">
                            Refund Requests Pending
                          </h4>
                          <p className="text-gray-300 text-sm mb-3">
                            {refundRequests.length} customer
                            {refundRequests.length > 1 ? "s have" : " has"}{" "}
                            requested refunds
                          </p>
                          <Button
                            size="sm"
                            onClick={() => setActiveTab("orders")}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Review Requests
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                  {supportTickets.filter((t) => t.status === "open").length >
                    0 && (
                    <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30 backdrop-blur-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-1">
                            Open Support Tickets
                          </h4>
                          <p className="text-gray-300 text-sm mb-3">
                            {
                              supportTickets.filter((t) => t.status === "open")
                                .length
                            }{" "}
                            ticket
                            {supportTickets.filter((t) => t.status === "open")
                              .length > 1
                              ? "s need"
                              : " needs"}{" "}
                            attention
                          </p>
                          <Button
                            size="sm"
                            onClick={() => setActiveTab("customers")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            View Tickets
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Recent Orders */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Recent Orders
                  </h3>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    View All Orders
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading orders...</p>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      No Orders Yet
                    </h3>
                    <p className="text-gray-400">
                      Orders will appear here once customers start purchasing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium text-white">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-400">
                              {order.orderId}
                            </div>
                          </div>
                          <div>
                            <div className="text-white">
                              {order.items?.[0]?.productName || "Custom Build"}
                            </div>
                            <div className="text-sm text-gray-400">
                              {order.orderDate &&
                              order.orderDate instanceof Date &&
                              !isNaN(order.orderDate.getTime())
                                ? order.orderDate.toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge
                            className={`${getStatusColor(order.status)} border`}
                          >
                            {order.status}
                          </Badge>
                          <div className="text-right">
                            <div className="font-bold text-green-400">
                              £{order.total.toLocaleString()}
                            </div>
                            {(order.status === "building" ||
                              order.status === "testing") && (
                              <div className="text-sm text-gray-400">
                                {order.progress}% complete
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">
                  Order Management
                </h3>
                <div className="flex space-x-3">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search orders..."
                      className="bg-white/5 border-white/10 text-white w-64"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white">Order ID</TableHead>
                      <TableHead className="text-white">Customer</TableHead>
                      <TableHead className="text-white">Product</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Total</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders.slice(0, 20).map((order) => (
                      <TableRow key={order.id} className="border-white/10">
                        <TableCell className="text-white font-medium">
                          {order.orderId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-white">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-400">
                              {order.customerEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          {order.items?.[0]?.productName || "Custom Build"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(order.status)} border`}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-400 font-bold">
                          £{order.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenBuildProgress(order)}
                              className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                              title="Update Build Progress"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              {order.progress}%
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Refund Requests Section */}
              {refundRequests.length > 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                      <h3 className="text-xl font-bold text-white">
                        Pending Refund Requests
                      </h3>
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30 border">
                        {
                          refundRequests.filter((r) => r.status === "pending")
                            .length
                        }{" "}
                        Pending
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {refundRequests.map((request) => {
                      const order = allOrders.find(
                        (o) => o.id === request.orderId
                      );
                      return (
                        <Card
                          key={request.id}
                          className="bg-white/5 border-white/10 backdrop-blur-xl p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-bold text-white">
                                  {order
                                    ? `Order #${order.orderId}`
                                    : "Order Not Found"}
                                </h4>
                                <Badge
                                  className={`${
                                    request.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                      : request.status === "approved"
                                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                                      : "bg-red-500/20 text-red-300 border-red-500/30"
                                  } border`}
                                >
                                  {request.status}
                                </Badge>
                              </div>
                              {order && (
                                <div className="text-sm text-gray-400 mb-2">
                                  Customer: {order.customerName} (
                                  {order.customerEmail})
                                </div>
                              )}
                              <div className="bg-white/5 border border-white/10 rounded p-3 mb-3">
                                <p className="text-white font-semibold mb-1">
                                  Reason:
                                </p>
                                <p className="text-gray-300 text-sm">
                                  {request.reason}
                                </p>
                              </div>
                              <div className="text-xs text-gray-400">
                                Requested:{" "}
                                {request.createdAt &&
                                !isNaN(new Date(request.createdAt).getTime())
                                  ? new Date(request.createdAt).toLocaleString()
                                  : "Recently"}
                              </div>
                            </div>
                            {order && (
                              <div className="ml-4 text-right">
                                <div className="text-green-400 font-bold text-lg mb-2">
                                  £{order.total.toLocaleString()}
                                </div>
                                {request.status === "pending" && (
                                  <div className="flex flex-col space-y-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        // Here you would call an approve refund function
                                        alert(
                                          "Refund approved! (Function to be implemented)"
                                        );
                                      }}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                      onClick={() => {
                                        // Here you would call a reject refund function
                                        alert(
                                          "Refund rejected! (Function to be implemented)"
                                        );
                                      }}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Inventory Management
                  </h3>
                  <p className="text-gray-400 mt-1">
                    {inventory.length} total components across{" "}
                    {getCategories().length} categories
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="all">All Categories</SelectItem>
                      {getCategories().map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleInventoryInfo}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    title="How to manage inventory"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      const contentfulSpaceId = import.meta.env
                        .VITE_CONTENTFUL_SPACE_ID;
                      if (contentfulSpaceId) {
                        window.open(
                          `https://app.contentful.com/spaces/${contentfulSpaceId}/entries`,
                          "_blank"
                        );
                      } else {
                        alert("Contentful is not configured.");
                      }
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add in Contentful
                  </Button>
                </div>
              </div>

              {inventoryLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading inventory...</p>
                </div>
              ) : getFilteredInventory().length === 0 ? (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-12">
                  <div className="text-center">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      No Inventory Items
                    </h3>
                    <p className="text-gray-400 mb-6">
                      {selectedCategory === "all"
                        ? "Connect Contentful CMS to populate inventory"
                        : `No items in ${selectedCategory} category`}
                    </p>
                    {selectedCategory !== "all" && (
                      <Button
                        onClick={() => setSelectedCategory("all")}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        View All Categories
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-white">Product</TableHead>
                        <TableHead className="text-white">Category</TableHead>
                        <TableHead className="text-white">Brand</TableHead>
                        <TableHead className="text-white">Price</TableHead>
                        <TableHead className="text-white">Stock Qty</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredInventory().map((product) => {
                        const status = getInventoryStatus(product);
                        const stockQty = product.stockLevel ?? "N/A";
                        return (
                          <TableRow
                            key={product.id}
                            className="border-white/10"
                          >
                            <TableCell className="text-white font-medium">
                              <div className="flex items-center space-x-3">
                                {product.images && product.images[0] && (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <span>{product.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-white">
                              <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-400">
                                {product.category.charAt(0).toUpperCase() +
                                  product.category.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {product.brand || "N/A"}
                            </TableCell>
                            <TableCell className="text-green-400 font-bold">
                              £{product.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-white font-semibold">
                              {typeof stockQty === "number" ? (
                                <span
                                  className={
                                    stockQty === 0
                                      ? "text-red-400"
                                      : stockQty <= 5
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                  }
                                >
                                  {stockQty}
                                </span>
                              ) : (
                                <span className="text-gray-500">
                                  {stockQty}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${getStatusColor(status)} border`}
                              >
                                {status.replace("-", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleEditInContentful(product)
                                  }
                                  className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                                  title="Edit in Contentful CMS"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleInventoryInfo}
                                  className="border-white/20 text-white hover:bg-white/10"
                                  title="Learn about inventory management"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Customer Management
                  </h3>
                  <p className="text-gray-400 mt-1">
                    <span className="text-sky-400 font-semibold">
                      {customers.length}
                    </span>{" "}
                    total registered members
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Input
                    placeholder="Search customers..."
                    className="bg-white/5 border-white/10 text-white w-64"
                  />
                  {isAdmin && (
                    <Button
                      onClick={async () => {
                        try {
                          const users = await getAllUsers();
                          let updated = 0;
                          for (const u of users) {
                            if (
                              u.role &&
                              u.role !== String(u.role).toLowerCase()
                            ) {
                              await updateUserProfile(u.id, {
                                role: String(u.role).toLowerCase(),
                              });
                              updated++;
                            }
                          }
                          alert(
                            `Normalized ${updated} role value(s) to lowercase`
                          );
                          // Trigger a refresh to reflect role changes
                          const orders = await getAllOrders(100);
                          const refreshed = users.map((user) => {
                            const userOrders = orders.filter(
                              (order) => order.userId === user.id
                            );
                            const totalSpent = userOrders.reduce(
                              (sum, order) => sum + order.total,
                              0
                            );
                            return {
                              id: user.id,
                              name:
                                user.displayName ||
                                user.email?.split("@")[0] ||
                                "Unknown",
                              email: user.email,
                              orders: userOrders.length,
                              spent: totalSpent,
                              joined: user.createdAt || null,
                              role: user.role
                                ? String(user.role).toLowerCase()
                                : "user",
                            };
                          });
                          setCustomers(refreshed);
                        } catch (e) {
                          console.error("Role normalization failed", e);
                          alert(
                            "Role normalization failed. Check console for details."
                          );
                        }
                      }}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      title="Normalize roles to lowercase"
                    >
                      Normalize Roles
                    </Button>
                  )}
                  <Button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        console.log("🔄 Refreshing customers...");
                        const orders = await getAllOrders(100);
                        console.log("📦 Orders fetched:", orders.length);

                        const users = await getAllUsers();
                        console.log("👥 Users fetched:", users.length, users);

                        type RawUser = {
                          id: string;
                          email?: string;
                          displayName?: string;
                          createdAt?: Date | string | number | null;
                          role?: unknown;
                        };
                        const customersWithStats: CustomerRow[] = users.map(
                          (user: RawUser) => {
                            const userOrders = orders.filter(
                              (order) => order.userId === user.id
                            );
                            const totalSpent = userOrders.reduce(
                              (sum, order) => sum + order.total,
                              0
                            );

                            console.log(`📊 User ${user.email}:`, {
                              id: user.id,
                              orders: userOrders.length,
                              spent: totalSpent,
                              createdAt: user.createdAt,
                            });

                            return {
                              id: user.id,
                              name:
                                user.displayName ||
                                user.email?.split("@")[0] ||
                                "Unknown",
                              email: user.email || "",
                              orders: userOrders.length,
                              spent: totalSpent,
                              joined: (user.createdAt as Date) || null,
                              role: (user?.role
                                ? String(user.role)
                                : "user"
                              ).toLowerCase(),
                            };
                          }
                        );

                        setCustomers(customersWithStats);
                        console.log(
                          "✅ Customers refreshed:",
                          customersWithStats.length,
                          customersWithStats
                        );
                      } catch (error) {
                        console.error("❌ Error refreshing customers:", error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    title={
                      isAdmin
                        ? "Refresh customer list"
                        : "Admin access required"
                    }
                    disabled={!isAdmin}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading customers...</p>
                </div>
              ) : customers.length === 0 ? (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-12">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      No Registered Customers Yet
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Customer accounts will appear here once users register on
                      the site.
                    </p>
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-300 mb-4">
                        <strong>Troubleshooting:</strong> Check the browser
                        console for Firebase logs. Users must register through
                        the site to appear here.
                      </p>
                      <Button
                        onClick={async () => {
                          console.log(
                            "🔍 DEBUG: Testing Firebase connection..."
                          );
                          const users = await getAllUsers();
                          console.log(
                            "🔍 DEBUG: getAllUsers() returned:",
                            users
                          );
                          console.log(
                            "🔍 DEBUG: Number of users:",
                            users.length
                          );
                          if (users.length > 0) {
                            console.log("🔍 DEBUG: First user:", users[0]);
                            alert(
                              `Found ${users.length} user(s) in Firebase! Check console for details. Click the refresh button above to load them.`
                            );
                          } else {
                            alert(
                              "No users found in Firebase. Check console logs."
                            );
                          }
                        }}
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Test Firebase Connection
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-white">Customer</TableHead>
                        <TableHead className="text-white">Email</TableHead>
                        <TableHead className="text-white">Orders</TableHead>
                        <TableHead className="text-white">
                          Total Spent
                        </TableHead>
                        <TableHead className="text-white">Joined</TableHead>
                        <TableHead className="text-white">Role</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id} className="border-white/10">
                          <TableCell className="text-white font-medium">
                            {customer.name}
                          </TableCell>
                          <TableCell className="text-white">
                            {customer.email}
                          </TableCell>
                          <TableCell className="text-white">
                            {customer.orders}
                          </TableCell>
                          <TableCell className="text-green-400 font-bold">
                            £{customer.spent.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-white">
                            {customer.joined &&
                            !isNaN(new Date(customer.joined).getTime())
                              ? new Date(customer.joined).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                customer.role === "admin"
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30 border"
                                  : "bg-sky-500/20 text-sky-300 border-sky-500/30 border"
                              }
                            >
                              {customer.role || "user"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {isAdmin && customer.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                  onClick={async () => {
                                    try {
                                      let idToken: string | null = null;
                                      try {
                                        const { auth } = await import(
                                          "../config/firebase"
                                        );
                                        if (auth?.currentUser) {
                                          const { getIdToken } = await import(
                                            "firebase/auth"
                                          );
                                          idToken = await getIdToken(
                                            auth.currentUser,
                                            true
                                          );
                                        }
                                      } catch {
                                        /* token retrieval failed; proceed without */
                                      }

                                      const res = await fetch(
                                        "/api/admin/users/update-role",
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            ...(idToken
                                              ? {
                                                  Authorization: `Bearer ${idToken}`,
                                                }
                                              : {}),
                                          },
                                          body: JSON.stringify({
                                            userId: customer.id,
                                            role: "admin",
                                          }),
                                        }
                                      );

                                      if (!res.ok) {
                                        // Fallback to client-side (rules still protect this)
                                        await updateUserProfile(customer.id, {
                                          role: "admin",
                                        });
                                      }

                                      setCustomers((prev) =>
                                        prev.map((c) =>
                                          c.id === customer.id
                                            ? { ...c, role: "admin" }
                                            : c
                                        )
                                      );
                                      alert(
                                        `${customer.email} promoted to admin`
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Failed to promote user",
                                        e
                                      );
                                      alert("Failed to promote user");
                                    }
                                  }}
                                >
                                  Make Admin
                                </Button>
                              )}
                              {isAdmin && customer.role === "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10"
                                  disabled={user?.uid === customer.id}
                                  title={
                                    user?.uid === customer.id
                                      ? "You cannot change your own role here"
                                      : "Demote to user"
                                  }
                                  onClick={async () => {
                                    try {
                                      let idToken: string | null = null;
                                      try {
                                        const { auth } = await import(
                                          "../config/firebase"
                                        );
                                        if (auth?.currentUser) {
                                          const { getIdToken } = await import(
                                            "firebase/auth"
                                          );
                                          idToken = await getIdToken(
                                            auth.currentUser,
                                            true
                                          );
                                        }
                                      } catch {
                                        /* token retrieval failed; proceed without */
                                      }

                                      const res = await fetch(
                                        "/api/admin/users/update-role",
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            ...(idToken
                                              ? {
                                                  Authorization: `Bearer ${idToken}`,
                                                }
                                              : {}),
                                          },
                                          body: JSON.stringify({
                                            userId: customer.id,
                                            role: "user",
                                          }),
                                        }
                                      );

                                      if (!res.ok) {
                                        // Fallback to client-side (rules still protect this)
                                        await updateUserProfile(customer.id, {
                                          role: "user",
                                        });
                                      }

                                      setCustomers((prev) =>
                                        prev.map((c) =>
                                          c.id === customer.id
                                            ? { ...c, role: "user" }
                                            : c
                                        )
                                      );
                                      alert(
                                        `${customer.email} demoted to user`
                                      );
                                    } catch (e) {
                                      console.error("Failed to demote user", e);
                                      alert("Failed to demote user");
                                    }
                                  }}
                                >
                                  Make User
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  disabled={user?.uid === customer.id}
                                  title={
                                    user?.uid === customer.id
                                      ? "You cannot delete your own account"
                                      : "Delete customer account"
                                  }
                                  onClick={async () => {
                                    if (
                                      !confirm(
                                        `Are you sure you want to delete ${customer.email}?\n\nThis will permanently delete:\n- User account\n- All orders\n- All support tickets\n- All saved configurations\n\nThis action CANNOT be undone!`
                                      )
                                    ) {
                                      return;
                                    }

                                    try {
                                      let idToken: string | null = null;
                                      try {
                                        const { auth } = await import(
                                          "../config/firebase"
                                        );
                                        if (auth?.currentUser) {
                                          const { getIdToken } = await import(
                                            "firebase/auth"
                                          );
                                          idToken = await getIdToken(
                                            auth.currentUser,
                                            true
                                          );
                                        }
                                      } catch {
                                        /* token retrieval failed; proceed without */
                                      }

                                      const res = await fetch(
                                        "/api/admin/users/delete",
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            ...(idToken
                                              ? {
                                                  Authorization: `Bearer ${idToken}`,
                                                }
                                              : {}),
                                          },
                                          body: JSON.stringify({
                                            userId: customer.id,
                                          }),
                                        }
                                      );

                                      if (!res.ok) {
                                        const error = await res.json();
                                        throw new Error(
                                          error.message ||
                                            "Failed to delete user"
                                        );
                                      }

                                      const result = await res.json();

                                      // Remove from UI
                                      setCustomers((prev) =>
                                        prev.filter((c) => c.id !== customer.id)
                                      );

                                      alert(
                                        `Successfully deleted ${
                                          customer.email
                                        }\n\nDeleted:\n- User account\n- ${
                                          result.deleted?.orders || 0
                                        } orders\n- ${
                                          result.deleted?.supportTickets || 0
                                        } support tickets\n- ${
                                          result.deleted?.configurations || 0
                                        } configurations`
                                      );
                                    } catch (e) {
                                      console.error("Failed to delete user", e);
                                      alert(
                                        `Failed to delete user: ${
                                          e instanceof Error
                                            ? e.message
                                            : "Unknown error"
                                        }`
                                      );
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {/* Support Tickets Section */}
              {supportTickets.length > 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">
                        Support Tickets
                      </h3>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 border">
                        {
                          supportTickets.filter((t) => t.status === "open")
                            .length
                        }{" "}
                        Open
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {supportTickets.slice(0, 10).map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="bg-white/5 border-white/10 backdrop-blur-xl p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-white">
                                {ticket.subject}
                              </h4>
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
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 border">
                                {ticket.type}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-400 mb-2">
                              From: {ticket.name} ({ticket.email})
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded p-3 mb-2">
                              <p className="text-gray-300 text-sm">
                                {ticket.message}
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">
                              Submitted:{" "}
                              {ticket.createdAt &&
                              !isNaN(new Date(ticket.createdAt).getTime())
                                ? new Date(ticket.createdAt).toLocaleString()
                                : "Recently"}
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col space-y-2">
                            {ticket.status === "open" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                  onClick={async () => {
                                    try {
                                      await updateSupportTicket(ticket.id, {
                                        status: "in-progress",
                                      });
                                      const tickets =
                                        await getAllSupportTickets();
                                      setSupportTickets(tickets);
                                      alert("Ticket marked as in-progress");
                                    } catch {
                                      alert("Failed to update ticket");
                                    }
                                  }}
                                >
                                  Start Work
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    try {
                                      await updateSupportTicket(ticket.id, {
                                        status: "closed",
                                      });
                                      const tickets =
                                        await getAllSupportTickets();
                                      setSupportTickets(tickets);
                                      alert("Ticket closed");
                                    } catch {
                                      alert("Failed to update ticket");
                                    }
                                  }}
                                >
                                  Close
                                </Button>
                              </>
                            )}
                            {ticket.status === "in-progress" && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={async () => {
                                  try {
                                    await updateSupportTicket(ticket.id, {
                                      status: "closed",
                                    });
                                    const tickets =
                                      await getAllSupportTickets();
                                    setSupportTickets(tickets);
                                    alert("Ticket closed");
                                  } catch {
                                    alert("Failed to update ticket");
                                  }
                                }}
                              >
                                Close Ticket
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => {
                                window.location.href = `mailto:${ticket.email}?subject=Re: ${ticket.subject}`;
                              }}
                            >
                              Email Reply
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Content Management System
                  </h3>
                  <p className="text-gray-400 mt-1">
                    Manage your website content through Contentful CMS
                  </p>
                </div>
                <Button
                  onClick={() =>
                    window.open(
                      "https://app.contentful.com/spaces/" +
                        import.meta.env.VITE_CONTENTFUL_SPACE_ID,
                      "_blank"
                    )
                  }
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Contentful
                </Button>
              </div>

              {/* CMS Quick Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Products</p>
                      <p className="text-2xl font-bold text-white">
                        {inventory.length}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-sky-400" />
                  </div>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Categories</p>
                      <p className="text-2xl font-bold text-white">
                        {getCategories().length}
                      </p>
                    </div>
                    <Filter className="w-8 h-8 text-green-400" />
                  </div>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Pages</p>
                      <p className="text-2xl font-bold text-white">8</p>
                    </div>
                    <FileText className="w-8 h-8 text-purple-400" />
                  </div>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Media</p>
                      <p className="text-2xl font-bold text-white">
                        {
                          inventory.filter(
                            (i) => i.images && i.images.length > 0
                          ).length
                        }
                      </p>
                    </div>
                    <Image className="w-8 h-8 text-orange-400" />
                  </div>
                </Card>
              </div>

              {/* Content Management Sections */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* PC Components */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-sky-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    PC Components
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Manage CPUs, GPUs, RAM, storage, and all PC building
                    components
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setActiveTab("inventory")}
                      size="sm"
                      className="flex-1 bg-sky-600 hover:bg-sky-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://app.contentful.com/spaces/" +
                            import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                            "/entries",
                          "_blank"
                        )
                      }
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* Page Content */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-purple-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    Page Content
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Edit homepage, about page, and other website content
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => window.open("/", "_blank")}
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://app.contentful.com/spaces/" +
                            import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                            "/entries?content_type=pageContent",
                          "_blank"
                        )
                      }
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* FAQs */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-green-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    FAQs & Support
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Manage frequently asked questions and support content
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        window.open(
                          "https://app.contentful.com/spaces/" +
                            import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                            "/entries?content_type=faqItem",
                          "_blank"
                        )
                      }
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://app.contentful.com/spaces/" +
                            import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                            "/entries?content_type=faqItem",
                          "_blank"
                        )
                      }
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* Media Library */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-orange-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    Media Library
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Upload and manage product images and media assets
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        window.open(
                          "https://app.contentful.com/spaces/" +
                            import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                            "/assets",
                          "_blank"
                        )
                      }
                      size="sm"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://app.contentful.com/spaces/" +
                            import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                            "/assets",
                          "_blank"
                        )
                      }
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* Site Settings */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-yellow-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    Site Settings
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Configure site name, contact info, and global settings
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowSettingsModal(true)}
                      size="sm"
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://app.contentful.com/spaces/" +
                            import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                            "/entries?content_type=siteSettings",
                          "_blank"
                        )
                      }
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* Analytics */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    Analytics Dashboard
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">
                    {analyticsData.totalPageViews > 0
                      ? `${analyticsData.totalPageViews} page views from ${analyticsData.totalVisitors} visitors`
                      : "View visitor stats and site analytics"}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowAnalyticsModal(true)}
                      size="sm"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Stats
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://console.firebase.google.com/project/" +
                            import.meta.env.VITE_FIREBASE_PROJECT_ID +
                            "/analytics",
                          "_blank"
                        )
                      }
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4">
                  Quick Actions
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button
                    onClick={() =>
                      window.open(
                        "https://app.contentful.com/spaces/" +
                          import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                          "/content_types",
                        "_blank"
                      )
                    }
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 justify-start"
                  >
                    <Code className="w-4 h-4 mr-3" />
                    Content Models
                  </Button>
                  <Button
                    onClick={() =>
                      window.open(
                        "https://app.contentful.com/spaces/" +
                          import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                          "/settings",
                        "_blank"
                      )
                    }
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 justify-start"
                  >
                    <Shield className="w-4 h-4 mr-3" />
                    API Keys & Security
                  </Button>
                  <Button
                    onClick={() =>
                      window.open("https://www.contentful.com/help/", "_blank")
                    }
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 justify-start"
                  >
                    <MessageSquare className="w-4 h-4 mr-3" />
                    Help & Documentation
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add Product Dialog */}
          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName" className="text-white">
                      Product Name
                    </Label>
                    <Input
                      id="productName"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-white">
                      Category
                    </Label>
                    <Select>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10">
                        <SelectItem value="cpu">CPU</SelectItem>
                        <SelectItem value="gpu">GPU</SelectItem>
                        <SelectItem value="ram">RAM</SelectItem>
                        <SelectItem value="motherboard">Motherboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-white">
                      Price (£)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock" className="text-white">
                      Stock Quantity
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    className="bg-white/5 border-white/10 text-white"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddProduct(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    Add Product
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Analytics Modal */}
          <Dialog
            open={showAnalyticsModal}
            onOpenChange={setShowAnalyticsModal}
          >
            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-6xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <span>Analytics Dashboard</span>
                </DialogTitle>
                <p className="text-gray-400 mt-2">
                  Last 30 days of website activity
                </p>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Key Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-gray-400 text-sm">Total Views</p>
                      <Eye className="w-5 h-5 text-sky-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {analyticsData.totalPageViews.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Page views</p>
                  </Card>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-gray-400 text-sm">Unique Visitors</p>
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {analyticsData.totalVisitors.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Visitors</p>
                  </Card>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-gray-400 text-sm">Avg. Daily Views</p>
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {analyticsData.averagePageViewsPerDay.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Views per day</p>
                  </Card>
                </div>

                {/* Top Pages */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-sky-400" />
                    Top Pages
                  </h3>
                  {analyticsData.topPages.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.topPages.map((page, index) => (
                        <div
                          key={page.page}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {page.page === "/" ? "Homepage" : page.page}
                              </p>
                              <p className="text-xs text-gray-400">
                                {page.page}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">
                              {page.views.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">views</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No page view data yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Data will appear as users visit your site
                      </p>
                    </div>
                  )}
                </Card>

                {/* Daily Activity */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                    Daily Activity
                  </h3>
                  {Object.keys(analyticsData.viewsByDay).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(analyticsData.viewsByDay)
                        .sort(
                          ([dateA], [dateB]) =>
                            new Date(dateB).getTime() -
                            new Date(dateA).getTime()
                        )
                        .slice(0, 10)
                        .map(([date, views]) => (
                          <div
                            key={date}
                            className="flex items-center justify-between p-2 bg-white/5 rounded"
                          >
                            <span className="text-gray-300 text-sm">
                              {date}
                            </span>
                            <div className="flex items-center space-x-3">
                              <div className="w-32 bg-white/10 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-sky-500 to-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      (views /
                                        Math.max(
                                          ...Object.values(
                                            analyticsData.viewsByDay
                                          )
                                        )) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="text-white font-semibold text-sm w-12 text-right">
                                {views}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">
                        No daily activity data yet
                      </p>
                    </div>
                  )}
                </Card>

                {/* Info Banner */}
                <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30 p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">
                        Real-time Analytics
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Analytics data is automatically tracked when users visit
                        your site. The data updates in real-time from Firebase
                        Firestore. For more advanced analytics, click the
                        external link to open Firebase Analytics console.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => setShowAnalyticsModal(false)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() =>
                      window.open(
                        "https://console.firebase.google.com/project/" +
                          import.meta.env.VITE_FIREBASE_PROJECT_ID +
                          "/analytics",
                        "_blank"
                      )
                    }
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Firebase Console
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Site Settings Modal */}
          <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <span>Site Settings & META Tags</span>
                </DialogTitle>
                <p className="text-gray-400 mt-2">
                  Configure global site settings and SEO metadata
                </p>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* General Settings */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-yellow-400" />
                    General Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">Site Name</Label>
                      <Input
                        value={metaTags.siteName}
                        onChange={(e) =>
                          setMetaTags({ ...metaTags, siteName: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Vortex PCs"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Used in page titles and throughout the site
                      </p>
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">
                        Site Description
                      </Label>
                      <Textarea
                        value={metaTags.siteDescription}
                        onChange={(e) =>
                          setMetaTags({
                            ...metaTags,
                            siteDescription: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Custom PC Building & Gaming Systems"
                        rows={3}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Used in meta description tags for SEO
                      </p>
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">
                        SEO Keywords
                      </Label>
                      <Input
                        value={metaTags.siteKeywords}
                        onChange={(e) =>
                          setMetaTags({
                            ...metaTags,
                            siteKeywords: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="custom pc, gaming pc, pc builder"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Comma-separated keywords for search engines
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Social Media META Tags */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                    Social Media META Tags
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">
                        Open Graph Image URL
                      </Label>
                      <Input
                        value={metaTags.ogImage}
                        onChange={(e) =>
                          setMetaTags({ ...metaTags, ogImage: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="https://vortexpcs.com/og-image.jpg"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Image displayed when sharing on Facebook, LinkedIn, etc.
                        (1200x630px recommended)
                      </p>
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">
                        Twitter Handle
                      </Label>
                      <Input
                        value={metaTags.twitterHandle}
                        onChange={(e) =>
                          setMetaTags({
                            ...metaTags,
                            twitterHandle: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="@VortexPCs"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Your Twitter/X account handle for attribution
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Current META Tags Preview */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Code className="w-5 h-5 mr-2 text-green-400" />
                    Generated META Tags Preview
                  </h3>
                  <div className="bg-slate-950 p-4 rounded-lg border border-white/10 overflow-x-auto">
                    <pre className="text-xs text-green-300 font-mono">
                      {`<!-- Primary META Tags -->
<title>${metaTags.siteName}</title>
<meta name="title" content="${metaTags.siteName}" />
<meta name="description" content="${metaTags.siteDescription}" />
<meta name="keywords" content="${metaTags.siteKeywords}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://vortexpcs.com/" />
<meta property="og:title" content="${metaTags.siteName}" />
<meta property="og:description" content="${metaTags.siteDescription}" />
<meta property="og:image" content="${metaTags.ogImage}" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://vortexpcs.com/" />
<meta property="twitter:title" content="${metaTags.siteName}" />
<meta property="twitter:description" content="${metaTags.siteDescription}" />
<meta property="twitter:image" content="${metaTags.ogImage}" />
<meta name="twitter:site" content="${metaTags.twitterHandle}" />
<meta name="twitter:creator" content="${metaTags.twitterHandle}" />`}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    These META tags will be applied to your site. Copy this code
                    to your index.html file or use a META tag manager.
                  </p>
                </Card>

                {/* Info Banner */}
                <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">
                        How to Apply META Tags
                      </h4>
                      <p className="text-gray-300 text-sm mb-2">
                        To apply these META tags to your site:
                      </p>
                      <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                        <li>Copy the generated META tags above</li>
                        <li>
                          Open your{" "}
                          <code className="bg-white/10 px-1 rounded">
                            index.html
                          </code>{" "}
                          file
                        </li>
                        <li>
                          Paste the tags inside the{" "}
                          <code className="bg-white/10 px-1 rounded">
                            &lt;head&gt;
                          </code>{" "}
                          section
                        </li>
                        <li>Save and redeploy your site</li>
                      </ol>
                      <p className="text-gray-300 text-sm mt-2">
                        Alternatively, use the Contentful CMS link to manage
                        settings centrally.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => setShowSettingsModal(false)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `<!-- Primary META Tags -->
<title>${metaTags.siteName}</title>
<meta name="title" content="${metaTags.siteName}" />
<meta name="description" content="${metaTags.siteDescription}" />
<meta name="keywords" content="${metaTags.siteKeywords}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://vortexpcs.com/" />
<meta property="og:title" content="${metaTags.siteName}" />
<meta property="og:description" content="${metaTags.siteDescription}" />
<meta property="og:image" content="${metaTags.ogImage}" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://vortexpcs.com/" />
<meta property="twitter:title" content="${metaTags.siteName}" />
<meta property="twitter:description" content="${metaTags.siteDescription}" />
<meta property="twitter:image" content="${metaTags.ogImage}" />
<meta name="twitter:site" content="${metaTags.twitterHandle}" />
<meta name="twitter:creator" content="${metaTags.twitterHandle}" />`
                      );
                      alert("META tags copied to clipboard!");
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copy META Tags
                  </Button>
                  <Button
                    onClick={() =>
                      window.open(
                        "https://app.contentful.com/spaces/" +
                          import.meta.env.VITE_CONTENTFUL_SPACE_ID +
                          "/entries?content_type=siteSettings",
                        "_blank"
                      )
                    }
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Contentful
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Build Progress Update Modal */}
          <Dialog
            open={showBuildProgressModal}
            onOpenChange={setShowBuildProgressModal}
          >
            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <span>Update Build Progress</span>
                </DialogTitle>
                {selectedOrder && (
                  <p className="text-gray-400 mt-2">
                    Order #{selectedOrder.orderId} -{" "}
                    {selectedOrder.customerName}
                  </p>
                )}
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Progress Slider */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-white font-semibold">
                      Build Progress
                    </Label>
                    <span className="text-sky-400 font-bold text-2xl">
                      {buildProgress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={buildProgress}
                    onChange={(e) => setBuildProgress(Number(e.target.value))}
                    className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <Label className="text-white font-semibold mb-2 block">
                    Order Status
                  </Label>
                  <select
                    value={buildStatus}
                    onChange={(e) =>
                      setBuildStatus(e.target.value as Order["status"])
                    }
                    className="w-full h-12 bg-white/5 border border-white/10 text-white rounded-md px-4 focus:border-sky-500/50 focus:ring-sky-500/20 focus:outline-none"
                  >
                    <option value="pending" className="bg-slate-900">
                      Pending
                    </option>
                    <option value="building" className="bg-slate-900">
                      Building
                    </option>
                    <option value="testing" className="bg-slate-900">
                      Testing
                    </option>
                    <option value="shipped" className="bg-slate-900">
                      Shipped
                    </option>
                    <option value="delivered" className="bg-slate-900">
                      Delivered
                    </option>
                    <option value="completed" className="bg-slate-900">
                      Completed
                    </option>
                  </select>
                </div>

                {/* Status Note */}
                <div>
                  <Label className="text-white font-semibold mb-2 block">
                    Status Update Note (Optional)
                  </Label>
                  <Textarea
                    value={buildNote}
                    onChange={(e) => setBuildNote(e.target.value)}
                    placeholder="E.g., 'Completed motherboard installation', 'Running stress tests', etc."
                    className="bg-white/5 border-white/10 text-white min-h-[100px] focus:border-sky-500/50 focus:ring-sky-500/20"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This note will be visible to the customer in their Member
                    Area
                  </p>
                </div>

                {/* Order Details */}
                {selectedOrder && (
                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="text-white font-semibold mb-3">
                      Order Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Customer:</span>
                        <span className="text-white">
                          {selectedOrder.customerName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">
                          {selectedOrder.customerEmail}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Order Date:</span>
                        <span className="text-white">
                          {selectedOrder.orderDate &&
                          !isNaN(new Date(selectedOrder.orderDate).getTime())
                            ? new Date(
                                selectedOrder.orderDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-green-400 font-bold">
                          £{selectedOrder.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Info Banner */}
                <Card className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/30 p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-sky-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">
                        Real-Time Customer Updates
                      </h4>
                      <p className="text-gray-300 text-sm">
                        When you update the build progress, the customer will
                        see the changes immediately in their Member Area under
                        the "Build Progress" tab. They'll receive real-time
                        updates on their build status.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => setShowBuildProgressModal(false)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateBuildProgress}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Progress
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
