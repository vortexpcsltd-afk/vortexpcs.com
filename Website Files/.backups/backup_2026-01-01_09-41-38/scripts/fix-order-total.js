// Script to fix order total by adding shipping cost
// Run with: node scripts/fix-order-total.js

import admin from "firebase-admin";
import { readFileSync } from "fs";

// Initialize Firebase Admin
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64) {
  console.error(
    "❌ FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable not set"
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixOrderTotal(orderId) {
  try {
    console.log(`🔍 Looking for order: ${orderId}`);

    // Query by orderNumber field
    const ordersSnapshot = await db
      .collection("orders")
      .where("orderNumber", "==", orderId)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      // Try by document ID
      const docSnapshot = await db.collection("orders").doc(orderId).get();
      if (!docSnapshot.exists) {
        console.error(`❌ Order ${orderId} not found`);
        return;
      }

      const data = docSnapshot.data();
      await updateOrder(docSnapshot.ref, data);
    } else {
      const doc = ordersSnapshot.docs[0];
      const data = doc.data();
      await updateOrder(doc.ref, data);
    }
  } catch (error) {
    console.error("❌ Error fixing order:", error);
  } finally {
    process.exit(0);
  }
}

async function updateOrder(ref, data) {
  console.log("\n📋 Current order data:");
  console.log(`  Order Number: ${data.orderNumber}`);
  console.log(`  Current total: £${data.total || data.amount || 0}`);
  console.log(`  Shipping cost: £${data.shippingCost || 0}`);
  console.log(`  Shipping method: ${data.shippingMethod || "not set"}`);

  const currentTotal = data.total || data.amount || 0;
  const shippingCost = data.shippingCost || 0;

  // Calculate items subtotal
  let itemsTotal = 0;
  if (data.items && Array.isArray(data.items)) {
    itemsTotal = data.items.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 1);
    }, 0);
  }

  console.log(`  Items subtotal: £${itemsTotal}`);

  // Check if shipping is already included
  const expectedTotal = itemsTotal + shippingCost;
  console.log(`  Expected total (items + shipping): £${expectedTotal}`);

  if (Math.abs(currentTotal - expectedTotal) < 0.01) {
    console.log("✅ Total already includes shipping - no update needed");
    return;
  }

  if (Math.abs(currentTotal - itemsTotal) < 0.01 && shippingCost > 0) {
    console.log("\n⚠️  Shipping appears to be missing from total");
    const newTotal = itemsTotal + shippingCost;
    console.log(`  Updating total from £${currentTotal} to £${newTotal}`);

    await ref.update({
      total: newTotal,
      amount: newTotal, // Update both fields
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log("✅ Order total updated successfully!");
  } else {
    console.log(
      "\n❓ Unable to determine if update is needed - please review manually"
    );
  }
}

// Get order ID from command line argument
const orderId = process.argv[2] || "VPC-20251124-6548";
console.log(`\n🔧 Fixing order total for: ${orderId}\n`);

fixOrderTotal(orderId);
