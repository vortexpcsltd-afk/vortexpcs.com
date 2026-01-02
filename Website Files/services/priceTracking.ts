/**
 * Price Tracking Service
 * Tracks component prices and sends alerts when prices drop
 */

import { logger } from "./logger";

export interface PriceAlert {
  componentId: string;
  componentName: string;
  userEmail: string;
  currentPrice: number;
  targetPrice?: number; // Alert if price drops below this
  createdAt: Date;
  lastAlertSent?: Date;
}

export interface PriceHistoryEntry {
  componentId: string;
  price: number;
  date: Date;
  source?: string;
}

/**
 * Subscribe to price alerts for a component
 */
export async function subscribeToPriceAlert(
  componentId: string,
  componentName: string,
  userEmail: string,
  currentPrice: number,
  targetPrice?: number
): Promise<void> {
  try {
    // Save to local storage as temporary solution
    const alerts = JSON.parse(localStorage.getItem("priceAlerts") || "[]");

    const alert: PriceAlert = {
      componentId,
      componentName,
      userEmail,
      currentPrice,
      targetPrice,
      createdAt: new Date(),
    };

    alerts.push(alert);
    localStorage.setItem("priceAlerts", JSON.stringify(alerts));

    logger.info("Price alert subscribed", {
      componentId,
      componentName,
      userEmail,
    });

    // In production, send to backend:
    // POST /api/price-alerts with alert data
  } catch (error) {
    logger.error("Failed to subscribe to price alert", error);
    throw error;
  }
}

/**
 * Get all price alerts for a user
 */
export function getPriceAlerts(userEmail: string): PriceAlert[] {
  try {
    const alerts = JSON.parse(localStorage.getItem("priceAlerts") || "[]");
    return alerts.filter((alert: PriceAlert) => alert.userEmail === userEmail);
  } catch (error) {
    logger.error("Failed to get price alerts", error);
    return [];
  }
}

/**
 * Remove a price alert
 */
export function removePriceAlert(componentId: string, userEmail: string): void {
  try {
    const alerts = JSON.parse(localStorage.getItem("priceAlerts") || "[]");
    const filtered = alerts.filter(
      (alert: PriceAlert) =>
        !(alert.componentId === componentId && alert.userEmail === userEmail)
    );
    localStorage.setItem("priceAlerts", JSON.stringify(filtered));

    logger.info("Price alert removed", { componentId, userEmail });
  } catch (error) {
    logger.error("Failed to remove price alert", error);
  }
}

/**
 * Record price history for analytics
 */
export function recordPriceHistory(
  componentId: string,
  price: number,
  source?: string
): void {
  try {
    const history = JSON.parse(localStorage.getItem("priceHistory") || "[]");
    const entry: PriceHistoryEntry = {
      componentId,
      price,
      date: new Date(),
      source,
    };
    history.push(entry);

    // Keep only last 90 days of history
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const filtered = history.filter(
      (h: PriceHistoryEntry) => new Date(h.date) > ninetyDaysAgo
    );

    localStorage.setItem("priceHistory", JSON.stringify(filtered));
  } catch (error) {
    logger.error("Failed to record price history", error);
  }
}

/**
 * Get price history for a component
 */
export function getPriceHistory(
  componentId: string,
  days = 30
): PriceHistoryEntry[] {
  try {
    const history = JSON.parse(localStorage.getItem("priceHistory") || "[]");
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return history.filter(
      (entry: PriceHistoryEntry) =>
        entry.componentId === componentId && new Date(entry.date) > cutoffDate
    );
  } catch (error) {
    logger.error("Failed to get price history", error);
    return [];
  }
}

/**
 * Calculate average price for a component
 */
export function getAveragePrice(componentId: string, days = 30): number {
  const history = getPriceHistory(componentId, days);
  if (history.length === 0) return 0;

  const sum = history.reduce((acc, entry) => acc + entry.price, 0);
  return sum / history.length;
}

/**
 * Get price drop percentage
 */
export function getPriceDropPercentage(
  componentId: string,
  currentPrice: number,
  days = 30
): number {
  const avgPrice = getAveragePrice(componentId, days);
  if (avgPrice === 0) return 0;

  return ((avgPrice - currentPrice) / avgPrice) * 100;
}

/**
 * Check if a price is in the lowest recent prices
 */
export function isLowestPrice(
  componentId: string,
  currentPrice: number,
  days = 30
): boolean {
  const history = getPriceHistory(componentId, days);
  if (history.length === 0) return false;

  const prices = history.map((h) => h.price);
  const lowestPrice = Math.min(...prices);

  return currentPrice <= lowestPrice;
}
