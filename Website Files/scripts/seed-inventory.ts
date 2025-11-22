/**
 * Inventory Seeding Script
 * Initializes the inventory collection with product stock levels
 *
 * Usage: npm run ts-node scripts/seed-inventory.ts
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (credsBase64) {
    const creds = JSON.parse(
      Buffer.from(credsBase64, "base64").toString("utf-8")
    );
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    console.error(
      "❌ Firebase not configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID"
    );
    process.exit(1);
  }
}

const db = admin.firestore();

// Sample inventory data - replace with your actual product IDs
const INVENTORY_DATA = [
  // Pre-built systems
  { productId: "gaming-beast", stock: 5, name: "Gaming Beast RTX 4090" },
  { productId: "enthusiast-dream", stock: 3, name: "Enthusiast Dream" },
  { productId: "productivity-pro", stock: 10, name: "Productivity Pro" },
  { productId: "budget-builder", stock: 15, name: "Budget Builder" },

  // Components (example - add your real component IDs)
  { productId: "cpu-intel-i9-14900k", stock: 20, name: "Intel Core i9-14900K" },
  { productId: "cpu-amd-ryzen-9-7950x", stock: 15, name: "AMD Ryzen 9 7950X" },
  { productId: "gpu-rtx-4090", stock: 8, name: "NVIDIA RTX 4090" },
  { productId: "gpu-rtx-4080", stock: 12, name: "NVIDIA RTX 4080" },
  { productId: "ram-32gb-ddr5", stock: 50, name: "32GB DDR5 RAM" },
  { productId: "ssd-2tb-nvme", stock: 40, name: "2TB NVMe SSD" },
  { productId: "psu-1000w", stock: 25, name: "1000W PSU" },
  { productId: "case-nzxt-h7", stock: 18, name: "NZXT H7 Case" },

  // Generic/fallback
  { productId: "custom_build", stock: 999, name: "Custom PC Build" },
  { productId: "unknown", stock: 999, name: "Unknown Product" },
];

async function seedInventory() {
  console.log("🌱 Seeding Inventory Collection\n");
  console.log("=".repeat(60));

  try {
    const batch = db.batch();
    const timestamp = admin.firestore.Timestamp.now();

    for (const item of INVENTORY_DATA) {
      const ref = db.collection("inventory").doc(item.productId);

      // Check if already exists
      const existing = await ref.get();

      if (existing.exists) {
        console.log(
          `⏩ Skipping ${item.productId} (already exists with ${
            existing.data()?.stock || 0
          } stock)`
        );
        continue;
      }

      batch.set(ref, {
        productId: item.productId,
        productName: item.name,
        stock: item.stock,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      console.log(`✅ Added ${item.productId}: ${item.stock} units`);
    }

    await batch.commit();

    console.log("\n" + "=".repeat(60));
    console.log("✅ Inventory seeding complete!\n");

    // Show summary
    const totalDocs = await db.collection("inventory").get();
    console.log(`📊 Total inventory items: ${totalDocs.size}`);

    console.log("\n💡 NEXT STEPS:");
    console.log("1. Verify product IDs match your cart items");
    console.log("2. Update INVENTORY_DATA with your actual product IDs");
    console.log("3. Run 'npm run diagnose-checkout' to verify setup");
    console.log("4. Test an order to verify stock reduction\n");
  } catch (error) {
    console.error("\n❌ Failed to seed inventory:", error);
    process.exit(1);
  }
}

seedInventory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
