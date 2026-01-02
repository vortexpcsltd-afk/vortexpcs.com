/**
 * Vortex Vault - Customer Loyalty and Rewards System
 * Customers earn 1 point per £10 spent (0.1 points per £1)
 * 10 points = £1 in value
 * Redeem when balance reaches 50 points (£5 minimum)
 */

import { logger } from "./logger";
import {
  getUserVortexVaultAccount,
  updateVortexVaultAccount,
  createVortexVaultTransaction,
  getVortexVaultTransactions,
} from "./vortexVaultDatabase";

// Constants
export const POINTS_PER_POUND = 0.1; // 1 point per £10 spent
export const POINTS_PER_POUND_VALUE = 10; // 10 points = £1
export const MINIMUM_REDEMPTION_POINTS = 50; // £5 worth
export const POINTS_EXPIRY_MONTHS = 18;

export const BONUS_POINTS = {
  SIGNUP: 50,
  VERIFIED_REVIEW: 25,
  REFERRAL_COMPLETION: 100,
};

// First order discount for new customers
export const FIRST_ORDER_DISCOUNT = {
  PERCENT: 10,
  CODE_PREFIX: "WELCOME10",
  EXPIRES_DAYS: 30,
};

export type VortexVaultTierId = "bronze" | "silver" | "gold";

export interface VortexVaultTier {
  id: VortexVaultTierId;
  name: string;
  minPoints: number;
  perks: string[];
}

export const VORTEX_VAULT_TIERS: VortexVaultTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    minPoints: 0,
    perks: ["Welcome 50 pts", "Member-only emails", "Birthday surprise coupon"],
  },
  {
    id: "silver",
    name: "Silver",
    minPoints: 200,
    perks: [
      "Free standard shipping on £50+",
      "Monthly Vault Code",
      "Access to Seasonal Vault Drops",
      "Early access to select sales",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    minPoints: 1000,
    perks: [
      "All Silver perks",
      "Priority access to Seasonal Vault Drops",
      "Quarterly exclusive giveaways",
      "48-hour early access to major sales",
      "Priority support",
      "Occasional surprise point bonuses",
    ],
  },
];

export function getTierForPoints(points: number): VortexVaultTier {
  const sorted = [...VORTEX_VAULT_TIERS].sort(
    (a, b) => b.minPoints - a.minPoints
  );
  return (
    sorted.find((tier) => points >= tier.minPoints) || VORTEX_VAULT_TIERS[0]
  );
}

export function getNextTierProgress(points: number): {
  currentTier: VortexVaultTier;
  nextTier: VortexVaultTier | null;
  pointsToNextTier: number;
  progressToNextTier: number;
} {
  const currentTier = getTierForPoints(points);
  const tiersByMin = [...VORTEX_VAULT_TIERS].sort(
    (a, b) => a.minPoints - b.minPoints
  );
  const currentIndex = tiersByMin.findIndex((t) => t.id === currentTier.id);
  const nextTier =
    currentIndex >= 0 && currentIndex < tiersByMin.length - 1
      ? tiersByMin[currentIndex + 1]
      : null;
  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      pointsToNextTier: 0,
      progressToNextTier: 1,
    };
  }

  const span = nextTier.minPoints - currentTier.minPoints;
  const gainedWithinTier = points - currentTier.minPoints;
  const progressToNextTier =
    span > 0 ? Math.min(1, Math.max(0, gainedWithinTier / span)) : 1;
  const pointsToNextTier = Math.max(0, nextTier.minPoints - points);

  return {
    currentTier,
    nextTier,
    pointsToNextTier,
    progressToNextTier,
  };
}

export function getNextRedeemMilestone(points: number): {
  pointsToNextRedeem: number;
  nextRedeemValue: number;
} {
  if (points < MINIMUM_REDEMPTION_POINTS) {
    const pointsToNextRedeem = MINIMUM_REDEMPTION_POINTS - points;
    return {
      pointsToNextRedeem,
      nextRedeemValue: calculatePointsValue(MINIMUM_REDEMPTION_POINTS),
    };
  }

  const remainder = points % MINIMUM_REDEMPTION_POINTS;
  const pointsToNextRedeem =
    remainder === 0 ? 0 : MINIMUM_REDEMPTION_POINTS - remainder;
  const nextRedeemValue = calculatePointsValue(points + pointsToNextRedeem);

  return {
    pointsToNextRedeem,
    nextRedeemValue,
  };
}

/**
 * Calculate points earned from a purchase
 */
export function calculatePointsFromPurchase(amountInPounds: number): number {
  return Math.floor(amountInPounds * POINTS_PER_POUND);
}

/**
 * Calculate monetary value of points
 */
export function calculatePointsValue(points: number): number {
  return points / POINTS_PER_POUND_VALUE;
}

/**
 * Check if account is eligible for redemption
 */
export function isEligibleForRedemption(currentBalance: number): boolean {
  return currentBalance >= MINIMUM_REDEMPTION_POINTS;
}

/**
 * Award purchase points to customer
 */
export async function awardPurchasePoints(
  userId: string,
  orderId: string,
  orderTotal: number
): Promise<{
  success: boolean;
  pointsAwarded: number;
  newBalance: number;
  message: string;
}> {
  try {
    logger.info("Awarding purchase points", { userId, orderId, orderTotal });

    // Calculate points
    const pointsAwarded = calculatePointsFromPurchase(orderTotal);

    // Get current account
    const account = await getUserVortexVaultAccount(userId);
    const currentBalance = account?.currentBalance || 0;
    const newBalance = currentBalance + pointsAwarded;
    const previousTier = getTierForPoints(currentBalance);

    // Update account
    await updateVortexVaultAccount(userId, {
      currentBalance: newBalance,
      lifetimePoints: (account?.lifetimePoints || 0) + pointsAwarded,
      lastActivityDate: new Date(),
    });

    // Record transaction
    await createVortexVaultTransaction({
      userId,
      orderId,
      type: "purchase",
      pointsAmount: pointsAwarded,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: `Purchase reward: ${orderTotal.toFixed(
        2
      )} × ${POINTS_PER_POUND} pts/£`,
    });

    logger.info("Purchase points awarded", {
      userId,
      pointsAwarded,
      newBalance,
    });

    // Check for tier upgrade and trigger email
    try {
      const newTier = getTierForPoints(newBalance);
      if (previousTier && previousTier.id !== newTier.id) {
        logger.info("Tier upgrade detected", {
          userId,
          previousTier: previousTier.id,
          newTier: newTier.id,
        });

        // Note: Tier upgrade email requires user email from calling context
        // This should be handled by the API layer that has access to user data
        logger.info("Tier upgrade occurred", {
          from: previousTier.id,
          to: newTier.id,
        });
      }
    } catch (tierErr) {
      logger.error("Error checking tier upgrade on purchase", tierErr);
      // Don't fail the award if tier check fails
    }

    return {
      success: true,
      pointsAwarded,
      newBalance,
      message: `${pointsAwarded} points added to your Vortex Vault!`,
    };
  } catch (error) {
    logger.error("Error awarding purchase points:", error);
    return {
      success: false,
      pointsAwarded: 0,
      newBalance: 0,
      message: "Failed to award points",
    };
  }
}

/**
 * Generate first order discount code for new users
 */
export async function generateFirstOrderDiscount(
  userId: string,
  _email: string
): Promise<{ code: string; discountPercent: number; expiresAt: Date } | null> {
  try {
    // Check if user already has orders
    const { getUserOrders } = await import("./database");
    const orders = await getUserOrders(userId);

    if (orders && orders.length > 0) {
      logger.info("User already has orders, no first order discount", {
        userId,
      });
      return null;
    }

    // Generate unique code
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${FIRST_ORDER_DISCOUNT.CODE_PREFIX}-${timestamp}-${randomStr}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + FIRST_ORDER_DISCOUNT.EXPIRES_DAYS);

    logger.info("Generated first order discount", { userId, code, expiresAt });

    return {
      code,
      discountPercent: FIRST_ORDER_DISCOUNT.PERCENT,
      expiresAt,
    };
  } catch (error) {
    logger.error("Error generating first order discount:", error);
    return null;
  }
}

/**
 * Award signup bonus
 */
export async function awardSignupBonus(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info("awardSignupBonus: Starting", { userId });

    const account = await getUserVortexVaultAccount(userId);
    logger.info("awardSignupBonus: Got/created account", {
      userId,
      accountExists: !!account,
      currentBalance: account?.currentBalance,
    });

    // Critical: Ensure account was created
    if (!account) {
      const err = "Vault account creation failed";
      logger.error("awardSignupBonus: " + err, { userId });
      throw new Error(err);
    }

    const currentBalance = account.currentBalance || 0;
    const newBalance = currentBalance + BONUS_POINTS.SIGNUP;
    const previousTier = getTierForPoints(currentBalance);

    logger.info("awardSignupBonus: Updating account balance", {
      userId,
      currentBalance,
      newBalance,
      pointsToAdd: BONUS_POINTS.SIGNUP,
    });

    await updateVortexVaultAccount(userId, {
      currentBalance: newBalance,
      lifetimePoints: (account?.lifetimePoints || 0) + BONUS_POINTS.SIGNUP,
      lastActivityDate: new Date(),
    });

    logger.info("awardSignupBonus: Account balance updated", {
      userId,
      newBalance,
    });

    logger.info("awardSignupBonus: Creating transaction", { userId });

    await createVortexVaultTransaction({
      userId,
      type: "bonus",
      pointsAmount: BONUS_POINTS.SIGNUP,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: "Welcome to Vortex Vault! Signup bonus",
    });

    logger.info("awardSignupBonus: Transaction created", { userId });

    // Check for tier upgrade and trigger email (unlikely but possible)
    try {
      const newTier = getTierForPoints(newBalance);
      if (previousTier && previousTier.id !== newTier.id) {
        logger.info("Tier upgrade detected on signup", {
          userId,
          previousTier: previousTier.id,
          newTier: newTier.id,
        });
      }
    } catch (tierErr) {
      logger.error("Error checking tier upgrade on signup", tierErr);
      // Don't fail the award if tier check fails
    }

    logger.info("awardSignupBonus: Completed successfully", {
      userId,
      message: `${BONUS_POINTS.SIGNUP} welcome points added!`,
    });

    return {
      success: true,
      message: `Welcome! ${BONUS_POINTS.SIGNUP} welcome points added!`,
      pointsAwarded: BONUS_POINTS.SIGNUP,
      newBalance: newBalance,
    };
  } catch (error) {
    logger.error("awardSignupBonus: Failed with error", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: "Failed to award signup bonus",
    };
  }
}

/**
 * Award review bonus
 */
export async function awardReviewBonus(
  userId: string,
  reviewId: string
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info("Awarding review bonus", { userId, reviewId });

    const account = await getUserVortexVaultAccount(userId);
    const currentBalance = account?.currentBalance || 0;
    const newBalance = currentBalance + BONUS_POINTS.VERIFIED_REVIEW;

    await updateVortexVaultAccount(userId, {
      currentBalance: newBalance,
      lifetimePoints:
        (account?.lifetimePoints || 0) + BONUS_POINTS.VERIFIED_REVIEW,
      lastActivityDate: new Date(),
    });

    await createVortexVaultTransaction({
      userId,
      type: "review",
      pointsAmount: BONUS_POINTS.VERIFIED_REVIEW,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: `Verified review bonus (Review: ${reviewId})`,
    });

    logger.info("Review bonus awarded", {
      userId,
      points: BONUS_POINTS.VERIFIED_REVIEW,
    });

    return {
      success: true,
      message: `Thank you for your review! ${BONUS_POINTS.VERIFIED_REVIEW} points earned!`,
    };
  } catch (error) {
    logger.error("Error awarding review bonus:", error);
    return {
      success: false,
      message: "Failed to award review bonus",
    };
  }
}

/**
 * Award referral bonus when referred customer completes purchase
 */
export async function awardReferralBonus(
  referrerUserId: string,
  referredUserId: string,
  orderId: string,
  bonusPoints: number = BONUS_POINTS.REFERRAL_COMPLETION
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info("Awarding referral bonus", {
      referrerUserId,
      referredUserId,
      orderId,
      bonusPoints,
    });

    const account = await getUserVortexVaultAccount(referrerUserId);
    const currentBalance = account?.currentBalance || 0;
    const newBalance = currentBalance + bonusPoints;

    await updateVortexVaultAccount(referrerUserId, {
      currentBalance: newBalance,
      lifetimePoints: (account?.lifetimePoints || 0) + bonusPoints,
      lastActivityDate: new Date(),
    });

    await createVortexVaultTransaction({
      userId: referrerUserId,
      type: "referral",
      pointsAmount: bonusPoints,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: `Referral bonus - friend completed purchase (Order: ${orderId})`,
    });

    logger.info("Referral bonus awarded", {
      referrerUserId,
      points: bonusPoints,
    });

    return {
      success: true,
      message: `Your referral completed a purchase! ${bonusPoints} bonus points!`,
    };
  } catch (error) {
    logger.error("Error awarding referral bonus:", error);
    return {
      success: false,
      message: "Failed to award referral bonus",
    };
  }
}

/**
 * Redeem points for discount
 */
export async function redeemPoints(
  userId: string,
  pointsToRedeem: number
): Promise<{
  success: boolean;
  discountAmount: number;
  newBalance: number;
  message: string;
}> {
  try {
    logger.info("Redeeming points", { userId, pointsToRedeem });

    // Validate minimum redemption
    if (pointsToRedeem < MINIMUM_REDEMPTION_POINTS) {
      return {
        success: false,
        discountAmount: 0,
        newBalance: 0,
        message: `Minimum redemption is ${MINIMUM_REDEMPTION_POINTS} points (£${calculatePointsValue(
          MINIMUM_REDEMPTION_POINTS
        ).toFixed(2)})`,
      };
    }

    // Get account
    const account = await getUserVortexVaultAccount(userId);
    if (!account || account.currentBalance < pointsToRedeem) {
      return {
        success: false,
        discountAmount: 0,
        newBalance: account?.currentBalance || 0,
        message: "Insufficient points balance",
      };
    }

    const discountAmount = calculatePointsValue(pointsToRedeem);
    const newBalance = account.currentBalance - pointsToRedeem;

    // Update account
    await updateVortexVaultAccount(userId, {
      currentBalance: newBalance,
      pointsRedeemed: (account.pointsRedeemed || 0) + pointsToRedeem,
      lastActivityDate: new Date(),
    });

    // Record transaction
    await createVortexVaultTransaction({
      userId,
      type: "redemption",
      pointsAmount: -pointsToRedeem,
      balanceBefore: account.currentBalance,
      balanceAfter: newBalance,
      description: `Redeemed ${pointsToRedeem} points for £${discountAmount.toFixed(
        2
      )} discount`,
    });

    logger.info("Points redeemed", {
      userId,
      pointsRedeemed: pointsToRedeem,
      discountAmount,
      newBalance,
    });

    return {
      success: true,
      discountAmount,
      newBalance,
      message: `${pointsToRedeem} points redeemed for £${discountAmount.toFixed(
        2
      )} discount!`,
    };
  } catch (error) {
    logger.error("Error redeeming points:", error);
    return {
      success: false,
      discountAmount: 0,
      newBalance: 0,
      message: "Failed to redeem points",
    };
  }
}

/**
 * Get account summary
 */
export async function getVortexVaultSummary(userId: string) {
  try {
    logger.info("Loading Vortex Vault summary", { userId });

    const account = await getUserVortexVaultAccount(userId);

    if (!account) {
      logger.warn(
        "Vortex Vault account is null (Firebase may not be configured)",
        { userId }
      );
      // Return zero-balance placeholder when database isn't available
      return {
        account: {
          id: "",
          userId,
          currentBalance: 0,
          lifetimePoints: 0,
          pointsRedeemed: 0,
          pointsExpired: 0,
          lastActivityDate: new Date(),
          autoApplyPreference: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        recentTransactions: [],
        minimumRedemption: MINIMUM_REDEMPTION_POINTS,
        isEligibleForRedemption: false,
        pointsValueConversion: `10 pts = £1`,
        autoApplyPreference: true,
      };
    }

    const transactions = await getVortexVaultTransactions(userId, 10);

    return {
      account,
      recentTransactions: transactions,
      minimumRedemption: MINIMUM_REDEMPTION_POINTS,
      isEligibleForRedemption: isEligibleForRedemption(
        account?.currentBalance || 0
      ),
      pointsValueConversion: `50 pts = £1`,
      autoApplyPreference: account?.autoApplyPreference ?? true,
    };
  } catch (error) {
    logger.error("Error getting Vortex Vault summary:", error);
    throw error;
  }
}

/**
 * Persist auto-apply preference for a user
 */
export async function setVortexVaultAutoApply(
  userId: string,
  autoApply: boolean
): Promise<{ success: boolean }> {
  try {
    await updateVortexVaultAccount(userId, {
      autoApplyPreference: autoApply,
    });

    logger.info("Updated Vortex Vault auto-apply preference", {
      userId,
      autoApply,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to update auto-apply preference", error);
    return { success: false };
  }
}

/**
 * Check and expire inactive points
 * Called periodically or on account access
 */
export async function checkAndExpireInactivePoints(
  userId: string
): Promise<number> {
  try {
    const account = await getUserVortexVaultAccount(userId);
    if (!account) return 0;

    const lastActivity = account.lastActivityDate || new Date(0);
    const monthsSinceActivity = Math.floor(
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (
      monthsSinceActivity >= POINTS_EXPIRY_MONTHS &&
      account.currentBalance > 0
    ) {
      const expiredPoints = account.currentBalance;

      await updateVortexVaultAccount(userId, {
        currentBalance: 0,
        pointsExpired: (account.pointsExpired || 0) + expiredPoints,
      });

      await createVortexVaultTransaction({
        userId,
        type: "expiry",
        pointsAmount: -expiredPoints,
        balanceBefore: account.currentBalance,
        balanceAfter: 0,
        description: `${expiredPoints} points expired after ${POINTS_EXPIRY_MONTHS} months of inactivity`,
      });

      logger.info("Points expired", { userId, expiredPoints });
      return expiredPoints;
    }

    return 0;
  } catch (error) {
    logger.error("Error checking points expiry:", error);
    return 0;
  }
}

/**
 * Get Vortex Vault configuration (for admin)
 * Returns current system config for points earning and redemption
 */
export async function getVortexVaultConfig() {
  return {
    pointsPerPound: POINTS_PER_POUND,
    pointsValueConversion: POINTS_PER_POUND_VALUE,
    minimumRedemptionPoints: MINIMUM_REDEMPTION_POINTS,
    pointsExpiryMonths: POINTS_EXPIRY_MONTHS,
    bonusPointsSignup: BONUS_POINTS.SIGNUP,
    tiers: VORTEX_VAULT_TIERS,
  };
}

/**
 * Update Vortex Vault configuration (for admin only)
 * Note: In production, this should verify admin privileges and persist to Firestore
 */
export async function updateVortexVaultConfig(
  config: Partial<{
    pointsPerPound: number;
    pointsValueConversion: number;
    minimumRedemptionPoints: number;
    pointsExpiryMonths: number;
    bonusPointsSignup: number;
  }>
) {
  try {
    // In production, persist to Firestore under admin/vaultConfig
    // For now, log the update attempt
    logger.info("Vault config update requested", config);
    return { success: true, message: "Config update received" };
  } catch (error) {
    logger.error("Failed to update vault config", error);
    return { success: false, message: "Update failed" };
  }
}

// Re-export email trigger functions for convenience
export {
  triggerVaultWelcomeEmail,
  triggerVaultTierUpEmail,
  triggerVaultExpiryReminders,
  triggerVaultOrderReceiptEmail,
  triggerVaultReferralBonusEmail,
  triggerVaultBulkEmail,
} from "./vortexVaultEmailTriggers";
