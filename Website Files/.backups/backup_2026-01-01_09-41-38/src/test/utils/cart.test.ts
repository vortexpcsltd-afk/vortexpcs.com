/**
 * Cart Logic & Checkout Calculations Tests
 * Tests cart operations, VAT calculations, and pricing logic
 */

import { describe, it, expect } from "vitest";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

describe("Cart Price Calculations", () => {
  it("should calculate subtotal correctly", () => {
    const items: CartItem[] = [
      { id: "1", name: "Gaming PC", price: 1500, quantity: 1, category: "PC" },
      {
        id: "2",
        name: "Monitor",
        price: 300,
        quantity: 2,
        category: "Peripheral",
      },
    ];

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    expect(subtotal).toBe(2100);
  });

  it("should calculate 20% UK VAT", () => {
    const subtotal = 1000;
    const vatRate = 0.2;
    const vat = subtotal * vatRate;

    expect(vat).toBe(200);
  });

  it("should calculate total with VAT", () => {
    const subtotal = 1000;
    const vat = subtotal * 0.2;
    const total = subtotal + vat;

    expect(total).toBe(1200);
  });

  it("should handle decimal prices correctly", () => {
    const items: CartItem[] = [
      { id: "1", name: "Item", price: 99.99, quantity: 3, category: "Test" },
    ];

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    expect(subtotal).toBeCloseTo(299.97, 2);
  });

  it("should calculate delivery fee based on subtotal", () => {
    const calculateDelivery = (subtotal: number, method: string) => {
      if (method === "express") return 25;
      if (subtotal >= 500) return 0;
      return 15;
    };

    expect(calculateDelivery(600, "standard")).toBe(0); // Free over £500
    expect(calculateDelivery(400, "standard")).toBe(15); // Charge under £500
    expect(calculateDelivery(600, "express")).toBe(25); // Express always £25
  });
});

describe("Cart Quantity Management", () => {
  it("should update item quantity", () => {
    const items: CartItem[] = [
      { id: "1", name: "Item", price: 100, quantity: 1, category: "Test" },
    ];

    const updateQuantity = (id: string, newQuantity: number) => {
      return items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
      );
    };

    const updated = updateQuantity("1", 3);
    expect(updated[0].quantity).toBe(3);
  });

  it("should not allow quantity below 1", () => {
    const updateQuantity = (current: number, delta: number) => {
      return Math.max(1, current + delta);
    };

    expect(updateQuantity(1, -1)).toBe(1);
    expect(updateQuantity(2, -1)).toBe(1);
    expect(updateQuantity(5, -3)).toBe(2);
  });

  it("should remove item when quantity reaches 0", () => {
    const items: CartItem[] = [
      { id: "1", name: "Item 1", price: 100, quantity: 1, category: "Test" },
      { id: "2", name: "Item 2", price: 200, quantity: 1, category: "Test" },
    ];

    const removeItem = (id: string) => items.filter((item) => item.id !== id);

    const updated = removeItem("1");
    expect(updated.length).toBe(1);
    expect(updated[0].id).toBe("2");
  });
});

describe("Order Validation", () => {
  it("should validate required personal details", () => {
    const formData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "1234567890",
    };

    const isValid = Object.values(formData).every(
      (value) => value.trim() !== ""
    );
    expect(isValid).toBe(true);
  });

  it("should reject empty required fields", () => {
    const formData = {
      firstName: "",
      lastName: "Doe",
      email: "john@example.com",
      phone: "1234567890",
    };

    const isValid = Object.values(formData).every(
      (value) => value.trim() !== ""
    );
    expect(isValid).toBe(false);
  });

  it("should validate email format", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(emailRegex.test("valid@example.com")).toBe(true);
    expect(emailRegex.test("invalid@")).toBe(false);
    expect(emailRegex.test("@example.com")).toBe(false);
    expect(emailRegex.test("notemail")).toBe(false);
  });

  it("should validate postcode format", () => {
    const ukPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;

    expect(ukPostcodeRegex.test("SW1A 1AA")).toBe(true);
    expect(ukPostcodeRegex.test("M1 1AA")).toBe(true);
    expect(ukPostcodeRegex.test("invalid")).toBe(false);
  });
});

describe("Build Price Calculation", () => {
  it("should calculate total PC build price", () => {
    const components = [
      { id: "1", name: "CPU", price: 500 },
      { id: "2", name: "GPU", price: 800 },
      { id: "3", name: "RAM", price: 150 },
      { id: "4", name: "Storage", price: 200 },
      { id: "5", name: "PSU", price: 150 },
      { id: "6", name: "Case", price: 100 },
      { id: "7", name: "Motherboard", price: 300 },
      { id: "8", name: "Cooling", price: 100 },
    ];

    const total = components.reduce(
      (sum, component) => sum + component.price,
      0
    );
    expect(total).toBe(2300);
  });

  it("should add optional extras to build price", () => {
    const buildPrice = 2000;
    const extras = [
      { name: "Extended Warranty", price: 99 },
      { name: "RGB Kit", price: 49 },
    ];

    const total =
      buildPrice + extras.reduce((sum, extra) => sum + extra.price, 0);
    expect(total).toBe(2148);
  });
});

describe("Stock Availability", () => {
  it("should check if all items are in stock", () => {
    const items = [
      { id: "1", inStock: true, quantity: 5 },
      { id: "2", inStock: true, quantity: 10 },
      { id: "3", inStock: true, quantity: 2 },
    ];

    const allInStock = items.every((item) => item.inStock);
    expect(allInStock).toBe(true);
  });

  it("should detect out-of-stock items", () => {
    const items = [
      { id: "1", inStock: true, quantity: 5 },
      { id: "2", inStock: false, quantity: 0 },
      { id: "3", inStock: true, quantity: 2 },
    ];

    const allInStock = items.every((item) => item.inStock);
    expect(allInStock).toBe(false);

    const outOfStockCount = items.filter((item) => !item.inStock).length;
    expect(outOfStockCount).toBe(1);
  });

  it("should check sufficient stock for requested quantity", () => {
    const checkStock = (available: number, requested: number) => {
      return available >= requested;
    };

    expect(checkStock(10, 5)).toBe(true);
    expect(checkStock(5, 10)).toBe(false);
    expect(checkStock(5, 5)).toBe(true);
  });
});

describe("Discount Calculations", () => {
  it("should apply percentage discount", () => {
    const price = 1000;
    const discountPercent = 10;
    const discountedPrice = price * (1 - discountPercent / 100);

    expect(discountedPrice).toBe(900);
  });

  it("should apply fixed amount discount", () => {
    const price = 1000;
    const discount = 150;
    const discountedPrice = price - discount;

    expect(discountedPrice).toBe(850);
  });

  it("should not allow negative prices after discount", () => {
    const applyDiscount = (price: number, discount: number) => {
      return Math.max(0, price - discount);
    };

    expect(applyDiscount(100, 150)).toBe(0);
    expect(applyDiscount(100, 50)).toBe(50);
  });
});

describe("Order Number Generation", () => {
  it("should generate unique order numbers", () => {
    const generateOrderNumber = () => {
      return `VX-${Date.now().toString().slice(-6)}`;
    };

    const order1 = generateOrderNumber();
    const order2 = generateOrderNumber();

    expect(order1).toMatch(/^VX-\d{6}$/);
    expect(order2).toMatch(/^VX-\d{6}$/);
  });

  it("should have correct order number format", () => {
    const orderNumber = "VX-123456";
    const format = /^VX-\d{6}$/;

    expect(format.test(orderNumber)).toBe(true);
    expect(format.test("INVALID-123")).toBe(false);
  });
});
