# 🔍 Monitoring & Error Reporting System - Setup Guide

## Overview

A comprehensive monitoring and error reporting system has been integrated into your admin panel. This system automatically tracks errors, monitors service health, and provides real-time alerts.

---

## ✅ What's Been Implemented

### 1. **System Health Monitoring**

- Real-time health checks for critical services:
  - SMTP (Email Service)
  - Firebase (Database & Auth)
  - Contentful CMS
  - Stripe Payment Gateway
- Response time tracking
- Auto-refresh every 30 seconds

### 2. **Error Logging & Tracking**

- Automatic error capture from frontend
- Error severity levels (Critical, Error, Warning)
- Error grouping and statistics
- Resolution tracking

### 3. **Admin Dashboard**

- New "Monitoring" tab in admin panel
- Error statistics overview
- Service health status cards
- Recent errors list
- Error summary by type

### 4. **Global Error Handler**

- Captures unhandled promise rejections
- Catches global JavaScript errors
- Automatic reporting to backend

---

## 🚀 Setup Instructions

### Step 1: Initialize Global Error Handler

Add this to your **main `App.tsx`** file (top level):

```tsx
import { setupGlobalErrorHandler } from "./services/errorReporter";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Initialize error monitoring
    setupGlobalErrorHandler();
  }, []);

  // ... rest of your app
}
```

### Step 2: Verify API Endpoints

The following API endpoints are now available:

1. **`/api/admin/monitoring/health`** - System health check
2. **`/api/admin/monitoring/errors`** - Get error logs
3. **`/api/admin/monitoring/resolve`** - Mark error as resolved
4. **`/api/errors/report`** - Report new errors (public)

### Step 3: Access Monitoring Dashboard

1. Log in as admin
2. Navigate to Admin Panel
3. Click the **"Monitoring"** tab
4. View real-time system status

---

## 📊 Features

### System Health Dashboard

**Service Monitoring:**

- ✅ Healthy (green) - Service operational
- ⚠️ Degraded (yellow) - Service slow/partial issues
- ❌ Down (red) - Service unavailable

**Metrics Tracked:**

- Response time (ms)
- Last checked timestamp
- Error messages
- Connection status

### Error Tracking

**Error Severities:**

- 🔴 **Critical** - System-breaking errors (payment failures, data loss)
- 🟠 **Error** - Functional errors (API failures, form submission errors)
- 🟡 **Warning** - Non-critical issues (deprecation warnings, slow queries)

**Error Information:**

- Error type and message
- Stack trace
- User context (if authenticated)
- Request details (URL, method, IP, user agent)
- Timestamp
- Resolution status

---

## 🔧 Manual Error Reporting

You can manually report errors in your code:

### Import the error reporter:

```tsx
import { logError, logWarning, logCritical } from "../services/errorReporter";
```

### Report different severity levels:

```tsx
// Report a warning
await logWarning("User attempted invalid action", {
  userId: user.id,
  action: "delete_admin_account",
});

// Report an error
try {
  await fetchData();
} catch (error) {
  await logError("Failed to fetch data", error, "error", {
    endpoint: "/api/data",
    attemptCount: 3,
  });
}

// Report a critical error
await logCritical("Payment processing failed", error, {
  orderId: "12345",
  amount: 999.99,
  customer: customer.email,
});
```

---

## 📧 Auto-Notifications (Optional Enhancement)

To receive email alerts for critical errors, you can extend the system:

### Create `/api/admin/monitoring/notify.ts`:

```ts
import { sendEmail } from "../services/email";

export async function notifyAdminOfError(error: ErrorLog) {
  if (error.severity === "critical") {
    await sendEmail({
      to: "admin@vortexpcs.com",
      subject: `🚨 CRITICAL ERROR: ${error.type}`,
      html: `
        <h2>Critical Error Detected</h2>
        <p><strong>Type:</strong> ${error.type}</p>
        <p><strong>Message:</strong> ${error.message}</p>
        <p><strong>Time:</strong> ${error.timestamp}</p>
        <p><a href="https://vortexpcs.com/admin#monitoring">View in Admin Panel</a></p>
      `,
    });
  }
}
```

---

## 🔐 Security Notes

- All admin monitoring endpoints require authentication
- Only users with `admin` role can access monitoring data
- Error reports from frontend are sanitized
- Sensitive data (passwords, tokens) should never be logged

---

## 📈 Usage Examples

### Check Service Health from Code:

```tsx
const response = await fetch("/api/admin/monitoring/health", {
  headers: { Authorization: `Bearer ${token}` },
});
const health = await response.json();

if (health.status === "down") {
  // Handle critical service outage
  showMaintenancePage();
}
```

### Get Recent Errors:

```tsx
const response = await fetch(
  "/api/admin/monitoring/errors?limit=10&severity=critical",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
const { errors, summary } = await response.json();

console.log(`${errors.length} critical errors in last 24 hours`);
```

### Resolve an Error:

```tsx
await fetch("/api/admin/monitoring/resolve", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    errorId: "abc123",
    notes: "Fixed by restarting SMTP service",
  }),
});
```

---

## 🎯 Monitoring Best Practices

1. **Check daily** - Review the monitoring dashboard each morning
2. **Set up alerts** - Configure email notifications for critical errors
3. **Resolve promptly** - Mark errors as resolved once fixed
4. **Track patterns** - Look for recurring errors in the summary
5. **Monitor trends** - Watch for increasing error rates

---

## 🐛 Troubleshooting

### Monitoring Dashboard Not Loading

1. Check Firebase Admin credentials are set in Vercel
2. Verify authentication token is valid
3. Check browser console for errors

### Errors Not Being Logged

1. Verify `setupGlobalErrorHandler()` is called in App.tsx
2. Check `/api/errors/report` endpoint is accessible
3. Ensure Firestore has proper permissions

### Health Checks Failing

1. Verify all service credentials in Vercel env vars
2. Check service API keys are valid
3. Review Vercel function logs for details

---

## 📚 Files Created

### API Endpoints:

- `/api/admin/monitoring/health.ts` - Health checks
- `/api/admin/monitoring/errors.ts` - Error logs retrieval
- `/api/admin/monitoring/resolve.ts` - Resolve errors
- `/api/errors/report.ts` - Error reporting endpoint

### Services:

- `/api/services/error-tracking.ts` - Firestore error operations
- `/api/services/auth-admin.ts` - Admin authentication helper
- `/services/errorReporter.ts` - Frontend error reporter

### Components:

- `/components/MonitoringDashboard.tsx` - Monitoring UI
- Updated `/components/AdminPanel.tsx` - Added monitoring tab

---

## 🎉 You're All Set!

Your monitoring system is now active. Visit the **Admin Panel → Monitoring** tab to start tracking system health and errors in real-time.

**Next Steps:**

1. Add `setupGlobalErrorHandler()` to your App.tsx
2. Deploy to production
3. Monitor for 24 hours to establish baseline
4. Set up email alerts for critical errors (optional)

---

**Questions or Issues?**
Review the code in `/components/MonitoringDashboard.tsx` or check Vercel function logs for debugging.
