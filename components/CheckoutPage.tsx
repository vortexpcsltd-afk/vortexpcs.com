import { useState } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import { stripePromise } from "../config/stripe";

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
}

// Payment Form Component (wrapped in Elements)
function PaymentForm({
  cartItems,
  onNavigate,
  onBackToCart,
}: Omit<CheckoutPageProps, "cartItems"> & {
  cartItems: CheckoutPageProps["cartItems"];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
  const vatRate = 0.2; // 20% UK VAT
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  const handleShippingChange = (field: string, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-white/5 backdrop-blur-xl border-green-500/20 p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-6">
              Your order has been processed successfully.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to order confirmation...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBackToCart}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="text-3xl font-bold text-white">Checkout</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Shield className="w-4 h-4" />
            Secure Checkout
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="w-5 h-5 text-sky-400" />
                <h2 className="text-xl font-semibold text-white">
                  Shipping Information
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={shippingInfo.firstName}
                    onChange={(e) =>
                      handleShippingChange("firstName", e.target.value)
                    }
                    className="bg-white/5 border-white/10 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={shippingInfo.lastName}
                    onChange={(e) =>
                      handleShippingChange("lastName", e.target.value)
                    }
                    className="bg-white/5 border-white/10 text-white mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) =>
                      handleShippingChange("email", e.target.value)
                    }
                    className="bg-white/5 border-white/10 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={shippingInfo.phone}
                    onChange={(e) =>
                      handleShippingChange("phone", e.target.value)
                    }
                    className="bg-white/5 border-white/10 text-white mt-1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="address" className="text-white">
                  Address *
                </Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) =>
                    handleShippingChange("address", e.target.value)
                  }
                  className="bg-white/5 border-white/10 text-white mt-1"
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="city" className="text-white">
                    City *
                  </Label>
                  <Input
                    id="city"
                    value={shippingInfo.city}
                    onChange={(e) =>
                      handleShippingChange("city", e.target.value)
                    }
                    className="bg-white/5 border-white/10 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postcode" className="text-white">
                    Postcode *
                  </Label>
                  <Input
                    id="postcode"
                    value={shippingInfo.postcode}
                    onChange={(e) =>
                      handleShippingChange("postcode", e.target.value)
                    }
                    className="bg-white/5 border-white/10 text-white mt-1"
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
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-sky-400" />
                <h2 className="text-xl font-semibold text-white">
                  Payment Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white">Card Details</Label>
                  <div className="mt-1 p-4 bg-white/5 border border-white/10 rounded-md">
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

              <div className="mt-4 text-sm text-gray-400">
                <p className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Your payment information is secure and encrypted
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-sm text-gray-400">
                        {item.category} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-white">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="bg-white/10" />

              {/* Totals */}
              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">VAT (20%)</span>
                  <span className="text-white">£{vat.toFixed(2)}</span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-white">£{total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Error Message */}
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !stripe}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-6 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay £{total.toFixed(2)}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By completing your purchase, you agree to our terms of service and
              privacy policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Checkout Page Component
export function CheckoutPage(props: CheckoutPageProps) {
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
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
            <Button
              onClick={props.onBackToCart}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
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
