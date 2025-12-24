/**
 * Shared Type Definitions
 * Centralized type definitions to replace 'any' types throughout the codebase
 */

// Export review types
export * from "./review";

// ============================================================================
// Error Types
// ============================================================================

/**
 * Standard error with message
 */
export interface ErrorWithMessage {
  message: string;
  code?: string;
  stack?: string;
}

/**
 * Firebase error type
 */
export interface FirebaseError extends Error {
  code: string;
  message: string;
  customData?: Record<string, unknown>;
}

/**
 * Type guard to check if error has message
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

// ============================================================================
// Cart & Commerce Types
// ============================================================================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string; // Required - used throughout the app
  image?: string;
  sku?: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  county?: string;
}

// ============================================================================
// CMS/Contentful Types
// ============================================================================

export interface ContentfulImage {
  url: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}

export interface ContentfulAsset {
  sys: {
    id: string;
    type: string;
  };
  fields: {
    title?: string;
    description?: string;
    file: {
      url: string;
      fileName: string;
      contentType: string;
      details?: {
        size: number;
        image?: {
          width: number;
          height: number;
        };
      };
    };
  };
}

export interface ContentfulEntry<T = Record<string, unknown>> {
  sys: {
    id: string;
    type: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    createdAt: string;
    updatedAt: string;
  };
  fields: T;
}

export interface ContentfulQuery {
  content_type?: string;
  limit?: number;
  skip?: number;
  order?: string | string[];
  select?: string;
  include?: number;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ContentfulResponse<T = Record<string, unknown>> {
  items: ContentfulEntry<T>[];
  includes?: {
    Asset?: ContentfulAsset[];
    Entry?: ContentfulEntry[];
  };
  total: number;
  skip: number;
  limit: number;
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface UserWithRole {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  photoURL?: string | null;
  emailVerified?: boolean;
}

export interface LoginDialogUser extends UserWithRole {
  // Additional fields specific to login dialog
  role: string; // Made required for login dialog
}

// ============================================================================
// Payment Types
// ============================================================================

export interface StripeCheckoutItem {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description?: string;
      images?: string[];
    };
    unit_amount: number;
  };
  quantity: number;
}

export interface PaymentVerificationResponse {
  success: boolean;
  sessionId: string;
  customerEmail?: string;
  customerName?: string;
  amountTotal?: number;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  items?: Array<{
    description: string;
    quantity: number;
    amount: number;
  }>;
}

// ============================================================================
// Database/Firestore Types
// ============================================================================

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

export interface OrderUpdate {
  status?: "pending" | "processing" | "completed" | "cancelled";
  progress?: number;
  notes?: string;
  estimatedCompletion?: Date;
  [key: string]: string | number | Date | undefined;
}

export interface TicketUpdate {
  status?: "open" | "in-progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  response?: string;
  [key: string]: string | number | undefined;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface APIRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
}

export interface APIResponse {
  status: (code: number) => APIResponse;
  json: (data: unknown) => void;
  send: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface RecommendedBuild {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  specs: Record<string, string>;
  category?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make specific properties required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Make specific properties optional
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
