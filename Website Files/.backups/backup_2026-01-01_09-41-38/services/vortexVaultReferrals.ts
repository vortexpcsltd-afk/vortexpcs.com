/**
 * BULLETPROOF Vortex Vault Referral System
 * Simple, reliable, production-ready referral tracking
 *
 * FLOW:
 * 1. Customer visits site with ?ref=CODE → stored in localStorage
 * 2. Customer signs up → referral link created, 50 points awarded to new user
 * 3. Referrer sees "friend joined" with pending status in member area
 * 4. Friend makes first purchase → referrer gets 100 points + email notification
 */

import { logger } from "./logger";
import { db } from "../config/firebase";
import { BONUS_POINTS } from "./vortexVault";

// ============================================================================
// TYPES
// ============================================================================

export interface ReferralData {
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  status: "pending" | "completed";
  createdAt: Date;
  completedAt?: Date;
  orderId?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pointsEarned: number;
  totalClicks: number; // Track how many times the referral link was clicked
  conversionRate: number; // Clicks → signups conversion percentage
  referrals: Array<{
    status: "pending" | "completed";
    displayName: string;
    createdAt: Date;
  }>;
}

// ============================================================================
// STEP 1: URL HANDLING - Capture referral code from URL
// ============================================================================

/**
 * Extract referral code from URL parameter
 * Supports ?ref=CODE format
 */
export function getReferralCodeFromURL(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
}

/**
 * Store referral code in localStorage
 * Survives page navigation and browser close
 */
export function storeReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("vortex_referral_code", code.toUpperCase());
    logger.info("Stored referral code", { code: code.toUpperCase() });
  } catch (e) {
    logger.warn("Failed to store referral code", { error: e });
  }
}

/**
 * Retrieve stored referral code
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const code = localStorage.getItem("vortex_referral_code");
    return code;
  } catch (e) {
    logger.warn("Failed to retrieve referral code", { error: e });
    return null;
  }
}

/**
 * Clear stored referral code
 * Called after successful signup with referral
 */
export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("vortex_referral_code");
  } catch (e) {
    logger.warn("Failed to clear referral code", { error: e });
  }
}

// ============================================================================
// STEP 2: REFERRAL CODE GENERATION
// ============================================================================

/**
 * Generate unique referral code for user
 * Format: ABC-XYZ789 (3-letter name prefix + 6-char user ID suffix)
 * Example: "JOHN" + "uid123xyz" → "JOH-23XYZ"
 */
export function generateReferralCode(
  displayName: string,
  userId: string
): string {
  const namePrefix = (displayName || "USER")
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");

  const idSuffix = userId.substring(userId.length - 6).toUpperCase();

  return `${namePrefix}-${idSuffix}`;
}

/**
 * Generate shareable referral link
 */
export function getReferralLink(referralCode: string): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.vortexpcs.com";
  return `${baseUrl}?ref=${referralCode}`;
}

// ============================================================================
// STEP 3: FIND REFERRER BY CODE
// ============================================================================

/**
 * Find user ID by referral code
 * Returns null if code doesn't exist or is invalid
 */
export async function findReferrerByCode(
  referralCode: string
): Promise<string | null> {
  if (!db || !referralCode) {
    return null;
  }

  try {
    const { collection, query, where, getDocs } = await import(
      "firebase/firestore"
    );

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("referralCode", "==", referralCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.warn("No user found with referral code", { code: referralCode });
      return null;
    }

    return snapshot.docs[0].id;
  } catch (error) {
    logger.error("Error finding referrer by code", {
      error,
      code: referralCode,
    });
    return null;
  }
}

// ============================================================================
// STEP 4: RECORD REFERRAL ON SIGNUP
// ============================================================================

/**
 * Record referral relationship when new user signs up
 * Called during signup if user has stored referral code
 * This marks the referral as PENDING (awaiting first purchase)
 */
export async function recordReferral(
  referrerId: string,
  referredUserId: string,
  referralCode: string
): Promise<boolean> {
  if (!db) {
    logger.warn("Firebase not initialized, cannot record referral");
    return false;
  }

  // Prevent self-referral
  if (referrerId === referredUserId) {
    logger.warn("Self-referral attempt prevented", { userId: referredUserId });
    return false;
  }

  try {
    const { collection, addDoc, serverTimestamp, getDoc, doc } = await import(
      "firebase/firestore"
    );

    const referralsRef = collection(db, "vortex_vault_referrals");
    await addDoc(referralsRef, {
      referrerId,
      referredUserId,
      referralCode,
      status: "pending", // PENDING - waiting for first purchase
      createdAt: serverTimestamp(),
    });

    logger.info("Referral recorded", {
      referrer: referrerId,
      referred: referredUserId,
      code: referralCode,
    });

    // Send email notification to referrer about signup
    try {
      const referrerDocRef = doc(db, "users", referrerId);
      const referrerSnapshot = await getDoc(referrerDocRef);

      if (referrerSnapshot.exists()) {
        const referrerData = referrerSnapshot.data();
        const referrerEmail = referrerData?.email;
        const referrerFirstName = referrerData?.firstName;

        if (referrerEmail) {
          const referredDocRef = doc(db, "users", referredUserId);
          const referredSnapshot = await getDoc(referredDocRef);
          const referredData = referredSnapshot.data();
          const referredUserName =
            referredData?.displayName || referredData?.email || "Your friend";

          const { sendVortexVaultReferralSignupEmail } = await import(
            "./vortexVaultEmails"
          );

          await sendVortexVaultReferralSignupEmail({
            userId: referrerId,
            email: referrerEmail,
            firstName: referrerFirstName,
            referredUserName,
          });
        }
      }
    } catch (emailError) {
      logger.warn("Failed to send referral signup notification email", {
        error: emailError,
        referrerId,
      });
      // Don't fail the entire referral recording if email fails
    }

    return true;
  } catch (error) {
    logger.error("Failed to record referral", {
      error,
      referrer: referrerId,
      referred: referredUserId,
    });
    return false;
  }
}

// ============================================================================
// STEP 5: PROCESS REFERRAL BONUS ON FIRST PURCHASE
// ============================================================================

/**
 * Award referral bonus when referred customer makes first purchase
 * This is called from payment webhooks (Stripe, PayPal, Bank Transfer)
 * 1. Finds the pending referral record
 * 2. Awards 100 points to the referrer
 * 3. Marks referral as completed
 * 4. Sends email notification to referrer
 */
export async function processReferralBonus(
  buyerUserId: string,
  orderId: string
): Promise<void> {
  if (!db) {
    logger.warn("Firebase not initialized, skipping referral bonus processing");
    return;
  }

  try {
    const {
      collection,
      query,
      where,
      getDocs,
      doc,
      updateDoc,
      getDoc,
      serverTimestamp,
    } = await import("firebase/firestore");

    // Step 1: Find pending referral for this buyer
    const referralsRef = collection(db, "vortex_vault_referrals");
    const q = query(
      referralsRef,
      where("referredUserId", "==", buyerUserId),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.debug("No pending referral for buyer", { buyerUserId });
      return; // No referral - this is fine
    }

    const referralDocId = snapshot.docs[0].id;
    const referralData = snapshot.docs[0].data() as ReferralData;
    const referrerId = referralData.referrerId;

    // Step 1.5: Count existing completed referrals to determine tier bonus
    const completedQuery = query(
      referralsRef,
      where("referrerId", "==", referrerId),
      where("status", "==", "completed")
    );
    const completedSnapshot = await getDocs(completedQuery);
    const completedCount = completedSnapshot.docs.length;

    // Calculate tier-based bonus (this will be their Nth completed referral)
    // 1-4: 100pts, 5-9: 150pts, 10+: 200pts
    const referralNumber = completedCount + 1;
    let bonusPoints: number;
    if (referralNumber >= 10) {
      bonusPoints = 200;
    } else if (referralNumber >= 5) {
      bonusPoints = 150;
    } else {
      bonusPoints = 100;
    }

    logger.info("Calculated tier-based referral bonus", {
      referrerId,
      referralNumber,
      bonusPoints,
    });

    // Step 2: Award points to referrer via awardReferralBonus
    const { awardReferralBonus } = await import("./vortexVault");
    const result = await awardReferralBonus(
      referrerId,
      buyerUserId,
      orderId,
      bonusPoints
    );

    if (!result.success) {
      logger.warn("Failed to award referral bonus", {
        referrer: referrerId,
        buyer: buyerUserId,
      });
      return; // Don't mark as complete if bonus failed
    }

    // Step 3: Mark referral as completed
    await updateDoc(doc(db, "vortex_vault_referrals", referralDocId), {
      status: "completed",
      completedAt: serverTimestamp(),
      orderId,
    });

    logger.info("Referral bonus awarded and recorded", {
      referrerId,
      buyerUserId,
      orderId,
      points: bonusPoints,
      referralNumber,
    });

    // Step 4: Send notification email to referrer
    try {
      const referrerDoc = await getDoc(doc(db, "users", referrerId));
      if (referrerDoc.exists()) {
        const referrerData = referrerDoc.data();
        const { triggerVaultReferralBonusEmail } = await import(
          "./vortexVaultEmailTriggers"
        );

        await triggerVaultReferralBonusEmail(
          {
            userId: referrerId,
            email: referrerData.email,
            firstName: referrerData.displayName?.split(" ")[0] || "Member",
            lastName:
              referrerData.displayName?.split(" ").slice(1).join(" ") || "",
          },
          referrerData.displayName || "Member",
          bonusPoints
        );

        logger.info("Referral bonus notification email sent", {
          referrerId,
          email: referrerData.email,
        });
      }
    } catch (emailError) {
      logger.warn("Failed to send referral notification email", {
        error: emailError,
        referrerId,
      });
      // Don't fail the whole process if email fails
    }
  } catch (error) {
    logger.error("Error processing referral bonus", {
      error,
      buyerUserId,
      orderId,
    });
  }
}

// ============================================================================
// STEP 6: DISPLAY REFERRAL STATS IN MEMBER AREA
// ============================================================================

/**
 * Get referral statistics for user's member area display
 * Shows:
 * - Total referrals
 * - Completed referrals (made purchase)
 * - Points earned from referrals
 * - List of referred friends with status
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const emptyStats: ReferralStats = {
    totalReferrals: 0,
    completedReferrals: 0,
    pointsEarned: 0,
    totalClicks: 0,
    conversionRate: 0,
    referrals: [],
  };

  if (!db || !userId) {
    return emptyStats;
  }

  try {
    const { collection, query, where, getDocs, doc, getDoc } = await import(
      "firebase/firestore"
    );

    // Get user's referral code first
    let referralCode = "";
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        referralCode = userDoc.data().referralCode || "";
      }
    } catch {
      // Continue without referral code
    }

    // Get all referrals where this user is the referrer
    const referralsRef = collection(db, "vortex_vault_referrals");
    const q = query(referralsRef, where("referrerId", "==", userId));
    const snapshot = await getDocs(q);

    // Get referral click count from analytics
    let clickCount = 0;
    if (referralCode) {
      try {
        const analyticsRef = collection(db, "analytics_events");
        const clickQuery = query(
          analyticsRef,
          where("event", "==", "referral_link_clicked"),
          where("properties.referralCode", "==", referralCode)
        );
        const clickSnapshot = await getDocs(clickQuery);
        clickCount = clickSnapshot.docs.length;
      } catch {
        // Analytics query failed, continue with 0 clicks
      }
    }

    if (snapshot.empty) {
      return { ...emptyStats, totalClicks: clickCount }; // No referrals yet but may have clicks
    }

    // Get display names for all referred users
    const referrals = await Promise.all(
      snapshot.docs.map(async (referralDoc) => {
        const data = referralDoc.data() as ReferralData;

        // Try to get referred user's display name
        let displayName = "Friend";
        try {
          const userDoc = await getDoc(doc(db, "users", data.referredUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            displayName =
              userData.displayName || userData.email?.split("@")[0] || "Friend";
          }
        } catch {
          // Use default if fetch fails
        }

        return {
          status: data.status,
          displayName,
          createdAt:
            data.createdAt instanceof Date ? data.createdAt : new Date(),
        };
      })
    );

    // Calculate stats
    const completed = referrals.filter((r) => r.status === "completed");
    const conversionRate =
      clickCount > 0 ? (referrals.length / clickCount) * 100 : 0;

    return {
      totalReferrals: referrals.length,
      completedReferrals: completed.length,
      pointsEarned: completed.length * BONUS_POINTS.REFERRAL_COMPLETION,
      totalClicks: clickCount,
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
      referrals,
    };
  } catch (error) {
    logger.error("Failed to get referral stats", { error, userId });
    return emptyStats;
  }
}

/**
 * Cleanup expired pending referrals (older than 90 days)
 * @returns Number of expired referrals deleted
 */
export async function cleanupExpiredReferrals(): Promise<number> {
  if (!db) {
    logger.warn("Firestore not initialized - cannot cleanup expired referrals");
    return 0;
  }

  try {
    const { collection, query, where, getDocs, deleteDoc, Timestamp } =
      await import("firebase/firestore");

    // Calculate expiration date (90 days ago)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 90);
    const expirationTimestamp = Timestamp.fromDate(expirationDate);

    // Query pending referrals older than 90 days
    const referralsRef = collection(db, "vortex_vault_referrals");
    const expiredQuery = query(
      referralsRef,
      where("status", "==", "pending"),
      where("createdAt", "<", expirationTimestamp)
    );

    const snapshot = await getDocs(expiredQuery);

    if (snapshot.empty) {
      logger.info("No expired referrals to cleanup");
      return 0;
    }

    // Delete expired referrals
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    const deletedCount = snapshot.docs.length;
    logger.info("Cleaned up expired referrals", { count: deletedCount });

    return deletedCount;
  } catch (error) {
    logger.error("Failed to cleanup expired referrals", { error });
    return 0;
  }
}
