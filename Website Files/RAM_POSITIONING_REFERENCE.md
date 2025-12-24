# RAM Module Positioning Reference

## Final Positions (December 20, 2025)

Successfully positioned and tuned RAM modules with proper sizing and placement.

### RAM Module 1 (ram-corsair-01)

- **Position**:
  - X: (base 0.02) - 0.026 = **-0.006**
  - Y: **0.325**
  - Z: **-0.08**
- **Rotation**: [Math.PI / 2, Math.PI / 2, 0] (90° vertical, 90° horizontal)
- **Scale**: [0.00835, 0.00835, 0.00835]
- **Color**: #0ea5e9 (cyan)

### RAM Module 2 (ram-corsair-02)

- **Position**:
  - X: (base 0.02) - 0.01 = **0.01**
  - Y: **0.325**
  - Z: **-0.08**
- **Rotation**: [Math.PI / 2, Math.PI / 2, 0] (90° vertical, 90° horizontal)
- **Scale**: [0.00835, 0.00835, 0.00835]
- **Color**: #06b6d4 (light cyan)

## Key Details

- **Model**: GLTF format loaded from `3d visualiser images/RAM/gltf (2)/gltf/Ram_Chip.gltf`
- **Top Facing**: Towards the front (Y-axis rotation 90°)
- **Spacing**: Modules separated by ~0.016 units horizontally
- **Positioning Method**: Absolute positions set in AppRoutes.tsx override calculated defaults in index.tsx
- **Visibility**: Both modules visible and properly scaled to match PC interior scale

## Configuration Files

1. [routes/AppRoutes.tsx](routes/AppRoutes.tsx#L314-L340) - RAM component position/rotation/scale definitions
2. [components/Interactive3DBuilder/index.tsx](components/Interactive3DBuilder/index.tsx#L230-L255) - Position passing to components
3. [components/Interactive3DBuilder/models/RAMTexturedModel.tsx](components/Interactive3DBuilder/models/RAMTexturedModel.tsx) - GLTF model loading

## Next Steps for Integration

To make these positions snap into place when customers select RAM:

1. Add to `getDefaultComponentPositions()` in `utils.ts`
2. Reference these positions in PCBuilder component selection logic
3. Implement smooth animation/snapping to these default positions
