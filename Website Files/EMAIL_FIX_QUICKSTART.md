# ⚡ EMAIL FIX - QUICKSTART GUIDE

## The Problem

Zero emails sent because `VITE_*` prefixed environment variables don't work in serverless functions.

## The Solution (5 minutes)

### 1. Go to Vercel Dashboard

https://vercel.com/vortexpc5/vortexpcs

### 2. Navigate to Environment Variables

Project Settings → Environment Variables

### 3. Add These 6 Variables

**IMPORTANT:** Select "Production" environment for each!

```
Variable: SMTP_HOST
Value: [Your SMTP server, e.g., mail.spacemail.com]
Environment: ✅ Production

Variable: SMTP_USER
Value: [Your SMTP username, e.g., accounts@vortexpcs.com]
Environment: ✅ Production

Variable: SMTP_PASS
Value: [Your SMTP password]
Environment: ✅ Production

Variable: SMTP_PORT
Value: 465
Environment: ✅ Production

Variable: SMTP_SECURE
Value: true
Environment: ✅ Production

Variable: BUSINESS_EMAIL
Value: info@vortexpcs.com
Environment: ✅ Production
```

### 4. Redeploy

```powershell
cd "C:\Users\Gamer\Desktop\VortexPCs.com\Website Files"
vercel --prod --yes
```

### 5. Test

Place test order → Check https://vortexpcs.com/api/admin/email-logs

Expected: `totalLogs: 3` (config + customer + business)

---

## Why This Fixes It

**Before:**

```
Webhook checks: process.env.VITE_SMTP_HOST
Result: undefined (VITE_* not accessible in serverless)
Fallback: process.env.SMTP_HOST
Result: undefined (not set)
Action: THROW ERROR → No emails
```

**After:**

```
Webhook checks: process.env.VITE_SMTP_HOST
Result: undefined
Fallback: process.env.SMTP_HOST
Result: "mail.spacemail.com" ✅
Action: SEND EMAILS ✅
```

---

## Verification Checklist

- [ ] Variables added to Vercel (without VITE\_ prefix)
- [ ] Environment set to "Production"
- [ ] Redeployed with `vercel --prod`
- [ ] Test order placed
- [ ] Email logs show attempts
- [ ] Customer received email
- [ ] Admin received email

---

## If It Still Doesn't Work

Check email logs for specific error:

```
https://vortexpcs.com/api/admin/email-logs?limit=5
```

Common issues:

- **"SMTP verification failed"** → Wrong credentials or host
- **"Accepted array empty"** → Provider rate limiting
- **"Connection timeout"** → Wrong port or firewall blocking

---

**TL;DR:** Copy your existing `VITE_SMTP_*` values into new variables without the `VITE_` prefix, then redeploy.
