export interface RefinementPathNode {
  query: string;
  filters: Record<string, unknown>;
  resultsCount?: number;
  timestamp: number;
}

export interface RefinementSessionAnalysis {
  sessionId: string;
  totalRefinements: number;
  stuckIndicators: {
    excessiveRefinements: boolean; // > 5 refinements
    loopsDetected: boolean; // query repeats with minor changes
    repeatedZeroResults: boolean; // >= 2 consecutive zero results
  };
  mostCommonTransition?: string; // e.g., "graphics card -> rtx 3060"
  path: RefinementPathNode[];
}

// Analyze refinement sequences to identify stuck behavior
export function analyzeRefinementSessions(
  refinements: Array<{
    sessionId: string;
    previousQuery: string;
    newQuery: string;
    addedFilters: Record<string, unknown>;
    removedFilters: Record<string, unknown>;
    previousResultsCount?: number;
    newResultsCount?: number;
    timestamp: number;
  }>
): RefinementSessionAnalysis[] {
  const bySession: Record<string, RefinementSessionAnalysis> = {};

  const transitionsCounter: Record<string, number> = {};

  for (const ev of refinements) {
    const s = (bySession[ev.sessionId] ||= {
      sessionId: ev.sessionId,
      totalRefinements: 0,
      stuckIndicators: {
        excessiveRefinements: false,
        loopsDetected: false,
        repeatedZeroResults: false,
      },
      path: [],
    });

    s.totalRefinements += 1;

    s.path.push({
      query: ev.previousQuery,
      filters: ev.removedFilters,
      resultsCount: ev.previousResultsCount,
      timestamp: ev.timestamp - 1,
    });
    s.path.push({
      query: ev.newQuery,
      filters: ev.addedFilters,
      resultsCount: ev.newResultsCount,
      timestamp: ev.timestamp,
    });

    const key = `${ev.previousQuery} -> ${ev.newQuery}`.toLowerCase();
    transitionsCounter[key] = (transitionsCounter[key] || 0) + 1;
  }

  // Compute stuck indicators
  for (const s of Object.values(bySession)) {
    if (s.totalRefinements > 5) s.stuckIndicators.excessiveRefinements = true;

    // Loop detection: same query appears non-consecutively >=2 times
    const queryOccurrences: Record<string, number> = {};
    for (const n of s.path) {
      const q = n.query.toLowerCase();
      queryOccurrences[q] = (queryOccurrences[q] || 0) + 1;
    }
    s.stuckIndicators.loopsDetected = Object.values(queryOccurrences).some(
      (c) => c >= 3
    );

    // Repeated zero results
    let consecutiveZero = 0;
    for (const n of s.path) {
      if ((n.resultsCount || 0) === 0) consecutiveZero++;
      else consecutiveZero = 0;
      if (consecutiveZero >= 2) {
        s.stuckIndicators.repeatedZeroResults = true;
        break;
      }
    }

    // Most common transition (global)
    let maxKey: string | undefined;
    let maxVal = 0;
    for (const [k, v] of Object.entries(transitionsCounter)) {
      if (v > maxVal) {
        maxVal = v;
        maxKey = k;
      }
    }
    s.mostCommonTransition = maxKey;
  }

  return Object.values(bySession);
}
