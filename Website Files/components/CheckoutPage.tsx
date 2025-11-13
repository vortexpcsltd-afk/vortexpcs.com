import { useState } from "react";
import type { FormEvent } from "react";
import { ComponentErrorBoundary } from "./ErrorBoundary";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Truck,
  Shield,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { createPaymentIntent } from "../services/payment";
import { logger } from "../services/logger";
import { useAuth } from "../contexts/AuthContext";
import { stripePromise } from "../config/stripe";
import {
  SecurityBadges,
  PaymentProviderLogos,
  TrustIndicators,
} from "./SecurityBadges";

interface CheckoutPageProps {
  cartItems: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  onNavigate: (view: string) => void;
  onBackToCart: () => void;
  onTriggerLogin?: () => void;
}

// Payment Form Component (wrapped in Elements)
function PaymentForm({
  cartItems,
  onNavigate,
  onBackToCart,
  onTriggerLogin,
}: Omit<CheckoutPageProps, "cartItems"> & {
  cartItems: CheckoutPageProps["cartItems"];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Track if user explicitly chose guest path (used for potential future logic)
  const [_isGuest, setIsGuest] = useState(!user);

  // Shipping form state
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    country: "GB",
  });

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal; // No VAT - not VAT registered

  const handleShippingChange = (field: string, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again.");
      return;
    }

    // Validate shipping info
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "address",
      "city",
      "postcode",
    ];
    const missingFields = requiredFields.filter(
      (field) => !shippingInfo[field as keyof typeof shippingInfo]
    );

    if (missingFields.length > 0) {
      setError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    // Validate UK postcode format
    const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
    if (!ukPostcodeRegex.test(shippingInfo.postcode.trim())) {
      setError(
        "Please enter a valid UK postcode (e.g. SW1A 1AA, M1 1AA, or B1 1AA)"
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent(total, "gbp", {
        userId: user?.uid || "",
        customerEmail: shippingInfo.email,
        shippingAddress: JSON.stringify(shippingInfo),
      });

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error: stripeError, paymentIntent: confirmedPaymentIntent } =
        await stripe.confirmCardPayment(paymentIntent.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
              email: shippingInfo.email,
              phone: shippingInfo.phone,
              address: {
                line1: shippingInfo.address,
                city: shippingInfo.city,
                postal_code: shippingInfo.postcode,
                country: shippingInfo.country,
              },
            },
          },
          shipping: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              postal_code: shippingInfo.postcode,
              country: shippingInfo.country,
            },
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (confirmedPaymentIntent?.status === "succeeded") {
        setSuccess(true);
        // Redirect to success page with payment details
        setTimeout(() => {
          onNavigate("order-success");
        }, 2000);
      } else {
        throw new Error("Payment failed. Please try again.");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again.";
      logger.error("Payment error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-3 sm:p-4">
        <Card className="bg-white/5 backdrop-blur-xl border-green-500/20 p-6 sm:p-8 max-w-md mx-auto w-full">
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
            </div>
            <h2 className="text-xl sm:text-2xl text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
              Your order has been processed successfully.
            </p>
            {!user && (
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                Tip: Create an account to track your order and view history.
              </p>
            )}
            {!user && (
              <Button
                type="button"
                onClick={() => onTriggerLogin?.()}
                className="bg-white/10 hover:bg-white/20 text-white h-11 mb-3 sm:mb-4"
              >
                Create Account / Sign In
              </Button>
            )}
            <p className="text-xs sm:text-sm text-gray-500">
              Redirecting to order confirmation...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="CheckoutPage">
      <div className="min-h-screen bg-transparent py-6 sm:py-8 px-3 sm:px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={onBackToCart}
                className="text-gray-400 hover:text-white -ml-2 sm:ml-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cart
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Checkout
              </h1>
            </div>
            <SecurityBadges variant="compact" className="hidden md:flex" />
          </div>

          {/* Guest checkout prompt */}
          {!user && (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 sm:p-5 mb-4 sm:mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-center md:text-left">
                  <p className="text-white font-medium text-sm sm:text-base">
                    Checkout as Guest
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    No account required. You can create one after purchase.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <Button
                    type="button"
                    onClick={() => setIsGuest(true)}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 h-11 sm:h-10"
                  >
                    Continue as Guest
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onTriggerLogin?.()}
                    className="border-white/20 text-white hover:bg-white/10 h-11 sm:h-10"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid lg:grid-cols-2 gap-6 lg:gap-8"
          >
            {/* Left Column - Forms */}
            <div className="space-y-4 sm:space-y-6">
              {/* Shipping Information */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    Shipping Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-white text-sm">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={shippingInfo.firstName}
                      onChange={(e) =>
                        handleShippingChange("firstName", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white mt-1 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white text-sm">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={shippingInfo.lastName}
                      onChange={(e) =>
                        handleShippingChange("lastName", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white mt-1 h-11"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                  <div>
                    <Label htmlFor="email" className="text-white text-sm">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) =>
                        handleShippingChange("email", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white mt-1 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white text-sm">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={shippingInfo.phone}
                      onChange={(e) =>
                        handleShippingChange("phone", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white mt-1 h-11"
                    />
                  </div>
                </div>

                <div className="mt-3 sm:mt-4">
                  <Label htmlFor="address" className="text-white text-sm">
                    Address *
                  </Label>
                  <Input
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) =>
                      handleShippingChange("address", e.target.value)
                    }
                    className="bg-white/5 border-white/10 text-white mt-1 h-11"
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                  <div>
                    <Label htmlFor="city" className="text-white text-sm">
                      City *
                    </Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) =>
                        handleShippingChange("city", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white mt-1 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postcode" className="text-white text-sm">
                      Postcode *
                    </Label>
                    <Input
                      id="postcode"
                      value={shippingInfo.postcode}
                      onChange={(e) =>
                        handleShippingChange("postcode", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white mt-1 h-11"
                      placeholder="e.g. SW1A 1AA"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Enter full UK postcode (e.g. SW1A 1AA)
                    </p>
                  </div>
                </div>
              </Card>

              {/* Payment Information */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    Payment Information
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white text-sm">Card Details</Label>
                    <div className="mt-1 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-md">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: "16px",
                              color: "#ffffff",
                              "::placeholder": {
                                color: "#9ca3af",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs sm:text-sm text-gray-400">
                  <p className="flex items-center gap-2">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Your payment information is secure and encrypted
                    </span>
                  </p>
                </div>
              </Card>

              {/* Security Badges */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 text-center">
                  Your Security is Our Priority
                </h3>
                <SecurityBadges variant="grid" />
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                  <PaymentProviderLogos />
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 sm:p-6 sticky top-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
                  Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm sm:text-base truncate">
                          {item.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                          {item.category} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-white text-sm sm:text-base flex-shrink-0">
                        £{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="bg-white/10" />

                {/* Totals */}
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-base sm:text-lg font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-white">£{total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              {/* Error Message */}
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Trust Indicators */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-3 sm:p-4">
                <TrustIndicators />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !stripe}
                variant="primary"
                size="xl"
                className="w-full h-12 sm:h-14 text-base sm:text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="ml-2">Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span className="ml-2">Pay £{total.toFixed(2)}</span>
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>Protected by 256-bit SSL encryption</span>
                </div>
                <p className="text-xs text-gray-500 text-center px-2">
                  By completing your purchase, you agree to our terms of service
                  and privacy policy.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ComponentErrorBoundary>
  );
}

// Main Checkout Page Component
export function CheckoutPage(props: CheckoutPageProps) {
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <Card className="bg-white/5 backdrop-blur-xl border-red-500/20 p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl text-white mb-2">Payment Unavailable</h2>
            <p className="text-gray-400 mb-6">
              Stripe payment processing is not configured. Please check your
              environment variables.
            </p>
            <Button onClick={props.onBackToCart} variant="primary" size="lg">
              Back to Cart
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
