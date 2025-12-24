import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Eye,
  User,
  Clock,
  Globe,
  RefreshCw,
  TrendingUp,
  Search,
  ExternalLink,
} from "lucide-react";
import { Button } from "./ui/button";
import { auth } from "../config/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface PageView {
  page: string;
  timestamp: number;
  duration?: number;
}

interface LiveVisitor {
  sessionId: string;
  currentPage: string;
  currentActivity: string;
  lastActive: string;
  isAuthenticated: boolean;
  userId?: string;
  userName?: string;
  userAgent: string;
  duration: number; // in seconds
  ipAddress?: string;
  location?: {
    city?: string;
    country?: string;
  };
  // Journey tracking fields
  entryPage?: string;
  entryMethod?: string;
  referrer?: string;
  searchTerm?: string;
  pageViews?: PageView[];
  totalPageViews?: number;
}

interface LiveVisitorsData {
  totalActive: number;
  visitors: LiveVisitor[];
  pageBreakdown: Record<string, number>;
  timestamp: string;
}

export function LiveVisitors() {
  const [liveData, setLiveData] = useState<LiveVisitorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<LiveVisitor | null>(
    null
  );

  const fetchLiveVisitors = async () => {
    try {
      if (!auth) {
        setError("Firebase not initialized");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/admin/analytics/live-visitors", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Live visitors API error:", data);

        // Special handling for 404
        if (response.status === 404) {
          throw new Error("API endpoint not found - please redeploy to Vercel");
        }

        throw new Error(
          data.error ||
            data.details ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (data.success) {
        setLiveData(data.data);
        setError(null);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (err) {
      console.error("Failed to fetch live visitors:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveVisitors();

    // Auto-refresh every 5 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchLiveVisitors, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Auto-refresh selected visitor data when modal is open
  useEffect(() => {
    if (!selectedVisitor || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchLiveVisitors();
    }, 3000); // Refresh every 3 seconds when viewing a visitor

    return () => clearInterval(interval);
  }, [selectedVisitor, autoRefresh]);

  // Update selected visitor when data refreshes
  useEffect(() => {
    if (selectedVisitor && liveData) {
      const updated = liveData.visitors.find(
        (v) => v.sessionId === selectedVisitor.sessionId
      );
      if (updated) {
        setSelectedVisitor(updated);
      }
    }
  }, [liveData, selectedVisitor]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getBrowserInfo = (userAgent: string): string => {
    if (userAgent.includes("Chrome")) return "🌐 Chrome";
    if (userAgent.includes("Firefox")) return "🦊 Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "🧭 Safari";
    if (userAgent.includes("Edge")) return "🔷 Edge";
    return "💻 Browser";
  };

  type DisplayNamesCtor = new (
    locales: string | string[],
    options: { type: "region" }
  ) => { of(code: string): string | undefined };

  const getRegionName = (code: string): string | undefined => {
    try {
      const intl = (
        globalThis as unknown as {
          Intl?: { DisplayNames?: DisplayNamesCtor };
        }
      ).Intl;
      if (!intl || !intl.DisplayNames) return undefined;
      const dn = new intl.DisplayNames(["en"], { type: "region" });
      return typeof dn.of === "function" ? dn.of(code) : undefined;
    } catch {
      return undefined;
    }
  };

  const countryName = (code?: string): string | undefined => {
    if (!code) return undefined;
    try {
      // Normalize to upper-case ISO code
      const c = code.toUpperCase();
      const name = getRegionName(c);
      return name || c;
    } catch {
      return code.toUpperCase();
    }
  };

  const countryFlag = (code?: string): string => {
    if (!code) return "";
    try {
      const cc = code.toUpperCase();
      return cc
        .replace(/[^A-Z]/g, "")
        .split("")
        .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
        .join("");
    } catch {
      return "";
    }
  };

  if (loading && !liveData) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading live visitors...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">Error: {error}</p>
          <p className="text-xs text-gray-500 mb-4">
            Check browser console for details
          </p>
          <Button
            onClick={fetchLiveVisitors}
            className="mt-4 bg-sky-500 hover:bg-sky-600"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
      {/* Prominent header with circular active count */}
      <div className="mb-6 rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 to-blue-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Eye className="w-6 h-6 text-green-400" />
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-sky-600 to-blue-600 text-white flex items-center justify-center font-extrabold shadow-[0_0_30px_rgba(56,189,248,0.25)] ring-2 ring-white/10"
              aria-label="Active visitors count"
              title="Active visitors right now"
            >
              {liveData?.totalActive ?? 0}
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Live Visitors
              </h3>
              <p className="text-sm md:text-base text-sky-300/90 font-medium">
                {liveData?.totalActive || 0} active right now
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`${
                autoRefresh
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              } border-0`}
            >
              {autoRefresh ? (
                <>
                  <span className="animate-pulse mr-1">●</span> Live
                </>
              ) : (
                "Paused"
              )}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="border-white/20"
            >
              {autoRefresh ? "Pause" : "Resume"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchLiveVisitors}
              className="border-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Page Breakdown */}
      {liveData && liveData.totalActive > 0 && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(liveData.pageBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([page, count]) => (
              <div key={page} className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-gray-400">{page}</div>
                <div className="text-xl font-bold text-sky-400">{count}</div>
              </div>
            ))}
        </div>
      )}

      {/* Visitors List */}
      <div className="space-y-3">
        {liveData && liveData.visitors.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No visitors currently active</p>
            <p className="text-sm mt-1">Waiting for traffic...</p>
          </div>
        ) : (
          liveData?.visitors.map((visitor) => (
            <div
              key={visitor.sessionId}
              onClick={() => setSelectedVisitor(visitor)}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 hover:border-sky-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {visitor.isAuthenticated ? (
                      <>
                        <User className="w-4 h-4 text-green-400" />
                        <span className="text-white font-medium">
                          {visitor.userName || "Logged In User"}
                        </span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Anonymous Visitor</span>
                      </>
                    )}
                    <span className="text-xs text-gray-500">
                      {getBrowserInfo(visitor.userAgent)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-sky-500/20 text-sky-400 border-0">
                        {visitor.currentPage}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {visitor.currentActivity}
                      </span>
                      {visitor.location?.country && (
                        <Badge className="bg-white/10 text-white border-white/20">
                          {countryFlag(visitor.location.country)}
                          <span className="ml-1">
                            {countryName(visitor.location.country)}
                          </span>
                        </Badge>
                      )}
                    </div>
                    {visitor.location && (
                      <div className="text-xs text-gray-500">
                        📍 {visitor.location.city}
                        {visitor.location.country && (
                          <>
                            {visitor.location.city ? ", " : ""}
                            {countryName(visitor.location.country)}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(visitor.duration)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(visitor.lastActive).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {liveData && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date(liveData.timestamp).toLocaleTimeString()}
        </div>
      )}

      {/* Visitor Details Dialog */}
      <Dialog
        open={!!selectedVisitor}
        onOpenChange={() => setSelectedVisitor(null)}
      >
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Visitor Journey Details
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchLiveVisitors}
                className="border-white/20"
                title="Refresh visitor data"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedVisitor && (
            <div className="space-y-6">
              {/* Visitor Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Visitor Information
                </h3>
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge
                      className={
                        selectedVisitor.isAuthenticated
                          ? "bg-green-500/20 text-green-400 border-0"
                          : "bg-gray-500/20 text-gray-400 border-0"
                      }
                    >
                      {selectedVisitor.isAuthenticated
                        ? selectedVisitor.userName || "Logged In"
                        : "Anonymous"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Browser:</span>
                    <span className="text-white">
                      {getBrowserInfo(selectedVisitor.userAgent)}
                    </span>
                  </div>
                  {selectedVisitor.ipAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP Address:</span>
                      <span className="text-white font-mono text-sm">
                        {selectedVisitor.ipAddress}
                      </span>
                    </div>
                  )}
                  {selectedVisitor.location?.country && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Country of Origin:</span>
                      <span className="text-white">
                        {countryFlag(selectedVisitor.location.country)}
                        <span className="ml-1">
                          {countryName(selectedVisitor.location.country)}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Session Duration:</span>
                    <span className="text-white">
                      {formatDuration(selectedVisitor.duration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Page Views:</span>
                    <span className="text-white">
                      {selectedVisitor.totalPageViews || 1}
                    </span>
                  </div>
                  {selectedVisitor.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white">
                        📍 {selectedVisitor.location.city},{" "}
                        {selectedVisitor.location.country}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Entry Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Entry Information
                </h3>
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entry Method:</span>
                    <Badge className="bg-purple-500/20 text-purple-400 border-0">
                      {selectedVisitor.entryMethod || "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entry Page:</span>
                    <span className="text-white">
                      {selectedVisitor.entryPage || "Homepage"}
                    </span>
                  </div>
                  {selectedVisitor.searchTerm && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400">Search Term:</span>
                      <Badge className="bg-amber-500/20 text-amber-400 border-0 flex items-center gap-1">
                        <Search className="w-3 h-3" />
                        {selectedVisitor.searchTerm}
                      </Badge>
                    </div>
                  )}
                  {selectedVisitor.referrer && (
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400">Referrer:</span>
                      <a
                        href={selectedVisitor.referrer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 break-all flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {selectedVisitor.referrer}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Page Journey */}
              {selectedVisitor.pageViews &&
                selectedVisitor.pageViews.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Page Journey ({selectedVisitor.pageViews.length}{" "}
                      {selectedVisitor.pageViews.length === 1
                        ? "page"
                        : "pages"}
                      )
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="space-y-3">
                        {selectedVisitor.pageViews.map((pageView, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0 last:pb-0"
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {pageView.page}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-3 mt-1">
                                <span>
                                  {new Date(
                                    pageView.timestamp
                                  ).toLocaleTimeString()}
                                </span>
                                {pageView.duration !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(pageView.duration)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Current Activity */}
              <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-semibold text-white">
                    Currently Viewing
                  </span>
                </div>
                <div className="text-lg font-bold text-sky-400">
                  {selectedVisitor.currentPage}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {selectedVisitor.currentActivity}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
