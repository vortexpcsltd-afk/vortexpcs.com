/**
 * Analytics Dashboard Component
 * Comprehensive analytics with live stats, visitor tracking, security monitoring
 */

import { useState, useEffect, useMemo } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LiveVisitors } from "./LiveVisitors";
import {
  VisitorSessionModal,
  type VisitorSession,
} from "./VisitorSessionModal";
import { AnalyticsDiagnostics } from "./AnalyticsDiagnostics";
import {
  Users,
  Eye,
  TrendingUp,
  Shield,
  Download,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  ArrowRight,
  ShoppingCart,
  Trash2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { auth, db } from "../config/firebase";
import { firebaseClientConfig } from "../config/firebase";
import { toast } from "sonner";
import {
  validateMonthlyData,
  type ValidatedMonthlyData,
} from "../utils/validation";
import { logger } from "../services/logger";
import { getSessionsForDate } from "../services/advancedAnalytics";

interface LiveStats {
  totalActive: number;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  pageDistribution: Record<string, number>;
  sessions: Array<{
    sessionId: string;
    userId: string;
    currentPage: string;
    lastActivity: string;
    device: { type: string; browser: string; os: string };
    browser: string;
    source: string;
    searchTerm?: string;
    ip?: string;
    timeOnSite: number;
  }>;
}
interface VisitorStats {
  summary: {
    daily: number;
    weekly: number;
    monthly: number;
    ytd: number;
    totalPageViews: number;
    avgPageViewsPerSession: string;
    avgSessionDuration: number;
    bounceRate: string;
  };
  timeSeries: Array<{ date: string; visitors: number }>;
}

interface PageStats {
  topPages: Array<{
    page: string;
    views: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
  }>;
  topEntryPages: Array<{ page: string; sessions: number }>;
  topExitPages?: Array<{ page: string; exits: number }>;
  topTransitions?: Array<{ from: string; to: string; count: number }>;
  topPaths3?: Array<{ path: string; count: number }>;
  totalViews: number;
}

interface SecurityStats {
  summary: {
    totalLoginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    suspiciousActivity: number;
    successRate: string;
  };
  topFailedEmails: Array<{ email: string; attempts: number }>;
  topFailedIPs: Array<{ ip: string; attempts: number }>;
  loginTimeSeries: Array<{ date: string; successful: number; failed: number }>;
}

interface DownloadStats {
  summary: {
    totalDownloads: number;
    uniqueFiles: number;
    avgDownloadsPerDay: string;
  };
  topDownloads: Array<{ file: string; downloads: number }>;
  timeSeries: Array<{ date: string; downloads: number }>;
}

interface ProductStats {
  summary: {
    totalViews: number;
    uniqueProducts: number;
    avgViewsPerProduct: string;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    category: string;
    views: number;
    price?: number;
    brand?: string;
  }>;
  categoryBreakdown: Record<string, number>;
  timeSeries: Array<{ date: string; views: number }>;
}

interface BuildStats {
  summary: {
    totalBuildsCompleted: number;
    totalBuilderVisits: number;
    completionRate: string;
    avgBuildValue: number;
  };
  buildsByPrice: Record<string, number>;
}

interface SaveStats {
  summary: {
    totalSaves: number;
    savedToAccount: number;
    savedForComparison: number;
    accountSaveRate: string;
  };
}

interface YtdMonthlyBreakdown {
  monthIndex: number;
  month: string;
  year: number;
  visitors: number;
  sessions: number;
  pageviews: number;
}

interface YtdData {
  period: {
    startDate: string;
    endDate: string;
    daysIntoYear: number;
    currentYear: number;
  };
  overview: {
    totalVisitors: number;
    totalPageViews: number;
    totalSessions: number;
    totalEvents: number;
    uniqueIPs: number;
    avgSessionDuration: number;
    bounceRate: number;
    avgPageViewsPerSession: string;
  };
  users: {
    newUsers: number;
    returningUsers: number;
    avgNewUsersPerDay: number;
  };
  revenue: {
    total: number;
    orders: number;
    avgOrderValue: number;
    avgRevenuePerDay: number;
    ordersByStatus: Record<string, number>;
  };
  security: {
    totalLoginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    successRate: string;
  };
  topPages: Array<{
    page: string;
    views: number;
    uniqueVisitors?: number;
    avgTimeOnPage?: number;
  }>;
  eventsByType: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  monthlyBreakdown: YtdMonthlyBreakdown[];
  dailyAverages: {
    visitors: number;
    pageViews: number;
    sessions: number;
    revenue: number;
    orders: number | string;
  };
}

export function AnalyticsDashboard() {
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [pageStats, setPageStats] = useState<PageStats | null>(null);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(
    null
  );
  const [downloadStats, setDownloadStats] = useState<DownloadStats | null>(
    null
  );
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [buildStats, setBuildStats] = useState<BuildStats | null>(null);
  const [saveStats, setSaveStats] = useState<SaveStats | null>(null);
  const [cartStats, setCartStats] = useState<{
    totalBuilderSessions: number;
    totalWithSelection: number;
    totalCompleted: number;
    abandoned: number;
    abandonmentRate: string;
    period: number;
  } | null>(null);
  const [compatStats, setCompatStats] = useState<{
    topIssues: Array<{ title: string; count: number }>;
    severityCounts: Record<string, number>;
    totalWarnings: number;
    period: number;
  } | null>(null);
  const [qualityStats, setQualityStats] = useState<{
    avgScore: number;
    medianScore: number;
    distribution: Record<string, number>;
    sample: number;
    period: number;
  } | null>(null);
  const [frustrationStats, setFrustrationStats] = useState<{
    totalSignals: number;
    bySubtype: Record<string, number>;
    topSelectors: Array<{ selector: string; count: number }>;
    topPages: Array<{ page: string; count: number }>;
    period: number;
  } | null>(null);
  const [performanceStats, setPerformanceStats] = useState<{
    totalIssues: number;
    byType: Record<string, number>;
    byBrowser: Record<string, number>;
    byDevice: Record<string, number>;
    topPages: Array<{ page: string; count: number }>;
    period: number;
  } | null>(null);
  const [adoptionStats, setAdoptionStats] = useState<{
    totalFeatures: number;
    items: Array<{
      feature: string;
      uniqueUsers: number;
      uses: number;
      adoptionRate: string;
    }>;
    period: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7); // days (reduced by default)
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [viewMode, setViewMode] = useState<"standard" | "monthly" | "ytd">(
    "standard"
  );
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [visitorTrendPeriod, setVisitorTrendPeriod] = useState<
    "7d" | "wtd" | "mtd" | "ytd"
  >("7d");
  const [monthlyData, setMonthlyData] = useState<ValidatedMonthlyData | null>(
    null
  );
  const [ytdData, setYtdData] = useState<YtdData | null>(null);
  const [ytdYear, setYtdYear] = useState<number>(currentYear);
  const [ytdCache, setYtdCache] = useState<Record<number, YtdData>>({});
  const ytdYearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - i),
    [currentYear]
  );
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetType, setResetType] = useState("all");
  const [resetting, setResetting] = useState(false);

  // Visitor session modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sessionData, setSessionData] = useState<VisitorSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [errors, setErrors] = useState<
    Array<{ endpoint: string; message: string; status?: number }>
  >([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isAuthed = Boolean(auth?.currentUser);
  const firebaseConfigured = Boolean(db);
  const consentAccepted =
    typeof window !== "undefined" &&
    localStorage.getItem("vortex_cookie_consent") === "accepted";
  const consentBypassActive = isAuthed && !consentAccepted;

  // Fetch monthly summary
  const fetchMonthlySummary = async () => {
    if (!auth || !auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `/api/admin/analytics/summary-monthly?months=12`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        logger.error(
          "Monthly summary returned non-JSON",
          new Error(
            `Status: ${
              res.status
            }, ContentType: ${contentType}, Body: ${text.substring(0, 200)}`
          )
        );
        toast.error(
          `API not available (returned ${res.status}). Deploy to Vercel to enable.`
        );
        return;
      }

      const data = await res.json();
      if (data.success) {
        // Validate and sanitize data before setting state
        const validatedData = validateMonthlyData(data.data);
        setMonthlyData(validatedData);
      } else {
        logger.error(
          "Monthly summary API error",
          new Error(JSON.stringify(data))
        );
        toast.error(
          data.error || data.details || "Failed to load monthly summary"
        );
      }
    } catch (error) {
      logger.error("Failed to fetch monthly summary", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load monthly summary"
      );
    }
  };

  // Fetch YTD summary
  const fetchYTDSummary = async (yearOverride?: number) => {
    const targetYear = yearOverride ?? ytdYear;
    if (!auth || !auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `/api/admin/analytics/summary-ytd?year=${targetYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        logger.error(
          "YTD summary returned non-JSON",
          new Error(
            `Status: ${
              res.status
            }, ContentType: ${contentType}, Body: ${text.substring(0, 200)}`
          )
        );
        toast.error(
          `API not available (returned ${res.status}). Deploy to Vercel to enable.`
        );
        return;
      }

      const data = await res.json();
      if (data.success) {
        const payload = data.data as YtdData;
        setYtdData(payload);
        setYtdCache((prev) => ({ ...prev, [targetYear]: payload }));
      } else {
        logger.error("YTD summary API error", new Error(JSON.stringify(data)));
        toast.error(data.error || data.details || "Failed to load YTD summary");
      }
    } catch (error) {
      logger.error("Failed to fetch YTD summary", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load YTD summary"
      );
    }
  };

  // Reset analytics
  const handleResetAnalytics = async () => {
    if (resetConfirmText !== "RESET") {
      toast.error('Please type "RESET" to confirm');
      return;
    }

    setResetting(true);
    try {
      if (!auth || !auth.currentUser) {
        toast.error("Authentication required");
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/analytics/reset`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: resetType,
          confirm: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `Successfully reset analytics. Deleted ${data.data.deletedCount} documents.`
        );
        setShowResetModal(false);
        setResetConfirmText("");
        // Refresh data
        fetchAnalytics();
        if (viewMode === "monthly") fetchMonthlySummary();
        if (viewMode === "ytd") fetchYTDSummary();
      } else {
        toast.error(data.error || "Failed to reset analytics");
      }
    } catch (error) {
      logger.error("Reset error", error);
      toast.error("Failed to reset analytics");
    } finally {
      setResetting(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      if (!auth || !auth.currentUser) {
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const newErrors: Array<{
        endpoint: string;
        message: string;
        status?: number;
      }> = [];

      // Fetch all analytics in parallel
      const [
        liveRes,
        visitorsRes,
        pagesRes,
        securityRes,
        downloadsRes,
        productsRes,
        buildsRes,
        savesRes,
        cartRes,
        compatRes,
        qualityRes,
        frustrationRes,
        performanceRes,
        adoptionRes,
      ] = await Promise.all([
        fetch("/api/admin/analytics/live", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/visitors?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/pages?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/security?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/downloads?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/products?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/builds?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/saves?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/cart?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/compat?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/sessionQuality?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/frustration?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/performance?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/analytics/adoption?days=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Helper to safely parse JSON responses
      const safeJsonParse = async (res: Response) => {
        try {
          const text = await res.text();
          if (!text) return { success: false, error: "Empty response" };
          return JSON.parse(text);
        } catch (error) {
          return {
            success: false,
            error: `Failed to parse response: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      };

      const [
        live,
        visitors,
        pages,
        security,
        downloads,
        products,
        builds,
        saves,
        cart,
        compat,
        quality,
        frustration,
        performance,
        adoption,
      ] = await Promise.all([
        safeJsonParse(liveRes),
        safeJsonParse(visitorsRes),
        safeJsonParse(pagesRes),
        safeJsonParse(securityRes),
        safeJsonParse(downloadsRes),
        safeJsonParse(productsRes),
        safeJsonParse(buildsRes),
        safeJsonParse(savesRes),
        safeJsonParse(cartRes),
        safeJsonParse(compatRes),
        safeJsonParse(qualityRes),
        safeJsonParse(frustrationRes),
        safeJsonParse(performanceRes),
        safeJsonParse(adoptionRes),
      ]);

      // Track errors
      if (!liveRes.ok || !live.success) {
        const errorMsg =
          liveRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : live.error || live.details || "Unknown error";
        newErrors.push({
          endpoint: "live",
          message: errorMsg,
          status: liveRes.status,
        });
      } else {
        setLiveStats(live.data);
      }
      if (!visitorsRes.ok || !visitors.success) {
        const errorMsg =
          visitorsRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : visitors.error || visitors.details || "Unknown error";
        newErrors.push({
          endpoint: "visitors",
          message: errorMsg,
          status: visitorsRes.status,
        });
      } else {
        logger.info("Visitor stats received", { data: visitors.data });
        logger.info("Time series length", {
          length: visitors.data?.timeSeries?.length,
        });
        setVisitorStats(visitors.data);
      }
      if (!pagesRes.ok || !pages.success) {
        const errorMsg =
          pagesRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : pages.error || pages.details || "Unknown error";
        newErrors.push({
          endpoint: "pages",
          message: errorMsg,
          status: pagesRes.status,
        });
      } else {
        setPageStats(pages.data);
      }
      if (!securityRes.ok || !security.success) {
        const errorMsg =
          securityRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : security.error || security.details || "Unknown error";
        newErrors.push({
          endpoint: "security",
          message: errorMsg,
          status: securityRes.status,
        });
      } else {
        setSecurityStats(security.data);
      }
      if (!downloadsRes.ok || !downloads.success) {
        const errorMsg =
          downloadsRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : downloads.error || downloads.details || "Unknown error";
        newErrors.push({
          endpoint: "downloads",
          message: errorMsg,
          status: downloadsRes.status,
        });
      } else {
        setDownloadStats(downloads.data);
      }
      if (!productsRes.ok || !products.success) {
        const errorMsg =
          productsRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : products.error || products.details || "Unknown error";
        newErrors.push({
          endpoint: "products",
          message: errorMsg,
          status: productsRes.status,
        });
      } else {
        setProductStats(products.data);
      }
      if (!buildsRes.ok || !builds.success) {
        const errorMsg =
          buildsRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : builds.error || builds.details || "Unknown error";
        newErrors.push({
          endpoint: "builds",
          message: errorMsg,
          status: buildsRes.status,
        });
      } else {
        setBuildStats(builds.data);
      }
      if (!savesRes.ok || !saves.success) {
        const errorMsg =
          savesRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : saves.error || saves.details || "Unknown error";
        newErrors.push({
          endpoint: "saves",
          message: errorMsg,
          status: savesRes.status,
        });
      } else {
        setSaveStats(saves.data);
      }
      if (!cartRes.ok || !cart.success) {
        const errorMsg =
          cartRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : cart.error || cart.details || "Unknown error";
        newErrors.push({
          endpoint: "cart",
          message: errorMsg,
          status: cartRes.status,
        });
      } else {
        setCartStats(cart.data);
      }
      if (!compatRes.ok || !compat.success) {
        const errorMsg =
          compatRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : compat.error || compat.details || "Unknown error";
        newErrors.push({
          endpoint: "compat",
          message: errorMsg,
          status: compatRes.status,
        });
      } else {
        setCompatStats(compat.data);
      }

      if (!qualityRes.ok || !quality.success) {
        const errorMsg =
          qualityRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : quality.error || quality.details || "Unknown error";
        newErrors.push({
          endpoint: "sessionQuality",
          message: errorMsg,
          status: qualityRes.status,
        });
      } else {
        setQualityStats(quality.data);
      }

      if (!frustrationRes.ok || !frustration.success) {
        const errorMsg =
          frustrationRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : frustration.error || frustration.details || "Unknown error";
        newErrors.push({
          endpoint: "frustration",
          message: errorMsg,
          status: frustrationRes.status,
        });
      } else {
        setFrustrationStats(frustration.data);
      }

      if (!performanceRes.ok || !performance.success) {
        const errorMsg =
          performanceRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : performance.error || performance.details || "Unknown error";
        newErrors.push({
          endpoint: "performance",
          message: errorMsg,
          status: performanceRes.status,
        });
      } else {
        setPerformanceStats(performance.data);
      }

      if (!adoptionRes.ok || !adoption.success) {
        const errorMsg =
          adoptionRes.status === 401
            ? "Authentication failed - Please sign in as admin"
            : adoption.error || adoption.details || "Unknown error";
        newErrors.push({
          endpoint: "adoption",
          message: errorMsg,
          status: adoptionRes.status,
        });
      } else {
        setAdoptionStats(adoption.data);
      }

      setErrors(newErrors);
      // Backoff auto-refresh on rate-limit/quota responses
      if (newErrors.some((e) => e.status === 429 || e.status === 503)) {
        setAutoRefresh(false);
        toast.warning(
          "Auto-refresh paused due to rate limit/quota. Try again later.",
          { duration: 5000 }
        );
      }
      setLoading(false);
      setLastUpdated(new Date());
    } catch (error) {
      logger.error("Fetch analytics error", error);
      setErrors([
        {
          endpoint: "all",
          message: error instanceof Error ? error.message : "Network error",
        },
      ]);
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    if (viewMode === "monthly" && !monthlyData) {
      fetchMonthlySummary();
    } else if (viewMode === "ytd" && !ytdData) {
      fetchYTDSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // When YTD is selected in the visitor trend, ensure we have data for the selected year
  useEffect(() => {
    if (visitorTrendPeriod !== "ytd") return;
    if (!auth?.currentUser) return;

    const cached = ytdCache[ytdYear];
    if (cached) {
      setYtdData(cached);
      return;
    }
    fetchYTDSummary(ytdYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitorTrendPeriod, ytdYear, auth?.currentUser]);

  useEffect(() => {
    if (!autoRefresh) return;
    if (!auth?.currentUser) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 120000); // Refresh every 120 seconds to reduce read load

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, period]);

  // Handle bar click to show visitor sessions
  const handleBarClick = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowSessionModal(true);
    setLoadingSessions(true);

    try {
      const sessions = await getSessionsForDate(dateStr);

      // Transform to VisitorSession format
      const transformedSessions: VisitorSession[] = sessions.map((session) => {
        const totalTime = session.lastActivity
          ? Math.floor(
              (session.lastActivity.getTime() - session.startTime.getTime()) /
                1000
            )
          : 0;

        return {
          sessionId: session.sessionId,
          ip: session.ip || "Unknown",
          referrerSource: session.referrerSource || "Direct",
          referrerTerm: session.referrerTerm,
          referrerUrl: session.referrer,
          startTime: session.startTime,
          endTime: session.lastActivity,
          totalTime,
          totalPageViews: session.pageViews,
          pages: session.pages.map((page, index) => {
            // Estimate time on page (time until next page or end of session)
            const nextPage = session.pages[index + 1];
            const pageTime = nextPage
              ? Math.floor(
                  (new Date(nextPage).getTime() - new Date(page).getTime()) /
                    1000
                )
              : undefined;

            return {
              path: typeof page === "string" ? page : "/",
              title: typeof page === "string" ? page : "Page",
              timestamp: new Date(session.startTime.getTime() + index * 60000), // Approximate
              timeOnPage: pageTime,
            };
          }),
          exitPage: session.pages[session.pages.length - 1] || "/",
          location: session.location,
          device: session.device,
        };
      });

      setSessionData(transformedSessions);
    } catch (error) {
      logger.error("Failed to load session data:", error);
      toast.error("Failed to load visitor sessions");
      setSessionData([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visitor Session Modal */}
      <VisitorSessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        date={selectedDate}
        sessions={loadingSessions ? [] : sessionData}
      />
      {/* Not signed in notice */}
      {!isAuthed && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-400">
                  Not signed in
                </h3>
              </div>
              <p className="text-sm text-yellow-200">
                Sign in as an admin to view analytics. The Refresh button is
                disabled until you are authenticated.
              </p>
            </div>
          </div>
        </Card>
      )}
      {/* Cooldown / Error Banner */}
      {errors.length > 0 && (
        <Card
          className={`p-4 ${
            errors.some((e) => e.status === 429 || e.status === 503)
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    errors.some((e) => e.status === 429 || e.status === 503)
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                />
                <h3
                  className={`text-lg font-semibold ${
                    errors.some((e) => e.status === 429 || e.status === 503)
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {errors.some((e) => e.status === 429 || e.status === 503)
                    ? "Analytics Cooldown (Quota/Rate Limit)"
                    : `Analytics API Errors (${errors.length})`}
                </h3>
              </div>
              <div className="space-y-1 text-sm">
                {errors.map((err, idx) => (
                  <div key={idx} className="text-red-300">
                    <span className="font-semibold">{err.endpoint}:</span>{" "}
                    {err.status && `[${err.status}] `}
                    {err.message}
                  </div>
                ))}
              </div>
              <p
                className={`text-xs mt-2 ${
                  errors.some((e) => e.status === 429 || e.status === 503)
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {errors.some((e) => e.status === 429 || e.status === 503)
                  ? "We’ve paused auto-refresh to respect Firestore limits. Try again shortly or reduce the period."
                  : "Check browser console for details or visit the diagnose endpoint."}
                <a
                  href="/api/admin/analytics/diagnose"
                  target="_blank"
                  className="underline"
                >
                  /api/admin/analytics/diagnose
                </a>{" "}
                for troubleshooting.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchAnalytics}
                variant="outline"
                size="sm"
                className={`border-white/20 ${
                  errors.some((e) => e.status === 429 || e.status === 503)
                    ? "text-amber-400 hover:bg-amber-500/20"
                    : "text-red-400 hover:bg-red-500/20"
                }`}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <Button
                onClick={() => setErrors([])}
                variant="outline"
                size="sm"
                className={`border-white/20 ${
                  errors.some((e) => e.status === 429 || e.status === 503)
                    ? "text-amber-400 hover:bg-amber-500/20"
                    : "text-red-400 hover:bg-red-500/20"
                }`}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
              {errors.some((e) => e.status === 429 || e.status === 503) && (
                <Button
                  onClick={() => setAutoRefresh(false)}
                  variant="outline"
                  size="sm"
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                >
                  Pause Auto-Refresh
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400 text-sm">
            Real-time website statistics and insights
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {firebaseConfigured &&
              isAuthed &&
              firebaseClientConfig.projectId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-sky-500/20 border-sky-500/30 text-sky-400 cursor-help">
                      Project: {firebaseClientConfig.projectId}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={6}
                    className="bg-white/10 border border-white/20 text-white"
                  >
                    <span>
                      Auth domain: {firebaseClientConfig.authDomain || "—"}
                    </span>
                  </TooltipContent>
                </Tooltip>
              )}
            {consentBypassActive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 cursor-help">
                    Consent bypass active
                  </Badge>
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={6}
                  className="bg-white/10 border border-white/20 text-white"
                >
                  <span>
                    Admin-only override while cookie consent is not accepted.
                    See{" "}
                    <a
                      href="https://github.com/vortexpcsltd-afk/vortexpcs.com/blob/master/archive/ANALYTICS_DASHBOARD_GUIDE.md"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Analytics Guide
                    </a>
                    .
                  </span>
                </TooltipContent>
              </Tooltip>
            )}
            {!firebaseConfigured && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-red-500/20 border-red-500/30 text-red-400 cursor-help">
                    Firebase not configured
                  </Badge>
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={6}
                  className="bg-white/10 border border-white/20 text-white"
                >
                  <span>
                    Frontend Firebase env vars missing; analytics writes are
                    disabled. See{" "}
                    <a
                      href="https://github.com/vortexpcsltd-afk/vortexpcs.com/blob/master/archive/FIREBASE_AUTH_SETUP.md"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Firebase Setup
                    </a>{" "}
                    or run {""}
                    <a
                      href="/api/admin/analytics/diagnose"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      analytics/diagnose
                    </a>
                    .
                  </span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            {firebaseConfigured &&
              isAuthed &&
              firebaseClientConfig.projectId && (
                <Button
                  onClick={() =>
                    window.open(
                      `https://console.firebase.google.com/project/${firebaseClientConfig.projectId}/firestore/data`,
                      "_blank"
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Firestore Console
                </Button>
              )}
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* View Mode Selector */}
          <select
            value={viewMode}
            onChange={(e) => {
              const mode = e.target.value as "standard" | "monthly" | "ytd";
              setViewMode(mode);
              if (mode === "monthly" && !monthlyData) fetchMonthlySummary();
              if (mode === "ytd" && !ytdData) fetchYTDSummary();
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white [&>option]:bg-gray-900 [&>option]:text-white"
            title="Monthly/YTD views require deployment to Vercel"
          >
            <option value="standard">Standard View</option>
            <option value="monthly">Monthly Summary (Vercel)</option>
            <option value="ytd">YTD Summary (Vercel)</option>
          </select>

          {/* Period Selector (only for standard view) */}
          {viewMode === "standard" && (
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white [&>option]:bg-gray-900 [&>option]:text-white"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          )}
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="gap-2"
            disabled={!isAuthed}
          >
            <Activity className="h-4 w-4" />
            {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
          </Button>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!isAuthed}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Now
          </Button>
          <Button
            onClick={() => setShowResetModal(true)}
            variant="outline"
            size="sm"
            className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/20"
            disabled={!isAuthed}
          >
            <Trash2 className="h-4 w-4" />
            Reset Analytics
          </Button>
        </div>
      </div>
      {/* Reset Analytics Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              Reset Analytics Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-300">
                <strong>Warning:</strong> This action cannot be undone. All
                selected analytics data will be permanently deleted.
              </p>
            </div>

            <div>
              <Label className="text-white mb-2 block">Reset Type</Label>
              <select
                value={resetType}
                onChange={(e) => setResetType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white [&>option]:bg-gray-900"
              >
                <option value="all">All Analytics Data</option>
                <option value="sessions">Sessions Only</option>
                <option value="pageviews">Page Views Only</option>
                <option value="events">Events Only</option>
                <option value="security">Security Logs Only</option>
              </select>
            </div>

            <div>
              <Label className="text-white mb-2 block">
                Type "RESET" to confirm
              </Label>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText("");
                }}
                variant="outline"
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetAnalytics}
                disabled={resetConfirmText !== "RESET" || resetting}
                className="bg-red-500 hover:bg-red-600"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Monthly Summary View */}
      {viewMode === "monthly" && !monthlyData && (
        <>
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-1">
                  Deployment Required
                </h3>
                <p className="text-sm text-yellow-200">
                  Monthly and YTD summary features use Vercel serverless
                  functions that don't work in local development. Deploy your
                  site to Vercel to enable these features.
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-12 text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-sky-500 mx-auto mb-4" />
            <p className="text-white text-lg">Loading monthly summary...</p>
          </Card>
        </>
      )}
      {viewMode === "monthly" && monthlyData && (
        <div className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-sky-400" />
              Monthly Summary (Last 12 Months)
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Visitors</div>
                <div className="text-2xl font-bold text-white">
                  {(monthlyData.summary?.totalVisitors ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Avg:{" "}
                  {(
                    monthlyData.summary?.avgVisitorsPerMonth ?? 0
                  ).toLocaleString()}
                  /mo
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Page Views</div>
                <div className="text-2xl font-bold text-white">
                  {(monthlyData.summary?.totalPageViews ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Sessions</div>
                <div className="text-2xl font-bold text-white">
                  {(monthlyData.summary?.totalSessions ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Revenue</div>
                <div className="text-2xl font-bold text-green-400">
                  £{(monthlyData.summary?.totalRevenue ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Avg: £
                  {(
                    monthlyData.summary?.avgRevenuePerMonth ?? 0
                  ).toLocaleString()}
                  /mo
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Orders</div>
                <div className="text-2xl font-bold text-white">
                  {monthlyData.summary?.totalOrders ?? 0}
                </div>
              </div>
            </div>

            {/* Month-by-Month Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-gray-400 font-semibold">
                      Month
                    </th>
                    <th className="text-right p-2 text-gray-400 font-semibold">
                      Visitors
                    </th>
                    <th className="text-right p-2 text-gray-400 font-semibold">
                      Page Views
                    </th>
                    <th className="text-right p-2 text-gray-400 font-semibold">
                      Sessions
                    </th>
                    <th className="text-right p-2 text-gray-400 font-semibold">
                      Avg Duration
                    </th>
                    <th className="text-right p-2 text-gray-400 font-semibold">
                      Bounce Rate
                    </th>
                    <th className="text-right p-2 text-gray-400 font-semibold">
                      New Users
                    </th>
                    <th className="text-right p-2 text-gray-400 font-semibold">
                      Revenue
                    </th>
                    <th className="text-right p-2 text-gray-400 font-semibold">
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData?.monthlyData &&
                  monthlyData.monthlyData.length > 0 ? (
                    monthlyData.monthlyData.map((month, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="p-2 text-white">
                          {month.month} {month.year}
                        </td>
                        <td className="text-right p-2 text-white">
                          {month.visitors.toLocaleString()}
                        </td>
                        <td className="text-right p-2 text-white">
                          {month.pageViews.toLocaleString()}
                        </td>
                        <td className="text-right p-2 text-white">
                          {month.sessions.toLocaleString()}
                        </td>
                        <td className="text-right p-2 text-white">
                          {month.avgSessionDuration}s
                        </td>
                        <td className="text-right p-2 text-white">
                          {month.bounceRate}%
                        </td>
                        <td className="text-right p-2 text-cyan-400">
                          {month.newUsers}
                        </td>
                        <td className="text-right p-2 text-green-400">
                          £{month.revenue.toLocaleString()}
                        </td>
                        <td className="text-right p-2 text-white">
                          {month.orders}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-gray-400">
                        No monthly data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Trends */}
            {monthlyData?.trends && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                {monthlyData.trends.visitors && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Visitor Trend</div>
                    <div
                      className={`text-lg font-bold ${
                        (monthlyData.trends.visitors || "0%").startsWith("+")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {monthlyData.trends.visitors || "0%"}
                    </div>
                  </div>
                )}
                {monthlyData.trends.pageViews && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Page View Trend</div>
                    <div
                      className={`text-lg font-bold ${
                        (monthlyData.trends.pageViews || "0%").startsWith("+")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {monthlyData.trends.pageViews || "0%"}
                    </div>
                  </div>
                )}
                {monthlyData.trends.sessions && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Session Trend</div>
                    <div
                      className={`text-lg font-bold ${
                        (monthlyData.trends.sessions || "0%").startsWith("+")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {monthlyData.trends.sessions || "0%"}
                    </div>
                  </div>
                )}
                {monthlyData.trends.revenue && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Revenue Trend</div>
                    <div
                      className={`text-lg font-bold ${
                        (monthlyData.trends.revenue || "0%").startsWith("+")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {monthlyData.trends.revenue || "0%"}
                    </div>
                  </div>
                )}
                {monthlyData.trends.orders && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Order Trend</div>
                    <div
                      className={`text-lg font-bold ${
                        (monthlyData.trends.orders || "0%").startsWith("+")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {monthlyData.trends.orders || "0%"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
      {/* YTD Summary View */}
      {viewMode === "ytd" && !ytdData && (
        <>
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-1">
                  Deployment Required
                </h3>
                <p className="text-sm text-yellow-200">
                  Monthly and YTD summary features use Vercel serverless
                  functions that don't work in local development. Deploy your
                  site to Vercel to enable these features.
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-12 text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-sky-500 mx-auto mb-4" />
            <p className="text-white text-lg">Loading YTD summary...</p>
          </Card>
        </>
      )}
      {viewMode === "ytd" && ytdData && (
        <div className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-sky-400" />
              Year-to-Date Summary ({ytdData.period.currentYear})
            </h3>

            <div className="text-sm text-gray-400 mb-6">
              Period: {new Date(ytdData.period.startDate).toLocaleDateString()}{" "}
              - {new Date(ytdData.period.endDate).toLocaleDateString()} (
              {ytdData.period.daysIntoYear} days)
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Visitors</div>
                <div className="text-3xl font-bold text-white">
                  {ytdData.overview.totalVisitors.toLocaleString()}
                </div>
                <div className="text-xs text-cyan-400">
                  Avg: {ytdData.dailyAverages.visitors}/day
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Page Views</div>
                <div className="text-3xl font-bold text-white">
                  {ytdData.overview.totalPageViews.toLocaleString()}
                </div>
                <div className="text-xs text-cyan-400">
                  Avg: {ytdData.dailyAverages.pageViews}/day
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Sessions</div>
                <div className="text-3xl font-bold text-white">
                  {ytdData.overview.totalSessions.toLocaleString()}
                </div>
                <div className="text-xs text-cyan-400">
                  Avg: {ytdData.dailyAverages.sessions}/day
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Events</div>
                <div className="text-3xl font-bold text-white">
                  {ytdData.overview.totalEvents.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">
                  Avg Session Duration
                </div>
                <div className="text-2xl font-bold text-white">
                  {ytdData.overview.avgSessionDuration}s
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Bounce Rate</div>
                <div className="text-2xl font-bold text-white">
                  {ytdData.overview.bounceRate}%
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Avg Pages/Session</div>
                <div className="text-2xl font-bold text-white">
                  {ytdData.overview.avgPageViewsPerSession}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-400">Unique IPs</div>
                <div className="text-2xl font-bold text-white">
                  {ytdData.overview.uniqueIPs.toLocaleString()}
                </div>
              </div>
            </div>

            {/* User Stats */}
            <Card className="bg-white/5 border-white/5 p-4 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">
                User Statistics
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-400">New Users</div>
                  <div className="text-2xl font-bold text-green-400">
                    {ytdData.users.newUsers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg: {ytdData.users.avgNewUsersPerDay}/day
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Returning Users</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {ytdData.users.returningUsers.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Users</div>
                  <div className="text-2xl font-bold text-white">
                    {ytdData.overview.totalVisitors.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>

            {/* Revenue Stats */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 p-4 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">
                Revenue & Orders
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Total Revenue</div>
                  <div className="text-3xl font-bold text-green-400">
                    £{ytdData.revenue.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    £{ytdData.dailyAverages.revenue}/day
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Orders</div>
                  <div className="text-3xl font-bold text-white">
                    {ytdData.revenue.orders}
                  </div>
                  <div className="text-xs text-gray-400">
                    {ytdData.dailyAverages.orders}/day
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Avg Order Value</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    £{ytdData.revenue.avgOrderValue.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Revenue/Day</div>
                  <div className="text-3xl font-bold text-green-400">
                    £{ytdData.revenue.avgRevenuePerDay.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>

            {/* Top Pages */}
            <Card className="bg-white/5 border-white/5 p-4 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">
                Top Pages
              </h4>
              <div className="space-y-2">
                {ytdData.topPages.slice(0, 10).map(
                  (
                    page: {
                      page: string;
                      views: number;
                      uniqueVisitors: number;
                      avgTimeOnPage: number;
                    },
                    idx: number
                  ) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-white/5 rounded"
                    >
                      <span className="text-white">{page.page}</span>
                      <span className="text-sky-400 font-semibold">
                        {page.views.toLocaleString()} views
                      </span>
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* Device & Browser Breakdown */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/5 p-4">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Device Breakdown
                </h4>
                <div className="space-y-2">
                  {Object.entries(ytdData.deviceBreakdown).map(
                    (
                      [device, count]: [string, any] // eslint-disable-line @typescript-eslint/no-explicit-any
                    ) => (
                      <div
                        key={device}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-300 capitalize">
                          {device}
                        </span>
                        <span className="text-white font-semibold">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </Card>
              <Card className="bg-white/5 border-white/5 p-4">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Browser Breakdown
                </h4>
                <div className="space-y-2">
                  {Object.entries(ytdData.browserBreakdown).map(
                    (
                      [browser, count]: [string, any] // eslint-disable-line @typescript-eslint/no-explicit-any
                    ) => (
                      <div
                        key={browser}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-300">{browser}</span>
                        <span className="text-white font-semibold">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}
      {/* Standard View - Only show if viewMode is "standard" */}
      {viewMode === "standard" && (
        <>
          {/* Live Stats */}
          {liveStats && (
            <Card className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-sky-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500/20 rounded-lg">
                    <Activity className="h-6 w-6 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Live Users
                    </h3>
                    <p className="text-sm text-gray-300">
                      Currently active on site
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-sky-400">
                    {liveStats.totalActive}
                  </div>
                  <div className="text-sm text-gray-300">Active now</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {/* Device Breakdown */}
                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-gray-400 mb-2">
                    Devices
                  </h5>
                  {Object.entries(liveStats.deviceBreakdown).map(
                    ([device, count]) => (
                      <div
                        key={device}
                        className="flex justify-between items-center mb-1"
                      >
                        <span className="text-sm text-gray-300 capitalize">
                          {device}
                        </span>
                        <span className="text-sm font-bold text-sky-400">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Browser Breakdown */}
                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-gray-400 mb-2">
                    Browsers
                  </h5>
                  {Object.entries(liveStats.browserBreakdown).map(
                    ([browser, count]) => (
                      <div
                        key={browser}
                        className="flex justify-between items-center mb-1"
                      >
                        <span className="text-sm text-gray-300">{browser}</span>
                        <span className="text-sm font-bold text-sky-400">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Source Breakdown */}
                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-gray-400 mb-2">
                    Traffic Sources
                  </h5>
                  {Object.entries(liveStats.sourceBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([source, count]) => (
                      <div
                        key={source}
                        className="flex justify-between items-center mb-1"
                      >
                        <span className="text-sm text-gray-300">{source}</span>
                        <span className="text-sm font-bold text-sky-400">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Pages */}
                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-gray-400 mb-2">
                    Current Pages
                  </h5>
                  {Object.entries(liveStats.pageDistribution)
                    .slice(0, 5)
                    .map(([page, count]) => (
                      <div
                        key={page}
                        className="flex justify-between items-center mb-1"
                      >
                        <span className="text-sm text-gray-300 truncate">
                          {page}
                        </span>
                        <span className="text-sm font-bold text-sky-400">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Active Users Table */}
              {liveStats.sessions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Active Users Details
                  </h4>
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="text-left p-2 text-gray-400 font-semibold">
                              Page
                            </th>
                            <th className="text-left p-2 text-gray-400 font-semibold">
                              IP Address
                            </th>
                            <th className="text-left p-2 text-gray-400 font-semibold">
                              Browser
                            </th>
                            <th className="text-left p-2 text-gray-400 font-semibold">
                              Source
                            </th>
                            <th className="text-left p-2 text-gray-400 font-semibold">
                              Search Term
                            </th>
                            <th className="text-left p-2 text-gray-400 font-semibold">
                              Device
                            </th>
                            <th className="text-left p-2 text-gray-400 font-semibold">
                              Time on Site
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {liveStats.sessions.slice(0, 10).map((session) => (
                            <tr
                              key={session.sessionId}
                              className="border-t border-white/5"
                            >
                              <td className="p-2 text-gray-300 truncate max-w-xs">
                                {session.currentPage}
                              </td>
                              <td className="p-2 text-gray-400 font-mono text-xs">
                                {session.ip || "N/A"}
                              </td>
                              <td className="p-2 text-gray-300">
                                {session.browser}
                              </td>
                              <td className="p-2 text-gray-300">
                                {session.source}
                              </td>
                              <td className="p-2 text-gray-400 text-xs italic max-w-xs truncate">
                                {session.searchTerm || "-"}
                              </td>
                              <td className="p-2 text-gray-300 capitalize">
                                {session.device?.type || "Unknown"}
                              </td>
                              <td className="p-2 text-gray-300">
                                {Math.floor(session.timeOnSite / 60)}m{" "}
                                {session.timeOnSite % 60}s
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Analytics Diagnostics */}
          {errors.length > 0 && <AnalyticsDiagnostics />}

          {/* Real-Time Visitor Tracking */}
          <LiveVisitors />

          {/* Visitor Summary Cards */}
          {visitorStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Daily Average</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {visitorStats.summary.daily}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-sky-500" />
                </div>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">This Week</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {visitorStats.summary.weekly}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">This Month</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {visitorStats.summary.monthly}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-cyan-500" />
                </div>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Year to Date</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {visitorStats.summary.ytd}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Session</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {Math.floor(visitorStats.summary.avgSessionDuration / 60)}
                      <span className="text-lg">m</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {visitorStats.summary.avgSessionDuration % 60}s
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Bounce Rate</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {visitorStats.summary.bounceRate}
                      <span className="text-lg">%</span>
                    </p>
                  </div>
                  <TrendingUp
                    className={`h-8 w-8 ${
                      parseFloat(visitorStats.summary.bounceRate) > 50
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Visitor Time Series Chart */}
          {visitorStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Visitor Trend
                </h3>
                <div className="flex items-center gap-3">
                  {[
                    { value: "7d", label: "Last 7 Days" },
                    { value: "wtd", label: "WTD" },
                    { value: "mtd", label: "MTD" },
                    { value: "ytd", label: "YTD" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setVisitorTrendPeriod(
                          option.value as "7d" | "wtd" | "mtd" | "ytd"
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        visitorTrendPeriod === option.value
                          ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}

                  {visitorTrendPeriod === "ytd" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Year</span>
                      <select
                        value={ytdYear}
                        onChange={(e) =>
                          setYtdYear(parseInt(e.target.value, 10))
                        }
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white [&>option]:bg-gray-900 [&>option]:text-white"
                        title="Select year (up to 5 years back)"
                      >
                        {ytdYearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              {visitorStats.timeSeries && visitorStats.timeSeries.length > 0 ? (
                <div className="space-y-4">
                  <div
                    className="relative w-full bg-gradient-to-b from-white/[0.02] to-transparent rounded-lg border border-white/5 overflow-hidden"
                    style={{ height: "260px" }}
                  >
                    {(() => {
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const isYtdView = visitorTrendPeriod === "ytd";
                      const targetYear = ytdYear;

                      const buildDailyRange = () => {
                        let startDate: Date;
                        const dateRange: Date[] = [];

                        if (visitorTrendPeriod === "7d") {
                          startDate = new Date(now);
                          startDate.setDate(now.getDate() - 6);
                          for (let i = 0; i < 7; i++) {
                            const date = new Date(startDate);
                            date.setDate(startDate.getDate() + i);
                            dateRange.push(date);
                          }
                        } else if (visitorTrendPeriod === "wtd") {
                          startDate = new Date(now);
                          const dayOfWeek = now.getDay();
                          const daysFromMonday =
                            dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                          startDate.setDate(now.getDate() - daysFromMonday);
                          const daysInWeek = daysFromMonday + 1;
                          for (let i = 0; i < daysInWeek; i++) {
                            const date = new Date(startDate);
                            date.setDate(startDate.getDate() + i);
                            dateRange.push(date);
                          }
                        } else if (visitorTrendPeriod === "mtd") {
                          startDate = new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            1
                          );
                          const daysInMonth = now.getDate();
                          for (let i = 0; i < daysInMonth; i++) {
                            const date = new Date(startDate);
                            date.setDate(startDate.getDate() + i);
                            dateRange.push(date);
                          }
                        } else {
                          return visitorStats.timeSeries.map(
                            (p) => new Date(p.date)
                          );
                        }

                        return dateRange;
                      };

                      const filteredData: Array<{
                        date: string;
                        visitors: number;
                        label?: string;
                      }> = isYtdView
                        ? Array.from({ length: 12 }, (_, month) => {
                            const monthDate = new Date(targetYear, month, 1);
                            const monthLabel = monthDate.toLocaleDateString(
                              undefined,
                              { month: "short" }
                            );
                            const monthlyEntry =
                              ytdData?.monthlyBreakdown?.find(
                                (item) =>
                                  item.year === targetYear &&
                                  (item.monthIndex === month ||
                                    item.month === monthLabel)
                              );
                            const fallbackVisitors = visitorStats.timeSeries
                              ?.filter((p) => {
                                const d = new Date(p.date);
                                return (
                                  d.getFullYear() === targetYear &&
                                  d.getMonth() === month
                                );
                              })
                              .reduce((sum, p) => sum + p.visitors, 0);
                            const monthVisitors =
                              monthlyEntry?.visitors ?? fallbackVisitors ?? 0;
                            return {
                              date: monthDate.toISOString(),
                              visitors: monthVisitors,
                              label: monthLabel,
                            };
                          })
                        : buildDailyRange().map((date) => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            const dateKey = `${year}-${month}-${day}`;

                            const existingData = visitorStats.timeSeries.find(
                              (p) => {
                                const pDate = new Date(p.date);
                                const pYear = pDate.getFullYear();
                                const pMonth = String(
                                  pDate.getMonth() + 1
                                ).padStart(2, "0");
                                const pDay = String(pDate.getDate()).padStart(
                                  2,
                                  "0"
                                );
                                return `${pYear}-${pMonth}-${pDay}` === dateKey;
                              }
                            );

                            return (
                              existingData || {
                                date: date.toISOString(),
                                visitors: 0,
                              }
                            );
                          });

                      const maxVisitors =
                        filteredData.length > 0
                          ? Math.max(...filteredData.map((p) => p.visitors), 1)
                          : 1;
                      const yStep = 20;
                      const maxRounded = Math.max(
                        yStep,
                        Math.ceil(maxVisitors / yStep) * yStep
                      );
                      const yTicks = Array.from(
                        { length: Math.floor(maxRounded / yStep) + 1 },
                        (_, i) => i * yStep
                      );
                      const gridPercents = yTicks.map(
                        (tick) => (tick / maxRounded) * 100
                      );
                      const plotLeftOffset = 56; // px space for Y-axis outside the plot

                      return (
                        <>
                          {/* Bars */}
                          <div
                            className="absolute inset-y-0 right-0 flex items-end justify-around px-4 pb-6"
                            style={{
                              left: `${plotLeftOffset}px`,
                              gap: isYtdView
                                ? "10px"
                                : filteredData.length > 14
                                ? "2px"
                                : "12px",
                            }}
                          >
                            {filteredData.map((point, index: number) => {
                              const minHeight = isYtdView
                                ? 24
                                : filteredData.length > 14
                                ? 20
                                : 30;
                              const heightPx = Math.max(
                                point.visitors === 0 ? 0 : minHeight,
                                (point.visitors / maxRounded) * 200
                              );
                              const labelText = isYtdView
                                ? point.label ||
                                  new Date(point.date).toLocaleDateString(
                                    undefined,
                                    { month: "short" }
                                  )
                                : filteredData.length > 14
                                ? new Date(point.date).toLocaleDateString(
                                    undefined,
                                    { day: "numeric" }
                                  )
                                : new Date(point.date).toLocaleDateString(
                                    undefined,
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  );
                              return (
                                <div
                                  key={index}
                                  className="flex-1 flex flex-col items-center gap-2 group relative"
                                  style={{
                                    minWidth: isYtdView
                                      ? "32px"
                                      : filteredData.length > 14
                                      ? "8px"
                                      : "20px",
                                  }}
                                >
                                  <div
                                    className={`w-full bg-gradient-to-t from-sky-700 via-sky-500 to-blue-400 rounded-t-xl shadow-xl shadow-sky-900/30 hover:shadow-sky-400/50 transition-all duration-300 relative overflow-hidden border border-white/10 ${
                                      isYtdView
                                        ? "cursor-default"
                                        : "cursor-pointer"
                                    }`}
                                    style={{ height: `${heightPx}px` }}
                                    onClick={
                                      isYtdView
                                        ? undefined
                                        : () => handleBarClick(point.date)
                                    }
                                  >
                                    {/* Top cap for pill effect */}
                                    <div className="absolute top-0 inset-x-0 h-9 bg-gradient-to-b from-white/35 via-white/18 to-white/4 border-b border-white/15 rounded-t-xl" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    {/* Soft inner glow */}
                                    <div className="absolute inset-1 rounded-t-lg bg-gradient-to-b from-white/8 via-transparent to-transparent pointer-events-none" />
                                    {/* Always-visible value label */}
                                    <div
                                      className={`absolute top-1 left-0 right-0 text-center text-white pointer-events-none font-semibold rounded-md bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm ${
                                        filteredData.length > 14
                                          ? "text-[10px] px-0.5 py-0.5"
                                          : "text-base md:text-lg px-2.5 py-0.5 tracking-wide"
                                      }`}
                                    >
                                      {point.visitors.toLocaleString()}
                                    </div>
                                  </div>
                                  <div
                                    className={`text-gray-400 font-medium ${
                                      isYtdView
                                        ? "text-xs whitespace-nowrap tracking-wide"
                                        : filteredData.length > 14
                                        ? "text-[9px] whitespace-normal text-center leading-tight"
                                        : "text-xs md:text-sm whitespace-nowrap tracking-wide"
                                    }`}
                                  >
                                    {labelText}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Horizontal grid lines */}
                          <div
                            className="absolute inset-y-0 right-0 pointer-events-none"
                            style={{ left: `${plotLeftOffset}px` }}
                          >
                            {gridPercents.map((percent) => (
                              <div
                                key={percent}
                                className="absolute left-0 right-0 border-t border-white/5"
                                style={{ bottom: `${percent}%` }}
                              />
                            ))}
                          </div>

                          {/* Y-axis labels (numbers) */}
                          <div className="absolute top-0 bottom-0 left-0 w-14 pointer-events-none">
                            {yTicks.map((tick) => (
                              <div
                                key={tick}
                                className="absolute -translate-y-1/2 text-xs md:text-sm text-gray-200 font-semibold text-right pr-2"
                                style={{
                                  bottom: `${(tick / maxRounded) * 100}%`,
                                }}
                              >
                                {tick}
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {(() => {
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      let filteredData = visitorStats.timeSeries;

                      if (visitorTrendPeriod === "7d") {
                        const sevenDaysAgo = new Date(now);
                        sevenDaysAgo.setDate(now.getDate() - 6);
                        filteredData = visitorStats.timeSeries.filter(
                          (p) => new Date(p.date) >= sevenDaysAgo
                        );
                      } else if (visitorTrendPeriod === "wtd") {
                        const weekStart = new Date(now);
                        const dayOfWeek = now.getDay();
                        const daysFromMonday =
                          dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        weekStart.setDate(now.getDate() - daysFromMonday);
                        filteredData = visitorStats.timeSeries.filter(
                          (p) => new Date(p.date) >= weekStart
                        );
                      } else if (visitorTrendPeriod === "mtd") {
                        const monthStart = new Date(
                          now.getFullYear(),
                          now.getMonth(),
                          1
                        );
                        filteredData = visitorStats.timeSeries.filter(
                          (p) => new Date(p.date) >= monthStart
                        );
                      }

                      const peak = Math.max(
                        ...filteredData.map((p) => p.visitors)
                      );
                      const total = filteredData.reduce(
                        (sum, p) => sum + p.visitors,
                        0
                      );
                      const average = Math.round(
                        total / (filteredData.length || 1)
                      );

                      return (
                        <>
                          <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-lg shadow-sky-500/15 text-center space-y-2">
                            <div className="absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-b from-white/4 via-transparent to-transparent pointer-events-none" />
                            <div className="text-sm uppercase tracking-[0.2em] text-gray-300">
                              Peak
                            </div>
                            <div
                              className="text-4xl md:text-5xl font-black text-sky-200 drop-shadow-[0_0_18px_rgba(56,189,248,0.45)]"
                              style={{
                                fontFamily:
                                  "'Orbitron', 'Rajdhani', 'Exo 2', 'Segoe UI', sans-serif",
                                WebkitTextStroke: "1px rgba(56,189,248,0.25)",
                                background:
                                  "linear-gradient(120deg, rgba(125,211,252,0.9), rgba(14,165,233,0.9))",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                              }}
                            >
                              {peak}
                            </div>
                          </div>
                          <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-lg shadow-blue-500/15 text-center space-y-2">
                            <div className="absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-b from-white/4 via-transparent to-transparent pointer-events-none" />
                            <div className="text-sm uppercase tracking-[0.2em] text-gray-300">
                              Average
                            </div>
                            <div
                              className="text-4xl md:text-5xl font-black text-blue-200 drop-shadow-[0_0_18px_rgba(59,130,246,0.45)]"
                              style={{
                                fontFamily:
                                  "'Orbitron', 'Rajdhani', 'Exo 2', 'Segoe UI', sans-serif",
                                WebkitTextStroke: "1px rgba(59,130,246,0.25)",
                                background:
                                  "linear-gradient(120deg, rgba(147,197,253,0.9), rgba(59,130,246,0.9))",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                              }}
                            >
                              {average}
                            </div>
                          </div>
                          <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-lg shadow-cyan-500/15 text-center space-y-2">
                            <div className="absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-b from-white/4 via-transparent to-transparent pointer-events-none" />
                            <div className="text-sm uppercase tracking-[0.2em] text-gray-300">
                              Total
                            </div>
                            <div
                              className="text-4xl md:text-5xl font-black text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]"
                              style={{
                                fontFamily:
                                  "'Orbitron', 'Rajdhani', 'Exo 2', 'Segoe UI', sans-serif",
                                WebkitTextStroke: "1px rgba(34,211,238,0.25)",
                                background:
                                  "linear-gradient(120deg, rgba(165,243,252,0.9), rgba(6,182,212,0.9))",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                              }}
                            >
                              {total}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <p className="text-lg mb-2">No visitor data available</p>
                    <p className="text-sm">
                      Visitor tracking data will appear here once users visit
                      your site
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Page Views */}
          {pageStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-sky-400" />
                <h3 className="text-lg font-semibold text-white">Top Pages</h3>
                <Badge className="bg-sky-500/20 text-sky-400">
                  {pageStats.totalViews} total views
                </Badge>
              </div>

              <div className="space-y-2">
                {pageStats.topPages.slice(0, 10).map((page, index) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-sm font-semibold text-gray-400 w-8">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {page.page}
                        </div>
                        <div className="text-xs text-gray-400">
                          {page.uniqueVisitors} visitors • {page.avgTimeOnPage}s
                          avg
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {page.views} views
                    </Badge>
                  </div>
                ))}
              </div>

              {(pageStats.topExitPages?.length ||
                pageStats.topTransitions?.length ||
                pageStats.topPaths3?.length) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Exit Pages */}
                  {pageStats.topExitPages &&
                    pageStats.topExitPages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">
                          Top Exit Pages
                        </h4>
                        <div className="space-y-2">
                          {pageStats.topExitPages.slice(0, 8).map((item) => (
                            <div
                              key={item.page}
                              className="flex justify-between items-center p-2 bg-white/5 rounded text-sm"
                            >
                              <span className="text-gray-300 truncate max-w-[70%]">
                                {item.page}
                              </span>
                              <Badge className="bg-red-500/20 text-red-400">
                                {item.exits}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* User Flow - Transitions */}
                  {pageStats.topTransitions &&
                    pageStats.topTransitions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">
                          Top Transitions
                        </h4>
                        <div className="space-y-2">
                          {pageStats.topTransitions
                            .slice(0, 8)
                            .map((t, idx) => (
                              <div
                                key={`${t.from}->${t.to}-${idx}`}
                                className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-gray-400 truncate max-w-[40%]">
                                    {t.from}
                                  </span>
                                  <ArrowRight className="h-4 w-4 text-gray-500 shrink-0" />
                                  <span className="text-gray-300 truncate max-w-[40%]">
                                    {t.to}
                                  </span>
                                </div>
                                <Badge className="bg-sky-500/20 text-sky-400">
                                  {t.count}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {pageStats.topPaths3 && pageStats.topPaths3.length > 0 && (
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">
                        Top 3-Step Paths
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pageStats.topPaths3.slice(0, 10).map((p, idx) => (
                          <div
                            key={`p3-${idx}`}
                            className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                          >
                            <span className="text-gray-300 truncate mr-3">
                              {p.path}
                            </span>
                            <Badge className="bg-violet-500/20 text-violet-400">
                              {p.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Cart Abandonment */}
          {cartStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart className="h-6 w-6 text-rose-400" />
                <h3 className="text-lg font-semibold text-white">
                  Cart Abandonment
                </h3>
                <Badge className="bg-rose-500/20 text-rose-400">
                  {cartStats.abandonmentRate}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Builder Sessions</div>
                  <div className="text-2xl font-bold text-white">
                    {cartStats.totalBuilderSessions}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">With Selection</div>
                  <div className="text-2xl font-bold text-white">
                    {cartStats.totalWithSelection}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Completed</div>
                  <div className="text-2xl font-bold text-white">
                    {cartStats.totalCompleted}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Abandoned</div>
                  <div className="text-2xl font-bold text-white">
                    {cartStats.abandoned}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Compatibility Warnings */}
          {compatStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">
                  Compatibility Issues
                </h3>
                <Badge className="bg-yellow-500/20 text-yellow-400">
                  {compatStats.totalWarnings} total
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Top Issues
                  </h4>
                  <div className="space-y-2">
                    {compatStats.topIssues.slice(0, 6).map((i) => (
                      <div
                        key={i.title}
                        className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                      >
                        <span className="text-gray-300 truncate max-w-[70%]">
                          {i.title}
                        </span>
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          {i.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Severity Breakdown
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(compatStats.severityCounts).map(
                      ([sev, count]) => (
                        <div
                          key={sev}
                          className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                        >
                          <span className="capitalize text-gray-300">
                            {sev}
                          </span>
                          <Badge
                            className={
                              sev === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : sev === "warning"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-blue-500/20 text-blue-400"
                            }
                          >
                            {count}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Session Quality */}
          {qualityStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-sky-400" />
                <h3 className="text-lg font-semibold text-white">
                  Session Quality
                </h3>
                <Badge className="bg-sky-500/20 text-sky-400">
                  {qualityStats.sample} sessions
                </Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400">Average Score</div>
                  <div className="text-2xl font-bold text-white">
                    {qualityStats.avgScore}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Median Score</div>
                  <div className="text-2xl font-bold text-white">
                    {qualityStats.medianScore}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                  Distribution
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(qualityStats.distribution).map(
                    ([range, count]) => (
                      <div key={range} className="p-3 bg-white/5 rounded">
                        <div className="text-xs text-gray-400">{range}</div>
                        <div className="text-lg font-bold text-white">
                          {count}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Frustration Signals */}
          {frustrationStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
                <h3 className="text-lg font-semibold text-white">
                  Frustration Signals
                </h3>
                <Badge className="bg-rose-500/20 text-rose-400">
                  {frustrationStats.totalSignals} total
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    By Type
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(frustrationStats.bySubtype)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 6)
                      .map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                        >
                          <span className="capitalize text-gray-300">
                            {type.replace(/_/g, " ")}
                          </span>
                          <Badge className="bg-rose-500/20 text-rose-400">
                            {count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Top Elements
                  </h4>
                  <div className="space-y-2">
                    {frustrationStats.topSelectors.slice(0, 6).map((s) => (
                      <div
                        key={s.selector}
                        className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                      >
                        <span className="text-gray-300 truncate max-w-[70%]">
                          {s.selector}
                        </span>
                        <Badge className="bg-rose-500/20 text-rose-400">
                          {s.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Top Pages
                  </h4>
                  <div className="space-y-2">
                    {frustrationStats.topPages.slice(0, 6).map((p) => (
                      <div
                        key={p.page}
                        className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                      >
                        <span className="text-gray-300 truncate max-w-[70%]">
                          {p.page}
                        </span>
                        <Badge className="bg-rose-500/20 text-rose-400">
                          {p.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Performance Issues */}
          {performanceStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">
                  Performance Issues
                </h3>
                <Badge className="bg-amber-500/20 text-amber-400">
                  {performanceStats.totalIssues} total
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    By Type
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(performanceStats.byType)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 6)
                      .map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                        >
                          <span className="text-gray-300">{type}</span>
                          <Badge className="bg-amber-500/20 text-amber-400">
                            {count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Browsers
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(performanceStats.byBrowser)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 6)
                      .map(([browser, count]) => (
                        <div
                          key={browser}
                          className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                        >
                          <span className="text-gray-300">{browser}</span>
                          <Badge className="bg-amber-500/20 text-amber-400">
                            {count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Devices
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(performanceStats.byDevice)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 6)
                      .map(([device, count]) => (
                        <div
                          key={device}
                          className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                        >
                          <span className="text-gray-300 capitalize">
                            {device}
                          </span>
                          <Badge className="bg-amber-500/20 text-amber-400">
                            {count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Feature Adoption */}
          {adoptionStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">
                  Feature Adoption
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-400">
                  {adoptionStats.totalFeatures} features
                </Badge>
              </div>
              {adoptionStats.items.length > 0 ? (
                <div className="space-y-2">
                  {adoptionStats.items.slice(0, 6).map((f) => (
                    <div
                      key={f.feature}
                      className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                    >
                      <div className="text-gray-300 truncate max-w-[60%]">
                        {f.feature}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          {f.adoptionRate}%
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {f.uniqueUsers} users • {f.uses} uses
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  No feature usage recorded in this period.
                </div>
              )}
            </Card>
          )}

          {/* Security & Downloads Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Stats */}
            {securityStats && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6 text-sky-400" />
                  <h3 className="text-lg font-semibold text-white">Security</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-300">Successful</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {securityStats.summary.successfulLogins}
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-gray-300">Failed</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      {securityStats.summary.failedLogins}
                    </div>
                  </div>
                </div>

                {securityStats.summary.suspiciousActivity > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                      <span className="text-white font-semibold">
                        {securityStats.summary.suspiciousActivity} Suspicious
                        Activities Detected
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">
                    Top Failed Login Attempts
                  </h4>
                  {securityStats.topFailedEmails.slice(0, 5).map((item) => (
                    <div
                      key={item.email}
                      className="flex justify-between text-sm p-2 bg-white/5 rounded"
                    >
                      <span className="text-gray-400">{item.email}</span>
                      <Badge className="bg-red-500/20 text-red-400">
                        {item.attempts} attempts
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Download Stats */}
            {downloadStats && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="h-6 w-6 text-sky-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Downloads
                  </h3>
                  <Badge className="bg-sky-500/20 text-sky-400">
                    {downloadStats.summary.totalDownloads} total
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-400">Average per day</div>
                  <div className="text-2xl font-bold text-white">
                    {downloadStats.summary.avgDownloadsPerDay}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">
                    Most Downloaded
                  </h4>
                  {downloadStats.topDownloads.slice(0, 5).map((item, index) => (
                    <div
                      key={item.file}
                      className="flex justify-between items-center p-2 bg-white/5 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono">
                          {index + 1}
                        </span>
                        <span className="text-gray-300">{item.file}</span>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {item.downloads}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Product View Stats - Full Width */}
          {productStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Product Views
                </h3>
                <Badge className="bg-purple-500/20 text-purple-400">
                  {productStats.summary.totalViews} total
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400">Unique Products</div>
                  <div className="text-2xl font-bold text-white">
                    {productStats.summary.uniqueProducts}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Avg Views/Product</div>
                  <div className="text-2xl font-bold text-white">
                    {productStats.summary.avgViewsPerProduct}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-semibold text-gray-300">
                  Most Viewed Products
                </h4>
                {productStats.topProducts.slice(0, 5).map((item, index) => (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center p-2 bg-white/5 rounded text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-gray-500 font-mono">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-300 truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.category}
                          {item.brand && ` • ${item.brand}`}
                          {item.price && ` • £${item.price.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-400 ml-2">
                      {item.views}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">
                  Views by Category
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(productStats.categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([category, views]) => (
                      <div
                        key={category}
                        className="flex justify-between items-center p-2 bg-white/5 rounded text-sm"
                      >
                        <span className="text-gray-400 capitalize">
                          {category}
                        </span>
                        <span className="text-gray-300 font-semibold">
                          {views}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          )}

          {/* Build Completion Stats */}
          {buildStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">
                  Build Completions
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-400">
                  {buildStats.summary.totalBuildsCompleted} completed
                </Badge>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400">Builds Completed</div>
                  <div className="text-2xl font-bold text-white">
                    {buildStats.summary.totalBuildsCompleted}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Builder Visits</div>
                  <div className="text-2xl font-bold text-white">
                    {buildStats.summary.totalBuilderVisits}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Completion Rate</div>
                  <div
                    className={`text-2xl font-bold ${
                      parseFloat(buildStats.summary.completionRate) >= 10
                        ? "text-emerald-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {buildStats.summary.completionRate}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Avg Build Value</div>
                  <div className="text-2xl font-bold text-white">
                    £{buildStats.summary.avgBuildValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">
                  Builds by Price Range
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(buildStats.buildsByPrice).map(
                    ([priceRange, count]) => {
                      const total = Object.values(
                        buildStats.buildsByPrice
                      ).reduce((sum, val) => sum + val, 0);
                      const percentage =
                        total > 0 ? ((count / total) * 100).toFixed(1) : "0";
                      return (
                        <div
                          key={priceRange}
                          className="flex flex-col p-3 bg-white/5 rounded text-sm"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400">£{priceRange}</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400">
                              {count}
                            </Badge>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {percentage}%
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Saved Builds Stats */}
          {saveStats && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Save className="h-6 w-6 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">
                  Saved Builds
                </h3>
                <Badge className="bg-cyan-500/20 text-cyan-400">
                  {saveStats.summary.totalSaves} saved
                </Badge>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400">Total Saves</div>
                  <div className="text-2xl font-bold text-white">
                    {saveStats.summary.totalSaves}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Saved to Account</div>
                  <div className="text-2xl font-bold text-white">
                    {saveStats.summary.savedToAccount}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">
                    Saved for Comparison
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {saveStats.summary.savedForComparison}
                  </div>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">
                      Account Save Rate
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Users saving to account (logged in)
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {saveStats.summary.accountSaveRate}%
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
