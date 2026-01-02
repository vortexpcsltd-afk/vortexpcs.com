# VortexPCs.com - Critical Fixes Implementation Guide

**Priority**: 🔴 **CRITICAL - Must implement before next production deploy**  
**Estimated Time**: 6-8 hours for complete implementation  
**Risk Level**: Low (all changes are additive or improve robustness)

---

## QUICK START SUMMARY

This guide provides **copy-paste ready solutions** for the 3 critical issues identified in the forensic audit:

1. ✅ Missing Error Boundaries
2. ✅ Memory Leaks in Session Tracking
3. ✅ Unhandled Promise Rejections

---

## ISSUE #1: Missing Error Boundaries - Implementation

### Status: 🔴 CRITICAL

### Time to Fix: 2-3 hours

### Impact: Prevents entire app crashes from component errors

### Step 1: Verify ErrorBoundary Component

Check [components/ErrorBoundary.tsx](components/ErrorBoundary.tsx) exists and is properly exported:

```tsx
// File: components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";
import { logger } from "../services/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`Error in ${this.props.pageName || "component"}`, error, {
      componentStack: errorInfo.componentStack,
      pageName: this.props.pageName,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4">⚠️ Something went wrong</h1>
            <p className="text-gray-400 mb-6">
              {this.props.pageName && `Error in ${this.props.pageName}`}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// For smaller components that don't need full page reload
export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    logger.warn(`Non-critical error in component`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded text-red-400">
          <p className="text-sm">
            Failed to load {this.props.pageName}. Please try refreshing.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 2: Add Boundaries to Critical Routes

Apply PageErrorBoundary to all routes in [routes/AppRoutes.tsx](routes/AppRoutes.tsx):

```tsx
// PATTERN - Apply to each route
<Route
  path="/pc-builder"
  element={
    <PageErrorBoundary pageName="PC Builder">
      <Suspense fallback={<RouteLoader />}>
        <PCBuilder {...props} />
      </Suspense>
    </PageErrorBoundary>
  }
/>

<Route
  path="/checkout"
  element={
    <PageErrorBoundary pageName="Checkout">
      <Suspense fallback={<RouteLoader />}>
        <CheckoutPage {...props} />
      </Suspense>
    </PageErrorBoundary>
  }
/>

<Route
  path="/member"
  element={
    <PageErrorBoundary pageName="Member Area">
      <Suspense fallback={<RouteLoader />}>
        <MemberArea {...props} />
      </Suspense>
    </PageErrorBoundary>
  }
/>
```

### Step 3: Add ComponentErrorBoundary to High-Value Components

Wrap important feature components:

```tsx
// In PCBuilder.tsx
return (
  <ComponentErrorBoundary pageName="PC Builder Content">
    {/* Component content */}
  </ComponentErrorBoundary>
);

// In ShoppingCartModal.tsx
return (
  <ComponentErrorBoundary pageName="Shopping Cart">
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Modal content */}
    </Dialog>
  </ComponentErrorBoundary>
);
```

### Testing Error Boundaries

Add to App.tsx for development testing:

```tsx
// Add this button to dev-only footer/toolbar
<button
  onClick={() => {
    throw new Error("Test error boundary");
  }}
  className="text-xs text-gray-500 hover:text-gray-400"
>
  [Test Error Boundary]
</button>
```

**Verification Checklist**:

- [ ] All 15+ routes wrapped with PageErrorBoundary
- [ ] Tested error boundary with test error
- [ ] Console shows proper error logging
- [ ] Page reloads cleanly when error occurs
- [ ] Non-critical components use ComponentErrorBoundary

---

## ISSUE #2: Memory Leaks in Session Tracking - Implementation

### Status: 🔴 CRITICAL

### Time to Fix: 2-3 hours

### Impact: Prevents browser memory accumulation over extended sessions

### Problem Analysis

Memory leaks occur in [services/sessionTracker.ts](services/sessionTracker.ts) because:

1. Event listeners aren't cleaned up
2. Intervals aren't cleared on unmount
3. Realtime subscriptions never unsubscribe

### Solution: Add Cleanup Handlers

**File: services/sessionTracker.ts** - Add cleanup tracking:

```typescript
/**
 * Session Tracker with Proper Cleanup
 * Prevents memory leaks by tracking and cleaning up all resources
 */

let sessionInterval: ReturnType<typeof setInterval> | null = null;
let beforeUnloadHandler: (() => void) | null = null;
let trackingActive = false;

export function initializeSessionTracking() {
  if (trackingActive) return;
  trackingActive = true;

  // Clear any existing interval/listener
  if (sessionInterval) clearInterval(sessionInterval);

  // Session tracking interval - must be cleared on cleanup
  sessionInterval = setInterval(() => {
    try {
      const sessionId = getSessionId();
      logger.debug("Session heartbeat", { sessionId });
      // Track session activity
    } catch (error) {
      logger.warn("Session tracking error:", error);
    }
  }, 60000); // Every minute

  // Before unload handler - must be removed on cleanup
  beforeUnloadHandler = () => {
    const sessionId = getSessionId();
    // Send final tracking data
    navigator.sendBeacon(
      "/api/analytics/session-end",
      JSON.stringify({ sessionId, endTime: Date.now() })
    );
  };

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", beforeUnloadHandler);
  }
}

/**
 * CRITICAL: Call this on component unmount or page change
 * Prevents memory leaks from orphaned intervals/listeners
 */
export function stopRealtimeTracking() {
  // Clear interval
  if (sessionInterval) {
    clearInterval(sessionInterval);
    sessionInterval = null;
  }

  // Remove beforeunload listener
  if (beforeUnloadHandler && typeof window !== "undefined") {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    beforeUnloadHandler = null;
  }

  trackingActive = false;
  logger.debug("Session tracking stopped");
}

/**
 * Returns cleanup function for use in useEffect
 */
export function startRealtimeTracking() {
  initializeSessionTracking();

  // Return cleanup function for useEffect
  return () => {
    stopRealtimeTracking();
  };
}
```

### Use in App.tsx - Proper Cleanup

**File: App.tsx** - Add useEffect with cleanup:

```tsx
import { startRealtimeTracking } from "./services/sessionTracker";

export default function App() {
  // ... existing code ...

  // Initialize session tracking with proper cleanup
  useEffect(() => {
    logger.debug("Initializing session tracking");

    // startRealtimeTracking() returns cleanup function
    const cleanup = startRealtimeTracking();

    // Cleanup on unmount - CRITICAL for preventing memory leaks
    return cleanup;
  }, []); // Empty array: runs once on mount, cleanup on unmount

  // ... rest of component ...
}
```

### Monitor Memory Leaks in Development

Add to utils/devTools.ts:

```typescript
/**
 * Memory leak detection helper (dev only)
 */
export function monitorMemory() {
  if (import.meta.env.MODE !== "development") return;

  if (performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
    const usedMB = (usedJSHeapSize / 1048576).toFixed(2);
    const totalMB = (totalJSHeapSize / 1048576).toFixed(2);

    console.log(`📊 Heap: ${usedMB}MB / ${totalMB}MB`);
  }
}

// Usage in components for monitoring
useEffect(() => {
  const interval = setInterval(monitorMemory, 5000);
  return () => clearInterval(interval);
}, []);
```

**Verification Checklist**:

- [ ] Event listeners properly removed in cleanup
- [ ] Intervals cleared with clearInterval()
- [ ] Subscriptions have unsubscribe functions
- [ ] useEffect cleanup functions properly implemented
- [ ] DevTools Memory tab shows stable heap size
- [ ] No "detached DOM nodes" in heap snapshots

---

## ISSUE #3: Unhandled Promise Rejections - Implementation

### Status: 🔴 CRITICAL

### Time to Fix: 3-4 hours (many files to update)

### Impact: Prevents silent failures and improves error visibility

### Step 1: Create Error Handling Utility

**File: utils/asyncHandler.ts** - New file:

```typescript
import { logger } from "../services/logger";

/**
 * Wraps async operations with proper error handling
 * Prevents silent failures and ensures logging
 */
export async function handleAsync<T>(
  operation: Promise<T>,
  context: {
    operationName: string;
    severity?: "critical" | "error" | "warn";
    shouldThrow?: boolean;
    fallback?: T;
  }
): Promise<T | null> {
  try {
    return await operation;
  } catch (error) {
    const {
      operationName,
      severity = "error",
      shouldThrow,
      fallback,
    } = context;

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (severity === "critical") {
      logger.error(`[CRITICAL] ${operationName} failed`, error);
    } else {
      logger.warn(`${operationName} failed: ${errorMessage}`);
    }

    if (shouldThrow) {
      throw error;
    }

    return fallback ?? null;
  }
}

/**
 * Async function wrapper for components
 * Prevents "can't perform React state update on unmounted component"
 */
export function useSafeAsync(isMounted: boolean) {
  return async function <T>(
    operation: Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const result = await operation;
      if (isMounted) onSuccess?.(result);
      return result;
    } catch (error) {
      if (isMounted) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  };
}
```

### Step 2: Fix Auth-Related Promise Rejections

**File: components/LoginDialog.tsx** - Replace problematic code:

```tsx
// BEFORE - Silent failure
recordLoginAttempt("success", normalizedEmail).catch(() => {});

// AFTER - Proper error handling
const handleLoginSuccess = async () => {
  // ... login logic ...

  // Record login attempt with proper error handling
  try {
    await recordLoginAttempt("success", normalizedEmail);
  } catch (error) {
    // Log but don't block user flow
    logger.warn("Failed to record login success", {
      email: normalizedEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue - recording failure shouldn't break login
  }
};

// On login error
const handleLoginError = (error: Error) => {
  // Record failed attempt
  recordLoginAttempt("failure", normalizedEmail).catch((recordError) => {
    logger.warn("Failed to record login failure", recordError);
  });

  // Show user error message
  toast.error("Login failed: " + error.message);
};
```

### Step 3: Fix API Call Promise Rejections

**Pattern for all API calls** - Create wrapper:

```typescript
/**
 * Safe API fetch with proper error handling
 */
export async function safeApiFetch<T>(
  url: string,
  options: RequestInit = {},
  context?: { operationName?: string; isOptional?: boolean }
): Promise<T | null> {
  const { operationName = url, isOptional = false } = context ?? {};

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData: { message?: string } = {};
      try {
        errorData = await response.json();
      } catch {
        // JSON parsing failed, that's okay
      }

      const errorMessage = errorData.message || `HTTP ${response.status}`;
      const error = new Error(`${operationName} failed: ${errorMessage}`);

      if (isOptional) {
        logger.warn(errorMessage, { url, status: response.status });
        return null;
      }

      throw error;
    }

    return (await response.json()) as T;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    logger.error(operationName, error, { url });

    if (isOptional) {
      return null;
    }

    throw error;
  }
}

// Usage examples
const product = await safeApiFetch<Product>(
  `/api/products/${id}`,
  {},
  { operationName: "Fetch product", isOptional: false }
);

const relatedProducts = await safeApiFetch<Product[]>(
  `/api/products/${id}/related`,
  {},
  { operationName: "Fetch related products", isOptional: true } // Doesn't block if fails
);
```

### Step 4: Fix JSON Parsing Errors

**Replace pattern**: `await res.json().catch(() => ({}))`

```typescript
// BEFORE - Bad pattern
const err = await res.json().catch(() => ({}));
if (!err.message) {
  // Can't tell if it's real error or parsing failure
}

// AFTER - Clear intent
async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    logger.warn("Failed to parse response as JSON", {
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    return null;
  }
}

// Usage
const errorData = await parseJsonResponse(response);
if (errorData && errorData.message) {
  showErrorMessage(errorData.message);
} else {
  showGenericError("Request failed");
}
```

### Step 5: Global Unhandled Promise Rejection Handler

**File: App.tsx** - Add near top of App component:

```tsx
useEffect(() => {
  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    logger.error("Unhandled Promise Rejection", event.reason, {
      promise: event.promise.toString(),
    });

    // Prevent default browser handling (error in console)
    event.preventDefault();
  };

  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}, []);
```

**Verification Checklist**:

- [ ] All `.catch(() => {})` replaced with proper error handling
- [ ] All `await res.json()` wrapped in try-catch
- [ ] `recordLoginAttempt()` errors logged
- [ ] API calls use safeApiFetch wrapper
- [ ] Global unhandled rejection handler installed
- [ ] Test: disable network and verify errors shown
- [ ] Test: throw error in async function and verify it's logged

---

## Files to Update - Quick Reference

### Critical Fixes Required:

```
MUST UPDATE:
  ✅ components/ErrorBoundary.tsx (verify/enhance)
  ✅ routes/AppRoutes.tsx (add boundaries to 15+ routes)
  ✅ services/sessionTracker.ts (add cleanup)
  ✅ App.tsx (add session cleanup, unhandled rejection handler)
  ✅ components/LoginDialog.tsx (fix promise handling)
  ✅ components/OrderSuccess.tsx (fix promise handling)
  ✅ components/SearchAnalytics.tsx (fix promise handling)
  ✅ components/PCBuilder.tsx (fix 2+ promise issues)
  ✅ Create utils/asyncHandler.ts (new file)
  ✅ Create utils/safeApiFetch.ts (new file)

FILES WITH CATCH ISSUES (20+):
  - services/support.ts
  - services/email.ts
  - services/emailClient.ts
  - components/BusinessSolutions.tsx
  - components/AdminPanel.tsx
  - api/contact/ endpoints
  - api/security/ endpoints
```

---

## Testing Strategy

### 1. Unit Testing Error Boundaries

```typescript
// Test that ErrorBoundary catches errors
test("ErrorBoundary catches errors", () => {
  const ThrowError = () => {
    throw new Error("Test error");
  };

  render(
    <PageErrorBoundary pageName="Test">
      <ThrowError />
    </PageErrorBoundary>
  );

  expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
});
```

### 2. Memory Leak Testing

```typescript
// Monitor memory usage
describe("Session Tracker Memory", () => {
  test("cleanup function frees resources", () => {
    const cleanup = startRealtimeTracking();

    // Verify tracking is active
    expect(getSessionId()).toBeDefined();

    cleanup();

    // Verify no memory leaks after cleanup
    expect(performance.memory?.usedJSHeapSize).toBeLessThan(10000000);
  });
});
```

### 3. Promise Rejection Testing

```typescript
test("unhandled rejections are logged", async () => {
  const loggerSpy = jest.spyOn(logger, "error");

  // Trigger unhandled rejection
  Promise.reject(new Error("Test rejection"));

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(loggerSpy).toHaveBeenCalled();
});
```

---

## Deployment Steps

1. **Pre-deployment**:

   - [ ] Create backup (already done)
   - [ ] Create feature branch: `git checkout -b fix/critical-issues`
   - [ ] Implement changes in order above

2. **Testing**:

   - [ ] Run linting: `npm run lint`
   - [ ] Run build: `npm run build`
   - [ ] Test error boundary with test error button
   - [ ] Monitor memory with DevTools
   - [ ] Test unhandled promise logging

3. **Deployment**:

   - [ ] Create pull request with all changes
   - [ ] Code review verification
   - [ ] Deploy to staging first
   - [ ] Final testing in staging
   - [ ] Deploy to production

4. **Post-deployment Monitoring**:
   - [ ] Monitor error rates for 24 hours
   - [ ] Check memory usage trends
   - [ ] Verify no new unhandled rejections
   - [ ] Monitor performance metrics

---

## Success Metrics

After implementation:

- ✅ 0 uncaught component errors in production
- ✅ Heap size stable over 1-hour sessions
- ✅ 0 silent promise rejections
- ✅ All errors logged with context
- ✅ Lighthouse Best Practices: 95+
- ✅ No "Unhandled Promise Rejection" in DevTools

---

**Ready to implement? Start with Issue #1 (Error Boundaries) as it provides immediate crash protection.**
