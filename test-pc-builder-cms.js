// Test script to check PC Builder CMS data
import { fetchPCComponents, fetchPCOptionalExtras } from "./services/cms";

async function testCMS() {
  console.log("🔍 Testing PC Builder CMS data loading...");

  try {
    // Test PC components
    const categories = [
      "case",
      "cpu",
      "gpu",
      "ram",
      "motherboard",
      "storage",
      "psu",
      "cooling",
    ];
    for (const category of categories) {
      const components = await fetchPCComponents({ category, limit: 2 });
      console.log(`${category}: ${components.length} components`);
      if (components.length > 0) {
        console.log(
          `  Sample: ${components[0].name}, images: ${
            components[0].images?.length || 0
          }`
        );
        if (components[0].images && components[0].images.length > 0) {
          console.log(
            `  First image: ${components[0].images[0].substring(0, 50)}...`
          );
        }
      }
    }

    // Test optional extras
    const extras = await fetchPCOptionalExtras({ limit: 5 });
    console.log(`optional extras: ${extras.length} items`);
    if (extras.length > 0) {
      console.log(
        `  Sample: ${extras[0].name}, images: ${extras[0].images?.length || 0}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testCMS();
