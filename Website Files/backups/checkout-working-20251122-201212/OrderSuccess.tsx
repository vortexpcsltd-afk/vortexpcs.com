import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  CheckCircle2,
  Package,
  Mail,
  Home,
  Loader2,
  Shield as ShieldIcon,
  Award as AwardIcon,
  Zap as ZapIcon,
} from "lucide-react";
import { verifyPayment, verifyPaymentIntent } from "../services/payment";
import {
  trackEvent,
  getOrder,
  findOrderByStripePaymentIntentId,
} from "../services/database";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "../services/logger";
import type { CartItem } from "../types";

interface OrderSuccessProps {
  onNavigate: (view: string) => void;
  onTriggerLogin?: () => void; // opens auth dialog instead of navigating to missing route
}

export function OrderSuccess({
  onNavigate,
  onTriggerLogin,
}: OrderSuccessProps) {
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  // Minimal shape for payment verification details used in UI
  interface OrderDetails {
    customerEmail?: string;
    customerName?: string;
    amountTotal?: number;
    currency?: string;
    status?: string;
    devTest?: boolean;
    shippingAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    };
  }
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  // Display-friendly order number (human readable if available)
  const [displayOrderNumber, setDisplayOrderNumber] = useState<string | null>(
    null
  );
  const [orderedItems, setOrderedItems] = useState<
    Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>
  >([]);
  const emailConfigured = Boolean(
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_SMTP_HOST &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_SMTP_USER
  );
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const loadOrderDetails = async () => {
      // Get session_id from Router location first, then window, then localStorage fallback (for tests)
      const search = location?.search || window.location.search || "";
      const urlParams = new URLSearchParams(search);
      const sessionId =
        urlParams.get("session_id") ||
        localStorage.getItem("stripe_session_id") ||
        undefined;
      // Support multiple Stripe param names + localStorage fallback (3DS redirects add payment_intent)
      let paymentIntentId =
        urlParams.get("pi") ||
        urlParams.get("payment_intent") ||
        urlParams.get("payment_intent_client_secret")?.split("_secret")[0] ||
        null ||
        localStorage.getItem("latest_payment_intent") ||
        undefined;
      // Preserve human friendly order number if passed
      const explicitOrderNumber =
        urlParams.get("order") ||
        localStorage.getItem("latest_order_number") ||
        null;
      const paypalToken = urlParams.get("token") || undefined; // PayPal orderId
      const bankOrderId = urlParams.get("bank") || undefined; // Bank transfer order reference

      try {
        let analyticsAmount = 0;
        let analyticsCurrency = "GBP";
        let analyticsSource: string = "unknown";
        // Branch by payment method in priority: PayPal -> Bank -> Stripe
        if (paypalToken) {
          // Capture PayPal order via backend (idempotent)
          const resp = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: paypalToken }),
          });
          if (!resp.ok) {
            const info = await resp.json().catch(() => ({}));
            throw new Error(info?.message || "Failed to capture PayPal order");
          }
          const payload: {
            orderId: string;
            status?: string;
            payerEmail?: string;
            amount?: number;
            currency?: string;
          } = await resp.json();

          const details: OrderDetails = {
            customerEmail: payload.payerEmail,
            amountTotal: Math.round(Number(payload.amount || 0) * 100),
            currency: (payload.currency || "GBP").toLowerCase(),
            status: (payload.status || "completed").toLowerCase(),
          };
          setOrderDetails(details);
          analyticsAmount = Number(payload.amount || 0);
          analyticsCurrency = String(payload.currency || "GBP");
          analyticsSource = "paypal";

          // Use local cart snapshot for items list
          const cartRaw = localStorage.getItem("vortex_cart");
          const cartItems = cartRaw ? JSON.parse(cartRaw) : [];
          const orderItems =
            Array.isArray(cartItems) && cartItems.length
              ? cartItems.map((item: CartItem) => ({
                  productId: item.id || "unknown",
                  productName: item.name || "PC Build",
                  quantity: item.quantity || 1,
                  price: item.price || 0,
                }))
              : [
                  {
                    productId: "custom_build",
                    productName: "Custom PC Build",
                    quantity: 1,
                    price: Number(payload.amount || 0),
                  },
                ];
          setOrderedItems(orderItems);

          // Do not create order here; backend capture endpoint persists it already.
        } else if (bankOrderId) {
          // Bank transfer: show pending status from local snapshot
          const cartRaw = localStorage.getItem("vortex_cart");
          const cartItems = cartRaw ? JSON.parse(cartRaw) : [];
          const subtotal = (Array.isArray(cartItems) ? cartItems : []).reduce(
            (sum: number, it: CartItem) =>
              sum + (it.price || 0) * (it.quantity || 1),
            0
          );
          const details: OrderDetails = {
            customerEmail: user?.email || undefined,
            amountTotal: Math.round(Number(subtotal) * 100),
            currency: "gbp",
            status: "pending",
          };
          setOrderDetails(details);
          analyticsAmount = Number(subtotal);
          analyticsCurrency = "GBP";
          analyticsSource = "bank";
          const orderItems = Array.isArray(cartItems)
            ? cartItems.map((item: CartItem) => ({
                productId: item.id || "unknown",
                productName: item.name || "PC Build",
                quantity: item.quantity || 1,
                price: item.price || 0,
              }))
            : [];
          setOrderedItems(orderItems);
        } else {
          // Stripe flows: Payment Intent or Checkout Session
          let data: OrderDetails;
          if (paymentIntentId) {
            data = await verifyPaymentIntent(paymentIntentId);
          } else if (sessionId) {
            data = await verifyPayment(sessionId);
          } else {
            setError("No payment reference found");
            setLoading(false);
            return;
          }
          setOrderDetails(data);
          analyticsAmount = (data?.amountTotal || 0) / 100;
          analyticsCurrency = (data?.currency || "gbp").toUpperCase();
          analyticsSource = data?.devTest ? "dev" : "prod";

          // Create order in Firebase Firestore (Stripe only; webhook may also persist)
          try {
            // Prefer authenticated Firebase user; fallback to localStorage; final fallback guest
            let userId = user?.uid || userProfile?.uid || "";
            if (!userId) {
              const raw = localStorage.getItem("vortex_user");
              try {
                const cached = raw ? JSON.parse(raw) : null;
                userId = cached?.uid || "";
              } catch {
                /* ignore parse */
              }
            }
            if (!userId) {
              userId = `guest_${paymentIntentId || sessionId}`;
            }

            // Get cart items from localStorage (if available)
            const cartRaw = localStorage.getItem("vortex_cart");
            const cartItems = cartRaw ? JSON.parse(cartRaw) : [];

            // Build items from localStorage or metadata fallback
            let orderItems: Array<{
              productId: string;
              productName: string;
              quantity: number;
              price: number;
            }> = [];

            if (Array.isArray(cartItems) && cartItems.length > 0) {
              orderItems = cartItems.map((item: CartItem) => ({
                productId: item.id || "unknown",
                productName: item.name || "PC Build",
                quantity: item.quantity || 1,
                price: item.price || 0,
              }));
            } else {
              // Attempt metadata decode (PaymentIntent verification returns metadata prop)
              const anyData = data as unknown as {
                metadata?: Record<string, string>;
              };
              const meta = anyData?.metadata || {};
              let decodedSuccess = false;
              if (meta.components) {
                try {
                  const decoded = atob(meta.components);
                  const parsed = JSON.parse(decoded) as Array<{
                    id: string;
                    n: string;
                    p: number;
                    cat?: string;
                  }>;
                  if (Array.isArray(parsed) && parsed.length) {
                    orderItems = parsed.map((c) => ({
                      productId: c.id || "component",
                      productName: c.n || "Component",
                      quantity: 1,
                      price: c.p,
                    }));
                    decodedSuccess = true;
                  }
                } catch {
                  /* ignore */
                }
              }
              if (!decodedSuccess && meta.cart) {
                try {
                  const decoded = atob(meta.cart);
                  const parsed = JSON.parse(decoded) as Array<{
                    id: string;
                    n: string;
                    p: number;
                    q: number;
                  }>;
                  if (Array.isArray(parsed) && parsed.length) {
                    orderItems = parsed.map((item) => ({
                      productId: item.id || "unknown",
                      productName: item.n || "Item",
                      quantity: item.q || 1,
                      price: item.p,
                    }));
                    decodedSuccess = true;
                  }
                } catch {
                  /* ignore */
                }
              }
              if (!decodedSuccess) {
                // Fallback generic item
                orderItems = [
                  {
                    productId: "custom_build",
                    productName: "Custom PC Build",
                    quantity: 1,
                    price: (data?.amountTotal || 0) / 100,
                  },
                ];
              }
            }

            // Keep a local copy for confirmation display before we clear storage
            setOrderedItems(orderItems);

            // Check if order already exists (webhook may have created it)
            const rawOrderId = paymentIntentId || sessionId || "unknown";

            try {
              let existing = await getOrder(rawOrderId);
              // Secondary lookup by stripePaymentIntentId if not found and we have PI id
              if (!existing && paymentIntentId) {
                existing = await findOrderByStripePaymentIntentId(
                  paymentIntentId
                );
              }

              if (existing) {
                logger.info("Order already exists - webhook created it", {
                  orderId: rawOrderId,
                });
                setDisplayOrderNumber(
                  explicitOrderNumber ||
                    existing.orderNumber ||
                    existing.orderId
                );
                toast.success("Order confirmed!");
              } else {
                // Webhook hasn't run yet - it will create the order
                // Set a placeholder order number for display
                setDisplayOrderNumber(explicitOrderNumber || rawOrderId);
                logger.info("Order will be created by webhook", {
                  orderId: rawOrderId,
                });
                toast.info("Payment confirmed! Your order is being processed.");
              }
            } catch (checkErr) {
              logger.warn("Order check failed, relying on webhook", {
                error: checkErr,
              });
              // Assume webhook will handle it
              setDisplayOrderNumber(explicitOrderNumber || rawOrderId);
              toast.info("Payment confirmed! Your order is being processed.");
            }

            // Clear cart after confirmation (order created by webhook or will be soon)
            localStorage.removeItem("vortex_cart");
          } catch (orderError) {
            logger.error("Order check/creation failed", orderError);
            // Webhook will create it - just show generic confirmation
            const rawOrderId = paymentIntentId || sessionId || "unknown";
            setDisplayOrderNumber(explicitOrderNumber || rawOrderId);
            toast.info("Payment confirmed! Your order is being processed.");
          }
        }

        // Analytics: purchase event (gated by cookie consent)
        try {
          const consent = localStorage.getItem("vortex_cookie_consent");
          if (consent === "accepted") {
            const raw = localStorage.getItem("vortex_user");
            const user = raw ? JSON.parse(raw) : null;
            const uid = user?.uid || null;
            const amount = analyticsAmount;
            const currency = analyticsCurrency;
            trackEvent(uid, "purchase", {
              amount,
              currency,
              session_id:
                sessionId || paymentIntentId || paypalToken || bankOrderId,
              source: analyticsSource,
            });
          }
        } catch {
          // best-effort analytics only
        }
      } catch (err: unknown) {
        const error = err as Error;
        logger.error("Payment verification error", error);
        setError(error.message || "Failed to verify payment");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [location?.search, user?.uid, userProfile?.uid, user?.email]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
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
                  {emailConfigured && orderDetails?.customerEmail
                    ? "Confirmation Email Sent"
                    : "Order Logged"}
                </p>
                {emailConfigured && orderDetails?.customerEmail ? (
                  <p className="text-sm text-gray-400">
                    We've sent an order confirmation to{" "}
                    <span className="text-white">
                      {orderDetails.customerEmail}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Your order is confirmed. Email delivery is currently
                    unavailable; keep this page for your records.
                  </p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="text-white font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3">
                {displayOrderNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Order Number</span>
                    <span className="text-white font-medium">
                      {displayOrderNumber}
                    </span>
                  </div>
                )}
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

            {/* Items Ordered */}
            {orderedItems.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mt-6 mb-3">
                  Items Ordered
                </h3>
                <div className="space-y-2 text-sm">
                  {orderedItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start border border-white/10 rounded-lg p-3 bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {it.productName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Qty: {it.quantity}
                        </p>
                      </div>
                      <p className="text-white font-semibold">
                        £{(it.price * it.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm mt-3 pt-3 border-t border-white/10">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-medium">
                    £
                    {orderedItems
                      .reduce((sum, i) => sum + i.price * i.quantity, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}

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

            {/* Guest Account Benefits */}
            {!localStorage.getItem("vortex_user") && (
              <div className="border border-sky-600/30 bg-sky-950/40 rounded-lg p-4 sm:p-5">
                <h3 className="text-white text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" /> Create a
                  Free Account (Recommended)
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 mb-3">
                  Register with the same email to automatically link this
                  purchase and unlock:
                </p>
                <ul className="grid sm:grid-cols-2 gap-2 text-[11px] sm:text-xs text-gray-300 mb-3">
                  <li className="flex items-start gap-2">
                    <ShieldIcon className="w-3.5 h-3.5 text-sky-400" /> Build
                    progress tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <Package className="w-3.5 h-3.5 text-sky-400" /> Order
                    history & invoices
                  </li>
                  <li className="flex items-start gap-2">
                    <AwardIcon className="w-3.5 h-3.5 text-sky-400" /> Warranty
                    management
                  </li>
                  <li className="flex items-start gap-2">
                    <ZapIcon className="w-3.5 h-3.5 text-sky-400" /> Early stock
                    & promo alerts
                  </li>
                </ul>
                <Button
                  onClick={() => {
                    if (onTriggerLogin) {
                      onTriggerLogin();
                    } else {
                      // Fallback: navigate to member area which will prompt auth if not logged in
                      onNavigate("member");
                    }
                  }}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white h-9"
                >
                  Create Free Account Now
                </Button>
                <p className="text-[10px] text-gray-500 mt-2">
                  Use the same email you just purchased with—orders auto-link.
                </p>
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
