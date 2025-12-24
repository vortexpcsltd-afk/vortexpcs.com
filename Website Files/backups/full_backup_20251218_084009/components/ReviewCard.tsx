/**
 * ReviewCard Component
 * Displays an individual product review
 */

import { useState } from "react";
import { ThumbsUp, ThumbsDown, BadgeCheck, Shield } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { StarRating } from "./StarRating";
import { voteReviewHelpful } from "../services/reviews";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import type { Review } from "../types/review";

interface ReviewCardProps {
  review: Review;
  onVoteUpdate?: () => void;
}

export function ReviewCard({ review, onVoteUpdate }: ReviewCardProps) {
  const { isAuthenticated } = useAuth();
  const [voting, setVoting] = useState(false);
  const [localHelpful, setLocalHelpful] = useState(review.helpful);
  const [localNotHelpful, setLocalNotHelpful] = useState(review.notHelpful);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleVote = async (helpful: boolean) => {
    if (!isAuthenticated) {
      toast.error("Please log in to vote on reviews");
      return;
    }

    if (voting) return;

    try {
      setVoting(true);
      await voteReviewHelpful(review.id, helpful);

      // Optimistically update counts
      if (helpful) {
        setLocalHelpful((prev) => prev + 1);
      } else {
        setLocalNotHelpful((prev) => prev + 1);
      }

      toast.success("Thank you for your feedback!");
      onVoteUpdate?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to record vote";
      toast.error(message);
    } finally {
      setVoting(false);
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 hover:border-sky-500/30 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {review.userName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Review Content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-white">{review.userName}</h4>
                {review.verified && (
                  <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 text-xs px-2 py-0.5">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-xs text-gray-400">
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Review Title */}
          <h5 className="font-semibold text-white text-lg">{review.title}</h5>

          {/* Review Comment */}
          <p className="text-gray-300 leading-relaxed">{review.comment}</p>

          {/* Helpful Buttons */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm text-gray-400">Was this helpful?</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-sky-500/50"
                onClick={() => handleVote(true)}
                disabled={voting}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                <span className="text-xs">
                  {localHelpful > 0 ? localHelpful : ""}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-red-500/50"
                onClick={() => handleVote(false)}
                disabled={voting}
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                <span className="text-xs">
                  {localNotHelpful > 0 ? localNotHelpful : ""}
                </span>
              </Button>
            </div>
          </div>

          {/* Moderator Note */}
          {review.moderatorNote && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1">
                    Moderator Note
                  </p>
                  <p className="text-xs text-amber-300">
                    {review.moderatorNote}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
