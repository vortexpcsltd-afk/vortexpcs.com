/**
 * Conversion Funnel Analyzer
 * Calculates conversion rates, revenue attribution, and time-to-conversion metrics
 */

export interface ConversionEvent {
  id: string;
  searchQuery: string;
  originalQuery: string;
  sessionId: string;
  userId?: string;
  conversionType: "add_to_cart" | "checkout";
  timestamp: Date;
  productId?: string;
  productName?: string;
  price?: number;
  orderId?: string;
  orderTotal?: number;
  products?: Array<{ id: string; name: string; price: number }>;
}

export interface SearchWithConversion {
  id: string;
  query: string;
  originalQuery: string;
  timestamp: Date;
  addedToCart?: boolean;
  checkoutCompleted?: boolean;
  orderTotal?: number;
  convertedAt?: Date;
}

export interface FunnelMetrics {
  totalSearches: number;
  searchesWithResults: number;
  addedToCart: number;
  completedCheckout: number;
  // Conversion rates
  searchToView: number; // %
  viewToCart: number; // %
  cartToCheckout: number; // %
  searchToCheckout: number; // %
  // Revenue metrics
  totalRevenue: number;
  avgRevenuePerSearch: number;
  avgRevenuePerConversion: number;
  // Time metrics
  avgTimeToCart: number; // minutes
  avgTimeToCheckout: number; // minutes
}

export interface SearchTermRevenue {
  query: string;
  searchCount: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  avgRevenue: number;
  revenuePerSearch: number;
}

/**
 * Calculate overall conversion funnel metrics
 */
export function calculateFunnelMetrics(
  searches: SearchWithConversion[],
  conversions: ConversionEvent[]
): FunnelMetrics {
  const totalSearches = searches.length;
  const searchesWithResults = searches.filter((s) => s.query !== "").length;

  // Count conversions
  const addedToCart = searches.filter((s) => s.addedToCart).length;
  const completedCheckout = searches.filter((s) => s.checkoutCompleted).length;

  // Calculate conversion rates
  const searchToView =
    searchesWithResults > 0 ? (searchesWithResults / totalSearches) * 100 : 0;
  const viewToCart =
    searchesWithResults > 0 ? (addedToCart / searchesWithResults) * 100 : 0;
  const cartToCheckout =
    addedToCart > 0 ? (completedCheckout / addedToCart) * 100 : 0;
  const searchToCheckout =
    totalSearches > 0 ? (completedCheckout / totalSearches) * 100 : 0;

  // Calculate revenue
  const checkoutConversions = conversions.filter(
    (c) => c.conversionType === "checkout"
  );
  const totalRevenue = checkoutConversions.reduce(
    (sum, c) => sum + (c.orderTotal || 0),
    0
  );
  const avgRevenuePerSearch =
    totalSearches > 0 ? totalRevenue / totalSearches : 0;
  const avgRevenuePerConversion =
    completedCheckout > 0 ? totalRevenue / completedCheckout : 0;

  // Calculate time-to-conversion
  const cartConversions = searches.filter(
    (s) => s.addedToCart && s.convertedAt
  );
  const avgTimeToCart =
    cartConversions.length > 0
      ? cartConversions.reduce((sum, s) => {
          const diff = s.convertedAt!.getTime() - s.timestamp.getTime();
          return sum + diff / 60000; // Convert to minutes
        }, 0) / cartConversions.length
      : 0;

  const checkoutSearches = searches.filter(
    (s) => s.checkoutCompleted && s.convertedAt
  );
  const avgTimeToCheckout =
    checkoutSearches.length > 0
      ? checkoutSearches.reduce((sum, s) => {
          const diff = s.convertedAt!.getTime() - s.timestamp.getTime();
          return sum + diff / 60000; // Convert to minutes
        }, 0) / checkoutSearches.length
      : 0;

  return {
    totalSearches,
    searchesWithResults,
    addedToCart,
    completedCheckout,
    searchToView,
    viewToCart,
    cartToCheckout,
    searchToCheckout,
    totalRevenue,
    avgRevenuePerSearch,
    avgRevenuePerConversion,
    avgTimeToCart,
    avgTimeToCheckout,
  };
}

/**
 * Calculate revenue attribution per search term
 */
export function calculateSearchTermRevenue(
  searches: SearchWithConversion[],
  _conversions: ConversionEvent[]
): SearchTermRevenue[] {
  const termMap = new Map<
    string,
    {
      searchCount: number;
      conversions: number;
      revenue: number;
    }
  >();

  // Count searches per term
  searches.forEach((search) => {
    const key = search.query.toLowerCase();
    if (!termMap.has(key)) {
      termMap.set(key, { searchCount: 0, conversions: 0, revenue: 0 });
    }
    const data = termMap.get(key)!;
    data.searchCount++;

    // Add revenue if checkout completed
    if (search.checkoutCompleted && search.orderTotal) {
      data.conversions++;
      data.revenue += search.orderTotal;
    }
  });

  // Convert to array and calculate metrics
  const results: SearchTermRevenue[] = Array.from(termMap.entries())
    .map(([query, data]) => ({
      query,
      searchCount: data.searchCount,
      conversions: data.conversions,
      conversionRate: (data.conversions / data.searchCount) * 100,
      totalRevenue: data.revenue,
      avgRevenue: data.conversions > 0 ? data.revenue / data.conversions : 0,
      revenuePerSearch: data.revenue / data.searchCount,
    }))
    .filter((r) => r.totalRevenue > 0) // Only show terms with revenue
    .sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by total revenue

  return results;
}

/**
 * Get funnel data for visualization
 */
export function getFunnelChartData(metrics: FunnelMetrics): Array<{
  stage: string;
  count: number;
  percentage: number;
  dropoff: number;
}> {
  const stages = [
    {
      stage: "Searches",
      count: metrics.totalSearches,
      percentage: 100,
      dropoff: 0,
    },
    {
      stage: "Views",
      count: metrics.searchesWithResults,
      percentage: metrics.searchToView,
      dropoff: metrics.totalSearches - metrics.searchesWithResults,
    },
    {
      stage: "Add to Cart",
      count: metrics.addedToCart,
      percentage: (metrics.addedToCart / metrics.totalSearches) * 100,
      dropoff: metrics.searchesWithResults - metrics.addedToCart,
    },
    {
      stage: "Checkout",
      count: metrics.completedCheckout,
      percentage: metrics.searchToCheckout,
      dropoff: metrics.addedToCart - metrics.completedCheckout,
    },
  ];

  return stages;
}

/**
 * Calculate conversion rate by time period
 */
export function getConversionTrend(
  searches: SearchWithConversion[],
  periodDays: number = 7
): Array<{ date: string; searchCount: number; conversionRate: number }> {
  const now = new Date();
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  const dateMap = new Map<string, { searches: number; conversions: number }>();

  searches.forEach((search) => {
    if (search.timestamp >= startDate) {
      const dateKey = search.timestamp.toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { searches: 0, conversions: 0 });
      }
      const data = dateMap.get(dateKey)!;
      data.searches++;
      if (search.checkoutCompleted) {
        data.conversions++;
      }
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      searchCount: data.searches,
      conversionRate: (data.conversions / data.searches) * 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get top converting products from searches
 */
export function getTopConvertingProducts(
  conversions: ConversionEvent[]
): Array<{
  productId: string;
  productName: string;
  conversionCount: number;
  totalRevenue: number;
}> {
  const productMap = new Map<
    string,
    {
      name: string;
      count: number;
      revenue: number;
    }
  >();

  conversions.forEach((conversion) => {
    if (conversion.conversionType === "checkout" && conversion.products) {
      conversion.products.forEach((product) => {
        if (!productMap.has(product.id)) {
          productMap.set(product.id, {
            name: product.name,
            count: 0,
            revenue: 0,
          });
        }
        const data = productMap.get(product.id)!;
        data.count++;
        data.revenue += product.price;
      });
    }
  });

  return Array.from(productMap.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      conversionCount: data.count,
      totalRevenue: data.revenue,
    }))
    .sort((a, b) => b.conversionCount - a.conversionCount)
    .slice(0, 10); // Top 10
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

/**
 * Format time duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    return "<1 min";
  } else if (minutes < 60) {
    return `${Math.round(minutes)} min${Math.round(minutes) !== 1 ? "s" : ""}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }
}
