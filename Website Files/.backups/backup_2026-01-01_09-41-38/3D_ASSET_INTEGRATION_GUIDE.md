# 3D Asset Integration Guide

**Date:** December 19, 2025

## Current Status

### ✅ Complete

- **3D Builder Infrastructure** - Fully implemented with Three.js/React Three Fiber
- **Asset Pipeline** - OBJ/FBX → GLB conversion tested and working
- **Liquid Cooler (AIO)** - Test asset integrated with placeholder textures

### ⚙️ Ready for Assets

#### **PC Case - Gaming PC**

- **Textures:** ✅ Copied to `public/models/pc_case/` (15 PBR maps)
- **3D Model:** ❌ Need FBX or OBJ export from `Gaming_PC.max`
- **Instructions:** See `public/models/pc_case/README.md`

**What I Need:**
Export `Gaming_PC_3ds_Max_2013/Gaming_PC.max` to **FBX** or **OBJ** format using:

- 3ds Max: File → Export → FBX/OBJ
- Online: https://anyconv.com/max-to-fbx-converter/
- Place exported file in: `public/models/pc_case/gaming_pc.fbx`

Once provided, I'll:

1. Convert to GLB with embedded textures
2. Create `PCCaseGLTFModel.tsx` component
3. Replace wireframe case in 3D builder
4. Scale/position correctly

---

## Asset Priority List

### 🔥 Critical (High Visual Impact)

**1. GPU (Graphics Card)**

- **Why:** Most scrutinized component, customers spend most on this
- **Formats Needed:** FBX/OBJ/GLB (prefer GLB)
- **Textures:** Base color, normal, metallic, roughness, emissive (for RGB)
- **Details:** Include fans (3x typically), PCIe bracket, 8-pin power connectors, RGB zones
- **Examples:** RTX 4090 FE, RTX 4080 ASUS ROG, RX 7900 XTX
- **Where to place:** `public/models/gpu/`

**2. PC Case** ← YOU'RE HERE

- **Status:** Textures ready, need model export
- **Details:** Mid-tower ATX with tempered glass, RGB fans

**3. Motherboard**

- **Why:** Central component, everything mounts to it
- **Formats Needed:** GLB (complex model, many materials)
- **Textures:** PCB green/black, heatsinks (metal), RGB zones, chipset logos
- **Details:** Must include:
  - PCIe slots (x16 GPU, x1 storage)
  - RAM DIMM slots (4x typically)
  - M.2 slots (2-3x)
  - CPU socket area
  - I/O shield
  - Power connectors (24-pin ATX, 8-pin CPU)
  - RGB headers, fan headers
- **Examples:** ASUS ROG Strix Z790, MSI MAG B650
- **Where to place:** `public/models/motherboard/`

### ⚡ Important (Good to Have)

**4. RAM Sticks**

- **Current:** Basic procedural geometry
- **Need:** Actual DIMM models with heat spreaders
- **Details:** Single stick model, I'll duplicate for 2x/4x kits
- **RGB:** Emissive top edge for RGB strips
- **Examples:** Corsair Vengeance RGB, G.Skill Trident Z5
- **Where to place:** `public/models/ram/`

**5. Storage Drives**

- **M.2 NVMe:** Stick-style PCB with controller chip
- **2.5" SATA SSD:** Drive enclosure with logo
- **Examples:** Samsung 990 Pro M.2, Samsung 870 EVO 2.5"
- **Where to place:** `public/models/storage/`

**6. PSU (Power Supply)**

- **Current:** Basic box
- **Need:** Modular PSU with fan, cables, logo
- **Details:** 140mm fan grill, modular cable ports, brand label
- **Examples:** Corsair RM850e, EVGA SuperNOVA
- **Where to place:** `public/models/psu/`

**7. CPU Cooler Upgrade**

- **Current:** Test AIO with placeholder textures
- **Options:**
  - Better AIO: NZXT Kraken, Corsair iCUE, with actual branding
  - Air cooler: Noctua NH-D15, be quiet! Dark Rock Pro
- **Where to place:** `public/models/coolers/`

### 💎 Nice to Have

**8. Case Fans**

- 120mm/140mm with RGB rings
- Examples: Corsair QL120, Lian Li AL120
- **Where to place:** `public/models/fans/`

**9. Cables**

- Pre-modeled power cables (24-pin, 8-pin, PCIe, SATA)
- Sleeved cable aesthetics
- **Where to place:** `public/models/cables/`

---

## File Format Preferences

### ✅ Best: GLB (glTF Binary)

- All textures embedded
- Efficient loading
- Industry standard
- Use `useGLTF` hook (already implemented)

### ✅ Good: FBX

- Widely supported
- Convert with: `npx fbx2gltf input.fbx output.glb`
- Can embed textures

### ⚠️ Acceptable: OBJ + MTL

- Need matching texture files
- Convert with: `npx obj2gltf -i input.obj -o output.glb -b`
- MTL file must reference relative texture paths

### ❌ Cannot Use Directly

- `.max` (3ds Max) - Need export
- `.blend` (Blender) - Need export to FBX/GLB
- `.3ds` - Need conversion

---

## Texture Requirements

**PBR Workflow (Preferred):**

- Base Color / Albedo (sRGB)
- Normal Map (linear)
- Metallic (linear, 0=non-metal, 1=metal)
- Roughness (linear, 0=smooth, 1=rough)
- Emissive (for RGB/lights)
- AO (ambient occlusion, optional)

**Resolution:** 1024×1024 or 2048×2048 (higher for large parts like case)

**Format:** PNG (lossless) or JPG (compressed)

---

## Model Preparation Tips

### Scale

- Real-world units preferred (meters)
- Typical sizes:
  - GPU: ~0.30m × 0.13m × 0.05m
  - Case: ~0.45m × 0.20m × 0.45m
  - Motherboard (ATX): ~0.305m × 0.244m
  - RAM stick: ~0.133m × 0.031m

### Orientation

- **Forward:** -Z axis (toward front of case)
- **Up:** +Y axis
- **Right:** +X axis

### Poly Count

- Keep reasonable: <100k triangles per component
- GPU/Case can be higher quality
- RAM/storage can be simpler

### Anchors (Named Empties/Bones)

If possible, include named anchor points for:

- **GPU:** PCIe connector, 8-pin power (x2), RGB zones
- **Motherboard:** 24-pin ATX, 8-pin CPU, fan headers, RGB headers
- **Case:** Mounting points, cable grommets
- **PSU:** 24-pin out, PCIe out, CPU out

---

## Free 3D Model Resources

If you don't have custom models yet, here are sources:

**Free:**

- Sketchfab (many free PC components)
- TurboSquid Free
- CGTrader Free
- Poly Haven

**Paid (High Quality):**

- TurboSquid
- CGTrader
- Cubebrush
- ArtStation Marketplace

**Search Terms:**

- "Gaming PC components GLB"
- "Computer hardware 3D model"
- "RTX 4090 3D model"
- "PC case 3D model FBX"

---

## Ready to Integrate

Once you provide any of the above assets, I'll:

1. ✅ Convert to GLB if needed
2. ✅ Create loader component (`[Component]GLTFModel.tsx`)
3. ✅ Wire into 3D builder with correct scale/position
4. ✅ Enable shadows, materials, interaction
5. ✅ Add to explode view animation
6. ✅ Define anchor points for cables/RGB

The infrastructure is 100% ready—just waiting for the models! 🚀

---

## Summary of What I Need Right Now

**Immediate (PC Case):**

- [ ] Export `Gaming_PC.max` to FBX or OBJ
- [ ] Place in: `public/models/pc_case/gaming_pc.fbx`

**Next Priority (for "game-changer" experience):**

- [ ] GPU model (GLB/FBX preferred)
- [ ] Motherboard model (GLB/FBX)
- [ ] RAM stick model (GLB/FBX)

Provide any of these and I'll integrate them immediately. The cooler test asset proves the pipeline works perfectly!
