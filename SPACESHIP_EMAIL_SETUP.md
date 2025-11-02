# Spaceship Email Setup Guide

## 🚀 Quick Setup for Vortex PCs Email System

### Step 1: Get Your Spaceship SMTP Credentials

**Important**: Spaceship is primarily a domain registrar. For email hosting, you may be using one of their partners or a third-party service.

1. **Log in to Spaceship**: Go to [spaceship.com](https://spaceship.com) and sign in
2. **Check your email setup**:
   - Look for "Email" or "Mail" in your dashboard
   - Check if you have email hosting enabled
   - Note which email provider you're using (Google Workspace, Zoho, etc.)
3. **Find your SMTP settings**:
   - If using **Google Workspace**: Use `smtp.gmail.com`
   - If using **Zoho Mail**: Use `smtp.zoho.com`
   - If using **another provider**: Check their SMTP documentation
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your full email address
   - **Password**: Your email account password or app password

### Step 2: Configure Environment Variables

Update your `.env` file with the correct SMTP settings for your email provider:

```bash
# Example for Google Workspace
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=info@vortexpcs.com
VITE_SMTP_PASS=your-app-password
VITE_BUSINESS_EMAIL=info@vortexpcs.com

# Example for Zoho Mail
# VITE_SMTP_HOST=smtp.zoho.com
# VITE_SMTP_PORT=587
# VITE_SMTP_SECURE=false
# VITE_SMTP_USER=info@vortexpcs.com
# VITE_SMTP_PASS=your-zoho-password
# VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

### Step 3: Test Your Configuration

Run the test script to verify everything works:

```bash
node test-email.js
```

You should see: `✅ Email service is properly configured!`

### Step 4: Deploy and Test

```bash
npm run build
npm run preview
```

Test the contact form at: `http://localhost:4173/contact`

## 📧 What This Enables

Once configured, your Vortex PCs website will:

- ✅ **Send contact form emails** to your inbox
- ✅ **Send auto-replies** to customers who contact you
- ✅ **Send order confirmations** when customers complete purchases
- ✅ **Send urgent notifications** to you when orders are placed

## 🔧 Troubleshooting

### If emails aren't sending:

1. **Check your credentials** - Make sure they're copied exactly from Spaceship
2. **Verify SMTP settings** - Double-check the server and port
3. **Test the configuration** - Run `node test-email.js`
4. **Check your Spaceship account** - Ensure email is properly set up

### Common Issues:

- **Port 587 vs 465**: Try port 465 if 587 doesn't work, and set `VITE_SMTP_SECURE=true`
- **Password**: Make sure you're using your Spaceship email password, not your account password
- **Domain**: Ensure your domain is properly configured in Spaceship

## 📞 Need Help?

If you run into issues:

1. Check Spaceship's documentation
2. Contact Spaceship support
3. Test with a different email provider temporarily (Gmail with app password)

---

**Note**: This email system works for both development and production. The webhook handlers (for order notifications) run on the server side, while contact forms work client-side with graceful fallbacks.
