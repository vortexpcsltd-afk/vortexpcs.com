/**
 * Client-side search tracking service for PC Builder
 * Safely tracks searches to Firebase with proper error handling
 */

import { classifySearchIntent } from "../utils/searchIntentClassifier";
import { getSearchSessionId } from "../utils/searchSessionManager";
import { generateSearchSuggestions } from "../utils/searchSuggestions";
import { db } from "../config/firebase";
import { addDoc, collection } from "firebase/firestore";

export interface SearchTrackingData {
  query: string;
  category: string;
  resultsCount: number;
  userId?: string;
  sessionId?: string;
  filters?: {
    brands?: string[];
    priceRange?: [number, number];
    [key: string]: unknown;
  };
  addedToCart?: boolean;
  checkoutCompleted?: boolean;
}

interface DeviceGeoMeta {
  isMobile?: boolean;
  deviceType?: "Mobile" | "Desktop" | "Tablet" | "Unknown";
  language?: string;
  timezone?: string;
  country?: string;
  region?: string;
  city?: string;
}

export interface SearchRefinementEvent {
  sessionId: string;
  userId?: string;
  timestamp: number;
  previousQuery: string;
  newQuery: string;
  addedFilters: Record<string, unknown>;
  removedFilters: Record<string, unknown>;
  previousResultsCount?: number;
  newResultsCount?: number;
  meta?: DeviceGeoMeta;
}

function detectDevice(): Pick<DeviceGeoMeta, "isMobile" | "deviceType"> {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent || "";
  const isIPad =
    /iPad/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  const isTablet =
    /Tablet|iPad/.test(ua) ||
    (/Android/.test(ua) && !/Mobile/.test(ua)) ||
    isIPad;
  const isMobileUA = /Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua);
  const isNarrow =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;
  const isMobile = isMobileUA || (!isTablet && isNarrow);
  const deviceType: DeviceGeoMeta["deviceType"] = isTablet
    ? "Tablet"
    : isMobile
    ? "Mobile"
    : "Desktop";
  return { isMobile, deviceType };
}

async function fetchWithTimeout(
  resource: string,
  options: unknown = {},
  timeoutMs = 1000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(
      resource,
      Object.assign({}, (options as object) || {}, {
        signal: controller.signal,
      })
    );
    return resp;
  } finally {
    clearTimeout(id);
  }
}

async function getGeo(): Promise<
  Pick<DeviceGeoMeta, "country" | "region" | "city">
> {
  if (typeof window === "undefined") return {};
  try {
    const cacheKey = "vortex_geo_cache_v1";
    const cached = window.localStorage?.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as {
        ts: number;
        country?: string;
        region?: string;
        city?: string;
      };
      if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
        return {
          country: parsed.country,
          region: parsed.region,
          city: parsed.city,
        };
      }
    }

    // Try ipapi.co first (no token), fallback to ipwho.is
    let country: string | undefined;
    let region: string | undefined;
    let city: string | undefined;

    try {
      const res = await fetchWithTimeout("https://ipapi.co/json/", {}, 1000);
      if (res.ok) {
        const j = (await res.json()) as {
          country_name?: string;
          region?: string;
          city?: string;
        };
        country = j.country_name;
        region = j.region;
        city = j.city;
      }
    } catch {
      // ignore
    }

    if (!country) {
      try {
        const res2 = await fetchWithTimeout("https://ipwho.is/", {}, 1000);
        if (res2.ok) {
          const j2 = (await res2.json()) as unknown as Record<string, unknown>;
          const cVal = j2["country"];
          const rVal = j2["region"] as unknown;
          country = typeof cVal === "string" ? cVal : undefined;
          region =
            typeof rVal === "string"
              ? rVal
              : ((rVal as Record<string, unknown>)?.["name"] as
                  | string
                  | undefined);
          const cityVal = j2["city"];
          city = typeof cityVal === "string" ? cityVal : undefined;
        }
      } catch {
        // ignore
      }
    }

    const payload = { ts: Date.now(), country, region, city };
    try {
      window.localStorage?.setItem(cacheKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
    return { country, region, city };
  } catch {
    return {};
  }
}

async function getDeviceAndGeoMetadata(): Promise<DeviceGeoMeta> {
  const { isMobile, deviceType } = detectDevice();
  const language =
    typeof navigator !== "undefined" ? navigator.language : undefined;
  const timezone =
    typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;
  const geo = await getGeo();
  return { isMobile, deviceType, language, timezone, ...geo };
}

/**
 * Track a search query - uses dynamic imports to avoid initialization errors
 */
export async function trackSearch(
  data: SearchTrackingData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamically import Firebase to avoid module loading issues
    const { db } = await import("../config/firebase");

    // Early return if Firebase not configured
    if (!db) {
      console.warn("[trackSearch] Firebase not configured");
      return { success: false, error: "Firebase not configured" };
    }

    // Dynamically import Firestore functions
    const { addDoc, collection, serverTimestamp } = await import(
      "firebase/firestore"
    );

    // Classify search intent
    const intentResult = classifySearchIntent(data.query);

    // Auto-generate session ID if not provided
    const sessionId = data.sessionId || getSearchSessionId();

    // Enrich with device/geo (best-effort, non-blocking on failure)
    let meta: DeviceGeoMeta = {};
    try {
      meta = await getDeviceAndGeoMetadata();
    } catch {
      meta = {};
    }

    const searchData = {
      query: data.query.toLowerCase().trim(),
      originalQuery: data.query.trim(),
      category: data.category,
      resultsCount: data.resultsCount,
      userId: data.userId || null,
      sessionId,
      filters: {
        ...(data.filters || {}),
        isMobile: meta.isMobile ?? undefined,
        deviceType: meta.deviceType ?? undefined,
        country: meta.country ?? undefined,
        region: meta.region ?? undefined,
        city: meta.city ?? undefined,
        language: meta.language ?? undefined,
        timezone: meta.timezone ?? undefined,
      },
      intent: intentResult.intent,
      intentConfidence: intentResult.confidence,
      intentKeywords: intentResult.keywords,
      addedToCart: data.addedToCart || false,
      checkoutCompleted: data.checkoutCompleted || false,
      timestamp: serverTimestamp(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    await addDoc(collection(db, "searchQueries"), searchData);

    return { success: true };
  } catch (error) {
    console.error("[trackSearch] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Track a refinement event when the user changes query or filters
export async function trackSearchRefinement(
  previousQuery: string,
  newQuery: string,
  previousFilters: Record<string, unknown>,
  newFilters: Record<string, unknown>,
  options?: {
    userId?: string;
    sessionId?: string;
    previousResultsCount?: number;
    newResultsCount?: number;
  }
): Promise<void> {
  try {
    const meta = await getDeviceAndGeoMetadata();

    // Diff filters
    const addedFilters: Record<string, unknown> = {};
    const removedFilters: Record<string, unknown> = {};
    const prevKeys = new Set(Object.keys(previousFilters || {}));
    const newKeys = new Set(Object.keys(newFilters || {}));

    // Added or changed
    for (const k of newKeys) {
      const prevVal = (previousFilters || {})[k];
      const newVal = (newFilters || {})[k];
      const changed = JSON.stringify(prevVal) !== JSON.stringify(newVal);
      if (!prevKeys.has(k) || changed) {
        addedFilters[k] = newVal;
      }
    }

    // Removed
    for (const k of prevKeys) {
      if (!newKeys.has(k)) {
        removedFilters[k] = (previousFilters || {})[k];
      }
    }

    const payload: SearchRefinementEvent = {
      sessionId: options?.sessionId || getSearchSessionId(),
      userId: options?.userId,
      timestamp: Date.now(),
      previousQuery,
      newQuery,
      addedFilters,
      removedFilters,
      previousResultsCount: options?.previousResultsCount,
      newResultsCount: options?.newResultsCount,
      meta,
    };

    // Filter out undefined values for Firebase
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    const col = collection(db, "searchRefinements");
    await addDoc(col, cleanPayload);
  } catch (error) {
    console.error("trackSearchRefinement error:", error);
  }
}

/**
 * Track zero-result searches for admin insights
 */
export async function trackZeroResultSearch(data: {
  query: string;
  category: string;
  userId?: string;
  sessionId?: string;
  knownTerms?: string[]; // Optional: list of known product names for better suggestions
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamically import Firebase to avoid module loading issues
    const { db } = await import("../config/firebase");

    // Early return if Firebase not configured
    if (!db) {
      console.warn("[trackZeroResultSearch] Firebase not configured");
      return { success: false, error: "Firebase not configured" };
    }

    // Dynamically import Firestore functions
    const { addDoc, collection, serverTimestamp } = await import(
      "firebase/firestore"
    );

    // Auto-generate session ID if not provided
    const sessionId = data.sessionId || getSearchSessionId();

    // Generate smart suggestions for this zero-result search
    const suggestions = generateSearchSuggestions(
      data.query,
      data.category,
      data.knownTerms
    );

    // Enrich with device/geo (best-effort)
    let meta: DeviceGeoMeta = {};
    try {
      meta = await getDeviceAndGeoMetadata();
    } catch {
      meta = {};
    }

    await addDoc(collection(db, "zeroResultSearches"), {
      query: data.query.toLowerCase().trim(),
      originalQuery: data.query.trim(),
      category: data.category,
      userId: data.userId || null,
      sessionId,
      filters: {
        isMobile: meta.isMobile ?? null,
        deviceType: meta.deviceType ?? null,
        country: meta.country ?? null,
        region: meta.region ?? null,
        city: meta.city ?? null,
        language: meta.language ?? null,
        timezone: meta.timezone ?? null,
      },
      suggestions: suggestions.map((s) => ({
        type: s.type,
        suggestion: s.suggestion,
        confidence: s.confidence,
        reason: s.reason,
      })),
      timestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("[trackZeroResultSearch] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Track when user adds item to cart from search
 * Links search session to cart action for conversion tracking
 */
export async function trackSearchAddToCart(data: {
  searchQuery: string;
  productId: string;
  productName: string;
  price: number;
  sessionId?: string;
  userId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await import("../config/firebase");
    if (!db) {
      console.warn("[trackSearchAddToCart] Firebase not configured");
      return { success: false, error: "Firebase not configured" };
    }

    const {
      addDoc,
      collection,
      serverTimestamp,
      query,
      where,
      getDocs,
      updateDoc,
      doc,
    } = await import("firebase/firestore");

    const sessionId = data.sessionId || getSearchSessionId();

    // Record conversion event
    await addDoc(collection(db, "searchConversions"), {
      searchQuery: data.searchQuery.toLowerCase().trim(),
      originalQuery: data.searchQuery.trim(),
      productId: data.productId,
      productName: data.productName,
      price: data.price,
      sessionId,
      userId: data.userId || null,
      conversionType: "add_to_cart",
      timestamp: serverTimestamp(),
    });

    // Update related search queries to mark conversion
    const searchesQuery = query(
      collection(db, "searchQueries"),
      where("sessionId", "==", sessionId),
      where("query", "==", data.searchQuery.toLowerCase().trim())
    );

    const snapshot = await getDocs(searchesQuery);
    const updatePromises = snapshot.docs.map((docSnapshot) =>
      updateDoc(doc(db, "searchQueries", docSnapshot.id), {
        addedToCart: true,
        convertedAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error("[trackSearchAddToCart] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Track when user completes checkout from search
 * Links search session to purchase for revenue attribution
 */
export async function trackSearchCheckout(data: {
  searchQuery: string;
  orderId: string;
  orderTotal: number;
  products: Array<{ id: string; name: string; price: number }>;
  sessionId?: string;
  userId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await import("../config/firebase");
    if (!db) {
      console.warn("[trackSearchCheckout] Firebase not configured");
      return { success: false, error: "Firebase not configured" };
    }

    const {
      addDoc,
      collection,
      serverTimestamp,
      query,
      where,
      getDocs,
      updateDoc,
      doc,
    } = await import("firebase/firestore");

    const sessionId = data.sessionId || getSearchSessionId();

    // Record checkout conversion
    await addDoc(collection(db, "searchConversions"), {
      searchQuery: data.searchQuery.toLowerCase().trim(),
      originalQuery: data.searchQuery.trim(),
      orderId: data.orderId,
      orderTotal: data.orderTotal,
      products: data.products,
      sessionId,
      userId: data.userId || null,
      conversionType: "checkout",
      timestamp: serverTimestamp(),
    });

    // Update related search queries to mark checkout
    const searchesQuery = query(
      collection(db, "searchQueries"),
      where("sessionId", "==", sessionId),
      where("query", "==", data.searchQuery.toLowerCase().trim())
    );

    const snapshot = await getDocs(searchesQuery);
    const updatePromises = snapshot.docs.map((docSnapshot) =>
      updateDoc(doc(db, "searchQueries", docSnapshot.id), {
        checkoutCompleted: true,
        orderTotal: data.orderTotal,
        convertedAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error("[trackSearchCheckout] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
