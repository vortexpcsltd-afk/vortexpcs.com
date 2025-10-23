# Quick Production Setup Commands

# 1. Install ngrok (if not already installed)

# Download from: https://ngrok.com/download

# Or with chocolatey: choco install ngrok

# 2. Start your local Strapi (in vortex-cms directory)

cd vortex-cms
npm run develop

# 3. In a new terminal, expose Strapi with ngrok

ngrok http 1338

# 4. Copy the https URL from ngrok (e.g., https://abc123.ngrok.io)

# 5. Add environment variables to Vercel:

# Go to: https://vercel.com/dashboard

# Select your project: vortexpcs

# Settings > Environment Variables > Add:

# VITE_STRAPI_URL = https://your-ngrok-url.ngrok.io

# VITE_STRAPI_API_TOKEN = 5477f8f25008fb9702b8052028b14842910b97dc8889824f283a78746868447adbc8aebb4b62ca44befc8a24dbad92b7728b345ebe77541a029dcb36d8e337f79109e597c940c7711bb170dd75aa1ca57e667de60a21967f424ef895044e69154fe87fb7887d9fc1c94bd11af68231cf1807ad7247f96c7f637c1d2fc2be267c

# 6. Redeploy Vercel (automatic when you add env vars)

# ALTERNATIVE: For permanent deployment, use Railway.app

# 1. Sign up at https://railway.app

# 2. npm install -g @railway/cli

# 3. railway login

# 4. cd vortex-cms && railway up

# 5. Configure environment variables in Railway dashboard

# 6. Update Vercel with the Railway URL
