# Analytics Dashboard - Complete Guide

## Overview

Comprehensive analytics system for Vortex PCs with real-time visitor tracking, security monitoring, and business intelligence. The dashboard provides live stats, time-series charts, and actionable insights for website management.

## Features

### 1. **Live User Tracking**

- **Real-time active users** - See who's on your site right now
- **Device breakdown** - Mobile, tablet, desktop distribution
- **Page distribution** - What pages users are viewing
- **Session details** - User activity, referrers, device info
- **Auto-refresh** - Updates every 30 seconds

### 2. **Visitor Statistics**

- **Daily average** - Average visitors per day
- **Weekly visitors** - Last 7 days total
- **Monthly visitors** - Last 30 days total
- **Year-to-date** - Total visitors since Jan 1
- **Page views** - Total page views and average per session
- **Time series chart** - Visual trend of visitors over time

### 3. **Page Analytics**

- **Top pages ranking** - Most visited pages
- **Unique visitors** - Per-page unique visitor counts
- **Time on page** - Average time spent on each page
- **Entry pages** - Where users first land on your site
- **Total views** - Aggregate page view count

### 4. **Security Monitoring**

- **Login attempts** - Successful and failed logins
- **Success rate** - Percentage of successful authentications
- **Failed login tracking** - By email and IP address
- **Suspicious activity** - Anomaly detection alerts
- **Top failed attempts** - Identify brute force attempts

### 5. **Download Tracking**

- **Total downloads** - All file downloads
- **Most popular files** - Download rankings
- **Daily averages** - Average downloads per day
- **Recent activity** - Latest download events
- **User attribution** - Track downloads by user

## Architecture

### Frontend Components

**`components/AnalyticsDashboard.tsx`**

- Main dashboard component with live stats
- Real-time auto-refresh functionality
- Period selector (7/30/90 days)
- Interactive charts and visualizations

**`services/sessionTracker.ts`**

- Client-side session tracking
- Automatic page view tracking
- User interaction monitoring
- Device and browser detection

**`services/advancedAnalytics.ts`**

- Firebase Firestore integration
- Session management functions
- Analytics aggregation queries
- Data export utilities

### Backend API Endpoints

**`/api/admin/analytics/live`**

- Returns currently active users
- Device and page distribution
- Real-time session details
- Updates every 30 seconds

**`/api/admin/analytics/visitors`**

- Visitor statistics by period
- Daily/weekly/monthly/YTD metrics
- Time series data for charts
- Query param: `?period=30` (days)

**`/api/admin/analytics/pages`**

- Page view rankings
- Unique visitor counts per page
- Average time on page
- Entry page statistics
- Query param: `?days=30`

**`/api/admin/analytics/security`**

- Login attempt statistics
- Failed login tracking
- IP and email analysis
- Suspicious activity alerts
- Query param: `?days=30`

**`/api/admin/analytics/downloads`**

- Download event tracking
- File popularity rankings
- Daily average calculations
- Recent download history
- Query param: `?days=30`

## Firebase Collections

### `analytics_sessions`

```typescript
{
  sessionId: string;
  userId?: string;
  startTime: Timestamp;
  lastActivity: Timestamp;
  pageViews: number;
  pages: string[];
  referrer: string;
  userAgent: string;
  location?: { country, city, ip };
  device: { type, browser, os };
  isActive: boolean;
}
```

### `analytics_pageviews`

```typescript
{
  sessionId: string;
  userId?: string;
  page: string;
  title: string;
  timestamp: Timestamp;
  timeOnPage?: number;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
```

### `analytics_events`

```typescript
{
  sessionId: string;
  userId?: string;
  eventType: string; // "download", "click", "submit", etc.
  eventData: Record<string, unknown>;
  timestamp: Timestamp;
  page: string;
}
```

### `security_events`

```typescript
{
  type: "login_success" | "login_failed" | "password_reset" | "suspicious_activity";
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Timestamp;
  details?: Record<string, unknown>;
}
```

## Usage

### Accessing the Dashboard

1. Log in to Admin Panel at `/admin`
2. Navigate to **Analytics** tab (tab 6 of 10)
3. Dashboard loads automatically with 30-day default period

### Controls

**Period Selector**

- Last 7 Days
- Last 30 Days
- Last 90 Days

**Auto-Refresh Toggle**

- Enable/disable automatic updates (default: ON)
- Refreshes every 30 seconds when enabled

**Manual Refresh**

- Click "Refresh Now" button for instant update
- Useful when auto-refresh is disabled

### Tracking Events Manually

**Track Page Views** (automatic in App.tsx)

```typescript
import { trackPage } from "./services/sessionTracker";

trackPage("/custom-page", "Page Title", userId);
```

**Track Downloads**

```typescript
import { trackDownload } from "./services/sessionTracker";

trackDownload("filename.pdf", userId);
```

**Track Custom Events**

```typescript
import { trackClick } from "./services/sessionTracker";

trackClick(
  "button_click",
  {
    buttonId: "checkout",
    value: 199.99,
  },
  userId
);
```

**Track Security Events**

```typescript
import { trackSecurityEvent } from "./services/advancedAnalytics";

trackSecurityEvent({
  type: "login_failed",
  email: "user@example.com",
  ip: "192.168.1.1",
  timestamp: new Date(),
  details: { reason: "Invalid password" },
});
```

## Privacy & Cookie Consent

Analytics tracking respects user privacy:

- **Gated by cookie consent** - Only tracks when user accepts cookies
- **Session-based** - Uses session IDs, not personal data
- **Optional user IDs** - Only tracks authenticated users who consent
- **GDPR compliant** - Users can opt out via cookie preferences

Check implementation in `App.tsx`:

```typescript
const consent = localStorage.getItem("vortex_cookie_consent");
if (consent === "accepted") {
  // Analytics tracking enabled
}
```

## Performance Considerations

**Auto-Refresh Impact**

- 5 API calls every 30 seconds when auto-refresh enabled
- Minimal bandwidth (~50KB per refresh)
- Can disable auto-refresh for lower resource usage

**Query Limits**

- Sessions: 5000 per query
- Page views: 1000 per query
- Events: 1000 per query
- Security events: 1000 per query

**Firestore Costs**

- Each dashboard load = ~5 document reads
- Auto-refresh every 30s = ~10 reads/minute
- Estimated cost: ~$0.01 per 1000 views

## Troubleshooting

### No Live Users Showing

**Possible causes:**

1. No visitors currently on site
2. Sessions marked inactive (5+ min idle)
3. Cookie consent not accepted
4. Firebase not initialized

**Solution:**

- Verify Firebase credentials in `.env`
- Check browser console for errors
- Test by visiting site in incognito window

### Analytics Not Tracking

**Possible causes:**

1. Cookie consent declined
2. Session tracker not initialized
3. Firestore permissions issue

**Solution:**

- Accept cookies on frontend
- Check `App.tsx` imports session tracker
- Verify Firestore security rules allow writes

### API Errors (401 Unauthorized)

**Possible causes:**

1. Not logged in as admin
2. Admin custom claim not set
3. Token expired

**Solution:**

- Log out and log back in
- Verify admin role in Firebase console
- Check token expiration

### Missing Data in Charts

**Possible causes:**

1. Selected period has no data
2. Firestore query limit reached
3. Date range calculation error

**Solution:**

- Try different time period (7/30/90 days)
- Check Firebase console for actual data
- Verify system clock is correct

## Security

**Admin-Only Access**

- All analytics endpoints require admin authentication
- Token verification via `verifyAdmin()` helper
- Firebase custom claims enforce admin role

**Data Protection**

- IP addresses stored only for security monitoring
- Personal data (email) only in security events
- Session IDs are anonymized random strings

**Rate Limiting**

- Auto-refresh built-in throttling (30s minimum)
- Firestore query limits prevent abuse
- Consider adding API rate limiting for production

## Future Enhancements

### Planned Features

- [ ] Heatmap visualization for click tracking
- [ ] Conversion funnel analysis
- [ ] A/B testing framework
- [ ] Email report scheduling
- [ ] Export to CSV/PDF
- [ ] Geographic location mapping
- [ ] Custom date range selector
- [ ] Comparison mode (period vs period)

### Integration Ideas

- Google Analytics integration for comparison
- Stripe revenue tracking in analytics
- Email campaign performance metrics
- SEO ranking correlation

## Support

For issues or questions:

1. Check browser console for errors
2. Review Firebase logs in console
3. Verify environment variables set correctly
4. Test with different browsers/devices

## Related Documentation

- `MONITORING_SYSTEM_GUIDE.md` - Error monitoring and health checks
- `BACKEND_INTEGRATION_GUIDE.md` - API setup and Firebase config
- `ENVIRONMENT_VARIABLES.md` - Required environment variables
