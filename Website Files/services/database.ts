/**
 * Firebase Firestore Database Service
 * Handles orders, user data, configurations, and other database operations
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { logger } from "./logger";

// Timestamp helper utilities
type TimestampLike = { toDate: () => Date };
const hasToDate = (val: unknown): val is TimestampLike =>
  !!val &&
  typeof val === "object" &&
  "toDate" in val &&
  typeof (val as { toDate?: unknown }).toDate === "function";
const toDateSafe = (value: unknown): Date | undefined => {
  if (hasToDate(value)) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  return undefined;
};
// (db, logger imports moved to top to avoid patch corruption)

export interface Order {
  id?: string;
  userId: string;
  orderId: string;
  /** Human friendly order number (e.g. VPC-20251122-AB12). May be absent on legacy docs */
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status:
    | "pending"
    | "pending_payment"
    | "building"
    | "testing"
    | "shipped"
    | "delivered"
    | "completed";
  progress: number;
  orderDate: Date;
  estimatedCompletion?: Date;
  deliveryDate?: Date;
  trackingNumber?: string;
  courier?: string; // Shipping courier name (e.g., "Royal Mail", "DPD", "DHL")
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  paymentId?: string;
  /** Stripe PaymentIntent id stored by webhook for deterministic lookups */
  stripePaymentIntentId?: string;
  /** Payment method (may be absent on legacy orders) */
  paymentMethod?: "card" | "paypal" | "bank_transfer";
  /** Bank transfer verification flags */
  bankTransferVerified?: boolean;
  bankTransferVerifiedAt?: Date;
  buildUpdates?: Array<{
    timestamp: Timestamp | Date;
    progress: number;
    status: string;
    note: string;
  }>;
  refundRequested?: boolean;
  refundRequestId?: string;
}

export interface SavedConfiguration {
  id?: string;
  userId: string;
  name: string;
  components: Record<string, unknown>;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

// Support ticket types
export type TicketStatus =
  | "open"
  | "in-progress"
  | "awaiting-customer"
  | "resolved"
  | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
  path?: string;
  scanStatus?: "pending" | "clean" | "infected" | "error";
}

export interface SupportTicketMessage {
  senderId?: string | null;
  senderName?: string | null;
  body: string;
  internal?: boolean; // visible to staff only
  timestamp: Timestamp | Date; // Firestore Timestamp on write; Date when read back
  attachments?: TicketAttachment[];
}

export interface SupportTicket {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message?: string; // initial message (legacy field)
  type: string; // e.g. technical, billing, order, other
  status: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedTo?: { userId: string; name?: string } | null;
  createdAt: Date;
  updatedAt?: Date;
  messages?: SupportTicketMessage[];
}

// Subscription interfaces (business support plans)
export type SubscriptionStatus = "active" | "expiring-soon" | "expired";
export type SubscriptionPlan =
  | "essential-care"
  | "priority-support"
  | "business-premium";
export interface SubscriptionRecord {
  id?: string;
  userId: string;
  plan: SubscriptionPlan;
  planName?: string;
  status: SubscriptionStatus;
  startDate: Date;
  renewalDate: Date;
  price: number;
  billing: "monthly" | "annual";
  autoRenew: boolean;
  machinesCovered?: number;
}

/**
 * Create new order
 */
export const createOrder = async (
  orderData: Omit<Order, "id">
): Promise<string> => {
  // Check if Firebase is configured (client-side)
  if (!db) {
    logger.error("Firebase not configured - cannot create order client-side");
    throw new Error(
      "Firebase client not configured. Order creation requires server-side processing via webhook."
    );
  }

  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      orderDate: Timestamp.fromDate(orderData.orderDate),
      estimatedCompletion: orderData.estimatedCompletion
        ? Timestamp.fromDate(orderData.estimatedCompletion)
        : null,
    });

    return docRef.id;
  } catch (error: unknown) {
    logger.error("Create order error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create order"
    );
  }
};

/**
 * Fetch user subscriptions (business support plans)
 * Falls back gracefully if collection absent or Firebase not configured.
 */
export const getUserSubscriptions = async (
  userId: string
): Promise<SubscriptionRecord[]> => {
  if (!db) return [];
  try {
    const colRef = collection(db, "subscriptions");
    const q = query(colRef, where("userId", "==", userId));
    const snap = await getDocs(q);
    const results: SubscriptionRecord[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const start = toDateSafe(data.startDate) || new Date();
      const renewal =
        toDateSafe(data.renewalDate) ||
        new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
      const status: SubscriptionStatus =
        (data.status as SubscriptionStatus) || "active";
      results.push({
        id: docSnap.id,
        userId,
        plan: (data.plan as SubscriptionPlan) || "essential-care",
        planName: data.planName || "Essential Care",
        status,
        startDate: start,
        renewalDate: renewal,
        price: typeof data.price === "number" ? data.price : 0,
        billing: data.billing === "annual" ? "annual" : "monthly",
        autoRenew: !!data.autoRenew,
        machinesCovered:
          typeof data.machinesCovered === "number"
            ? data.machinesCovered
            : undefined,
      });
    });
    return results;
  } catch (error) {
    logger.warn("getUserSubscriptions: failed", { error });
    return [];
  }
};

/**
 * Get order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, "orders", orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        orderDate: toDateSafe(data.orderDate),
        estimatedCompletion: toDateSafe(data.estimatedCompletion),
        deliveryDate: toDateSafe(data.deliveryDate),
      } as Order;
    }

    return null;
  } catch (error: unknown) {
    logger.error("Get order error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get order"
    );
  }
};

/**
 * Find order by stripePaymentIntentId (secondary lookup to handle legacy doc id mismatches)
 */
export const findOrderByStripePaymentIntentId = async (
  paymentIntentId: string
): Promise<Order | null> => {
  if (!db) return null;
  try {
    const qRef = query(
      collection(db, "orders"),
      where("stripePaymentIntentId", "==", paymentIntentId)
    );
    const snap = await getDocs(qRef);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      orderDate: toDateSafe(data.orderDate),
      estimatedCompletion: toDateSafe(data.estimatedCompletion),
      deliveryDate: toDateSafe(data.deliveryDate),
    } as Order;
  } catch (error) {
    logger.error("findOrderByStripePaymentIntentId error", error);
    return null;
  }
};

/**
 * Get all orders for a user
 */
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  // If Firebase is not configured (truly undefined/null), return empty array.
  // Allow tests with mocked/empty db objects to proceed to Firestore query mocks.
  if (!db) {
    logger.debug("Firebase not configured - returning empty orders array");
    return [];
  }

  try {
    logger.info("Fetching orders for userId", { userId });
    // Remove orderBy to avoid index requirement - sort client-side instead
    const primaryQ = query(
      collection(db, "orders"),
      where("userId", "==", userId)
    );

    const primarySnap = await getDocs(primaryQ);
    logger.info("Orders (by userId) returned", { count: primarySnap.size });
    const orders: Order[] = [];

    primarySnap.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        orderDate: toDateSafe(data.orderDate),
        estimatedCompletion: toDateSafe(data.estimatedCompletion),
        deliveryDate: toDateSafe(data.deliveryDate),
      } as Order);
    });

    // Sort client-side (newest first)
    orders.sort((a, b) => {
      const ta =
        (a.orderDate instanceof Date
          ? a.orderDate.getTime()
          : new Date(a.orderDate).getTime()) || 0;
      const tb =
        (b.orderDate instanceof Date
          ? b.orderDate.getTime()
          : new Date(b.orderDate).getTime()) || 0;
      return tb - ta;
    });

    if (orders.length === 0) {
      const email = auth?.currentUser?.email || undefined;
      if (email) {
        logger.info("No orders by userId; checking by email", { email });
        // Query by customerEmail; avoid orderBy to prevent index requirement, we'll sort client-side
        const emailQ = query(
          collection(db, "orders"),
          where("customerEmail", "==", email)
        );
        const emailSnap = await getDocs(emailQ);
        emailSnap.forEach((doc) => {
          const data = doc.data();
          orders.push({
            id: doc.id,
            ...data,
            orderDate: toDateSafe(data.orderDate),
            estimatedCompletion: toDateSafe(data.estimatedCompletion),
            deliveryDate: toDateSafe(data.deliveryDate),
          } as Order);
        });
        // Sort newest first
        orders.sort((a, b) => {
          const ta =
            (a.orderDate instanceof Date
              ? a.orderDate.getTime()
              : new Date(a.orderDate).getTime()) || 0;
          const tb =
            (b.orderDate instanceof Date
              ? b.orderDate.getTime()
              : new Date(b.orderDate).getTime()) || 0;
          return tb - ta;
        });
        logger.info("Orders (by email) returned", { count: emailSnap.size });
      }
    }

    return orders;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isPermissionError = message
      .toLowerCase()
      .includes("missing or insufficient permissions");

    logger.error("Get all orders error:", error);

    if (isPermissionError) {
      logger.warn("getAllOrders permission denied; returning empty list");
      return [];
    }

    if (error instanceof Error) {
      logger.error("Error details:", {
        message: error.message,
        code: (error as { code?: string }).code,
        stack: error.stack,
      });
    }
    throw new Error(
      error instanceof Error ? error.message : "Failed to get all orders"
    );
  }
};

/**
 * Save PC configuration
 */
export const saveConfiguration = async (
  configData: Omit<SavedConfiguration, "id">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "configurations"), {
      ...configData,
      createdAt: Timestamp.fromDate(configData.createdAt),
      updatedAt: Timestamp.fromDate(configData.updatedAt),
    });

    return docRef.id;
  } catch (error: unknown) {
    logger.error("Save configuration error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to save configuration"
    );
  }
};

/**
 * Get user's saved configurations
 */
export const getUserConfigurations = async (
  userId: string
): Promise<SavedConfiguration[]> => {
  // If Firebase is not configured, return empty array (no configurations in development)
  const d = db as unknown;
  if (
    !(
      !!d &&
      typeof d === "object" &&
      Object.keys(d as Record<string, unknown>).length > 0
    )
  ) {
    logger.debug(
      "Firebase not configured - returning empty configurations array"
    );
    return [];
  }

  try {
    const q = query(
      collection(db, "configurations"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const configurations: SavedConfiguration[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      configurations.push({
        id: doc.id,
        ...data,
        createdAt: toDateSafe(data.createdAt)!,
        updatedAt: toDateSafe(data.updatedAt)!,
      } as SavedConfiguration);
    });

    return configurations;
  } catch (error: unknown) {
    logger.error("Get user configurations error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to get user configurations"
    );
  }
};

/**
 * Delete saved configuration
 */
export const deleteConfiguration = async (configId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "configurations", configId));
  } catch (error: unknown) {
    logger.error("Delete configuration error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete configuration"
    );
  }
};

/**
 * Get all orders (admin)
 */
export const getAllOrders = async (
  limitCount: number = 50
): Promise<Order[]> => {
  try {
    logger.debug("getAllOrders: Starting query", { limitCount });

    const q = query(
      collection(db, "orders"),
      orderBy("orderDate", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];

    logger.debug("getAllOrders: Query successful", {
      count: querySnapshot.size,
    });

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        orderDate: toDateSafe(data.orderDate),
        estimatedCompletion: toDateSafe(data.estimatedCompletion),
        deliveryDate: toDateSafe(data.deliveryDate),
      } as Order);
    });

    logger.debug("getAllOrders: Orders processed", {
      ordersCount: orders.length,
    });
    return orders;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isPermissionError = message
      .toLowerCase()
      .includes("missing or insufficient permissions");

    logger.error("Get all orders error:", error);

    if (isPermissionError) {
      logger.warn("getAllOrders permission denied; returning empty list");
      return [];
    }

    if (error instanceof Error) {
      logger.error("Error details:", {
        message: error.message,
        code: (error as { code?: string }).code,
        stack: error.stack,
      });
    }
    throw new Error(
      error instanceof Error ? error.message : "Failed to get all orders"
    );
  }
};

/**
 * Extended order fetch: includes legacy orders missing `orderDate` but having `createdAt`.
 * Performs two queries and merges results, deduping by id/orderId/paymentId.
 */
export const getAllOrdersExtended = async (
  limitPrimary: number = 1000,
  limitLegacy: number = 500
): Promise<Order[]> => {
  try {
    logger.debug("getAllOrdersExtended: Starting combined queries", {
      limitPrimary,
      limitLegacy,
    });

    // Primary query (current schema with orderDate)
    const primaryQ = query(
      collection(db, "orders"),
      orderBy("orderDate", "desc"),
      limit(limitPrimary)
    );
    const primarySnap = await getDocs(primaryQ);

    // Legacy/missing orderDate query (match null or missing, order by createdAt)
    // Firestore allows where(field, '==', null) to match null OR missing.
    let legacyOrders: Order[] = [];
    try {
      const legacyQ = query(
        collection(db, "orders"),
        where("orderDate", "==", null),
        orderBy("createdAt", "desc"),
        limit(limitLegacy)
      );
      const legacySnap = await getDocs(legacyQ);
      legacySnap.forEach((docSnap) => {
        const data = docSnap.data();
        legacyOrders.push({
          id: docSnap.id,
          ...data,
          orderDate: toDateSafe(data.orderDate) || toDateSafe(data.createdAt),
          estimatedCompletion: toDateSafe(data.estimatedCompletion),
          deliveryDate: toDateSafe(data.deliveryDate),
        } as Order);
      });
    } catch (legacyErr) {
      logger.warn("getAllOrdersExtended: Legacy query failed", { legacyErr });
      // Fallback: naive scan (only if primarySnap size is below limitPrimary)
      try {
        const fullSnap = await getDocs(collection(db, "orders"));
        fullSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.orderDate) {
            legacyOrders.push({
              id: docSnap.id,
              ...data,
              orderDate: toDateSafe(data.createdAt),
              estimatedCompletion: toDateSafe(data.estimatedCompletion),
              deliveryDate: toDateSafe(data.deliveryDate),
            } as Order);
          }
        });
      } catch (scanErr) {
        logger.error("getAllOrdersExtended: Fallback scan failed", {
          scanErr,
        });
      }
    }

    const primaryOrders: Order[] = [];
    primarySnap.forEach((docSnap) => {
      const data = docSnap.data();
      primaryOrders.push({
        id: docSnap.id,
        ...data,
        orderDate: toDateSafe(data.orderDate),
        estimatedCompletion: toDateSafe(data.estimatedCompletion),
        deliveryDate: toDateSafe(data.deliveryDate),
      } as Order);
    });

    // Merge & dedupe
    const mergedMap = new Map<string, Order>();
    const all = [...primaryOrders, ...legacyOrders];
    for (const o of all) {
      const keyCandidate =
        (o.paymentId as string | undefined) || o.orderId || o.id;
      const key: string = keyCandidate || o.id || Math.random().toString();
      if (!mergedMap.has(key)) mergedMap.set(key, o);
    }
    const merged = Array.from(mergedMap.values());
    logger.debug("getAllOrdersExtended: Merged result", {
      primary: primaryOrders.length,
      legacy: legacyOrders.length,
      merged: merged.length,
    });
    return merged;
  } catch (error) {
    logger.error("getAllOrdersExtended error", { error });
    // Fallback to primary method
    return getAllOrders(limitPrimary);
  }
};

/**
 * Claim guest orders for a newly registered/logged-in user.
 * Finds orders where customerEmail matches the user's email and userId is a guest placeholder.
 */
export const claimGuestOrders = async (
  userId: string,
  email: string | null | undefined
): Promise<{ claimed: number }> => {
  if (!email) return { claimed: 0 };
  try {
    const q = query(
      collection(db, "orders"),
      where("customerEmail", "==", email.toLowerCase())
    );
    const snap = await getDocs(q);
    let claimed = 0;
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const uidVal = String(data.userId || "");
      if (uidVal === "guest" || uidVal.startsWith("guest_")) {
        await updateDoc(docSnap.ref, {
          userId,
          claimedByUserAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        claimed++;
      }
    }
    if (claimed > 0) {
      logger.info("Guest orders claimed", { email, claimed });
    }
    return { claimed };
  } catch (error) {
    logger.error("claimGuestOrders error", { error });
    return { claimed: 0 };
  }
};

/**
 * Create support ticket
 */
export const createSupportTicket = async (ticketData: {
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: string;
  priority?: TicketPriority;
  category?: string;
  attachments?: TicketAttachment[]; // initial attachments (optional)
}): Promise<string> => {
  try {
    if (!db) {
      throw new Error(
        "Firebase is not initialized. Please check your environment variables."
      );
    }

    const now = Timestamp.now();
    const initialMessage: SupportTicketMessage = {
      senderId: ticketData.userId || null,
      senderName: ticketData.name || null,
      body: ticketData.message,
      internal: false,
      timestamp: now,
      attachments: ticketData.attachments || [],
    };

    const docRef = await addDoc(collection(db, "support_tickets"), {
      userId: ticketData.userId || null,
      name: ticketData.name,
      email: ticketData.email,
      subject: ticketData.subject,
      type: ticketData.type,
      status: "open",
      priority: ticketData.priority || "normal",
      category: ticketData.category || null,
      assignedTo: null,
      messages: [initialMessage],
      message: ticketData.message, // keep legacy field for compatibility
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  } catch (error: unknown) {
    logger.error("Create support ticket error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create support ticket"
    );
  }
};

/**
 * Add a message to a support ticket
 */
export const addSupportTicketMessage = async (
  ticketId: string,
  message: Omit<SupportTicketMessage, "timestamp"> & {
    timestamp?: Timestamp | Date;
  }
): Promise<void> => {
  try {
    const docRef = doc(db, "support_tickets", ticketId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Ticket not found");

    const data = snap.data() || {};
    const existing: unknown[] = data.messages || [];
    const entry: SupportTicketMessage = {
      senderId: message.senderId ?? null,
      senderName: message.senderName ?? null,
      body: message.body,
      internal: !!message.internal,
      timestamp: message.timestamp || Timestamp.now(),
      attachments: message.attachments || [],
    };
    await updateDoc(docRef, {
      messages: [...existing, entry],
      updatedAt: Timestamp.now(),
    });
  } catch (error: unknown) {
    logger.error("Add support ticket message error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to add message"
    );
  }
};

/** Assign a support ticket to a staff user */
export const assignSupportTicket = async (
  ticketId: string,
  staffUserId: string,
  staffName?: string
): Promise<void> => {
  try {
    const docRef = doc(db, "support_tickets", ticketId);
    await updateDoc(docRef, {
      assignedTo: { userId: staffUserId, name: staffName || null },
      updatedAt: Timestamp.now(),
    });
  } catch (error: unknown) {
    logger.error("Assign support ticket error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to assign ticket"
    );
  }
};

/** Set ticket status */
export const setSupportTicketStatus = async (
  ticketId: string,
  status: TicketStatus
): Promise<void> => {
  try {
    const docRef = doc(db, "support_tickets", ticketId);
    await updateDoc(docRef, { status, updatedAt: Timestamp.now() });
  } catch (error: unknown) {
    logger.error("Set support ticket status error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update ticket status"
    );
  }
};

/** Set ticket priority */
export const setSupportTicketPriority = async (
  ticketId: string,
  priority: TicketPriority
): Promise<void> => {
  try {
    const docRef = doc(db, "support_tickets", ticketId);
    await updateDoc(docRef, { priority, updatedAt: Timestamp.now() });
  } catch (error: unknown) {
    logger.error("Set support ticket priority error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update ticket priority"
    );
  }
};

/** Set ticket category */
export const setSupportTicketCategory = async (
  ticketId: string,
  category: string
): Promise<void> => {
  try {
    const docRef = doc(db, "support_tickets", ticketId);
    await updateDoc(docRef, { category, updatedAt: Timestamp.now() });
  } catch (error: unknown) {
    logger.error("Set support ticket category error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update ticket category"
    );
  }
};

/**
 * Analytics: Track page view
 */
export const trackPageView = async (
  userId: string | null,
  page: string
): Promise<void> => {
  try {
    await addDoc(collection(db, "analytics"), {
      userId: userId || "anonymous",
      event: "page_view",
      page,
      timestamp: Timestamp.now(),
    });
  } catch (error: unknown) {
    logger.error("Track page view error:", error);
    // Don't throw - analytics should fail silently
  }
};

/**
 * Analytics: Track custom event (e.g., add_to_cart, begin_checkout, purchase)
 */
export const trackEvent = async (
  userId: string | null,
  event: string,
  data?: Record<string, unknown>
): Promise<void> => {
  try {
    await addDoc(collection(db, "analytics"), {
      userId: userId || "anonymous",
      event,
      data: data || {},
      timestamp: Timestamp.now(),
    });
  } catch (error: unknown) {
    logger.error("Track event error:", error);
    // Silent fail
  }
};

/**
 * Get analytics data for admin dashboard
 */
export const getAnalytics = async (days: number = 30) => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get page views from analytics collection (where trackPageView writes data)
    const pageViewsQuery = query(
      collection(db, "analytics"),
      where("event", "==", "page_view"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate))
    );
    const pageViewsSnapshot = await getDocs(pageViewsQuery);
    const totalPageViews = pageViewsSnapshot.size;

    // Get unique visitors (count unique userIds or sessionIds)
    const uniqueUsers = new Set();
    pageViewsSnapshot.forEach((doc) => {
      const data = doc.data();
      uniqueUsers.add(data.userId || data.sessionId);
    });
    const totalVisitors = uniqueUsers.size;

    // Get most visited pages
    const pageStats: Record<string, number> = {};
    pageViewsSnapshot.forEach((doc) => {
      const data = doc.data();
      const page = data.page || "unknown";
      pageStats[page] = (pageStats[page] || 0) + 1;
    });
    const topPages = Object.entries(pageStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, views]) => ({ page, views }));

    // Get page views by day
    const viewsByDay: Record<string, number> = {};
    pageViewsSnapshot.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp;
      const date =
        timestamp instanceof Timestamp
          ? timestamp.toDate().toLocaleDateString("en-GB")
          : new Date(timestamp).toLocaleDateString("en-GB");
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
    });

    logger.debug("Analytics data loaded", {
      totalPageViews,
      totalVisitors,
      viewsByDay,
    });

    return {
      totalPageViews,
      totalVisitors,
      averagePageViewsPerDay: Math.round(totalPageViews / Math.max(days, 1)),
      topPages,
      viewsByDay,
    };
  } catch (error: unknown) {
    logger.error("Get analytics error:", error);
    return {
      totalPageViews: 0,
      totalVisitors: 0,
      averagePageViewsPerDay: 0,
      topPages: [],
      viewsByDay: {},
    };
  }
};

/**
 * Get all users (admin only)
 */
export interface RawUserRecord {
  id?: string;
  email?: string;
  displayName?: string;
  createdAt?: Date | undefined;
  role?: unknown;
  // Allow arbitrary metadata fields
  [key: string]: unknown;
}
export const getAllUsers = async (): Promise<RawUserRecord[]> => {
  // If Firebase is not configured, return empty array
  const d = db as unknown;
  if (
    !(
      !!d &&
      typeof d === "object" &&
      Object.keys(d as Record<string, unknown>).length > 0
    )
  ) {
    logger.debug("Firebase not configured - returning empty users array");
    return [];
  }

  try {
    logger.debug("🔍 Fetching all users from Firestore...");
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: RawUserRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logger.debug("👤 Found user", { id: doc.id, email: data.email });
      users.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
      });
    });

    logger.debug(`✅ Successfully loaded ${users.length} users`);
    return users;
  } catch (error: unknown) {
    logger.error("❌ Get all users error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get users"
    );
  }
};

/**
 * Update user profile (admin only)
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<RawUserRecord>
): Promise<void> => {
  try {
    const ref = doc(db, "users", userId);
    await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() });
  } catch (error: unknown) {
    logger.error("Update user profile error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update user profile"
    );
  }
};

/**
 * Get dashboard statistics (admin only)
 */
export const getDashboardStats = async () => {
  try {
    // Get all orders
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const orders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        orderDate: data.orderDate?.toDate(),
      } as Order);
    });

    // Get all users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const totalCustomers = usersSnapshot.size;

    // Calculate revenue - coerce possible string totals to numbers safely
    const totalRevenue = orders.reduce((sum, order) => {
      const raw = (order as unknown as { total?: unknown }).total;
      let val = 0;
      if (typeof raw === "number" && Number.isFinite(raw)) {
        val = raw;
      } else if (typeof raw === "string") {
        // Strip currency symbols/commas
        const cleaned = raw.replace(/[^0-9.-]/g, "");
        const parsed = parseFloat(cleaned);
        if (Number.isFinite(parsed)) val = parsed;
      }
      return sum + val;
    }, 0);

    // Count active builds
    const activeBuilds = orders.filter(
      (order) => order.status === "building" || order.status === "testing"
    ).length;

    // Get previous month stats for comparison (simplified)
    const currentMonth = new Date().getMonth();
    const currentMonthOrders = orders.filter(
      (order) => order.orderDate && order.orderDate.getMonth() === currentMonth
    );

    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => {
      const raw = (order as unknown as { total?: unknown }).total;
      let val = 0;
      if (typeof raw === "number" && Number.isFinite(raw)) {
        val = raw;
      } else if (typeof raw === "string") {
        const cleaned = raw.replace(/[^0-9.-]/g, "");
        const parsed = parseFloat(cleaned);
        if (Number.isFinite(parsed)) val = parsed;
      }
      return sum + val;
    }, 0);

    // Calculate month-over-month change safely
    const previousMonthRevenue = Math.max(
      totalRevenue - currentMonthRevenue,
      0.01
    ); // Avoid divide by zero
    const revenueChange =
      previousMonthRevenue > 0
        ? (
            ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
            100
          ).toFixed(1)
        : "0.0";

    // Calculate realistic trends for display
    const revenueChangeNum = parseFloat(revenueChange);
    const revenueChangeStr =
      revenueChangeNum >= 0 ? `+${revenueChange}%` : `${revenueChange}%`;
    const revenueTrend = revenueChangeNum >= 0 ? "up" : "down";

    return {
      orders: {
        total: orders.length,
        change: `+${currentMonthOrders.length} this month`,
        trend:
          currentMonthOrders.length > 0 ? ("up" as const) : ("down" as const),
      },
      revenue: {
        total: totalRevenue,
        change: revenueChangeStr,
        trend: revenueTrend as "up" | "down",
      },
      customers: {
        total: totalCustomers,
        change: "+5.7%",
        trend: "up" as const,
      },
      builds: {
        total: activeBuilds,
        change: `+${activeBuilds}%`,
        trend: activeBuilds > 0 ? ("up" as const) : ("down" as const),
      },
    };
  } catch (error: unknown) {
    logger.error("Get dashboard stats error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to get dashboard statistics"
    );
  }
};

/**
 * Update full order details (admin only)
 */
export const updateOrder = async (
  orderId: string,
  updates: Partial<Order>
): Promise<void> => {
  try {
    const docRef = doc(db, "orders", orderId);
    const updateData: Record<string, unknown> = { ...updates };

    // Convert dates to Timestamps
    if (updates.orderDate) {
      updateData.orderDate = Timestamp.fromDate(updates.orderDate);
    }
    if (updates.estimatedCompletion) {
      updateData.estimatedCompletion = Timestamp.fromDate(
        updates.estimatedCompletion
      );
    }
    if (updates.deliveryDate) {
      updateData.deliveryDate = Timestamp.fromDate(updates.deliveryDate);
    }

    updateData.updatedAt = Timestamp.now();

    await updateDoc(docRef, updateData);
  } catch (error: unknown) {
    logger.error("Update order error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update order"
    );
  }
};

/**
 * Update build progress for a specific order (admin only)
 */
export const updateBuildProgress = async (
  orderId: string,
  progress: number,
  status: Order["status"],
  statusNote?: string
): Promise<void> => {
  try {
    const docRef = doc(db, "orders", orderId);
    const updateData: Record<string, unknown> = {
      progress: Math.min(100, Math.max(0, progress)), // Clamp between 0-100
      status,
      updatedAt: Timestamp.now(),
    };

    if (statusNote) {
      // Add build update to timeline
      const buildUpdates = await getDoc(docRef);
      const existingUpdates = buildUpdates.data()?.buildUpdates || [];
      updateData.buildUpdates = [
        ...existingUpdates,
        {
          timestamp: Timestamp.now(),
          progress,
          status,
          note: statusNote,
        },
      ];
    }

    await updateDoc(docRef, updateData);
  } catch (error: unknown) {
    logger.error("Update build progress error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update build progress"
    );
  }
};

/**
 * Add a build update step (optionally adjust status/progress)
 */
export const addBuildUpdate = async (
  orderId: string,
  update: { progress?: number; status?: Order["status"]; note?: string }
): Promise<void> => {
  try {
    const docRef = doc(db, "orders", orderId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Order not found");

    const data = snap.data() || {};
    const existingUpdates = data.buildUpdates || [];
    const now = Timestamp.now();
    const entry = {
      timestamp: now,
      progress:
        typeof update.progress === "number"
          ? update.progress
          : data.progress || 0,
      status: update.status || data.status || "pending",
      note: update.note || "",
    };

    await updateDoc(docRef, {
      buildUpdates: [...existingUpdates, entry],
      ...(typeof update.progress === "number"
        ? { progress: Math.min(100, Math.max(0, update.progress)) }
        : {}),
      ...(update.status ? { status: update.status } : {}),
      updatedAt: now,
    });
  } catch (error: unknown) {
    logger.error("Add build update error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to add build update"
    );
  }
};

/**
 * Get all support tickets (admin)
 */
export const getAllSupportTickets = async (): Promise<SupportTicket[]> => {
  try {
    logger.debug("getAllSupportTickets: Loading all tickets");

    const q = query(collection(db, "support_tickets"));
    const querySnapshot = await getDocs(q);

    logger.debug("getAllSupportTickets: Found tickets", {
      count: querySnapshot.size,
    });

    const tickets: SupportTicket[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tickets.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as SupportTicket);
    });

    // Sort in memory instead of Firestore query
    tickets.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime; // descending order
    });

    logger.debug("getAllSupportTickets: Returning tickets", {
      count: tickets.length,
    });
    return tickets;
  } catch (error: unknown) {
    logger.error("Get support tickets error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get support tickets"
    );
  }
};

/**
 * Get user's support tickets
 */
export const getUserSupportTickets = async (
  userId: string
): Promise<SupportTicket[]> => {
  try {
    logger.debug("getUserSupportTickets: Loading tickets for user", { userId });

    // Try without orderBy first - it may require a Firestore index
    const q = query(
      collection(db, "support_tickets"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    logger.debug("getUserSupportTickets: Found tickets", {
      count: querySnapshot.size,
    });

    const tickets: SupportTicket[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logger.debug("getUserSupportTickets: Processing ticket", { id: doc.id });
      tickets.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as SupportTicket);
    });

    // Sort in memory instead of Firestore query
    tickets.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime; // descending order
    });

    logger.debug("getUserSupportTickets: Returning tickets", {
      count: tickets.length,
    });
    return tickets;
  } catch (error: unknown) {
    logger.error("Get user support tickets error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get support tickets"
    );
  }
};

/**
 * Get a single support ticket by id
 */
export const getSupportTicketById = async (
  ticketId: string
): Promise<SupportTicket | null> => {
  try {
    const ref = doc(db, "support_tickets", ticketId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const raw = snap.data() as Record<string, unknown>;
    const createdAt = toDateSafe(raw.createdAt) || new Date();
    const updatedAt = toDateSafe(raw.updatedAt);
    const rawMessages = (raw as Record<string, unknown>).messages as
      | unknown[]
      | undefined;
    const messages: SupportTicket["messages"] = (rawMessages || []).map((m) => {
      const mm = m as Record<string, unknown>;
      return {
        senderId:
          typeof mm.senderId === "string" || mm.senderId === null
            ? (mm.senderId as string | null)
            : null,
        senderName:
          typeof mm.senderName === "string" ? (mm.senderName as string) : null,
        body: typeof mm.body === "string" ? (mm.body as string) : "",
        internal: Boolean(mm.internal),
        timestamp: toDateSafe(mm.timestamp) || new Date(),
        attachments: Array.isArray(mm.attachments)
          ? (mm.attachments as TicketAttachment[])
          : [],
      };
    });
    return {
      id: snap.id,
      userId: (raw.userId as string | undefined) ?? undefined,
      name: String(raw.name || ""),
      email: String(raw.email || ""),
      subject: String(raw.subject || "Support Ticket"),
      message:
        typeof raw.message === "string" ? (raw.message as string) : undefined,
      type: String(raw.type || "technical"),
      status: (raw.status as TicketStatus) || "open",
      priority: (raw.priority as TicketPriority) || "normal",
      category: (raw.category as string | undefined) ?? undefined,
      assignedTo:
        (raw.assignedTo as { userId: string; name?: string } | null) ?? null,
      createdAt,
      updatedAt: updatedAt,
      messages,
    } as SupportTicket;
  } catch (error: unknown) {
    logger.error("Get support ticket by id error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get support ticket"
    );
  }
};

/**
 * Update support ticket status
 */
export const updateSupportTicket = async (
  ticketId: string,
  updates: Partial<SupportTicket>
): Promise<void> => {
  try {
    const docRef = doc(db, "support_tickets", ticketId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error: unknown) {
    logger.error("Update support ticket error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update support ticket"
    );
  }
};

/**
 * Create refund request
 */
export const createRefundRequest = async (
  orderId: string,
  userId: string,
  reason: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "refund_requests"), {
      orderId,
      userId,
      reason,
      status: "pending",
      createdAt: Timestamp.now(),
    });

    // Update order status
    await updateDoc(doc(db, "orders", orderId), {
      refundRequested: true,
      refundRequestId: docRef.id,
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error: unknown) {
    logger.error("Create refund request error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create refund request"
    );
  }
};

/**
 * Get all refund requests (admin)
 */
export interface RefundRequest {
  id?: string;
  orderId: string;
  userId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export const getAllRefundRequests = async (): Promise<RefundRequest[]> => {
  try {
    const q = query(
      collection(db, "refund_requests"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const requests: RefundRequest[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as RefundRequest);
    });

    return requests;
  } catch (error: unknown) {
    logger.error("Get refund requests error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get refund requests"
    );
  }
};

/**
 * Get refund requests for a specific user
 */
export const getUserRefundRequests = async (
  userId: string
): Promise<RefundRequest[]> => {
  try {
    const q = query(
      collection(db, "refund_requests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const requests: RefundRequest[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as RefundRequest);
    });

    return requests;
  } catch (error: unknown) {
    logger.error("Get user refund requests error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get refund requests"
    );
  }
};

/**
 * Claim guest orders for a newly registered/logged-in user by matching email.
 * Any orders with matching customerEmail and userId of 'guest' or '' are updated.
 * Returns number of orders updated. Safe to call repeatedly (idempotent).
 */
export const claimGuestOrdersForUser = async (
  userId: string,
  email: string | null | undefined
): Promise<number> => {
  try {
    if (!email || !db) return 0;
    let updated = 0;
    // First handle explicit legacy guest identifiers
    const runLegacyQuery = async (guestId: string) => {
      const q = query(
        collection(db, "orders"),
        where("customerEmail", "==", email),
        where("userId", "==", guestId)
      );
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        try {
          await updateDoc(docSnap.ref, { userId, updatedAt: Timestamp.now() });
          updated++;
        } catch (e) {
          logger.warn("Failed to update guest order ownership", {
            orderId: docSnap.id,
            err: String(e),
          });
        }
      }
    };
    await runLegacyQuery("guest");
    await runLegacyQuery("");

    // Then scan for dynamically generated guest_* identifiers by email only
    const emailOnlyQuery = query(
      collection(db, "orders"),
      where("customerEmail", "==", email)
    );
    const emailSnap = await getDocs(emailOnlyQuery);
    for (const docSnap of emailSnap.docs) {
      const data = docSnap.data() as { userId?: string };
      const existingUserId = data.userId || "";
      if (
        existingUserId !== userId &&
        (existingUserId.startsWith("guest_") || existingUserId === "guest")
      ) {
        try {
          await updateDoc(docSnap.ref, { userId, updatedAt: Timestamp.now() });
          updated++;
        } catch (e) {
          logger.warn("Failed to update dynamic guest_* order ownership", {
            orderId: docSnap.id,
            err: String(e),
          });
        }
      }
    }
    if (updated > 0) {
      logger.info("Claimed guest orders", { count: updated, email, userId });
    }
    return updated;
  } catch (error) {
    logger.error("claimGuestOrdersForUser error", error);
    return 0; // fail silently
  }
};

/**
 * Inventory Management Functions
 */

export interface InventoryItem {
  id?: string;
  productId: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  reservedStock?: number;
  lowStockThreshold?: number;
  lastRestocked?: Date;
}

/**
 * Get inventory item by product ID
 */
export const getInventoryItem = async (
  productId: string
): Promise<InventoryItem | null> => {
  if (!db) {
    logger.warn("Firestore not initialized - inventory check skipped");
    return null;
  }

  try {
    const q = query(
      collection(db, "inventory"),
      where("productId", "==", productId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docData = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      productId: docData.productId,
      name: docData.name,
      category: docData.category,
      stock: docData.stock || 0,
      price: docData.price || 0,
      reservedStock: docData.reservedStock || 0,
      lowStockThreshold: docData.lowStockThreshold || 5,
      lastRestocked: toDateSafe(docData.lastRestocked),
    } as InventoryItem;
  } catch (error) {
    logger.error("Error fetching inventory item:", error);
    return null;
  }
};

/**
 * Update stock quantity for a product
 */
export const updateStock = async (
  productId: string,
  quantityChange: number
): Promise<boolean> => {
  if (!db) {
    logger.warn("Firestore not initialized - stock update skipped");
    return false;
  }

  try {
    const q = query(
      collection(db, "inventory"),
      where("productId", "==", productId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.warn(`Product ${productId} not found in inventory`);
      return false;
    }

    const inventoryDoc = snapshot.docs[0];
    const currentStock = inventoryDoc.data().stock || 0;
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      logger.error(`Cannot reduce stock below 0 for product ${productId}`);
      return false;
    }

    await updateDoc(inventoryDoc.ref, {
      stock: newStock,
      updatedAt: Timestamp.now(),
    });

    logger.info(
      `Stock updated for ${productId}: ${currentStock} -> ${newStock}`
    );
    return true;
  } catch (error) {
    logger.error("Error updating stock:", error);
    return false;
  }
};

/**
 * Reduce stock for multiple items (used during checkout)
 */
export const reduceStockForOrder = async (
  items: Array<{ productId: string; quantity: number; productName?: string }>
): Promise<{ success: boolean; errors?: string[] }> => {
  if (!db) {
    logger.warn("Firestore not initialized - stock reduction skipped");
    return { success: true }; // Don't block checkout if inventory isn't set up
  }

  const errors: string[] = [];

  try {
    for (const item of items) {
      const success = await updateStock(item.productId, -item.quantity);
      if (!success) {
        errors.push(
          `Failed to reduce stock for ${item.productName || item.productId}`
        );
      }
    }

    if (errors.length > 0) {
      logger.error("Stock reduction errors:", errors);
      return { success: false, errors };
    }

    logger.info("Stock reduced successfully for order", {
      itemCount: items.length,
    });
    return { success: true };
  } catch (error) {
    logger.error("Error reducing stock for order:", error);
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
};

/**
 * Check if items are in stock
 */
export const checkStock = async (
  items: Array<{ productId: string; quantity: number; productName?: string }>
): Promise<{ inStock: boolean; outOfStockItems: string[] }> => {
  if (!db) {
    logger.warn("Firestore not initialized - stock check skipped");
    return { inStock: true, outOfStockItems: [] };
  }

  const outOfStockItems: string[] = [];

  try {
    for (const item of items) {
      const inventoryItem = await getInventoryItem(item.productId);

      if (!inventoryItem) {
        // If item not in inventory system, assume it's available
        continue;
      }

      const availableStock =
        inventoryItem.stock - (inventoryItem.reservedStock || 0);
      if (availableStock < item.quantity) {
        outOfStockItems.push(
          `${item.productName || item.productId} (requested: ${
            item.quantity
          }, available: ${availableStock})`
        );
      }
    }

    return {
      inStock: outOfStockItems.length === 0,
      outOfStockItems,
    };
  } catch (error) {
    logger.error("Error checking stock:", error);
    // On error, allow the order to proceed
    return { inStock: true, outOfStockItems: [] };
  }
};

/**
 * Permanently delete an order (admin only).
 * Creates an audit copy in `deleted_orders` collection before removal.
 * Optionally rejects any pending refund requests tied to the order.
 */
export const deleteOrder = async (
  orderId: string,
  options?: { rejectRefundRequests?: boolean }
): Promise<{ success: boolean; refundRequestsRejected: number }> => {
  if (!db) {
    logger.error("deleteOrder: Firestore not initialized");
    throw new Error("Database not configured");
  }
  const rejectRefunds = options?.rejectRefundRequests === true;
  try {
    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) {
      logger.warn("deleteOrder: order not found", { orderId });
      return { success: false, refundRequestsRejected: 0 };
    }
    const raw = snap.data();

    // Prepare audit record
    const actor = auth?.currentUser?.uid || "admin";
    const auditData = {
      originalOrderId: orderId,
      deletedAt: Timestamp.now(),
      deletedBy: actor,
      orderSnapshot: raw,
    };
    await addDoc(collection(db, "deleted_orders"), auditData);

    let refundRejectedCount = 0;
    if (rejectRefunds) {
      try {
        const qRef = query(
          collection(db, "refund_requests"),
          where("orderId", "==", orderId)
        );
        const refundSnap = await getDocs(qRef);
        for (const r of refundSnap.docs) {
          const rData = r.data();
          // Only touch pending requests
          if (rData.status === "pending") {
            await updateDoc(r.ref, {
              status: "rejected",
              adminNote: "Order deleted by admin",
              updatedAt: Timestamp.now(),
            });
            refundRejectedCount++;
          }
        }
      } catch (e) {
        logger.error("deleteOrder: refund cascade failed", {
          orderId,
          error: e,
        });
      }
    }

    await deleteDoc(orderRef);
    logger.info("deleteOrder: order deleted", { orderId, refundRejectedCount });
    return { success: true, refundRequestsRejected: refundRejectedCount };
  } catch (error) {
    logger.error("deleteOrder error", { orderId, error });
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete order"
    );
  }
};

/**
 * Verify a bank transfer payment for an order. Sets status to 'building' if currently pending.
 */
export const verifyBankTransfer = async (orderId: string): Promise<void> => {
  if (!db) throw new Error("Database not configured");
  try {
    const ref = doc(db, "orders", orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Order not found");
    const data = snap.data() as { paymentMethod?: string; status?: string };
    if (data.paymentMethod !== "bank_transfer") {
      throw new Error("Not a bank transfer order");
    }
    await updateDoc(ref, {
      bankTransferVerified: true,
      bankTransferVerifiedAt: Timestamp.now(),
      // Auto-advance status if still pending / pending_payment
      status:
        data.status === "pending" || data.status === "pending_payment"
          ? "building"
          : data.status || "building",
      updatedAt: Timestamp.now(),
      progress:
        data.status === "pending" || data.status === "pending_payment"
          ? 5
          : undefined,
    });
    logger.info("Bank transfer verified", { orderId });
  } catch (error) {
    logger.error("verifyBankTransfer error", { orderId, error });
    throw new Error(
      error instanceof Error ? error.message : "Failed to verify bank transfer"
    );
  }
};
