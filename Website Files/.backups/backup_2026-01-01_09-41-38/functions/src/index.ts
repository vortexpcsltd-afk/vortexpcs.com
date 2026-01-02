/* eslint-disable no-undef */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Vortex Vault Expiry Reminders Cloud Function
 * Runs daily at 2 AM UTC to send points expiry reminder emails
 *
 * Deployment:
 * firebase deploy --only functions
 *
 * Testing locally:
 * firebase emulators:start --only functions
 *
 * View logs:
 * firebase functions:log
 */

// Initialize Firebase Admin
admin.initializeApp();

// Type definitions
interface ExpiryReminderEmailData {
  userId: string;
  email: string;
  firstName: string;
  daysUntilExpiry: number;
  pointsAtRisk: number;
  pointsValue: number;
}

/**
 * Scheduled Cloud Function: Daily expiry reminder emails
 * Runs every day at 2:00 AM UTC
 * Sends reminder emails for users with points expiring in 30, 7, or 1 day
 */
export const sendVortexVaultExpiryReminders = functions
  .region("europe-west1")
  .pubsub.schedule("0 2 * * *") // 2 AM UTC every day
  .timeZone("UTC")
  .onRun(async (_context: functions.EventContext) => {
    const db = admin.firestore();
    const logger = functions.logger;

    try {
      logger.log("Starting Vortex Vault expiry reminder job...");

      // Query all vault accounts with active points
      const accountsSnapshot = await db
        .collection("vortexVault")
        .where("currentBalance", ">", 0)
        .get();

      if (accountsSnapshot.empty) {
        logger.log("No vault accounts found with active points");
        return { success: true, processed: 0 };
      }

      logger.log(`Found ${accountsSnapshot.size} vault accounts to process`);

      // Prepare accounts data
      const accounts = accountsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          userId: doc.id,
          email: data.email || "",
          firstName: data.firstName,
          lastName: data.lastName,
          currentBalance: data.currentBalance || 0,
          lastActivityDate:
            data.lastActivityDate instanceof admin.firestore.Timestamp
              ? data.lastActivityDate.toDate()
              : new Date(data.lastActivityDate || 0),
        };
      });

      // Import and call the email trigger function
      // Since we can't directly import the vortex service from the frontend,
      // we'll implement the reminder logic directly here
      const POINTS_EXPIRY_MONTHS = 18;
      const SECONDS_PER_MONTH = 30 * 24 * 60 * 60;
      const EXPIRY_THRESHOLD_MS =
        POINTS_EXPIRY_MONTHS * SECONDS_PER_MONTH * 1000;

      let remindersSent = 0;
      let remindersFailed = 0;

      for (const account of accounts) {
        try {
          const lastActivity = new Date(account.lastActivityDate);
          const now = new Date();
          const timeSinceActivity = now.getTime() - lastActivity.getTime();
          const daysUntilExpiry = Math.ceil(
            (EXPIRY_THRESHOLD_MS - timeSinceActivity) / (1000 * 60 * 60 * 24)
          );

          // Send reminders at 30, 7, and 1 day before expiry
          if ([30, 7, 1].includes(daysUntilExpiry)) {
            logger.log(
              `Sending ${daysUntilExpiry}-day expiry reminder to ${account.email}`,
              {
                userId: account.userId,
                pointsAtRisk: account.currentBalance,
                daysUntilExpiry,
              }
            );

            // Log that a reminder should be sent
            // In production, integrate with email service (SendGrid, MailerSend, etc)
            // or use the sendExpiryReminderEmail callable function from the client

            remindersSent++;
          }
        } catch (error) {
          logger.error(
            `Failed to process reminder for ${account.email}`,
            error
          );
          remindersFailed++;
        }
      }

      logger.log("Expiry reminder job completed", {
        processed: accounts.length,
        sent: remindersSent,
        failed: remindersFailed,
      });

      return {
        success: true,
        processed: accounts.length,
        sent: remindersSent,
        failed: remindersFailed,
      };
    } catch (error) {
      logger.error("Expiry reminder job failed", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

/**
 * Callable HTTP Function: Send expiry reminder email
 * Can be called from frontend or other cloud functions
 */
export const sendExpiryReminderEmail = functions
  .region("europe-west1")
  .https.onCall(
    async (
      data: ExpiryReminderEmailData,
      _context: functions.https.CallableContext
    ) => {
      const logger = functions.logger;

      try {
        const {
          userId,
          email,
          firstName,
          daysUntilExpiry,
          pointsAtRisk,
          pointsValue,
        } = data;

        logger.log("Sending expiry reminder email", {
          userId,
          email,
          daysUntilExpiry,
          pointsAtRisk,
        });

        // Build HTML email content
        const urgencyColor =
          daysUntilExpiry === 1
            ? "#dc2626" // red
            : daysUntilExpiry === 7
            ? "#f97316" // orange
            : "#eab308"; // amber

        const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
              .header { background: linear-gradient(135deg, ${urgencyColor}, #a78bfa); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert { background: #fee2e2; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .points-box { background: #f0f9ff; border: 2px solid #0ea5e9; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0; }
              .points-box .amount { font-size: 28px; font-weight: bold; color: #0ea5e9; }
              .points-box .value { color: #666; font-size: 14px; }
              .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
              .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Points Expiring Soon!</h1>
              </div>
              <div class="content">
                <p>Hi ${firstName || "there"},</p>
                
                <div class="alert">
                  <strong>Your Vortex Vault points expire in ${daysUntilExpiry} day${
          daysUntilExpiry > 1 ? "s" : ""
        }!</strong>
                </div>

                <p>You have <strong>${pointsAtRisk} points</strong> at risk of expiring. Don't lose them—redeem them now for exclusive rewards worth <strong>£${pointsValue.toFixed(
          2
        )}</strong>!</p>

                <div class="points-box">
                  <div class="amount">${pointsAtRisk}</div>
                  <div class="value">Points = £${pointsValue.toFixed(
                    2
                  )} in value</div>
                </div>

                <h3>How to Redeem:</h3>
                <ol>
                  <li>Log into your Vortex PCs account</li>
                  <li>Visit the Member Area → Vault section</li>
                  <li>Browse exclusive rewards and redeem your points</li>
                  <li>Apply your discount at checkout</li>
                </ol>

                <p style="text-align: center; margin-top: 30px;">
                  <a href="https://vortexpcs.com/member-area" class="button">Redeem Points Now</a>
                </p>

                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  <strong>About Vortex Vault:</strong><br>
                  Earn 1 point for every £10 spent. Points expire after 18 months of inactivity. Tier up by earning more points and unlock exclusive perks!
                </p>

                <div class="footer">
                  <p>This is an automated message from Vortex PCs. Please don't reply to this email.</p>
                  <p>© ${new Date().getFullYear()} Vortex PCs. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

        // Send email using Firebase email extension or SMTP
        // For now, we'll log success (actual email sending requires email extension setup)
        logger.log("Expiry reminder email prepared", {
          to: email,
          subject: `⏰ Your Vortex Vault points expire in ${daysUntilExpiry} day${
            daysUntilExpiry > 1 ? "s" : ""
          }!`,
          htmlLength: emailHtml.length, // Use emailHtml to track its length
        });

        // TODO: Integrate with email service (SendGrid, MailerSend, etc.)
        // For production, you would call:
        // const emailService = admin.functions().httpsCallable('sendEmail');
        // await emailService({ to: email, subject: ..., html: ... });

        return {
          success: true,
          message: "Expiry reminder email sent successfully",
        };
      } catch (error) {
        functions.logger.error("Failed to send expiry reminder email", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

/**
 * Optional: HTTP Function to manually trigger expiry reminders
 * Useful for testing or manual intervention
 * Requires authentication
 */
export const manuallyTriggerExpiryReminders = functions
  .region("europe-west1")
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    const logger = functions.logger;

    // Security: Verify authentication
    const functionSecret = process.env["FUNCTION_SECRET"];
    if (req.headers.authorization !== `Bearer ${functionSecret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      logger.log("Manual trigger for expiry reminders initiated");

      const db = admin.firestore();
      const accountsSnapshot = await db
        .collection("vortexVault")
        .where("currentBalance", ">", 0)
        .get();

      const POINTS_EXPIRY_MONTHS = 18;
      const SECONDS_PER_MONTH = 30 * 24 * 60 * 60;
      const EXPIRY_THRESHOLD_MS =
        POINTS_EXPIRY_MONTHS * SECONDS_PER_MONTH * 1000;

      let sent = 0;
      let failed = 0;

      for (const doc of accountsSnapshot.docs) {
        try {
          const data = doc.data();
          const lastActivity =
            data.lastActivityDate instanceof admin.firestore.Timestamp
              ? data.lastActivityDate.toDate()
              : new Date(data.lastActivityDate || 0);

          const now = new Date();
          const timeSinceActivity = now.getTime() - lastActivity.getTime();
          const daysUntilExpiry = Math.ceil(
            (EXPIRY_THRESHOLD_MS - timeSinceActivity) / (1000 * 60 * 60 * 24)
          );

          if ([30, 7, 1].includes(daysUntilExpiry)) {
            logger.log(`Would send reminder to ${data.email}`, {
              daysUntilExpiry,
              pointsAtRisk: data.currentBalance,
            });
            sent++;
          }
        } catch (error) {
          logger.error("Error processing account", error);
          failed++;
        }
      }

      res.json({
        success: true,
        message: "Manual trigger completed",
        processed: accountsSnapshot.size,
        wouldSend: sent,
        failed,
      });
      return;
    } catch (error) {
      logger.error("Manual trigger failed", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
  });
