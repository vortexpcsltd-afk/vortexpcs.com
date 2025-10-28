# PC Builder CMS Setup Guide

## Overview

The PC Builder now supports Contentful CMS integration, allowing you to manage all PC components (cases, motherboards, CPUs, GPUs, RAM, storage, PSUs, and cooling) directly from your Contentful dashboard.

**IMPORTANT**: Due to Contentful's 50-field limit per content type, we use **8 separate content types** (one for each component category) instead of a single unified type.

## Step 1: Create 8 Content Types in Contentful

You'll create these 8 content types:

1. **PC Case** (ID: `pcCase`)
2. **PC Motherboard** (ID: `pcMotherboard`)
3. **PC CPU** (ID: `pcCpu`)
4. **PC GPU** (ID: `pcGpu`)
5. **PC RAM** (ID: `pcRam`)
6. **PC Storage** (ID: `pcStorage`)
7. **PC PSU** (ID: `pcPsu`)
8. **PC Cooling** (ID: `pcCooling`)

### How to Create Each Content Type

For each of the 8 types above:

1. Go to: https://app.contentful.com/spaces/a40jvx2pmnlr/content_types
2. Click **Add content type** (top right)
3. Enter the **Name** and **API Identifier** from the list above
   - Example: Name = "PC Case", API Identifier = "pcCase"
4. Click **Create**
5. Now add fields (see sections below for each type)

---

## Step 2: Add Fields to Each Content Type

### COMMON FIELDS (Add to ALL 8 content types)

Add these fields to every content type you create:

| Field Name | Field Type          | Field ID   | Required | Notes                             |
| ---------- | ------------------- | ---------- | -------- | --------------------------------- |
| ID         | Short text          | `id`       | ✅ Yes   | Unique identifier (e.g., "gpu-1") |
| Name       | Short text          | `name`     | ✅ Yes   | Product name                      |
| Price      | Number (Decimal)    | `price`    | ✅ Yes   | Price in USD                      |
| Image      | Media (Single file) | `image`    | No       | Product image                     |
| Brand      | Short text          | `brand`    | No       | Manufacturer name                 |
| Category   | Short text          | `category` | ✅ Yes   | Must match type (see below)       |
| Featured   | Boolean             | `featured` | No       | Show in featured section          |
| Rating     | Number (Decimal)    | `rating`   | No       | 0-5 star rating                   |
| In Stock   | Boolean             | `inStock`  | No       | Availability status               |

**CATEGORY VALUES**: Set the `category` field to:

- PC Case → `"case"`
- PC Motherboard → `"motherboard"`
- PC CPU → `"cpu"`
- PC GPU → `"gpu"`
- PC RAM → `"ram"`
- PC Storage → `"storage"`
- PC PSU → `"psu"`
- PC Cooling → `"cooling"`

---

## Step 3: Add Category-Specific Fields

## Step 3: Add Category-Specific Fields

After adding the 9 common fields, add these additional fields to each specific content type:

### 1. PC Case (pcCase)

Add these additional fields:

| Field Name        | Field Type       | Field ID          | Notes                      |
| ----------------- | ---------------- | ----------------- | -------------------------- |
| Form Factor       | Short text       | `formFactor`      | ATX, MicroATX, Mini-ITX    |
| GPU Clearance     | Short text       | `gpuClearance`    | e.g., "400mm"              |
| Max Cooler Height | Number (Integer) | `maxCoolerHeight` | in mm                      |
| Front Ports       | Short text       | `frontPorts`      | e.g., "2x USB-C, 4x USB-A" |
| Fans              | Short text       | `fans`            | e.g., "3x 120mm included"  |
| Drive Bays        | Short text       | `driveBays`       | e.g., "2x 3.5", 4x 2.5""   |

### 2. PC Motherboard (pcMotherboard)

Add these additional fields:

| Field Name  | Field Type       | Field ID     | Notes                   |
| ----------- | ---------------- | ------------ | ----------------------- |
| Socket      | Short text       | `socket`     | e.g., "LGA1700", "AM5"  |
| Chipset     | Short text       | `chipset`    | e.g., "Z790", "B650"    |
| Form Factor | Short text       | `formFactor` | ATX, MicroATX, Mini-ITX |
| RAM Slots   | Number (Integer) | `ramSlots`   | Number of slots         |
| Max RAM     | Number (Integer) | `maxRam`     | in GB                   |
| M.2 Slots   | Number (Integer) | `m2Slots`    | Number of M.2 slots     |
| PCIe        | Short text       | `pcie`       | e.g., "1x PCIe 5.0 x16" |
| SATA        | Short text       | `sata`       | e.g., "6x SATA 6Gb/s"   |

### 3. PC CPU (pcCpu)

Add these additional fields:

| Field Name  | Field Type       | Field ID     | Notes                          |
| ----------- | ---------------- | ------------ | ------------------------------ |
| Socket      | Short text       | `socket`     | e.g., "LGA1700", "AM5"         |
| Cores       | Number (Integer) | `cores`      | Number of cores                |
| Threads     | Number (Integer) | `threads`    | Number of threads              |
| Base Clock  | Short text       | `baseClock`  | e.g., "3.6 GHz"                |
| Boost Clock | Short text       | `boostClock` | e.g., "5.3 GHz"                |
| TDP         | Number (Integer) | `tdp`        | in Watts                       |
| Generation  | Short text       | `generation` | e.g., "intel-14th", "amd-9000" |
| Platform    | Short text       | `platform`   | "Intel" or "AMD"               |

### 4. PC GPU (pcGpu)

Add these additional fields:

| Field Name  | Field Type       | Field ID      | Notes                           |
| ----------- | ---------------- | ------------- | ------------------------------- |
| VRAM        | Number (Integer) | `vram`        | in GB                           |
| Chipset     | Short text       | `chipset`     | e.g., "RTX 4090", "RX 7900 XTX" |
| Power       | Number (Integer) | `power`       | TDP in Watts                    |
| Length      | Number (Integer) | `length`      | in mm                           |
| Height      | Number (Integer) | `height`      | in mm                           |
| Slots       | Number (Decimal) | `slots`       | e.g., 2.5, 3                    |
| Performance | Short text       | `performance` | e.g., "4K Ultra", "1440p High"  |

### 5. PC RAM (pcRam)

Add these additional fields:

| Field Name | Field Type       | Field ID   | Notes                          |
| ---------- | ---------------- | ---------- | ------------------------------ |
| Capacity   | Number (Integer) | `capacity` | Total capacity in GB           |
| Speed      | Short text       | `speed`    | e.g., "DDR5-6000", "DDR4-3600" |
| Modules    | Number (Integer) | `modules`  | e.g., 2 for 2x16GB             |
| Latency    | Short text       | `latency`  | e.g., "CL30", "CL16"           |
| Type       | Short text       | `type`     | "DDR4" or "DDR5"               |

### 6. PC Storage (pcStorage)

Add these additional fields:

| Field Name       | Field Type | Field ID          | Notes                 |
| ---------------- | ---------- | ----------------- | --------------------- |
| Storage Capacity | Short text | `storageCapacity` | e.g., "1TB", "2TB"    |
| Interface        | Short text | `interface`       | e.g., "PCIe 4.0 NVMe" |
| Read Speed       | Short text | `readSpeed`       | e.g., "7,400 MB/s"    |
| Write Speed      | Short text | `writeSpeed`      | e.g., "6,800 MB/s"    |
| NAND             | Short text | `nand`            | e.g., "3D TLC", "QLC" |

### 7. PC PSU (pcPsu)

Add these additional fields:

| Field Name | Field Type       | Field ID     | Notes                            |
| ---------- | ---------------- | ------------ | -------------------------------- |
| Wattage    | Number (Integer) | `wattage`    | e.g., 850                        |
| Efficiency | Short text       | `efficiency` | e.g., "80+ Gold", "80+ Platinum" |
| Modular    | Short text       | `modular`    | "Fully", "Semi", "Non-modular"   |
| Cables     | Short text       | `cables`     | e.g., "All black braided"        |

### 8. PC Cooling (pcCooling)

Add these additional fields:

| Field Name    | Field Type       | Field ID       | Notes                       |
| ------------- | ---------------- | -------------- | --------------------------- |
| Cooler Type   | Short text       | `coolerType`   | "AIO", "Air", "Custom Loop" |
| Fan Size      | Short text       | `fanSize`      | e.g., "120mm", "140mm"      |
| TDP Support   | Number (Integer) | `tdpSupport`   | Max TDP in Watts            |
| Radiator Size | Short text       | `radiatorSize` | e.g., "360mm", "240mm"      |
| RGB Lighting  | Boolean          | `rgbLighting`  | Has RGB or not              |

---

## Step 4: Create Sample Component Entries

- **Component ID** - Short text - Field ID: `componentId` (e.g., "cpu-1", "gpu-2")
- **Name** - Short text - Field ID: `name` (e.g., "RTX 4090 FE")
- **Price** - Number (Decimal) - Field ID: `price`
- **Category** - Short text - Field ID: `category`
  - Values: case, motherboard, cpu, gpu, ram, storage, psu, cooling
- **Description** - Long text - Field ID: `description`
- **Images** - Media (many files) - Field ID: `images`
- **Rating** - Number (Decimal) - Field ID: `rating` (0-5)
- **In Stock** - Boolean - Field ID: `inStock`
- **Featured** - Boolean - Field ID: `featured`

### Case-Specific Fields

- **Form Factor** - Short text - Field ID: `formFactor` (ATX, MicroATX, Mini-ITX)
- **GPU Clearance** - Short text - Field ID: `gpuClearance` (e.g., "400mm")
- **Cooling Support** - Short text - Field ID: `coolingSupport`
- **Style** - Short text - Field ID: `style` (e.g., "RGB / Premium")
- **Compatibility** - Short text (list) - Field ID: `compatibility`
- **Max GPU Length** - Number (Integer) - Field ID: `maxGpuLength`
- **Max CPU Cooler Height** - Number (Integer) - Field ID: `maxCpuCoolerHeight`
- **Max PSU Length** - Number (Integer) - Field ID: `maxPsuLength`

### Motherboard-Specific Fields

- **Socket** - Short text - Field ID: `socket` (e.g., "LGA1700", "AM5")
- **Chipset** - Short text - Field ID: `chipset` (e.g., "Z790", "B650")
- **RAM Support** - Short text - Field ID: `ramSupport` (e.g., "DDR5-6000+")
- **Max RAM** - Number (Integer) - Field ID: `maxRam` (in GB)
- **RAM Slots** - Number (Integer) - Field ID: `ramSlots`
- **PCI Slots** - Number (Integer) - Field ID: `pciSlots`
- **M.2 Slots** - Number (Integer) - Field ID: `m2Slots`

### CPU-Specific Fields

- **Cores** - Number (Integer) - Field ID: `cores`
- **Threads** - Number (Integer) - Field ID: `threads`
- **TDP** - Number (Integer) - Field ID: `tdp` (in watts)
- **Generation** - Short text - Field ID: `generation` (e.g., "intel-14th", "amd-9000")
- **Platform** - Short text - Field ID: `platform` (Intel or AMD)

### GPU-Specific Fields

- **VRAM** - Number (Integer) - Field ID: `vram` (in GB)
- **Power** - Number (Integer) - Field ID: `power` (TDP in watts)
- **Length** - Number (Integer) - Field ID: `length` (in mm)
- **Height** - Number (Integer) - Field ID: `height` (in mm)
- **Slots** - Number (Decimal) - Field ID: `slots` (e.g., 2.5, 3)
- **Performance** - Short text - Field ID: `performance` (e.g., "4K Ultra")

### RAM-Specific Fields

- **Capacity** - Number (Integer) - Field ID: `capacity` (in GB)
- **Speed** - Short text - Field ID: `speed` (e.g., "DDR5-6000")
- **Modules** - Number (Integer) - Field ID: `modules` (e.g., 2 for 2x16GB)
- **Latency** - Short text - Field ID: `latency` (e.g., "CL30")
- **Type** - Short text - Field ID: `type` (DDR4, DDR5)

### Storage-Specific Fields

- **Storage Capacity** - Short text - Field ID: `storageCapacity` (e.g., "1TB", "2TB")
- **Interface** - Short text - Field ID: `interface` (e.g., "PCIe 4.0 NVMe")
- **Read Speed** - Short text - Field ID: `readSpeed` (e.g., "7,400 MB/s")
- **Write Speed** - Short text - Field ID: `writeSpeed` (e.g., "6,800 MB/s")
- **NAND** - Short text - Field ID: `nand` (e.g., "3D TLC")

### PSU-Specific Fields

- **Wattage** - Number (Integer) - Field ID: `wattage` (e.g., 850)
- **Efficiency** - Short text - Field ID: `efficiency` (e.g., "80+ Gold", "80+ Platinum")
- **Modular** - Short text - Field ID: `modular` (Fully, Semi, Non-modular)
- **Cables** - Short text - Field ID: `cables`

### Cooling-Specific Fields

- **Cooler Type** - Short text - Field ID: `coolerType` (AIO, Air, Custom Loop)
- **Fan Size** - Short text - Field ID: `fanSize` (e.g., "120mm", "140mm")
- **TDP Support** - Number (Integer) - Field ID: `tdpSupport` (max TDP in watts)
- **Radiator Size** - Short text - Field ID: `radiatorSize` (e.g., "360mm")
- **RGB Lighting** - Boolean - Field ID: `rgbLighting`

---

## Step 4: Create Sample Component Entries

Now that you've created all 8 content types, let's add some sample components.

### Example 1: Create an RTX 4090 GPU

1. Go to **Content** tab in Contentful
2. Click **Add entry** → Select **PC GPU**
3. Fill in the fields:

```
ID: gpu-rtx4090
Name: NVIDIA GeForce RTX 4090 Founders Edition
Price: 1599.99
Category: gpu
Brand: NVIDIA
Featured: Yes (checked)
Rating: 4.9
In Stock: Yes (checked)
VRAM: 24
Chipset: RTX 4090
Power: 450
Length: 304
Height: 137
Slots: 3.5
Performance: 4K Ultra / 8K Gaming
Image: [Upload GPU image]
```

4. Click **Publish** (top right)

### Example 2: Create an AMD Ryzen 9 9950X3D CPU

1. Go to **Content** tab
2. Click **Add entry** → Select **PC CPU**
3. Fill in the fields:

```
ID: cpu-ryzen9950x3d
Name: AMD Ryzen 9 9950X3D
Price: 649.99
Category: cpu
Brand: AMD
Featured: Yes
Rating: 4.9
In Stock: Yes
Socket: AM5
Cores: 16
Threads: 32
Base Clock: 4.3 GHz
Boost Clock: 5.7 GHz
TDP: 120
Generation: amd-9000
Platform: AMD
Image: [Upload CPU image]
```

4. Click **Publish**

### Example 3: Create a Corsair 5000D Case

1. Go to **Content** tab
2. Click **Add entry** → Select **PC Case**
3. Fill in the fields:

```
ID: case-corsair5000d
Name: Corsair 5000D Airflow
Price: 179.99
Category: case
Brand: Corsair
Featured: No
Rating: 4.7
In Stock: Yes
Form Factor: ATX
GPU Clearance: 420mm
Max Cooler Height: 170
Front Ports: 1x USB-C, 2x USB-A, Audio
Fans: 2x 120mm included
Drive Bays: 2x 3.5", 4x 2.5"
Image: [Upload case image]
```

4. Click **Publish**

---

## Step 5: How the PC Builder Uses This Data

---

## Step 5: How the PC Builder Uses This Data

The PC Builder automatically fetches components from all 8 content types when the page loads:

```typescript
// This happens automatically in PCBuilder.tsx
const gpus = await fetchPCComponents({ category: "gpu" });
const cpus = await fetchPCComponents({ category: "cpu" });
const cases = await fetchPCComponents({ category: "case" });
// ... and so on for all 8 categories
```

**What you'll see:**

- ✅ Loading spinner while fetching from Contentful
- ✅ Success badge showing "Using CMS Data" when loaded
- ✅ All your Contentful components appear in the PC Builder
- ✅ Falls back to hardcoded data if Contentful is unavailable

---

## Quick Reference: Field IDs Summary

Use these exact Field IDs when creating fields in Contentful:

**Common (all 8 types):** `id`, `name`, `price`, `image`, `brand`, `category`, `featured`, `rating`, `inStock`

**PC Case:** `formFactor`, `gpuClearance`, `maxCoolerHeight`, `frontPorts`, `fans`, `driveBays`

**PC Motherboard:** `socket`, `chipset`, `formFactor`, `ramSlots`, `maxRam`, `m2Slots`, `pcie`, `sata`

**PC CPU:** `socket`, `cores`, `threads`, `baseClock`, `boostClock`, `tdp`, `generation`, `platform`

**PC GPU:** `vram`, `chipset`, `power`, `length`, `height`, `slots`, `performance`

**PC RAM:** `capacity`, `speed`, `modules`, `latency`, `type`

**PC Storage:** `storageCapacity`, `interface`, `readSpeed`, `writeSpeed`, `nand`

**PC PSU:** `wattage`, `efficiency`, `modular`, `cables`

**PC Cooling:** `coolerType`, `fanSize`, `tdpSupport`, `radiatorSize`, `rgbLighting`

---

## Benefits

✅ **Easy Updates**: Add/remove/modify components without code changes  
✅ **Image Management**: Upload high-quality product images directly  
✅ **Inventory Control**: Toggle `inStock` to manage availability  
✅ **Feature Highlighting**: Mark components as `featured` for promotion  
✅ **Flexible Pricing**: Update prices in real-time  
✅ **No Field Limits**: Each content type has its own 50-field limit  
✅ **Better Organization**: Separate content types for each component category

---

## Troubleshooting

**Q: I don't see my components in the PC Builder**  
A: Make sure:

- You've published the entries (not just saved as draft)
- The `category` field matches the content type (e.g., `"gpu"` for PC GPU entries)
- Your Contentful API key is set in `.env` file

**Q: How do I know if CMS is working?**  
A: Check the browser console (F12) for logs like:

```
Fetched 5 gpu components from CMS
Fetched 3 cpu components from CMS
CMS data loaded successfully, switching to CMS mode
```

**Q: Can I still use the PC Builder without Contentful?**  
A: Yes! The PC Builder automatically falls back to hardcoded data if Contentful is unavailable.

---

## Next Steps

1. ✅ Create all 8 content types with the fields listed above
2. ✅ Add at least 2-3 entries per content type for testing
3. ✅ Publish all entries
4. ✅ Open PC Builder and verify components appear
5. ✅ Add more components as needed

**That's it!** Your PC Builder is now fully CMS-powered. 🎉
