/**
 * Business Customer Dashboard
 * Comprehensive members area for business customers to manage subscriptions,
 * service agreements, purchased workstations, and support tickets
 */

import { useState, useMemo, useEffect } from "react";
// Firebase imports removed (unused after refactor)
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Building2,
  CreditCard,
  Monitor,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Plus,
  Settings,
  Shield,
  Zap,
  Award,
  TrendingUp,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Wrench,
  Package,
  ChevronRight,
  BarChart3,
  Bell,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  logoutUser,
  changeUserPassword,
  changeUserEmail,
} from "../services/auth";
import { toast } from "sonner";
import { logger } from "../services/logger";
import {
  getUserOrders,
  getUserSupportTickets,
  createSupportTicket,
  getSupportTicketById,
  addSupportTicketMessage,
  getUserSubscriptions,
  type TicketPriority,
  type Order,
  type SupportTicket as DbSupportTicket,
  type SubscriptionRecord,
} from "../services/database";
import { contentfulClient, isContentfulEnabled } from "../config/contentful";
import { trackDownload } from "../services/sessionTracker";

interface BusinessDashboardProps {
  setCurrentView: (view: string) => void;
}

interface Subscription {
  id: string;
  plan: "essential-care" | "priority-support" | "business-premium";
  planName: string;
  status: "active" | "expiring-soon" | "expired";
  startDate: string;
  renewalDate: string;
  price: number;
  billing: "monthly" | "annual";
  autoRenew: boolean;
  machinesCovered: number;
}

interface PurchasedPC {
  id: string;
  workstationName: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  warrantyStatus: "active" | "expiring-soon" | "expired";
  specs: {
    processor: string;
    ram: string;
    storage: string;
  };
  lastServiceDate?: string;
  nextScheduledService?: string;
}

interface ServiceTicket {
  id: string;
  title: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  created: string;
  lastUpdate: string;
  assignedTo?: string;
  pcSerial?: string;
  responseTime?: string;
}

export function BusinessDashboard({ setCurrentView }: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "subscriptions" | "workstations" | "support" | "account"
  >("overview");
  const { userProfile } = useAuth();
  // lightweight status (optional)
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [emailNew, setEmailNew] = useState("");
  const [emailCurrentPwd, setEmailCurrentPwd] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  // Live data states (replacing previous mock data)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchasedPCs, setPurchasedPCs] = useState<PurchasedPC[]>([]);
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([]);
  // Pagination state
  const [pcPage, setPcPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const pageSize = 6;
  // Refresh state for manual order reload
  const [ordersRefreshing, setOrdersRefreshing] = useState(false);

  // New ticket modal state
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketType, setTicketType] = useState("technical");
  const [ticketPriority, setTicketPriority] =
    useState<TicketPriority>("normal");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketBusy, setTicketBusy] = useState(false);
  // Ticket details dialog state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<DbSupportTicket | null>(
    null
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  // Downloads modal state
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [downloadsLoading, setDownloadsLoading] = useState(false);
  const [businessDownloads, setBusinessDownloads] = useState<
    Array<{
      id: string;
      title: string;
      description?: string;
      url: string;
      fileName: string;
    }>
  >([]);
  // Schedule Service modal state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [serviceWorkstation, setServiceWorkstation] = useState<string>("");
  const [serviceDate, setServiceDate] = useState<string>("");
  const [serviceIssue, setServiceIssue] = useState<string>("");
  const [servicePriority, setServicePriority] =
    useState<TicketPriority>("normal");
  const [serviceBusy, setServiceBusy] = useState(false);

  const businessInfo = useMemo(() => {
    const u = userProfile as unknown as {
      uid?: string;
      email?: string;
      displayName?: string;
      companyName?: string;
      contactPerson?: string;
      phone?: string;
      createdAt?: unknown;
      accountNumber?: string;
    } | null;
    let createdAt: Date | null = null;
    if (u?.createdAt) {
      if (typeof u.createdAt === "string") createdAt = new Date(u.createdAt);
      else if (u.createdAt instanceof Date) createdAt = u.createdAt;
      else {
        type FirebaseTimestamp = { toDate: () => Date };
        const ts = u.createdAt as FirebaseTimestamp;
        if (ts && typeof ts.toDate === "function") createdAt = ts.toDate();
      }
    }
    return {
      accountNumber: u?.accountNumber || "—",
      companyName: u?.companyName || u?.displayName || "—",
      contactPerson: u?.contactPerson || u?.displayName || "—",
      email: u?.email || "—",
      uid: u?.uid || "—",
      phone: u?.phone || "—",
      memberSince: createdAt ? createdAt.toLocaleDateString() : "—",
    };
  }, [userProfile]);

  // Centralized data loader (orders + tickets + subscriptions)
  const loadData = async (uid: string, silent: boolean = false) => {
    if (!silent) setOrdersRefreshing(true);
    let hadError = false;
    try {
      // Orders -> purchased PCs
      const orders: Order[] = await getUserOrders(uid);
      const pcs: PurchasedPC[] = orders.map((o) => {
        const name = o.items?.[0]?.productName || "Custom Build";
        const orderDate =
          o.orderDate instanceof Date ? o.orderDate : new Date();
        const expiry = new Date(orderDate);
        expiry.setFullYear(orderDate.getFullYear() + 3); // 3-year warranty
        const now = new Date();
        const daysToExpiry = Math.ceil(
          (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const warrantyStatus: PurchasedPC["warrantyStatus"] =
          daysToExpiry <= 0
            ? "expired"
            : daysToExpiry <= 60
            ? "expiring-soon"
            : "active";
        return {
          id: o.id || o.orderId,
          workstationName: name,
          serialNumber:
            o.orderId || `VTX-${(o.id || "").slice(0, 8).toUpperCase()}`,
          purchaseDate: orderDate.toISOString(),
          warrantyExpiry: expiry.toISOString(),
          warrantyStatus,
          specs: {
            processor: "—",
            ram: "—",
            storage: "—",
          },
        } as PurchasedPC;
      });
      setPurchasedPCs(pcs);

      // Tickets
      const tickets: DbSupportTicket[] = await getUserSupportTickets(uid);
      const appTickets: ServiceTicket[] = tickets.map((t) => {
        const statusMap: Record<string, ServiceTicket["status"]> = {
          open: "open",
          "in-progress": "in-progress",
          resolved: "resolved",
          closed: "closed",
          "awaiting-customer": "open",
        };
        const priorityMap: Record<string, ServiceTicket["priority"]> = {
          low: "low",
          normal: "medium",
          high: "high",
          urgent: "critical",
        };
        return {
          id: t.id || "",
          title: t.subject || "Support Ticket",
          status: statusMap[t.status] || "open",
          priority: priorityMap[t.priority || "normal"] || "medium",
          created: t.createdAt
            ? new Date(t.createdAt).toISOString()
            : new Date().toISOString(),
          lastUpdate: t.updatedAt
            ? new Date(t.updatedAt).toISOString()
            : new Date(t.createdAt || new Date()).toISOString(),
          assignedTo:
            typeof t.assignedTo === "object"
              ? (t.assignedTo as { name?: string }).name || undefined
              : undefined,
        } as ServiceTicket;
      });
      setServiceTickets(appTickets);

      // Real subscriptions fetch
      const subs: SubscriptionRecord[] = await getUserSubscriptions(uid);
      const mappedSubs: Subscription[] = subs.map((s) => ({
        id: s.id || "subscription",
        plan: s.plan,
        planName:
          s.planName ||
          (s.plan === "business-premium"
            ? "Business Premium"
            : s.plan === "priority-support"
            ? "Priority Support"
            : "Essential Care"),
        status: s.status,
        startDate: s.startDate.toISOString(),
        renewalDate: s.renewalDate.toISOString(),
        price: s.price,
        billing: s.billing,
        autoRenew: s.autoRenew,
        machinesCovered: s.machinesCovered || pcs.length || 1,
      }));
      setSubscriptions(mappedSubs);
    } catch (e) {
      hadError = true;
      logger.error("BusinessDashboard: failed to load data", { error: e });
      if (!silent) toast.error("Could not load your business data");
    } finally {
      if (!silent) setOrdersRefreshing(false);
      if (!silent && !hadError) toast.success("Member data refreshed");
    }
  };

  // Fetch Business Downloads (Contentful or fallback mock)
  const loadDownloads = async () => {
    if (downloadsLoading) return;
    setDownloadsLoading(true);
    try {
      if (!isContentfulEnabled || !contentfulClient) {
        // Fallback static examples
        setBusinessDownloads([
          {
            id: "sample-driver",
            title: "Vortex Driver Pack",
            description: "Latest chipset, LAN & audio drivers bundle.",
            url: "https://example.com/vortex-driver-pack.zip",
            fileName: "vortex-driver-pack.zip",
          },
          {
            id: "sample-manual",
            title: "Workstation Maintenance Guide",
            description: "PDF guide for quarterly maintenance tasks.",
            url: "https://example.com/workstation-maintenance.pdf",
            fileName: "workstation-maintenance.pdf",
          },
        ]);
        return;
      }
      // Query assumed content type: businessDownload (fields: title, description, file)
      const res = await contentfulClient.getEntries({
        content_type: "businessDownload",
        order: ["fields.title"],
        include: 1,
      } as unknown as Record<string, unknown>);
      const items = (res.items || []).map((entry: unknown) => {
        const e = entry as {
          sys: { id: string };
          fields?: Record<string, unknown>;
        };
        const f = e.fields || {};
        // Attempt to resolve asset URL
        let url = "";
        let fileName = "download";
        const file = f.file || f.asset || f.downloadFile;
        if (file) {
          // Linked asset
          if (file.fields?.file?.url) {
            url = `https:${file.fields.file.url}`;
            fileName = file.fields.file.fileName || fileName;
          } else if (
            file.sys?.id &&
            (
              res as unknown as {
                includes?: {
                  Asset?: Array<{
                    sys: { id: string };
                    fields?: { file?: { url?: string; fileName?: string } };
                  }>;
                };
              }
            ).includes?.Asset
          ) {
            const assetArray =
              (
                res as unknown as {
                  includes?: {
                    Asset?: Array<{
                      sys: { id: string };
                      fields?: { file?: { url?: string; fileName?: string } };
                    }>;
                  };
                }
              ).includes?.Asset || [];
            const asset = assetArray.find((a) => a.sys.id === file.sys.id);
            if (asset?.fields?.file?.url) {
              url = `https:${asset.fields.file.url}`;
              fileName = asset.fields.file.fileName || fileName;
            }
          }
        }
        return {
          id: e.sys.id,
          title: f.title || "Download",
          description: f.description || "",
          url,
          fileName,
        } as {
          id: string;
          title: string;
          description?: string;
          url: string;
          fileName: string;
        };
      });
      setBusinessDownloads(items);
    } catch (e) {
      logger.error("BusinessDashboard: loadDownloads failed", { error: e });
      toast.error("Failed to load downloads");
    } finally {
      setDownloadsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    const uid = (userProfile as { uid?: string } | null)?.uid;
    if (uid) loadData(uid, true);
    // loadData intentionally excluded from deps to avoid re-running on every render due to stable reference not guaranteed
  }, [userProfile]);

  const getStatusBadge = (
    status: string,
    type: "subscription" | "warranty" | "ticket"
  ) => {
    if (type === "subscription" || type === "warranty") {
      switch (status) {
        case "active":
          return (
            <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Active
            </Badge>
          );
        case "expiring-soon":
          return (
            <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-400">
              <Clock className="w-3 h-3 mr-1" />
              Expiring Soon
            </Badge>
          );
        case "expired":
          return (
            <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
              <AlertCircle className="w-3 h-3 mr-1" />
              Expired
            </Badge>
          );
      }
    }

    if (type === "ticket") {
      switch (status) {
        case "open":
          return (
            <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-400">
              Open
            </Badge>
          );
        case "in-progress":
          return (
            <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-400">
              In Progress
            </Badge>
          );
        case "resolved":
          return (
            <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
              Resolved
            </Badge>
          );
        case "closed":
          return (
            <Badge className="bg-gray-500/20 border-gray-500/40 text-gray-400">
              Closed
            </Badge>
          );
      }
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
            Critical
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-500/20 border-orange-500/40 text-orange-400">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-400">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-400">
            Low
          </Badge>
        );
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "essential-care":
        return <Shield className="w-5 h-5 text-sky-400" />;
      case "priority-support":
        return <Zap className="w-5 h-5 text-sky-400" />;
      case "business-premium":
        return <Award className="w-5 h-5 text-sky-400" />;
      default:
        return <Shield className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="min-h-screen text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                  Business Dashboard
                </span>
              </h1>
              <p className="text-gray-400">
                Welcome back, {businessInfo.companyName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentView("business-solutions")}
                className="bg-white/10 hover:bg-white/20 border border-white/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Services
              </Button>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={async () => {
                  try {
                    await logoutUser();
                  } catch (e) {
                    logger.warn("Firebase logout failed", { e });
                  }
                  try {
                    localStorage.removeItem("vortex_user");
                  } catch (e) {
                    logger.debug("localStorage cleanup skipped", { e });
                  }
                  window.location.href = "/";
                }}
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Account Info Card */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-sky-400 mt-1" />
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    Account Number
                  </div>
                  <div className="font-semibold">
                    {businessInfo.accountNumber}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-sky-400 mt-1" />
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    Contact Person
                  </div>
                  <div className="font-semibold">
                    {businessInfo.contactPerson}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-sky-400 mt-1" />
                <div>
                  <div className="text-xs text-gray-400 mb-1">Email</div>
                  <div className="font-semibold text-sm">
                    {businessInfo.email}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-sky-400 mt-1" />
                <div>
                  <div className="text-xs text-gray-400 mb-1">Member Since</div>
                  <div className="font-semibold">
                    {businessInfo.memberSince}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
            { id: "workstations", label: "Workstations", icon: Monitor },
            { id: "support", label: "Support", icon: MessageSquare },
            { id: "account", label: "Account", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-500/30 p-6">
                <div className="flex items-start justify-between mb-3">
                  <Shield className="w-8 h-8 text-sky-400" />
                  <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                    Active
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {subscriptions.filter((s) => s.status === "active").length}
                </div>
                <div className="text-sm text-gray-400">Active Subscription</div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 p-6">
                <div className="flex items-start justify-between mb-3">
                  <Monitor className="w-8 h-8 text-purple-400" />
                  <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                    {purchasedPCs.length}
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {purchasedPCs.length}
                </div>
                <div className="text-sm text-gray-400">Workstations</div>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 p-6">
                <div className="flex items-start justify-between mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                  <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                    100%
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {
                    purchasedPCs.filter((pc) => pc.warrantyStatus === "active")
                      .length
                  }
                  /{purchasedPCs.length}
                </div>
                <div className="text-sm text-gray-400">Under Warranty</div>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 p-6">
                <div className="flex items-start justify-between mb-3">
                  <MessageSquare className="w-8 h-8 text-amber-400" />
                  <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-400">
                    Open
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {serviceTickets.filter((t) => t.status !== "closed").length}
                </div>
                <div className="text-sm text-gray-400">Active Tickets</div>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upcoming Service */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-sky-400" />
                    Upcoming Service
                  </h3>
                  <Button
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 border border-white/20"
                    onClick={() => setActiveTab("workstations")}
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {purchasedPCs
                    .filter((pc) => pc.nextScheduledService)
                    .map((pc) => (
                      <div
                        key={pc.id}
                        className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                      >
                        <Wrench className="w-5 h-5 text-sky-400 mt-1" />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            Quarterly Maintenance
                          </div>
                          <div className="text-xs text-gray-400">
                            {pc.workstationName} ({pc.serialNumber})
                          </div>
                          <div className="text-xs text-sky-400 mt-1">
                            Scheduled: {pc.nextScheduledService}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Recent Tickets */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-sky-400" />
                    Recent Support Tickets
                  </h3>
                  <Button
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 border border-white/20"
                    onClick={() => setActiveTab("support")}
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {serviceTickets.slice(0, 3).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-start justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="font-semibold text-sm">
                            {ticket.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>#{ticket.id}</span>
                          <span>•</span>
                          <span>Updated {ticket.lastUpdate}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(ticket.status, "ticket")}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  onClick={() => {
                    setActiveTab("support");
                    setNewTicketOpen(true);
                  }}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 justify-start h-auto py-4"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">New Support Ticket</div>
                    <div className="text-xs opacity-80">
                      Get help from our team
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => setCurrentView("business-solutions")}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 justify-start h-auto py-4"
                >
                  <Package className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Order Workstations</div>
                    <div className="text-xs opacity-80">Add to your fleet</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setActiveTab("subscriptions")}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 justify-start h-auto py-4"
                >
                  <TrendingUp className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Upgrade Support</div>
                    <div className="text-xs opacity-80">Enhanced coverage</div>
                  </div>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Account Security</h3>
                  <p className="text-sm text-gray-400">
                    Update your password and sign-in email
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Change Password */}
                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Change Password</h4>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Current Password</Label>
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
                          toast.error("Please complete all password fields.");
                          return;
                        }
                        if (pwdNew !== pwdConfirm) {
                          toast.error("New passwords do not match.");
                          return;
                        }
                        try {
                          setPwdBusy(true);
                          await changeUserPassword(pwdCurrent, pwdNew);
                          setPwdCurrent("");
                          setPwdNew("");
                          setPwdConfirm("");
                          toast.success("Password updated successfully.");
                        } catch (e) {
                          toast.error(
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
                    <Label className="text-gray-300">New Email Address</Label>
                    <Input
                      type="email"
                      value={emailNew}
                      onChange={(e) => setEmailNew(e.target.value)}
                      placeholder="new.email@example.com"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Current Password</Label>
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
                          toast.error(
                            "Please provide your new email and current password."
                          );
                          return;
                        }
                        try {
                          setEmailBusy(true);
                          await changeUserEmail(emailCurrentPwd, emailNew);
                          setEmailNew("");
                          setEmailCurrentPwd("");
                          toast.success(
                            "Verification link sent to your new email."
                          );
                        } catch (e) {
                          toast.error(
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
            </Card>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Your Subscriptions</h2>
              <Button
                onClick={() => setCurrentView("business-solutions")}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
            </div>

            {subscriptions.length === 0 && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">
                  No Active Subscriptions
                </h3>
                <p className="text-gray-400 mb-4">
                  Boost support response times and coverage by adding a plan.
                </p>
                <Button
                  onClick={() => setCurrentView("business-solutions")}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" /> Explore Plans
                </Button>
              </Card>
            )}

            {subscriptions
              .slice((subsPage - 1) * pageSize, subsPage * pageSize)
              .map((sub) => (
                <Card
                  key={sub.id}
                  className="bg-white/5 backdrop-blur-xl border-white/10 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-sky-500/10 rounded-lg">
                        {getPlanIcon(sub.plan)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{sub.planName}</h3>
                          {getStatusBadge(sub.status, "subscription")}
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>Covering {sub.machinesCovered} workstations</div>
                          <div>
                            Started:{" "}
                            {new Date(sub.startDate).toLocaleDateString()}
                          </div>
                          <div>
                            Renewal:{" "}
                            {new Date(sub.renewalDate).toLocaleDateString()}
                          </div>
                          {/* Subscription Progress */}
                          {(() => {
                            const start = new Date(sub.startDate);
                            const renewal = new Date(sub.renewalDate);
                            const now = new Date();
                            const totalMs = renewal.getTime() - start.getTime();
                            const elapsedMs = Math.max(
                              now.getTime() - start.getTime(),
                              0
                            );
                            const percent = Math.min(
                              100,
                              Math.max(0, (elapsedMs / totalMs) * 100)
                            );
                            const remainingDays = Math.ceil(
                              Math.max(renewal.getTime() - now.getTime(), 0) /
                                (1000 * 60 * 60 * 24)
                            );
                            const barClass =
                              sub.status === "expired"
                                ? "from-red-600 to-red-700"
                                : sub.status === "expiring-soon"
                                ? "from-amber-500 to-amber-600"
                                : "from-sky-600 to-blue-600";
                            return (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-400">
                                    Term Progress
                                  </span>
                                  <span className="text-gray-300 font-medium">
                                    {sub.status === "expired"
                                      ? "Expired"
                                      : `${remainingDays} day${
                                          remainingDays === 1 ? "" : "s"
                                        } left`}
                                  </span>
                                </div>
                                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                                  <div
                                    className={`h-full bg-gradient-to-r ${barClass} transition-all duration-500`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-sky-400">
                          £{sub.price}
                          <span className="text-sm text-gray-400 font-normal">
                            /{sub.billing === "monthly" ? "month" : "year"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {sub.autoRenew ? (
                            <span className="flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                              Auto-renewal enabled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 justify-end">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              Auto-renewal disabled
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-white/10 hover:bg-white/20 border border-white/20"
                          onClick={() =>
                            toast.info("Agreement viewer coming soon")
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Agreement
                        </Button>
                        <Button
                          size="sm"
                          className="bg-white/10 hover:bg-white/20 border border-white/20"
                          onClick={() =>
                            toast.info("Manage subscription coming soon")
                          }
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

            {/* Upgrade Options */}
            <Card className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/30 p-6">
              <div className="flex items-start gap-4">
                <TrendingUp className="w-8 h-8 text-sky-400" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    Upgrade Your Support
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Get faster response times, more frequent maintenance, and
                    priority access to our technical team with Business Premium.
                  </p>
                  <Button
                    onClick={() => setCurrentView("business-solutions")}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  >
                    Compare Plans
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
            {subscriptions.length > pageSize && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={subsPage === 1}
                  onClick={() => setSubsPage((p) => p - 1)}
                  className="border-white/20"
                >
                  Prev
                </Button>
                <div className="text-sm text-gray-400">
                  Page {subsPage} of{" "}
                  {Math.ceil(subscriptions.length / pageSize)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    subsPage >= Math.ceil(subscriptions.length / pageSize)
                  }
                  onClick={() => setSubsPage((p) => p + 1)}
                  className="border-white/20"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Workstations Tab */}
        {activeTab === "workstations" && (
          <>
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Your Workstations</h2>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={ordersRefreshing}
                    onClick={() => {
                      const uid = (userProfile as { uid?: string } | null)?.uid;
                      if (uid) loadData(uid);
                    }}
                  >
                    {ordersRefreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh Orders
                  </Button>
                  <Button
                    onClick={() => setCurrentView("business-solutions")}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Order More
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {purchasedPCs
                  .slice((pcPage - 1) * pageSize, pcPage * pageSize)
                  .map((pc) => (
                    <Card
                      key={pc.id}
                      className="bg-white/5 backdrop-blur-xl border-white/10 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold mb-1">
                            {pc.workstationName}
                          </h3>
                          <div className="text-sm text-gray-400">
                            Serial: {pc.serialNumber}
                          </div>
                        </div>
                        {getStatusBadge(pc.warrantyStatus, "warranty")}
                      </div>

                      {/* Specs */}
                      <div className="space-y-2 mb-4 p-4 bg-white/5 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Processor:</span>
                          <span className="font-semibold">
                            {pc.specs.processor}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">RAM:</span>
                          <span className="font-semibold">{pc.specs.ram}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Storage:</span>
                          <span className="font-semibold">
                            {pc.specs.storage}
                          </span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-sky-400" />
                          <span className="text-gray-400">Purchased:</span>
                          <span>
                            {new Date(pc.purchaseDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span className="text-gray-400">Warranty Until:</span>
                          <span>
                            {new Date(pc.warrantyExpiry).toLocaleDateString()}
                          </span>
                        </div>
                        {/* Warranty Progress */}
                        <div className="mt-2 space-y-1">
                          {(() => {
                            const now = new Date();
                            const purchase = new Date(pc.purchaseDate);
                            const expiry = new Date(pc.warrantyExpiry);
                            const totalMs =
                              expiry.getTime() - purchase.getTime();
                            const remainingMs = Math.max(
                              expiry.getTime() - now.getTime(),
                              0
                            );
                            const totalDays = Math.max(
                              Math.ceil(totalMs / (1000 * 60 * 60 * 24)),
                              1
                            );
                            const remainingDays = Math.ceil(
                              remainingMs / (1000 * 60 * 60 * 24)
                            );
                            const percent = Math.min(
                              100,
                              Math.max(
                                0,
                                ((totalDays - remainingDays) / totalDays) * 100
                              )
                            );
                            const status = pc.warrantyStatus;
                            const barClass =
                              status === "expired"
                                ? "from-red-600 to-red-700"
                                : status === "expiring-soon"
                                ? "from-amber-500 to-amber-600"
                                : "from-sky-600 to-blue-600";
                            return (
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-400">
                                    Warranty Coverage
                                  </span>
                                  <span className="text-gray-300 font-medium">
                                    {status === "expired"
                                      ? "Expired"
                                      : `${remainingDays} day${
                                          remainingDays === 1 ? "" : "s"
                                        } remaining`}
                                  </span>
                                </div>
                                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                                  <div
                                    className={`h-full bg-gradient-to-r ${barClass} transition-all duration-500`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        {pc.lastServiceDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Wrench className="w-4 h-4 text-sky-400" />
                            <span className="text-gray-400">Last Service:</span>
                            <span>
                              {new Date(
                                pc.lastServiceDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {pc.nextScheduledService && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span className="text-gray-400">Next Service:</span>
                            <span>
                              {new Date(
                                pc.nextScheduledService
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20"
                          onClick={() => toast.info("Downloads coming soon")}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Docs
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20"
                          onClick={() => setActiveTab("support")}
                        >
                          <Wrench className="w-4 h-4 mr-2" />
                          Request Service
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
              {purchasedPCs.length > pageSize && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pcPage === 1}
                    onClick={() => setPcPage((p) => p - 1)}
                    className="border-white/20"
                  >
                    Prev
                  </Button>
                  <div className="text-sm text-gray-400">
                    Page {pcPage} of {Math.ceil(purchasedPCs.length / pageSize)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      pcPage >= Math.ceil(purchasedPCs.length / pageSize)
                    }
                    onClick={() => setPcPage((p) => p + 1)}
                    className="border-white/20"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Support Tab */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Support Tickets</h2>
              <Button
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                onClick={() => setNewTicketOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>

            {/* Emergency Contact */}
            <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 p-6">
              <div className="flex items-start gap-4">
                <Bell className="w-8 h-8 text-red-400" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Emergency Support</h3>
                  <p className="text-gray-400 mb-3">
                    For critical issues affecting your business operations,
                    contact our 24/7 emergency line:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="tel:+447301243190"
                      className="flex items-center gap-2 text-sky-400 hover:text-sky-300"
                    >
                      <Phone className="w-4 h-4" />
                      07301 243190
                    </a>
                    <a
                      href="mailto:emergency@vortexpcs.com"
                      className="flex items-center gap-2 text-sky-400 hover:text-sky-300"
                    >
                      <Mail className="w-4 h-4" />
                      emergency@vortexpcs.com
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tickets List */}
            <div className="space-y-4">
              {serviceTickets
                .slice((ticketPage - 1) * pageSize, ticketPage * pageSize)
                .map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="bg-white/5 backdrop-blur-xl border-white/10 p-6 hover:border-sky-500/30 cursor-pointer transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <MessageSquare className="w-5 h-5 text-sky-400 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-bold mb-1">{ticket.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                              <span>#{ticket.id}</span>
                              <span>•</span>
                              <span>Created {ticket.created}</span>
                              <span>•</span>
                              <span>Updated {ticket.lastUpdate}</span>
                              {ticket.assignedTo && (
                                <>
                                  <span>•</span>
                                  <span>Assigned to {ticket.assignedTo}</span>
                                </>
                              )}
                            </div>
                            {ticket.pcSerial && (
                              <div className="text-xs text-sky-400 mt-1">
                                Device: {ticket.pcSerial}
                              </div>
                            )}
                            {ticket.responseTime && (
                              <div className="text-xs text-green-400 mt-1">
                                First response: {ticket.responseTime}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col lg:items-end gap-2">
                        {getStatusBadge(ticket.status, "ticket")}
                        {getPriorityBadge(ticket.priority)}
                        <Button
                          size="sm"
                          className="bg-white/10 hover:bg-white/20 border border-white/20"
                          onClick={async () => {
                            setDetailsBusy(true);
                            try {
                              const full = await getSupportTicketById(
                                ticket.id
                              );
                              if (full)
                                setSelectedTicket(full as DbSupportTicket);
                              setDetailsOpen(true);
                            } catch {
                              toast.error("Failed to load ticket details");
                            } finally {
                              setDetailsBusy(false);
                            }
                          }}
                        >
                          {detailsBusy ? "Loading" : "View Details"}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
            {serviceTickets.length > pageSize && (
              <div className="flex justify-center items-center gap-4 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ticketPage === 1}
                  onClick={() => setTicketPage((p) => p - 1)}
                  className="border-white/20"
                >
                  Prev
                </Button>
                <div className="text-sm text-gray-400">
                  Page {ticketPage} of{" "}
                  {Math.ceil(serviceTickets.length / pageSize)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    ticketPage >= Math.ceil(serviceTickets.length / pageSize)
                  }
                  onClick={() => setTicketPage((p) => p + 1)}
                  className="border-white/20"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Support Resources */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h3 className="text-lg font-bold mb-4">Support Resources</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left"
                  onClick={() => setCurrentView("faq")}
                >
                  <FileText className="w-6 h-6 text-sky-400 mb-2" />
                  <div className="font-semibold mb-1">Knowledge Base</div>
                  <div className="text-xs text-gray-400">
                    Find answers to common questions
                  </div>
                </button>
                <button
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left"
                  onClick={() => {
                    setDownloadsOpen(true);
                    if (businessDownloads.length === 0) loadDownloads();
                  }}
                >
                  <Download className="w-6 h-6 text-sky-400 mb-2" />
                  <div className="font-semibold mb-1">Downloads</div>
                  <div className="text-xs text-gray-400">
                    Drivers, manuals, and software
                  </div>
                </button>
                <button
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left"
                  onClick={() => setScheduleOpen(true)}
                >
                  <Calendar className="w-6 h-6 text-sky-400 mb-2" />
                  <div className="font-semibold mb-1">Schedule Service</div>
                  <div className="text-xs text-gray-400">
                    Book maintenance visit
                  </div>
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
      {/* New Ticket Dialog */}
      <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-gray-300">Subject</Label>
              <Input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">Type</Label>
                <select
                  className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2"
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                >
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="order">Order</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-gray-300">Priority</Label>
                <select
                  className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2"
                  value={ticketPriority}
                  onChange={(e) =>
                    setTicketPriority(e.target.value as TicketPriority)
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Message</Label>
              <Textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe the issue with as much detail as possible"
                className="min-h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="bg-white/5 hover:bg-white/10 border border-white/10"
              onClick={() => setNewTicketOpen(false)}
              disabled={ticketBusy}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              disabled={ticketBusy}
              onClick={async () => {
                if (!ticketSubject.trim() || !ticketMessage.trim()) {
                  toast.error("Please enter a subject and message");
                  return;
                }
                try {
                  setTicketBusy(true);
                  const uid =
                    (userProfile as { uid?: string } | null)?.uid || undefined;
                  const name =
                    (
                      userProfile as {
                        displayName?: string;
                        contactPerson?: string;
                      } | null
                    )?.contactPerson ||
                    (userProfile as { displayName?: string } | null)
                      ?.displayName ||
                    businessInfo.companyName;
                  const email =
                    businessInfo.email !== "—" ? businessInfo.email : "";

                  const id = await createSupportTicket({
                    userId: uid,
                    name,
                    email,
                    subject: ticketSubject.trim(),
                    message: ticketMessage.trim(),
                    type: ticketType,
                    priority: ticketPriority,
                  });

                  const nowIso = new Date().toISOString();
                  const newTicket: ServiceTicket = {
                    id,
                    title: ticketSubject.trim(),
                    status: "open",
                    priority:
                      ticketPriority === "urgent"
                        ? "critical"
                        : ticketPriority === "high"
                        ? "high"
                        : ticketPriority === "normal"
                        ? "medium"
                        : "low",
                    created: nowIso,
                    lastUpdate: nowIso,
                  };
                  setServiceTickets((prev) => [newTicket, ...prev]);
                  setNewTicketOpen(false);
                  setTicketSubject("");
                  setTicketType("technical");
                  setTicketPriority("normal");
                  setTicketMessage("");
                  toast.success("Support ticket created");
                  // Fire-and-forget confirmation email
                  try {
                    fetch("/api/support/confirm", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                      body: JSON.stringify({
                        ticketId: id,
                        subject: ticketSubject.trim(),
                        type: ticketType,
                        priority: ticketPriority,
                        email,
                        name,
                      }),
                    }).catch(() => {
                      /* no-op */
                    });
                  } catch {
                    /* ignore */
                  }
                  // Fire-and-forget staff notification
                  try {
                    fetch("/api/support/notify-staff", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                      body: JSON.stringify({
                        ticketId: id,
                        subject: ticketSubject.trim(),
                        type: ticketType,
                        priority: ticketPriority,
                        email,
                        name,
                      }),
                    }).catch(() => {
                      /* no-op */
                    });
                  } catch {
                    /* ignore */
                  }
                } catch (e) {
                  logger.error("Failed to create support ticket", { error: e });
                  const msg =
                    e instanceof Error ? e.message : "Failed to create ticket";
                  toast.error(msg);
                } finally {
                  setTicketBusy(false);
                }
              }}
            >
              {ticketBusy ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Ticket Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-xl border-white/10 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTicket?.subject || "Ticket Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
                <div>
                  <span className="text-gray-400">Ticket ID:</span>{" "}
                  {selectedTicket.id}
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>{" "}
                  {selectedTicket.status}
                </div>
                <div>
                  <span className="text-gray-400">Priority:</span>{" "}
                  {selectedTicket.priority}
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>{" "}
                  {selectedTicket.type}
                </div>
              </div>
              <div className="space-y-3">
                {(selectedTicket.messages || []).map((m, i) => {
                  const msg = m as {
                    senderName?: string | null;
                    senderId?: string | null;
                    body?: string;
                    timestamp?: Date | string | { toDate?: () => Date };
                  };
                  let ts: Date;
                  if (
                    msg.timestamp &&
                    typeof msg.timestamp === "object" &&
                    "toDate" in msg.timestamp
                  ) {
                    try {
                      ts = (msg.timestamp as { toDate: () => Date }).toDate();
                    } catch {
                      ts = new Date();
                    }
                  } else if (typeof msg.timestamp === "string") {
                    ts = new Date(msg.timestamp);
                  } else if (msg.timestamp instanceof Date) {
                    ts = msg.timestamp;
                  } else {
                    ts = new Date();
                  }
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-md bg-white/5 border border-white/10"
                    >
                      <div className="text-xs text-gray-400 mb-1">
                        {msg.senderName || msg.senderId || "Customer"} •{" "}
                        {ts.toLocaleString()}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">
                        {msg.body || ""}
                      </div>
                    </div>
                  );
                })}
                {selectedTicket.messages?.length === 0 && (
                  <div className="text-sm text-gray-400">No messages yet.</div>
                )}
              </div>
              {/* Reply form */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <Label className="text-gray-300 mb-2">Add Reply</Label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-24 bg-white/5 border-white/10 text-white mb-3"
                />
                <Button
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  disabled={replyBusy || !replyMessage.trim()}
                  onClick={async () => {
                    if (!selectedTicket?.id || !replyMessage.trim()) return;
                    try {
                      setReplyBusy(true);
                      const uid = (userProfile as { uid?: string } | null)?.uid;
                      const name =
                        (
                          userProfile as {
                            displayName?: string;
                            contactPerson?: string;
                          } | null
                        )?.contactPerson ||
                        (userProfile as { displayName?: string } | null)
                          ?.displayName ||
                        businessInfo.companyName;
                      await addSupportTicketMessage(selectedTicket.id, {
                        senderId: uid || null,
                        senderName: name || null,
                        body: replyMessage.trim(),
                        internal: false,
                      });
                      setReplyMessage("");
                      toast.success("Reply added");
                    } catch (e) {
                      logger.error("Failed to add reply", { error: e });
                      toast.error("Failed to send reply");
                    } finally {
                      setReplyBusy(false);
                    }
                  }}
                >
                  {replyBusy ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">No ticket selected.</div>
          )}
          <DialogFooter>
            <Button
              className="bg-white/10 hover:bg-white/20 border border-white/20"
              onClick={() => setDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Downloads Modal */}
      <Dialog open={downloadsOpen} onOpenChange={setDownloadsOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-xl border-white/10 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Business Downloads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {downloadsLoading && (
              <div className="text-sm text-gray-400">Loading downloads…</div>
            )}
            {!downloadsLoading && businessDownloads.length === 0 && (
              <div className="text-sm text-gray-400">
                No downloads available yet.
              </div>
            )}
            {businessDownloads.map((d) => (
              <Card
                key={d.id}
                className="bg-white/5 backdrop-blur-xl border-white/10 p-4 flex items-start gap-4"
              >
                <div className="p-2 rounded-md bg-sky-500/10">
                  <Download className="w-5 h-5 text-sky-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">{d.title}</div>
                  {d.description && (
                    <div className="text-xs text-gray-400 mb-2">
                      {d.description}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!d.url}
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                      onClick={() => {
                        if (!d.url) return;
                        try {
                          const uid =
                            (userProfile as { uid?: string } | null)?.uid ||
                            undefined;
                          trackDownload(d.fileName, uid);
                        } catch {
                          /* ignore */
                        }
                        window.open(d.url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button
              className="bg-white/10 hover:bg-white/20 border border-white/20"
              onClick={() => setDownloadsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Schedule Service Modal */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-xl border-white/10 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30">
                <Calendar className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  Schedule Service Visit
                </DialogTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Book maintenance or repair for your workstation
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Workstation Selection */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-sky-400" />
                Select Workstation
                <span className="text-red-400">*</span>
              </Label>
              <select
                value={serviceWorkstation}
                onChange={(e) => setServiceWorkstation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-sky-500/50 rounded-lg px-4 py-3 mt-1 transition-colors text-white appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                }}
              >
                <option value="" className="bg-slate-900">
                  Choose workstation...
                </option>
                {purchasedPCs.map((pc) => (
                  <option key={pc.id} value={pc.id} className="bg-slate-900">
                    {pc.workstationName} ({pc.serialNumber})
                  </option>
                ))}
              </select>
              {purchasedPCs.length === 0 && (
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  No workstations found. Order one first to schedule service.
                </p>
              )}
            </div>

            {/* Service Type Quick Select */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-sky-400" />
                Service Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setServiceIssue("Quarterly maintenance check requested.");
                    setServicePriority("normal");
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/30 rounded-lg text-left transition-all"
                >
                  <div className="text-sm font-semibold text-white">
                    Maintenance
                  </div>
                  <div className="text-xs text-gray-400">Regular checkup</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServiceIssue("Hardware issue requiring repair.");
                    setServicePriority("high");
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/30 rounded-lg text-left transition-all"
                >
                  <div className="text-sm font-semibold text-white">Repair</div>
                  <div className="text-xs text-gray-400">Fix an issue</div>
                </button>
              </div>
            </div>

            {/* Date and Priority Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Preferred Date
                  <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-white/5 border-white/10 hover:border-white/20 focus:border-sky-500/50 text-white mt-1"
                />
                <p className="text-xs text-gray-400">
                  We'll contact you to confirm availability
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-sky-400" />
                  Priority
                </Label>
                <select
                  value={servicePriority}
                  onChange={(e) =>
                    setServicePriority(e.target.value as TicketPriority)
                  }
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-sky-500/50 rounded-lg px-4 py-2.5 mt-1 transition-colors text-white appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 1rem center",
                  }}
                >
                  <option value="low" className="bg-slate-900">
                    Low - Routine maintenance
                  </option>
                  <option value="normal" className="bg-slate-900">
                    Normal - Standard service
                  </option>
                  <option value="high" className="bg-slate-900">
                    High - Issue affecting work
                  </option>
                  <option value="urgent" className="bg-slate-900">
                    Urgent - Critical downtime
                  </option>
                </select>
              </div>
            </div>

            {/* Issue Description */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                Issue Details / Notes
              </Label>
              <Textarea
                value={serviceIssue}
                onChange={(e) => setServiceIssue(e.target.value)}
                placeholder="Describe the issue, maintenance needs, or any specific requirements..."
                className="min-h-32 bg-white/5 border-white/10 hover:border-white/20 focus:border-sky-500/50 text-white resize-none"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Be as detailed as possible for faster resolution
                </span>
                <span
                  className={`${
                    serviceIssue.length > 500
                      ? "text-amber-400"
                      : "text-gray-500"
                  }`}
                >
                  {serviceIssue.length} / 1000
                </span>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-white mb-1">
                    Service Guarantee
                  </p>
                  <p className="text-xs leading-relaxed">
                    Our certified technicians will contact you within 24 hours
                    to confirm your appointment. All services are covered under
                    your warranty terms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              className="bg-white/5 hover:bg-white/10 border border-white/10 w-full sm:w-auto"
              onClick={() => {
                setScheduleOpen(false);
                // Reset form
                setServiceWorkstation("");
                setServiceDate("");
                setServiceIssue("");
                setServicePriority("normal");
              }}
              disabled={serviceBusy}
            >
              Cancel
            </Button>
            <Button
              disabled={serviceBusy || !serviceWorkstation || !serviceDate}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-500/30 w-full sm:w-auto"
              onClick={async () => {
                if (!serviceWorkstation) {
                  toast.error("Please select a workstation");
                  return;
                }
                if (!serviceDate) {
                  toast.error("Please choose a preferred date");
                  return;
                }
                try {
                  setServiceBusy(true);
                  const pc = purchasedPCs.find(
                    (p) => p.id === serviceWorkstation
                  );
                  const subject = `Service Booking: ${
                    pc?.workstationName || serviceWorkstation
                  }`;
                  const message = `Workstation: ${pc?.workstationName} (${
                    pc?.serialNumber
                  })\nPreferred Date: ${serviceDate}\nPriority: ${servicePriority}\nIssue Details:\n${serviceIssue.trim()}`;
                  const uid =
                    (userProfile as { uid?: string } | null)?.uid || undefined;
                  const name =
                    (
                      userProfile as {
                        displayName?: string;
                        contactPerson?: string;
                      } | null
                    )?.contactPerson ||
                    (userProfile as { displayName?: string } | null)
                      ?.displayName ||
                    businessInfo.companyName;
                  const email =
                    businessInfo.email !== "—" ? businessInfo.email : "";
                  const id = await createSupportTicket({
                    userId: uid,
                    name,
                    email,
                    subject,
                    message,
                    type: "other", // keep within existing types
                    priority: servicePriority,
                  });
                  const nowIso = new Date().toISOString();
                  const newTicket: ServiceTicket = {
                    id,
                    title: subject,
                    status: "open",
                    priority:
                      servicePriority === "urgent"
                        ? "critical"
                        : servicePriority === "high"
                        ? "high"
                        : servicePriority === "normal"
                        ? "medium"
                        : "low",
                    created: nowIso,
                    lastUpdate: nowIso,
                  };
                  setServiceTickets((prev) => [newTicket, ...prev]);
                  toast.success(
                    "Service booking request submitted successfully"
                  );
                  setScheduleOpen(false);
                  setServiceWorkstation("");
                  setServiceDate("");
                  setServiceIssue("");
                  setServicePriority("normal");
                  // Switch to support tab to show new ticket
                  setActiveTab("support");
                } catch (e) {
                  logger.error("Failed to create service booking", {
                    error: e,
                  });
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "Failed to submit service request"
                  );
                } finally {
                  setServiceBusy(false);
                }
              }}
            >
              {serviceBusy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Service
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
