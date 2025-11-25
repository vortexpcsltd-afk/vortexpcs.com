/**
 * Centralized Error Handler Middleware for Vercel Serverless Functions
 *
 * Provides:
 * - Consistent error response format across all API endpoints
 * - Automatic error logging with context
 * - Type-safe error handling
 * - CORS header injection
 * - Standard HTTP status codes
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Standard API error response shape
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
  statusCode: number;
  timestamp: string;
  path?: string;
}

/**
 * Standard API success response shape
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp?: string;
}

/**
 * Configuration for the error handler
 */
export interface ErrorHandlerConfig {
  /** Whether to include stack traces in error responses (dev only) */
  includeStack?: boolean;
  /** Custom logger function */
  logger?: (message: string, context?: Record<string, unknown>) => void;
  /** Custom CORS origins (default: "*") */
  corsOrigins?: string | string[];
  /** Whether to log errors to console */
  logErrors?: boolean;
}

/**
 * Standard CORS headers for all API responses
 */
const DEFAULT_CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
};

/**
 * Apply CORS headers to response
 */
function applyCorsHeaders(
  res: VercelResponse,
  origins: string | string[] = "*"
): void {
  const originHeader =
    typeof origins === "string" ? origins : origins.join(",");
  res.setHeader("Access-Control-Allow-Origin", originHeader);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    DEFAULT_CORS_HEADERS["Access-Control-Allow-Methods"]
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    DEFAULT_CORS_HEADERS["Access-Control-Allow-Headers"]
  );
}

/**
 * Extract error message and status code from unknown error
 */
function parseError(error: unknown): {
  message: string;
  statusCode: number;
  details?: unknown;
} {
  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for Firebase errors
    const firebaseError = error as { code?: string };
    if (firebaseError.code) {
      const statusCode = mapFirebaseErrorToStatus(firebaseError.code);
      return {
        message: error.message,
        statusCode,
        details: { code: firebaseError.code },
      };
    }

    return {
      message: error.message,
      statusCode: 500,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return { message: error, statusCode: 500 };
  }

  // Handle objects with message property
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const statusCode =
      "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    return { message: error.message, statusCode };
  }

  // Fallback for unknown error types
  return {
    message: "An unexpected error occurred",
    statusCode: 500,
    details: error,
  };
}

/**
 * Map Firebase error codes to HTTP status codes
 */
function mapFirebaseErrorToStatus(code: string): number {
  const statusMap: Record<string, number> = {
    "auth/invalid-email": 400,
    "auth/user-disabled": 403,
    "auth/user-not-found": 404,
    "auth/wrong-password": 401,
    "auth/invalid-credential": 401,
    "auth/email-already-in-use": 409,
    "auth/weak-password": 400,
    "auth/expired-action-code": 400,
    "auth/invalid-action-code": 400,
    "auth/unauthorized-domain": 403,
    "auth/operation-not-allowed": 403,
    "permission-denied": 403,
    "not-found": 404,
    "already-exists": 409,
    "resource-exhausted": 429,
    "failed-precondition": 412,
    aborted: 409,
    "out-of-range": 400,
    unimplemented: 501,
    internal: 500,
    unavailable: 503,
    "data-loss": 500,
    unauthenticated: 401,
  };

  return statusMap[code] || 500;
}

/**
 * Format error response with consistent structure
 */
function formatErrorResponse(
  error: unknown,
  req: VercelRequest,
  includeStack = false
): ApiErrorResponse {
  const parsed = parseError(error);
  const response: ApiErrorResponse = {
    error: parsed.message,
    statusCode: parsed.statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
  };

  if (parsed.details) {
    response.details = parsed.details;
  }

  if (includeStack && error instanceof Error && error.stack) {
    response.details = {
      ...((response.details as Record<string, unknown>) || {}),
      stack: error.stack,
    };
  }

  return response;
}

/**
 * Main error handler middleware wrapper
 *
 * @example
 * ```ts
 * export default withErrorHandler(async (req, res) => {
 *   // Your endpoint logic
 *   if (!req.body.email) {
 *     throw new ApiError("Email is required", 400);
 *   }
 *   return res.status(200).json({ success: true, data: result });
 * });
 * ```
 */
export function withErrorHandler(
  handler: (
    req: VercelRequest,
    res: VercelResponse
  ) => Promise<void | VercelResponse>,
  config: ErrorHandlerConfig = {}
) {
  const {
    includeStack = process.env.NODE_ENV === "development",
    logger,
    corsOrigins = "*",
    logErrors = true,
  } = config;

  return async (
    req: VercelRequest,
    res: VercelResponse
  ): Promise<void | VercelResponse> => {
    try {
      // Apply CORS headers
      applyCorsHeaders(res, corsOrigins);

      // Handle OPTIONS preflight
      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }

      // Execute the handler
      return await handler(req, res);
    } catch (error: unknown) {
      // Log error
      if (logErrors) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const context = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
        };

        if (logger) {
          logger(`API Error: ${errorMessage}`, context);
        } else {
          console.error(`[API Error] ${req.method} ${req.url}:`, error);
          console.error("Request context:", context);
        }
      }

      // Format and send error response
      const errorResponse = formatErrorResponse(error, req, includeStack);
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
  };
}

/**
 * Custom API Error class for throwing errors with specific status codes
 *
 * @example
 * ```ts
 * throw new ApiError("User not found", 404);
 * throw new ApiError("Invalid request", 400, { field: "email" });
 * ```
 */
export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Helper to create success responses with consistent structure
 */
export function successResponse<T>(
  data: T,
  statusCode = 200
): { statusCode: number; body: ApiSuccessResponse<T> } {
  return {
    statusCode,
    body: {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Validate request method
 */
export function validateMethod(
  req: VercelRequest,
  allowedMethods: string[]
): void {
  if (!req.method || !allowedMethods.includes(req.method)) {
    throw new ApiError(
      `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(
        ", "
      )}`,
      405
    );
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((field) => !body[field]);
  if (missing.length > 0) {
    throw new ApiError(`Missing required fields: ${missing.join(", ")}`, 400, {
      missingFields: missing,
    });
  }
}
