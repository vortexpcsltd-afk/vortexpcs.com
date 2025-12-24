# VortexPCs.com Shopping Cart System - Complete Documentation

## 📦 System Overview

This is a **production-ready, full-stack shopping cart and checkout system** built for VortexPCs.com. The system includes:

- ✅ Complete frontend checkout flow with React/TypeScript
- ✅ Backend REST APIs with Node.js/Vercel serverless functions
- ✅ Firebase Firestore database for order storage
- ✅ Stripe, PayPal, and Bank Transfer payment integrations
- ✅ Professional HTML email notifications (customer + admin)
- ✅ Cart persistence across sessions
- ✅ Unique order ID generation
- ✅ Input validation and error handling
- ✅ Mobile-responsive design with glassmorphism UI

---

## 🏗️ Architecture

### Frontend Components

```
components/
├── CheckoutPage.tsx         # Main checkout component with form validation
├── ShoppingCartModal.tsx    # Cart sidebar with quantity management
└── OrderSuccess.tsx         # Post-purchase confirmation page
```

### Backend APIs

```
api/
├── stripe/
│   ├── create-checkout-session.ts   # Stripe payment initialization
│   └── webhook.ts                   # Stripe webhook for payment confirmation
├── paypal/
│   ├── create-order.ts              # PayPal order creation
│   └── capture-order.ts             # PayPal order capture
└── orders/
    └── bank-transfer.ts             # Bank transfer order creation
```

### Services

```
services/
├── email.ts          # Nodemailer email service with HTML templates
├── payment.ts        # Payment processing utilities
└── database.ts       # Firebase Firestore operations
```

---

## 🚀 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd "Website Files"

# Install dependencies
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

#### **Firebase Configuration**

```env
# Firebase Admin SDK (for backend)
FIREBASE_SERVICE_ACCOUNT_BASE64=<your_base64_encoded_service_account_json>

# Firebase Client SDK (for frontend)
VITE_FIREBASE_API_KEY=<your_firebase_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<your_project_id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your_project_id>
VITE_FIREBASE_STORAGE_BUCKET=<your_project_id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
VITE_FIREBASE_APP_ID=<your_app_id>
```

#### **Stripe Configuration**

```env
# Stripe Secret Key (backend)
STRIPE_SECRET_KEY=sk_live_... or sk_test_...

# Stripe Publishable Key (frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...

# Stripe Webhook Secret (for webhook signature verification)
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL for success/cancel redirects
VITE_BASE_URL=https://www.vortexpcs.com
```

#### **PayPal Configuration**

```env
# PayPal Client ID and Secret
PAYPAL_CLIENT_ID=<your_paypal_client_id>
PAYPAL_CLIENT_SECRET=<your_paypal_client_secret>

# PayPal Mode (sandbox or live)
PAYPAL_MODE=live
```

#### **Email Configuration (Nodemailer)**

```env
# SMTP Server Configuration
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=<your_app_password>

# Business Email (receives admin notifications)
VITE_BUSINESS_EMAIL=orders@vortexpcs.com
BUSINESS_EMAIL=orders@vortexpcs.com
```

### 3. Firebase Setup

#### Create Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Settings → Service Accounts
3. Click "Generate New Private Key"
4. Download the JSON file
5. Convert to base64:

   ```bash
   # Windows PowerShell
   $bytes = [System.IO.File]::ReadAllBytes("path\to\serviceAccountKey.json")
   [Convert]::ToBase64String($bytes)

   # Linux/Mac
   base64 -w 0 serviceAccountKey.json
   ```

6. Add the output to `FIREBASE_SERVICE_ACCOUNT_BASE64`

#### Firestore Database Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      // Allow authenticated users to read their own orders
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;

      // Allow guest checkout orders to be read by anyone (for order confirmation)
      allow read: if resource.data.userId == "guest";

      // Only allow backend to write orders
      allow write: if false;
    }
  }
}
```

### 4. Stripe Webhook Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → Developers → Webhooks
2. Click "Add endpoint"
3. Set URL to: `https://www.vortexpcs.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Gmail SMTP Setup (for emails)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Select "Mail" and your device
   - Copy the generated password to `VITE_SMTP_PASS`

---

## 🧪 Testing

### Test Email Configuration

```bash
npm run test-email
```

### Test Stripe Integration

Use Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### Test PayPal Integration

Use PayPal Sandbox accounts from your [PayPal Developer Dashboard](https://developer.paypal.com/).

---

## 💳 Payment Method Details

### 1. Stripe (Credit/Debit Cards)

- **Flow**: Redirect to Stripe Checkout → Payment → Webhook confirms → Email sent
- **Supported Cards**: Visa, Mastercard, Amex
- **Fees**: 1.4% + 20p per transaction (UK cards)
- **Settlement**: 2-7 business days

### 2. PayPal

- **Flow**: Redirect to PayPal → Login → Approve → Capture order → Email sent
- **Supported**: PayPal balance, linked bank accounts, cards
- **Fees**: 2.9% + £0.30 per transaction (UK)
- **Settlement**: Instant to PayPal balance

### 3. Bank Transfer

- **Flow**: Order created → Email with bank details → Manual verification → Fulfillment
- **Status**: `pending_payment` until admin confirms
- **Manual Step**: Admin must update order status after verifying bank payment

---

## 📧 Email Templates

### Customer Confirmation Email

- **Subject**: `Order Confirmation - Order #VPC-20231215-1234`
- **Content**:
  - Order number and date
  - Itemized product list
  - Total amount paid
  - Shipping address
  - What happens next
  - Contact information

### Admin Notification Email

- **Subject**: `NEW ORDER RECEIVED - £1,299.99 - John Smith`
- **Content**:
  - High-priority alert styling
  - Full order details
  - Customer contact info
  - Action required checklist
  - Direct order management link

---

## 🔒 Security Features

- ✅ Stripe signature verification on webhooks
- ✅ Firebase Admin SDK for secure backend operations
- ✅ Input validation and sanitization
- ✅ HTTPS-only in production
- ✅ Environment variables for secrets
- ✅ CORS headers properly configured
- ✅ No sensitive data in client-side code

---

## 🗂️ Database Schema

### Orders Collection (`/orders/{orderId}`)

```typescript
{
  orderNumber: string;           // "VPC-20231215-1234"
  userId: string;                // Firebase UID or "guest"
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  amount: number;                // Total in GBP
  currency: string;              // "GBP"
  status: string;                // "pending_payment" | "paid" | "processing" | "shipped" | "completed"
  paymentMethod: string;         // "stripe" | "paypal" | "bank_transfer"
  paymentStatus: string;         // "pending" | "paid" | "failed"
  items: Array<{
    productId: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
  };
  stripeSessionId?: string;      // Stripe checkout session ID
  stripePaymentIntent?: string;  // Stripe payment intent ID
  paypalOrderId?: string;        // PayPal order ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
  notes?: string;
}
```

---

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
npm run build
vercel --prod
```

### Environment Variables on Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env`
3. Mark sensitive variables as "Encrypted"

### Post-Deployment Checklist

- ✅ Test all payment methods (Stripe, PayPal, Bank Transfer)
- ✅ Verify emails are being sent
- ✅ Check Stripe webhook is receiving events
- ✅ Test guest checkout
- ✅ Test authenticated checkout
- ✅ Verify orders are saving to Firestore
- ✅ Test mobile responsiveness

---

## 📱 Frontend Features

### Cart Functionality

- Add/remove items
- Update quantities
- View cart total
- Persistent across sessions (localStorage)
- Cart count badge in header

### Checkout Page

- Responsive multi-step form
- Real-time validation
- Payment method selection
- Shipping address with UK postcode validation
- Order summary sidebar
- Mobile-optimized layout
- Loading states and error handling

### Post-Purchase

- Order success page
- Order number displayed
- Email confirmation message
- Link to view order in member area

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm test

# Test email system
npm run test-email
```

---

## 🐛 Troubleshooting

### Emails Not Sending

1. Check SMTP credentials are correct
2. Verify Gmail App Password (not regular password)
3. Check Vercel logs for email errors
4. Test with `npm run test-email`

### Stripe Webhook Not Working

1. Verify webhook endpoint URL is correct
2. Check webhook signing secret matches
3. View webhook logs in Stripe Dashboard
4. Ensure Vercel function is not timing out

### Orders Not Saving

1. Check Firebase Admin is initialized
2. Verify service account JSON is valid
3. Check Firestore rules allow writes
4. View Vercel function logs for errors

### PayPal Integration Issues

1. Ensure using correct client ID/secret for environment
2. Check `PAYPAL_MODE` matches (sandbox vs live)
3. Verify return URLs are whitelisted in PayPal dashboard

---

## 📞 Support

For questions or issues:

- **Email**: dev@vortexpcs.com
- **Documentation**: This file
- **Stripe Docs**: https://stripe.com/docs
- **PayPal Docs**: https://developer.paypal.com/docs
- **Firebase Docs**: https://firebase.google.com/docs

---

## 📄 License

Proprietary - Vortex PCs Ltd © 2024

---

**System Status**: ✅ Production Ready
**Last Updated**: November 2024
**Version**: 1.0.0
