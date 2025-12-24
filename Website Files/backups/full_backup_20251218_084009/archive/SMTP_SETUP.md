# SMTP Configuration for Vortex PCs

## Current Email Provider: Spacemail

### Configuration Details

Your email hosting is through **Spacemail** with the following settings:

#### SMTP Settings (Outgoing Mail)

- **Host**: `mail.privateemail.com` (NOT mail.spacemail.com)
- **Port**: `587` (recommended) or `465` (fallback)
- **Security**: STARTTLS for 587 (Secure: `false`), SSL for 465 (Secure: `true`)
- **Username**: `info@vortexpcs.com`
- **Password**: Your Spacemail email account password

#### IMAP Settings (Incoming Mail - for reference)

- **Host**: `mail.spacemail.com`
- **Port**: `993`
- **Security**: SSL

## Vercel Environment Variables

To enable email functionality, add these environment variables to your Vercel project:

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

2. Add the following variables (set for **Production**, **Preview**, and **Development**):

```
VITE_SMTP_HOST=mail.spacemail.com
VITE_SMTP_PORT=465
VITE_SMTP_SECURE=true
VITE_SMTP_USER=info@vortexpcs.com
VITE_SMTP_PASS=your-actual-password
VITE_BUSINESS_EMAIL=info@vortexpcs.com
```

**Important Notes:**

- **DO NOT** use quotes around passwords in `.env` files - Node.js includes them as part of the value
- Passwords with special characters work fine without quotes in `.env` files
- The SMTP helper automatically strips quotes if accidentally included
- Host must be `mail.spacemail.com` (Spaceship Email's official SMTP server)
- Port 465 with SSL is the correct configuration per Spaceship documentation

3. **Important**: After adding/updating environment variables, you MUST redeploy for changes to take effect.

## Email Functionality Usage

The following features use SMTP:

### Public Features

- **Contact Form** (`/api/contact/send.ts`) - Customer inquiries
- **Enthusiast Quote Requests** (`/api/enthusiast/quote.ts`) - Custom PC quotes
- **Repair Service Notifications** (`/api/repair/notify.ts`) - Repair bookings

### Admin Features

- **Business Account Creation** (`/api/admin/users/create-business.ts`) - Welcome emails with password reset links
- **Password Reset Links** (`/api/admin/users/send-password-reset.ts`) - Manual password resets
- **Bulk Email Campaigns** (`/api/admin/email/send.ts`) - Marketing emails
- **SMTP Testing** (`/api/admin/email/test-smtp.ts`) - Configuration testing

## Testing SMTP Configuration

### Method 1: Admin Panel (Coming Soon)

A "Test SMTP" button will be added to the Admin Panel for quick testing.

### Method 2: API Endpoint

Send a POST request to `/api/admin/email/test-smtp` with an admin Bearer token:

```bash
curl -X POST https://vortexpcs.com/api/admin/email/test-smtp \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testEmail":"your-test@email.com"}'
```

### Method 3: Contact Form

Simply submit the public contact form on your website.

## Troubleshooting

### Common Issues

#### EBADNAME Error

- **Symptom**: `queryA EBADNAME smtp.spacemail.com` or similar DNS errors
- **Cause**: Wrong hostname (using `mail.spacemail.com` instead of `mail.privateemail.com`)
- **Fix**: Verify `VITE_SMTP_HOST=mail.privateemail.com` in Vercel (Spaceship uses PrivateEmail infrastructure)

#### EAUTH Error

- **Symptom**: Authentication failed
- **Cause**: Wrong username or password
- **Fix**: Verify credentials match your Spacemail account

#### ECONNECTION or ETIMEDOUT

- **Symptom**: Connection timeout
- **Cause**: Wrong port or security setting
- **Fix**: Ensure `VITE_SMTP_PORT=587` and `VITE_SMTP_SECURE=false` (or use port 465 with `VITE_SMTP_SECURE=true`)

#### Missing Environment Variables

- **Symptom**: "Email service not configured" or "Missing env vars"
- **Cause**: Environment variables not set in Vercel
- **Fix**: Add all required variables and redeploy

### Vercel Logs

To check email errors in production:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to the **Functions** tab
4. Look for errors in the relevant API function logs

## Alternative Email Providers

If you need to switch providers, update these settings:

### Gmail (App Password Required)

```
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
```

### Outlook/Office 365

```
VITE_SMTP_HOST=smtp-mail.outlook.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your-email@outlook.com
VITE_SMTP_PASS=your-password
```

### SendGrid

```
VITE_SMTP_HOST=smtp.sendgrid.net
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=apikey
VITE_SMTP_PASS=your-sendgrid-api-key
```

## Security Notes

- **Never commit** `.env` files with real credentials to Git
- Use **strong passwords** for email accounts
- Consider using **app-specific passwords** when available
- Regularly **rotate credentials** for security
- Monitor email sending **rate limits** with your provider

## Support

If emails still aren't working after:

1. Verifying environment variables in Vercel
2. Redeploying the application
3. Checking Vercel function logs

Contact your email provider (Spacemail) to ensure:

- SMTP is enabled for your account
- Your IP/domain isn't blocked
- Rate limits aren't exceeded
