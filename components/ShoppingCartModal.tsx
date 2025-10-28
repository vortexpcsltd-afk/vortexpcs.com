import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  Package,
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
  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const vatRate = 0.2; // 20% UK VAT
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  const handleUpdateQuantity = (id: string, delta: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (item && onUpdateQuantity) {
      const newQuantity = Math.max(1, item.quantity + delta);
      onUpdateQuantity(id, newQuantity);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-sky-500/20 max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-sky-400" />
            </div>
            <DialogTitle className="text-2xl text-white">
              Shopping Cart
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Review and manage items in your shopping cart
          </DialogDescription>
        </DialogHeader>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            // Empty cart state
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="w-12 h-12 text-sky-400/50" />
              </div>
              <h3 className="text-xl text-white mb-2">Your cart is empty</h3>
              <p className="text-gray-400 mb-6">
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
            // Cart items
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white/5 backdrop-blur-xl border-white/10 p-4 hover:border-sky-500/30 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    {/* Item Image/Icon */}
                    <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/20 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-sky-400" />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h4 className="text-white text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {item.category}
                          </p>
                        </div>
                        <button
                          onClick={() => onRemoveItem?.(item.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-7 h-7 bg-white/5 border border-white/10 rounded hover:bg-sky-500/10 hover:border-sky-500/30 transition-colors flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3 text-gray-400" />
                          </button>
                          <span className="text-white text-sm w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-7 h-7 bg-white/5 border border-white/10 rounded hover:bg-sky-500/10 hover:border-sky-500/30 transition-colors flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-white">
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
          )}
        </div>

        {/* Footer with totals */}
        {cartItems.length > 0 && (
          <div className="border-t border-white/10 px-6 py-6 bg-slate-950/50 backdrop-blur-xl">
            <div className="space-y-3 mb-6">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">£{subtotal.toFixed(2)}</span>
              </div>

              {/* VAT */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">VAT (20%)</span>
                <span className="text-white">£{vat.toFixed(2)}</span>
              </div>

              <Separator className="bg-white/10" />

              {/* Total */}
              <div className="flex justify-between">
                <span className="text-white">Total</span>
                <span className="text-xl text-white">£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={onCheckout}
                className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Delivery info */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Free UK mainland delivery on orders over £500
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
