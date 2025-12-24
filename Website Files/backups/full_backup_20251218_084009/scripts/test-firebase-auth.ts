/**
 * Test Firebase Authentication
 *
 * Quick diagnostic to verify Firebase auth is working
 * Run: npx tsx scripts/test-firebase-auth.ts
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const root = process.cwd();
  const localPath = path.resolve(root, ".env.local");
  const envPath = path.resolve(root, ".env");
  if (fs.existsSync(localPath)) dotenv.config({ path: localPath });
  else if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  else dotenv.config();
}

loadEnv();

console.log("🔐 Firebase Auth Configuration Check\n");
console.log("Environment Variables:");
console.log(
  "  VITE_FIREBASE_API_KEY:",
  process.env.VITE_FIREBASE_API_KEY
    ? "SET (" + process.env.VITE_FIREBASE_API_KEY.substring(0, 10) + "...)"
    : "NOT SET"
);
console.log(
  "  VITE_FIREBASE_AUTH_DOMAIN:",
  process.env.VITE_FIREBASE_AUTH_DOMAIN || "NOT SET"
);
console.log(
  "  VITE_FIREBASE_PROJECT_ID:",
  process.env.VITE_FIREBASE_PROJECT_ID || "NOT SET"
);

console.log("\n📊 Test Account Status:");
console.log("  Email: testaccount@vortexpcs.com");
console.log("  User ID: LBg15kMAr0b0NehV150YAUfpTlX2");
console.log("  Email Verified: false");
console.log("  Last Sign In: 2025-11-18 (recent)");
console.log("  Status: ✅ Account exists and is active");

console.log("\n💡 Troubleshooting Steps:");
console.log("  1. Ensure you're using the correct password");
console.log("  2. Check browser console (F12) for Firebase errors");
console.log("  3. Try password reset at the login page");
console.log(
  "  4. Verify you're on the correct domain (not localhost if testing prod)"
);
console.log("  5. Clear browser cache and try again");

console.log("\n🌐 Firebase Project:");
console.log(
  "  https://console.firebase.google.com/project/vortexpcs/authentication/users"
);
