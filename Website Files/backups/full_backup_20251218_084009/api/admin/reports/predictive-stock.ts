import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFirestore } from "firebase/firestore";
import { generatePredictiveStockAlerts } from "../../../utils/searchDemandPredictor";
import {
  fetchPCComponents,
  fetchPCOptionalExtras,
} from "../../../services/cms";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = getFirestore();

    // Inventory lookup from CMS
    const inventoryLookup = async (
      query: string
    ): Promise<number | undefined> => {
      try {
        const [components, extras] = await Promise.all([
          fetchPCComponents({ limit: 200 }),
          fetchPCOptionalExtras({ limit: 200 }),
        ]);
        const allItems = [...(components ?? []), ...(extras ?? [])];
        const normalized = query.toLowerCase().trim();
        const match = allItems.find(
          (item) =>
            item.name?.toLowerCase().includes(normalized) ||
            item.brand?.toLowerCase().includes(normalized) ||
            item.model?.toLowerCase().includes(normalized)
        );
        return match?.stockLevel ?? (match?.inStock ? 10 : 0);
      } catch {
        return undefined;
      }
    };

    const alerts = await generatePredictiveStockAlerts(db, {
      days: 7,
      minSearches: 10,
      minWoWGrowthPct: 50,
      inventoryLookup,
    });

    res.status(200).json({
      title: "Predictive Stock Alerts (7-day)",
      count: alerts.length,
      items: alerts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? "Internal Error" });
  }
}
