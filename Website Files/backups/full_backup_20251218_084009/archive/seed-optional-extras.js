/**
 * Script to seed Contentful with sample optional extras data
 * Run with: node seed-optional-extras.js
 */

import contentful from "contentful-management";

// Initialize Contentful client
const MANAGEMENT_TOKEN =
  process.env.CONTENTFUL_MANAGEMENT_TOKEN || "CFPAT-your-management-token-here";
const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "a40jvx2pmnlr";

if (MANAGEMENT_TOKEN === "CFPAT-your-management-token-here") {
  console.error(
    "❌ Please set your CONTENTFUL_MANAGEMENT_TOKEN environment variable"
  );
  console.log(
    "   Get your management token from: https://app.contentful.com/spaces/a40jvx2pmnlr/settings/api-keys"
  );
  console.log("   Run: export CONTENTFUL_MANAGEMENT_TOKEN=your_token_here");
  process.exit(1);
}

const client = contentful.createClient({
  accessToken: MANAGEMENT_TOKEN,
  space: SPACE_ID,
  environment: "master",
});

// Sample optional extras data
const sampleOptionalExtras = {
  keyboard: [
    {
      extraId: "kb-1",
      name: "Corsair K100 RGB Optical",
      price: 229.99,
      category: "keyboard",
      type: "Mechanical",
      switches: "Optical",
      wireless: false,
      rgb: true,
      brand: "Corsair",
      layout: "Full-size",
      keyCount: 104,
      description:
        "Premium optical-mechanical gaming keyboard with per-key RGB and dedicated macro keys",
      rating: 4.8,
      inStock: true,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop",
      ],
    },
    {
      extraId: "kb-2",
      name: "Logitech G915 TKL Wireless",
      price: 209.99,
      category: "keyboard",
      type: "Mechanical",
      switches: "Low-Profile",
      wireless: true,
      rgb: true,
      brand: "Logitech",
      layout: "Tenkeyless",
      keyCount: 87,
      description:
        "Tenkeyless wireless mechanical keyboard with low-profile switches and long battery life",
      rating: 4.7,
      inStock: true,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop",
      ],
    },
  ],
  mouse: [
    {
      extraId: "mouse-1",
      name: "Logitech G Pro X Superlight 2",
      price: 159.99,
      category: "mouse",
      type: "Wireless",
      dpi: 32000,
      weight: 60,
      sensor: "HERO 2",
      wireless: true,
      rgb: false,
      brand: "Logitech",
      description:
        "Ultra-lightweight wireless gaming mouse with HERO 2 sensor for professional esports",
      rating: 4.9,
      inStock: true,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop",
      ],
    },
    {
      extraId: "mouse-2",
      name: "Razer Viper V3 Pro",
      price: 149.99,
      category: "mouse",
      type: "Wireless",
      dpi: 30000,
      weight: 54,
      sensor: "Focus Pro",
      wireless: true,
      rgb: true,
      brand: "Razer",
      description:
        "Ambidextrous wireless mouse with Focus Pro sensor and exceptional battery life",
      rating: 4.8,
      inStock: true,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop",
      ],
    },
  ],
  monitor: [
    {
      extraId: "mon-1",
      name: "Samsung Odyssey OLED G9",
      price: 1799.99,
      category: "monitor",
      size: 49,
      monitorResolution: "5120x1440",
      refreshRate: 240,
      panelType: "OLED",
      curved: true,
      aspectRatio: "32:9",
      brand: "Samsung",
      description:
        '49" super ultrawide OLED with 240Hz refresh rate and quantum HDR for immersive gaming',
      rating: 4.9,
      inStock: true,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
      ],
    },
    {
      extraId: "mon-2",
      name: "ASUS ROG Swift PG27AQDM",
      price: 899.99,
      category: "monitor",
      size: 27,
      monitorResolution: "2560x1440",
      refreshRate: 240,
      panelType: "OLED",
      curved: false,
      aspectRatio: "16:9",
      brand: "ASUS",
      description:
        '27" QHD OLED gaming monitor with 240Hz and 0.03ms response time',
      rating: 4.8,
      inStock: true,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
      ],
    },
  ],
  gamepad: [
    {
      extraId: "pad-1",
      name: "Xbox Elite Series 2 Core",
      price: 129.99,
      category: "gamepad",
      platform: "Multi-platform",
      wireless: true,
      batteryLife: "40 hours",
      brand: "Microsoft",
      description:
        "Premium wireless controller with adjustable tension thumbsticks and trigger locks",
      rating: 4.8,
      inStock: true,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&h=300&fit=crop",
      ],
    },
  ],
  mousepad: [
    {
      extraId: "pad-1",
      name: "Corsair MM700 RGB Extended",
      price: 79.99,
      category: "mousepad",
      size: "Extended",
      surface: "Hard",
      rgb: true,
      dimensions: "930x400mm",
      thickness: 3,
      brand: "Corsair",
      description:
        "Large RGB mousepad with hard surface and dual-sided USB passthrough",
      rating: 4.7,
      inStock: true,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop",
      ],
    },
  ],
};

async function createOptionalExtras() {
  try {
    console.log("🚀 Starting to seed optional extras in Contentful...");

    const space = await client.getSpace();
    const environment = await space.getEnvironment("master");

    // Flatten all extras into a single array
    const allExtras = Object.values(sampleOptionalExtras).flat();

    console.log(`📦 Creating ${allExtras.length} optional extras...`);

    for (const extra of allExtras) {
      try {
        console.log(`Creating: ${extra.name}`);

        const entry = await environment.createEntry("optionalExtra", {
          fields: {
            extraId: {
              "en-US": extra.extraId,
            },
            name: {
              "en-US": extra.name,
            },
            price: {
              "en-US": extra.price,
            },
            category: {
              "en-US": extra.category,
            },
            type: {
              "en-US": extra.type,
            },
            wireless: {
              "en-US": extra.wireless,
            },
            rgb: {
              "en-US": extra.rgb,
            },
            brand: {
              "en-US": extra.brand,
            },
            description: {
              "en-US": extra.description,
            },
            rating: {
              "en-US": extra.rating,
            },
            inStock: {
              "en-US": extra.inStock,
            },
            featured: {
              "en-US": extra.featured,
            },
            // Add category-specific fields
            ...(extra.switches && { switches: { "en-US": extra.switches } }),
            ...(extra.layout && { layout: { "en-US": extra.layout } }),
            ...(extra.keyCount && { keyCount: { "en-US": extra.keyCount } }),
            ...(extra.dpi && { dpi: { "en-US": extra.dpi } }),
            ...(extra.weight && { weight: { "en-US": extra.weight } }),
            ...(extra.sensor && { sensor: { "en-US": extra.sensor } }),
            ...(extra.size && { size: { "en-US": extra.size } }),
            ...(extra.monitorResolution && {
              monitorResolution: { "en-US": extra.monitorResolution },
            }),
            ...(extra.refreshRate && {
              refreshRate: { "en-US": extra.refreshRate },
            }),
            ...(extra.panelType && { panelType: { "en-US": extra.panelType } }),
            ...(extra.curved !== undefined && {
              curved: { "en-US": extra.curved },
            }),
            ...(extra.aspectRatio && {
              aspectRatio: { "en-US": extra.aspectRatio },
            }),
            ...(extra.platform && { platform: { "en-US": extra.platform } }),
            ...(extra.batteryLife && {
              batteryLife: { "en-US": extra.batteryLife },
            }),
            ...(extra.surface && { surface: { "en-US": extra.surface } }),
            ...(extra.dimensions && {
              dimensions: { "en-US": extra.dimensions },
            }),
            ...(extra.thickness && { thickness: { "en-US": extra.thickness } }),
          },
        });

        await entry.publish();
        console.log(`✅ Created and published: ${extra.name}`);
      } catch (error) {
        console.error(`❌ Failed to create ${extra.name}:`, error.message);
      }
    }

    console.log("🎉 Finished seeding optional extras!");
  } catch (error) {
    console.error("❌ Error seeding optional extras:", error);
  }
}

// Run the seeding function
createOptionalExtras();
