// Debug Strapi Connection
console.log("🔍 Debugging Strapi Connection...");

async function debugStrapiConnection() {
  const STRAPI_URL = "http://localhost:1338";
  const STRAPI_API_TOKEN =
    "5477f8f25008fb9702b8052028b14842910b97dc8889824f283a78746868447adbc8aebb4b62ca44befc8a24dbad92b7728b345ebe77541a029dcb36d8e337f79109e597c940c7711bb170dd75aa1ca57e667de60a21967f424ef895044e69154fe87fb7887d9fc1c94bd11af68231cf1807ad7247f96c7f637c1d2fc2be267c";

  try {
    console.log("🌐 Testing basic connectivity to:", STRAPI_URL);

    // Test 1: Basic connectivity
    const healthCheck = await fetch(`${STRAPI_URL}/admin`);
    console.log("✅ Strapi server is reachable, status:", healthCheck.status);

    // Test 2: API endpoint
    const apiResponse = await fetch(
      `${STRAPI_URL}/api/page-contents?filters[pageSlug][$eq]=home&populate=*`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📡 API Response Status:", apiResponse.status);

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log("🎉 SUCCESS! Strapi API Response:", data);

      if (data.data && data.data.length > 0) {
        const pageContent = data.data[0];
        console.log("📄 Page Content Found:");
        console.log("- Hero Title:", pageContent.attributes?.heroTitle);
        console.log("- Page Slug:", pageContent.attributes?.pageSlug);
        console.log("- Full Content:", pageContent);
      } else {
        console.log("⚠️ No page content found with slug 'home'");
      }
    } else {
      console.log("❌ API Request Failed:", apiResponse.statusText);
      const errorText = await apiResponse.text();
      console.log("Error details:", errorText);
    }
  } catch (error) {
    console.error("🚨 Connection Error:", error.message);
    console.error("Make sure Strapi is running on port 1338");
  }
}

// Run the debug
debugStrapiConnection();
