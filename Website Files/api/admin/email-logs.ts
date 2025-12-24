import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";

interface EmailLogData {
  to: string;
  subject: string;
  timestamp: Date | { toDate(): Date };
  status: string;
  [key: string]: unknown;
}

/**
 * Email Logs Viewer (Admin Diagnostic)
 * GET /api/admin/email-logs?limit=50
 * Returns recent email attempt logs from Firestore for diagnosis
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Initialize Firebase if needed
    if (!admin.apps.length) {
      const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (!credsBase64) {
        return res.status(500).json({ error: "Firebase not configured" });
      }
      const creds = JSON.parse(
        Buffer.from(credsBase64, "base64").toString("utf-8")
      );
      admin.initializeApp({ credential: admin.credential.cert(creds) });
    }

    const db = admin.firestore();
    const limitCount = parseInt(String(req.query.limit || "50"), 10);

    // Get recent email logs
    const logsSnap = await db
      .collection("email_logs")
      .orderBy("timestamp", "desc")
      .limit(limitCount)
      .get();

    const logs = logsSnap.docs.map((doc) => {
      const data = doc.data() as EmailLogData;
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
      };
    });

    // Get recent orders for cross-reference
    const ordersSnap = await db
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const orders = ordersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        total: data.total,
        address: data.address,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        source: data.source,
      };
    });

    return res.status(200).json({
      emailLogs: logs,
      recentOrders: orders,
      summary: {
        totalLogs: logs.length,
        configAttempts: logs.filter((l: any) => l.kind === "config").length,
        customerAttempts: logs.filter((l: any) => l.kind === "customer").length,
        businessAttempts: logs.filter((l: any) => l.kind === "business").length,
        successCount: logs.filter((l: any) => l.success).length,
        failureCount: logs.filter((l: any) => !l.success).length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || String(error),
      stack: error.stack,
    });
  }
}
