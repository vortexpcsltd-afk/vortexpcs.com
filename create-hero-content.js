// Script to create the hero content in Strapi
import axios from "axios";

const STRAPI_URL = "http://localhost:1338";
const API_TOKEN =
  "5477f8f25008fb9702b8052028b14842910b97dc8889824f283a78746868447adbc8aebb4b62ca44befc8a24dbad92b7728b345ebe77541a029dcb36d8e337f79109e597c940c7711bb170dd75aa1ca57e667de60a21967f424ef895044e69154fe87fb7887d9fc1c94bd11af68231cf1807ad7247f96c7f637c1d2fc2be267c";

const strapiClient = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function createHeroContent() {
  try {
    console.log("🚀 Creating hero content in Strapi...");

    // Create the home page content
    const pageContentData = {
      data: {
        pageSlug: "home",
        pageTitle: "Vortex PCs - Premium Custom PC Builds",
        metaDescription:
          "Custom PC builds for gaming, workstations, and everyday use. Expert assembly, quality guarantee, fast delivery.",
        heroTitle: "PERFORMANCE THAT DOESN'T WAIT",
        heroSubtitle: "Custom PCs built for speed, power, and precision.",
        heroDescription:
          "Experience unparalleled performance with our cutting-edge custom PC builds. From budget-friendly builds to extreme gaming rigs, we deliver excellence in every component.",
        publishedAt: new Date().toISOString(),
      },
    };

    const response = await strapiClient.post("/page-contents", pageContentData);
    console.log("✅ Hero content created successfully!");
    console.log("📄 Page Content:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error creating hero content:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Create site settings as well
async function createSiteSettings() {
  try {
    console.log("⚙️ Creating site settings...");

    const settingsData = {
      data: {
        siteName: "Vortex PCs",
        tagline: "Premium Custom PC Builds",
        metaDescription:
          "Custom PC builds for gaming, workstations, and everyday use. Expert assembly, quality guarantee, fast delivery.",
        contactEmail: "info@vortexpcs.com",
        contactPhone: "01603 975440",
        enableMaintenance: false,
        enableAnnouncementBar: false,
        publishedAt: new Date().toISOString(),
      },
    };

    const response = await strapiClient.post("/site-setting", settingsData);
    console.log("✅ Site settings created successfully!");
    console.log("⚙️ Settings:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error creating site settings:",
      error.response?.data || error.message
    );
    // Don't throw for settings, it's optional
  }
}

async function main() {
  try {
    await createHeroContent();
    await createSiteSettings();
    console.log("\n🎉 All content created successfully!");
    console.log(
      '💡 The website should now show "PERFORMANCE THAT DOESN\'T WAIT" as the hero title.'
    );
  } catch (error) {
    console.error("💥 Failed to create content:", error);
    process.exit(1);
  }
}

// Run the script
main();
