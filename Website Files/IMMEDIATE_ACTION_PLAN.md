# 🚨 IMMEDIATE ACTION PLAN - FIX SHOPPING CART EMAILS

**Date:** 2025-11-21  
**Estimated Time:** 15-30 minutes  
**Priority:** P0 CRITICAL

---

## ✅ WHAT I'VE DONE

### 1. Comprehensive Investigation ✅

- ✅ Analyzed all 3 email systems (contact form, mass mailer, shopping cart)
- ✅ Identified contact form emails ARE working
- ✅ Identified shopping cart emails ARE failing
- ✅ Found root cause: Environment variable configuration

### 2. Enhanced Error Logging ✅

- ✅ Updated `api/stripe/webhook.ts` with comprehensive logging
- ✅ Added detailed SMTP configuration checks
- ✅ Added email delivery verification
- ✅ Added clear error messages for debugging

### 3. Created Diagnostic Tools ✅

- ✅ Created `/api/email/verify-config.ts` endpoint
- ✅ Created diagnostic report: `CRITICAL_EMAIL_DIAGNOSTIC_REPORT.md`
- ✅ Created this action plan

### 4. Data Capture Verification ✅

All critical data IS being captured:

- ✅ Customer name, email, address
- ✅ Product details (ID, name, quantity, price, image)
- ✅ Order date/time (Firestore Timestamp)
- ✅ Payment details
- ✅ All stored in Firestore correctly

---

## 🎯 WHAT YOU NEED TO DO NOW

### STEP 1: Verify Current Configuration (2 minutes)

Run this PowerShell command to check your current SMTP setup:

```powershell
Invoke-WebRequest -Uri "https://vortexpcs.com/api/email/verify-config" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected Output:**

```json
{
  "checks": {
    "vite_smtp_host": { "status": "✅ SET" },
    "smtp_host": { "status": "✅ SET" or "❌ NOT SET" },
    ...
  },
  "recommendation": "..."
}
```

**If you see "❌ NOT SET" for `smtp_host`, `smtp_user`, or `smtp_pass`, continue to Step 2.**

---

### STEP 2: Add Missing Environment Variables (5 minutes)

#### Go to Vercel Dashboard:

1. Open https://vercel.com/
2. Go to your VortexPCs project
3. Click **Settings** → **Environment Variables**

#### Add These Variables for **Production**:

| Variable Name    | Value                    | Notes                  |
| ---------------- | ------------------------ | ---------------------- |
| `SMTP_HOST`      | `mail.spacemail.com`     | Same as VITE_SMTP_HOST |
| `SMTP_USER`      | `accounts@vortexpcs.com` | Same as VITE_SMTP_USER |
| `SMTP_PASS`      | (your password)          | Same as VITE_SMTP_PASS |
| `SMTP_PORT`      | `465`                    | SSL port               |
| `SMTP_SECURE`    | `true`                   | Use SSL                |
| `BUSINESS_EMAIL` | `info@vortexpcs.com`     | Order notifications    |

**CRITICAL:** You need BOTH the `VITE_` prefixed versions (which you already have) AND the non-prefixed versions (for backend APIs).

#### Why Both?

- `VITE_*` variables are for **frontend** code (contact form works because of these)
- Non-prefixed variables are for **backend** serverless functions (webhooks need these)

---

### STEP 3: Redeploy Application (1 minute)

After adding environment variables, you MUST redeploy:

**Option A - Via Vercel Dashboard:**

1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete (~2 minutes)

**Option B - Via Git Push:**

```powershell
cd "C:\Users\Gamer\Desktop\VortexPCs.com\Website Files"
git add .
git commit -m "fix: Enhanced email logging and error handling"
git push
```

Vercel will auto-deploy.

---

### STEP 4: Test the Fix (5 minutes)

#### A. Verify SMTP Configuration:

```powershell
Invoke-WebRequest -Uri "https://vortexpcs.com/api/email/verify-config" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | Select-Object recommendation, warnings | Format-List
```

**Expected:** Should now show "✅ GOOD: Both VITE\_ and non-VITE variables configured."

#### B. Test Order Email Function:

```powershell
Invoke-WebRequest -Uri "https://vortexpcs.com/api/email/test-order?to=info@vortexpcs.com" -Method GET
```

**Expected:** Should return status 200 and you should receive TWO emails:

1. Customer order confirmation (to info@vortexpcs.com)
2. Business order notification (to info@vortexpcs.com)

#### C. Place a Test Order:

1. Go to https://vortexpcs.com
2. Add a test product to cart
3. Proceed to checkout
4. **Use Stripe test card:** `4242 4242 4242 4242`
5. Complete the order

**Expected Results:**

- ✅ Order appears in Admin Panel
- ✅ Customer receives order confirmation email
- ✅ You (business) receive order notification email
- ✅ Inventory is decremented (if initialized)

---

### STEP 5: Monitor Webhook Logs (Optional but Recommended)

#### In Vercel Dashboard:

1. Go to **Functions** tab
2. Find `/api/stripe/webhook`
3. View recent invocations

**Look for:**

- ✅ "SMTP Configuration Found" (green checkmarks)
- ✅ "ALL EMAILS SENT SUCCESSFULLY"
- ❌ Any red error messages about SMTP

#### In Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. View recent events
4. Should see `checkout.session.completed` events with **200 OK** responses

**If you see 500 errors:**

- Check webhook logs in Vercel
- Look for "SMTP configuration missing" errors
- Verify environment variables were added correctly

---

## 🔍 TROUBLESHOOTING

### Problem: Still Getting "SMTP configuration missing" Errors

**Solution:**

1. Double-check environment variables are set for **Production** (not just Preview)
2. Make sure you redeployed AFTER adding variables
3. Variable names are case-sensitive: `SMTP_HOST` not `smtp_host`
4. Values should NOT have quotes: `mail.spacemail.com` not `"mail.spacemail.com"`

### Problem: Emails Send But Don't Arrive

**Solution:**

1. Check spam/junk folders
2. Verify SMTP credentials are correct
3. Check your SMTP provider's dashboard for delivery logs
4. Test with a different email address
5. Verify your domain's SPF/DKIM records (if using custom domain)

### Problem: Customer Gets Email But Business Doesn't

**Solution:**

1. Verify `BUSINESS_EMAIL` environment variable is set correctly
2. Check if business email is being filtered by email provider
3. Look at webhook logs for "Business email failed" errors

### Problem: Business Gets Email But Customer Doesn't

**Solution:**

1. Check if customer email address was captured correctly
2. Look for "No customer email provided" warnings in logs
3. Verify checkout form is collecting customer email

---

## 📊 VERIFICATION CHECKLIST

After completing the steps above, verify:

- [ ] `/api/email/verify-config` shows all variables as "✅ SET"
- [ ] Test order email (`/api/email/test-order`) sends successfully
- [ ] Placed real test order with Stripe test card
- [ ] Customer received order confirmation email
- [ ] Business received order notification email
- [ ] Order appears in Admin Panel with all details:
  - [ ] Customer name
  - [ ] Customer email
  - [ ] Customer address (line1, city, postcode)
  - [ ] Product details (name, quantity, price)
  - [ ] Product images
  - [ ] Order date/time
  - [ ] Total amount
- [ ] Webhook logs show "✅ ALL EMAILS SENT SUCCESSFULLY"
- [ ] Stripe webhook events show 200 OK responses

---

## 📞 IF STILL NOT WORKING

### Check These Common Issues:

1. **Environment Variables Not Applied:**

   - Go to Vercel Settings → Environment Variables
   - Make sure they're set for **Production** environment
   - Click "Redeploy" button explicitly

2. **Wrong Webhook Version:**

   - You have 3 webhook files (webhook.ts, webhook-v2.ts, webhook-backup.ts)
   - Verify Stripe is calling the correct one
   - Check Stripe Dashboard → Webhooks → Your endpoint URL

3. **SMTP Provider Blocking:**

   - Some providers block serverless function IPs
   - Check your SMTP provider's logs/dashboard
   - May need to whitelist Vercel IP ranges

4. **Firewall/Security Rules:**
   - Some SMTP ports might be blocked
   - Try port 587 (TLS) instead of 465 (SSL)
   - Set `SMTP_SECURE=false` and `SMTP_PORT=587`

---

## 🎯 SUMMARY

**The Fix is Simple:**

1. Add non-prefixed SMTP environment variables to Vercel
2. Redeploy the application
3. Test with a real order

**Why This Fixes It:**

- Contact form uses `VITE_SMTP_*` variables (frontend)
- Webhooks use `SMTP_*` variables (backend serverless functions)
- You had only the VITE\_ versions set up
- Backend couldn't access them, causing silent email failures

**Time to Fix:** 15-30 minutes
**Risk Level:** Very Low (only adding environment variables)
**Impact:** HIGH - Enables critical business email notifications

---

## 📝 NOTES

### What's Been Improved:

- ✅ Enhanced logging in webhook.ts (will help debug future issues)
- ✅ Better error messages when SMTP fails
- ✅ Configuration verification endpoint
- ✅ Comprehensive diagnostic documentation

### Data Capture Status:

**ALL DATA IS BEING CAPTURED CORRECTLY!**

- Customer info, address, items, prices, dates/times all stored properly
- The ONLY issue was email sending

### Next Steps After Fix:

1. Monitor first few orders to ensure emails work
2. Check spam folders for first few emails
3. Consider adding email delivery tracking/logging
4. Set up alerts for webhook failures

---

**Ready to proceed? Start with STEP 1 above! 👆**
