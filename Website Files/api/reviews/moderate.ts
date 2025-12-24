/**
 * API: Moderate Review (Admin Only)
 * POST /api/reviews/moderate
 *
 * Allows admins to approve, reject, or delete reviews
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth } from "../middleware/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify authentication
    const userId = await verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user is admin
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userProfile = userDoc.data();
    if (userProfile?.role?.toLowerCase() !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { reviewId, action, moderatorNote } = req.body;

    if (!reviewId || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["approve", "reject", "delete"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const reviewRef = db.collection("reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    const reviewData = reviewDoc.data();

    // Handle different actions
    if (action === "delete") {
      await reviewRef.delete();

      // Update product review summary
      if (reviewData?.productId) {
        await updateProductReviewSummary(reviewData.productId);
      }

      return res.status(200).json({ message: "Review deleted" });
    }

    // Approve or reject
    const newStatus = action === "approve" ? "approved" : "rejected";
    await reviewRef.update({
      status: newStatus,
      moderatorNote: moderatorNote || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update product review summary if status changed to approved
    if (newStatus === "approved" && reviewData?.productId) {
      await updateProductReviewSummary(reviewData.productId);
    }

    return res.status(200).json({
      message: `Review ${newStatus}`,
      reviewId,
    });
  } catch (error: any) {
    console.error("Moderate review error:", error);
    return res.status(500).json({
      error: "Failed to moderate review",
      details: error.message,
    });
  }
}

/**
 * Update product review summary statistics
 */
async function updateProductReviewSummary(productId: string) {
  try {
    const reviewsSnapshot = await db
      .collection("reviews")
      .where("productId", "==", productId)
      .where("status", "==", "approved")
      .get();

    const reviews = reviewsSnapshot.docs.map((doc) => doc.data());
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      // Remove summary if no approved reviews
      await db.collection("reviewSummaries").doc(productId).delete();
      return;
    }

    const averageRating =
      reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
      totalReviews;

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      const rating = Math.floor(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
      }
    });

    const verifiedPurchases = reviews.filter((r) => r.verified).length;

    const summary = {
      productId,
      averageRating,
      totalReviews,
      ratingDistribution,
      verifiedPurchases,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db
      .collection("reviewSummaries")
      .doc(productId)
      .set(summary, { merge: true });
  } catch (error) {
    console.error("Error updating review summary:", error);
  }
}
