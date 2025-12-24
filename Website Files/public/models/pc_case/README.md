# PC Case Asset - Gaming PC

## Source

- Original: 3ds Max 2013 format (`Gaming_PC.max`)
- Location: `3d visualiser images/PC Case/Gaming_PC_3ds_Max_2013/`

## Conversion Required

The `.max` file needs to be exported to FBX, OBJ, or glTF format before we can use it in the 3D builder.

### Export Options

**Option 1: 3ds Max Export**

1. Open `Gaming_PC.max` in 3ds Max
2. File → Export → Export Selected or Export
3. Choose format: **FBX (.fbx)** [PREFERRED] or **Wavefront OBJ (.obj)**
4. Save as `gaming_pc.fbx` or `gaming_pc.obj` in this folder
5. Ensure "Embed Media" is checked for FBX

**Option 2: Online Converters**

- AnyConv: https://anyconv.com/max-to-fbx-converter/
- CloudConvert: https://cloudconvert.com/max-to-fbx
- Upload `Gaming_PC.max`, download FBX, place in this folder

**Option 3: Blender Import**

1. Install Blender's 3DS Max import addon if available
2. Import .max file
3. Export as glTF 2.0 (.glb) with textures embedded

## PBR Textures (Already Copied)

### Fan Lights Material

- `fan_lights_basecolor.png` - Diffuse/Albedo
- `fan_lights_emission.png` - Emissive (for RGB glow)
- `fan_lights_metallic.png` - Metallic map
- `fan_lights_normal.png` - Normal/bump map
- `fan_lights_roughness.png` - Roughness map
- `fan_lights_transmission.png` - Transparency/transmission

### Glass Material (Side Panel)

- `glass_basecolor.png`
- `glass_metallic.png`
- `glass_normal.png`
- `glass_roughness.png`
- `glass_transmission.png` - For transparency

### PC Case Metal

- `pc_case_basecolor.png`
- `pc_case_metallic.png`
- `pc_case_normal.png`
- `pc_case_roughness.png`

## Next Steps (After Export)

1. Once you have `gaming_pc.fbx` or `gaming_pc.obj`, run:

   ```bash
   npx obj2gltf -i public/models/pc_case/gaming_pc.obj -o public/models/pc_case/gaming_pc.glb -b
   ```

   OR if FBX:

   ```bash
   npx fbx2gltf public/models/pc_case/gaming_pc.fbx public/models/pc_case/gaming_pc.glb
   ```

2. Create `PCCaseGLTFModel.tsx` component

3. Update `Interactive3DBuilder/index.tsx` to use actual case model instead of wireframe

## Asset Details

- **Estimated Poly Count:** Unknown (will see after export)
- **Materials:** 3 (fan_lights, glass, pc_case)
- **Features:** RGB fans, tempered glass panel, mid-tower ATX case
- **Scale:** Will need adjustment after import (typical case ~0.45m x 0.20m x 0.45m)
