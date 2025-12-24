/**
 * API: Mark Review as Helpful/Not Helpful
 * POST /api/reviews/helpful
 *
 * Allows users to vote on review helpfulness
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

    const { reviewId, helpful } = req.body;

    if (!reviewId || typeof helpful !== "boolean") {
      return res.status(400).json({ error: "Invalid request" });
    }

    // Check if user already voted on this review
    const voteDoc = await db
      .collection("reviewVotes")
      .doc(`${userId}_${reviewId}`)
      .get();

    if (voteDoc.exists) {
      const existingVote = voteDoc.data();

      // If same vote, do nothing
      if (existingVote?.helpful === helpful) {
        return res.status(200).json({ message: "Vote already recorded" });
      }

      // Change vote
      await db.collection("reviewVotes").doc(`${userId}_${reviewId}`).update({
        helpful,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update review counts
      const reviewRef = db.collection("reviews").doc(reviewId);
      if (helpful) {
        // Changed from not helpful to helpful
        await reviewRef.update({
          helpful: FieldValue.increment(1),
          notHelpful: FieldValue.increment(-1),
        });
      } else {
        // Changed from helpful to not helpful
        await reviewRef.update({
          helpful: FieldValue.increment(-1),
          notHelpful: FieldValue.increment(1),
        });
      }

      return res.status(200).json({ message: "Vote updated" });
    }

    // New vote
    await db.collection("reviewVotes").doc(`${userId}_${reviewId}`).set({
      reviewId,
      userId,
      helpful,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update review count
    const reviewRef = db.collection("reviews").doc(reviewId);
    await reviewRef.update({
      [helpful ? "helpful" : "notHelpful"]: FieldValue.increment(1),
    });

    return res.status(200).json({ message: "Vote recorded" });
  } catch (error: any) {
    console.error("Review helpful vote error:", error);
    return res.status(500).json({
      error: "Failed to record vote",
      details: error.message,
    });
  }
}
