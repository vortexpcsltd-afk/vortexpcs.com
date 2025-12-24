import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Search,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Trash2,
  PieChart as PieChartIcon,
  GitBranch,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { db } from "../config/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
} from "firebase/firestore";
import { formatDateTimeUK } from "../utils/dateFormat";
import { toast } from "sonner";
import {
  getIntentLabel,
  getIntentColor,
  type SearchIntent,
} from "../utils/searchIntentClassifier";
import {
  groupSearchesBySessions,
  analyzeSessionFlow,
  classifySessionBehavior,
  type SearchSession,
  type SessionFlowAnalysis,
} from "../utils/searchSessionAnalyzer";
import {
  formatSuggestion,
  getSuggestionStyle,
  type SearchSuggestion,
} from "../utils/searchSuggestions";
import {
  calculateFunnelMetrics,
  calculateSearchTermRevenue,
  getFunnelChartData,
  getConversionTrend,
  formatCurrency,
  formatDuration,
  type ConversionEvent,
  type SearchWithConversion,
  type FunnelMetrics,
  type SearchTermRevenue,
} from "../utils/conversionFunnel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { analyzeRefinementSessions } from "../utils/searchRefinement";

interface SearchQueryData {
  id: string;
  query: string;
  originalQuery: string;
  category: string;
  resultsCount: number;
  userId?: string;
  sessionId?: string;
  timestamp: Timestamp;
  filters?: Record<string, unknown>;
  intent?: SearchIntent;
  intentConfidence?: "high" | "medium" | "low";
  intentKeywords?: string[];
  suggestions?: SearchSuggestion[];
  addedToCart?: boolean;
  checkoutCompleted?: boolean;
  orderTotal?: number;
  convertedAt?: Timestamp;
}

interface PopularSearchStat {
  query: string;
  count: number;
  avgResults: number;
  zeroResults: number;
  categories: Record<string, number>;
  intents?: Partial<Record<SearchIntent, number>>;
}

export function SearchAnalytics() {
  const [recentSearches, setRecentSearches] = useState<SearchQueryData[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearchStat[]>(
    []
  );
  const [zeroResultSearches, setZeroResultSearches] = useState<
    SearchQueryData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState("7"); // days
  const [searchFilter, setSearchFilter] = useState("");
  const [chartType, setChartType] = useState<"line" | "area">("area");
  const [timeGrouping, setTimeGrouping] = useState<"hourly" | "daily">("daily");
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [conversions, setConversions] = useState<ConversionEvent[]>([]);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(
    null
  );
  const [topRevenueTerms, setTopRevenueTerms] = useState<SearchTermRevenue[]>(
    []
  );
  const [conversionTrend, setConversionTrend] = useState<
    Array<{ date: string; searchCount: number; conversionRate: number }>
  >([]);
  const [sessionAnalysis, setSessionAnalysis] =
    useState<SessionFlowAnalysis | null>(null);

  const loadSearchData = useCallback(async () => {
    if (!db) {
      toast.error("Firebase not configured");
      return;
    }

    setIsLoading(true);
    try {
      const daysAgo = parseInt(dateFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Load recent searches (graceful error handling)
      let searches: SearchQueryData[] = [];
      try {
        const searchesQuery = query(
          collection(db, "searchQueries"),
          where("timestamp", ">=", Timestamp.fromDate(startDate)),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        const searchesSnapshot = await getDocs(searchesQuery);
        searches = searchesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SearchQueryData[];
      } catch (e) {
        console.warn("SearchAnalytics: failed to load recent searches", e);
      }
      setRecentSearches(searches);

      // Calculate popular searches
      const searchStats = new Map<string, PopularSearchStat>();
      searches.forEach((s) => {
        const key = s.query.toLowerCase();
        if (!searchStats.has(key)) {
          searchStats.set(key, {
            query: s.originalQuery || s.query,
            count: 0,
            avgResults: 0,
            zeroResults: 0,
            categories: {},
            intents: {},
          });
        }
        const stat = searchStats.get(key)!;
        stat.count++;
        stat.avgResults += s.resultsCount;
        if (s.resultsCount === 0) stat.zeroResults++;
        stat.categories[s.category] = (stat.categories[s.category] || 0) + 1;
        // Track intent distribution
        if (s.intent) {
          stat.intents![s.intent] = (stat.intents![s.intent] || 0) + 1;
        }
      });

      // Convert to array and calculate averages
      const popular = Array.from(searchStats.values())
        .map((stat) => ({
          ...stat,
          avgResults: Math.round(stat.avgResults / stat.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      setPopularSearches(popular);

      // Load zero result searches
      try {
        const zeroResultQuery = query(
          collection(db, "zeroResultSearches"),
          where("timestamp", ">=", Timestamp.fromDate(startDate)),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        const zeroSnapshot = await getDocs(zeroResultQuery);
        const zeroResults = zeroSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SearchQueryData[];
        setZeroResultSearches(zeroResults);
      } catch (e) {
        console.warn("SearchAnalytics: failed to load zero-result searches", e);
        setZeroResultSearches([]);
      }

      // Process session data - filter out searches without sessionId
      const searchEvents = searches
        .filter((s) => s.sessionId) // Only include searches with session IDs
        .map((s) => ({
          ...s,
          sessionId: s.sessionId!, // Assert non-null after filter
          timestamp: s.timestamp.toDate(),
        }));
      const sessionData = groupSearchesBySessions(searchEvents);
      setSessions(sessionData);

      const analysis = analyzeSessionFlow(sessionData);
      setSessionAnalysis(analysis);

      // Load conversion data
      let conversionsData: ConversionEvent[] = [];
      try {
        const conversionsQuery = query(
          collection(db, "searchConversions"),
          where("timestamp", ">=", Timestamp.fromDate(startDate)),
          orderBy("timestamp", "desc"),
          limit(500)
        );
        const conversionsSnapshot = await getDocs(conversionsQuery);
        conversionsData = conversionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        })) as ConversionEvent[];
        setConversions(conversionsData);
      } catch (e) {
        console.warn("SearchAnalytics: failed to load conversions", e);
        conversionsData = [];
        setConversions([]);
      }

      // Calculate funnel metrics
      const searchesWithConversion: SearchWithConversion[] = searches.map(
        (s) => ({
          id: s.id,
          query: s.query,
          originalQuery: s.originalQuery,
          timestamp: s.timestamp.toDate(),
          addedToCart: s.addedToCart,
          checkoutCompleted: s.checkoutCompleted,
          orderTotal: s.orderTotal,
          convertedAt: s.convertedAt?.toDate?.(),
        })
      );

      const funnel = calculateFunnelMetrics(
        searchesWithConversion,
        conversionsData
      );
      setFunnelMetrics(funnel);

      const revenueTerms = calculateSearchTermRevenue(
        searchesWithConversion,
        conversionsData
      );
      setTopRevenueTerms(revenueTerms);

      // Calculate conversion rate trend for current period
      const trend = getConversionTrend(
        searchesWithConversion,
        parseInt(dateFilter)
      );
      setConversionTrend(trend);
    } catch (error) {
      console.error("Error loading search analytics:", error);

      // Enhanced error reporting
      let message = "Failed to load search analytics";
      if (error instanceof Error) {
        message = error.message;
        // Check for specific Firestore errors
        if (error.message.includes("index")) {
          message =
            "Database index required. Check Firebase Console for index creation link.";
        } else if (error.message.includes("permission")) {
          message = "Permission denied. Check Firestore security rules.";
        } else if (error.message.includes("network")) {
          message = "Network error. Check your connection.";
        }
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadSearchData();
  }, [loadSearchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadSearchData();
      toast.success("Search analytics refreshed");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearData = async () => {
    try {
      // Get Firebase auth token
      const { auth } = await import("../config/firebase");
      const { getIdToken } = await import("firebase/auth");

      let idToken = "";
      if (auth && auth.currentUser) {
        idToken = await getIdToken(auth.currentUser);
      }

      const response = await fetch("/api/admin/analytics/reset", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          type: "custom",
          collections: ["searchQueries", "zeroResultSearches"],
          confirm: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to clear search data");
      }

      // Reload data after clearing
      await loadSearchData();
      toast.success("Search analytics data cleared successfully");
      setShowClearDialog(false);
    } catch (error) {
      console.error("Error clearing search data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to clear search data"
      );
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Query",
      "Category",
      "Results",
      "Timestamp",
      "User ID",
      "Session ID",
    ];
    const rows = recentSearches.map((s) => [
      s.originalQuery || s.query,
      s.category,
      s.resultsCount,
      s.timestamp?.toDate?.().toISOString() || "",
      s.userId || "",
      s.sessionId || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `search-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Search data exported");
  };

  const filteredRecentSearches = recentSearches.filter((s) =>
    s.originalQuery.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalSearches = recentSearches.length;
  const avgResultsCount =
    totalSearches > 0
      ? Math.round(
          recentSearches.reduce((sum, s) => sum + s.resultsCount, 0) /
            totalSearches
        )
      : 0;
  const zeroResultRate =
    totalSearches > 0
      ? Math.round((zeroResultSearches.length / totalSearches) * 100)
      : 0;

  // Process data for time-series charts
  const getTimeSeriesData = () => {
    if (recentSearches.length === 0) return [];

    const dataMap = new Map<
      string,
      { searches: number; zeroResults: number }
    >();

    recentSearches.forEach((search) => {
      const date = search.timestamp?.toDate?.();
      if (!date) return;

      let key: string;
      if (timeGrouping === "hourly") {
        // Group by hour
        key = `${date.toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
        })} ${date.getHours()}:00`;
      } else {
        // Group by day
        key = date.toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
        });
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { searches: 0, zeroResults: 0 });
      }

      const data = dataMap.get(key)!;
      data.searches++;
      if (search.resultsCount === 0) {
        data.zeroResults++;
      }
    });

    return Array.from(dataMap.entries())
      .map(([time, data]) => ({
        time,
        searches: data.searches,
        zeroResults: data.zeroResults,
      }))
      .slice(-24); // Last 24 data points
  };

  // Process data for category distribution
  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();

    recentSearches.forEach((search) => {
      const category = search.category || "Unknown";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Process data for hourly activity heatmap
  const getHourlyData = () => {
    const hourlyMap = new Map<number, number>();

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }

    recentSearches.forEach((search) => {
      const date = search.timestamp?.toDate?.();
      if (!date) return;

      const hour = date.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });

    return Array.from(hourlyMap.entries()).map(([hour, searches]) => ({
      hour: `${hour}:00`,
      searches,
    }));
  };

  // Process data for intent distribution
  const getIntentData = () => {
    const intentMap = new Map<SearchIntent, number>();

    recentSearches.forEach((search) => {
      if (search.intent) {
        intentMap.set(search.intent, (intentMap.get(search.intent) || 0) + 1);
      }
    });

    return Array.from(intentMap.entries())
      .map(([intent, value]) => ({
        name: getIntentLabel(intent),
        value,
        intent,
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Chart color palette
  const COLORS = [
    "#0ea5e9", // sky-500
    "#3b82f6", // blue-500
    "#06b6d4", // cyan-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#f59e0b", // amber-500
    "#10b981", // emerald-500
    "#ef4444", // red-500
  ];

  const timeSeriesData = getTimeSeriesData();
  const categoryData = getCategoryData();
  const hourlyData = getHourlyData();
  const intentData = getIntentData();

  // Cohort analysis helpers and datasets
  const getFilterString = (
    filters: Record<string, unknown> | undefined,
    key: string
  ): string | undefined => {
    if (!filters) return undefined;
    const val = filters[key];
    return typeof val === "string" ? val : undefined;
  };

  const getFilterBoolean = (
    filters: Record<string, unknown> | undefined,
    key: string
  ): boolean | undefined => {
    if (!filters) return undefined;
    const val = filters[key];
    return typeof val === "boolean" ? val : undefined;
  };

  const getDeviceType = (
    s: SearchQueryData
  ): "Mobile" | "Desktop" | "Tablet" | "Unknown" => {
    const isMobile = getFilterBoolean(s.filters, "isMobile");
    const deviceType = (
      getFilterString(s.filters, "deviceType") ||
      getFilterString(s.filters, "device") ||
      ""
    ).toLowerCase();
    if (isMobile === true) return "Mobile";
    if (deviceType.includes("mobile")) return "Mobile";
    if (deviceType.includes("tablet")) return "Tablet";
    if (deviceType.includes("desktop") || deviceType.includes("pc"))
      return "Desktop";
    return "Unknown";
  };

  const getNewReturningData = () => {
    const userCounts = new Map<string, number>();
    let guestSearches = 0;
    recentSearches.forEach((s) => {
      if (s.userId) {
        userCounts.set(s.userId, (userCounts.get(s.userId) || 0) + 1);
      } else {
        guestSearches++;
      }
    });

    let newSearches = 0;
    let returningSearches = 0;
    let newUsers = 0;
    let returningUsers = 0;
    userCounts.forEach((count) => {
      if (count <= 1) {
        newUsers++;
        newSearches += count;
      } else {
        returningUsers++;
        returningSearches += count;
      }
    });

    return {
      chart: [
        { name: "New", value: newSearches },
        { name: "Returning", value: returningSearches },
        { name: "Guest", value: guestSearches },
      ],
      users: {
        total: userCounts.size,
        newUsers,
        returningUsers,
        guestSearches,
      },
    };
  };

  const getDeviceData = () => {
    const map = new Map<string, number>();
    ["Mobile", "Desktop", "Tablet", "Unknown"].forEach((k) => map.set(k, 0));
    recentSearches.forEach((s) => {
      const type = getDeviceType(s);
      map.set(type, (map.get(type) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getDayOfWeekData = () => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map = new Map<number, number>();
    for (let i = 0; i < 7; i++) map.set(i, 0);
    recentSearches.forEach((s) => {
      const d = s.timestamp?.toDate?.();
      if (!d) return;
      const day = d.getDay();
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries()).map(([idx, searches]) => ({
      day: labels[idx],
      searches,
    }));
  };

  const getTimeOfDayData = () => {
    const map = new Map<number, number>();
    for (let i = 0; i < 24; i++) map.set(i, 0);
    recentSearches.forEach((s) => {
      const d = s.timestamp?.toDate?.();
      if (!d) return;
      const hr = d.getHours();
      map.set(hr, (map.get(hr) || 0) + 1);
    });
    return Array.from(map.entries()).map(([hour, searches]) => ({
      hour: `${hour}:00`,
      searches,
    }));
  };

  const cohortNewReturning = getNewReturningData();
  const deviceData = getDeviceData();
  const dayOfWeekData = getDayOfWeekData();
  const timeOfDayData = getTimeOfDayData();

  // Geography & Locale distributions
  const getFilterDistribution = (key: string) => {
    const map = new Map<string, number>();
    recentSearches.forEach((s) => {
      const val = (s.filters?.[key] as string | undefined)?.trim();
      if (val) {
        map.set(val, (map.get(val) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const withOthers = (items: { name: string; value: number }[], topN = 8) => {
    if (items.length <= topN) return items;
    const top = items.slice(0, topN);
    const othersTotal = items.slice(topN).reduce((sum, i) => sum + i.value, 0);
    return [...top, { name: "Others", value: othersTotal }];
  };

  const countryDist = withOthers(getFilterDistribution("country"), 8);
  const regionDist = getFilterDistribution("region").slice(0, 10);
  const cityDist = getFilterDistribution("city").slice(0, 10);
  const languageDist = withOthers(getFilterDistribution("language"), 8);
  const timezoneDist = getFilterDistribution("timezone").slice(0, 10);

  // Refinement analytics (from Firestore refinements collection)
  const [refinementAnalysis, setRefinementAnalysis] = useState<
    ReturnType<typeof analyzeRefinementSessions>
  >([]);

  const commonTransitionsTop10 = (() => {
    const counts: Record<string, number> = {};
    refinementAnalysis
      .map((s) => s.mostCommonTransition)
      .filter((t): t is string => Boolean(t))
      .forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  })();

  useEffect(() => {
    (async () => {
      try {
        const refinementsSnap = await getDocs(
          query(
            collection(db, "searchRefinements"),
            orderBy("timestamp", "desc"),
            limit(500)
          )
        );
        const events = refinementsSnap.docs.map(
          (d) => d.data() as Record<string, unknown>
        );
        setRefinementAnalysis(
          analyzeRefinementSessions(
            events.map((e) => ({
              sessionId: String(e.sessionId || ""),
              previousQuery: String(e.previousQuery || ""),
              newQuery: String(e.newQuery || ""),
              addedFilters: (e.addedFilters as Record<string, unknown>) || {},
              removedFilters:
                (e.removedFilters as Record<string, unknown>) || {},
              previousResultsCount:
                (e.previousResultsCount as number) || undefined,
              newResultsCount: (e.newResultsCount as number) || undefined,
              timestamp: Number(e.timestamp || Date.now()),
            }))
          )
        );
      } catch (err) {
        console.error("Refinement analysis load error", err);
      }
    })();
  }, [dateFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Search Analytics</h2>
          <p className="text-gray-400 text-sm mt-1">
            Track what users are searching for in PC Builder
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5"
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setShowClearDialog(true)}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
            disabled={recentSearches.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Data
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5"
            disabled={recentSearches.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Searches
            </CardTitle>
            <Search className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalSearches}</div>
            <p className="text-xs text-gray-400">In last {dateFilter} days</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Avg Results
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {avgResultsCount}
            </div>
            <p className="text-xs text-gray-400">Components per search</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Zero Results
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {zeroResultSearches.length}
            </div>
            <p className="text-xs text-gray-400">
              {zeroResultRate}% of searches
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Popular Terms
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {popularSearches.length}
            </div>
            <p className="text-xs text-gray-400">Unique queries</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="charts">Charts Overview</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="sessions">Session Flow</TabsTrigger>
          <TabsTrigger value="popular">Popular Searches</TabsTrigger>
          <TabsTrigger value="recent">Recent Searches</TabsTrigger>
          <TabsTrigger value="zero">Zero Results</TabsTrigger>
        </TabsList>

        {/* Charts Overview Tab */}
        <TabsContent value="charts">
          <div className="space-y-6">
            {/* Chart Controls */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-sky-400" />
                      Visual Analytics
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Interactive charts showing search trends and patterns
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={timeGrouping}
                      onChange={(e) =>
                        setTimeGrouping(e.target.value as "hourly" | "daily")
                      }
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                    </select>
                    <select
                      value={chartType}
                      onChange={(e) =>
                        setChartType(e.target.value as "line" | "area")
                      }
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                    >
                      <option value="area">Area Chart</option>
                      <option value="line">Line Chart</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Search Volume Trend */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Search Volume Trend
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Total searches over time with zero-result tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    Loading...
                  </div>
                ) : timeSeriesData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    {chartType === "area" ? (
                      <AreaChart data={timeSeriesData}>
                        <defs>
                          <linearGradient
                            id="colorSearches"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0ea5e9"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0ea5e9"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorZeroResults"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#f59e0b"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f59e0b"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff10"
                        />
                        <XAxis
                          dataKey="time"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af" }}
                        />
                        <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Legend wrapperStyle={{ color: "#9ca3af" }} />
                        <Area
                          type="monotone"
                          dataKey="searches"
                          stroke="#0ea5e9"
                          fillOpacity={1}
                          fill="url(#colorSearches)"
                          name="Total Searches"
                        />
                        <Area
                          type="monotone"
                          dataKey="zeroResults"
                          stroke="#f59e0b"
                          fillOpacity={1}
                          fill="url(#colorZeroResults)"
                          name="Zero Results"
                        />
                      </AreaChart>
                    ) : (
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff10"
                        />
                        <XAxis
                          dataKey="time"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af" }}
                        />
                        <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Legend wrapperStyle={{ color: "#9ca3af" }} />
                        <Line
                          type="monotone"
                          dataKey="searches"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          name="Total Searches"
                          dot={{ fill: "#0ea5e9" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="zeroResults"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="Zero Results"
                          dot={{ fill: "#f59e0b" }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Category Distribution */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Category Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Which components users search for most
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-400">
                      Loading...
                    </div>
                  ) : categoryData.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name} (${entry.value})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Hourly Activity Heatmap */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Hourly Search Activity
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Peak search times throughout the day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-400">
                      Loading...
                    </div>
                  ) : hourlyData.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={hourlyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff10"
                        />
                        <XAxis
                          dataKey="hour"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          interval={2}
                        />
                        <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Bar
                          dataKey="searches"
                          fill="#0ea5e9"
                          radius={[4, 4, 0, 0]}
                          name="Searches"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Search Intent Distribution */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Search Intent Distribution
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Understand customer behavior: Research, Comparison, Price
                  Checking, or Specific Product
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    Loading...
                  </div>
                ) : intentData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No intent data available yet
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Pie Chart */}
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={intentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {intentData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? "#3b82f6"
                                  : index === 1
                                  ? "#8b5cf6"
                                  : index === 2
                                  ? "#f59e0b"
                                  : "#10b981"
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Intent Stats */}
                    <div className="space-y-4">
                      {intentData.map((intent) => {
                        const colors = getIntentColor(intent.intent);
                        const percentage = (
                          (intent.value / totalSearches) *
                          100
                        ).toFixed(1);
                        return (
                          <div
                            key={intent.intent}
                            className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    intent.intent === "research"
                                      ? "#3b82f6"
                                      : intent.intent === "comparison"
                                      ? "#8b5cf6"
                                      : intent.intent === "price_checking"
                                      ? "#f59e0b"
                                      : "#10b981",
                                }}
                              />
                              <div>
                                <Badge
                                  className={`${colors.bg} ${colors.border} ${colors.text}`}
                                >
                                  {intent.name}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white">
                                {intent.value}
                              </div>
                              <div className="text-sm text-gray-400">
                                {percentage}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Search Terms Bar Chart */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Top Search Terms</CardTitle>
                <CardDescription className="text-gray-400">
                  Most popular search queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    Loading...
                  </div>
                ) : popularSearches.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={popularSearches.slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis
                        type="number"
                        stroke="#9ca3af"
                        tick={{ fill: "#9ca3af" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="query"
                        stroke="#9ca3af"
                        tick={{ fill: "#9ca3af" }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                        name="Search Count"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions">
          <div className="space-y-6">
            {/* Funnel Metrics */}
            {funnelMetrics && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Search → View
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-sky-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {funnelMetrics.searchToView.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-400">
                      {funnelMetrics.searchesWithResults} with results
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      View → Cart
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {funnelMetrics.viewToCart.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-400">
                      {funnelMetrics.addedToCart} added to cart
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Cart → Checkout
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {funnelMetrics.cartToCheckout.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-400">
                      {funnelMetrics.completedCheckout} purchases
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Revenue (Search)
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(funnelMetrics.totalRevenue)}
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(funnelMetrics.avgRevenuePerSearch)} /
                      search
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Funnel Visualization & Trend */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Funnel Visualization */}
              {funnelMetrics && (
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-sky-400" />
                      Conversion Funnel
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Visual drop-off from search to checkout
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={getFunnelChartData(funnelMetrics)}
                        layout="vertical"
                        margin={{ left: 100 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff10"
                        />
                        <XAxis
                          type="number"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="stage"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af" }}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#0ea5e9"
                          radius={[0, 6, 6, 0]}
                          name="Stage Count"
                        >
                          <LabelList
                            dataKey="count"
                            position="right"
                            fill="#e5e7eb"
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Conversion Rate Trend */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Conversion Rate Trend
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Daily % of searches resulting in checkout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {conversionTrend.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No trend data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      {chartType === "area" ? (
                        <AreaChart data={conversionTrend}>
                          <defs>
                            <linearGradient
                              id="colorConversion"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#22c55e"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#22c55e"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            tick={{ fill: "#9ca3af" }}
                          />
                          <YAxis
                            stroke="#9ca3af"
                            tick={{ fill: "#9ca3af" }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="conversionRate"
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorConversion)"
                            name="Conversion Rate"
                          />
                        </AreaChart>
                      ) : (
                        <LineChart data={conversionTrend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            tick={{ fill: "#9ca3af" }}
                          />
                          <YAxis
                            stroke="#9ca3af"
                            tick={{ fill: "#9ca3af" }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="conversionRate"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ fill: "#22c55e" }}
                            name="Conversion Rate"
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Revenue Terms */}
            {topRevenueTerms.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Revenue by Search Term
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Which search terms drive the most revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">
                          Search Term
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Searches
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Conversions
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Conv. Rate
                        </TableHead>
                        <TableHead className="text-gray-300">Revenue</TableHead>
                        <TableHead className="text-gray-300">
                          Rev/Search
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRevenueTerms.slice(0, 15).map((row) => (
                        <TableRow key={row.query} className="border-white/10">
                          <TableCell className="text-white font-medium">
                            {row.query}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {row.searchCount}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {row.conversions}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                row.conversionRate > 5
                                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                                  : row.conversionRate > 2
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                  : "bg-gray-500/20 border-gray-500/40 text-gray-400"
                              }
                            >
                              {row.conversionRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">
                            {formatCurrency(row.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {formatCurrency(row.revenuePerSearch)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Time-to-Conversion */}
            {funnelMetrics && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Time to Conversion
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Average time from search to cart/checkout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-gray-300 text-sm">Search → Cart</p>
                      <p className="text-white text-2xl font-bold">
                        {formatDuration(funnelMetrics.avgTimeToCart)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-gray-300 text-sm">Search → Checkout</p>
                      <p className="text-white text-2xl font-bold">
                        {formatDuration(funnelMetrics.avgTimeToCheckout)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data footnote to use conversions state */}
            <p className="text-xs text-gray-500">
              Loaded {conversions.length} conversion events in this period.
            </p>
          </div>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Unique Users
                  </CardTitle>
                  <Search className="h-4 w-4 text-sky-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {cohortNewReturning.users.total}
                  </div>
                  <p className="text-xs text-gray-400">This period</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    New Users
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {cohortNewReturning.users.newUsers}
                  </div>
                  <p className="text-xs text-gray-400">
                    First-time this period
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Returning Users
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {cohortNewReturning.users.returningUsers}
                  </div>
                  <p className="text-xs text-gray-400">Repeat searches</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Guest Searches
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {cohortNewReturning.users.guestSearches}
                  </div>
                  <p className="text-xs text-gray-400">No user ID</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">New vs Returning</CardTitle>
                  <CardDescription className="text-gray-400">
                    Share of searches by cohort
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={cohortNewReturning.chart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {cohortNewReturning.chart.map((_, index) => (
                          <Cell
                            key={`cell-nr-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Device Type</CardTitle>
                  <CardDescription className="text-gray-400">
                    Mobile vs Desktop usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceData.map((_, index) => (
                          <Cell
                            key={`cell-dev-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Time of Day</CardTitle>
                  <CardDescription className="text-gray-400">
                    Hourly search distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeOfDayData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis
                        dataKey="hour"
                        stroke="#9ca3af"
                        tick={{ fill: "#9ca3af", fontSize: 10 }}
                        interval={2}
                      />
                      <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="searches"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        name="Searches"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Day of Week</CardTitle>
                  <CardDescription className="text-gray-400">
                    Weekly usage pattern
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dayOfWeekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis
                        dataKey="day"
                        stroke="#9ca3af"
                        tick={{ fill: "#9ca3af" }}
                      />
                      <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="searches"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        name="Searches"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Refinements */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Refinement Activity
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Sessions with refinements (last 500 events)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {refinementAnalysis.length}
                  </div>
                  <p className="text-xs text-gray-400">Distinct sessions</p>
                  <div className="mt-4 space-y-2">
                    {refinementAnalysis.slice(0, 5).map((s) => (
                      <div key={s.sessionId} className="text-sm text-gray-300">
                        <span className="text-white">
                          {s.totalRefinements} refinements
                        </span>{" "}
                        {s.stuckIndicators.excessiveRefinements && (
                          <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-300 ml-2">
                            Stuck
                          </Badge>
                        )}
                        {s.stuckIndicators.repeatedZeroResults && (
                          <Badge className="bg-pink-500/20 border-pink-500/40 text-pink-300 ml-2">
                            Zero results
                          </Badge>
                        )}
                        {s.stuckIndicators.loopsDetected && (
                          <Badge className="bg-cyan-500/20 border-cyan-500/40 text-cyan-300 ml-2">
                            Looping
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Common Transitions
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Top query → query changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={commonTransitionsTop10}
                      layout="vertical"
                      margin={{ left: 120 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis
                        type="number"
                        stroke="#9ca3af"
                        tick={{ fill: "#9ca3af" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#9ca3af"
                        tick={{ fill: "#9ca3af" }}
                        width={160}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#06b6d4"
                        radius={[0, 4, 4, 0]}
                        name="Occurrences"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Geography & Locale Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">
                Geography & Locale
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Countries */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Countries</CardTitle>
                    <CardDescription className="text-gray-400">
                      Top countries by searches
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {countryDist.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={countryDist}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {countryDist.map((_, index) => (
                              <Cell
                                key={`cell-country-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Languages */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Languages</CardTitle>
                    <CardDescription className="text-gray-400">
                      Browser language distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {languageDist.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={languageDist}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {languageDist.map((_, index) => (
                              <Cell
                                key={`cell-lang-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Regions */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Regions</CardTitle>
                    <CardDescription className="text-gray-400">
                      Top regions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {regionDist.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={regionDist}
                          layout="vertical"
                          margin={{ left: 100 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                          />
                          <XAxis
                            type="number"
                            stroke="#9ca3af"
                            tick={{ fill: "#9ca3af" }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#9ca3af"
                            tick={{ fill: "#9ca3af" }}
                            width={120}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            fill="#8b5cf6"
                            radius={[0, 4, 4, 0]}
                            name="Searches"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Cities */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Cities</CardTitle>
                    <CardDescription className="text-gray-400">
                      Top cities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cityDist.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={cityDist}
                          layout="vertical"
                          margin={{ left: 100 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                          />
                          <XAxis
                            type="number"
                            stroke="#9ca3af"
                            tick={{ fill: "#9ca3af" }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#9ca3af"
                            tick={{ fill: "#9ca3af" }}
                            width={120}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            fill="#ec4899"
                            radius={[0, 4, 4, 0]}
                            name="Searches"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Timezones */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Timezones</CardTitle>
                  <CardDescription className="text-gray-400">
                    Where users are searching from (browser timezone)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timezoneDist.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={timezoneDist}
                        layout="vertical"
                        margin={{ left: 120 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff10"
                        />
                        <XAxis
                          type="number"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af" }}
                          width={160}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#10b981"
                          radius={[0, 4, 4, 0]}
                          name="Searches"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Session Flow Analysis Tab */}
        <TabsContent value="sessions">
          <div className="space-y-6">
            {/* Session Flow Stats */}
            {sessionAnalysis && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Total Sessions
                    </CardTitle>
                    <GitBranch className="h-4 w-4 text-sky-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {sessionAnalysis.totalSessions}
                    </div>
                    <p className="text-xs text-gray-400">
                      {sessionAnalysis.avgSearchesPerSession.toFixed(1)}{" "}
                      searches/session
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Conversion Rate
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {sessionAnalysis.conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-400">Sessions → Checkout</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Add to Cart Rate
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {sessionAnalysis.addToCartRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-400">Sessions → Cart</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Abandonment Rate
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {sessionAnalysis.abandonmentRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-400">No action taken</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Top Conversion Paths */}
            {sessionAnalysis &&
              sessionAnalysis.topConversionPaths.length > 0 && (
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Top Conversion Paths
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Search journeys that led to checkout
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sessionAnalysis.topConversionPaths.map((path, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge className="bg-green-500/20 border-green-500/40 text-green-400 shrink-0">
                              #{idx + 1}
                            </Badge>
                            <p className="text-white text-sm truncate">
                              {path.path}
                            </p>
                          </div>
                          <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 shrink-0">
                            {path.conversions}{" "}
                            {path.conversions === 1
                              ? "conversion"
                              : "conversions"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Common Search Patterns */}
            {sessionAnalysis && sessionAnalysis.commonPatterns.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Common Search Patterns
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Most frequent search sequences (showing conversion rates)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">Pattern</TableHead>
                        <TableHead className="text-gray-300">
                          Occurrences
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Conv. Rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionAnalysis.commonPatterns.map((pattern, idx) => (
                        <TableRow key={idx} className="border-white/10">
                          <TableCell className="text-white font-mono text-sm">
                            {pattern.pattern}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
                              {pattern.count}x
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                pattern.conversionRate > 50
                                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                                  : pattern.conversionRate > 20
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                  : "bg-red-500/20 border-red-500/40 text-red-400"
                              }
                            >
                              {pattern.conversionRate.toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Individual Sessions */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Search Sessions</CardTitle>
                <CardDescription className="text-gray-400">
                  Individual user search journeys
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    Loading...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No session data yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">
                          Session Journey
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Searches
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Duration
                        </TableHead>
                        <TableHead className="text-gray-300">
                          Behavior
                        </TableHead>
                        <TableHead className="text-gray-300">Outcome</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.slice(0, 20).map((session) => {
                        const behavior = classifySessionBehavior(session);
                        const durationMins = Math.round(
                          session.duration / 60000
                        );

                        return (
                          <TableRow
                            key={session.sessionId}
                            className="border-white/10"
                          >
                            <TableCell className="text-white font-mono text-sm max-w-md truncate">
                              {session.pattern}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
                                {session.totalSearches}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {durationMins < 1 ? "<1" : durationMins} min
                              {durationMins !== 1 ? "s" : ""}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  behavior === "Narrowing Search"
                                    ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                                    : behavior === "Broadening Search"
                                    ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                                    : behavior === "Exploring Options"
                                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                    : "bg-gray-500/20 border-gray-500/40 text-gray-400"
                                }
                              >
                                {behavior}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {session.converted ? (
                                <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                                  ✓ Checkout
                                </Badge>
                              ) : session.addedToCart ? (
                                <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-400">
                                  Cart
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
                                  Exit
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Popular Searches */}
        <TabsContent value="popular">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Most Searched Terms</CardTitle>
              <CardDescription className="text-gray-400">
                Identify popular products to stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : popularSearches.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No search data yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-300">Query</TableHead>
                      <TableHead className="text-gray-300">Intent</TableHead>
                      <TableHead className="text-gray-300">Count</TableHead>
                      <TableHead className="text-gray-300">
                        Avg Results
                      </TableHead>
                      <TableHead className="text-gray-300">
                        Zero Results
                      </TableHead>
                      <TableHead className="text-gray-300">
                        Top Category
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularSearches.map((stat, idx) => {
                      const topCategory = Object.entries(stat.categories).sort(
                        ([, a], [, b]) => b - a
                      )[0];
                      const topIntent = stat.intents
                        ? (Object.entries(stat.intents).sort(
                            ([, a], [, b]) => b - a
                          )[0]?.[0] as SearchIntent | undefined)
                        : undefined;
                      const intentColors = topIntent
                        ? getIntentColor(topIntent)
                        : null;
                      return (
                        <TableRow key={idx} className="border-white/10">
                          <TableCell className="text-white font-medium">
                            {stat.query}
                          </TableCell>
                          <TableCell>
                            {topIntent && intentColors ? (
                              <Badge
                                className={`${intentColors.bg} ${intentColors.border} ${intentColors.text}`}
                              >
                                {getIntentLabel(topIntent)}
                              </Badge>
                            ) : (
                              <span className="text-gray-500 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-white">
                            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
                              {stat.count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {stat.avgResults}
                          </TableCell>
                          <TableCell>
                            {stat.zeroResults > 0 ? (
                              <Badge className="bg-yellow-500/20 border-yellow-500/40 text-yellow-400">
                                {stat.zeroResults}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {topCategory?.[0] || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Searches */}
        <TabsContent value="recent">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Searches</CardTitle>
              <CardDescription className="text-gray-400">
                Live search activity from users
              </CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Filter searches..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="max-w-sm bg-white/5 border-white/10 text-white"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : filteredRecentSearches.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No searches found
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">Query</TableHead>
                        <TableHead className="text-gray-300">Intent</TableHead>
                        <TableHead className="text-gray-300">
                          Category
                        </TableHead>
                        <TableHead className="text-gray-300">Results</TableHead>
                        <TableHead className="text-gray-300">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecentSearches.map((search) => {
                        const intentColors = search.intent
                          ? getIntentColor(search.intent)
                          : null;
                        return (
                          <TableRow key={search.id} className="border-white/10">
                            <TableCell className="text-white font-medium">
                              {search.originalQuery}
                            </TableCell>
                            <TableCell>
                              {search.intent && intentColors ? (
                                <Badge
                                  className={`${intentColors.bg} ${intentColors.border} ${intentColors.text}`}
                                >
                                  {getIntentLabel(search.intent)}
                                </Badge>
                              ) : (
                                <span className="text-gray-500 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-400">
                                {search.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  search.resultsCount === 0
                                    ? "bg-red-500/20 border-red-500/40 text-red-400"
                                    : "bg-green-500/20 border-green-500/40 text-green-400"
                                }
                              >
                                {search.resultsCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {search.timestamp?.toDate
                                ? formatDateTimeUK(search.timestamp.toDate())
                                : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zero Result Searches */}
        <TabsContent value="zero">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Zero Result Searches
              </CardTitle>
              <CardDescription className="text-gray-400">
                Products users want but you don't have - sourcing opportunities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : zeroResultSearches.length === 0 ? (
                <div className="text-center py-8 text-green-400">
                  ✓ All searches returned results!
                </div>
              ) : (
                <div className="space-y-4">
                  {zeroResultSearches.map((search) => {
                    const hasSuggestions =
                      search.suggestions && search.suggestions.length > 0;

                    return (
                      <Card
                        key={search.id}
                        className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-yellow-500/30 transition-colors"
                      >
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            {/* Query Info */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-white font-semibold text-lg">
                                  "{search.originalQuery}"
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-yellow-500/20 border-yellow-500/40 text-yellow-400">
                                  {search.category}
                                </Badge>
                                <span className="text-gray-400 text-sm">
                                  {search.timestamp?.toDate
                                    ? formatDateTimeUK(
                                        search.timestamp.toDate()
                                      )
                                    : "-"}
                                </span>
                              </div>
                            </div>

                            {/* Smart Suggestions */}
                            {hasSuggestions ? (
                              <div className="pl-7 space-y-2">
                                <p className="text-gray-300 text-sm font-medium mb-2">
                                  💡 Smart Suggestions:
                                </p>
                                {search.suggestions!.map((suggestion, idx) => {
                                  const style = getSuggestionStyle(
                                    suggestion.type
                                  );
                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                                    >
                                      <span className="text-xl">
                                        {style.icon}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`${style.color} font-medium`}
                                        >
                                          {formatSuggestion(suggestion)}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                          {suggestion.reason}
                                        </p>
                                      </div>
                                      <Badge
                                        className={
                                          suggestion.confidence >= 0.9
                                            ? "bg-green-500/20 border-green-500/40 text-green-400"
                                            : suggestion.confidence >= 0.7
                                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                            : "bg-gray-500/20 border-gray-500/40 text-gray-400"
                                        }
                                      >
                                        {Math.round(
                                          suggestion.confidence * 100
                                        )}
                                        %
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="pl-7">
                                <p className="text-gray-500 text-sm italic">
                                  No suggestions available for this search
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="bg-gray-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Clear Search Analytics Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete all search queries and zero-result
              searches from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
