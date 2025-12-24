# Competitor Price Tracking Setup Guide

## Current Status

✅ **Competitor Analysis UI**: Fully implemented and working
✅ **Manual Price Entry**: Works now - add competitors and products manually
⚠️ **Automated Scraping**: Requires backend setup (instructions below)

---

## Quick Start: Manual Tracking (No Setup Required)

1. **Open Admin Panel** → Marketing → Competitors
2. **Add Competitor**: Click "+ Add Competitor", enter name and website
3. **Add Products**: Click "Add Product" on competitor card
4. **Update Prices**: Edit products to update prices - history is tracked automatically

**Benefits**:

- Works immediately (no backend needed)
- Full price history tracking
- Price change alerts and notifications
- Market trend analysis

---

## Automated Price Tracking Setup

### Option 1: Web Scraping (Self-Hosted)

**Requirements**:

- Backend API (created at `/api/admin/competitor-tracking.ts`)
- npm package: `cheerio` for HTML parsing

**Installation**:

```bash
npm install cheerio
```

**Usage**:

```typescript
// In your CompetitorTracking component
const scrapePrice = async (url: string, selectors?: any) => {
  try {
    const response = await fetch("/api/admin/competitor-tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, selectors }),
    });

    const result = await response.json();
    if (result.success) {
      return result.data.price;
    }
  } catch (error) {
    console.error("Scraping failed:", error);
  }
};
```

**How to Find CSS Selectors**:

1. Open competitor's product page in browser
2. Press `F12` to open DevTools
3. Click the "Inspect" tool (cursor icon)
4. Click on the price element
5. Right-click in DevTools → Copy → Copy selector
6. Use that selector in the API call

**Example**:

```javascript
// PC Specialist product page
{
  "url": "https://www.pcspecialist.co.uk/gaming-pc/",
  "selectors": {
    "price": ".product-price span",
    "title": "h1.product-title",
    "availability": ".stock-status"
  }
}
```

---

### Option 2: Scheduled Price Checks (Cron Jobs)

For automatic daily/weekly price updates, set up a Vercel Cron Job:

**Create**: `/api/cron/update-competitor-prices.ts`

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify it's from Vercel Cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get all tracked products from Firebase
  // For each product:
  //   1. Scrape current price
  //   2. Compare with previous price
  //   3. Update Firebase if changed
  //   4. Send email alert if price dropped

  return res.status(200).json({ success: true });
}
```

**Configure in `vercel.json`**:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-competitor-prices",
      "schedule": "0 9 * * *" // Every day at 9 AM
    }
  ]
}
```

---

### Option 3: Third-Party APIs (Easiest)

Use existing price monitoring services:

#### **ScraperAPI** (Recommended)

- Website: https://www.scraperapi.com/
- Pricing: 1,000 requests/month free
- Handles anti-bot protection, proxies, etc.

```typescript
const scrapeWithAPI = async (url: string) => {
  const apiKey = process.env.SCRAPER_API_KEY;
  const apiUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(
    url
  )}`;

  const response = await fetch(apiUrl);
  const html = await response.text();
  // Parse HTML with cheerio
};
```

#### **Apify**

- Website: https://apify.com/
- Pre-built scrapers for major e-commerce sites
- Pricing: Free tier available

#### **Bright Data (formerly Luminati)**

- Website: https://brightdata.com/
- Enterprise-grade scraping
- Pricing: Pay-as-you-go

---

## Firebase Integration (Persistent Storage)

To store competitor data permanently (instead of localStorage):

**Create Firestore collection**:

```
/competitor-tracking
  /{competitorId}
    - name: "PC Specialist"
    - website: "https://pcspecialist.co.uk"
    - active: true
    - addedDate: timestamp

    /products (subcollection)
      /{productId}
        - name: "Gaming PC Build"
        - category: "Pre-Built PCs"
        - currentPrice: 1299.99
        - url: "https://..."
        - lastChecked: timestamp

        /price-history (subcollection)
          /{historyId}
            - price: 1299.99
            - timestamp: timestamp
```

**Update CompetitorTracking.tsx** to use Firebase instead of localStorage.

---

## Email Alerts for Price Changes

Integrate with your existing email system:

```typescript
// When price drops
if (newPrice < oldPrice) {
  await sendEmail({
    to: "admin@vortexpcs.com",
    subject: `Price Drop Alert: ${product.name}`,
    body: `
      ${competitor.name} dropped the price of "${product.name}"
      
      Old Price: £${oldPrice}
      New Price: £${newPrice}
      Savings: £${(oldPrice - newPrice).toFixed(2)} (${percentageChange}%)
      
      URL: ${product.url}
    `,
  });
}
```

---

## Legal Considerations

⚠️ **Important**: Web scraping may violate some websites' Terms of Service

**Best Practices**:

1. **Check robots.txt**: Respect crawl rules
2. **Rate Limiting**: Don't scrape too frequently (max 1x per day)
3. **User Agent**: Identify yourself in requests
4. **Public Data Only**: Only scrape publicly visible prices
5. **Alternative**: Use official APIs if available (e.g., Amazon Product API)

**Safer Alternative**: Manual price entry or competitor price matching tools like:

- Price2Spy
- Prisync
- Competera

---

## Current Features (Working Now)

✅ **Competitor Management**

- Add/edit/delete competitors
- Track multiple competitors
- Active/inactive status

✅ **Product Tracking**

- Manual price entry
- Price history (automatic)
- Category organization
- Product URLs

✅ **Price Alerts**

- Visual indicators for price drops
- Percentage change calculations
- Color-coded badges

✅ **Market Analysis**

- Popular component tracking
- Price trends (up/down/stable)
- Average price calculations
- Popularity metrics

✅ **Dashboard Stats**

- Total competitors tracked
- Total products monitored
- Active price alerts
- Market position insights

---

## Roadmap: Future Enhancements

### Phase 1 (Immediate)

- ✅ Manual price tracking (DONE)
- ✅ Price history (DONE)
- ✅ Market trends (DONE)

### Phase 2 (Backend Required)

- 🔄 Automated web scraping
- 🔄 Scheduled price updates (cron jobs)
- 🔄 Email alerts for price changes

### Phase 3 (Advanced)

- 🔄 Firebase/Firestore integration
- 🔄 Price prediction AI
- 🔄 Competitor product matching
- 🔄 Bulk import from CSV

---

## Testing the Scraper

Test the API endpoint:

```bash
# PowerShell
$body = @{
  url = "https://www.pcspecialist.co.uk/some-product"
  selectors = @{
    price = ".price"
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/competitor-tracking" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "price": 1299.99,
    "currency": "£",
    "scrapedAt": "2025-11-28T12:00:00.000Z"
  }
}
```

---

## Support

If you run into issues:

1. **Manual tracking works now** - no setup needed
2. **Automated scraping** requires backend API
3. **Check browser console** for errors when testing
4. **Test with simple sites first** before complex e-commerce sites

**Current Status**: Your Competitor Analysis feature is fully functional for manual price tracking. Automated scraping is optional and requires the backend setup described above.

---

**Document Version**: 1.0  
**Created**: November 28, 2025  
**Last Updated**: November 28, 2025
