# 🚀 Contact Form - Quick Fix Reference

## ✅ What Was Fixed

Four critical issues were identified and corrected:

1. **Wrong SMTP Host**: Changed from `mail.spacemail.com` → `mail.privateemail.com`
2. **Wrong Port/Security**: Changed from `465/SSL` → `587/STARTTLS`
3. **Unquoted Password**: Added quotes around password with special chars
4. **Corrupted API Key**: Removed literal `\r\n` characters

---

## ⚡ Correct Settings (COPY THESE)

```bash
VITE_SMTP_HOST=mail.privateemail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=info@vortexpcs.com
VITE_SMTP_PASS="b6v27Us5y!L0wJghiinbsv"
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

---

## 🎯 What You Need to Do Now

### Step 1: Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Click your project → **Settings** → **Environment Variables**
3. Update these 4 variables:

| Variable           | Change to                        | Why                           |
| ------------------ | -------------------------------- | ----------------------------- |
| `VITE_SMTP_HOST`   | `mail.privateemail.com`          | Correct Spaceship SMTP server |
| `VITE_SMTP_PORT`   | `587`                            | Recommended port for STARTTLS |
| `VITE_SMTP_SECURE` | `false`                          | Use STARTTLS not SSL          |
| `VITE_SMTP_PASS`   | Keep quotes if has special chars | Prevent shell parsing issues  |

### Step 2: Redeploy

Option A - Push a commit:

```bash
git add .
git commit -m "Fix contact form SMTP configuration"
git push
```

Option B - Manual redeploy in Vercel:

- Go to **Deployments** → Click **"..."** → **Redeploy**

### Step 3: Test

1. Wait for deployment to complete
2. Visit your website's contact page
3. Submit a test message
4. Check:
   - ✅ Success message appears on website
   - ✅ You receive email at info@vortexpcs.com
   - ✅ Customer receives auto-reply

---

## 🔍 How to Check Logs if Issues Persist

1. Vercel Dashboard → Your Project
2. Click latest deployment
3. Go to **Functions** tab
4. Look for `/api/contact/send` entries
5. Click to see error details

---

## 📚 More Details

See `CONTACT_FORM_FIX_REPORT.md` for full forensic investigation report.

---

**Status:** ✅ Local files fixed  
**Next:** Update Vercel env vars and redeploy
