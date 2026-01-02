/**
 * Test the getUserOrders function with actual Firebase auth
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD09cMpfGDWCLxbF9zKZ5_5OgC1N5Sbu6Y",
  authDomain: "vortexpcs.firebaseapp.com",
  projectId: "vortexpcs",
  storageBucket: "vortexpcs.firebasestorage.app",
  messagingSenderId: "713595817996",
  appId: "1:713595817996:web:99f4c01a82bd85c38ac75d",
  measurementId: "G-FVPR40Y20T",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testQuery() {
  try {
    // Sign in as test user
    console.log("🔐 Signing in as testaccount@vortexpcs.com...");
    const userCred = await signInWithEmailAndPassword(
      auth,
      "testaccount@vortexpcs.com",
      "testpassword1"
    );

    console.log("✅ Signed in successfully");
    console.log("  UID:", userCred.user.uid);
    console.log("  Email:", userCred.user.email);

    // Try query by userId
    console.log("\n🔍 Querying orders by userId...");
    const primaryQ = query(
      collection(db, "orders"),
      where("userId", "==", userCred.user.uid),
      orderBy("orderDate", "desc")
    );

    const primarySnap = await getDocs(primaryQ);
    console.log(`📦 Found ${primarySnap.size} orders by userId`);

    if (primarySnap.size === 0) {
      // Try by email
      console.log("\n🔍 Querying orders by email...");
      const emailQ = query(
        collection(db, "orders"),
        where("customerEmail", "==", userCred.user.email)
      );

      const emailSnap = await getDocs(emailQ);
      console.log(`📧 Found ${emailSnap.size} orders by email`);

      if (emailSnap.size > 0) {
        console.log("\n⚠️  FOUND THE PROBLEM!");
        console.log(
          "Orders exist with this email but query by userId returned 0!"
        );
        console.log("\nFirst order details:");
        const firstDoc = emailSnap.docs[0];
        const data = firstDoc.data();
        console.log(`  Order ID: ${firstDoc.id}`);
        console.log(`  userId in Firestore: ${data.userId}`);
        console.log(`  Current user UID: ${userCred.user.uid}`);
        console.log(`  MATCH: ${data.userId === userCred.user.uid}`);
      }
    } else {
      console.log("\n✅ Orders found successfully!");
      primarySnap.forEach((doc) => {
        const data = doc.data();
        console.log(`  - ${doc.id}: £${data.total}`);
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }

  process.exit(0);
}

testQuery();
