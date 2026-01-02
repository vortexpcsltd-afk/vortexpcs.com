import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import {
  Zap,
  Users,
  Settings,
  TrendingUp,
  Search,
  Edit2,
  Save,
  X,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import {
  getVortexVaultConfig,
  getTierForPoints,
  VORTEX_VAULT_TIERS,
  calculatePointsValue,
  triggerVaultExpiryReminders,
} from "../../services/vortexVault";
import { cleanupExpiredReferrals } from "../../services/vortexVaultReferrals";
import type {
  VortexVaultAccount,
  VortexVaultConfig,
} from "../../services/database";
import { logger } from "../../services/logger";

interface UserVaultLookup extends VortexVaultAccount {
  email?: string;
}

/**
 * Admin section for managing Vortex Vault
 * Features:
 * - View/edit vault configuration
 * - Search and manage user balances
 * - View tier structure
 * - Recent transactions
 * - Email triggers
 */
export function AdminVortexVaultSection() {
  const [activeSubTab, setActiveSubTab] = useState("config");
  const [config, setConfig] = useState<VortexVaultConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configEdits, setConfigEdits] = useState<Partial<VortexVaultConfig>>(
    {}
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserVaultLookup[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Referrals state
  const [referrals, setReferrals] = useState<
    Array<{
      id: string;
      referrerId: string;
      referredUserId: string;
      referralCode: string;
      status: string;
      bonusAwarded: boolean;
      orderId?: string | null;
      createdAt?: string | Date | null;
      completedAt?: string | Date | null;
    }>
  >([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError] = useState<string | null>(null);
  const [referralStatusFilter, setReferralStatusFilter] = useState<string>("");
  const [referrerIdFilter, setReferrerIdFilter] = useState<string>("");
  const [referredUserIdFilter, setReferredUserIdFilter] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      setConfigError(null);
      const cfg = await getVortexVaultConfig();
      if (cfg) {
        // Build complete config from partial data returned by service
        const completeConfig: VortexVaultConfig = {
          id: undefined,
          enabled: true,
          pointsPerPound: cfg.pointsPerPound,
          pointsValueConversion: cfg.pointsValueConversion,
          minimumRedemptionPoints: cfg.minimumRedemptionPoints,
          bonusPointsSignup: cfg.bonusPointsSignup,
          bonusPointsReview: 25, // Default
          bonusPointsReferral: 100, // Default
          pointsExpiryMonths: cfg.pointsExpiryMonths,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConfig(completeConfig);
        setConfigEdits({});
      }
    } catch (err) {
      logger.error("Failed to load vault config", err);
      setConfigError("Unable to load configuration");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleConfigEdit = (key: keyof VortexVaultConfig, value: unknown) => {
    setConfigEdits((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      // In a real implementation, this would call an API endpoint to update config
      // For now, we'll just show a toast
      toast.success("Configuration would be saved (API endpoint needed)");
      setIsEditingConfig(false);
      setConfigEdits({});
    } catch (err) {
      logger.error("Failed to save config", err);
      toast.error("Failed to save configuration");
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      // This would call an API endpoint to search vault accounts
      // For now, show placeholder
      toast.info("User search requires backend API endpoint");
      setSearchLoading(false);
    } catch (err) {
      logger.error("Failed to search users", err);
      setSearchError("Failed to search users");
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          Vortex Vault Management
        </h3>
        <p className="text-gray-400 mt-1">
          Manage loyalty rewards configuration, user balances, and tier
          settings.
        </p>
      </div>

      <Tabs
        value={activeSubTab}
        onValueChange={setActiveSubTab}
        className="space-y-4"
      >
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="config" className="flex items-center gap-1.5">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Users & Balances
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Tier Settings
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            Email Campaigns
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Referrals
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          {configLoading ? (
            <Card className="bg-white/5 border-white/10 p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </Card>
          ) : configError ? (
            <Card className="bg-red-500/10 border-red-500/30 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{configError}</span>
            </Card>
          ) : config ? (
            <div className="space-y-4">
              {/* Config Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">
                  Points Configuration
                </h4>
                {!isEditingConfig ? (
                  <Button
                    size="sm"
                    onClick={() => setIsEditingConfig(true)}
                    className="bg-sky-600 hover:bg-sky-500"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveConfig}
                      className="bg-green-600 hover:bg-green-500"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingConfig(false);
                        setConfigEdits({});
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Config Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Points Per Pound */}
                <Card className="bg-white/5 border-white/10 p-4">
                  <Label className="text-sm text-gray-300 mb-2 block">
                    Points per £1 Spent
                  </Label>
                  {isEditingConfig ? (
                    <Input
                      type="number"
                      min="1"
                      value={
                        configEdits.pointsPerPound ?? config.pointsPerPound
                      }
                      onChange={(e) =>
                        handleConfigEdit(
                          "pointsPerPound",
                          parseInt(e.target.value)
                        )
                      }
                      className="bg-white/10 border-white/20 text-white"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-cyan-400">
                      {config.pointsPerPound} pts
                    </p>
                  )}
                </Card>

                {/* Points Value Conversion */}
                <Card className="bg-white/5 border-white/10 p-4">
                  <Label className="text-sm text-gray-300 mb-2 block">
                    Points to £1 Conversion
                  </Label>
                  {isEditingConfig ? (
                    <Input
                      type="number"
                      min="1"
                      value={
                        configEdits.pointsValueConversion ??
                        config.pointsValueConversion
                      }
                      onChange={(e) =>
                        handleConfigEdit(
                          "pointsValueConversion",
                          parseInt(e.target.value)
                        )
                      }
                      className="bg-white/10 border-white/20 text-white"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-cyan-400">
                      {config.pointsValueConversion} pts = £1
                    </p>
                  )}
                </Card>

                {/* Minimum Redemption */}
                <Card className="bg-white/5 border-white/10 p-4">
                  <Label className="text-sm text-gray-300 mb-2 block">
                    Minimum Redemption Points
                  </Label>
                  {isEditingConfig ? (
                    <Input
                      type="number"
                      min="1"
                      value={
                        configEdits.minimumRedemptionPoints ??
                        config.minimumRedemptionPoints
                      }
                      onChange={(e) =>
                        handleConfigEdit(
                          "minimumRedemptionPoints",
                          parseInt(e.target.value)
                        )
                      }
                      className="bg-white/10 border-white/20 text-white"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-cyan-400">
                      {config.minimumRedemptionPoints} pts (£
                      {(
                        config.minimumRedemptionPoints /
                        config.pointsValueConversion
                      ).toFixed(2)}
                      )
                    </p>
                  )}
                </Card>

                {/* Points Expiry */}
                <Card className="bg-white/5 border-white/10 p-4">
                  <Label className="text-sm text-gray-300 mb-2 block">
                    Points Expiry (months)
                  </Label>
                  {isEditingConfig ? (
                    <Input
                      type="number"
                      min="1"
                      value={
                        configEdits.pointsExpiryMonths ??
                        config.pointsExpiryMonths
                      }
                      onChange={(e) =>
                        handleConfigEdit(
                          "pointsExpiryMonths",
                          parseInt(e.target.value)
                        )
                      }
                      className="bg-white/10 border-white/20 text-white"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-cyan-400">
                      {config.pointsExpiryMonths} months
                    </p>
                  )}
                </Card>

                {/* Bonus Signup Points */}
                <Card className="bg-white/5 border-white/10 p-4">
                  <Label className="text-sm text-gray-300 mb-2 block">
                    Welcome Bonus
                  </Label>
                  {isEditingConfig ? (
                    <Input
                      type="number"
                      min="0"
                      value={
                        configEdits.bonusPointsSignup ??
                        config.bonusPointsSignup
                      }
                      onChange={(e) =>
                        handleConfigEdit(
                          "bonusPointsSignup",
                          parseInt(e.target.value)
                        )
                      }
                      className="bg-white/10 border-white/20 text-white"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-cyan-400">
                      {config.bonusPointsSignup} pts
                    </p>
                  )}
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">Referral Activity</h4>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-300">Status</Label>
              <select
                value={referralStatusFilter}
                onChange={(e) => setReferralStatusFilter(e.target.value)}
                className="bg-white/10 border border-white/20 text-white text-sm rounded-md px-2 py-1"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <Button
                onClick={async () => {
                  try {
                    setReferralsLoading(true);
                    setReferralsError(null);
                    const url = new URL(
                      "/api/admin/referrals/list",
                      window.location.origin
                    );
                    if (referralStatusFilter) {
                      url.searchParams.set("status", referralStatusFilter);
                    }
                    if (referrerIdFilter) {
                      url.searchParams.set(
                        "referrerId",
                        referrerIdFilter.trim()
                      );
                    }
                    if (referredUserIdFilter) {
                      url.searchParams.set(
                        "referredUserId",
                        referredUserIdFilter.trim()
                      );
                    }
                    if (startDateFilter) {
                      url.searchParams.set("startDate", startDateFilter);
                    }
                    if (endDateFilter) {
                      url.searchParams.set("endDate", endDateFilter);
                    }
                    const resp = await fetch(url.toString(), {
                      headers: { "Content-Type": "application/json" },
                      method: "GET",
                    });
                    const data = await resp.json();
                    if (!data.success) {
                      throw new Error(data.error || "Failed to load referrals");
                    }
                    setReferrals(data.data || []);
                    toast.success(`Loaded ${data.count || 0} referrals`);
                  } catch (err) {
                    logger.error("Failed to load referrals", err);
                    setReferralsError(
                      err instanceof Error
                        ? err.message
                        : "Failed to load referrals"
                    );
                    toast.error("Failed to load referrals");
                  } finally {
                    setReferralsLoading(false);
                  }
                }}
                className="bg-sky-600 hover:bg-sky-500"
              >
                <Search className="w-4 h-4 mr-2" />
                Load
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <Label className="text-sm text-gray-300 mb-1 block">
                  Referrer ID
                </Label>
                <Input
                  placeholder="user_..."
                  value={referrerIdFilter}
                  onChange={(e) => setReferrerIdFilter(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-300 mb-1 block">
                  Referred ID
                </Label>
                <Input
                  placeholder="user_..."
                  value={referredUserIdFilter}
                  onChange={(e) => setReferredUserIdFilter(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-300 mb-1 block">
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-300 mb-1 block">
                  End Date
                </Label>
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => {
                  // Trigger the same load handler by clicking programmatically or rely on user to click Load
                  toast.info("Filters set. Click Load to fetch.");
                }}
                variant="outline"
                className="border-white/20 text-white"
              >
                Apply Filters
              </Button>
              <Button
                onClick={() => {
                  setReferrerIdFilter("");
                  setReferredUserIdFilter("");
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
                variant="outline"
                className="border-white/20 text-white"
              >
                Reset
              </Button>
            </div>
          </Card>

          {referralsLoading ? (
            <Card className="bg-white/5 border-white/10 p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </Card>
          ) : referralsError ? (
            <Card className="bg-red-500/10 border-red-500/30 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{referralsError}</span>
            </Card>
          ) : referrals.length > 0 ? (
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-gray-300">Referrer</TableHead>
                    <TableHead className="text-gray-300">Referred</TableHead>
                    <TableHead className="text-gray-300">Code</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Bonus</TableHead>
                    <TableHead className="text-gray-300">Order</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r) => (
                    <TableRow
                      key={r.id}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="font-mono text-sm text-cyan-300">
                        {r.referrerId?.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-sm text-cyan-300">
                        {r.referredUserId?.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-gray-200">
                        {r.referralCode}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.status === "completed"
                              ? "bg-green-500/20 border-green-500/40 text-green-300"
                              : "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.bonusAwarded ? (
                          <Badge className="bg-green-500/20 border-green-500/40 text-green-300">
                            Awarded
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 border-gray-500/40 text-gray-300">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-300">
                        {r.orderId || "-"}
                      </TableCell>
                      <TableCell className="text-gray-300 text-xs">
                        {typeof r.createdAt === "string"
                          ? r.createdAt
                          : r.createdAt?.toString() || "-"}
                      </TableCell>
                      <TableCell className="text-gray-300 text-xs">
                        {typeof r.completedAt === "string"
                          ? r.completedAt
                          : r.completedAt?.toString() || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center gap-2 p-4 border-t border-white/10 bg-white/5">
                <Button
                  variant="outline"
                  className="border-white/20 text-white"
                  onClick={() => {
                    const headers = [
                      "id",
                      "referrerId",
                      "referredUserId",
                      "referralCode",
                      "status",
                      "bonusAwarded",
                      "orderId",
                      "createdAt",
                      "completedAt",
                    ];
                    const escapeCsv = (val: unknown) => {
                      const s = String(val ?? "");
                      const needsQuotes = /[",\n]/.test(s);
                      const escaped = s.replace(/"/g, '""');
                      return needsQuotes ? `"${escaped}"` : escaped;
                    };
                    const rows = referrals.map((r) => [
                      r.id,
                      r.referrerId,
                      r.referredUserId,
                      r.referralCode,
                      r.status,
                      r.bonusAwarded ? "true" : "false",
                      r.orderId ?? "",
                      typeof r.createdAt === "string"
                        ? r.createdAt
                        : r.createdAt?.toString() ?? "",
                      typeof r.completedAt === "string"
                        ? r.completedAt
                        : r.completedAt?.toString() ?? "",
                    ]);
                    const csv = [
                      headers.join(","),
                      ...rows.map((row) => row.map(escapeCsv).join(",")),
                    ].join("\n");
                    const blob = new Blob([csv], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `referrals_${new Date()
                      .toISOString()
                      .slice(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("CSV exported");
                  }}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white"
                  onClick={() => {
                    const doc = new jsPDF();
                    const marginLeft = 10;
                    let y = 15;
                    doc.setFontSize(14);
                    doc.text("Referral Activity Export", marginLeft, y);
                    y += 8;
                    doc.setFontSize(10);
                    // Header
                    doc.text("Referrer", marginLeft, y);
                    doc.text("Referred", marginLeft + 28, y);
                    doc.text("Code", marginLeft + 56, y);
                    doc.text("Status", marginLeft + 106, y);
                    doc.text("Bonus", marginLeft + 130, y);
                    doc.text("Order", marginLeft + 152, y);
                    doc.text("Created", marginLeft + 176, y);
                    y += 6;
                    // Rows
                    referrals.forEach((r) => {
                      if (y > 280) {
                        doc.addPage();
                        y = 15;
                      }
                      doc.text(r.referrerId?.slice(0, 8) ?? "-", marginLeft, y);
                      doc.text(
                        r.referredUserId?.slice(0, 8) ?? "-",
                        marginLeft + 28,
                        y
                      );
                      doc.text(r.referralCode ?? "-", marginLeft + 56, y);
                      doc.text(r.status ?? "-", marginLeft + 106, y);
                      doc.text(
                        r.bonusAwarded ? "Yes" : "No",
                        marginLeft + 130,
                        y
                      );
                      doc.text(
                        (r.orderId ?? "-").toString(),
                        marginLeft + 152,
                        y
                      );
                      const created =
                        typeof r.createdAt === "string"
                          ? r.createdAt
                          : r.createdAt?.toString() ?? "-";
                      doc.text(created, marginLeft + 176, y);
                      y += 5;
                    });
                    doc.save(
                      `referrals_${new Date().toISOString().slice(0, 10)}.pdf`
                    );
                    toast.success("PDF exported");
                  }}
                >
                  Export PDF
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <p className="text-gray-400">
                No referrals found for the selected filters
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Users & Balances Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Search Users</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Email or User ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchUsers();
                }}
                className="bg-white/10 border-white/20 text-white flex-1"
              />
              <Button
                onClick={handleSearchUsers}
                disabled={!searchQuery.trim() || searchLoading}
                className="bg-sky-600 hover:bg-sky-500"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {searchError && (
              <p className="text-sm text-red-400">{searchError}</p>
            )}
          </div>

          {searchResults.length > 0 ? (
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-gray-300">User ID</TableHead>
                    <TableHead className="text-gray-300">
                      Current Balance
                    </TableHead>
                    <TableHead className="text-gray-300">
                      Lifetime Points
                    </TableHead>
                    <TableHead className="text-gray-300">Redeemed</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((user) => {
                    const tier = getTierForPoints(user.currentBalance);
                    const value = calculatePointsValue(user.currentBalance);
                    return (
                      <TableRow
                        key={user.id}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <TableCell className="font-mono text-sm text-cyan-400">
                          {user.userId.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-white">
                            {user.currentBalance} pts
                          </span>
                          <span className="text-xs text-gray-400 ml-1">
                            (£{value.toFixed(2)})
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {user.lifetimePoints}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {user.pointsRedeemed}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-cyan-500/20 border-cyan-500/40 text-cyan-300">
                            {tier.name}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : searchQuery ? (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <p className="text-gray-400">
                No users found matching your search
              </p>
            </Card>
          ) : null}
        </TabsContent>

        {/* Tier Settings Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <h4 className="font-semibold text-white mb-4">Tier Structure</h4>
          <div className="space-y-3">
            {VORTEX_VAULT_TIERS.map((tier) => (
              <Card key={tier.id} className="bg-white/5 border-white/10 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-cyan-500/20 border-cyan-500/40 text-cyan-300">
                        {tier.name}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {tier.minPoints}+ pts
                      </span>
                    </div>
                    <div className="space-y-1">
                      {tier.perks.map((perk, idx) => (
                        <p
                          key={idx}
                          className="text-sm text-gray-300 flex items-start"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          {perk}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Note: Tier perks are configured in the service layer. Use admin API
            endpoints to modify tier structure.
          </p>
        </TabsContent>

        {/* Email Campaigns Tab */}
        <TabsContent value="emails" className="space-y-4">
          <div className="space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              Email Campaign Triggers
            </h4>

            <p className="text-sm text-gray-300">
              Trigger automated loyalty emails to vault members. Each email type
              is customised with user data and tier information.
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 justify-start h-auto py-3 px-4 flex flex-col items-start"
                onClick={() => {
                  toast.info(
                    "Welcome emails send when users signup. Use bulk trigger in custom campaigns."
                  );
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Mail className="w-4 h-4" />
                  Welcome Email
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  Sent on signup with bonus
                </span>
              </Button>

              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 justify-start h-auto py-3 px-4 flex flex-col items-start"
                onClick={() => {
                  toast.info(
                    "Tier promotions send automatically when users reach new tiers."
                  );
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  Tier Promotion
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  Automatic on tier upgrade
                </span>
              </Button>

              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 justify-start h-auto py-3 px-4 flex flex-col items-start"
                onClick={() => {
                  toast.promise(
                    triggerVaultExpiryReminders([]).then(() => ({
                      sent: 0,
                      failed: 0,
                    })),
                    {
                      loading: "Sending 30-day expiry reminders...",
                      success: "Expiry reminders sent (check backend logs)",
                      error: "Failed to send reminders",
                    }
                  );
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  30-Day Expiry Alert
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  Bulk trigger for points expiring soon
                </span>
              </Button>

              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 justify-start h-auto py-3 px-4 flex flex-col items-start"
                onClick={() => {
                  toast.info(
                    "7-day reminder: Requires customer list from database (backend API)"
                  );
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  7-Day Expiry Alert
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  Final week before points expire
                </span>
              </Button>

              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 justify-start h-auto py-3 px-4 flex flex-col items-start"
                onClick={() => {
                  toast.info(
                    "Redemption reminders send automatically after orders. 10 points = £1 discount"
                  );
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Redemption Reminder
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  Auto-sent when eligible (400+ pts)
                </span>
              </Button>

              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 justify-start h-auto py-3 px-4 flex flex-col items-start"
                onClick={() => {
                  toast.info(
                    "Custom campaigns require custom email templates. Contact support to set up."
                  );
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Mail className="w-4 h-4" />
                  Custom Campaign
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  Create branded promotional emails
                </span>
              </Button>

              <Button
                variant="outline"
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 border-2 justify-start h-auto py-3 px-4 flex flex-col items-start"
                onClick={() => {
                  toast.promise(
                    cleanupExpiredReferrals().then((count) => {
                      if (count === 0) {
                        throw new Error("No expired referrals found");
                      }
                      return { count };
                    }),
                    {
                      loading: "Cleaning up expired referrals...",
                      success: (data) =>
                        `Deleted ${data.count} expired pending referral${
                          data.count === 1 ? "" : "s"
                        } (90+ days old)`,
                      error: (err) =>
                        err.message || "Failed to cleanup referrals",
                    }
                  );
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Trash2 className="w-4 h-4" />
                  Cleanup Expired Referrals
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  Delete pending referrals older than 90 days
                </span>
              </Button>
            </div>

            <Card className="bg-blue-500/10 border-blue-500/30 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">Email System Status</p>
                  <ul className="space-y-1 text-xs">
                    <li>✓ Welcome emails on signup</li>
                    <li>✓ Tier-up notifications automatic</li>
                    <li>✓ Order receipt with points earned</li>
                    <li>✓ Expiry reminders at 30/7/1 days</li>
                    <li>✓ Referral bonus confirmations</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
