# Spaceship Email Setup Guide for Vortex PCs

## 🎯 Your Email Provider: Spaceship (PrivateEmail)

Based on your MX records (`mx1.spacemail.com`), you're using **Spaceship's built-in email service** (PrivateEmail by Namecheap).

## 📋 Step 1: Spaceship Email SMTP Settings

Your email service uses PrivateEmail, which has these SMTP settings:

### SMTP Configuration:

```
SMTP Host: mail.privateemail.com
Port: 587 (recommended) or 465
Security: TLS/STARTTLS (port 587) or SSL (port 465)
Username: info@vortexpcs.com (your full email address)
Password: Your Spaceship email password
```

### Where to Find/Reset Your Password:

1. Go to: https://www.spaceship.com/
2. Log in to your Spaceship account
3. Navigate to **Email** section
4. Click on your email account (`info@vortexpcs.com`)
5. If you don't know the password, click **Reset Password**
6. Use this password in your SMTP configuration
   ```
   SMTP Host: smtp.zoho.com
   Port: 587
   Security: TLS
   Username: your-email@vortexpcs.com
   Password: Your Zoho password
   ```

### Option D: Check Spaceship Dashboard

1. Log into Spaceship: https://spaceship.com
2. Go to your domain management
3. Look for **Email** or **Email Hosting** section
4. Note the provider and follow their SMTP setup instructions

## 🔧 Step 2: Configure for Vercel Deployment

### Add Environment Variables to Vercel:

1. Go to https://vercel.com/dashboard
2. Select your Vortex PCs project

## 📦 Step 2: Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select your **vortexpcs.com** project
3. Go to **Settings** → **Environment Variables**
4. Add these variables **exactly as shown**:

**For Spaceship Email (PrivateEmail):**

```
VITE_SMTP_HOST=mail.privateemail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=info@vortexpcs.com
VITE_SMTP_PASS=[your-spaceship-email-password]
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

### Important Notes:

- **SMTP_SECURE=false** because we're using port 587 with STARTTLS (not SSL)
- If port 587 doesn't work, try port 465 with `VITE_SMTP_SECURE=true`
- Use your **full email address** as the username
- Use your **Spaceship email password** (not your Spaceship account password)

5. Click **Save** after adding each variable
6. Your next deployment will use these settings

## 🧪 Step 3: Test Locally (Optional)

To test before deploying:

1. Create a `.env` file in your project root:

```env
# Spaceship Email Settings
VITE_SMTP_HOST=mail.privateemail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=info@vortexpcs.com
VITE_SMTP_PASS=your-app-password-here
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

2. **Important**: Add `.env` to your `.gitignore` file to avoid committing secrets!

3. Install Vercel CLI and run:

```bash
npm install -g vercel
vercel dev
```

4. Test the contact form at http://localhost:3000

## � Step 4: Deploy

After adding environment variables to Vercel:

```bash
git add .
git commit -m "Configure Spaceship email for forms"
git push
```

Vercel will automatically redeploy with your email configuration.

## ✅ Step 5: Verify It's Working

1. Visit your live site's contact page
2. Fill out the contact form
3. Submit it
4. Check:
   - Your business email inbox for the notification
   - The customer's email for the auto-reply (if you filled your own email)
   - Your spam/junk folder if emails don't appear

## � Finding Your Email Provider

Not sure which email service you have? Try these:

## 🔍 Additional Information

### Alternative SMTP Ports for Spaceship

If port 587 doesn't work (some ISPs block it), try:

**Port 465 (SSL):**

```
VITE_SMTP_HOST=mail.privateemail.com
VITE_SMTP_PORT=465
VITE_SMTP_SECURE=true
```

**Port 25 (Not recommended):**

- Often blocked by ISPs and hosting providers
- Only use as last resort

### Access Your Email

**Webmail:** https://privateemail.com/

- Log in with your full email address and password

**Mobile/Desktop Email Apps:**

- **Incoming (IMAP):** mail.privateemail.com, Port 993, SSL
- **Outgoing (SMTP):** mail.privateemail.com, Port 587, TLS

### Managing Spaceship Email

1. Go to: https://www.spaceship.com/
2. Navigate to **Email** section
3. You can:
   - Add more email addresses
   - Reset passwords
   - Set up email forwarding
   - Configure auto-replies
   - Check storage usage

## 🆘 Troubleshooting

### Emails not sending?

**Check Vercel Logs:**

1. Go to Vercel dashboard → Deployments
2. Click latest deployment → Functions
3. Click on the contact form submission
4. Look for error messages

**Common Issues:**

| Error                   | Solution                                                  |
| ----------------------- | --------------------------------------------------------- |
| "Invalid login"         | Wrong email password - reset it at Spaceship dashboard    |
| "Authentication failed" | Use full email address as username (info@vortexpcs.com)   |
| "Connection timeout"    | Verify SMTP host is exactly `mail.privateemail.com`       |
| "Certificate error"     | Try port 465 with `VITE_SMTP_SECURE=true` instead of 587  |
| "SMTP not available"    | Check that email service is active in Spaceship dashboard |

### Spaceship-Specific Tips:

1. ✅ **Host must be exact**: `mail.privateemail.com` (not spacemail.com or privateemail.com)
2. ✅ **Username is full email**: `info@vortexpcs.com` (not just "info")
3. ✅ **Use email password**: The password you use to log into webmail, not Spaceship account password
4. ✅ **Port 587 + STARTTLS**: Set `VITE_SMTP_SECURE=false` for port 587
5. ✅ **Alternative port**: If 587 fails, try 465 with `VITE_SMTP_SECURE=true`

### Test SMTP Settings Online:

Before deploying, test your SMTP credentials:

1. Go to: https://www.smtper.net/
2. Enter your SMTP settings:
   - Host: `mail.privateemail.com`
   - Port: `587`
   - Username: `info@vortexpcs.com`
   - Password: [your email password]
3. Send a test email
4. This confirms your credentials work before deployment

### Still Not Working?

1. **Check email storage**: Log into https://privateemail.com/ and verify your inbox isn't full
2. **Verify email is active**: Spaceship dashboard → Email → Ensure account shows as "Active"
3. **Check for typos**: Even one wrong character in host/username/password will cause failure
4. **Try webmail first**: Send an email from https://privateemail.com/ to verify account works

## 📧 What Happens When Forms Work

Once configured, your website will automatically:

1. **Contact Form Submissions**:
   - Customer fills out form
   - You get email notification with their details
   - Customer gets auto-reply thanking them
2. **Email Templates Include**:

   - Professional branded design
   - All form information organized
   - Auto-reply with your business info
   - Mobile-responsive HTML emails

3. **All emails sent from**: `info@vortexpcs.com` (or your configured email)

## 🎉 Alternative: Quick Testing with Gmail

If you want to test immediately while setting up Spaceship email:

1. Use your personal Gmail temporarily
2. Create an App Password
3. Add to Vercel environment variables
4. Test the forms work
5. Then switch to Spaceship email later

This lets you verify everything works before finalizing your business email setup.

## 📞 Still Need Help?

1. **Check Spaceship Support**: They can tell you exactly which email service you have
2. **Email Provider Docs**: Each provider has SMTP setup guides
3. **Vercel Logs**: Always check deployment logs for specific error messages

---

**Remember**: Never commit your `.env` file to Git - it contains sensitive passwords!
