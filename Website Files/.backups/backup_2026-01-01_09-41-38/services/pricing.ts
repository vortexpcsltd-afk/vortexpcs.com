// Simple simulated pricing service. In production, replace with real API calls.

export interface PricingComponent {
  category: string;
  name: string;
  rationale: string;
  approxPrice?: string; // formatted like £120
}

const basePriceBook: Record<string, number> = {
  "Ryzen 5 7500F": 140,
  "RX 7600": 240,
  "16GB DDR5-5600": 60,
  "1TB NVMe Gen4": 60,
  B650: 120,
  "650W 80+ Gold": 75,
  "Airflow Mid-Tower": 70,

  "Ryzen 5 7600": 200,
  "RTX 4070": 500,
  "32GB DDR5-6000": 120,
  "2TB NVMe Gen4": 130,
  "B650 Performance": 160,
  "750W 80+ Gold Modular": 95,
  "240mm AIO": 85,

  "Intel i7-13700K": 380,
  "RTX 4080": 1050,
  "32GB DDR5-6400": 180,
  "2TB NVMe Gen4 + 2TB HDD": 190,
  Z790: 260,
  "850W 80+ Gold": 130,
  "360mm AIO": 150,

  "Ryzen 9 7950X3D": 600,
  "RTX 4090": 1500,
  "64GB DDR5-6000": 300,
  "4TB NVMe Gen4": 300,
  X670E: 350,
  "1000W 80+ Platinum": 230,
  "Custom loop / 420mm AIO": 250,
};

function format(price: number): string {
  return `£${Math.round(price)}`;
}

export async function fetchPrices(
  build: PricingComponent[]
): Promise<PricingComponent[]> {
  // Simulate latency
  await new Promise((res) => setTimeout(res, 600));

  return build.map((c) => {
    const parsed = Number(c.approxPrice?.replace(/[^\d.]/g, ""));
    const base =
      basePriceBook[c.name] ?? (isFinite(parsed) ? parsed : undefined) ?? 100;
    // Apply a tiny market variance of ±7%
    const variance = 1 + (Math.random() * 0.14 - 0.07);
    const updated = base * variance;
    return { ...c, approxPrice: `${format(updated)} (updated)` };
  });
}
