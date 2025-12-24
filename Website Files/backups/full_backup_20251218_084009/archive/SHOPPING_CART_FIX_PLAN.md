# Shopping Cart System - Critical Fixes Required

## Issues Identified

### 1. ❌ No Credit Card Input Field

**Current State:** Checkout page redirects to Stripe Hosted Checkout instead of showing an embedded payment form.

**Problem:** Customers can't enter card details on your site. The `processStripePayment` function creates a session and redirects away.

**Fix Required:**

- Add Stripe Elements to CheckoutPage for embedded card input
- Keep the redirect flow as a fallback
- Give users choice between embedded form vs Stripe-hosted

---

### 2. ❌ Orders Not Linked to User Accounts

**Current State:** Orders save to Firestore with `userId` field, but:

- Guest checkouts save with `userId: "guest"`
- Logged-in users' orders may not be properly associated
- No guarantee that orders appear in MemberArea

**Problem:** Users can't view their order history.

**Fix Required:**

- Ensure auth token is properly passed to checkout API
- Link guest orders when user creates account (claim functionality)
- Add "My Orders" section to MemberArea component

---

### 3. ❌ Stripe Hosted Checkout Flow Issues

**Current State:** Creates session, returns URL, redirects user off-site.

**Problems:**

- Loss of control over UX
- Harder to customize fields
- Customer leaves your site
- May not return properly

**Fix Required:**

- Implement Stripe Payment Element (embedded)
- Keep redirect as backup option
- Test both flows

---

## Implementation Plan

### Phase 1: Add Embedded Stripe Elements (HIGH PRIORITY)

**File:** `components/CheckoutPage.tsx`

```typescript
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Create stripePromise at module level
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment form component
function PaymentForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  // Handle payment submission with Payment Element
}

// Wrap checkout in Elements provider
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <PaymentForm />
</Elements>;
```

### Phase 2: Fix Order-User Association

**File:** `api/stripe/create-checkout-session.ts`

- Ensure userId is extracted from auth token
- Save to Firestore with proper userId (not "guest" for logged-in users)

**File:** `components/MemberArea.tsx`

- Add "My Orders" tab
- Query Firestore: `orders.where('userId', '==', user.uid)`
- Display order history with status tracking

### Phase 3: Test Complete Flow

1. Guest checkout → Order saves → Email sent → Order visible in database
2. Logged-in checkout → Order linked to account → Appears in "My Orders"
3. Guest creates account → Previous orders claimed (using email match)

---

## Quick Fix Option (Immediate)

If you need the site working ASAP, verify:

1. **Stripe keys are set** in Vercel environment:

   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

2. **Redirect flow works:**

   - User adds to cart
   - Proceeds to checkout
   - Fills form
   - Clicks "Complete Payment"
   - Redirects to Stripe
   - Completes payment
   - Returns to `/order-success`

3. **Webhook processes payment:**
   - Stripe sends `checkout.session.completed`
   - Webhook saves order to Firestore
   - Sends email confirmation

---

## Testing Checklist

- [ ] Add item to cart from PCBuilder
- [ ] View cart modal
- [ ] Proceed to checkout
- [ ] Fill shipping form
- [ ] See payment options (Stripe/PayPal/Bank)
- [ ] **CRITICAL**: See credit card input field (or Stripe redirect)
- [ ] Submit payment
- [ ] Receive confirmation email
- [ ] Order appears in database
- [ ] Logged-in user sees order in "My Orders"

---

## Files to Modify

1. `components/CheckoutPage.tsx` - Add Stripe Elements
2. `components/MemberArea.tsx` - Add order history display
3. `api/stripe/create-checkout-session.ts` - Verify userId handling
4. `App.tsx` - Ensure auth token is passed to checkout

---

## Current Architecture

### Checkout Flow:

```
Cart Items → CheckoutPage → Payment Selection → API Call → Response

Stripe: Create Session → Redirect to Stripe → Complete → Webhook → Save Order
PayPal: Create Order → Redirect to PayPal → Complete → Capture → Save Order
Bank: Create Order → Send Email → Manual Verification
```

### Order Storage:

```
Firestore Collection: "orders"
Document Fields:
- orderNumber (VPC-YYYYMMDD-XXXX)
- orderId (Firestore doc ID)
- userId (from auth token or "guest")
- customerName
- customerEmail
- items[]
- total
- status
- paymentMethod
- shippingAddress
- createdAt
```

### Missing:

- Credit card input form (Stripe Elements)
- Order history in MemberArea
- Guest order claiming

---

## Next Steps

1. Decide: Embedded payment form OR fix redirect flow?
2. Test current redirect flow to see if it works at all
3. Add order history to MemberArea
4. Test end-to-end with real payment (test mode)
