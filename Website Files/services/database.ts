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
import { db } from "../config/firebase";
import { logger } from "./logger";

// Timestamp helper utilities
type TimestampLike = { toDate: () => Date };
const hasToDate = (val: unknown): val is TimestampLike =>
  !!val &&
  typeof val === "object" &&
  "toDate" in val &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof (val as Record<string, unknown> as any).toDate === "function";
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
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  paymentId?: string;
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

/**
 * Create new order
 */
export const createOrder = async (
  orderData: Omit<Order, "id">
): Promise<string> => {
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
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("orderDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];

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

    return orders;
  } catch (error: unknown) {
    logger.error("Get user orders error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get user orders"
    );
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: Order["status"],
  progress: number
): Promise<void> => {
  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(docRef, {
      status,
      progress,
      updatedAt: Timestamp.now(),
    });
  } catch (error: unknown) {
    logger.error("Update order status error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update order status"
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
    const q = query(
      collection(db, "orders"),
      orderBy("orderDate", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];

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

    return orders;
  } catch (error: unknown) {
    logger.error("Get all orders error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get all orders"
    );
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

    // Get page views
    const pageViewsQuery = query(
      collection(db, "analytics"),
      where("event", "==", "page_view"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate))
    );
    const pageViewsSnapshot = await getDocs(pageViewsQuery);
    const totalPageViews = pageViewsSnapshot.size;

    // Get unique visitors (count unique userIds)
    const uniqueUsers = new Set();
    pageViewsSnapshot.forEach((doc) => {
      const data = doc.data();
      uniqueUsers.add(data.userId);
    });
    const totalVisitors = uniqueUsers.size;

    // Get most visited pages
    const pageStats: Record<string, number> = {};
    pageViewsSnapshot.forEach((doc) => {
      const data = doc.data();
      pageStats[data.page] = (pageStats[data.page] || 0) + 1;
    });
    const topPages = Object.entries(pageStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, views]) => ({ page, views }));

    // Get page views by day
    const viewsByDay: Record<string, number> = {};
    pageViewsSnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.timestamp.toDate().toLocaleDateString();
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
    });

    return {
      totalPageViews,
      totalVisitors,
      averagePageViewsPerDay: Math.round(totalPageViews / days),
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

    // Calculate revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Count active builds
    const activeBuilds = orders.filter(
      (order) => order.status === "building" || order.status === "testing"
    ).length;

    // Get previous month stats for comparison (simplified)
    const currentMonth = new Date().getMonth();
    const currentMonthOrders = orders.filter(
      (order) => order.orderDate && order.orderDate.getMonth() === currentMonth
    );

    const currentMonthRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    return {
      orders: {
        total: orders.length,
        change: `+${currentMonthOrders.length}`,
        trend: "up" as const,
      },
      revenue: {
        total: totalRevenue,
        change: `+${(
          (currentMonthRevenue /
            Math.max(totalRevenue - currentMonthRevenue, 1)) *
          100
        ).toFixed(1)}%`,
        trend: "up" as const,
      },
      customers: {
        total: totalCustomers,
        change: "+5.7%",
        trend: "up" as const,
      },
      builds: {
        total: activeBuilds,
        change: `+${activeBuilds}`,
        trend: "up" as const,
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
