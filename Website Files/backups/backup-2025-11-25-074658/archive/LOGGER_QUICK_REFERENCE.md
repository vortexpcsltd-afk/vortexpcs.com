# Logger Service - Quick Reference

## Import

```typescript
// In components
import { logger } from "../services/logger";

// In services
import { logger } from "./logger";

// In root files
import { logger } from "./services/logger";
```

## Usage Examples

### Debug (Development Only)

```typescript
// Before
console.log("User data:", user);
console.log("Processing order", orderId);

// After
logger.debug("User data loaded", { userId: user.uid, email: user.email });
logger.debug("Processing order", { orderId, items: order.items.length });
```

### Info (Development Only)

```typescript
// Before
console.log("Feature enabled");

// After
logger.info("Feature enabled", { feature: "newCheckout", version: "1.2" });
```

### Warnings (Dev + Production Tracking)

```typescript
// Before
console.warn("API rate limit approaching");
console.warn("Using fallback data");

// After
logger.warn("API rate limit approaching", { remaining: 10, limit: 100 });
logger.warn("Using fallback data", { reason: "CMS unavailable" });
```

### Errors (Always Tracked)

```typescript
// Before
console.error("Payment failed:", error);
catch (error) {
  console.error("Database error:", error);
}

// After
logger.error("Payment failed", error, {
  orderId,
  amount,
  customerId
});

catch (error) {
  logger.error("Database error", error, {
    operation: "createOrder",
    collection: "orders"
  });
}
```

### Success Messages (Development Only)

```typescript
// Before
console.log("✅ Order created successfully");

// After
logger.success("Order created successfully", {
  orderId,
  total,
  items: cart.length,
});
```

### Analytics Tracking

```typescript
logger.track("page_view", { page: "/checkout", referrer: document.referrer });
logger.track("add_to_cart", { productId, price, quantity });
logger.track("purchase_complete", { orderId, total, items });
```

### Performance Monitoring

```typescript
const start = performance.now();
// ... expensive operation ...
const duration = performance.now() - start;

logger.performance("CMS data fetch", duration);
// Automatically logs if > 1000ms in production
```

## Environment Behavior

### Development Mode

- All logs visible in console
- Formatted with emojis for easy identification
- Context objects displayed
- Stack traces shown

### Production Mode

- **Zero console output** (completely silent)
- Errors automatically sent to Sentry
- Warnings tracked for monitoring
- Analytics events tracked via Vercel Analytics
- Performance issues logged

## Best Practices

### ✅ DO

```typescript
// Use structured context objects
logger.debug("User action", {
  action: "add_to_cart",
  userId,
  productId,
});

// Include relevant details for debugging
logger.error("API call failed", error, {
  endpoint: "/api/orders",
  method: "POST",
  statusCode: response.status,
});

// Track important user actions
logger.track("checkout_started", {
  items: cart.length,
  total,
});
```

### ❌ DON'T

```typescript
// Don't use console.log anymore
console.log("Debug info"); // ❌

// Don't log sensitive data
logger.debug("User password", { password }); // ❌

// Don't log large objects without filtering
logger.debug("Full state", { state }); // ❌ (too much data)

// Don't forget error context
logger.error("Something failed", error); // ❌ (missing context)
```

## Migration Checklist

When adding logger to a new file:

1. ✅ Import logger service
2. ✅ Replace all `console.log` with `logger.debug`
3. ✅ Replace all `console.error` with `logger.error`
4. ✅ Replace all `console.warn` with `logger.warn`
5. ✅ Add context objects where useful
6. ✅ Remove sensitive data from logs
7. ✅ Test in both dev and prod builds

## Common Patterns

### Component Lifecycle

```typescript
useEffect(() => {
  logger.debug("Component mounted", { componentName: "Checkout" });

  return () => {
    logger.debug("Component unmounting", { componentName: "Checkout" });
  };
}, []);
```

### API Calls

```typescript
try {
  logger.debug("API request starting", { endpoint, method });
  const response = await fetch(endpoint, options);
  logger.debug("API response received", { status: response.status });
  return response.json();
} catch (error) {
  logger.error("API request failed", error, { endpoint, method });
  throw error;
}
```

### Form Submissions

```typescript
const handleSubmit = async (data) => {
  try {
    logger.debug("Form submission started", { form: "contact" });
    await submitForm(data);
    logger.success("Form submitted successfully", { form: "contact" });
    logger.track("form_submit", { form: "contact" });
  } catch (error) {
    logger.error("Form submission failed", error, {
      form: "contact",
      fields: Object.keys(data),
    });
  }
};
```

## Verification

Check for remaining console statements:

```powershell
# PowerShell
Get-ChildItem -Include "*.tsx","*.ts" -Recurse |
  Select-String -Pattern "console\.(log|error|warn)"
```

```bash
# Bash/Linux
grep -r "console\.\(log\|error\|warn\)" --include="*.ts" --include="*.tsx" .
```

## Resources

- Logger Service: `services/logger.ts`
- API Logger: `api/services/logger.ts` (for serverless functions)
- Sentry Dashboard: Check production errors
- Implementation Guide: `LOGGER_IMPLEMENTATION_COMPLETE.md`

---

**Remember:** In production, logger provides **zero console output** while maintaining full error tracking and analytics. Your production builds are now professional and secure! ✅
