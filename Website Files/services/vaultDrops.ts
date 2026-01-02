/**
 * Seasonal Vault Drops - Limited exclusive bundles for Silver+ members
 */

import { logger } from "./logger";
import type { VortexVaultTierId } from "./vortexVault";

export interface VaultDrop {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  savings: number;
  requiredTier: VortexVaultTierId;
  availableQuantity: number;
  totalQuantity: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
  items: {
    name: string;
    quantity: number;
  }[];
  highlights: string[];
}

// Mock data - In production, fetch from Firestore
const VAULT_DROPS: VaultDrop[] = [
  {
    id: "drop-winter-2025",
    title: "Winter Performance Bundle",
    description:
      "Ultimate gaming setup with RTX 4080 Super, Ryzen 9 7950X3D, and premium peripherals",
    imageUrl: "/placeholder-bundle.jpg",
    price: 2499,
    originalPrice: 2999,
    savings: 500,
    requiredTier: "silver",
    availableQuantity: 15,
    totalQuantity: 25,
    startDate: new Date("2025-12-20"),
    endDate: new Date("2026-01-15"),
    active: true,
    items: [
      { name: "RTX 4080 Super Gaming PC", quantity: 1 },
      { name: '27" 1440p 165Hz Monitor', quantity: 1 },
      { name: "Mechanical Gaming Keyboard", quantity: 1 },
      { name: "Wireless Gaming Mouse", quantity: 1 },
      { name: "RGB Mousepad", quantity: 1 },
    ],
    highlights: [
      "£500 savings vs buying separately",
      "Free premium shipping",
      "Extended 3-year warranty",
      "Priority build queue",
    ],
  },
  {
    id: "drop-creator-2026",
    title: "Creator's Dream Bundle",
    description:
      "Professional content creation workstation with 4090, 64GB RAM, and studio-grade peripherals",
    imageUrl: "/placeholder-bundle.jpg",
    price: 3999,
    originalPrice: 4799,
    savings: 800,
    requiredTier: "gold",
    availableQuantity: 5,
    totalQuantity: 10,
    startDate: new Date("2025-12-28"),
    endDate: new Date("2026-01-31"),
    active: true,
    items: [
      { name: "RTX 4090 Workstation PC (64GB RAM)", quantity: 1 },
      { name: '32" 4K UHD Professional Monitor', quantity: 2 },
      { name: "Studio Mic & Audio Interface", quantity: 1 },
      { name: "Ergonomic Keyboard & Mouse", quantity: 1 },
    ],
    highlights: [
      "£800 exclusive member savings",
      "White glove delivery & setup",
      "Lifetime priority support",
      "Free software bundle worth £200",
    ],
  },
];

/**
 * Get active vault drops for user's tier
 */
export async function getActiveVaultDrops(
  userTier: VortexVaultTierId
): Promise<VaultDrop[]> {
  try {
    const now = new Date();
    const tierPriority = { bronze: 0, silver: 1, gold: 2 };

    const drops = VAULT_DROPS.filter((drop) => {
      // Check if drop is active and within date range
      const isActive =
        drop.active && now >= drop.startDate && now <= drop.endDate;
      const hasStock = drop.availableQuantity > 0;
      const hasAccess =
        tierPriority[userTier] >= tierPriority[drop.requiredTier];

      return isActive && hasStock && hasAccess;
    });

    logger.info("Fetched vault drops", { userTier, count: drops.length });
    return drops;
  } catch (error) {
    logger.error("Error fetching vault drops:", error);
    return [];
  }
}

/**
 * Get single vault drop by ID
 */
export async function getVaultDropById(id: string): Promise<VaultDrop | null> {
  const drop = VAULT_DROPS.find((d) => d.id === id);
  return drop || null;
}

/**
 * Reserve vault drop for user (decrement quantity)
 */
export async function reserveVaultDrop(
  dropId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const drop = VAULT_DROPS.find((d) => d.id === dropId);

    if (!drop) {
      return { success: false, message: "Vault drop not found" };
    }

    if (drop.availableQuantity <= 0) {
      return { success: false, message: "Vault drop sold out" };
    }

    // In production: Update Firestore atomically
    drop.availableQuantity -= 1;

    logger.info("Vault drop reserved", {
      dropId,
      userId,
      remaining: drop.availableQuantity,
    });

    return {
      success: true,
      message: `Reserved ${drop.title}! ${drop.availableQuantity} remaining.`,
    };
  } catch (error) {
    logger.error("Error reserving vault drop:", error);
    return { success: false, message: "Failed to reserve vault drop" };
  }
}

/**
 * Get upcoming vault drops (preview)
 */
export async function getUpcomingVaultDrops(): Promise<VaultDrop[]> {
  const now = new Date();
  return VAULT_DROPS.filter((drop) => drop.startDate > now && drop.active);
}
