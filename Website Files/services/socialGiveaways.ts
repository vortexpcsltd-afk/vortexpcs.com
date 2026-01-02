/**
 * Social Micro-Giveaways - Weekly small prizes to drive engagement & UGC
 */

import { logger } from "./logger";

export interface SocialGiveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeValue: number;
  imageUrl: string;
  startDate: Date;
  endDate: Date;
  active: boolean;
  platform: "instagram" | "twitter" | "facebook" | "tiktok" | "any";
  entryMethods: {
    method: string;
    required: boolean;
  }[];
  totalEntries: number;
  winnerId?: string;
  winnerName?: string;
  winnerAnnouncedAt?: Date;
}

export interface GiveawayEntry {
  id: string;
  giveawayId: string;
  userId: string;
  userName: string;
  email: string;
  enteredAt: Date;
  socialHandle?: string;
  proofUrl?: string; // Link to post/share
}

// Mock data - In production, fetch from Firestore
const ACTIVE_GIVEAWAYS: SocialGiveaway[] = [
  {
    id: "giveaway-week-52-2025",
    title: "RTX 4060 GPU Giveaway",
    description:
      "Share your dream PC build and tag us for a chance to win an RTX 4060 graphics card!",
    prize: "NVIDIA RTX 4060 8GB",
    prizeValue: 299,
    imageUrl: "/placeholder-gpu.jpg",
    startDate: new Date("2025-12-23"),
    endDate: new Date("2025-12-30"),
    active: true,
    platform: "instagram",
    entryMethods: [
      { method: "Follow @VortexPCs on Instagram", required: true },
      { method: "Share your dream build in comments", required: true },
      { method: "Tag 2 friends who game", required: false },
      { method: "Share to your story for bonus entry", required: false },
    ],
    totalEntries: 347,
  },
  {
    id: "giveaway-week-1-2026",
    title: "New Year RGB Peripherals Pack",
    description:
      "Start 2026 right! Win a full RGB gaming peripheral set worth £150",
    prize: "RGB Keyboard, Mouse & Headset",
    prizeValue: 150,
    imageUrl: "/placeholder-peripherals.jpg",
    startDate: new Date("2025-12-30"),
    endDate: new Date("2026-01-06"),
    active: true,
    platform: "any",
    entryMethods: [
      { method: "Follow Vortex PCs on any platform", required: true },
      { method: "Post your setup with #VortexVault2026", required: true },
      { method: "Subscribe to newsletter for +2 entries", required: false },
    ],
    totalEntries: 89,
  },
];

const GIVEAWAY_ENTRIES: GiveawayEntry[] = [];

/**
 * Get active social giveaways
 */
export async function getActiveGiveaways(): Promise<SocialGiveaway[]> {
  try {
    const now = new Date();
    const active = ACTIVE_GIVEAWAYS.filter(
      (g) => g.active && now >= g.startDate && now <= g.endDate && !g.winnerId
    );

    logger.info("Fetched active giveaways", { count: active.length });
    return active;
  } catch (error) {
    logger.error("Error fetching giveaways:", error);
    return [];
  }
}

/**
 * Get past giveaways with winners
 */
export async function getPastGiveaways(limit = 10): Promise<SocialGiveaway[]> {
  const now = new Date();
  return ACTIVE_GIVEAWAYS.filter((g) => g.endDate < now || g.winnerId).slice(
    0,
    limit
  );
}

/**
 * Enter a giveaway
 */
export async function enterGiveaway(
  giveawayId: string,
  userId: string,
  userName: string,
  email: string,
  socialHandle?: string,
  proofUrl?: string
): Promise<{ success: boolean; message: string; entryId?: string }> {
  try {
    // Check if giveaway exists and is active
    const giveaway = ACTIVE_GIVEAWAYS.find((g) => g.id === giveawayId);

    if (!giveaway) {
      return { success: false, message: "Giveaway not found" };
    }

    const now = new Date();
    if (now < giveaway.startDate || now > giveaway.endDate) {
      return { success: false, message: "Giveaway is not currently active" };
    }

    // Check for duplicate entry
    const existingEntry = GIVEAWAY_ENTRIES.find(
      (e) => e.giveawayId === giveawayId && e.userId === userId
    );

    if (existingEntry) {
      return {
        success: false,
        message: "You've already entered this giveaway",
      };
    }

    // Create entry
    const entry: GiveawayEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      giveawayId,
      userId,
      userName,
      email,
      enteredAt: new Date(),
      socialHandle,
      proofUrl,
    };

    GIVEAWAY_ENTRIES.push(entry);
    giveaway.totalEntries += 1;

    logger.info("User entered giveaway", {
      giveawayId,
      userId,
      entryId: entry.id,
    });

    return {
      success: true,
      message: `You're entered to win ${giveaway.prize}! Good luck! 🎉`,
      entryId: entry.id,
    };
  } catch (error) {
    logger.error("Error entering giveaway:", error);
    return { success: false, message: "Failed to enter giveaway" };
  }
}

/**
 * Check if user has entered a specific giveaway
 */
export async function hasUserEntered(
  giveawayId: string,
  userId: string
): Promise<boolean> {
  return GIVEAWAY_ENTRIES.some(
    (e) => e.giveawayId === giveawayId && e.userId === userId
  );
}

/**
 * Get user's giveaway entries
 */
export async function getUserEntries(userId: string): Promise<GiveawayEntry[]> {
  return GIVEAWAY_ENTRIES.filter((e) => e.userId === userId);
}

/**
 * Select random winner (admin function)
 */
export async function selectWinner(
  giveawayId: string
): Promise<{ success: boolean; winner?: GiveawayEntry; message: string }> {
  try {
    const giveaway = ACTIVE_GIVEAWAYS.find((g) => g.id === giveawayId);

    if (!giveaway) {
      return { success: false, message: "Giveaway not found" };
    }

    if (giveaway.winnerId) {
      return { success: false, message: "Winner already selected" };
    }

    const entries = GIVEAWAY_ENTRIES.filter((e) => e.giveawayId === giveawayId);

    if (entries.length === 0) {
      return { success: false, message: "No entries to select from" };
    }

    // Randomly select winner
    const winner = entries[Math.floor(Math.random() * entries.length)];

    giveaway.winnerId = winner.userId;
    giveaway.winnerName = winner.userName;
    giveaway.winnerAnnouncedAt = new Date();

    logger.info("Giveaway winner selected", {
      giveawayId,
      winnerId: winner.userId,
      totalEntries: entries.length,
    });

    return {
      success: true,
      winner,
      message: `Winner selected: ${winner.userName}`,
    };
  } catch (error) {
    logger.error("Error selecting winner:", error);
    return { success: false, message: "Failed to select winner" };
  }
}
