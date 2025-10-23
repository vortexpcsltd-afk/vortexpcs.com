// Simple test to check Strapi API response format
import axios from "axios";

const STRAPI_URL = "http://localhost:1337";
const STRAPI_API_TOKEN =
  "b5ee8c3caae8d13e9b84c3c6cd5e7dcc9c993e6ca15d5b7ff3e3f8b31b1e9d7e6b5e7f0c5c2d7e8de2ee74fbb0b3f3ddc9c2f9c6c5d0e5ef8bb5c9ee7d3f2c7e9e5c4db4";

async function testStrapiResponse() {
  try {
    console.log("Testing Strapi API response format...");

    const response = await axios.get(
      `${STRAPI_URL}/api/page-contents?filters[pageSlug][$eq]=home&populate=*`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("\n=== RAW STRAPI RESPONSE ===");
    console.log(JSON.stringify(response.data, null, 2));

    console.log("\n=== RESPONSE STRUCTURE ===");
    console.log("Type:", typeof response.data);
    console.log("Has data property:", "data" in response.data);
    console.log("Data is array:", Array.isArray(response.data.data));

    if (response.data.data && response.data.data.length > 0) {
      const firstItem = response.data.data[0];
      console.log("\n=== FIRST ITEM STRUCTURE ===");
      console.log("First item:", JSON.stringify(firstItem, null, 2));
      console.log("Has attributes:", "attributes" in firstItem);

      if (firstItem.attributes) {
        console.log("Hero title:", firstItem.attributes.heroTitle);
        console.log("Page slug:", firstItem.attributes.pageSlug);
      }
    }
  } catch (error) {
    console.error("Error testing Strapi API:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testStrapiResponse();
