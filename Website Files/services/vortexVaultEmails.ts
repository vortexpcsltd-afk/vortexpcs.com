/**
 * Vortex Vault Loyalty Email System
 * Automated emails for: welcome, tier-up, expiry reminders, referral confirmations, order receipts
 */

import { logger } from "./logger";
import { POINTS_EXPIRY_MONTHS } from "./vortexVault";
import type { VortexVaultTierId } from "./vortexVault";

/**
 * Helper to send email via transporter
 * Uses nodemailer directly for sending loyalty emails
 */
async function sendTransactionalEmail(
  to: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<boolean> {
  try {
    // Dynamically import to avoid circular dependencies
    const { getTransporter, getBusinessInfo } = await import("./email");
    const transporter = getTransporter?.();

    if (!transporter) {
      logger.warn("Email transporter not configured, skipping email send", {
        to,
        subject,
      });
      return false;
    }

    const business = getBusinessInfo?.();
    const fromAddress = business?.email || "noreply@vortexpcs.com";

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      replyTo: replyTo || "support@vortexpcs.com",
    });

    return true;
  } catch (error) {
    logger.error("Failed to send transactional email", error);
    return false;
  }
}

interface VaultEmailParams {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface WelcomeEmailParams extends VaultEmailParams {
  signupBonus: number;
}

interface TierUpEmailParams extends VaultEmailParams {
  newTierId: VortexVaultTierId;
  newTierName: string;
  currentPoints: number;
  perks: string[];
}

interface ExpiryReminderEmailParams extends VaultEmailParams {
  daysUntilExpiry: number; // 30, 7, or 1
  pointsAtRisk: number;
  pointsValue: number;
}

interface ReferralConfirmationEmailParams extends VaultEmailParams {
  referrerName: string;
  referralPoints: number;
  referralValue: number;
}

interface ReferralSignupNotificationParams extends VaultEmailParams {
  referredUserName: string;
}

interface OrderReceiptEmailParams extends VaultEmailParams {
  orderId: string;
  orderTotal: number;
  pointsEarned: number;
  newBalance: number;
  newTier?: string;
}

/**
 * Send welcome email when user signs up for Vortex Vault
 */
export async function sendVortexVaultWelcomeEmail(
  params: WelcomeEmailParams
): Promise<boolean> {
  try {
    const greeting = params.firstName ? `, ${params.firstName}` : "";
    const pointsValue = (params.signupBonus / 10).toFixed(2);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Vortex Vault</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Personal Loyalty Rewards Program</p>
        </div>
        
        <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Hello${greeting}! 👋</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            You've just unlocked access to Vortex Vault, our exclusive loyalty rewards program for valued customers like you.
          </p>
          
          <div style="background: white; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your Welcome Bonus</p>
            <p style="color: #0ea5e9; font-size: 32px; font-weight: bold; margin: 0;">${params.signupBonus} Points</p>
            <p style="color: #0ea5e9; margin: 5px 0 0 0; font-weight: 600;">Worth £${pointsValue}</p>
          </div>

          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; color: white;">
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">🎁 BONUS: 10% Off Your First Order!</p>
            <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">Use this code at checkout on your first purchase</p>
            <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px;">
              WELCOME10
            </div>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">Valid for 30 days | One-time use</p>
          </div>
          
          <h3 style="color: #1e293b; margin-top: 30px;">How Vortex Vault Works</h3>
          <ul style="color: #475569; line-height: 1.8;">
            <li><strong>Earn:</strong> Get 1 point for every £10 you spend</li>
            <li><strong>Reach Milestones:</strong> Unlock tier rewards (Bronze → Silver → Gold)</li>
            <li><strong>Redeem:</strong> Trade 10 points for £1 in discounts when you reach £5 worth (50 points minimum)</li>
            <li><strong>Enjoy Perks:</strong> Each tier unlocks exclusive benefits, vault drops & giveaways</li>
          </ul>
          
          <h3 style="color: #1e293b; margin-top: 30px;">Your Current Status</h3>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; color: #475569; line-height: 1.6;">
            <p style="margin: 5px 0;"><strong>Tier:</strong> Bronze (Entry Level)</p>
            <p style="margin: 5px 0;"><strong>Balance:</strong> ${params.signupBonus} points</p>
            <p style="margin: 5px 0;"><strong>Until Expiry:</strong> ${POINTS_EXPIRY_MONTHS} months of inactivity</p>
          </div>
          
          <p style="color: #475569; line-height: 1.6; margin-top: 25px;">
            Start earning immediately on your next purchase! Log into your account to view your balance and track your progress to the next tier.
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://vortexpcs.com/member-area" style="background: #0ea5e9; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              View Your Vault
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 30px;">
            Questions? Reply to this email or contact our support team at support@vortexpcs.com
          </p>
        </div>
      </div>
    `;

    const subject = `Welcome to Vortex Vault! Your ${params.signupBonus} bonus points are waiting 🎉`;

    await sendTransactionalEmail(
      params.email,
      subject,
      html,
      "support@vortexpcs.com"
    );

    logger.info("Vault welcome email sent", { userId: params.userId });
    return true;
  } catch (error) {
    logger.error("Failed to send welcome email", error);
    return false;
  }
}

/**
 * Send tier-up email when customer reaches next loyalty tier
 */
export async function sendVortexVaultTierUpEmail(
  params: TierUpEmailParams
): Promise<boolean> {
  try {
    const greeting = params.firstName ? `, ${params.firstName}` : "";
    const tierColors: Record<VortexVaultTierId, string> = {
      bronze: "#b45309",
      silver: "#78716c",
      gold: "#d97706",
    };
    const color = tierColors[params.newTierId];

    const perksList = params.perks
      .map((perk) => `<li style="margin: 8px 0; color: #475569;">${perk}</li>`)
      .join("");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You've Been Promoted!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">You've reached ${params.newTierName} tier</p>
        </div>
        
        <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Congratulations${greeting}! 🏆</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            You've earned your way to <strong>${params.newTierName} status</strong> in Vortex Vault! This means you now have access to exclusive perks and benefits designed to reward your loyalty.
          </p>
          
          <div style="background: white; border: 3px solid ${color}; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your New Status</p>
            <p style="color: ${color}; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase;">${params.newTierName}</p>
            <p style="color: #64748b; margin: 10px 0 0 0; font-size: 13px;">${params.currentPoints} Points Earned</p>
          </div>
          
          <h3 style="color: #1e293b; margin-top: 30px;">Your New Benefits 🎁</h3>
          <ul style="list-style: none; padding: 0; margin: 15px 0;">
            ${perksList}
          </ul>
          
          <p style="color: #475569; line-height: 1.6; margin-top: 25px;">
            Keep earning points on future purchases to maintain your tier status and unlock even more exclusive rewards!
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://vortexpcs.com/member-area" style="background: ${color}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Explore Your Benefits
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 30px;">
            Thank you for being part of the Vortex Vault community!
          </p>
        </div>
      </div>
    `;
    const subject = `🎉 You've reached ${params.newTierName} tier in Vortex Vault!`;
    await sendTransactionalEmail(
      params.email,
      subject,
      html,
      "support@vortexpcs.com"
    );

    logger.info("Vault tier-up email sent", {
      userId: params.userId,
      tier: params.newTierId,
    });
    return true;
  } catch (error) {
    logger.error("Failed to send tier-up email", error);
    return false;
  }
}

/**
 * Send expiry reminder emails (30, 7, or 1 day before expiry)
 */
export async function sendVortexVaultExpiryReminderEmail(
  params: ExpiryReminderEmailParams
): Promise<boolean> {
  try {
    const greeting = params.firstName ? `, ${params.firstName}` : "";
    const urgency =
      params.daysUntilExpiry === 1
        ? "LAST CHANCE"
        : params.daysUntilExpiry === 7
        ? "Last Week"
        : "Expiring Soon";
    const urgencyColor =
      params.daysUntilExpiry === 1
        ? "#dc2626"
        : params.daysUntilExpiry === 7
        ? "#ea580c"
        : "#f59e0b";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⏰ ${urgency}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Vortex Vault points will expire in ${
            params.daysUntilExpiry
          } day${params.daysUntilExpiry > 1 ? "s" : ""}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Hi${greeting},</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            We wanted to remind you that you have <strong>${
              params.pointsAtRisk
            } loyalty points</strong> expiring in just <strong>${
      params.daysUntilExpiry
    } day${params.daysUntilExpiry > 1 ? "s" : ""}</strong>.
          </p>
          
          <div style="background: white; border: 3px solid ${urgencyColor}; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 13px;">Points Expiring</p>
            <p style="color: #1e293b; font-size: 28px; font-weight: bold; margin: 0;">${
              params.pointsAtRisk
            } Points</p>
            <p style="color: #0ea5e9; margin: 8px 0 0 0; font-weight: 600;">Worth £${params.pointsValue.toFixed(
              2
            )}</p>
          </div>
          
          <h3 style="color: #1e293b; margin-top: 25px;">Don't Let Them Go to Waste! 💰</h3>
          <p style="color: #475569; line-height: 1.6;">
            You're close to redeeming! Here are your options:
          </p>
          <ul style="color: #475569; line-height: 1.8;">
            <li><strong>Redeem Now:</strong> If you have 500+ points, apply them to your next purchase</li>
            <li><strong>Earn More:</strong> Make another purchase before ${
              params.daysUntilExpiry
            } day${
      params.daysUntilExpiry > 1 ? "s" : ""
    } to reset your expiry clock</li>
            <li><strong>Contact Us:</strong> Reach out if you need help redeeming your points</li>
          </ul>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://vortexpcs.com/member-area?tab=vault" style="background: ${urgencyColor}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Check Your Balance
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
            Questions? Reply to this email or contact support@vortexpcs.com
          </p>
        </div>
      </div>
    `;

    const subject = `⏰ Your Vortex Vault points expire in ${
      params.daysUntilExpiry
    } day${params.daysUntilExpiry > 1 ? "s" : ""}!`;

    await sendTransactionalEmail(
      params.email,
      subject,
      html,
      "support@vortexpcs.com"
    );

    logger.info("Vault expiry reminder email sent", {
      userId: params.userId,
      daysUntilExpiry: params.daysUntilExpiry,
      pointsAtRisk: params.pointsAtRisk,
    });
    return true;
  } catch (error) {
    logger.error("Failed to send expiry reminder email", error);
    return false;
  }
}

/**
 * Send referral confirmation email when referral is completed
 */
export async function sendVortexVaultReferralConfirmationEmail(
  params: ReferralConfirmationEmailParams
): Promise<boolean> {
  try {
    const greeting = params.firstName ? `, ${params.firstName}` : "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎁 Referral Completed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">You've earned bonus points</p>
        </div>
        
        <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Great News${greeting}!</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            Your referral of <strong>${
              params.referrerName
            }</strong> has been completed. They've made their first purchase and you've earned bonus points as thanks!
          </p>
          
          <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Referral Bonus Earned</p>
            <p style="color: #10b981; font-size: 32px; font-weight: bold; margin: 0;">${
              params.referralPoints
            } Points</p>
            <p style="color: #10b981; margin: 5px 0 0 0; font-weight: 600;">Worth £${params.referralValue.toFixed(
              2
            )}</p>
          </div>
          
          <h3 style="color: #1e293b; margin-top: 30px;">Keep the Rewards Coming! 🚀</h3>
          <p style="color: #475569; line-height: 1.6;">
            You can continue referring friends and family to earn even more points. The more you refer, the more you earn!
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://vortexpcs.com/member-area?tab=referrals" style="background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Share Your Referral Link
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 30px;">
            Thank you for spreading the word about Vortex Vault!
          </p>
        </div>
      </div>
    `;

    const subject = `🎁 Referral Bonus! You earned ${params.referralPoints} points`;

    await sendTransactionalEmail(
      params.email,
      subject,
      html,
      "support@vortexpcs.com"
    );

    logger.info("Vault referral confirmation email sent", {
      userId: params.userId,
      referralPoints: params.referralPoints,
    });
    return true;
  } catch (error) {
    logger.error("Failed to send referral confirmation email", error);
    return false;
  }
}

/**
 * Send referral signup notification email to referrer
 * Called when a friend signs up using the referrer's code
 */
export async function sendVortexVaultReferralSignupEmail(
  params: ReferralSignupNotificationParams
): Promise<boolean> {
  try {
    const greeting = params.firstName ? `, ${params.firstName}` : "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✨ Your Friend Joined!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Referral in progress - earn bonus when they shop</p>
        </div>
        
        <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Excellent Work${greeting}!</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            Great news! <strong>${params.referredUserName}</strong> just signed up to Vortex Vault using your referral code. Your referral is now <strong>pending</strong>.
          </p>
          
          <div style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(6, 182, 212, 0.1)); border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Status: Pending Reward</p>
            <p style="color: #1e293b; font-size: 18px; font-weight: bold; margin: 0;">⏳ Waiting for their first purchase</p>
            <p style="color: #475569; margin: 8px 0 0 0; font-size: 14px;">Once they complete their first order, you'll earn <strong>100 Vortex Vault Points</strong> (worth £1)!</p>
          </div>
          
          <h3 style="color: #1e293b; margin-top: 30px;">What Happens Next? 🛍️</h3>
          <ol style="color: #475569; line-height: 1.8;">
            <li><strong>They Shop:</strong> Your friend makes their first purchase</li>
            <li><strong>You Earn:</strong> We automatically credit 100 points to your account</li>
            <li><strong>You Redeem:</strong> Use points on a future purchase or gift them to friends</li>
          </ol>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://vortexpcs.com/member-area?tab=referrals" style="background: #0ea5e9; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Track Your Referrals
            </a>
          </div>
          
          <h3 style="color: #1e293b; margin-top: 30px;">Keep Spreading the Word! 🚀</h3>
          <p style="color: #475569; line-height: 1.6;">
            The more friends you refer, the more points you earn. There's no limit to how many people you can refer!
          </p>
          
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 30px;">
            Questions? Visit your Member Area to learn more about our referral program.
          </p>
        </div>
      </div>
    `;

    const subject = `✨ Your Friend ${params.referredUserName} Just Joined!`;

    await sendTransactionalEmail(
      params.email,
      subject,
      html,
      "support@vortexpcs.com"
    );

    logger.info("Vault referral signup notification email sent", {
      userId: params.userId,
      referredUser: params.referredUserName,
    });
    return true;
  } catch (error) {
    logger.error("Failed to send referral signup notification email", error);
    return false;
  }
}

/**
 * Send order receipt email with points earned
 */
export async function sendVortexVaultOrderReceiptEmail(
  params: OrderReceiptEmailParams
): Promise<boolean> {
  try {
    const greeting = params.firstName ? `, ${params.firstName}` : "";
    const pointsValue = (params.pointsEarned / 10).toFixed(2);

    const tierSection = params.newTier
      ? `
        <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #64748b; margin: 0 0 5px 0; font-size: 13px;">✨ NEW TIER ACHIEVEMENT</p>
          <p style="color: #0ea5e9; font-weight: 600; margin: 0;">You've reached <strong>${params.newTier} tier</strong>!</p>
        </div>
      `
      : "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Order #${
            params.orderId
          }</p>
        </div>
        
        <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Thank You${greeting}! 🎉</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            Your order has been confirmed. We've also credited your Vortex Vault account with loyalty points.
          </p>
          
          <div style="background: white; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #475569;">Order Total</span>
              <span style="color: #1e293b; font-weight: 600;">£${params.orderTotal.toFixed(
                2
              )}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0;">
              <span style="color: #0ea5e9; font-weight: 600;">Vault Points Earned</span>
              <span style="color: #0ea5e9; font-weight: bold; font-size: 18px;">${
                params.pointsEarned
              } pts (£${pointsValue})</span>
            </div>
          </div>
          
          <h3 style="color: #1e293b; margin-top: 25px;">Your Vault Status</h3>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; color: #475569; line-height: 1.8; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>New Balance:</strong> ${
              params.newBalance
            } points</p>
            <p style="margin: 5px 0;"><strong>Value:</strong> £${(
              params.newBalance / 40
            ).toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Until Expiry:</strong> ${POINTS_EXPIRY_MONTHS} months from last activity</p>
          </div>
          
          ${tierSection}
          
          <p style="color: #475569; line-height: 1.6; margin-top: 25px;">
            Keep building your balance and unlocking new tier benefits!
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://vortexpcs.com/member-area?tab=vault" style="background: #0ea5e9; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              View Your Vault
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 30px;">
            Need help? Contact support@vortexpcs.com
          </p>
        </div>
      </div>
    `;

    const subject = `Order #${params.orderId} Confirmed - You earned ${params.pointsEarned} Vault points!`;

    await sendTransactionalEmail(
      params.email,
      subject,
      html,
      "support@vortexpcs.com"
    );

    logger.info("Vault order receipt email sent", {
      userId: params.userId,
      orderId: params.orderId,
      pointsEarned: params.pointsEarned,
    });
    return true;
  } catch (error) {
    logger.error("Failed to send order receipt email", error);
    return false;
  }
}
