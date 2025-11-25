# 🚀 Clean Deployment Guide

## Step 1: Clean GitHub Repository

### Option A: Delete Everything via GitHub Web Interface

1. Go to https://github.com/vortexpcsltd-afk/vortexpcs.com
2. Click on each file/folder individually
3. Click the trash icon → Commit deletion
4. Repeat until repository is empty

### Option B: Force Push Empty Repository (Recommended)

```bash
# Clone the repository
git clone https://github.com/vortexpcsltd-afk/vortexpcs.com.git
cd vortexpcs.com

# Remove all files (keep .git folder)
rm -rf * .*
git add .
git commit -m "Clean repository for fresh deployment"

# Force push to remove all history
git push origin main --force
```

### Option C: Delete and Recreate Repository

1. Go to repository Settings
2. Scroll to bottom → "Delete this repository"
3. Type repository name to confirm
4. Create new repository with same name

---

## Step 2: Prepare Local Environment

### Install Dependencies

```bash
# Navigate to your project
cd "c:\Users\Gamer\Desktop\Vortex PCs Latest 191025"

# Install all dependencies
npm install

# Create environment file
cp .env.example .env
```

### Edit .env File

Open `.env` and configure:

```env
# Firebase - Get from Firebase Console
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# Stripe - Get from Stripe Dashboard
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
VITE_STRIPE_BACKEND_URL=https://your-backend.vercel.app/api/stripe

# Strapi - Your CMS instance
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=your-token
```

---

## Step 3: Setup Firebase

### Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Project name: `vortex-pcs`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Register Web App

1. Click the web icon `</>`
2. App nickname: `Vortex PCs Website`
3. Copy config values to `.env`

### Enable Authentication

1. Build → Authentication → Get started
2. Sign-in method tab
3. Enable "Email/Password"
4. Enable "Google" (optional)

### Create Firestore Database

1. Build → Firestore Database → Create database
2. Start in production mode
3. Choose location (europe-west2 for UK)

### Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## Step 4: Setup Stripe

### Create Stripe Account

1. Go to https://dashboard.stripe.com/
2. Create account or sign in
3. Complete business verification

### Get API Keys

1. Developers → API keys
2. Copy Publishable key (pk*test*...) to `.env`
3. Copy Secret key (sk*test*...) - keep secure

### Deploy Backend API

Choose one option:

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Create backend directory
mkdir stripe-backend
cd stripe-backend

# Copy backend examples
cp ../backend-examples/* .

# Deploy to Vercel
vercel

# Update VITE_STRIPE_BACKEND_URL in .env with deployed URL
```

#### Option B: Use existing backend

Update `VITE_STRIPE_BACKEND_URL` in `.env` with your backend URL

---

## Step 5: Setup Strapi CMS

### Option A: Strapi Cloud (Recommended)

1. Go to https://cloud.strapi.io/
2. Create account and project
3. Choose region (EU for UK)
4. Note project URL for `.env`

### Option B: Local Strapi

```bash
# Create Strapi project
npx create-strapi-app@latest vortex-cms --quickstart

# Start Strapi
cd vortex-cms
npm run develop
```

### Create Content Types

1. Content-Type Builder
2. Create collection: **Products**
   - Fields: name (text), description (rich text), price (number), category (text), image (media)
3. Create collection: **PC Builds**
   - Fields: name (text), components (JSON), price (number), featured (boolean)

### Create API Token

1. Settings → API Tokens
2. Create new token: `Frontend Read Token`
3. Type: Read-only
4. Copy token to `.env`

### Add Sample Data

1. Content Manager → Products
2. Add some sample PC components
3. Publish content

---

## Step 6: Test Local Integration

### Start Development Server

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Test Firebase Auth

1. Open http://localhost:3000
2. Click "Sign Up"
3. Create test account
4. Verify login works
5. Check Firebase Console for new user

### Test Stripe Payments

1. Add items to cart
2. Proceed to checkout
3. Use test card: 4242 4242 4242 4242
4. Verify payment succeeds

### Test Strapi CMS

1. Navigate to PC Finder
2. Verify products load from Strapi
3. Check browser console for CMS errors

---

## Step 7: Prepare Production Build

### Update Environment for Production

```env
# Update .env for production
NODE_ENV=production
VITE_FIREBASE_PROJECT_ID=your-production-project
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Use live keys
VITE_STRAPI_URL=https://your-production-strapi.com
```

### Build and Test

```bash
# Create production build
npm run build

# Test production build locally
npm run preview

# Verify all features work at http://localhost:4173
```

---

## Step 8: Deploy to GitHub

### Initialize Git (if needed)

```bash
# Initialize git repository
git init

# Add GitHub remote
git remote add origin https://github.com/vortexpcsltd-afk/vortexpcs.com.git
```

### Create .gitignore

```bash
# Create .gitignore
echo "node_modules/
dist/
.env
.env.local
.env.production
*.log
.DS_Store
.vercel" > .gitignore
```

### Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial deployment: Full integration with Firebase, Stripe, Strapi"

# Push to GitHub
git push -u origin main
```

### Configure GitHub Pages (Optional)

If using GitHub Pages:

1. Repository Settings → Pages
2. Source: GitHub Actions
3. Create workflow file for Vite deployment

---

## Step 9: Configure Domain & CDN

### If using custom domain:

1. Add CNAME record pointing to GitHub Pages
2. Update Firebase Auth domains
3. Update Stripe webhook URLs

---

## ✅ Verification Checklist

- [ ] GitHub repository cleaned
- [ ] Firebase project created and configured
- [ ] Authentication working locally
- [ ] Firestore database accessible
- [ ] Stripe account set up
- [ ] Backend API deployed
- [ ] Test payments working
- [ ] Strapi instance running
- [ ] Content loading from CMS
- [ ] Production build successful
- [ ] All environment variables set
- [ ] Code pushed to GitHub
- [ ] Domain configured (if applicable)

---

## 🆘 Troubleshooting

### Firebase Issues

- Check console for auth errors
- Verify environment variables
- Check firestore rules

### Stripe Issues

- Verify backend API is deployed
- Check webhook endpoints
- Test with Stripe test cards

### Strapi Issues

- Check CORS settings
- Verify API token permissions
- Check content is published

---

## 📞 Need Help?

Reference these files:

- `BACKEND_INTEGRATION_GUIDE.md` - Detailed integration steps
- `BACKEND_QUICK_START.md` - 90-minute setup guide
- `COMMANDS.md` - Deployment commands
- `.github/copilot-instructions.md` - AI coding guidelines
