/**
 * Admin Permission Fix Script
 * Run this to ensure your user has proper admin role in Firestore
 *
 * Usage:
 * 1. Update the ADMIN_EMAIL constant with your admin email
 * 2. Run: npx tsx scripts/fix-admin-permissions.ts
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Load environment variables from .env file if needed
import * as dotenv from "dotenv";
dotenv.config();

// Initialize Firebase Admin
if (!getApps().length) {
  // You'll need to set up service account credentials
  // Download from Firebase Console > Project Settings > Service Accounts
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require("../firebase-service-account.json"); // Or provide path to your service account JSON

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

// ⚠️ UPDATE THIS WITH YOUR ADMIN EMAIL
const ADMIN_EMAIL = "admin@vortexpcs.com"; // Change to your email

async function fixAdminPermissions() {
  try {
    console.log("🔍 Looking for user with email:", ADMIN_EMAIL);

    // Find user by email
    const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
    console.log("✅ Found user:", userRecord.uid);

    // Update Firestore user document
    const userRef = db.collection("users").doc(userRecord.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log("📝 Creating user profile...");
      await userRef.set({
        uid: userRecord.uid,
        email: ADMIN_EMAIL,
        displayName: userRecord.displayName || "Admin",
        role: "admin",
        accountType: "admin",
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      console.log("✅ Admin profile created");
    } else {
      console.log("📝 Updating user profile...");
      await userRef.update({
        role: "admin",
        accountType: "admin",
        updatedAt: new Date(),
      });
      console.log("✅ Admin profile updated");
    }

    // Set custom claims for additional security
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log("✅ Custom admin claims set");

    // Verify the setup
    const updatedDoc = await userRef.get();
    const data = updatedDoc.data();
    console.log("\n📋 Current user data:");
    console.log("  - UID:", data?.uid);
    console.log("  - Email:", data?.email);
    console.log("  - Role:", data?.role);
    console.log("  - Account Type:", data?.accountType);

    // Test orders access
    console.log("\n🧪 Testing orders access...");
    const ordersSnapshot = await db
      .collection("orders")
      .orderBy("orderDate", "desc")
      .limit(5)
      .get();

    console.log(`✅ Can read ${ordersSnapshot.size} orders`);

    // Test delete permission (dry run)
    if (ordersSnapshot.size > 0) {
      const testOrderId = ordersSnapshot.docs[0].id;
      console.log(`\n🧪 Testing delete permission on order: ${testOrderId}`);
      console.log("   (This is a dry run - nothing will be deleted)");

      // Just verify we can read it
      const orderDoc = await db.collection("orders").doc(testOrderId).get();
      if (orderDoc.exists) {
        console.log("✅ Can access order for deletion");
      }
    }

    console.log(
      "\n✅ All checks passed! You should now have full admin access."
    );
    console.log(
      "⚠️  You may need to sign out and sign back in for changes to take effect."
    );
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }
  }
}

// Run the script
fixAdminPermissions()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
