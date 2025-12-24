import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { sendEmailWithRetry } from "../../../services/emailSender.js";

function initAdminOnce() {
  if (getApps().length) return;
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      return;
    }
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!base64) throw new Error("Missing Firebase admin credentials");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const creds = JSON.parse(json);
    initializeApp({ credential: cert(creds) });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
    throw error;
  }
}
initAdminOnce();

const db = getFirestore();

// Verify cron secret for security
function verifyCronAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, require it
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Otherwise, check if request is from Vercel Cron
  return req.headers["x-vercel-cron"] === "true";
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  format: "pdf" | "excel";
  recipients: string[];
  metrics: string[];
  enabled: boolean;
  lastSent?: Date;
  nextScheduled: Date;
  createdAt: Date;
  createdBy: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests (called by cron)
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify this is a legitimate cron request
  if (!verifyCronAuth(req)) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const sentReports: string[] = [];
    const errors: Array<{ reportId: string; error: string }> = [];

    // Find all enabled reports that are due
    const reportsSnapshot = await db
      .collection("scheduled_reports")
      .where("enabled", "==", true)
      .where("nextScheduled", "<=", Timestamp.fromDate(now))
      .get();

    console.log(
      `Found ${reportsSnapshot.docs.length} scheduled reports due for sending`
    );

    for (const doc of reportsSnapshot.docs) {
      const reportData = doc.data();
      const report: ScheduledReport = {
        id: doc.id,
        name: reportData.name,
        frequency: reportData.frequency,
        format: reportData.format,
        recipients: reportData.recipients || [],
        metrics: reportData.metrics || [],
        enabled: reportData.enabled,
        lastSent: reportData.lastSent?.toDate(),
        nextScheduled: reportData.nextScheduled.toDate(),
        createdAt: reportData.createdAt.toDate(),
        createdBy: reportData.createdBy,
      };

      try {
        // Generate the report
        const reportUrl = await generateReport(report);

        // Send emails to all recipients
        await sendReportEmail(report, reportUrl);

        // Calculate next scheduled time
        const nextScheduled = calculateNextSchedule(report.frequency, now);

        // Update the report in Firestore
        await db
          .collection("scheduled_reports")
          .doc(report.id)
          .update({
            lastSent: Timestamp.fromDate(now),
            nextScheduled: Timestamp.fromDate(nextScheduled),
          });

        sentReports.push(report.id);
        console.log(`Successfully sent scheduled report: ${report.name}`);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to send report ${report.name}:`, errorMsg);
        errors.push({ reportId: report.id, error: errorMsg });
      }
    }

    return res.status(200).json({
      success: true,
      processed: reportsSnapshot.docs.length,
      sent: sentReports.length,
      sentReports,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Scheduled reports cron error:", error);
    return res.status(500).json({
      error: "Failed to process scheduled reports",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Calculate the next scheduled time based on frequency
 */
function calculateNextSchedule(
  frequency: "daily" | "weekly" | "monthly",
  from: Date
): Date {
  const next = new Date(from);

  switch (frequency) {
    case "daily":
      next.setDate(from.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      break;
    case "weekly":
      next.setDate(from.getDate() + 7);
      next.setHours(9, 0, 0, 0);
      break;
    case "monthly":
      next.setMonth(from.getMonth() + 1);
      next.setDate(1);
      next.setHours(9, 0, 0, 0);
      break;
  }

  return next;
}

/**
 * Generate the report by calling the generate API
 */
async function generateReport(report: ScheduledReport): Promise<string> {
  // Calculate date range based on frequency
  const endDate = new Date();
  const startDate = new Date();

  switch (report.frequency) {
    case "daily":
      startDate.setDate(endDate.getDate() - 1);
      break;
    case "weekly":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "monthly":
      startDate.setMonth(endDate.getMonth() - 1);
      break;
  }

  // For now, we'll construct a URL to the report
  // In production, you'd actually generate the file and get a download URL
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://vortexpcs.com";

  const params = new URLSearchParams({
    format: report.format,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    metrics: report.metrics.join(","),
  });

  return `${baseUrl}/api/admin/reports/generate?${params.toString()}`;
}

/**
 * Send the report via email to all recipients
 */
async function sendReportEmail(
  report: ScheduledReport,
  reportUrl: string
): Promise<void> {
  // Get SMTP configuration
  const smtpHost = process.env.VITE_SMTP_HOST || "";
  const smtpUser = process.env.VITE_SMTP_USER || "";
  const smtpPass = process.env.VITE_SMTP_PASS || "";
  const smtpPort = parseInt(process.env.VITE_SMTP_PORT || "465", 10);
  const smtpSecure = (process.env.VITE_SMTP_SECURE || "true") === "true";

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP configuration missing");
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Format frequency for display
  const frequencyText =
    report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1);

  // Create email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.name}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${report.name}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${frequencyText} Report - ${new Date().toLocaleDateString()}</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 20px 0;">Your scheduled ${
      report.frequency
    } report is ready for download.</p>
    
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 15px 0; font-size: 16px; color: #374151;">Report Details</h2>
      <ul style="margin: 0; padding-left: 20px;">
        <li><strong>Format:</strong> ${report.format.toUpperCase()}</li>
        <li><strong>Frequency:</strong> ${frequencyText}</li>
        <li><strong>Metrics:</strong> ${report.metrics.length} selected</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        Download Report
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      This is an automated report from Vortex PCs Admin Panel. To manage your scheduled reports, log in to your admin dashboard.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p style="margin: 0;">© ${new Date().getFullYear()} Vortex PCs Ltd. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const emailText = `
${report.name}
${frequencyText} Report - ${new Date().toLocaleDateString()}

Your scheduled ${report.frequency} report is ready for download.

Format: ${report.format.toUpperCase()}
Frequency: ${frequencyText}
Metrics: ${report.metrics.length} selected

Download your report: ${reportUrl}

This is an automated report from Vortex PCs Admin Panel.
To manage your scheduled reports, log in to your admin dashboard.

© ${new Date().getFullYear()} Vortex PCs Ltd. All rights reserved.
  `;

  // Send to all recipients
  for (const recipient of report.recipients) {
    try {
      const result = await sendEmailWithRetry(transporter, {
        from: smtpUser,
        to: recipient,
        subject: `${report.name} - ${frequencyText} Report`,
        html: emailHtml,
        text: emailText,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      console.log(`Sent report email to ${recipient}`);
    } catch (error) {
      console.error(`Failed to send email to ${recipient}:`, error);
      // Continue to next recipient even if one fails
    }
  }
}
