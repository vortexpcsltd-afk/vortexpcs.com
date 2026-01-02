import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "",
    "base64"
  ).toString("utf-8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function resetDatabase() {
  console.log("🔄 Starting database reset...\n");

  try {
    // Collections to reset
    const collectionsToReset = [
      "orders",
      "analytics",
      "pageViews",
      "userSessions",
      "cartEvents",
      "checkoutEvents",
      "purchaseEvents",
    ];

    for (const collectionName of collectionsToReset) {
      console.log(`📦 Checking collection: ${collectionName}`);
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        console.log(`  ✓ Collection '${collectionName}' is already empty`);
        continue;
      }

      console.log(
        `  🗑️  Deleting ${snapshot.size} documents from '${collectionName}'...`
      );

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      let deletedCount = 0;

      while (true) {
        const batch = db.batch();
        const docs = await collectionRef.limit(batchSize).get();

        if (docs.empty) break;

        docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += docs.size;
        console.log(`  ⏳ Deleted ${deletedCount} documents so far...`);

        if (docs.size < batchSize) break;
      }

      console.log(
        `  ✅ Successfully deleted all ${deletedCount} documents from '${collectionName}'`
      );
    }

    console.log("\n✅ Database reset completed successfully!");
    console.log("\n📊 Summary:");
    console.log("  • All test orders cleared");
    console.log("  • All analytics data reset");
    console.log("  • All page view data cleared");
    console.log("  • All session data cleared");
    console.log("  • All cart/checkout events cleared");
    console.log("\n🎉 Your database is now ready for production!");
  } catch (error) {
    console.error("\n❌ Error resetting database:", error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
