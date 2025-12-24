# PC Builder Components Enhancement Plan

## Overview

This document outlines the comprehensive improvements planned for `pcBuilderComponents.ts` to transform it from a placeholder dataset into a production-ready component database.

---

## 1. Expanded Component Variety

### Current State

- 2-3 components per category (placeholder level)

### Target State

| Category     | Current | Target | Priority |
| ------------ | ------- | ------ | -------- |
| CPUs         | 3       | 15-18  | HIGH     |
| GPUs         | 3       | 20-25  | HIGH     |
| Motherboards | 2       | 15-20  | HIGH     |
| RAM          | 2       | 10-12  | MEDIUM   |
| Storage      | 2       | 12-15  | MEDIUM   |
| PSUs         | 2       | 10-12  | MEDIUM   |
| Cooling      | 2       | 8-10   | LOW      |
| Cases        | 3       | 10-12  | LOW      |

### CPU Additions Needed

**AMD (9 additions):**

- Ryzen 9: 9950X, 9950X3D, 7950X3D, 7950X
- Ryzen 7: 9700X, 7700X, 5800X3D
- Ryzen 5: 9600X, 7600X

**Intel (6 additions):**

- Core i9: 14900K, 13900K
- Core i7: 14700K, 13700K, 12700K
- Core i5: 14600K, 13600K, 12600K, 12400F

### GPU Additions Needed

**NVIDIA (12 additions):**

- RTX 40-series: 4090, 4080 Super, 4070 Ti Super, 4070 Super, 4070, 4060 Ti 16GB, 4060 Ti 8GB, 4060
- RTX 30-series: 3090, 3080, 3070, 3060 Ti

**AMD (10 additions):**

- RX 7000: 7900 XTX, 7900 XT, 7800 XT, 7700 XT, 7600 XT, 7600
- RX 6000: 6950 XT, 6800 XT, 6700 XT, 6600 XT

### Motherboard Additions Needed

**Intel Z790/B760 (6 boards):**

- ASUS ROG Maximus Z790 Hero
- MSI MPG Z790 Carbon
- Gigabyte Z790 AORUS Elite
- ASRock Z790 Pro RS
- MSI MAG B760 Tomahawk
- ASUS TUF B760-PLUS

**AMD X670E/B650 (7 boards):**

- ASUS ROG Crosshair X670E Hero
- MSI MAG X670E Tomahawk
- Gigabyte X670 AORUS Elite
- ASRock X670E Taichi
- MSI MAG B650 Tomahawk
- ASUS TUF B650-PLUS
- Gigabyte B650 AORUS Elite

---

## 2. Enhanced CPU Properties

### New Properties to Add

```typescript
interface EnhancedCPU {
  // Existing properties remain
  id: string;
  name: string;
  price: number;
  cores: number;
  threads: number;
  socket: string;
  tdp: number;
  generation: string;
  platform: string;
  rating: number;
  description: string;
  images: string[];

  // NEW ADDITIONS
  msrp: number; // Original launch price
  baseClockSpeed: number; // GHz
  boostClockSpeed: number; // GHz
  l3Cache: number; // MB
  integratedGraphics: boolean | string; // true/false or "Radeon 610M"
  architecture: string; // "Zen 5", "Raptor Lake", etc.
  pcieLanes: number; // 20, 24, 28
  releaseYear: number; // 2024
  releaseQuarter: string; // "Q3"
  reviewCount: number; // 342
  stockStatus: "in-stock" | "low-stock" | "pre-order" | "discontinued";

  // Performance & Efficiency
  powerEfficiency?: number; // Performance-per-watt rating (1-10)
  thermalOutput: number; // Actual heat in BTU/hr

  // Market Data
  priceHistory?: {
    day30Avg: number;
    day90Low: number;
    day90High: number;
  };

  // Compatibility Warnings
  incompatibleWith?: string[]; // ["B450", "older-boards-without-bios-update"]
  recommendedPairing?: string[]; // GPU IDs that pair well
  warnings?: string[]; // ["Requires BIOS update for B650"]
}
```

**Implementation Priority: HIGH** - CPU data is critical for Kevin's Insight analysis

---

## 3. Enhanced GPU Properties

### New Properties to Add

```typescript
interface EnhancedGPU {
  // Existing
  id: string;
  name: string;
  price: number;
  vram: number;
  power: number;
  length: number;
  height: number;
  platform: string;
  performance: string;
  rating: number;
  description: string;
  images: string[];

  // NEW ADDITIONS
  msrp: number;
  architecture: string; // "Ada Lovelace", "RDNA 3"
  rayTracing: boolean;
  dlss: boolean | string; // true or "3.5"
  fsr: boolean | string; // true or "3.1"
  ports: {
    hdmi: string; // "HDMI 2.1 x2"
    displayPort: string; // "DisplayPort 1.4a x3"
  };
  maxDisplays: number;
  releaseYear: number;
  releaseQuarter: string;
  reviewCount: number;
  stockStatus: string;

  // Performance
  coreClock: number; // MHz
  boostClock: number; // MHz
  memorySpeed: number; // Gbps
  memoryBus: number; // 256-bit, 384-bit

  // Real-world benchmarks
  benchmarks?: {
    _1080p: number; // Average FPS
    _1440p: number;
    _4k: number;
    rayTracing1440p?: number;
  };

  // Power & Thermal
  actualPowerDraw: number; // Real-world watts (often differs from TDP)
  recommendedPSU: number; // 750W

  // Market
  priceHistory?: {
    day30Avg: number;
    msrpLaunch: number;
    currentVsMSRP: string; // "+15%" or "-10%"
  };

  // Bundle offers
  freeGames?: string[]; // ["Starfield", "Avatar: Frontiers"]
}
```

**Implementation Priority: HIGH** - GPU selection drives most build decisions

---

## 4. Enhanced Motherboard Properties

### New Properties to Add

```typescript
interface EnhancedMotherboard {
  // Existing
  id: string;
  name: string;
  price: number;
  formFactor: string;
  socket: string;
  chipset: string;
  ramSupport: string;
  maxRam: number;
  ramSlots: number;
  pciSlots: number;
  m2Slots: number;
  compatibility: string[];
  rating: number;
  description: string;
  images: string[];

  // NEW ADDITIONS
  msrp: number;
  reviewCount: number;
  stockStatus: string;

  // Power Delivery
  vrm: {
    phases: number; // 16+1
    rating: string; // "Excellent", "Good", "Adequate"
    maxTDP: number; // Safe CPU TDP limit
  };

  // Features
  bios: {
    flashbackSupport: boolean;
    version: string; // "v2.10"
    lastUpdate: string; // "2024-11-15"
  };
  networking: {
    ethernet: string; // "2.5Gb Intel I225-V"
    wifi: string | boolean; // "Wi-Fi 6E" or false
    bluetooth: string | boolean; // "Bluetooth 5.3" or false
  };
  audioCodec: string; // "Realtek ALC4080"

  // Connectivity
  usbPorts: {
    usb2: number;
    usb3_0: number;
    usb3_1: number;
    usb3_2: number;
    usbC: number;
    usbCGen: string; // "USB 3.2 Gen2"
  };

  // Aesthetics
  rgbHeaders: number;
  argbHeaders: number;
  color: string; // "black", "white"

  // M.2 Details
  m2Details: Array<{
    slot: number;
    interface: string; // "PCIe 5.0 x4"
    maxSpeed: string; // "14000 MB/s"
    heatsink: boolean;
  }>;

  // Warnings
  warnings?: string[]; // ["CPU power requires 8+4 pin", "Needs BIOS update for Ryzen 9000"]
}
```

**Implementation Priority: HIGH** - Motherboard compatibility is critical

---

## 5. Enhanced RAM Properties

### New Properties to Add

```typescript
interface EnhancedRAM {
  // Existing
  id: string;
  name: string;
  price: number;
  capacity: number;
  type: string;
  speed: number;
  sticks: number;
  rgb: boolean;
  compatibility: string[];
  rating: number;
  description: string;
  images: string[];

  // NEW ADDITIONS
  msrp: number;
  reviewCount: number;
  stockStatus: string;

  // Timings & Performance
  latency: string; // "CL30-36-36-76"
  voltage: number; // 1.35V
  xmpProfile: boolean;
  expoProfile: boolean; // AMD EXPO

  // Physical
  heatspreader: {
    present: boolean;
    material: string; // "Aluminum", "Copper"
    height: number; // mm
  };

  // Compatibility
  testedPlatforms: string[]; // ["Intel Z790", "AMD X670"]
  maxOverclock?: number; // 7200 MHz
}
```

**Implementation Priority: MEDIUM** - Important but less varied than CPU/GPU

---

## 6. Enhanced Storage Properties

### New Properties to Add

```typescript
interface EnhancedStorage {
  // Existing
  id: string;
  name: string;
  price: number;
  capacity: number;
  driveType: string;
  interface: string;
  readSpeed: number;
  writeSpeed: number;
  rating: number;
  description: string;
  images: string[];

  // NEW ADDITIONS
  msrp: number;
  reviewCount: number;
  stockStatus: string;

  // Endurance & Reliability
  tbw: number; // Terabytes Written (endurance)
  mtbf: number; // Mean Time Between Failures (hours)
  warrantyYears: number; // 3-5 years

  // Technical
  controller: string; // "Phison E18", "Samsung Elpis"
  dram: boolean | string; // true or "1GB DDR4"
  formFactor: string; // "M.2 2280", "2.5 inch"
  nandType: string; // "TLC", "QLC"

  // Performance Details
  iopsRead: number; // 1000K IOPS
  iopsWrite: number;
  randomRead4k: number; // MB/s
  randomWrite4k: number;

  // Price per GB
  pricePerGB: number; // Calculated
}
```

**Implementation Priority: MEDIUM**

---

## 7. Enhanced PSU Properties

### New Properties to Add

```typescript
interface EnhancedPSU {
  // Existing
  id: string;
  name: string;
  price: number;
  wattage: number;
  efficiency: string;
  modular: string;
  rating: number;
  description: string;
  length: number;
  images: string[];

  // NEW ADDITIONS
  msrp: number;
  reviewCount: number;
  stockStatus: string;

  // Power Delivery
  rails: string; // "Single +12V rail" or "Multi-rail"
  pcieCables: number; // Number of PCIe 8-pin cables
  cpuCables: number; // Number of EPS 8-pin cables
  sataConnectors: number;

  // Quality & Features
  fan: {
    size: number; // 120mm, 140mm
    zeroRPM: boolean; // Fan stops at low load
    noise: number; // dBA
  };

  // Safety
  protections: string[]; // ["OVP", "UVP", "OCP", "OTP", "SCP"]
  warranty: number; // Years

  // Certification
  cybenetics: string; // "Platinum", "Gold"
  eightyPlusCert: string; // "80+ Titanium"
}
```

**Implementation Priority: MEDIUM**

---

## 8. Enhanced Cooling Properties

### New Properties to Add

```typescript
interface EnhancedCooling {
  // Existing
  id: string;
  name: string;
  price: number;
  type: string;
  radiatorSize?: number;
  height: number;
  tdpSupport: number;
  rgb: boolean;
  rating: number;
  description: string;
  images: string[];

  // NEW ADDITIONS
  msrp: number;
  reviewCount: number;
  stockStatus: string;

  // Compatibility
  socketCompatibility: string[]; // ["AM4", "AM5", "LGA1700"]

  // Performance
  fanCount: number;
  fanSize: string; // "120mm x3" or "140mm x2"
  noise: {
    idle: number; // dBA
    load: number; // dBA
  };

  // AIO-specific
  pumpSpeed?: number; // RPM
  tubeLength?: number; // mm

  // Air cooler specific
  heatpipes?: number;
  finArray?: string; // "Dual-tower"
}
```

**Implementation Priority: LOW** - Fewer options needed

---

## 9. Enhanced Case Properties

### New Properties to Add

```typescript
interface EnhancedCase {
  // Existing
  id: string;
  name: string;
  price: number;
  formFactor: string;
  gpuClearance: string;
  coolingSupport: string;
  style: string;
  compatibility: string[];
  rating: number;
  description: string;
  maxGpuLength: number;
  maxCpuCoolerHeight: number;
  maxPsuLength: number;
  images: string[];

  // NEW ADDITIONS
  msrp: number;
  reviewCount: number;
  stockStatus: string;

  // Drive Support
  driveSupport: {
    _25inch: number; // 2.5" SSD bays
    _35inch: number; // 3.5" HDD bays
  };

  // Front Panel
  frontPanel: {
    usbA: number;
    usbC: number;
    usbCGen: string; // "USB 3.2 Gen2"
    audio: boolean;
  };

  // Physical
  dimensions: {
    width: number; // mm
    height: number;
    depth: number;
  };
  weight: number; // kg

  // Aesthetics
  sidePanelType: string; // "Tempered Glass", "Mesh", "Solid"
  color: string; // "Black", "White"

  // Included
  includedFans: {
    front: number;
    rear: number;
    top: number;
    size: string; // "120mm"
    rgb: boolean;
  };
}
```

**Implementation Priority: LOW**

---

## 10. Implementation Strategy

### Phase 1: Core Components (Week 1)

1. ✅ Create backup
2. Add enhanced CPU properties (15 CPUs)
3. Add enhanced GPU properties (20 GPUs)
4. Add enhanced Motherboard properties (15 boards)
5. Test compatibility checking

### Phase 2: Supporting Components (Week 2)

6. Add enhanced RAM properties (10 kits)
7. Add enhanced Storage properties (12 drives)
8. Add enhanced PSU properties (10 units)

### Phase 3: Aesthetics & Cooling (Week 3)

9. Add enhanced Cooling properties (8 coolers)
10. Add enhanced Case properties (10 cases)

### Phase 4: Market Data Integration (Week 4)

11. Add price history tracking
12. Add stock status monitoring
13. Add review counts and ratings
14. Add bundle/promotion data

---

## 11. Data Sources

### Pricing & Stock

- PCPartPicker API
- Scan.co.uk API
- OverclockersUK scraping
- Amazon Product Advertising API

### Technical Specs

- Manufacturer websites (ASUS, MSI, Gigabyte, etc.)
- TechPowerUp Database
- AnandTech reviews
- Tom's Hardware

### Performance Data

- UserBenchmark
- PassMark
- 3DMark results database
- Game-Debate

### User Reviews

- Amazon reviews
- Newegg reviews
- Reddit (r/buildapc, r/AMD, r/intel, r/nvidia)
- Trustpilot

---

## 12. Type Definitions Update

Create `types/pcComponents.ts` with all enhanced interfaces:

```typescript
// CPU Types
export interface CPU {
  // Core properties
  id: string;
  name: string;
  price: number;
  msrp: number;
  cores: number;
  threads: number;
  socket: string;
  tdp: number;
  baseClockSpeed: number;
  boostClockSpeed: number;
  l3Cache: number;
  integratedGraphics: boolean | string;
  generation: string;
  platform: "AMD" | "Intel";
  architecture: string;
  pcieLanes: number;
  releaseYear: number;
  releaseQuarter: string;
  rating: number;
  reviewCount: number;
  stockStatus: "in-stock" | "low-stock" | "pre-order" | "discontinued";
  description: string;
  images: string[];

  // Optional enhanced properties
  powerEfficiency?: number;
  thermalOutput?: number;
  priceHistory?: PriceHistory;
  incompatibleWith?: string[];
  recommendedPairing?: string[];
  warnings?: string[];
}

// Similar interfaces for GPU, Motherboard, RAM, Storage, PSU, Cooling, Case
// ...
```

---

## 13. Migration Notes

### Breaking Changes

- Add new required properties gradually
- Use TypeScript's `Partial<>` during migration
- Provide sensible defaults for legacy data

### Backwards Compatibility

```typescript
// Helper function to upgrade legacy components
export function upgradeLegacyComponent(
  component: LegacyComponent
): EnhancedComponent {
  return {
    ...component,
    msrp: component.price, // Default MSRP to current price
    reviewCount: 0,
    stockStatus: "in-stock",
    // ... other defaults
  };
}
```

---

## 14. Testing Checklist

### Functionality Tests

- [ ] All components render correctly
- [ ] Compatibility checking works with new properties
- [ ] Kevin's Insight uses enhanced CPU/GPU data
- [ ] Filtering works on new properties
- [ ] Price sorting includes MSRP comparison

### Performance Tests

- [ ] Component list loads in <500ms
- [ ] Filtering updates in <100ms
- [ ] No memory leaks with large dataset

### Data Quality Tests

- [ ] All prices are reasonable (£50-£2000)
- [ ] All TDP values match manufacturer specs
- [ ] All socket/chipset compatibility is correct
- [ ] All benchmark numbers are realistic

---

## 15. Future Enhancements

### Dynamic Data (Phase 5)

- Real-time price updates from APIs
- Stock level monitoring
- Automated price history tracking
- User-submitted benchmark data

### AI Integration (Phase 6)

- LLM-powered component descriptions
- Automated competitive analysis
- Smart bundling recommendations
- Predictive price trend analysis

### Community Features (Phase 7)

- User reviews and ratings
- Build photos and showcases
- Component Q&A
- Expert verified badges

---

## Conclusion

This enhancement plan transforms `pcBuilderComponents.ts` from a 10-component placeholder into a comprehensive 100+ component database with rich metadata, real-world performance data, and intelligent compatibility tracking.

**Estimated Implementation Time:** 3-4 weeks for complete rollout
**Risk Level:** Medium (requires thorough testing)
**ROI:** High (dramatically improves Kevin's Insight accuracy and user experience)

Next steps: Begin Phase 1 implementation with CPU enhancements.
