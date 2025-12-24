/**
 * Review Service
 * Client-side functions for managing product reviews
 * Includes CSRF protection on state-changing requests
 */

import { auth } from "../config/firebase";
import { logger } from "./logger";
import { getCsrfToken } from "../utils/csrfToken";
import type {
  Review,
  ReviewSummary,
  ReviewFormData,
  ReviewFilters,
} from "../types/review";

/**
 * Submit a product review
 */
export const submitReview = async (
  reviewData: ReviewFormData
): Promise<{ success: boolean; reviewId?: string; verified?: boolean }> => {
  try {
    if (!auth?.currentUser) {
      throw new Error("You must be logged in to submit a review");
    }

    const token = await auth.currentUser.getIdToken();

    // Add CSRF token to headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    try {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
    } catch {
      // Ignore CSRF token failure
    }

    const response = await fetch("/api/reviews/submit", {
      method: "POST",
      headers,
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      let errorMessage = "Failed to submit review";
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If response is not JSON (e.g., HTML error page), use status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    logger.info("Review submitted successfully", { reviewId: result.reviewId });
    return result;
  } catch (error) {
    logger.error("Submit review error", error);
    throw error;
  }
};

/**
 * Get reviews for a product
 */
export const getProductReviews = async (
  productId: string,
  filters?: ReviewFilters
): Promise<{
  reviews: Review[];
  summary: ReviewSummary;
  total: number;
}> => {
  try {
    const params = new URLSearchParams();

    if (filters?.rating) {
      params.append("rating", filters.rating.toString());
    }

    if (filters?.verified) {
      params.append("verified", "true");
    }

    if (filters?.sortBy) {
      params.append("sortBy", filters.sortBy);
    }

    const url = `/api/reviews/${productId}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch reviews");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error("Get product reviews error", error);
    throw error;
  }
};

/**
 * Mark a review as helpful or not helpful
 */
export const voteReviewHelpful = async (
  reviewId: string,
  helpful: boolean
): Promise<void> => {
  try {
    if (!auth?.currentUser) {
      throw new Error("You must be logged in to vote");
    }

    const token = await auth.currentUser.getIdToken();

    // Add CSRF token to headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    try {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
    } catch {
      // Ignore CSRF token failure
    }

    const response = await fetch("/api/reviews/helpful", {
      method: "POST",
      headers,
      body: JSON.stringify({ reviewId, helpful }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to record vote");
    }

    logger.info("Review vote recorded", { reviewId, helpful });
  } catch (error) {
    logger.error("Vote review helpful error", error);
    throw error;
  }
};

/**
 * Moderate a review (admin only)
 */
export const moderateReview = async (
  reviewId: string,
  action: "approve" | "reject" | "delete",
  moderatorNote?: string
): Promise<void> => {
  try {
    if (!auth?.currentUser) {
      throw new Error("Authentication required");
    }

    const token = await auth.currentUser.getIdToken();

    // Add CSRF token to headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    try {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
    } catch {
      // Ignore CSRF token failure
    }

    const response = await fetch("/api/reviews/moderate", {
      method: "POST",
      headers,
      body: JSON.stringify({ reviewId, action, moderatorNote }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to moderate review");
    }

    logger.info("Review moderated", { reviewId, action });
  } catch (error) {
    logger.error("Moderate review error", error);
    throw error;
  }
};

/**
 * Check if user has purchased a product
 */
export const checkUserPurchasedProduct = async (
  productId: string
): Promise<{ purchased: boolean; orderId?: string }> => {
  try {
    if (!auth?.currentUser) {
      return { purchased: false };
    }

    const token = await auth.currentUser.getIdToken();

    const response = await fetch(
      `/api/reviews/check-purchase?productId=${productId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return { purchased: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error("Check user purchased product error", error);
    return { purchased: false };
  }
};

/**
 * Get user's own review for a product
 */
export const getUserProductReview = async (
  productId: string
): Promise<Review | null> => {
  try {
    if (!auth?.currentUser) {
      return null;
    }

    const token = await auth.currentUser.getIdToken();

    const response = await fetch(
      `/api/reviews/user-review?productId=${productId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.review || null;
  } catch (error) {
    logger.error("Get user product review error", error);
    return null;
  }
};

/**
 * Calculate star rating display (for half stars)
 */
export const getStarDisplay = (
  rating: number
): {
  fullStars: number;
  hasHalfStar: boolean;
  emptyStars: number;
} => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return { fullStars, hasHalfStar, emptyStars };
};
