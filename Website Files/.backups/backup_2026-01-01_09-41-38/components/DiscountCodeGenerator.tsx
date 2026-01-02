import { useState } from "react";
import { toast } from "sonner";
import {
  Tag,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Download,
  RefreshCw,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface DiscountCode {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  usageLimit?: number;
  usageCount: number;
  customerSpecific?: string;
  expiresAt?: Date;
  createdAt: Date;
  active: boolean;
}

export function DiscountCodeGenerator() {
  const [codes, setCodes] = useState<DiscountCode[]>([
    {
      id: "1",
      code: "BLACKFRIDAY25",
      type: "percentage",
      value: 25,
      usageLimit: 100,
      usageCount: 34,
      expiresAt: new Date("2025-11-30"),
      createdAt: new Date("2025-11-01"),
      active: true,
    },
    {
      id: "2",
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      usageCount: 156,
      createdAt: new Date("2025-10-01"),
      active: true,
    },
    {
      id: "3",
      code: "FREESHIP50",
      type: "fixed",
      value: 50,
      usageLimit: 50,
      usageCount: 23,
      expiresAt: new Date("2025-12-31"),
      createdAt: new Date("2025-11-15"),
      active: true,
    },
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [codePrefix, setCodePrefix] = useState("");
  const [codeType, setCodeType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [codeValue, setCodeValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [bulkCount, setBulkCount] = useState("1");
  const [customerEmail, setCustomerEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const generateRandomCode = (prefix: string = "") => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = prefix.toUpperCase();
    for (let i = 0; i < (prefix ? 6 : 8); i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateCodes = () => {
    if (!codeValue) return;

    const count = parseInt(bulkCount) || 1;
    const newCodes: DiscountCode[] = [];

    for (let i = 0; i < count; i++) {
      const code: DiscountCode = {
        id: Date.now().toString() + i,
        code:
          count > 1
            ? generateRandomCode(codePrefix)
            : (codePrefix || generateRandomCode()).toUpperCase(),
        type: codeType,
        value: parseFloat(codeValue),
        usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
        usageCount: 0,
        expiresAt: expiryDate ? new Date(expiryDate) : undefined,
        customerSpecific: customerEmail || undefined,
        createdAt: new Date(),
        active: true,
      };
      newCodes.push(code);
    }

    setCodes([...newCodes, ...codes]);
    setShowCreateDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setCodePrefix("");
    setCodeType("percentage");
    setCodeValue("");
    setUsageLimit("");
    setExpiryDate("");
    setBulkCount("1");
    setCustomerEmail("");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied to clipboard!`);
  };

  const toggleCodeStatus = (id: string) => {
    setCodes(codes.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const deleteCode = (id: string) => {
    if (confirm("Are you sure you want to delete this discount code?")) {
      setCodes(codes.filter((c) => c.id !== id));
    }
  };

  const exportCodes = () => {
    const csv = [
      ["Code", "Type", "Value", "Usage", "Limit", "Expires", "Status"],
      ...codes.map((c) => [
        c.code,
        c.type,
        c.value,
        c.usageCount,
        c.usageLimit || "Unlimited",
        c.expiresAt ? c.expiresAt.toLocaleDateString() : "Never",
        c.active ? "Active" : "Inactive",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discount-codes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredCodes = codes.filter((code) => {
    if (!showInactive && !code.active) return false;
    if (searchQuery) {
      return (
        code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (code.customerSpecific &&
          code.customerSpecific
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  const totalRevenue = codes.reduce((sum, c) => {
    // Estimate savings based on average order value
    const avgOrderValue = 1500;
    const savings =
      c.type === "percentage" ? (avgOrderValue * c.value) / 100 : c.value;
    return sum + savings * c.usageCount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-400" />
            Discount Code Manager
          </h3>
          <p className="text-gray-400 mt-1">
            Generate and manage discount codes for your store
          </p>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={exportCodes}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export all discount codes to CSV file</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Codes
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate new discount codes</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Codes</p>
              <p className="text-3xl font-bold text-white mt-1">
                {codes.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {codes.filter((c) => c.active).length} active
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Tag className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Uses</p>
              <p className="text-3xl font-bold text-white mt-1">
                {codes.reduce((sum, c) => sum + c.usageCount, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Discount</p>
              <p className="text-3xl font-bold text-white mt-1">
                {codes.length > 0
                  ? (
                      codes.reduce(
                        (sum, c) =>
                          sum +
                          (c.type === "percentage" ? c.value : c.value / 15),
                        0
                      ) / codes.length
                    ).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
              <Percent className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Est. Savings</p>
              <p className="text-3xl font-bold text-white mt-1">
                £{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Input
              placeholder="Search codes or customer email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowInactive(!showInactive)}
            className={`border-white/20 text-white hover:bg-white/10 ${
              showInactive ? "bg-white/10" : ""
            }`}
          >
            {showInactive ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show All
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Inactive
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Codes List */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <div className="p-6 space-y-4">
          {filteredCodes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Discount Codes
              </h3>
              <p className="text-gray-400 mb-4">
                Generate discount codes to offer deals to your customers
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                    title="Generate your first discount codes"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Codes
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate your first discount codes</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            filteredCodes.map((code) => (
              <div
                key={code.id}
                className={`p-4 rounded-lg border transition-all ${
                  code.active
                    ? "bg-white/5 border-white/10 hover:border-purple-500/30"
                    : "bg-black/20 border-white/5 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-2xl font-bold text-white font-mono bg-black/30 px-3 py-1 rounded border border-white/10">
                        {code.code}
                      </code>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyCode(code.code)}
                            className="border-white/20 text-white hover:bg-white/10"
                            title="Copy code to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy code to clipboard</p>
                        </TooltipContent>
                      </Tooltip>
                      {!code.active && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          Inactive
                        </Badge>
                      )}
                      {code.customerSpecific && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Customer-Specific
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-400">Discount</p>
                        <p className="text-lg font-bold text-white">
                          {code.type === "percentage" ? (
                            <>
                              {code.value}%
                              <Percent className="w-4 h-4 inline ml-1 text-purple-400" />
                            </>
                          ) : (
                            <>
                              £{code.value}
                              <DollarSign className="w-4 h-4 inline ml-1 text-green-400" />
                            </>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Usage</p>
                        <p className="text-lg font-bold text-white">
                          {code.usageCount}
                          {code.usageLimit && (
                            <span className="text-sm text-gray-400">
                              {" "}
                              / {code.usageLimit}
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Remaining</p>
                        <p className="text-lg font-bold text-white">
                          {code.usageLimit
                            ? code.usageLimit - code.usageCount
                            : "∞"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Expires</p>
                        <p className="text-sm font-medium text-white">
                          {code.expiresAt ? (
                            <span
                              className={
                                new Date(code.expiresAt) < new Date()
                                  ? "text-red-400"
                                  : ""
                              }
                            >
                              {code.expiresAt.toLocaleDateString()}
                            </span>
                          ) : (
                            "Never"
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Created</p>
                        <p className="text-sm font-medium text-white">
                          {code.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {code.customerSpecific && (
                      <div className="mt-3 text-sm text-gray-400">
                        <Users className="w-4 h-4 inline mr-1" />
                        Customer: {code.customerSpecific}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCodeStatus(code.id)}
                          className={`border-white/20 hover:bg-white/10 ${
                            code.active ? "text-yellow-400" : "text-green-400"
                          }`}
                        >
                          {code.active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {code.active ? "Deactivate code" : "Activate code"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCode(code.id)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete code permanently</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Create Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Discount Codes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codePrefix" className="text-white">
                  Code Prefix (Optional)
                </Label>
                <Input
                  id="codePrefix"
                  value={codePrefix}
                  onChange={(e) => setCodePrefix(e.target.value)}
                  placeholder="e.g., SUMMER"
                  className="bg-white/5 border-white/10 text-white uppercase"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty for random codes
                </p>
              </div>

              <div>
                <Label htmlFor="bulkCount" className="text-white">
                  Number of Codes
                </Label>
                <Input
                  id="bulkCount"
                  type="number"
                  min="1"
                  max="100"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codeType" className="text-white">
                  Discount Type
                </Label>
                <Select
                  value={codeType}
                  onValueChange={(v: "percentage" | "fixed") => setCodeType(v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="codeValue" className="text-white">
                  Discount Value
                </Label>
                <Input
                  id="codeValue"
                  type="number"
                  value={codeValue}
                  onChange={(e) => setCodeValue(e.target.value)}
                  placeholder={
                    codeType === "percentage" ? "e.g., 10" : "e.g., 50"
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {codeType === "percentage" ? "%" : "£"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usageLimit" className="text-white">
                  Usage Limit (Optional)
                </Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="expiryDate" className="text-white">
                  Expiry Date (Optional)
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail" className="text-white">
                Customer Email (Optional)
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="For customer-specific codes"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCodes}
                disabled={!codeValue}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate {bulkCount} Code{parseInt(bulkCount) > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
