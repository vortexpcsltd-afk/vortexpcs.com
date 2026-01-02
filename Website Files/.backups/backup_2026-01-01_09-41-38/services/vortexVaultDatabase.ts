/**
 * Vortex Vault Database Operations
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { logger } from "./logger";
import type {
  VortexVaultAccount,
  VortexVaultTransaction,
  VortexVaultConfig,
} from "./database";

/**
 * Get or create Vortex Vault account for user
 */
export const getUserVortexVaultAccount = async (
  userId: string
): Promise<VortexVaultAccount | null> => {
  if (!db) {
    logger.warn("getUserVortexVaultAccount: db not configured", { userId });
    return null;
  }

  try {
    logger.debug("getUserVortexVaultAccount: Querying for user", { userId });
    const q = query(
      collection(db, "vortex_vault_accounts"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      logger.info("getUserVortexVaultAccount: No account found, creating new", {
        userId,
      });
      // Create new account
      const newAccount: Omit<VortexVaultAccount, "id"> = {
        userId,
        currentBalance: 0,
        lifetimePoints: 0,
        pointsRedeemed: 0,
        pointsExpired: 0,
        lastActivityDate: new Date(),
        autoApplyPreference: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "vortex_vault_accounts"), {
        ...newAccount,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastActivityDate: Timestamp.now(),
      });

      logger.info("getUserVortexVaultAccount: Account created successfully", {
        userId,
        accountId: docRef.id,
      });

      return { id: docRef.id, ...newAccount };
    }

    logger.debug("getUserVortexVaultAccount: Account found", {
      userId,
      accountId: snap.docs[0].id,
    });

    const data = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      userId: data.userId,
      currentBalance: data.currentBalance || 0,
      lifetimePoints: data.lifetimePoints || 0,
      pointsRedeemed: data.pointsRedeemed || 0,
      pointsExpired: data.pointsExpired || 0,
      lastActivityDate: data.lastActivityDate?.toDate() || new Date(),
      autoApplyPreference:
        typeof data.autoApplyPreference === "boolean"
          ? data.autoApplyPreference
          : true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as VortexVaultAccount;
  } catch (error) {
    logger.error("getUserVortexVaultAccount: Error", { userId, error });
    return null;
  }
};

/**
 * Update Vortex Vault account
 */
export const updateVortexVaultAccount = async (
  userId: string,
  updates: Partial<VortexVaultAccount>
): Promise<void> => {
  if (!db) throw new Error("Database not configured");

  try {
    logger.debug("updateVortexVaultAccount: Starting", {
      userId,
      updates: Object.keys(updates),
    });

    const q = query(
      collection(db, "vortex_vault_accounts"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      logger.info(
        "updateVortexVaultAccount: No account found, creating with updates",
        {
          userId,
        }
      );
      // No account exists yet for this user; create one with provided updates applied.
      // This makes account updates idempotent and avoids race conditions on first creation.
      const baseAccount: Omit<VortexVaultAccount, "id"> = {
        userId,
        currentBalance: updates.currentBalance ?? 0,
        lifetimePoints: updates.lifetimePoints ?? 0,
        pointsRedeemed: updates.pointsRedeemed ?? 0,
        pointsExpired: updates.pointsExpired ?? 0,
        lastActivityDate: updates.lastActivityDate ?? new Date(),
        autoApplyPreference:
          typeof updates.autoApplyPreference === "boolean"
            ? updates.autoApplyPreference
            : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "vortex_vault_accounts"), {
        ...baseAccount,
        // Ensure server timestamps for consistency
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastActivityDate: Timestamp.now(),
      });

      logger.info("updateVortexVaultAccount: Account created via fallback", {
        userId,
        accountId: docRef.id,
      });

      return;
    }

    logger.debug("updateVortexVaultAccount: Account found, updating", {
      userId,
      accountId: snap.docs[0].id,
    });

    const docRef = snap.docs[0].ref;
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    logger.debug("updateVortexVaultAccount: Update complete", {
      userId,
      newBalance: updates.currentBalance,
    });
  } catch (error) {
    logger.error("updateVortexVaultAccount: Error", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Create transaction record
 */
export const createVortexVaultTransaction = async (
  transaction: Omit<VortexVaultTransaction, "id" | "createdAt">
): Promise<string> => {
  if (!db) throw new Error("Database not configured");

  try {
    const docRef = await addDoc(collection(db, "vortex_vault_transactions"), {
      ...transaction,
      createdAt: Timestamp.now(),
    });

    logger.info("Vortex Vault transaction created", {
      userId: transaction.userId,
      type: transaction.type,
      points: transaction.pointsAmount,
    });

    return docRef.id;
  } catch (error) {
    logger.error("createVortexVaultTransaction error:", error);
    throw error;
  }
};

/**
 * Get user's transactions
 */
export const getVortexVaultTransactions = async (
  userId: string,
  limitCount: number = 50
): Promise<VortexVaultTransaction[]> => {
  if (!db) return [];

  try {
    const q = query(
      collection(db, "vortex_vault_transactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snap = await getDocs(q);
    const transactions: VortexVaultTransaction[] = [];

    snap.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        orderId: data.orderId,
        type: data.type,
        pointsAmount: data.pointsAmount,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        description: data.description,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as VortexVaultTransaction);
    });

    return transactions;
  } catch (error) {
    logger.error("getVortexVaultTransactions error:", error);
    return [];
  }
};

/**
 * Get Vortex Vault configuration
 */
export const getVortexVaultConfig =
  async (): Promise<VortexVaultConfig | null> => {
    if (!db) return null;

    try {
      const q = query(collection(db, "vortex_vault_config"), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        // Return defaults
        return {
          enabled: true,
          pointsPerPound: 0.1,
          pointsValueConversion: 10,
          minimumRedemptionPoints: 50,
          bonusPointsSignup: 50,
          bonusPointsReview: 25,
          bonusPointsReferral: 100,
          pointsExpiryMonths: 18,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const data = snap.docs[0].data();
      return {
        id: snap.docs[0].id,
        enabled: data.enabled ?? true,
        pointsPerPound: data.pointsPerPound || 2,
        pointsValueConversion: data.pointsValueConversion || 40,
        minimumRedemptionPoints: data.minimumRedemptionPoints || 400,
        bonusPointsSignup: data.bonusPointsSignup || 50,
        bonusPointsReview: data.bonusPointsReview || 25,
        bonusPointsReferral: data.bonusPointsReferral || 100,
        pointsExpiryMonths: data.pointsExpiryMonths || 18,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as VortexVaultConfig;
    } catch (error) {
      logger.error("getVortexVaultConfig error:", error);
      return null;
    }
  };

/**
 * Update Vortex Vault configuration
 */
export const updateVortexVaultConfig = async (
  updates: Partial<VortexVaultConfig>
): Promise<void> => {
  if (!db) throw new Error("Database not configured");

  try {
    const q = query(collection(db, "vortex_vault_config"), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Create new config
      await addDoc(collection(db, "vortex_vault_config"), {
        ...updates,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Update existing
      await updateDoc(snap.docs[0].ref, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    }

    logger.info("Vortex Vault config updated");
  } catch (error) {
    logger.error("updateVortexVaultConfig error:", error);
    throw error;
  }
};
