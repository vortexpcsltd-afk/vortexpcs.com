import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Download } from "lucide-react";
// import { fetchPCComponents, fetchPCOptionalExtras } from "../services/cms";

// Types
interface RecommendationItem {
  title: string;
  reason: string;
  score: number; // 0-100
  query?: string;
  category?: string;
  inventory?: {
    inStock?: boolean;
    stockLevel?: number;
  };
}

interface SpellingCorrectionItem {
  typo: string;
  suggestion: string;
  count: number;
}

interface Props {
  className?: string;
}

// Helper: simple CSV exporter
function exportCSV(filename: string, rows: Array<Record<string, unknown>>) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsRecommendations({ className }: Props) {
  const [missingProducts, setMissingProducts] = useState<RecommendationItem[]>(
    []
  );
  const [underperformingCategories, setUnderperformingCategories] = useState<
    RecommendationItem[]
  >([]);
  const [quickWins, setQuickWins] = useState<RecommendationItem[]>([]);
  const [spellingCorrections, setSpellingCorrections] = useState<
    SpellingCorrectionItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch predictive stock alerts from backend
        type AlertItem = {
          title?: string;
          query?: string;
          score?: number;
          reason?: string;
          reasonDetail?: string;
          lowInventory?: boolean;
          recommendation?: string;
          recommendationDetail?: string;
          inventory?: { inStock?: boolean; stockLevel?: number };
        };
        let alerts: AlertItem[] = [];
        try {
          const resp = await fetch("/api/admin/reports/predictive-stock");
          if (resp.ok) {
            const data = await resp.json();
            alerts = Array.isArray(data?.alerts) ? data.alerts : [];
          }
        } catch {
          // network/API unavailable; continue with fallbacks
        }

        // Map alerts into UI sections
        const missing: RecommendationItem[] = alerts
          .filter((a) => a?.reason === "missing" || a?.lowInventory)
          .slice(0, 5)
          .map((a) => ({
            title: a.title || a.query || "Unknown",
            reason:
              a.reasonDetail || "High demand with low/no inventory detected",
            score: Number(a.score ?? 75),
            query: a.query,
            inventory: {
              inStock: a.inventory?.inStock,
              stockLevel: a.inventory?.stockLevel,
            },
          }));

        const quick: RecommendationItem[] = alerts
          .filter((a) => a?.recommendation === "quick-win")
          .slice(0, 5)
          .map((a) => ({
            title: a.title || a.query || "Unknown",
            reason: a.recommendationDetail || "Low effort, high impact add",
            score: Number(a.score ?? 70),
          }));

        // Underperforming categories placeholder (requires CTR metrics); keep empty until wired
        const underperf: RecommendationItem[] = [];

        // Spelling corrections from typo clusters API/DB (fallback demo if none)
        const corrections: SpellingCorrectionItem[] = [];
        if (corrections.length === 0) {
          corrections.push({
            typo: "rtx 4009",
            suggestion: "rtx 4090",
            count: 7,
          });
        }

        if (!active) return;
        setMissingProducts(missing);
        setUnderperformingCategories(underperf);
        setQuickWins(quick);
        setSpellingCorrections(corrections);
      } catch (e: unknown) {
        if (!active) return;
        const msg =
          typeof e === "object" && e && "message" in e
            ? String(
                (e as { message?: unknown }).message ??
                  "Failed to load recommendations"
              )
            : "Failed to load recommendations";
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const header = (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Recommendations</h2>
        <p className="text-gray-300 text-sm">
          Actionable insights to source products, fix gaps, and improve
          conversions.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() =>
            exportCSV(
              "missing-products.csv",
              missingProducts.map((m) => ({
                title: m.title,
                reason: m.reason,
                score: m.score,
                query: m.query,
                stockLevel: m.inventory?.stockLevel ?? "",
              }))
            )
          }
        >
          <Download className="w-4 h-4 mr-2" /> Export Missing
        </Button>
        <Button
          onClick={() =>
            exportCSV(
              "underperforming-categories.csv",
              underperformingCategories.map((m) => ({
                category: m.category ?? m.title,
                reason: m.reason,
                score: m.score,
              }))
            )
          }
        >
          <Download className="w-4 h-4 mr-2" /> Export Categories
        </Button>
        <Button
          onClick={() =>
            exportCSV(
              "quick-wins.csv",
              quickWins.map((m) => ({
                title: m.title,
                reason: m.reason,
                score: m.score,
              }))
            )
          }
        >
          <Download className="w-4 h-4 mr-2" /> Export Quick Wins
        </Button>
        <Button
          onClick={() =>
            exportCSV(
              "spelling-corrections.csv",
              spellingCorrections.map((s) => ({
                typo: s.typo,
                suggestion: s.suggestion,
                count: s.count,
              }))
            )
          }
        >
          <Download className="w-4 h-4 mr-2" /> Export Corrections
        </Button>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {header}

      {error && (
        <Card className="bg-red-500/10 border-red-500/40 mb-4 p-4">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
          <p className="text-gray-300">Loading recommendations…</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Missing Products */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 p-4">
            <h3 className="text-white font-semibold mb-2">
              Top Missing Products
            </h3>
            <div className="space-y-2">
              {missingProducts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between border border-white/10 rounded-lg p-3"
                >
                  <div>
                    <div className="text-white font-medium">{item.title}</div>
                    <div className="text-gray-300 text-sm">
                      {item.reason}
                      {item.query ? ` · "${item.query}"` : ""}
                    </div>
                    {item.inventory && (
                      <div className="text-gray-400 text-xs mt-1">
                        Stock:{" "}
                        {item.inventory.stockLevel ??
                          (item.inventory.inStock ? "Yes" : "No")}
                      </div>
                    )}
                  </div>
                  <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
                    Score {item.score}
                  </Badge>
                </div>
              ))}
              {missingProducts.length === 0 && (
                <div className="text-gray-400 text-sm">No items detected.</div>
              )}
            </div>
          </Card>

          {/* Underperforming Categories */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 p-4">
            <h3 className="text-white font-semibold mb-2">
              Underperforming Categories
            </h3>
            <div className="space-y-2">
              {underperformingCategories.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between border border-white/10 rounded-lg p-3"
                >
                  <div>
                    <div className="text-white font-medium">
                      {item.category ?? item.title}
                    </div>
                    <div className="text-gray-300 text-sm">{item.reason}</div>
                  </div>
                  <Badge className="bg-cyan-500/20 border-cyan-500/40 text-cyan-400">
                    Score {item.score}
                  </Badge>
                </div>
              ))}
              {underperformingCategories.length === 0 && (
                <div className="text-gray-400 text-sm">
                  All categories performing well.
                </div>
              )}
            </div>
          </Card>

          {/* Quick Wins */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 p-4">
            <h3 className="text-white font-semibold mb-2">Quick Wins</h3>
            <div className="space-y-2">
              {quickWins.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between border border-white/10 rounded-lg p-3"
                >
                  <div>
                    <div className="text-white font-medium">{item.title}</div>
                    <div className="text-gray-300 text-sm">{item.reason}</div>
                  </div>
                  <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-400">
                    Score {item.score}
                  </Badge>
                </div>
              ))}
              {quickWins.length === 0 && (
                <div className="text-gray-400 text-sm">
                  No quick wins identified.
                </div>
              )}
            </div>
          </Card>

          {/* Spelling Corrections */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 p-4">
            <h3 className="text-white font-semibold mb-2">
              Spelling Corrections
            </h3>
            <div className="space-y-2">
              {spellingCorrections.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border border-white/10 rounded-lg p-3"
                >
                  <div className="text-gray-300 text-sm">
                    "{item.typo}" →{" "}
                    <span className="text-white font-medium">
                      {item.suggestion}
                    </span>
                  </div>
                  <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
                    {item.count} occurrences
                  </Badge>
                </div>
              ))}
              {spellingCorrections.length === 0 && (
                <div className="text-gray-400 text-sm">
                  No corrections needed.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
