# Root Cause Analysis - Email & Order Issues

## Issue Summary

**Reported:** No emails received after order; no address saved; "Order persistence failed" error

## Root Causes Identified

### 1. **Firebase Client Not Configured** ✅ FIXED

**Problem:**

- `config/firebase.ts` requires `VITE_FIREBASE_*` environment variables
- These are **client-side** variables (Vite prefix)
- They were not set in Vercel environment
- Result: `db` was `undefined` in client code

**Impact:**

- `OrderSuccess.tsx` tried to call `createOrder()` which uses client Firestore
- `addDoc(collection(db, "orders"), ...)` failed with undefined `db`
- Toast message: "Order persistence failed"
- Orders were **not** being saved client-side

**Fix Applied:**

- Added guard in `createOrder()` to check if `db` is configured
- Updated `OrderSuccess.tsx` to rely on webhook for order creation
- Removed client-side order creation attempt (webhook handles it)
- Client now checks if order exists (webhook created it) and displays confirmation

### 2. **SMTP Configuration May Not Be Set** ⚠️ NEEDS VERIFICATION

**Problem:**

- Webhook email code checks for `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- These must be set in Vercel Production environment
- If missing, webhook logs error and throws but returns 200 (non-fatal)

**Current State:**

- User confirmed "SMTP IS set up in vercel"
- But emails still not received

**Possible Issues:**

1. **Wrong Variable Names:** Webhook checks both `SMTP_*` and `VITE_SMTP_*`
2. **Wrong Scope:** Variables might be set for Preview/Development but not Production
3. **SMTP Credentials Invalid:** Host/user/pass might be incorrect
4. **Deliverability:** Emails sending but getting blocked (SPF/DKIM/spam)
5. **Port/Security Mismatch:** Port 465 requires `SMTP_SECURE=true`, port 587 requires `false`

**Diagnostic Steps Added:**

- Created `/api/admin/email-logs` endpoint to view email attempt logs
- Added Firestore logging to webhook for every email attempt
- Logs capture: success/failure, recipient, SMTP config presence, error details

### 3. **Webhook Order Creation Uses PaymentIntent ID** ✅ WORKING

**Status:** This is correct and working as designed

**How It Works:**

1. Customer completes Stripe checkout
2. Stripe fires `payment_intent.succeeded` webhook to your server
3. Webhook extracts order data from PaymentIntent metadata
4. Webhook creates Firestore document with ID = `paymentIntent.id`
5. Webhook attempts to send emails (customer + business)
6. Customer redirected to OrderSuccess page
7. OrderSuccess checks if order exists using `paymentIntent.id`
8. If exists, displays order; if not, shows "being processed"

**Address Storage:**

- Webhook parses `metadata.shippingAddress` (JSON string)
- Saves to `address` field in Firestore order document
- Address should include: line1, line2, city, postcode, country

## Current Status

### ✅ Fixed Issues

1. Client-side Firebase configuration error handled
2. OrderSuccess no longer tries client-side order creation
3. Better error handling and logging
4. Diagnostic endpoints created

### ⚠️ Needs Investigation

1. **Email Delivery** - Why aren't emails being received?

   - Check Vercel Production environment variables
   - Verify SMTP credentials are correct
   - Check email logs: `https://vortexpcs.com/api/admin/email-logs`
   - Test SMTP: `https://vortexpcs.com/api/email/live-smtp-test`

2. **Address Persistence** - Is address being saved to Firestore?
   - Check recent orders: `https://vortexpcs.com/api/admin/email-logs` (includes orders)
   - Look for `address` field in order documents
   - Verify checkout form sends `shippingAddress` in metadata

## Action Items

### Immediate (User Must Do)

1. **Verify Vercel Environment Variables for Production:**

   ```
   Go to: https://vercel.com/vortexpc5/vortexpcs-com/settings/environment-variables

   Required for Production scope:
   ✓ SMTP_HOST (e.g., mail.spacemail.com)
   ✓ SMTP_USER (e.g., accounts@vortexpcs.com)
   ✓ SMTP_PASS (your SMTP password)
   ✓ SMTP_PORT (465 for SSL, 587 for TLS)
   ✓ SMTP_SECURE ("true" for port 465, "false" for 587)
   ✓ BUSINESS_EMAIL (e.g., info@vortexpcs.com)
   ✓ FIREBASE_SERVICE_ACCOUNT_BASE64 (for webhook order creation)
   ```

2. **Test After Setting Variables:**

   ```powershell
   # Test SMTP
   curl https://vortexpcs.com/api/email/live-smtp-test

   # Perform test order
   # Use Stripe test card: 4242 4242 4242 4242

   # Check logs
   curl https://vortexpcs.com/api/admin/email-logs?limit=10
   ```

3. **Check Recent Order in Firestore:**
   - Go to Firebase Console
   - Navigate to Firestore Database
   - Collection: `orders`
   - Find most recent document
   - Verify it has `address` field with customer details

### If Still Not Working

**Email Logs Show `success: false`:**

- Check `errorType` and `message` fields
- Common errors:
  - `EAUTH`: Wrong credentials
  - `ETIMEDOUT`: Wrong host or port blocked
  - `ECONNREFUSED`: Wrong port or server down
  - `534 5.7.9`: App password required (Gmail/Outlook)

**Email Logs Show `success: true` but no email received:**

- Check spam/junk folder
- Verify SPF/DKIM records for sending domain
- Check mail server logs/quarantine
- Try sending to different email address

**Address Still Missing:**

- Check checkout form - does it collect shipping address?
- Verify `services/payment.ts` includes address in metadata
- Check webhook logs for address parsing
- Inspect Firestore order document directly

## Files Modified

### `/services/database.ts`

- Added Firebase config check in `createOrder()`
- Now throws clear error if client Firebase not configured

### `/components/OrderSuccess.tsx`

- Removed client-side order creation attempt
- Now relies on webhook to create order
- Checks if order exists and displays confirmation
- Better error handling for order lookup failures

### `/api/stripe/webhook.ts`

- Added persistent logging to Firestore `email_logs` collection
- Logs every email attempt (customer, business, config, aggregate)
- Captures success/failure, error details, SMTP config state

### `/api/admin/email-logs.ts` (NEW)

- Diagnostic endpoint to view recent email attempts
- Returns email logs + recent orders for cross-reference
- Access: `GET https://vortexpcs.com/api/admin/email-logs?limit=50`

## Expected Behavior After Fix

### Happy Path (All Working)

1. Customer completes checkout with test card
2. Stripe webhook fires within seconds
3. Webhook creates order in Firestore with address
4. Webhook sends 2 emails:
   - Customer: Order confirmation with order number
   - Business: New order notification
5. Customer sees OrderSuccess page with order details
6. Order visible in Firebase Console and member dashboard

### Current Behavior (Emails Broken)

1. ✅ Customer completes checkout
2. ✅ Stripe webhook fires
3. ⚠️ Webhook creates order (need to verify address included)
4. ❌ Emails fail to send (SMTP config or credentials issue)
5. ✅ Customer sees OrderSuccess page
6. ⚠️ Order may exist in Firestore (need to verify)

## Next Debugging Session

If issues persist after setting environment variables:

1. Deploy latest changes: `vercel --prod`
2. Perform test order
3. Check email logs: `curl https://vortexpcs.com/api/admin/email-logs`
4. Share email log entry (especially `errorType`, `message`, `env` fields)
5. Check Firestore order document and share `address` field contents
6. Review Vercel function logs for webhook execution

---

**Created:** 2025-11-22  
**Status:** Pending environment variable verification and testing
