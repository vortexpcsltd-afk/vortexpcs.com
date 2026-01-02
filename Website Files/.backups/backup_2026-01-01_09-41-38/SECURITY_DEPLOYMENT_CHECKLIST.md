# Security Deployment Checklist

## ✅ Completed

- [x] IP whitelisting middleware created
- [x] Security headers middleware created
- [x] MFA setup component created and integrated
- [x] Enhanced CSP headers in vercel.json
- [x] IP whitelist integrated into admin authentication
- [x] QR code library installed
- [x] Lint passing
- [x] Build passing

## 🔧 Next Steps

### 1. Enable Firebase MFA (Required for MFA to work)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Settings** tab
4. Scroll to **Multi-factor authentication**
5. Click **Enable** next to both:
   - **Time-based One-time Password (TOTP)** - For authenticator apps
   - **SMS** - For text message codes (optional but recommended as backup)
6. Save changes

### 2. Configure IP Whitelist Environment Variable

1. Get your current IP address from https://whatismyipaddress.com/
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Select your project → **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `ADMIN_IP_WHITELIST`
   - **Value:** Your IP address (e.g., `203.0.113.45`)
   - **Environments:** Production, Preview, Development (check all three)

**For multiple IPs:** Separate with commas

```
203.0.113.45,198.51.100.88,192.168.1.100
```

**For IP ranges (CIDR):** Include subnet mask

```
192.168.1.0/24,10.0.0.0/16
```

5. Click **Save**

### 3. Deploy to Vercel

```bash
# If using Vercel CLI
vercel --prod

# Or push to your main branch (if auto-deploy is enabled)
git add .
git commit -m "feat: Add MFA, IP whitelisting, and enhanced security headers"
git push origin main
```

### 4. Test MFA Setup

1. After deployment, log in to your admin panel
2. Navigate to **Security** tab
3. You should see the **Multi-Factor Authentication** card
4. Click **Enable MFA**
5. Choose **Authenticator App** method
6. Scan the QR code with:
   - Google Authenticator (iOS/Android)
   - Microsoft Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
   - 1Password (if you use it)
   - Any TOTP-compatible app
7. Enter the 6-digit code shown in your app
8. Click **Verify**
9. **IMPORTANT:** Save your backup codes somewhere safe (Firebase should provide these)

### 5. Test IP Whitelisting

**Test A: From Whitelisted IP**

1. Access your admin panel from the IP you whitelisted
2. You should be able to log in normally

**Test B: From Non-Whitelisted IP** (Optional, use mobile data or VPN)

1. Try accessing admin panel from different IP
2. You should see 403 Forbidden error with message: "Access denied from this IP address"

### 6. Test Security Headers

1. Open your site in Chrome/Edge
2. Press F12 to open DevTools
3. Go to **Network** tab
4. Reload the page
5. Click any request
6. Check **Response Headers** section for:
   - `x-frame-options: DENY`
   - `x-content-type-options: nosniff`
   - `strict-transport-security: max-age=31536000; includeSubDomains; preload`
   - `content-security-policy: ...` (should include upgraded HTTPS, frame-ancestors 'none')

## 🚨 Important Security Notes

### IP Whitelist Behavior

- **Development Mode:** If `ADMIN_IP_WHITELIST` is not set, all IPs are allowed
- **Production Mode:** If `ADMIN_IP_WHITELIST` is not set, **ALL IPs ARE BLOCKED** for maximum security
- Update your whitelist when your IP changes (home internet, office, travel)
- Consider using a VPN with static IP for consistent access

### MFA Best Practices

- Use authenticator apps (TOTP) over SMS when possible (more secure)
- Save backup codes in a secure password manager
- Test MFA login flow before relying on it exclusively
- If you get locked out, you'll need to contact Firebase support to disable MFA

### Emergency Access

If you get locked out:

**IP Whitelist Lockout:**

1. Remove `ADMIN_IP_WHITELIST` environment variable in Vercel
2. Redeploy
3. Access will work from any IP temporarily
4. Add your current IP to whitelist
5. Re-add the environment variable
6. Redeploy

**MFA Lockout:**

1. Use your backup codes (provided during setup)
2. If no backup codes, contact Firebase support
3. Or use Firebase Admin SDK to programmatically remove MFA enrollment

## 📊 Monitoring

After deployment, monitor:

1. **Vercel Logs** → Check for "Blocked request from non-whitelisted IP" messages
2. **Firebase Console** → Authentication → Users → Check for unusual MFA activity
3. **Admin Panel** → Security tab → Monitor blocked IPs and failed login attempts

## 🛡️ Additional Security Recommendations

1. **Session Management:**

   - Consider implementing auto-logout after 15 minutes of inactivity
   - Add re-authentication for sensitive actions (order deletion, user management)

2. **Rate Limiting:**

   - Already implemented with Upstash Redis
   - Monitor for unusual patterns

3. **Audit Logging:**

   - Log all admin actions
   - Track who made changes and when
   - Set up alerts for suspicious activity

4. **Firestore Security Rules:**

   - Review and tighten rules
   - Ensure admin-only collections are properly protected

5. **SSL/TLS:**
   - Already enforced via HSTS header
   - Ensure Vercel SSL certificate is valid

## 📝 Maintenance Schedule

- **Weekly:** Review security logs and blocked IP list
- **Monthly:** Rotate admin credentials, update IP whitelist if needed
- **Quarterly:** Full security audit, review access logs, test MFA recovery

## ✅ Final Verification Checklist

Before considering this deployment complete:

- [ ] Firebase MFA is enabled in console
- [ ] `ADMIN_IP_WHITELIST` environment variable is set in Vercel
- [ ] Deployment to production completed successfully
- [ ] MFA enrollment tested and working
- [ ] IP whitelist tested and blocking non-whitelisted IPs
- [ ] Security headers verified in browser DevTools
- [ ] Backup codes saved securely
- [ ] Emergency access procedures documented and tested
- [ ] Team members notified of new security requirements
- [ ] Monitoring alerts configured

## 🔗 Related Documentation

- [SECURITY_SETUP_GUIDE.md](./SECURITY_SETUP_GUIDE.md) - Detailed security configuration guide
- [api/middleware/ip-whitelist.ts](./api/middleware/ip-whitelist.ts) - IP whitelisting implementation
- [api/middleware/security-headers.ts](./api/middleware/security-headers.ts) - Security headers implementation
- [components/MFASetup.tsx](./components/MFASetup.tsx) - MFA component implementation
- [vercel.json](./vercel.json) - CSP and security header configuration

---

**Status:** Ready for deployment pending environment variable configuration and Firebase MFA enablement.
