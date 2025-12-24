import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

let db: ReturnType<typeof getFirestore> | null = null;

function initAdminOnce() {
  if (getApps().length) {
    if (!db) db = getFirestore();
    return true;
  }
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      db = getFirestore();
      return true;
    }
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!base64) {
      console.error("Missing Firebase admin credentials");
      return false;
    }
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const creds = JSON.parse(json);
    initializeApp({ credential: cert(creds) });
    db = getFirestore();
    return true;
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
    return false;
  }
}

async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.split("Bearer ")[1];
  try {
    if (!db) return false;
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    const rawAllow = (process.env.ADMIN_ALLOWLIST || "admin@vortexpcs.com")
      .split(",")
      .map((e) => e.trim());
    if (decodedToken.email && rawAllow.includes(decodedToken.email)) {
      return true;
    }

    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    return userData?.role === "admin" || userData?.isAdmin === true;
  } catch (error) {
    console.error("Auth verification error:", error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const initialized = initAdminOnce();
  if (!initialized || !db) {
    return res.status(503).json({
      error: "Service unavailable",
      details: "Database initialization failed",
    });
  }

  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  try {
    const { id, action, updates, items } = req.body;

    // Batch update multiple items
    if (action === "batch" && Array.isArray(items)) {
      const batch = db.batch();

      for (const item of items) {
        if (!item.id) continue;
        const docRef = db.collection("inventory").doc(item.id);

        const updateData: any = {};
        if (item.stock !== undefined) updateData.stock = item.stock;
        if (item.price !== undefined) updateData.price = item.price;
        if (item.reorderPoint !== undefined)
          updateData.reorderPoint = item.reorderPoint;

        batch.update(docRef, updateData);
      }

      await batch.commit();

      return res.status(200).json({
        success: true,
        message: `Updated ${items.length} items`,
      });
    }

    // Single item update
    if (!id) {
      return res.status(400).json({ error: "Item ID required" });
    }

    const docRef = db.collection("inventory").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updateData: any = {};

    if (action === "restock") {
      const { quantity } = req.body;
      if (typeof quantity !== "number" || quantity <= 0) {
        return res.status(400).json({ error: "Valid quantity required" });
      }
      updateData.stock = FieldValue.increment(quantity);
      updateData.lastRestocked = FieldValue.serverTimestamp();
    } else if (action === "adjust") {
      const { stock } = req.body;
      if (typeof stock !== "number" || stock < 0) {
        return res.status(400).json({ error: "Valid stock value required" });
      }
      updateData.stock = stock;
    } else if (updates) {
      // Generic update
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.sku !== undefined) updateData.sku = updates.sku;
      if (updates.category !== undefined)
        updateData.category = updates.category;
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.reorderPoint !== undefined)
        updateData.reorderPoint = updates.reorderPoint;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.supplier !== undefined)
        updateData.supplier = updates.supplier;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    return res.status(200).json({
      success: true,
      item: {
        id: updatedDoc.id,
        ...updatedData,
        lastRestocked: updatedData?.lastRestocked?.toDate() || null,
      },
    });
  } catch (error) {
    console.error("Inventory update error:", error);
    return res.status(500).json({
      error: "Failed to update inventory",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
