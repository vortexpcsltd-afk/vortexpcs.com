import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import React from "react";
import {
  renderWithRouter,
  mockPaymentResponse,
  mockCartItems,
} from "../testUtils";
import { OrderSuccess } from "../../../components/OrderSuccess";
import * as paymentService from "../../../services/payment";
import * as databaseService from "../../../services/database";
import { toast } from "sonner";

// Mock the services
vi.mock("../../../services/payment");
vi.mock("../../../services/database");
vi.mock("sonner");

describe("OrderSuccess Component - Critical Payment Flow", () => {
  const mockOnNavigate = vi.fn();
  const renderWithSession = (ui: React.ReactElement) =>
    renderWithRouter(ui, { initialEntries: ["/?session_id=test_session_123"] });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Ensure no fallback session id interferes
    localStorage.removeItem("stripe_session_id");

    // Mock successful payment verification
    (paymentService.verifyPayment as Mock).mockResolvedValue(
      mockPaymentResponse
    );

    // Mock successful order creation
    (databaseService.createOrder as Mock).mockResolvedValue("order_123");

    // Mock analytics tracking
    (databaseService.trackEvent as Mock).mockResolvedValue(undefined);
  });

  it("should display loading state initially", () => {
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    expect(screen.getByText(/verifying your payment/i)).toBeInTheDocument();
  });

  it("should verify payment with session ID from URL", async () => {
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(paymentService.verifyPayment).toHaveBeenCalledWith(
        "test_session_123"
      );
    });
  });

  it("should create order in Firebase after payment verification", async () => {
    // Set up cart in localStorage
    localStorage.setItem("vortex_cart", JSON.stringify(mockCartItems));
    localStorage.setItem("vortex_user", JSON.stringify({ uid: "user_123" }));

    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(databaseService.createOrder).toHaveBeenCalled();
    });

    // Verify order data structure
    const orderData = (databaseService.createOrder as Mock).mock.calls[0][0];
    expect(orderData).toMatchObject({
      userId: "user_123",
      orderId: "test_session_123",
      customerEmail: mockPaymentResponse.customerEmail,
      status: "pending",
      total: mockPaymentResponse.amountTotal / 100,
      paymentId: "test_session_123",
    });
  });

  it("should handle guest checkout (no logged-in user)", async () => {
    localStorage.setItem("vortex_cart", JSON.stringify(mockCartItems));
    // No user in localStorage

    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(databaseService.createOrder).toHaveBeenCalled();
    });

    const orderData = (databaseService.createOrder as Mock).mock.calls[0][0];
    expect(orderData.userId).toBe("guest_test_session_123");
  });

  it("should clear cart after successful order creation", async () => {
    localStorage.setItem("vortex_cart", JSON.stringify(mockCartItems));

    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(localStorage.getItem("vortex_cart")).toBeNull();
    });
  });

  it("should show success toast after order creation", async () => {
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Order saved successfully!");
    });
  });

  it("should display order details after successful verification", async () => {
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/thank you for your purchase/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockPaymentResponse.customerEmail)
      ).toBeInTheDocument();
      // Matches either "£1500.00" or "£ 1500.00"
      expect(screen.getByText(/£\s?1500\.00/i)).toBeInTheDocument();
    });
  });

  it("should display shipping address when available", async () => {
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/123 Test Street/i)).toBeInTheDocument();
      expect(screen.getByText(/London/i)).toBeInTheDocument();
      expect(screen.getByText(/SW1A 1AA/i)).toBeInTheDocument();
    });
  });

  it("should handle payment verification failure", async () => {
    (paymentService.verifyPayment as Mock).mockRejectedValue(
      new Error("Payment verification failed")
    );

    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      // Heading and message should both exist
      expect(
        screen.getByRole("heading", { name: /payment verification failed/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Payment verification failed", { exact: true })
      ).toBeInTheDocument();
    });
  });

  it("should handle order creation failure gracefully", async () => {
    (databaseService.createOrder as Mock).mockRejectedValue(
      new Error("Database error")
    );

    // Render with session id so payment succeeds, but order save fails
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      // Should still show success page (payment succeeded)
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
      // Should show error toast
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("failed to save to database")
      );
    });
  });

  it("should handle missing session ID in URL", async () => {
    // No session_id present in router history
    renderWithRouter(<OrderSuccess onNavigate={mockOnNavigate} />, {
      initialEntries: ["/"],
    });

    await waitFor(() => {
      expect(screen.getByText(/no session ID found/i)).toBeInTheDocument();
    });
  });

  it("should track analytics event with cookie consent", async () => {
    localStorage.setItem("vortex_cookie_consent", "accepted");
    localStorage.setItem("vortex_user", JSON.stringify({ uid: "user_123" }));

    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(databaseService.trackEvent).toHaveBeenCalledWith(
        "user_123",
        "purchase",
        expect.objectContaining({
          amount: 1500,
          currency: "GBP",
          session_id: "test_session_123",
        })
      );
    });
  });

  it("should NOT track analytics without cookie consent", async () => {
    // No consent in localStorage

    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(databaseService.createOrder).toHaveBeenCalled();
    });

    expect(databaseService.trackEvent).not.toHaveBeenCalled();
  });

  it("should navigate to member area when button clicked", async () => {
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    });

    const memberButton = screen.getByRole("button", {
      name: /view order in member area/i,
    });
    memberButton.click();

    expect(mockOnNavigate).toHaveBeenCalledWith("member");
  });

  it("should navigate to home when button clicked", async () => {
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    });

    const homeButton = screen.getByRole("button", { name: /back to home/i });
    homeButton.click();

    expect(mockOnNavigate).toHaveBeenCalledWith("home");
  });

  it("should create fallback order item when cart is empty", async () => {
    // Empty cart
    localStorage.setItem("vortex_cart", JSON.stringify([]));

    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(databaseService.createOrder).toHaveBeenCalled();
    });

    const orderData = (databaseService.createOrder as Mock).mock.calls[0][0];
    expect(orderData.items).toHaveLength(1);
    expect(orderData.items[0].productName).toBe("Custom PC Build");
  });

  it("should set estimated completion date to 7 days from now", async () => {
    renderWithSession(<OrderSuccess onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(databaseService.createOrder).toHaveBeenCalled();
    });

    const orderData = (databaseService.createOrder as Mock).mock.calls[0][0];
    const estimatedDate = orderData.estimatedCompletion;
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Allow 1 second difference for test execution time
    expect(
      Math.abs(estimatedDate.getTime() - sevenDaysFromNow.getTime())
    ).toBeLessThan(1000);
  });
});
