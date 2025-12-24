import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

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

// Verify admin authentication
async function verifyAdmin(
  req: VercelRequest
): Promise<{ ok: boolean; reason?: string; email?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, reason: "missing-bearer" };
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const email = (decodedToken.email || "").toLowerCase();
    let firestoreRole: string | undefined;
    try {
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      firestoreRole = (
        userDoc.data()?.role as string | undefined
      )?.toLowerCase();
      if (userDoc.exists && userDoc.data()?.isAdmin === true)
        firestoreRole = "admin";
    } catch (e) {
      console.warn("verifyAdmin Firestore role lookup failed", e);
    }
    const claimsRole = String((decodedToken as any).role || "").toLowerCase();
    const rawAllow = (process.env.ADMIN_ALLOWLIST || "admin@vortexpcs.com")
      .split(/[\n,\s,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const allow = new Set(rawAllow);
    const isAdmin =
      [firestoreRole, claimsRole].includes("admin") || allow.has(email);
    return { ok: isAdmin, reason: isAdmin ? undefined : "not-admin", email };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { ok: false, reason: "token-invalid" };
  }
}

interface ScheduledReport {
  id?: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  format: "pdf" | "excel";
  recipients: string[];
  metrics: string[];
  enabled: boolean;
  lastSent?: Date;
  nextScheduled?: Date;
  createdAt: Date;
  createdBy: string;
  kind?: string; // 'analytics' | 'recommendations' | future types
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Verify admin
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.ok) {
    res.setHeader("X-Admin-Verify", adminCheck.reason || "failed");
    // Return 401 for missing/invalid token, 403 for insufficient permissions
    const statusCode =
      adminCheck.reason === "missing-bearer" ||
      adminCheck.reason === "token-invalid"
        ? 401
        : 403;
    return res.status(statusCode).json({
      error:
        statusCode === 401
          ? "Unauthorized: Bearer token required"
          : "Forbidden: Admin access required",
      reason: adminCheck.reason,
    });
  }

  try {
    // GET - List all scheduled reports
    if (req.method === "GET") {
      const snapshot = await db
        .collection("scheduled_reports")
        .orderBy("createdAt", "desc")
        .get();

      const reports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastSent: doc.data().lastSent?.toDate(),
        nextScheduled: doc.data().nextScheduled?.toDate(),
      }));

      return res.status(200).json({ success: true, reports });
    }

    // POST - Create new scheduled report
    if (req.method === "POST") {
      const { name, frequency, format, recipients, metrics, enabled, kind } =
        req.body;

      if (
        !name ||
        !frequency ||
        !format ||
        !recipients ||
        (!metrics && kind !== "recommendations")
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["daily", "weekly", "monthly"].includes(frequency)) {
        return res.status(400).json({ error: "Invalid frequency" });
      }

      if (!["pdf", "excel"].includes(format)) {
        return res.status(400).json({ error: "Invalid format" });
      }

      // Calculate next scheduled time
      const now = new Date();
      let nextScheduled = new Date(now);

      switch (frequency) {
        case "daily":
          nextScheduled.setDate(now.getDate() + 1);
          nextScheduled.setHours(9, 0, 0, 0); // 9 AM next day
          break;
        case "weekly":
          nextScheduled.setDate(now.getDate() + 7);
          nextScheduled.setHours(9, 0, 0, 0); // 9 AM next week
          break;
        case "monthly":
          nextScheduled.setMonth(now.getMonth() + 1);
          nextScheduled.setDate(1); // First day of next month
          nextScheduled.setHours(9, 0, 0, 0);
          break;
      }

      const authHeader = req.headers.authorization!;
      const token = authHeader.split("Bearer ")[1];
      const { getAuth } = await import("firebase-admin/auth");
      const decodedToken = await getAuth().verifyIdToken(token);

      const reportData: ScheduledReport = {
        name,
        frequency,
        format,
        recipients,
        metrics: metrics || [],
        enabled: enabled !== false,
        nextScheduled,
        createdAt: now,
        createdBy: decodedToken.uid,
        kind: kind || "analytics",
      };

      const docRef = await db.collection("scheduled_reports").add({
        ...reportData,
        createdAt: Timestamp.fromDate(reportData.createdAt),
        nextScheduled: Timestamp.fromDate(nextScheduled),
      });

      return res.status(201).json({
        success: true,
        report: { id: docRef.id, ...reportData },
      });
    }

    // PUT - Update scheduled report
    if (req.method === "PUT") {
      const {
        id,
        name,
        frequency,
        format,
        recipients,
        metrics,
        enabled,
        kind,
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Report ID required" });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (frequency !== undefined) updateData.frequency = frequency;
      if (format !== undefined) updateData.format = format;
      if (recipients !== undefined) updateData.recipients = recipients;
      if (metrics !== undefined) updateData.metrics = metrics;
      if (enabled !== undefined) updateData.enabled = enabled;
      if (kind !== undefined) updateData.kind = kind;

      await db.collection("scheduled_reports").doc(id).update(updateData);

      return res.status(200).json({ success: true, message: "Report updated" });
    }

    // DELETE - Remove scheduled report
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Report ID required" });
      }

      await db
        .collection("scheduled_reports")
        .doc(id as string)
        .delete();

      return res.status(200).json({ success: true, message: "Report deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Scheduled reports error:", error);
    return res.status(500).json({
      error: "Failed to manage scheduled reports",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
