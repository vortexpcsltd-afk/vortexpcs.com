# Contentful CMS Setup Guide

This guide will help you set up Contentful as your headless CMS for the Vortex PCs website.

## Why Contentful?

✅ **Cloud-hosted** - No server maintenance required  
✅ **Rock-solid reliability** - 99.99% uptime SLA  
✅ **Fast setup** - Get running in under 30 minutes  
✅ **Free tier** - Perfect for small to medium sites  
✅ **Great API** - Well-documented and easy to use  
✅ **Content modeling** - Flexible schema design

---

## Step 1: Create Contentful Account

1. Go to [https://www.contentful.com/sign-up/](https://www.contentful.com/sign-up/)
2. Sign up with email or GitHub
3. Choose the **Free** plan (includes 25K records, 2 users)
4. Create a new space called **"Vortex PCs"**

---

## Step 2: Get Your API Credentials

1. In Contentful dashboard, go to **Settings** → **API keys**
2. Click **Add API key**
3. Name it "Vortex PCs Website"
4. Copy these values:

   - **Space ID** (e.g., `abc123xyz`)
   - **Content Delivery API - access token** (starts with letters/numbers)

5. Update your `.env` file:

```env
VITE_CONTENTFUL_SPACE_ID=abc123xyz
VITE_CONTENTFUL_ACCESS_TOKEN=your-actual-token-here
```

---

Short text fields (Page Slug, Page Title, Customer Name, etc.) → Text
Long text fields (Meta Description, Review, Description, Business Hours) → Text
Integer fields (Years Experience, Rating, Order) → Number
Decimal fields (Price) → Number
Media fields (Images, Customer Image, Hero Background Image) → Media
Boolean fields (Featured, Highlighted, Show On Homepage) → Boolean
JSON object fields (Hero Buttons, Sections, Components, Social Links) → JSON object

## Step 3: Create Content Models

You need to create these content types in Contentful. Go to **Content model** → **Add content type**.

### 1️⃣ Page Content

**Content type ID:** `pageContent`

| Field Name            | Field ID            | Type        | Required | Validations   |
| --------------------- | ------------------- | ----------- | -------- | ------------- |
| Page Slug             | pageSlug            | Short text  | Yes      | Unique        |
| Page Title            | pageTitle           | Short text  | Yes      |               |
| Meta Description      | metaDescription     | Long text   | No       | Max 160 chars |
| Hero Title            | heroTitle           | Short text  | No       |               |
| Hero Subtitle         | heroSubtitle        | Short text  | No       |               |
| Hero Description      | heroDescription     | Long text   | No       |               |
| Hero Background Image | heroBackgroundImage | Media       | No       | Images only   |
| Hero Buttons          | heroButtons         | JSON object | No       |               |
| Sections              | sections            | JSON object | No       |               |
| SEO                   | seo                 | JSON object | No       |               |

### 2️⃣ Company Stats

**Content type ID:** `companyStats`

| Field Name            | Field ID            | Type       | Required |
| --------------------- | ------------------- | ---------- | -------- |
| Years Experience      | yearsExperience     | Integer    | Yes      |
| Customers Served      | customersServed     | Integer    | Yes      |
| PC Builds Completed   | pcBuildsCompleted   | Integer    | Yes      |
| Warranty Years        | warrantyYears       | Integer    | Yes      |
| Support Response Time | supportResponseTime | Short text | Yes      |
| Satisfaction Rate     | satisfactionRate    | Integer    | Yes      |
| Parts In Stock        | partsInStock        | Integer    | Yes      |

### 3️⃣ Testimonial

**Content type ID:** `testimonial`

| Field Name     | Field ID      | Type       | Required |
| -------------- | ------------- | ---------- | -------- |
| Customer Name  | customerName  | Short text | Yes      |
| Rating         | rating        | Integer    | Yes      |
| Review         | review        | Long text  | Yes      |
| Product Name   | productName   | Short text | No       |
| Customer Image | customerImage | Media      | No       |

### 4️⃣ PC Build

**Content type ID:** `pcBuild`

| Field Name  | Field ID    | Type         | Required |
| ----------- | ----------- | ------------ | -------- |
| Name        | name        | Short text   | Yes      |
| Description | description | Long text    | Yes      |
| Price       | price       | Decimal      | Yes      |
| Category    | category    | Short text   | Yes      |
| Featured    | featured    | Boolean      | No       |
| Components  | components  | JSON object  | Yes      |
| Images      | images      | Media (many) | No       |

**Example Components JSON:**

```json
{
  "cpu": "AMD Ryzen 9 7950X3D",
  "gpu": "NVIDIA RTX 4090",
  "ram": "64GB DDR5-6000",
  "storage": "2TB NVMe Gen5",
  "motherboard": "ASUS ROG Crosshair X670E",
  "psu": "Corsair HX1000i",
  "case": "Lian Li O11 Dynamic",
  "cooling": "360mm AIO RGB"
}
```

### 5️⃣ Feature Item

**Content type ID:** `featureItem`

| Field Name       | Field ID       | Type       | Required |
| ---------------- | -------------- | ---------- | -------- |
| Title            | title          | Short text | Yes      |
| Description      | description    | Long text  | Yes      |
| Icon             | icon           | Short text | Yes      |
| Category         | category       | Short text | Yes      |
| Order            | order          | Integer    | No       |
| Highlighted      | highlighted    | Boolean    | No       |
| Link             | link           | Short text | No       |
| Show On Homepage | showOnHomepage | Boolean    | Yes      |

**Icon values:** Use Lucide React icon names like `Settings`, `Shield`, `Zap`, `Award`, `Heart`, `Star`

### 6️⃣ Site Settings (Optional)

**Content type ID:** `siteSettings`

| Field Name       | Field ID        | Type        | Required |
| ---------------- | --------------- | ----------- | -------- |
| Site Name        | siteName        | Short text  | Yes      |
| Tagline          | tagline         | Short text  | No       |
| Meta Description | metaDescription | Long text   | No       |
| Contact Email    | contactEmail    | Short text  | Yes      |
| Contact Phone    | contactPhone    | Short text  | Yes      |
| WhatsApp Number  | whatsappNumber  | Short text  | No       |
| Business Hours   | businessHours   | Long text   | No       |
| Social Links     | socialLinks     | JSON object | No       |

---

## Step 4: Add Sample Content

### Create a Homepage Entry

1. Go to **Content** → **Add entry** → **Page Content**
2. Fill in:
   - **Page Slug:** `home`
   - **Page Title:** `Home - Vortex PCs`
   - **Meta Description:** `Premium custom PC builds and gaming computers. Expert assembly, quality guarantee, fast UK delivery.`
   - **Hero Title:** `Build Your Dream PC`
   - **Hero Subtitle:** `Premium Custom Gaming PCs & Workstations`
   - **Hero Description:** `Professional PC building service with premium components, expert assembly, and comprehensive warranty. Built for gamers, creators, and professionals.`
3. Click **Publish**

### Create Company Stats

1. Go to **Content** → **Add entry** → **Company Stats**
2. Fill in:
   - **Years Experience:** `10`
   - **Customers Served:** `2500`
   - **PC Builds Completed:** `5000`
   - **Warranty Years:** `1`
   - **Support Response Time:** `24 hours`
   - **Satisfaction Rate:** `98`
   - **Parts In Stock:** `1000`
3. Click **Publish**

### Create Sample Testimonials

Add 3 testimonial entries:

**Testimonial 1:**

- Customer Name: `Alex Johnson`
- Rating: `5`
- Review: `Incredible build quality and performance! My RTX 4090 build runs everything at 4K ultra settings flawlessly.`
- Product Name: `Vortex Gaming Beast`

**Testimonial 2:**

- Customer Name: `Sarah Chen`
- Rating: `5`
- Review: `Outstanding customer service and fast delivery. The PC exceeded my expectations for video editing work.`
- Product Name: `Vortex Creator Pro`

**Testimonial 3:**

- Customer Name: `Mike Thompson`
- Rating: `5`
- Review: `Best investment I've made! The build quality is exceptional and the performance is mind-blowing.`
- Product Name: `Vortex Gaming Beast`

### Create Featured PC Builds

**Build 1: Vortex Gaming Beast**

- Name: `Vortex Gaming Beast`
- Description: `Ultimate 4K gaming powerhouse with the latest components`
- Price: `3499`
- Category: `Gaming`
- Featured: `✓` (checked)
- Components:

```json
{
  "cpu": "AMD Ryzen 9 7950X3D",
  "gpu": "NVIDIA RTX 4090",
  "ram": "64GB DDR5-6000",
  "storage": "2TB NVMe Gen5",
  "motherboard": "ASUS ROG Crosshair X670E",
  "psu": "Corsair HX1000i",
  "case": "Lian Li O11 Dynamic",
  "cooling": "360mm AIO RGB"
}
```

**Build 2: Vortex Creator Pro**

- Name: `Vortex Creator Pro`
- Description: `Professional content creation workstation`
- Price: `2899`
- Category: `Workstation`
- Featured: `✓` (checked)
- Components:

```json
{
  "cpu": "AMD Ryzen 9 7950X",
  "gpu": "NVIDIA RTX 4080",
  "ram": "64GB DDR5-5600",
  "storage": "2TB NVMe + 4TB HDD",
  "motherboard": "ASUS ProArt X670E",
  "psu": "Corsair RM850x",
  "case": "Fractal Design Define 7",
  "cooling": "280mm AIO"
}
```

### Create Feature Items for Homepage

**Feature 1:**

- Title: `Expert Assembly`
- Description: `Professional PC building with premium components and attention to detail`
- Icon: `Settings`
- Category: `Quality`
- Order: `1`
- Highlighted: `✓`
- Show On Homepage: `✓`

**Feature 2:**

- Title: `Quality Guarantee`
- Description: `1-year warranty on all custom builds with comprehensive support`
- Icon: `Shield`
- Category: `Warranty`
- Order: `2`
- Highlighted: `✓`
- Show On Homepage: `✓`

**Feature 3:**

- Title: `Fast Delivery`
- Description: `Built and shipped within 3-5 business days`
- Icon: `Zap`
- Category: `Delivery`
- Order: `3`
- Highlighted: `false`
- Show On Homepage: `✓`

---

## Step 5: Test Your Integration

1. Start your development server:

```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. Check the browser console for:

   - ✅ `✅ Contentful testimonials fetched:` (array of testimonials)
   - ✅ `✅ Contentful categories fetched:` (if you created categories)
   - ✅ `📄 Page content result:` (homepage data)

4. Your homepage should now display:
   - Hero section with your custom title/subtitle
   - Company statistics
   - Featured PC builds
   - Customer testimonials
   - Feature items

---

## Troubleshooting

### "No content showing" Issue

**Check 1: Environment Variables**

```bash
# In PowerShell, verify variables are set:
Get-Content .env | Select-String CONTENTFUL
```

**Check 2: Content Published**

- All entries must be **Published** (green badge), not just saved as drafts

**Check 3: Field IDs Match**

- Field IDs in Contentful must exactly match what's in the code (case-sensitive)
- Example: `pageSlug` not `PageSlug` or `page_slug`

**Check 4: Content Type IDs**

- `pageContent` (not `page-content` or `PageContent`)
- `companyStats` (not `company-stats`)
- `testimonial` (not `testimonials`)
- `pcBuild` (not `pc-build`)
- `featureItem` (not `feature-item`)

### "API Error" Issues

**401 Unauthorized:**

- Check your `VITE_CONTENTFUL_ACCESS_TOKEN` is the **Content Delivery API** token
- NOT the Content Management API or Content Preview API token

**404 Not Found:**

- Verify `VITE_CONTENTFUL_SPACE_ID` is correct
- Space ID is shown in Settings → General settings

**Empty Results:**

- Check content is published
- Verify field IDs match exactly
- Check filter parameters (e.g., `featured: true` requires that field to exist)

---

## Migration from Strapi

The code has been fully migrated to Contentful:

✅ `config/contentful.ts` - Contentful client configuration  
✅ `services/cms.ts` - All fetch functions updated  
✅ `.env` - Environment variables switched to Contentful  
✅ Components - No changes needed! Same interfaces

**Old Strapi files backed up:**

- `services/cms-strapi-backup.ts` - Original Strapi service
- `vortex-cms/` directory - Can be deleted after confirming Contentful works

---

## Next Steps

1. ✅ Complete all content types above
2. ✅ Add your actual content
3. ✅ Test thoroughly on localhost
4. ✅ Deploy to production
5. ⚠️ Delete `vortex-cms` folder when confident
6. 📝 Update documentation to remove Strapi references

---

## Contentful Resources

- **Documentation:** https://www.contentful.com/developers/docs/
- **Content Delivery API:** https://www.contentful.com/developers/docs/references/content-delivery-api/
- **Community:** https://www.contentful.com/community/
- **Support:** Available via in-app chat

---

## Content Type Quick Reference

```
pageContent       → Homepage hero and page data
companyStats      → Statistics displayed on homepage
testimonial       → Customer reviews
pcBuild           → Pre-built PC configurations
featureItem       → Feature highlights for homepage
siteSettings      → Global site configuration
product           → Individual components (optional)
category          → Product categories (optional)
faqItem           → FAQ questions (optional)
serviceItem       → Repair services (optional)
teamMember        → Team profiles (optional)
```

---

**Need help?** Check the browser console for detailed error messages from the CMS service.
