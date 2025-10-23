# 🚀 Configure Vercel Environment Variables for Strapi

## Current Setup Status:

✅ Local Strapi running on: http://localhost:1338
✅ API Token: 5477f8f25008fb9702b8052028b14842910b97dc8889824f283a78746868447adbc8aebb4b62ca44befc8a24dbad92b7728b345ebe77541a029dcb36d8e337f79109e597c940c7711bb170dd75aa1ca57e667de60a21967f424ef895044e69154fe87fb7887d9fc1c94bd11af68231cf1807ad7247f96c7f637c1d2fc2be267c
✅ Hero content created: "PERFORMANCE THAT DOESN'T WAIT"

## 🎯 Quick Production Setup (Option 1: ngrok - 5 minutes)

### Step 1: Install ngrok

- Download from: https://ngrok.com/download
- Extract to a folder and add to PATH
- Or install with chocolatey: `choco install ngrok`

### Step 2: Expose your local Strapi

```bash
# Make sure Strapi is running
cd vortex-cms
npm run develop

# In a new terminal:
ngrok http 1338
```

### Step 3: Configure Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Find your project: **vortexpcs**
3. Go to: **Settings** > **Environment Variables**
4. Add these variables:

| Name                    | Value                                                                                                                                                                                                                                                              | Environment |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `VITE_STRAPI_URL`       | `https://your-ngrok-url.ngrok.io`                                                                                                                                                                                                                                  | Production  |
| `VITE_STRAPI_API_TOKEN` | `5477f8f25008fb9702b8052028b14842910b97dc8889824f283a78746868447adbc8aebb4b62ca44befc8a24dbad92b7728b345ebe77541a029dcb36d8e337f79109e597c940c7711bb170dd75aa1ca57e667de60a21967f424ef895044e69154fe87fb7887d9fc1c94bd11af68231cf1807ad7247f96c7f637c1d2fc2be267c` | Production  |

### Step 4: Redeploy

- Vercel automatically redeploys when you add environment variables
- Or manually trigger: **Deployments** > **Redeploy**

---

## 🌟 Permanent Deployment (Option 2: Railway - Free)

### Step 1: Sign up at Railway

- Go to: https://railway.app
- Sign up with GitHub

### Step 2: Deploy your Strapi

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to your Strapi
cd vortex-cms

# Deploy to Railway
railway up
```

### Step 3: Configure Railway Environment Variables

In Railway dashboard, add these environment variables:

- `DATABASE_URL` (Railway provides PostgreSQL automatically)
- `JWT_SECRET` (generate: `openssl rand -base64 32`)
- `API_TOKEN_SALT` (generate: `openssl rand -base64 32`)
- `ADMIN_JWT_SECRET` (generate: `openssl rand -base64 32`)
- `APP_KEYS` (generate 4 comma-separated keys)

### Step 4: Get Railway URL and Update Vercel

1. Copy your Railway app URL (e.g., `https://your-app.railway.app`)
2. Create new API token in Strapi admin
3. Update Vercel environment variables with Railway URL and new token

---

## 🔍 Testing Your Setup

After configuring environment variables:

1. Check Vercel deployment logs: https://vercel.com/dashboard
2. Open your production site: https://vortexpcs-3mlutfg6y-vortexpc5.vercel.app/
3. Open browser console (F12) to see Strapi debugging logs
4. Look for: "✅ Strapi page content loaded" and "🎉 Hero title from Strapi: PERFORMANCE THAT DOESN'T WAIT"

---

## 💡 Quick Start Recommendation

**Start with ngrok** for immediate testing, then move to Railway for permanent deployment.

The ngrok approach takes 5 minutes and lets you verify everything works before committing to a permanent deployment platform.
