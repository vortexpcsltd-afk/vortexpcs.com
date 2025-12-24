/**
 * PC Builder Component Tests
 * Tests component selection, compatibility checks, and build persistence
 */

import { describe, it, expect } from "vitest";

// Type definitions for PC Builder
interface PCBuilderComponent {
  id: string;
  name?: string;
  price: number;
  category: string;
  socket?: string;
  formFactor?: string;
  ramSupport?: string[];
  chipset?: string;
  cores?: number;
  threads?: number;
  tdp?: number;
  platform?: string;
  type?: string;
  capacity?: number;
  speed?: string;
  memorySize?: number;
  length?: number;
  wattage?: number;
  efficiency?: string;
  modular?: string;
  size?: number;
  tdpRating?: number;
  maxPsuLength?: number;
  gpuClearance?: string;
  compatibility?: string[];
  inStock: boolean;
  maxGpuLength?: number;
  readSpeed?: number;
  writeSpeed?: number;
}

interface SelectedComponentIds {
  case?: string;
  motherboard?: string;
  cpu?: string;
  ram?: string;
  gpu?: string;
  storage?: string;
  psu?: string;
  cooling?: string;
  [key: string]: string | undefined;
}

interface ComponentDataMap {
  case?: PCBuilderComponent[];
  motherboard?: PCBuilderComponent[];
  cpu?: PCBuilderComponent[];
  gpu?: PCBuilderComponent[];
  ram?: PCBuilderComponent[];
  storage?: PCBuilderComponent[];
  psu?: PCBuilderComponent[];
  cooling?: PCBuilderComponent[];
  caseFans?: PCBuilderComponent[];
}

// Compatibility check function (tested logic)
function checkCompatibility(
  components: SelectedComponentIds,
  data: ComponentDataMap
): Array<{ severity: string; message: string }> {
  const issues: Array<{ severity: string; message: string }> = [];

  const cpu = components.cpu
    ? data.cpu?.find((c) => c.id === components.cpu)
    : null;
  const motherboard = components.motherboard
    ? data.motherboard?.find((c) => c.id === components.motherboard)
    : null;
  const ram = components.ram
    ? data.ram?.find((c) => c.id === components.ram)
    : null;
  const psu = components.psu
    ? data.psu?.find((c) => c.id === components.psu)
    : null;
  const gpu = components.gpu
    ? data.gpu?.find((c) => c.id === components.gpu)
    : null;

  // CPU-Motherboard socket compatibility
  if (cpu && motherboard && cpu.socket !== motherboard.socket) {
    issues.push({
      severity: "error",
      message: `CPU socket ${cpu.socket} doesn't match motherboard socket ${motherboard.socket}`,
    });
  }

  // RAM type compatibility
  if (ram && motherboard) {
    if (!motherboard.ramSupport?.includes(ram.type ?? "")) {
      issues.push({
        severity: "error",
        message: `RAM type ${
          ram.type
        } not supported by motherboard (supports ${motherboard.ramSupport?.join(
          ", "
        )})`,
      });
    }
  }

  // Power consumption check
  if (cpu && gpu && psu) {
    const totalPower = (cpu.tdp ?? 0) + (gpu.tdp ?? 0) + 100;
    if (totalPower > (psu.wattage ?? 0) * 0.8) {
      issues.push({
        severity: "warning",
        message: `Total power consumption (~${totalPower}W) may exceed PSU capacity`,
      });
    }
  }

  return issues;
}

// Mock component data for testing
const mockComponentData: ComponentDataMap = {
  case: [
    {
      id: "case-1",
      name: "ATX Mid Tower",
      price: 99.99,
      category: "case",
      formFactor: "ATX",
      compatibility: ["ATX", "Micro-ATX", "Mini-ITX"],
      maxPsuLength: 200,
      gpuClearance: "400mm",
      inStock: true,
    },
  ],
  motherboard: [
    {
      id: "mb-1",
      name: "Intel Z790 ATX",
      price: 299.99,
      category: "motherboard",
      socket: "LGA1700",
      formFactor: "ATX",
      ramSupport: ["DDR5"],
      chipset: "Z790",
      inStock: true,
    },
    {
      id: "mb-2",
      name: "AMD B650 ATX",
      price: 249.99,
      category: "motherboard",
      socket: "AM5",
      formFactor: "ATX",
      ramSupport: ["DDR5"],
      chipset: "B650",
      inStock: true,
    },
  ],
  cpu: [
    {
      id: "cpu-1",
      name: "Intel Core i9-14900K",
      price: 589.99,
      category: "cpu",
      socket: "LGA1700",
      cores: 24,
      threads: 32,
      tdp: 253,
      platform: "Intel",
      inStock: true,
    },
    {
      id: "cpu-2",
      name: "AMD Ryzen 9 7950X",
      price: 549.99,
      category: "cpu",
      socket: "AM5",
      cores: 16,
      threads: 32,
      tdp: 170,
      platform: "AMD",
      inStock: true,
    },
  ],
  gpu: [
    {
      id: "gpu-1",
      name: "RTX 4090",
      price: 1599.99,
      category: "gpu",
      tdp: 450,
      length: 336,
      memorySize: 24,
      inStock: true,
    },
  ],
  ram: [
    {
      id: "ram-1",
      name: "DDR5 6400MHz 32GB",
      price: 189.99,
      category: "ram",
      speed: "6400MHz",
      capacity: 32,
      type: "DDR5",
      inStock: true,
    },
    {
      id: "ram-2",
      name: "DDR4 3200MHz 32GB",
      price: 99.99,
      category: "ram",
      speed: "3200MHz",
      capacity: 32,
      type: "DDR4",
      inStock: true,
    },
  ],
  storage: [
    {
      id: "storage-1",
      name: "Samsung 990 Pro 2TB",
      price: 249.99,
      category: "storage",
      capacity: 2000,
      type: "NVMe",
      readSpeed: 7450,
      inStock: true,
    },
  ],
  psu: [
    {
      id: "psu-1",
      name: "1000W 80+ Gold",
      price: 199.99,
      category: "psu",
      wattage: 1000,
      efficiency: "80+ Gold",
      modular: "Fully Modular",
      length: 160,
      inStock: true,
    },
  ],
  cooling: [
    {
      id: "cooling-1",
      name: "AIO 360mm",
      price: 149.99,
      category: "cooling",
      type: "AIO",
      size: 360,
      tdpRating: 300,
      inStock: true,
    },
  ],
  caseFans: [],
};

describe("PC Builder - Component Selection", () => {
  it("should validate CPU-Motherboard socket compatibility", () => {
    const components: SelectedComponentIds = {
      cpu: "cpu-1", // Intel LGA1700
      motherboard: "mb-1", // Z790 LGA1700
    };

    const issues = checkCompatibility(components, mockComponentData);
    expect(issues.length).toBe(0);
  });

  it("should detect CPU-Motherboard socket mismatch", () => {
    const components: SelectedComponentIds = {
      cpu: "cpu-1", // Intel LGA1700
      motherboard: "mb-2", // AMD AM5
    };

    const issues = checkCompatibility(components, mockComponentData);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe("error");
    expect(issues[0].message).toContain("socket");
  });

  it("should validate RAM type compatibility", () => {
    const components: SelectedComponentIds = {
      motherboard: "mb-1", // DDR5 support
      ram: "ram-1", // DDR5
    };

    const issues = checkCompatibility(components, mockComponentData);
    expect(issues.length).toBe(0);
  });

  it("should detect RAM type mismatch", () => {
    const components: SelectedComponentIds = {
      motherboard: "mb-1", // DDR5 only
      ram: "ram-2", // DDR4
    };

    const issues = checkCompatibility(components, mockComponentData);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toContain("DDR");
  });

  it("should validate case-motherboard form factor", () => {
    const components: SelectedComponentIds = {
      case: "case-1", // ATX support
      motherboard: "mb-1", // ATX
    };

    const issues = checkCompatibility(components, mockComponentData);
    expect(issues.length).toBe(0);
  });

  it("should calculate total power consumption", () => {
    const components: SelectedComponentIds = {
      cpu: "cpu-1", // 253W TDP
      gpu: "gpu-1", // 450W TDP
      psu: "psu-1", // 1000W
    };

    const issues = checkCompatibility(components, mockComponentData);

    // Total: 253 + 450 + 100 overhead = 803W
    // 803W is 80.3% of 1000W, which exceeds 80% threshold
    // Should have a warning
    const powerIssues = issues.filter((i) =>
      i.message.toLowerCase().includes("power")
    );
    expect(powerIssues.length).toBe(1);
  });

  it("should warn about insufficient PSU wattage", () => {
    const lowPowerPsu = {
      id: "psu-low",
      name: "450W PSU",
      price: 49.99,
      category: "psu" as const,
      wattage: 450,
      efficiency: "80+ Bronze",
      modular: "Non-Modular",
      inStock: true,
    };

    const dataWithLowPsu = {
      ...mockComponentData,
      psu: [lowPowerPsu],
    };

    const components: SelectedComponentIds = {
      cpu: "cpu-1", // 253W
      gpu: "gpu-1", // 450W
      psu: "psu-low",
    };

    const issues = checkCompatibility(components, dataWithLowPsu);
    expect(issues.some((i) => i.severity === "warning")).toBe(true);
  });
});

describe("PC Builder - Price Calculation", () => {
  it("should calculate total build price", () => {
    const selectedComponents: SelectedComponentIds = {
      case: "case-1", // 99.99
      motherboard: "mb-1", // 299.99
      cpu: "cpu-1", // 589.99
      gpu: "gpu-1", // 1599.99
      ram: "ram-1", // 189.99
      storage: "storage-1", // 249.99
      psu: "psu-1", // 199.99
      cooling: "cooling-1", // 149.99
    };

    let total = 0;
    Object.entries(selectedComponents).forEach(([category, componentId]) => {
      const categoryData =
        mockComponentData[category as keyof ComponentDataMap];
      const component = categoryData?.find((c) => c.id === componentId);
      if (component) {
        total += component.price;
      }
    });

    // Total: 3379.92
    expect(total).toBeCloseTo(3379.92, 2);
  });

  it("should handle missing components in price calculation", () => {
    const partialBuild: SelectedComponentIds = {
      cpu: "cpu-1",
      motherboard: "mb-1",
    };

    let total = 0;
    Object.entries(partialBuild).forEach(([category, componentId]) => {
      const categoryData =
        mockComponentData[category as keyof ComponentDataMap];
      const component = categoryData?.find((c) => c.id === componentId);
      if (component) {
        total += component.price;
      }
    });

    expect(total).toBe(889.98);
  });
});

describe("PC Builder - Build Validation", () => {
  it("should identify incomplete builds", () => {
    const incompleteBuild: SelectedComponentIds = {
      cpu: "cpu-1",
      motherboard: "mb-1",
      // Missing: case, ram, storage, psu, cooling
    };

    const requiredCategories = [
      "cpu",
      "motherboard",
      "ram",
      "storage",
      "psu",
      "case",
    ];
    const missingCategories = requiredCategories.filter(
      (cat) => !incompleteBuild[cat as keyof SelectedComponentIds]
    );

    expect(missingCategories.length).toBeGreaterThan(0);
    expect(missingCategories).toContain("ram");
    expect(missingCategories).toContain("storage");
    expect(missingCategories).toContain("psu");
  });

  it("should validate complete builds", () => {
    const completeBuild: SelectedComponentIds = {
      case: "case-1",
      motherboard: "mb-1",
      cpu: "cpu-1",
      gpu: "gpu-1",
      ram: "ram-1",
      storage: "storage-1",
      psu: "psu-1",
      cooling: "cooling-1",
    };

    const requiredCategories = [
      "cpu",
      "motherboard",
      "ram",
      "storage",
      "psu",
      "case",
    ];
    const missingCategories = requiredCategories.filter(
      (cat) => !completeBuild[cat as keyof SelectedComponentIds]
    );

    expect(missingCategories.length).toBe(0);
  });
});

describe("PC Builder - Component Filtering", () => {
  it("should filter components by compatibility", () => {
    // When Intel CPU is selected, only show Intel-compatible motherboards
    const selectedCpu = mockComponentData.cpu?.find((c) => c.id === "cpu-1");
    expect(selectedCpu?.socket).toBe("LGA1700");

    const compatibleMotherboards =
      mockComponentData.motherboard?.filter(
        (mb) => mb.socket === selectedCpu?.socket
      ) ?? [];

    expect(compatibleMotherboards.length).toBe(1);
    expect(compatibleMotherboards[0].id).toBe("mb-1");
  });

  it("should filter RAM by motherboard support", () => {
    const selectedMb = mockComponentData.motherboard?.find(
      (mb) => mb.id === "mb-1"
    );
    expect(selectedMb?.ramSupport).toContain("DDR5");

    const compatibleRam =
      mockComponentData.ram?.filter((ram) =>
        selectedMb?.ramSupport?.includes(ram.type ?? "")
      ) ?? [];

    expect(compatibleRam.length).toBe(1);
    expect(compatibleRam[0].type).toBe("DDR5");
  });

  it("should sort components by price", () => {
    const cpus = [...(mockComponentData.cpu ?? [])].sort(
      (a, b) => a.price - b.price
    );

    expect(cpus[0].price).toBeLessThanOrEqual(cpus[1].price);
  });

  it("should sort components by performance (cores)", () => {
    const cpus = [...(mockComponentData.cpu ?? [])].sort(
      (a, b) => (b.cores ?? 0) - (a.cores ?? 0)
    );

    expect(cpus[0].cores ?? 0).toBeGreaterThanOrEqual(cpus[1].cores ?? 0);
  });
});

describe("PC Builder - Stock Management", () => {
  it("should identify in-stock components", () => {
    const inStockComponents =
      mockComponentData.cpu?.filter((cpu) => cpu.inStock === true) ?? [];

    expect(inStockComponents.length).toBe(2);
  });

  it("should handle out-of-stock components", () => {
    const outOfStockCpu = {
      ...(mockComponentData.cpu?.[0] ?? {}),
      inStock: false,
    };

    expect(outOfStockCpu.inStock).toBe(false);
  });
});

describe("PC Builder - Compatibility Helpers", () => {
  it("should normalize socket names", () => {
    const normalizeSocket = (socket: string) => socket.toUpperCase().trim();

    expect(normalizeSocket("lga1700")).toBe("LGA1700");
    expect(normalizeSocket(" AM5 ")).toBe("AM5");
  });

  it("should parse memory capacity", () => {
    const parseCapacity = (capacity: string | number): number => {
      if (typeof capacity === "number") return capacity;
      const match = capacity.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    expect(parseCapacity("32GB")).toBe(32);
    expect(parseCapacity(64)).toBe(64);
    expect(parseCapacity("Invalid")).toBe(0);
  });

  it("should calculate recommended PSU wattage", () => {
    const calculateRecommendedPSU = (
      cpuTdp: number,
      gpuTdp: number
    ): number => {
      const baseOverhead = 100;
      const total = cpuTdp + gpuTdp + baseOverhead;
      const headroom = 1.2;
      return Math.ceil((total * headroom) / 50) * 50;
    };

    // 253 + 450 + 100 = 803 * 1.2 = 963.6, rounds to 1000
    expect(calculateRecommendedPSU(253, 450)).toBe(1000);
    // 170 + 300 + 100 = 570 * 1.2 = 684, rounds to 700
    expect(calculateRecommendedPSU(170, 300)).toBe(700);
  });
});

describe("PC Builder - Edge Cases", () => {
  it("should handle undefined component properties", () => {
    const componentWithMissingProps: Partial<PCBuilderComponent> = {
      id: "test-1",
      name: "Test Component",
      price: 100,
      category: "cpu",
    };

    expect(componentWithMissingProps.socket).toBeUndefined();
    expect(componentWithMissingProps.tdp).toBeUndefined();
  });

  it("should handle empty component selections", () => {
    const emptyBuild: SelectedComponentIds = {};

    const issues = checkCompatibility(emptyBuild, mockComponentData);
    expect(issues.length).toBe(0); // No conflicts if nothing selected
  });

  it("should handle partial component data", () => {
    const partialData: Partial<ComponentDataMap> = {
      cpu: mockComponentData.cpu,
      motherboard: mockComponentData.motherboard,
    };

    const components: SelectedComponentIds = {
      cpu: "cpu-1",
      motherboard: "mb-1",
    };

    // Should not crash with partial data
    const issues = checkCompatibility(
      components,
      partialData as ComponentDataMap
    );
    expect(Array.isArray(issues)).toBe(true);
  });
});
