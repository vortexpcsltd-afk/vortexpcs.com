/**
 * Inventory Verification Script
 *
 * This script helps verify that inventory is being properly decremented
 * after orders are placed through the checkout system.
 *
 * Usage:
 * 1. Note current inventory levels before placing test order
 * 2. Place test order through checkout
 * 3. Run this script to verify inventory was decremented
 * 4. Check inventory_transactions collection for idempotency records
 */

import admin from "firebase-admin";

// Initialize Firebase Admin (same as webhook)
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  const credsBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!credsBase64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not set");
  }

  const creds = JSON.parse(
    Buffer.from(credsBase64, "base64").toString("utf-8")
  );
  admin.initializeApp({ credential: admin.credential.cert(creds) });

  return admin.firestore();
}

async function verifyInventory() {
  console.log("🔍 INVENTORY VERIFICATION SCRIPT");
  console.log("=".repeat(60));

  try {
    const db = initializeFirebase();

    // 1. Get all inventory items
    console.log("\n📦 Current Inventory Levels:");
    console.log("-".repeat(60));

    const inventorySnapshot = await db.collection("inventory").get();

    if (inventorySnapshot.empty) {
      console.log("⚠️  No inventory items found!");
      console.log("   This is expected if you haven't set up inventory yet.");
    } else {
      inventorySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  ${doc.id}:`);
        console.log(`    Stock: ${data.stock || 0}`);
        console.log(`    Last Updated: ${data.updatedAt?.toDate() || "Never"}`);
        console.log(`    Last Sale: ${data.lastSaleAt?.toDate() || "Never"}`);
        console.log();
      });
    }

    // 2. Get recent transactions
    console.log("\n💳 Recent Inventory Transactions:");
    console.log("-".repeat(60));

    const transactionsSnapshot = await db
      .collection("inventory_transactions")
      .orderBy("processedAt", "desc")
      .limit(10)
      .get();

    if (transactionsSnapshot.empty) {
      console.log("⚠️  No transactions found!");
      console.log("   Transactions are created when orders are placed.");
      console.log("   If you've placed orders, check:");
      console.log("   1. Webhook is being called");
      console.log("   2. Firebase Admin is initialized");
      console.log("   3. No errors in webhook logs");
    } else {
      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  Transaction: ${doc.id}`);
        console.log(`    Payment ID: ${data.paymentId}`);
        console.log(`    Processed: ${data.processedAt?.toDate()}`);
        console.log(`    Status: ${data.status}`);
        console.log(`    Items:`);
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            console.log(
              `      - ${item.productId}: ${item.stockBefore} → ${item.stockAfter} (ordered: ${item.quantityOrdered})`
            );
          });
        }
        console.log();
      });
    }

    // 3. Get recent orders
    console.log("\n📋 Recent Orders (Last 5):");
    console.log("-".repeat(60));

    const ordersSnapshot = await db
      .collection("orders")
      .orderBy("orderDate", "desc")
      .limit(5)
      .get();

    if (ordersSnapshot.empty) {
      console.log("⚠️  No orders found!");
    } else {
      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  Order: ${data.orderId}`);
        console.log(`    Date: ${data.orderDate?.toDate()}`);
        console.log(`    Customer: ${data.customerEmail}`);
        console.log(`    Total: £${data.total}`);
        console.log(`    Items: ${data.items?.length || 0}`);
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            console.log(
              `      - ${item.productName || item.productId} x${item.quantity}`
            );
          });
        }
        console.log();
      });
    }

    // 4. Cross-reference check
    console.log("\n🔎 Cross-Reference Check:");
    console.log("-".repeat(60));

    const recentOrderIds = ordersSnapshot.docs.map(
      (doc) => doc.data().stripeSessionId || doc.id
    );
    const transactionIds = transactionsSnapshot.docs.map((doc) => doc.id);

    console.log(`  Orders in last 5: ${recentOrderIds.length}`);
    console.log(`  Transactions recorded: ${transactionsSnapshot.size}`);

    const unmatchedOrders = recentOrderIds.filter(
      (id) => !transactionIds.includes(id)
    );
    if (unmatchedOrders.length > 0) {
      console.log("\n  ⚠️  WARNING: Orders without inventory transactions:");
      unmatchedOrders.forEach((id) => console.log(`    - ${id}`));
      console.log(
        "\n  This means inventory was NOT decremented for these orders!"
      );
      console.log("  Possible causes:");
      console.log("  1. Webhook didn't fire");
      console.log("  2. Firebase Admin not initialized in webhook");
      console.log("  3. Error during inventory processing");
      console.log("  4. Orders placed before inventory system was implemented");
    } else {
      console.log(
        "  ✅ All recent orders have corresponding inventory transactions"
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Verification complete!");
  } catch (error) {
    console.error("\n❌ Error during verification:", error);
    process.exit(1);
  }
}

// Run verification
verifyInventory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
