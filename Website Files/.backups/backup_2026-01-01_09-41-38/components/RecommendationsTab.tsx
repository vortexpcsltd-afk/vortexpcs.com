import React, { useCallback, useEffect, useState } from "react";
import { logger } from "../services/logger";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Loader2, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

interface MissingProductRecommendation {
  query: string;
  searches: number;
  zeroResults: number;
  avgResults: number;
  reason: string;
  stockLevel?: number;
  inventoryMatch?: string;
  addToCartConversions?: number;
  checkoutConversions?: number;
  impactScore?: number;
  revenue?: number;
}
interface UnderperformingCategoryRecommendation {
  category: string;
  searches: number;
  avgResults: number;
  zeroResultRate: number;
  reason: string;
}
interface QuickWinRecommendation {
  item: string;
  type: "query" | "category";
  searches: number;
  potentialImpact: string;
  reason: string;
  stockLevel?: number;
  inventoryMatch?: string;
  addToCartConversions?: number;
  checkoutConversions?: number;
  impactScore?: number;
  revenue?: number;
}
interface SpellingCorrectionCluster {
  canonical: string;
  variants: Array<{ variant: string; count: number; distance: number }>;
  suggestion: string;
  totalVariants: number;
}
interface RecommendationsPayload {
  missingProducts: MissingProductRecommendation[];
  underperformingCategories: UnderperformingCategoryRecommendation[];
  quickWins: QuickWinRecommendation[];
  spellingCorrections: SpellingCorrectionCluster[];
  windowDays: number;
  generatedAt: string;
}

export const RecommendationsTab: React.FC = () => {
  const [data, setData] = useState<RecommendationsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [acting, setActing] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const [minImpact, setMinImpact] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the current Firebase user's ID token
      let idToken: string | null = null;
      try {
        const { auth } = await import("../config/firebase");
        if (auth?.currentUser) {
          idToken = await auth.currentUser.getIdToken();
        }
      } catch (err) {
        logger.warn("Failed to get Firebase token", { error: err });
      }

      const headers: Record<string, string> = {};
      if (idToken) headers.Authorization = `Bearer ${idToken}`;
      const resp = await fetch(
        `/api/admin/analytics/recommendations?days=${days}`,
        { headers }
      );
      const contentType = resp.headers.get("content-type") || "";
      let json: unknown = null;
      let text: string | null = null;
      if (contentType.includes("application/json")) {
        try {
          json = await resp.json();
        } catch {
          // Fallback to text if JSON parsing fails
          text = await resp.text();
        }
      } else {
        // Non-JSON response (e.g., HTML error page)
        text = await resp.text();
      }

      if (!resp.ok) {
        const rawSnippet = (text || "").trim().slice(0, 120);
        const jo = json as Record<string, unknown> | null;
        const errFromJson =
          (jo && typeof jo["error"] === "string" && (jo["error"] as string)) ||
          (jo &&
            typeof jo["message"] === "string" &&
            (jo["message"] as string)) ||
          undefined;
        const msg =
          errFromJson ||
          (rawSnippet
            ? `Server error: ${rawSnippet}`
            : `Failed to load recommendations (HTTP ${resp.status})`);
        throw new Error(msg);
      }

      // If we expected JSON but didn't get a parsable payload, provide a safe fallback
      const recs = (json as Record<string, unknown> | null)?.[
        "recommendations"
      ];
      if (!recs) {
        setData({
          missingProducts: [],
          underperformingCategories: [],
          quickWins: [],
          spellingCorrections: [],
          windowDays: days,
          generatedAt: new Date().toISOString(),
        });
      } else {
        setData(recs as RecommendationsPayload);
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? // Normalise noisy JSON parse errors into a friendly message
            /Unexpected token/.test(e.message)
            ? "A server response was not valid JSON. Please refresh or try again."
            : e.message
          : "Failed to load recommendations";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  function exportCSV(section: string, rows: string[][]) {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recommendations_${section}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function impactTier(score?: number) {
    if (score === undefined)
      return {
        label: "n/a",
        className: "bg-gray-500/20 border-gray-500/40 text-gray-300",
      };
    if (score >= 70)
      return {
        label: "High",
        className: "bg-red-500/30 border-red-500/50 text-red-200",
      };
    if (score >= 40)
      return {
        label: "Med",
        className: "bg-amber-500/30 border-amber-500/50 text-amber-200",
      };
    return {
      label: "Low",
      className: "bg-blue-500/30 border-blue-500/50 text-blue-200",
    };
  }

  async function actOnSynonym(
    action: "accept" | "ignore",
    canonical: string,
    variant: string
  ) {
    try {
      setActing(`${action}:${canonical}:${variant}`);
      const tokenRaw = localStorage.getItem("vortex_user");
      let idToken: string | null = null;
      if (tokenRaw) {
        try {
          const parsed = JSON.parse(tokenRaw);
          idToken = parsed?.authToken || parsed?.accessToken || null;
        } catch {
          void 0; // stored token is optional; continue without auth
        }
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (idToken) headers.Authorization = `Bearer ${idToken}`;
      const resp = await fetch("/api/admin/analytics/synonyms", {
        method: "POST",
        headers,
        body: JSON.stringify({ action, canonical, variant }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Action failed");
      const key = `${canonical}|${variant}`;
      if (action === "accept") {
        setAccepted((prev) => new Set(prev).add(key));
        toast.success(`Accepted '${variant}' → '${canonical}'`);
      } else {
        setIgnored((prev) => new Set(prev).add(key));
        toast.info(`Ignored '${variant}' for '${canonical}'`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  if (loading && !data)
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Actionable Recommendations
          </h2>
          <p className="text-gray-400 mt-1">
            Automatically generated insights from search behavior (last {days}{" "}
            days)
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="bg-white/5 border-white/10 text-white text-sm rounded px-2 py-1"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
          >
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={90}>90d</option>
          </select>
          <select
            className="bg-white/5 border-white/10 text-white text-sm rounded px-2 py-1"
            value={minImpact}
            onChange={(e) => setMinImpact(parseInt(e.target.value))}
          >
            <option value={0}>All Impact</option>
            <option value={30}>30+</option>
            <option value={40}>40+</option>
            <option value={70}>70+</option>
          </select>
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="border-sky-500/40 text-sky-400"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-red-300 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Missing Products */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Missing Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Top 5 Missing Products
              </h3>
              <p className="text-sm text-gray-400 max-w-2xl">
                High-demand searches with unavailable or insufficient results.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!data?.missingProducts?.length}
              onClick={() =>
                data &&
                exportCSV("missing_products", [
                  ["query", "searches", "zeroResults", "avgResults", "reason"],
                  ...data.missingProducts.map((r) => [
                    r.query,
                    String(r.searches),
                    String(r.zeroResults),
                    String(r.avgResults),
                    r.reason,
                  ]),
                ])
              }
              className="border-sky-500/40 text-sky-400"
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
          <div className="space-y-3">
            {data?.missingProducts?.length ? (
              data.missingProducts
                .filter((m) => (m.impactScore ?? 0) >= minImpact)
                .sort(
                  (a, b) =>
                    (b.impactScore ?? 0) - (a.impactScore ?? 0) ||
                    b.searches - a.searches
                )
                .slice(0, 5)
                .map((m) => (
                  <div
                    key={m.query}
                    className="flex items-start justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="text-white font-medium">{m.query}</p>
                      <p className="text-xs text-gray-400 mt-1">{m.reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-gradient-to-r from-red-500/30 to-pink-500/30 border-red-500/40 text-red-200">
                        {m.searches} searches
                      </Badge>
                      <Badge className="bg-red-500/20 border-red-500/40 text-red-300">
                        {m.zeroResults} zero-results
                      </Badge>
                      {m.impactScore !== undefined && (
                        <Badge className={impactTier(m.impactScore).className}>
                          {impactTier(m.impactScore).label} {m.impactScore}
                        </Badge>
                      )}
                      {m.stockLevel !== undefined && (
                        <Badge className="bg-purple-500/20 border-purple-500/40 text-purple-300">
                          stock {m.stockLevel}
                        </Badge>
                      )}
                      {m.checkoutConversions && m.checkoutConversions > 0 && (
                        <Badge className="bg-green-500/20 border-green-500/40 text-green-300">
                          chk {m.checkoutConversions}
                        </Badge>
                      )}
                      {m.revenue && m.revenue > 0 && (
                        <Badge className="bg-green-600/30 border-green-600/50 text-green-200">
                          £{m.revenue.toFixed(0)} rev
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-gray-400">
                No strong missing product signals.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Underperforming Categories */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">
            Underperforming Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Low Conversion / High Friction
              </h3>
              <p className="text-sm text-gray-400 max-w-2xl">
                Categories with high search volume but low results or high
                zero-result rate.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!data?.underperformingCategories?.length}
              onClick={() =>
                data &&
                exportCSV("underperforming_categories", [
                  [
                    "category",
                    "searches",
                    "avgResults",
                    "zeroResultRate",
                    "reason",
                  ],
                  ...data.underperformingCategories.map((r) => [
                    r.category,
                    String(r.searches),
                    String(r.avgResults),
                    String(r.zeroResultRate),
                    r.reason,
                  ]),
                ])
              }
              className="border-sky-500/40 text-sky-400"
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
          <div className="space-y-3">
            {data?.underperformingCategories?.length ? (
              data.underperformingCategories
                .sort((a, b) => b.searches - a.searches)
                .map((c) => (
                  <div
                    key={c.category}
                    className="flex items-start justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="text-white font-medium capitalize">
                        {c.category}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{c.reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-500/40 text-amber-200">
                        {c.searches} searches
                      </Badge>
                      <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-300">
                        avg {c.avgResults}
                      </Badge>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-gray-400">
                No underperforming categories detected.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Wins */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Quick Wins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Immediate Impact Items
              </h3>
              <p className="text-sm text-gray-400 max-w-2xl">
                Moderate-demand queries needing minor additions or tuning.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!data?.quickWins?.length}
              onClick={() =>
                data &&
                exportCSV("quick_wins", [
                  ["item", "type", "searches", "potentialImpact", "reason"],
                  ...data.quickWins.map((r) => [
                    r.item,
                    r.type,
                    String(r.searches),
                    r.potentialImpact,
                    r.reason,
                  ]),
                ])
              }
              className="border-sky-500/40 text-sky-400"
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
          <div className="space-y-3">
            {data?.quickWins?.length ? (
              data.quickWins
                .filter((q) => (q.impactScore ?? 0) >= minImpact)
                .sort(
                  (a, b) =>
                    (b.impactScore ?? 0) - (a.impactScore ?? 0) ||
                    b.searches - a.searches
                )
                .map((q) => (
                  <div
                    key={q.item}
                    className="flex items-start justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="text-white font-medium">{q.item}</p>
                      <p className="text-xs text-gray-400 mt-1">{q.reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-500/40 text-cyan-200">
                        {q.searches} searches
                      </Badge>
                      <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-300">
                        {q.potentialImpact}
                      </Badge>
                      {q.impactScore !== undefined && (
                        <Badge className={impactTier(q.impactScore).className}>
                          {impactTier(q.impactScore).label} {q.impactScore}
                        </Badge>
                      )}
                      {q.stockLevel !== undefined && (
                        <Badge className="bg-purple-500/20 border-purple-500/40 text-purple-300">
                          stock {q.stockLevel}
                        </Badge>
                      )}
                      {q.checkoutConversions && q.checkoutConversions > 0 && (
                        <Badge className="bg-green-500/20 border-green-500/40 text-green-300">
                          chk {q.checkoutConversions}
                        </Badge>
                      )}
                      {q.revenue && q.revenue > 0 && (
                        <Badge className="bg-green-600/30 border-green-600/50 text-green-200">
                          £{q.revenue.toFixed(0)} rev
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-gray-400">
                No quick win opportunities found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spelling Corrections */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">
            Spelling / Synonym Corrections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Typos & Normalization
              </h3>
              <p className="text-sm text-gray-400 max-w-2xl">
                Clusters of variant spellings and near matches that should map
                to a canonical query.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!data?.spellingCorrections?.length}
              onClick={() =>
                data &&
                exportCSV("spelling_corrections", [
                  ["canonical", "variant", "count", "distance"],
                  ...data.spellingCorrections.flatMap((c) =>
                    c.variants.map((v) => [
                      c.canonical,
                      v.variant,
                      String(v.count),
                      String(v.distance),
                    ])
                  ),
                ])
              }
              className="border-sky-500/40 text-sky-400"
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
          <div className="space-y-3">
            {data?.spellingCorrections?.length ? (
              data.spellingCorrections.map((c) => (
                <div
                  key={c.canonical}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{c.canonical}</p>
                    <Badge className="bg-purple-500/30 border-purple-500/40 text-purple-200">
                      {c.totalVariants} variants
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{c.suggestion}</p>
                  <div className="flex flex-wrap gap-2">
                    {c.variants.map((v) => {
                      const key = `${c.canonical}|${v.variant}`;
                      const isAccepted = accepted.has(key);
                      const isIgnored = ignored.has(key);
                      return (
                        <div
                          key={v.variant}
                          className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded px-2 py-1"
                        >
                          <span className="text-purple-200 text-xs">
                            {v.variant} ({v.count}) d={v.distance}
                          </span>
                          {!isAccepted && !isIgnored && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={acting !== null}
                                className="h-5 px-2 text-[10px] border-green-500/40 text-green-300"
                                onClick={() =>
                                  actOnSynonym("accept", c.canonical, v.variant)
                                }
                              >
                                {acting === `accept:${c.canonical}:${v.variant}`
                                  ? "..."
                                  : "Accept"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={acting !== null}
                                className="h-5 px-2 text-[10px] border-red-500/40 text-red-300"
                                onClick={() =>
                                  actOnSynonym("ignore", c.canonical, v.variant)
                                }
                              >
                                {acting === `ignore:${c.canonical}:${v.variant}`
                                  ? "..."
                                  : "Ignore"}
                              </Button>
                            </>
                          )}
                          {isAccepted && (
                            <Badge className="bg-green-500/20 border-green-500/40 text-green-300">
                              Accepted
                            </Badge>
                          )}
                          {isIgnored && (
                            <Badge className="bg-red-500/20 border-red-500/40 text-red-300">
                              Ignored
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No correction clusters detected.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-white/10" />
      <p className="text-xs text-gray-500">
        Generated{" "}
        {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : ""} ·
        Window {data?.windowDays} days
      </p>
    </div>
  );
};
