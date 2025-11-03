# Stock Level Management Guide

## Overview

Your Vortex PCs website now supports real-time stock level tracking for all products (PC components and optional extras) via Contentful CMS.

## Contentful Setup

### Adding Stock Level Field to Content Types

You need to add a `stockLevel` field to each product content type in Contentful:

1. **PC Component Content Types** (add to each):
   - `pcCase`
   - `pcMotherboard`
   - `pcCpu`
   - `pcGpu`
   - `pcRam`
   - `pcStorage`
   - `pcPsu`
   - `pcCooling`

2. **Optional Extra Content Type**:
   - `optionalExtra`

### Field Configuration

**Field ID**: `stockLevel`
**Field Name**: Stock Level
**Field Type**: Number (Integer)
**Validation**: 
- Minimum value: 0
- Required: No (optional - products without this field show as "N/A")

**Help Text**: "Current inventory quantity. Leave empty if unlimited or not tracking stock."

## How Stock Levels Work

### Stock Status Logic

The system automatically categorizes products based on stock levels:

- **Out of Stock**: `stockLevel = 0` or `inStock = false`
  - Badge: Red background
  - Display: "Out of Stock"

- **Low Stock**: `stockLevel > 0` and `stockLevel <= 5`
  - Badge: Yellow background
  - Display: "Low Stock (X)" where X is the actual quantity

- **In Stock**: `stockLevel > 5` or `stockLevel` not set
  - Badge: Green background
  - Display: "✓ In Stock (X)" or "✓ In Stock (∞)" if no stockLevel

### Admin Panel Inventory View

Navigate to **Admin Panel → Inventory Tab** to see:

- **Stock Qty Column**: Color-coded quantities
  - Red (0): Out of stock
  - Yellow (1-5): Low stock warning
  - Green (6+): Healthy stock
  - Gray: No stock tracking (N/A)

- **Status Column**: Simplified status badge
  - Out of Stock / Low Stock / In Stock

- **Actions**: 
  - "Edit in Contentful" - Opens product directly in Contentful for editing
  - Filter by category
  - Sort by various fields

### Product Display (PC Builder)

Stock information appears in:

1. **Component Detail Modal** (large view when clicking a product):
   - Stock badge next to rating
   - Shows exact quantity for low stock items
   - Color-coded for quick visual feedback

2. **Component Cards** (grid/list view):
   - Stock status badges visible at a glance

## Managing Stock in Contentful

### Updating Stock Levels

1. Open Contentful dashboard: https://app.contentful.com
2. Navigate to **Content** tab
3. Find your product (e.g., search for "RTX 4090")
4. Edit the product entry
5. Update the `Stock Level` field
6. Click **Publish**

Changes will appear on your website within a few minutes (based on cache settings).

### Bulk Stock Updates

For bulk updates, you can use:

1. **Contentful Web App**:
   - Filter products by content type
   - Edit multiple entries

2. **Contentful Management API**:
   - Automate stock updates via API
   - See: https://www.contentful.com/developers/docs/references/content-management-api/

3. **CSV Import/Export**:
   - Use Contentful's import/export feature
   - Update stock levels in spreadsheet
   - Re-import to Contentful

## Integration with E-commerce

### Automatic Stock Deduction (Future Enhancement)

Currently, stock levels are **display-only** and must be manually updated in Contentful. 

For automatic stock deduction on purchase:

1. Add serverless function to handle order completion
2. Use Contentful Management API to decrement stock
3. Trigger on Stripe webhook or order completion
4. See `backend-examples/` for implementation patterns

### Example: Auto-decrement Stock

```typescript
// In your order completion handler (e.g., Stripe webhook)
import { createClient } from 'contentful-management';

const updateStock = async (componentId: string, quantity: number) => {
  const client = createClient({
    accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
  });
  
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment('master');
  const entry = await environment.getEntry(componentId);
  
  const currentStock = entry.fields.stockLevel['en-US'] || 0;
  entry.fields.stockLevel['en-US'] = Math.max(0, currentStock - quantity);
  
  await entry.update();
  await entry.publish();
};
```

## Best Practices

### Stock Management Workflow

1. **Daily**: Check inventory tab for low stock warnings
2. **Weekly**: Audit stock levels against physical/supplier inventory
3. **Before Sales**: Verify stock levels are accurate
4. **After Restocking**: Update Contentful immediately

### Stock Level Guidelines

- **High-demand items**: Track precisely, set up low-stock alerts
- **Standard items**: Update weekly
- **Special orders**: Set to 0 or remove from catalog
- **Unlimited digital products**: Leave stockLevel empty

### Display Considerations

- Products without `stockLevel` field show "In Stock" by default
- Set `inStock = false` to hide from catalog entirely
- Low stock (≤5) creates urgency for customers
- Out of stock items still visible but can't be added to cart

## Troubleshooting

### Stock Not Updating on Website

1. **Check Contentful**: Verify field is published (not just saved)
2. **Cache**: Wait 5-10 minutes for CMS cache to refresh
3. **Browser Cache**: Hard refresh (Ctrl+Shift+R)
4. **Contentful Sync**: Check Contentful Delivery API is responding

### Stock Shows "N/A"

- Product doesn't have `stockLevel` field
- Field exists but is empty (null)
- **Solution**: Add/set the field in Contentful

### Admin Panel Not Showing Stock

1. Check environment variables (VITE_CONTENTFUL_*)
2. Verify Contentful is enabled and configured
3. Check browser console for CMS errors
4. Ensure product content types include stockLevel field

## Future Enhancements

Potential additions for stock management:

- [ ] Stock history tracking (when/who changed)
- [ ] Automated low-stock email alerts
- [ ] Restock reminder system
- [ ] Supplier integration for auto-ordering
- [ ] Inventory forecasting based on sales
- [ ] Multi-location stock tracking
- [ ] Reserved stock for pending orders

## Support

For issues or questions:
- Check Contentful documentation
- Review admin panel inventory tab
- Contact development team for API integration help
