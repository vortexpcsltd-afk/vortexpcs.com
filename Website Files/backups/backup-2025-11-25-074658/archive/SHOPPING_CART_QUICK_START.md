# 🚀 Shopping Cart System - Quick Setup Guide

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

Create `.env` in the project root:

```env
# REQUIRED - Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# REQUIRED - Email
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_BUSINESS_EMAIL=orders@vortexpcs.com

# REQUIRED - Firebase
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64_encoded_service_account>
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id

# OPTIONAL - PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox

# Base URL
VITE_BASE_URL=https://www.vortexpcs.com
```

### Step 3: Test the System

```bash
# Test email configuration
npm run test-email

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Step 4: Test Checkout Flow

1. Add items to cart
2. Click "Proceed to Checkout"
3. Fill in shipping information
4. Select payment method
5. Use Stripe test card: `4242 4242 4242 4242`
6. Check your email for confirmation

---

## 🎯 Common Setup Tasks

### Getting Firebase Service Account Base64

**Windows PowerShell:**

```powershell
$json = Get-Content "serviceAccountKey.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
[Convert]::ToBase64String($bytes)
```

**Linux/Mac:**

```bash
base64 -w 0 serviceAccountKey.json
```

### Gmail App Password Setup

1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" → Generate
4. Use the 16-character password in `.env`

### Stripe Webhook Setup

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/stripe/webhook`
4. Events: `checkout.session.completed`, `payment_intent.succeeded`
5. Copy signing secret to `.env`

---

## ✅ Deployment Checklist

### Before Deploying to Production

- [ ] All environment variables set in Vercel
- [ ] Changed Stripe keys from test to live mode
- [ ] Updated `VITE_BASE_URL` to production domain
- [ ] Tested all payment methods
- [ ] Configured Stripe webhook for production
- [ ] Set up real SMTP credentials (not Gmail test)
- [ ] Tested email delivery
- [ ] Firestore rules configured correctly
- [ ] PayPal changed from sandbox to live (if using)

### Deploy Command

```bash
npm run build
vercel --prod
```

---

## 🧪 Testing Checklist

### Frontend Tests

- [ ] Cart adds items correctly
- [ ] Cart persists after page reload
- [ ] Quantity updates work
- [ ] Item removal works
- [ ] Checkout form validation works
- [ ] All payment methods are selectable
- [ ] Mobile layout is responsive

### Backend Tests

- [ ] Stripe checkout session creates successfully
- [ ] Stripe webhook receives events
- [ ] PayPal order creation works
- [ ] Bank transfer order creation works
- [ ] Emails send to customer
- [ ] Emails send to admin
- [ ] Orders save to Firestore
- [ ] Order status updates after payment

### Edge Cases

- [ ] Guest checkout works
- [ ] Authenticated user checkout works
- [ ] Empty cart prevents checkout
- [ ] Invalid email shows error
- [ ] Invalid postcode shows error
- [ ] Payment failure handles gracefully
- [ ] Network errors display friendly messages

---

## 🐛 Quick Fixes

### "Email not sending"

```bash
# Test SMTP connection
npm run test-email

# Check credentials
echo $VITE_SMTP_USER
echo $VITE_SMTP_PASS
```

### "Stripe webhook failing"

```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# View webhook logs
# Go to Stripe Dashboard → Developers → Webhooks → View logs
```

### "Orders not saving to Firebase"

```bash
# Verify Firebase config
echo $FIREBASE_SERVICE_ACCOUNT_BASE64

# Check Firestore rules allow writes
```

---

## 📊 Monitoring

### View Orders in Firebase Console

1. Go to https://console.firebase.google.com/
2. Select your project
3. Navigate to Firestore Database
4. View `orders` collection

### View Stripe Payments

1. Go to https://dashboard.stripe.com/payments
2. Filter by date, status, amount
3. View webhook delivery logs

### Check Email Delivery

1. Check inbox for confirmation emails
2. Check spam folder if not received
3. View Vercel function logs for errors

---

## 🎨 Customization

### Change Email Branding

Edit `services/email.ts` to modify:

- Logo URL
- Colors
- Company information
- Email copy

### Modify Checkout Form Fields

Edit `components/CheckoutPage.tsx` to:

- Add/remove form fields
- Change validation rules
- Adjust layout

### Add New Payment Method

1. Create new API endpoint in `/api/`
2. Add payment option in `CheckoutPage.tsx`
3. Update `ShoppingCartModal.tsx` if needed

---

## 💡 Tips

- Use Stripe test mode during development
- Test with small amounts first
- Keep webhook logs for debugging
- Monitor email delivery rates
- Set up Sentry for error tracking
- Use TypeScript for type safety
- Test on mobile devices

---

## 📞 Need Help?

**Quick Links:**

- [Full Documentation](./SHOPPING_CART_DOCUMENTATION.md)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Firebase Setup Guide](https://firebase.google.com/docs/admin/setup)
- [Nodemailer Docs](https://nodemailer.com/about/)

**Status:** ✅ System Ready for Production
