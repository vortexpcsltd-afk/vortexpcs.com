/**
 * Emergency IP Unblock Script
 * Run this to unblock your current IP from the security system
 */

import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Load environment variables
function loadEnv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envLocalPath = path.resolve(__dirname, "../.env.local");

  if (fs.existsSync(envLocalPath)) {
    console.log("✅ Loading from .env.local");
    dotenv.config({ path: envLocalPath });
  } else {
    console.log("⚠️  No .env.local found, using process.env");
  }
}

loadEnv();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(
    process.cwd(),
    "config",
    "serviceAccount.json"
  );

  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log("✅ Using FIREBASE_SERVICE_ACCOUNT_BASE64 from env");
    const serviceAccount = JSON.parse(
      Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        "base64"
      ).toString()
    );
    credential = admin.credential.cert(serviceAccount);
  } else if (fs.existsSync(serviceAccountPath)) {
    console.log("✅ Using serviceAccount.json");
    credential = admin.credential.cert(serviceAccountPath);
  } else {
    throw new Error(
      "❌ No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or create config/serviceAccount.json"
    );
  }

  admin.initializeApp({ credential });
}

const db = admin.firestore();

async function unblockAllIps() {
  try {
    console.log("🔍 Looking for blocked IPs...");

    const securityDoc = await db.collection("security").doc("ip_blocks").get();

    if (!securityDoc.exists) {
      console.log("✅ No IP blocks found. You're all clear!");
      return;
    }

    const data = securityDoc.data();
    const blocked = data?.blocked || {};
    const attempts = data?.attempts || {};

    const blockedIps = Object.keys(blocked);

    if (blockedIps.length === 0) {
      console.log("✅ No IP addresses are currently blocked.");
      return;
    }

    console.log(`\n📋 Found ${blockedIps.length} blocked IP(s):`);
    blockedIps.forEach((ip) => {
      console.log(
        `   - ${ip} (blocked at: ${new Date(blocked[ip]).toLocaleString()})`
      );
    });

    console.log("\n🔓 Unblocking all IPs...");

    // Clear all blocks and reset attempts
    await db.collection("security").doc("ip_blocks").set({
      blocked: {},
      attempts: {},
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ All IPs have been unblocked!");
    console.log("✅ All login attempts have been reset!");
    console.log("\n💡 You can now try logging in again.");
  } catch (error) {
    console.error("❌ Error unblocking IPs:", error);
    throw error;
  }
}

// Run the script
unblockAllIps()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
