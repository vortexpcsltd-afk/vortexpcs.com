# Real-Time Visitor Tracking

## Overview

Track visitors on your website in real-time, see what pages they're viewing, and monitor their activity as it happens.

## Features

### Client-Side Tracking

- **Automatic Session Management**: Creates unique session IDs stored in sessionStorage
- **Heartbeat System**: Sends updates every 10 seconds
- **Activity Detection**: Tracks page changes and user navigation
- **Smart Cleanup**: Removes visitor from active list on page unload

### Server-Side Management

- **30-Second Timeout**: Visitors inactive for >30 seconds are automatically removed
- **Live API Endpoint**: `/api/admin/analytics/live-visitors` for real-time data
- **Firestore Collection**: `active_visitors` stores current activity

### Dashboard Component

- **Auto-Refresh**: Updates every 5 seconds by default
- **Pause/Resume**: Control refresh behavior
- **Page Breakdown**: See which pages are most active
- **Visitor Details**:
  - Current page and activity
  - Session duration
  - Authentication status
  - Browser info
  - Location (if available)
  - Last activity timestamp

## Integration

### 1. Add to Analytics Dashboard

```tsx
import { LiveVisitors } from "../components/LiveVisitors";

// In your AnalyticsDashboard component:
<LiveVisitors />;
```

### 2. Add to Admin Panel

Add as a prominent widget in your admin overview:

```tsx
<div className="grid lg:grid-cols-2 gap-6">
  <LiveVisitors />
  {/* Other widgets */}
</div>
```

## Custom Activity Tracking

Track specific user actions:

```tsx
import { updateActivityDescription } from "../services/realtimeTracking";

// When user selects a component
updateActivityDescription("Selecting GPU: RTX 4080");

// When user views a build
updateActivityDescription("Viewing Build: Gaming Beast");

// When user adds to cart
updateActivityDescription("Adding to cart");
```

## Firestore Security Rules

Add to your `firestore.rules`:

```
match /active_visitors/{sessionId} {
  // Allow anyone to write their own session
  allow create, update: if true;
  allow delete: if true;

  // Only admins can read all visitors
  allow read: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## API Response Format

```json
{
  "success": true,
  "data": {
    "totalActive": 5,
    "visitors": [
      {
        "sessionId": "session_1234567890_abc123",
        "currentPage": "PC Builder",
        "currentActivity": "Building a custom PC",
        "lastActive": "2025-12-02T10:30:45.000Z",
        "isAuthenticated": false,
        "duration": 120,
        "userAgent": "Mozilla/5.0...",
        "location": {
          "city": "London",
          "country": "UK"
        }
      }
    ],
    "pageBreakdown": {
      "PC Builder": 2,
      "Homepage": 2,
      "PC Finder": 1
    },
    "timestamp": "2025-12-02T10:30:50.000Z"
  }
}
```

## Performance Considerations

- **Client Impact**: Minimal - one lightweight update every 10 seconds
- **Database Writes**: ~6 writes per minute per visitor
- **Query Load**: Admin dashboard queries every 5 seconds (can be adjusted)
- **Cleanup**: Automatic removal after 30 seconds of inactivity

## Privacy & GDPR

- No PII collected by default
- Session IDs are random, not personally identifiable
- Location data is optional (not implemented by default)
- Users can see they're being tracked via cookie consent

## Troubleshooting

### Visitors not showing up

1. Check Firebase is initialized: `console.log(db)`
2. Verify Firestore rules allow writes
3. Check browser console for errors
4. Ensure `startRealtimeTracking()` is called in App.tsx

### Stale visitors

- Reduce the 30-second timeout in `live-visitors.ts`
- Increase heartbeat frequency in `realtimeTracking.ts`

### High write costs

- Increase heartbeat interval (currently 10s)
- Implement write batching
- Use Firebase emulator for development

## Future Enhancements

- [ ] IP-based geolocation
- [ ] Session recording/replay
- [ ] Heatmap generation
- [ ] Conversion funnel tracking
- [ ] Live chat integration
- [ ] Visitor alerts (e.g., "VIP customer online")
- [ ] Historical session playback
