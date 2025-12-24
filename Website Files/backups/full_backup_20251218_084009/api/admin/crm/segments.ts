import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { subDays } from "date-fns";

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

// Verify admin authentication
async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    if (!db) return false;
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    // Check allowlist first
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

interface CustomerSegment {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;
  createdAt?: Date;
  avgOrderValue: number;
  rfmScore?: {
    recency: number; // 1-5 (5 = recent)
    frequency: number; // 1-5 (5 = frequent)
    monetary: number; // 1-5 (5 = high value)
    total: number; // Sum of R+F+M
  };
  tags: string[];
  location?: string;
}

async function calculateCustomerSegments() {
  if (!db) {
    throw new Error("Database not initialized");
  }

  interface UserRecord {
    id: string;
    displayName?: string;
    email?: string;
    createdAt?: Timestamp;
    address?:
      | string
      | {
          line1?: string;
          line2?: string;
          city?: string;
          country?: string;
          postcode?: string;
        };
  }

  interface OrderRecord {
    userId?: string;
    total?: number;
    createdAt?: Timestamp;
  }

  function formatAddress(addr: UserRecord["address"]): string | undefined {
    if (!addr) return undefined;
    if (typeof addr === "string") return addr;
    const parts = [
      addr.line1,
      addr.line2,
      addr.city,
      addr.postcode,
      addr.country,
    ]
      .filter(Boolean)
      .join(", ");
    return parts || undefined;
  }

  // Fetch all users
  const usersSnapshot = await db.collection("users").get();
  const users: UserRecord[] = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<UserRecord, "id">),
  }));

  // Fetch all orders
  const ordersSnapshot = await db.collection("orders").get();
  const orders: OrderRecord[] = ordersSnapshot.docs.map(
    (doc) => doc.data() as OrderRecord
  );

  const now = new Date();

  // Calculate customer metrics
  const customerMetrics: Map<string, CustomerSegment> = new Map();

  users.forEach((user) => {
    const userId = user.id;
    const userOrders = orders.filter((o) => o.userId === userId);

    if (userOrders.length === 0) {
      // User with no orders
      customerMetrics.set(userId, {
        id: userId,
        name:
          user.displayName ||
          (user.email ? user.email.split("@")[0] : "Unknown"),
        email: user.email || "",
        totalOrders: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        tags: ["no-orders"],
        location: formatAddress(user.address),
        createdAt: user.createdAt ? user.createdAt.toDate() : undefined,
      });
      return;
    }

    const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = totalSpent / userOrders.length;

    // Sort orders by date
    const sortedOrders = userOrders
      .filter((o) => o.createdAt)
      .sort((a, b) => {
        const aDate = (a.createdAt as Timestamp).toDate();
        const bDate = (b.createdAt as Timestamp).toDate();
        return aDate.getTime() - bDate.getTime();
      });

    const firstOrderDate = sortedOrders[0]?.createdAt
      ? (sortedOrders[0].createdAt as Timestamp).toDate()
      : undefined;
    const lastOrderDate = sortedOrders[sortedOrders.length - 1]?.createdAt
      ? (sortedOrders[sortedOrders.length - 1].createdAt as Timestamp).toDate()
      : undefined;

    // Calculate RFM scores
    const daysSinceLastOrder = lastOrderDate
      ? Math.floor(
          (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999;

    // Recency Score (1-5, 5 = most recent)
    let recencyScore = 1;
    if (daysSinceLastOrder <= 30) recencyScore = 5;
    else if (daysSinceLastOrder <= 60) recencyScore = 4;
    else if (daysSinceLastOrder <= 90) recencyScore = 3;
    else if (daysSinceLastOrder <= 180) recencyScore = 2;

    // Frequency Score (1-5, 5 = most frequent)
    let frequencyScore = 1;
    if (userOrders.length >= 10) frequencyScore = 5;
    else if (userOrders.length >= 5) frequencyScore = 4;
    else if (userOrders.length >= 3) frequencyScore = 3;
    else if (userOrders.length >= 2) frequencyScore = 2;

    // Monetary Score (1-5, 5 = highest value)
    let monetaryScore = 1;
    if (totalSpent >= 5000) monetaryScore = 5;
    else if (totalSpent >= 2000) monetaryScore = 4;
    else if (totalSpent >= 1000) monetaryScore = 3;
    else if (totalSpent >= 500) monetaryScore = 2;

    const rfmTotal = recencyScore + frequencyScore + monetaryScore;

    // Determine tags based on behavior
    const tags: string[] = [];

    // High-value customer
    if (totalSpent >= 2000 || rfmTotal >= 12) {
      tags.push("high-value");
    }

    // At-risk customer (no recent orders but was active)
    if (daysSinceLastOrder > 90 && userOrders.length >= 2) {
      tags.push("at-risk");
    }

    // Frequent buyer
    if (userOrders.length >= 5) {
      tags.push("frequent-buyer");
    }

    // First-time buyer
    if (userOrders.length === 1) {
      tags.push("first-time");
    }

    // Recent customer
    if (daysSinceLastOrder <= 30) {
      tags.push("recent");
    }

    // VIP (high frequency + high value)
    if (frequencyScore >= 4 && monetaryScore >= 4) {
      tags.push("vip");
    }

    customerMetrics.set(userId, {
      id: userId,
      name:
        user.displayName || (user.email ? user.email.split("@")[0] : "Unknown"),
      email: user.email || "",
      totalOrders: userOrders.length,
      totalSpent,
      avgOrderValue,
      firstOrderDate,
      lastOrderDate,
      createdAt: user.createdAt ? user.createdAt.toDate() : undefined,
      rfmScore: {
        recency: recencyScore,
        frequency: frequencyScore,
        monetary: monetaryScore,
        total: rfmTotal,
      },
      tags,
      location: formatAddress(user.address),
    });
  });

  return Array.from(customerMetrics.values());
}

function filterBySegment(
  customers: CustomerSegment[],
  segment: string
): CustomerSegment[] {
  switch (segment) {
    case "all":
      return customers;
    case "high-value":
      return customers.filter((c) => c.tags.includes("high-value"));
    case "at-risk":
      return customers.filter((c) => c.tags.includes("at-risk"));
    case "frequent-buyer":
      return customers.filter((c) => c.tags.includes("frequent-buyer"));
    case "first-time":
      return customers.filter((c) => c.tags.includes("first-time"));
    case "vip":
      return customers.filter((c) => c.tags.includes("vip"));
    case "recent":
      return customers.filter((c) => c.tags.includes("recent"));
    case "no-orders":
      return customers.filter((c) => c.totalOrders === 0);
    default:
      return customers;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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

  // Initialize Firebase
  const initialized = initAdminOnce();
  if (!initialized || !db) {
    return res.status(503).json({
      error: "Service unavailable",
      details: "Database initialization failed",
    });
  }

  // Verify admin
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  try {
    const { segment } = req.query;

    // Calculate all customer segments
    const allCustomers = await calculateCustomerSegments();

    // Filter by requested segment
    const filteredCustomers = segment
      ? filterBySegment(allCustomers, segment as string)
      : allCustomers;

    // Calculate segment statistics
    const stats = {
      total: allCustomers.length,
      highValue: allCustomers.filter((c) => c.tags.includes("high-value"))
        .length,
      atRisk: allCustomers.filter((c) => c.tags.includes("at-risk")).length,
      frequentBuyers: allCustomers.filter((c) =>
        c.tags.includes("frequent-buyer")
      ).length,
      firstTime: allCustomers.filter((c) => c.tags.includes("first-time"))
        .length,
      vip: allCustomers.filter((c) => c.tags.includes("vip")).length,
      recent: allCustomers.filter((c) => c.tags.includes("recent")).length,
      noOrders: allCustomers.filter((c) => c.totalOrders === 0).length,
      avgLifetimeValue:
        allCustomers.reduce((sum, c) => sum + c.totalSpent, 0) /
        allCustomers.length,
      avgOrderValue:
        allCustomers
          .filter((c) => c.totalOrders > 0)
          .reduce((sum, c) => sum + c.avgOrderValue, 0) /
        allCustomers.filter((c) => c.totalOrders > 0).length,
    };

    return res.status(200).json({
      success: true,
      customers: filteredCustomers,
      stats,
      segment: segment || "all",
    });
  } catch (error) {
    console.error("Customer segmentation error:", error);
    return res.status(500).json({
      error: "Failed to calculate customer segments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
