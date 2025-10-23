// Quick test to verify Strapi connection
import { fetchCompanyStats, fetchSettings } from "./services/cms.js";

console.log("Testing Strapi connection...");

try {
  const settings = await fetchSettings();
  console.log("Settings:", settings);

  const stats = await fetchCompanyStats();
  console.log("Company Stats:", stats);
} catch (error) {
  console.error("Error:", error);
}
