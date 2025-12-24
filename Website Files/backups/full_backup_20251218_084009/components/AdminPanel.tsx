import {
  ExternalLink,
  AlertTriangle,
  Package,
  DollarSign,
  Users,
  Settings,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  User,
  Building2,
  Ban,
  RefreshCw,
  Loader2,
  Paperclip,
  Shield,
  Download,
  MessageSquare,
  Eye,
  Search,
  Filter,
  Edit,
  Plus,
  FileText,
  Globe,
  Upload,
  BarChart3,
  Code,
  Image,
  Mail,
  Trash2,
  Printer,
} from "lucide-react";
import { useState, useEffect, type ComponentType } from "react";
import React from "react";
import { ComponentErrorBoundary } from "./ErrorBoundary";
import { CustomerProfile } from "./CustomerProfile";
import { ProductionSheet } from "./ProductionSheet";
import { InventoryManager } from "./InventoryManager";
import { CampaignManager } from "./CampaignManager";
import { DiscountCodeGenerator } from "./DiscountCodeGenerator";
import { PromotionalBanners } from "./PromotionalBanners";
import CompetitorTracking from "./CompetitorTracking";
import { SearchAnalytics } from "./SearchAnalytics";
import { RecommendationsTab } from "./RecommendationsTab";
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
  getAllOrders,
  getAllOrdersExtended,
  getAllUsers,
  getDashboardStats,
  getAnalytics,
  updateBuildProgress,
  getAllSupportTickets,
  updateSupportTicket,
  getAllRefundRequests,
  updateOrder,
  deleteOrder,
  verifyBankTransfer,
  type RawUserRecord,
  type SupportTicket,
  type RefundRequest,
} from "../services/database";
import type { Order } from "../services/database";
import { useAuth } from "../contexts/AuthContext";
import { updateUserProfile, resetPassword } from "../services/auth";
import RichTextEditor from "./ui/RichTextEditor";
import AdvancedEmailEditor from "./ui/AdvancedEmailEditor";
import { buildBrandedEmailHtml } from "../services/emailTemplate";
import { sendBulkEmail } from "../services/emailClient";
import { MonitoringDashboard } from "./MonitoringDashboard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { PerformanceDashboard } from "./admin/PerformanceDashboard";
import { ReportBuilder } from "./ReportBuilder";
import { toast } from "sonner";
import { logger } from "../services/logger";

// Deduplicate orders by paymentId or orderId (prefers first occurrence)
const dedupeOrders = (orders: Order[]): Order[] => {
  const map = new Map<string, Order>();
  for (const o of orders) {
    const key = o.paymentId || o.orderId || o.id || Math.random().toString();
    if (!map.has(key)) map.set(key, o);
  }
  return Array.from(map.values());
};

// Normalize differing order schemas so Admin panel can display all orders
// Handles: orderNumber -> orderId, amount -> total, item.name -> item.productName, createdAt -> orderDate
type CombinedItem = Order["items"][number] & { name?: string };
interface LegacyFields {
  orderNumber?: string;
  amount?: number;
  createdAt?: Date;
  items?: CombinedItem[];
}
type ExtendedOrder = Order & { legacy?: boolean };
const normalizeOrders = (orders: Order[]): ExtendedOrder[] => {
  return orders.map((orig) => {
    const legacy = orig as Order & LegacyFields;
    const rawItems: CombinedItem[] = Array.isArray(legacy.items)
      ? legacy.items!
      : [];
    const normalizedItems: Order["items"] = rawItems.map((i) => ({
      productId: i.productId || "unknown",
      productName: i.productName || i.name || "Item",
      price: typeof i.price === "number" ? i.price : 0,
      quantity: typeof i.quantity === "number" ? i.quantity : 1,
    }));
    const computedTotal =
      typeof legacy.total === "number"
        ? legacy.total
        : typeof legacy.amount === "number"
        ? legacy.amount
        : normalizedItems.reduce(
            (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
            0
          );
    // Map legacy shippingAddress -> address if present
    let address = (orig as Order).address;
    interface LegacyShip {
      line1?: string;
      line2?: string;
      city?: string;
      town?: string;
      postcode?: string;
      postalCode?: string;
      country?: string;
    }
    const legacyShipping = (orig as unknown as { shippingAddress?: LegacyShip })
      .shippingAddress;
    if (!address && legacyShipping && typeof legacyShipping === "object") {
      address = {
        line1: legacyShipping.line1 || "",
        line2: legacyShipping.line2 || "",
        city: legacyShipping.city || legacyShipping.town || "",
        postcode: legacyShipping.postcode || legacyShipping.postalCode || "",
        country: legacyShipping.country || "",
      };
    }
    // Normalize bankTransferVerifiedAt which may be a Firestore Timestamp
    const rawVerifiedAt = (
      orig as unknown as { bankTransferVerifiedAt?: unknown }
    ).bankTransferVerifiedAt;
    let bankTransferVerifiedAt: Date | undefined = undefined;
    if (rawVerifiedAt instanceof Date) {
      bankTransferVerifiedAt = rawVerifiedAt;
    } else if (
      rawVerifiedAt &&
      typeof rawVerifiedAt === "object" &&
      "toDate" in (rawVerifiedAt as Record<string, unknown>) &&
      typeof (rawVerifiedAt as { toDate: () => Date }).toDate === "function"
    ) {
      try {
        bankTransferVerifiedAt = (
          rawVerifiedAt as { toDate: () => Date }
        ).toDate();
      } catch {
        bankTransferVerifiedAt = undefined;
      }
    } else if (
      typeof rawVerifiedAt === "string" ||
      typeof rawVerifiedAt === "number"
    ) {
      const parsed = new Date(rawVerifiedAt);
      if (!isNaN(parsed.getTime())) bankTransferVerifiedAt = parsed;
    }
    const isLegacy =
      !!legacy.orderNumber ||
      !!legacy.amount ||
      (!!legacy.createdAt && !orig.orderDate) ||
      !(orig as Order).paymentMethod; // heuristic: missing paymentMethod
    return {
      ...orig,
      items: normalizedItems,
      orderId: legacy.orderId || legacy.orderNumber || orig.id,
      total: computedTotal,
      orderDate: orig.orderDate || legacy.createdAt || orig.orderDate,
      address,
      bankTransferVerifiedAt,
      legacy: isLegacy,
    } as ExtendedOrder;
  });
};

// Helper to safely format verified payment date (handles Firestore Timestamp, Date, string, number)
const formatVerifiedDate = (value: unknown): string => {
  if (!value) return "";
  let d: Date | null = null;
  if (value instanceof Date) {
    d = value;
  } else if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in (value as Record<string, unknown>) &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    try {
      d = (value as { toDate: () => Date }).toDate();
    } catch {
      d = null;
    }
  } else if (typeof value === "string" || typeof value === "number") {
    const tmp = new Date(value);
    if (!isNaN(tmp.getTime())) d = tmp;
  }
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

// Format status strings (e.g., "pending_payment" -> "Pending Payment")
const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Simple CSV export helper for current tab data
const exportCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
  try {
    if (!rows || rows.length === 0) {
      toast.info("Nothing to export yet");
      return;
    }
    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    );
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [
      headers.join(","),
      ...rows.map((r) => {
        const obj = r as Record<string, unknown>;
        return headers.map((h) => esc(obj[h])).join(",");
      }),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Failed to export");
  }
};

export function AdminPanel() {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPaymentSettingsModal, setShowPaymentSettingsModal] =
    useState(false);
  const [btDraft, setBtDraft] = useState({
    accountName: "",
    bankName: "",
    sortCode: "",
    accountNumber: "",
    iban: "",
    bic: "",
    referenceNote: "",
    instructions: "",
  });
  // Load current Bank Transfer settings when modal opens
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!showPaymentSettingsModal) return;
      try {
        const { fetchBankTransferSettings } = await import(
          "../services/settings"
        );
        const s = await fetchBankTransferSettings();
        if (cancelled) return;
        setBtDraft({
          accountName: s.accountName || "",
          bankName: s.bankName || "",
          sortCode: s.sortCode || "",
          accountNumber: s.accountNumber || "",
          iban: s.iban || "",
          bic: s.bic || "",
          referenceNote: s.referenceNote || "",
          instructions: s.instructions || "",
        });
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [showPaymentSettingsModal]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      const valid = new Set([
        "dashboard",
        "orders",
        "inventory",
        "customers",
        "support",
        "analytics",
        "recommendations",
        "reports",
        "monitoring",
        "performance",
        "security",
        "content",
        "email",
      ]);
      if (valid.has(hash)) setActiveTab(hash);
    };
    // Initialize from current hash
    syncFromHash();
    // React on future hash changes
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);
  // Create Business Account modal state
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [cbCompanyName, setCbCompanyName] = useState("");
  const [cbContactName, setCbContactName] = useState("");
  const [cbDisplayName, setCbDisplayName] = useState("");
  const [cbEmail, setCbEmail] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [cbSubmitting, setCbSubmitting] = useState(false);
  const [cbError, setCbError] = useState<string | null>(null);
  const [cbResetLink, setCbResetLink] = useState<string | null>(null);
  const [cbEmailSent, setCbEmailSent] = useState<boolean | null>(null);
  const [cbEmailError, setCbEmailError] = useState<string | null>(null);
  const [cbSetPasswordNow, setCbSetPasswordNow] = useState(false);
  const [cbTempPassword, setCbTempPassword] = useState("");

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
  const [totalProducts, setTotalProducts] = useState(0);
  const [monthlyVisitors, setMonthlyVisitors] = useState(0);
  const [newCustomersThisMonth, setNewCustomersThisMonth] = useState(0);
  const [newMembersThisMonth, setNewMembersThisMonth] = useState(0);
  const [newBusinessesThisMonth, setNewBusinessesThisMonth] = useState(0);
  const [newCustomersThisYear, setNewCustomersThisYear] = useState(0);
  const [newMembersThisYear, setNewMembersThisYear] = useState(0);
  const [newBusinessesThisYear, setNewBusinessesThisYear] = useState(0);
  const [currentMonth, setCurrentMonth] = useState("");
  const [pwaStats, setPwaStats] = useState({
    installs: 0,
    dismissals: 0,
    promptShown: 0,
    installRate: 0,
  });
  const [securityIssues, setSecurityIssues] = useState<
    Array<{ id: string; type: string; timestamp: Date; description: string }>
  >([]);
  const [lastAdminLogin, setLastAdminLogin] = useState<Date | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [lastOrdersRefresh, setLastOrdersRefresh] = useState<Date | null>(null); // displayed in Orders header
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false); // toggles 60s polling
  const [ordersRefreshing, setOrdersRefreshing] = useState(false);
  type CustomerRow = {
    id: string;
    name: string;
    email: string;
    orders: number;
    spent: number;
    joined: Date | null;
    role: string;
    accountType?: string;
    companyName?: string;
  };
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  // Helper: legacy vs primary counts (legacy flagged during normalization)
  const getOrderCounts = () => {
    let legacy = 0;
    for (const o of allOrders) {
      if ((o as unknown as { legacy?: boolean }).legacy) legacy++;
    }
    return {
      legacy,
      primary: allOrders.length - legacy,
      total: allOrders.length,
    };
  };
  // Recompute revenue & build stats when orders change so dashboard reflects bank transfer verification immediately
  useEffect(() => {
    if (!allOrders.length) {
      // If empty, zero out to avoid stale previous totals
      setDashboardStats((prev) => ({
        ...prev,
        orders: { ...prev.orders, total: 0 },
        revenue: { ...prev.revenue, total: 0 },
        builds: { ...prev.builds, total: 0 },
      }));
      return;
    }
    const sumRevenue = allOrders.reduce((sum, o) => {
      const raw = (o as unknown as { total?: unknown }).total;
      let val = 0;
      if (typeof raw === "number" && Number.isFinite(raw)) val = raw;
      else if (typeof raw === "string") {
        const cleaned = raw.replace(/[^0-9.-]/g, "");
        const parsed = parseFloat(cleaned);
        if (Number.isFinite(parsed)) val = parsed;
      }
      return sum + val;
    }, 0);
    const activeBuilds = allOrders.filter(
      (o) => o.status === "building" || o.status === "testing"
    ).length;
    setDashboardStats((prev) => ({
      ...prev,
      orders: { ...prev.orders, total: allOrders.length },
      revenue: { ...prev.revenue, total: sumRevenue },
      builds: { ...prev.builds, total: activeBuilds },
    }));
  }, [allOrders]);
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
  const [showProductionSheet, setShowProductionSheet] = useState(false);
  // Order details modal visibility
  const [showOrderModal, setShowOrderModal] = useState(false);
  // Shipping tracking states
  const [editingShipping, setEditingShipping] = useState(false);
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [shippingCourier, setShippingCourier] = useState("");
  // Track order modal visibility (ensures linter sees usage)
  useEffect(() => {
    // No side-effect; placeholder to acknowledge state
  }, [showOrderModal]);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildStatus, setBuildStatus] = useState<Order["status"]>("pending");
  const [buildNote, setBuildNote] = useState("");
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportTicketsError, setSupportTicketsError] = useState<string | null>(
    null
  );
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  // Order deletion dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [cascadeRefunds, setCascadeRefunds] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Security alert reporting state
  const [securityAlertReportLoading, setSecurityAlertReportLoading] =
    useState(false);
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  // Ticket reply state
  const [ticketReplyBody, setTicketReplyBody] = useState("");
  const [ticketReplyInternal, setTicketReplyInternal] = useState(false);
  const [ticketReplySending, setTicketReplySending] = useState(false);
  const [ticketReplyError, setTicketReplyError] = useState<string | null>(null);
  const [ticketReplyAttachments, setTicketReplyAttachments] = useState<
    import("../services/storage").TicketAttachmentMeta[]
  >([]);
  const [ticketReplyUploadProgress, setTicketReplyUploadProgress] =
    useState<number>(0);
  // Backfill migration controls removed
  const [showSecurityAlertModal, setShowSecurityAlertModal] = useState(false);
  const [selectedSecurityAlert, setSelectedSecurityAlert] = useState<{
    id: string;
    type: string;
    timestamp: Date;
    description: string;
  } | null>(null);
  // Backfill handler removed
  // Security: Unblock IP modal state
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [unblockIpInput, setUnblockIpInput] = useState("");
  const [unblockBusy, setUnblockBusy] = useState(false);
  const [unblockMsg, setUnblockMsg] = useState<string | null>(null);

  // Security: Whitelist IP modal state
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [whitelistIpInput, setWhitelistIpInput] = useState("");
  const [whitelistReasonInput, setWhitelistReasonInput] = useState("");
  const [whitelistBusy, setWhitelistBusy] = useState(false);
  const [whitelistMsg, setWhitelistMsg] = useState<string | null>(null);

  // Security tab state
  type TimestampLike = { toDate?: () => Date };
  type HasToken = { getIdToken?: () => Promise<string> };
  const [blockedIps, setBlockedIps] = useState<
    Array<{
      id: string;
      ip?: string;
      attempts?: number;
      blocked?: boolean;
      blockedAt?: TimestampLike;
      reason?: string | null;
      lastEmailTried?: string | null;
    }>
  >([]);
  const [loadingBlockedIps, setLoadingBlockedIps] = useState(false);
  const [showUnblocked, setShowUnblocked] = useState(false);
  // Pagination & search state for IP blocks
  const [ipBlocksPage, setIpBlocksPage] = useState(1);
  const [ipBlocksLimit, setIpBlocksLimit] = useState(25);
  const [ipBlocksSearch, setIpBlocksSearch] = useState("");
  const [ipBlocksTotalPages, setIpBlocksTotalPages] = useState(0);
  const [ipBlocksTotal, setIpBlocksTotal] = useState(0);
  const [ipBlocksCount, setIpBlocksCount] = useState(0);
  const [ipBlocksHasNext, setIpBlocksHasNext] = useState(false);
  const [ipBlocksHasPrev, setIpBlocksHasPrev] = useState(false);
  // Debounced search internal state
  const [ipBlocksSearchInput, setIpBlocksSearchInput] = useState("");

  // Effect: debounce search input and trigger page reset
  useEffect(() => {
    const handle = setTimeout(() => {
      setIpBlocksSearch(ipBlocksSearchInput.trim());
      setIpBlocksPage(1); // reset to first page when search changes
    }, 300);
    return () => clearTimeout(handle);
  }, [ipBlocksSearchInput]);

  // Effect: auto-load IP blocks when parameters change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Skip if auth is still loading or no user
      if (authLoading || !user) {
        logger.debug("Skipping IP blocks load - auth loading or no user");
        return;
      }
      setLoadingBlockedIps(true);
      try {
        // Get the ID token from Firebase auth instead of user object
        let idToken = "";
        try {
          const { auth } = await import("../config/firebase");
          const currentUser = auth?.currentUser;
          if (currentUser && typeof currentUser.getIdToken === "function") {
            idToken = await currentUser.getIdToken();
          } else {
            logger.warn("Firebase auth not available or no current user");
          }
        } catch (tokenError) {
          logger.error("Failed to get ID token:", tokenError);
        }

        if (!idToken) {
          logger.warn("No ID token available for IP blocks request");
          if (!cancelled) {
            // Don't show error toast - IP blocks are optional
            logger.debug("Skipping IP blocks load - no auth token");
            setLoadingBlockedIps(false);
          }
          return;
        }

        const { listIpBlocks } = await import("../services/security");
        const resp = await listIpBlocks(idToken, {
          includeUnblocked: showUnblocked,
          page: ipBlocksPage,
          limit: ipBlocksLimit,
          search: ipBlocksSearch,
        });
        if (cancelled) return;
        setBlockedIps(
          resp.entries.map((e) => ({
            id: e.id,
            ip: e.ip,
            attempts: e.attempts,
            blocked: e.blocked,
            blockedAt: e.blockedAt as TimestampLike,
            reason: e.reason ?? null,
            lastEmailTried: e.lastEmailTried ?? null,
          }))
        );
        setIpBlocksTotalPages(resp.totalPages);
        setIpBlocksTotal(resp.total);
        setIpBlocksCount(resp.count);
        setIpBlocksHasNext(resp.hasNext);
        setIpBlocksHasPrev(resp.hasPrev);
      } catch (error) {
        if (!cancelled) {
          logger.error("Error loading IP blocks:", error);
          toast.error("Failed to load IP blocks");
        }
      } finally {
        if (!cancelled) setLoadingBlockedIps(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    user,
    showUnblocked,
    ipBlocksPage,
    ipBlocksLimit,
    ipBlocksSearch,
  ]);

  // Customer details/editor modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerModalMode, setCustomerModalMode] = useState<"view" | "edit">(
    "view"
  );
  const [customerEditing, setCustomerEditing] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerSuccess, setCustomerSuccess] = useState<string | null>(null);
  const [customerDraftName, setCustomerDraftName] = useState("");
  const [customerDraftRole, setCustomerDraftRole] = useState<"user" | "admin">(
    "user"
  );
  const [selectedCustomer, setSelectedCustomer] = useState<
    (CustomerRow & { accountNumber?: string | null }) | null
  >(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [crmProfileCustomerId, setCrmProfileCustomerId] = useState<
    string | null
  >(null);

  // Handle attachment uploads (sequential to keep it simple)
  const handleTicketAttachmentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!selectedTicket?.id) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { uploadTicketAttachment } = await import("../services/storage");
        const meta = await uploadTicketAttachment(
          selectedTicket.id,
          file,
          (pct) => {
            setTicketReplyUploadProgress(Math.round(pct));
          }
        );
        setTicketReplyAttachments((prev) => [...prev, meta]);
      } catch (err) {
        alert(
          err instanceof Error
            ? `Upload failed: ${err.message}`
            : "Upload failed"
        );
      } finally {
        setTicketReplyUploadProgress(0);
      }
    }
    // reset input value so same file can be reselected if needed
    e.target.value = "";
  };

  const handleSendTicketReply = async () => {
    if (!selectedTicket?.id || !ticketReplyBody.trim()) return;
    setTicketReplySending(true);
    setTicketReplyError(null);
    try {
      const { replyToTicket } = await import("../services/support");
      const res = await replyToTicket({
        ticketId: selectedTicket.id,
        body: ticketReplyBody.trim(),
        internal: ticketReplyInternal,
        attachments: ticketReplyAttachments.map((a) => ({
          name: a.name,
          url: a.url,
          size: a.size,
          type: a.type,
          path: a.path,
          scanStatus: a.scanStatus,
        })),
      });
      if (res?.success) {
        // Optimistically update local state
        setSupportTickets((prev: SupportTicket[]) =>
          prev.map(
            (t): SupportTicket =>
              t.id === selectedTicket.id
                ? {
                    ...t,
                    messages: [
                      ...(t.messages || []),
                      {
                        senderId: user?.uid || null,
                        senderName: user?.displayName || user?.email || null,
                        body: ticketReplyBody.trim(),
                        internal: ticketReplyInternal,
                        timestamp: new Date(),
                        attachments: ticketReplyAttachments,
                      },
                    ],
                  }
                : t
          )
        );
        setSelectedTicket((prev: SupportTicket | null): SupportTicket | null =>
          prev
            ? {
                ...prev,
                messages: [
                  ...(prev.messages || []),
                  {
                    senderId: user?.uid || null,
                    senderName: user?.displayName || user?.email || null,
                    body: ticketReplyBody.trim(),
                    internal: ticketReplyInternal,
                    timestamp: new Date(),
                    attachments: ticketReplyAttachments,
                  },
                ],
              }
            : prev
        );
        setTicketReplyBody("");
        setTicketReplyInternal(false);
        setTicketReplyAttachments([]);
      }
    } catch (err) {
      setTicketReplyError(
        err instanceof Error ? err.message : "Failed to send reply"
      );
    } finally {
      setTicketReplySending(false);
    }
  };

  // Load admin data on component mount
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        logger.debug("Admin Panel - Loading dashboard data");

        // Load dashboard statistics
        const stats = await getDashboardStats();
        // Sanitize numeric fields to avoid NaN display
        const safeStats = { ...stats } as typeof stats;
        const fixMetric = (obj: {
          total: number;
          change: string;
          trend: string;
        }) => {
          if (!Number.isFinite(obj.total)) obj.total = 0;
          if (typeof obj.change === "string" && /NaN/i.test(obj.change))
            obj.change = "+0%";
          if (obj.trend !== "up" && obj.trend !== "down") obj.trend = "up";
        };
        fixMetric(safeStats.orders);
        fixMetric(safeStats.revenue);
        fixMetric(safeStats.customers);
        fixMetric(safeStats.builds);
        setDashboardStats(safeStats);
        logger.debug("Dashboard stats loaded", { safeStats });

        // Load & normalize all orders including legacy schema (extended fetch)
        let ordersRaw = await getAllOrdersExtended(1200, 600);
        // Fallback if extended returns nothing (rare)
        if (!ordersRaw || ordersRaw.length === 0) {
          logger.warn(
            "Extended orders fetch returned empty; falling back to basic getAllOrders"
          );
          ordersRaw = await getAllOrders(1000);
        }
        const ordersMerged = dedupeOrders(
          normalizeOrders(ordersRaw) as Order[]
        );
        // Sort by orderDate descending for consistent recentOrders
        const sorted = [...ordersMerged].sort((a, b) => {
          const ta =
            a.orderDate instanceof Date && !isNaN(a.orderDate.getTime())
              ? a.orderDate.getTime()
              : 0;
          const tb =
            b.orderDate instanceof Date && !isNaN(b.orderDate.getTime())
              ? b.orderDate.getTime()
              : 0;
          return tb - ta;
        });
        setAllOrders(sorted);
        setRecentOrders(sorted.slice(0, 5)); // Show top 5 latest
        setLastOrdersRefresh(new Date());
        // Save cache
        try {
          const cachePayload = sorted.map((o) => ({
            ...o,
            orderDate:
              o.orderDate instanceof Date ? o.orderDate.toISOString() : null,
            bankTransferVerifiedAt:
              o.bankTransferVerifiedAt instanceof Date
                ? o.bankTransferVerifiedAt.toISOString()
                : null,
          }));
          sessionStorage.setItem(
            "admin_orders_cache_v1",
            JSON.stringify(cachePayload)
          );
        } catch {
          // ignore cache errors
        }
        logger.debug("Admin Panel - Extended orders loaded", {
          count: sorted.length,
        });

        // Load all users
        const users = await getAllUsers();
        logger.debug("Raw users from database", { users });

        // Calculate customer stats from users and orders
        const customersWithStats: CustomerRow[] = users
          .filter((user): user is RawUserRecord & { id: string } => !!user.id)
          .map((user) => {
            const userOrders = sorted.filter(
              (order) => order.userId === user.id
            );
            const totalSpent = userOrders.reduce(
              (sum, order) => sum + order.total,
              0
            );

            logger.debug("Processing user", {
              email: user.email,
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
              accountType: (user?.accountType as string) || "general",
              companyName: (user?.companyName as string) || undefined,
            };
          });

        setCustomers(customersWithStats);

        // Calculate new customers this month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthName = now.toLocaleDateString("en-GB", { month: "long" });
        setCurrentMonth(monthName);

        const newCustomers = customersWithStats.filter((customer) => {
          if (!customer.joined) return false;
          const joinedDate = new Date(customer.joined);
          return (
            joinedDate.getMonth() === currentMonth &&
            joinedDate.getFullYear() === currentYear
          );
        });

        const newCustomersYear = customersWithStats.filter((customer) => {
          if (!customer.joined) return false;
          const joinedDate = new Date(customer.joined);
          return joinedDate.getFullYear() === currentYear;
        });

        const newMembers = newCustomers.filter(
          (c) => c.accountType !== "business"
        ).length;
        const newBusinesses = newCustomers.filter(
          (c) => c.accountType === "business"
        ).length;

        const newMembersYear = newCustomersYear.filter(
          (c) => c.accountType !== "business"
        ).length;
        const newBusinessesYear = newCustomersYear.filter(
          (c) => c.accountType === "business"
        ).length;

        setNewCustomersThisMonth(newCustomers.length);
        setNewMembersThisMonth(newMembers);
        setNewBusinessesThisMonth(newBusinesses);
        setNewCustomersThisYear(newCustomersYear.length);
        setNewMembersThisYear(newMembersYear);
        setNewBusinessesThisYear(newBusinessesYear);

        logger.debug("Admin Panel - Customers loaded", {
          count: customersWithStats.length,
          customers: customersWithStats,
          newThisMonth: newCustomers.length,
          newMembers,
          newBusinesses,
        });

        // Load inventory count from Contentful
        try {
          const { fetchPCComponents, fetchPCOptionalExtras } = await import(
            "../services/cms"
          );
          const [components, extras] = await Promise.all([
            fetchPCComponents(),
            fetchPCOptionalExtras(),
          ]);
          const totalCount = components.length + extras.length;
          setTotalProducts(totalCount);
          logger.debug("Admin Panel - Inventory loaded", {
            components: components.length,
            extras: extras.length,
            total: totalCount,
          });
        } catch (error) {
          logger.error("Admin Panel - Error loading inventory", { error });
        }
      } catch (error) {
        logger.error("Admin Panel - Error loading data", { error });
      } finally {
        setLoading(false);
      }
    };

    const loadAnalytics = async () => {
      try {
        logger.debug("Admin Panel - Loading analytics data");
        const analytics = await getAnalytics(30); // Last 30 days
        setAnalyticsData(analytics);

        // Calculate monthly visitors (page views this month)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        let monthlyCount = 0;

        Object.entries(analytics.viewsByDay).forEach(([date, count]) => {
          const d = new Date(date);
          if (
            d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear
          ) {
            monthlyCount += count;
          }
        });

        setMonthlyVisitors(monthlyCount);
        logger.debug("Analytics loaded", { analytics, monthlyCount });

        // Fetch PWA installation statistics
        try {
          // Get auth token from Firebase
          let authToken = "";
          try {
            const { auth } = await import("../config/firebase");
            const currentUser = auth?.currentUser;
            if (currentUser && typeof currentUser.getIdToken === "function") {
              authToken = await currentUser.getIdToken();
            }
          } catch (tokenError) {
            logger.debug("Could not get auth token for PWA stats", {
              error: tokenError,
            });
          }

          const pwaResponse = await fetch("/api/analytics/pwa-stats", {
            headers: authToken
              ? {
                  Authorization: `Bearer ${authToken}`,
                }
              : {},
          });
          if (pwaResponse.ok) {
            const pwaData = await pwaResponse.json();
            const installs = pwaData.data?.installs || pwaData.installs || 0;
            const dismissals =
              pwaData.data?.dismissals || pwaData.dismissals || 0;
            const promptShown = installs + dismissals;
            const installRate =
              promptShown > 0 ? (installs / promptShown) * 100 : 0;

            setPwaStats({
              installs,
              dismissals,
              promptShown,
              installRate: Math.round(installRate),
            });
            logger.debug("PWA stats loaded", pwaData);
          } else {
            logger.warn("PWA stats request failed", {
              status: pwaResponse.status,
            });
          }
        } catch (error) {
          logger.debug("Failed to load PWA stats", { error });
        }
      } catch (error) {
        logger.error("Admin Panel - Error loading analytics", { error });
      }
    };

    const loadTicketsAndRefunds = async () => {
      try {
        logger.debug(
          "Admin Panel - Loading support tickets and refund requests"
        );
        const tickets = await getAllSupportTickets();
        const refunds = await getAllRefundRequests();
        setSupportTickets(tickets);
        setRefundRequests(refunds);
        setSupportTicketsError(null);
        logger.debug("Loaded tickets and refunds", {
          tickets: tickets.length,
          refunds: refunds.length,
        });
      } catch (error) {
        logger.error("Admin Panel - Error loading tickets/refunds", { error });
        type ErrWithCode = { code?: string };
        const maybe = error as ErrWithCode | null;
        const msg =
          (maybe && typeof maybe.code === "string" ? `(${maybe.code}) ` : "") +
          (error instanceof Error
            ? error.message
            : "Failed to load support tickets");
        setSupportTicketsError(msg);
      }
    };

    // Preload from cache for snappy UI before network fetch
    if (isAdmin) {
      try {
        const cached = sessionStorage.getItem("admin_orders_cache_v1");
        if (cached) {
          const parsed: unknown[] = JSON.parse(cached);
          const revived = parsed.map((o) => {
            const obj = o as Partial<Order> & {
              orderDate?: string | null;
              bankTransferVerifiedAt?: string | null;
            };
            return {
              ...obj,
              orderDate: obj.orderDate ? new Date(obj.orderDate) : null,
              bankTransferVerifiedAt: obj.bankTransferVerifiedAt
                ? new Date(obj.bankTransferVerifiedAt)
                : undefined,
            } as Order;
          });
          const sortedCached = [...revived].sort((a, b) => {
            const ta =
              a.orderDate instanceof Date && !isNaN(a.orderDate.getTime())
                ? a.orderDate.getTime()
                : 0;
            const tb =
              b.orderDate instanceof Date && !isNaN(b.orderDate.getTime())
                ? b.orderDate.getTime()
                : 0;
            return tb - ta;
          });
          setAllOrders(sortedCached);
          setRecentOrders(sortedCached.slice(0, 5));
        }
      } catch {
        /* ignore cache errors */
      }
      loadAdminData();
      loadAnalytics();
      loadTicketsAndRefunds();

      // Load last admin login time and check for security issues
      const loadSecurityData = async () => {
        try {
          // Get last admin login from localStorage
          const lastLogin = localStorage.getItem("vortex_last_admin_login");
          const lastLoginDate = lastLogin
            ? new Date(lastLogin)
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
          setLastAdminLogin(lastLoginDate);

          // Check for security issues (failed logins, suspicious activity)
          const { db } = await import("../config/firebase");
          if (db) {
            const { collection, getDocs, where, query } = await import(
              "firebase/firestore"
            );

            // Query for failed login attempts since last admin login
            const securityQuery = query(
              collection(db, "security_events"),
              where("timestamp", ">=", lastLoginDate)
            );

            try {
              const securitySnap = await getDocs(securityQuery);
              const issues = securitySnap.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  type: data.type || "unknown",
                  timestamp: data.timestamp?.toDate() || new Date(),
                  description: data.description || "Security event detected",
                };
              });
              setSecurityIssues(issues);
            } catch (err) {
              // Collection might not exist yet, that's ok
              logger.debug("No security events collection found", { err });
              setSecurityIssues([]);
            }
          }

          // Update last admin login timestamp
          localStorage.setItem(
            "vortex_last_admin_login",
            new Date().toISOString()
          );
        } catch (error) {
          logger.error("Error loading security data", { error });
        }
      };

      loadSecurityData();
    } else {
      // For non-admins, avoid permission errors by skipping protected reads
      logger.warn("Non-admin user: skipping admin data loads.");
      setLoading(false);
    }
  }, [isAdmin]);

  // Auto refresh polling
  useEffect(() => {
    if (!autoRefreshEnabled || !isAdmin) return;
    const interval = setInterval(async () => {
      try {
        let ordersRaw = await getAllOrdersExtended(1200, 600);
        if (!ordersRaw || ordersRaw.length === 0) {
          ordersRaw = await getAllOrders(1000);
        }
        const ordersMerged = dedupeOrders(
          normalizeOrders(ordersRaw) as Order[]
        );
        const sorted = [...ordersMerged].sort((a, b) => {
          const ta =
            a.orderDate instanceof Date && !isNaN(a.orderDate.getTime())
              ? a.orderDate.getTime()
              : 0;
          const tb =
            b.orderDate instanceof Date && !isNaN(b.orderDate.getTime())
              ? b.orderDate.getTime()
              : 0;
          return tb - ta;
        });
        setAllOrders(sorted);
        setRecentOrders(sorted.slice(0, 5));
        setLastOrdersRefresh(new Date());
        try {
          const cachePayload = sorted.map((o) => ({
            ...o,
            orderDate:
              o.orderDate instanceof Date ? o.orderDate.toISOString() : null,
            bankTransferVerifiedAt:
              o.bankTransferVerifiedAt instanceof Date
                ? o.bankTransferVerifiedAt.toISOString()
                : null,
          }));
          sessionStorage.setItem(
            "admin_orders_cache_v1",
            JSON.stringify(cachePayload)
          );
        } catch {
          /* ignore cache save failure */
        }
      } catch (e) {
        logger.warn("Auto refresh failed", { e });
      }
    }, 60000); // 60s
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, isAdmin]);

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

      // Reload & normalize orders to show updates
      const ordersRaw = await getAllOrders(1000);
      const orders = dedupeOrders(normalizeOrders(ordersRaw));
      setAllOrders(orders);
      setRecentOrders(orders.slice(0, 5));

      setShowBuildProgressModal(false);
      alert("Build progress updated successfully!");
    } catch (error) {
      logger.error("Error updating build progress", { error });
      alert("Failed to update build progress. Please try again.");
    }
  };

  // Open deletion confirmation
  const handleOpenDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setCascadeRefunds(true);
    setDeleteOpen(true);
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!orderToDelete?.id) {
      toast.error("Order ID is missing");
      logger.error("Delete attempt with no order ID", { orderToDelete });
      return;
    }
    setDeleteLoading(true);
    try {
      logger.info("Deleting order", {
        orderId: orderToDelete.id,
        orderId2: orderToDelete.orderId,
      });
      const res = await deleteOrder(orderToDelete.id, {
        rejectRefundRequests: cascadeRefunds,
      });
      setAllOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setRecentOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      if (cascadeRefunds) {
        setRefundRequests((prev) =>
          prev.map((r) =>
            r.orderId === orderToDelete.id && r.status === "pending"
              ? { ...r, status: "rejected" }
              : r
          )
        );
      }
      toast.success(
        `Order deleted${
          res.refundRequestsRejected > 0
            ? ` (${res.refundRequestsRejected} refund request(s) rejected)`
            : ""
        }`
      );
    } catch (e) {
      logger.error("Delete order failed", {
        error: e,
        orderId: orderToDelete.id,
      });
      toast.error(e instanceof Error ? e.message : "Failed to delete order.");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
      setOrderToDelete(null);
    }
  };

  // Report selected security alert via email
  const handleReportSecurityAlert = async () => {
    if (!selectedSecurityAlert) {
      toast.error("No alert selected");
      return;
    }
    setSecurityAlertReportLoading(true);
    try {
      const sev =
        (selectedSecurityAlert as unknown as { severity?: string }).severity ||
        "High";
      const status =
        (selectedSecurityAlert as unknown as { status?: string }).status ||
        "Requires Review";
      const ts =
        selectedSecurityAlert.timestamp instanceof Date
          ? selectedSecurityAlert.timestamp
          : new Date();
      const subject = `Security Alert: ${selectedSecurityAlert.type} (Severity: ${sev})`;
      const recommendedActions = [
        "Investigate the event immediately",
        "Review system logs for related activity",
        "Verify no unauthorized access persists",
        "Escalate to security lead if anomalous patterns found",
      ];
      const contentHtml = `
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">Security Alert Detected</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:4px 8px;font-weight:600;background:#0f172a;color:#fff;">Alert ID</td><td style="padding:4px 8px;background:#1e293b;color:#fff;">${
            selectedSecurityAlert.id
          }</td></tr>
          <tr><td style="padding:4px 8px;font-weight:600;background:#0f172a;color:#fff;">Type</td><td style="padding:4px 8px;background:#1e293b;color:#fff;">${
            selectedSecurityAlert.type
          }</td></tr>
          <tr><td style="padding:4px 8px;font-weight:600;background:#0f172a;color:#fff;">Detected At</td><td style="padding:4px 8px;background:#1e293b;color:#fff;">${ts.toLocaleString(
            "en-GB"
          )}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:600;background:#0f172a;color:#fff;">Severity</td><td style="padding:4px 8px;background:#1e293b;color:#fff;">${sev}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:600;background:#0f172a;color:#fff;">Status</td><td style="padding:4px 8px;background:#1e293b;color:#fff;">${status}</td></tr>
        </table>
        <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;">Event Description</h3>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">${
          selectedSecurityAlert.description || "No description provided."
        }</p>
        <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;">Recommended Actions</h3>
        <ol style="margin:0 0 16px;padding-left:18px;font-size:14px;line-height:1.5;">${recommendedActions
          .map((a) => `<li>${a}</li>`)
          .join("")}</ol>
        <p style="margin:0;font-size:12px;color:#64748b;">This alert was reported automatically from the Admin Dashboard. An audit snapshot has been recorded.</p>
      `;
      const branded = buildBrandedEmailHtml({
        title: subject,
        preheader: `Security alert ${selectedSecurityAlert.type} requires attention`,
        contentHtml,
      });
      await sendBulkEmail({
        subject,
        html: branded,
        preheader: subject,
        mode: "emails",
        recipients: ["kevin@vortexpcs.com"],
      });
      toast.success("Security alert reported via email");
      setShowSecurityAlertModal(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to send alert email"
      );
    } finally {
      setSecurityAlertReportLoading(false);
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
      case "pending_payment":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
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
              {title.toLowerCase().includes("revenue")
                ? `£${Number.isFinite(value) ? value.toLocaleString() : "0"}`
                : Number.isFinite(value)
                ? value.toLocaleString()
                : "0"}
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
    <ComponentErrorBoundary componentName="AdminPanel">
      <div className="min-h-screen py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-[1480px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400 truncate">
                    Manage your Vortex PCs operations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="text-right mr-2 hidden sm:block">
                  <p className="text-sm text-white font-medium truncate">
                    {user?.displayName || user?.email || "Admin"}
                  </p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Are you sure you want to logout from the admin panel?"
                      )
                    ) {
                      try {
                        // Clear localStorage
                        localStorage.removeItem("vortex_user");
                        // Sign out from Firebase
                        const { logoutUser } = await import("../services/auth");
                        await logoutUser();
                      } catch (error) {
                        logger.error("Admin logout error:", error);
                      }
                      // Redirect to home
                      window.location.href = "/";
                    }
                  }}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => {
                        setUnblockIpInput("");
                        setUnblockMsg(null);
                        setShowUnblockModal(true);
                      }}
                      className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                      title="Unblock a blocked IP"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Unblock IP
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => {
                        setWhitelistIpInput("");
                        setWhitelistReasonInput("");
                        setWhitelistMsg(null);
                        setShowWhitelistModal(true);
                      }}
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      title="Add IP to whitelist (never blocked)"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Whitelist IP
                    </Button>
                  </>
                )}
                <Button
                  variant="premium"
                  size="default"
                  onClick={() => setActiveTab("search")}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Analytics
                </Button>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val);
                // keep hash in sync with selected tab for deep-linking
                const hash = `#${val}`;
                if (window.location.hash !== hash) window.location.hash = hash;
              }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Scrollable horizontal tabs on mobile, wrapped on desktop */}
              <div className="relative">
                {/* Scroll hint shadow on mobile */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent pointer-events-none z-10 md:hidden" />

                <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 -mx-3 sm:mx-0 px-3 sm:px-0">
                  <TabsList className="inline-flex md:flex md:flex-wrap w-full md:w-auto items-center md:content-center md:justify-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-xl border-b border-white/10 px-2 sm:px-3 md:px-6 lg:px-8 py-3 md:py-12 min-w-max md:min-w-0">
                    <TabsTrigger
                      value="dashboard"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                      value="orders"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Orders
                    </TabsTrigger>
                    <TabsTrigger
                      value="inventory"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Inventory
                    </TabsTrigger>
                    <TabsTrigger
                      value="customers"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Customers
                    </TabsTrigger>
                    <TabsTrigger
                      value="support"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Support
                    </TabsTrigger>
                    <TabsTrigger
                      value="analytics"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger
                      value="recommendations"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Recommendations
                    </TabsTrigger>
                    <TabsTrigger
                      value="reports"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Reports
                    </TabsTrigger>
                    <TabsTrigger
                      value="monitoring"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Monitoring
                    </TabsTrigger>
                    <TabsTrigger
                      value="performance"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Performance
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Security
                    </TabsTrigger>
                    <TabsTrigger
                      value="content"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="email"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-6 rounded-md border border-white/10 bg-white/5 text-[11px] sm:text-xs md:text-sm text-white hover:border-sky-500/30 data-[state=active]:border-sky-500/40 data-[state=active]:bg-sky-500/10 whitespace-nowrap"
                    >
                      Marketing
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Dashboard Tab */}

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="w-6 h-6 text-red-400" />
                      Security Controls
                    </h3>
                    <p className="text-gray-400 mt-1">
                      Manage blocked IP addresses from repeated failed logins.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={async () => {
                        if (!user) return;
                        setLoadingBlockedIps(true);
                        try {
                          let idToken = "";
                          try {
                            const { auth } = await import("../config/firebase");
                            const currentUser = auth?.currentUser;
                            if (
                              currentUser &&
                              typeof currentUser.getIdToken === "function"
                            ) {
                              idToken = await currentUser.getIdToken();
                            }
                          } catch (tokenError) {
                            logger.error("Failed to get ID token:", tokenError);
                          }

                          if (!idToken) {
                            logger.debug(
                              "Skipping IP blocks load - no auth token"
                            );
                            setLoadingBlockedIps(false);
                            return;
                          }

                          const { listIpBlocks } = await import(
                            "../services/security"
                          );
                          const resp = await listIpBlocks(idToken, {
                            includeUnblocked: showUnblocked,
                            page: ipBlocksPage,
                            limit: ipBlocksLimit,
                            search: ipBlocksSearch,
                          });
                          setBlockedIps(
                            resp.entries.map((e) => ({
                              id: e.id,
                              ip: e.ip,
                              attempts: e.attempts,
                              blocked: e.blocked,
                              blockedAt: e.blockedAt as TimestampLike,
                              reason: e.reason ?? null,
                              lastEmailTried: e.lastEmailTried ?? null,
                            }))
                          );
                          setIpBlocksTotalPages(resp.totalPages);
                          setIpBlocksTotal(resp.total);
                          setIpBlocksCount(resp.count);
                          setIpBlocksHasNext(resp.hasNext);
                          setIpBlocksHasPrev(resp.hasPrev);
                        } catch {
                          toast.error("Failed to load IP blocks");
                        } finally {
                          setLoadingBlockedIps(false);
                        }
                      }}
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          loadingBlockedIps ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      className={"border-white/20 text-white hover:bg-white/10"}
                      onClick={() => setShowUnblocked((v) => !v)}
                    >
                      {showUnblocked ? "Hide Unblocked" : "Show All"}
                    </Button>
                  </div>
                </div>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                  <div className="flex flex-col gap-3 mb-4">
                    <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                      <span className="truncate">
                        Blocked IPs (
                        {blockedIps.filter((i) => i.blocked).length})
                      </span>
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Search IP or email…"
                        className="bg-black/40 border border-white/15 rounded px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-sky-500/50 w-full sm:flex-1"
                        value={ipBlocksSearchInput}
                        onChange={(e) => setIpBlocksSearchInput(e.target.value)}
                      />
                      <select
                        className="bg-black/40 border border-white/15 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 w-full sm:w-auto"
                        value={ipBlocksLimit}
                        onChange={(e) => {
                          setIpBlocksLimit(Number(e.target.value));
                          setIpBlocksPage(1);
                        }}
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n} / page
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                        onClick={async () => {
                          if (!user) return;
                          setLoadingBlockedIps(true);
                          try {
                            let idToken = "";
                            try {
                              const { auth } = await import(
                                "../config/firebase"
                              );
                              const currentUser = auth?.currentUser;
                              if (
                                currentUser &&
                                typeof currentUser.getIdToken === "function"
                              ) {
                                idToken = await currentUser.getIdToken();
                              }
                            } catch (tokenError) {
                              logger.error(
                                "Failed to get ID token:",
                                tokenError
                              );
                            }

                            if (!idToken) {
                              logger.debug(
                                "Skipping IP blocks load - no auth token"
                              );
                              setLoadingBlockedIps(false);
                              return;
                            }

                            const { listIpBlocks } = await import(
                              "../services/security"
                            );
                            const resp = await listIpBlocks(idToken, {
                              includeUnblocked: showUnblocked,
                              page: ipBlocksPage,
                              limit: ipBlocksLimit,
                              search: ipBlocksSearch,
                            });
                            setBlockedIps(
                              resp.entries.map((e) => ({
                                id: e.id,
                                ip: e.ip,
                                attempts: e.attempts,
                                blocked: e.blocked,
                                blockedAt: e.blockedAt as TimestampLike,
                                reason: e.reason ?? null,
                                lastEmailTried: e.lastEmailTried ?? null,
                              }))
                            );
                            setIpBlocksTotalPages(resp.totalPages);
                            setIpBlocksTotal(resp.total);
                            setIpBlocksCount(resp.count);
                            setIpBlocksHasNext(resp.hasNext);
                            setIpBlocksHasPrev(resp.hasPrev);
                          } catch {
                            toast.error("Refresh failed");
                          } finally {
                            setLoadingBlockedIps(false);
                          }
                        }}
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${
                            loadingBlockedIps ? "animate-spin" : ""
                          }`}
                        />
                        Reload
                      </Button>
                    </div>
                  </div>
                  {loadingBlockedIps ? (
                    <div className="py-10 text-center">
                      <Loader2 className="w-10 h-10 text-sky-400 animate-spin mx-auto mb-3" />
                      <p className="text-gray-400">Loading IP entries…</p>
                    </div>
                  ) : blockedIps.length === 0 ? (
                    <p className="text-gray-400">No IP entries recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-300 border-b border-white/10">
                            <th className="py-2 pr-3">IP / ID</th>
                            <th className="py-2 pr-3">Attempts</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2 pr-3">Last Email</th>
                            <th className="py-2 pr-3">Reason</th>
                            <th className="py-2 pr-3">Blocked At</th>
                            <th className="py-2 pr-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blockedIps.map((entry) => {
                            const blocked = Boolean(entry.blocked);
                            const attempts = Number(entry.attempts || 0);
                            const blockedAt = entry.blockedAt?.toDate
                              ? entry.blockedAt.toDate()
                              : null;
                            return (
                              <tr
                                key={entry.id}
                                className="border-b border-white/5 hover:bg-white/5"
                              >
                                <td className="py-2 pr-3 font-mono text-white">
                                  {entry.ip || entry.id}
                                </td>
                                <td className="py-2 pr-3 text-white">
                                  {attempts}
                                </td>
                                <td className="py-2 pr-3">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      blocked
                                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                        : "bg-green-500/20 text-green-300 border border-green-500/30"
                                    }`}
                                  >
                                    {blocked ? "Blocked" : "Clear"}
                                  </span>
                                </td>
                                <td
                                  className="py-2 pr-3 text-gray-300 max-w-[160px] truncate"
                                  title={entry.lastEmailTried || ""}
                                >
                                  {entry.lastEmailTried || "-"}
                                </td>
                                <td
                                  className="py-2 pr-3 text-gray-300 max-w-[180px] truncate"
                                  title={entry.reason || ""}
                                >
                                  {entry.reason || "-"}
                                </td>
                                <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">
                                  {blockedAt ? blockedAt.toLocaleString() : "-"}
                                </td>
                                <td className="py-2 pr-3">
                                  {blocked ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                                      onClick={async () => {
                                        if (!user) return;
                                        try {
                                          let idToken = "";
                                          try {
                                            const { auth } = await import(
                                              "../config/firebase"
                                            );
                                            const currentUser =
                                              auth?.currentUser;
                                            if (
                                              currentUser &&
                                              typeof currentUser.getIdToken ===
                                                "function"
                                            ) {
                                              idToken =
                                                await currentUser.getIdToken();
                                            }
                                          } catch (tokenError) {
                                            logger.error(
                                              "Failed to get ID token:",
                                              tokenError
                                            );
                                          }

                                          if (!idToken) {
                                            toast.error(
                                              "Unable to unblock - authentication required"
                                            );
                                            return;
                                          }

                                          const { unblockIp, listIpBlocks } =
                                            await import(
                                              "../services/security"
                                            );
                                          const ok = await unblockIp(
                                            entry.ip || entry.id,
                                            idToken
                                          );
                                          if (ok) {
                                            toast.success(
                                              `Unblocked ${
                                                entry.ip || entry.id
                                              }`
                                            );
                                            const refreshed =
                                              await listIpBlocks(idToken, {
                                                includeUnblocked: showUnblocked,
                                                page: ipBlocksPage,
                                                limit: ipBlocksLimit,
                                                search: ipBlocksSearch,
                                              });
                                            setBlockedIps(
                                              refreshed.entries.map((e) => ({
                                                id: e.id,
                                                ip: e.ip,
                                                attempts: e.attempts,
                                                blocked: e.blocked,
                                                blockedAt:
                                                  e.blockedAt as TimestampLike,
                                                reason: e.reason ?? null,
                                                lastEmailTried:
                                                  e.lastEmailTried ?? null,
                                              }))
                                            );
                                            setIpBlocksTotalPages(
                                              refreshed.totalPages
                                            );
                                            setIpBlocksTotal(refreshed.total);
                                            setIpBlocksCount(refreshed.count);
                                            setIpBlocksHasNext(
                                              refreshed.hasNext
                                            );
                                            setIpBlocksHasPrev(
                                              refreshed.hasPrev
                                            );
                                          } else {
                                            toast.error("Unblock failed");
                                          }
                                          return;
                                          // Legacy block (replaced above) retained for minimal diff; not executed due to return.
                                        } catch {
                                          toast.error("Unblock error");
                                        }
                                      }}
                                    >
                                      Unblock
                                    </Button>
                                  ) : (
                                    <span className="text-gray-500">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {/* Pagination controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3">
                        <div className="text-xs text-gray-400">
                          Page {ipBlocksPage} of {ipBlocksTotalPages || 1} •
                          Showing {ipBlocksCount} / {ipBlocksTotal} entries
                          {ipBlocksSearch && (
                            <span className="ml-1">for "{ipBlocksSearch}"</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!ipBlocksHasPrev || loadingBlockedIps}
                            className="border-white/20 text-white disabled:opacity-40"
                            onClick={() =>
                              ipBlocksHasPrev &&
                              setIpBlocksPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Prev
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!ipBlocksHasNext || loadingBlockedIps}
                            className="border-white/20 text-white disabled:opacity-40"
                            onClick={() =>
                              ipBlocksHasNext && setIpBlocksPage((p) => p + 1)
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
              <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">
                          Total Products
                        </p>
                        <p className="text-3xl font-bold text-white mb-1">
                          {totalProducts > 0 ? totalProducts : "N/A"}
                        </p>
                        <p className="text-xs text-gray-400">
                          Listed in inventory
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">
                          Monthly Visitors
                        </p>
                        <p className="text-3xl font-bold text-white mb-1">
                          {monthlyVisitors.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Page views this month
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>

                  {/* PWA Install Statistics */}
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">
                          PWA Installs
                        </p>
                        <p className="text-3xl font-bold text-white mb-1">
                          {pwaStats.installs}
                        </p>
                        <p className="text-xs text-gray-400">
                          {pwaStats.installRate}% install rate •{" "}
                          {pwaStats.dismissals} dismissed
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Download className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    {pwaStats.promptShown > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Accepted</span>
                            <span className="text-green-400 font-medium">
                              {pwaStats.installs}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Dismissed</span>
                            <span className="text-orange-400 font-medium">
                              {pwaStats.dismissals}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Total Shown</span>
                            <span className="text-gray-300 font-medium">
                              {pwaStats.promptShown}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card
                    className={`border backdrop-blur-xl p-6 ${
                      securityIssues.length > 0
                        ? "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">
                          Security Alerts
                        </p>
                        <p
                          className={`text-3xl font-bold mb-1 ${
                            securityIssues.length > 0
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {securityIssues.length}
                        </p>
                        <p className="text-xs text-gray-400">
                          {lastAdminLogin
                            ? `Since ${new Date(
                                lastAdminLogin
                              ).toLocaleDateString("en-GB")}`
                            : "Since last login"}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          securityIssues.length > 0
                            ? "bg-gradient-to-r from-red-500 to-orange-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                      >
                        <ShieldAlert className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    {securityIssues.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="space-y-2">
                          {securityIssues.slice(0, 3).map((issue) => (
                            <div
                              key={issue.id}
                              className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedSecurityAlert(issue);
                                setShowSecurityAlertModal(true);
                              }}
                            >
                              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-300">
                                  {issue.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(issue.timestamp).toLocaleString(
                                    "en-GB"
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {securityIssues.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-400 hover:text-white mt-2 w-full"
                            onClick={() => {
                              if (securityIssues.length > 0) {
                                setSelectedSecurityAlert(securityIssues[0]);
                                setShowSecurityAlertModal(true);
                              }
                            }}
                          >
                            View all {securityIssues.length} alerts
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                </div>

                {/* New Customers This Month */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">
                    Customer Acquisition - {currentMonth} 2025
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-1">
                            New Customers
                          </p>
                          <p className="text-3xl font-bold text-white mb-1">
                            {newCustomersThisMonth}
                          </p>
                          <p className="text-xs text-gray-400">
                            This month • {newCustomersThisYear} this year
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-1">
                            New Members
                          </p>
                          <p className="text-3xl font-bold text-white mb-1">
                            {newMembersThisMonth}
                          </p>
                          <p className="text-xs text-gray-400">
                            This month • {newMembersThisYear} this year
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-1">
                            New Businesses
                          </p>
                          <p className="text-3xl font-bold text-white mb-1">
                            {newBusinessesThisMonth}
                          </p>
                          <p className="text-xs text-gray-400">
                            This month • {newBusinessesThisYear} this year
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Alert Cards for Refunds and Tickets */}
                {(refundRequests.length > 0 ||
                  supportTickets.filter((t) => t.status === "open").length >
                    0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                              {refundRequests.length > 1
                                ? "s have"
                                : " has"}{" "}
                              requested refunds
                            </p>
                            <Button
                              size="sm"
                              onClick={() => setActiveTab("orders")}
                              className="bg-red-600 hover:bg-red-500"
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
                                supportTickets.filter(
                                  (t) => t.status === "open"
                                ).length
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
                              className="bg-blue-600 hover:bg-blue-500"
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
                      onClick={() => setActiveTab("orders")}
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
                    <div className="space-y-3 sm:space-y-4">
                      {recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 gap-3 sm:gap-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 flex-1 min-w-0">
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
                                {(() => {
                                  const items = order.items || [];
                                  if (!items.length) return "Custom Build";
                                  if (items.length === 1)
                                    return `${items[0].productName} (£${(
                                      items[0].price * items[0].quantity
                                    ).toFixed(2)})`;
                                  // Show first item + count of remainder
                                  const first = items[0];
                                  const remainder = items.length - 1;
                                  const firstTotal = (
                                    first.price * first.quantity
                                  ).toFixed(2);
                                  return `${first.productName} (£${firstTotal}) + ${remainder} more`;
                                })()}
                              </div>
                              <div className="text-sm text-gray-400">
                                {order.orderDate &&
                                order.orderDate instanceof Date &&
                                !isNaN(order.orderDate.getTime())
                                  ? order.orderDate.toLocaleString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-between sm:justify-start">
                            <Badge
                              className={`${getStatusColor(
                                order.status
                              )} border text-xs`}
                            >
                              {formatStatus(order.status)}
                            </Badge>
                            <div className="text-right sm:text-left">
                              <div className="font-bold text-green-400">
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
                                    <div className="text-xs text-gray-500">
                                      incl. £{shipping.toFixed(2)} shipping
                                    </div>
                                  );
                                }
                                return null;
                              })()}
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
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                              }}
                              title="View Order Details"
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Order Management
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:gap-0 w-full sm:w-auto">
                    <div className="flex items-center space-x-2 w-full sm:w-auto order-1 sm:order-none">
                      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <Input
                        placeholder="Search orders..."
                        className="bg-white/5 border-white/10 text-white w-full sm:w-64 text-sm h-9"
                      />
                    </div>
                    <div className="flex items-center gap-2 order-2 sm:order-none overflow-x-auto pb-1 sm:pb-0">
                      {(() => {
                        const c = getOrderCounts();
                        return (
                          <>
                            <Badge
                              className="bg-blue-500/20 border-blue-500/40 text-blue-300"
                              title="Total orders loaded"
                            >
                              {`Total: ${c.total}`}
                            </Badge>
                            <Badge
                              className="bg-green-500/20 border-green-500/40 text-green-300"
                              title="Primary (new schema) orders"
                            >
                              {`Primary: ${c.primary}`}
                            </Badge>
                            <Badge
                              className="bg-amber-500/20 border-amber-500/40 text-amber-300"
                              title="Legacy (older schema) orders"
                            >
                              {`Legacy: ${c.legacy}`}
                            </Badge>
                            {lastOrdersRefresh && (
                              <Badge
                                className="bg-white/10 border-white/20 text-gray-300"
                                title="Last successful refresh time (auto or manual)"
                              >
                                {lastOrdersRefresh.toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={autoRefreshEnabled ? "premium" : "outline"}
                      onClick={() => setAutoRefreshEnabled((v) => !v)}
                      className={
                        autoRefreshEnabled
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                          : "border-white/20 text-white hover:bg-white/10"
                      }
                      title="Toggle 60s auto refresh polling"
                    >
                      {autoRefreshEnabled ? "Auto: On" : "Auto: Off"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={ordersRefreshing}
                      onClick={async () => {
                        setOrdersRefreshing(true);
                        try {
                          const extended = await getAllOrdersExtended(
                            1200,
                            600
                          );
                          const normalized = dedupeOrders(
                            normalizeOrders(extended)
                          );
                          setAllOrders(normalized);
                          setRecentOrders(normalized.slice(0, 5));
                          setLastOrdersRefresh(new Date());
                          try {
                            const cachePayload = normalized.map((o) => ({
                              ...o,
                              orderDate:
                                o.orderDate instanceof Date
                                  ? o.orderDate.toISOString()
                                  : null,
                              bankTransferVerifiedAt:
                                o.bankTransferVerifiedAt instanceof Date
                                  ? o.bankTransferVerifiedAt.toISOString()
                                  : null,
                            }));
                            sessionStorage.setItem(
                              "admin_orders_cache_v1",
                              JSON.stringify(cachePayload)
                            );
                          } catch {
                            /* ignore cache save errors */
                          }
                          toast.success("Orders refreshed");
                        } catch (e) {
                          toast.error(
                            e instanceof Error ? e.message : "Refresh failed"
                          );
                        } finally {
                          setOrdersRefreshing(false);
                        }
                      }}
                      className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                      title="Fetch latest & legacy orders"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-1 ${
                          ordersRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      Refresh Orders
                    </Button>
                  </div>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                  {/* Mobile scroll hint */}
                  <div className="lg:hidden px-4 py-2 bg-sky-500/10 border-b border-sky-500/20 text-xs text-sky-300 text-center">
                    ← Scroll horizontally to view all columns →
                  </div>
                  <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                    <Table className="min-w-[900px]">
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white">
                            Order / Placed
                          </TableHead>
                          <TableHead className="text-white">Customer</TableHead>
                          <TableHead className="text-white">Product</TableHead>
                          <TableHead className="text-white">Payment</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Total</TableHead>
                          <TableHead className="text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Display all fetched orders (was limited to 20) */}
                        {allOrders.map((order) => (
                          <TableRow key={order.id} className="border-white/10">
                            <TableCell className="text-white font-medium">
                              <div className="flex flex-col">
                                <span className="font-semibold tracking-wide">
                                  {order.orderId}
                                </span>
                                <span className="text-xs text-gray-400 mt-0.5">
                                  {order.orderDate &&
                                  order.orderDate instanceof Date &&
                                  !isNaN(order.orderDate.getTime())
                                    ? order.orderDate.toLocaleString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Date pending"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-[150px]">
                                <div className="text-white truncate">
                                  {order.customerName}
                                </div>
                                <div className="text-sm text-gray-400 truncate">
                                  {order.customerEmail}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-white min-w-[200px]">
                              {order.items?.[0]?.productName || "Custom Build"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  order.paymentMethod === "card"
                                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30 whitespace-nowrap"
                                    : order.paymentMethod === "paypal"
                                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30 whitespace-nowrap"
                                    : order.paymentMethod === "bank_transfer"
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30 whitespace-nowrap"
                                    : "bg-gray-500/20 text-gray-300 border-gray-500/30 whitespace-nowrap"
                                }
                              >
                                {order.paymentMethod === "card"
                                  ? "Card"
                                  : order.paymentMethod === "paypal"
                                  ? "PayPal"
                                  : order.paymentMethod === "bank_transfer"
                                  ? "Bank Transfer"
                                  : "Unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${getStatusColor(
                                  order.status
                                )} border whitespace-nowrap`}
                              >
                                {formatStatus(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-green-400 font-bold whitespace-nowrap">
                              <div>£{order.total.toLocaleString()}</div>
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
                                    <div className="text-xs text-gray-500">
                                      incl. £{shipping.toFixed(2)} ship
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-[200px]">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10 px-2 sm:px-3"
                                  title="View Details"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowOrderModal(true);
                                  }}
                                >
                                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                                {order.paymentMethod === "bank_transfer" &&
                                  !order.bankTransferVerified && (
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold shadow-lg"
                                      onClick={async () => {
                                        try {
                                          if (!order.id) {
                                            toast.error(
                                              "Cannot verify payment: missing order ID"
                                            );
                                            return;
                                          }
                                          await verifyBankTransfer(order.id);
                                          toast.success(
                                            "Bank transfer verified - order moved to building"
                                          );
                                          setAllOrders((prev) =>
                                            prev.map((o) =>
                                              o.id === order.id
                                                ? {
                                                    ...o,
                                                    bankTransferVerified: true,
                                                    bankTransferVerifiedAt:
                                                      new Date(),
                                                    status:
                                                      o.status === "pending" ||
                                                      o.status ===
                                                        "pending_payment"
                                                        ? "building"
                                                        : o.status,
                                                    progress:
                                                      o.status === "pending" ||
                                                      o.status ===
                                                        "pending_payment"
                                                        ? 5
                                                        : o.progress,
                                                  }
                                                : o
                                            )
                                          );
                                          setRecentOrders((prev) =>
                                            prev.map((o) =>
                                              o.id === order.id
                                                ? {
                                                    ...o,
                                                    bankTransferVerified: true,
                                                    bankTransferVerifiedAt:
                                                      new Date(),
                                                    status:
                                                      o.status === "pending" ||
                                                      o.status ===
                                                        "pending_payment"
                                                        ? "building"
                                                        : o.status,
                                                    progress:
                                                      o.status === "pending" ||
                                                      o.status ===
                                                        "pending_payment"
                                                        ? 5
                                                        : o.progress,
                                                  }
                                                : o
                                            )
                                          );
                                        } catch (e) {
                                          toast.error(
                                            e instanceof Error
                                              ? e.message
                                              : "Failed to verify bank transfer"
                                          );
                                        }
                                      }}
                                      title="Confirm bank transfer received"
                                    >
                                      <ShieldCheck className="w-4 h-4 mr-1" />
                                      Verify Payment
                                    </Button>
                                  )}
                                {order.paymentMethod === "bank_transfer" &&
                                  order.bankTransferVerified && (
                                    <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                                      <ShieldCheck className="w-3 h-3 mr-1" />
                                      Verified
                                      {(() => {
                                        const formatted = formatVerifiedDate(
                                          order.bankTransferVerifiedAt as unknown
                                        );
                                        return formatted
                                          ? ` - ${formatted}`
                                          : null;
                                      })()}
                                    </Badge>
                                  )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenDeleteOrder(order)}
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                                    {formatStatus(request.status)}
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
                                    ? new Date(
                                        request.createdAt
                                      ).toLocaleString()
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
                                        className="bg-green-600 hover:bg-green-500"
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
                <ComponentErrorBoundary componentName="InventoryManager">
                  <InventoryManager />
                </ComponentErrorBoundary>
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
                              const userId = u.id;
                              if (
                                userId &&
                                u.role &&
                                u.role !== String(u.role).toLowerCase()
                              ) {
                                await updateUserProfile(userId, {
                                  role: String(u.role).toLowerCase(),
                                });
                                updated++;
                              }
                            }
                            alert(
                              `Normalized ${updated} role value(s) to lowercase`
                            );
                            // Trigger a refresh to reflect role changes (normalize orders too)
                            const orders = normalizeOrders(
                              await getAllOrders(1000)
                            );
                            const refreshed: CustomerRow[] = users
                              .filter(
                                (
                                  user
                                ): user is RawUserRecord & { id: string } =>
                                  !!user.id
                              )
                              .map((user) => {
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
                                  email: user.email || "",
                                  orders: userOrders.length,
                                  spent: totalSpent,
                                  joined: (user.createdAt as Date) || null,
                                  role: user.role
                                    ? String(user.role).toLowerCase()
                                    : "user",
                                };
                              });
                            setCustomers(refreshed);
                          } catch (e) {
                            logger.error("Role normalization failed", {
                              error: e,
                            });
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
                          logger.debug("Refreshing customers");
                          const orders = normalizeOrders(
                            await getAllOrders(1000)
                          );
                          logger.debug("Orders fetched", {
                            count: orders.length,
                          });

                          const users = await getAllUsers();
                          logger.debug("Users fetched", {
                            count: users.length,
                          });

                          if (!users || users.length === 0) {
                            logger.warn("No users returned from getAllUsers");
                            setCustomers([]);
                            return;
                          }

                          const customersWithStats: CustomerRow[] = users
                            .filter(
                              (user): user is RawUserRecord & { id: string } =>
                                !!user.id
                            )
                            .map((user) => {
                              const userOrders = orders.filter(
                                (order) => order.userId === user.id
                              );
                              const totalSpent = userOrders.reduce(
                                (sum, order) => sum + order.total,
                                0
                              );

                              logger.debug("User summary", {
                                email: user.email,
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
                                accountType:
                                  (user?.accountType as string) || "general",
                                companyName:
                                  (user?.companyName as string) || undefined,
                              };
                            });

                          setCustomers(customersWithStats);
                          logger.debug("Customers refreshed", {
                            count: customersWithStats.length,
                            customers: customersWithStats,
                          });
                        } catch (error) {
                          logger.error("Error refreshing customers", { error });
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
                      onClick={() => {
                        try {
                          exportCsv(
                            "customers.csv",
                            customers.map((c) => ({
                              id: c.id,
                              name: c.name,
                              email: c.email,
                              orders: c.orders,
                              spent: c.spent,
                              joined: c.joined
                                ? new Date(c.joined).toISOString()
                                : "",
                              accountType: c.accountType || "",
                              companyName: c.companyName || "",
                              role: c.role,
                            }))
                          );
                        } catch (e) {
                          toast.error(
                            e instanceof Error
                              ? e.message
                              : "Failed to export customers"
                          );
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        onClick={() => {
                          setShowCreateBusiness(true);
                          setCbCompanyName("");
                          setCbContactName("");
                          setCbDisplayName("");
                          setCbEmail("");
                          setCbPhone("");
                          setCbError(null);
                          setCbResetLink(null);
                        }}
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Business Account
                      </Button>
                    )}
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
                        Customer accounts will appear here once users register
                        on the site.
                      </p>
                      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-blue-300 mb-4">
                          <strong>Troubleshooting:</strong> Check the browser
                          console for Firebase logs. Users must register through
                          the site to appear here.
                        </p>
                        <Button
                          onClick={async () => {
                            logger.debug("Testing Firebase connection");
                            const users = await getAllUsers();
                            logger.debug("getAllUsers() returned", { users });
                            logger.debug("Number of users", {
                              count: users.length,
                            });
                            if (users.length > 0) {
                              logger.debug("First user", { user: users[0] });
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
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                    {/* Mobile scroll hint */}
                    <div className="lg:hidden px-4 py-2 bg-sky-500/10 border-b border-sky-500/20 text-xs text-sky-300 text-center">
                      ← Scroll horizontally to view all columns →
                    </div>
                    <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                      <Table className="min-w-[900px]">
                        <TableHeader>
                          <TableRow className="border-white/10">
                            <TableHead className="text-white">
                              Customer
                            </TableHead>
                            <TableHead className="text-white">Email</TableHead>
                            <TableHead className="text-white">Orders</TableHead>
                            <TableHead className="text-white">
                              Total Spent
                            </TableHead>
                            <TableHead className="text-white">Joined</TableHead>
                            <TableHead className="text-white">Type</TableHead>
                            <TableHead className="text-white">Role</TableHead>
                            <TableHead className="text-white">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customers.map((customer) => (
                            <TableRow
                              key={customer.id}
                              className="border-white/10"
                            >
                              <TableCell className="text-white font-medium whitespace-nowrap">
                                {customer.name}
                              </TableCell>
                              <TableCell className="text-white min-w-[200px] truncate">
                                {customer.email}
                              </TableCell>
                              <TableCell className="text-white whitespace-nowrap">
                                {customer.orders}
                              </TableCell>
                              <TableCell className="text-green-400 font-bold whitespace-nowrap">
                                £{customer.spent.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-white whitespace-nowrap">
                                {customer.joined &&
                                !isNaN(new Date(customer.joined).getTime())
                                  ? new Date(
                                      customer.joined
                                    ).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    customer.accountType === "business"
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30 border"
                                      : "bg-slate-500/20 text-slate-300 border-slate-500/30 border"
                                  }
                                  title={
                                    customer.accountType === "business" &&
                                    customer.companyName
                                      ? `Business: ${customer.companyName}`
                                      : "Member"
                                  }
                                >
                                  {customer.accountType === "business"
                                    ? "Business"
                                    : "Member"}
                                </Badge>
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
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setCustomerDraftName(customer.name || "");
                                      setCustomerDraftRole(
                                        (customer.role as "user" | "admin") ||
                                          "user"
                                      );
                                      setCustomerModalMode("view");
                                      setCustomerError(null);
                                      setCustomerSuccess(null);
                                      setShowCustomerModal(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setCustomerDraftName(customer.name || "");
                                      setCustomerDraftRole(
                                        (customer.role as "user" | "admin") ||
                                          "user"
                                      );
                                      setCustomerModalMode("edit");
                                      setCustomerError(null);
                                      setCustomerSuccess(null);
                                      setShowCustomerModal(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                                    title="Send password reset email"
                                    onClick={async () => {
                                      try {
                                        await resetPassword(customer.email);
                                        toast.success(
                                          `Password reset email sent to ${customer.email}`
                                        );
                                      } catch (err) {
                                        const errorMsg =
                                          err instanceof Error
                                            ? err.message
                                            : "Failed to send password reset email";
                                        toast.error(errorMsg);
                                      }
                                    }}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10"
                                    title="Open CRM Profile"
                                    onClick={() =>
                                      setCrmProfileCustomerId(customer.id)
                                    }
                                  >
                                    <TrendingUp className="w-4 h-4" />
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
                                              const { getIdToken } =
                                                await import("firebase/auth");
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
                                                "Content-Type":
                                                  "application/json",
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
                                            await updateUserProfile(
                                              customer.id,
                                              {
                                                role: "admin",
                                              }
                                            );
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
                                          logger.error(
                                            "Failed to promote user",
                                            {
                                              error: e,
                                            }
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
                                              const { getIdToken } =
                                                await import("firebase/auth");
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
                                                "Content-Type":
                                                  "application/json",
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
                                            await updateUserProfile(
                                              customer.id,
                                              {
                                                role: "user",
                                              }
                                            );
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
                                          logger.error(
                                            "Failed to demote user",
                                            {
                                              error: e,
                                            }
                                          );
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
                                              const { getIdToken } =
                                                await import("firebase/auth");
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
                                                "Content-Type":
                                                  "application/json",
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
                                            prev.filter(
                                              (c) => c.id !== customer.id
                                            )
                                          );

                                          alert(
                                            `Successfully deleted ${
                                              customer.email
                                            }\n\nDeleted:\n- User account\n- ${
                                              result.deleted?.orders || 0
                                            } orders\n- ${
                                              result.deleted?.supportTickets ||
                                              0
                                            } support tickets\n- ${
                                              result.deleted?.configurations ||
                                              0
                                            } configurations`
                                          );
                                        } catch (e) {
                                          logger.error(
                                            "Failed to delete user",
                                            {
                                              error: e,
                                            }
                                          );
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
                    </div>
                  </Card>
                )}

                {/* Support Tickets Section */}
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
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={async () => {
                          try {
                            const tickets = await getAllSupportTickets();
                            setSupportTickets(tickets);
                            toast.success("Tickets refreshed");
                          } catch (e) {
                            logger.error("Ticket refresh failed", { error: e });
                            toast.error("Could not refresh tickets");
                          }
                        }}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  {/* Removed verbose permission error message per request */}
                  {supportTickets.length === 0 && !supportTicketsError && (
                    <div className="text-sm text-gray-400">
                      <p className="mb-2">No support tickets yet.</p>
                      <p className="text-xs text-gray-500">
                        New customer enquiries will appear here automatically.
                      </p>
                    </div>
                  )}
                  {supportTickets.length > 0 && (
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
                                  {formatStatus(ticket.status)}
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
                                  ? new Date(ticket.createdAt).toLocaleString(
                                      "en-GB"
                                    )
                                  : "Recently"}
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col space-y-2">
                              {ticket.status === "open" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-yellow-600 hover:bg-yellow-500"
                                    onClick={async () => {
                                      if (!ticket.id) return;
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
                                    className="bg-green-600 hover:bg-green-500"
                                    onClick={async () => {
                                      if (!ticket.id) return;
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
                                  className="bg-green-600 hover:bg-green-500"
                                  onClick={async () => {
                                    if (!ticket.id) return;
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
                  )}
                </Card>
              </TabsContent>

              {/* Create Business Account Modal */}
              {/* Order Details Modal */}
              <Dialog
                open={showOrderModal}
                onOpenChange={(open) => {
                  setShowOrderModal(open);
                  if (!open) setSelectedOrder(null);
                }}
              >
                <DialogContent className="bg-slate-900/95 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                  </DialogHeader>
                  {selectedOrder ? (
                    <div className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Order ID</p>
                          <p className="text-white font-semibold break-all">
                            {selectedOrder.orderId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Customer</p>
                          <p className="text-white font-semibold">
                            {selectedOrder.customerName}
                          </p>
                          <p className="text-xs text-gray-400 break-all">
                            {selectedOrder.customerEmail}
                          </p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Status</p>
                          <Badge
                            className={`${getStatusColor(
                              selectedOrder.status
                            )} border`}
                          >
                            {formatStatus(selectedOrder.status)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total</p>
                          <div className="flex items-center gap-2">
                            <p className="text-green-400 font-bold text-lg">
                              £{selectedOrder.total.toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                              onClick={async () => {
                                const rawShipping = (
                                  selectedOrder as unknown as {
                                    shippingCost?: unknown;
                                  }
                                ).shippingCost;
                                const shipping =
                                  typeof rawShipping === "number"
                                    ? rawShipping
                                    : 0;
                                const itemsTotal =
                                  selectedOrder.items?.reduce(
                                    (sum, item) =>
                                      sum +
                                      (item.price || 0) * (item.quantity || 1),
                                    0
                                  ) || 0;
                                const correctTotal = itemsTotal + shipping;

                                if (
                                  Math.abs(selectedOrder.total - correctTotal) <
                                  0.01
                                ) {
                                  alert("Total is already correct");
                                  return;
                                }

                                if (
                                  !confirm(
                                    `Update order total from £${selectedOrder.total.toFixed(
                                      2
                                    )} to £${correctTotal.toFixed(
                                      2
                                    )}?\\n\\nItems: £${itemsTotal.toFixed(
                                      2
                                    )}\\nShipping: £${shipping.toFixed(
                                      2
                                    )}\\nNew Total: £${correctTotal.toFixed(2)}`
                                  )
                                ) {
                                  return;
                                }

                                try {
                                  if (!selectedOrder.id) {
                                    alert("Order ID not found");
                                    return;
                                  }
                                  await updateOrder(selectedOrder.id, {
                                    total: correctTotal,
                                    amount: correctTotal,
                                  } as Partial<Order>);

                                  const updatedOrder = {
                                    ...selectedOrder,
                                    total: correctTotal,
                                  };
                                  setSelectedOrder(updatedOrder as Order);

                                  // Update in lists
                                  setAllOrders((prev) =>
                                    prev.map((o) =>
                                      o.id === selectedOrder.id
                                        ? { ...o, total: correctTotal }
                                        : o
                                    )
                                  );
                                  setRecentOrders((prev) =>
                                    prev.map((o) =>
                                      o.id === selectedOrder.id
                                        ? { ...o, total: correctTotal }
                                        : o
                                    )
                                  );

                                  toast.success("Order total updated");
                                } catch (err) {
                                  console.error("Failed to update total", err);
                                  alert("Failed to update total");
                                }
                              }}
                              title="Fix total if shipping is missing"
                            >
                              Fix
                            </Button>
                          </div>
                          {(() => {
                            const rawShipping = (
                              selectedOrder as unknown as {
                                shippingCost?: unknown;
                              }
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
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">
                            Payment Method
                          </p>
                          <p className="text-white font-medium">
                            {selectedOrder.paymentMethod || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            Shipping Method
                          </p>
                          <p className="text-white font-medium">
                            {(
                              selectedOrder as unknown as {
                                shippingMethod?: string;
                              }
                            ).shippingMethod || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Updated At</p>
                          <p className="text-white font-medium">
                            {(() => {
                              const v = (
                                selectedOrder as unknown as {
                                  updatedAt?: unknown;
                                }
                              ).updatedAt;
                              try {
                                if (
                                  v &&
                                  typeof v === "object" &&
                                  "toDate" in v &&
                                  typeof (v as { toDate?: unknown }).toDate ===
                                    "function"
                                ) {
                                  const d = (
                                    v as { toDate: () => Date }
                                  ).toDate();
                                  return !isNaN(d.getTime())
                                    ? d.toLocaleDateString("en-GB")
                                    : "N/A";
                                }
                                const d =
                                  v instanceof Date
                                    ? v
                                    : v
                                    ? new Date(v as string)
                                    : null;
                                return d && !isNaN(d.getTime())
                                  ? d.toLocaleDateString("en-GB")
                                  : "N/A";
                              } catch {
                                return "N/A";
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-400">Order Notes</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const currentNotes =
                                (selectedOrder as unknown as { notes?: string })
                                  .notes || "";
                              const newNotes = prompt(
                                "Edit order notes:",
                                currentNotes
                              );
                              if (
                                newNotes !== null &&
                                newNotes !== currentNotes
                              ) {
                                try {
                                  if (!selectedOrder.id) {
                                    alert("Order ID not found");
                                    return;
                                  }
                                  await updateOrder(selectedOrder.id, {
                                    notes: newNotes,
                                  } as Partial<Order>);
                                  const updatedOrder = {
                                    ...selectedOrder,
                                    notes: newNotes,
                                  };
                                  setSelectedOrder(updatedOrder as Order);
                                  const updated = await getAllOrdersExtended();
                                  setAllOrders(updated);
                                  alert("Notes updated successfully");
                                } catch (err) {
                                  console.error("Failed to update notes", err);
                                  alert("Failed to update notes");
                                }
                              }
                            }}
                            className="border-white/20 text-white hover:bg-white/10 h-7 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <Textarea
                          value={
                            (selectedOrder as unknown as { notes?: string })
                              .notes || ""
                          }
                          readOnly
                          placeholder="No notes added yet"
                          className="bg-white/5 border-white/10 text-gray-300 min-h-[80px] text-xs"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Items</p>
                        <div className="rounded border border-white/10 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-white/5">
                              <tr>
                                <th className="text-left p-2 font-medium text-gray-300">
                                  Product
                                </th>
                                <th className="text-left p-2 font-medium text-gray-300">
                                  Qty
                                </th>
                                <th className="text-left p-2 font-medium text-gray-300">
                                  Price
                                </th>
                                <th className="text-left p-2 font-medium text-gray-300">
                                  Line Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.items?.map((it, idx) => (
                                <tr
                                  key={idx}
                                  className="border-t border-white/10"
                                >
                                  <td className="p-2 text-white">
                                    {it.productName}
                                  </td>
                                  <td className="p-2 text-gray-300">
                                    {it.quantity}
                                  </td>
                                  <td className="p-2 text-gray-300">
                                    £{it.price.toLocaleString()}
                                  </td>
                                  <td className="p-2 text-gray-300">
                                    £{(it.price * it.quantity).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                              {!selectedOrder.items?.length && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="p-3 text-center text-gray-400"
                                  >
                                    No item details available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-2">
                          Shipping Address
                        </p>
                        <div className="p-3 rounded border border-white/10 bg-white/5 text-sm text-gray-300 space-y-1">
                          <p>{selectedOrder.address?.line1}</p>
                          {selectedOrder.address?.line2 && (
                            <p>{selectedOrder.address?.line2}</p>
                          )}
                          <p>{selectedOrder.address?.city}</p>
                          <p>{selectedOrder.address?.postcode}</p>
                          <p>{selectedOrder.address?.country}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-400">
                            Shipping Tracking
                          </p>
                          {!editingShipping && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                              onClick={() => {
                                setEditingShipping(true);
                                setShippingTrackingNumber(
                                  selectedOrder.trackingNumber || ""
                                );
                                setShippingCourier(selectedOrder.courier || "");
                              }}
                            >
                              {selectedOrder.trackingNumber
                                ? "Edit"
                                : "Add Tracking"}
                            </Button>
                          )}
                        </div>
                        {editingShipping ? (
                          <div className="space-y-3 p-3 rounded border border-white/10 bg-white/5">
                            <div>
                              <Label className="text-xs text-gray-400 mb-1">
                                Courier
                              </Label>
                              <select
                                value={shippingCourier}
                                onChange={(e) =>
                                  setShippingCourier(e.target.value)
                                }
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white [&>option]:bg-gray-900 [&>option]:text-white"
                              >
                                <option value="">Select Courier</option>
                                <option value="Royal Mail">Royal Mail</option>
                                <option value="DPD">DPD</option>
                                <option value="DHL">DHL</option>
                                <option value="Evri">Evri (Hermes)</option>
                                <option value="Yodel">Yodel</option>
                                <option value="UPS">UPS</option>
                                <option value="FedEx">FedEx</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-400 mb-1">
                                Tracking Number
                              </Label>
                              <Input
                                value={shippingTrackingNumber}
                                onChange={(e) =>
                                  setShippingTrackingNumber(e.target.value)
                                }
                                placeholder="Enter tracking number"
                                className="bg-white/5 border-white/10 text-white text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                                onClick={async () => {
                                  if (selectedOrder?.id) {
                                    try {
                                      await updateOrder(selectedOrder.id, {
                                        trackingNumber: shippingTrackingNumber,
                                        courier: shippingCourier,
                                      });
                                      setSelectedOrder({
                                        ...selectedOrder,
                                        trackingNumber: shippingTrackingNumber,
                                        courier: shippingCourier,
                                      });
                                      setEditingShipping(false);
                                      // Refresh orders list
                                      const updatedOrders = await getAllOrders(
                                        100
                                      );
                                      setAllOrders(updatedOrders);
                                    } catch (error) {
                                      console.error(
                                        "Failed to update shipping:",
                                        error
                                      );
                                    }
                                  }
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => setEditingShipping(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded border border-white/10 bg-white/5 text-sm text-gray-300 space-y-1">
                            {selectedOrder.trackingNumber ? (
                              <>
                                <p className="text-xs text-gray-400">Courier</p>
                                <p className="text-white font-medium">
                                  {selectedOrder.courier || "Not specified"}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  Tracking Number
                                </p>
                                <p className="text-white font-mono">
                                  {selectedOrder.trackingNumber}
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-400 italic">
                                No tracking information
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
                          onClick={() => setShowProductionSheet(true)}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print Production Sheet
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => setShowOrderModal(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">No order selected</div>
                  )}
                </DialogContent>
              </Dialog>

              {/* CRM Customer Profile Overlay */}
              {crmProfileCustomerId && (
                <CustomerProfile
                  customerId={crmProfileCustomerId}
                  onClose={() => setCrmProfileCustomerId(null)}
                />
              )}

              {/* Production Sheet Modal */}
              <Dialog
                open={showProductionSheet}
                onOpenChange={(open) => {
                  setShowProductionSheet(open);
                  if (!open) setShowProductionSheet(false);
                }}
              >
                <DialogContent className="bg-white text-black w-[95vw] sm:w-[90vw] max-w-[900px] max-h-[90vh] overflow-y-auto">
                  {selectedOrder && <ProductionSheet order={selectedOrder} />}
                </DialogContent>
              </Dialog>

              <Dialog
                open={showCreateBusiness}
                onOpenChange={setShowCreateBusiness}
              >
                <DialogContent className="bg-slate-900/95 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Create Business Customer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Company Name</Label>
                        <Input
                          value={cbCompanyName}
                          onChange={(e) => setCbCompanyName(e.target.value)}
                          placeholder="Example Business Ltd"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Contact Name</Label>
                        <Input
                          value={cbContactName}
                          onChange={(e) => setCbContactName(e.target.value)}
                          placeholder="Jane Doe"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Display Name</Label>
                        <Input
                          value={cbDisplayName}
                          onChange={(e) => setCbDisplayName(e.target.value)}
                          placeholder="Example Business"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Email</Label>
                        <Input
                          type="email"
                          value={cbEmail}
                          onChange={(e) => setCbEmail(e.target.value)}
                          placeholder="accounts@example.com"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white">Phone (optional)</Label>
                      <Input
                        value={cbPhone}
                        onChange={(e) => setCbPhone(e.target.value)}
                        placeholder="+44 1234 567890"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="p-3 rounded-lg border border-white/10 bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-white">
                          Set password now (no email link)
                        </Label>
                        <input
                          type="checkbox"
                          checked={cbSetPasswordNow}
                          onChange={(e) =>
                            setCbSetPasswordNow(e.target.checked)
                          }
                        />
                      </div>
                      {cbSetPasswordNow && (
                        <div className="mt-3">
                          <Label className="text-white">
                            Temporary password
                          </Label>
                          <Input
                            type="text"
                            value={cbTempPassword}
                            onChange={(e) => setCbTempPassword(e.target.value)}
                            placeholder="Set a temporary password"
                            className="bg-white/5 border-white/10 text-white"
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            The password will be set immediately. It is not
                            emailed — share it securely with the customer and
                            ask them to change it after logging in.
                          </p>
                        </div>
                      )}
                    </div>
                    {cbError && (
                      <div className="text-red-400 text-sm">{cbError}</div>
                    )}
                    {cbSetPasswordNow && !cbResetLink ? (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                        <p className="text-blue-300 text-sm">
                          Password set for {cbEmail}. No email link was sent.
                          Share the temporary password securely and advise
                          changing it after first login.
                        </p>
                      </div>
                    ) : null}
                    {cbResetLink ? (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                        <p className="text-green-300 font-semibold mb-2">
                          Business account created
                        </p>
                        <p className="text-sm text-gray-300 mb-2">
                          Password setup link (send to customer):
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            value={cbResetLink}
                            className="bg-white/5 border-white/10 text-white"
                          />
                          <Button
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() =>
                              navigator.clipboard.writeText(cbResetLink!)
                            }
                          >
                            Copy
                          </Button>
                        </div>
                        {cbEmailSent !== null && (
                          <div className="mt-3 text-sm">
                            {cbEmailSent ? (
                              <span className="text-green-300">
                                Email sent automatically to{" "}
                                {cbEmail && <strong>{cbEmail}</strong>}
                              </span>
                            ) : (
                              <span className="text-yellow-300">
                                Email not sent automatically
                                {cbEmailError ? `: ${cbEmailError}` : "."}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => setShowCreateBusiness(false)}
                      disabled={cbSubmitting}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={async () => {
                        setCbError(null);
                        setCbSubmitting(true);
                        setCbResetLink(null);
                        try {
                          if (
                            !cbCompanyName ||
                            !cbContactName ||
                            !cbDisplayName ||
                            !cbEmail
                          ) {
                            setCbError("Please fill all required fields");
                            setCbSubmitting(false);
                            return;
                          }
                          // Acquire ID token for admin
                          let idToken: string | null = null;
                          try {
                            const { auth } = await import("../config/firebase");
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
                            // ignore token retrieval failures; backend will validate admin
                          }
                          const res = await fetch(
                            "/api/admin/users/create-business",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                ...(idToken
                                  ? { Authorization: `Bearer ${idToken}` }
                                  : {}),
                              },
                              body: JSON.stringify({
                                companyName: cbCompanyName,
                                contactName: cbContactName,
                                displayName: cbDisplayName,
                                email: cbEmail,
                                phone: cbPhone,
                                ...(cbSetPasswordNow && cbTempPassword
                                  ? { tempPassword: cbTempPassword }
                                  : {}),
                              }),
                            }
                          );
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(
                              err?.message ||
                                "Failed to create business account"
                            );
                          }
                          const data = await res.json();
                          setCbResetLink(data.resetLink || null);
                          if (data.passwordSet) {
                            // If password was set, we won't have a link; ensure state reflects that
                            setCbResetLink(null);
                          }
                          setCbEmailSent(!!data.emailSent);
                          setCbEmailError(data.emailError || null);
                          if (data.emailSent) {
                            toast.success("Welcome email sent");
                          }
                        } catch (e) {
                          const msg =
                            e instanceof Error
                              ? e.message
                              : "Failed to create business account";
                          setCbError(msg);
                        } finally {
                          setCbSubmitting(false);
                        }
                      }}
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                      disabled={cbSubmitting}
                    >
                      {cbSubmitting ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Customer Details / Edit Modal */}
              <Dialog
                open={showCustomerModal}
                onOpenChange={(open) => {
                  setShowCustomerModal(open);
                  if (!open) {
                    setSelectedCustomer(null);
                    setCustomerError(null);
                    setCustomerEditing(false);
                  }
                }}
              >
                <DialogContent className="bg-slate-900/95 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {customerModalMode === "edit"
                        ? "Edit Customer"
                        : "Customer Details"}
                    </DialogTitle>
                  </DialogHeader>
                  {selectedCustomer ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Name</Label>
                        <Input
                          value={customerDraftName}
                          onChange={(e) => setCustomerDraftName(e.target.value)}
                          disabled={customerModalMode === "view"}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Email</Label>
                        <Input
                          value={selectedCustomer.email}
                          readOnly
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Orders</Label>
                          <Input
                            value={String(selectedCustomer.orders)}
                            readOnly
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Total Spent</Label>
                          <Input
                            value={`£${selectedCustomer.spent.toLocaleString()}`}
                            readOnly
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Joined</Label>
                          <Input
                            value={
                              selectedCustomer.joined &&
                              !isNaN(
                                new Date(selectedCustomer.joined).getTime()
                              )
                                ? new Date(
                                    selectedCustomer.joined
                                  ).toLocaleDateString("en-GB")
                                : "N/A"
                            }
                            readOnly
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Role</Label>
                          {customerModalMode === "edit" ? (
                            <Select
                              value={customerDraftRole}
                              onValueChange={(v) =>
                                setCustomerDraftRole(v as "user" | "admin")
                              }
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-white/10">
                                <SelectItem value="user">user</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={selectedCustomer.role}
                              readOnly
                              className="bg-white/5 border-white/10 text-white"
                            />
                          )}
                        </div>
                      </div>

                      {/* Password Reset Section */}
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <Label className="text-white">Password Reset</Label>
                            <p className="text-xs text-gray-400 mt-1">
                              Send a password reset email to this user
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                            disabled={resettingPassword || customerEditing}
                            onClick={async () => {
                              if (!selectedCustomer?.email) return;
                              setResettingPassword(true);
                              setCustomerError(null);
                              setCustomerSuccess(null);
                              try {
                                await resetPassword(selectedCustomer.email);
                                setCustomerSuccess(
                                  `Password reset email sent to ${selectedCustomer.email}`
                                );
                                toast.success("Password reset email sent!");
                              } catch (err) {
                                const errorMsg =
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to send password reset email";
                                setCustomerError(errorMsg);
                                toast.error(errorMsg);
                              } finally {
                                setResettingPassword(false);
                              }
                            }}
                          >
                            {resettingPassword ? (
                              <>Sending...</>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Reset Email
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {customerSuccess && (
                        <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded p-3">
                          {customerSuccess}
                        </div>
                      )}
                      {customerError && (
                        <div className="text-sm text-red-400">
                          {customerError}
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => setShowCustomerModal(false)}
                          disabled={customerEditing}
                        >
                          Close
                        </Button>
                        {customerModalMode === "view" ? (
                          <Button
                            onClick={() => setCustomerModalMode("edit")}
                            className="bg-sky-600 hover:bg-sky-500"
                          >
                            Edit
                          </Button>
                        ) : (
                          <Button
                            disabled={customerEditing}
                            onClick={async () => {
                              if (!selectedCustomer) return;
                              setCustomerEditing(true);
                              setCustomerError(null);
                              try {
                                // Update name if changed
                                if (
                                  customerDraftName &&
                                  customerDraftName !== selectedCustomer.name
                                ) {
                                  await updateUserProfile(selectedCustomer.id, {
                                    displayName: customerDraftName,
                                  });
                                }

                                // Update role if changed
                                if (
                                  (selectedCustomer.role as
                                    | "user"
                                    | "admin") !== customerDraftRole
                                ) {
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
                                    /* ignore */
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
                                        userId: selectedCustomer.id,
                                        role: customerDraftRole,
                                      }),
                                    }
                                  );
                                  if (!res.ok) {
                                    // Fallback to client-side profile doc
                                    await updateUserProfile(
                                      selectedCustomer.id,
                                      {
                                        role: customerDraftRole,
                                      }
                                    );
                                  }
                                }

                                // Reflect changes in table
                                setCustomers((prev) =>
                                  prev.map((c) =>
                                    c.id === selectedCustomer.id
                                      ? {
                                          ...c,
                                          name: customerDraftName || c.name,
                                          role: customerDraftRole,
                                        }
                                      : c
                                  )
                                );
                                setShowCustomerModal(false);
                                toast.success("Customer updated");
                              } catch (e) {
                                setCustomerError(
                                  e instanceof Error
                                    ? e.message
                                    : "Failed to update customer"
                                );
                              } finally {
                                setCustomerEditing(false);
                              }
                            }}
                            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                          >
                            {customerEditing ? "Saving..." : "Save Changes"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">No customer selected</div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Support Tickets Tab */}
              <TabsContent value="support" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Support Tickets
                    </h3>
                    <p className="text-gray-400 mt-1">
                      Manage customer support requests and tickets
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        <SelectItem value="all">All Tickets</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const tickets = await getAllSupportTickets();
                          setSupportTickets(tickets);
                        } catch (error) {
                          logger.error("Error refreshing tickets", { error });
                        }
                      }}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Support Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Tickets</p>
                        <p className="text-2xl font-bold text-white">
                          {supportTickets.length}
                        </p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-sky-400" />
                    </div>
                  </Card>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Open</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {
                            supportTickets.filter((t) => t.status === "open")
                              .length
                          }
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-400" />
                    </div>
                  </Card>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">In Progress</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {
                            supportTickets.filter(
                              (t) => t.status === "in-progress"
                            ).length
                          }
                        </p>
                      </div>
                      <Loader2 className="w-8 h-8 text-blue-400" />
                    </div>
                  </Card>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Closed</p>
                        <p className="text-2xl font-bold text-green-400">
                          {
                            supportTickets.filter((t) => t.status === "closed")
                              .length
                          }
                        </p>
                      </div>
                      <Shield className="w-8 h-8 text-green-400" />
                    </div>
                  </Card>
                </div>

                {/* Tickets Table */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Support Tickets
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-gray-300">ID</TableHead>
                            <TableHead className="text-gray-300">
                              Subject
                            </TableHead>
                            <TableHead className="text-gray-300">
                              User
                            </TableHead>
                            <TableHead className="text-gray-300">
                              Type
                            </TableHead>
                            <TableHead className="text-gray-300">
                              Priority
                            </TableHead>
                            <TableHead className="text-gray-300">
                              Status
                            </TableHead>
                            <TableHead className="text-gray-300">
                              Created
                            </TableHead>
                            <TableHead className="text-gray-300">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {supportTickets.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                className="text-center text-gray-400 py-8"
                              >
                                No support tickets found
                              </TableCell>
                            </TableRow>
                          ) : (
                            supportTickets.map((ticket) => (
                              <TableRow
                                key={ticket.id}
                                className="border-white/10 hover:bg-white/5"
                              >
                                <TableCell className="text-gray-300 font-mono text-xs">
                                  {ticket.id?.substring(0, 8)}...
                                </TableCell>
                                <TableCell className="text-white font-medium">
                                  {ticket.subject || "Untitled"}
                                </TableCell>
                                <TableCell className="text-gray-300">
                                  {ticket.email || "Unknown"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="border-sky-500/40 text-sky-400 bg-sky-500/10"
                                  >
                                    {ticket.type || "general"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      ticket.priority === "high" ||
                                      ticket.priority === "urgent"
                                        ? "border-red-500/40 text-red-400 bg-red-500/10"
                                        : ticket.priority === "normal"
                                        ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                                        : "border-green-500/40 text-green-400 bg-green-500/10"
                                    }
                                  >
                                    {ticket.priority || "low"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      ticket.status === "open"
                                        ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                                        : ticket.status === "in-progress"
                                        ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                                        : "border-green-500/40 text-green-400 bg-green-500/10"
                                    }
                                  >
                                    {formatStatus(ticket.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-400 text-sm">
                                  {ticket.createdAt &&
                                  !isNaN(new Date(ticket.createdAt).getTime())
                                    ? new Date(
                                        ticket.createdAt
                                      ).toLocaleDateString("en-GB")
                                    : "Recently"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {ticket.status === "open" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                                        onClick={async () => {
                                          if (!ticket.id) return;
                                          try {
                                            await updateSupportTicket(
                                              ticket.id,
                                              {
                                                status: "in-progress",
                                              }
                                            );
                                            const tickets =
                                              await getAllSupportTickets();
                                            setSupportTickets(tickets);
                                          } catch {
                                            alert("Failed to update ticket");
                                          }
                                        }}
                                      >
                                        Start
                                      </Button>
                                    )}
                                    {ticket.status !== "closed" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-green-500/40 text-green-400 hover:bg-green-500/10"
                                        onClick={async () => {
                                          if (!ticket.id) return;
                                          try {
                                            await updateSupportTicket(
                                              ticket.id,
                                              {
                                                status: "closed",
                                              }
                                            );
                                            const tickets =
                                              await getAllSupportTickets();
                                            setSupportTickets(tickets);
                                          } catch {
                                            alert("Failed to update ticket");
                                          }
                                        }}
                                      >
                                        Close
                                      </Button>
                                    )}
                                    {ticket.status === "closed" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                                        onClick={async () => {
                                          if (!ticket.id) return;
                                          if (
                                            !confirm(
                                              "Delete this closed ticket permanently? This cannot be undone."
                                            )
                                          )
                                            return;
                                          try {
                                            // Acquire ID token for admin
                                            let idToken: string | null = null;
                                            try {
                                              const { auth } = await import(
                                                "../config/firebase"
                                              );
                                              if (auth?.currentUser) {
                                                const { getIdToken } =
                                                  await import("firebase/auth");
                                                idToken = await getIdToken(
                                                  auth.currentUser,
                                                  true
                                                );
                                              }
                                            } catch {
                                              /* ignore */
                                            }

                                            const res = await fetch(
                                              "/api/admin/support/delete",
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                  ...(idToken
                                                    ? {
                                                        Authorization: `Bearer ${idToken}`,
                                                      }
                                                    : {}),
                                                },
                                                body: JSON.stringify({
                                                  ticketId: ticket.id,
                                                }),
                                              }
                                            );
                                            if (!res.ok) {
                                              let errMsg =
                                                "Failed to delete ticket";
                                              try {
                                                const err = await res.json();
                                                if (
                                                  err &&
                                                  typeof err.message ===
                                                    "string"
                                                ) {
                                                  errMsg = err.message;
                                                }
                                              } catch {
                                                // ignore JSON parse errors
                                              }
                                              throw new Error(errMsg);
                                            }

                                            // Remove from local state
                                            setSupportTickets((prev) =>
                                              prev.filter(
                                                (t) => t.id !== ticket.id
                                              )
                                            );
                                          } catch (e) {
                                            alert(
                                              e instanceof Error
                                                ? e.message
                                                : "Failed to delete ticket"
                                            );
                                          }
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
                                      onClick={() => {
                                        setSelectedTicket(ticket);
                                        setShowTicketDetailModal(true);
                                      }}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Monitoring Tab */}
              <TabsContent value="monitoring" className="space-y-6">
                <MonitoringDashboard />
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <PerformanceDashboard />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsDashboard />
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-6">
                <RecommendationsTab />
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <ReportBuilder />
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
                        <p className="text-2xl font-bold text-white">N/A</p>
                      </div>
                      <Package className="w-8 h-8 text-sky-400" />
                    </div>
                  </Card>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Categories</p>
                        <p className="text-2xl font-bold text-white">N/A</p>
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
                        <p className="text-2xl font-bold text-white">N/A</p>
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
                        className="flex-1 bg-sky-600 hover:bg-sky-500"
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
                        className="flex-1 bg-purple-600 hover:bg-purple-500"
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
                        className="flex-1 bg-green-600 hover:bg-green-500"
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
                        className="flex-1 bg-orange-600 hover:bg-orange-500"
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
                        className="flex-1 bg-yellow-600 hover:bg-yellow-500"
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

                  {/* Payment Settings */}
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-sky-500/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Active
                      </Badge>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">
                      Payment Settings
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">
                      Edit Bank Transfer details shown at checkout
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setShowPaymentSettingsModal(true)}
                        size="sm"
                        className="flex-1 bg-sky-600 hover:bg-sky-500"
                      >
                        <Landmark className="w-4 h-4 mr-2" /> Configure
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
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500"
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
                        window.open(
                          "https://www.contentful.com/help/",
                          "_blank"
                        )
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
              {/* Bulk Email / Marketing Tab */}
              <TabsContent value="email" className="space-y-6">
                {!isAdmin && (
                  <Card className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border-amber-500/30 backdrop-blur-xl p-4">
                    <div className="text-sm text-amber-300">
                      Admin access required to send bulk emails and manage
                      marketing.
                    </div>
                  </Card>
                )}
                {isAdmin && (
                  <Tabs defaultValue="email" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5 bg-white/5 border-white/10">
                      <TabsTrigger
                        value="email"
                        className="data-[state=active]:bg-white/10 text-white"
                      >
                        Bulk Email
                      </TabsTrigger>
                      <TabsTrigger
                        value="campaigns"
                        className="data-[state=active]:bg-white/10 text-white"
                      >
                        Campaigns
                      </TabsTrigger>
                      <TabsTrigger
                        value="discounts"
                        className="data-[state=active]:bg-white/10 text-white"
                      >
                        Discount Codes
                      </TabsTrigger>
                      <TabsTrigger
                        value="banners"
                        className="data-[state=active]:bg-white/10 text-white"
                      >
                        Banners
                      </TabsTrigger>
                      <TabsTrigger
                        value="competitors"
                        className="data-[state=active]:bg-white/10 text-white"
                      >
                        Competitors
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-white">
                              Send Email
                            </h3>
                            <p className="text-gray-400 mt-1 max-w-xl">
                              Compose and send a branded email to all registered
                              customers or a specific list. Images you upload
                              are hosted and inserted automatically.
                            </p>
                          </div>
                        </div>
                        <EmailComposer customers={customers} />
                      </div>
                    </TabsContent>

                    <TabsContent value="campaigns">
                      <CampaignManager />
                    </TabsContent>

                    <TabsContent value="discounts">
                      <DiscountCodeGenerator />
                    </TabsContent>

                    <TabsContent value="banners">
                      <PromotionalBanners />
                    </TabsContent>

                    <TabsContent value="competitors">
                      <CompetitorTracking />
                    </TabsContent>
                  </Tabs>
                )}
              </TabsContent>

              {/* Search Analytics Tab */}
              <TabsContent value="search" className="space-y-6">
                <SearchAnalytics />
              </TabsContent>
            </Tabs>

            {/* Unblock & Whitelist IP Modals */}
            {isAdmin && (
              <>
                <Dialog
                  open={showUnblockModal}
                  onOpenChange={setShowUnblockModal}
                >
                  <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-sky-500/30 backdrop-blur-2xl w-[95vw] sm:w-[90vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Unblock IP Address
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Label htmlFor="unblock-ip" className="text-gray-300">
                        IP address
                      </Label>
                      <Input
                        id="unblock-ip"
                        placeholder="e.g. 203.0.113.42"
                        value={unblockIpInput}
                        onChange={(e) => setUnblockIpInput(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      {unblockMsg && (
                        <p className="text-sm text-gray-300">{unblockMsg}</p>
                      )}
                      <div className="flex gap-2 justify-end pt-2">
                        <Button
                          variant="outline"
                          className="border-white/20 text-white"
                          onClick={() => setShowUnblockModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={!unblockIpInput || unblockBusy}
                          className="bg-gradient-to-r from-sky-600 to-blue-600"
                          onClick={async () => {
                            if (!unblockIpInput) return;
                            try {
                              setUnblockBusy(true);
                              setUnblockMsg(null);
                              // get ID token of current user
                              const tokenSource = user as unknown as HasToken;
                              const idToken = tokenSource.getIdToken
                                ? await tokenSource.getIdToken()
                                : "";
                              if (!idToken) {
                                setUnblockMsg(
                                  "Not authenticated – please re-login as admin."
                                );
                                setUnblockBusy(false);
                                return;
                              }
                              const { unblockIp } = await import(
                                "../services/security"
                              );
                              const ok = await unblockIp(
                                unblockIpInput.trim(),
                                idToken
                              );
                              setUnblockMsg(
                                ok
                                  ? "IP unblocked successfully."
                                  : "Failed to unblock IP."
                              );
                              if (ok) {
                                setTimeout(
                                  () => setShowUnblockModal(false),
                                  800
                                );
                              }
                            } catch (e) {
                              setUnblockMsg(
                                e instanceof Error
                                  ? e.message
                                  : "Unexpected error"
                              );
                            } finally {
                              setUnblockBusy(false);
                            }
                          }}
                        >
                          {unblockBusy ? "Unblocking…" : "Unblock"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Whitelist IP Dialog */}
                <Dialog
                  open={showWhitelistModal}
                  onOpenChange={setShowWhitelistModal}
                >
                  <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-green-500/30 backdrop-blur-2xl w-[95vw] sm:w-[90vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Whitelist IP Address
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="whitelist-ip" className="text-gray-300">
                          IP address
                        </Label>
                        <Input
                          id="whitelist-ip"
                          placeholder="e.g. 203.0.113.42"
                          value={whitelistIpInput}
                          onChange={(e) => setWhitelistIpInput(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="whitelist-reason"
                          className="text-gray-300"
                        >
                          Reason (optional)
                        </Label>
                        <Input
                          id="whitelist-reason"
                          placeholder="e.g. Trusted admin IP"
                          value={whitelistReasonInput}
                          onChange={(e) =>
                            setWhitelistReasonInput(e.target.value)
                          }
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      {whitelistMsg && (
                        <p className="text-sm text-gray-300">{whitelistMsg}</p>
                      )}
                      <div className="flex gap-2 justify-end pt-2">
                        <Button
                          variant="outline"
                          className="border-white/20 text-white"
                          onClick={() => setShowWhitelistModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={!whitelistIpInput || whitelistBusy}
                          className="bg-gradient-to-r from-green-600 to-emerald-600"
                          onClick={async () => {
                            if (!whitelistIpInput) return;
                            try {
                              setWhitelistBusy(true);
                              setWhitelistMsg(null);
                              const tokenSource = user as unknown as HasToken;
                              const idToken = tokenSource.getIdToken
                                ? await tokenSource.getIdToken()
                                : "";
                              if (!idToken) {
                                setWhitelistMsg(
                                  "Not authenticated – please re-login as admin."
                                );
                                setWhitelistBusy(false);
                                return;
                              }
                              const { whitelistIp } = await import(
                                "../services/security"
                              );
                              const ok = await whitelistIp(
                                whitelistIpInput.trim(),
                                idToken,
                                whitelistReasonInput.trim() || undefined
                              );
                              setWhitelistMsg(
                                ok
                                  ? "IP whitelisted successfully. This IP will never be blocked."
                                  : "Failed to whitelist IP."
                              );
                              if (ok) {
                                setTimeout(() => {
                                  setShowWhitelistModal(false);
                                  // Refresh the IP blocks list
                                  window.location.reload();
                                }, 1200);
                              }
                            } catch (e) {
                              setWhitelistMsg(
                                e instanceof Error
                                  ? e.message
                                  : "Unexpected error"
                              );
                            } finally {
                              setWhitelistBusy(false);
                            }
                          }}
                        >
                          {whitelistBusy ? "Adding to Whitelist…" : "Whitelist"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* Add Product Dialog */}
            <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
              <DialogContent className="bg-slate-900 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-2xl">
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
                          <SelectItem value="motherboard">
                            Motherboard
                          </SelectItem>
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
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500">
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
              <DialogContent className="bg-slate-900 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-6xl max-h-[80vh] overflow-y-auto">
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
                        <p className="text-gray-400 text-sm">
                          Avg. Daily Views
                        </p>
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {analyticsData.averagePageViewsPerDay.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Views per day
                      </p>
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
                          Analytics data is automatically tracked when users
                          visit your site. The data updates in real-time from
                          Firebase Firestore. For more advanced analytics, click
                          the external link to open Firebase Analytics console.
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
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Firebase Console
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Site Settings Modal */}
            <Dialog
              open={showSettingsModal}
              onOpenChange={setShowSettingsModal}
            >
              <DialogContent className="bg-slate-900 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-4xl max-h-[80vh] overflow-y-auto">
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
                        <Label className="text-white mb-2 block">
                          Site Name
                        </Label>
                        <Input
                          value={metaTags.siteName}
                          onChange={(e) =>
                            setMetaTags({
                              ...metaTags,
                              siteName: e.target.value,
                            })
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
                            setMetaTags({
                              ...metaTags,
                              ogImage: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="https://vortexpcs.com/og-image.jpg"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Image displayed when sharing on Facebook, LinkedIn,
                          etc. (1200x630px recommended)
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
                      These META tags will be applied to your site. Copy this
                      code to your index.html file or use a META tag manager.
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
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
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
                      className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Contentful
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Payment Settings Modal */}
            <Dialog
              open={showPaymentSettingsModal}
              onOpenChange={setShowPaymentSettingsModal}
            >
              <DialogContent className="bg-slate-900 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <span>Bank Transfer Settings</span>
                  </DialogTitle>
                  <p className="text-gray-400 mt-2">
                    These details are displayed on the checkout when customers
                    choose Bank Transfer.
                  </p>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-white mb-1 block">
                      Account Name
                    </Label>
                    <Input
                      value={btDraft.accountName}
                      onChange={(e) =>
                        setBtDraft((v) => ({
                          ...v,
                          accountName: e.target.value,
                        }))
                      }
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-1 block">Bank Name</Label>
                    <Input
                      value={btDraft.bankName}
                      onChange={(e) =>
                        setBtDraft((v) => ({ ...v, bankName: e.target.value }))
                      }
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white mb-1 block">Sort Code</Label>
                      <Input
                        value={btDraft.sortCode}
                        onChange={(e) =>
                          setBtDraft((v) => ({
                            ...v,
                            sortCode: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white mb-1 block">
                        Account Number
                      </Label>
                      <Input
                        value={btDraft.accountNumber}
                        onChange={(e) =>
                          setBtDraft((v) => ({
                            ...v,
                            accountNumber: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white mb-1 block">
                        IBAN (optional)
                      </Label>
                      <Input
                        value={btDraft.iban}
                        onChange={(e) =>
                          setBtDraft((v) => ({ ...v, iban: e.target.value }))
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white mb-1 block">
                        BIC/SWIFT (optional)
                      </Label>
                      <Input
                        value={btDraft.bic}
                        onChange={(e) =>
                          setBtDraft((v) => ({ ...v, bic: e.target.value }))
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white mb-1 block">
                      Reference Note
                    </Label>
                    <Input
                      value={btDraft.referenceNote}
                      onChange={(e) =>
                        setBtDraft((v) => ({
                          ...v,
                          referenceNote: e.target.value,
                        }))
                      }
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-1 block">
                      Additional Instructions
                    </Label>
                    <Textarea
                      value={btDraft.instructions}
                      onChange={(e) =>
                        setBtDraft((v) => ({
                          ...v,
                          instructions: e.target.value,
                        }))
                      }
                      className="bg-white/5 border-white/10 text-white min-h-[90px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <Button
                    variant="outline"
                    className="border-white/20"
                    onClick={() => setShowPaymentSettingsModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        if (!user) return;
                        type HasToken = { getIdToken?: () => Promise<string> };
                        const tokenSource = user as unknown as HasToken;
                        const token = tokenSource.getIdToken
                          ? await tokenSource.getIdToken()
                          : "";
                        const {
                          updateBankTransferSettings,
                          fetchBankTransferSettings,
                        } = await import("../services/settings");
                        const ok = await updateBankTransferSettings(
                          btDraft,
                          token
                        );
                        if (ok) {
                          const latest = await fetchBankTransferSettings();
                          setBtDraft({
                            accountName: latest.accountName || "",
                            bankName: latest.bankName || "",
                            sortCode: latest.sortCode || "",
                            accountNumber: latest.accountNumber || "",
                            iban: latest.iban || "",
                            bic: latest.bic || "",
                            referenceNote: latest.referenceNote || "",
                            instructions: latest.instructions || "",
                          });
                          alert("Payment settings saved.");
                          setShowPaymentSettingsModal(false);
                        } else {
                          alert("Save failed. Please try again.");
                        }
                      } catch (e) {
                        alert(e instanceof Error ? e.message : "Save failed");
                      }
                    }}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  >
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Build Progress Update Modal */}
            <Dialog
              open={showBuildProgressModal}
              onOpenChange={setShowBuildProgressModal}
            >
              <DialogContent className="bg-slate-900 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-2xl">
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
                                ).toLocaleDateString("en-GB")
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
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Update Progress
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Order Confirmation Modal */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogContent className="bg-zinc-900 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <span>Delete Order</span>
                  </DialogTitle>
                </DialogHeader>
                {orderToDelete && (
                  <div className="space-y-4 mt-4">
                    <Card className="bg-white/5 border-white/10 p-4">
                      <p className="text-sm text-gray-300">
                        You are about to permanently delete order
                        <span className="font-semibold text-white ml-1">
                          #{orderToDelete.orderId}
                        </span>
                        . This action cannot be undone.
                      </p>
                      <div className="mt-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Customer:</span>
                          <span className="text-white">
                            {orderToDelete.customerName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-white">
                            {orderToDelete.customerEmail}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total:</span>
                          <span className="text-green-400 font-bold">
                            £{orderToDelete.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/30 p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <h4 className="text-white font-semibold mb-1">
                            Irreversible Action
                          </h4>
                          <p className="text-red-200 text-xs">
                            The order document will be removed from the live
                            database. An audit snapshot is stored in{" "}
                            <code className="font-mono">deleted_orders</code>{" "}
                            for compliance.
                          </p>
                        </div>
                      </div>
                    </Card>
                    <label className="flex items-center space-x-3 text-sm text-gray-300 select-none">
                      <input
                        type="checkbox"
                        checked={cascadeRefunds}
                        onChange={(e) => setCascadeRefunds(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-white/10"
                      />
                      <span>
                        Also reject any pending refund requests for this order
                      </span>
                    </label>
                    <div className="flex justify-end space-x-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (deleteLoading) return;
                          setDeleteOpen(false);
                          setOrderToDelete(null);
                        }}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmDelete}
                        disabled={deleteLoading}
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50"
                      >
                        {deleteLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        {deleteLoading ? "Deleting..." : "Delete Order"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Ticket Detail Modal */}
            <Dialog
              open={showTicketDetailModal}
              onOpenChange={setShowTicketDetailModal}
            >
              <DialogContent className="bg-zinc-900 border-white/10 text-white w-[95vw] sm:w-[90vw] max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">
                    Ticket Details
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {selectedTicket && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400 text-sm">
                            Ticket ID
                          </Label>
                          <p className="text-white font-mono text-sm mt-1">
                            {selectedTicket.id}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-400 text-sm">
                            Status
                          </Label>
                          <div className="mt-1">
                            <Badge
                              variant="outline"
                              className={
                                selectedTicket.status === "open"
                                  ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                                  : selectedTicket.status === "in-progress"
                                  ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                                  : "border-green-500/40 text-green-400 bg-green-500/10"
                              }
                            >
                              {formatStatus(selectedTicket.status)}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-400 text-sm">
                            Priority
                          </Label>
                          <div className="mt-1">
                            <Badge
                              variant="outline"
                              className={
                                selectedTicket.priority === "high" ||
                                selectedTicket.priority === "urgent"
                                  ? "border-red-500/40 text-red-400 bg-red-500/10"
                                  : selectedTicket.priority === "normal"
                                  ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                                  : "border-green-500/40 text-green-400 bg-green-500/10"
                              }
                            >
                              {selectedTicket.priority || "low"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-400 text-sm">Type</Label>
                          <p className="text-white mt-1">
                            {selectedTicket.type || "general"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">Subject</Label>
                        <p className="text-white font-semibold mt-1">
                          {selectedTicket.subject || "Untitled"}
                        </p>
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">
                          Initial Message
                        </Label>
                        <Card className="bg-white/5 border-white/10 p-4 mt-2">
                          <p className="text-gray-300">
                            {selectedTicket.message || "No message"}
                          </p>
                        </Card>
                      </div>

                      <div>
                        <Label className="text-gray-400 text-sm">
                          Customer Email
                        </Label>
                        <p className="text-white mt-1">
                          {selectedTicket.email || "Unknown"}
                        </p>
                      </div>

                      {selectedTicket.messages &&
                        selectedTicket.messages.length > 0 && (
                          <div>
                            <Label className="text-gray-400 text-sm mb-3 block">
                              Conversation History
                            </Label>
                            <div className="space-y-3">
                              {selectedTicket.messages.map((msg, idx) => (
                                <Card
                                  key={idx}
                                  className="bg-white/5 border-white/10 p-4"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <Badge
                                      variant="outline"
                                      className="border-sky-500/40 text-sky-400 bg-sky-500/10"
                                    >
                                      {msg.senderId ? "Customer" : "Support"}
                                    </Badge>
                                    <span className="text-xs text-gray-400">
                                      {msg.timestamp instanceof Date
                                        ? msg.timestamp.toLocaleString("en-GB")
                                        : msg.timestamp?.toDate?.()
                                        ? msg.timestamp
                                            .toDate()
                                            .toLocaleString("en-GB")
                                        : "Recently"}
                                    </span>
                                  </div>
                                  <p className="text-gray-300">{msg.body}</p>
                                  {msg.attachments &&
                                    msg.attachments.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.attachments.map((att, attIdx) => (
                                          <Badge
                                            key={attIdx}
                                            variant="outline"
                                            className="border-purple-500/40 text-purple-400 bg-purple-500/10"
                                          >
                                            <Paperclip className="w-3 h-3 mr-1" />
                                            {att.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Reply Composer */}
                      {isAdmin && (
                        <div className="mt-6 border-t border-white/10 pt-4 space-y-4">
                          <Label className="text-gray-400 text-sm">Reply</Label>
                          <Textarea
                            value={ticketReplyBody}
                            onChange={(e) => setTicketReplyBody(e.target.value)}
                            placeholder="Write a reply to the customer or internal note..."
                            className="bg-white/5 border-white/10 text-white min-h-[120px]"
                          />
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="internalNote"
                                checked={ticketReplyInternal}
                                onChange={(e) =>
                                  setTicketReplyInternal(e.target.checked)
                                }
                                className="h-4 w-4 rounded bg-white/10 border-white/20"
                              />
                              <Label
                                htmlFor="internalNote"
                                className="text-sm text-gray-300"
                              >
                                Internal (customer won't see this)
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <div>
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleTicketAttachmentUpload}
                                  className="text-sm text-gray-300"
                                />
                                {ticketReplyUploadProgress > 0 && (
                                  <div className="text-xs text-sky-400 mt-1">
                                    Uploading... {ticketReplyUploadProgress}%
                                  </div>
                                )}
                              </div>
                              {ticketReplyAttachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 max-w-[300px]">
                                  {ticketReplyAttachments.map((att, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="border-purple-500/40 text-purple-400 bg-purple-500/10"
                                    >
                                      <Paperclip className="w-3 h-3 mr-1" />
                                      {att.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {ticketReplyError && (
                            <div className="text-sm text-red-400">
                              {ticketReplyError}
                            </div>
                          )}
                          <div className="flex justify-end">
                            <Button
                              disabled={
                                ticketReplySending || !ticketReplyBody.trim()
                              }
                              onClick={handleSendTicketReply}
                              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                            >
                              {ticketReplySending ? "Sending..." : "Send Reply"}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-4 border-t border-white/10">
                        <Button
                          onClick={() => setShowTicketDetailModal(false)}
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Close
                        </Button>
                        <div className="flex gap-2">
                          {selectedTicket.status !== "closed" && (
                            <Button
                              onClick={async () => {
                                if (!selectedTicket.id) return;
                                try {
                                  await updateSupportTicket(selectedTicket.id, {
                                    status: "closed",
                                  });
                                  const tickets = await getAllSupportTickets();
                                  setSupportTickets(tickets);
                                  setShowTicketDetailModal(false);
                                } catch {
                                  alert("Failed to close ticket");
                                }
                              }}
                              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                            >
                              Mark as Closed
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Security Alert Details Modal */}
            <Dialog
              open={showSecurityAlertModal}
              onOpenChange={setShowSecurityAlertModal}
            >
              <DialogContent className="bg-slate-900 border-red-500/30 text-white w-[95vw] sm:w-[90vw] max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <ShieldAlert className="w-6 h-6 text-red-400" />
                    Security Alert Details
                  </DialogTitle>
                </DialogHeader>
                {selectedSecurityAlert && (
                  <div className="space-y-6">
                    {/* Alert Overview */}
                    <div className="glass p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">
                            {selectedSecurityAlert.description}
                          </h4>
                          <p className="text-xs text-gray-400">
                            Alert ID: {selectedSecurityAlert.id}
                          </p>
                        </div>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          {selectedSecurityAlert.type || "Security Event"}
                        </Badge>
                      </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="glass border-white/10 p-4">
                        <p className="text-xs text-gray-400 mb-1">
                          Detected At
                        </p>
                        <p className="text-sm text-white font-mono">
                          {new Date(
                            selectedSecurityAlert.timestamp
                          ).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </Card>

                      <Card className="glass border-white/10 p-4">
                        <p className="text-xs text-gray-400 mb-1">Event Type</p>
                        <p className="text-sm text-white capitalize">
                          {selectedSecurityAlert.type || "Unknown"}
                        </p>
                      </Card>

                      <Card className="glass border-white/10 p-4">
                        <p className="text-xs text-gray-400 mb-1">
                          Severity Level
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <p className="text-sm text-red-400 font-semibold">
                            High
                          </p>
                        </div>
                      </Card>

                      <Card className="glass border-white/10 p-4">
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Requires Review
                        </Badge>
                      </Card>
                    </div>

                    {/* Event Description */}
                    <Card className="glass border-white/10 p-4">
                      <h4 className="text-sm font-semibold text-white mb-2">
                        Event Description
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {selectedSecurityAlert.description}
                      </p>
                    </Card>

                    {/* Recommended Actions */}
                    <Card className="glass border-blue-500/30 bg-blue-500/5 p-4">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-blue-400" />
                        Recommended Actions
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {selectedSecurityAlert.type === "failed_login" ? (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>
                                Review login attempts and verify they are
                                legitimate
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>
                                Consider implementing IP blocking if suspicious
                                activity continues
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>
                                Enable two-factor authentication for affected
                                accounts
                              </span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>
                                Investigate the security event immediately
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>
                                Review system logs for related activities
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>
                                Contact your security team if necessary
                              </span>
                            </li>
                          </>
                        )}
                      </ul>
                    </Card>

                    {/* All Alerts Navigation */}
                    {securityIssues.length > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white"
                          disabled={
                            securityIssues.findIndex(
                              (a) => a.id === selectedSecurityAlert.id
                            ) === 0
                          }
                          onClick={() => {
                            const currentIndex = securityIssues.findIndex(
                              (a) => a.id === selectedSecurityAlert.id
                            );
                            if (currentIndex > 0) {
                              setSelectedSecurityAlert(
                                securityIssues[currentIndex - 1]
                              );
                            }
                          }}
                        >
                          ← Previous Alert
                        </Button>
                        <span className="text-xs text-gray-400">
                          Alert{" "}
                          {securityIssues.findIndex(
                            (a) => a.id === selectedSecurityAlert.id
                          ) + 1}{" "}
                          of {securityIssues.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white"
                          disabled={
                            securityIssues.findIndex(
                              (a) => a.id === selectedSecurityAlert.id
                            ) ===
                            securityIssues.length - 1
                          }
                          onClick={() => {
                            const currentIndex = securityIssues.findIndex(
                              (a) => a.id === selectedSecurityAlert.id
                            );
                            if (currentIndex < securityIssues.length - 1) {
                              setSelectedSecurityAlert(
                                securityIssues[currentIndex + 1]
                              );
                            }
                          }}
                        >
                          Next Alert →
                        </Button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
                        disabled={securityAlertReportLoading}
                        onClick={handleReportSecurityAlert}
                      >
                        {securityAlertReportLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Report to Security Team"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => setShowSecurityAlertModal(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  );
}

// EmailComposer subcomponent (defined after AdminPanel for cohesion)
interface EmailComposerProps {
  customers: Array<{ id: string; email: string }>;
}

const EmailComposer = ({ customers }: EmailComposerProps) => {
  const [mode, setMode] = useState<"all" | "emails">("all");
  const [manualEmails, setManualEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<p>Write your message...</p>");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [editorMode, setEditorMode] = useState<"simple" | "advanced">(
    "advanced"
  );
  const DRAFT_KEY = "emailComposerDraft_v1";

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.subject) setSubject(parsed.subject);
        if (parsed.html) setHtml(parsed.html);
        if (parsed.manualEmails) setManualEmails(parsed.manualEmails);
        if (parsed.mode) setMode(parsed.mode);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist draft (debounced)
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        const data = { subject, html, manualEmails, mode };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [subject, html, manualEmails, mode]);

  // Live preview updates whenever subject or html body changes
  useEffect(() => {
    const branded = buildBrandedEmailHtml({
      title: subject || "Vortex PCs Update",
      preheader: subject,
      contentHtml: html,
    });
    setPreviewHtml(branded);
  }, [subject, html]);

  const estimatedRecipients =
    mode === "all"
      ? customers.length
      : manualEmails
          .split(/[,\n]/)
          .map((e) => e.trim())
          .filter((e) => /@/.test(e)).length;

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    setError(null);
    setProgress(0);
    setSimulating(true);
    const total = estimatedRecipients;
    const batchSize = 50;
    const batches = Math.max(1, Math.ceil(total / batchSize));
    let simulated = 0;
    const interval = setInterval(() => {
      simulated += 1;
      // Cap progress to 90% until real result returns
      const pct = Math.min(90, Math.round((simulated / batches) * 90));
      setProgress(pct);
      if (!sending) {
        clearInterval(interval);
      }
      if (simulated >= batches) {
        clearInterval(interval);
      }
    }, 400);
    try {
      const branded = buildBrandedEmailHtml({
        title: subject || "Vortex PCs Update",
        preheader: subject,
        contentHtml: html,
      });
      const recipients =
        mode === "emails"
          ? manualEmails
              .split(/[\n,]/)
              .map((e) => e.trim())
              .filter((e) => /@/.test(e))
          : undefined;
      const res = await sendBulkEmail({
        subject,
        html: branded,
        preheader: subject,
        recipients,
        mode,
      });
      setProgress(100);
      setResult(
        `Sent ${res.sent}/${res.recipients} (batches: ${res.batches}, size: ${res.batchSize}).`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(false);
      setTimeout(() => setSimulating(false), 1500);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label className="text-white">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Product launch, maintenance notice, etc..."
            className="bg-black/30 border-white/10 text-white"
          />
          <Label className="text-white">Recipients</Label>
          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              variant={mode === "all" ? "default" : "outline"}
              className={
                mode === "all"
                  ? "bg-sky-600"
                  : "border-white/20 text-white hover:bg-white/10"
              }
              onClick={() => setMode("all")}
            >
              All Customers ({customers.length})
            </Button>
            <Button
              type="button"
              variant={mode === "emails" ? "default" : "outline"}
              className={
                mode === "emails"
                  ? "bg-sky-600"
                  : "border-white/20 text-white hover:bg-white/10"
              }
              onClick={() => setMode("emails")}
            >
              Manual List
            </Button>
          </div>
          {mode === "emails" && (
            <Textarea
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
              placeholder="Enter one email per line or comma separated"
              className="bg-black/30 border-white/10 text-white h-32"
            />
          )}
          <div className="text-xs text-gray-400">
            Estimated recipients:{" "}
            <span className="text-sky-400 font-semibold">
              {estimatedRecipients}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-white">Message Content</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={editorMode === "simple" ? "default" : "outline"}
                className={
                  editorMode === "simple"
                    ? "bg-sky-600 h-7 text-xs"
                    : "border-white/20 text-white hover:bg-white/10 h-7 text-xs"
                }
                onClick={() => setEditorMode("simple")}
              >
                Simple
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editorMode === "advanced" ? "default" : "outline"}
                className={
                  editorMode === "advanced"
                    ? "bg-sky-600 h-7 text-xs"
                    : "border-white/20 text-white hover:bg-white/10 h-7 text-xs"
                }
                onClick={() => setEditorMode("advanced")}
              >
                Advanced
              </Button>
            </div>
          </div>
          {editorMode === "simple" ? (
            <RichTextEditor value={html} onChange={setHtml} />
          ) : (
            <AdvancedEmailEditor value={html} onChange={setHtml} />
          )}
        </div>
      </div>

      {/* Live Preview - Full Width Below */}
      <div className="space-y-2">
        <Label className="text-white flex items-center gap-2">
          Live Preview
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 border">
            Branded
          </Badge>
        </Label>
        <div className="rounded-md border border-white/10 bg-black/30 overflow-hidden h-[500px]">
          <iframe
            title="Email Preview"
            style={{ width: "100%", height: "100%", border: 0 }}
            sandbox="allow-same-origin allow-popups"
            srcDoc={previewHtml}
          />
        </div>
      </div>

      {/* Progress Bar */}
      {(sending || simulating) && (
        <div className="w-full bg-white/5 border border-white/10 h-3 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-600 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {error && <div className="text-sm text-red-400">{error}</div>}
      {result && <div className="text-sm text-green-400">{result}</div>}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={sending}
          onClick={() => {
            setSubject("");
            setHtml("<p>Write your message...</p>");
            setManualEmails("");
            setMode("all");
            setResult(null);
            setError(null);
            setProgress(0);
            try {
              localStorage.removeItem(DRAFT_KEY);
            } catch {
              /* ignore */
            }
          }}
          className="mr-3 border-white/20 text-white hover:bg-white/10"
        >
          Clear Draft
        </Button>
        <Button
          type="button"
          disabled={sending || !subject || estimatedRecipients === 0}
          onClick={handleSend}
          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
        >
          {sending ? "Sending..." : "Send Email"}
        </Button>
      </div>
      <div className="text-xs text-gray-500 text-right">
        Draft auto-saved locally.
      </div>
    </Card>
  );
};
