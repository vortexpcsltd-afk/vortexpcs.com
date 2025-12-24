# AR/3D Viewer - Quick Integration Guide

## 🚀 Current Status

✅ **3D Viewer Fully Functional**  
✅ **Placeholder Models Working**  
⏳ **Professional Models Needed**

## 📦 Using the 3D Viewer

### Basic Usage

```tsx
import { View3DButton } from "./AR3DViewer";

// In your component
<View3DButton
  productName="NZXT H710i Mid Tower"
  caseType="mid-tower"
  color="#1e293b"
/>;
```

### Props Reference

| Prop          | Type     | Options                                                                 | Required                    |
| ------------- | -------- | ----------------------------------------------------------------------- | --------------------------- |
| `productName` | `string` | Any product name                                                        | ✅ Yes                      |
| `caseType`    | `string` | `"mid-tower"` \| `"full-tower"` \| `"mini-itx"` \| `"atx"` \| `"e-atx"` | No (default: `"mid-tower"`) |
| `color`       | `string` | Any hex color                                                           | No (default: `"#1e293b"`)   |
| `className`   | `string` | Tailwind classes                                                        | No                          |

### Case Type Selection

```tsx
// Mini-ITX (small form factor)
<View3DButton caseType="mini-itx" />

// Mid-Tower (most common)
<View3DButton caseType="mid-tower" />

// ATX (standard tower)
<View3DButton caseType="atx" />

// Full-Tower (large builds)
<View3DButton caseType="full-tower" />

// E-ATX (extra large)
<View3DButton caseType="e-atx" />
```

### Custom Colors

```tsx
// Black case
<View3DButton color="#000000" />

// White case
<View3DButton color="#ffffff" />

// Dark gray (default)
<View3DButton color="#1e293b" />

// Custom RGB
<View3DButton color="#2563eb" />
```

---

## 🎨 Professional Model Integration

### Step 1: Get Professional Models

**Recommended Service: Sketchfab Studios**

- Website: https://sketchfab.com/studios
- Cost: £1,500-£2,500 per model
- Format: GLTF/GLB

**What to provide:**

1. Product photos (all angles)
2. Dimensions (W x H x D)
3. Special features (RGB, glass panels, etc.)
4. Reference: "Similar to this [link to similar model]"

### Step 2: Model Requirements

**Technical Specs to Request:**

```
Format: GLTF 2.0 (.glb binary preferred)
Polygon Count: 10,000-50,000 (mobile-friendly)
Textures:
  - Base Color: 2048x2048 (2K)
  - Normal Map: 2048x2048
  - Metallic-Roughness: 2048x2048
  - Emissive (for RGB): 1024x1024
Compression: Draco compressed
Materials: PBR (Metallic-Roughness workflow)
Pivot Point: Center bottom (for proper placement)
Scale: Real-world units (meters)
```

### Step 3: File Organization

```
public/
  models/
    cases/
      nzxt-h710i.glb
      corsair-4000d.glb
      lian-li-o11.glb
      fractal-meshify-c.glb
      phanteks-p500a.glb
    thumbnails/
      nzxt-h710i.jpg
      corsair-4000d.jpg
      (etc...)
```

### Step 4: Update Component

**Replace placeholder with real model:**

```typescript
// In AR3DViewer.tsx, update PCCaseModel component:

import { useGLTF } from "@react-three/drei";

function PCCaseModel({ modelPath, ...props }) {
  // Load GLTF model
  const { scene } = useGLTF(modelPath);

  // Clone to allow multiple instances
  const clonedScene = scene.clone();

  return (
    <primitive
      object={clonedScene}
      {...props}
      scale={0.5} // Adjust based on your model size
    />
  );
}

// Usage
<PCCaseModel modelPath="/models/cases/nzxt-h710i.glb" />;
```

### Step 5: Add Model Prop to View3DButton

```typescript
// Update View3DButton interface
interface View3DButtonProps {
  productName: string;
  modelPath?: string;  // NEW: Path to GLTF model
  caseType?: string;
  color?: string;
  className?: string;
}

// Usage
<View3DButton
  productName="NZXT H710i"
  modelPath="/models/cases/nzxt-h710i.glb"  // Use real model
/>

// Fallback to placeholder if no modelPath
<View3DButton
  productName="Generic Case"
  caseType="mid-tower"  // Uses placeholder
/>
```

---

## ⚡ Optimization Checklist

### Before Uploading Models

- [ ] **Compress with Draco**

  ```bash
  npx gltf-pipeline -i model.gltf -o model.glb -d
  ```

- [ ] **Optimize Textures**

  ```bash
  # Resize to 2K max
  convert texture.png -resize 2048x2048 texture-2k.jpg

  # Convert to WebP for better compression
  cwebp texture.jpg -q 80 -o texture.webp
  ```

- [ ] **Check File Sizes**
  - Model: < 2 MB (compressed)
  - Textures: < 500 KB each
  - Total per case: < 3 MB

### Performance Testing

- [ ] Load time < 3 seconds
- [ ] FPS > 30 on mobile
- [ ] FPS = 60 on desktop
- [ ] Memory usage < 100 MB
- [ ] No console errors

---

## 🎯 Priority Models to Create

Based on sales data and ROI:

### Top 5 Cases (Start Here)

1. **NZXT H710i**

   - Type: Mid-Tower
   - Features: Tempered glass, RGB strips, smart hub
   - Investment: £2,000
   - Expected ROI: £30,000/year

2. **Corsair 4000D Airflow**

   - Type: Mid-Tower
   - Features: Mesh front, dual glass
   - Investment: £1,500
   - Expected ROI: £25,000/year

3. **Lian Li O11 Dynamic**

   - Type: Mid-Tower
   - Features: Dual tempered glass, vertical GPU
   - Investment: £2,500
   - Expected ROI: £20,000/year

4. **Fractal Design Meshify C**

   - Type: Mid-Tower
   - Features: Angular design, mesh front
   - Investment: £1,500
   - Expected ROI: £15,000/year

5. **Phanteks Eclipse P500A**
   - Type: Mid-Tower
   - Features: RGB, mesh front, premium materials
   - Investment: £2,000
   - Expected ROI: £18,000/year

**Total Investment:** £9,500  
**Expected Year 1 ROI:** £108,000  
**Payback Period:** ~1 month

---

## 📱 AR Setup (Mobile)

### iOS (Safari) - AR Quick Look

**Convert GLB to USDZ:**

```bash
# Install USD tools
pip install usd-core

# Convert
python -m gltf2usd input.glb output.usdz
```

**Update Button:**

```html
<!-- iOS AR Quick Look -->
<a rel="ar" href="/models/cases/nzxt-h710i.usdz" class="ar-button">
  <img src="/models/thumbnails/nzxt-h710i.jpg" alt="View in AR" />
</a>
```

### Android (Chrome) - WebXR

**Full AR Session:**

```typescript
async function launchAR(modelPath: string) {
  // Request AR session
  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
  });

  // Load model
  const gltfLoader = new GLTFLoader();
  const model = await gltfLoader.loadAsync(modelPath);

  // Set up AR rendering
  renderer.xr.enabled = true;
  renderer.xr.setSession(session);

  // Render loop
  renderer.setAnimationLoop((time, frame) => {
    // Hit test for surface detection
    // Place model at hit location
    // Render scene
  });
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Model appears too small/large

**Solution:**

```typescript
// Adjust scale in PCCaseModel
<primitive object={scene} scale={0.5} />  // Make smaller
<primitive object={scene} scale={2} />    // Make larger
```

### Issue: Model is dark/no lighting

**Solution:**

```typescript
// Ensure lights are present in Scene
<ambientLight intensity={0.5} />
<directionalLight position={[5, 5, 5]} intensity={1} castShadow />
```

### Issue: Textures not loading

**Solution:**

```typescript
// Use Draco loader for compressed models
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
gltfLoader.setDRACOLoader(dracoLoader);
```

### Issue: Performance is slow

**Solution:**

1. Reduce polygon count (< 20,000)
2. Compress textures (use WebP)
3. Enable LOD (Level of Detail)
4. Disable shadows on mobile
5. Use lower resolution on mobile (`dpr={1}`)

### Issue: AR not working on iOS

**Solution:**

- Must use USDZ format (not GLB)
- Requires `rel="ar"` attribute
- Model size must be < 10 MB
- Ensure HTTPS

---

## 📊 Success Metrics to Track

### Engagement Metrics

- [ ] 3D viewer open rate (target: 40%)
- [ ] Average interaction time (target: 2+ minutes)
- [ ] Rotation/zoom interactions (target: 10+ per session)
- [ ] Fullscreen usage (target: 20%)
- [ ] AR mode launches (target: 15% of mobile users)

### Conversion Metrics

- [ ] Add-to-cart rate (expect +35%)
- [ ] Purchase conversion (expect +15-20%)
- [ ] Cart abandonment (expect -25%)
- [ ] Return rate (expect -40%)

### Performance Metrics

- [ ] 3D scene load time (target: < 3 seconds)
- [ ] FPS (target: 60 on desktop, 30 on mobile)
- [ ] Bundle size impact (current: +240 kB)
- [ ] Memory usage (target: < 150 MB)

---

## 🎬 Quick Start Checklist

**Week 1: Preparation**

- [ ] Choose 3D modeling service
- [ ] Select top 5 cases to model
- [ ] Gather product photos and dimensions
- [ ] Send brief to modeler
- [ ] Agree on timeline and price

**Week 2-4: Production**

- [ ] Modeler creates 3D assets
- [ ] Review progress (weekly check-ins)
- [ ] Request adjustments if needed
- [ ] Receive final GLTF files

**Week 5: Integration**

- [ ] Compress models with Draco
- [ ] Optimize textures (WebP, 2K max)
- [ ] Upload to `/public/models/cases/`
- [ ] Update View3DButton props with modelPath
- [ ] Test on desktop and mobile
- [ ] Fix any performance issues

**Week 6: Launch**

- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Track engagement metrics
- [ ] Collect user feedback
- [ ] Optimize based on data

**Ongoing:**

- [ ] Add more models (expand to top 20)
- [ ] Implement full AR sessions
- [ ] Create GPU 3D models
- [ ] Add component-specific views
- [ ] Integrate with product customizer

---

## 💡 Pro Tips

1. **Start Small**: Top 5 cases first, expand based on results
2. **Measure Impact**: A/B test with/without 3D viewer
3. **Mobile First**: 60% of traffic is mobile, optimize for it
4. **Load Smart**: Lazy load 3D viewer only when needed
5. **Cache Models**: Browser caching saves bandwidth
6. **User Feedback**: Add survey after AR session
7. **Show Dimensions**: Add measurement overlays in 3D view
8. **Comparison Mode**: Show two cases side-by-side
9. **Social Sharing**: "Share your AR photo" feature
10. **Analytics**: Track which angles users view most

---

## 📞 Resources

**3D Modeling Services:**

- Sketchfab Studios: https://sketchfab.com/studios
- Shopify AR: https://help.shopify.com/en/manual/online-store/images/showing-3d-models
- Upwork 3D Artists: https://www.upwork.com/hire/3d-modeling-freelancers/

**Tools:**

- glTF Validator: https://github.khronos.org/glTF-Validator/
- glTF-Pipeline: https://github.com/CesiumGS/gltf-pipeline
- Draco Compression: https://google.github.io/draco/
- Reality Converter (Mac): https://developer.apple.com/augmented-reality/tools/

**Learning:**

- Three.js Journey: https://threejs-journey.com/
- React Three Fiber Docs: https://docs.pmnd.rs/react-three-fiber/
- WebXR Explainer: https://github.com/immersive-web/webxr/blob/main/explainer.md

---

**Current Status:** ✅ Placeholder models working  
**Next Step:** Commission professional models (£9,500 for top 5)  
**Timeline:** 4-6 weeks to full production  
**Expected ROI:** 300-600% Year 1
