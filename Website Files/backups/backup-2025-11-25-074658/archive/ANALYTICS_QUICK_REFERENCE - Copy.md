# Analytics Dashboard - Quick Reference

## Access

- **Location**: Admin Panel → Analytics Tab
- **URL**: `/admin` (requires admin login)
- **Position**: Tab 6 of 10

## Key Metrics at a Glance

### Live Stats

- **Active Users**: Real-time count of visitors on site now
- **Device Breakdown**: Mobile/Tablet/Desktop split
- **Current Pages**: What pages users are viewing

### Visitor Summary

- **Daily Average**: Avg visitors per day in selected period
- **This Week**: Last 7 days total
- **This Month**: Last 30 days total
- **Year to Date**: Total since Jan 1

### Top Pages

- **Page Rankings**: Most visited pages with view counts
- **Unique Visitors**: Per-page unique visitor counts
- **Avg Time**: Average seconds spent on each page

### Security

- **Successful Logins**: Valid authentication attempts
- **Failed Logins**: Invalid login attempts
- **Suspicious Activity**: Anomaly alerts
- **Top Failed**: Most targeted emails/IPs

### Downloads

- **Total Downloads**: All file downloads in period
- **Most Popular**: Top downloaded files
- **Daily Average**: Downloads per day

## Controls

### Period Selector

```
Last 7 Days   | Last 30 Days | Last 90 Days
```

### Auto-Refresh

```
[Auto-Refresh On/Off] [Refresh Now]
```

- **On**: Updates every 30 seconds automatically
- **Off**: Manual refresh only

## API Endpoints (Admin Only)

```
GET /api/admin/analytics/live          - Live active users
GET /api/admin/analytics/visitors      - Visitor statistics
GET /api/admin/analytics/pages         - Page view rankings
GET /api/admin/analytics/security      - Security events
GET /api/admin/analytics/downloads     - Download tracking
```

**Query Parameters:**

- `?period=30` (visitors endpoint)
- `?days=30` (pages, security, downloads)

## Manual Tracking

### Track Page View

```typescript
import { trackPage } from "./services/sessionTracker";
trackPage("/page-path", "Page Title", userId);
```

### Track Download

```typescript
import { trackDownload } from "./services/sessionTracker";
trackDownload("filename.pdf", userId);
```

### Track Custom Event

```typescript
import { trackClick } from "./services/sessionTracker";
trackClick("event_name", { key: "value" }, userId);
```

### Track Security Event

```typescript
import { trackSecurityEvent } from "./services/advancedAnalytics";
trackSecurityEvent({
  type: "login_failed",
  email: "user@example.com",
  ip: "192.168.1.1",
  timestamp: new Date(),
});
```

## Firestore Collections

| Collection            | Purpose                           |
| --------------------- | --------------------------------- |
| `analytics_sessions`  | User session tracking             |
| `analytics_pageviews` | Individual page views             |
| `analytics_events`    | Custom events (downloads, clicks) |
| `security_events`     | Login attempts, security          |

## Common Issues

### No Live Users

- Visitors need to accept cookies
- Sessions expire after 5min idle
- Check Firebase connection

### Analytics Not Tracking

- Cookie consent must be "accepted"
- Verify Firebase initialized
- Check browser console for errors

### API 401 Error

- Must be logged in as admin
- Admin custom claim required
- Try logging out and back in

## Performance

**Dashboard Load**: ~5 API calls, <1 second
**Auto-Refresh**: 5 API calls every 30 seconds
**Firestore Cost**: ~$0.01 per 1000 dashboard views

## Privacy

- Tracking gated by cookie consent
- Session IDs are anonymous
- Personal data only for security monitoring
- GDPR compliant

## Files Reference

| File                                | Purpose               |
| ----------------------------------- | --------------------- |
| `components/AnalyticsDashboard.tsx` | Main dashboard UI     |
| `services/sessionTracker.ts`        | Client-side tracking  |
| `services/advancedAnalytics.ts`     | Firebase queries      |
| `api/admin/analytics/*.ts`          | Backend API endpoints |

## Next Steps

1. **Initial Setup**: No configuration needed - works out of box
2. **View Dashboard**: Login to admin panel, click Analytics tab
3. **Monitor Usage**: Check daily for visitor trends
4. **Review Security**: Watch for failed login patterns
5. **Track Downloads**: Monitor file download popularity

## Quick Troubleshooting

```
No data showing?
→ Check cookie consent accepted
→ Verify Firebase credentials in .env
→ Try different time period (7/30/90 days)

Slow loading?
→ Disable auto-refresh
→ Use shorter time period (7 days)
→ Check network connection

API errors?
→ Confirm admin login
→ Check browser console
→ Refresh page and retry
```

## Related Docs

- `ANALYTICS_DASHBOARD_GUIDE.md` - Full documentation
- `MONITORING_SYSTEM_GUIDE.md` - Error monitoring
- `BACKEND_INTEGRATION_GUIDE.md` - Firebase setup
