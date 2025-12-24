# Competitive Context - Quick Reference Guide

**File**: `components/data/competitiveContext.ts`  
**Purpose**: Provide Kevin-style comparative analysis for PC components  
**Status**: ⚠️ Good foundation, needs expansion

---

## Current State (December 2025)

### ✅ What's Working

| Component       | Models Covered                       | Quality            |
| --------------- | ------------------------------------ | ------------------ |
| **GPUs**        | 10 models (RTX 40/RX 7000)           | ⭐⭐⭐⭐ Excellent |
| **CPUs**        | 11 models (Ryzen 7000/Intel 13-14th) | ⭐⭐⭐⭐ Excellent |
| **RAM**         | 3 capacity tiers                     | ⭐⭐⭐ Good        |
| **Storage**     | ❌ Not implemented                   | -                  |
| **Cooling**     | ❌ Not implemented                   | -                  |
| **PSU**         | ❌ Not implemented                   | -                  |
| **Motherboard** | ❌ Not implemented                   | -                  |
| **Case**        | ❌ Not implemented                   | -                  |

**Coverage**: 3 out of 8 component types = 38%

---

## Critical Gaps

### 🔴 High Priority Issues

1. **Static Pricing**

   - Hardcoded prices like "£600+ premium"
   - No real-time market data integration
   - Missing competitor price comparisons

2. **Limited Component Types**

   - Storage/Cooling/PSU completely missing
   - These are critical purchasing decisions

3. **No Market Intelligence**
   - No seasonal buying advice
   - No stock availability warnings
   - No price trend analysis

### 🟡 Medium Priority Gaps

4. **Missing Generational Context**

   - When is last-gen better value?
   - Used market opportunities

5. **No TCO Analysis**

   - Electricity costs ignored
   - Long-term ownership not considered

6. **Incomplete Model Coverage**
   - Missing budget GPUs (RX 7600, RTX 4060 variants)
   - Missing previous-gen value picks (5800X3D)

---

## Implementation Roadmap

### 🚀 Quick Wins (This Week)

**1. Add Storage Comparisons** (30 min)

```typescript
case "storage":
  return getStorageComparisons(currentComponent);
```

**2. Expand GPU Coverage** (1 hour)

- Add: RTX 4070 Ti Super, 4060 Ti 16GB, RX 7600 XT/7600
- Add: Intel Arc A770, A750
- Add: Previous gen (RTX 3060 Ti, 3070, 3080)

**3. Add Price Variables** (30 min)

```typescript
// Instead of hardcoded:
"£600+ premium"// Use template:
`£${price - alternativePrice} premium`;
```

### 📅 Week 1-2: Core Expansion

**4. Storage Comparisons Module**

- Gen5 vs Gen4 vs Gen3 analysis
- Capacity vs speed trade-offs
- SATA SSD warnings

**5. Cooling Comparisons Module**

- AIO vs Air cooling
- Radiator size vs CPU TDP
- Overkill/insufficient warnings

**6. PSU Comparisons Module**

- Wattage headroom analysis
- Efficiency tier ROI
- Modular vs non-modular

**7. Real-Time Pricing Integration**

- Connect to competitor tracking system
- Add `marketData` to Component interface
- Display actual current prices

### 📅 Week 3-4: Advanced Features

**8. TCO Analysis**

- Electricity cost calculator
- 5-year ownership projections
- Efficiency comparison

**9. Generational Context**

- Old vs new value analysis
- Used market guidance
- Upgrade path planning

**10. Regional Market Intelligence**

- UK-specific pricing trends
- Best local retailers
- Seasonal buying advice

### 📅 Week 5+: Polish

**11. Future-Proof Scoring**

- Quantitative 0-100 rating
- Component longevity prediction

**12. Motherboard/Case Comparisons**

- Chipset tier analysis
- VRM quality validation
- Airflow vs aesthetics

---

## Data Architecture

### Current Interface (Limited)

```typescript
interface Component {
  name?: string;
  speed?: string | number;
  interface?: string;
}
```

### Enhanced Interface (Proposed)

```typescript
interface ComponentWithMarketData extends Component {
  // Existing fields...

  marketData?: {
    currentPrice: number;
    priceHistory: { date: string; price: number }[];
    availability: "in-stock" | "low-stock" | "pre-order" | "discontinued";
    retailers: {
      name: string;
      price: number;
      shipping: number;
      url: string;
    }[];
  };

  competitiveData?: {
    alternatives: {
      name: string;
      price: number;
      performance: number;
      value: number; // Performance per £
    }[];
    marketPosition: "budget" | "value" | "premium" | "flagship";
    generationStatus: "current" | "previous" | "obsolete";
  };

  tcoData?: {
    powerConsumption: number; // Watts
    annualElectricityCost: number; // £
    thermalOutput: "low" | "moderate" | "high" | "extreme";
    coolingRequired: string; // "120mm AIO minimum"
  };
}
```

---

## Integration Points

### Existing Systems to Leverage

1. **Competitor Tracking** (`COMPETITOR_TRACKING_SETUP.md`)

   - Already scrapes Scan, Overclockers, PC Specialist
   - Has price history tracking
   - Can feed real-time pricing

2. **Component Database** (`pcBuilderComponents.ts`)

   - Already has base prices
   - Extend with market data fields

3. **Kevin's Insight Core** (`PCBuilder.tsx` lines 6076-6084)
   ```typescript
   const gpuComparisons = getCompetitiveContext("gpu", gpu);
   const cpuComparisons = getCompetitiveContext("cpu", cpu);
   const ramComparisons = getCompetitiveContext("ram", ram, ramCap);
   ```
   - Add: storage, cooling, psu, motherboard

---

## Success Metrics

### Track These KPIs

| Metric             | Current     | Target     | How to Measure         |
| ------------------ | ----------- | ---------- | ---------------------- |
| Component Coverage | 38% (3/8)   | 100% (8/8) | Types with comparisons |
| Model Coverage     | ~20 models  | 80+ models | GPU/CPU variants       |
| Price Accuracy     | Static text | Real-time  | API integration        |
| Engagement         | ❓ Unknown  | 60%+ read  | Analytics click rate   |
| Conversion Impact  | ❓ Unknown  | +15-25%    | A/B testing            |
| Support Tickets    | Baseline    | -30%       | Ticket volume tracking |

### Expected Business Impact

- **Conversion Rate**: +15-25% (customers more confident)
- **Average Order Value**: +£50-150 (TCO justifies premium parts)
- **Customer Satisfaction**: +0.5-1.0 stars (reviews mention insights)
- **Support Load**: -30% tickets (insights answer questions)

---

## Competitive Advantage

### Your Unique Features vs Competition

| Feature                 | PCPartPicker | Scan | Overclockers | **Vortex (Enhanced)**    |
| ----------------------- | ------------ | ---- | ------------ | ------------------------ |
| Real-time pricing       | ✅           | ✅   | ✅           | ✅ Multi-retailer        |
| Performance data        | ❌           | ❌   | ❌           | ✅ FPS/benchmarks        |
| Use-case matching       | ❌           | ❌   | ❌           | ✅ Gaming vs workstation |
| TCO analysis            | ❌           | ❌   | ❌           | ✅ Electricity costs     |
| Generation context      | ❌           | ❌   | ❌           | ✅ Old vs new value      |
| Expert personality      | ❌           | ❌   | ❌           | ✅ Kevin's 30+ years     |
| Alternative suggestions | ⚠️ Basic     | ❌   | ❌           | ✅ Advanced cross-brand  |
| Market timing           | ❌           | ❌   | ❌           | ✅ Seasonal trends       |

**Differentiation Statement**:

> "Only Vortex PCs offers Kevin's Insight – expert-level competitive analysis that explains not just what's different, but what matters for YOUR specific build and budget."

---

## Code Examples

### Adding a New Component Type

```typescript
// In competitiveContext.ts
export function getCompetitiveContext(
  componentType: "gpu" | "cpu" | "ram" | "storage" | "cooling" | "psu",
  currentComponent: Component,
  additionalContext?: any
): string[] {
  if (!currentComponent?.name) return [];

  switch (componentType) {
    case "gpu":
      return getGPUComparisons(currentComponent.name);
    case "cpu":
      return getCPUComparisons(currentComponent.name);
    case "ram":
      return getRAMComparisons(currentComponent, additionalContext);

    // NEW ADDITIONS:
    case "storage":
      return getStorageComparisons(currentComponent);
    case "cooling":
      return getCoolingComparisons(currentComponent, additionalContext?.cpu);
    case "psu":
      return getPSUComparisons(
        currentComponent,
        additionalContext?.totalWattage
      );

    default:
      return [];
  }
}
```

### Using Market Data

```typescript
// When calling getCompetitiveContext with market data
const gpuWithMarketData: ComponentWithMarketData = {
  ...gpu,
  marketData: {
    currentPrice: 549.99,
    priceHistory: [...],
    availability: "in-stock",
    retailers: [
      { name: "Scan.co.uk", price: 549.99, shipping: 0, url: "..." },
      { name: "Overclockers", price: 559.99, shipping: 4.99, url: "..." }
    ]
  }
};

const insights = getCompetitiveContext("gpu", gpuWithMarketData);
// Now shows: "RTX 4070 currently £549.99 (vs RTX 4080 at £799.99)..."
```

---

## Testing Checklist

Before deploying enhancements:

- [ ] **Accuracy**: Verify all performance claims against benchmarks
- [ ] **Pricing**: Ensure market data updates correctly
- [ ] **Tone**: Maintain Kevin's helpful, expert voice
- [ ] **Coverage**: Test all component types have comparisons
- [ ] **Edge Cases**: Handle missing data gracefully
- [ ] **Mobile**: Insights readable on small screens
- [ ] **Performance**: No lag when loading comparisons
- [ ] **Analytics**: Click tracking working

---

## Questions? Start Here

**Q: Which feature should I implement first?**  
A: Storage comparisons (30 min) + expand GPU/CPU coverage (1 hour) = massive impact, minimal effort

**Q: How do I integrate real-time pricing?**  
A: Connect to existing competitor tracking system (see `COMPETITOR_TRACKING_SETUP.md`)

**Q: Will this slow down the PC Builder?**  
A: No – comparisons load after build calculation, and data can be cached/lazy-loaded

**Q: How do I maintain Kevin's voice?**  
A: See `KEVINS_INSIGHT_PHASE1_COMPLETE.md` for tone examples. Use 2nd person, conversational, specific numbers, empathy

**Q: What if market data is unavailable?**  
A: Graceful fallback to static insights (current behavior) with note: "Prices approximate – check retailers for latest"

---

## Related Documents

- 📄 **KEVINS_INSIGHT_COMPETITIVE_ANALYSIS.md** - Full detailed analysis (this summary's source)
- 📄 **KEVINS_INSIGHT_PHASE1_COMPLETE.md** - Kevin's voice/tone reference
- 📄 **KEVINS_INSIGHT_REVIEW.md** - Original feature assessment
- 📄 **COMPETITOR_TRACKING_SETUP.md** - Price scraping integration guide
- 📄 **components/data/competitiveContext.ts** - Current implementation

---

**Last Updated**: December 1, 2025  
**Next Review**: After Week 1 implementations
