# Add Sample Inventory Items

This script will help you add sample inventory items to test the Inventory Management system.

## Option 1: Via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click **+ Start collection**
5. Collection ID: `inventory`
6. Add documents with these fields:

### Sample Item 1: AMD Ryzen 9 7950X

```
name: AMD Ryzen 9 7950X
sku: CPU-AMD-7950X
category: Processors
stock: 15
reorderPoint: 5
price: 599.99
supplier: AMD Direct
notes: High-performance CPU for gaming and workstation builds
```

### Sample Item 2: NVIDIA RTX 4090

```
name: NVIDIA GeForce RTX 4090
sku: GPU-NV-4090
category: Graphics Cards
stock: 3
reorderPoint: 5
price: 1599.99
supplier: NVIDIA Partners
notes: Premium GPU - High demand
```

### Sample Item 3: Corsair Vengeance DDR5

```
name: Corsair Vengeance DDR5 32GB
sku: RAM-COR-DDR5-32
category: Memory
stock: 0
reorderPoint: 10
price: 149.99
supplier: Corsair
notes: Out of stock - reorder immediately
```

### Sample Item 4: Samsung 990 Pro SSD

```
name: Samsung 990 Pro 2TB NVMe
sku: SSD-SAM-990-2TB
category: Storage
stock: 25
reorderPoint: 8
price: 199.99
supplier: Samsung
notes: Fast NVMe storage
```

### Sample Item 5: ASUS ROG Strix B650

```
name: ASUS ROG Strix B650-E
sku: MB-ASUS-B650E
category: Motherboards
stock: 8
reorderPoint: 5
price: 299.99
supplier: ASUS
notes: Mid-range AM5 motherboard
```

## Option 2: Via REST API (Advanced)

You can use the Firebase Admin SDK or REST API to bulk import inventory data. Contact your development team for assistance with bulk imports.

## Option 3: Quick Test Data (Minimal)

If you just want to test the system, add at least one document to the `inventory` collection with these minimum required fields:

```
name: "Test Product"
sku: "TEST-001"
category: "Test"
stock: 10
reorderPoint: 5
price: 99.99
```

## After Adding Items

1. Refresh the Inventory page in the admin panel
2. You should see your items displayed
3. Test the search, filters, and edit functionality
4. Try the restock feature

## Stock Status Examples

The system will automatically show status badges based on stock levels:

- **Green (In Stock)**: stock > reorderPoint (e.g., stock: 15, reorderPoint: 5)
- **Yellow (Low Stock)**: 0 < stock ≤ reorderPoint (e.g., stock: 3, reorderPoint: 5)
- **Red (Out of Stock)**: stock = 0

## Notes

- All fields are required except `supplier`, `notes`, and `lastRestocked`
- `stock` and `reorderPoint` must be numbers (not strings)
- `price` should be a number (not a string)
- `lastRestocked` is automatically set when you use the Restock feature
- You can leave `lastRestocked` empty for new items (will show "Never")
