import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
}

/**
 * Custom render function that includes common providers
 */
export function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries: _initialEntries,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    // Default to current window location (preserves query params from pushState)
    const defaults = [
      `${window.location.pathname}${window.location.search || ""}`,
    ];
    const entries =
      _initialEntries && _initialEntries.length > 0
        ? _initialEntries
        : defaults;
    return <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for async operations to complete
 */
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Mock localStorage for tests
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

/**
 * Mock user data
 */
export const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
  emailVerified: true,
};

/**
 * Mock order data
 */
export const mockOrder = {
  userId: "test-user-123",
  orderId: "order-123",
  customerName: "Test User",
  customerEmail: "test@example.com",
  items: [
    {
      productId: "pc-001",
      productName: "Gaming PC Build",
      quantity: 1,
      price: 1500,
    },
  ],
  total: 1500,
  status: "pending" as const,
  progress: 0,
  orderDate: new Date(),
  estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  address: {
    line1: "123 Test Street",
    line2: "Apt 4",
    city: "London",
    postcode: "SW1A 1AA",
    country: "UK",
  },
  paymentId: "pi_test_123",
};

/**
 * Mock payment verification response
 */
export const mockPaymentResponse = {
  status: "paid",
  customerEmail: "test@example.com",
  customerName: "Test User",
  amountTotal: 150000, // £1500 in pence
  currency: "gbp",
  paymentStatus: "paid",
  shippingAddress: {
    line1: "123 Test Street",
    line2: "Apt 4",
    city: "London",
    postal_code: "SW1A 1AA",
    country: "UK",
  },
};

/**
 * Mock cart items
 */
export const mockCartItems = [
  {
    id: "pc-001",
    name: "Gaming PC Build",
    price: 1500,
    quantity: 1,
    image: "https://example.com/pc.jpg",
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
