/**
 * Verify Inventory After Last Order
 *
 * Loads the most recent order, then prints current inventory levels for its product IDs.
 * Helps confirm that stock decrement logic is working.
 *
 * Usage:
 *   npx tsx scripts/verify-inventory-after-order.ts
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
  const maybeApps = (admin as any).apps;
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
  console.log("🔎 Verifying inventory after last order...");
  initAdmin();
  const fdb = admin.firestore();

  // Fetch most recent order
  const ordersSnap = await fdb
    .collection("orders")
    .orderBy("orderDate", "desc")
    .limit(1)
    .get();

  if (ordersSnap.empty) {
    console.log("⚠️ No orders found");
    return;
  }

  const orderDoc = ordersSnap.docs[0];
  const orderData = orderDoc.data();
  const items = (orderData.items || []) as Array<{
    productId: string;
    quantity: number;
  }>;

  console.log("\n📦 Last Order");
  console.log("ID:", orderDoc.id);
  console.log("User:", orderData.userId);
  console.log("Items:", items.length);

  // For each item, fetch inventory doc
  console.log("\n📊 Inventory Check");
  for (const item of items) {
    const invRef = fdb.collection("inventory").doc(item.productId);
    const snap = await invRef.get();
    if (!snap.exists) {
      console.log(`❌ Missing inventory doc for ${item.productId}`);
      continue;
    }
    const inv = snap.data();
    console.log(
      `✅ ${item.productId}: stock=${inv?.stock} (ordered ${item.quantity})`
    );
  }

  console.log(
    "\n💡 If stock values did not decrease, ensure productId matches inventory document IDs."
  );
  console.log("💡 You may need to seed inventory: npm run seed-inventory");
}

main().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
