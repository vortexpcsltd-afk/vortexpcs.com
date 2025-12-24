/**
 * ReviewManagement Component
 * Admin interface for moderating and managing product reviews
 */

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  MessageSquare,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { StarRating } from "./StarRating";
import { moderateReview } from "../services/reviews";
import { toast } from "sonner";
import type { Review } from "../types/review";

interface ReviewManagementProps {
  className?: string;
}

export function ReviewManagement({ className }: ReviewManagementProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [moderatorNote, setModeratorNote] = useState("");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "delete" | null;
    review: Review | null;
  }>({ open: false, action: null, review: null });

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all reviews from API
      const response = await fetch(
        `/api/admin/reviews${
          statusFilter !== "all" ? `?status=${statusFilter}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleModerate = async (
    reviewId: string,
    action: "approve" | "reject" | "delete"
  ) => {
    try {
      await moderateReview(reviewId, action, moderatorNote);
      toast.success(
        `Review ${action === "delete" ? "deleted" : action + "d"} successfully`
      );
      setActionDialog({ open: false, action: null, review: null });
      setModeratorNote("");
      loadReviews();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to moderate review";
      toast.error(message);
    }
  };

  const openActionDialog = (
    review: Review,
    action: "approve" | "reject" | "delete"
  ) => {
    setActionDialog({ open: true, action, review });
    setModeratorNote(review.moderatorNote || "");
  };

  const filteredReviews = reviews.filter((review) => {
    if (
      searchQuery &&
      !review.productName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !review.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !review.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 border-yellow-500/40 text-yellow-400">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-sky-500" />
          Review Management
        </h2>
        <p className="text-gray-400">
          Moderate customer reviews and maintain content quality
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <Card
              key={review.id}
              className="bg-white/5 backdrop-blur-xl border-white/10 p-6 hover:border-sky-500/30 transition-all"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">
                        {review.productName}
                      </h3>
                      {review.verified && (
                        <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 text-xs">
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{review.userName}</span>
                      <span>•</span>
                      <StarRating rating={review.rating} size="sm" showValue />
                      <span>•</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    {review.title}
                  </h4>
                  <p className="text-gray-300">{review.comment}</p>
                </div>

                {/* Moderator Note */}
                {review.moderatorNote && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-semibold text-amber-400 mb-1">
                      Moderator Note:
                    </p>
                    <p className="text-xs text-amber-300">
                      {review.moderatorNote}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  {review.status !== "approved" && (
                    <Button
                      size="sm"
                      onClick={() => openActionDialog(review, "approve")}
                      className="bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}

                  {review.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionDialog(review, "reject")}
                      className="bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openActionDialog(review, "delete")}
                    className="bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/40 text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>

                  <div className="ml-auto text-xs text-gray-400">
                    {review.helpful} helpful • {review.notHelpful} not helpful
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Reviews Found
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No reviews to moderate"}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, action: null, review: null })
        }
      >
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "delete"
                ? "Delete Review"
                : actionDialog.action === "approve"
                ? "Approve Review"
                : "Reject Review"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionDialog.action === "delete"
                ? "This action cannot be undone. The review will be permanently deleted."
                : `Are you sure you want to ${actionDialog.action} this review?`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.action !== "delete" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Moderator Note (Optional)
              </label>
              <Textarea
                value={moderatorNote}
                onChange={(e) => setModeratorNote(e.target.value)}
                placeholder="Add a note explaining this decision..."
                className="bg-white/5 border-white/10"
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, action: null, review: null })
              }
              className="bg-white/5 border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                actionDialog.review &&
                actionDialog.action &&
                handleModerate(actionDialog.review.id, actionDialog.action)
              }
              className={
                actionDialog.action === "delete"
                  ? "bg-red-500 hover:bg-red-600"
                  : actionDialog.action === "approve"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-amber-500 hover:bg-amber-600"
              }
            >
              {actionDialog.action === "delete"
                ? "Delete"
                : actionDialog.action === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
