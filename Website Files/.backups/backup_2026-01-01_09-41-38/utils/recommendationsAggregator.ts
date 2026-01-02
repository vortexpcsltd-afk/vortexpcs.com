import { Firestore, Timestamp } from "firebase-admin/firestore";

export interface MissingProductRecommendation {
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

export interface UnderperformingCategoryRecommendation {
  category: string;
  searches: number;
  avgResults: number;
  zeroResultRate: number;
  reason: string;
}

export interface QuickWinRecommendation {
  item: string; // query or category
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

export interface SpellingCorrectionCluster {
  canonical: string;
  variants: Array<{ variant: string; count: number; distance: number }>;
  suggestion: string;
  totalVariants: number;
}

export interface RecommendationsPayload {
  missingProducts: MissingProductRecommendation[];
  underperformingCategories: UnderperformingCategoryRecommendation[];
  quickWins: QuickWinRecommendation[];
  spellingCorrections: SpellingCorrectionCluster[];
  windowDays: number;
  generatedAt: string;
}

interface SearchDoc {
  query: string;
  originalQuery?: string;
  resultsCount?: number;
  category?: string;
  intent?: string;
  timestamp?: Timestamp | Date;
}

interface ZeroResultDoc {
  query: string;
  timestamp?: Timestamp | Date;
}

// Lightweight Levenshtein for short strings
function distance(a: string, b: string): number {
  if (a === b) return 0;
  // Guard against extremely long inputs to prevent excessive memory usage
  const maxLen = 64;
  const av = a.toLowerCase().slice(0, maxLen);
  const bv = b.toLowerCase().slice(0, maxLen);
  const dp: number[][] = Array(av.length + 1)
    .fill(0)
    .map(() => Array(bv.length + 1).fill(0));
  for (let i = 0; i <= av.length; i++) dp[i][0] = i;
  for (let j = 0; j <= bv.length; j++) dp[0][j] = j;
  for (let i = 1; i <= av.length; i++) {
    for (let j = 1; j <= bv.length; j++) {
      const cost = av[i - 1] === bv[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[av.length][bv.length];
}

function norm(q: string | undefined): string {
  const maxLen = 128;
  return (q || "").trim().toLowerCase().slice(0, maxLen);
}

export async function generateRecommendations(
  db: Firestore,
  opts: {
    days?: number;
    maxItems?: number;
    inventoryItems?: Array<{ name: string; stockLevel?: number }>;
    conversionsMap?: Record<
      string,
      { addToCart: number; checkout: number; revenue: number }
    >;
  } = {}
): Promise<RecommendationsPayload> {
  const days = opts.days ?? 30;
  const maxDocs = 20000; // cap number of docs processed from Firestore snapshots
  const maxKeys = 5000; // cap number of unique query keys considered
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - days);

  // Fetch search queries window
  const searchSnap = await db
    .collection("searchQueries")
    .where("timestamp", ">=", Timestamp.fromDate(windowStart))
    .limit(maxDocs)
    .get();

  const zeroSnap = await db
    .collection("zeroResultSearches")
    .where("timestamp", ">=", Timestamp.fromDate(windowStart))
    .limit(maxDocs)
    .get();

  const searches: SearchDoc[] = searchSnap.docs
    .slice(0, maxDocs)
    .map((d) => d.data() as SearchDoc);
  const zeroes: ZeroResultDoc[] = zeroSnap.docs
    .slice(0, maxDocs)
    .map((d) => d.data() as ZeroResultDoc);

  const searchCounts: Record<string, number> = {};
  const zeroCounts: Record<string, number> = {};
  const totalResults: Record<string, number> = {};
  const categories: Record<
    string,
    { count: number; totalResults: number; zeroes: number }
  > = {};
  const originalVariants: Record<string, Record<string, number>> = {};
  const maxCategoryKeys = 1000;

  for (const s of searches) {
    const q = norm(s.query);
    if (!q) continue;
    if (Object.keys(searchCounts).length >= maxKeys && !searchCounts[q]) {
      continue; // stop adding new keys once cap reached
    }
    searchCounts[q] = (searchCounts[q] ?? 0) + 1;
    totalResults[q] = (totalResults[q] ?? 0) + (s.resultsCount ?? 0);
    const cat = norm(s.category);
    if (cat) {
      if (!categories[cat])
        if (Object.keys(categories).length >= maxCategoryKeys) {
          // Stop introducing new category keys beyond cap
        } else {
          categories[cat] = { count: 0, totalResults: 0, zeroes: 0 };
        }
      categories[cat].count += 1;
      categories[cat].totalResults += s.resultsCount ?? 0;
      if ((s.resultsCount ?? 0) === 0) categories[cat].zeroes += 1;
    }
    if (s.originalQuery && s.originalQuery !== s.query) {
      const base = norm(s.query);
      const variant = norm(s.originalQuery);
      if (!originalVariants[base]) originalVariants[base] = {};
      // Cap per-canonical variant tracking to avoid unbounded growth
      const current = originalVariants[base];
      if (Object.keys(current).length < 500) {
        current[variant] = (current[variant] ?? 0) + 1;
      }
    }
  }

  for (const z of zeroes) {
    const q = norm(z.query);
    if (!q) continue;
    if (Object.keys(zeroCounts).length >= maxKeys && !zeroCounts[q]) {
      continue;
    }
    zeroCounts[q] = (zeroCounts[q] ?? 0) + 1;
  }

  // Prepare inventory lookup helpers
  const inventoryItems = opts.inventoryItems || [];
  const inventoryNormalized = inventoryItems.map((it) => ({
    raw: it.name,
    name: norm(it.name),
    stockLevel: it.stockLevel ?? undefined,
  }));
  function findInventoryMatch(query: string) {
    // Direct / substring match
    const q = norm(query);
    let best: { raw: string; stockLevel?: number } | undefined;
    for (const item of inventoryNormalized) {
      if (item.name.includes(q)) {
        best = { raw: item.raw, stockLevel: item.stockLevel };
        break;
      }
    }
    return best;
  }

  const conversionsMap = opts.conversionsMap || {};

  // Missing products (top queries with high zero-result or very low avg results) with inventory & conversion weighting
  const missingProducts: MissingProductRecommendation[] = Object.keys(
    searchCounts
  )
    .map((q) => {
      const searchesN = searchCounts[q];
      const zeroN = zeroCounts[q] ?? 0;
      const avg = totalResults[q] ? totalResults[q] / searchesN : 0;
      const zeroRate = zeroN / searchesN;
      const inv = findInventoryMatch(q);
      const conv = conversionsMap[q] || {
        addToCart: 0,
        checkout: 0,
        revenue: 0,
      };
      const baseScore = zeroN * 5 + searchesN + (avg < 1 ? 10 : 0);
      const inventoryScore = !inv
        ? 25
        : inv.stockLevel !== undefined && inv.stockLevel <= 5
        ? 15
        : 0;
      const conversionScore = conv.checkout * 5 + conv.addToCart * 2;
      const impactScore = baseScore + inventoryScore + conversionScore;
      return {
        q,
        searchesN,
        zeroN,
        avg,
        zeroRate,
        inv,
        conv,
        impactScore,
      };
    })
    .filter((x) => x.searchesN >= 5 && (x.zeroN >= 3 || x.avg < 1))
    .sort((a, b) => {
      return b.impactScore - a.impactScore;
    })
    .slice(0, 5)
    .map((x) => ({
      query: x.q,
      searches: x.searchesN,
      zeroResults: x.zeroN,
      avgResults: parseFloat(x.avg.toFixed(2)),
      reason: `${x.searchesN} searches; ${
        x.zeroN
      } zero-results; avgResults=${x.avg.toFixed(2)}; ${
        x.inv
          ? `inventory='${x.inv.raw}' stock=${x.inv.stockLevel ?? "n/a"}`
          : "not-in-inventory"
      }; conversions a2c=${x.conv.addToCart} chk=${x.conv.checkout}`,
      stockLevel: x.inv?.stockLevel,
      inventoryMatch: x.inv?.raw,
      addToCartConversions: x.conv.addToCart,
      checkoutConversions: x.conv.checkout,
      revenue: parseFloat(x.conv.revenue.toFixed(2)),
      impactScore: parseFloat(x.impactScore.toFixed(2)),
    }));

  // Underperforming categories
  const underperformingCategories: UnderperformingCategoryRecommendation[] =
    Object.keys(categories)
      .map((cat) => {
        const data = categories[cat];
        const avg = data.totalResults / data.count;
        const zeroRate = data.zeroes / data.count;
        return { cat, avg, zeroRate, count: data.count };
      })
      .filter((x) => x.count >= 10 && (x.avg < 2 || x.zeroRate > 0.3))
      .sort((a, b) => {
        const scoreA = a.count + (a.avg < 2 ? 10 : 0) + a.zeroRate * 50;
        const scoreB = b.count + (b.avg < 2 ? 10 : 0) + b.zeroRate * 50;
        return scoreB - scoreA;
      })
      .slice(0, 10)
      .map((x) => ({
        category: x.cat,
        searches: x.count,
        avgResults: parseFloat(x.avg.toFixed(2)),
        zeroResultRate: parseFloat(x.zeroRate.toFixed(2)),
        reason: `${x.count} searches; avgResults=${x.avg.toFixed(
          2
        )}; zeroRate=${(x.zeroRate * 100).toFixed(0)}%`,
      }));

  // Quick wins (moderate searches, some results but low avg OR zero-results cluster) with inventory & conversion weighting
  const quickWins: QuickWinRecommendation[] = Object.keys(searchCounts)
    .map((q) => {
      const searchesN = searchCounts[q];
      const zeroN = zeroCounts[q] ?? 0;
      const avg = totalResults[q] ? totalResults[q] / searchesN : 0;
      const inv = findInventoryMatch(q);
      const conv = conversionsMap[q] || {
        addToCart: 0,
        checkout: 0,
        revenue: 0,
      };
      const baseScore = (zeroN > 0 ? 20 : 0) + (avg < 2 ? 10 : 0) + searchesN;
      const inventoryScore = !inv
        ? 10
        : inv.stockLevel !== undefined && inv.stockLevel <= 5
        ? 8
        : 0;
      const conversionScore = conv.checkout * 4 + conv.addToCart * 1.5;
      const impactScore = baseScore + inventoryScore + conversionScore;
      return { q, searchesN, zeroN, avg, inv, conv, impactScore };
    })
    .filter(
      (x) => x.searchesN >= 3 && x.searchesN <= 12 && (x.avg < 2 || x.zeroN > 0)
    )
    .sort((a, b) => {
      return b.impactScore - a.impactScore;
    })
    .slice(0, 10)
    .map((x) => ({
      item: x.q,
      type: "query",
      searches: x.searchesN,
      potentialImpact:
        x.zeroN > 0 ? "Add matching product" : "Improve index / metadata",
      reason: `${x.searchesN} searches; avgResults=${x.avg.toFixed(
        2
      )}; zeroResults=${x.zeroN}; ${
        x.inv
          ? `inventory='${x.inv.raw}' stock=${x.inv.stockLevel ?? "n/a"}`
          : "not-in-inventory"
      }; conversions a2c=${x.conv.addToCart} chk=${x.conv.checkout}`,
      stockLevel: x.inv?.stockLevel,
      inventoryMatch: x.inv?.raw,
      addToCartConversions: x.conv.addToCart,
      checkoutConversions: x.conv.checkout,
      revenue: parseFloat(x.conv.revenue.toFixed(2)),
      impactScore: parseFloat(x.impactScore.toFixed(2)),
    }));

  // Spelling corrections clustering with global caps and safe fallback
  let spellingCorrections: SpellingCorrectionCluster[] = [];
  try {
    const canonicalKeys = Object.keys(originalVariants).slice(0, 2000);
    spellingCorrections = canonicalKeys
      .map((canonical) => {
        const variantsMap = originalVariants[canonical];
        const variantsEntries = Object.entries(variantsMap).slice(0, 200);
        const variantsArr = variantsEntries
          .map(([variant, count]) => ({
            variant: variant.slice(0, 64),
            count,
            distance: distance(
              canonical.slice(0, 64),
              norm(variant).slice(0, 64)
            ),
          }))
          .filter((v) => v.distance > 0 && v.distance <= 2 && v.count >= 2)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        return {
          canonical,
          variants: variantsArr,
          totalVariants: variantsArr.length,
          suggestion: variantsArr.length
            ? `Normalize to '${canonical}' and add synonym mapping`
            : "",
        };
      })
      .filter((c) => c.variants.length >= 1)
      .sort((a, b) => b.totalVariants - a.totalVariants)
      .slice(0, 10);
  } catch {
    spellingCorrections = [];
  }

  return {
    missingProducts,
    underperformingCategories,
    quickWins,
    spellingCorrections,
    windowDays: days,
    generatedAt: new Date().toISOString(),
  };
}
