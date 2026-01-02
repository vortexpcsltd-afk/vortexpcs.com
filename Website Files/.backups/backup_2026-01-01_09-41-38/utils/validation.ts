// Basic sanitizers for payment-related inputs
export function sanitizeEmail(email: unknown): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function sanitizeName(name: unknown): string {
  if (!name || typeof name !== "string") return "";
  return name.trim().slice(0, 120);
}

export function clampAmount(amount: unknown): number {
  const num = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(num)) return 0;
  // Guard against negative or unreasonably large values
  return Math.min(Math.max(num, 0), 1000000);
}

/**
 * Analytics Data Validators
 * Ensure backend data conforms to expected shapes before rendering
 */

export interface ValidatedMonthlyRecord {
  month: string;
  year: number;
  visitors: number;
  pageViews: number;
  sessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  newUsers: number;
  revenue: number;
  orders: number;
}

export interface ValidatedMonthlyData {
  monthlyData: ValidatedMonthlyRecord[];
  summary?: {
    totalVisitors?: number;
    avgVisitorsPerMonth?: number;
    totalPageViews?: number;
    totalSessions?: number;
    totalRevenue?: number;
    avgRevenuePerMonth?: number;
    totalOrders?: number;
  };
  trends?: {
    visitors?: string;
    pageViews?: string;
    sessions?: string;
    revenue?: string;
    orders?: string;
  };
}

/**
 * Validate and sanitize a single monthly record
 * Returns validated data with defaults for missing/invalid fields
 */
export function validateMonthlyRecord(data: unknown): ValidatedMonthlyRecord {
  if (!data || typeof data !== "object") {
    return {
      month: "Unknown",
      year: new Date().getFullYear(),
      visitors: 0,
      pageViews: 0,
      sessions: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      newUsers: 0,
      revenue: 0,
      orders: 0,
    };
  }

  const record = data as Record<string, unknown>;

  // Helper to safely get number, default to 0
  const safeNumber = (val: unknown, min = 0, max = Infinity): number => {
    const num = typeof val === "number" ? val : Number(val) || 0;
    return Number.isFinite(num) ? Math.min(Math.max(num, min), max) : 0;
  };

  // Helper to safely get string
  const safeString = (val: unknown, fallback = ""): string => {
    return typeof val === "string" ? val.trim().slice(0, 50) : fallback;
  };

  return {
    month: safeString(record.month, "Unknown"),
    year: safeNumber(record.year, 2020, 2100) || new Date().getFullYear(),
    visitors: safeNumber(record.visitors),
    pageViews: safeNumber(record.pageViews),
    sessions: safeNumber(record.sessions),
    avgSessionDuration: safeNumber(record.avgSessionDuration),
    bounceRate: safeNumber(record.bounceRate, 0, 100),
    newUsers: safeNumber(record.newUsers),
    revenue: safeNumber(record.revenue),
    orders: safeNumber(record.orders),
  };
}

/**
 * Validate and sanitize entire monthly data structure
 */
export function validateMonthlyData(data: unknown): ValidatedMonthlyData {
  if (!data || typeof data !== "object") {
    return { monthlyData: [] };
  }

  const obj = data as Record<string, unknown>;
  const monthlyArray = Array.isArray(obj.monthlyData) ? obj.monthlyData : [];

  // Validate each month record
  const validatedMonthly = monthlyArray.map((item) =>
    validateMonthlyRecord(item)
  );

  // Validate summary if present
  const summary =
    obj.summary && typeof obj.summary === "object"
      ? {
          totalVisitors: safeNumber(
            (obj.summary as Record<string, unknown>).totalVisitors
          ),
          avgVisitorsPerMonth: safeNumber(
            (obj.summary as Record<string, unknown>).avgVisitorsPerMonth
          ),
          totalPageViews: safeNumber(
            (obj.summary as Record<string, unknown>).totalPageViews
          ),
          totalSessions: safeNumber(
            (obj.summary as Record<string, unknown>).totalSessions
          ),
          totalRevenue: safeNumber(
            (obj.summary as Record<string, unknown>).totalRevenue
          ),
          avgRevenuePerMonth: safeNumber(
            (obj.summary as Record<string, unknown>).avgRevenuePerMonth
          ),
          totalOrders: safeNumber(
            (obj.summary as Record<string, unknown>).totalOrders
          ),
        }
      : undefined;

  // Validate trends if present
  const trends =
    obj.trends && typeof obj.trends === "object"
      ? {
          visitors: validateTrendString(
            (obj.trends as Record<string, unknown>).visitors
          ),
          pageViews: validateTrendString(
            (obj.trends as Record<string, unknown>).pageViews
          ),
          sessions: validateTrendString(
            (obj.trends as Record<string, unknown>).sessions
          ),
          revenue: validateTrendString(
            (obj.trends as Record<string, unknown>).revenue
          ),
          orders: validateTrendString(
            (obj.trends as Record<string, unknown>).orders
          ),
        }
      : undefined;

  return {
    monthlyData: validatedMonthly,
    summary,
    trends,
  };
}

/**
 * Helper to validate trend strings (e.g., "+5%", "-3%")
 */
function validateTrendString(val: unknown): string {
  if (typeof val === "string") {
    const sanitized = val.trim().slice(0, 20);
    // Check if it looks like a valid trend (starts with +/- and contains %)
    if (/^[+-]/.test(sanitized) || /\d/.test(sanitized)) {
      return sanitized;
    }
  }
  return "0%";
}

/**
 * Helper for safe number conversion (used in validators above)
 */
function safeNumber(val: unknown, min = 0, max = Infinity): number {
  const num = typeof val === "number" ? val : Number(val) || 0;
  return Number.isFinite(num) ? Math.min(Math.max(num, min), max) : 0;
}
