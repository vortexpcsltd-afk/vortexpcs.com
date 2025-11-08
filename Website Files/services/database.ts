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
    timestamp: any;
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
  components: Record<string, any>;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
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
  } catch (error: any) {
    console.error("Create order error:", error);
    throw new Error(error.message || "Failed to create order");
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
        orderDate: data.orderDate?.toDate(),
        estimatedCompletion: data.estimatedCompletion?.toDate(),
        deliveryDate: data.deliveryDate?.toDate(),
      } as Order;
    }

    return null;
  } catch (error: any) {
    console.error("Get order error:", error);
    throw new Error(error.message || "Failed to get order");
  }
};

/**
 * Get all orders for a user
 */
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  // If Firebase is not configured, return empty array (no orders in development)
  if (!db) {
    console.log("Firebase not configured - returning empty orders array");
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
        orderDate: data.orderDate?.toDate(),
        estimatedCompletion: data.estimatedCompletion?.toDate(),
        deliveryDate: data.deliveryDate?.toDate(),
      } as Order);
    });

    return orders;
  } catch (error: any) {
    console.error("Get user orders error:", error);
    throw new Error(error.message || "Failed to get user orders");
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
  } catch (error: any) {
    console.error("Update order status error:", error);
    throw new Error(error.message || "Failed to update order status");
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
  } catch (error: any) {
    console.error("Save configuration error:", error);
    throw new Error(error.message || "Failed to save configuration");
  }
};

/**
 * Get user's saved configurations
 */
export const getUserConfigurations = async (
  userId: string
): Promise<SavedConfiguration[]> => {
  // If Firebase is not configured, return empty array (no configurations in development)
  if (!db) {
    console.log(
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
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as SavedConfiguration);
    });

    return configurations;
  } catch (error: any) {
    console.error("Get user configurations error:", error);
    throw new Error(error.message || "Failed to get user configurations");
  }
};

/**
 * Delete saved configuration
 */
export const deleteConfiguration = async (configId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "configurations", configId));
  } catch (error: any) {
    console.error("Delete configuration error:", error);
    throw new Error(error.message || "Failed to delete configuration");
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
        orderDate: data.orderDate?.toDate(),
        estimatedCompletion: data.estimatedCompletion?.toDate(),
        deliveryDate: data.deliveryDate?.toDate(),
      } as Order);
    });

    return orders;
  } catch (error: any) {
    console.error("Get all orders error:", error);
    throw new Error(error.message || "Failed to get all orders");
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
}): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "support_tickets"), {
      ...ticketData,
      status: "open",
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error: any) {
    console.error("Create support ticket error:", error);
    throw new Error(error.message || "Failed to create support ticket");
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
  } catch (error: any) {
    console.error("Track page view error:", error);
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
  } catch (error: any) {
    console.error("Track event error:", error);
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
  } catch (error: any) {
    console.error("Get analytics error:", error);
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
export const getAllUsers = async (): Promise<any[]> => {
  // If Firebase is not configured, return empty array
  if (!db) {
    console.log("Firebase not configured - returning empty users array");
    return [];
  }

  try {
    console.log("🔍 Fetching all users from Firestore...");
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("👤 Found user:", doc.id, data.email);
      users.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
      });
    });

    console.log(`✅ Successfully loaded ${users.length} users`);
    return users;
  } catch (error: any) {
    console.error("❌ Get all users error:", error);
    console.error("Error details:", error.code, error.message);
    throw new Error(error.message || "Failed to get users");
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
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    throw new Error(error.message || "Failed to get dashboard statistics");
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
    const updateData: any = { ...updates };

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
  } catch (error: any) {
    console.error("Update order error:", error);
    throw new Error(error.message || "Failed to update order");
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
    const updateData: any = {
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
  } catch (error: any) {
    console.error("Update build progress error:", error);
    throw new Error(error.message || "Failed to update build progress");
  }
};

/**
 * Get all support tickets (admin)
 */
export const getAllSupportTickets = async (): Promise<any[]> => {
  try {
    const q = query(
      collection(db, "support_tickets"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const tickets: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tickets.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      });
    });

    return tickets;
  } catch (error: any) {
    console.error("Get support tickets error:", error);
    throw new Error(error.message || "Failed to get support tickets");
  }
};

/**
 * Get user's support tickets
 */
export const getUserSupportTickets = async (userId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, "support_tickets"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const tickets: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tickets.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      });
    });

    return tickets;
  } catch (error: any) {
    console.error("Get user support tickets error:", error);
    throw new Error(error.message || "Failed to get support tickets");
  }
};

/**
 * Update support ticket status
 */
export const updateSupportTicket = async (
  ticketId: string,
  updates: any
): Promise<void> => {
  try {
    const docRef = doc(db, "support_tickets", ticketId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error("Update support ticket error:", error);
    throw new Error(error.message || "Failed to update support ticket");
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
  } catch (error: any) {
    console.error("Create refund request error:", error);
    throw new Error(error.message || "Failed to create refund request");
  }
};

/**
 * Get all refund requests (admin)
 */
export const getAllRefundRequests = async (): Promise<any[]> => {
  try {
    const q = query(
      collection(db, "refund_requests"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const requests: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      });
    });

    return requests;
  } catch (error: any) {
    console.error("Get refund requests error:", error);
    throw new Error(error.message || "Failed to get refund requests");
  }
};
