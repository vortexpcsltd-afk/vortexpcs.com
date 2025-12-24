/**
 * Search Session Flow Analyzer
 * Analyzes user search journeys to identify patterns, conversions, and abandonment
 */

export interface SearchEvent {
  id: string;
  query: string;
  originalQuery: string;
  category: string;
  resultsCount: number;
  sessionId: string;
  timestamp: Date;
  userId?: string;
  intent?: string;
  intentConfidence?: string;
  addedToCart?: boolean;
  checkoutCompleted?: boolean;
}

export interface SearchSession {
  sessionId: string;
  searches: SearchEvent[];
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  totalSearches: number;
  uniqueQueries: number;
  converted: boolean;
  addedToCart: boolean;
  pattern: string; // e.g., "GPU → RTX 4090 → NVIDIA"
  userId?: string;
}

export interface SessionFlowAnalysis {
  totalSessions: number;
  avgSearchesPerSession: number;
  conversionRate: number; // % sessions that led to checkout
  addToCartRate: number; // % sessions that added items
  abandonmentRate: number; // % sessions with no action
  avgSessionDuration: number; // minutes
  commonPatterns: { pattern: string; count: number; conversionRate: number }[];
  topConversionPaths: { path: string; conversions: number }[];
}

/**
 * Group search events into sessions
 */
export function groupSearchesBySessions(
  searches: SearchEvent[]
): SearchSession[] {
  const sessionMap = new Map<string, SearchEvent[]>();

  // Group by session ID
  searches.forEach((search) => {
    if (!sessionMap.has(search.sessionId)) {
      sessionMap.set(search.sessionId, []);
    }
    sessionMap.get(search.sessionId)!.push(search);
  });

  // Convert to session objects
  const sessions: SearchSession[] = [];

  sessionMap.forEach((events, sessionId) => {
    // Sort by timestamp
    events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const startTime = new Date(events[0].timestamp);
    const endTime = new Date(events[events.length - 1].timestamp);
    const duration = endTime.getTime() - startTime.getTime();

    // Check if session led to conversion
    const converted = events.some((e) => e.checkoutCompleted);
    const addedToCart = events.some((e) => e.addedToCart);

    // Create search pattern string
    const pattern = events
      .map((e) => e.originalQuery)
      .slice(0, 5) // Show first 5 searches
      .join(" → ");

    // Count unique queries
    const uniqueQueries = new Set(events.map((e) => e.query.toLowerCase()))
      .size;

    sessions.push({
      sessionId,
      searches: events,
      startTime,
      endTime,
      duration,
      totalSearches: events.length,
      uniqueQueries,
      converted,
      addedToCart,
      pattern,
      userId: events[0].userId,
    });
  });

  return sessions;
}

/**
 * Analyze session flow data
 */
export function analyzeSessionFlow(
  sessions: SearchSession[]
): SessionFlowAnalysis {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      avgSearchesPerSession: 0,
      conversionRate: 0,
      addToCartRate: 0,
      abandonmentRate: 100,
      avgSessionDuration: 0,
      commonPatterns: [],
      topConversionPaths: [],
    };
  }

  const totalSessions = sessions.length;
  const totalSearches = sessions.reduce((sum, s) => sum + s.totalSearches, 0);
  const convertedSessions = sessions.filter((s) => s.converted).length;
  const cartSessions = sessions.filter((s) => s.addedToCart).length;
  const abandonedSessions = sessions.filter(
    (s) => !s.converted && !s.addedToCart
  ).length;

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

  // Find common patterns
  const patternMap = new Map<string, { count: number; conversions: number }>();

  sessions.forEach((session) => {
    const pattern = session.pattern;
    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, { count: 0, conversions: 0 });
    }
    const data = patternMap.get(pattern)!;
    data.count++;
    if (session.converted) {
      data.conversions++;
    }
  });

  // Sort patterns by frequency
  const commonPatterns = Array.from(patternMap.entries())
    .map(([pattern, data]) => ({
      pattern,
      count: data.count,
      conversionRate: (data.conversions / data.count) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Find top conversion paths
  const conversionPaths = sessions
    .filter((s) => s.converted)
    .map((s) => s.pattern);

  const pathMap = new Map<string, number>();
  conversionPaths.forEach((path) => {
    pathMap.set(path, (pathMap.get(path) || 0) + 1);
  });

  const topConversionPaths = Array.from(pathMap.entries())
    .map(([path, conversions]) => ({ path, conversions }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 10);

  return {
    totalSessions,
    avgSearchesPerSession: totalSearches / totalSessions,
    conversionRate: (convertedSessions / totalSessions) * 100,
    addToCartRate: (cartSessions / totalSessions) * 100,
    abandonmentRate: (abandonedSessions / totalSessions) * 100,
    avgSessionDuration: totalDuration / totalSessions / 60000, // Convert to minutes
    commonPatterns,
    topConversionPaths,
  };
}

/**
 * Detect search narrowing patterns (user refining search)
 * Returns true if searches show progressive narrowing
 */
export function detectNarrowingPattern(searches: SearchEvent[]): boolean {
  if (searches.length < 2) return false;

  // Check if queries get more specific over time
  let specificity = 0;

  for (let i = 1; i < searches.length; i++) {
    const prev = searches[i - 1].query.toLowerCase();
    const curr = searches[i].query.toLowerCase();

    // More specific if:
    // 1. Current contains previous (GPU → RTX 4090)
    // 2. Current is longer
    // 3. Results count decreases
    if (curr.includes(prev) || curr.length > prev.length) {
      specificity++;
    }
    if (searches[i].resultsCount < searches[i - 1].resultsCount) {
      specificity++;
    }
  }

  return specificity >= searches.length; // At least 1 narrowing indicator per search
}

/**
 * Detect search broadening patterns (user expanding search)
 */
export function detectBroadeningPattern(searches: SearchEvent[]): boolean {
  if (searches.length < 2) return false;

  let broadening = 0;

  for (let i = 1; i < searches.length; i++) {
    const prev = searches[i - 1].query.toLowerCase();
    const curr = searches[i].query.toLowerCase();

    // More broad if:
    // 1. Current is shorter
    // 2. Results count increases significantly
    if (curr.length < prev.length) {
      broadening++;
    }
    if (searches[i].resultsCount > searches[i - 1].resultsCount * 1.5) {
      broadening++;
    }
  }

  return broadening >= searches.length;
}

/**
 * Classify session behavior
 */
export function classifySessionBehavior(session: SearchSession): string {
  if (session.converted) return "Converted";
  if (session.addedToCart) return "Added to Cart";

  const narrowing = detectNarrowingPattern(session.searches);
  const broadening = detectBroadeningPattern(session.searches);

  if (narrowing) return "Narrowing Search";
  if (broadening) return "Broadening Search";
  if (session.totalSearches === 1) return "Single Search";
  if (session.uniqueQueries === session.totalSearches)
    return "Exploring Options";

  return "Repeated Searches";
}

/**
 * Get session flow data for visualization (Sankey-style)
 */
export function getSessionFlowData(sessions: SearchSession[]): {
  nodes: { id: string; name: string }[];
  links: { source: string; target: string; value: number }[];
} {
  const linkMap = new Map<string, number>();

  sessions.forEach((session) => {
    const searches = session.searches;

    // Create links between consecutive searches
    for (let i = 0; i < searches.length - 1; i++) {
      const source = searches[i].originalQuery;
      const target = searches[i + 1].originalQuery;
      const key = `${source}|||${target}`;
      linkMap.set(key, (linkMap.get(key) || 0) + 1);
    }

    // Link last search to outcome
    const lastSearch = searches[searches.length - 1].originalQuery;
    const outcome = session.converted
      ? "Checkout"
      : session.addedToCart
      ? "Cart"
      : "Exit";
    const finalKey = `${lastSearch}|||${outcome}`;
    linkMap.set(finalKey, (linkMap.get(finalKey) || 0) + 1);
  });

  // Get all unique node names
  const nodeSet = new Set<string>();
  linkMap.forEach((_, key) => {
    const [source, target] = key.split("|||");
    nodeSet.add(source);
    nodeSet.add(target);
  });

  const nodes = Array.from(nodeSet).map((name) => ({
    id: name,
    name,
  }));

  const links = Array.from(linkMap.entries())
    .map(([key, value]) => {
      const [source, target] = key.split("|||");
      return { source, target, value };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 50); // Limit to top 50 links for readability

  return { nodes, links };
}
