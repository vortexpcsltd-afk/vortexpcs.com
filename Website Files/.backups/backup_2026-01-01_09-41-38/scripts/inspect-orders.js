/**
 * Quick Order Inspector
 * Shows exactly what's in your orders collection
 */

// Run this in browser console on your site:

(async function inspectOrders() {
  console.log("🔍 Inspecting Orders Collection...\n");

  try {
    // Get Firebase from window (should be available on your site)
    const { db } = window;
    if (!db) {
      console.error("❌ Firebase not available. Run this on your live site.");
      return;
    }

    // Fetch recent orders
    const { collection, getDocs, query, orderBy, limit } = await import(
      "firebase/firestore"
    );
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"), limit(10));
    const snapshot = await getDocs(q);

    console.log(`Found ${snapshot.size} orders\n`);
    console.log("=".repeat(60));

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📦 ORDER #${index + 1}: ${doc.id}`);
      console.log("─".repeat(60));
      console.log("Customer:", data.customerName);
      console.log("Email:", data.customerEmail);
      console.log("Total:", `£${data.total}`);
      console.log("Status:", data.status);
      console.log("Source:", data.source || "client-side");
      console.log("\nItems:");

      if (data.items && data.items.length > 0) {
        data.items.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.productName || "NO NAME"}`);
          console.log(`     ID: ${item.productId || "NO ID"}`);
          console.log(`     Price: £${item.price}`);
          console.log(`     Quantity: ${item.quantity}`);
          console.log(`     Image: ${item.image ? "✅ YES" : "❌ NO"}`);
          if (item.image) {
            console.log(`     Image URL: ${item.image.substring(0, 50)}...`);
          }
        });
      } else {
        console.log("  ❌ NO ITEMS FOUND!");
      }

      // Check for webhook indicators
      if (data.source) {
        console.log("\n✅ Created by:", data.source);
      } else {
        console.log("\n⚠️ No source field (probably client-side)");
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY\n");

    let withImages = 0;
    let withoutImages = 0;
    let fromWebhook = 0;
    let fromClient = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.source) fromWebhook++;
      else fromClient++;

      if (data.items && data.items.length > 0) {
        if (data.items.some((i) => i.image)) withImages++;
        else withoutImages++;
      }
    });

    console.log(`Orders with images: ${withImages}`);
    console.log(`Orders without images: ${withoutImages}`);
    console.log(`From webhook: ${fromWebhook}`);
    console.log(`From client: ${fromClient}`);

    if (fromClient > fromWebhook) {
      console.log("\n⚠️ WARNING: More client-side orders than webhook orders!");
      console.log("This means webhook is NOT working properly.");
    }

    if (withoutImages > 0) {
      console.log("\n⚠️ WARNING: Some orders missing images!");
      console.log("Check if cart items have image field when added.");
    }
  } catch (error) {
    console.error("❌ Error inspecting orders:", error);
    console.log(
      "\n💡 Make sure you're running this on your live site where Firebase is loaded."
    );
  }
})();
