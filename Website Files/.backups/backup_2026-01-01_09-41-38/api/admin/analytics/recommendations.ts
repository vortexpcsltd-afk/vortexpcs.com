import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { DecodedTokenWithRole } from "../../../types/api.js";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { generateRecommendations } from "../../utils/recommendationsAggregator.js";
import { isDevelopment } from "../../services/env-utils.js";
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
      initError = new Error(
        "Missing Firebase admin credentials (recommendations)"
      );
      return;
    }
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const creds = JSON.parse(json);
    initializeApp({ credential: cert(creds) });
  } catch (e) {
    console.error("Admin init failed (recommendations)", e);
    initError = e instanceof Error ? e : new Error(String(e));
    // Don't throw - store error for handler to check
  }
}

// Try to initialize but catch errors
try {
  initAdminOnce();
} catch (e) {
  // Error stored in initError
}

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

async function verifyAdmin(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return { ok: false, reason: "missing-bearer" };
  const token = authHeader.split("Bearer ")[1];
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    const email = (decoded.email || "").toLowerCase();
    const rawAllow = (process.env.ADMIN_ALLOWLIST || "admin@vortexpcs.com")
      .split(/[\n,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const allow = new Set(rawAllow);
    console.log("[verifyAdmin] email:", email, "allowlist:", Array.from(allow));
    const db = getDb();
    if (!db) return { ok: false, reason: "db-unavailable" };
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const firestoreRole = (userDoc.data()?.role || "").toLowerCase();
    const claimsRole = String(
      (decoded as DecodedTokenWithRole).role || ""
    ).toLowerCase();
    console.log(
      "[verifyAdmin] firestoreRole:",
      firestoreRole,
      "claimsRole:",
      claimsRole,
      "isAdmin:",
      userDoc.data()?.isAdmin
    );
    const isAdmin =
      allow.has(email) ||
      firestoreRole === "admin" ||
      claimsRole === "admin" ||
      userDoc.data()?.isAdmin === true;
    console.log("[verifyAdmin] final isAdmin:", isAdmin);
    return { ok: isAdmin, email };
  } catch (e) {
    console.error("verifyAdmin error", e);
    return { ok: false, reason: "token-invalid" };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(
      "[recommendations] Request received, method:",
      req.method,
      "auth header:",
      req.headers.authorization?.substring(0, 20) + "..."
    );
    // Set JSON content type early
    res.setHeader("Content-Type", "application/json");

    // Check if Firebase initialization failed
    if (initError) {
      const guard = guardFirebaseAdminEnv();
      // If env missing, return feature-disabled 503 to avoid noise in logs
      if (!guard.ok) {
        return res
          .status(503)
          .json(featureDisabledPayload("recommendations", guard));
      }
      return res.status(500).json({
        error: "firebase-init-failed",
        message: initError.message,
        detail:
          "Firebase Admin SDK failed to initialize. Check environment variables.",
      });
    }

    if (req.method !== "GET") {
      return res.status(405).json({ error: "method-not-allowed" });
    }

    const adminCheck = await verifyAdmin(req);
    console.log("[recommendations] adminCheck result:", adminCheck);
    if (!adminCheck.ok) {
      return res.status(401).json({
        error: "not-admin",
        detail: adminCheck.reason,
      });
    }

    const daysParam = req.query.days
      ? parseInt(String(req.query.days))
      : undefined;
    const days =
      Number.isFinite(daysParam) && daysParam! > 0 ? daysParam : undefined;

    // Ensure Firestore is available after init checks
    const db = getDb();
    if (!db) {
      return res.status(500).json({
        error: "firestore-unavailable",
        message: "Firestore could not be initialized",
      });
    }

    // Build inventory list (best-effort - Contentful optional in serverless)
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
      console.warn("Inventory fetch skipped (Contentful likely disabled)", e);
    }

    // Conversion stats from searchConversions
    const windowDays = days ?? 30;
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

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
      "recommendations: conversions docs",
      convSnap.size,
      "windowDays",
      windowDays
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

    const data = await generateRecommendations(db, {
      days,
      inventoryItems,
      conversionsMap,
    });

    console.log("recommendations: payload sizes", {
      windowDays: data.windowDays,
      missingProducts: data.missingProducts.length,
      underperformingCategories: data.underperformingCategories.length,
      quickWins: data.quickWins.length,
      spellingCorrections: data.spellingCorrections.length,
      inventoryItems: inventoryItems.length,
      conversionsKeys: Object.keys(conversionsMap).length,
    });

    // lightweight audit event
    await db.collection("security_events").add({
      type: "generate_recommendations",
      performedBy: adminCheck.email,
      windowDays: data.windowDays,
      generatedAt: new Date(),
      counts: {
        missing: data.missingProducts.length,
        underperforming: data.underperformingCategories.length,
        quickWins: data.quickWins.length,
        spelling: data.spellingCorrections.length,
      },
    });

    return res.status(200).json({ ok: true, recommendations: data });
  } catch (e: any) {
    console.error("Recommendations generation failed", e);
    // Ensure JSON response even on error
    return res.status(500).json({
      error: "generation-failed",
      message: e?.message || "Unknown error",
      stack: isDevelopment() ? e?.stack : undefined,
    });
  }
}

