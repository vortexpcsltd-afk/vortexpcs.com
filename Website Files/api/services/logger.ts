import { nanoid } from "nanoid";

export interface LogContext {
  traceId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  [key: string]: unknown;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Structured logger for serverless functions
 * Provides consistent JSON logging with trace IDs for correlation
 */
class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = {
      traceId: context.traceId || nanoid(12),
      ...context,
    };
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...additionalContext,
    });
  }

  /**
   * Get the trace ID for this logger instance
   */
  getTraceId(): string {
    return this.context.traceId || "";
  }

  /**
   * Log at debug level
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  /**
   * Log at info level
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  /**
   * Log at warning level
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  /**
   * Log at error level
   */
  error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>
  ): void {
    const errorInfo =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined;

    this.log("error", message, data, errorInfo);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: LogEntry["error"]
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.context,
        ...data,
      },
    };

    if (error) {
      entry.error = error;
    }

    // Use console methods for different log levels
    // Vercel and other platforms parse these for structured logging
    switch (level) {
      case "debug":
        console.debug(JSON.stringify(entry));
        break;
      case "info":
        console.info(JSON.stringify(entry));
        break;
      case "warn":
        console.warn(JSON.stringify(entry));
        break;
      case "error":
        console.error(JSON.stringify(entry));
        break;
    }
  }
}

/**
 * Create a logger instance with request context
 */
export function createLogger(req?: {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}): Logger {
  const context: LogContext = {};

  if (req) {
    context.method = req.method;
    context.endpoint = req.url;
    const ipHeader =
      req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"];
    context.ip = typeof ipHeader === "string" ? ipHeader : undefined;
    context.userAgent = req.headers?.["user-agent"] as string | undefined;
  }

  return new Logger(context);
}

/**
 * Export default logger for non-request contexts
 */
export const logger = new Logger();
