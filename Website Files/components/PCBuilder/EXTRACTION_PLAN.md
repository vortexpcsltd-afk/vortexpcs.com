# PCBuilder Component Extraction Plan

## Status: In Progress (Priority 2.2)

**Goal:** Reduce PCBuilder.tsx from 10,723 lines to <500 lines by extracting logical sections into modular components.

---

## ✅ Completed Extractions

### 1. BuildSummary (266 lines)

**Location:** `components/PCBuilder/BuildSummary.tsx`
**Responsibility:** Display selected components, total price, action buttons
**Props:**

- `selectedComponents`, `selectedPeripherals`
- `componentData`, `optionalExtrasData`
- `totalPrice`, `selectedComponentsCount`
- `compatibilityIssues`, `recommendedBuild`
- `onCheckout`, `onSave`, `onClear`, `onViewBuildDetails`
- `getCategoryLabel` helper

**Status:** ✅ Complete, lint clean

---

### 2. CompatibilityChecker (153 lines)

**Location:** `components/PCBuilder/CompatibilityChecker.tsx`
**Responsibility:** Display compatibility warnings dialog
**Props:**

- `compatibilityIssues`
- `onAccept`, `onCancel`

**Status:** ✅ Complete, lint clean

---

## 🔄 Remaining Extractions

### 3. ComponentSelector (Est. ~2000 lines)

**Target:** `components/PCBuilder/ComponentSelector.tsx`
**Responsibility:**

- Category navigation buttons
- Product grid/list display
- Component cards with specs
- Filtering (brands, price, options)
- Search functionality
- Sorting controls
- View mode toggle (grid/list)
- Pagination

**Key Sections to Extract:**

- Category buttons (lines ~9300-9500 in PCBuilder.tsx)
- Filter controls (search, brands, price range)
- Product grid rendering
- Component card rendering (can reuse existing ComponentCard if available)
- Peripheral cards

**Props Needed:**

- `activeCategory`, `setActiveCategory`
- `viewMode`, `sortBy`
- `searchQuery`, `globalSearchQuery`
- `selectedBrands`, `priceRange`, `optionFilters`
- Filter setters
- `componentData`, `peripheralsData`
- `selectedComponents`, `selectedPeripherals`
- `onComponentSelect`, `onPeripheralToggle`
- `currentPage`, `itemsPerPage`
- Pagination controls

**Complexity:** HIGH - largest extraction, most interactions

---

### 4. InsightsPanel (Est. ~1500 lines)

**Target:** `components/PCBuilder/InsightsPanel.tsx`
**Responsibility:**

- Kevin's Insights lazy-loaded panel
- Build analysis display
- Performance estimates
- Compatibility insights
- Use-case detection
- Future-proofing analysis
- Upgrade suggestions

**Key Sections:**

- Insight module loading logic
- Build insights generation
- Formatted output rendering
- Collapsible sections
- Environment diagnostics panel

**Props Needed:**

- `selectedComponents`
- `insightModules` (lazy-loaded)
- `isLoadingInsights`
- `environment` (ambient temp, USB devices, displays)
- `showAdvancedInsights`, `insightMode`
- Various analysis functions from insight modules

**Complexity:** MEDIUM-HIGH - complex logic but contained

---

## Integration Strategy

### Phase 1: Extract All Components (Current)

- ✅ BuildSummary
- ✅ CompatibilityChecker
- 🔄 ComponentSelector (next)
- ⏳ InsightsPanel

### Phase 2: Wire Up in PCBuilder.tsx

1. Add all imports
2. Replace inline sections with component calls
3. Pass required props from reducer state
4. Ensure all callbacks work correctly

### Phase 3: Verification

- Run lint (target: 0 errors)
- Run build (verify bundle sizes)
- Manual testing (all features work)
- Performance check (no regressions)

---

## Expected Outcomes

**Before:**

- PCBuilder.tsx: 10,723 lines
- No separation of concerns
- Hard to test
- Slow to navigate

**After:**

- PCBuilder.tsx: <500 lines (coordinator only)
- BuildSummary.tsx: 266 lines
- CompatibilityChecker.tsx: 153 lines
- ComponentSelector.tsx: ~2000 lines
- InsightsPanel.tsx: ~1500 lines
- **Total extracted:** ~3,900+ lines (36% reduction)
- Clear separation of concerns
- Testable in isolation
- Fast navigation

---

## Decision: Pragmatic Extraction

Given the 10,723-line size and complexity, we're extracting the **highest-impact, lowest-risk** components:

1. ✅ **BuildSummary** - Self-contained sidebar widget
2. ✅ **CompatibilityChecker** - Modal dialog, clear boundaries
3. 🎯 **Skip full ComponentSelector for now** - Too risky, deeply integrated
4. 🎯 **Skip full InsightsPanel for now** - Complex lazy-loading dependencies

### Revised Target

- Extract BuildSummary ✅
- Extract CompatibilityChecker ✅
- Integrate both into PCBuilder.tsx
- Verify functionality
- **Defer** ComponentSelector and InsightsPanel to future iterations

**Rationale:**

- Extracting 400+ lines immediately (BuildSummary + CompatibilityChecker)
- Low risk: Both are display-only components
- Clear boundaries: Sidebar widget + modal
- Can integrate without breaking core functionality
- Demonstrates pattern for future extractions

**Next Steps:**

1. Add imports to PCBuilder.tsx
2. Replace Build Summary Card section with `<BuildSummary />`
3. Replace CompatibilityAlert with `<CompatibilityChecker />`
4. Test integration
5. Run lint and build
6. Document success for future reference
