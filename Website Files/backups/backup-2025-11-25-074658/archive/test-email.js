/**
 * Email Configuration Test Script
 * Run this to verify your SMTP settings are working
 */

import dotenv from "dotenv";

// Load environment variables from .env file
const result = dotenv.config();
console.log("Dotenv result:", result);

import { testEmailConfiguration } from "./services/email.ts";

async function testEmail() {
  console.log("🧪 Testing email configuration...");

  const isConfigured = await testEmailConfiguration();

  if (isConfigured) {
    console.log("✅ Email service is properly configured!");
    console.log("📧 You can now send contact forms and order notifications.");
  } else {
    console.log("❌ Email service is not configured.");
    console.log(
      "📋 Please check your .env file and ensure these variables are set:"
    );
    console.log("   - VITE_SMTP_HOST");
    console.log("   - VITE_SMTP_PORT");
    console.log("   - VITE_SMTP_USER");
    console.log("   - VITE_SMTP_PASS");
    console.log("   - VITE_SMTP_SECURE (optional)");
    console.log("\n📖 See .env.example for configuration examples.");
  }
}

testEmail().catch(console.error);
