# Mobile 3D Visualiser Modal

## Overview

Added a user-friendly modal dialogue that appears when mobile users (screens < 768px) try to access the 3D Visual Configurator at `/visual-configurator`. The modal explains why the feature isn't available on small screens and directs them to alternative tools.

## Features

✅ **Responsive Detection** - Uses the `useIsMobile()` hook to detect screen size  
✅ **Helpful Explanation** - Clear message explaining the limitation  
✅ **Alternative Routes** - Direct buttons to PC Finder and PC Builder  
✅ **Pro Tip** - Suggests rotating device to landscape mode  
✅ **Dismissible** - Users can dismiss and explore other options

## Components

### `Mobile3DVisualizerModal.tsx`

Located in: [components/Mobile3DVisualizerModal.tsx](components/Mobile3DVisualizerModal.tsx)

**Props:**

- `isOpen: boolean` - Controls modal visibility
- `onClose?: () => void` - Optional callback when modal is dismissed

**Features:**

- Uses `useIsMobile()` hook from shadcn/ui to detect mobile screens
- Only shows modal on devices < 768px width (mobile breakpoint)
- Glassmorphism design matching the site theme
- Three call-to-action buttons:
  1. **Go to PC Builder** - Primary action (gradient button)
  2. **Go to PC Finder** - Secondary action (outline button)
  3. **Dismiss** - Close without navigating

### Updated Route

**File:** [routes/AppRoutes.tsx](routes/AppRoutes.tsx)

The `/visual-configurator` route now:

1. Wraps the `Interactive3DBuilder` with a `Mobile3DVisualizerModal`
2. Passes `isOpen={showModal}` prop to show/hide the modal
3. Manages modal state with `useState` inside the route component

```tsx
<Route
  path="/visual-configurator"
  element={
    <PageErrorBoundary pageName="3D Visual Configurator">
      {(() => {
        const VisualizerWithModal = () => {
          const [showModal, setShowModal] = useState(true);
          // ... modal and visualizer render here
        };
        return <VisualizerWithModal />;
      })()}
    </PageErrorBoundary>
  }
/>
```

## Design

The modal follows the site's design system:

- **Colors**:
  - Primary button: Gradient from sky-600 to blue-600
  - Secondary button: Sky outline style
  - Dismiss button: Ghost style with hover effect
- **Background**: Glassmorphism with `bg-gradient-to-b from-gray-900/95 to-black/95`

- **Icons**:
  - AlertCircle (warning indicator)
  - Smartphone (mobile device)
  - Cpu (PC Builder feature)
  - Zap (PC Finder feature)

## User Experience

### Mobile User Flow

1. User visits `/visual-configurator` on mobile device
2. Modal appears immediately with explanation
3. User can:
   - Click **"Go to PC Builder"** → Navigates to `/pc-builder`
   - Click **"Go to PC Finder"** → Navigates to `/pc-finder`
   - Click **"Dismiss"** → Hides modal, can still see 3D visualiser (if it loads)
4. Message includes pro tip about landscape rotation

### Desktop User Flow

1. User visits `/visual-configurator` on desktop
2. Modal doesn't appear (only shows on screens < 768px)
3. 3D visualiser loads and functions normally

## Testing

### Test on Mobile Device

1. Open website on mobile browser
2. Navigate to `https://vortexpcs.com/visual-configurator`
3. Verify modal appears with all buttons functional

### Test on Desktop

1. Open website on desktop browser
2. Navigate to `/visual-configurator`
3. Verify modal does NOT appear
4. Verify 3D visualizer loads and functions

### Test Responsive Design

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set width to < 768px
4. Refresh `/visual-configurator`
5. Modal should appear

## Future Enhancements

Consider these improvements:

- [ ] Add tablet detection for medium screens (768px-1024px) that may have limited 3D support
- [ ] Store dismissal preference in localStorage to avoid repeat displays
- [ ] Add analytics tracking when modal is shown (for UX insights)
- [ ] Consider a simplified 2D view for mobile instead of completely blocking access
- [ ] Add WebGL capability detection as a fallback

## Technical Details

### Dependencies

- `react-router-dom` - For navigation (useNavigate)
- `@radix-ui/react-dialog` - For dialog/modal component
- `lucide-react` - For icons
- `./ui/use-mobile` - Custom hook for mobile detection

### Mobile Breakpoint

The breakpoint is set at **768px**, matching Tailwind's `md:` breakpoint and consistent with the project's responsive design system.

### Browser Support

Works on all modern browsers with:

- CSS backdrop blur support
- React hooks support
- Radix UI Dialog support

## Files Modified

- ✅ [components/Mobile3DVisualizerModal.tsx](components/Mobile3DVisualizerModal.tsx) - NEW
- ✅ [routes/AppRoutes.tsx](routes/AppRoutes.tsx) - Updated visual-configurator route

## Build Status

✅ Lint: Passed  
✅ Build: Successful (1.5MB → 517KB gzipped)  
✅ Compression: Gzip + Brotli enabled

---

**Deployed:** December 22, 2025  
**Status:** Ready for production
