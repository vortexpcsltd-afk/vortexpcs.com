/**
 * Error Tracking Service
 * Stores and retrieves application errors in Firestore
 */

import admin from "firebase-admin";
import { ensureFirebaseAdminInitialized } from "./auth-admin";

export interface ErrorLog {
  id?: string;
  timestamp: Date;
  severity: "critical" | "error" | "warning";
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  request?: {
    url: string;
    method: string;
    ip?: string;
    userAgent?: string;
  };
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}

/**
 * Log an error to Firestore
 */
export async function logError(error: Omit<ErrorLog, "id">): Promise<string> {
  try {
    // Ensure Admin SDK is initialized before using Firestore
    ensureFirebaseAdminInitialized();
    const db = admin.firestore();
    const docRef = await db.collection("errorLogs").add({
      ...error,
      timestamp: admin.firestore.Timestamp.fromDate(error.timestamp),
      resolved: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Failed to log error to Firestore:", err);
    throw err;
  }
}

interface GetErrorLogsOptions {
  limit?: number;
  severity?: string;
  startDate?: Date;
  resolved?: boolean;
}

/**
 * Retrieve error logs from Firestore
 */
export async function getErrorLogs(
  options: GetErrorLogsOptions = {}
): Promise<ErrorLog[]> {
  try {
    ensureFirebaseAdminInitialized();
    const db = admin.firestore();
    let query = db
      .collection("errorLogs")
      .orderBy("timestamp", "desc")
      .limit(options.limit || 50);

    // Filter by severity
    if (options.severity) {
      query = query.where("severity", "==", options.severity);
    }

    // Filter by resolved status
    if (options.resolved !== undefined) {
      query = query.where("resolved", "==", options.resolved);
    }

    // Filter by date
    if (options.startDate) {
      query = query.where(
        "timestamp",
        ">=",
        admin.firestore.Timestamp.fromDate(options.startDate)
      );
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp.toDate(),
        resolvedAt: data.resolvedAt?.toDate(),
      } as ErrorLog;
    });
  } catch (err) {
    console.error("Failed to retrieve error logs:", err);
    throw err;
  }
}

/**
 * Mark an error as resolved
 */
export async function resolveError(
  errorId: string,
  resolvedBy: string,
  notes?: string
): Promise<void> {
  try {
    ensureFirebaseAdminInitialized();
    const db = admin.firestore();
    await db
      .collection("errorLogs")
      .doc(errorId)
      .update({
        resolved: true,
        resolvedBy,
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        notes: notes || "",
      });
  } catch (err) {
    console.error("Failed to resolve error:", err);
    throw err;
  }
}

/**
 * Get error statistics
 */
export async function getErrorStats(days: number = 7): Promise<{
  total: number;
  critical: number;
  errors: number;
  warnings: number;
  resolved: number;
  unresolved: number;
}> {
  try {
    ensureFirebaseAdminInitialized();
    const db = admin.firestore();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await db
      .collection("errorLogs")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .get();

    const stats = {
      total: snapshot.size,
      critical: 0,
      errors: 0,
      warnings: 0,
      resolved: 0,
      unresolved: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.severity === "critical") stats.critical++;
      if (data.severity === "error") stats.errors++;
      if (data.severity === "warning") stats.warnings++;
      if (data.resolved) stats.resolved++;
      else stats.unresolved++;
    });

    return stats;
  } catch (err) {
    console.error("Failed to get error stats:", err);
    throw err;
  }
}
