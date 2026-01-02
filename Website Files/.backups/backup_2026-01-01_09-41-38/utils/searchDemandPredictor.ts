import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  Firestore,
} from "firebase/firestore";

export interface PredictiveAlert {
  query: string;
  periodSearches: number;
  wowGrowthPct: number;
  zeroResultCount: number;
  inventoryLevel?: number;
  reason: string;
}

export interface PredictorOptions {
  days?: number; // window size, default 7
  minSearches?: number; // threshold, default 10
  minWoWGrowthPct?: number; // default 50
  inventoryLookup?: (query: string) => Promise<number | undefined>;
}

export async function generatePredictiveStockAlerts(
  db: Firestore,
  options: PredictorOptions = {}
): Promise<PredictiveAlert[]> {
  const days = options.days ?? 7;
  const minSearches = options.minSearches ?? 10;
  const minWoWGrowthPct = options.minWoWGrowthPct ?? 50;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  const prevEnd = new Date(start);

  // Fetch searches in current window
  const searchesRef = collection(db, "searchQueries");
  const recentQ = query(
    searchesRef,
    where("timestamp", ">=", Timestamp.fromDate(start))
  );
  const recentSnap = await getDocs(recentQ);

  // Fetch searches in previous window for WoW
  const prevQ = query(
    searchesRef,
    where("timestamp", ">=", Timestamp.fromDate(prevStart)),
    where("timestamp", "<", Timestamp.fromDate(prevEnd))
  );
  const prevSnap = await getDocs(prevQ);

  // Aggregate counts by normalized query
  const norm = (s: string) => (s || "").trim().toLowerCase();
  const recentCounts: Record<string, number> = {};
  const prevCounts: Record<string, number> = {};

  recentSnap.forEach((doc) => {
    const q = norm((doc.data()?.query as string) ?? "");
    if (!q) return;
    recentCounts[q] = (recentCounts[q] ?? 0) + 1;
  });

  prevSnap.forEach((doc) => {
    const q = norm((doc.data()?.query as string) ?? "");
    if (!q) return;
    prevCounts[q] = (prevCounts[q] ?? 0) + 1;
  });

  // Fetch zero-result counts in window
  const zeroRef = collection(db, "zeroResultSearches");
  const zeroQ = query(
    zeroRef,
    where("timestamp", ">=", Timestamp.fromDate(start))
  );
  const zeroSnap = await getDocs(zeroQ);
  const zeroCounts: Record<string, number> = {};
  zeroSnap.forEach((doc) => {
    const q = norm((doc.data()?.query as string) ?? "");
    if (!q) return;
    zeroCounts[q] = (zeroCounts[q] ?? 0) + 1;
  });

  const alerts: PredictiveAlert[] = [];

  for (const [q, count] of Object.entries(recentCounts)) {
    if (count < minSearches) continue;
    const prev = prevCounts[q] ?? 0;
    const wowGrowthPct = prev > 0 ? ((count - prev) / prev) * 100 : 100;
    if (wowGrowthPct < minWoWGrowthPct) continue;

    const zeroResultCount = zeroCounts[q] ?? 0;
    let inventoryLevel: number | undefined;
    if (options.inventoryLookup) {
      try {
        inventoryLevel = await options.inventoryLookup(q);
      } catch {
        inventoryLevel = undefined;
      }
    }

    const reasonParts: string[] = [];
    reasonParts.push(`${count} searches in ${days}d`);
    reasonParts.push(`${Math.round(wowGrowthPct)}% WoW growth`);
    if (zeroResultCount > 0)
      reasonParts.push(`${zeroResultCount} zero-result events`);
    if (inventoryLevel !== undefined)
      reasonParts.push(`inventory=${inventoryLevel}`);

    alerts.push({
      query: q,
      periodSearches: count,
      wowGrowthPct,
      zeroResultCount,
      inventoryLevel,
      reason: reasonParts.join("; "),
    });
  }

  // Sort by strongest signals
  alerts.sort((a, b) => {
    const aScore = a.periodSearches + a.wowGrowthPct + a.zeroResultCount * 5;
    const bScore = b.periodSearches + b.wowGrowthPct + b.zeroResultCount * 5;
    return bScore - aScore;
  });

  return alerts.slice(0, 20);
}
