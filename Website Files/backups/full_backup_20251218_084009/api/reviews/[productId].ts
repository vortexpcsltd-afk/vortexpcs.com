/**
 * API: Get Product Reviews
 * GET /api/reviews/[productId]
 *
 * Returns all approved reviews for a specific product
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { productId } = req.query;

    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Get query parameters
    const {
      rating,
      verified,
      sortBy = "recent",
      limit: limitParam = "20",
    } = req.query;

    // Build query
    let reviewsQuery = db
      .collection("reviews")
      .where("productId", "==", productId)
      .where("status", "==", "approved");

    // Filter by rating if specified
    if (rating && typeof rating === "string") {
      const ratingNum = parseFloat(rating);
      if (!isNaN(ratingNum)) {
        reviewsQuery = reviewsQuery.where("rating", "==", ratingNum);
      }
    }

    // Filter by verified if specified
    if (verified === "true") {
      reviewsQuery = reviewsQuery.where("verified", "==", true);
    }

    // Get reviews
    const reviewsSnapshot = await reviewsQuery.get();

    let reviews = reviewsSnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Sort reviews
    switch (sortBy) {
      case "helpful":
        reviews.sort((a: any, b: any) => (b.helpful || 0) - (a.helpful || 0));
        break;
      case "rating-high":
        reviews.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
        break;
      case "rating-low":
        reviews.sort((a: any, b: any) => (a.rating || 0) - (b.rating || 0));
        break;
      case "recent":
      default:
        reviews.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    // Apply limit
    const limitNum = parseInt(limitParam as string, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      reviews = reviews.slice(0, limitNum);
    }

    // Get review summary
    const summaryDoc = await db
      .collection("reviewSummaries")
      .doc(productId)
      .get();

    const summary = summaryDoc.exists
      ? summaryDoc.data()
      : {
          productId,
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          verifiedPurchases: 0,
        };

    return res.status(200).json({
      reviews,
      summary,
      total: reviews.length,
    });
  } catch (error: any) {
    console.error("Get reviews error:", error);
    return res.status(500).json({
      error: "Failed to fetch reviews",
      details: error.message,
    });
  }
}
