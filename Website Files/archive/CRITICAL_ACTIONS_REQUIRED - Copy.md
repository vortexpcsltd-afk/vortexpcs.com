# 🚨 CRITICAL ACTIONS REQUIRED - IMMEDIATE ATTENTION

## ⚠️ SECURITY ALERT: Exposed Credentials

Your `.env` file containing production secrets has been committed to the repository. This poses a **CRITICAL SECURITY RISK**.

---

## STEP 1: Rotate ALL Credentials (DO THIS FIRST)

### Firebase Admin Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Download the JSON file
5. Convert to base64: `cat serviceAccount.json | base64`
6. Update environment variables on Vercel

### Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Click "⋯" on your live secret key
3. Select "Roll key"
4. Update both `STRIPE_SECRET_KEY` and webhook secret
5. Update environment variables on Vercel

### SMTP Credentials

1. Log into your email provider (mail.spacemail.com)
2. Change password for info@vortexpcs.com
3. Update `VITE_SMTP_PASS` on Vercel

### PayPal Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. My Apps & Credentials
3. Delete old app, create new one
4. Get new Client ID and Secret
5. Update environment variables on Vercel

### GetAddress.io API Key

1. Log into [GetAddress.io](https://getaddress.io/)
2. Regenerate API key
3. Update `VITE_GETADDRESS_IO_API_KEY` on Vercel

---

## STEP 2: Remove .env from Git History

```bash
# WARNING: This rewrites git history - coordinate with your team!

# 1. Backup your repository first
git clone https://github.com/vortexpcsltd-afk/vortexpcs.com vortexpcs-backup

# 2. Navigate to your main repository
cd "C:\Users\Gamer\Desktop\VortexPCs.com\Website Files"

# 3. Remove .env from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Force garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push to remote (this is destructive!)
git push origin --force --all
git push origin --force --tags

# 6. Notify all team members to delete and re-clone
```

**Alternative (if the above doesn't work in PowerShell):**

```powershell
# Use BFG Repo-Cleaner (easier method)
# 1. Download from https://reps.io/bfg
# 2. Run:
java -jar bfg.jar --delete-files .env

# 3. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push
git push origin --force --all
```

---

## STEP 3: Verify .gitignore

Ensure your `.gitignore` contains:

```gitignore
# Environment variables
.env
.env.local
.env.development
.env.production
.env.*.local

# Sensitive files
*.pem
*.key
service-account*.json
```

Check it's working:

```bash
git status
# Should NOT show .env
```

---

## STEP 4: Update Vercel Environment Variables

1. Go to https://vercel.com/vortexpcs/vortexpcs-com/settings/environment-variables
2. Delete ALL existing variables
3. Add new ones with rotated credentials:

```
# Firebase
FIREBASE_ADMIN_CREDENTIALS=<new service account JSON>
FIREBASE_SERVICE_ACCOUNT_BASE64=<new base64 encoded>
VITE_FIREBASE_API_KEY=<same as before>
VITE_FIREBASE_AUTH_DOMAIN=vortexpcs.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vortexpcs
VITE_FIREBASE_STORAGE_BUCKET=vortexpcs.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=262114131859
VITE_FIREBASE_APP_ID=1:262114131859:web:0d0dc8201ae05290def266

# Stripe (NEW KEYS)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP (NEW PASSWORD)
VITE_SMTP_HOST=mail.spacemail.com
VITE_SMTP_PORT=465
VITE_SMTP_SECURE=true
VITE_SMTP_USER=info@vortexpcs.com
VITE_SMTP_PASS=<NEW PASSWORD>

# PayPal (NEW CREDENTIALS)
VITE_PAYPAL_CLIENT_ID=<NEW CLIENT ID>
VITE_PAYPAL_ENVIRONMENT=live
VITE_PAYPAL_BACKEND_URL=https://www.vortexpcs.com/api/paypal

# Other
VITE_CONTENTFUL_SPACE_ID=a40jvx2pmnlr
VITE_CONTENTFUL_ACCESS_TOKEN=<verify this is delivery API token, not management>
VITE_GETADDRESS_IO_API_KEY=<NEW KEY>
VITE_APP_URL=https://vortexpcs.com
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

4. Redeploy:

```bash
vercel --prod
```

---

## STEP 5: Monitor for Suspicious Activity

### Stripe Dashboard

- Check for unauthorized transactions
- Review API logs for unusual activity
- Set up fraud alerts

### Firebase Console

- Review Authentication logs
- Check Firestore audit logs
- Monitor for unusual read/write patterns

### Email

- Check sent mail for unauthorized sends
- Review SMTP logs

### Set up Alerts

```javascript
// Add to your monitoring system
const alerts = {
  stripe: "Check for refunds/chargebacks",
  firebase: "Unusual auth attempts",
  smtp: "High volume sends",
};
```

---

## STEP 6: Implement Rate Limiting (High Priority)

Add this to your API endpoints:

```bash
# Install rate limiting
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// api/_middleware.ts (create this)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const config = {
  matcher: "/api/:path*",
};

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "1 m"),
});

export default async function middleware(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too many requests", {
      status: 429,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  }

  return NextResponse.next();
}
```

---

## STEP 7: Enable 2FA on All Services

1. **GitHub** - Settings → Password and authentication → Enable 2FA
2. **Vercel** - Account Settings → Security → Enable 2FA
3. **Firebase** - Enable Google Account 2FA
4. **Stripe** - Team Settings → Enable 2FA for all team members
5. **PayPal** - Security → Enable 2FA

---

## Timeline for Actions

| Action                          | Priority    | Deadline       |
| ------------------------------- | ----------- | -------------- |
| Rotate credentials              | 🔴 CRITICAL | Within 1 hour  |
| Remove .env from git            | 🔴 CRITICAL | Within 2 hours |
| Update Vercel env vars          | 🔴 CRITICAL | Within 2 hours |
| Monitor for suspicious activity | 🟡 HIGH     | Next 24 hours  |
| Implement rate limiting         | 🟡 HIGH     | Within 1 week  |
| Enable 2FA                      | 🟡 HIGH     | Within 1 week  |

---

## Verification Checklist

- [ ] All credentials rotated
- [ ] .env removed from git history
- [ ] .gitignore verified
- [ ] Vercel environment variables updated
- [ ] Production deployment successful
- [ ] Test checkout flow works
- [ ] Test authentication works
- [ ] Test email sending works
- [ ] Monitoring alerts configured
- [ ] Team notified of changes
- [ ] 2FA enabled on all services
- [ ] Rate limiting implemented

---

## Need Help?

If you encounter issues:

1. **Git history cleanup fails:** Consider creating a new repository and migrating code
2. **Vercel deployment fails:** Check build logs, verify environment variables
3. **Tests fail after rotation:** Verify all API keys are correct format
4. **Email not working:** Check SMTP settings, test with mail client first

---

## After Completing These Steps

Once all critical actions are complete:

1. Review the full [FORENSIC_AUDIT_REPORT.md](./FORENSIC_AUDIT_REPORT.md)
2. Plan implementation of medium/low priority recommendations
3. Set up automated security scanning (GitHub Dependabot, Snyk)
4. Schedule regular security audits (quarterly)

---

## Status Tracking

**Started:** ********\_********  
**Credentials Rotated:** ********\_********  
**Git Cleaned:** ********\_********  
**Deployment Verified:** ********\_********  
**Completed:** ********\_********

**Person Responsible:** ********\_********  
**Verified By:** ********\_********

---

**This is a critical security incident. Treat it with the highest priority.**
