import type { VercelRequest, VercelResponse } from "@vercel/node";

interface ScrapeRequest {
  url: string;
  selectors?: {
    price?: string;
    title?: string;
    availability?: string;
  };
}

interface ScrapeResult {
  success: boolean;
  data?: {
    price: number;
    title?: string;
    currency?: string;
    availability?: string;
    scrapedAt: string;
  };
  error?: string;
}

/**
 * Scrape competitor product prices
 * POST /api/admin/competitor-tracking
 *
 * Body:
 * {
 *   "url": "https://competitor.com/product",
 *   "selectors": {
 *     "price": ".product-price",  // CSS selector for price
 *     "title": "h1.product-title",
 *     "availability": ".stock-status"
 *   }
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, selectors }: ScrapeRequest = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Check if cheerio is installed (optional dependency)
    let cheerio: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      cheerio = await import("cheerio");
    } catch (error) {
      return res.status(501).json({
        error:
          "Web scraping not available. Install cheerio: npm install cheerio",
        details:
          "The cheerio library is required for automated price scraping.",
      });
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract price using provided selector or common patterns
    let priceText = "";
    if (selectors?.price) {
      priceText = $(selectors.price).first().text();
    } else {
      // Try common price selectors
      const commonSelectors = [
        '[data-testid="product-price"]',
        ".price",
        ".product-price",
        '[itemprop="price"]',
        ".sale-price",
        ".current-price",
      ];

      for (const selector of commonSelectors) {
        priceText = $(selector).first().text();
        if (priceText) break;
      }
    }

    // Parse price from text (handles £1,299.99, $1299, €1.299,99, etc.)
    const priceMatch = priceText.match(/[\d,\.]+/);
    if (!priceMatch) {
      return res.status(400).json({
        error:
          "Could not extract price from page. Try providing a specific CSS selector.",
        html: html.substring(0, 500), // Return first 500 chars for debugging
      });
    }

    const price = parseFloat(priceMatch[0].replace(/,/g, ""));

    // Extract currency
    const currencyMatch = priceText.match(/[£$€]/);
    const currency = currencyMatch ? currencyMatch[0] : "£";

    // Extract title if selector provided
    let title: string | undefined;
    if (selectors?.title) {
      title = $(selectors.title).first().text().trim();
    }

    // Extract availability if selector provided
    let availability: string | undefined;
    if (selectors?.availability) {
      availability = $(selectors.availability).first().text().trim();
    }

    const result: ScrapeResult = {
      success: true,
      data: {
        price,
        currency,
        title,
        availability,
        scrapedAt: new Date().toISOString(),
      },
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Scraping error:", error);
    return res.status(500).json({
      error: "Failed to scrape product",
      details: error.message,
    });
  }
}
