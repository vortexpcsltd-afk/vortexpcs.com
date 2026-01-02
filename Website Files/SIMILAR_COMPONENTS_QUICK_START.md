# Similar Components - 3 Easy Steps to Enable

## 📍 Which File to Edit?

You're using: **`components/PCBuilder.tsx`** (the main component)

This is the file that contains both the ComponentDetailModal and the grid/list views.

---

## 🎯 What You Need to Do

### **Step 1: Add One Line at the Top**

Add this import with the other imports:

```typescript
import { SimilarComponentsSection } from "./components/PCBuilder/SimilarComponentsSection";
```

### **Step 2: Update the Modal Definition (3 lines changed)**

Find line 989 and change:

```tsx
// BEFORE:
}: {
  component: PCBuilderComponent;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string, componentId: string) => void;
  isSelected: boolean;
}) => {

// AFTER: Add these 2 lines
}: {
  component: PCBuilderComponent;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string, componentId: string) => void;
  isSelected: boolean;
  allComponents?: PCBuilderComponent[];  // ← ADD THIS
}) => {
```

Also add `allComponents` to the parameters at the top:

```tsx
const ComponentDetailModal = ({
  component,
  category,
  isOpen,
  onClose,
  onSelect,
  isSelected,
  allComponents,  // ← ADD THIS
}) => {
```

### **Step 3: Add 1 useMemo Hook**

Find where other useMemo hooks are (around line 5500-5600) and add:

```typescript
const allComponentsForCategory = useMemo(() => {
  const list = (activeComponentData[activeCategory] ||
    []) as PCBuilderComponent[];
  return list;
}, [activeComponentData, activeCategory]);
```

### **Step 4: Uncomment and Update the SimilarComponentsSection**

Find line ~1328 where it's commented out and replace the commented code with:

```tsx
{
  /* Similar Components Section */
}
{
  allComponents && allComponents.length > 0 && (
    <SimilarComponentsSection
      component={component}
      allComponents={allComponents}
      onSelectComponent={(selected) => {
        onSelect(category, selected.id);
      }}
    />
  );
}
```

### **Step 5: Pass allComponents to Both Modal Calls**

Find the two places where `<ComponentDetailModal` is used and add:

```tsx
allComponents = { allComponentsForCategory };
```

Around line 3329 and line 3551.

---

## ✨ That's It!

**Total changes: ~10 lines of code**

---

## 🧪 Verify It Works

```bash
npm run build
```

If it builds successfully, you're done!

Open the app, click on a component, and you should see:

- **Users Also Considered** (similar products)
- **Performance Upgrades** (better specs, same price)
- **Save Money** (cheaper alternatives)

---

## 📊 Visual Guide

```
components/PCBuilder.tsx
├── Top (line 1-50): Add import ✅
├── Line 989: Update ComponentDetailModal interface ✅
├── Line 5500-5600: Add useMemo hook ✅
├── Line ~1328: Uncomment SimilarComponentsSection ✅
├── Line ~3329: Add allComponents={...} ✅
└── Line ~3551: Add allComponents={...} ✅
```

---

## 🆘 Still Confused?

Look at these reference files:

- `SIMILAR_COMPONENTS_PATCHES.md` - Exact code to copy/paste
- `SIMILAR_COMPONENTS_SETUP.md` - Detailed line-by-line guide
- `FEATURE_IMPLEMENTATION_SUMMARY.md` - Full documentation

**Or just ask me and I'll apply the changes for you!**

---

## ⏱️ Time Needed

- Reading this: 2 minutes
- Making changes: 5 minutes
- Testing: 2 minutes
- **Total: ~10 minutes**

Let's go! 🚀
