import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle2, Package, Mail, Home, Loader2 } from "lucide-react";
import { verifyPayment } from "../services/payment";
import { trackEvent } from "../services/database";

interface OrderSuccessProps {
  onNavigate: (view: string) => void;
}

export function OrderSuccess({ onNavigate }: OrderSuccessProps) {
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderDetails = async () => {
      // Get session_id from URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");

      if (!sessionId) {
        setError("No session ID found");
        setLoading(false);
        return;
      }

      try {
        // Verify payment with backend
        const data = await verifyPayment(sessionId);
        setOrderDetails(data);

        // TODO: Create order in Firebase Firestore
        // This should be done in the webhook, but we can also do it here as backup

        // Analytics: purchase event (gated by cookie consent)
        try {
          const consent = localStorage.getItem("vortex_cookie_consent");
          if (consent === "accepted") {
            const raw = localStorage.getItem("vortex_user");
            const user = raw ? JSON.parse(raw) : null;
            const uid = user?.uid || null;
            const amount = (data?.amountTotal || 0) / 100;
            const currency = (data?.currency || "gbp").toUpperCase();
            trackEvent(uid, "purchase", {
              amount,
              currency,
              session_id: sessionId,
              source: data?.devTest ? "dev" : "prod",
            });
          }
        } catch {
          // best-effort analytics only
        }
      } catch (err: any) {
        console.error("Payment verification error:", err);
        setError(err.message || "Failed to verify payment");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-white/5 backdrop-blur-xl border-red-500/20 p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl text-white mb-2">
              Payment Verification Failed
            </h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button
              onClick={() => onNavigate("home")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-full mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-400 text-lg">Thank you for your purchase</p>
        </div>

        {/* Order Details Card */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 sm:p-8 mb-6">
          <div className="space-y-6">
            {/* Confirmation Message */}
            <div className="flex items-start gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Mail className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">
                  Confirmation Email Sent
                </p>
                <p className="text-sm text-gray-400">
                  We've sent an order confirmation to{" "}
                  <span className="text-white">
                    {orderDetails?.customerEmail}
                  </span>
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="text-white font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Order Total</span>
                  <span className="text-white font-medium">
                    £{((orderDetails?.amountTotal || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Payment Status</span>
                  <span className="text-green-400 font-medium capitalize">
                    {orderDetails?.status || "Paid"}
                  </span>
                </div>
                {orderDetails?.customerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Customer Name</span>
                    <span className="text-white">
                      {orderDetails.customerName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {orderDetails?.shippingAddress && (
              <div>
                <h3 className="text-white font-semibold mb-3">
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-400 space-y-1">
                  {orderDetails.shippingAddress.line1 && (
                    <p>{orderDetails.shippingAddress.line1}</p>
                  )}
                  {orderDetails.shippingAddress.line2 && (
                    <p>{orderDetails.shippingAddress.line2}</p>
                  )}
                  {orderDetails.shippingAddress.city && (
                    <p>{orderDetails.shippingAddress.city}</p>
                  )}
                  {orderDetails.shippingAddress.postal_code && (
                    <p>{orderDetails.shippingAddress.postal_code}</p>
                  )}
                  {orderDetails.shippingAddress.country && (
                    <p>{orderDetails.shippingAddress.country}</p>
                  )}
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-white font-semibold mb-3">What's Next?</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Your order is being processed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    We'll send you tracking information once your PC is built
                    and dispatched
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Estimated delivery: 5-7 business days</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => onNavigate("member")}
            className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            <Package className="w-4 h-4 mr-2" />
            View Order in Member Area
          </Button>
          <Button
            onClick={() => onNavigate("home")}
            className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
