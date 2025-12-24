import admin from "firebase-admin";

/**
 * Generate order number with customer type prefix
 * Format:
 * - Guest: VXG-YYYYMMDD-HHMM-XXXX
 * - Member: VXA-YYYYMMDD-HHMM-XXXX
 * - Business: VXB-YYYYMMDD-HHMM-XXXX
 *
 * XXXX is a yearly ascending sequence (0001-9999) that resets on January 1st each year
 */
export async function generateOrderNumber(
  userId: string,
  db?: admin.firestore.Firestore
): Promise<string> {
  const now = new Date();

  // Format date as YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Format time as HHMM
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}${minutes}`;

  // Determine customer type prefix
  let prefix = "VXG"; // Default: Guest

  if (userId && userId !== "guest" && db) {
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const accountType = userData?.accountType;

        if (accountType === "business") {
          prefix = "VXB"; // Business
        } else {
          prefix = "VXA"; // Member (general account)
        }
      }
    } catch (error) {
      console.warn(
        "Failed to fetch user account type, using guest prefix:",
        error
      );
    }
  }

  // Get ascending number from last order in the current year (resets annually)
  let sequence = 1;
  if (db) {
    try {
      // Get the start and end of current year for this prefix
      const yearStart = `${prefix}-${year}0101`; // January 1st
      const yearEnd = `${prefix}-${year + 1}0101`; // Next year January 1st

      // Query for the last order in the current year with this prefix
      const lastOrderQuery = await db
        .collection("orders")
        .where("orderNumber", ">=", yearStart)
        .where("orderNumber", "<", yearEnd)
        .orderBy("orderNumber", "desc")
        .limit(1)
        .get();

      if (!lastOrderQuery.empty) {
        const lastOrder = lastOrderQuery.docs[0].data();
        const lastOrderNumber = lastOrder.orderNumber as string;
        // Extract sequence from format: VXX-YYYYMMDD-HHMM-XXXX
        const parts = lastOrderNumber.split("-");
        if (parts.length === 4) {
          const lastSequence = parseInt(parts[3], 10);
          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch last order sequence, using 1:", error);
    }
  }

  // Format sequence as 4-digit number
  const sequenceStr = String(sequence).padStart(4, "0");

  return `${prefix}-${dateStr}-${timeStr}-${sequenceStr}`;
}
