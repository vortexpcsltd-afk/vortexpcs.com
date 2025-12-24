/**
 * Shared TypeScript interfaces for API endpoints
 * Eliminates the need for 'any' types across the codebase
 */

// Cart/Checkout types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image?: string;
}

export interface CheckoutSessionRequest {
  items: CartItem[];
  customerEmail: string;
  metadata?: Record<string, string>;
  userId?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string | null;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  type?: string;
  stack?: string;
}

export interface StripeError extends Error {
  type: string;
  code?: string;
  statusCode?: number;
  raw?: unknown;
}

// Admin types - flexible interface covering Firebase Admin SDK
export interface FirebaseAdminApp {
  auth: () => FirebaseAuth;
  firestore: () => FirebaseFirestore & {
    FieldValue: { serverTimestamp: () => unknown };
  };
  initializeApp?: (config: unknown) => void;
  credential?: {
    cert: (credentials: unknown) => unknown;
    applicationDefault: () => unknown;
  };
  apps?: unknown[];
}

export interface FirebaseAuth {
  verifyIdToken(token: string): Promise<DecodedToken>;
  getUser(uid: string): Promise<UserRecord>;
  createUser(properties: {
    email: string;
    password: string;
    displayName?: string;
    emailVerified?: boolean;
  }): Promise<UserRecord>;
  deleteUser(uid: string): Promise<void>;
  setCustomUserClaims(
    uid: string,
    claims: Record<string, unknown>
  ): Promise<void>;
  generatePasswordResetLink(email: string): Promise<string>;
}

export interface FirebaseFirestore {
  collection(path: string): FirestoreCollectionReference;
  runTransaction<T>(
    updateFunction: (transaction: FirestoreTransaction) => Promise<T>
  ): Promise<T>;
  FieldValue?: { serverTimestamp: () => unknown };
}

export interface FirestoreCollectionReference {
  doc(id?: string): FirestoreDocumentReference;
  where?: (
    field: string,
    operator: string,
    value: unknown
  ) => { get: () => Promise<FirestoreQuerySnapshot> };
  add?: (data: Record<string, unknown>) => Promise<FirestoreDocumentReference>;
}

export interface FirestoreQuerySnapshot {
  forEach(callback: (doc: FirestoreDocumentSnapshot) => void): void;
  docs: FirestoreDocumentSnapshot[];
}

export interface FirestoreDocumentReference {
  get(): Promise<FirestoreDocumentSnapshot>;
  set(
    data: Record<string, unknown>,
    options?: { merge?: boolean }
  ): Promise<void>;
  update(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  ref?: FirestoreDocumentReference;
}

export interface FirestoreDocumentSnapshot {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
  ref: FirestoreDocumentReference;
}

export interface UserRecord {
  uid: string;
  email?: string;
  displayName?: string;
  disabled?: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

// Transaction types
export interface FirestoreTransaction {
  get(ref: FirestoreDocumentReference): Promise<FirestoreDocumentSnapshot>;
  set(
    ref: FirestoreDocumentReference,
    data: Record<string, unknown>,
    options?: { merge?: boolean }
  ): FirestoreTransaction;
  update(
    ref: FirestoreDocumentReference,
    data: Record<string, unknown>
  ): FirestoreTransaction;
}

// Email template builder - flexible interface
export interface EmailTemplateOptions {
  userName?: string;
  actionLink?: string;
  companyName?: string;
  title?: string;
  preheader?: string;
  contentHtml?: string;
  logoUrl?: string;
  [key: string]: unknown;
}

// Request body types
export interface ContactFormBody {
  name: string;
  email: string;
  subject: string;
  message: string;
  type?: string;
}

export interface SupportTicketBody extends ContactFormBody {
  priority?: string;
  category?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
  }>;
}

// Quote request types
export interface QuoteRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  requirements: string;
  budget?: string;
  timeline?: string;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
  timestamp?: Date | string;
}

// Health check types
export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    [key: string]: {
      status: "pass" | "fail";
      message?: string;
      latency?: number;
    };
  };
}

// Contentful types
export interface ContentfulAssetFields {
  title: string;
  file: {
    url: string;
    details?: {
      size: number;
      image?: {
        width: number;
        height: number;
      };
    };
    fileName: string;
    contentType: string;
  };
}

export interface ContentfulAsset {
  sys: {
    id: string;
    type: string;
  };
  fields: ContentfulAssetFields;
}

// Logger types
export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  success(message: string, context?: LogContext): void;
}

// Rate limit types
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// SMTP types
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Decoded JWT token
export interface DecodedToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  [key: string]: unknown;
}

// Decoded JWT token with custom role claim
export interface DecodedTokenWithRole extends DecodedToken {
  role?: string;
}

// User profile from Firestore
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  accountType?: "general" | "business";
  accountNumber?: string;
  createdAt?: Date | { toDate(): Date };
  [key: string]: unknown;
}

// IP blocking and security data
export interface IPBlockData {
  ip: string;
  blocked: boolean;
  whitelisted?: boolean;
  attempts: number;
  blockedAt: Date | string | { toDate(): Date } | null;
  lastEmailTried?: string;
  lastAttemptAt?: Date | string | { toDate(): Date };
  reason?: string;
}

// Login attempt record
export interface LoginAttemptData {
  ip: string;
  email: string;
  success: boolean;
  blocked?: boolean;
  attempts?: number;
  timestamp: Date | string | { toDate(): Date };
  userAgent?: string;
}

// Stripe error with additional metadata
export interface StripeErrorData extends Error {
  code?: string;
  statusCode?: number;
  requestId?: string;
  type?: string;
  raw?: {
    message: string;
    type: string;
    code?: string;
  };
}

// Firestore document data for reviews
export interface ReviewDocumentData {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  status: "pending" | "approved" | "rejected";
  verifiedPurchase: boolean;
  createdAt: Date | string | { toDate(): Date };
  updatedAt?: Date | string | { toDate(): Date };
  [key: string]: unknown;
}

// Firestore document data for orders
export interface OrderDocumentData {
  id: string;
  orderId: string;
  userId?: string;
  email: string;
  status: string;
  total: number;
  items: unknown[];
  createdAt: Date | string | { toDate(): Date };
  [key: string]: unknown;
}

// Nodemailer send result info
export interface NodemailerSendInfo {
  accepted?: string[];
  rejected?: string[];
  response?: string;
  messageId?: string;
  envelope?: {
    from: string;
    to: string[];
  };
}

// Email send result with Nodemailer info
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  info?: NodemailerSendInfo;
  error?: string;
}
