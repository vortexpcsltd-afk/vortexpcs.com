import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
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
    const { lowStockOnly, search } = req.query;

    // Fetch all inventory items
    const inventorySnapshot = await db.collection("inventory").get();

    let items = inventorySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Unknown Product",
        sku: data.sku || "",
        category: data.category || "Uncategorized",
        stock: data.stock || 0,
        reorderPoint: data.reorderPoint || 5,
        price: data.price || 0,
        supplier: data.supplier || "",
        lastRestocked: data.lastRestocked?.toDate() || null,
        notes: data.notes || "",
      };
    });

    // Filter by low stock if requested
    if (lowStockOnly === "true") {
      items = items.filter((item) => item.stock <= item.reorderPoint);
    }

    // Filter by search query
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.sku.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower)
      );
    }

    // Calculate statistics
    const stats = {
      totalItems: inventorySnapshot.size,
      lowStock: items.filter(
        (item) => item.stock <= item.reorderPoint && item.stock > 0
      ).length,
      outOfStock: items.filter((item) => item.stock === 0).length,
      totalValue: items.reduce((sum, item) => sum + item.stock * item.price, 0),
    };

    return res.status(200).json({
      success: true,
      items,
      stats,
    });
  } catch (error) {
    console.error("Inventory list error:", error);
    return res.status(500).json({
      error: "Failed to fetch inventory",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
