/**
 * Authentication Middleware for API Routes
 * Verifies Firebase Auth tokens
 */

import type { VercelRequest } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

/**
 * Verify authentication token and return user ID
 * Returns null if not authenticated
 */
export async function verifyAuth(req: VercelRequest): Promise<string | null> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return null;
    }

    // Verify token with Firebase
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    return decodedToken.uid;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

/**
 * Verify admin role from Firebase token
 * Returns user info if admin, null otherwise
 */
export async function verifyAdmin(req: VercelRequest): Promise<{
  uid: string;
  email: string;
  role: string;
} | null> {
  try {
    const userId = await verifyAuth(req);
    if (!userId) {
      return null;
    }

    // Check if user has admin role in Firestore
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    const role = userData?.role?.toLowerCase();

    // Check for admin role or whitelisted email
    const email = userData?.email || "";
    const isAdmin =
      role === "admin" ||
      email === "admin@vortexpcs.com" ||
      email === "info@vortexpcs.com";

    if (!isAdmin) {
      return null;
    }

    return {
      uid: userId,
      email,
      role: userData?.role || "admin",
    };
  } catch (error) {
    console.error("Admin verification error:", error);
    return null;
  }
}
