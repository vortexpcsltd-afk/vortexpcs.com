/**
 * Subscription Modal
 * Handles subscription plan selection and payment processing
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { CheckCircle2, CreditCard, Shield, Lock } from "lucide-react";
import { toast } from "sonner";
import { logger } from "../services/logger";
import { createCheckoutSession, type CartItem } from "../services/payment";
import {
  createPayPalOrder,
  capturePayPalOrder,
  type PayPalOrderItem,
} from "../services/paypal";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { isPayPalConfigured } from "../config/paypal";

interface ServiceTier {
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
  popular?: boolean;
  tagline: string;
  features: string[];
  responseTime: string;
  savings?: string;
}

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTier: ServiceTier | null;
}

export function SubscriptionModal({
  open,
  onOpenChange,
  selectedTier,
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "stripe" | "paypal" | null
  >(null);
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    postcode: "",
    quantity: "1",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStripeCheckout = async () => {
    // Validation
    if (
      !formData.businessName ||
      !formData.contactName ||
      !formData.email ||
      !formData.phone ||
      !formData.postcode
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!selectedTier) {
      toast.error("No subscription plan selected");
      return;
    }

    setPaymentMethod("stripe");
    setLoading(true);

    try {
      logger.info("Creating subscription checkout session", {
        tier: selectedTier.id,
        billing: selectedTier.billing,
      });

      // Calculate total price
      const quantity = parseInt(formData.quantity) || 1;
      const totalPrice = selectedTier.price * quantity;

      // Create cart item for subscription
      const cartItems: CartItem[] = [
        {
          id: selectedTier.id,
          name: `${selectedTier.name} - ${
            selectedTier.billing === "monthly" ? "Monthly" : "Annual"
          } Subscription`,
          price: totalPrice,
          quantity: 1,
          image: "🛡️",
        },
      ];

      // Create checkout session with subscription metadata
      const session = await createCheckoutSession(
        cartItems,
        formData.email,
        undefined,
        {
          type: "subscription",
          plan_id: selectedTier.id,
          plan_name: selectedTier.name,
          billing_cycle: selectedTier.billing,
          business_name: formData.businessName,
          contact_name: formData.contactName,
          phone: formData.phone,
          postcode: formData.postcode,
          quantity: formData.quantity,
        }
      );

      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (error) {
      logger.error("Subscription checkout error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process subscription. Please try again."
      );
      setLoading(false);
      setPaymentMethod(null);
    }
  };

  const handlePayPalCheckout = async () => {
    // Validation
    if (
      !formData.businessName ||
      !formData.contactName ||
      !formData.email ||
      !formData.phone ||
      !formData.postcode
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!selectedTier) {
      toast.error("No subscription plan selected");
      return;
    }

    setPaymentMethod("paypal");
    setLoading(true);

    try {
      logger.info("Creating PayPal subscription order", {
        tier: selectedTier.id,
        billing: selectedTier.billing,
      });

      // Calculate total price
      const quantity = parseInt(formData.quantity) || 1;
      const totalPrice = selectedTier.price * quantity;

      // Create PayPal order items
      const paypalItems: PayPalOrderItem[] = [
        {
          id: selectedTier.id,
          name: `${selectedTier.name} - ${
            selectedTier.billing === "monthly" ? "Monthly" : "Annual"
          } Subscription`,
          price: totalPrice,
          quantity: 1,
          description: selectedTier.tagline,
        },
      ];

      // Create PayPal order
      const order = await createPayPalOrder(
        paypalItems,
        formData.email,
        undefined,
        {
          type: "subscription",
          plan_id: selectedTier.id,
          plan_name: selectedTier.name,
          billing_cycle: selectedTier.billing,
          business_name: formData.businessName,
          contact_name: formData.contactName,
          phone: formData.phone,
          postcode: formData.postcode,
          quantity: formData.quantity,
        }
      );

      // In development, capture immediately
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        await capturePayPalOrder(order.orderId);
      } else {
        // In production, redirect to PayPal for approval
        const approvalLink = order.links?.find(
          (link) => link.rel === "approve"
        );
        if (approvalLink) {
          window.location.href = approvalLink.href;
        } else {
          throw new Error("PayPal approval link not found");
        }
      }
    } catch (error) {
      logger.error("PayPal checkout error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process PayPal payment. Please try again."
      );
      setLoading(false);
      setPaymentMethod(null);
    }
  };

  const handleSubscribe = () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethod === "stripe") {
      handleStripeCheckout();
    } else {
      handlePayPalCheckout();
    }
  };

  if (!selectedTier) return null;

  const quantity = parseInt(formData.quantity) || 1;
  const totalPrice = selectedTier.price * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Subscribe to {selectedTier.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {selectedTier.tagline}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{selectedTier.name}</h3>
                <p className="text-sm text-gray-400">
                  {selectedTier.responseTime} response time
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-sky-400">
                  £{selectedTier.price}
                  <span className="text-sm text-gray-400">
                    /{selectedTier.billing === "monthly" ? "mo" : "year"}
                  </span>
                </div>
                {selectedTier.savings && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-2">
                    {selectedTier.savings}
                  </Badge>
                )}
              </div>
            </div>

            {/* Key Features */}
            <div className="space-y-2">
              {selectedTier.features.slice(0, 5).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
              {selectedTier.features.length > 5 && (
                <p className="text-xs text-gray-500 ml-6">
                  + {selectedTier.features.length - 5} more features
                </p>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-300">
              Business Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="businessName">
                  Business Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) =>
                    handleInputChange("businessName", e.target.value)
                  }
                  placeholder="Your Business Ltd"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">
                  Contact Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) =>
                    handleInputChange("contactName", e.target.value)
                  }
                  placeholder="John Smith"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="01234 567890"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@business.com"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postcode">
                  Postcode <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) =>
                    handleInputChange("postcode", e.target.value)
                  }
                  placeholder="SW1A 1AA"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Number of Systems</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            onSelectStripe={() => setPaymentMethod("stripe")}
            onSelectPayPal={() => setPaymentMethod("paypal")}
            loading={loading}
            stripeEnabled={true}
            paypalEnabled={isPayPalConfigured}
          />

          {/* Total Summary */}
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Subscription Total</span>
              <span className="text-2xl font-bold text-white">
                £{totalPrice.toFixed(2)}
                <span className="text-sm text-gray-400">
                  /{selectedTier.billing === "monthly" ? "mo" : "year"}
                </span>
              </span>
            </div>
            {quantity > 1 && (
              <p className="text-xs text-gray-400">
                {quantity} system{quantity > 1 ? "s" : ""} × £
                {selectedTier.price}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {selectedTier.billing === "monthly"
                ? "Billed monthly, cancel anytime"
                : "Billed annually, save compared to monthly"}
            </p>
          </div>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Stripe Powered</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Checkout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
