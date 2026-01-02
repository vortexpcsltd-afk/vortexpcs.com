/**
 * API endpoint to track PC Builder search queries
 * Saves search data to Firebase for admin analytics
 */

import { db } from "../../config/firebase";

export interface SearchQuery {
  query: string;
  category: string;
  resultsCount: number;
  userId?: string;
  sessionId?: string;
  timestamp: any;
  filters?: {
    brands?: string[];
    priceRange?: [number, number];
    [key: string]: unknown;
  };
}

/**
 * Track a search query in Firebase
 */
export async function trackSearch(data: {
  query: string;
  category: string;
  resultsCount: number;
  userId?: string;
  sessionId?: string;
  filters?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  // Early return if Firebase not configured
  if (!db) {
    return { success: false, error: "Firebase not configured" };
  }

  try {
    // Dynamically import Firestore functions to avoid module initialization errors
    const firestore = await import("firebase/firestore");

    const searchData = {
      query: data.query.toLowerCase().trim(),
      originalQuery: data.query.trim(),
      category: data.category,
      resultsCount: data.resultsCount,
      userId: data.userId || null,
      sessionId: data.sessionId || null,
      filters: data.filters || {},
      timestamp: firestore.serverTimestamp(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    await firestore.addDoc(
      firestore.collection(db, "searchQueries"),
      searchData
    );

    return { success: true };
  } catch (error) {
    console.error("[trackSearch] Error tracking search:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get popular search terms (to be used in admin panel)
 * This would typically be a Cloud Function, but included for reference
 */
export interface PopularSearch {
  query: string;
  count: number;
  avgResultsCount: number;
  categories: string[];
}

/**
 * Track zero-result searches for admin insights
 */
export async function trackZeroResultSearch(data: {
  query: string;
  category: string;
  userId?: string;
  sessionId?: string;
}): Promise<void> {
  // Early return if Firebase not configured
  if (!db) {
    return;
  }

  try {
    // Dynamically import Firestore functions to avoid module initialization errors
    const firestore = await import("firebase/firestore");

    await firestore.addDoc(firestore.collection(db, "zeroResultSearches"), {
      query: data.query.toLowerCase().trim(),
      originalQuery: data.query.trim(),
      category: data.category,
      userId: data.userId || null,
      sessionId: data.sessionId || null,
      timestamp: firestore.serverTimestamp(),
    });
  } catch (error) {
    console.error("[trackZeroResultSearch] Error:", error);
  }
}
