# Quick Reference - Phase 5 Next Step

## 🎯 Next Component: ComponentCard

**Status:** Ready for extraction  
**Lines:** 1386-2388 in PCBuilder.tsx  
**Size:** 1,003 LOC  
**Complexity:** HIGH (dual view modes)  
**Est. Time:** 25-30 min extraction + 5 min verify

## 📋 Extraction Checklist

- [ ] **Step 1:** Read lines 1386-2388 from PCBuilder.tsx
- [ ] **Step 2:** Create `components/PCBuilder/components/ComponentCard.tsx`
- [ ] **Step 3:** Copy component code into new file
- [ ] **Step 4:** Fix imports (see below)
- [ ] **Step 5:** Remove old definition from PCBuilder.tsx
- [ ] **Step 6:** Add import to PCBuilder.tsx (see below)
- [ ] **Step 7:** Update barrel export: `components/PCBuilder/components/index.ts`
- [ ] **Step 8:** Run `npm run lint` - expect 0 errors
- [ ] **Step 9:** Run `npm run build` - expect success

## 🔌 Required Imports for ComponentCard.tsx

```typescript
import React, { useState } from "react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Eye,
  ShoppingCart,
  Star,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import { PriceTag } from "../../ui/PriceTag";
import { PointsBadge } from "../../PointsBadge";
import { FeaturedTag } from "../../FeaturedTag";
import { renderRichText } from "../utils/richText";
import { PLACEHOLDER_IMAGE } from "../../data/pcBuilderComponents";
import { logger } from "../../../services/logger";
import { trackClick } from "../../../services/sessionTracker";
import { ComponentDetailModal } from "./ComponentDetailModal";
import type { PCBuilderComponent, CompatibilityIssue } from "../types";
```

## 📝 Code in PCBuilder.tsx

**Add Import (after line 91 where ComponentDetailModal import is):**

```typescript
import { ComponentCard } from "./PCBuilder/components/ComponentCard";
```

**Remove From PCBuilder.tsx:**

- Old ComponentCard definition (lines 1386-2388)

## ✅ Barrel Export Update

**File:** `components/PCBuilder/components/index.ts`

**Add this line:**

```typescript
export { ComponentCard } from "./ComponentCard";
```

**Result:**

```typescript
export { ComponentDetailModal } from "./ComponentDetailModal";
export { ComponentCard } from "./ComponentCard";
// ... more exports as components are extracted
```

## 🧪 Verification Commands

```bash
# After making changes:
npm run lint    # Should show 0 ERRORS (may have warnings)
npm run build   # Should complete successfully in < 15s
```

## 📊 ComponentCard Features to Preserve

- ✅ Grid view rendering (default)
- ✅ List view rendering (alternate)
- ✅ Option dropdown state (color, size, storage, etc.)
- ✅ Multiple price handling (hasMultiplePrices, lowestPrice)
- ✅ Image gallery by option (cardImages computation)
- ✅ Selected options persistence (sessionStorage)
- ✅ Price change analytics tracking
- ✅ Component selection tracking (trackClick)
- ✅ Integration with ComponentDetailModal
- ✅ Badge rendering (cores, RAM, vram, capacity, etc.)
- ✅ Featured and Points badges
- ✅ Rating display
- ✅ Brand logo or brand text display

## 🐛 Common Issues & Fixes

**Issue:** Import path error for `renderRichText`  
**Fix:** Use `../utils/richText` (go up one level from components/)

**Issue:** Import path error for `PLACEHOLDER_IMAGE`  
**Fix:** Use `../../data/pcBuilderComponents` (go up two levels from components/)

**Issue:** Missing component import like `FeaturedTag`  
**Fix:** Add `import { FeaturedTag } from "../../FeaturedTag";`

**Issue:** Lint warning "unused variable"  
**Fix:** These are expected - remove if truly unused, keep if used in JSX

**Issue:** Build error about missing export  
**Fix:** Check that ComponentCard is exported in components/index.ts

## 🚀 After Successful Extraction

1. **Document:** Update `PHASE5_FINAL_CHECKPOINT.md` with completion
2. **Commit:** Save progress with clear commit message
3. **Next:** Move to PeripheralCard extraction (simpler, ~500 LOC)
4. **Track:** Update todo list status

## 💡 Pro Tips

- Keep ComponentDetailModal.tsx open as reference for patterns
- Copy imports from ComponentDetailModal and adapt them
- Test in small chunks: create file → fix imports → verify build
- If confused, check how ComponentDetailModal does it

## 📞 Support Resources

- `PHASE5_CONTINUATION_GUIDE.md` - Detailed guide with examples
- `PCBUILDER_REFACTORING_PHASE5_CHECKPOINT1.md` - ComponentDetailModal as reference
- `components/PCBuilder/components/ComponentDetailModal.tsx` - Working example

---

**Ready to start?** Begin with Step 1 of the checklist above.  
**Estimated total time:** 30-35 minutes  
**Expected outcome:** ComponentCard extracted, lint ✅, build ✅
