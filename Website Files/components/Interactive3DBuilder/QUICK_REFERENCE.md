# 🎮 Interactive3DBuilder - Quick Reference

## Import

```tsx
import { Interactive3DBuilder } from "@/components/Interactive3DBuilder";
```

## Basic Example

```tsx
<Interactive3DBuilder
  components={selectedComponents}
  caseType="mid-tower"
  showCableRouting={true}
  rgbPreview={true}
  isOpen={true}
  onClose={() => setOpen(false)}
/>
```

## Props

```typescript
components: SelectedComponents      // PC components to visualize
caseType?: string                   // mid-tower | full-tower | mini-itx | atx | e-atx
onComponentClick?: (id: string) => void
showCableRouting?: boolean          // Show power/data connections
rgbPreview?: boolean                // Show RGB lighting effects
isOpen?: boolean                    // Modal visibility
onClose?: () => void                // Close handler
className?: string                  // Custom CSS classes
```

## View Modes

- **Normal** - Default 3D view
- **Exploded** - Components spread out with slider
- **Cables** - Power/data/SATA connections
- **RGB** - Lighting effects with controls

## Features

✅ Auto-rotate (toggle)  
✅ Manual rotate/zoom/pan  
✅ Component selection  
✅ Explode view slider  
✅ RGB pattern control  
✅ Cable visualization  
✅ Fullscreen mode  
✅ Info panel

## Component Types

`"case" | "motherboard" | "cpu" | "gpu" | "ram" | "psu" | "storage" | "cooler" | "fan" | "cable"`

## RGB Patterns

`"static" | "breathing" | "pulse" | "rainbow" | "wave"`

## Cable Types

`"power" | "data" | "sata"`

## Files

```
components/Interactive3DBuilder/
├── index.tsx ..................... Main component
├── types.ts ...................... Interfaces
├── ComponentModels.tsx ........... 3D models
├── CableVisualizer.tsx ........... Routing
├── RGBVisualizer.tsx ............ Lighting
├── utils.ts ...................... Helpers
└── IMPLEMENTATION_GUIDE.md ....... Full docs
```

## Utilities

```tsx
getDefaultComponentPositions(caseType);
validateBuildCompatibility(components);
calculateBuildStats(components);
getComponentColor(type);
formatComponentName(component);
```

## Integration with PCBuilder

```tsx
import { Interactive3DBuilder } from "@/components/Interactive3DBuilder";

const [show3D, setShow3D] = useState(false);

return (
  <>
    <button onClick={() => setShow3D(true)}>View 3D</button>
    {show3D && (
      <Interactive3DBuilder {...props} onClose={() => setShow3D(false)} />
    )}
  </>
);
```

## Browser Support

✅ Chrome, Firefox, Edge, Safari (WebGL 2.0 required)

## Performance

- Lazy loadable with Suspense
- Zero layout shifts
- Optimized rendering
- Minimal bundle impact

## Status

🚀 **Production Ready** - Zero lint errors, Full TypeScript coverage

---

**Last Updated:** Dec 19, 2025
