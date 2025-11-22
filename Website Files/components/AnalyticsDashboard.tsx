/**
 * Analytics Dashboard Component
 * Comprehensive analytics with live stats, visitor tracking, security monitoring
 */

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Button } from "./ui/button";
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
} from "lucide-react";
import { auth, db } from "../config/firebase";
import { firebaseClientConfig } from "../config/firebase";
import { trackUserEvent } from "../services/advancedAnalytics";
import { getSessionId } from "../services/sessionTracker";
import { toast } from "sonner";

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

interface DiagnoseCheck {
  name?: string;
  ok?: boolean;
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
  const [errors, setErrors] = useState<
    Array<{ endpoint: string; message: string; status?: number }>
  >([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagSummary, setDiagSummary] = useState<string>("");
  const isAuthed = Boolean(auth?.currentUser);
  const firebaseConfigured = Boolean(db);
  const consentAccepted =
    typeof window !== "undefined" &&
    localStorage.getItem("vortex_cookie_consent") === "accepted";
  const consentBypassActive = isAuthed && !consentAccepted;

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
        liveRes.json(),
        visitorsRes.json(),
        pagesRes.json(),
        securityRes.json(),
        downloadsRes.json(),
        productsRes.json(),
        buildsRes.json(),
        savesRes.json(),
        cartRes.json(),
        compatRes.json(),
        qualityRes.json(),
        frustrationRes.json(),
        performanceRes.json(),
        adoptionRes.json(),
      ]);

      // Track errors
      if (!liveRes.ok || !live.success) {
        newErrors.push({
          endpoint: "live",
          message: live.error || live.details || "Unknown error",
          status: liveRes.status,
        });
      } else {
        setLiveStats(live.data);
      }
      if (!visitorsRes.ok || !visitors.success) {
        newErrors.push({
          endpoint: "visitors",
          message: visitors.error || visitors.details || "Unknown error",
          status: visitorsRes.status,
        });
      } else {
        setVisitorStats(visitors.data);
      }
      if (!pagesRes.ok || !pages.success) {
        newErrors.push({
          endpoint: "pages",
          message: pages.error || pages.details || "Unknown error",
          status: pagesRes.status,
        });
      } else {
        setPageStats(pages.data);
      }
      if (!securityRes.ok || !security.success) {
        newErrors.push({
          endpoint: "security",
          message: security.error || security.details || "Unknown error",
          status: securityRes.status,
        });
      } else {
        setSecurityStats(security.data);
      }
      if (!downloadsRes.ok || !downloads.success) {
        newErrors.push({
          endpoint: "downloads",
          message: downloads.error || downloads.details || "Unknown error",
          status: downloadsRes.status,
        });
      } else {
        setDownloadStats(downloads.data);
      }
      if (!productsRes.ok || products.error) {
        newErrors.push({
          endpoint: "products",
          message: products.error || products.details || "Unknown error",
          status: productsRes.status,
        });
      } else {
        setProductStats(products);
      }
      if (!buildsRes.ok || builds.error) {
        newErrors.push({
          endpoint: "builds",
          message: builds.error || builds.details || "Unknown error",
          status: buildsRes.status,
        });
      } else {
        setBuildStats(builds);
      }
      if (!savesRes.ok || saves.error) {
        newErrors.push({
          endpoint: "saves",
          message: saves.error || saves.details || "Unknown error",
          status: savesRes.status,
        });
      } else {
        setSaveStats(saves);
      }
      if (!cartRes.ok || cart.error) {
        newErrors.push({
          endpoint: "cart",
          message: cart.error || cart.details || "Unknown error",
          status: cartRes.status,
        });
      } else {
        setCartStats(cart.data);
      }
      if (!compatRes.ok || compat.error) {
        newErrors.push({
          endpoint: "compat",
          message: compat.error || compat.details || "Unknown error",
          status: compatRes.status,
        });
      } else {
        setCompatStats(compat.data);
      }

      if (!qualityRes.ok || quality.error) {
        newErrors.push({
          endpoint: "sessionQuality",
          message: quality.error || quality.details || "Unknown error",
          status: qualityRes.status,
        });
      } else {
        setQualityStats(quality.data);
      }

      if (!frustrationRes.ok || frustration.error) {
        newErrors.push({
          endpoint: "frustration",
          message: frustration.error || frustration.details || "Unknown error",
          status: frustrationRes.status,
        });
      } else {
        setFrustrationStats(frustration.data);
      }

      if (!performanceRes.ok || performance.error) {
        newErrors.push({
          endpoint: "performance",
          message: performance.error || performance.details || "Unknown error",
          status: performanceRes.status,
        });
      } else {
        setPerformanceStats(performance.data);
      }

      if (!adoptionRes.ok || adoption.error) {
        newErrors.push({
          endpoint: "adoption",
          message: adoption.error || adoption.details || "Unknown error",
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
      console.error("Fetch analytics error:", error);
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
    if (!autoRefresh) return;
    if (!auth?.currentUser) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 120000); // Refresh every 120 seconds to reduce read load

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="flex items-center gap-2 mt-2">
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
        </div>
        <div className="flex items-center gap-4">
          {/* Diagnose chip with tooltip summary */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={async () => {
                  if (!auth?.currentUser) return;
                  setDiagLoading(true);
                  try {
                    const token = await auth.currentUser.getIdToken();
                    const res = await fetch("/api/admin/analytics/diagnose", {
                      headers: { Authorization: `Bearer ${token}` },
                      cache: "no-store",
                    });
                    let text = "";
                    try {
                      const data = await res.json();
                      const rawChecks: unknown =
                        (data && (data.checks ?? data.items ?? data.status)) ??
                        [];
                      const checks: DiagnoseCheck[] = Array.isArray(rawChecks)
                        ? rawChecks.map((c) =>
                            typeof c === "object" && c !== null
                              ? (c as DiagnoseCheck)
                              : ({} as DiagnoseCheck)
                          )
                        : [];
                      if (checks.length > 0) {
                        const failures = checks.filter((c) => c.ok === false);
                        const okCount = checks.length - failures.length;
                        text = failures.length
                          ? `Checks: ${okCount}/${
                              checks.length
                            } passed. Failing: ${failures
                              .slice(0, 3)
                              .map((f) => f.name || "unknown")
                              .join(", ")}${failures.length > 3 ? "…" : ""}`
                          : `All ${checks.length} checks passed`;
                      } else if (typeof data?.message === "string") {
                        text = data.message;
                      } else {
                        text = res.ok
                          ? "Diagnose OK"
                          : `Diagnose failed (${res.status})`;
                      }
                    } catch {
                      text = res.ok
                        ? "Diagnose OK"
                        : `Diagnose failed (${res.status})`;
                    }
                    setDiagSummary(text);
                    setLastUpdated(new Date());
                  } catch (e) {
                    setDiagSummary(
                      e instanceof Error ? e.message : "Diagnose request failed"
                    );
                  } finally {
                    setDiagLoading(false);
                  }
                }}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!isAuthed}
              >
                <Activity
                  className={`h-4 w-4 ${diagLoading ? "animate-spin" : ""}`}
                />
                Diagnose
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={6}
              className="bg-white/10 border border-white/20 text-white max-w-[320px]"
            >
              <span>{diagSummary || "Run diagnose to see status"}</span>
            </TooltipContent>
          </Tooltip>

          {firebaseConfigured && isAuthed && firebaseClientConfig.projectId && (
            <a
              href={`https://console.firebase.google.com/project/${firebaseClientConfig.projectId}/firestore/data`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 underline hover:text-sky-300"
            >
              Open Firestore Console
            </a>
          )}
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white [&>option]:bg-gray-900 [&>option]:text-white"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
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
            onClick={async () => {
              try {
                if (!firebaseConfigured) {
                  toast.error(
                    "Firebase not configured on frontend; cannot write analytics."
                  );
                  return;
                }
                const sid = getSessionId() || `debug_${Date.now()}`;
                await trackUserEvent({
                  sessionId: sid,
                  userId: auth?.currentUser?.uid || undefined,
                  eventType: "client_test",
                  eventData: { source: "analytics_dashboard" },
                  timestamp: new Date(),
                  page: "/admin",
                });
                toast.success("Client write test sent (analytics_events)");
                setLastUpdated(new Date());
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : "Client write failed"
                );
              }
            }}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!isAuthed}
          >
            <Activity className="h-4 w-4" />
            Client Write Test
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      {liveStats && (
        <Card className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-sky-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-500/20 rounded-lg">
                <Activity className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Live Users</h3>
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
                    <div className="text-white font-medium">{page.page}</div>
                    <div className="text-xs text-gray-400">
                      {page.uniqueVisitors} visitors • {page.avgTimeOnPage}s avg
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
              {pageStats.topExitPages && pageStats.topExitPages.length > 0 && (
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
                      {pageStats.topTransitions.slice(0, 8).map((t, idx) => (
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
                      <span className="capitalize text-gray-300">{sev}</span>
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
                    <div className="text-lg font-bold text-white">{count}</div>
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
                      <span className="text-gray-300 capitalize">{device}</span>
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
              <h3 className="text-lg font-semibold text-white">Downloads</h3>
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
                    <span className="text-gray-500 font-mono">{index + 1}</span>
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
            <h3 className="text-lg font-semibold text-white">Product Views</h3>
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
                  <span className="text-gray-500 font-mono">{index + 1}</span>
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
                    <span className="text-gray-400 capitalize">{category}</span>
                    <span className="text-gray-300 font-semibold">{views}</span>
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
                  const total = Object.values(buildStats.buildsByPrice).reduce(
                    (sum, val) => sum + val,
                    0
                  );
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
            <h3 className="text-lg font-semibold text-white">Saved Builds</h3>
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
              <div className="text-sm text-gray-400">Saved for Comparison</div>
              <div className="text-2xl font-bold text-white">
                {saveStats.summary.savedForComparison}
              </div>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Account Save Rate</div>
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

      {/* Visitor Time Series Chart */}
      {visitorStats && visitorStats.timeSeries.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Visitor Trend
          </h3>
          <div className="h-64 flex items-end gap-1">
            {visitorStats.timeSeries.map((point, index) => {
              const maxVisitors = Math.max(
                ...visitorStats.timeSeries.map((p) => p.visitors)
              );
              const height = (point.visitors / maxVisitors) * 100;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div
                    className="w-full bg-gradient-to-t from-sky-500 to-blue-500 rounded-t transition-all hover:from-sky-400 hover:to-blue-400 relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.visitors} visitors
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 rotate-45 origin-left mt-2 whitespace-nowrap">
                    {new Date(point.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
