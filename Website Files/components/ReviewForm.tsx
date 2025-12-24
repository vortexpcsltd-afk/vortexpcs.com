/**
 * ReviewForm Component
 * Form for submitting product reviews
 */

import { useState, type FormEvent } from "react";
import { logger } from "../services/logger";
import { Star, Send } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { StarRating } from "./StarRating";
import { submitReview } from "../services/reviews";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import type { ReviewFormData } from "../types/review";

interface ReviewFormProps {
  productId: string;
  productName: string;
  orderId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  productId,
  productName,
  orderId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { isAuthenticated, user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast.error("Please log in to submit a review");
      return;
    }

    if (rating < 0.5 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    if (title.length < 3 || title.length > 100) {
      toast.error("Title must be between 3 and 100 characters");
      return;
    }

    if (comment.length < 10 || comment.length > 2000) {
      toast.error("Review must be between 10 and 2000 characters");
      return;
    }

    try {
      setSubmitting(true);

      const reviewData: ReviewFormData = {
        productId,
        productName,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        orderId,
      };

      const result = await submitReview(reviewData);

      if (result.verified) {
        toast.success("Review submitted successfully! ✓ Verified Purchase");
      } else {
        toast.success("Review submitted successfully!");
      }

      // Reset form
      setRating(5);
      setTitle("");
      setComment("");

      onSuccess?.();
    } catch (error) {
      logger.error("Review submission error", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit review";
      toast.error(message);

      // If Firebase isn't configured, show a more helpful message
      if (message.includes("auth") || message.includes("Firebase")) {
        toast.info(
          "Firebase authentication is not configured. Please set up your Firebase credentials."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <div className="text-center py-8">
          <Star className="w-12 h-12 mx-auto mb-4 text-sky-500" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Write a Review
          </h3>
          <p className="text-gray-400 mb-4">
            Please log in to share your experience with this product
          </p>
          <Button
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            onClick={() => {
              // Trigger login dialog - you can pass this as a prop or use a context
              window.dispatchEvent(new CustomEvent("openLogin"));
            }}
          >
            Log In to Review
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Rating *
          </label>
          <div className="flex items-center gap-3">
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onChange={setRating}
            />
            <span className="text-sm text-gray-400">
              {rating.toFixed(1)} / 5.0
            </span>
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label
            htmlFor="review-title"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Review Title *
          </label>
          <Input
            id="review-title"
            placeholder="Sum up your experience in one sentence"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="bg-white/5 border-white/10 focus:border-sky-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 characters
          </p>
        </div>

        {/* Review Comment */}
        <div>
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Your Review *
          </label>
          <Textarea
            id="review-comment"
            placeholder="Tell us about your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={6}
            className="bg-white/5 border-white/10 focus:border-sky-500 resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/2000 characters (minimum 10)
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 flex-1"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
