# Contentful PC Case Content Model - Field Configuration

## Overview

This guide shows you how to add the additional fields to your PC Case content type in Contentful to display complete product information on your website.

## Content Type: `pcCase`

### Fields to Add/Update

| Field Name                | Field ID             | Field Type         | Validation     | Required | Help Text                                                  |
| ------------------------- | -------------------- | ------------------ | -------------- | -------- | ---------------------------------------------------------- |
| **Name**                  | `name`               | Short text         | -              | Yes      | Product name (e.g., "Hyte Y70 Mid Tower Case Snow White")  |
| **Brand**                 | `brand`              | Short text         | -              | Yes      | Manufacturer brand (e.g., "Hyte")                          |
| **Model**                 | `model`              | Short text         | -              | Yes      | Model number/name (e.g., "Y70")                            |
| **Colour**                | `colour`             | Short text         | -              | No       | Color/finish (e.g., "Snow White", "Black")                 |
| **Price**                 | `price`              | Integer            | Min: 0         | Yes      | Price in GBP (pence format: £159.00 = 15900)               |
| **Images**                | `images`             | Media (Many files) | -              | Yes      | Multiple product images                                    |
| **Form Factor**           | `formFactor`         | Short text         | -              | Yes      | Case size (e.g., "E-ATX", "Mid Tower", "ATX")              |
| **Max GPU Length**        | `maxGpuLength`       | Integer            | Min: 0         | No       | Maximum GPU length in mm (e.g., 422)                       |
| **Max CPU Cooler Height** | `maxCpuCoolerHeight` | Integer            | Min: 0         | No       | Maximum CPU cooler height in mm (e.g., 180)                |
| **Front Panel Ports**     | `frontPanelPorts`    | Short text         | -              | No       | Front I/O ports (e.g., "2x USB 3.2 Gen2, 1x USB-C, Audio") |
| **Description**           | `description`        | Long text          | -              | Yes      | Detailed product description                               |
| **Features**              | `features`           | Short text (List)  | -              | No       | Key product features (multiple entries)                    |
| **Component ID**          | `componentId`        | Short text         | -              | Yes      | Unique identifier for the component                        |
| **Rating**                | `rating`             | Integer            | Min: 0, Max: 5 | No       | Product rating (1-5 stars)                                 |
| **In Stock**              | `inStock`            | Boolean            | -              | No       | Availability status (default: true)                        |
| **Featured**              | `featured`           | Boolean            | -              | No       | Display as featured product                                |

### Existing Fields (Keep These)

- **GPU Clearance** (`gpuClearance`) - Short text - Max GPU clearance info
- **Cooling Support** (`coolingSupport`) - Short text - Cooling options supported
- **Style** (`style`) - Short text - Case aesthetic style
- **Compatibility** (`compatibility`) - Short text (List) - Compatible motherboard sizes
- **Max PSU Length** (`maxPsuLength`) - Integer - Maximum PSU length in mm

## Step-by-Step Setup in Contentful

### 1. Adding the "Brand" Field

1. Go to Content Model → pcCase
2. Click "Add field"
3. Select "Short text"
4. Field name: `Brand`
5. Field ID: `brand`
6. Check "Required"
7. Save

### 2. Adding the "Model" Field

1. Click "Add field"
2. Select "Short text"
3. Field name: `Model`
4. Field ID: `model`
5. Check "Required"
6. Save

### 3. Adding the "Colour" Field

1. Click "Add field"
2. Select "Short text"
3. Field name: `Colour`
4. Field ID: `colour`
5. Leave unchecked for "Required" (optional field)
6. Help text: "Product color or finish (e.g., Snow White, Black, RGB)"
7. Save

### 4. Adding the "Front Panel Ports" Field

1. Click "Add field"
2. Select "Short text"
3. Field name: `Front Panel Ports`
4. Field ID: `frontPanelPorts`
5. Leave unchecked for "Required"
6. Help text: "Front I/O connectivity (e.g., 2x USB 3.2 Gen2, 1x USB-C, Audio Jack)"
7. Save

### 5. Adding the "Features" Field (Important!)

1. Click "Add field"
2. Select "Short text, list"
3. Field name: `Features`
4. Field ID: `features`
5. Leave unchecked for "Required"
6. Help text: "Key product features - each entry should be a single feature point"
7. Save

### 6. Update "Price" Field (If needed)

- Ensure it's set to **Integer** type
- Price should be stored in pence (£159.00 = 15900)

### 7. Update "Images" Field (If needed)

- Ensure it's set to **Media, many files**
- This allows multiple product images

## Example Content Entry

Here's how to fill out a case entry:

```
Name: Hyte Y70 Mid Tower Case Snow White
Brand: Hyte
Model: Y70
Colour: Snow White
Price: 15900 (displays as £159.00)
Component ID: hyte-y70-white

Form Factor: E-ATX
Max GPU Length: 422
Max CPU Cooler Height: 180
Front Panel Ports: 2x USB 3.2 Gen2, 1x USB-C, Audio Jack

Description:
Y70 is an upgraded dual chamber ATX Mid-Tower modern aesthetic case
that delivers next-gen gaming experiences.

Features:
- Dual chamber design for optimal cooling
- Tempered glass side panel
- Support for 360mm radiator
- Cable management system
- RGB lighting support
- Tool-less installation
- Premium build quality
- Modern aesthetic design

Images: [Upload 4-6 high-quality product images]

In Stock: Yes
Featured: Yes
Rating: 5
```

## Display on Website

Once these fields are populated in Contentful, they will automatically display in the product modal:

### Main Display

- **Title**: Name (e.g., "Hyte Y70 Mid Tower Case Snow White")
- **Description**: Below title
- **Images**: Large image with thumbnail gallery
- **Price**: Prominent display in top-right
- **Brand**: Badge below price

### Technical Specifications Section

All the following fields display in a clean grid:

- Brand
- Model
- Colour
- Form Factor
- Max GPU Length
- Max CPU Cooler Height
- Front Panel Ports
- GPU Clearance (if set)
- Cooling Support (if set)
- Max PSU Length (if set)
- Compatibility (if set)

### Features Section

If features are added, they display as a bulleted list with checkmark icons in a highlighted section below the technical specs.

## Tips

1. **Images**: Upload at least 4 images showing different angles of the product
2. **Features**: Keep each feature concise (one line per feature)
3. **Front Panel Ports**: Be specific about port types and quantities
4. **Colour**: Use descriptive names that customers search for
5. **Price**: Always store as integer in pence (multiply by 100)

## Testing

After adding fields and content:

1. Publish your content in Contentful
2. Wait ~30 seconds for cache to clear
3. Refresh your website
4. Navigate to PC Builder → Cases
5. Click on a case to open the modal
6. Verify all fields display correctly

## Need Help?

If fields aren't displaying:

1. Check Contentful publish status
2. Verify field IDs match exactly (case-sensitive)
3. Clear browser cache
4. Check browser console for errors
5. Ensure Contentful API credentials are correct in `.env`
