/**
 * Diagnostic Script: Check Orders in Firestore
 * Run with: npx tsx scripts/check-orders.ts
 */

import admin from "firebase-admin";

// Initialize Firebase Admin
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_BASE64 not set");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkOrders() {
  console.log("🔍 Checking orders in Firestore...\n");

  // Get all orders
  const ordersSnapshot = await db
    .collection("orders")
    .orderBy("orderDate", "desc")
    .limit(10)
    .get();

  console.log(`📦 Found ${ordersSnapshot.size} recent orders:\n`);

  ordersSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`Order ID: ${doc.id}`);
    console.log(`  userId: ${data.userId}`);
    console.log(`  customerEmail: ${data.customerEmail}`);
    console.log(`  customerName: ${data.customerName}`);
    console.log(`  total: £${data.total}`);
    console.log(`  status: ${data.status}`);
    console.log(`  items: ${data.items?.length || 0} items`);
    if (data.items && data.items.length > 0) {
      data.items.forEach((item: any, idx: number) => {
        console.log(
          `    ${idx + 1}. ${item.productName} x${item.quantity} @ £${
            item.price
          }`
        );
      });
    }
    console.log(
      `  orderDate: ${
        data.orderDate?.toDate?.()?.toISOString() || data.orderDate
      }`
    );
    console.log("");
  });

  // Check for specific test user
  const testUserEmail = "testaccount@vortexpcs.com";
  console.log(`\n🔍 Checking orders for ${testUserEmail}:\n`);

  const emailOrders = await db
    .collection("orders")
    .where("customerEmail", "==", testUserEmail)
    .get();

  console.log(`📧 Found ${emailOrders.size} orders by email:\n`);

  emailOrders.forEach((doc) => {
    const data = doc.data();
    console.log(`Order ID: ${doc.id}`);
    console.log(`  userId: ${data.userId}`);
    console.log(`  total: £${data.total}`);
    console.log(`  items: ${data.items?.length || 0}`);
    console.log("");
  });
}

checkOrders()
  .then(() => {
    console.log("✅ Check complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
