# Complete Setup Guide: Enable Similar Components Feature

## 🎯 Goal

Enable the "Users Also Considered" feature to show similar/alternative components in the product detail modals.

## 📍 Step-by-Step Implementation

### **STEP 1: Update ComponentDetailModal Interface in PCBuilder.tsx**

Find the ComponentDetailModal component definition around line 989 and add `allComponents` prop:

**Location**: `components/PCBuilder.tsx` line 989-1003

```tsx
const ComponentDetailModal = ({
  component,
  category,
  isOpen,
  onClose,
  onSelect,
  isSelected,
  allComponents,  // ADD THIS LINE
}: {
  component: PCBuilderComponent;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string, componentId: string) => void;
  isSelected: boolean;
  allComponents?: PCBuilderComponent[];  // ADD THIS LINE
}) => {
```

---

### **STEP 2: Add SimilarComponentsSection Import**

At the top of `PCBuilder.tsx` around line 1-50, add this import:

```tsx
import { SimilarComponentsSection } from "./components/PCBuilder/SimilarComponentsSection";
```

---

### **STEP 3: Add SimilarComponentsSection to Modal Content**

Find where the modal is rendered, around line 1330-1370. Look for the comment `{/* Similar Components Section */}`

Add this code before the closing buttons:

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
        setShowDetailModal(false); // Close modal after selection
      }}
    />
  );
}
```

**Location**: Around line 1328 in ComponentDetailModal

---

### **STEP 4: Pass allComponents to ComponentDetailModal**

Find where ComponentDetailModal is called (2 places):

#### **First location** (around line 3329 - in ComponentCard):

```tsx
<ComponentDetailModal
  component={component}
  category={category}
  isOpen={showDetailModal}
  onClose={() => setShowDetailModal(false)}
  onSelect={onSelect}
  isSelected={isSelected}
  allComponents={allComponents} // ADD THIS
/>
```

#### **Second location** (around line 3551 - in grid view):

```tsx
<ComponentDetailModal
  component={component}
  category={category}
  isOpen={showDetailModal}
  onClose={() => setShowDetailModal(false)}
  onSelect={onSelect}
  isSelected={isSelected}
  allComponents={allComponents} // ADD THIS
/>
```

---

### **STEP 5: Get allComponents Data**

You need to get all components for the current category. Find where components are used in PCBuilder and get all of them.

Add this where you have access to `activeComponentData`:

```tsx
// Get all components from current category
const allComponentsForCategory = useMemo(() => {
  const list = (activeComponentData[activeCategory] ||
    []) as PCBuilderComponent[];
  return list;
}, [activeComponentData, activeCategory]);
```

Then pass it to ComponentDetailModal:

```tsx
allComponents = { allComponentsForCategory };
```

---

## 🔍 Exact File Locations to Modify

### File 1: `components/PCBuilder.tsx`

1. **Add import** (top of file, around line 20-40):

```typescript
import { SimilarComponentsSection } from "./components/PCBuilder/SimilarComponentsSection";
```

2. **Update ComponentDetailModal interface** (line ~989-1003):

   - Add `allComponents?: PCBuilderComponent[]` to props type

3. **Add useMemo hook** (inside main PCBuilder function, around line 5500-5600):

```typescript
const allComponentsForCategory = useMemo(() => {
  const list = (activeComponentData[activeCategory] ||
    []) as PCBuilderComponent[];
  return list;
}, [activeComponentData, activeCategory]);
```

4. **Update first ComponentDetailModal call** (line ~3329):

   - Add: `allComponents={allComponentsForCategory}`

5. **Update second ComponentDetailModal call** (line ~3551):

   - Add: `allComponents={allComponentsForCategory}`

6. **Add SimilarComponentsSection in ComponentDetailModal render** (line ~1328):

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
        setShowDetailModal(false);
      }}
    />
  );
}
```

---

## ✅ Testing Checklist

After making changes:

- [ ] Build compiles without errors: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Click on a component to open detail modal
- [ ] See "Users Also Considered" section appear
- [ ] Try the same with different component categories
- [ ] Click "Compare/Select" button on a recommendation
- [ ] Component gets swapped in builder

---

## 📋 Summary of Changes

| File                 | Changes                                                           | Lines |
| -------------------- | ----------------------------------------------------------------- | ----- |
| `PCBuilder.tsx`      | Add import, interface update, useMemo, pass props, render section | ~8    |
| Total changes needed | ~8 lines total                                                    | -     |

---

## 🎨 What Users Will See

Once enabled, when users open a component detail modal, they'll see:

```
[Component Details]
[Configuration Options if available]
[Price Alert Section]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Users Also Considered
[Alternative 1]  [Alternative 2]  [Alternative 3]

📈 Performance Upgrades
[Upgrade 1]  [Upgrade 2]

💰 Save Money
[Budget Alt 1]  [Budget Alt 2]
```

Each shows:

- Component name & rating
- Price comparison badge
- Current price
- Compare/Select button

---

## 🆘 Troubleshooting

**"SimilarComponentsSection is not defined"**

- Make sure import is added to PCBuilder.tsx

**"allComponents is undefined"**

- Check that allComponentsForCategory useMemo is defined
- Verify it's being passed to both ComponentDetailModal calls

**"No components showing in Similar Components"**

- Make sure activeComponentData has components
- Check that component.price is defined (required for scoring)
- Try logging: `console.log('allComponents:', allComponents)`

**Build fails after changes**

- Run `npm run lint --fix` to auto-fix formatting
- Check that all imports are correct
- Verify no syntax errors in your additions

---

## 📞 Still Have Questions?

See the detailed documentation in:

- `FEATURE_IMPLEMENTATION_SUMMARY.md` - Full feature details
- `services/componentRecommendation.ts` - Algorithm details
- `components/PCBuilder/SimilarComponentsSection.tsx` - Component code
