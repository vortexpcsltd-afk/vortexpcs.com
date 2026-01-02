/**
 * ReviewList Component
 * Displays a list of product reviews with filtering and sorting
 */

import { useState, useEffect, useCallback } from "react";
import { logger } from "../services/logger";
import { Star, Filter, TrendingUp, Calendar, Award } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Progress } from "./ui/progress";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { StarRating } from "./StarRating";
import { getProductReviews } from "../services/reviews";
import { useAuth } from "../contexts/AuthContext";
import type { Review, ReviewSummary, ReviewFilters } from "../types/review";

interface ReviewListProps {
  productId: string;
  productName: string;
  orderId?: string;
  showForm?: boolean;
}

export function ReviewList({
  productId,
  productName,
  orderId,
  showForm = false,
}: ReviewListProps) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(showForm);
  const [filters, setFilters] = useState<ReviewFilters>({
    sortBy: "recent",
  });

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProductReviews(productId, filters);
      setReviews(data.reviews);
      setSummary(data.summary);
    } catch (error) {
      logger.error("Failed to load reviews", error);
    } finally {
      setLoading(false);
    }
  }, [filters, productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    loadReviews();
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: value as ReviewFilters["sortBy"],
    }));
  };

  const handleRatingFilter = (rating: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      rating,
    }));
  };

  const handleVerifiedFilter = () => {
    setFilters((prev) => ({
      ...prev,
      verified: !prev.verified,
    }));
  };

  const getRatingPercentage = (rating: number): number => {
    if (!summary || summary.totalReviews === 0) return 0;
    const count =
      summary.ratingDistribution[
        rating as keyof typeof summary.ratingDistribution
      ] || 0;
    return (count / summary.totalReviews) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      {summary && summary.totalReviews > 0 && (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-5xl font-bold text-white mb-2">
                {summary.averageRating.toFixed(1)}
              </div>
              <StarRating rating={summary.averageRating} size="lg" />
              <p className="text-sm text-gray-400 mt-2">
                Based on {summary.totalReviews} review
                {summary.totalReviews !== 1 ? "s" : ""}
              </p>
              {summary.verifiedPurchases > 0 && (
                <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mt-2">
                  <Award className="w-3 h-3 mr-1" />
                  {summary.verifiedPurchases} Verified Purchase
                  {summary.verifiedPurchases !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  summary.ratingDistribution[
                    rating as keyof typeof summary.ratingDistribution
                  ] || 0;
                const percentage = getRatingPercentage(rating);

                return (
                  <button
                    key={rating}
                    onClick={() =>
                      handleRatingFilter(
                        filters.rating === rating ? undefined : rating
                      )
                    }
                    className="flex items-center gap-3 w-full group hover:bg-white/5 p-2 rounded-lg transition-all"
                  >
                    <span className="text-sm text-gray-400 w-6">
                      {rating}
                      <Star className="w-3 h-3 inline ml-0.5 fill-gray-400 text-gray-400" />
                    </span>
                    <Progress
                      value={percentage}
                      className="h-2 flex-1 bg-white/10"
                    />
                    <span className="text-sm text-gray-400 w-8 text-right">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Review Form */}
      {showReviewForm ? (
        <ReviewForm
          productId={productId}
          productName={productName}
          orderId={orderId}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      ) : (
        isAuthenticated && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                Have you purchased this product?
              </p>
              <Button
                onClick={() => setShowReviewForm(true)}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                <Star className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
            </div>
          </Card>
        )
      )}

      {/* Filters and Sorting */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Sort by:</span>
          </div>

          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Most Recent
                </div>
              </SelectItem>
              <SelectItem value="helpful">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Most Helpful
                </div>
              </SelectItem>
              <SelectItem value="rating-high">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Highest Rating
                </div>
              </SelectItem>
              <SelectItem value="rating-low">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Lowest Rating
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {summary && summary.verifiedPurchases > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifiedFilter}
              className={`bg-white/5 border-white/10 hover:bg-white/10 ${
                filters.verified ? "border-sky-500 text-sky-400" : ""
              }`}
            >
              <Award className="w-4 h-4 mr-2" />
              Verified Only
            </Button>
          )}

          {filters.rating && (
            <Badge
              variant="outline"
              className="bg-sky-500/20 border-sky-500/40 text-sky-400 cursor-pointer"
              onClick={() => handleRatingFilter(undefined)}
            >
              {filters.rating} Stars ✕
            </Badge>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVoteUpdate={loadReviews}
            />
          ))
        ) : (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
            <div className="text-center py-8">
              <Star className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-400 mb-4">
                Be the first to share your experience with this product
              </p>
              {isAuthenticated && !showReviewForm && (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                >
                  Write First Review
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
