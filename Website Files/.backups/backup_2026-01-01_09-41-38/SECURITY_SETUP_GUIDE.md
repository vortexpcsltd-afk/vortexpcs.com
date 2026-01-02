# Security Configuration Guide

This document provides setup instructions for the enhanced security features.

## 1. IP Whitelisting Setup

### Step 1: Get Your IP Address

Visit https://whatismyipaddress.com/ and note your public IP address.

### Step 2: Configure Environment Variable

Add the following to your Vercel environment variables:

```bash
ADMIN_IP_WHITELIST=YOUR_IP_ADDRESS
```

**For multiple IPs:**

```bash
ADMIN_IP_WHITELIST=192.168.1.100,203.0.113.45,198.51.100.88
```

**For IP ranges (CIDR notation):**

```bash
ADMIN_IP_WHITELIST=192.168.1.0/24,10.0.0.0/16
```

### Step 3: Deploy

After adding the environment variable in Vercel, redeploy your application. Admin routes will now only be accessible from whitelisted IPs.

**Note:** During development, if no whitelist is configured, all IPs are allowed. In production, if no whitelist is set, **all IPs are blocked** for security.

---

## 2. Multi-Factor Authentication (MFA) Setup

### For Admin Users:

1. **Navigate to Admin Panel** → **Settings** or **Security**
2. **Find the MFA Setup Card**
3. **Choose your method:**
   - **Authenticator App (Recommended):** Use Google Authenticator, Authy, 1Password, etc.
   - **SMS:** Receive codes via text message

### Authenticator App Setup:

1. Click "Enable MFA"
2. Select "Authenticator App"
3. Scan the QR code with your authenticator app
4. Enter the 6-digit code from your app
5. Done! MFA is now enabled

### SMS Setup:

1. Click "Enable MFA"
2. Select "SMS"
3. Enter your phone number (with country code, e.g., +12345678900)
4. Click "Send Verification Code"
5. Enter the code you received
6. Done! MFA is now enabled

### Subsequent Logins:

After enabling MFA, you'll be prompted to enter a 6-digit code every time you log in to the admin panel.

---

## 3. Content Security Policy (CSP) Headers

CSP headers have been automatically configured in `vercel.json`. They:

- **Prevent XSS attacks** by controlling which scripts can run
- **Block clickjacking** with `frame-ancestors 'none'`
- **Enforce HTTPS** with `upgrade-insecure-requests`
- **Restrict external resources** to trusted domains only

**Allowed Domains:**

- Stripe (payments)
- PayPal (payments)
- reCAPTCHA (MFA verification)
- Firebase/Google services

**If you need to add a new trusted domain**, edit the CSP header in `vercel.json`:

```json
"script-src 'self' 'unsafe-inline' https://your-trusted-domain.com"
```

---

## 4. Security Headers Reference

All responses now include the following security headers:

| Header                      | Value                             | Purpose                                            |
| --------------------------- | --------------------------------- | -------------------------------------------------- |
| `X-Frame-Options`           | `DENY`                            | Prevents clickjacking by blocking iframe embedding |
| `X-Content-Type-Options`    | `nosniff`                         | Prevents MIME type sniffing                        |
| `X-XSS-Protection`          | `1; mode=block`                   | Enables browser XSS protection                     |
| `Strict-Transport-Security` | `max-age=31536000`                | Forces HTTPS for 1 year                            |
| `Referrer-Policy`           | `strict-origin-when-cross-origin` | Controls referrer information                      |
| `Permissions-Policy`        | `camera=(), microphone=()...`     | Disables unnecessary browser features              |

---

## 5. Testing Your Security Setup

### Test IP Whitelisting:

1. Try accessing `/admin` from a non-whitelisted IP
2. You should receive a 403 Forbidden error
3. From a whitelisted IP, access should work normally

### Test MFA:

1. Enable MFA on your admin account
2. Log out
3. Log back in - you should be prompted for a 6-digit code
4. Enter the code from your authenticator app
5. Access should be granted

### Test CSP Headers:

1. Open browser DevTools (F12)
2. Navigate to your site
3. Check the Network tab
4. Click on any request
5. Check Response Headers for CSP and security headers

---

## 6. Emergency Access

### If Locked Out Due to IP Whitelist:

1. **Remove** the `ADMIN_IP_WHITELIST` environment variable in Vercel
2. **Redeploy** the application
3. IP whitelisting will be disabled temporarily
4. Update the whitelist with your current IP
5. **Re-add** the environment variable
6. **Redeploy**

### If Locked Out Due to MFA:

Firebase MFA provides backup codes during setup. If you lost access to your authenticator:

1. Contact Firebase support to disable MFA on your account
2. Or use Firebase Admin SDK to manually remove MFA enrollment

---

## 7. Monitoring Security Events

All security events are logged to the console and can be monitored via:

1. **Vercel Logs:** Dashboard → Your Project → Logs
2. **Firebase Console:** Authentication → Users → Sign-in method

Look for:

- `[verifyAdmin] Blocked request from non-whitelisted IP`
- Failed MFA verification attempts
- Multiple failed login attempts

---

## 8. Best Practices

✅ **DO:**

- Rotate your admin email quarterly
- Use hardware keys (YubiKey) for maximum security
- Keep your IP whitelist updated when changing locations
- Enable MFA on all admin accounts
- Monitor security logs regularly

❌ **DON'T:**

- Share admin credentials
- Disable IP whitelisting in production
- Use public WiFi to access admin panel
- Reuse passwords across services
- Ignore security warnings

---

## 9. Additional Security Enhancements

Consider implementing:

1. **Session Management:**

   - Auto-logout after 15 minutes of inactivity
   - Re-authentication for sensitive actions

2. **Logging & Monitoring:**

   - Log all admin actions
   - Set up alerts for suspicious activity

3. **Database Security:**

   - Review Firestore security rules
   - Implement role-based access control

4. **Web Application Firewall (WAF):**
   - Use Cloudflare or Vercel's WAF
   - Block common attack patterns

---

## 10. Support

For security issues or questions:

1. Check Vercel logs for detailed error messages
2. Review Firebase Authentication logs
3. Contact support if you suspect a security breach

**Never share sensitive security credentials in public channels.**
