/**
 * Email Sender Utility with Retry Logic
 * Provides reliable email sending with exponential backoff retry
 */

import type nodemailer from "nodemailer";

interface EmailResponse {
  messageId?: string;
  response?: string;
}

interface SendResult {
  success: boolean;
  info?: EmailResponse;
  error?: string;
  attempts?: number;
}

/**
 * Send email with automatic retry logic
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s)
 */
export async function sendEmailWithRetry(
  transporter: nodemailer.Transporter,
  options: nodemailer.SendMailOptions,
  maxAttempts: number = 3
): Promise<SendResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info: EmailResponse = await transporter.sendMail(options);

      return {
        success: true,
        info: {
          messageId: info.messageId,
          response: info.response,
        },
        attempts: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on authentication errors (they won't succeed)
      if (
        lastError.message.includes("535") ||
        lastError.message.includes("authentication") ||
        lastError.message.includes("Invalid login")
      ) {
        return {
          success: false,
          error: lastError.message,
          attempts: attempt,
        };
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Unknown error",
    attempts: maxAttempts,
  };
}
