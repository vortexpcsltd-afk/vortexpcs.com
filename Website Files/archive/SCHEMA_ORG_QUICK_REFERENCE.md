# Schema.org Quick Reference

## 🚀 Quick Integration Examples

### Basic Product (Individual Component)

```tsx
import { ProductSchema } from "./components/SchemaMarkup";

<ProductSchema
  product={{
    id: "gpu-rtx4090",
    name: "NVIDIA GeForce RTX 4090",
    price: 1599.99,
    brand: "NVIDIA",
    category: "GPU",
    inStock: true,
    imageUrl: "https://vortexpcs.com/images/rtx4090.jpg",
  }}
/>;
```

### Complete PC Build

```tsx
import { PCBuildSchema } from "./components/SchemaMarkup";

<PCBuildSchema
  build={{
    id: "gaming-build-001",
    name: "Ultimate Gaming PC",
    totalPrice: 2499.99,
    components: [
      { id: "cpu-001", name: "AMD Ryzen 9 7950X", price: 549.99 },
      { id: "gpu-001", name: "NVIDIA RTX 4090", price: 1599.99 },
    ],
  }}
/>;
```

### Product with Reviews

```tsx
import { ReviewSchema } from "./components/SchemaMarkup";

<ReviewSchema
  productName="NVIDIA RTX 4090"
  averageRating={4.8}
  reviews={[
    {
      author: "John Smith",
      rating: 5,
      reviewBody: "Best GPU ever!",
      datePublished: "2024-11-01",
    },
  ]}
/>;
```

### FAQ Page

```tsx
import { FAQSchema } from "./components/SchemaMarkup";

<FAQSchema
  faqs={[
    {
      question: "How long does PC building take?",
      answer: "3-5 business days for most builds.",
    },
  ]}
/>;
```

### Breadcrumbs

```tsx
import { BreadcrumbSchema } from "./components/SchemaMarkup";

<BreadcrumbSchema
  items={[
    { name: "Home", url: "https://vortexpcs.com", position: 1 },
    {
      name: "PC Builder",
      url: "https://vortexpcs.com/pc-builder",
      position: 2,
    },
  ]}
/>;
```

---

## 📦 Component Props Reference

### ProductSchema

| Prop                  | Type    | Required | Description                   |
| --------------------- | ------- | -------- | ----------------------------- |
| `product.id`          | string  | ✅       | Unique product ID             |
| `product.name`        | string  | ✅       | Product name                  |
| `product.price`       | number  | ✅       | Price in GBP                  |
| `product.inStock`     | boolean | ✅       | Availability                  |
| `product.imageUrl`    | string  | ✅       | Product image URL             |
| `product.brand`       | string  | ⭐       | Brand name (recommended)      |
| `product.description` | string  | ⭐       | Product description           |
| `product.category`    | string  | ⭐       | Category (CPU, GPU, etc.)     |
| `product.sku`         | string  | ⚪       | Stock Keeping Unit            |
| `product.gtin`        | string  | ⚪       | Barcode (for Google Shopping) |
| `product.mpn`         | string  | ⚪       | Manufacturer Part Number      |
| `product.rating`      | number  | ⚪       | Average rating (1-5)          |
| `product.reviewCount` | number  | ⚪       | Number of reviews             |
| `product.url`         | string  | ⚪       | Product page URL              |

### PCBuildSchema

| Prop                | Type   | Required | Description         |
| ------------------- | ------ | -------- | ------------------- |
| `build.id`          | string | ✅       | Unique build ID     |
| `build.name`        | string | ✅       | Build name          |
| `build.totalPrice`  | number | ✅       | Total price         |
| `build.components`  | array  | ✅       | Array of components |
| `build.description` | string | ⭐       | Build description   |
| `build.imageUrl`    | string | ⚪       | Build image         |
| `build.url`         | string | ⚪       | Build page URL      |

### ReviewSchema

| Prop                      | Type   | Required | Description                             |
| ------------------------- | ------ | -------- | --------------------------------------- |
| `productName`             | string | ✅       | Product being reviewed                  |
| `reviews`                 | array  | ✅       | Array of reviews                        |
| `reviews[].author`        | string | ✅       | Reviewer name                           |
| `reviews[].rating`        | number | ✅       | Rating (1-5)                            |
| `reviews[].reviewBody`    | string | ✅       | Review text                             |
| `reviews[].datePublished` | string | ✅       | Date (YYYY-MM-DD)                       |
| `reviews[].title`         | string | ⚪       | Review title                            |
| `averageRating`           | number | ⚪       | Avg rating (calculated if not provided) |

### FAQSchema

| Prop              | Type   | Required | Description        |
| ----------------- | ------ | -------- | ------------------ |
| `faqs`            | array  | ✅       | Array of Q&A pairs |
| `faqs[].question` | string | ✅       | Question text      |
| `faqs[].answer`   | string | ✅       | Answer text        |

### BreadcrumbSchema

| Prop               | Type   | Required | Description        |
| ------------------ | ------ | -------- | ------------------ |
| `items`            | array  | ✅       | Breadcrumb items   |
| `items[].name`     | string | ✅       | Link text          |
| `items[].url`      | string | ✅       | Full URL           |
| `items[].position` | number | ✅       | Position (1-based) |

---

## 🧪 Testing Commands

### 1. View JSON-LD in Browser Console

```javascript
// Paste in browser console
document
  .querySelectorAll('script[type="application/ld+json"]')
  .forEach((s, i) => {
    console.log(`Schema ${i}:`, JSON.parse(s.innerHTML));
  });
```

### 2. Validate with Google

```bash
# Deploy first
npm run build
vercel --prod

# Then test at:
# https://search.google.com/test/rich-results
```

### 3. Check Schema Syntax

```bash
# Visit https://validator.schema.org/
# Paste page source HTML
```

---

## ⚠️ Common Errors & Fixes

### Error: "Missing required property: price"

**Fix:**

```tsx
// Ensure price is a number, not null/undefined
product={{
  price: product.price ?? 0, // Default to 0
}}
```

### Error: "Invalid URL format"

**Fix:**

```tsx
// Use full URLs with https://
url: "https://vortexpcs.com/pc-builder#gpu-001";
// NOT: "/pc-builder#gpu-001"
```

### Error: "Invalid date format"

**Fix:**

```tsx
// Use ISO 8601 format: YYYY-MM-DD
datePublished: "2024-11-12";
// NOT: "11/12/2024" or "Nov 12, 2024"
```

### Error: "Missing image"

**Fix:**

```tsx
// Provide fallback image
imageUrl: product.imageUrl || "https://vortexpcs.com/vortexpcs-logo.png";
```

---

## 📊 Google Shopping Checklist

For Google Merchant Center approval:

- [ ] Add `gtin` (barcode) OR `mpn` to all products
- [ ] High-quality images (min 800x600px, white background preferred)
- [ ] Accurate prices and availability
- [ ] Clear product titles and descriptions
- [ ] HTTPS enabled (✅ already done)
- [ ] Return policy page (check `/returns`)
- [ ] Contact information visible
- [ ] Secure checkout process

**Product Feed Requirements:**

```tsx
<ProductSchema
  product={{
    id: "unique-sku",
    name: "Brand + Model + Key Feature",
    gtin: "5032037261098", // Barcode from supplier
    mpn: "RTX4090-24G", // Or this if no GTIN
    price: 1599.99,
    brand: "NVIDIA",
    category: "Electronics > Computers > Components > Graphics Cards",
    imageUrl: "https://vortexpcs.com/images/rtx4090-main.jpg",
    inStock: true,
  }}
/>
```

---

## 🎯 Integration Priority

### Phase 1: Foundation (✅ DONE)

- OrganizationSchema in App.tsx
- WebsiteSchema in App.tsx
- ServiceSchema in App.tsx
- ProductSchema already active in PCBuilder

### Phase 2: Enhancement (Next 2-4 hours)

1. **Add GTINs to products** (highest priority for Google Shopping)

   ```tsx
   // Update component data with supplier barcodes
   {
     id: "gpu-001",
     gtin: "5032037261098", // From NVIDIA
     mpn: "RTX4090-24G"
   }
   ```

2. **Add ReviewSchema to product pages**

   ```tsx
   // On product detail/hover popup
   <ReviewSchema productName={product.name} reviews={productReviews} />
   ```

3. **Add PCBuildSchema to build summaries**
   ```tsx
   // In PCBuilder when user completes build
   <PCBuildSchema build={completedBuild} />
   ```

### Phase 3: Content (Next 1-2 hours)

1. **Add FAQSchema to FAQ page**
2. **Add BreadcrumbSchema to all pages**
3. **Add reviews collection system**

---

## 📈 Expected Results Timeline

| Week | Event                | Expected Outcome                   |
| ---- | -------------------- | ---------------------------------- |
| 1    | Deploy schemas       | Google starts crawling             |
| 2    | Google indexes       | Schemas detected in Search Console |
| 3-4  | Rich snippets appear | CTR starts increasing              |
| 4-8  | Full coverage        | +30-50% CTR improvement            |
| 8+   | Google Shopping      | If approved, new traffic source    |

---

## 🔗 Quick Links

- **Test Rich Results:** https://search.google.com/test/rich-results
- **Validate Schema:** https://validator.schema.org/
- **Search Console:** https://search.google.com/search-console
- **Schema.org Docs:** https://schema.org/
- **Google Shopping:** https://merchants.google.com/

---

## 💡 Pro Tips

1. **Use Debug Mode During Development:**

   ```tsx
   <ProductSchema product={product} showInConsole={true} />
   ```

2. **Test Before Deploy:**

   - Build locally: `npm run build`
   - Preview: `npm run preview`
   - Open browser console to view JSON-LD

3. **Monitor Search Console Weekly:**

   - Check Enhancements > Products
   - Fix errors immediately
   - Monitor rich snippet impressions

4. **Update Regularly:**

   - Prices and availability daily/weekly
   - Reviews monthly
   - Organization info quarterly

5. **Optimize for Voice Search:**
   - FAQ answers 40-60 words
   - Natural language questions
   - Direct, concise answers

---

## 🆘 Troubleshooting

**Schemas not showing in page source?**

- Check that components are rendered in JSX
- Look for `<script type="application/ld+json">`
- View source, not inspect element

**Google not showing rich snippets?**

- Wait 2-4 weeks after deployment
- Submit URLs to Search Console
- Check for errors in Rich Results Test
- Ensure page is indexed (search `site:vortexpcs.com`)

**Products not appearing in Google Shopping?**

- Must apply to Google Merchant Center separately
- Need GTIN or MPN for all products
- High-quality images required
- Return policy must be visible

**Schema errors in Search Console?**

- Click error for details
- Fix in SchemaMarkup.tsx
- Redeploy and request re-indexing
- Monitor for resolution (1-2 weeks)

---

## ✅ Quick Checklist

Before deploying:

- [ ] All schemas render without errors
- [ ] JSON-LD visible in page source
- [ ] Prices and availability accurate
- [ ] Images load correctly (check 404s)
- [ ] URLs use full https:// format
- [ ] Dates in YYYY-MM-DD format
- [ ] GTINs/MPNs added (for Shopping)
- [ ] Tested with Rich Results Test
- [ ] No validation errors

After deploying:

- [ ] Submit to Search Console
- [ ] Monitor Enhancements report
- [ ] Check rich snippets in 2-4 weeks
- [ ] Track CTR improvements
- [ ] Apply to Google Merchant Center (if eligible)

**Status: ✅ Foundation Complete - Ready for Enhancement**
