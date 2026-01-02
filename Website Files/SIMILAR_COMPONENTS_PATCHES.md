# Exact Code Patches - Copy & Paste These

## PATCH 1: Add Import (Top of PCBuilder.tsx)

Find the import section (around line 1-50) and add this line:

```tsx
import { SimilarComponentsSection } from "./components/PCBuilder/SimilarComponentsSection";
```

---

## PATCH 2: Update ComponentDetailModal Interface (Line 989)

**REPLACE THIS:**

```tsx
const ComponentDetailModal = ({
  component,
  category,
  isOpen,
  onClose,
  onSelect,
  isSelected,
}: {
  component: PCBuilderComponent;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string, componentId: string) => void;
  isSelected: boolean;
}) => {
```

**WITH THIS:**

```tsx
const ComponentDetailModal = ({
  component,
  category,
  isOpen,
  onClose,
  onSelect,
  isSelected,
  allComponents,
}: {
  component: PCBuilderComponent;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string, componentId: string) => void;
  isSelected: boolean;
  allComponents?: PCBuilderComponent[];
}) => {
```

---

## PATCH 3: Add allComponentsForCategory useMemo

Find where you have `const getTotalPrice` or similar useMemo hooks (around line 5500-5600).

Add this new useMemo hook:

```tsx
const allComponentsForCategory = useMemo(() => {
  const list = (activeComponentData[activeCategory] ||
    []) as PCBuilderComponent[];
  return list;
}, [activeComponentData, activeCategory]);
```

---

## PATCH 4: Add SimilarComponentsSection to Modal (Line ~1328)

Find this section in ComponentDetailModal return statement:

```tsx
            {/* Price Alert Section */}
            <PriceAlertComponent component={component} userEmail={undefined} />

            {/* Similar Components Section - will be populated from context later */}
            {/* TODO: Pass allComponents from parent context */}
            {/* <SimilarComponentsSection
              component={component}
              allComponents={allComponentsList}
              onSelectComponent={(selected) => onSelect(category, selected.id)}
            /> */}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
```

**REPLACE WITH:**

```tsx
            {/* Price Alert Section */}
            <PriceAlertComponent component={component} userEmail={undefined} />

            {/* Similar Components Section */}
            {allComponents && allComponents.length > 0 && (
              <SimilarComponentsSection
                component={component}
                allComponents={allComponents}
                onSelectComponent={(selected) => {
                  onSelect(category, selected.id);
                  // Modal will close due to parent component handling
                }}
              />
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
```

---

## PATCH 5: Pass allComponents to First ComponentDetailModal Call (Line ~3329)

Find this in the component card rendering:

```tsx
{
  /* Detail Modal */
}
<ComponentDetailModal
  component={component}
  category={category}
  isOpen={showDetailModal}
  onClose={() => setShowDetailModal(false)}
  onSelect={onSelect}
  isSelected={isSelected}
/>;
```

**REPLACE WITH:**

```tsx
{
  /* Detail Modal */
}
<ComponentDetailModal
  component={component}
  category={category}
  isOpen={showDetailModal}
  onClose={() => setShowDetailModal(false)}
  onSelect={onSelect}
  isSelected={isSelected}
  allComponents={allComponentsForCategory}
/>;
```

---

## PATCH 6: Pass allComponents to Second ComponentDetailModal Call (Line ~3551)

Find this in the grid view rendering:

```tsx
{
  /* Detail Modal */
}
<ComponentDetailModal
  component={component}
  category={category}
  isOpen={showDetailModal}
  onClose={() => setShowDetailModal(false)}
  onSelect={onSelect}
  isSelected={isSelected}
/>;
```

**REPLACE WITH:**

```tsx
{
  /* Detail Modal */
}
<ComponentDetailModal
  component={component}
  category={category}
  isOpen={showDetailModal}
  onClose={() => setShowDetailModal(false)}
  onSelect={onSelect}
  isSelected={isSelected}
  allComponents={allComponentsForCategory}
/>;
```

---

## ✅ Quick Verification Checklist

After applying all 6 patches:

- [ ] No TypeScript errors on save
- [ ] SimilarComponentsSection import added
- [ ] ComponentDetailModal interface has allComponents prop
- [ ] allComponentsForCategory useMemo exists
- [ ] All 3 ComponentDetailModal calls pass allComponents
- [ ] SimilarComponentsSection is uncommented and updated

---

## 🧪 Testing

```bash
# Build to verify no errors
npm run build

# If errors, check lint
npm run lint --fix
```

Then:

1. Click on any component to open detail modal
2. Scroll down in the modal
3. You should see "Users Also Considered" section with 2-3 recommendations
4. Click "Compare/Select" on any recommendation
5. Component should be swapped in the builder

---

## 💡 Alternative: Use ComponentCard instead

If you're using the separate `ComponentCard.tsx` component instead of the inline one in PCBuilder, apply the same patches to that file instead.

Check your app.tsx or routes to see which version is being used.
