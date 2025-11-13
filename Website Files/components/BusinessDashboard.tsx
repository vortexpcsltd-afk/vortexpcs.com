/**
 * Business Customer Dashboard
 * Comprehensive members area for business customers to manage subscriptions,
 * service agreements, purchased workstations, and support tickets
 */

import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
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
} from "lucide-react";

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
    "overview" | "subscriptions" | "workstations" | "support"
  >("overview");

  // Mock data - would be fetched from backend
  const businessInfo = {
    companyName: "Example Business Ltd",
    accountNumber: "VTX-BUS-2024-001",
    contactPerson: "John Smith",
    email: "john.smith@example.com",
    phone: "+44 1234 567890",
    memberSince: "January 2024",
  };

  const subscriptions: Subscription[] = [
    {
      id: "sub-001",
      plan: "priority-support",
      planName: "Priority Support",
      status: "active",
      startDate: "2024-01-15",
      renewalDate: "2025-01-15",
      price: 49,
      billing: "monthly",
      autoRenew: true,
      machinesCovered: 12,
    },
  ];

  const purchasedPCs: PurchasedPC[] = [
    {
      id: "pc-001",
      workstationName: "Productivity Pro",
      serialNumber: "VTX-PP-2024-0123",
      purchaseDate: "2024-01-20",
      warrantyExpiry: "2027-01-20",
      warrantyStatus: "active",
      specs: {
        processor: "Intel Core i7-13700",
        ram: "32GB DDR4",
        storage: "1TB NVMe SSD",
      },
      lastServiceDate: "2024-10-15",
      nextScheduledService: "2025-01-15",
    },
    {
      id: "pc-002",
      workstationName: "Essential Office",
      serialNumber: "VTX-EO-2024-0156",
      purchaseDate: "2024-02-10",
      warrantyExpiry: "2027-02-10",
      warrantyStatus: "active",
      specs: {
        processor: "Intel Core i5-13400",
        ram: "16GB DDR4",
        storage: "512GB NVMe SSD",
      },
      lastServiceDate: "2024-11-01",
    },
    {
      id: "pc-003",
      workstationName: "Creative Powerhouse",
      serialNumber: "VTX-CP-2024-0089",
      purchaseDate: "2024-03-05",
      warrantyExpiry: "2027-03-05",
      warrantyStatus: "active",
      specs: {
        processor: "AMD Ryzen 9 7900X",
        ram: "64GB DDR5",
        storage: "2TB NVMe SSD",
      },
    },
  ];

  const serviceTickets: ServiceTicket[] = [
    {
      id: "ticket-045",
      title: "Quarterly maintenance - 12 workstations",
      status: "in-progress",
      priority: "medium",
      created: "2024-11-10",
      lastUpdate: "2024-11-12",
      assignedTo: "Technical Team",
      responseTime: "2 hours",
    },
    {
      id: "ticket-042",
      title: "Performance optimisation - VTX-PP-2024-0123",
      status: "resolved",
      priority: "low",
      created: "2024-10-28",
      lastUpdate: "2024-10-30",
      assignedTo: "Sarah Johnson",
      pcSerial: "VTX-PP-2024-0123",
      responseTime: "4 hours",
    },
  ];

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
            <Button
              onClick={() => setCurrentView("business-solutions")}
              className="bg-white/10 hover:bg-white/20 border border-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Services
            </Button>
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
                  onClick={() => setActiveTab("support")}
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

            {subscriptions.map((sub) => (
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
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Agreement
                      </Button>
                      <Button
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 border border-white/20"
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
          </div>
        )}

        {/* Workstations Tab */}
        {activeTab === "workstations" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Your Workstations</h2>
              <Button
                onClick={() => setCurrentView("business-solutions")}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Order More
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {purchasedPCs.map((pc) => (
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
                      <span className="font-semibold">{pc.specs.storage}</span>
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
                    {pc.lastServiceDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Wrench className="w-4 h-4 text-sky-400" />
                        <span className="text-gray-400">Last Service:</span>
                        <span>
                          {new Date(pc.lastServiceDate).toLocaleDateString()}
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
          </div>
        )}

        {/* Support Tab */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Support Tickets</h2>
              <Button className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500">
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
                      href="tel:+441234567890"
                      className="flex items-center gap-2 text-sky-400 hover:text-sky-300"
                    >
                      <Phone className="w-4 h-4" />
                      +44 1234 567890
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
              {serviceTickets.map((ticket) => (
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
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Support Resources */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h3 className="text-lg font-bold mb-4">Support Resources</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left">
                  <FileText className="w-6 h-6 text-sky-400 mb-2" />
                  <div className="font-semibold mb-1">Knowledge Base</div>
                  <div className="text-xs text-gray-400">
                    Find answers to common questions
                  </div>
                </button>

                <button className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left">
                  <Download className="w-6 h-6 text-sky-400 mb-2" />
                  <div className="font-semibold mb-1">Downloads</div>
                  <div className="text-xs text-gray-400">
                    Drivers, manuals, and software
                  </div>
                </button>

                <button className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left">
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
    </div>
  );
}
