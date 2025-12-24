# Testing Guide for Vortex PCs

## Overview

This project uses **Vitest** and **React Testing Library** for testing. Tests are organized by type and cover critical paths including payment flows, authentication, and database operations.

## Running Tests

### Basic Commands

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once (for CI/CD)
npm run test:run

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/test/
├── setup.ts                    # Global test setup
├── testUtils.tsx              # Shared testing utilities
├── components/                # Component tests
│   ├── OrderSuccess.test.tsx  # Payment flow tests
│   └── LoginDialog.test.tsx   # Authentication tests
└── services/                  # Service tests
    └── database.test.ts       # Database operation tests
```

## What's Tested

### ✅ Critical Payment Flow (OrderSuccess.test.tsx)

- Payment verification with session ID
- Order creation in Firebase Firestore
- Cart management (clearing after order)
- Guest vs authenticated user handling
- Error handling for payment/database failures
- Analytics tracking with cookie consent
- UI state transitions (loading → success/error)
- Navigation functionality

**Coverage:** 22 test cases covering end-to-end payment flow

### ✅ Authentication Flow (LoginDialog.test.tsx)

- Email/password sign-in
- Google OAuth sign-in
- User registration (sign-up)
- Form validation (email, password, confirmation)
- Error handling for auth failures
- Loading states during authentication
- Mode switching (sign-in ↔ sign-up)

**Coverage:** 15 test cases covering authentication scenarios

### ✅ Database Operations (database.test.ts)

- Order creation in Firestore
- Order retrieval by ID
- User order history queries
- Date conversion (Firestore ↔ JavaScript)
- Field validation and structure
- Error handling for database failures
- Graceful handling when Firebase not configured

**Coverage:** 18 test cases covering database operations

## Test Coverage Goals

| Area           | Current      | Target                |
| -------------- | ------------ | --------------------- |
| Payment Flow   | ✅ 22 tests  | 50% coverage          |
| Authentication | ✅ 15 tests  | 50% coverage          |
| Database       | ✅ 18 tests  | 50% coverage          |
| **Total**      | **55 tests** | **50% critical path** |

## Writing New Tests

### Component Test Template

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithRouter } from "../testUtils";
import { YourComponent } from "../../components/YourComponent";

vi.mock("../../services/yourService");

describe("YourComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render correctly", () => {
    renderWithRouter(<YourComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    renderWithRouter(<YourComponent />);
    const button = screen.getByRole("button", { name: /click me/i });
    button.click();

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### Service Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { yourFunction } from "../../services/yourService";

vi.mock("firebase/firestore");

describe("yourService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should perform operation successfully", async () => {
    const result = await yourFunction("test-data");
    expect(result).toBe("expected-value");
  });

  it("should handle errors gracefully", async () => {
    await expect(yourFunction("invalid")).rejects.toThrow();
  });
});
```

## Best Practices

### ✅ Do's

- **Test user behavior**, not implementation details
- **Use accessible queries** (getByRole, getByLabelText)
- **Mock external dependencies** (Firebase, Stripe, APIs)
- **Test error states** and edge cases
- **Clear mocks** between tests with `beforeEach`
- **Use waitFor** for async operations
- **Test loading states** for better UX coverage

### ❌ Don'ts

- Don't test internal component state
- Don't test library code (React, Radix UI)
- Don't use `getByTestId` unless necessary
- Don't forget to clean up (localStorage, mocks)
- Don't write brittle tests tied to CSS classes

## Mocking Guide

### Firebase/Firestore

```typescript
vi.mock("firebase/firestore");
vi.mock("../../config/firebase", () => ({ db: {} }));

// Mock Firestore methods
(firestore.addDoc as Mock).mockResolvedValue({ id: "doc_123" });
```

### Services

```typescript
vi.mock("../../services/payment");
(verifyPayment as Mock).mockResolvedValue(mockPaymentData);
```

### localStorage

```typescript
beforeEach(() => {
  localStorage.clear();
});

// In test
localStorage.setItem("key", JSON.stringify(data));
```

## Debugging Tests

### View Test UI

```bash
npm run test:ui
```

Opens browser interface showing all tests, coverage, and console output.

### Focus Single Test

```typescript
it.only("should test specific case", () => {
  // Only this test will run
});
```

### Skip Test Temporarily

```typescript
it.skip("should test later", () => {
  // This test will be skipped
});
```

### Debug Output

```typescript
import { screen } from "@testing-library/react";

// Print current DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole("button"));
```

## Coverage Reports

After running `npm run test:coverage`:

```
Coverage report location: coverage/index.html
```

Open in browser to see:

- Line coverage per file
- Branch coverage
- Uncovered lines highlighted
- Overall project coverage %

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Next Steps

### Priority Test Areas (TODO)

1. **PCBuilder Component** - Complex compatibility logic
2. **CheckoutPage** - Stripe Elements integration
3. **MemberArea** - User profile and orders
4. **Form Validation** - Contact, Repair Service forms
5. **Error Boundaries** - Error handling and recovery

### Improving Coverage

```bash
# Check current coverage
npm run test:coverage

# Identify untested areas in coverage report
open coverage/index.html
```

Target: **80% coverage for critical paths** by end of Phase 1

## Troubleshooting

### Tests timing out

Increase timeout in vitest.config.ts:

```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```

### Mock not working

Ensure mock is before import:

```typescript
vi.mock("../../services/payment"); // Must be at top
import { verifyPayment } from "../../services/payment";
```

### Firebase errors in tests

Check Firebase is properly mocked:

```typescript
vi.mock("../../config/firebase", () => ({ db: {} }));
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Mock Service Worker](https://mswjs.io/) - For API mocking

---

**Last Updated:** November 2025  
**Test Framework:** Vitest 4.0.8  
**Coverage:** 55 tests covering critical payment, auth, and database operations
