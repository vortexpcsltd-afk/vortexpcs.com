# 🚀 Spaceship Email - Quick Start

## Step 1: Your Email Provider ✅

**You're using Spaceship Email (spacemail.com)** - already confirmed!

## Step 2: Get SMTP Settings for Spaceship

### Spaceship Email SMTP Settings:

```
Host: mail.spacemail.com
Port: 465
User: info@vortexpcs.com
Pass: [Your Spaceship email password]
```

**Where to find your password:**

1. Log in to Spaceship: https://www.spaceship.com/
2. Go to **Email** section
3. Click on your email account `info@vortexpcs.com`
4. Your password is what you set when creating the email account
5. If you forgot it, you can reset it from the Spaceship dashboard

## Step 3: Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Click your project → **Settings** → **Environment Variables**
3. Add these **exact values**:

```
Name: VITE_SMTP_HOST
Value: mail.spacemail.com

Name: VITE_SMTP_PORT
Value: 465

Name: VITE_SMTP_SECURE
Value: true

Name: VITE_SMTP_USER
Value: info@vortexpcs.com

Name: VITE_SMTP_PASS
Value: [your Spaceship email password]

Name: VITE_BUSINESS_EMAIL
Value: info@vortexpcs.com
```

4. Click **Save** after each

## Step 4: Deploy

```bash
git add .
git commit -m "Add email configuration"
git push
```

Vercel will automatically redeploy.

## Step 5: Test

1. Go to your live website's contact page
2. Fill out and submit the form
3. Check your email inbox (and spam folder)

## ⚠️ Important Notes

**For Spaceship Email:**

1. Use your regular Spaceship email password (no app password needed)
2. If you don't remember it, reset it at: https://www.spaceship.com/
3. The SMTP host is `mail.spacemail.com` (Spaceship's SMTP server)
4. Port 465 with SSL encryption

## 🆘 Troubleshooting

**Emails not sending?**

- ✅ Verify SMTP host is exactly: `mail.spacemail.com`
- ✅ Verify port is: `465`
- ✅ Verify SMTP_SECURE is: `true` (uses SSL encryption)
- ✅ Check your Spaceship email password is correct
- ✅ Make sure you saved ALL 6 environment variables in Vercel
- ✅ Check Vercel → Deployments → Functions → Look for errors
- ✅ Check spam folder

**Alternative Spaceship SMTP ports if 465 doesn't work:**

- Port 587 (requires `VITE_SMTP_SECURE=false` for STARTTLS)
- Port 25 (not recommended, often blocked)

**Still stuck?**

- Check Vercel function logs for specific error messages
- Log in to Spaceship dashboard to verify email account is active
- Test SMTP settings at: https://www.smtper.net/

## ✅ You're Done!

Once working, your contact form will:

- Send you email notifications
- Send customers auto-reply emails
- All emails branded with Vortex PCs
