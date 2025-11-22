import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";
import type { ApiError } from "../../types/api";

function ensureAdminInitialized(): boolean {
  try {
    if (admin.apps.length) return true;
    const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (credsBase64) {
      const creds = JSON.parse(
        Buffer.from(credsBase64, "base64").toString("utf-8")
      );
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      return true;
    }
    const projectId =
      process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (projectId) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
      return true;
    }
    console.warn(
      "[Analytics API] Firebase Admin not configured; analytics will be no-op"
    );
    return false;
  } catch (e) {
    console.warn("[Analytics API] Admin init failed; no-op mode", e);
    return false;
  }
}

type TrackKind = "session" | "pageview" | "event" | "security";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  console.log("[Analytics API] Received request:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const initialized = ensureAdminInitialized();
    if (!initialized) {
      // Graceful no-op: accept request but do not persist, avoid 500 spam
      return res.status(202).json({ success: false, noop: true });
    }
    const db = admin.firestore();

    // Extract IP address from request headers
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket?.remoteAddress ||
      "unknown";
    console.log("[Analytics API] Visitor IP:", ip);

    // Robust body parsing to support sendBeacon with text/plain or Blob
    let body: unknown = (req as unknown as { body?: unknown }).body;
    try {
      if (!body) {
        // Some runtimes may expose rawBody as Buffer
        const raw = (req as unknown as { rawBody?: unknown }).rawBody as
          | Buffer
          | string
          | undefined;
        if (raw) {
          const str = Buffer.isBuffer(raw)
            ? raw.toString("utf-8")
            : String(raw);
          body = JSON.parse(str);
        }
      } else if (typeof body === "string") {
        body = JSON.parse(body);
      } else if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString("utf-8"));
      }
    } catch (e) {
      console.warn(
        "[Analytics API] Body parse fallback failed; using raw body"
      );
    }

    type IncomingAnalytics = {
      kind: TrackKind;
      payload: Record<string, unknown>;
    };
    const { kind, payload } =
      ((body || req.body) as IncomingAnalytics) || ({} as IncomingAnalytics);
    console.log("[Analytics API] Processing:", { kind });

    if (!kind || !payload) {
      console.error("[Analytics API] Missing kind or payload");
      return res.status(400).json({ error: "Missing kind or payload" });
    }

    if (kind === "session") {
      const sessionId =
        typeof (payload as Record<string, unknown>).sessionId === "string"
          ? ((payload as Record<string, unknown>).sessionId as string)
          : undefined;
      if (!sessionId)
        return res.status(400).json({ error: "Missing sessionId" });

      const ref = db.collection("analytics_sessions").doc(sessionId);
      const snap = await ref.get();
      const now = admin.firestore.Timestamp.now();
      if (snap.exists) {
        const updates: Record<string, unknown> = {
          lastActivity: now,
          isActive: payload.isActive ?? true,
        };
        if (
          payload.pages &&
          Array.isArray(payload.pages) &&
          payload.pages.length
        ) {
          const prev = (snap.data()?.pages as string[]) || [];
          updates.pages = [...prev, ...payload.pages].slice(-50);
        }
        if (typeof payload.pageViews === "number") {
          updates.pageViews = admin.firestore.FieldValue.increment(
            payload.pageViews
          );
        }
        await ref.update(updates);
      } else {
        await ref.set({
          sessionId,
          userId: payload.userId || null,
          startTime: now,
          lastActivity: now,
          pageViews: payload.pageViews || 0,
          pages: payload.pages || [],
          referrer: payload.referrer || "",
          referrerSource: payload.referrerSource || null,
          referrerTerm: payload.referrerTerm || null,
          userAgent: payload.userAgent || "",
          ip: ip,
          location: payload.location || {},
          device: payload.device || {
            type: "desktop",
            browser: "unknown",
            os: "unknown",
          },
          isActive: payload.isActive ?? true,
        });
      }
      return res.status(200).json({ success: true });
    }

    if (kind === "pageview") {
      const data = { ...(payload || {}) } as Record<string, unknown>;
      const ts = data.timestamp as unknown;
      const when =
        typeof ts === "string" || typeof ts === "number" || ts instanceof Date
          ? new Date(ts as string | number | Date)
          : new Date();
      (data as { timestamp: unknown }).timestamp =
        admin.firestore.Timestamp.fromDate(when);
      (data as { ip: string }).ip = ip;
      await db.collection("analytics_pageviews").add(data);
      console.log(
        "[Analytics API] ✅ Pageview tracked:",
        (data as Record<string, unknown>).page
      );
      if ((data as Record<string, unknown>).sessionId) {
        await db
          .collection("analytics_sessions")
          .doc(String((data as Record<string, unknown>).sessionId))
          .update({
            pageViews: admin.firestore.FieldValue.increment(1),
            lastActivity: admin.firestore.Timestamp.now(),
            isActive: true,
          });
        console.log("[Analytics API] ✅ Session updated for pageview");
      }
      return res.status(200).json({ success: true });
    }

    if (kind === "event") {
      const data = { ...(payload || {}) } as Record<string, unknown>;
      const ts = data.timestamp as unknown;
      const when =
        typeof ts === "string" || typeof ts === "number" || ts instanceof Date
          ? new Date(ts as string | number | Date)
          : new Date();
      (data as { timestamp: unknown }).timestamp =
        admin.firestore.Timestamp.fromDate(when);
      (data as { ip: string }).ip = ip;
      await db.collection("analytics_events").add(data);
      console.log(
        "[Analytics API] ✅ Event tracked:",
        (data as Record<string, unknown>).eventType
      );
      return res.status(200).json({ success: true });
    }

    if (kind === "security") {
      const data = { ...(payload || {}) } as Record<string, unknown>;
      const ts = data.timestamp as unknown;
      const when =
        typeof ts === "string" || typeof ts === "number" || ts instanceof Date
          ? new Date(ts as string | number | Date)
          : new Date();
      (data as { timestamp: unknown }).timestamp =
        admin.firestore.Timestamp.fromDate(when);
      await db.collection("security_events").add(data);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Unknown kind" });
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error("Analytics track error:", err);
    // Instead of 500 hard fail, return 202 noop with diagnostics to reduce console noise
    return res.status(202).json({
      success: false,
      noop: true,
      error: "Failed to track analytics",
      details: err?.message || String(err),
    });
  }
}
