import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { createLogger } from "../services/logger";
import { getSmtpConfig } from "../services/smtp.js";
import {
  ensureBranded,
  buildPlainTextFromHtml,
} from "../../services/emailTemplate.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logger = createLogger(req);
  res.setHeader("X-Trace-ID", logger.getTraceId());
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    let body: unknown = req.body;
    if (
      typeof req.body === "string" &&
      contentType.includes("application/json")
    ) {
      try {
        body = JSON.parse(req.body);
      } catch {
        return res.status(400).json({ error: "Invalid JSON" });
      }
    }
    const safe = (body || {}) as Record<string, unknown>;
    const ticketId = safe.ticketId as string | undefined;
    const subject = safe.subject as string | undefined;
    const type = safe.type as string | undefined;
    const priority = safe.priority as string | undefined;
    const email = safe.email as string | undefined;
    const name = safe.name as string | undefined;
    if (!ticketId || !subject || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { host, port, secure, user, pass } = getSmtpConfig(req);
    if (!host || !user || !pass) {
      return res.status(500).json({ error: "Email not configured" });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    let priorityLabel = priority || "normal";
    const priorityMap: Record<string, string> = {
      urgent: "Critical",
      high: "High",
      normal: "Medium",
      low: "Low",
    };
    priorityLabel = priorityMap[priorityLabel] || priorityLabel;

    const contentHtml = `
      <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#e5e7eb;">Support Ticket Created</h2>
      <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;">Thank you ${
        name ? `, ${name}` : ""
      } – your ticket is now in our queue. A member of our team will respond shortly.</p>
      <div style="background:#0b1220;border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:16px;margin:0 0 18px;">
        <div style="font-size:13px;color:#94a3b8;margin:0 0 6px;">Ticket Reference</div>
        <div style="font-size:16px;font-weight:600;color:#e5e7eb;">#${ticketId}</div>
        <div style="height:1px;background:rgba(255,255,255,0.08);margin:12px 0;"></div>
        <div style="font-size:13px;color:#94a3b8;margin:0 0 4px;">Subject</div>
        <div style="font-size:15px;color:#e5e7eb;">${subject}</div>
        <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:#cbd5e1;">
          <span style="background:#1e293b;padding:6px 10px;border-radius:6px;">Type: ${type}</span>
          <span style="background:#1e293b;padding:6px 10px;border-radius:6px;">Priority: ${priorityLabel}</span>
        </div>
      </div>
      <p style="margin:0 0 12px;color:#94a3b8;font-size:14px;">You can respond to this email with additional information. Please do not remove the ticket reference from the subject line.</p>
      <p style="margin:0;color:#64748b;font-size:12px;">If this is an emergency impacting operations call us on 07301 243190.</p>
    `;

    const html = ensureBranded(contentHtml, "Support Ticket Created", {
      preheader: `Ticket #${ticketId} created`,
    });
    const text = buildPlainTextFromHtml(contentHtml);

    const info = await transporter.sendMail({
      from: `Vortex PCs Support <${user}>`,
      to: email,
      subject: `Ticket #${ticketId} received: ${subject}`,
      html,
      text,
    });

    logger.info("Ticket confirmation email sent", {
      ticketId,
      messageId: info.messageId,
    });
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: unknown) {
    logger.error("Ticket confirmation error", error);
    return res
      .status(500)
      .json({
        error: "Failed to send confirmation",
        details: (error as Error)?.message,
      });
  }
}
