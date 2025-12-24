# 🚀 CRITICAL DEPLOYMENT CHECKLIST

## Overview

Complete checkout system fixes including inventory management. All 7 critical issues addressed.

---

## ✅ Pre-Deployment Verification

### Build Status

- [x] **Build Completed**: 9.31s, no TypeScript errors
- [x] **Webhook Enhanced**: Inventory management added
- [x] **All Functions Present**: decrementInventoryOnce implemented

### Code Changes Summary

```
api/stripe/webhook.ts:
  - Added decrementInventoryOnce() function (lines ~545-625)
  - Integrated inventory decrement after Firestore order save
  - Metadata-first item extraction (components → cart → line_items)
  - Robust email handling with SMTP verification
  - Error recovery for each step (email, firestore, inventory)
```

---

## 📋 DEPLOYMENT STEPS

### Step 1: Deploy to Vercel

```powershell
# Deploy to production
vercel --prod

# Expected output: Deployment URL + production domain
```

### Step 2: Verify Environment Variables

Ensure Vercel has all required variables:

- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `FIREBASE_SERVICE_ACCOUNT_BASE64`
- ✅ `VITE_SMTP_HOST` (mail.spacemail.com)
- ✅ `VITE_SMTP_PORT` (465)
- ✅ `VITE_SMTP_SECURE` (true)
- ✅ `VITE_SMTP_USER` (info@vortexpcs.com)
- ✅ `VITE_SMTP_PASS`
- ✅ `VITE_SMTP_BUSINESS_EMAIL` (info@vortexpcs.com)

### Step 3: Update Stripe Webhook Endpoint

```
Stripe Dashboard → Developers → Webhooks
  Endpoint URL: https://vortexpcs.com/api/stripe/webhook
  Events: checkout.session.completed
  Status: ENABLED
```

---

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: Complete Checkout Flow

**Account**: testaccount@vortexpcs.com

1. **Add Items to Cart**

   - At least 2 different products
   - At least 1 custom PC build with components

2. **Proceed to Checkout**

   - Verify items displayed correctly
   - Complete payment (use Stripe test card)

3. **Verify Success Page**
   - Order confirmation displays
   - Order number shown
   - Items listed correctly (NOT "Custom PC Build")

### Test 2: Email Verification

**Expected Emails (within 2 minutes)**:

Customer Email (testaccount@vortexpcs.com):

- ✅ Subject: "Order Confirmation - Vortex PCs"
- ✅ Order number present
- ✅ Item names correct (not generic)
- ✅ Total amount matches
- ✅ Customer details included

Business Email (info@vortexpcs.com):

- ✅ Subject: "New Order Received"
- ✅ Order number present
- ✅ Complete item breakdown
- ✅ Customer information

**If NO emails received**:

- Check Vercel function logs for errors
- Verify SMTP credentials in Vercel dashboard
- Check spam folders

### Test 3: Member Area Display

1. Navigate to Member Area
2. Click "Orders" tab
3. **Verify**:
   - ✅ Order appears in list
   - ✅ Items show CORRECT names (not "Custom PC Build")
   - ✅ Total matches checkout amount
   - ✅ Order date/time correct
   - ✅ Status shows "Processing"

**If order NOT visible**:

- Check browser console for errors
- Try "Refresh Orders" button
- Verify userId matches order in Firestore

### Test 4: Inventory Verification

**Firestore Console** (firebase.google.com):

1. Check `inventory` collection:

   - Find product documents for purchased items
   - ✅ `stock` field DECREASED by quantity purchased
   - ✅ `lastSaleAt` timestamp updated
   - ✅ `updatedAt` timestamp current

2. Check `inventory_transactions` collection:
   - Find document with paymentId = order payment_intent
   - ✅ Document exists (proves idempotency working)
   - ✅ `items` array contains all purchased items
   - ✅ `processedAt` timestamp present
   - ✅ `status` = "completed"

**If inventory NOT decremented**:

- Check Vercel function logs for errors
- Verify decrementInventoryOnce was called
- Check for permission errors

### Test 5: Admin Panel Verification

**Admin Panel → Orders**:

- ✅ Order appears in list
- ✅ Customer email correct
- ✅ Items show ACTUAL names (not "Custom PC Build")
- ✅ Components listed for custom builds
- ✅ Total amount correct
- ✅ Order status visible

---

## 🔍 CRITICAL VERIFICATION POINTS

### Issue #1: Item Names

- ❌ **OLD**: "Custom PC Build" in member area
- ✅ **NEW**: Actual component names from metadata.components

### Issue #2: Email Delivery

- ❌ **OLD**: No emails sent
- ✅ **NEW**: Both customer + business emails delivered

### Issue #3: Member Area Display

- ❌ **OLD**: Orders not visible to customer
- ✅ **NEW**: Orders query by userId OR customerEmail

### Issue #4: Inventory Management ⚠️ MOST CRITICAL

- ❌ **OLD**: NO INVENTORY DEDUCTION (overselling)
- ✅ **NEW**: Stock decremented via decrementInventoryOnce()

### Issue #5: User ID Format

- ❌ **OLD**: Inconsistent "guest" vs "guest_sessionId"
- ✅ **NEW**: Standardized format with fallbacks

### Issue #6: Email Extraction

- ❌ **OLD**: Missing customer email in some sessions
- ✅ **NEW**: 3-tier fallback (customer_details → customer_email → metadata)

### Issue #7: Error Recovery

- ❌ **OLD**: Single error fails entire webhook
- ✅ **NEW**: Try-catch per step, webhook succeeds even if email fails

---

## 📊 MONITORING

### Vercel Function Logs

Monitor for first 24 hours:

```
Functions → api/stripe/webhook → Recent Invocations
```

**Watch for**:

- ✅ "Order created in Firestore" (should appear for every order)
- ✅ "Inventory decremented successfully" (confirms stock updates)
- ✅ "Customer email sent" (confirms email delivery)
- ⚠️ "Error sending email" (email failed but webhook succeeded)
- ❌ "Error decrementing inventory" (critical - investigate immediately)

### Firestore Monitoring

**Check daily for first week**:

1. Orders collection growth
2. Inventory stock levels accurate
3. inventory_transactions matches orders count

### Email Deliverability

**Track for first week**:

- Customer email delivery rate
- Business notification delivery rate
- Spam folder incidents

---

## 🚨 ROLLBACK PROCEDURE

If critical issues discovered:

### Immediate Actions

1. **Disable Stripe Webhook** (prevents new orders processing incorrectly)
2. **Revert to Previous Deployment**:
   ```powershell
   vercel rollback
   ```
3. **Check webhook-backup.ts** for last known good state

### Data Recovery

If inventory incorrectly decremented:

1. Check `inventory_transactions` collection for affected orders
2. Calculate correct stock levels
3. Manually update `inventory` collection
4. Document discrepancies in incident report

---

## ✅ SUCCESS CRITERIA

**Deployment considered successful when ALL verified**:

- [ ] Build deployed to vortexpcs.com
- [ ] Test order placed successfully
- [ ] Customer email received with CORRECT item names
- [ ] Business email received
- [ ] Order visible in customer member area with CORRECT details
- [ ] Inventory stock DECREASED correctly
- [ ] inventory_transactions record created
- [ ] Admin panel shows order with CORRECT information
- [ ] No errors in Vercel function logs
- [ ] No permission errors in Firestore

---

## 📞 SUPPORT CONTACTS

**If Issues Arise**:

1. Check Vercel logs first
2. Verify Firestore security rules
3. Review SMTP server status
4. Consult COMPLETE_CHECKOUT_AUDIT.md for detailed issue analysis

**Critical Files**:

- `api/stripe/webhook.ts` - Main webhook handler
- `COMPLETE_CHECKOUT_AUDIT.md` - Issue documentation
- `services/database.ts` - Firestore queries
- `components/MemberArea.tsx` - Customer order display

---

## 🎯 NEXT STEPS AFTER SUCCESSFUL DEPLOYMENT

1. **Monitor for 24 hours** - Watch logs, verify orders processing
2. **Customer Communication** - Inform of improvements if needed
3. **Load Testing** - Consider stress testing checkout flow
4. **Backup Strategy** - Ensure inventory_transactions backed up
5. **Documentation** - Update README with new features

---

**Deployment Date**: **********\_**********
**Deployed By**: **********\_**********
**Verification Completed**: [ ] Yes [ ] No
**Issues Found**: **********\_**********
