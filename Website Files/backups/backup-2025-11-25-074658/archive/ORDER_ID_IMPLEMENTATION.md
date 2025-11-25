# Order ID Format Improvement

## What Changed

Replaced ugly Stripe session IDs with professional, human-readable order numbers.

### Before

```
Order #pi_3SUtKuAr3xxGtGwy0mBLFHoZ
Order #cs_live_a1AabGKB9Q07OsNCLWANGPTlKvviF...
```

### After

```
Order #VPC-20251118-A3F9
Order #VPC-20251118-K7M2
Order #VPC-20251119-P5Q8
```

## Format Specification

**Pattern:** `VPC-YYYYMMDD-XXXX`

- **VPC**: Brand prefix (Vortex PCs)
- **YYYYMMDD**: Date (e.g., 20251118 = Nov 18, 2025)
- **XXXX**: Random 4-character code using safe alphanumeric chars

### Character Set

Uses `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (33 chars)

- Excludes confusing characters: O/0, I/1
- Provides 33^4 = 1,185,921 unique codes per day

## Implementation Details

### File: `api/stripe/webhook.ts`

**Added Function (lines 273-290):**

```typescript
function generateOrderId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Generate random 4-character alphanumeric code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `VPC-${year}${month}${day}-${code}`;
}
```

**Updated Webhook Handler (line 653):**

```typescript
// Generate readable order ID
const orderId = generateOrderId();
console.log("📝 Generated Order ID:", orderId);
```

**Updated Firestore Storage (line 709-712):**

```typescript
const orderRef = db.collection("orders").doc(orderId);
await orderRef.set({
  orderId: orderId, // Human-readable ID
  stripeSessionId: session.id, // Keep Stripe ID for reference
  // ... rest of order data
});
```

## Data Structure Changes

### Firestore `orders` Collection

Each order document now has:

- **Document ID**: Human-readable order ID (e.g., `VPC-20251118-A3F9`)
- **orderId**: Same human-readable ID (displayed to customers)
- **stripeSessionId**: Original Stripe session ID (for payment tracking)
- **paymentId**: Also stores Stripe session ID (for idempotency)

### Benefits

1. **Customer-Facing**: Professional appearance in emails and Member Area
2. **Date Sortable**: YYYYMMDD format allows chronological sorting
3. **Brand Recognition**: "VPC" prefix reinforces Vortex PCs branding
4. **Collision Resistant**: 1.18M+ unique codes per day
5. **Support Friendly**: Easy to read over phone (no confusing chars)
6. **Maintains Traceability**: Original Stripe ID preserved as `stripeSessionId`

## Impact Areas

### ✅ Already Updated

- Webhook order creation
- Email notifications (customer + business)
- Firestore document structure
- Console logging

### 📋 No Changes Needed

- **Member Area**: Displays `orderId` field (automatically shows new format)
- **Admin Panel**: Displays `orderId` field (automatically shows new format)
- **Order queries**: Use document ID (works with new format)

## Testing Checklist

- [ ] Place test order via Stripe Checkout
- [ ] Verify order ID format in confirmation email: `VPC-YYYYMMDD-XXXX`
- [ ] Check order appears in Member Area with readable ID
- [ ] Confirm Admin Panel shows same readable ID
- [ ] Verify Firestore document has both `orderId` and `stripeSessionId`
- [ ] Test inventory decrement still works (uses `orderId` for transactions)

## Migration Notes

**Existing Orders**: Previous orders with Stripe IDs as document IDs will continue to work. New orders will use the improved format. No migration needed.

**Lookup**: Orders can still be looked up by Stripe session ID using the `stripeSessionId` field if needed for support queries.

## Deployment

```bash
npm run build
# Deploy to Vercel
```

Changes are backward compatible - no data migration required.
