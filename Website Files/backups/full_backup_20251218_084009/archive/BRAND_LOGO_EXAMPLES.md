# Brand Logo Quick Start Examples

## Using Brand Logos in Your Components

Here are practical, copy-paste examples for adding brand logos throughout the Vortex PCs website:

### 1. Import the Component

```tsx
import { BrandLogo } from "./ui/brand-logo";
// or from components
import { BrandLogo } from "../components/ui/brand-logo";
```

### 2. PC Builder - Component Selection Cards

```tsx
{
  filteredComponents.map((component) => (
    <Card
      key={component.id}
      className="bg-white/5 backdrop-blur-xl border-white/10"
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          {/* Brand Logo in top right */}
          <BrandLogo
            src={component.brandLogo}
            brand={component.brand}
            size="md"
          />

          {/* Featured Badge */}
          {component.featured && (
            <Badge className="bg-yellow-500/20 border-yellow-500/40 text-yellow-400">
              Featured
            </Badge>
          )}
        </div>

        <CardTitle>{component.name}</CardTitle>
        <CardDescription>{component.description}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Component image */}
        <img src={component.images?.[0]} alt={component.name} />

        <div className="flex items-center justify-between mt-4">
          <span className="text-2xl font-bold text-sky-400">
            £{component.price.toFixed(2)}
          </span>
          <Button>Add to Build</Button>
        </div>
      </CardContent>
    </Card>
  ));
}
```

### 3. PC Finder - Build Specifications

```tsx
<div className="space-y-3">
  <h3 className="text-lg font-semibold text-white">Build Specifications</h3>

  {/* CPU Spec with Logo */}
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
    <BrandLogo
      src={build.cpu?.brandLogo}
      brand={build.cpu?.brand}
      size="sm"
      withBackground
    />
    <div>
      <p className="text-gray-400 text-sm">Processor</p>
      <p className="text-white font-medium">{build.cpu?.name}</p>
    </div>
  </div>

  {/* GPU Spec with Logo */}
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
    <BrandLogo
      src={build.gpu?.brandLogo}
      brand={build.gpu?.brand}
      size="sm"
      withBackground
    />
    <div>
      <p className="text-gray-400 text-sm">Graphics Card</p>
      <p className="text-white font-medium">{build.gpu?.name}</p>
    </div>
  </div>

  {/* Add similar blocks for RAM, storage, etc. */}
</div>
```

### 4. Shopping Cart Items

```tsx
{
  cartItems.map((item) => (
    <div
      key={item.id}
      className="flex items-center gap-4 p-4 rounded-lg bg-white/5"
    >
      {/* Product Image */}
      <img
        src={item.image}
        alt={item.name}
        className="w-20 h-20 rounded object-cover"
      />

      <div className="flex-1">
        {/* Brand Logo Above Product Name */}
        <BrandLogo
          src={item.brandLogo}
          brand={item.brand}
          size="xs"
          className="mb-1"
        />

        <p className="font-medium text-white">{item.name}</p>
        <p className="text-sm text-gray-400">{item.category}</p>
      </div>

      <div className="text-right">
        <p className="text-lg font-bold text-sky-400">£{item.price}</p>
        <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
      </div>
    </div>
  ));
}
```

### 5. Inventory Manager (Admin Panel)

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Product</TableHead>
      <TableHead>Brand</TableHead>
      <TableHead>Price</TableHead>
      <TableHead>Stock</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {inventory.map((item) => (
      <TableRow key={item.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <img src={item.images?.[0]} className="w-10 h-10 rounded" />
            <span>{item.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <BrandLogo src={item.brandLogo} brand={item.brand} size="sm" />
        </TableCell>
        <TableCell>£{item.price}</TableCell>
        <TableCell>
          <Badge variant={item.stockLevel > 5 ? "success" : "warning"}>
            {item.stockLevel} units
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 6. Product Detail Modal/Page

```tsx
<Dialog>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <div className="flex items-center justify-between">
        <DialogTitle>{component.name}</DialogTitle>
        {/* Large brand logo in header */}
        <BrandLogo
          src={component.brandLogo}
          brand={component.brand}
          size="lg"
        />
      </div>
    </DialogHeader>

    <div className="grid md:grid-cols-2 gap-6">
      {/* Product Images */}
      <div>
        <img src={component.images?.[0]} alt={component.name} />
      </div>

      {/* Product Info */}
      <div className="space-y-4">
        {/* Manufacturer Info */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
          <p className="text-gray-400 text-sm mb-2">Official Product From</p>
          <BrandLogo
            src={component.brandLogo}
            brand={component.brand}
            size="xl"
          />
          <p className="text-gray-300 text-sm mt-2">
            Authorized {component.brand} partner
          </p>
        </div>

        {/* Specifications */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Specifications
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-400">Model</dt>
              <dd className="text-white">{component.model}</dd>
            </div>
            {/* Add more specs */}
          </dl>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### 7. Brand Filter Section

```tsx
// Get unique brands from components
const uniqueBrands = Array.from(
  new Set(
    components
      .filter((c) => c.brand)
      .map((c) => ({ name: c.brand!, logo: c.brandLogo }))
  )
);

<div className="space-y-3">
  <Label className="text-white font-medium">Filter by Manufacturer</Label>

  <div className="flex flex-wrap gap-2">
    {/* All Brands Button */}
    <button
      onClick={() => setSelectedBrand(null)}
      className={cn(
        "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
        !selectedBrand
          ? "border-sky-500 bg-sky-500/20 text-sky-400"
          : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
      )}
    >
      All Brands
    </button>

    {/* Brand Logo Buttons */}
    {uniqueBrands.map((brand) => (
      <button
        key={brand.name}
        onClick={() => setSelectedBrand(brand.name)}
        className={cn(
          "p-2 rounded-lg border transition-all hover:scale-105",
          selectedBrand === brand.name
            ? "border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/20"
            : "border-white/10 bg-white/5 hover:border-white/20"
        )}
      >
        <BrandLogo src={brand.logo} brand={brand.name} size="md" />
      </button>
    ))}
  </div>
</div>;
```

### 8. Comparison Table

```tsx
<div className="grid grid-cols-3 gap-4">
  {comparisonProducts.map((product) => (
    <Card key={product.id}>
      <CardHeader>
        {/* Centered brand logo */}
        <div className="flex justify-center mb-4">
          <BrandLogo src={product.brandLogo} brand={product.brand} size="lg" />
        </div>
        <CardTitle className="text-center">{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <img src={product.images?.[0]} className="w-full rounded mb-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Price</span>
            <span className="text-sky-400 font-bold">£{product.price}</span>
          </div>
          {/* Add more comparison points */}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### 9. Responsive Mobile List View

```tsx
<div className="space-y-3">
  {components.map((component) => (
    <div
      key={component.id}
      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
    >
      {/* Mobile: Small logo on left */}
      <BrandLogo
        src={component.brandLogo}
        brand={component.brand}
        size="sm"
        withBackground
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{component.name}</p>
        <p className="text-sm text-gray-400 truncate">{component.category}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-bold text-sky-400">£{component.price}</p>
      </div>
    </div>
  ))}
</div>
```

### 10. With Tooltip (Enhanced UX)

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <div className="cursor-pointer">
      <BrandLogo src={component.brandLogo} brand={component.brand} size="md" />
    </div>
  </TooltipTrigger>
  <TooltipContent>
    <div className="text-center">
      <p className="font-semibold">{component.brand}</p>
      <p className="text-xs text-gray-400 mt-1">
        Official {component.brand} Product
      </p>
      {component.model && (
        <p className="text-xs text-gray-400">Model: {component.model}</p>
      )}
    </div>
  </TooltipContent>
</Tooltip>;
```

## Size Reference

- **xs**: 12px height (40px max-width) - Badges, compact lists
- **sm**: 16px height (60px max-width) - Filters, small cards
- **md**: 24px height (80px max-width) - Default, most cards
- **lg**: 32px height (100px max-width) - Headers, feature sections
- **xl**: 48px height (140px max-width) - Hero sections, detail pages

## Props Reference

```typescript
interface BrandLogoProps {
  src?: string; // Logo image URL from Contentful
  brand?: string; // Brand name for fallback
  size?: "xs" | "sm" | "md" | "lg" | "xl"; // Logo size preset
  className?: string; // Additional CSS classes
  showFallback?: boolean; // Show brand text if no logo (default: true)
  withBackground?: boolean; // Add subtle background container (default: false)
}
```

## Tips

1. **Use `withBackground={true}`** on dark product images for better contrast
2. **Size "sm"** is best for filters and compact views
3. **Size "md"** is the default for most product cards
4. **Size "lg" or "xl"** for featured products or detail views
5. **Always provide `brand` prop** as fallback when logo might be missing
