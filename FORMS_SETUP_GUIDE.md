# Forms Setup Guide - Vortex PCs

## ✅ What's Been Fixed

Your contact form and repair booking form have been updated to work properly with Vercel serverless functions instead of trying to use Node.js code in the browser.

## 📧 Email Configuration Required

To make the forms send emails, you need to configure SMTP credentials:

### Step 1: Get SMTP Credentials

You have several options:

#### Option A: Gmail (Easiest for Testing)

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

#### Option B: Spaceship Email (Professional)

1. Log in to your Spaceship account
2. Set up email hosting for your domain
3. Get your SMTP credentials from the email settings

#### Option C: Other Email Providers

- **SendGrid**: Free tier 100 emails/day
- **Mailgun**: Free tier 5,000 emails/month
- **AWS SES**: Very cheap, pay per email

### Step 2: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password-here
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

**For Gmail:**

- Host: `smtp.gmail.com`
- Port: `587`
- Secure: `false`
- User: Your Gmail address
- Pass: Your App Password (16-character code)

**For Spaceship:**

- Host: Check your Spaceship email settings
- Port: Usually `587` or `465`
- Secure: `true` if port 465, `false` if port 587
- User: Your full email address
- Pass: Your email password

### Step 3: Redeploy on Vercel

After adding environment variables:

```bash
git add .
git commit -m "Configure email for contact forms"
git push
```

Vercel will automatically redeploy with the new environment variables.

## 🧪 Testing Locally

To test locally before deploying:

1. Create a `.env` file in the project root:

```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

2. Install Vercel CLI:

```bash
npm install -g vercel
```

3. Run in development mode:

```bash
vercel dev
```

This will run your app with serverless functions at `http://localhost:3000`

## 📝 How the Forms Work Now

### Contact Form

1. User fills out the form on your website
2. Form submits to `/api/contact/send` (serverless function)
3. Serverless function runs on Vercel's servers (not in browser)
4. Sends 2 emails:
   - One to your business email (notification)
   - One to the customer (auto-reply)

### Repair Booking Form

- Still needs to be updated (currently uses Stripe payment)
- Email notifications will work once SMTP is configured
- Stripe integration separate (already configured)

## ⚠️ Important Notes

1. **Never commit `.env` file to Git** - It contains secrets!
2. **Use App Passwords** for Gmail, not your actual password
3. **Check spam folders** when testing emails
4. **Vercel environment variables** are separate from local `.env`
5. **Redeploy required** after changing environment variables

## 🔧 Troubleshooting

### "Email not sent" error

- Check environment variables are set in Vercel
- Verify SMTP credentials are correct
- Check if Gmail requires "Less secure app access" or App Password

### Emails not arriving

- Check spam/junk folder
- Verify business email is correct
- Test with a simple Gmail address first

### Local testing not working

- Make sure you're running `vercel dev` not `npm run dev`
- Check `.env` file exists and has correct values
- Vercel CLI must be installed globally

## 📞 Need Help?

If emails still don't work after setup:

1. Check Vercel deployment logs for errors
2. Test SMTP credentials with an online SMTP tester
3. Consider using a dedicated email service like SendGrid

## 🎉 Alternative: No-Code Email Solutions

If SMTP setup is too complex, you can also use:

1. **Formspree** (https://formspree.io) - Free tier, just change form action
2. **EmailJS** (https://www.emailjs.com) - Send emails from JavaScript
3. **Web3Forms** (https://web3forms.com) - Simple form backend

These don't require SMTP configuration but have monthly limits.
