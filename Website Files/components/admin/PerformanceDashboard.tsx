/**
 * Performance Monitoring Dashboard
 * Admin view for monitoring site performance metrics
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Globe,
  Server,
} from "lucide-react";
import { db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { logger } from "../../services/logger";

interface MetricSummary {
  name: string;
  value: number;
  unit: string;
  rating: "good" | "needs-improvement" | "poor";
  threshold: number;
  trend: "up" | "down" | "stable";
  change: number;
}

interface SlowPage {
  page: string;
  avgLoadTime: number;
  count: number;
  rating: "good" | "needs-improvement" | "poor";
}

interface SlowAPI {
  endpoint: string;
  avgResponseTime: number;
  count: number;
  rating: "good" | "needs-improvement" | "poor";
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [slowPages, setSlowPages] = useState<SlowPage[]>([]);
  const [slowAPIs, setSlowAPIs] = useState<SlowAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h"
  );

  async function loadPerformanceData() {
    if (!db) {
      logger.warn("Firebase not configured - using mock data");
      setMockData();
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const startTime = getStartTime(timeRange);

      // Load Core Web Vitals
      const metricsData = await loadCoreWebVitals(startTime);

      // Load slow pages
      const pagesData = await loadSlowPages(startTime);

      // Load slow APIs
      const apisData = await loadSlowAPIs(startTime);

      // Check if we got any real data
      const hasRealData =
        metricsData.some((m) => m.value > 0) ||
        pagesData.length > 0 ||
        apisData.length > 0;

      if (hasRealData) {
        setMetrics(metricsData);
        setSlowPages(pagesData);
        setSlowAPIs(apisData);
      } else {
        logger.info("No performance data found - using mock data");
        setMockData();
      }
    } catch (error) {
      logger.error("Failed to load performance data", error);
      setMockData();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  function getStartTime(range: string): Date {
    const now = new Date();
    switch (range) {
      case "1h":
        return new Date(now.getTime() - 60 * 60 * 1000);
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  async function loadCoreWebVitals(startTime: Date): Promise<MetricSummary[]> {
    const metricsCollection = collection(db!, "performance_metrics");
    const q = query(
      metricsCollection,
      where("timestamp", ">=", Timestamp.fromDate(startTime)),
      orderBy("timestamp", "desc"),
      limit(1000)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => doc.data());

    // Aggregate metrics
    const lcpValues = data
      .filter((m) => m.metricName === "LCP")
      .map((m) => m.value);
    const fidValues = data
      .filter((m) => m.metricName === "FID")
      .map((m) => m.value);
    const clsValues = data
      .filter((m) => m.metricName === "CLS")
      .map((m) => m.value);
    const fcpValues = data
      .filter((m) => m.metricName === "FCP")
      .map((m) => m.value);
    const ttfbValues = data
      .filter((m) => m.metricName === "TTFB")
      .map((m) => m.value);

    return [
      {
        name: "LCP",
        value: average(lcpValues),
        unit: "ms",
        rating: getRating(average(lcpValues), 2500),
        threshold: 2500,
        trend: "stable",
        change: 0,
      },
      {
        name: "FID",
        value: average(fidValues),
        unit: "ms",
        rating: getRating(average(fidValues), 100),
        threshold: 100,
        trend: "stable",
        change: 0,
      },
      {
        name: "CLS",
        value: average(clsValues),
        unit: "",
        rating: getRating(average(clsValues), 0.1),
        threshold: 0.1,
        trend: "stable",
        change: 0,
      },
      {
        name: "FCP",
        value: average(fcpValues),
        unit: "ms",
        rating: getRating(average(fcpValues), 1800),
        threshold: 1800,
        trend: "stable",
        change: 0,
      },
      {
        name: "TTFB",
        value: average(ttfbValues),
        unit: "ms",
        rating: getRating(average(ttfbValues), 600),
        threshold: 600,
        trend: "stable",
        change: 0,
      },
    ];
  }

  async function loadSlowPages(startTime: Date): Promise<SlowPage[]> {
    const pageLoadCollection = collection(db!, "page_load_metrics");
    const q = query(
      pageLoadCollection,
      where("timestamp", ">=", Timestamp.fromDate(startTime)),
      where("rating", "in", ["needs-improvement", "poor"]),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => doc.data());

    // Group by page
    const pageGroups: Record<string, number[]> = {};
    data.forEach((item) => {
      if (!pageGroups[item.page]) {
        pageGroups[item.page] = [];
      }
      pageGroups[item.page].push(item.loadTime);
    });

    return Object.entries(pageGroups)
      .map(([page, times]) => ({
        page,
        avgLoadTime: average(times),
        count: times.length,
        rating: getRating(average(times), 3000),
      }))
      .sort((a, b) => b.avgLoadTime - a.avgLoadTime)
      .slice(0, 10);
  }

  async function loadSlowAPIs(startTime: Date): Promise<SlowAPI[]> {
    const apiCollection = collection(db!, "api_metrics");
    const q = query(
      apiCollection,
      where("timestamp", ">=", Timestamp.fromDate(startTime)),
      where("rating", "in", ["needs-improvement", "poor"]),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => doc.data());

    // Group by endpoint
    const endpointGroups: Record<string, number[]> = {};
    data.forEach((item) => {
      const key = `${item.method} ${item.endpoint}`;
      if (!endpointGroups[key]) {
        endpointGroups[key] = [];
      }
      endpointGroups[key].push(item.responseTime);
    });

    return Object.entries(endpointGroups)
      .map(([endpoint, times]) => ({
        endpoint,
        avgResponseTime: average(times),
        count: times.length,
        rating: getRating(average(times), 1000),
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);
  }

  function setMockData() {
    setIsMockData(true);
    setMetrics([
      {
        name: "LCP",
        value: 2100,
        unit: "ms",
        rating: "good",
        threshold: 2500,
        trend: "down",
        change: -5.2,
      },
      {
        name: "FID",
        value: 85,
        unit: "ms",
        rating: "good",
        threshold: 100,
        trend: "stable",
        change: 0,
      },
      {
        name: "CLS",
        value: 0.08,
        unit: "",
        rating: "good",
        threshold: 0.1,
        trend: "down",
        change: -2.1,
      },
      {
        name: "FCP",
        value: 1650,
        unit: "ms",
        rating: "good",
        threshold: 1800,
        trend: "up",
        change: 3.4,
      },
      {
        name: "TTFB",
        value: 550,
        unit: "ms",
        rating: "good",
        threshold: 600,
        trend: "stable",
        change: 0,
      },
    ]);

    setSlowPages([
      {
        page: "/pc-builder",
        avgLoadTime: 3500,
        count: 45,
        rating: "needs-improvement",
      },
      {
        page: "/admin/analytics",
        avgLoadTime: 3200,
        count: 12,
        rating: "needs-improvement",
      },
      {
        page: "/pc-finder",
        avgLoadTime: 2900,
        count: 78,
        rating: "good",
      },
    ]);

    setSlowAPIs([
      {
        endpoint: "GET /api/analytics/dashboard",
        avgResponseTime: 1200,
        count: 23,
        rating: "needs-improvement",
      },
      {
        endpoint: "POST /api/ai/chat",
        avgResponseTime: 1100,
        count: 56,
        rating: "needs-improvement",
      },
      {
        endpoint: "GET /api/stripe/checkout",
        avgResponseTime: 900,
        count: 34,
        rating: "good",
      },
    ]);
  }

  function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  function getRating(
    value: number,
    threshold: number
  ): "good" | "needs-improvement" | "poor" {
    if (value <= threshold) return "good";
    if (value <= threshold * 1.5) return "needs-improvement";
    return "poor";
  }

  function getRatingColor(rating: string) {
    switch (rating) {
      case "good":
        return "bg-green-500/20 border-green-500/40 text-green-400";
      case "needs-improvement":
        return "bg-yellow-500/20 border-yellow-500/40 text-yellow-400";
      case "poor":
        return "bg-red-500/20 border-red-500/40 text-red-400";
      default:
        return "bg-gray-500/20 border-gray-500/40 text-gray-400";
    }
  }

  function getRatingIcon(rating: string) {
    switch (rating) {
      case "good":
        return <CheckCircle className="w-4 h-4" />;
      case "needs-improvement":
        return <AlertTriangle className="w-4 h-4" />;
      case "poor":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Performance Dashboard</h1>
            {isMockData && (
              <Badge className="bg-yellow-500/20 border-yellow-500/40 text-yellow-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Mock Data
              </Badge>
            )}
          </div>
          <p className="text-gray-400">
            {isMockData
              ? "Displaying sample data - real performance metrics will appear once site activity is tracked"
              : "Monitor Core Web Vitals, page load times, and API performance"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeRange === "1h" ? "default" : "outline"}
            onClick={() => setTimeRange("1h")}
            size="sm"
          >
            1h
          </Button>
          <Button
            variant={timeRange === "24h" ? "default" : "outline"}
            onClick={() => setTimeRange("24h")}
            size="sm"
          >
            24h
          </Button>
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            onClick={() => setTimeRange("7d")}
            size="sm"
          >
            7d
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            onClick={() => setTimeRange("30d")}
            size="sm"
          >
            30d
          </Button>
          <Button onClick={loadPerformanceData} size="sm" className="ml-2">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-sky-400" />
          <p className="text-gray-400">Loading performance data...</p>
        </div>
      ) : (
        <>
          {/* Core Web Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {metrics.map((metric) => (
              <Card
                key={metric.name}
                className="bg-white/5 backdrop-blur-xl border-white/10 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">
                    {metric.name}
                  </h3>
                  <Badge className={getRatingColor(metric.rating)}>
                    {getRatingIcon(metric.rating)}
                  </Badge>
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-white">
                    {metric.unit === "ms"
                      ? `${Math.round(metric.value)}${metric.unit}`
                      : metric.value.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Threshold: {metric.threshold}
                    {metric.unit}
                  </div>
                </div>
                {metric.change !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      metric.change < 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {metric.trend === "down" ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    <span>{Math.abs(metric.change).toFixed(1)}%</span>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Slow Pages */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-sky-400" />
                <h2 className="text-xl font-bold">Slow Pages</h2>
                <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
                  {slowPages.length}
                </Badge>
              </div>
              {slowPages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>All pages loading quickly! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {slowPages.map((page) => (
                    <div
                      key={page.page}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {page.page}
                        </div>
                        <div className="text-sm text-gray-400">
                          {page.count} views
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          {Math.round(page.avgLoadTime)}ms
                        </div>
                        <Badge className={getRatingColor(page.rating)}>
                          {page.rating}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Slow APIs */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-5 h-5 text-sky-400" />
                <h2 className="text-xl font-bold">Slow API Endpoints</h2>
                <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
                  {slowAPIs.length}
                </Badge>
              </div>
              {slowAPIs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>All APIs responding quickly! ⚡</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {slowAPIs.map((api) => (
                    <div
                      key={api.endpoint}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white font-mono text-sm">
                          {api.endpoint}
                        </div>
                        <div className="text-sm text-gray-400">
                          {api.count} calls
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          {Math.round(api.avgResponseTime)}ms
                        </div>
                        <Badge className={getRatingColor(api.rating)}>
                          {api.rating}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Performance Tips */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-sky-400" />
              <h2 className="text-xl font-bold">Performance Tips</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h3 className="font-medium text-green-400 mb-2">✅ Good</h3>
                <p className="text-sm text-gray-300">
                  Metrics below threshold indicate excellent performance
                </p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <h3 className="font-medium text-yellow-400 mb-2">
                  ⚠️ Needs Improvement
                </h3>
                <p className="text-sm text-gray-300">
                  Consider optimizing images, code splitting, or CDN usage
                </p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <h3 className="font-medium text-red-400 mb-2">❌ Poor</h3>
                <p className="text-sm text-gray-300">
                  Critical issues detected. Investigate immediately
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
