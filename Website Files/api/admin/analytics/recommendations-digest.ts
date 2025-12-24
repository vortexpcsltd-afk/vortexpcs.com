import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { sendEmailWithRetry } from "../../../services/emailSender.js";
import { generateRecommendations } from "../../utils/recommendationsAggregator.js";
import {
  guardFirebaseAdminEnv,
  featureDisabledPayload,
} from "../../utils/envGuard.js";

let initError: Error | null = null;
let firestoreDb: FirebaseFirestore.Firestore | null = null;

function initAdminOnce() {
  if (getApps().length) return;
  try {
    const envGuard = guardFirebaseAdminEnv();
    if (!envGuard.ok) {
      initError = new Error(envGuard.reason || "firebase-env-missing");
      return;
    }
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
    if (!base64) {
      initError = new Error("Missing Firebase admin credentials (digest)");
      return;
    }
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const creds = JSON.parse(json);
    initializeApp({ credential: cert(creds) });
  } catch (error) {
    console.error("Firebase admin init error (recommendations digest)", error);
    initError = error instanceof Error ? error : new Error(String(error));
    // do not throw to avoid FUNCTION_INVOCATION_FAILED
  }
}
try {
  initAdminOnce();
} catch {}

function getDb() {
  if (firestoreDb) return firestoreDb;
  try {
    firestoreDb = getFirestore();
    return firestoreDb;
  } catch (e) {
    initError = e instanceof Error ? e : new Error(String(e));
    return null;
  }
}

function verifyCronAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) return authHeader === `Bearer ${cronSecret}`;
  return req.headers["x-vercel-cron"] === "true"; // fallback for Vercel cron
}

interface RecommendationDigestSchedule {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  recipients: string[];
  enabled: boolean;
  nextScheduled: Date;
  lastSent?: Date;
  createdAt: Date;
  createdBy: string;
  kind?: string; // should be 'recommendations'
  payloadDays?: number; // window size for aggregation
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  if (!verifyCronAuth(req))
    return res.status(403).json({ error: "Unauthorized" });

  try {
    if (initError) {
      const guard = guardFirebaseAdminEnv();
      if (!guard.ok) {
        return res
          .status(503)
          .json(featureDisabledPayload("recommendations-digest", guard));
      }
      return res.status(500).json({
        error: "firebase-init-failed",
        message: initError.message,
      });
    }
    const db = getDb();
    if (!db)
      return res.status(500).json({
        error: "firestore-unavailable",
        message: "Firestore could not be initialized",
      });
    const now = new Date();
    const dueSnapshot = await db
      .collection("scheduled_reports")
      .where("enabled", "==", true)
      .where("kind", "==", "recommendations")
      .where("nextScheduled", "<=", Timestamp.fromDate(now))
      .get();

    const processed: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const doc of dueSnapshot.docs) {
      const d = doc.data();
      const schedule: RecommendationDigestSchedule = {
        id: doc.id,
        name: d.name,
        frequency: d.frequency,
        recipients: d.recipients || [],
        enabled: d.enabled,
        nextScheduled: d.nextScheduled.toDate(),
        lastSent: d.lastSent?.toDate(),
        createdAt: d.createdAt?.toDate() || now,
        createdBy: d.createdBy || "system",
        kind: d.kind,
        payloadDays: typeof d.payloadDays === "number" ? d.payloadDays : 30,
      };

      try {
        // Build inventory list (best-effort)
        let inventoryItems: Array<{ name: string; stockLevel?: number }> = [];
        try {
          const cms = await import("../../../services/cms");
          if (typeof cms.fetchPCComponents === "function") {
            const comps = await cms.fetchPCComponents({ limit: 300 });
            inventoryItems = comps.map((c: any) => ({
              name: String(c.name || ""),
              stockLevel:
                typeof c.stockLevel === "number" ? c.stockLevel : undefined,
            }));
          }
        } catch (e) {
          console.warn("Digest inventory fetch skipped", e);
        }

        // Conversion stats from searchConversions
        const windowStart = new Date();
        windowStart.setDate(windowStart.getDate() - schedule.payloadDays!);
        const convSnap = await db
          .collection("searchConversions")
          .where("timestamp", ">=", Timestamp.fromDate(windowStart))
          .limit(20000)
          .get();
        const conversionsMap: Record<
          string,
          { addToCart: number; checkout: number; revenue: number }
        > = {};
        console.log(
          "recommendations-digest: conversions docs",
          convSnap.size,
          "windowDays",
          schedule.payloadDays
        );
        convSnap.docs.forEach((d) => {
          const data = d.data();
          const q = String(data.searchQuery || "")
            .trim()
            .toLowerCase();
          if (!q) return;
          if (!conversionsMap[q])
            conversionsMap[q] = { addToCart: 0, checkout: 0, revenue: 0 };
          if (data.conversionType === "add_to_cart")
            conversionsMap[q].addToCart += 1;
          if (data.conversionType === "checkout") {
            conversionsMap[q].checkout += 1;
            const orderTotal =
              typeof data.orderTotal === "number" ? data.orderTotal : 0;
            conversionsMap[q].revenue += orderTotal;
          }
        });

        const recommendations = await generateRecommendations(db, {
          days: schedule.payloadDays,
          inventoryItems,
          conversionsMap,
        });

        console.log("recommendations-digest: payload sizes", {
          windowDays: recommendations.windowDays,
          missingProducts: recommendations.missingProducts.length,
          underperformingCategories:
            recommendations.underperformingCategories.length,
          quickWins: recommendations.quickWins.length,
          spellingCorrections: recommendations.spellingCorrections.length,
          inventoryItems: inventoryItems.length,
          conversionsKeys: Object.keys(conversionsMap).length,
        });

        // Send digest email
        await sendRecommendationsDigestEmail(schedule, recommendations);

        // Audit event
        await db.collection("security_events").add({
          type: "send_recommendations_digest",
          performedBy: schedule.createdBy,
          scheduleId: schedule.id,
          windowDays: recommendations.windowDays,
          generatedAt: new Date(),
          counts: {
            missing: recommendations.missingProducts.length,
            underperforming: recommendations.underperformingCategories.length,
            quickWins: recommendations.quickWins.length,
            spelling: recommendations.spellingCorrections.length,
          },
        });

        // Calculate next schedule
        const nextRun = calculateNextSchedule(schedule.frequency, now);
        await db
          .collection("scheduled_reports")
          .doc(schedule.id)
          .update({
            lastSent: Timestamp.fromDate(now),
            nextScheduled: Timestamp.fromDate(nextRun),
          });
        processed.push(schedule.id);
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("Digest send failed", msg);
        errors.push({ id: schedule.id, error: msg });
      }
    }

    return res.status(200).json({
      ok: true,
      processed: processed.length,
      processedIds: processed,
      errors,
      timestamp: now.toISOString(),
    });
  } catch (e: any) {
    return res.status(500).json({ error: "digest-failed", message: e.message });
  }
}

function calculateNextSchedule(
  f: "daily" | "weekly" | "monthly",
  from: Date
): Date {
  const next = new Date(from);
  switch (f) {
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

async function sendRecommendationsDigestEmail(
  schedule: RecommendationDigestSchedule,
  data: any
) {
  const smtpHost = process.env.VITE_SMTP_HOST || "";
  const smtpUser = process.env.VITE_SMTP_USER || "";
  const smtpPass = process.env.VITE_SMTP_PASS || "";
  const smtpPort = parseInt(process.env.VITE_SMTP_PORT || "465", 10);
  const smtpSecure = (process.env.VITE_SMTP_SECURE || "true") === "true";
  if (!smtpHost || !smtpUser || !smtpPass)
    throw new Error("SMTP configuration missing");
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const topMissing = data.missingProducts.slice(0, 5);
  const topQuickWins = data.quickWins.slice(0, 5);

  const htmlSections = `
  <h2 style="margin:24px 0 8px;font-size:18px;color:#0ea5e9;">Top Missing Products (Window ${
    data.windowDays
  }d)</h2>
  ${
    topMissing.length
      ? `<table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:13px;">${topMissing
          .map(
            (m: any) =>
              `<tr style="border-bottom:1px solid #eee"><td style="font-weight:600">${escapeHtml(
                m.query
              )}</td><td>${m.searches} searches</td><td>${
                m.zeroResults
              } zero</td><td>${m.impactScore ?? ""}</td></tr>`
          )
          .join("")}</table>`
      : '<p style="color:#6b7280">No strong missing signals.</p>'
  }
  <h2 style="margin:24px 0 8px;font-size:18px;color:#0ea5e9;">Quick Wins</h2>
  ${
    topQuickWins.length
      ? `<table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:13px;">${topQuickWins
          .map(
            (q: any) =>
              `<tr style="border-bottom:1px solid #eee"><td style="font-weight:600">${escapeHtml(
                q.item
              )}</td><td>${q.searches} searches</td><td>${
                q.impactScore ?? ""
              }</td><td>${
                q.revenue ? "£" + Math.round(q.revenue) : ""
              }</td></tr>`
          )
          .join("")}</table>`
      : '<p style="color:#6b7280">No quick win items.</p>'
  }
  <h2 style="margin:24px 0 8px;font-size:18px;color:#0ea5e9;">Underperforming Categories</h2>
  ${
    data.underperformingCategories.length
      ? `<table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:13px;">${data.underperformingCategories
          .slice(0, 5)
          .map(
            (c: any) =>
              `<tr style="border-bottom:1px solid #eee"><td style="font-weight:600">${escapeHtml(
                c.category
              )}</td><td>${c.searches} searches</td><td>avg ${
                c.avgResults
              }</td></tr>`
          )
          .join("")}</table>`
      : '<p style="color:#6b7280">No category friction signals.</p>'
  }
  <h2 style="margin:24px 0 8px;font-size:18px;color:#0ea5e9;">Spelling / Synonym Corrections</h2>
  ${
    data.spellingCorrections.length
      ? `<ul style="margin:0;padding-left:18px;font-size:13px;">${data.spellingCorrections
          .slice(0, 5)
          .map(
            (s: any) =>
              `<li><strong>${escapeHtml(s.canonical)}</strong> • ${
                s.totalVariants
              } variants</li>`
          )
          .join("")}</ul>`
      : '<p style="color:#6b7280">No correction clusters.</p>'
  }
  `;

  const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${
    schedule.name
  }</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.55;color:#1f2937;max-width:660px;margin:0 auto;padding:24px;background:#0d1117;">
    <div style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);padding:24px;border-radius:12px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">${schedule.name}</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;">${
        schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)
      } Recommendations Digest • ${new Date().toLocaleDateString()}</p>
    </div>
    <div style="background:#fff;padding:24px;border-radius:12px;margin-top:16px;">
      ${htmlSections}
      <p style="margin-top:24px;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;">Automated digest generated from search & conversion intelligence (window ${
        data.windowDays
      } days). Manage schedules in Admin Panel.</p>
    </div>
    <div style="text-align:center;margin-top:24px;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Vortex PCs Ltd.</div>
  </body></html>`;

  const emailText = `${schedule.name} - ${
    schedule.frequency
  } Recommendations Digest\nWindow ${
    data.windowDays
  } days\nTop Missing:${topMissing
    .map((m: any) => ` ${m.query}(${m.searches})`)
    .join(", ")}\nQuick Wins:${topQuickWins
    .map((q: any) => ` ${q.item}(${q.searches})`)
    .join(", ")}\nUnderperforming:${data.underperformingCategories
    .slice(0, 5)
    .map((c: any) => ` ${c.category}`)
    .join(", ")}\nCorrections:${data.spellingCorrections
    .slice(0, 5)
    .map((s: any) => ` ${s.canonical}`)
    .join(", ")}\n`;

  for (const recipient of schedule.recipients) {
    try {
      const result = await sendEmailWithRetry(transporter, {
        from: smtpUser,
        to: recipient,
        subject: `${schedule.name} – Recommendations Digest`,
        html: emailHtml,
        text: emailText,
      });
      if (!result.success) throw new Error(result.error || "send-failed");
      console.log("Sent recommendations digest to", recipient);
    } catch (e) {
      console.error("Failed sending digest to", recipient, e);
    }
  }
}

function escapeHtml(str: string) {
  return str.replace(
    /[&<>\"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ] as string)
  );
}

