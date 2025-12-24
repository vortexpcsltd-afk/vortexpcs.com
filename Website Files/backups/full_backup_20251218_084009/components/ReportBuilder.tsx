import { useCallback, useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import {
  Download,
  FileText,
  Calendar,
  Mail,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { firebaseIsConfigured } from "../config/firebase";
import { getIdTokenForAuthenticatedRequest } from "../services/auth";
import { logger } from "../services/logger";

interface ScheduledReport {
  id?: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  format: "pdf" | "excel";
  recipients: string[];
  metrics: string[];
  enabled: boolean;
  lastSent?: Date;
  nextScheduled?: Date;
}

const AVAILABLE_METRICS = [
  { id: "sessions", label: "Total Sessions", category: "Analytics" },
  { id: "pageViews", label: "Page Views", category: "Analytics" },
  { id: "users", label: "Unique Users", category: "Analytics" },
  { id: "avgDuration", label: "Avg Session Duration", category: "Analytics" },
  { id: "bounceRate", label: "Bounce Rate", category: "Analytics" },
  { id: "orders", label: "Total Orders", category: "Orders" },
  { id: "revenue", label: "Revenue", category: "Orders" },
  { id: "avgOrderValue", label: "Avg Order Value", category: "Orders" },
  { id: "completedOrders", label: "Completed Orders", category: "Orders" },
  { id: "pendingOrders", label: "Pending Orders", category: "Orders" },
  { id: "totalCustomers", label: "Total Customers", category: "Customers" },
  { id: "newCustomers", label: "New Customers", category: "Customers" },
  {
    id: "returningCustomers",
    label: "Returning Customers",
    category: "Customers",
  },
  { id: "supportTickets", label: "Support Tickets", category: "Support" },
  { id: "openTickets", label: "Open Tickets", category: "Support" },
  { id: "avgResponseTime", label: "Avg Response Time", category: "Support" },
];

const PERIOD_PRESETS = [
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export function ReportBuilder() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(
    []
  );

  // Helper function to get auth token with retry logic
  const getAuthToken = async (): Promise<string> => {
    if (!firebaseIsConfigured) {
      throw new Error("Authentication unavailable (Firebase not configured).");
    }
    let attempts = 4;
    while (attempts-- > 0) {
      if (authLoading) {
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
      const token = await getIdTokenForAuthenticatedRequest();
      if (token) return token;

      // Fallback: try user.getIdToken() if available
      try {
        if (
          user &&
          typeof (user as unknown as { getIdToken?: () => Promise<string> })
            .getIdToken === "function"
        ) {
          const t = await (
            user as unknown as { getIdToken: () => Promise<string> }
          ).getIdToken();
          if (t) return t;
        }
      } catch (e) {
        logger.error("Fallback token retrieval failed", e);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    throw new Error(
      "Unable to authenticate. Please reload the page and try again."
    );
  };

  // One-time report settings
  const [reportFormat, setReportFormat] = useState<"pdf" | "excel">("pdf");
  const [reportPeriod, setReportPeriod] = useState("30days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "sessions",
    "orders",
    "revenue",
  ]);

  // Scheduled report settings
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");
  const [scheduleFormat, setScheduleFormat] = useState<"pdf" | "excel">("pdf");
  const [scheduleRecipients, setScheduleRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [scheduleMetrics, setScheduleMetrics] = useState<string[]>([
    "sessions",
    "orders",
    "revenue",
  ]);

  const fetchScheduledReports = useCallback(async () => {
    try {
      // Skip when Firebase isn't configured or auth is not ready
      if (!firebaseIsConfigured || authLoading || !user) return;

      const token = await getIdTokenForAuthenticatedRequest();

      if (!token) return;

      const res = await fetch("/api/admin/reports/schedule", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch scheduled reports");

      const data = await res.json();
      setScheduledReports(data.reports || []);
    } catch (error) {
      logger.error("Error fetching scheduled reports:", error);
    }
  }, [authLoading, user]);

  useEffect(() => {
    fetchScheduledReports();
  }, [fetchScheduledReports]);

  async function generateReport() {
    if (selectedMetrics.length === 0) {
      toast.error("Please select at least one metric");
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();

      let queryParams = `format=${reportFormat}`;
      if (reportPeriod === "custom") {
        if (!customStartDate || !customEndDate) {
          toast.error("Please select start and end dates");
          setLoading(false);
          return;
        }
        queryParams += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      } else {
        queryParams += `&period=${reportPeriod}`;
      }

      const res = await fetch(`/api/admin/reports/generate?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to generate report");
      }

      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vortex-report-${format(new Date(), "yyyy-MM-dd")}.${
        reportFormat === "pdf" ? "pdf" : "xlsx"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  async function createScheduledReport() {
    if (
      !scheduleName ||
      scheduleRecipients.length === 0 ||
      scheduleMetrics.length === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();

      const res = await fetch("/api/admin/reports/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: scheduleName,
          frequency: scheduleFrequency,
          format: scheduleFormat,
          recipients: scheduleRecipients,
          metrics: scheduleMetrics,
          enabled: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to create scheduled report");

      toast.success("Scheduled report created");
      setShowScheduleForm(false);
      setScheduleName("");
      setScheduleRecipients([]);
      fetchScheduledReports();
    } catch (error) {
      console.error("Error creating scheduled report:", error);
      toast.error("Failed to create scheduled report");
    } finally {
      setLoading(false);
    }
  }

  async function deleteScheduledReport(id: string) {
    if (!confirm("Are you sure you want to delete this scheduled report?"))
      return;

    try {
      const token = await getAuthToken();

      const res = await fetch(`/api/admin/reports/schedule?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete scheduled report");

      toast.success("Scheduled report deleted");
      fetchScheduledReports();
    } catch (error) {
      console.error("Error deleting scheduled report:", error);
      toast.error("Failed to delete scheduled report");
    }
  }

  async function toggleScheduledReport(id: string, enabled: boolean) {
    try {
      const token = await getAuthToken();

      const res = await fetch("/api/admin/reports/schedule", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, enabled }),
      });

      if (!res.ok) throw new Error("Failed to update scheduled report");

      toast.success(`Report ${enabled ? "enabled" : "disabled"}`);
      fetchScheduledReports();
    } catch (error) {
      console.error("Error updating scheduled report:", error);
      toast.error("Failed to update scheduled report");
    }
  }

  async function sendScheduledReportNow(report: ScheduledReport) {
    if (
      !confirm(
        `Send "${report.name}" now to ${report.recipients.length} recipient(s)?`
      )
    )
      return;

    try {
      setLoading(true);
      const token = await getAuthToken();

      // Calculate date range based on frequency
      const endDate = new Date();
      const startDate = new Date();
      switch (report.frequency) {
        case "daily":
          startDate.setDate(endDate.getDate() - 1);
          break;
        case "weekly":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }

      // Generate the report
      const params = new URLSearchParams({
        format: report.format,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        metrics: report.metrics.join(","),
      });

      const reportRes = await fetch(
        `/api/admin/reports/generate?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!reportRes.ok) throw new Error("Failed to generate report");

      // In a real implementation, you would send the email here
      // For now, we'll just download the report
      const blob = await reportRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name}-${format(new Date(), "yyyy-MM-dd")}.${
        report.format
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        `Report generated! Email functionality requires backend implementation.`
      );
    } catch (error) {
      console.error("Error sending report:", error);
      toast.error("Failed to send report");
    } finally {
      setLoading(false);
    }
  }

  function toggleMetric(metricId: string, isScheduled = false) {
    if (isScheduled) {
      setScheduleMetrics((prev) =>
        prev.includes(metricId)
          ? prev.filter((m) => m !== metricId)
          : [...prev, metricId]
      );
    } else {
      setSelectedMetrics((prev) =>
        prev.includes(metricId)
          ? prev.filter((m) => m !== metricId)
          : [...prev, metricId]
      );
    }
  }

  function addRecipient() {
    if (!recipientInput.trim()) return;

    const email = recipientInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email address");
      return;
    }

    if (scheduleRecipients.includes(email)) {
      toast.error("Email already added");
      return;
    }

    setScheduleRecipients([...scheduleRecipients, email]);
    setRecipientInput("");
  }

  function removeRecipient(email: string) {
    setScheduleRecipients(scheduleRecipients.filter((e) => e !== email));
  }

  const metricsGroups = AVAILABLE_METRICS.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_METRICS>);

  // Admin-only banner when Firebase is not configured
  if (isAdmin && !firebaseIsConfigured) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">
              Reports Unavailable
            </h2>
            <p className="text-sm text-gray-300">
              Firebase is not configured in this environment. Authentication is
              required for generating and scheduling admin reports.
            </p>
            <div className="text-sm text-gray-400">
              <div className="mb-1 text-gray-300">Client (Vite) variables:</div>
              <ul className="list-disc pl-5">
                <li>VITE_FIREBASE_API_KEY</li>
                <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                <li>VITE_FIREBASE_PROJECT_ID</li>
              </ul>
              <div className="mt-3 mb-1 text-gray-300">
                Server (Admin) variables:
              </div>
              <ul className="list-disc pl-5">
                <li>FIREBASE_PROJECT_ID</li>
                <li>FIREBASE_CLIENT_EMAIL</li>
                <li>
                  FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_BASE64)
                </li>
              </ul>
            </div>
            <div className="pt-2">
              <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-300">
                Admin action disabled
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* One-Time Report Generator */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-sky-500/20 border border-sky-500/30">
            <FileText className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Generate Report</h2>
            <p className="text-sm text-gray-400">
              Create and download custom analytics reports
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-white">Report Format</Label>
            <Select
              value={reportFormat}
              onValueChange={(v: "pdf" | "excel") => setReportFormat(v)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period Selection */}
          <div className="space-y-2">
            <Label className="text-white">Time Period</Label>
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {reportPeriod === "custom" && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </>
          )}
        </div>

        {/* Metrics Selection */}
        <div className="space-y-3 mb-6">
          <Label className="text-white">Select Metrics to Include</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metricsGroups).map(([category, metrics]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-semibold text-sky-400">
                  {category}
                </h4>
                {metrics.map((metric) => (
                  <div key={metric.id} className="flex items-center gap-2">
                    <Checkbox
                      id={metric.id}
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetric(metric.id)}
                      className="border-white/20"
                    />
                    <label
                      htmlFor={metric.id}
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      {metric.label}
                    </label>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={generateReport}
          disabled={loading || authLoading || selectedMetrics.length === 0}
          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
        >
          {loading || authLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download Report
            </>
          )}
        </Button>
      </Card>

      {/* Scheduled Reports */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Scheduled Reports
              </h2>
              <p className="text-sm text-gray-400">
                Automate report delivery via email
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            variant="outline"
            className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
        </div>

        {/* Schedule Form */}
        {showScheduleForm && (
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Report Name</Label>
                <Input
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Weekly Sales Report"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Frequency</Label>
                <Select
                  value={scheduleFrequency}
                  onValueChange={(v: "daily" | "weekly" | "monthly") =>
                    setScheduleFrequency(v)
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Format</Label>
                <Select
                  value={scheduleFormat}
                  onValueChange={(v: "pdf" | "excel") => setScheduleFormat(v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Email Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                    placeholder="email@example.com"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Button
                    onClick={addRecipient}
                    variant="outline"
                    className="border-white/20"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {scheduleRecipients.map((email) => (
                    <Badge
                      key={email}
                      className="bg-sky-500/20 border-sky-500/30 text-sky-400"
                    >
                      {email}
                      <button
                        onClick={() => removeRecipient(email)}
                        className="ml-2 hover:text-red-400"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Metrics to Include</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AVAILABLE_METRICS.map((metric) => (
                  <div key={metric.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`schedule-${metric.id}`}
                      checked={scheduleMetrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetric(metric.id, true)}
                      className="border-white/20"
                    />
                    <label
                      htmlFor={`schedule-${metric.id}`}
                      className="text-xs text-gray-300 cursor-pointer"
                    >
                      {metric.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createScheduledReport}
                disabled={loading || authLoading}
                className="bg-gradient-to-r from-sky-600 to-blue-600"
              >
                {loading || authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowScheduleForm(false)}
                variant="outline"
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Scheduled Reports List */}
        <div className="space-y-3">
          {scheduledReports.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No scheduled reports yet</p>
              <p className="text-sm">Create one to automate report delivery</p>
            </div>
          ) : (
            scheduledReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{report.name}</h3>
                    <Badge
                      className={
                        report.enabled
                          ? "bg-green-500/20 border-green-500/30 text-green-400"
                          : "bg-gray-500/20 border-gray-500/30 text-gray-400"
                      }
                    >
                      {report.enabled ? "Active" : "Disabled"}
                    </Badge>
                    <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400">
                      {report.frequency}
                    </Badge>
                    <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-400">
                      {report.format.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>📧 {report.recipients.length} recipients</span>
                    <span>📊 {report.metrics.length} metrics</span>
                    {report.nextScheduled && (
                      <span>
                        Next:{" "}
                        {format(
                          new Date(report.nextScheduled),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => sendScheduledReportNow(report)}
                    variant="outline"
                    size="sm"
                    className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                    disabled={loading}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Now
                  </Button>
                  <Button
                    onClick={() =>
                      toggleScheduledReport(report.id!, !report.enabled)
                    }
                    variant="outline"
                    size="sm"
                    className="border-white/20"
                  >
                    {report.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    onClick={() => deleteScheduledReport(report.id!)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-500/10 backdrop-blur-xl border-blue-500/30 p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Report Generation Tips</p>
            <ul className="space-y-1 text-blue-300/80">
              <li>• PDF reports are best for sharing and presentations</li>
              <li>• Excel reports allow further data analysis</li>
              <li>
                • Scheduled reports are sent at 9:00 AM on the scheduled day
              </li>
              <li>
                • You can enable/disable scheduled reports without deleting them
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
