// Check rate limit documents in Firestore
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "",
    "base64"
  ).toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkRateLimits() {
  try {
    const snapshot = await db
      .collection("rate_limits")
      .orderBy("windowEnd", "desc")
      .limit(10)
      .get();

    console.log(`\nFound ${snapshot.size} rate limit documents:\n`);

    if (snapshot.empty) {
      console.log("No rate limit documents found.");
      console.log("\nThis means either:");
      console.log(
        "1. No API requests have been made to rate-limited endpoints"
      );
      console.log(
        "2. All rate limit documents have expired and been cleaned up"
      );
      console.log(
        "3. The rate limiter is not running (missing Firebase credentials in production)"
      );
    } else {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const windowEnd = new Date(data.windowEnd);
        const now = new Date();
        const expired = windowEnd < now;

        console.log(`IP: ${doc.id}`);
        console.log(`  Count: ${data.count}/${data.maxRequests}`);
        console.log(
          `  Window ends: ${windowEnd.toISOString()} ${
            expired ? "(expired)" : "(active)"
          }`
        );
        console.log(`  Blocked: ${data.blocked || false}`);
        console.log(`  Violations: ${data.violations || 0}`);
        console.log("");
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking rate limits:", error);
    process.exit(1);
  }
}

checkRateLimits();
