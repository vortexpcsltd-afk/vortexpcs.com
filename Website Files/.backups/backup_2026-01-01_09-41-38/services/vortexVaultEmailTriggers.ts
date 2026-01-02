/**
 * Vortex Vault Email Triggers
 * Hooks into vault events to send automated emails
 * Used by checkout, webhook handlers, and scheduled jobs
 */

import { logger } from "./logger";
import {
  sendVortexVaultWelcomeEmail,
  sendVortexVaultTierUpEmail,
  sendVortexVaultExpiryReminderEmail,
  sendVortexVaultOrderReceiptEmail,
  sendVortexVaultReferralConfirmationEmail,
} from "./vortexVaultEmails";
import { getUserVortexVaultAccount } from "./vortexVaultDatabase";
import { getTierForPoints } from "./vortexVault";
import type { VortexVaultTierId } from "./vortexVault";

interface UserEmailInfo {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Trigger welcome email on signup
 */
export async function triggerVaultWelcomeEmail(
  userInfo: UserEmailInfo,
  signupBonus: number
): Promise<void> {
  try {
    await sendVortexVaultWelcomeEmail({
      ...userInfo,
      signupBonus,
    });
  } catch (error) {
    logger.error("Failed to trigger welcome email", error);
  }
}

/**
 * Check if tier changed and send tier-up email
 */
export async function triggerVaultTierUpEmail(
  userInfo: UserEmailInfo,
  previousTierId: VortexVaultTierId | null,
  currentPoints: number
): Promise<void> {
  try {
    const newTier = getTierForPoints(currentPoints);

    // Only send if tier actually changed
    if (previousTierId === newTier.id) {
      return;
    }

    await sendVortexVaultTierUpEmail({
      ...userInfo,
      newTierId: newTier.id,
      newTierName: newTier.name,
      currentPoints,
      perks: newTier.perks,
    });
  } catch (error) {
    logger.error("Failed to trigger tier-up email", error);
  }
}

/**
 * Send expiry reminder emails (called by scheduled job)
 * Checks accounts expiring in 30, 7, or 1 day
 */
export async function triggerVaultExpiryReminders(
  accounts: Array<{
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    currentBalance: number;
    lastActivityDate: Date;
  }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const account of accounts) {
    try {
      const lastActivity = new Date(account.lastActivityDate);
      const now = new Date();
      const daysSinceActivity = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 18 months = ~540 days
      const daysUntilExpiry = 540 - daysSinceActivity;

      // Send reminders at 30, 7, and 1 day before expiry
      if ([30, 7, 1].includes(daysUntilExpiry) && account.currentBalance > 0) {
        const pointsValue = account.currentBalance / 10;

        await sendVortexVaultExpiryReminderEmail({
          userId: account.userId,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          daysUntilExpiry,
          pointsAtRisk: account.currentBalance,
          pointsValue,
        });

        sent++;
      }
    } catch (error) {
      logger.error("Failed to send expiry reminder", error);
      failed++;
    }
  }

  logger.info("Expiry reminder batch completed", { sent, failed });
  return { sent, failed };
}

/**
 * Trigger order receipt email with points earned
 */
export async function triggerVaultOrderReceiptEmail(
  userInfo: UserEmailInfo,
  orderId: string,
  orderTotal: number,
  pointsEarned: number
): Promise<void> {
  try {
    // Get current vault account to check for tier upgrade
    const account = await getUserVortexVaultAccount(userInfo.userId);

    if (!account) {
      logger.warn("User account not found for order receipt email", {
        userId: userInfo.userId,
      });
      return;
    }

    const newTier = getTierForPoints(account.currentBalance);
    const previousBalance = account.currentBalance - pointsEarned;
    const previousTier =
      previousBalance > 0 ? getTierForPoints(previousBalance) : null;

    const tierUpgrade =
      previousTier && previousTier.id !== newTier.id ? newTier.name : undefined;

    await sendVortexVaultOrderReceiptEmail({
      ...userInfo,
      orderId,
      orderTotal,
      pointsEarned,
      newBalance: account.currentBalance,
      newTier: tierUpgrade,
    });
  } catch (error) {
    logger.error("Failed to trigger order receipt email", error);
  }
}

/**
 * Trigger referral bonus email
 */
export async function triggerVaultReferralBonusEmail(
  referrerInfo: UserEmailInfo,
  referralName: string,
  referralPoints: number
): Promise<void> {
  try {
    const referralValue = referralPoints / 40;

    await sendVortexVaultReferralConfirmationEmail({
      ...referrerInfo,
      referrerName: referralName,
      referralPoints,
      referralValue,
    });
  } catch (error) {
    logger.error("Failed to trigger referral bonus email", error);
  }
}

/**
 * Batch email trigger for admin - send email to multiple vault users
 * Used by admin panel email triggers
 */
export async function triggerVaultBulkEmail(
  recipients: UserEmailInfo[],
  emailType: "welcome" | "tier-up-reminder" | "expiry-alert" | "promotion",
  customData?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      switch (emailType) {
        case "welcome":
          await triggerVaultWelcomeEmail(
            recipient,
            (customData?.signupBonus as number) || 50
          );
          break;
        case "tier-up-reminder":
          // Custom admin email - would need custom template
          logger.info("Tier-up reminder triggered by admin", {
            userId: recipient.userId,
          });
          break;
        case "expiry-alert":
          // Trigger custom expiry alert
          await sendVortexVaultExpiryReminderEmail({
            ...recipient,
            daysUntilExpiry: (customData?.daysUntilExpiry as number) || 30,
            pointsAtRisk: (customData?.pointsAtRisk as number) || 0,
            pointsValue: (customData?.pointsValue as number) || 0,
          });
          break;
        case "promotion":
          // Would require custom template for promotional emails
          logger.info("Promotional email triggered by admin", {
            userId: recipient.userId,
          });
          break;
      }
      sent++;
    } catch (error) {
      logger.error("Failed to send bulk email", error);
      failed++;
    }
  }

  logger.info("Bulk email batch completed", { emailType, sent, failed });
  return { sent, failed };
}
