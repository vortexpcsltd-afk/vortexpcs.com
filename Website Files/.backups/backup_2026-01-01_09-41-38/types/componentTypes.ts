/**
 * Component-specific TypeScript types
 * Centralizes type definitions to eliminate 'any' type usage
 * Maintains consistency across components and services
 */

import type { CartItem, ShippingAddress } from "./index";

/**
 * Firebase Service Account credentials
 * Parsed from base64-encoded FIREBASE_SERVICE_ACCOUNT_BASE64 env variable
 */
export interface FirebaseServiceAccount {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  [key: string]: unknown; // Allow additional Firebase-specific fields
}

/**
 * Selected PC component IDs for PCBuilder
 * Maps component category to selected product ID
 */
export interface SelectedComponentIds {
  cpu?: string | null;
  motherboard?: string | null;
  ram?: string | null;
  storage?: string | null;
  storage2?: string | null;
  gpu?: string | null;
  psu?: string | null;
  case?: string | null;
  cooling?: string | null;
  [key: string]: string | null | undefined;
}

/**
 * Component option selections in PCBuilder
 * Tracks selected options for each component (e.g., color, quantity, warranty)
 */
export interface OptionSelections {
  [componentId: string]: {
    [optionId: string]: string | number | boolean;
  };
}

/**
 * Represents a single PC component product
 */
export interface PCComponent {
  id: string;
  name: string;
  category: string;
  price?: number;
  spec1?: string;
  spec2?: string;
  spec3?: string;
  [key: string]: unknown;
}

/**
 * PCBuilder state tracking all component selections
 */
export interface PCBuilderState {
  selectedComponentIds: SelectedComponentIds;
  optionSelections: OptionSelections;
  totalPrice: number;
  compatibilityIssues: BuildCompatibilityIssue[];
}

/**
 * Represents a compatibility issue between components
 */
export interface BuildCompatibilityIssue {
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
  recommendation?: string;
  affectedComponents?: string[];
}

/**
 * Route props used in AppRoutes component
 * Extends beyond basic navigation to include build recommendations and cart management
 */
export interface AppRoutesProps {
  onNavigate: (view: string) => void;
  onSetRecommendedBuild: (build: RecommendedBuildSpec) => void;
  isRecommendedBuildSpec: (val: unknown) => val is RecommendedBuildSpec;
  recommendedBuild: RecommendedBuildSpec | null;
  addToCart: (item: CartItem) => void;
  setShowCartModal: (open: boolean) => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
  user?: { uid: string } | null;
  userProfile?: UserProfile | null;
  setShowLoginDialog: (open: boolean) => void;
  cartItems?: CartItem[];
  cartHydrated: boolean;
}

/**
 * Recommended PC build spec with optional detailed component breakdown
 */
export interface RecommendedBuildSpec {
  name?: string;
  description?: string;
  price?: number;
  specs?: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    psu?: string;
    cooling?: string;
    case?: string;
  };
  [key: string]: unknown;
}

/**
 * User profile data from authentication context
 */
export interface UserProfile {
  uid?: string;
  email?: string;
  displayName?: string;
  referralCode?: string;
  role?: string;
  accountType?: "customer" | "business" | "admin";
  companyName?: string;
  [key: string]: unknown;
}

/**
 * Admin panel state for user and authentication data
 */
export interface AdminPanelUser {
  uid?: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  [key: string]: unknown;
}

/**
 * Firestore document with metadata
 * Base type for documents retrieved from Firestore with automatic ID and metadata
 */
export interface FirestoreDocument {
  id?: string;
  createdAt?: unknown; // Can be Date or Firestore Timestamp
  updatedAt?: unknown; // Can be Date or Firestore Timestamp
  [key: string]: unknown;
}

/**
 * Order document as stored in Firestore
 * Extends base Firestore document with order-specific fields
 */
export interface FirestoreOrder extends FirestoreDocument {
  orderId?: string;
  userId?: string;
  items?: Array<{
    productId: string;
    productName?: string;
    price?: number;
    quantity?: number;
    ean?: string;
  }>;
  total?: number;
  amount?: number; // Legacy field name
  status?: string;
  paymentMethod?: string;
  paymentId?: string;
  orderDate?: unknown;
  createdAt?: unknown;
  shippingAddress?: ShippingAddress;
  address?: ShippingAddress;
  bankTransferVerifiedAt?: unknown;
}

/**
 * Firestore Timestamp-like object that may be returned from database
 * Allows handling of both native Date objects and Firestore Timestamps
 */
export interface TimestampLike {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

/**
 * Firestore field value for server-side operations
 * Used in Firestore operations like serverTimestamp()
 */
export interface FirestoreFieldValue {
  serverTimestamp?: () => unknown;
  increment?: (value: number) => unknown;
  arrayUnion?: (elements: unknown[]) => unknown;
  arrayRemove?: (elements: unknown[]) => unknown;
  delete?: () => unknown;
}

/**
 * Support ticket from customer support system
 */
export interface SupportTicketMessage {
  senderId?: string | null;
  senderName?: string | null;
  body: string;
  internal?: boolean;
  timestamp?: Date;
  attachments?: Array<{
    name?: string;
    url?: string;
    size?: number;
    type?: string;
    path?: string;
    scanStatus?: string;
  }>;
}

export interface SupportTicket {
  id: string;
  subject?: string;
  status?: string;
  priority?: string;
  createdAt?: Date;
  updatedAt?: Date;
  messages?: SupportTicketMessage[];
  customerId?: string;
  orderId?: string;
  [key: string]: unknown;
}

/**
 * Refund request tracking
 */
export interface RefundRequest {
  id: string;
  orderId: string;
  status: "pending" | "approved" | "rejected" | "processed";
  amount: number;
  reason?: string;
  createdAt?: Date;
  processedAt?: Date;
  [key: string]: unknown;
}

/**
 * IP block record from security service
 */
export interface IpBlockRecord {
  id: string;
  ip?: string;
  attempts?: number;
  blocked?: boolean;
  blockedAt?: TimestampLike | Date;
  reason?: string | null;
  lastEmailTried?: string | null;
  [key: string]: unknown;
}

/**
 * Analytics data point
 */
export interface AnalyticsDataPoint {
  page?: string;
  views?: number;
  timestamp?: unknown;
  [key: string]: unknown;
}
