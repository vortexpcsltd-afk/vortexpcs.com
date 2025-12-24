import { useState, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { logger } from "../services/logger";

interface StripePaymentFormProps {
  onSuccess: (paymentIntentId: string) => void;
  amount: number;
}

export function StripePaymentForm({
  onSuccess,
  amount,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage("Stripe hasn't loaded yet. Please wait a moment.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-success`,
        },
        redirect: "if_required", // Only redirect if required by payment method
      });

      if (error) {
        // Payment failed
        logger.error("Stripe payment error:", error);
        setErrorMessage(
          error.message || "An error occurred while processing your payment."
        );
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded
        logger.info("Payment succeeded", { paymentIntentId: paymentIntent.id });
        onSuccess(paymentIntent.id);
      } else {
        // Payment requires additional action or is processing
        logger.info("Payment status", { status: paymentIntent?.status });
        setErrorMessage(
          "Payment is being processed. You will be redirected shortly."
        );
      }
    } catch (err) {
      logger.error("Payment processing error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs",
    paymentMethodOrder: ["card", "klarna", "revolut_pay"],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element - Stripe's pre-built card input */}
      <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
        <PaymentElement options={paymentElementOptions} />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-14 text-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Pay £{amount.toFixed(2)}
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-center text-sm text-gray-400">
        <Lock className="w-4 h-4 inline mr-1" />
        Your payment information is encrypted and secure
      </div>
    </form>
  );
}
