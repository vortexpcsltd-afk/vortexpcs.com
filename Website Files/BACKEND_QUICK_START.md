# 🚀 Backend Integration - Quick Start

## 30-Second Summary

Your Vortex PCs website now has **Stripe**, **Firebase**, and **Strapi** integrated. Follow these steps to activate:

---

## ⚡ Quick Setup (90 minutes total)

### Step 1: Install Dependencies (2 min)
```bash
npm install
cp .env.example .env
```

### Step 2: Firebase Setup (15 min)
1. Go to https://console.firebase.google.com/
2. Create project: "vortex-pcs"
3. Add web app, copy config to `.env`
4. Enable Authentication (Email + Google)
5. Create Firestore database
6. Deploy security rules from `firestore.rules`

### Step 3: Stripe Setup (10 min)
1. Go to https://dashboard.stripe.com/
2. Get API keys: Developers → API keys
3. Copy Publishable key to `.env`
4. Use test mode keys (`pk_test_...`)

### Step 4: Strapi Setup (20 min)

**Quick Option - Strapi Cloud:**
1. Go to https://cloud.strapi.io/
2. Create new project
3. Copy URL and API token to `.env`

**Or Local Development:**
```bash
npx create-strapi-app@latest vortex-cms --quickstart
cd vortex-cms
npm run develop
```

### Step 5: Configure Strapi (15 min)
1. Create admin account at `http://localhost:1337/admin`
2. Create "Product" content type with fields: name, price, description, category, stock, images
3. Create "PC Build" content type with same fields + components (JSON)
4. Settings → API Tokens → Create new token (Read-only)
5. Settings → Roles → Public → Enable `find` and `findOne`
6. Add sample products

### Step 6: Test Everything (10 min)
```bash
npm run dev
```
- Register account → Check Firebase Console
- Add to cart → Test Stripe checkout with `4242 4242 4242 4242`
- Browse products → Verify Strapi API calls

### Step 7: Deploy Backend (20 min)
Create `/api/stripe/create-checkout-session.ts`:
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req, res) {
  const { items, customerEmail } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    customer_email: customerEmail,
    success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/checkout-cancelled`,
  });
  
  res.json({ sessionId: session.id, url: session.url });
}
```

Deploy to Vercel/Netlify and add `STRIPE_SECRET_KEY` to environment variables.

---

## 📋 Environment Variables Checklist

Copy these to your `.env` file:

```env
# Firebase (from console.firebase.google.com)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Stripe (from dashboard.stripe.com)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_BACKEND_URL=http://localhost:3001/api/stripe

# Strapi (your Strapi URL)
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=
```

---

## 🧪 Test Cards (Stripe)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | Requires authentication |

**Expiry:** Any future date  
**CVC:** Any 3 digits  
**Postcode:** Any valid UK postcode

---

## 🔥 Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Firebase deployment
firebase deploy
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/config/firebase.ts` | Firebase configuration |
| `/config/stripe.ts` | Stripe configuration |
| `/config/strapi.ts` | Strapi API client |
| `/services/auth.ts` | Authentication functions |
| `/services/payment.ts` | Payment processing |
| `/services/cms.ts` | Content management |
| `/services/database.ts` | Database operations |
| `/contexts/AuthContext.tsx` | Global auth state |
| `firestore.rules` | Database security |
| `.env` | Environment variables |

---

## 🎯 Usage Examples

### Register User
```typescript
import { registerUser } from './services/auth';
await registerUser('user@example.com', 'password123', 'John Doe');
```

### Login User
```typescript
import { loginUser, loginWithGoogle } from './services/auth';
await loginUser('user@example.com', 'password123');
// Or
await loginWithGoogle();
```

### Checkout
```typescript
import { redirectToCheckout } from './services/payment';
await redirectToCheckout(cartItems, 'customer@example.com');
```

### Fetch Products
```typescript
import { fetchProducts } from './services/cms';
const products = await fetchProducts({ featured: true });
```

### Create Order
```typescript
import { createOrder } from './services/database';
await createOrder({ userId, items, total, status: 'pending', ... });
```

---

## ✅ Verification Checklist

Before going live:

- [ ] Firebase project created and configured
- [ ] Authentication enabled (Email + Google)
- [ ] Firestore database created with security rules
- [ ] Stripe account created with API keys
- [ ] Stripe backend API deployed
- [ ] Strapi instance deployed and accessible
- [ ] Products added to Strapi
- [ ] API tokens configured
- [ ] All environment variables set
- [ ] Test user registration works
- [ ] Test login works
- [ ] Test Stripe checkout works (test mode)
- [ ] Products load from Strapi
- [ ] Orders save to Firebase
- [ ] Admin panel accessible

---

## 🆘 Common Issues

### "Firebase configuration not found"
→ Add all `VITE_FIREBASE_*` variables to `.env`

### "Stripe checkout failed"
→ Deploy backend API (see Step 7)

### "CORS error from Strapi"
→ Add your domain to Strapi CORS settings

### "Module not found: firebase"
→ Run `npm install`

---

## 📚 Full Documentation

- **[BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)** - Complete setup
- **[README_BACKEND.md](./README_BACKEND.md)** - Full documentation
- **[/backend-examples/](./backend-examples/)** - Code examples

---

## 🎉 You're Ready!

Once setup is complete, your website will have:
- ✅ User authentication
- ✅ Payment processing
- ✅ Order management
- ✅ Product catalog
- ✅ Admin dashboard
- ✅ Real-time updates

**Total active time: ~90 minutes**  
**Waiting time: ~0 minutes (all services instant)**

Need help? Check the detailed guides above!
