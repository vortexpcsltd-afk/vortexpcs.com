/**
 * EXAMPLE: How to Integrate Reviews into Product Pages
 * 
 * This file demonstrates how to add the review system to various parts of your app.
 * Copy and adapt these examples to your specific components.
 */

// ============================================================================
// Example 1: Add Reviews to BuildDetailsModal (PC Builder)
// ============================================================================

/*
In components/PCBuilder/modals/BuildDetailsModal.tsx:

import { ProductReviewSection } from '../../ProductReviewSection';

export const BuildDetailsModal = ({ isOpen, onClose, build, onAddToCart }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border-white/10">
        <DialogHeader>
          <DialogTitle>{build.name}</DialogTitle>
        </DialogHeader>

        {/* Existing build details */}
        <div className="space-y-6">
          {/* ... existing content ... */}
        </div>

        {/* Add Review Section */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <ProductReviewSection
            productId={build.id}
            productName={build.name}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
*/

// ============================================================================
// Example 2: Add Reviews to PCFinder Product Details
// ============================================================================

/*
In components/PCFinderSpectacular.tsx:

import { ProductReviewSection } from './ProductReviewSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Inside your product details dialog:
<Dialog open={selectedPC !== null} onOpenChange={() => setSelectedPC(null)}>
  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="specs">Specifications</TabsTrigger>
        <TabsTrigger value="reviews">
          Reviews {selectedPC?.reviewCount ? `(${selectedPC.reviewCount})` : ''}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        {/* Existing details */}
      </TabsContent>

      <TabsContent value="specs">
        {/* Existing specs */}
      </TabsContent>

      <TabsContent value="reviews">
        <ProductReviewSection
          productId={selectedPC.id}
          productName={selectedPC.name}
        />
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
*/

// ============================================================================
// Example 3: Add Review Prompt to OrderSuccess Page
// ============================================================================

/*
In components/OrderSuccess.tsx:

import { ReviewForm } from './ReviewForm';
import { Card } from './ui/card';

export function OrderSuccess({ orderId, orderDetails }) {
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div className="space-y-8">
      {/* Existing order success content */}
      
      {/* Review Prompt */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
        <h3 className="text-2xl font-bold text-white mb-4">
          How was your experience?
        </h3>
        <p className="text-gray-400 mb-6">
          Share your thoughts to help other customers make informed decisions.
        </p>
        
        <Button
          onClick={() => setShowReviews(!showReviews)}
          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
        >
          {showReviews ? 'Hide Review Forms' : 'Write Reviews'}
        </Button>

        {showReviews && (
          <div className="mt-6 space-y-6">
            {orderDetails.items.map(item => (
              <ReviewForm
                key={item.productId}
                productId={item.productId}
                productName={item.name}
                orderId={orderId}
                onSuccess={() => toast.success(`Thank you for reviewing ${item.name}!`)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
*/

// ============================================================================
// Example 4: Add Review Management to Admin Panel
// ============================================================================

/*
In components/AdminPanel.tsx:

import { ReviewManagement } from './ReviewManagement';
import { MessageSquare } from 'lucide-react';

// Add to the tabs list:
<TabsList className="grid w-full grid-cols-auto gap-2">
  {/* ... existing tabs ... */}
  
  <TabsTrigger value="reviews">
    <MessageSquare className="w-4 h-4 mr-2" />
    Reviews
  </TabsTrigger>
</TabsList>

// Add to the tabs content:
<TabsContent value="reviews" className="space-y-6">
  <ReviewManagement />
</TabsContent>
*/

// ============================================================================
// Example 5: Add Review Summary to Product Cards
// ============================================================================

/*
In components/ProductCard.tsx or similar:

import { StarRating } from './StarRating';
import { useEffect, useState } from 'react';
import { getProductReviews } from '../services/reviews';

export function ProductCard({ product }) {
  const [reviewSummary, setReviewSummary] = useState(null);

  useEffect(() => {
    // Load review summary
    getProductReviews(product.id).then(data => {
      setReviewSummary(data.summary);
    }).catch(() => {
      // Silently fail if reviews not available
    });
  }, [product.id]);

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <img src={product.image} alt={product.name} />
      
      <div className="p-4">
        <h3 className="font-semibold text-white">{product.name}</h3>
        
        {/* Review Summary */}
        {reviewSummary && reviewSummary.totalReviews > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={reviewSummary.averageRating} size="sm" />
            <span className="text-sm text-gray-400">
              ({reviewSummary.totalReviews})
            </span>
          </div>
        )}
        
        <p className="text-2xl font-bold text-sky-400 mt-2">
          £{product.price.toFixed(2)}
        </p>
      </div>
    </Card>
  );
}
*/

// ============================================================================
// Example 6: Add "My Reviews" Section to Member Area
// ============================================================================

/*
In components/MemberArea.tsx:

import { useState, useEffect } from 'react';
import { ReviewCard } from './ReviewCard';
import { useAuth } from '../contexts/AuthContext';

export function MemberArea() {
  const { user } = useAuth();
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserReviews();
    }
  }, [user]);

  const loadUserReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/user-reviews`, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      setMyReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ... existing member area content ... */}

      {/* My Reviews Section */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <h3 className="text-xl font-bold text-white mb-4">My Reviews</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : myReviews.length > 0 ? (
          <div className="space-y-4">
            {myReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            You haven't written any reviews yet
          </div>
        )}
      </Card>
    </div>
  );
}
*/

// ============================================================================
// Example 7: Display Reviews in Shopping Cart Modal (After Item)
// ============================================================================

/*
In components/ShoppingCartModal.tsx:

import { StarRating } from './StarRating';
import { useEffect, useState } from 'react';

export function ShoppingCartModal({ items, isOpen, onClose }) {
  const [reviewSummaries, setReviewSummaries] = useState({});

  useEffect(() => {
    // Load review summaries for cart items
    items.forEach(item => {
      getProductReviews(item.id).then(data => {
        setReviewSummaries(prev => ({
          ...prev,
          [item.id]: data.summary
        }));
      }).catch(() => {});
    });
  }, [items]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shopping Cart</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {items.map(item => {
            const summary = reviewSummaries[item.id];
            
            return (
              <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-lg">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{item.name}</h4>
                  
                  {/* Show review rating */}
                  {summary && summary.totalReviews > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={summary.averageRating} size="sm" />
                      <span className="text-xs text-gray-400">
                        {summary.totalReviews} reviews
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sky-400 font-bold mt-2">£{item.price.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
*/

// ============================================================================
// Quick Tips
// ============================================================================

/*
1. Always pass orderId when available to enable verified purchase badges
2. Use ProductReviewSection for full review display with form
3. Use ReviewList when you want more control over layout
4. Use ReviewForm standalone for dedicated review pages
5. Use StarRating component to show ratings anywhere in your app
6. Check user authentication before showing review forms
7. Load review summaries in parallel to avoid UI blocking
8. Consider lazy loading reviews on large product catalogs
9. Show review count on product listings to build trust
10. Highlight verified purchase reviews to boost credibility
*/

export {}; // Make this a module
