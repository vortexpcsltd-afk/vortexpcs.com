/**
 * Diagnostic endpoint for Analytics API troubleshooting
 * Tests Firebase connectivity, admin verification, Firestore access
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdmin } from "../../services/auth-admin.js";
import admin from "firebase-admin";

type EnvVarsCheck = {
  hasAdminCredentials: boolean;
  hasAdminAllowlist: boolean;
  adminAllowlist: string;
};

type FirebaseInitCheck = {
  success: boolean;
  hasDb?: boolean;
  error?: string;
};

type AdminAuthCheck = {
  success: boolean;
  uid?: string;
  email?: string;
  role?: string;
  reason?: string;
  error?: string;
};

type CollectionAccess = {
  accessible: boolean;
  docCount?: number;
  empty?: boolean;
  error?: string;
  code?: string;
};

type IndexCheck = {
  required: boolean;
  working: boolean;
  docCount?: number;
  error?: string;
  code?: string;
  hint?: string;
};

type Checks = {
  envVars?: EnvVarsCheck;
  firebaseInit: FirebaseInitCheck;
  adminAuth?: AdminAuthCheck;
  firestoreCollections: Record<string, CollectionAccess>;
  compositeIndexes: Record<string, IndexCheck>;
};

function getDb() {
  if (!admin.apps.length) {
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!credsBase64) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not found");
    }
    const creds = JSON.parse(
      Buffer.from(credsBase64, "base64").toString("utf-8")
    );
    admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
  }
  return admin.firestore();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const checks: Checks = {
    firebaseInit: { success: false },
    firestoreCollections: {},
    compositeIndexes: {},
  };

  // 1. Environment Variables
  checks.envVars = {
    hasAdminCredentials: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    hasAdminAllowlist: !!process.env.ADMIN_ALLOWLIST,
    adminAllowlist:
      process.env.ADMIN_ALLOWLIST || "(default: admin@vortexpcs.com)",
  };

  // 2. Firebase Admin SDK Initialization
  try {
    const db = getDb();
    checks.firebaseInit = { success: true, hasDb: !!db };
  } catch (error: unknown) {
    checks.firebaseInit = {
      success: false,
      error: (error as Error)?.message,
    };
    return res.status(500).json({
      success: false,
      message: "Firebase Admin SDK initialization failed",
      checks,
    });
  }

  // 3. Admin Authentication
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      checks.adminAuth = {
        success: false,
        reason:
          "No Authorization Bearer token. Sign in to the site and run Diagnose from the dashboard, or include an Authorization header.",
      };
    } else {
      const adminUser = await verifyAdmin(req);
      if (adminUser) {
        checks.adminAuth = {
          success: true,
          uid: adminUser.uid,
          email: adminUser.email,
          role: adminUser.role,
        };
      } else {
        checks.adminAuth = {
          success: false,
          reason:
            "verifyAdmin returned null - check token, custom claims, Firestore role, or allowlist",
        };
      }
    }
  } catch (error: unknown) {
    checks.adminAuth = { success: false, error: (error as Error)?.message };
  }

  // 4. Firestore Collections Access
  const db = getDb();
  const collectionTests = [
    "analytics_sessions",
    "analytics_pageviews",
    "analytics_events",
    "security_events",
  ];

  for (const col of collectionTests) {
    try {
      const snap = await db.collection(col).limit(1).get();
      checks.firestoreCollections[col] = {
        accessible: true,
        docCount: snap.size,
        empty: snap.empty,
      };
    } catch (error: unknown) {
      checks.firestoreCollections[col] = {
        accessible: false,
        error: (error as Error)?.message,
        // Firestore error codes often include index creation links
        code: (error as { code?: string })?.code,
      };
    }
  }

  // 5. Composite Index Tests (queries that require indexes)
  checks.compositeIndexes = {};

  // Test: analytics_sessions where isActive + lastActivity
  try {
    const fiveMin = new Date(Date.now() - 5 * 60 * 1000);
    const snap = await db
      .collection("analytics_sessions")
      .where("isActive", "==", true)
      .where("lastActivity", ">=", admin.firestore.Timestamp.fromDate(fiveMin))
      .limit(1)
      .get();
    checks.compositeIndexes.analytics_sessions_isActive_lastActivity = {
      required: true,
      working: true,
      docCount: snap.size,
    };
  } catch (error: unknown) {
    checks.compositeIndexes.analytics_sessions_isActive_lastActivity = {
      required: true,
      working: false,
      error: (error as Error)?.message,
      code: (error as { code?: string })?.code,
      hint: "Create composite index: analytics_sessions (isActive ASC, lastActivity ASC)",
    };
  }

  // Test: analytics_pageviews where timestamp + orderBy
  try {
    const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const snap = await db
      .collection("analytics_pageviews")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(thirtyDays))
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();
    checks.compositeIndexes.analytics_pageviews_timestamp_orderBy = {
      required: true,
      working: true,
      docCount: snap.size,
    };
  } catch (error: unknown) {
    checks.compositeIndexes.analytics_pageviews_timestamp_orderBy = {
      required: true,
      working: false,
      error: (error as Error)?.message,
      code: (error as { code?: string })?.code,
      hint: "Single field index might suffice, or composite: analytics_pageviews (timestamp DESC)",
    };
  }

  // Test: analytics_events where eventType + timestamp + orderBy
  try {
    const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const snap = await db
      .collection("analytics_events")
      .where("eventType", "==", "download")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(thirtyDays))
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();
    checks.compositeIndexes.analytics_events_eventType_timestamp = {
      required: true,
      working: true,
      docCount: snap.size,
    };
  } catch (error: unknown) {
    checks.compositeIndexes.analytics_events_eventType_timestamp = {
      required: true,
      working: false,
      error: (error as Error)?.message,
      code: (error as { code?: string })?.code,
      hint: "Create composite index: analytics_events (eventType ASC, timestamp DESC)",
    };
  }

  // Test: security_events where timestamp + orderBy
  try {
    const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const snap = await db
      .collection("security_events")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(thirtyDays))
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();
    checks.compositeIndexes.security_events_timestamp_orderBy = {
      required: true,
      working: true,
      docCount: snap.size,
    };
  } catch (error: unknown) {
    checks.compositeIndexes.security_events_timestamp_orderBy = {
      required: true,
      working: false,
      error: (error as Error)?.message,
      code: (error as { code?: string })?.code,
      hint: "Single field index might suffice: security_events (timestamp DESC)",
    };
  }

  // Test: analytics_sessions where startTime (range query)
  try {
    const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const snap = await db
      .collection("analytics_sessions")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(thirtyDays))
      .limit(1)
      .get();
    checks.compositeIndexes.analytics_sessions_startTime = {
      required: true,
      working: true,
      docCount: snap.size,
    };
  } catch (error: unknown) {
    checks.compositeIndexes.analytics_sessions_startTime = {
      required: true,
      working: false,
      error: (error as Error)?.message,
      code: (error as { code?: string })?.code,
      hint: "Single field index: analytics_sessions (startTime ASC)",
    };
  }

  // 6. Summary
  const allPassed =
    checks.firebaseInit.success &&
    checks.adminAuth?.success &&
    Object.values(checks.firestoreCollections).every((c) => c.accessible) &&
    Object.values(checks.compositeIndexes).every((idx) => idx.working);

  return res.status(allPassed ? 200 : 500).json({
    success: allPassed,
    message: allPassed
      ? "All diagnostics passed"
      : "Some checks failed - see details below",
    timestamp: new Date().toISOString(),
    checks,
    recommendations: allPassed
      ? []
      : [
          !checks.firebaseInit.success && "Fix Firebase Admin credentials",
          !checks.adminAuth?.success &&
            "Verify admin authentication (token, role, allowlist)",
          Object.values(checks.firestoreCollections).some(
            (v) => !v.accessible
          ) && "Check Firestore collection permissions",
          Object.values(checks.compositeIndexes).some((v) => !v.working) &&
            "Create missing Firestore composite indexes (see hints in compositeIndexes section)",
        ].filter(Boolean),
  });
}

