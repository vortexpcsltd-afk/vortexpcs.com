/**
 * ProductReviewSection Component
 * Complete review section for product pages
 * Displays reviews, ratings, and allows authenticated users to submit reviews
 */

import { MessageSquare } from "lucide-react";
import { ReviewList } from "./ReviewList";

interface ProductReviewSectionProps {
  productId: string;
  productName: string;
  orderId?: string;
  className?: string;
}

export function ProductReviewSection({
  productId,
  productName,
  orderId,
  className,
}: ProductReviewSectionProps) {
  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-sky-500" />
          Customer Reviews
        </h2>
        <p className="text-gray-400">
          See what our customers say about {productName}
        </p>
      </div>

      <ReviewList
        productId={productId}
        productName={productName}
        orderId={orderId}
      />
    </div>
  );
}
