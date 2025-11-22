# Shopping Cart System - Testing & Verification Guide

## ✅ Implementation Status

### COMPLETED:

1. ✅ **Embedded Stripe Payment Form** - Card input directly on checkout page
2. ✅ **No Redirects** - Payment happens on your site using Stripe Elements
3. ✅ **Payment Intent API** - Creates payment with full order metadata
4. ✅ **Webhook Integration** - Saves orders to Firestore with userId
5. ✅ **Email Notifications** - Sends confirmation to customer & business

### Files Implemented:

- ✅ `components/StripePaymentForm.tsx` - Embedded payment form
- ✅ `components/CheckoutPage.tsx` - Shows card input (no redirect)
- ✅ `api/stripe/create-payment-intent.ts` - Creates Payment Intent with metadata
- ✅ `api/stripe/webhook.ts` - Handles payment success, saves orders

---

## 🧪 Testing Checklist

### Phase 1: Verify UI Components

#### Test 1: Cart Functionality

- [ ] Add item to cart from PCBuilder
- [ ] Click shopping cart icon in header
- [ ] Cart modal opens showing items
- [ ] Can update quantities (+/- buttons work)
- [ ] Can remove items (trash icon)
- [ ] Subtotal calculates correctly
- [ ] "Proceed to Checkout" button visible

#### Test 2: Checkout Form

- [ ] Click "Proceed to Checkout" from cart
- [ ] Navigates to `/checkout` page
- [ ] Shipping form is visible with all fields:
  - Full Name
  - Email
  - Phone
  - Address Line 1
  - Address Line 2 (optional)
  - City
  - County (optional)
  - Postcode
  - Country (read-only: United Kingdom)
- [ ] Form validation works (try submitting empty)
- [ ] Error messages show for invalid fields

#### Test 3: Payment Method Selection

- [ ] Three payment options visible:
  - Credit/Debit Card (Stripe) - Recommended
  - PayPal
  - Bank Transfer
- [ ] Can select each payment method
- [ ] Selected method has blue border/background
- [ ] "Continue to Payment" button visible

---

### Phase 2: Test Stripe Embedded Payment

#### Test 4: Initialize Stripe Payment

1. Fill out shipping form completely
2. Select "Credit/Debit Card" payment method
3. Click **"Continue to Payment - £XXX"**

**Expected Results:**

- [ ] Button shows "Processing..." spinner
- [ ] API call to `/api/stripe/create-payment-intent`
- [ ] Toast notification: "Ready to process payment"
- [ ] **CRITICAL:** Card input form appears below payment methods
- [ ] Form has Stripe Payment Element with dark theme
- [ ] "Pay £XXX" button appears at bottom of card form

**If card form doesn't appear:**

- Check browser console for errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Check Network tab for API response

#### Test 5: Enter Card Details

Use Stripe Test Cards:

**Success Card:**

```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
```

**Decline Card:**

```
Card Number: 4000 0000 0000 0002
Expiry: 12/34
CVC: 123
```

**3D Secure (requires authentication):**

```
Card Number: 4000 0025 0000 3155
Expiry: 12/34
CVC: 123
```

**Steps:**

1. Enter card details in embedded form
2. Form should validate as you type
3. Click **"Pay £XXX"** button

**Expected Results:**

- [ ] Button shows "Processing Payment..." spinner
- [ ] Card form submits to Stripe
- [ ] Payment processes (test card succeeds)
- [ ] Toast: "Payment successful! Your order is confirmed."
- [ ] Cart clears from localStorage
- [ ] Navigates to `/order-success` page

---

### Phase 3: Verify Backend Processing

#### Test 6: Check Firestore Order

1. Open Firebase Console → Firestore Database
2. Go to `orders` collection
3. Find your test order (sort by `createdAt` desc)

**Verify Order Document Contains:**

- [ ] `orderNumber`: VPC-YYYYMMDD-XXXX format
- [ ] `orderId`: Same as document ID (Payment Intent ID)
- [ ] `stripePaymentIntentId`: Matches payment
- [ ] `userId`: Your Firebase UID (or "guest")
- [ ] `customerName`: Your name from form
- [ ] `customerEmail`: Your email from form
- [ ] `customerPhone`: Your phone from form
- [ ] `items`: Array of cart items with details
- [ ] `total`: Correct amount
- [ ] `status`: "pending"
- [ ] `address`: Shipping address object
- [ ] `createdAt`: Timestamp
- [ ] `orderDate`: Timestamp

#### Test 7: Check Email Notifications

1. Check customer email inbox
2. Check business email (`BUSINESS_EMAIL` or `info@vortexpcs.com`)

**Customer Email Should Contain:**

- [ ] Subject: "Order Confirmation - VPC-YYYYMMDD-XXXX"
- [ ] Order number prominently displayed
- [ ] List of items ordered
- [ ] Quantities and prices
- [ ] Total amount paid
- [ ] Shipping address
- [ ] "What's Next?" section

**Business Email Should Contain:**

- [ ] Subject: "New Order: VPC-YYYYMMDD-XXXX - £XXX.XX"
- [ ] Customer information (name, email)
- [ ] Order details (items, quantities, prices)
- [ ] Shipping address
- [ ] Total amount

**If emails not received:**

- Check Vercel logs for SMTP errors
- Verify environment variables:
  - `SMTP_HOST`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_PORT`
  - `BUSINESS_EMAIL`
- Check spam/junk folders

---

### Phase 4: Test User Account Integration

#### Test 8: Guest Checkout

1. Logout (if logged in)
2. Add items to cart
3. Complete checkout as guest
4. Verify order saved with `userId: "guest"`

#### Test 9: Logged-in Checkout

1. Login to your account
2. Add items to cart
3. Complete checkout
4. Verify order saved with your actual `userId` (Firebase UID)

#### Test 10: View Order History (requires MemberArea implementation)

1. Login to account
2. Navigate to Member Area
3. Look for "My Orders" section
4. Verify your orders appear

**If not implemented yet:**

- Orders should still be in Firestore
- Can query manually: `orders.where('userId', '==', userUid)`

---

### Phase 5: Test Edge Cases

#### Test 11: Form Validation

- [ ] Try submitting with empty fields → Shows errors
- [ ] Invalid email format → Shows error
- [ ] Invalid UK postcode → Shows error
- [ ] Invalid phone number → Shows error

#### Test 12: Payment Errors

Use decline test card: `4000 0000 0000 0002`

- [ ] Payment fails gracefully
- [ ] Error message displayed
- [ ] Can retry payment
- [ ] Cart not cleared
- [ ] No order created in Firestore

#### Test 13: Network Interruption

- [ ] Open DevTools → Network tab
- [ ] Start checkout process
- [ ] Go offline before payment completes
- [ ] Verify error handling

#### Test 14: Multiple Items

- [ ] Add 3+ different items to cart
- [ ] Different quantities
- [ ] Verify subtotal calculation
- [ ] Complete checkout
- [ ] Verify all items in Firestore order

---

## 🔍 Troubleshooting

### Problem: Card form doesn't appear

**Solution:**

1. Check browser console for errors
2. Verify `VITE_STRIPE_PUBLISHABLE_KEY` in `.env`
3. Check Network tab → `/api/stripe/create-payment-intent` response
4. Ensure response includes `clientSecret`
5. Check `stripePromise` loaded correctly

**Debug Commands:**

```javascript
// In browser console:
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

### Problem: Payment Intent creation fails

**Solution:**

1. Check Vercel logs for API errors
2. Verify `STRIPE_SECRET_KEY` environment variable
3. Check auth token being sent (if logged in)
4. Verify cart items data structure

### Problem: Orders not saving to Firestore

**Solution:**

1. Check webhook receiving events (Stripe Dashboard → Webhooks)
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Check Vercel logs for webhook errors
4. Ensure `FIREBASE_SERVICE_ACCOUNT_BASE64` is set
5. Check Firebase security rules allow writes to `orders`

### Problem: Emails not sending

**Solution:**

1. Check Vercel logs for SMTP errors
2. Verify all SMTP environment variables
3. Test SMTP credentials independently
4. Check email server logs (if accessible)
5. Ensure `BUSINESS_EMAIL` is set correctly

---

## 📊 Success Criteria

### System is Working Correctly When:

✅ **UI Level:**

- Cart modal displays items
- Checkout form validates properly
- Card input form appears after "Continue to Payment"
- Payment processes without redirect

✅ **Backend Level:**

- Payment Intent created successfully
- Webhook receives `payment_intent.succeeded` event
- Order saved to Firestore with all data
- Inventory decremented (if implemented)

✅ **User Experience:**

- Customer receives confirmation email
- Business receives notification email
- Order visible in Firestore
- Cart cleared after successful payment
- User redirected to success page

✅ **Data Integrity:**

- Order has correct userId (not "guest" for logged-in users)
- All cart items saved to order
- Shipping address captured correctly
- Total amount matches cart total
- Order number in VPC-YYYYMMDD-XXXX format

---

## 🚀 Production Deployment Checklist

Before going live with real payments:

- [ ] Switch from test mode to live mode in Stripe
- [ ] Update `VITE_STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
- [ ] Update `STRIPE_SECRET_KEY` to `sk_live_...`
- [ ] Update `STRIPE_WEBHOOK_SECRET` to live webhook secret
- [ ] Configure webhook endpoint in Stripe Dashboard:
  - URL: `https://yourdomain.com/api/stripe/webhook`
  - Events: `payment_intent.succeeded`, `checkout.session.completed`
- [ ] Test with real card in test mode first
- [ ] Verify email delivery with real addresses
- [ ] Check Firestore security rules for production
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up monitoring/alerting for failed payments

---

## 📝 Known Limitations

1. **MemberArea Order History** - Not yet implemented

   - Orders save correctly to Firestore
   - Need to add "My Orders" tab to display them

2. **Guest Order Claiming** - Not yet implemented

   - Guest orders save with `userId: "guest"`
   - Need mechanism to update userId when guest creates account

3. **PayPal Integration** - Separate from Stripe

   - Still uses redirect flow
   - Works independently

4. **Bank Transfer** - Manual process
   - Creates order in Firestore
   - Requires manual payment verification

---

## 🎯 Next Development Steps

### Priority 1: Add Order History to MemberArea

```typescript
// In MemberArea.tsx
const [orders, setOrders] = useState([]);

useEffect(() => {
  if (user) {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(orderList);
    });

    return unsubscribe;
  }
}, [user]);
```

### Priority 2: Guest Order Claiming

```typescript
// When user creates account
const claimGuestOrders = async (email: string, userId: string) => {
  const q = query(
    collection(db, "orders"),
    where("customerEmail", "==", email),
    where("userId", "==", "guest")
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { userId });
  });

  await batch.commit();
};
```

### Priority 3: Order Status Updates

Add admin interface to update order status:

- pending → processing → quality_check → shipped → delivered

---

## 📞 Support

If issues persist:

1. Check all environment variables in Vercel
2. Review Vercel function logs
3. Check Stripe Dashboard for payment details
4. Review Firebase Console for data
5. Test with different browsers
6. Clear browser cache and localStorage
