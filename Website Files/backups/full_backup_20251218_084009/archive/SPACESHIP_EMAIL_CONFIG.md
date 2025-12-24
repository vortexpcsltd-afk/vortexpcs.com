# 🚀 Spaceship Email - Complete Configuration

## ✅ Your Email Service Confirmed

**Provider:** Spaceship Email (PrivateEmail by Namecheap)  
**MX Records:** mx1.spacemail.com, mx2.spacemail.com  
**Domain:** vortexpcs.com

---

## 📧 SMTP Settings (Copy These Exactly)

```
SMTP Host: mail.privateemail.com
Port: 587
Security: STARTTLS (TLS)
Username: info@vortexpcs.com
Password: [Your Spaceship email password]
```

---

## ⚙️ Vercel Environment Variables

Add these 6 variables in Vercel → Settings → Environment Variables:

| Variable Name         | Value                   | Notes                          |
| --------------------- | ----------------------- | ------------------------------ |
| `VITE_SMTP_HOST`      | `mail.privateemail.com` | Exact, don't change            |
| `VITE_SMTP_PORT`      | `587`                   | Use 465 if 587 doesn't work    |
| `VITE_SMTP_SECURE`    | `false`                 | Use `true` if using port 465   |
| `VITE_SMTP_USER`      | `info@vortexpcs.com`    | Full email address             |
| `VITE_SMTP_PASS`      | `[your-email-password]` | From Spaceship email account   |
| `VITE_BUSINESS_EMAIL` | `info@vortexpcs.com`    | Where to receive notifications |

---

## 🔑 Where to Find Your Password

1. Go to: https://www.spaceship.com/
2. Log in to your account
3. Navigate to **Email** section
4. Click on `info@vortexpcs.com`
5. If you don't know the password → **Reset Password**

**Note:** This is your EMAIL password, not your Spaceship account login password.

---

## 🚀 Quick Setup Steps

### 1. Add Environment Variables

```bash
# Go to Vercel dashboard
https://vercel.com/dashboard

# Navigate to:
Your Project → Settings → Environment Variables

# Add all 6 variables above
```

### 2. Deploy

```bash
git add .
git commit -m "Configure Spaceship email"
git push
```

### 3. Test

1. Wait for Vercel deployment to complete
2. Visit your website's contact page
3. Submit a test message
4. Check `info@vortexpcs.com` inbox (and spam folder)

---

## ✉️ Access Your Email

**Webmail:** https://privateemail.com/  
**Username:** info@vortexpcs.com  
**Password:** [Same password used in SMTP settings]

---

## 🔧 Alternative Configuration (If Port 587 Doesn't Work)

Some networks block port 587. If emails don't send, try:

```
VITE_SMTP_HOST=mail.privateemail.com
VITE_SMTP_PORT=465
VITE_SMTP_SECURE=true
```

---

## 🆘 Troubleshooting Checklist

- [ ] All 6 environment variables added in Vercel
- [ ] SMTP host is exactly `mail.privateemail.com`
- [ ] Username is full email: `info@vortexpcs.com`
- [ ] Password is your EMAIL password (not account password)
- [ ] Port is 587 with `SMTP_SECURE=false` OR 465 with `SMTP_SECURE=true`
- [ ] Vercel deployment completed successfully
- [ ] Checked Vercel function logs for errors
- [ ] Checked spam folder for test emails

---

## 📊 What Happens After Setup

When a customer submits the contact form:

1. **You receive:** Email notification at info@vortexpcs.com with customer's message
2. **Customer receives:** Auto-reply confirmation email
3. **Both emails:** Professionally branded with Vortex PCs styling

---

## 📚 Additional Resources

- **Quick Start:** See `SPACESHIP_EMAIL_QUICKSTART.md`
- **Detailed Guide:** See `SPACESHIP_EMAIL_SETUP.md`
- **General Forms Setup:** See `FORMS_SETUP_GUIDE.md`
- **Test SMTP Online:** https://www.smtper.net/

---

## ✅ Configuration Status

- [x] MX records identified (spacemail.com)
- [x] Email provider confirmed (Spaceship/PrivateEmail)
- [x] SMTP settings documented
- [ ] Environment variables added to Vercel ← **YOU ARE HERE**
- [ ] Code deployed to production
- [ ] Email functionality tested

**Next Step:** Add the 6 environment variables to Vercel and deploy!
