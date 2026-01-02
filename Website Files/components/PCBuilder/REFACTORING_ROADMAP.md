## PCBuilder Component Refactoring Roadmap

**Status**: Foundation Phase Complete ✅  
**Total Size**: 10,880 lines → Target: ~2,000 lines (main) + modular extracted components  
**Estimated Effort**: 40-60 hours (phased approach recommended)  
**Start Date**: Dec 31, 2025

---

## Phase 1: Foundation ✅ COMPLETE

### What's Done:

- ✅ Created `/components/PCBuilder/` directory structure
- ✅ Created `types/index.ts` with all type definitions
- ✅ Created hook, component, and utils directories

### Deliverables:

- `types/index.ts` - 320 lines of centralized type definitions
- Directory structure for modular extraction

---

## Phase 2: Type Migration (NEXT - Low Risk)

### Goals:

- Move all type definitions from PCBuilder.tsx to types/index.ts
- Update imports throughout the file
- Ensure TypeScript compilation passes

### Files to Create:

None - already done via types/index.ts

### Changes Needed in Original:

1. Remove these type definitions from PCBuilder.tsx (lines 261-460):

   - PCBuilderComponent interface
   - SelectedComponentIds interface
   - ComponentDataMap interface
   - RecommendedBuildSpec interface
   - CompatibilityIssue interface
   - ComparisonComponent interface
   - CategoryKey type
   - AnyComponent type

2. Add import at top:

```typescript
import type {
  PCBuilderComponent,
  SelectedComponentIds,
  PCComponent,
  PCOptionalExtra,
  ComponentDataMap,
  RecommendedBuildSpec,
  CompatibilityIssue,
  ComparisonComponent,
  CategoryKey,
  AnyComponent,
  ImageRef,
  SavedBuild,
  OptionSelections,
} from "./types";
```

### Estimated Effort: 30 minutes

### Risk Level: LOW

---

## Phase 3: Utility Functions Extraction (MEDIUM Risk)

### Goal: Extract pure functions to utils/

### Files to Create:

#### `utils/compatibility.ts` (~360 lines)

**Extract function**:

- `checkCompatibility()` - Lines 4277-5080
- All helper functions it uses
- Type guards and validation helpers

**Responsibilities**:

- CPU socket compatibility
- RAM type compatibility
- PSU wattage calculation
- Cooler height checking
- GPU length checking
- All compatibility issue detection

**Dependencies**:

- Import: PCBuilderComponent, CompatibilityIssue, CategoryKey

#### `utils/specifications.ts` (~300 lines)

**Extract from ComponentDetailModal**:

- `getSpecifications()` method - Lines 1518-1960
- Category-specific spec definitions
- Spec rendering helpers

**Responsibilities**:

- Return category-specific specs array
- Format spec values appropriately
- Handle missing specs gracefully

#### `utils/images.ts` (~50 lines)

**Extract functions**:

- `getImageUrl()` - Line 1058
- `getComponentImage()` - Lines 1062-1070
- Image selection logic

#### `utils/search.ts` (~150 lines)

**Extract function**:

- `inferCategoryFromQuery()` - Lines 2293-2350
- Search tokenization
- Category matching logic

#### `utils/richText.ts` (~120 lines)

**Extract**:

- `renderRichText()` - Lines 166-226
- `richTextRenderOptions` const - Lines 109-165
- DOMPurify configuration
- Rich text validation

### Estimated Effort: 3-4 hours

### Risk Level: MEDIUM (test compatibility function thoroughly)

---

## Phase 4: Custom Hooks Extraction (HIGH Risk)

### Goal: Extract state management and side effects into reusable hooks

### Files to Create:

#### `hooks/usePCBuilderFilters.ts` (~350 lines)

**Extract logic**:

- Price range filtering
- Brand selection filtering
- Option filters
- Range filters (specs)
- Search query handling

**State**:

```typescript
const [searchQuery, setSearchQuery] = useState("");
const [globalSearchQuery, setGlobalSearchQuery] = useState("");
const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
const [priceRange, setPriceRange] = useState([0, 10000]);
const [optionFilters, setOptionFilters] = useState({});
const [rangeFilters, setRangeFilters] = useState({});
```

**Return**:

```typescript
{
  filters: { searchQuery, globalSearchQuery, selectedBrands, priceRange, ... },
  setters: { setSearchQuery, setBrands, ... },
  applyFilters: (components) => filtered,
}
```

#### `hooks/useComponentSelection.ts` (~250 lines)

**Extract logic**:

- selectedComponents state
- selectedPeripherals state
- Component selection/deselection
- Persistence to sessionStorage/localStorage

**State**:

```typescript
const [selectedComponents, setSelectedComponents] = useState();
const [selectedPeripherals, setSelectedPeripherals] = useState();
```

**Return**:

```typescript
{
  selectedComponents,
  selectedPeripherals,
  selectComponent: (category, id) => void,
  deselectComponent: (category) => void,
  selectPeripheral: (category, id) => void,
  togglePeripheral: (category, id) => void,
  clearAll: () => void,
}
```

#### `hooks/useCompatibilityCheck.ts` (~200 lines)

**Extract logic**:

- Call checkCompatibility() from utils
- Manage compatibilityIssues state
- Handle modal visibility

**State**:

```typescript
const [compatibilityIssues, setCompatibilityIssues] = useState([]);
const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false);
```

**Return**:

```typescript
{
  compatibilityIssues,
  showDialog,
  setShowDialog,
  recheck: () => void,
  dismissIssue: (index) => void,
}
```

#### `hooks/usePriceCalculation.ts` (~150 lines)

**Extract logic**:

- Calculate total price from selections
- Get component prices
- Apply discounts
- Format currency

**Return**:

```typescript
{
  totalPrice: number,
  componentPrices: Record<string, number>,
  getComponentPrice: (id) => number,
  formatPrice: (price) => string,
}
```

#### `hooks/useInsightGeneration.ts` (~300 lines)

**Extract logic**:

- Lazy load insight modules
- Manage isLoadingInsights state
- Generate insights from selectedComponents
- Cache insight results

**State**:

```typescript
const [insightModules, setInsightModules] = useState(null);
const [isLoadingInsights, setIsLoadingInsights] = useState(false);
```

#### `hooks/useBuildPersistence.ts` (~250 lines)

**Extract logic**:

- Save build to database
- Load build from URL token
- Load build from PC Finder
- Share build URL generation

**Return**:

```typescript
{
  saveBuild: async (name?) => void,
  loadBuild: async (token) => components,
  shareUrl: string,
  importFromPCFinder: async () => void,
}
```

### Estimated Effort: 12-15 hours

### Risk Level: HIGH (complex state management and dependencies)

---

## Phase 5: Sub-Component Extraction (CRITICAL - Highest Impact)

### Goal: Extract large internal components to separate files

### Files to Create:

#### `components/ComponentDetailModal.tsx` (~1500 lines)

**Extract**:

- Full ComponentDetailModal component (lines 1183-2795)
- getSpecifications method
- All internal state and handlers
- Image gallery integration

**Props**:

```typescript
interface ComponentDetailModalProps {
  component: PCBuilderComponent | null;
  category: CategoryKey;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (component: PCBuilderComponent) => void;
  isSelected: boolean;
}
```

**Key Features**:

- Option selection with price/EAN calculation
- Specification rendering (category-specific)
- Image gallery with thumbnails
- Tech sheet download tracking
- Rich text description

**Testing Strategy**:

- Test option selection and price updates
- Test all category specification rendering
- Test image selection by option
- Mock analytics calls

#### `components/OptionalExtraDetailModal.tsx` (~380 lines)

**Extract**:

- Full OptionalExtraDetailModal (lines 2380-2750)
- Peripheral-specific specs
- Rich text rendering
- Features list

#### `components/ComponentCard.tsx` (~650 lines)

**Extract**:

- Full ComponentCard component (lines 2872-3528)
- Image gallery integration
- Option availability detection
- Multi-price handling
- Click handlers and modals

**Key Challenges**:

- Managing local state for modal visibility
- Handling option selection UI
- Passing selected options back to parent
- Analytics event tracking

#### `components/PeripheralCard.tsx` (~400 lines)

**Extract**:

- Full PeripheralCard component (lines 3877-4255)
- Favorites toggle
- Detail modal integration

#### `components/CompatibilityWarning.tsx` (~250 lines)

**Extract**:

- CompatibilityAlert component (lines 3745-3875)
- Styled alert with recommendations
- Icon rendering

#### `components/PriceBreakdown.tsx` (~120 lines)

**Extract**:

- Price display logic
- Tier labels (budget/mainstream/premium)
- Subtotal rendering

#### `components/LoadingSkeletons.tsx` (~100 lines)

**Extract**:

- ComponentCardSkeleton (lines 618-675)
- BuildSummarySkeleton (lines 677-693)
- CategoryNavSkeleton (lines 694-710)

### Estimated Effort: 20-25 hours

### Risk Level: CRITICAL (largest components, most test coverage needed)

---

## Phase 6: Main Component Refactoring (FINAL)

### Goal: Reduce PCBuilder.tsx from 10,880 to ~500-800 lines

### Refactored Structure:

```tsx
export function PCBuilder(props) {
  // Use all extracted hooks
  const filters = usePCBuilderFilters();
  const selection = useComponentSelection();
  const compatibility = useCompatibilityCheck(selection.selectedComponents);
  const pricing = usePriceCalculation(selection.selectedComponents);
  const insights = useInsightGeneration(selection.selectedComponents);
  const persistence = useBuildPersistence(selection);

  // Apply filters to CMS data
  const filteredComponents = useMemo(
    () => applyFiltersToComponents(cmsComponents, filters),
    [cmsComponents, filters]
  );

  // Handle category changes
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    savePageForCategory(category);
  };

  // Render layout with extracted sub-components
  return (
    <div>
      <CategoryNav
        activeCategory={activeCategory}
        onChange={handleCategoryChange}
      />

      <FilterPanel {...filters} />

      <ComponentGrid>
        {filteredComponents[activeCategory].map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            isSelected={
              selection.selectedComponents[activeCategory] === component.id
            }
            onSelect={() =>
              selection.selectComponent(activeCategory, component.id)
            }
          />
        ))}
      </ComponentGrid>

      <PriceBreakdown totalPrice={pricing.totalPrice} />

      {compatibility.compatibilityIssues.length > 0 && (
        <CompatibilityWarning issues={compatibility.compatibilityIssues} />
      )}

      {insights.insights && <InsightPanel insights={insights.insights} />}
    </div>
  );
}
```

### Estimated Effort: 8-10 hours

### Risk Level: MEDIUM (integration testing required)

---

## Phase 7: Testing & Verification

### Goals:

- Ensure all functionality works after refactoring
- Update import paths in other files
- Verify bundle size improvements
- Run lint and build

### Test Categories:

1. **Functionality Tests**

   - Component selection/deselection
   - Filtering (price, brand, specs)
   - Search and category inference
   - Compatibility checking
   - Price calculations
   - Build persistence (save/load/share)

2. **Integration Tests**

   - PCBuilder + HomePage CTA flow
   - PCBuilder + PC Finder recommendations
   - PCBuilder + Build sharing
   - PCBuilder + Shopping cart integration

3. **Import Updates**

   - App.tsx - PCBuilder import
   - HomePage.tsx - PCBuilder reference
   - Any other route references

4. **Build Verification**
   - No TypeScript errors
   - No import errors
   - Bundle size improvement (target: 15-20% reduction)
   - Lint passes: `npm run lint`
   - Build succeeds: `npm run build`

### Estimated Effort: 6-8 hours

### Risk Level: LOW (with thorough testing)

---

## Estimated Timeline

| Phase            | Effort    | Risk       | Timeline        |
| ---------------- | --------- | ---------- | --------------- |
| 1: Foundation    | 2h        | LOW        | ✅ DONE         |
| 2: Types         | 0.5h      | LOW        | ~30 min         |
| 3: Utils         | 4h        | MEDIUM     | ~4 hours        |
| 4: Hooks         | 15h       | HIGH       | ~15 hours       |
| 5: Components    | 25h       | CRITICAL   | ~25 hours       |
| 6: Main Refactor | 10h       | MEDIUM     | ~10 hours       |
| 7: Testing       | 8h        | LOW        | ~8 hours        |
| **TOTAL**        | **64.5h** | **MEDIUM** | **64-70 hours** |

**Recommended Approach**:

- Do Phase 2-3 immediately (low risk, quick wins)
- Do Phase 4 in parallel with Phase 5 (iterative extraction)
- Save Phase 6-7 for final integration

---

## Success Metrics

After refactoring completion:

- ✅ PCBuilder.tsx < 800 lines
- ✅ 12+ reusable hook files
- ✅ 8+ extracted component files
- ✅ 5+ utility modules
- ✅ Centralized types (no loose `any` types)
- ✅ 100% lint pass
- ✅ 100% build success
- ✅ <2% bundle size increase (expected: 10-15% decrease for first loads due to code splitting)
- ✅ All existing features working identically
- ✅ Hooks reusable in other components (e.g., PCFinder)

---

## Risk Mitigation

### Known Risks:

1. **Circular Dependencies**
   - Mitigation: Use barrel exports carefully, test imports
2. **Props Threading**
   - Mitigation: Use custom hooks to reduce prop drilling
3. **State Synchronization**
   - Mitigation: Test state mutations thoroughly
4. **Breaking Analytics**
   - Mitigation: Don't move event tracking code, keep in hooks
5. **Lost Functionality**
   - Mitigation: Comprehensive test coverage before/after

### Rollback Plan:

- Keep original PCBuilder.tsx backed up
- Use git branches for each phase
- Tag stable commits
- Test incrementally

---

## Next Steps

1. **Immediate** (Next 30 min):

   - Complete Phase 2: Migrate types
   - Run lint to verify no breakage
   - Run build to confirm

2. **Short Term** (Next 4 hours):

   - Complete Phase 3: Extract utilities
   - Test utility functions in isolation
   - Update main PCBuilder imports

3. **Medium Term** (Next 15-20 hours):

   - Complete Phase 4: Extract hooks
   - Test each hook in isolation
   - Test hook interactions

4. **Long Term** (Next 25 hours):
   - Complete Phase 5: Extract components
   - Full integration testing
   - Complete Phase 6-7: Final refactor and testing

---

**Last Updated**: Dec 31, 2025  
**Status**: Foundation Complete, Ready for Phase 2
