import { useState } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  Package,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems?: CartItem[];
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onCheckout?: () => void;
}

export function ShoppingCartModal({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartModalProps) {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal; // No VAT - not VAT registered

  const handleUpdateQuantity = (id: string, delta: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (item && onUpdateQuantity) {
      const newQuantity = Math.max(1, item.quantity + delta);
      onUpdateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = async () => {
    setCheckoutError(null);

    // Navigate to custom checkout page
    onClose(); // Close the cart modal
    onCheckout?.(); // Navigate to checkout page
  };

  // Group items by category for clearer presentation
  const grouped = cartItems.reduce<Record<string, CartItem[]>>((acc, item) => {
    const key = (item.category || "Other").toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  const categoryOrder = Object.keys(grouped).sort();
  const groupTotals: Record<string, number> = Object.fromEntries(
    categoryOrder.map((k) => [
      k,
      grouped[k].reduce((sum, it) => sum + it.price * it.quantity, 0),
    ])
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-sky-500/20 w-[95vw] sm:w-[90vw] md:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            </div>
            <DialogTitle className="text-lg sm:text-2xl text-white truncate">
              Shopping Cart
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Review and manage items in your shopping cart
          </DialogDescription>
        </DialogHeader>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
          {cartItems.length === 0 ? (
            // Empty cart state
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-sky-400/50" />
              </div>
              <h3 className="text-lg sm:text-xl text-white mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 px-4">
                Start building your perfect custom PC with our PC Builder or PC
                Finder
              </p>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            // Grouped cart items
            <div className="space-y-5">
              {categoryOrder.map((category) => (
                <div key={category} className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base text-sky-300 font-semibold">
                      {category}
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        {grouped[category].length} item
                        {grouped[category].length > 1 ? "s" : ""}
                      </span>
                      <span className="text-xs sm:text-sm text-white/90 font-semibold">
                        £{groupTotals[category].toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {grouped[category].map((item) => (
                    <Card
                      key={item.id}
                      className="bg-white/5 backdrop-blur-xl border-white/10 p-3 sm:p-4 hover:border-sky-500/30 transition-all duration-300"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        {/* Item Image/Icon */}
                        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/20 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400" />
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-white text-sm sm:text-base truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1">
                                {category}
                              </p>
                            </div>
                            <button
                              onClick={() => onRemoveItem?.(item.id)}
                              className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 w-9 h-9 flex items-center justify-center"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between mt-3 gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(item.id, -1)
                                }
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 border border-white/10 rounded hover:bg-sky-500/10 hover:border-sky-500/30 transition-colors flex items-center justify-center"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              </button>
                              <span className="text-white text-sm sm:text-base w-8 sm:w-10 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 border border-white/10 rounded hover:bg-sky-500/10 hover:border-sky-500/30 transition-colors flex items-center justify-center"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              </button>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-white text-sm sm:text-base">
                                £{(item.price * item.quantity).toFixed(2)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-gray-400">
                                  £{item.price.toFixed(2)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with totals */}
        {cartItems.length > 0 && (
          <div className="border-t border-white/10 px-4 sm:px-6 py-4 sm:py-6 bg-slate-950/50 backdrop-blur-xl">
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">£{subtotal.toFixed(2)}</span>
              </div>

              <Separator className="bg-white/10" />

              {/* Total */}
              <div className="flex justify-between">
                <span className="text-white text-base sm:text-lg">Total</span>
                <span className="text-lg sm:text-xl text-white font-semibold">
                  £{total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Error message */}
            {checkoutError && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  {checkoutError}
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5 h-11 sm:h-10"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={handleCheckout}
                className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 h-11 sm:h-10"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Delivery info */}
            <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
              Free UK mainland delivery on orders over £500
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
