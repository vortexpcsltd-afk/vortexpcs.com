# Phase 5 Component Extraction Strategy

## Extraction Sequence & Impact

### Completed ✅

1. **ComponentDetailModal** (1,194 LOC)
   - Lines: 891-2088 (original PCBuilder.tsx)
   - Extracted to: `components/PCBuilder/components/ComponentDetailModal.tsx`
   - Status: ✅ COMPLETE - Lint ✅, Build ✅

### High Priority - Extract Next

#### 2. ComponentCard (~1,003 LOC) ⚠️ LARGE

- Lines: 1386-2388 (original)
- Lines: 1386-2388 (current PCBuilder.tsx after ComponentDetailModal removal)
- **Note**: This is the 2nd largest component
- Impact: ~11% additional code reduction
- Contains:
  - Grid and list view rendering modes
  - Option selection for variants (color, size, etc.)
  - Price calculation logic
  - Image gallery management
  - Analytics tracking
  - Add to build functionality

#### 3. PeripheralCard (~400-500 LOC)

- Lines: 2391-2800+ (approx)
- Size: Medium
- Impact: ~5% additional reduction
- Simpler than ComponentCard - good for momentum

### Medium Priority - Quick Wins

#### 4. FilterPanel (~600-700 LOC)

- Multiple filter controls
- Price range slider
- Stock status, ratings filters
- Feature filters

#### 5. BuildSummary (~400-500 LOC)

- Build overview display
- Component list rendering
- Total cost calculation
- Parts count display

### Lower Priority - Deferred to Phase 6

#### 6. SortingPanel (~250-300 LOC)

- Sort dropdowns
- View mode toggles
- Smaller component - can be combined with FilterPanel if needed

#### 7. CompatibilityWarningPanel (~300-400 LOC)

- Compatibility issue display
- Warning styling
- Currently less critical

#### 8. InsightPanel (~400-500 LOC)

- Kevin's Insight display
- Lazy-loaded insight modules
- Complex but isolated

## Recommended Extraction Order for Speed

Given the goal of maximum code reduction with time efficiency:

1. ✅ **ComponentDetailModal** (DONE - 1,194 LOC removed)
2. **ComponentCard** (1,003 LOC) - Large but high-impact extraction
3. **PeripheralCard** (~500 LOC) - Medium, straightforward extraction
4. **BuildSummary** (~450 LOC) - Medium, isolated component
5. **FilterPanel** (~650 LOC) - Higher complexity, can defer
6. **InsightPanel** (~500 LOC) - Complex, can defer to Phase 6
7. **CompatibilityWarningPanel** (~350 LOC) - Lower priority
8. **SortingPanel** (~250 LOC) - Can be merged or deferred

## Current Progress

**Phase 5 So Far:**

- Completed: 1/8 components
- LOC removed: 1,197 / 4,000+ target
- Target: 29.9% of goal achieved
- Build status: ✅ Passing
- Lint status: ✅ Passing (0 errors)

## Next Immediate Step

Extract **ComponentCard** (1,003 LOC) to:

- `components/PCBuilder/components/ComponentCard.tsx`
- Update import in PCBuilder.tsx
- Remove original definition
- Verify: Lint ✅, Build ✅

**Estimated Time:** 20-30 minutes including verification

## Phase 5 Completion Target

After extracting top 5 components:

- **Est. LOC removed:** 1,197 + 1,003 + 500 + 450 + 650 = 3,800+
- **Target PCBuilder.tsx:** 9,197 - 3,800 = 5,400 LOC
- **Overall reduction from Phase 1 start:** 10,880 - 5,400 = 49.5%

---

**Current Status:** 🔄 Ready for next extraction (ComponentCard)
**Time Estimate Remaining:** ~3 hours for Phase 5 completion
