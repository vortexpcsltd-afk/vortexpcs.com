import React, { useState, useEffect } from "react";
import {
  subscribeCompetitors,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor,
  addCompetitorProduct,
  updateCompetitorProduct,
  deleteCompetitorProduct,
  subscribeCompetitorProducts,
  type Competitor,
  type CompetitorProduct,
} from "../services/competitors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit,
  Trash2,
  ExternalLink,
  AlertTriangle,
  LineChart,
  Target,
  Award,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateUK } from "../utils/dateFormat";

// Firestore-backed types imported from services

interface MarketTrend {
  component: string;
  trend: "up" | "down" | "stable";
  averagePrice: number;
  priceChange: number;
  popularity: number;
}

const CompetitorTracking: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [marketTrends] = useState<MarketTrend[]>([]); // trends placeholder; to be Firestore-backed later
  const [isAddCompetitorOpen, setIsAddCompetitorOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(
    null
  );
  const [editingProduct, setEditingProduct] =
    useState<CompetitorProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [competitorName, setCompetitorName] = useState("");
  const [competitorWebsite, setCompetitorWebsite] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [isSavingCompetitor, setIsSavingCompetitor] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Subscribe to Firestore competitors
  useEffect(() => {
    const unsub = subscribeCompetitors((list) => {
      setCompetitors(list);
    });
    return () => unsub();
  }, []);

  // Subscribe to products for selected competitor (if any)
  useEffect(() => {
    if (!selectedCompetitor) return;
    const unsub = subscribeCompetitorProducts(selectedCompetitor, (list) => {
      setProducts(list);
    });
    return () => unsub();
  }, [selectedCompetitor]);

  const handleAddCompetitor = async () => {
    if (isSavingCompetitor) return;
    if (!competitorName || !competitorWebsite) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSavingCompetitor(true);
    try {
      await createCompetitor({
        name: competitorName,
        website: competitorWebsite,
        status: "active",
      });
      toast.success(`Competitor "${competitorName}" added successfully`);
      resetCompetitorForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add competitor";
      toast.error(message);
    } finally {
      setIsSavingCompetitor(false);
    }
  };

  const handleUpdateCompetitor = async () => {
    if (isSavingCompetitor) return;
    if (!editingCompetitor || !competitorName || !competitorWebsite) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSavingCompetitor(true);
    try {
      await updateCompetitor(String(editingCompetitor.id), {
        name: competitorName,
        website: competitorWebsite,
      });
      toast.success("Competitor updated successfully");
      resetCompetitorForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update competitor";
      toast.error(message);
    } finally {
      setIsSavingCompetitor(false);
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    await deleteCompetitor(id);
    toast.success("Competitor deleted");
  };

  const handleAddProduct = async () => {
    if (isSavingProduct) return;
    if (
      !selectedCompetitor ||
      !productName ||
      !productCategory ||
      !productPrice ||
      !productUrl
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSavingProduct(true);
    try {
      await addCompetitorProduct({
        competitorId: selectedCompetitor,
        productName,
        category: productCategory,
        currentPrice: parseFloat(productPrice),
        url: productUrl,
      });
      toast.success(`Product "${productName}" added successfully`);
      resetProductForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add product";
      toast.error(message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (isSavingProduct) return;
    if (
      !editingProduct ||
      !productName ||
      !productCategory ||
      !productPrice ||
      !productUrl
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSavingProduct(true);
    try {
      await updateCompetitorProduct(String(editingProduct.id), {
        productName,
        category: productCategory,
        currentPrice: parseFloat(productPrice),
        url: productUrl,
      });
      toast.success("Product updated successfully");
      resetProductForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update product";
      toast.error(message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteCompetitorProduct(id);
    toast.success("Product deleted");
  };

  const resetCompetitorForm = () => {
    setCompetitorName("");
    setCompetitorWebsite("");
    setEditingCompetitor(null);
    setIsAddCompetitorOpen(false);
  };

  const resetProductForm = () => {
    setSelectedCompetitor("");
    setProductName("");
    setProductCategory("");
    setProductPrice("");
    setProductUrl("");
    setEditingProduct(null);
    setIsAddProductOpen(false);
  };

  const openEditCompetitor = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    setCompetitorName(competitor.name);
    setCompetitorWebsite(competitor.website);
    setIsAddCompetitorOpen(true);
  };

  const openEditProduct = (product: CompetitorProduct) => {
    setEditingProduct(product);
    setSelectedCompetitor(product.competitorId.toString());
    setProductName(product.productName);
    setProductCategory(product.category);
    setProductPrice(product.currentPrice.toString());
    setProductUrl(product.url);
    setIsAddProductOpen(true);
  };

  const getPriceChangeIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="h-4 w-4 text-gray-400" />;
    if (current < previous)
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (current > previous)
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCompetitorName = (id: string) => {
    const competitor = competitors.find((c) => String(c.id) === String(id));
    return competitor?.name || "Unknown";
  };

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCompetitorName(product.competitorId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const categories = [
    "Gaming PCs",
    "Workstations",
    "Budget PCs",
    "High-End PCs",
    "Components",
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 backdrop-blur-xl border-sky-500/20 hover:border-sky-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-sky-500/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 group-hover:text-sky-300 transition-colors">
              Total Competitors
            </CardTitle>
            <Target className="h-5 w-5 text-sky-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
              {competitors.length}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {competitors.filter((c) => c.status === "active").length} active,{" "}
              {competitors.filter((c) => c.status === "inactive").length}{" "}
              inactive
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 group-hover:text-purple-300 transition-colors">
              Tracked Products
            </CardTitle>
            <LineChart className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {products.length}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Across{" "}
              {
                categories.filter((cat) =>
                  products.some((p) => p.category === cat)
                ).length
              }{" "}
              categories
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 group-hover:text-yellow-300 transition-colors">
              Price Alerts
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-400 group-hover:scale-110 transition-transform animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {
                products.filter(
                  (p) => p.previousPrice && p.currentPrice < p.previousPrice
                ).length
              }
            </div>
            <p className="text-xs text-gray-400 mt-1">Competitor price drops</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 group-hover:text-green-300 transition-colors">
              Market Position
            </CardTitle>
            <Award className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Competitive
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Based on price analysis
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="competitors" className="space-y-4">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="products">Price Comparison</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
        </TabsList>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Competitor Management
              </h3>
              <p className="text-sm text-gray-400">
                Track and manage your competitors
              </p>
            </div>
            <Dialog
              open={isAddCompetitorOpen}
              onOpenChange={setIsAddCompetitorOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  onClick={() => {
                    setEditingCompetitor(null);
                    resetCompetitorForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competitor
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingCompetitor
                      ? "Edit Competitor"
                      : "Add New Competitor"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {editingCompetitor
                      ? "Update competitor information"
                      : "Add a new competitor to track"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="comp-name" className="text-gray-300">
                      Competitor Name *
                    </Label>
                    <Input
                      id="comp-name"
                      value={competitorName}
                      onChange={(e) => setCompetitorName(e.target.value)}
                      placeholder="e.g., PC Specialist"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="comp-website" className="text-gray-300">
                      Website URL *
                    </Label>
                    <Input
                      id="comp-website"
                      value={competitorWebsite}
                      onChange={(e) => setCompetitorWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetCompetitorForm}>
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      editingCompetitor
                        ? handleUpdateCompetitor
                        : handleAddCompetitor
                    }
                    className="bg-gradient-to-r from-sky-600 to-blue-600"
                  >
                    {editingCompetitor ? "Update" : "Add"} Competitor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {competitors.map((competitor) => (
              <Card
                key={competitor.id}
                className="bg-white/5 backdrop-blur-xl border-white/10"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white">
                          {competitor.name}
                        </CardTitle>
                        <Badge
                          className={
                            competitor.status === "active"
                              ? "bg-green-500/20 border-green-500/40 text-green-400"
                              : "bg-gray-500/20 border-gray-500/40 text-gray-400"
                          }
                        >
                          {competitor.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400 flex items-center gap-2 mt-1">
                        <a
                          href={competitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-sky-400 transition-colors flex items-center gap-1"
                        >
                          {competitor.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCompetitor(competitor)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit competitor</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteCompetitor(competitor.id)
                            }
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete competitor</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Added</p>
                      <p className="text-white font-medium">
                        {formatDateUK(competitor.addedDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last Checked</p>
                      <p className="text-white font-medium">
                        {competitor.lastChecked
                          ? formatDateUK(competitor.lastChecked)
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Tracked Products</p>
                      <p className="text-white font-medium">
                        {
                          products.filter(
                            (p) => p.competitorId === competitor.id
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {competitors.length === 0 && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-center">
                    No competitors added yet. Click "Add Competitor" to start
                    tracking.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Price Comparison Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Enhanced Search and Filter Bar */}
          <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50"
                  />
                </div>
              </div>

              {/* Filter by Category */}
              <Select
                value={productCategory || "all"}
                onValueChange={(val) =>
                  setProductCategory(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add Product Button */}
              <Dialog
                open={isAddProductOpen}
                onOpenChange={setIsAddProductOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all whitespace-nowrap"
                    onClick={() => {
                      setEditingProduct(null);
                      resetProductForm();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingProduct
                        ? "Update product information and price"
                        : "Track a competitor's product pricing"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="prod-competitor"
                        className="text-gray-300"
                      >
                        Competitor *
                      </Label>
                      <Select
                        value={selectedCompetitor}
                        onValueChange={setSelectedCompetitor}
                        disabled={!!editingProduct}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select competitor" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          {competitors.map((comp) => (
                            <SelectItem
                              key={comp.id}
                              value={comp.id.toString()}
                            >
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="prod-name" className="text-gray-300">
                        Product Name *
                      </Label>
                      <Input
                        id="prod-name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Gaming PC - RTX 4070"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prod-category" className="text-gray-300">
                        Category *
                      </Label>
                      <Select
                        value={productCategory}
                        onValueChange={setProductCategory}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="prod-price" className="text-gray-300">
                        Price (£) *
                      </Label>
                      <Input
                        id="prod-price"
                        type="number"
                        step="0.01"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        placeholder="999.99"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prod-url" className="text-gray-300">
                        Product URL *
                      </Label>
                      <Input
                        id="prod-url"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        placeholder="https://competitor.com/product"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetProductForm}>
                      Cancel
                    </Button>
                    <Button
                      onClick={
                        editingProduct ? handleUpdateProduct : handleAddProduct
                      }
                      className="bg-gradient-to-r from-sky-600 to-blue-600"
                    >
                      {editingProduct ? "Update" : "Add"} Product
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {filteredProducts.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Price Drops
                </p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {
                    filteredProducts.filter(
                      (p) => p.previousPrice && p.currentPrice < p.previousPrice
                    ).length
                  }
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg p-3 border border-red-500/20">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Price Increases
                </p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {
                    filteredProducts.filter(
                      (p) => p.previousPrice && p.currentPrice > p.previousPrice
                    ).length
                  }
                </p>
              </div>
              <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-lg p-3 border border-sky-500/20">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Avg Price
                </p>
                <p className="text-2xl font-bold text-sky-400 mt-1">
                  £
                  {filteredProducts.length > 0
                    ? (
                        filteredProducts.reduce(
                          (sum, p) => sum + p.currentPrice,
                          0
                        ) / filteredProducts.length
                      ).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredProducts.map((product) => {
              const priceChange = product.previousPrice
                ? ((product.currentPrice - product.previousPrice) /
                    product.previousPrice) *
                  100
                : 0;
              const isPriceDrop =
                product.previousPrice &&
                product.currentPrice < product.previousPrice;
              const isPriceIncrease =
                product.previousPrice &&
                product.currentPrice > product.previousPrice;

              return (
                <Card
                  key={product.id}
                  className={`group relative overflow-hidden bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 ${
                    isPriceDrop
                      ? "border-green-500/20"
                      : isPriceIncrease
                      ? "border-red-500/20"
                      : ""
                  }`}
                >
                  {/* Animated gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-sky-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500" />

                  {/* Price trend indicator stripe */}
                  {isPriceDrop && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse" />
                  )}
                  {isPriceIncrease && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse" />
                  )}

                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-white group-hover:text-sky-300 transition-colors">
                            {product.productName}
                          </CardTitle>
                          {isPriceDrop && (
                            <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-300 animate-pulse shadow-lg shadow-green-500/20">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Price Drop
                            </Badge>
                          )}
                          {isPriceIncrease && (
                            <Badge className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50 text-red-300 shadow-lg shadow-red-500/20">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Price Increase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <CardDescription className="text-gray-400 font-medium">
                            {getCompetitorName(product.competitorId)}
                          </CardDescription>
                          <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-300 shadow-sm">
                            {product.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(product.url, "_blank")}
                              className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/20 hover:scale-110 transition-all duration-200"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View product page</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditProduct(product)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 hover:scale-110 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit product</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:scale-110 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete product</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Current Price - Featured */}
                      <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                          Current Price
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-2xl bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                            £{product.currentPrice.toFixed(2)}
                          </p>
                          {getPriceChangeIcon(
                            product.currentPrice,
                            product.previousPrice
                          )}
                        </div>
                        {product.previousPrice && (
                          <p className="text-xs text-gray-500 mt-1 line-through">
                            was £{product.previousPrice.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Price Change Percentage */}
                      <div
                        className={`rounded-lg p-4 border transition-all duration-200 hover:scale-105 ${
                          isPriceDrop
                            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
                            : isPriceIncrease
                            ? "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                          Change %
                        </p>
                        <p
                          className={`font-bold text-2xl ${
                            isPriceDrop
                              ? "text-green-400"
                              : isPriceIncrease
                              ? "text-red-400"
                              : "text-gray-400"
                          }`}
                        >
                          {product.previousPrice
                            ? `${
                                priceChange > 0 ? "+" : ""
                              }${priceChange.toFixed(1)}%`
                            : "N/A"}
                        </p>
                        {product.previousPrice && (
                          <p className="text-xs text-gray-500 mt-1">
                            {isPriceDrop
                              ? "Saving opportunity"
                              : isPriceIncrease
                              ? "Price increased"
                              : "No change"}
                          </p>
                        )}
                      </div>

                      {/* Price Difference in £ */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                          Difference (£)
                        </p>
                        <p
                          className={`font-bold text-2xl ${
                            product.previousPrice
                              ? product.currentPrice < product.previousPrice
                                ? "text-green-400"
                                : product.currentPrice > product.previousPrice
                                ? "text-red-400"
                                : "text-gray-400"
                              : "text-gray-400"
                          }`}
                        >
                          {product.previousPrice
                            ? `${
                                product.currentPrice < product.previousPrice
                                  ? "-"
                                  : "+"
                              }£${Math.abs(
                                product.currentPrice - product.previousPrice
                              ).toFixed(2)}`
                            : "N/A"}
                        </p>
                        {product.previousPrice && (
                          <p className="text-xs text-gray-500 mt-1">
                            from previous price
                          </p>
                        )}
                      </div>

                      {/* Last Updated */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                          Last Updated
                        </p>
                        <p className="text-white font-semibold text-lg">
                          {formatDateUK(product.lastUpdated)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Track date</p>
                      </div>
                    </div>

                    {/* Visual price trend indicator */}
                    {product.previousPrice && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>Price Trend</span>
                          <span>
                            {isPriceDrop
                              ? "Favorable"
                              : isPriceIncrease
                              ? "Unfavorable"
                              : "Stable"}
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              isPriceDrop
                                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                : isPriceIncrease
                                ? "bg-gradient-to-r from-red-500 to-orange-500"
                                : "bg-gradient-to-r from-gray-500 to-gray-600"
                            }`}
                            style={{
                              width: `${Math.min(
                                Math.abs(priceChange) * 10,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {filteredProducts.length === 0 && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <LineChart className="h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-center">
                    {searchTerm
                      ? "No products match your search"
                      : "No products added yet. Click 'Add Product' to start tracking prices."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Market Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Market Trends & Analysis
            </h3>
            <p className="text-sm text-gray-400">
              Popular components and pricing trends in the market
            </p>
          </div>

          <div className="grid gap-4">
            {marketTrends.map((trend, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTrendIcon(trend.trend)}
                      <div>
                        <CardTitle className="text-white">
                          {trend.component}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Average market price
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={
                        trend.trend === "down"
                          ? "bg-green-500/20 border-green-500/40 text-green-400"
                          : trend.trend === "up"
                          ? "bg-red-500/20 border-red-500/40 text-red-400"
                          : "bg-gray-500/20 border-gray-500/40 text-gray-400"
                      }
                    >
                      {trend.trend === "down"
                        ? "Decreasing"
                        : trend.trend === "up"
                        ? "Increasing"
                        : "Stable"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Average Price</p>
                      <p className="text-white font-bold text-lg">
                        £{trend.averagePrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">30-Day Change</p>
                      <p
                        className={`font-bold text-lg ${
                          trend.priceChange < 0
                            ? "text-green-400"
                            : trend.priceChange > 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {trend.priceChange > 0 ? "+" : ""}
                        {trend.priceChange.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Popularity</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-sky-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${trend.popularity}%` }}
                          />
                        </div>
                        <span className="text-white font-medium">
                          {trend.popularity}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <p>
                • RTX 4070 prices are trending down (-5.2%), making it a good
                time to stock up or offer competitive pricing
              </p>
              <p>
                • AMD Ryzen 7 7800X3D remains extremely popular (95% popularity)
                with decreasing prices
              </p>
              <p>
                • RTX 4060 prices are rising (+3.1%), consider adjusting your
                pricing strategy
              </p>
              <p>
                • Current market sentiment favors mid-range gaming builds over
                high-end workstations
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitorTracking;
