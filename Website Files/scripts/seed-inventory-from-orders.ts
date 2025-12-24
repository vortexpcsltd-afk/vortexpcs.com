/**
 * Seed Inventory From Existing Orders
 *
 * Scans all orders, extracts distinct productIds, and ensures an inventory document
 * exists for each. If missing, creates with a default starting stock.
 *
 * Usage:
 *   npx tsx scripts/seed-inventory-from-orders.ts [startingStock]
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import admin from "firebase-admin";

function loadEnv() {
  const root = process.cwd();
  const localPath = path.resolve(root, ".env.local");
  const envPath = path.resolve(root, ".env");
  if (fs.existsSync(localPath)) dotenv.config({ path: localPath });
  else if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  else dotenv.config();
}

function loadServiceAccount(): any | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) return JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const tryPaths = [
    gac,
    path.resolve(process.cwd(), "config/serviceAccount.json"),
  ].filter(Boolean) as string[];
  for (const p of tryPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        return JSON.parse(raw);
      }
    } catch {}
  }
  return null;
}

function initAdmin() {
  // Note: admin.apps exists but isn't in @types/firebase-admin
  const maybeApps = (admin as any).apps; // Acceptable: Firebase Admin SDK type limitation
  if (maybeApps && maybeApps.length) return;
  const svc = loadServiceAccount();
  if (!svc)
    throw new Error(
      "Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or provide GOOGLE_APPLICATION_CREDENTIALS or config/serviceAccount.json"
    );
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}

async function main() {
  loadEnv();
  const startingStockArg = process.argv[2];
  const startingStock = startingStockArg ? parseInt(startingStockArg, 10) : 50;
  if (Number.isNaN(startingStock) || startingStock <= 0) {
    throw new Error("Invalid startingStock argument");
  }
  console.log(
    `🚀 Seeding inventory from orders (default stock=${startingStock})...`
  );
  initAdmin();
  const fdb = admin.firestore();

  const ordersSnap = await fdb.collection("orders").get();
  if (ordersSnap.empty) {
    console.log("⚠️ No orders found. Nothing to seed.");
    return;
  }
  const productIds = new Set<string>();
  for (const doc of ordersSnap.docs) {
    const data = doc.data();
    const items = (data.items || []) as Array<{ productId?: string }>;
    for (const it of items) {
      if (it.productId) productIds.add(it.productId);
    }
  }
  console.log(`🧾 Distinct productIds found: ${productIds.size}`);

  let created = 0;
  for (const pid of productIds) {
    const ref = fdb.collection("inventory").doc(pid);
    const snap = await ref.get();
    if (snap.exists) {
      console.log(`✅ Exists: ${pid}`);
      continue;
    }
    await ref.set({
      productId: pid,
      stock: startingStock,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(
      `➕ Created inventory doc for ${pid} with stock ${startingStock}`
    );
    created++;
  }

  console.log("\n📊 Summary");
  console.log(`Total productIds: ${productIds.size}`);
  console.log(`New inventory docs created: ${created}`);
  console.log(`Already existing: ${productIds.size - created}`);
  console.log(
    "\n💡 Adjust starting stock by passing an argument, e.g.  npx tsx scripts/seed-inventory-from-orders.ts 100"
  );
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
