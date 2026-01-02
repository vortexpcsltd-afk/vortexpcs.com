# 3D Model Asset Loading Fix - December 20, 2025

## Problem Summary

The RAM GLTF model was failing to load with multiple CSP-related errors:

- **Error 1 - Asset Not Found**: `Error: Could not load /3d visualiser images/RAM/gltf (2)/gltf/Ram_Chip.gltf: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- **Error 2 - Blob URL Blocking**: Multiple "Refused to connect because it violates the document's Content Security Policy" errors for blob URLs
- **Error 3 - WebAssembly Compilation**: `WebAssembly.instantiate(): Compiling or instantiating WebAssembly module violates CSP directive because 'unsafe-eval' is not allowed`

**Root Causes**:

1. Asset path contained spaces and parentheses (not Vite-compatible)
2. Files weren't in the `public` folder (not being served by Vite)
3. CSP policy blocked blob URLs used by Three.js textures
4. CSP policy blocked WebAssembly compilation (`'wasm-unsafe-eval'` not allowed)

## Solutions Implemented

### 1. Copied RAM Model Files to Public Directory

**Location**: `public/models/ram/`

Copied the following files from `3d visualiser images/RAM/gltf (2)/gltf/`:

- `Ram_Chip.gltf` - Main model file
- `Ram_Chip.bin` - Binary geometry data
- `ram_chip_basecolor.png` - Base color texture
- `ram_chip_normal.png` - Normal map texture
- `ram_chip_ao-ram_chip_roughness-ram_chip_metallic.png` - PBR combined texture

### 2. Updated Model Loading Path

**File**: [components/Interactive3DBuilder/models/RAMTexturedModel.tsx](components/Interactive3DBuilder/models/RAMTexturedModel.tsx)

**Changes**:

```tsx
// Before
useGLTF.preload("/3d visualiser images/RAM/gltf (2)/gltf/Ram_Chip.gltf");
const { scene } = useGLTF(
  "/3d visualiser images/RAM/gltf (2)/gltf/Ram_Chip.gltf"
);

// After
useGLTF.preload("/models/ram/Ram_Chip.gltf");
const { scene } = useGLTF("/models/ram/Ram_Chip.gltf");
```

### 3. Updated Content Security Policy

**File**: [vercel.json](vercel.json)

**Changes**:

```json
// Before
"script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com"

// After
"script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com"
```

```json
// Before - connect-src
"connect-src 'self' https: wss:"

// After - connect-src
"connect-src 'self' https: wss: blob:"
```

```json
// Before - img-src
"img-src 'self' https: data:"

// After - img-src
"img-src 'self' https: data: blob:"
```

**Reasons**:

- `blob:` in `connect-src` and `img-src`: Three.js GLTFLoader creates blob URLs for texture data
- `'wasm-unsafe-eval'`: Three.js uses WebAssembly for performance-critical 3D operations
- Blob URLs are safe (same-origin only) and necessary for Three.js to function properly
  ✅ **Build**: Production build completes successfully  
  ✅ **Asset Copying**: RAM model files properly included in `dist/models/ram/`

## Benefits

1. **Proper Asset Serving**: Files now served through Vite's public directory
2. **Path Compatibility**: Removed spaces and parentheses from paths
3. **Security**: Added blob URLs to CSP while maintaining strict security posture
4. **Consistency**: RAM model loading follows same pattern as other 3D components (PCCase, GPU, etc.)

## Deployment Notes

When deploying to production (Vercel):

1. The `public/models/ram/` directory will be automatically copied to the output
2. CSP headers from `vercel.json` will be applied
3. RAM 3D model should now load without errors
4. Blob URL textures are properly allowed by CSP

## Related Files

- RAM Model Reference: [RAM_POSITIONING_REFERENCE.md](RAM_POSITIONING_REFERENCE.md)
- 3D Integration Guide: [3D_ASSET_INTEGRATION_GUIDE.md](3D_ASSET_INTEGRATION_GUIDE.md)

## Future Improvements

Consider applying similar fixes to other 3D models stored in `3d visualiser images/` directory:

- PC Case models
- GPU models
- Motherboard models
- PSU models
- CPU models

These should all be migrated to `public/models/` with appropriate subdirectories for consistency.
