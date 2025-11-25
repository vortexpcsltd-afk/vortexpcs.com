# Optional Extras Content Type Setup Guide

## Overview

This guide will help you create the "Optional Extras" content type in Contentful and populate it with sample data for the PC Builder.

## Step 1: Create Content Type in Contentful

### 1.1 Access Contentful

1. Go to https://app.contentful.com/spaces/a40jvx2pmnlr/content_types
2. Click "Add content type"

### 1.2 Configure Content Type

- **Name**: `Optional Extra`
- **API identifier**: `optionalExtra`
- **Description**: `Optional peripherals and accessories that can be added to PC builds`

### 1.3 Add Fields

#### Basic Information

1. **Field ID**: `extraId`

   - **Type**: Short text
   - **Required**: Yes
   - **Validation**: Unique field

2. **Field ID**: `name`

   - **Type**: Short text
   - **Required**: Yes

3. **Field ID**: `price`

   - **Type**: Number (decimal)
   - **Required**: Yes

4. **Field ID**: `category`

   - **Type**: Short text
   - **Required**: Yes
   - **Validation**: Predefined values: `keyboard`, `mouse`, `monitor`, `gamepad`, `mousepad`

5. **Field ID**: `description`

   - **Type**: Long text
   - **Required**: Yes

6. **Field ID**: `rating`
   - **Type**: Number (decimal)
   - **Required**: No
   - **Validation**: Min: 0, Max: 5

#### Common Fields

7. **Field ID**: `type`

   - **Type**: Short text
   - **Required**: No

8. **Field ID**: `wireless`

   - **Type**: Boolean
   - **Required**: No

9. **Field ID**: `rgb`

   - **Type**: Boolean
   - **Required**: No

10. **Field ID**: `brand`

    - **Type**: Short text
    - **Required**: No

11. **Field ID**: `color`
    - **Type**: Short text
    - **Required**: No

#### Keyboard-Specific Fields

12. **Field ID**: `switches`

    - **Type**: Short text
    - **Required**: No

13. **Field ID**: `layout`

    - **Type**: Short text
    - **Required**: No

14. **Field ID**: `keyCount`
    - **Type**: Integer
    - **Required**: No

#### Mouse-Specific Fields

15. **Field ID**: `dpi`

    - **Type**: Integer
    - **Required**: No

16. **Field ID**: `weight`

    - **Type**: Integer
    - **Required**: No

17. **Field ID**: `sensor`
    - **Type**: Short text
    - **Required**: No

#### Monitor-Specific Fields

18. **Field ID**: `size`

    - **Type**: Integer
    - **Required**: No

19. **Field ID**: `monitorResolution`

    - **Type**: Short text
    - **Required**: No

20. **Field ID**: `refreshRate`

    - **Type**: Integer
    - **Required**: No

21. **Field ID**: `panelType`

    - **Type**: Short text
    - **Required**: No

22. **Field ID**: `curved`

    - **Type**: Boolean
    - **Required**: No

23. **Field ID**: `aspectRatio`
    - **Type**: Short text
    - **Required**: No

#### Gamepad-Specific Fields

24. **Field ID**: `platform`

    - **Type**: Short text
    - **Required**: No

25. **Field ID**: `batteryLife`

    - **Type**: Short text
    - **Required**: No

26. **Field ID**: `connection`
    - **Type**: Short text
    - **Required**: No

#### Mousepad-Specific Fields

27. **Field ID**: `surface`

    - **Type**: Short text
    - **Required**: No

28. **Field ID**: `dimensions`

    - **Type**: Short text
    - **Required**: No

29. **Field ID**: `thickness`
    - **Type**: Integer
    - **Required**: No

#### Audio-Specific Fields (for future use)

30. **Field ID**: `frequencyResponse`

    - **Type**: Short text
    - **Required**: No

31. **Field ID**: `impedance`

    - **Type**: Integer
    - **Required**: No

32. **Field ID**: `microphone`

    - **Type**: Boolean
    - **Required**: No

33. **Field ID**: `surroundSound`
    - **Type**: Boolean
    - **Required**: No

#### Webcam/Microphone-Specific Fields

34. **Field ID**: `resolution`

    - **Type**: Short text
    - **Required**: No

35. **Field ID**: `frameRate`

    - **Type**: Integer
    - **Required**: No

36. **Field ID**: `fieldOfView`
    - **Type**: Integer
    - **Required**: No

#### Media & Status Fields

37. **Field ID**: `images`

    - **Type**: Media (multiple files)
    - **Required**: No

38. **Field ID**: `inStock`

    - **Type**: Boolean
    - **Required**: No
    - **Default**: true

39. **Field ID**: `featured`
    - **Type**: Boolean
    - **Required**: No
    - **Default**: false

### 1.4 Save Content Type

1. Click "Save" to create the content type
2. Click "Activate content type" to make it available

## Step 2: Add Sample Content

### Option A: Manual Entry

1. Go to Content → Optional Extra
2. Click "Add Optional Extra"
3. Fill in the fields for each peripheral
4. Add high-quality product images
5. Publish each entry

### Option B: Use Seeding Script

1. Set environment variables:

   ```bash
   export CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
   export CONTENTFUL_SPACE_ID=a40jvx2pmnlr
   ```

2. Run the seeding script:
   ```bash
   node seed-optional-extras.js
   ```

## Step 3: Test Integration

### 3.1 Start Development Server

```bash
npm run dev
```

### 3.2 Navigate to PC Builder

1. Go to http://localhost:3004/pc-builder
2. Scroll down to "Optional Extras" section
3. Check that peripherals load from Contentful
4. Test adding/removing items from cart

### 3.3 Verify Features

- ✅ Peripherals display with images
- ✅ Categories work (keyboard, mouse, monitor, etc.)
- ✅ Items can be added to build
- ✅ Pricing updates correctly
- ✅ Cart integration works

## Step 4: Content Management

### 4.1 Adding New Products

1. Go to Content → Optional Extra
2. Click "Add Optional Extra"
3. Fill required fields (name, price, category, description)
4. Add product images
5. Set appropriate specifications
6. Publish

### 4.2 Updating Products

1. Find the product in Content
2. Click to edit
3. Update fields as needed
4. Publish changes

### 4.3 Featured Products

- Set `featured: true` for products to highlight
- Featured items appear prominently in the interface

## Step 5: Troubleshooting

### Common Issues

#### Products Not Loading

- Check Contentful API keys in environment variables
- Verify content type name matches (`optionalExtra`)
- Check browser console for API errors

#### Images Not Displaying

- Ensure images are uploaded to Contentful
- Check that image URLs are properly formatted
- Verify CORS settings allow image loading

#### Categories Empty

- Check that products have correct `category` field values
- Verify category names match: `keyboard`, `mouse`, `monitor`, `gamepad`, `mousepad`

#### Pricing Issues

- Ensure `price` field is set as Number (decimal)
- Check that prices are positive numbers

### Debug Commands

```bash
# Check Contentful connection
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://cdn.contentful.com/spaces/a40jvx2pmnlr/environments/master/entries?content_type=optionalExtra"

# Test local API
npm run dev
# Open browser console and check for CMS loading messages
```

## Step 6: Production Deployment

### 6.1 Environment Variables

Ensure these are set in production:

```env
VITE_CONTENTFUL_SPACE_ID=a40jvx2pmnlr
VITE_CONTENTFUL_ACCESS_TOKEN=your_access_token
VITE_CONTENTFUL_ENVIRONMENT=master
```

### 6.2 Build and Deploy

```bash
npm run build
npm run deploy
```

### 6.3 Verify Production

1. Check that optional extras load on live site
2. Test cart functionality with peripherals
3. Verify images display correctly

## Sample Content Ideas

### Keyboards

- Mechanical vs Membrane
- Wireless vs Wired
- RGB vs Non-RGB
- Full-size, TKL, Compact layouts

### Mice

- Gaming mice with high DPI
- Wireless vs Wired
- Ergonomic designs
- Lightweight for esports

### Monitors

- 4K vs 1440p vs 1080p
- High refresh rate (144Hz+)
- Curved vs Flat
- Different panel types (IPS, VA, OLED)

### Gamepads

- Xbox, PlayStation, Nintendo controllers
- Wireless adapters
- Tournament-grade controllers

### Mousepads

- Cloth vs Hard surfaces
- Different sizes (S, M, L, XL)
- RGB lighting
- Extended desk coverage

## Future Enhancements

### Additional Categories

- Headsets
- Speakers
- Webcams
- Microphones
- External storage
- Cables and adapters

### Advanced Features

- Product variants (colors, sizes)
- Stock management
- Product reviews
- Related products
- Bundled deals

---

**Status**: ✅ Content type ready for implementation
**Next Steps**: Add sample content and test integration
