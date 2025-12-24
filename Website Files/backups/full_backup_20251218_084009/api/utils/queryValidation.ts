/**
 * Query Parameter Validation Utilities for API routes
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

type QuerySchema = {
  [key: string]: {
    type: "string" | "number" | "boolean";
    required?: boolean;
    default?: string | number | boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
};

export const querySchemas = {
  analyticsTimeRange: {
    days: {
      type: "number" as const,
      required: false,
      default: 30,
      min: 1,
      max: 365,
    },
  },
  stripeSessionStatus: {
    session_id: {
      type: "string" as const,
      required: true,
      pattern: /^cs_/,
    },
  },
  stripePaymentIntent: {
    payment_intent: {
      type: "string" as const,
      required: true,
      pattern: /^pi_/,
    },
    payment_intent_client_secret: {
      type: "string" as const,
      required: false,
    },
  },
  ipBlockList: {
    limit: {
      type: "number" as const,
      required: false,
      default: 25,
      min: 1,
      max: 1000,
    },
    page: {
      type: "number" as const,
      required: false,
      default: 1,
      min: 1,
    },
    includeUnblocked: {
      type: "boolean" as const,
      required: false,
      default: false,
    },
    search: {
      type: "string" as const,
      required: false,
    },
  },
  emailTest: {
    to: {
      type: "string" as const,
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  emailTestOrder: {
    to: {
      type: "string" as const,
      required: false,
    },
  },
  emailDiagnostic: {
    to: {
      type: "string" as const,
      required: false,
    },
  },
} as const;

export function parseQuery<T extends QuerySchema>(
  req: VercelRequest,
  res: VercelResponse,
  schema: T
): Record<string, unknown> | null {
  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = req.query[key];

    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`Missing required parameter: ${key}`);
      continue;
    }

    if (
      (value === undefined || value === null || value === "") &&
      rules.default !== undefined
    ) {
      result[key] = rules.default;
      continue;
    }

    if (
      !rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      continue;
    }

    const stringValue = Array.isArray(value) ? value[0] : String(value);

    if (rules.type === "number") {
      const numValue = parseInt(stringValue, 10);
      if (isNaN(numValue)) {
        errors.push(`Invalid number for parameter: ${key}`);
        continue;
      }
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(`Parameter ${key} must be at least ${rules.min}`);
        continue;
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(`Parameter ${key} must be at most ${rules.max}`);
        continue;
      }
      result[key] = numValue;
    } else if (rules.type === "boolean") {
      result[key] = stringValue === "true" || stringValue === "1";
    } else {
      if (rules.pattern && !rules.pattern.test(stringValue)) {
        errors.push(`Invalid format for parameter: ${key}`);
        continue;
      }
      result[key] = stringValue;
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: "Invalid query parameters",
      details: errors,
    });
    return null;
  }

  return result;
}
