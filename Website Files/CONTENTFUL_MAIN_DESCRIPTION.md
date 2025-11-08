# Adding Main Description Field to Contentful

## Overview

The `mainDescription` field has been added to display detailed product information above the Technical Specifications section in the product detail modal.

## Required Setup in Contentful

### Add Field to ALL Component Content Types

You need to add this field to **each** of the following content types:

- `pcCase`
- `pcMotherboard`
- `pcCpu`
- `pcGpu`
- `pcRam`
- `pcStorage`
- `pcPsu`
- `pcCooling`

### Field Configuration

| Property   | Value                                                             |
| ---------- | ----------------------------------------------------------------- |
| Field Name | Main Description                                                  |
| Field ID   | `mainDescription`                                                 |
| Field Type | **Long text**                                                     |
| Appearance | Text editor                                                       |
| Required   | No (optional)                                                     |
| Help Text  | Detailed product description shown above technical specifications |

## Step-by-Step Instructions

### 1. Log into Contentful

- Navigate to your Contentful dashboard
- Go to **Content model**

### 2. For Each Component Type (repeat 8 times)

**a) Open Content Type**

- Click on the content type (e.g., "PC Case")

**b) Add Field**

- Click **Add field** button
- Select **Long text**

**c) Configure Field**

- **Name**: `Main Description`
- **Field ID**: `mainDescription` (must match exactly)
- Click **Create and configure**

**d) Field Settings**

- **Appearance**: Select "Markdown" or "Text" (your preference)
- **Validation**: Leave unchecked (optional field)
- **Help text**: "Detailed product description shown above technical specifications"
- Click **Confirm**

**e) Save**

- Click **Save** at the top right

### 3. Repeat for All Content Types

Make sure you add the `mainDescription` field to:

- ✅ PC Case
- ✅ PC Motherboard
- ✅ PC CPU
- ✅ PC GPU
- ✅ PC RAM
- ✅ PC Storage
- ✅ PC PSU
- ✅ PC Cooling

## Example Content

### Sample Main Description for a PC Case:

```
The NZXT H510 Elite represents the pinnacle of modern PC case design, combining stunning aesthetics with exceptional functionality.

This premium mid-tower case features a fully tempered glass front and side panel, showcasing your build from every angle. The sleek, minimalist design is complemented by integrated RGB lighting strips that add a touch of sophistication to any setup.

Built with builders in mind, the H510 Elite includes a removable PSU shroud, smart cable management channels, and a dedicated cable routing bar that keeps your build looking clean and professional. The front-mounted USB-C port ensures you're ready for the latest connectivity standards.

Whether you're building your first gaming PC or upgrading to a high-performance workstation, the H510 Elite provides the perfect foundation with support for multiple radiator configurations, excellent airflow, and tool-free installation for most components.
```

### Sample Main Description for a GPU:

```
Experience gaming at its finest with the NVIDIA GeForce RTX 4070 Ti. This powerhouse graphics card delivers exceptional performance for 4K gaming and creative workflows.

Featuring 12GB of GDDR6X memory and NVIDIA's latest Ada Lovelace architecture, the RTX 4070 Ti provides stunning ray-traced graphics and AI-enhanced performance through DLSS 3. Whether you're battling in the latest AAA titles or rendering complex 3D scenes, this GPU handles it all with ease.

Advanced cooling technology keeps temperatures in check even during intense gaming sessions, while the sleek dual-fan design ensures quiet operation. RGB lighting adds a premium touch to complement your build aesthetic.

Perfect for enthusiasts who demand high frame rates at high resolutions, the RTX 4070 Ti represents the sweet spot of performance and value in NVIDIA's current lineup.
```

## Display Details

### Where It Appears

The main description will be displayed in the product detail modal:

1. **After**: Product title, short description, price, and brand
2. **Before**: Technical Specifications section
3. **Styling**: Clean box with document icon, white text on dark background

### Visual Example

```
┌─────────────────────────────────────────┐
│  [Large Product Image]                  │
│  [Thumbnails]                           │
├─────────────────────────────────────────┤
│  Product Name                           │
│  Short description                      │
│  Price: £899.99                         │
├─────────────────────────────────────────┤
│  📄 Product Description                 │  ← NEW SECTION
│                                         │
│  Your detailed mainDescription text     │
│  appears here in a well-formatted       │
│  box with proper line spacing.          │
├─────────────────────────────────────────┤
│  ⚙️ Technical Specifications            │
│  [Specs grid]                           │
├─────────────────────────────────────────┤
│  ✓ Key Features                         │
│  [Feature bullets]                      │
└─────────────────────────────────────────┘
```

## Best Practices

### Content Guidelines

- **Length**: 150-400 words ideal
- **Tone**: Professional, informative, persuasive
- **Structure**: Use paragraphs (line breaks supported)
- **Focus**: Highlight what makes this product special
- **Include**: Key benefits, use cases, standout features

### What to Write About

1. **Product Overview**: What is it and who is it for?
2. **Key Technologies**: What makes it special?
3. **Performance**: What can users expect?
4. **Design**: Build quality, aesthetics, unique features
5. **Value Proposition**: Why choose this over alternatives?

### Formatting Tips

- Use line breaks between paragraphs (press Enter twice)
- Keep paragraphs 2-4 sentences for readability
- Lead with the most compelling information
- End with a strong call-to-action or value statement

## Testing Your Changes

### 1. Add Description to a Test Product

- Edit any component entry in Contentful
- Fill in the `mainDescription` field
- **Publish** the changes

### 2. Verify in PC Builder

- Open your website
- Navigate to **PC Builder**
- Select the component category
- Click on the product you edited
- **Check**: The Product Description section appears above Technical Specifications

### 3. Check Different Products

- Products **with** `mainDescription`: Shows description box
- Products **without** `mainDescription`: Box is hidden (no empty space)

## Implementation Notes

### Technical Details

- **Interface**: Added to `PCComponent` interface in `services/cms.ts`
- **Mapping**: Automatically fetched from Contentful via `mapContentfulToComponent`
- **Display**: Rendered in `ComponentDetailModal` in `PCBuilder.tsx`
- **Styling**: Matches existing design system (glassmorphism, sky-blue accents)
- **Formatting**: `whitespace-pre-line` preserves line breaks from Contentful

### Field ID Requirements

⚠️ **CRITICAL**: The field ID must be exactly `mainDescription` (camelCase)

- ❌ `MainDescription` (wrong)
- ❌ `main_description` (wrong)
- ❌ `maindescription` (wrong)
- ✅ `mainDescription` (correct)

## Troubleshooting

### Description Not Showing?

1. **Check Field ID**: Must be exactly `mainDescription`
2. **Check Content**: Make sure you've published (not just saved) the entry
3. **Clear Cache**: Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
4. **Check Console**: Open browser DevTools for any errors

### Formatting Issues?

- Line breaks not showing? Use double Enter in Contentful
- Text too long? Aim for 150-400 words
- Weird characters? Stick to plain text, avoid special formatting

## Need Help?

If you encounter issues:

1. Verify field ID matches exactly: `mainDescription`
2. Check that the field was added to all 8 component types
3. Ensure content is published in Contentful
4. Clear browser cache and reload

---

**Status**: ✅ Code implementation complete  
**Next Step**: Add `mainDescription` field to all 8 component content types in Contentful
