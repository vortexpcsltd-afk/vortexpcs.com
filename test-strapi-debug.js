// Quick test script to debug Strapi content loading
import { fetchPageContent, fetchSettings } from "./services/cms.js";

console.log("🔍 Testing Strapi API calls...");

try {
  console.log('📄 Testing page content for "home"...');
  const pageContent = await fetchPageContent("home");
  console.log("Page content result:", pageContent);
  console.log("Hero title:", pageContent?.heroTitle);
  console.log("Hero subtitle:", pageContent?.heroSubtitle);

  console.log("\n⚙️ Testing site settings...");
  const settings = await fetchSettings();
  console.log("Settings result:", settings);
  console.log("Site name:", settings?.siteName);
  console.log("Tagline:", settings?.tagline);
} catch (error) {
  console.error("❌ Error testing Strapi:", error);
}
