import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Users, TrendingUp, Zap } from "lucide-react";
import {
  fetchContactInformation,
  type ContactInformation,
} from "../services/cms";

// =============================================
// Social Proof Config (easy to edit)
// - You can override these via environment variables in .env
//   VITE_SOCIALPROOF_MAX_BUILDS_PER_DAY (default 6)
//   VITE_SOCIALPROOF_UPDATE_MS (default 300000 = 5 minutes)
//   VITE_SOCIALPROOF_BUSINESS_START (default "08:30")
//   VITE_SOCIALPROOF_BUSINESS_END (default "18:00")
//   VITE_SOCIALPROOF_WEEKEND_ENABLED (default "false")
// =============================================
const MAX_BUILDS_PER_DAY: number = Number(
  import.meta.env.VITE_SOCIALPROOF_MAX_BUILDS_PER_DAY ?? 6
);
const UPDATE_INTERVAL_MS: number = Number(
  import.meta.env.VITE_SOCIALPROOF_UPDATE_MS ?? 5 * 60 * 1000
);

const BUSINESS_START: string =
  import.meta.env.VITE_SOCIALPROOF_BUSINESS_START ?? "08:30";
const BUSINESS_END: string =
  import.meta.env.VITE_SOCIALPROOF_BUSINESS_END ?? "18:00";
const WEEKEND_ENABLED: boolean = String(
  import.meta.env.VITE_SOCIALPROOF_WEEKEND_ENABLED ?? "false"
)
  .toLowerCase()
  .includes("true");

function timeToMinutes(hhmm: string): number {
  const [h, m] = (hhmm || "").split(":");
  const hh = Math.max(0, Math.min(23, Number(h) || 0));
  const mm = Math.max(0, Math.min(59, Number(m) || 0));
  return hh * 60 + mm;
}

const START_MIN_DEFAULT = timeToMinutes(BUSINESS_START);
const END_MIN_DEFAULT = timeToMinutes(BUSINESS_END);

function parseHoursString(s?: string): {
  start?: number;
  end?: number;
  closed: boolean;
} {
  if (!s) return { closed: false };
  const lower = s.toLowerCase().trim();
  if (lower.includes("closed")) return { closed: true };
  const match = lower.match(
    /(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?/
  );
  if (!match) return { closed: false };
  const h1 = Number(match[1]);
  const m1 = Number(match[2] ?? 0);
  const h2 = Number(match[3]);
  const m2 = Number(match[4] ?? 0);
  const start =
    Math.max(0, Math.min(23, h1)) * 60 + Math.max(0, Math.min(59, m1));
  const end =
    Math.max(0, Math.min(23, h2)) * 60 + Math.max(0, Math.min(59, m2));
  return { start, end, closed: false };
}

function getStartEndForDate(
  date: Date,
  ci?: ContactInformation | null
): { startMin: number; endMin: number; closed: boolean } {
  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  const dow = date.getDay();
  // Always closed on Sunday
  if (dow === 0) {
    return {
      startMin: START_MIN_DEFAULT,
      endMin: END_MIN_DEFAULT,
      closed: true,
    };
  }
  const key = dayKeys[dow] as keyof NonNullable<
    ContactInformation["businessHours"]
  >;
  const hours = ci?.businessHours?.[key];
  const parsed = parseHoursString(hours);
  if (parsed.closed) {
    return {
      startMin: START_MIN_DEFAULT,
      endMin: END_MIN_DEFAULT,
      closed: true,
    };
  }
  const start = Number.isFinite(parsed.start!)
    ? parsed.start!
    : START_MIN_DEFAULT;
  const end = Number.isFinite(parsed.end!) ? parsed.end! : END_MIN_DEFAULT;
  if (end <= start) {
    return {
      startMin: START_MIN_DEFAULT,
      endMin: END_MIN_DEFAULT,
      closed: false,
    };
  }
  return { startMin: start, endMin: end, closed: false };
}

function computeBuildsForNow(
  now: Date,
  startMin: number,
  endMin: number,
  closed: boolean
): number {
  if (MAX_BUILDS_PER_DAY <= 0) return 0;
  if (closed) return 0;
  // Optional weekend gating (Saturday only; Sunday already closed)
  const dow = now.getDay();
  if (!WEEKEND_ENABLED && dow === 6) return 0;

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  if (minutesNow <= startMin) return 0;
  if (minutesNow >= endMin) return MAX_BUILDS_PER_DAY;

  const totalSpan = endMin - startMin;
  const elapsed = minutesNow - startMin;
  const fraction = Math.max(0, Math.min(1, elapsed / totalSpan));
  return Math.floor(fraction * MAX_BUILDS_PER_DAY);
}

// Custom hook to simulate real-time viewer count
// In production, this would connect to WebSocket or use polling
function useRealTimeViewers(productId: string): number {
  const [viewers, setViewers] = useState<number>(0);

  useEffect(() => {
    // Generate initial viewer count (2-12 viewers for realism)
    const initialViewers = Math.floor(Math.random() * 11) + 2;
    setViewers(initialViewers);

    // Simulate viewer count fluctuations every 8-15 seconds
    const interval = setInterval(() => {
      setViewers((prev) => {
        // Random change: -2 to +3 viewers
        const change = Math.floor(Math.random() * 6) - 2;
        const newCount = Math.max(0, Math.min(15, prev + change));
        return newCount;
      });
    }, Math.random() * 7000 + 8000); // 8-15 seconds

    return () => clearInterval(interval);
  }, [productId]);

  return viewers;
}

// Custom hook for build statistics
// In production, this would fetch from analytics API
function useBuildStats(): {
  buildsToday: number;
  isTrending: boolean;
  percentChange: number;
} {
  const [stats, setStats] = useState({
    buildsToday: 0,
    isTrending: false,
    percentChange: 0,
  });
  const [contact, setContact] = useState<ContactInformation | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadContact = async () => {
      try {
        const ci = await fetchContactInformation();
        if (!mounted) return;
        setContact(ci);
      } catch {
        // ignore errors; fall back to env defaults
      }
    };
    loadContact();

    const update = () => {
      const now = new Date();
      const { startMin, endMin, closed } = getStartEndForDate(now, contact);
      const builds = computeBuildsForNow(now, startMin, endMin, closed);
      const minutesNow = now.getHours() * 60 + now.getMinutes();
      const frac =
        endMin > startMin
          ? Math.max(
              0,
              Math.min(1, (minutesNow - startMin) / (endMin - startMin))
            )
          : 0;
      const pct = Math.round(5 + frac * 20); // 5%..25%
      const trending = pct >= 15 && builds > 0;
      setStats({
        buildsToday: builds,
        isTrending: trending,
        percentChange: pct,
      });
    };

    update();
    const interval = setInterval(update, UPDATE_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [contact]);

  return stats;
}

// Main Social Proof component - shows viewer count
interface SocialProofProps {
  productId: string;
  className?: string;
  variant?: "viewers" | "compact";
}

export function SocialProof({
  productId,
  className = "",
  variant = "viewers",
}: SocialProofProps) {
  const viewers = useRealTimeViewers(productId);

  // Don't show if less than 2 viewers (not compelling)
  if (viewers < 2) return null;

  if (variant === "compact") {
    return (
      <Badge
        variant="secondary"
        className={`bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-all duration-300 animate-pulse-subtle ${className}`}
      >
        <Users className="w-3 h-3 mr-1" />
        {viewers} viewing
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/30 text-sky-300 hover:border-sky-500/50 transition-all duration-300 animate-pulse-subtle backdrop-blur-sm ${className}`}
    >
      <Users className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
      <span className="font-medium">
        {viewers} {viewers === 1 ? "person" : "people"} viewing now
      </span>
    </Badge>
  );
}

// Builds Completed Today component
interface BuildsCompletedTodayProps {
  className?: string;
  showTrending?: boolean;
}

export function BuildsCompletedToday({
  className = "",
  showTrending = true,
}: BuildsCompletedTodayProps) {
  const { buildsToday, isTrending, percentChange } = useBuildStats();
  const [displayCount, setDisplayCount] = useState(0);

  // Animated counter effect
  useEffect(() => {
    if (displayCount < buildsToday) {
      const timeout = setTimeout(() => {
        setDisplayCount((prev) => Math.min(prev + 1, buildsToday));
      }, 30);
      return () => clearTimeout(timeout);
    }
  }, [displayCount, buildsToday]);

  return (
    <div
      className={`flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-3 ${className}`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30">
        <Zap className="w-5 h-5 text-sky-400" />
      </div>

      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tabular-nums">
            {displayCount}
          </span>
          {showTrending && isTrending && (
            <Badge className="bg-green-500/20 border-green-500/40 text-green-400 text-xs px-1.5 py-0">
              <TrendingUp className="w-3 h-3 mr-0.5" />+{percentChange}%
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5">builds completed today</p>
      </div>
    </div>
  );
}

// Stock Urgency component (bonus - shows low stock alert)
interface StockUrgencyProps {
  stockLevel: number;
  threshold?: number;
  className?: string;
}

export function StockUrgency({
  stockLevel,
  threshold = 5,
  className = "",
}: StockUrgencyProps) {
  // Only show if stock is low
  if (stockLevel > threshold) return null;

  const isVeryLow = stockLevel <= 2;

  return (
    <Badge
      variant="secondary"
      className={`${
        isVeryLow
          ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
          : "bg-orange-500/10 border-orange-500/30 text-orange-400"
      } ${className}`}
    >
      <Zap className="w-3 h-3 mr-1" />
      {isVeryLow ? "Only" : "Just"} {stockLevel} left in stock
    </Badge>
  );
}

// Recent Purchase notification (bonus - "X bought this in the last 24h")
interface RecentPurchaseProps {
  purchaseCount: number;
  timeframe?: string;
  className?: string;
}

export function RecentPurchase({
  purchaseCount,
  timeframe = "24 hours",
  className = "",
}: RecentPurchaseProps) {
  // Only show if there are recent purchases
  if (purchaseCount < 1) return null;

  return (
    <div
      className={`flex items-center gap-2 text-sm text-gray-300 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 ${className}`}
    >
      <div className="flex -space-x-2">
        {Array.from({ length: Math.min(purchaseCount, 3) }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 border-2 border-gray-900 flex items-center justify-center text-xs text-white font-semibold"
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      <span>
        <span className="font-semibold text-sky-400">{purchaseCount}</span>{" "}
        {purchaseCount === 1 ? "person" : "people"} purchased in the last{" "}
        {timeframe}
      </span>
    </div>
  );
}

// Note: Hooks are defined above and used internally
// For external use, import the components which use these hooks internally
