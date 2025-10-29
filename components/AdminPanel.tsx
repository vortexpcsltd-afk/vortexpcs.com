import { useState, useEffect } from "react";
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
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  BarChart3,
  Settings,
  Shield,
  Loader2,
} from "lucide-react";
import {
  getAllOrders,
  getAllUsers,
  getDashboardStats,
} from "../services/database";
import type { Order } from "../services/database";

export function AdminPanel() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real data states
  const [dashboardStats, setDashboardStats] = useState({
    orders: { total: 0, change: "+0%", trend: "up" as const },
    revenue: { total: 0, change: "+0%", trend: "up" as const },
    customers: { total: 0, change: "+0%", trend: "up" as const },
    builds: { total: 0, change: "+0%", trend: "up" as const },
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

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

        // Calculate customer stats from users and orders
        const customersWithStats = users.map((user) => {
          const userOrders = orders.filter((order) => order.userId === user.id);
          const totalSpent = userOrders.reduce(
            (sum, order) => sum + order.total,
            0
          );

          return {
            id: user.id,
            name: user.displayName || "Unknown",
            email: user.email,
            orders: userOrders.length,
            spent: totalSpent,
            joined: user.createdAt?.toLocaleDateString() || "N/A",
          };
        });

        setCustomers(customersWithStats);
        console.log(
          "👥 Admin Panel - Customers loaded:",
          customersWithStats.length
        );
      } catch (error: any) {
        console.error("❌ Admin Panel - Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const productInventory = [
    {
      id: "cpu-1",
      name: "AMD Ryzen 9 5950X",
      category: "CPU",
      stock: 15,
      price: 549,
      status: "in-stock",
    },
    {
      id: "gpu-1",
      name: "NVIDIA RTX 4090",
      category: "GPU",
      stock: 3,
      price: 1599,
      status: "low-stock",
    },
    {
      id: "ram-1",
      name: "G.Skill Trident Z RGB 32GB",
      category: "RAM",
      stock: 0,
      price: 159,
      status: "out-of-stock",
    },
    {
      id: "mb-1",
      name: "ASUS ROG Strix X570-E",
      category: "Motherboard",
      stock: 8,
      price: 329,
      status: "in-stock",
    },
  ];

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
    icon: any;
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

          <Tabs defaultValue="dashboard" className="space-y-6">
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
                              {order.orderDate?.toLocaleDateString() || "N/A"}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">
                  Inventory Management
                </h3>
                <Button
                  onClick={() => setShowAddProduct(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white">Product</TableHead>
                      <TableHead className="text-white">Category</TableHead>
                      <TableHead className="text-white">Stock</TableHead>
                      <TableHead className="text-white">Price</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productInventory.map((product) => (
                      <TableRow key={product.id} className="border-white/10">
                        <TableCell className="text-white font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-white">
                          {product.category}
                        </TableCell>
                        <TableCell className="text-white">
                          {product.stock}
                        </TableCell>
                        <TableCell className="text-green-400 font-bold">
                          £{product.price}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(
                              product.status
                            )} border`}
                          >
                            {product.status.replace("-", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">
                  Customer Management
                </h3>
                <div className="flex space-x-3">
                  <Input
                    placeholder="Search customers..."
                    className="bg-white/5 border-white/10 text-white w-64"
                  />
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white">Customer</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Orders</TableHead>
                      <TableHead className="text-white">Total Spent</TableHead>
                      <TableHead className="text-white">Joined</TableHead>
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
                          {new Date(customer.joined).toLocaleDateString()}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content" className="space-y-6">
              <h3 className="text-2xl font-bold text-white">
                Content Management System
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h4 className="text-xl font-bold text-white mb-4">
                    Website Content
                  </h4>
                  <div className="space-y-3">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                      <Edit className="w-4 h-4 mr-3" />
                      Edit Homepage
                    </Button>
                    <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-3" />
                      Add Blog Post
                    </Button>
                    <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                      <Settings className="w-4 h-4 mr-3" />
                      Manage Products
                    </Button>
                  </div>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <h4 className="text-xl font-bold text-white mb-4">
                    System Settings
                  </h4>
                  <div className="space-y-3">
                    <Button className="w-full justify-start bg-yellow-600 hover:bg-yellow-700">
                      <AlertTriangle className="w-4 h-4 mr-3" />
                      Site Maintenance
                    </Button>
                    <Button className="w-full justify-start bg-red-600 hover:bg-red-700">
                      <Shield className="w-4 h-4 mr-3" />
                      Security Settings
                    </Button>
                    <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700">
                      <BarChart3 className="w-4 h-4 mr-3" />
                      Analytics
                    </Button>
                  </div>
                </Card>
              </div>
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
        </div>
      </div>
    </div>
  );
}
