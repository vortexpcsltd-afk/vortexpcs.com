import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Building2,
  Wallet,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Package,
  MapPin,
  Loader2,
  Shield,
  Award,
  Truck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { StripePaymentForm } from "./StripePaymentForm";
import type { CartItem } from "../types";
import { logger } from "../services/logger";
import { toast } from "sonner";
import { ButtonWithLoading } from "./util/LoadingComponents";

// Initialize Stripe (module level)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

interface CheckoutPageProps {
  cartItems: CartItem[];
  onBack: () => void;
  onSuccess: (orderId: string, orderNumber: string) => void;
}

type PaymentMethod = "stripe" | "paypal" | "bank_transfer";

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  password?: string;
}

export function CheckoutPage({
  cartItems,
  onBack,
  onSuccess,
}: CheckoutPageProps) {
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethod>("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null
  );
  const [stripeOrderNumber, setStripeOrderNumber] = useState<string>("");

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      logger.warn("Checkout accessed with empty cart, redirecting");
      toast.error("Your cart is empty");
      setTimeout(() => navigate("/"), 100);
    }
  }, [cartItems, navigate]);
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    county: "",
    postcode: "",
    country: "United Kingdom",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const customBuildOptions = [
    {
      id: "standard-assembly",
      name: "Standard Assembly",
      price: 85,
      positioning: "Straightforward, reliable, cost-effective.",
      campaign: "Built right, ready to run.",
      includes: [
        "Professional assembly of all selected components",
        "Cable management (functional, not showcase)",
        "BIOS update and system check",
        "Windows installation (if purchased)",
        "14-day build warranty",
      ],
      idealFor:
        "Customers who want their parts put together correctly and ready to go.",
      badge: "Great value",
      accent: "from-slate-800/80 via-sky-800/50 to-sky-900/40",
    },
    {
      id: "performance-build",
      name: "Performance Build",
      price: 130,
      positioning: "Elevated service with polish and optimisation.",
      campaign: "Optimised, polished, battle-ready.",
      includes: [
        "All Standard Assembly features",
        "Advanced cable management with airflow optimisation",
        "Stress testing (CPU, GPU, RAM) for stability",
        "Thermal paste upgrade (premium compound)",
        "RGB lighting setup and sync",
        "1-month build support",
      ],
      idealFor:
        "Gamers and creators who want assurance their system is tuned and looks sharp.",
      badge: "Most popular",
      accent: "from-sky-800/70 via-blue-800/60 to-blue-900/50",
    },
    {
      id: "elite-showcase",
      name: "Elite Showcase Build",
      price: 185,
      positioning: "VIP build, priority and attention to detail",
      campaign: "Showcase perfection, benchmarked brilliance.",
      includes: [
        "All Performance Build features",
        "Custom cable sleeving and aesthetic routing",
        "BIOS/firmware fine-tuning for performance",
        "Full benchmark report (FPS, temps, scores)",
        "Priority support for 6 months",
        "Extended build warranty (1 year)",
      ],
      idealFor:
        "Enthusiasts who want their PC to be a centerpiece — technically and visually.",
      badge: "Fastest turnaround",
      accent: "from-blue-900/70 via-indigo-900/60 to-cyan-900/50",
    },
  ] as const;

  type BuildServiceId = (typeof customBuildOptions)[number]["id"];
  const [selectedBuildService, setSelectedBuildService] =
    useState<BuildServiceId>("performance-build");
  const [showBuildServiceOptions, setShowBuildServiceOptions] =
    useState<boolean>(true);
  const [createAccount, setCreateAccount] = useState<boolean>(true);

  const categorySet = useMemo(() => {
    const set = new Set<string>();
    for (const item of cartItems) {
      const cat = (item.category || "").toString().toLowerCase();
      if (cat) set.add(cat);
    }
    return set;
  }, [cartItems]);

  const totalLineItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cartItems]
  );

  const isLikelyFullBuild = useMemo(() => {
    const hasCpu = categorySet.has("cpu");
    const hasMotherboard = categorySet.has("motherboard");
    const hasRam = categorySet.has("ram");
    const hasStorage = categorySet.has("storage");
    const hasPsu = categorySet.has("psu");
    const hasCase = categorySet.has("case");
    // Require core building blocks and enough line items to represent a full system
    const hasCore = hasCpu && hasMotherboard && hasRam && hasStorage;
    const hasChassisAndPower = hasPsu && hasCase;
    const hasEnoughLines = totalLineItems >= 5;
    return hasCore && hasChassisAndPower && hasEnoughLines;
  }, [categorySet, totalLineItems]);

  // Shipping options (Free always available as requested)
  const shippingOptions = [
    {
      id: "free",
      name: "Free Shipping",
      estimate: "5–7 working days",
      cost: 0,
    },
    {
      id: "standard",
      name: "Standard",
      estimate: "2–4 working days",
      cost: 9.99,
    },
    {
      id: "express",
      name: "Express",
      estimate: "1–2 working days",
      cost: 14.99,
    },
  ] as const;
  type ShippingMethodId = (typeof shippingOptions)[number]["id"];
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingMethodId>("free");

  // Calculate totals with validation
  const componentsSubtotal = cartItems.reduce((sum, item) => {
    // Validate item before calculating
    if (
      typeof item.price !== "number" ||
      typeof item.quantity !== "number" ||
      item.price < 0 ||
      item.quantity < 1
    ) {
      logger.warn("Invalid cart item in total calculation", { item });
      return sum;
    }
    return sum + item.price * item.quantity;
  }, 0);
  const shippingCost = shippingOptions.find(
    (o) => o.id === selectedShipping
  )!.cost;
  const buildService =
    isLikelyFullBuild && showBuildServiceOptions
      ? customBuildOptions.find((opt) => opt.id === selectedBuildService)
      : null;
  const buildServiceCost = buildService?.price ?? 0;
  const subtotal = componentsSubtotal + buildServiceCost;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalSubtotal = subtotal - discountAmount;
  const total = finalSubtotal + shippingCost;

  // Load saved address from localStorage on mount
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem("vortex_shipping_address");
      if (savedAddress) {
        const parsed = JSON.parse(savedAddress);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      logger.warn("Failed to load saved address", { error });
    }
  }, []);

  // Validate coupon code
  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponError(null);
      setAppliedCoupon(null);
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const error = await response.json();
        setCouponError(error.message || "Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      const data = await response.json();
      const discount = (subtotal * data.discountPercent) / 100;
      setAppliedCoupon({
        code: code.trim().toUpperCase(),
        discountPercent: data.discountPercent,
        discountAmount: discount,
      });
      setCouponError(null);
    } catch (err) {
      logger.error("Coupon validation error:", err);
      setCouponError("Unable to validate coupon. Please try again.");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[\d\s+\-()]+$/.test(formData.phone)) {
      errors.phone = "Invalid phone number";
    }
    if (!formData.line1.trim()) errors.line1 = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.postcode.trim()) {
      errors.postcode = "Postcode is required";
    } else if (
      !/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(formData.postcode.trim())
    ) {
      errors.postcode = "Invalid UK postcode";
    }

    if (createAccount) {
      const pwd = (formData.password || "").trim();
      if (!pwd) {
        errors.password = "Password is required to create an account";
      } else if (pwd.length < 6) {
        errors.password = "Use at least 6 characters";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle payment submission
  const handleSubmit = async () => {
    setError(null);

    // Validate form
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    // Save address for future use
    try {
      localStorage.setItem("vortex_shipping_address", JSON.stringify(formData));
    } catch (error) {
      logger.warn("Failed to save address", { error });
    }

    setIsProcessing(true);

    try {
      let authToken: string | null = null;
      try {
        const { auth } = await import("../config/firebase");
        if (auth?.currentUser) {
          const { getIdToken } = await import("firebase/auth");
          authToken = await getIdToken(auth.currentUser);
        }
      } catch {
        // Guest checkout - no auth token
      }

      // Validate cart items before processing
      const invalidItems = cartItems.filter(
        (item) =>
          !item ||
          !item.id ||
          !item.name ||
          typeof item.price !== "number" ||
          item.price < 0 ||
          typeof item.quantity !== "number" ||
          item.quantity < 1 ||
          !item.category
      );

      if (invalidItems.length > 0) {
        setError(
          "Some items in your cart are invalid. Please refresh and try again."
        );
        setIsProcessing(false);
        logger.error("Invalid cart items detected", { invalidItems });
        return;
      }

      if (cartItems.length === 0 && !buildService) {
        setError("Your cart is empty");
        setIsProcessing(false);
        return;
      }

      const buildServiceItem = buildService
        ? {
            id: `build-service-${buildService.id}`,
            name: buildService.name,
            category: "build-service",
            price: buildService.price,
            quantity: 1,
          }
        : null;

      const orderItems = [
        ...cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: Math.max(0, item.price), // Ensure non-negative
          quantity: Math.max(1, Math.floor(item.quantity)), // Ensure positive integer
          image: item.image,
        })),
        ...(buildServiceItem ? [buildServiceItem] : []),
      ];

      // Prepare order data
      const orderData = {
        amount: total,
        currency: "gbp",
        cartItems: orderItems,
        shippingAddress: {
          line1: formData.line1,
          line2: formData.line2,
          city: formData.city,
          county: formData.county,
          postcode: formData.postcode,
          country: formData.country,
        },
        customerEmail: formData.email,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        shippingMethod: selectedShipping,
        shippingCost,
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              discountPercent: appliedCoupon.discountPercent,
              discountAmount: appliedCoupon.discountAmount,
            }
          : null,
        buildService: buildService
          ? {
              id: buildService.id,
              name: buildService.name,
              price: buildService.price,
            }
          : null,
        accountRequest: createAccount
          ? {
              create: true,
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              password: formData.password?.trim(),
              address: {
                line1: formData.line1,
                line2: formData.line2,
                city: formData.city,
                county: formData.county,
                postcode: formData.postcode,
                country: formData.country,
              },
            }
          : { create: false },
      };

      // Process payment based on selected method
      switch (selectedPayment) {
        case "stripe":
          await processStripePayment(orderData, authToken);
          break;
        case "paypal":
          await processPayPalPayment(orderData, authToken);
          break;
        case "bank_transfer":
          await processBankTransfer(orderData, authToken);
          break;
        default:
          throw new Error("Invalid payment method");
      }
    } catch (error) {
      logger.error("Checkout error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Payment processing failed. Please try again."
      );
      toast.error("Payment processing failed");
      setIsProcessing(false);
    }
  };

  const createAccountIfNeeded = async () => {
    if (!createAccount) return;
    const password = (formData.password || "").trim();
    if (!password) return;

    try {
      const { registerUser } = await import("../services/auth");
      const displayName = formData.fullName.trim() || formData.email.trim();
      await registerUser(formData.email.trim(), password, displayName);
      logger.info("Account created from checkout", {
        email: formData.email,
      });
    } catch (err) {
      logger.warn("Checkout account creation failed or skipped", {
        error: String(err),
      });
      // Do not block checkout flow if account creation fails
    }
  };

  // Process Stripe payment - CREATE PAYMENT INTENT (no redirect)
  const processStripePayment = async (
    orderData: Record<string, unknown>,
    authToken: string | null
  ) => {
    // Create Payment Intent for embedded form
    const response = await fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to initialize payment";
      let errorDetails = {};

      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson;
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
        if (response.status === 500 && errorJson.error) {
          errorMessage = `Server error: ${errorJson.error}`;
        }
      } catch {
        errorDetails = { rawError: errorText };
      }

      logger.error("Payment Intent creation failed", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        details: errorDetails,
        orderAmount: orderData.amount,
      });
      throw new Error(errorMessage);
    }

    const { clientSecret, orderNumber } = await response.json();

    if (!clientSecret) {
      logger.error("Missing clientSecret in response", {
        response: await response.json(),
      });
      throw new Error("No client secret returned from server");
    }

    // Store client secret to trigger embedded payment form
    setStripeClientSecret(clientSecret);
    setStripeOrderNumber(orderNumber);
    setIsProcessing(false);

    logger.info("Payment Intent created", { orderNumber });
    toast.success("Ready to process payment");
  };

  // Handle successful Stripe payment
  const handleStripeSuccess = async (paymentIntentId: string) => {
    logger.info("Stripe payment successful", {
      paymentIntentId,
      orderNumber: stripeOrderNumber,
    });

    await createAccountIfNeeded();

    // Clear cart
    localStorage.removeItem("vortex_cart");

    // Persist latest payment references for success page fallback
    try {
      localStorage.setItem("latest_payment_intent", paymentIntentId);
      if (stripeOrderNumber) {
        localStorage.setItem("latest_order_number", stripeOrderNumber);
      }
    } catch {
      // ignore storage errors
    }

    // Show success
    toast.success("Payment successful! Your order is confirmed.");
    onSuccess(paymentIntentId, stripeOrderNumber);
    // Include payment intent & order number in query params for reliable verification
    const qs = new URLSearchParams({ pi: paymentIntentId });
    if (stripeOrderNumber) {
      qs.set("order", stripeOrderNumber);
    }
    navigate(`/order-success?${qs.toString()}`);
  };

  // Process PayPal payment
  const processPayPalPayment = async (
    orderData: Record<string, unknown>,
    authToken: string | null
  ) => {
    // Transform orderData to match PayPal API expectations
    const paypalData = {
      items: orderData.cartItems,
      customerEmail: orderData.customerEmail,
      currency: orderData.currency,
      metadata: {
        shippingAddress: orderData.shippingAddress,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        buildService: buildService
          ? `${buildService.name} (£${buildService.price.toFixed(2)})`
          : "",
      },
    };

    const response = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify(paypalData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("PayPal order creation failed", {
        status: response.status,
        error: errorText,
      });
      try {
        const error = JSON.parse(errorText);
        throw new Error(
          error.error || error.message || "Failed to create PayPal order"
        );
      } catch {
        throw new Error(`Failed to create PayPal order: ${response.status}`);
      }
    }

    const result = await response.json();

    // Extract approval URL from links array
    const approvalLink = result.links?.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    );
    if (!approvalLink?.href) {
      throw new Error("PayPal approval URL not found");
    }

    // Create account before redirecting to PayPal (best-effort; non-blocking)
    await createAccountIfNeeded();

    // Redirect to PayPal
    window.location.href = approvalLink.href;
  };

  // Process bank transfer
  const processBankTransfer = async (
    orderData: Record<string, unknown>,
    authToken: string | null
  ) => {
    // DIAGNOSTIC: Log exact values being sent
    const orderItems = Array.isArray(orderData.cartItems)
      ? (orderData.cartItems as CartItem[])
      : [];
    const itemsTotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    logger.info("🔍 BANK TRANSFER DEBUG", {
      itemsTotal: itemsTotal.toFixed(2),
      shippingMethod: selectedShipping,
      shippingCost: shippingCost.toFixed(2),
      computedTotal: total.toFixed(2),
      orderDataAmount: orderData.amount,
      itemCount: orderItems.length,
      buildServiceCost: buildServiceCost.toFixed(2),
      buildServiceName: buildService?.name,
      items: orderItems.map((i) => ({
        name: i.name,
        price: i.price,
        qty: i.quantity,
      })),
    });

    const response = await fetch("/api/orders/bank-transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Bank transfer order creation failed", {
        status: response.status,
        error: errorText,
      });
      try {
        const error = JSON.parse(errorText);
        throw new Error(
          error.error || error.message || "Failed to create bank transfer order"
        );
      } catch {
        throw new Error(
          `Failed to create bank transfer order: ${response.status}`
        );
      }
    }

    const { orderId, orderNumber } = await response.json();

    await createAccountIfNeeded();
    // Store order details for success page
    localStorage.setItem("latest_order_number", orderNumber);
    localStorage.setItem("bank_order_id", orderId);

    // Clear cart
    localStorage.removeItem("vortex_cart");

    // Show success
    toast.success("Order created! Check your email for bank transfer details.");
    onSuccess(orderId, orderNumber);
    navigate(`/order-success?bank=${orderId}&order=${orderNumber}`);
  };

  const paymentMethods = [
    {
      id: "stripe" as PaymentMethod,
      name: "Credit/Debit Card",
      description: "Pay securely with Visa, Mastercard, or Amex",
      icon: CreditCard,
      recommended: true,
    },
    {
      id: "paypal" as PaymentMethod,
      name: "PayPal",
      description: "Fast and secure PayPal checkout",
      icon: Wallet,
    },
    {
      id: "bank_transfer" as PaymentMethod,
      name: "Bank Transfer",
      description: "Direct bank transfer (manual verification required)",
      icon: Building2,
    },
  ];

  // Early return if cart is empty (prevents flash of content before redirect)
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-sky-500" />
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Secure Checkout
          </h1>
          <p className="text-gray-400">
            Complete your order with secure payment
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-sky-400" />
                Shipping Information
              </h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="fullName"
                      className="text-gray-300 mb-2 block"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSubmit();
                        }
                      }}
                      className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${
                        validationErrors.fullName ? "border-red-500" : ""
                      }`}
                      placeholder="John Smith"
                    />
                    {validationErrors.fullName && (
                      <p className="text-xs text-red-400 mt-1">
                        {validationErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-300 mb-2 block">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${
                        validationErrors.email ? "border-red-500" : ""
                      }`}
                      placeholder="john@example.com"
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-red-400 mt-1">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-300 mb-2 block">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${
                      validationErrors.phone ? "border-red-500" : ""
                    }`}
                    placeholder="07700 900000"
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-red-400 mt-1">
                      {validationErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="line1" className="text-gray-300 mb-2 block">
                    Address Line 1 *
                  </Label>
                  <Input
                    id="line1"
                    value={formData.line1}
                    onChange={(e) => handleInputChange("line1", e.target.value)}
                    className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${
                      validationErrors.line1 ? "border-red-500" : ""
                    }`}
                    placeholder="123 High Street"
                  />
                  {validationErrors.line1 && (
                    <p className="text-xs text-red-400 mt-1">
                      {validationErrors.line1}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="line2" className="text-gray-300 mb-2 block">
                    Address Line 2
                  </Label>
                  <Input
                    id="line2"
                    value={formData.line2}
                    onChange={(e) => handleInputChange("line2", e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-gray-300 mb-2 block">
                      City *
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${
                        validationErrors.city ? "border-red-500" : ""
                      }`}
                      placeholder="London"
                    />
                    {validationErrors.city && (
                      <p className="text-xs text-red-400 mt-1">
                        {validationErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="county"
                      className="text-gray-300 mb-2 block"
                    >
                      County
                    </Label>
                    <Input
                      id="county"
                      value={formData.county}
                      onChange={(e) =>
                        handleInputChange("county", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      placeholder="Greater London"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="postcode"
                      className="text-gray-300 mb-2 block"
                    >
                      Postcode *
                    </Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) =>
                        handleInputChange(
                          "postcode",
                          e.target.value.toUpperCase()
                        )
                      }
                      className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${
                        validationErrors.postcode ? "border-red-500" : ""
                      }`}
                      placeholder="SW1A 1AA"
                    />
                    {validationErrors.postcode && (
                      <p className="text-xs text-red-400 mt-1">
                        {validationErrors.postcode}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="country" className="text-gray-300 mb-2 block">
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    readOnly
                    className="bg-white/5 border-white/10 text-gray-400 cursor-not-allowed opacity-60"
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-sm text-white font-medium flex items-center gap-2">
                      Create a free account
                      <span className="text-[11px] bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded-full border border-sky-500/30">
                        Recommended
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">
                      Save your address for faster checkout, track orders and
                      returns, and get dedicated support.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateAccount((prev) => !prev)}
                    className={`flex-shrink-0 relative inline-flex h-9 w-16 items-center rounded-full transition-colors ${
                      createAccount ? "bg-sky-600" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                        createAccount ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {createAccount && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="password"
                        className="text-gray-300 mb-2 block"
                      >
                        Create Password *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all ${
                          validationErrors.password ? "border-red-500" : ""
                        }`}
                        placeholder="Create a password"
                      />
                      {validationErrors.password && (
                        <p className="text-xs text-red-400 mt-1">
                          {validationErrors.password}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">
                        6+ characters. Your email becomes your username.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Custom Build Service */}
            {isLikelyFullBuild && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-sky-400" />
                      Custom Build Service
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 max-w-3xl">
                      Choose how far we go with assembly, optimisation, and
                      presentation.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-xs text-sky-200 whitespace-nowrap">
                    Auto-applied for full builds
                  </div>
                </div>

                {showBuildServiceOptions && (
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    {customBuildOptions.map((option) => {
                      const isSelected = selectedBuildService === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedBuildService(option.id)}
                          aria-pressed={isSelected}
                          disabled={!!stripeClientSecret || isProcessing}
                          className={`group relative w-full text-left rounded-2xl border transition-all duration-200 p-5 bg-gradient-to-br ${
                            option.accent
                          } ${
                            isSelected
                              ? "border-sky-400/70 shadow-lg shadow-sky-500/30"
                              : "border-white/10 hover:border-sky-400/40 hover:shadow-sky-500/20"
                          } disabled:opacity-50 disabled:cursor-not-allowed flex flex-col`}
                        >
                          <div className="mb-3 w-full">
                            <p className="text-white font-semibold text-lg leading-tight mb-1">
                              {option.name}
                            </p>
                            <p className="text-[13px] text-gray-300 leading-snug">
                              {option.positioning}
                            </p>
                          </div>

                          <div className="text-center mb-3 w-full">
                            <p className="text-2xl font-bold text-sky-100">
                              £{option.price.toFixed(0)}
                            </p>
                          </div>

                          {option.badge && (
                            <span className="w-full text-center text-[11px] px-2 py-1.5 rounded-full bg-white/10 border border-white/20 text-sky-100 mb-3">
                              {option.badge}
                            </span>
                          )}

                          <span className="w-full text-center text-[11px] text-sky-200 bg-white/10 border border-white/10 rounded-full px-2 py-1.5 mb-3">
                            {option.campaign}
                          </span>

                          <div className="space-y-2 flex-1">
                            <p className="text-[11px] uppercase tracking-wide text-gray-300/80">
                              Includes
                            </p>
                            <ul className="space-y-1.5">
                              {option.includes.map((item) => (
                                <li
                                  key={item}
                                  className="text-xs text-white/90 flex items-start gap-2"
                                >
                                  <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-sky-300 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="pt-3 border-t border-white/10 mt-3 text-[12px] text-gray-200 leading-snug">
                              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                                Ideal for
                              </p>
                              <p>{option.idealFor}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedBuildService(option.id)}
                            className={`w-full mt-4 inline-flex items-center justify-center gap-1 text-[12px] px-2 py-2 rounded-lg border transition-all ${
                              isSelected
                                ? "border-sky-300/60 text-white bg-sky-500/20"
                                : "border-white/30 text-gray-200 hover:border-sky-300/40 hover:bg-sky-500/10"
                            }`}
                          >
                            {isSelected ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            {isSelected ? "Selected" : "Select"}
                          </button>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        If you prefer to assemble your own PC, toggle below to
                        remove the build service fee. You'll receive all your
                        components unassembled, ready for you to build.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowBuildServiceOptions(!showBuildServiceOptions);
                      }}
                      className={`flex-shrink-0 relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        !showBuildServiceOptions ? "bg-sky-600" : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          !showBuildServiceOptions
                            ? "translate-x-7"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Trust Badges */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white font-medium">
                      Secure Payment
                    </p>
                    <p className="text-[10px] text-gray-400">256-bit SSL</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <Award className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white font-medium">
                      3-Year Warranty
                    </p>
                    <p className="text-[10px] text-gray-400">Full coverage</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white font-medium">
                      Fast Delivery
                    </p>
                    <p className="text-[10px] text-gray-400">From 1-2 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white font-medium">
                      Easy Returns
                    </p>
                    <p className="text-[10px] text-gray-400">30-day policy</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method Selection */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-sky-400" />
                Payment Method
              </h2>

              {/* Show embedded Stripe form if client secret is available */}
              {selectedPayment === "stripe" && stripeClientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: stripeClientSecret,
                    appearance: {
                      theme: "night",
                      variables: {
                        colorPrimary: "#0ea5e9",
                        colorBackground: "#0b1220",
                        colorText: "#ffffff",
                        colorDanger: "#ef4444",
                        fontFamily: "system-ui, sans-serif",
                        borderRadius: "8px",
                      },
                    },
                  }}
                >
                  <StripePaymentForm
                    onSuccess={handleStripeSuccess}
                    amount={total}
                  />
                </Elements>
              ) : (
                <>
                  {/* Payment method selection */}
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPayment(method.id)}
                        disabled={!!stripeClientSecret}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedPayment === method.id
                            ? "border-sky-500 bg-sky-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        } ${
                          stripeClientSecret
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <method.icon
                              className={`w-6 h-6 ${
                                selectedPayment === method.id
                                  ? "text-sky-400"
                                  : "text-gray-400"
                              }`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">
                                  {method.name}
                                </span>
                                {method.recommended && (
                                  <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {method.description}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPayment === method.id
                                ? "border-sky-500 bg-sky-500"
                                : "border-gray-400"
                            }`}
                          >
                            {selectedPayment === method.id && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <Alert className="bg-red-500/10 border-red-500/30 text-red-400 mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button (only show if no Stripe form active) */}
                  {!stripeClientSecret && (
                    <ButtonWithLoading
                      onClick={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                      }}
                      isLoading={isProcessing}
                      loadingText="Processing..."
                      className="w-full h-14 text-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 mt-6"
                    >
                      {selectedPayment === "stripe" ? (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Continue to Payment - £{total.toFixed(2)}
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Complete Secure Payment - £{total.toFixed(2)}
                        </>
                      )}
                    </ButtonWithLoading>
                  )}

                  {/* Security Notice */}
                  {!stripeClientSecret && (
                    <div className="text-center text-sm text-gray-400 mt-4">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Your payment information is encrypted and secure
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-white mb-4">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm text-sky-400 font-semibold">
                        £{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                {buildService && (
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-white/5 border border-sky-500/40 rounded flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-sky-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">
                        {buildService.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Custom Build Service
                      </p>
                      <p className="text-sm text-sky-400 font-semibold">
                        £{buildServiceCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-white/10 my-4" />

              {/* Pricing */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Components</span>
                  <span className="text-white">
                    £{componentsSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Custom Build Service</span>
                  <span className="text-white">
                    £{buildServiceCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">£{subtotal.toFixed(2)}</span>
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-2 p-3 rounded-md bg-white/5 border border-white/10">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Discount Code
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      onBlur={() => validateCoupon(couponCode)}
                      disabled={isProcessing || couponLoading}
                      className="h-9 bg-black/30 border-white/20 text-white placeholder:text-gray-500"
                    />
                    <ButtonWithLoading
                      type="button"
                      onClick={() => validateCoupon(couponCode)}
                      disabled={!couponCode.trim() || isProcessing}
                      isLoading={couponLoading}
                      loadingText="Applying..."
                      className="h-9 px-3 bg-sky-600 hover:bg-sky-500 text-white text-sm rounded-md"
                    >
                      Apply
                    </ButtonWithLoading>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-400 mt-1">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded p-2 mt-2">
                      <span className="text-xs text-green-400">
                        {appliedCoupon.code} ({appliedCoupon.discountPercent}%
                        off)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponCode("");
                          setAppliedCoupon(null);
                          setCouponError(null);
                        }}
                        className="text-green-400 hover:text-green-300 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Discount Display */}
                {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Discount</span>
                    <span className="text-green-400 font-semibold">
                      -£{appliedCoupon.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      Subtotal after discount
                    </span>
                    <span className="text-white">
                      £{finalSubtotal.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Shipping selection */}
                <div className="space-y-2 p-3 rounded-md bg-white/5 border border-white/10">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Shipping Method
                  </p>
                  {shippingOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isProcessing || !!stripeClientSecret}
                      onClick={() => setSelectedShipping(opt.id)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all duration-200 border ${
                        selectedShipping === opt.id
                          ? "bg-sky-500/20 border-sky-500/40"
                          : "bg-black/10 border-white/10 hover:border-sky-500/30"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-medium">
                          {opt.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {opt.estimate}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-sky-400">
                        {opt.cost === 0 ? "FREE" : `£${opt.cost.toFixed(2)}`}
                      </div>
                    </button>
                  ))}
                  {/* Shipping Partners */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
                      Shipping Partners
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400">
                        DPD
                      </div>
                      <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400">
                        Royal Mail
                      </div>
                      <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400">
                        DHL
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-500 text-center mt-1.5">
                      Collections & returns available
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span
                    className={
                      shippingCost === 0 ? "text-green-400" : "text-white"
                    }
                  >
                    {shippingCost === 0
                      ? "FREE"
                      : `£${shippingCost.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <Separator className="bg-white/10 my-4" />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg text-white font-semibold">Total</span>
                <span className="text-2xl text-sky-400 font-bold">
                  £{total.toFixed(2)}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
