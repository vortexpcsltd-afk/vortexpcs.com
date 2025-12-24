/**
 * API: Get All Reviews (Admin Only)
 * GET /api/admin/reviews
 *
 * Returns all reviews with optional status filtering
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth } from "../middleware/auth";
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

    // Get query parameters
    const { status, limit: limitParam = "100" } = req.query;

    // Build query
    let reviewsQuery = db.collection("reviews").orderBy("createdAt", "desc");

    // Filter by status if specified
    if (status && status !== "all" && typeof status === "string") {
      reviewsQuery = reviewsQuery.where("status", "==", status) as any;
    }

    // Apply limit
    const limitNum = parseInt(limitParam as string, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      reviewsQuery = reviewsQuery.limit(limitNum) as any;
    }

    // Get reviews
    const reviewsSnapshot = await reviewsQuery.get();

    const reviews = reviewsSnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Get stats
    const stats = {
      total: reviews.length,
      pending: reviews.filter((r: any) => r.status === "pending").length,
      approved: reviews.filter((r: any) => r.status === "approved").length,
      rejected: reviews.filter((r: any) => r.status === "rejected").length,
      verified: reviews.filter((r: any) => r.verified).length,
    };

    return res.status(200).json({
      reviews,
      stats,
      total: reviews.length,
    });
  } catch (error: any) {
    console.error("Get admin reviews error:", error);
    return res.status(500).json({
      error: "Failed to fetch reviews",
      details: error.message,
    });
  }
}
