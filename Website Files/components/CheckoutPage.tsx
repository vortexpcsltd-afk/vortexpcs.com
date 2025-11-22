import { useState, useEffect } from "react";
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
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = shippingOptions.find(
    (o) => o.id === selectedShipping
  )!.cost;
  const total = subtotal + shippingCost;

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

      // Prepare order data
      const orderData = {
        amount: total,
        currency: "gbp",
        cartItems: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
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
      logger.error("Payment Intent creation failed", {
        status: response.status,
        error: errorText,
      });
      throw new Error("Failed to initialize payment");
    }

    const { clientSecret, orderNumber } = await response.json();

    if (!clientSecret) {
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
  const handleStripeSuccess = (paymentIntentId: string) => {
    logger.info("Stripe payment successful", {
      paymentIntentId,
      orderNumber: stripeOrderNumber,
    });

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

    // Redirect to PayPal
    window.location.href = approvalLink.href;
  };

  // Process bank transfer
  const processBankTransfer = async (
    orderData: Record<string, unknown>,
    authToken: string | null
  ) => {
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
              </div>
            </Card>

            {/* Payment Method */}
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
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                      }}
                      disabled={isProcessing}
                      className="w-full h-14 text-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 mt-6"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : selectedPayment === "stripe" ? (
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
                    </Button>
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
              </div>

              <Separator className="bg-white/10 my-4" />

              {/* Pricing */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">£{subtotal.toFixed(2)}</span>
                </div>
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
