/**
 * Payment Method Selector
 * Allows users to choose between Stripe and PayPal
 */

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Card } from "./ui/card";

interface PaymentMethodSelectorProps {
  onSelectStripe: () => void;
  onSelectPayPal: () => void;
  loading?: boolean;
  stripeEnabled?: boolean;
  paypalEnabled?: boolean;
}

export function PaymentMethodSelector({
  onSelectStripe,
  onSelectPayPal,
  loading = false,
  stripeEnabled = true,
  paypalEnabled = true,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    "stripe" | "paypal" | null
  >(null);

  const handleSelectStripe = () => {
    setSelectedMethod("stripe");
    onSelectStripe();
  };

  const handleSelectPayPal = () => {
    setSelectedMethod("paypal");
    onSelectPayPal();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Choose Payment Method
        </h3>
        <div className="grid gap-3">
          {/* Stripe / Credit Card Option */}
          {stripeEnabled && (
            <Card
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedMethod === "stripe"
                  ? "bg-sky-500/20 border-sky-500 ring-2 ring-sky-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
              onClick={handleSelectStripe}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedMethod === "stripe"
                        ? "bg-sky-500/30"
                        : "bg-white/10"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      Credit / Debit Card
                    </div>
                    <div className="text-xs text-gray-400">
                      Visa, Mastercard, Amex
                    </div>
                  </div>
                </div>
                {selectedMethod === "stripe" && loading && (
                  <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                )}
              </div>
            </Card>
          )}

          {/* PayPal Option */}
          {paypalEnabled && (
            <Card
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedMethod === "paypal"
                  ? "bg-sky-500/20 border-sky-500 ring-2 ring-sky-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
              onClick={handleSelectPayPal}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedMethod === "paypal"
                        ? "bg-sky-500/30"
                        : "bg-white/10"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.47a.77.77 0 0 1 .758-.633h7.316c3.474 0 5.82 1.58 5.82 4.666 0 3.633-2.516 6.208-6.281 6.208H8.144l-1.068 8.626zm11.337-8.626c3.474 0 5.82-2.346 5.82-5.82 0-2.515-1.58-4.095-4.095-4.095h-4.857L12.05 21.337h4.666l2.697-8.626z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">PayPal</div>
                    <div className="text-xs text-gray-400">
                      Pay with PayPal balance or card
                    </div>
                  </div>
                </div>
                {selectedMethod === "paypal" && loading && (
                  <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {!stripeEnabled && !paypalEnabled && (
        <div className="text-center py-4 text-gray-400 text-sm">
          Payment methods are currently being configured. Please try again
          later.
        </div>
      )}
    </div>
  );
}
