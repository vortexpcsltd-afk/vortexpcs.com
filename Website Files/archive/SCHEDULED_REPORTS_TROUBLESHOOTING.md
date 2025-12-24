# Scheduled Reports Troubleshooting Guide

## Quick Diagnostics

### Why didn't my report send at 9am?

**Check these things:**

1. **Is the report enabled?**

   - Go to Admin Panel → Reports tab
   - Check if your scheduled report shows "Active" badge
   - If disabled, click edit and enable it

2. **Check Vercel Cron Logs**

   ```bash
   # In Vercel Dashboard:
   # Project → Deployments → [Latest] → Functions → /api/admin/reports/send-scheduled
   # Look for logs around the scheduled time
   ```

3. **Verify SMTP Configuration**

   - Check that these environment variables are set in Vercel:
     - `VITE_SMTP_HOST`
     - `VITE_SMTP_USER`
     - `VITE_SMTP_PASS`
     - `VITE_SMTP_PORT` (usually 465 or 587)
     - `VITE_SMTP_SECURE` (true for port 465, false for 587)

4. **Check Next Scheduled Time**
   - In Reports tab, look at "Next: [time]" under each scheduled report
   - If it's in the past, the cron may have failed
   - If it's in the future, wait for that time

## Common Issues

### Issue: Report shows as "Active" but never sends

**Solution:**

1. Check Vercel cron is configured in `vercel.json`:
   ```json
   {
     "path": "/api/admin/reports/send-scheduled",
     "schedule": "0 * * * *"
   }
   ```
2. Redeploy to Vercel after any `vercel.json` changes
3. Check Vercel dashboard → Settings → Cron Jobs to verify it's listed

### Issue: Email sends but recipients don't receive it

**Solution:**

1. Check spam/junk folders
2. Verify recipient email addresses are correct in scheduled report configuration
3. Check SMTP service limits (some providers limit daily sends)
4. Test email configuration at: `/api/email/diagnostic?sendTest=true`

### Issue: Report generates but email fails

**Solution:**

1. Check SMTP credentials are correct
2. Verify SMTP service is working: `/api/email/diagnostic`
3. Check if SMTP service requires app passwords (Gmail, Outlook)
4. Review Vercel function logs for specific error messages

### Issue: Next scheduled time doesn't update

**Solution:**

- This means the report generation or email sending failed
- Check Vercel function logs for error details
- Common causes:
  - Firebase connection issues
  - SMTP authentication failure
  - Missing environment variables

## Manual Testing

### Test if a scheduled report would work:

1. **Check Firebase**: Verify scheduled reports exist

   ```
   Collection: scheduled_reports
   Check: enabled=true, nextScheduled<now
   ```

2. **Manually trigger cron** (requires CRON_SECRET):

   ```bash
   curl -X GET "https://your-domain.com/api/admin/reports/send-scheduled" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Check response**:
   ```json
   {
     "success": true,
     "processed": 1,
     "sent": 1,
     "sentReports": ["report-id"],
     "timestamp": "2025-11-29T09:00:00.000Z"
   }
   ```

## How Scheduling Works

1. **Creation**: When you create a scheduled report:

   - `nextScheduled` is set to 9:00 AM on the next occurrence
   - Daily: tomorrow at 9am
   - Weekly: 7 days from now at 9am
   - Monthly: 1st of next month at 9am

2. **Execution**: Every hour (0 \* \* \* \*):

   - Cron job checks for reports where `nextScheduled <= now`
   - Generates report for the appropriate time period
   - Sends emails to all recipients
   - Updates `lastSent` to current time
   - Calculates and sets new `nextScheduled`

3. **Next Schedule Calculation**:
   - Daily: current time + 1 day, set to 9:00 AM
   - Weekly: current time + 7 days, set to 9:00 AM
   - Monthly: current time + 1 month, set to 1st at 9:00 AM

## Environment Variables Required

```env
# Firebase Admin (for report storage)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
# OR
FIREBASE_SERVICE_ACCOUNT_BASE64=base64-encoded-service-account-json

# SMTP (for email sending)
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_USER=your-email@domain.com
VITE_SMTP_PASS=your-app-password
VITE_SMTP_PORT=465
VITE_SMTP_SECURE=true

# Cron Security (optional but recommended)
CRON_SECRET=random-secure-string

# Application URL (for report download links)
VERCEL_URL=your-domain.com
```

## Checking Logs in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on latest deployment
5. Click "Functions" tab
6. Find `/api/admin/reports/send-scheduled`
7. Click to view logs
8. Look for:
   - "Found X scheduled reports due for sending"
   - "Successfully sent scheduled report: [name]"
   - Any error messages

## Emergency: Manually Send a Report Now

If you need a report immediately:

1. Go to Admin Panel → Reports
2. Use the one-time report generator
3. Select same metrics and format
4. Click "Generate Report"
5. Download and share manually

## Monitoring Recommendations

1. **Set up email alerts** for failed cron jobs in Vercel
2. **Check Admin Panel weekly** to verify reports are sending
3. **Ask recipients to confirm** they received first scheduled report
4. **Keep SMTP credentials updated** (some expire after 90 days)

## Support

If reports still aren't working after these checks:

1. Export your scheduled report configuration
2. Take screenshots of:
   - Scheduled report in Admin Panel
   - Vercel cron job configuration
   - Recent Vercel function logs
3. Check if you can manually generate reports (one-time generator)
4. Verify email works using: `/api/email/diagnostic?sendTest=true`

---

**Last Updated**: November 29, 2025
**Status**: Automated scheduled reports are now fully implemented
