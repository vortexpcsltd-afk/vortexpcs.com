import { ShoppingCart as CartIcon, Trash2, CreditCard, Lock, ArrowLeft, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  type: 'build' | 'addon';
  name: string;
  components?: any;
  addOns?: any[];
  price: number;
  quantity: number;
}

interface ShoppingCartProps {
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onClearCart: () => void;
  onNavigate: (page: string) => void;
}

export function ShoppingCart({ cartItems, onRemoveItem, onUpdateQuantity, onClearCart, onNavigate }: ShoppingCartProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'confirmation'>('cart');
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Billing Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    // Payment (mock)
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardName: '',
    // Delivery
    deliveryMethod: 'standard',
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vat = subtotal * 0.2; // 20% VAT
  const deliveryFee = formData.deliveryMethod === 'express' ? 25 : 0;
  const total = subtotal + vat + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('confirmation');
    
    // Simulate order processing
    setTimeout(() => {
      toast.success('Order placed successfully!', {
        description: `Order #VX-${Date.now().toString().slice(-6)} has been confirmed.`,
      });
      onClearCart();
      setTimeout(() => {
        onNavigate('dashboard');
      }, 2000);
    }, 1500);
  };

  if (cartItems.length === 0 && checkoutStep === 'cart') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => onNavigate('home')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="mb-2">Shopping Cart</h1>
            <p className="text-gray-400">Your cart is currently empty</p>
          </div>

          <Card className="glass p-12 border-white/10 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-400/10 to-blue-500/10 flex items-center justify-center">
                <CartIcon className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="mb-3">Your cart is empty</h3>
              <p className="text-gray-400 mb-8">
                Start building your dream PC or browse our recommended configurations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => onNavigate('finder')}
                  size="lg"
                >
                  Start PC Finder
                </Button>
                <Button
                  onClick={() => onNavigate('configurator')}
                  size="lg"
                  variant="outline"
                >
                  Custom Configurator
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (checkoutStep === 'confirmation') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass p-12 border-white/10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400/20 to-cyan-500/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="mb-3">Order Confirmed!</h2>
            <p className="text-gray-300 mb-2">
              Thank you for your order, {formData.firstName}!
            </p>
            <p className="text-gray-400 mb-8">
              We've sent a confirmation email to {formData.email}
            </p>
            
            <div className="glass-strong p-6 rounded-lg border border-cyan-400/30 mb-8">
              <div className="text-sm text-gray-400 mb-2">Order Number</div>
              <div className="text-2xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                VX-{Date.now().toString().slice(-6)}
              </div>
            </div>

            <div className="space-y-3 text-left mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Build Status</span>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Order Received
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated Build Time</span>
                <span>3-5 working days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated Delivery</span>
                <span>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <Button
              onClick={() => onNavigate('dashboard')}
              size="lg"
              className="w-full"
            >
              View Order in Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (checkoutStep === 'details') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setCheckoutStep('cart')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="mb-2">Checkout</h1>
            <p className="text-gray-400">Complete your order details</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleCheckout} className="space-y-6">
                {/* Personal Details */}
                <Card className="glass p-6 border-white/10">
                  <h3 className="mb-6">Personal Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="bg-white/5 border-white/10 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="bg-white/5 border-white/10 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-white/5 border-white/10 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-white/5 border-white/10 mt-2"
                      />
                    </div>
                  </div>
                </Card>

                {/* Billing Address */}
                <Card className="glass p-6 border-white/10">
                  <h3 className="mb-6">Billing & Delivery Address</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address1">Address Line 1 *</Label>
                      <Input
                        id="address1"
                        required
                        value={formData.addressLine1}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        className="bg-white/5 border-white/10 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address2">Address Line 2</Label>
                      <Input
                        id="address2"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        className="bg-white/5 border-white/10 mt-2"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="bg-white/5 border-white/10 mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postcode">Postcode *</Label>
                        <Input
                          id="postcode"
                          required
                          value={formData.postcode}
                          onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                          className="bg-white/5 border-white/10 mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Delivery Method */}
                <Card className="glass p-6 border-white/10">
                  <h3 className="mb-6">Delivery Method</h3>
                  <div className="space-y-3">
                    <label className="flex items-start gap-4 p-4 rounded-lg border border-white/10 cursor-pointer hover:border-cyan-400/40 transition-all">
                      <input
                        type="radio"
                        name="delivery"
                        value="standard"
                        checked={formData.deliveryMethod === 'standard'}
                        onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span>Standard Delivery</span>
                          <span className="text-green-400">FREE</span>
                        </div>
                        <p className="text-sm text-gray-400">5-7 working days after build completion</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-4 p-4 rounded-lg border border-white/10 cursor-pointer hover:border-cyan-400/40 transition-all">
                      <input
                        type="radio"
                        name="delivery"
                        value="express"
                        checked={formData.deliveryMethod === 'express'}
                        onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span>Express Delivery</span>
                          <span className="text-cyan-400">+£25.00</span>
                        </div>
                        <p className="text-sm text-gray-400">1-2 working days after build completion</p>
                      </div>
                    </label>
                  </div>
                </Card>

                {/* Payment (Mock) */}
                <Card className="glass p-6 border-white/10">
                  <div className="flex items-center gap-2 mb-6">
                    <Lock className="w-4 h-4 text-green-400" />
                    <h3>Secure Payment</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardName">Cardholder Name *</Label>
                      <Input
                        id="cardName"
                        required
                        placeholder="John Smith"
                        value={formData.cardName}
                        onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                        className="bg-white/5 border-white/10 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="bg-white/5 border-white/10 mt-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardExpiry">Expiry Date *</Label>
                        <Input
                          id="cardExpiry"
                          required
                          placeholder="MM/YY"
                          value={formData.cardExpiry}
                          onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                          className="bg-white/5 border-white/10 mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCVC">CVC *</Label>
                        <Input
                          id="cardCVC"
                          required
                          placeholder="123"
                          value={formData.cardCVC}
                          onChange={(e) => setFormData({ ...formData, cardCVC: e.target.value })}
                          className="bg-white/5 border-white/10 mt-2"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-2 mt-4">
                      <Lock className="w-3 h-3" />
                      Your payment information is encrypted and secure. This is a demo - no real transactions will occur.
                    </p>
                  </div>
                </Card>

                <Button type="submit" size="lg" className="w-full">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Place Order - £{total.toFixed(2)}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="glass p-6 border-white/10 sticky top-24">
                <h3 className="mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="pb-4 border-b border-white/5">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm">£{item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">VAT (20%)</span>
                    <span>£{vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivery</span>
                    <span className={deliveryFee === 0 ? 'text-green-400' : ''}>
                      {deliveryFee === 0 ? 'FREE' : `£${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="text-xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
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

  // Cart View
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2">Shopping Cart</h1>
              <p className="text-gray-400">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                onClick={onClearCart}
                className="text-red-400 hover:text-red-300"
              >
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="glass p-6 border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="mb-2">{item.name}</h4>
                    <Badge className="bg-cyan-400/20 text-cyan-400 border-cyan-400/30 mb-3">
                      Custom Build
                    </Badge>
                    {item.components && (
                      <div className="space-y-1 text-sm text-gray-400">
                        <div>CPU: {item.components.cpu?.name}</div>
                        <div>GPU: {item.components.gpu?.name}</div>
                        <div>RAM: {item.components.ram?.name}</div>
                        <div>Storage: {item.components.storage?.name}</div>
                      </div>
                    )}
                    {item.addOns && item.addOns.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="text-xs text-gray-500 mb-1">Add-ons:</div>
                        {item.addOns.map((addon, idx) => (
                          <div key={idx} className="text-xs text-cyan-300">• {addon.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="h-8 w-8 p-0"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="text-xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    £{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="glass p-6 border-white/10 sticky top-24">
              <h3 className="mb-6">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">VAT (20%)</span>
                  <span>£{vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delivery</span>
                  <span className="text-green-400">FREE</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between mb-6">
                <span>Total</span>
                <span className="text-xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  £{total.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={() => setCheckoutStep('details')}
                size="lg"
                className="w-full mb-3"
              >
                Proceed to Checkout
              </Button>
              <p className="text-xs text-center text-gray-400">
                3 year warranty included • Free lifetime support
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
