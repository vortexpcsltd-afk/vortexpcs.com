import { useCallback, useEffect, useState } from "react";
import { logger } from "../services/logger";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Edit2,
  Save,
  X,
  RefreshCw,
  DollarSign,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { fetchPCComponents, fetchPCOptionalExtras } from "../services/cms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface InventoryItem {
  id: string;
  name: string;
  ean: string;
  category: string;
  stock: number;
  reorderPoint: number;
  price: number;
  supplier: string;
  lastRestocked: Date | null;
  notes: string;
  thumbnail?: string;
  brand?: string;
  costPrice?: number;
  profitMargin?: number;
}

interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "out">(
    "all"
  );
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filterItems = useCallback(() => {
    let filtered = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.ean.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus === "low") {
      filtered = filtered.filter(
        (item) => item.stock <= item.reorderPoint && item.stock > 0
      );
    } else if (filterStatus === "out") {
      filtered = filtered.filter((item) => item.stock === 0);
    }
    setFilteredItems(filtered);
  }, [filterStatus, items, searchQuery]);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  async function fetchInventory() {
    try {
      setLoading(true);

      // Fetch all PC components and optional extras from Contentful
      const [components, extras] = await Promise.all([
        fetchPCComponents(),
        fetchPCOptionalExtras(),
      ]);

      // Map Contentful data to inventory format
      const inventoryItems: InventoryItem[] = [
        ...components.map((comp) => ({
          id: comp.id,
          name: comp.name,
          ean: comp.ean || comp.id.toUpperCase(),
          category: comp.category || "Components",
          stock: comp.stockLevel ?? (comp.inStock ? 10 : 0),
          reorderPoint: 5,
          price: comp.price || 0,
          supplier: comp.supplierName || "Spire",
          lastRestocked: null,
          notes: comp.description || "",
          thumbnail: comp.images?.[0],
          brand: comp.brand,
          costPrice: comp.costPrice,
          profitMargin: comp.profitMargin,
        })),
        ...extras.map((extra) => ({
          id: extra.id,
          name: extra.name,
          ean: extra.ean || extra.id.toUpperCase(),
          category: "Optional Extras",
          stock: extra.stockLevel ?? (extra.inStock ? 10 : 0),
          reorderPoint: 5,
          price: extra.price || 0,
          supplier: extra.supplierName || "Target",
          lastRestocked: null,
          notes: extra.description || "",
          thumbnail: extra.images?.[0],
          brand: extra.brand,
          costPrice: extra.costPrice,
          profitMargin: extra.profitMargin,
        })),
      ];

      setItems(inventoryItems);

      // Calculate stats
      const totalValue = inventoryItems.reduce(
        (sum, item) => sum + item.stock * item.price,
        0
      );
      const lowStock = inventoryItems.filter(
        (item) => item.stock <= item.reorderPoint && item.stock > 0
      ).length;
      const outOfStock = inventoryItems.filter(
        (item) => item.stock === 0
      ).length;

      setStats({
        totalItems: inventoryItems.length,
        lowStock,
        outOfStock,
        totalValue,
      });

      if (inventoryItems.length === 0) {
        toast.info("No inventory items found in Contentful", {
          duration: 5000,
        });
      } else {
        toast.success(`Loaded ${inventoryItems.length} items from Contentful`);
      }
    } catch (error) {
      logger.error("Error fetching inventory", error);
      toast.error("Failed to load inventory from Contentful");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateItem(_updates: Partial<InventoryItem>) {
    // Contentful is read-only - redirect to Contentful dashboard
    toast.info("Please edit items in your Contentful dashboard", {
      duration: 4000,
    });
    setShowEditDialog(false);
    setEditingItem(null);
  }

  const getStockBadge = (item: InventoryItem) => {
    if (item.stock === 0) {
      return (
        <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
          Out of Stock
        </Badge>
      );
    }
    if (item.stock <= item.reorderPoint) {
      return (
        <Badge className="bg-yellow-500/20 border-yellow-500/40 text-yellow-400">
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
        In Stock
      </Badge>
    );
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Empty state when no inventory items
  if (!loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 max-w-lg text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">
            No Inventory Items
          </h3>
          <p className="text-gray-400 mb-6">
            Get started by adding your first inventory item in Firebase Console.
          </p>
          <div className="space-y-3 text-left bg-white/5 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300 font-semibold">Quick Setup:</p>
            <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
              <li>Go to Firebase Console → Firestore Database</li>
              <li>
                Create collection:{" "}
                <code className="text-sky-400">inventory</code>
              </li>
              <li>
                Add a document with these fields:
                <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-xs">
                  <li>name (string): Product name</li>
                  <li>sku (string): Stock keeping unit</li>
                  <li>category (string): Product category</li>
                  <li>stock (number): Current quantity</li>
                  <li>reorderPoint (number): Min stock level</li>
                  <li>price (number): Unit price</li>
                </ul>
              </li>
            </ol>
          </div>
          <Button
            onClick={fetchInventory}
            className="bg-gradient-to-r from-sky-600 to-blue-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Inventory
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalItems}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.lowStock}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.outOfStock}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-green-400">
                £{stats.totalValue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, EAN, or category..."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
              className={
                filterStatus === "all"
                  ? "bg-gradient-to-r from-sky-600 to-blue-600"
                  : "border-white/20 text-white hover:bg-white/10"
              }
            >
              All Items
            </Button>
            <Button
              variant={filterStatus === "low" ? "default" : "outline"}
              onClick={() => setFilterStatus("low")}
              className={
                filterStatus === "low"
                  ? "bg-gradient-to-r from-yellow-600 to-orange-600"
                  : "border-white/20 text-white hover:bg-white/10"
              }
            >
              Low Stock
            </Button>
            <Button
              variant={filterStatus === "out" ? "default" : "outline"}
              onClick={() => setFilterStatus("out")}
              className={
                filterStatus === "out"
                  ? "bg-gradient-to-r from-red-600 to-pink-600"
                  : "border-white/20 text-white hover:bg-white/10"
              }
            >
              Out of Stock
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                window.open("https://app.contentful.com/", "_blank");
                toast.info("Opening Contentful dashboard to add items");
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add in Contentful
            </Button>
            <Button
              onClick={fetchInventory}
              variant="outline"
              className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-semibold text-gray-300">
                  Product
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300">
                  Category
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300">
                  Brand
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300">
                  Price
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300 whitespace-nowrap">
                  Stock Qty
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300">
                  Supplier
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300 whitespace-nowrap">
                  Cost Price
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300">
                  Profit
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300">
                  Margin
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-300">
                  Status
                </th>
                <th className="text-right p-4 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No items found</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const profit = item.costPrice
                    ? item.price - item.costPrice
                    : 0;
                  const margin =
                    item.profitMargin ||
                    (item.costPrice ? (profit / item.price) * 100 : 0);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover bg-white/5"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.ean}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-400">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {item.brand || "-"}
                      </td>
                      <td className="p-4 text-sm text-green-400 font-semibold">
                        £{item.price.toFixed(2)}
                      </td>
                      <td className="p-4 text-sm text-white font-medium">
                        {item.stock}
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {item.supplier}
                      </td>
                      <td className="p-4 text-sm text-orange-400">
                        {item.costPrice ? `£${item.costPrice.toFixed(2)}` : "-"}
                      </td>
                      <td className="p-4 text-sm text-cyan-400 font-semibold">
                        {item.costPrice ? `£${profit.toFixed(2)}` : "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-sm font-semibold ${
                            margin > 30
                              ? "text-green-400"
                              : margin > 15
                              ? "text-yellow-400"
                              : "text-orange-400"
                          }`}
                        >
                          {margin > 0 ? `${margin.toFixed(1)}%` : "-"}
                        </span>
                      </td>
                      <td className="p-4">{getStockBadge(item)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(item);
                              setShowEditDialog(true);
                            }}
                            className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 text-gray-400 hover:bg-white/5"
                            title="Lock"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredItems.length)} of{" "}
                {filteredItems.length} items
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Show:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger className="w-[70px] h-8 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    <SelectItem
                      value="5"
                      className="text-white hover:bg-white/10"
                    >
                      5
                    </SelectItem>
                    <SelectItem
                      value="10"
                      className="text-white hover:bg-white/10"
                    >
                      10
                    </SelectItem>
                    <SelectItem
                      value="25"
                      className="text-white hover:bg-white/10"
                    >
                      25
                    </SelectItem>
                    <SelectItem
                      value="50"
                      className="text-white hover:bg-white/10"
                    >
                      50
                    </SelectItem>
                    <SelectItem
                      value="100"
                      className="text-white hover:bg-white/10"
                    >
                      100
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  return (
                    <div key={page} className="flex gap-2">
                      {showEllipsis && (
                        <span className="px-3 py-1 text-gray-400">...</span>
                      )}
                      <Button
                        size="sm"
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => paginate(page)}
                        className={
                          currentPage === page
                            ? "bg-gradient-to-r from-sky-600 to-blue-600"
                            : "border-white/10 text-white hover:bg-white/10"
                        }
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
              <Button
                size="sm"
                variant="outline"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Product Name
                  </label>
                  <Input
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    EAN
                  </label>
                  <Input
                    value={editingItem.ean}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, ean: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Category
                  </label>
                  <Input
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value,
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Supplier
                  </label>
                  <Input
                    value={editingItem.supplier}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        supplier: e.target.value,
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Current Stock
                  </label>
                  <Input
                    type="number"
                    value={editingItem.stock}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Reorder Point
                  </label>
                  <Input
                    type="number"
                    value={editingItem.reorderPoint}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        reorderPoint: parseInt(e.target.value) || 5,
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Notes
                </label>
                <Textarea
                  value={editingItem.notes}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, notes: e.target.value })
                  }
                  rows={3}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingItem(null);
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateItem(editingItem)}
                  className="bg-gradient-to-r from-sky-600 to-blue-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
