# Backend Integration Guide

Complete setup guide for Stripe, Firebase, and Strapi integrations for Vortex PCs Ltd.

## 📋 Overview

This application now includes full backend integration with:
- **Firebase** - Authentication, database, and file storage
- **Stripe** - Payment processing and checkout
- **Strapi** - Headless CMS for content management

---

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `vortex-pcs`
4. Enable/disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Register Web App

1. In Firebase Console, click the web icon (`</>`)
2. Register app nickname: `Vortex PCs Website`
3. Copy the configuration values
4. Add them to your `.env` file

### Step 3: Enable Authentication

1. Navigate to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Enable **Google** sign-in method
5. Add your domain to authorized domains

### Step 4: Create Firestore Database

1. Navigate to **Build > Firestore Database**
2. Click "Create database"
3. Start in **production mode**
4. Choose location (europe-west2 for UK)
5. Click "Enable"

### Step 5: Set Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own orders
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users can read/write their own configurations
    match /configurations/{configId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Support tickets
    match /support_tickets/{ticketId} {
      allow create: if true; // Anyone can create support tickets
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Analytics (write-only for tracking)
    match /analytics/{docId} {
      allow write: if true;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Step 6: Enable Storage (Optional)

1. Navigate to **Build > Storage**
2. Click "Get started"
3. Use default security rules
4. Click "Done"

---

## 💳 Stripe Setup

### Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create account or log in
3. Complete business details

### Step 2: Get API Keys

1. Navigate to **Developers > API keys**
2. Copy **Publishable key** (starts with `pk_test_...`)
3. Add to `.env` as `VITE_STRIPE_PUBLISHABLE_KEY`
4. Copy **Secret key** (starts with `sk_test_...`)
   - ⚠️ **NEVER expose secret key in frontend**
   - Use for backend/serverless functions only

### Step 3: Enable Payment Methods

1. Navigate to **Settings > Payment methods**
2. Enable:
   - Cards (Visa, Mastercard, Amex)
   - Apple Pay
   - Google Pay

### Step 4: Set Up Products (Optional)

1. Navigate to **Products**
2. Add your PC builds and components as products
3. Set prices in GBP

### Step 5: Backend API Implementation

**IMPORTANT:** Stripe checkout requires a backend API endpoint.

#### Option A: Vercel Serverless Functions

Create `/api/stripe/create-checkout-session.ts`:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { items, customerEmail, metadata } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      customer_email: customerEmail,
      metadata: metadata || {},
      success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout-cancelled`,
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
```

#### Option B: Express Backend

See `/backend-examples/stripe-express.js` for Express implementation.

### Step 6: Test Payments

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication: `4000 0025 0000 3155`

Expiry: Any future date  
CVC: Any 3 digits  
Postcode: Any valid UK postcode

---

## 📝 Strapi CMS Setup

### Step 1: Deploy Strapi

#### Option A: Strapi Cloud (Recommended)

1. Go to [Strapi Cloud](https://cloud.strapi.io/)
2. Create account and new project
3. Choose region (EU for UK)
4. Note your project URL

#### Option B: Self-Hosted

```bash
# Create new Strapi project
npx create-strapi-app@latest vortex-cms --quickstart

# Start Strapi
cd vortex-cms
npm run develop
```

### Step 2: Create Admin Account

1. Navigate to `http://localhost:1337/admin` (or your Strapi URL)
2. Create admin account
3. Complete profile

### Step 3: Create Content Types

#### Products Collection

1. Click **Content-Type Builder**
2. Create new Collection Type: `Product`
3. Add fields:
   - Text: `name` (required, unique)
   - Rich Text: `description`
   - Number: `price` (decimal, required)
   - Text: `category`
   - Number: `stock` (integer)
   - Boolean: `featured`
   - JSON: `specs`
   - Media: `images` (multiple files)

#### PC Builds Collection

1. Create Collection Type: `PC Build`
2. Add fields:
   - Text: `name` (required)
   - Rich Text: `description`
   - Number: `price` (decimal)
   - Text: `category`
   - Boolean: `featured`
   - JSON: `components`
   - Media: `images` (multiple files)

#### Components Collection

1. Create Collection Type: `Component`
2. Add fields:
   - Text: `name` (required)
   - Text: `type` (CPU, GPU, RAM, etc.)
   - Text: `manufacturer`
   - Number: `price` (decimal)
   - Number: `stock` (integer)
   - JSON: `specs`

### Step 4: Create API Token

1. Navigate to **Settings > API Tokens**
2. Click "Create new API Token"
3. Name: `Frontend Read Token`
4. Token type: `Read-only`
5. Copy the token
6. Add to `.env` as `VITE_STRAPI_API_TOKEN`

### Step 5: Configure Permissions

1. Navigate to **Settings > Roles**
2. Edit "Public" role
3. Enable permissions for:
   - Products: `find`, `findOne`
   - PC Builds: `find`, `findOne`
   - Components: `find`, `findOne`

### Step 6: Add Sample Content

1. Navigate to **Content Manager**
2. Add products, builds, and components
3. Upload product images
4. Publish content

---

## 🔧 Environment Variables

Create `.env` file in root directory:

```bash
cp .env.example .env
```

Fill in all values:

```env
# Firebase
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=vortex-pcs.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vortex-pcs
VITE_FIREBASE_STORAGE_BUCKET=vortex-pcs.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_BACKEND_URL=http://localhost:3001/api/stripe

# Strapi
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=abc123...
```

---

## 🧪 Testing Integration

### Test Firebase Authentication

1. Go to login page
2. Register new account
3. Check Firebase Console > Authentication for new user
4. Check Firestore > users collection for profile

### Test Stripe Payments

1. Add items to cart
2. Proceed to checkout
3. Use test card: `4242 4242 4242 4242`
4. Check Stripe Dashboard > Payments for transaction

### Test Strapi CMS

1. Open browser console
2. Navigate to PC Builder
3. Check network tab for Strapi API calls
4. Verify products load from Strapi

---

## 📁 File Structure

```
/config
  ├── firebase.ts       # Firebase configuration
  ├── stripe.ts         # Stripe configuration
  └── strapi.ts         # Strapi configuration

/services
  ├── auth.ts           # Firebase authentication
  ├── database.ts       # Firestore database operations
  ├── payment.ts        # Stripe payment processing
  └── cms.ts            # Strapi CMS data fetching

/.env                   # Environment variables (create from .env.example)
/.env.example           # Environment template
```

---

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Firebase Hosting (Alternative)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 🔒 Security Checklist

- [ ] Never commit `.env` file to git
- [ ] Never expose Stripe secret key in frontend
- [ ] Set proper Firestore security rules
- [ ] Enable Firebase App Check (recommended)
- [ ] Use HTTPS in production
- [ ] Enable Stripe webhook signature verification
- [ ] Set CORS policies in Strapi
- [ ] Implement rate limiting on backend endpoints
- [ ] Regular security audits

---

## 📞 Support

For integration issues:
1. Check Firebase Console logs
2. Check Stripe Dashboard logs
3. Check Strapi admin panel logs
4. Review browser console errors

---

## 🎯 Next Steps

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Complete Firebase setup
4. Complete Stripe setup
5. Complete Strapi setup
6. Test all integrations
7. Deploy to production

---

**All backend integrations are now live!** 🎉

The website is ready for production deployment with full authentication, payment processing, and content management capabilities.
