# Manufacturer Logos Implementation Guide

## Overview

This guide explains how to add manufacturer/brand logos to your products throughout the Vortex PCs website.

## Implementation Steps

### 1. Add Logo Field to Contentful CMS

For each component content type in Contentful:

- Go to **Content model** in Contentful
- Edit each component type (PC CPU, PC GPU, PC RAM, etc.)
- Add a new field:
  - **Field type**: Media (single file)
  - **Field name**: `brandLogo`
  - **Appearance**: Image

Recommended content types to update:

- PC Case
- PC Motherboard
- PC CPU
- PC GPU
- PC RAM
- PC Storage
- PC PSU
- PC Cooling
- PC Case Fans
- PC Optional Extras

### 2. Upload Brand Logos to Contentful

Upload manufacturer logos as **SVG or PNG** files (transparent background recommended):

**Common PC Brands**:

- **CPU**: Intel, AMD
- **GPU**: NVIDIA, AMD, ASUS, MSI, Gigabyte, EVGA, Zotac, PNY
- **Motherboard**: ASUS, MSI, Gigabyte, ASRock, EVGA
- **RAM**: Corsair, G.Skill, Kingston, Crucial, TeamGroup
- **Storage**: Samsung, WD (Western Digital), Seagate, Crucial, Kingston
- **PSU**: Corsair, EVGA, Seasonic, Thermaltake, Cooler Master
- **Cooling**: Noctua, Corsair, NZXT, be quiet!, Arctic, Cooler Master
- **Cases**: NZXT, Corsair, Lian Li, Fractal Design, Phanteks

**Logo Specifications**:

- Format: SVG preferred (scalable), or PNG with transparent background
- Size: 200-400px width recommended
- Aspect ratio: Preserve original brand logo ratio
- Background: Transparent
- Color: Use official brand colors or white/light gray for dark themes

### 3. Update Component Interface (Already Done)

The `PCComponent` interface in `services/cms.ts` already includes a `brand` field. We'll add a `brandLogo` field:

```typescript
export interface PCComponent {
  // ... existing fields ...
  brand?: string;
  brandLogo?: string; // URL to brand logo image
  // ... rest of fields ...
}
```

### 4. Update CMS Mapping Function

In `services/cms.ts`, the `mapContentfulToComponent` function needs to extract the brand logo:

```typescript
function mapContentfulToComponent(
  item: ContentfulEntry,
  category: string,
  includes?: ContentfulResponse["includes"]
): PCComponent {
  const fields = (item.fields || {}) as Record<string, unknown>;

  // ... existing image processing ...

  // Process brand logo
  let brandLogo: string | undefined;
  if (fields.brandLogo && typeof fields.brandLogo === "object") {
    const logoField = fields.brandLogo as Record<string, unknown>;
    if (
      logoField.sys &&
      typeof logoField.sys === "object" &&
      "linkType" in logoField.sys &&
      logoField.sys.linkType === "Asset" &&
      includes?.Asset
    ) {
      const logoSys = logoField.sys as { id?: string };
      const asset = (
        includes.Asset as unknown as Array<Record<string, unknown>>
      ).find(
        (a: Record<string, unknown>) =>
          a.sys &&
          typeof a.sys === "object" &&
          "id" in a.sys &&
          (a.sys as { id?: string }).id === logoSys.id
      );
      if (
        asset &&
        asset.fields &&
        typeof asset.fields === "object" &&
        "file" in asset.fields
      ) {
        const assetFields = asset.fields as { file?: { url?: string } };
        brandLogo = assetFields.file?.url
          ? `https:${assetFields.file.url}`
          : undefined;
      }
    } else if (
      logoField.fields &&
      typeof logoField.fields === "object" &&
      "file" in logoField.fields
    ) {
      const logoFields = logoField.fields as { file?: { url?: string } };
      brandLogo = logoFields.file?.url
        ? `https:${logoFields.file.url}`
        : undefined;
    }
  }

  return {
    // ... existing fields ...
    brand: getString(fields.brand) ?? undefined,
    brandLogo: brandLogo,
    // ... rest of fields ...
  };
}
```

### 5. Create Brand Logo Component

Create a reusable component for displaying brand logos:

**File**: `components/ui/brand-logo.tsx`

```typescript
import React from "react";
import { cn } from "../../lib/utils";

interface BrandLogoProps {
  src?: string;
  brand?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-auto max-w-[60px]",
  md: "h-6 w-auto max-w-[80px]",
  lg: "h-8 w-auto max-w-[100px]",
  xl: "h-12 w-auto max-w-[140px]",
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  src,
  brand,
  size = "md",
  className,
  showFallback = true,
}) => {
  // If no logo, show brand text as fallback
  if (!src && showFallback && brand) {
    return (
      <div
        className={cn(
          "px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 font-medium text-sm",
          className
        )}
      >
        {brand}
      </div>
    );
  }

  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${brand || "Brand"} logo`}
      className={cn("object-contain", sizeClasses[size], className)}
      loading="lazy"
    />
  );
};

export default BrandLogo;
```

### 6. Integration Examples

#### A. PC Builder Component Cards

In `components/PCBuilder.tsx` or component selection modals:

```tsx
import { BrandLogo } from "./ui/brand-logo";

// Inside your component card
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>{component.name}</CardTitle>
      <BrandLogo src={component.brandLogo} brand={component.brand} size="md" />
    </div>
  </CardHeader>
  {/* ... rest of card ... */}
</Card>;
```

#### B. PC Finder Results

In `components/PCFinderSpectacular.tsx`:

```tsx
// In the build recommendation card
<div className="flex items-center gap-2 mb-2">
  <BrandLogo src={build.cpu?.brandLogo} brand={build.cpu?.brand} size="sm" />
  <span className="text-sm text-gray-400">{build.cpu?.name}</span>
</div>
```

#### C. Product Detail Specs

```tsx
// In product specifications section
<div className="grid grid-cols-2 gap-4">
  <div>
    <p className="text-gray-400 text-sm">Manufacturer</p>
    <div className="flex items-center gap-2 mt-1">
      <BrandLogo src={component.brandLogo} brand={component.brand} size="lg" />
    </div>
  </div>
  {/* ... other specs ... */}
</div>
```

#### D. Inventory Manager (Admin Panel)

In `components/InventoryManager.tsx`:

```tsx
// In the product table
<TableCell>
  <div className="flex items-center gap-2">
    <BrandLogo src={item.brandLogo} brand={item.brand} size="sm" />
    <span>{item.name}</span>
  </div>
</TableCell>
```

#### E. Shopping Cart

```tsx
// In cart items display
<div className="flex items-center gap-3">
  <img src={item.image} className="w-16 h-16 rounded" />
  <div className="flex-1">
    <div className="flex items-center gap-2 mb-1">
      <BrandLogo src={item.brandLogo} brand={item.brand} size="sm" />
    </div>
    <p className="font-medium">{item.name}</p>
  </div>
</div>
```

### 7. Enhanced Logo Display with Tooltip

For a premium look with brand information:

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <div className="cursor-pointer">
      <BrandLogo src={component.brandLogo} brand={component.brand} size="md" />
    </div>
  </TooltipTrigger>
  <TooltipContent>
    <p className="font-medium">{component.brand}</p>
    <p className="text-xs text-gray-400">Official brand product</p>
  </TooltipContent>
</Tooltip>;
```

### 8. Logo Gallery/Filter

Create a brand filter in PC Builder:

```tsx
// Brand filter section
<div className="space-y-2">
  <Label>Filter by Brand</Label>
  <div className="flex flex-wrap gap-2">
    {uniqueBrands.map((brand) => (
      <button
        key={brand.name}
        onClick={() => setSelectedBrand(brand.name)}
        className={cn(
          "p-2 rounded border transition-all",
          selectedBrand === brand.name
            ? "border-sky-500 bg-sky-500/10"
            : "border-white/10 hover:border-white/20"
        )}
      >
        <BrandLogo src={brand.logo} brand={brand.name} size="sm" />
      </button>
    ))}
  </div>
</div>
```

## Logo Sourcing

### Where to Get Official Logos

1. **Official Brand Websites**:

   - Navigate to company press/media pages
   - Look for "Brand Assets" or "Press Kit"
   - Download official logos in SVG/PNG format

2. **Common Brand Asset Pages**:

   - Intel: https://www.intel.com/content/www/us/en/newsroom/resources/press-kit.html
   - AMD: https://www.amd.com/en/corporate/brand.html
   - NVIDIA: https://www.nvidia.com/en-us/about-nvidia/media-resources/
   - Corsair: https://www.corsair.com/us/en/company/about-us/media-and-press/
   - ASUS: https://www.asus.com/support/press-room/
   - MSI: https://www.msi.com/about/images-and-logo

3. **Logo Databases** (with proper licensing):
   - Wikimedia Commons (public domain logos)
   - Brandfetch.com
   - LogoLounge

### Logo Usage Guidelines

- Always check brand guidelines for proper usage
- Maintain minimum clear space around logos
- Don't distort or recolor (unless brand guidelines allow)
- Use official versions only
- Ensure proper licensing/permission

## Styling Best Practices

### Dark Theme Considerations

Since Vortex PCs uses a dark theme:

```css
/* Add subtle backdrop to make white logos visible */
.brand-logo-container {
  background: rgba(255, 255, 255, 0.03);
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Or add drop shadow for contrast */
.brand-logo {
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
}
```

### Responsive Logo Sizing

```tsx
<BrandLogo
  src={component.brandLogo}
  brand={component.brand}
  size="sm" // Mobile
  className="md:h-8 lg:h-10" // Larger on desktop
/>
```

## Testing Checklist

- [ ] Logos display correctly on component cards
- [ ] Logos scale properly on different screen sizes
- [ ] Fallback text shows when logo missing
- [ ] Logos are cached properly for performance
- [ ] Alt text is descriptive for accessibility
- [ ] Logos maintain aspect ratio
- [ ] Dark theme contrast is sufficient
- [ ] Logo file sizes are optimized (<50KB each)

## Performance Tips

1. **Optimize Logo Files**:

   - Use SVG when possible (smaller, scalable)
   - Compress PNG files (use TinyPNG or similar)
   - Target <20KB per logo file

2. **Lazy Loading**:

   ```tsx
   <img src={logo} loading="lazy" />
   ```

3. **CDN Caching**:

   - Contentful automatically serves via CDN
   - Logos are cached globally

4. **Preload Critical Logos**:
   ```tsx
   // In document head for above-the-fold logos
   <link rel="preload" as="image" href="/logos/intel.svg" />
   ```

## Fallback Strategy

When brand logos aren't available:

```tsx
export const BrandBadge: React.FC<{ component: PCComponent }> = ({
  component,
}) => {
  if (component.brandLogo) {
    return <BrandLogo src={component.brandLogo} brand={component.brand} />;
  }

  if (component.brand) {
    return (
      <Badge className="bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500/40">
        {component.brand}
      </Badge>
    );
  }

  return null;
};
```

## Advanced: Logo Sprite Sheet

For better performance with many logos:

```typescript
// Create a CSS sprite sheet with all logos
// Then use background positioning

const logoPositions: Record<string, { x: number; y: number }> = {
  intel: { x: 0, y: 0 },
  amd: { x: -100, y: 0 },
  nvidia: { x: -200, y: 0 },
  // ... etc
};

<div
  className="brand-logo-sprite"
  style={{
    backgroundPosition: `${logoPositions[brand].x}px ${logoPositions[brand].y}px`,
  }}
/>;
```

## Migration Checklist

1. [ ] Add `brandLogo` field to all Contentful content types
2. [ ] Update `PCComponent` interface with `brandLogo?: string`
3. [ ] Update `mapContentfulToComponent` function
4. [ ] Create `BrandLogo` component
5. [ ] Upload logos to Contentful for existing products
6. [ ] Update PC Builder to show logos
7. [ ] Update PC Finder to show logos
8. [ ] Update Inventory Manager to show logos
9. [ ] Update shopping cart/checkout to show logos
10. [ ] Test across all pages and screen sizes

## Example: Complete Product Card with Logo

```tsx
<Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
  <CardHeader>
    <div className="flex items-center justify-between mb-2">
      <BrandLogo src={component.brandLogo} brand={component.brand} size="md" />
      {component.featured && (
        <Badge className="bg-yellow-500/20 border-yellow-500/40 text-yellow-400">
          Featured
        </Badge>
      )}
    </div>
    <CardTitle className="text-white text-lg">{component.name}</CardTitle>
    <CardDescription className="text-gray-400">
      {component.description}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="aspect-video rounded-lg overflow-hidden mb-4">
      <img
        src={component.images?.[0]}
        alt={component.name}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex items-center justify-between">
      <div className="text-2xl font-bold text-sky-400">
        £{component.price.toFixed(2)}
      </div>
      <Button className="bg-gradient-to-r from-sky-600 to-blue-600">
        Add to Build
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## Summary

To add manufacturer logos:

1. **CMS**: Add `brandLogo` field (Media type) to Contentful content models
2. **Upload**: Add logo images to Contentful assets
3. **Code**: Update interface + mapping function to extract logo URLs
4. **Component**: Create reusable `<BrandLogo>` component
5. **Integration**: Add logos to product displays throughout the site

This approach gives you professional brand representation while maintaining flexibility and performance.
