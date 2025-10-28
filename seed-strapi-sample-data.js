// Seed sample Testimonials and PC Builds into Strapi via REST API
// Usage: node seed-strapi-sample-data.js

const STRAPI_URL = process.env.VITE_STRAPI_URL || "http://localhost:1338";
const STRAPI_API_TOKEN =
  process.env.VITE_STRAPI_API_TOKEN ||
  "5477f8f25008fb9702b8052028b14842910b97dc8889824f283a78746868447adbc8aebb4b62ca44befc8a24dbad92b7728b345ebe77541a029dcb36d8e337f79109e597c940c7711bb170dd75aa1ca57e667de60a21967f424ef895044e69154fe87fb7887d9fc1c94bd11af68231cf1807ad7247f96c7f637c1d2fc2be267c";

async function api(path, options = {}) {
  const url = `${STRAPI_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status} ${res.statusText} for ${url}: ${txt}`);
  }
  return res.json();
}

async function ensurePublishedCollectionItem(
  pluralApiId,
  uniqueField,
  itemData
) {
  // Try find existing by unique field (best-effort)
  try {
    const qs = new URLSearchParams();
    if (uniqueField && itemData[uniqueField] !== undefined) {
      qs.set(`filters[${uniqueField}][$eq]`, String(itemData[uniqueField]));
    }
    const list = await api(`/api/${pluralApiId}?${qs.toString()}`);
    const existing = Array.isArray(list.data) ? list.data.find(Boolean) : null;
    if (existing) {
      // Publish if needed
      if (!existing.attributes?.publishedAt) {
        await api(`/api/${pluralApiId}/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify({
            data: { publishedAt: new Date().toISOString() },
          }),
        });
      }
      return existing.id;
    }
  } catch (e) {
    // ignore search error, proceed to create
  }

  // Create new (published)
  const created = await api(`/api/${pluralApiId}`, {
    method: "POST",
    body: JSON.stringify({
      data: { ...itemData, publishedAt: new Date().toISOString() },
    }),
  });
  return created.data?.id;
}

async function seedTestimonials() {
  const items = [
    {
      customerName: "Alex Johnson",
      rating: 5,
      review:
        "Incredible build quality and performance! Everything runs flawlessly.",
      productName: "Vortex Gaming Beast",
    },
    {
      customerName: "Sarah Chen",
      rating: 5,
      review:
        "Outstanding service and fast delivery. Perfect for video editing.",
      productName: "Vortex Creator Pro",
    },
  ];

  for (const item of items) {
    const id = await ensurePublishedCollectionItem(
      "testimonials",
      "customerName",
      item
    );
    console.log(`✅ Testimonial seeded: ${item.customerName} (id=${id})`);
  }
}

async function seedPCBuilds() {
  const items = [
    {
      name: "Vortex Gaming Beast",
      description: "Ultimate 4K gaming powerhouse",
      price: 3499,
      category: "Gaming",
      featured: true,
      specs: {
        cpu: "Intel i7-13700K",
        gpu: "RTX 4080 Super",
        ram: "32GB DDR5-6000",
        storage: "1TB NVMe Gen4",
      },
      components: {
        cpu: "Intel i7-13700K",
        gpu: "NVIDIA RTX 4080 Super",
        ram: "32GB DDR5-6000",
        storage: "1TB NVMe",
        motherboard: "Z790",
        psu: "850W 80+ Gold",
        case: "Premium ATX",
        cooling: "360mm AIO",
      },
    },
    {
      name: "Vortex Creator Pro",
      description: "Professional content creation workstation",
      price: 2899,
      category: "Workstation",
      featured: true,
      specs: {
        cpu: "AMD Ryzen 9 7950X",
        gpu: "RTX 4080",
        ram: "64GB DDR5-5600",
        storage: "2TB NVMe + 4TB HDD",
      },
      components: {
        cpu: "AMD Ryzen 9 7950X",
        gpu: "NVIDIA RTX 4080",
        ram: "64GB DDR5-5600",
        storage: "2TB NVMe + 4TB HDD",
        motherboard: "X670E",
        psu: "850W 80+ Gold",
        case: "Silent ATX",
        cooling: "280mm AIO",
      },
    },
  ];

  for (const item of items) {
    const id = await ensurePublishedCollectionItem("pc-builds", "name", item);
    console.log(`✅ PC Build seeded: ${item.name} (id=${id})`);
  }
}

(async function main() {
  try {
    console.log(`🔗 Using Strapi at ${STRAPI_URL}`);
    // Quick health check to ensure Strapi is up
    const adminRes = await fetch(`${STRAPI_URL}/admin`);
    if (!adminRes.ok) {
      throw new Error(
        `Strapi not reachable at ${STRAPI_URL} (status ${adminRes.status})`
      );
    }

    await seedTestimonials();
    await seedPCBuilds();
    console.log("🎉 Seeding complete.");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exitCode = 1;
  }
})();
