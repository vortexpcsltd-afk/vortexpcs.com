/**
 * API: Submit Product Review
 * POST /api/reviews/submit
 *
 * Allows authenticated users to submit reviews for products they have purchased
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth } from "../middleware/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminDb = getAdminFirestore();

interface ReviewSubmission {
  productId: string;
  productName: string;
  rating: number;
  title: string;
  comment: string;
  orderId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify authentication
    const userId = await verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user profile
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userProfile = userDoc.data();

    // Validate input
    const {
      productId,
      productName,
      rating,
      title,
      comment,
      orderId,
    }: ReviewSubmission = req.body;

    if (!productId || !productName || !rating || !title || !comment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate rating (0.5 to 5.0 in 0.5 increments)
    if (rating < 0.5 || rating > 5 || rating % 0.5 !== 0) {
      return res.status(400).json({
        error: "Rating must be between 0.5 and 5.0 in 0.5 increments",
      });
    }

    // Validate title and comment length
    if (title.length < 3 || title.length > 100) {
      return res
        .status(400)
        .json({ error: "Title must be between 3 and 100 characters" });
    }

    if (comment.length < 10 || comment.length > 2000) {
      return res
        .status(400)
        .json({ error: "Comment must be between 10 and 2000 characters" });
    }

    // Check if user purchased this product
    let verified = false;
    let verifiedOrderId = orderId;

    if (orderId) {
      const orderDoc = await adminDb.collection("orders").doc(orderId).get();
      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        if (orderData?.userId === userId) {
          // Check if product is in order
          const items = orderData.items || [];
          verified = items.some(
            (item: any) => item.productId === productId || item.id === productId
          );
        }
      }
    }

    // If no orderId provided, search user's orders for this product
    if (!verified) {
      const ordersQuery = query(
        adminDb.collection("orders") as any,
        where("userId", "==", userId)
      ) as any;
      const ordersSnapshot = await ordersQuery.get();

      for (const doc of ordersSnapshot.docs) {
        const orderData = doc.data();
        const items = orderData.items || [];
        const hasProduct = items.some(
          (item: any) => item.productId === productId || item.id === productId
        );

        if (hasProduct) {
          verified = true;
          verifiedOrderId = doc.id;
          break;
        }
      }
    }

    // Check if user already reviewed this product
    const existingReviewQuery = query(
      adminDb.collection("reviews") as any,
      where("userId", "==", userId),
      where("productId", "==", productId)
    ) as any;
    const existingReviewSnapshot = await existingReviewQuery.get();

    if (!existingReviewSnapshot.empty) {
      return res
        .status(409)
        .json({ error: "You have already reviewed this product" });
    }

    // Create review
    const review = {
      productId,
      productName,
      userId,
      userName: userProfile?.displayName || "Anonymous",
      userEmail: userProfile?.email || "",
      rating,
      title: title.trim(),
      comment: comment.trim(),
      verified,
      helpful: 0,
      notHelpful: 0,
      status: "approved", // Auto-approve reviews (can change to "pending" for moderation)
      createdAt: Timestamp.now(),
      orderId: verifiedOrderId || null,
    };

    const reviewRef = await adminDb.collection("reviews").add(review);

    // Update product review summary
    await updateProductReviewSummary(productId);

    return res.status(201).json({
      success: true,
      reviewId: reviewRef.id,
      verified,
      message: "Review submitted successfully",
    });
  } catch (error: any) {
    console.error("Submit review error:", error);
    return res.status(500).json({
      error: "Failed to submit review",
      details: error.message,
    });
  }
}

/**
 * Update product review summary statistics
 */
async function updateProductReviewSummary(productId: string) {
  try {
    const reviewsQuery = query(
      adminDb.collection("reviews") as any,
      where("productId", "==", productId),
      where("status", "==", "approved")
    ) as any;
    const reviewsSnapshot = await reviewsQuery.get();

    const reviews = reviewsSnapshot.docs.map((doc: any) => doc.data());
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return;
    }

    const averageRating =
      reviews.reduce(
        (sum: number, review: any) => sum + (review.rating || 0),
        0
      ) / totalReviews;

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review: any) => {
      const rating = Math.floor(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
      }
    });

    const verifiedPurchases = reviews.filter((r: any) => r.verified).length;

    const summary = {
      productId,
      averageRating,
      totalReviews,
      ratingDistribution,
      verifiedPurchases,
      updatedAt: Timestamp.now(),
    };

    // Use productId as document ID for easy lookup
    await adminDb
      .collection("reviewSummaries")
      .doc(productId)
      .set(summary, { merge: true });
  } catch (error) {
    console.error("Error updating review summary:", error);
  }
}
