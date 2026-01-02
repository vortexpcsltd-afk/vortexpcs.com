# Phase 6: PCBuilder Large Component Extraction Plan

**Target**: Reduce PCBuilder.tsx from 5,530 lines → 500-800 lines (91-95% reduction)  
**Components to Create**: 8-10 new extractable components  
**Total LOC to Extract**: ~4,730-5,030 lines  
**Strategy**: Break into logical, independent UI/logic sections with clear boundaries

---

## PCBuilder Structure Analysis

### Current State (5,530 LOC)

- **Lines 1-150**: Imports, constants, memoized components
- **Lines 151-250**: CATEGORY_OPTION_FILTERS, CATEGORY_RANGE_FILTERS constants
- **Lines 251-4550**: Main component function with state, effects, and utility functions
- **Lines 4550-5530**: JSX return statement (Category nav, filters, grid, peripherals, modals)

### JSX Structure Breakdown

```
Root JSX (~980 LOC total, lines 4550-5530)
├── PageHero section (~600 LOC, lines 4550-5150)
│   ├── CTA Buttons (Start Building, Enthusiast Builder, 3D Builder)
│   ├── Feature Pills (Compatibility, Components, Performance)
│   └── Business Solutions & Gaming Laptops Banners
│
├── Loading State (40 LOC)
│   └── Skeleton components when isLoadingCms
│
├── Grid Layout (1 lg:grid-cols-4 gap-8)
│   │
│   ├── SIDEBAR (col-1, 350 LOC to extract)
│   │   ├── BuildSummary component (already extracted)
│   │   └── Category Navigation Card (~200 LOC, target for CategoryNav.tsx)
│   │
│   └── MAIN CONTENT (col-3, 630 LOC to extract)
│       ├── Global Search Bar (30 LOC, trivial but worth consolidating)
│       ├── Selected Components Display Card (150 LOC, extractable)
│       ├── Filters & Controls Section (200 LOC)
│       │   ├── Filters/Sort Sheet with complex state
│       │   ├── View Mode toggle
│       │   └── Sort dropdown
│       └── Component Grid/List Rendering (250 LOC)
│           ├── Grid layout (md:grid-cols-2 xl:grid-cols-3)
│           ├── List layout (space-y-4)
│           └── No components found state
│
├── PERIPHERALS SECTION (450 LOC)
│   └── Tabs with 8 peripheral categories
│       ├── Keyboard cards
│       ├── Mouse cards
│       ├── Monitor cards
│       ├── Gamepad cards
│       ├── Mousepad cards
│       ├── Headset cards
│       ├── Cable cards
│       └── Software/OS cards
│
└── MODALS (200 LOC)
    ├── Compatibility Alert Dialog
    ├── Incompatibility Details Modal
    ├── Build Details Modal (imported)
    ├── Enthusiast Builder Modal (imported)
    ├── Build Comparison Modal (imported)
    ├── Product Comparison Modal (imported)
    └── Floating Compare Button
```

---

## Extraction Candidates (Priority Order)

### 1. **Category Navigation UI** (~200 LOC)

**Location**: Lines ~4670-4870  
**Component**: `CategoryNav.tsx`  
**Scope**:

- Category button grid with description tooltips
- Icon mapping (Monitor, Activity, Cpu, Video, etc.)
- Component count badges
- Selected state styling
- CheckCircle icon for selected categories

**Props**:

```tsx
interface CategoryNavProps {
  categories: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    description: string;
  }>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  selectedComponents: Record<string, string | undefined>;
}
```

**Dependencies**:

- Card, Button, Badge (shadcn/ui)
- CheckCircle icon

**Expected LOC**: 150-200  
**Difficulty**: Low  
**Extraction Order**: 1st (highest priority, smallest, isolated)

---

### 2. **Filter & Sort Controls** (~280 LOC)

**Location**: Lines ~4600-4880 (partial - embedded in filter sheet)  
**Component**: `FilterPanel.tsx`  
**Scope**:

- Search bar (category-specific)
- Brand filter checkboxes
- Price range slider
- Option filters (dynamic per category)
- Range filters (VRAM, Wattage, Capacity, etc.)
- Filter count badge
- Clear filters button
- View mode toggle (grid/list)
- Sort dropdown

**Props**:

```tsx
interface FilterPanelProps {
  activeCategory: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedBrands: string[];
  setSelectedBrands: (brands: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  optionFilters: Record<string, string[]>;
  setOptionFilters: (filters: Record<string, string[]>) => void;
  rangeFilters: Record<string, [number, number]>;
  setRangeFilters: (filters: Record<string, [number, number]>) => void;
  brandOptions: string[];
  priceMin: number;
  priceMax: number;
  optionFilterValues: Record<string, string[]>;
  rangeFilterBounds: Record<string, { min: number; max: number }>;
  viewMode: string;
  setViewMode: (mode: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  appliedFiltersCount: number;
}
```

**Dependencies**:

- Sheet, SheetContent, SheetHeader, SheetFooter, SheetClose (shadcn/ui)
- Button, Badge, Input, Checkbox, Select, Slider
- Search, Sliders, Grid, List, ChevronDown icons
- CATEGORY_OPTION_FILTERS, CATEGORY_RANGE_FILTERS constants

**Expected LOC**: 250-350  
**Difficulty**: Medium (complex state threading)  
**Extraction Order**: 2nd

---

### 3. **Component Selection Grid** (~250 LOC)

**Location**: Lines ~4880-5130  
**Component**: `ComponentGrid.tsx`  
**Scope**:

- Grid/List view toggle (reusable in FilterPanel or separate)
- Component card rendering (uses MemoComponentCard)
- Pagination controls (Previous/Next/Number buttons)
- Results summary ("Showing X to Y of Z")
- No components found state
- Pagination state management

**Props**:

```tsx
interface ComponentGridProps {
  paginatedComponents: PCBuilderComponent[];
  sortedComponents: PCBuilderComponent[];
  viewMode: string;
  activeCategory: string;
  selectedComponents: Record<string, string | undefined>;
  onComponentSelect: (category: string, componentId: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  buildSectionRef: React.RefObject<HTMLDivElement>;
}
```

**Dependencies**:

- Card (shadcn/ui)
- MemoComponentCard (already extracted)
- Button, Badge
- Package, ChevronLeft, ChevronRight icons

**Expected LOC**: 200-300  
**Difficulty**: Medium  
**Extraction Order**: 3rd

---

### 4. **Selected Components Display** (~150 LOC)

**Location**: Lines ~4410-4560  
**Component**: `SelectedBuildDisplay.tsx`  
**Scope**:

- Display selected components in overview card
- Component images, details, specs
- Swap/Remove action buttons per component
- Build action buttons (Add to Cart, Clear, Share, Save for Comparison)
- Missing components warning

**Props**:

```tsx
interface SelectedBuildDisplayProps {
  selectedComponents: SelectedComponentIds;
  selectedPeripherals: Record<string, string[]>;
  activeComponentData: ComponentDataMap;
  getTotalPrice: number;
  getSelectedComponentsCount: number;
  categories: Category[];
  getCategoryLabel: (categoryId: string) => string;
  onComponentSwap: (category: string) => void;
  onComponentRemove: (category: string) => void;
  onCheckoutWithCompatibility: () => void;
  onClearBuild: () => void;
  onShareBuild: () => void;
  onSaveForComparison: () => void;
  savedBuildsForComparison: SavedBuild[];
  onComparisonClick: () => void;
}
```

**Dependencies**:

- Card, Button, Badge (shadcn/ui)
- ProgressiveImage component
- RefreshCw, X, ShoppingCart, Trash2, Share2, Bookmark, TrendingUp, AlertCircle icons
- renderRichText utility

**Expected LOC**: 120-180  
**Difficulty**: Low-Medium  
**Extraction Order**: 4th

---

### 5. **Peripherals Tabs Section** (~420 LOC)

**Location**: Lines ~5150-5570  
**Component**: `PeripheralsSection.tsx`  
**Scope**:

- Tabs for keyboard, mouse, monitor, gamepad, mousepad, headset, cable, software
- Tab triggers with icons and responsive labels
- Category headers with descriptions
- Selected count badges
- MemoPeripheralCard grid for each category
- All tab content rendering

**Props**:

```tsx
interface PeripheralsSectionProps {
  activeOptionalExtrasData: Record<string, PCOptionalExtra[]>;
  selectedPeripherals: Record<string, string[]>;
  viewMode: string;
  onPeripheralToggle: (category: string, peripheralId: string) => void;
}
```

**Dependencies**:

- Tabs, TabsList, TabsContent, TabsTrigger (shadcn/ui)
- Button, Badge
- MemoPeripheralCard (already extracted)
- Multiple icons (Keyboard, Mouse, Monitor, Gamepad, Package, Headphones, Cable, Shield, Plus)

**Expected LOC**: 380-450  
**Difficulty**: Low (mostly repetitive tab structure)  
**Extraction Order**: 5th

---

### 6. **Modal Management** (~100 LOC)

**Location**: Lines ~5480-5530  
**Component**: `ModalContainer.tsx` or inline (not worth extracting - too small)  
**Scope**:

- Conditional rendering of 6 modals
- CompatibilityAlert
- AlertDialog for Incompatibility Details
- BuildDetailsModal
- EnthusiastBuilder (Suspense wrapped)
- BuildComparisonModal (Suspense wrapped)
- ProductComparison (Suspense wrapped)
- Floating Compare Button

**Decision**: **Skip extraction** - modals are already imported/extracted components. Main component just manages visibility state. Not worth creating wrapper component.

---

### 7. **Data Initialization Hooks** (~400 LOC)

**Location**: Lines ~900-1300 (effects for CMS data, URL parsing, imports)  
**Component**: `hooks/useInitializeBuilder.ts`  
**Scope**:

- Load CMS component data and optional extras
- Parse ?build= URL tokens
- Import PC Finder recommendations
- Import Visual Configurator builds
- Load saved builds from Member Area
- Handle persisted localStorage/sessionStorage data

**Functions**:

```tsx
export function useInitializeBuilder(
  onComponentsLoaded?: (data: CmsComponentData) => void
): {
  cmsComponents: CmsComponentData;
  cmsOptionalExtras: CmsOptionalExtrasData;
  isLoadingCms: boolean;
};

export function useImportPersistedBuilds(): void; // Side effects only
```

**Dependencies**:

- fetchPCComponents, fetchPCOptionalExtras (CMS services)
- decodeFullBuild (utility)
- logger service
- useNavigate hook
- sessionStorage, localStorage APIs

**Expected LOC**: 350-450  
**Difficulty**: Medium (complex effect chains)  
**Extraction Order**: Not in initial priority - can defer to Phase 6b

---

### 8. **Global Search Handler** (~80 LOC)

**Location**: Lines ~3800-3880  
**Component**: `hooks/useGlobalSearch.ts`  
**Scope**:

- inferCategoryFromQuery logic
- globalSearchQuery state & handler
- Auto-focus category when global query changes
- Category chip navigation

**Functions**:

```tsx
export function useGlobalSearch() {
  return {
    globalSearchQuery: string;
    setGlobalSearchQuery: (q: string) => void;
    inferredCategory: CategoryKey | null;
    getGlobalSearchResults: () => void;
  }
}
```

**Dependencies**:

- React hooks (useState, useEffect, useCallback)

**Expected LOC**: 60-120  
**Difficulty**: Low  
**Extraction Order**: Not priority - trivial logic

---

## Phase 6 Extraction Sequence

### Round 1 (Easy wins)

1. ✅ **CategoryNav.tsx** (200 LOC) - Category button grid
2. ✅ **FilterPanel.tsx** (280 LOC) - Search, filters, sort controls
3. ✅ **ComponentGrid.tsx** (250 LOC) - Grid/list rendering + pagination
4. ✅ **SelectedBuildDisplay.tsx** (150 LOC) - Selected components overview

**Subtotal**: 880 LOC extracted  
**PCBuilder size after Round 1**: ~4,650 LOC

### Round 2 (Medium complexity)

5. ✅ **PeripheralsSection.tsx** (420 LOC) - Peripherals tabs and cards

**Subtotal**: 1,300 LOC extracted  
**PCBuilder size after Round 2**: ~4,230 LOC

### Round 3 (Optimization/Polish)

6. ⏳ Data initialization hooks (defer)
7. ⏳ Global search utilities (defer)
8. Remaining inline code consolidation

**Final Target**: PCBuilder 500-800 LOC

---

## Extraction Dependencies & Threading

### State Threading

```
PCBuilder (main container)
├── State declarations (same as before)
├── Effects (same - no change to logic)
├── Handlers (same - no change)
│
├── <CategoryNav />
│   Props: categories, activeCategory, onCategoryChange, selectedComponents
│
├── <FilterPanel />
│   Props: filters state + setters (8 props), options, bounds, handlers
│
├── <SelectedBuildDisplay /> (conditional, only if selectedComponents.length > 0)
│   Props: selectedComponents, activeComponentData, handlers, totals
│
├── <ComponentGrid />
│   Props: paginatedComponents, pagination state + setters, handlers
│
└── <PeripheralsSection />
    Props: activeOptionalExtrasData, selectedPeripherals, onToggle
```

### Import/Export Updates

- Create `PCBuilder/components/` folder structure
- Export all new components
- Update PCBuilder.tsx imports
- No breaking changes to other components

---

## Success Criteria

| Metric             | Target            | Verification                        |
| ------------------ | ----------------- | ----------------------------------- |
| PCBuilder.tsx size | 500-800 LOC       | `wc -l`                             |
| New components     | 5 components      | File count in PCBuilder/components/ |
| Lint errors        | 0                 | `npm run lint`                      |
| Build size         | <250kb gzip       | `npm run build` output              |
| Breaking changes   | 0                 | Manual feature testing              |
| JSDoc coverage     | 100%              | Review component headers            |
| Type safety        | No implicit `any` | TypeScript strict mode              |

---

## Implementation Notes

### Best Practices

1. **Extract one at a time** - verify each extraction works before proceeding
2. **Keep state in PCBuilder** - extracted components receive props/callbacks only
3. **Use React.memo** - wrap components in memo with comparison function if needed
4. **Document with JSDoc** - every new component gets full documentation
5. **Test imports** - rebuild after each extraction to catch missing imports
6. **Preserve functionality** - no refactoring of business logic, only UI structure

### Common Pitfalls to Avoid

- ❌ Moving state to extracted components (keep in PCBuilder)
- ❌ Breaking circular dependencies (verify imports are one-way)
- ❌ Forgetting to update TypeScript types
- ❌ Removing memo optimizations (keep performance characteristics)
- ❌ Not testing on actual data (use CMS data, not mock)

### File Structure After Phase 6

```
components/
├── PCBuilder.tsx (500-800 LOC - main orchestrator)
├── PCBuilder/
│   ├── components/
│   │   ├── CategoryNav.tsx (200 LOC)
│   │   ├── FilterPanel.tsx (280 LOC)
│   │   ├── ComponentGrid.tsx (250 LOC)
│   │   ├── SelectedBuildDisplay.tsx (150 LOC)
│   │   ├── PeripheralsSection.tsx (420 LOC)
│   │   ├── BuildSummary.tsx (93 LOC, from Phase 5)
│   │   ├── BuildInsightsPanel.tsx (302 LOC, from Phase 5)
│   │   ├── ComponentCard.tsx (890 LOC, from Phase 5)
│   │   ├── PeripheralCard.tsx (395 LOC, from Phase 5)
│   │   └── ... [other Phase 5 components]
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── compatibility.ts
│   │   ├── richText.ts
│   │   └── images.ts
│   └── modals/
│       ├── BuildDetailsModal.tsx (262 LOC, from Phase 5)
│       ├── OptionalExtraDetailModal.tsx
│       ├── BuildComparisonModal.tsx
│       ├── EnthusiastBuilder.tsx
│       └── ProductComparison.tsx (lazy loaded)
```

---

## Timeline Estimate

| Task                            | Duration     | Notes                          |
| ------------------------------- | ------------ | ------------------------------ |
| CategoryNav extraction          | 30 min       | Test + lint                    |
| FilterPanel extraction          | 60 min       | Complex state threading        |
| ComponentGrid extraction        | 45 min       | Pagination logic               |
| SelectedBuildDisplay extraction | 40 min       | Action handlers                |
| PeripheralsSection extraction   | 45 min       | Repetitive tabs                |
| Polish & testing                | 60 min       | Integration, lint, build       |
| **Total**                       | **≈4 hours** | With verification at each step |

---

## Next Action

→ Begin **Extraction 1: CategoryNav.tsx**

Mark Todo #1 (Analysis) complete and start Todo #3 (CategoryNav extraction).
