# Vortex PCs Firebase Cloud Functions

This directory contains Firebase Cloud Functions for the Vortex PCS website.

## Functions

### 1. `sendVortexVaultExpiryReminders`

**Type:** Scheduled Pub/Sub Function  
**Schedule:** Daily at 2:00 AM UTC  
**Purpose:** Sends reminder emails to users with Vortex Vault points expiring in 30, 7, or 1 day

**How it works:**

- Runs automatically every day at 2 AM UTC
- Queries all vault accounts with active points
- Calculates days until points expire (18 months from last activity)
- Sends reminders when expiry windows are reached
- Logs results for monitoring

**Setup:**

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 2. `sendExpiryReminderEmail`

**Type:** Callable HTTPS Function  
**Purpose:** Sends expiry reminder emails via Cloud Function

Can be called from:

- Frontend (requires authentication)
- Other Cloud Functions
- Admin scripts

**Example call:**

```typescript
const sendEmail = firebase.functions().httpsCallable("sendExpiryReminderEmail");
await sendEmail({
  userId: "user123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  daysUntilExpiry: 7,
  pointsAtRisk: 250,
  pointsValue: 6.25,
});
```

### 3. `manuallyTriggerExpiryReminders`

**Type:** HTTP Function  
**Purpose:** Manually trigger expiry reminders (useful for testing)

**Usage:**

```bash
curl -X POST https://region-project.cloudfunctions.net/manuallyTriggerExpiryReminders \
  -H "Authorization: Bearer YOUR_SECRET"
```

Requires `FUNCTION_SECRET` environment variable set in Firebase.

## Environment Setup

### Firebase Configuration

1. Ensure Firebase project is linked:

```bash
firebase login
firebase init functions
```

2. Update `firebase.json` to include functions:

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

3. Set environment variables (if needed):

```bash
firebase functions:config:set vault.secret="YOUR_SECRET"
```

### Email Integration

The current implementation logs email sending. To actually send emails, integrate with:

**Option A: Firebase Extensions (Recommended)**

- Install "Trigger Email from Firestore" extension
- Configure SMTP or SendGrid credentials
- Cloud Function will automatically send emails

**Option B: Sendgrid / MailerSend**

```typescript
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({ to, from, subject, html });
```

**Option C: Nodemailer (for SMTP)**

```typescript
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
await transporter.sendMail({ to, subject, html });
```

## Development

### Local Testing

1. Start Firebase emulators:

```bash
firebase emulators:start
```

2. Deploy to production:

```bash
firebase deploy --only functions
```

### View Logs

```bash
firebase functions:log
firebase functions:log --region=europe-west1
```

## Monitoring

### Cloud Function Performance

- **Invocations:** Check Firebase Console → Functions
- **Execution Time:** Monitor for timeouts (max 540s)
- **Memory:** Monitor allocation (128MB default, increase if needed)
- **Errors:** View in Logs or Error Reporting

### Email Delivery

- Monitor SendGrid/MailerSend delivery status
- Check email bounce/complaint rates
- Verify sender domain reputation

## Troubleshooting

### Function not running on schedule

- Check timezone setting (should be UTC)
- Verify Pub/Sub topic is created
- Check Cloud Scheduler configuration

### Emails not being sent

- Verify SMTP/SendGrid credentials
- Check email addresses in database
- Review function logs for errors
- Test with `manuallyTriggerExpiryReminders`

### High execution time

- Add indexes to Firestore queries
- Consider pagination for large datasets
- Increase function memory if needed

## Future Enhancements

1. **Batch Email Sending:** Implement job queue to prevent timeouts
2. **User Preferences:** Check user notification settings before sending
3. **Template Variations:** Different email templates for different tiers
4. **A/B Testing:** Test different subject lines/CTA buttons
5. **Analytics:** Track open rates and click-through rates
6. **Rate Limiting:** Prevent duplicate emails to same user

## Support

For issues or questions, contact the development team or check Firebase documentation:

- https://firebase.google.com/docs/functions
- https://firebase.google.com/docs/functions/schedule-functions
- https://firebase.google.com/docs/database
