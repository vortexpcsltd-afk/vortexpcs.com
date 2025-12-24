// Shared order & customer type definitions
// Used by frontend + serverless functions for clarity

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string; // ISO 2
}

export interface OrderItem {
  productId: string;
  name: string;
  category?: string;
  price: number; // unit price in major currency units
  quantity: number;
  image?: string;
}

export type PaymentMethod = "card" | "paypal" | "bank_transfer";

export interface OrderRecord {
  orderNumber: string; // human friendly id e.g. VPC-20251122-AB12
  userId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  currency: string; // e.g. GBP
  status: "pending" | "pending_payment" | "completed";
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  shippingMethod?: string; // free | standard | express
  shippingCost?: number; // shipping cost in major currency units
  bankTransferVerified?: boolean; // Manual verification flag for bank transfers
  bankTransferVerifiedAt?: unknown; // Firestore timestamp when verified
  createdAt?: unknown; // Firestore timestamp placeholder
  updatedAt?: unknown; // Firestore timestamp placeholder
  source: string; // stripe_payment_intent | stripe_checkout | paypal | bank_transfer
}
