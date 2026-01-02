#!/usr/bin/env node

/**
 * Verify Contentful Dev Setup
 * Run with: node scripts/verify-contentful.js
 */

const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const spaceIdMatch = envContent.match(
  /VITE_CONTENTFUL_SPACE_ID\s*=\s*["']?([^"'\n]+)["']?/
);
const tokenMatch = envContent.match(
  /VITE_CONTENTFUL_ACCESS_TOKEN\s*=\s*["']?([^"'\n]+)["']?/
);

const spaceId = spaceIdMatch?.[1];
const token = tokenMatch?.[1];

console.log("🔍 Contentful Dev Configuration Check\n");

// Check Space ID
if (spaceId && spaceId !== "your_space_id_here") {
  console.log(`✅ Space ID configured: ${spaceId.substring(0, 8)}...`);
} else {
  console.log(`❌ Space ID not configured in .env.local`);
  console.log(`   Add: VITE_CONTENTFUL_SPACE_ID=your_space_id_here`);
}

// Check Access Token
if (token && token !== "your_delivery_api_token_here") {
  console.log(
    `✅ Access Token configured: ${token.substring(0, 8)}...${token.substring(
      token.length - 4
    )}`
  );
} else {
  console.log(`❌ Access Token not configured in .env.local`);
  console.log(`   Add: VITE_CONTENTFUL_ACCESS_TOKEN=your_token_here`);
}

// Summary
console.log("\n📋 Next Steps:");
if (spaceId && token) {
  if (
    spaceId === "your_space_id_here" ||
    token === "your_delivery_api_token_here"
  ) {
    console.log(
      "1. Replace placeholder values with actual Contentful credentials"
    );
    console.log("2. Restart dev server: npm run dev");
    console.log("3. Check browser console for success message");
  } else {
    console.log("✅ Configuration looks good! If logos aren't showing:");
    console.log("   1. Restart dev server: npm run dev");
    console.log("   2. Check browser console for load status");
    console.log("   3. Verify components have brandLogo fields in Contentful");
  }
} else {
  console.log(
    "1. Get credentials from Contentful: https://app.contentful.com/"
  );
  console.log("2. Update .env.local with Space ID and Access Token");
  console.log("3. Restart dev server: npm run dev");
}

console.log("\n📚 See CONTENTFUL_DEV_SETUP.md for detailed instructions");
