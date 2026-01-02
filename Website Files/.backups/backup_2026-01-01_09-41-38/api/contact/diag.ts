import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { getSmtpConfig } from "../services/smtp.js";
import { createLogger } from "../services/logger";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);
  res.setHeader("X-Trace-ID", logger.getTraceId());
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { host, port, secure, user, pass, missing, warning } =
      getSmtpConfig(req);
    const summary: Record<string, unknown> = {
      hostSet: !!host,
      port,
      secure,
      userSet: !!user,
      passSet: !!pass,
      missing,
      warning: warning || null,
    };

    let verifyResult: { success: boolean; code?: string; message?: string } = {
      success: false,
    };
    if (host && user && pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
        await transporter.verify();
        verifyResult = { success: true };
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        verifyResult = {
          success: false,
          code: err?.code,
          message: err?.message,
        };
      }
    }

    return res
      .status(200)
      .json({ success: true, smtp: summary, verify: verifyResult });
  } catch (error: unknown) {
    logger.error("Contact diag error", error);
    return res
      .status(500)
      .json({ error: "Diagnostic failed", details: (error as Error)?.message });
  }
}
