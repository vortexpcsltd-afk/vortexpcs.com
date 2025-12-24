import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  createOrder,
  getUserOrders,
  getOrder,
} from "../../../services/database";
import { mockOrder } from "../testUtils";
import * as firestore from "firebase/firestore";

// Mock Firebase Firestore
vi.mock("firebase/firestore");
vi.mock("../../../config/firebase", () => ({
  db: {},
}));

describe("Database Service - Order Operations", () => {
  const mockDocRef = { id: "order_123" };
  const mockDocSnap = {
    exists: () => true,
    id: "order_123",
    data: () => ({
      ...mockOrder,
      orderDate: { toDate: () => mockOrder.orderDate },
      estimatedCompletion: { toDate: () => mockOrder.estimatedCompletion },
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should create order in Firestore", async () => {
      (firestore.addDoc as Mock).mockResolvedValue(mockDocRef);
      (firestore.collection as Mock).mockReturnValue({});
      (firestore.Timestamp.fromDate as Mock).mockImplementation((date) => date);

      const orderId = await createOrder(mockOrder);

      expect(firestore.addDoc).toHaveBeenCalled();
      expect(orderId).toBe("order_123");
    });

    it("should convert dates to Firestore Timestamps", async () => {
      (firestore.addDoc as Mock).mockResolvedValue(mockDocRef);
      (firestore.collection as Mock).mockReturnValue({});
      const mockTimestamp = vi.fn();
      (firestore.Timestamp.fromDate as Mock).mockImplementation(mockTimestamp);

      await createOrder(mockOrder);

      expect(mockTimestamp).toHaveBeenCalledWith(mockOrder.orderDate);
      if (mockOrder.estimatedCompletion) {
        expect(mockTimestamp).toHaveBeenCalledWith(
          mockOrder.estimatedCompletion
        );
      }
    });

    it("should handle missing optional fields", async () => {
      (firestore.addDoc as Mock).mockResolvedValue(mockDocRef);
      (firestore.collection as Mock).mockReturnValue({});
      (firestore.Timestamp.fromDate as Mock).mockImplementation((date) => date);

      const orderWithoutOptional = {
        ...mockOrder,
        estimatedCompletion: undefined,
      };

      const orderId = await createOrder(orderWithoutOptional);
      expect(orderId).toBe("order_123");
    });

    it("should throw error on Firestore failure", async () => {
      const error = new Error("Firestore error");
      (firestore.addDoc as Mock).mockRejectedValue(error);
      (firestore.collection as Mock).mockReturnValue({});

      await expect(createOrder(mockOrder)).rejects.toThrow();
    });

    it("should include all required order fields", async () => {
      (firestore.addDoc as Mock).mockResolvedValue(mockDocRef);
      (firestore.collection as Mock).mockReturnValue({});
      (firestore.Timestamp.fromDate as Mock).mockImplementation((date) => date);

      await createOrder(mockOrder);

      const savedData = (firestore.addDoc as Mock).mock.calls[0][1];

      expect(savedData).toHaveProperty("userId");
      expect(savedData).toHaveProperty("orderId");
      expect(savedData).toHaveProperty("customerName");
      expect(savedData).toHaveProperty("customerEmail");
      expect(savedData).toHaveProperty("items");
      expect(savedData).toHaveProperty("total");
      expect(savedData).toHaveProperty("status");
      expect(savedData).toHaveProperty("address");
    });

    it("should validate items array structure", async () => {
      (firestore.addDoc as Mock).mockResolvedValue(mockDocRef);
      (firestore.collection as Mock).mockReturnValue({});
      (firestore.Timestamp.fromDate as Mock).mockImplementation((date) => date);

      await createOrder(mockOrder);

      const savedData = (firestore.addDoc as Mock).mock.calls[0][1];
      const items = savedData.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items[0]).toHaveProperty("productId");
      expect(items[0]).toHaveProperty("productName");
      expect(items[0]).toHaveProperty("quantity");
      expect(items[0]).toHaveProperty("price");
    });

    it("should save address with all fields", async () => {
      (firestore.addDoc as Mock).mockResolvedValue(mockDocRef);
      (firestore.collection as Mock).mockReturnValue({});
      (firestore.Timestamp.fromDate as Mock).mockImplementation((date) => date);

      await createOrder(mockOrder);

      const savedData = (firestore.addDoc as Mock).mock.calls[0][1];
      const address = savedData.address;

      expect(address).toHaveProperty("line1");
      expect(address).toHaveProperty("city");
      expect(address).toHaveProperty("postcode");
      expect(address).toHaveProperty("country");
    });
  });

  describe("getOrder", () => {
    it("should retrieve order by ID", async () => {
      (firestore.doc as Mock).mockReturnValue({});
      (firestore.getDoc as Mock).mockResolvedValue(mockDocSnap);

      const order = await getOrder("order_123");

      expect(firestore.getDoc).toHaveBeenCalled();
      expect(order).not.toBeNull();
      expect(order?.id).toBe("order_123");
    });

    it("should return null for non-existent order", async () => {
      const emptyDocSnap = {
        exists: () => false,
      };
      (firestore.doc as Mock).mockReturnValue({});
      (firestore.getDoc as Mock).mockResolvedValue(emptyDocSnap);

      const order = await getOrder("nonexistent");

      expect(order).toBeNull();
    });

    it("should convert Firestore dates to JavaScript Dates", async () => {
      (firestore.doc as Mock).mockReturnValue({});
      (firestore.getDoc as Mock).mockResolvedValue(mockDocSnap);

      const order = await getOrder("order_123");

      expect(order?.orderDate).toBeInstanceOf(Date);
      expect(order?.estimatedCompletion).toBeInstanceOf(Date);
    });

    it("should throw error on Firestore failure", async () => {
      const error = new Error("Firestore error");
      (firestore.doc as Mock).mockReturnValue({});
      (firestore.getDoc as Mock).mockRejectedValue(error);

      await expect(getOrder("order_123")).rejects.toThrow();
    });
  });

  describe("getUserOrders", () => {
    it("should retrieve all orders for a user", async () => {
      const mockQuerySnapshot = {
        forEach: (
          callback: (doc: { id: string; data: () => unknown }) => void
        ) => {
          callback({
            id: "order_1",
            data: () => ({
              ...mockOrder,
              orderDate: { toDate: () => mockOrder.orderDate },
            }),
          });
          callback({
            id: "order_2",
            data: () => ({
              ...mockOrder,
              orderDate: { toDate: () => mockOrder.orderDate },
            }),
          });
        },
      };

      (firestore.collection as Mock).mockReturnValue({});
      (firestore.query as Mock).mockReturnValue({});
      (firestore.where as Mock).mockReturnValue({});
      (firestore.orderBy as Mock).mockReturnValue({});
      (firestore.getDocs as Mock).mockResolvedValue(mockQuerySnapshot);

      const orders = await getUserOrders("user_123");

      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe("order_1");
      expect(orders[1].id).toBe("order_2");
    });

    it("should return empty array when Firebase not configured", async () => {
      // Simulate unconfigured Firebase by monkey-patching db to null
      const firebaseMod = await import("../../../config/firebase");
      const original: unknown = (firebaseMod as { db?: unknown }).db;
      (firebaseMod as { db?: unknown }).db = null;

      const orders = await getUserOrders("user_123");

      expect(Array.isArray(orders)).toBe(true);
      expect(orders).toHaveLength(0);

      // Restore original db
      (firebaseMod as { db?: unknown }).db = original;
    });

    it("should order results by date descending", async () => {
      const mockQuerySnapshot = {
        forEach: () => {},
      };

      (firestore.collection as Mock).mockReturnValue({});
      (firestore.query as Mock).mockReturnValue({});
      (firestore.where as Mock).mockReturnValue({});
      (firestore.orderBy as Mock).mockReturnValue({});
      (firestore.getDocs as Mock).mockResolvedValue(mockQuerySnapshot);

      await getUserOrders("user_123");

      expect(firestore.orderBy).toHaveBeenCalledWith("orderDate", "desc");
    });

    it("should filter by userId", async () => {
      const mockQuerySnapshot = {
        forEach: () => {},
      };

      (firestore.collection as Mock).mockReturnValue({});
      (firestore.query as Mock).mockReturnValue({});
      (firestore.where as Mock).mockReturnValue({});
      (firestore.orderBy as Mock).mockReturnValue({});
      (firestore.getDocs as Mock).mockResolvedValue(mockQuerySnapshot);

      await getUserOrders("user_123");

      expect(firestore.where).toHaveBeenCalledWith("userId", "==", "user_123");
    });

    it("should handle query errors", async () => {
      const error = new Error("Query failed");
      (firestore.collection as Mock).mockReturnValue({});
      (firestore.query as Mock).mockReturnValue({});
      (firestore.where as Mock).mockReturnValue({});
      (firestore.orderBy as Mock).mockReturnValue({});
      (firestore.getDocs as Mock).mockRejectedValue(error);

      await expect(getUserOrders("user_123")).rejects.toThrow();
    });
  });
});
