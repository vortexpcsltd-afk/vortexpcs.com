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
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<any[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      });
    });

    return users;
  } catch (error: any) {
    console.error("Get all users error:", error);
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
