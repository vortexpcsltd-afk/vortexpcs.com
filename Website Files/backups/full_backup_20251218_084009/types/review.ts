/**
 * Product Review Type Definitions
 * Handles review data structures for the VortexPCs review system
 */

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 0.5 to 5.0 in 0.5 increments
  title: string;
  comment: string;
  verified: boolean; // true if user purchased this product
  helpful: number; // count of helpful votes
  notHelpful: number; // count of not helpful votes
  status: "pending" | "approved" | "rejected"; // moderation status
  moderatorNote?: string; // admin notes on moderation
  createdAt: Date;
  updatedAt?: Date;
  orderId?: string; // reference to order if verified purchase
}

export interface ReviewSummary {
  productId: string;
  averageRating: number; // 0 to 5
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verifiedPurchases: number;
}

export interface ReviewFormData {
  productId: string;
  productName: string;
  rating: number;
  title: string;
  comment: string;
  orderId?: string;
}

export interface ReviewHelpfulVote {
  reviewId: string;
  userId: string;
  helpful: boolean; // true = helpful, false = not helpful
  createdAt: Date;
}

export interface ReviewFilters {
  rating?: number; // filter by specific rating
  verified?: boolean; // show only verified purchases
  sortBy?: "recent" | "helpful" | "rating-high" | "rating-low";
  status?: "pending" | "approved" | "rejected" | "all";
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  verifiedPurchases: number;
}
