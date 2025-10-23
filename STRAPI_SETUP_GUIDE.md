# Complete Strapi CMS Setup Guide for Vortex PCs

This guide will walk you through setting up a complete CMS system using Strapi that makes every part of your website editable without touching code.

## 🎯 What You'll Achieve

After following this guide, you'll be able to edit:

- ✅ All text content (hero sections, descriptions, etc.)
- ✅ FAQ questions and answers with categories
- ✅ Service offerings and pricing
- ✅ Company features and benefits
- ✅ Team member information
- ✅ Company statistics and metrics
- ✅ Navigation menus
- ✅ Contact information
- ✅ Legal page content (Terms, Privacy, Cookies)
- ✅ Product and PC build data

## 📋 Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- A GitHub account (for deployment)
- Basic understanding of web development
- Access to your domain's DNS settings

## 🚀 Step 1: Deploy Strapi to Strapi Cloud

### Option A: Strapi Cloud (Recommended - Easiest)

1. **Sign up for Strapi Cloud**

   - Go to [cloud.strapi.io](https://cloud.strapi.io)
   - Create account using GitHub/Google
   - Choose the free plan to start

2. **Create New Project**

   - Click "Create Project"
   - Choose "Blank Project"
   - Select region closest to UK (EU-West)
   - Name: `vortex-pcs-cms`

3. **Wait for Deployment**
   - Takes 2-3 minutes
   - Note your project URL: `https://your-project.strapi.app`

### Option B: Self-Hosted (Advanced)

If you prefer self-hosting, deploy to:

- Heroku
- DigitalOcean App Platform
- Railway
- AWS/Google Cloud

## 🏗️ Step 2: Set Up Content Types

### Method A: Import JSON Schemas (Fastest)

1. **Access Admin Panel**

   - Visit your Strapi URL + `/admin`
   - Create admin account (save credentials securely!)

2. **Import Content Types**

   - Copy content from `strapi-schemas.json` in your project
   - Go to Content-Type Builder
   - For each content type in the JSON:
     - Click "Create new collection type" or "Create new single type"
     - Use "Import from JSON" if available, or create manually

3. **Create Each Content Type Manually**

   **Site Settings (Single Type)**:

   - Name: `site-setting`
   - Fields:
     - `siteName` (Text, required)
     - `logoUrl` (Text)
     - `tagline` (Text)
     - `metaDescription` (Long text)
     - `socialLinks` (JSON)
     - `businessHours` (Rich text)
     - `enableMaintenance` (Boolean)
     - `maintenanceMessage` (Rich text)
     - `announcementBar` (Rich text)
     - `enableAnnouncementBar` (Boolean)
     - `contactEmail` (Email)
     - `contactPhone` (Text)
     - `whatsappNumber` (Text)

   **Page Content (Collection Type)**:

   - Name: `page-content`
   - Fields:
     - `pageSlug` (Text, required, unique)
     - `pageTitle` (Text, required)
     - `metaDescription` (Long text)
     - `heroTitle` (Text)
     - `heroSubtitle` (Text)
     - `heroDescription` (Rich text)
     - `heroBackgroundImage` (Media - Single)
     - `heroButtons` (JSON)
     - `sections` (JSON)
     - `seo` (JSON)
     - `lastUpdated` (DateTime)

   **FAQ Items (Collection Type)**:

   - Name: `faq-item`
   - Fields:
     - `question` (Text, required)
     - `answer` (Rich text, required)
     - `category` (Enumeration: General, Building Process, Components, Warranty, Shipping, Payment, Support, Customization)
     - `order` (Number)
     - `featured` (Boolean)
     - `keywords` (Long text)
     - `lastUpdated` (DateTime)

   Continue with other content types from `strapi-schemas.json`...

## 🔑 Step 3: Configure API Permissions

1. **Set Public Permissions**

   - Go to Settings → Roles → Public
   - Enable `find` and `findOne` for all content types
   - Save permissions

2. **Create API Token**
   - Go to Settings → API Tokens
   - Click "Create new API Token"
   - Name: `Frontend Read Token`
   - Token type: `Read-only`
   - Copy token (save securely!)

## 🎨 Step 4: Add Initial Content

### Site Settings

1. Go to Content Manager → Site Setting
2. Fill in your company details:
   - Site Name: "Vortex PCs"
   - Tagline: "Premium Custom PC Builds"
   - Contact Email: "info@vortexpcs.co.uk"
   - Phone: "+44 123 456 7890"
3. Save & Publish

### Page Content

Create entries for each page:

1. **Home Page**:

   - Page Slug: `home`
   - Page Title: "Vortex PCs - Premium Custom PC Builds"
   - Hero Title: "Build Your Ultimate Gaming Rig"
   - Hero Subtitle: "Premium Custom PC Builds & Components"
   - Hero Description: "Experience unparalleled performance with our cutting-edge custom PC builds..."

2. **FAQ Page**:
   - Page Slug: `faq`
   - Page Title: "Frequently Asked Questions - Vortex PCs"
   - Hero Title: "Frequently Asked Questions"
   - Hero Description: "Find instant answers to common questions..."

Continue for other pages...

### FAQ Items

Add your FAQ content:

1. **Example FAQ**:
   - Question: "How long does it take to build my custom PC?"
   - Answer: "All custom PCs are built and tested within 5 working days..."
   - Category: "Building Process"
   - Featured: Yes
   - Keywords: "build time, delivery, express"

Add 20-30 FAQs covering all categories.

### Company Stats

1. Go to Content Manager → Company Stat
2. Fill in your metrics:
   - Years Experience: 10
   - Customers Served: 2500
   - PC Builds Completed: 5000
   - Satisfaction Rate: 98

Continue adding content for all types...

## ⚙️ Step 5: Connect Frontend to Strapi

### Environment Variables

1. **Create/Update .env file**:

   ```env
   # Strapi Configuration
   VITE_STRAPI_URL=https://your-project.strapi.app
   VITE_STRAPI_API_TOKEN=your_api_token_here

   # Other existing variables...
   VITE_FIREBASE_API_KEY=your_firebase_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   ```

2. **Deploy Environment Variables**:
   - **Vercel**: Dashboard → Project → Settings → Environment Variables
   - **Netlify**: Dashboard → Site Settings → Environment Variables
   - **Local Development**: Create `.env` file in project root

### Test the Connection

1. **Start Development Server**:

   ```bash
   npm run dev
   ```

2. **Check Browser Console**:

   - Look for "✅ Strapi settings fetched" messages
   - Verify content loads from Strapi

3. **Verify Content**:
   - HomePage should show CMS hero content
   - FAQ page should load CMS questions
   - Company stats should display CMS numbers

## 🎯 Step 6: Content Management Workflow

### For Content Editors

1. **Access Admin Panel**

   - Visit: `https://your-project.strapi.app/admin`
   - Login with editor credentials

2. **Edit Content**

   - Go to Content Manager
   - Select content type (e.g., FAQ Items)
   - Edit existing or create new
   - Use rich text editor for formatting

3. **Publish Changes**
   - Click "Save" then "Publish"
   - Changes appear on website immediately

### Content Types Quick Reference

| Content Type        | Purpose             | Key Fields                           |
| ------------------- | ------------------- | ------------------------------------ |
| Site Settings       | Global settings     | siteName, tagline, contactEmail      |
| Page Content        | Individual pages    | pageSlug, heroTitle, heroDescription |
| FAQ Items           | Questions & answers | question, answer, category           |
| Feature Items       | Company features    | title, description, icon             |
| Service Items       | Repair services     | serviceName, price, description      |
| Company Stats       | Homepage metrics    | yearsExperience, customersServed     |
| Team Members        | Staff information   | name, position, bio                  |
| Contact Information | Contact details     | email, phone, address                |

## 🔒 Step 7: Security & Permissions

### Role-Based Access

1. **Editor Role**:

   - Create/edit/publish content
   - No access to settings or users
   - Cannot delete content types

2. **Admin Role**:
   - Full access to everything
   - Manage users and permissions
   - Configure content types

### API Security

1. **Enable Rate Limiting**:

   - Strapi Cloud includes this by default
   - Self-hosted: Configure in `config/middleware.js`

2. **Secure API Tokens**:
   - Use read-only tokens for frontend
   - Rotate tokens regularly
   - Never expose in client-side code

## 🚀 Step 8: Advanced Configuration

### Custom Fields

Add custom fields as needed:

1. **Image Galleries**:

   - Add Media field (multiple files)
   - Use for product images, team photos

2. **SEO Fields**:
   - Meta descriptions
   - Social media images
   - Structured data

### Webhooks (Optional)

Set up webhooks for advanced integrations:

1. **Content Sync**:

   - Trigger builds on content changes
   - Sync to external systems

2. **Notifications**:
   - Email alerts on content updates
   - Slack notifications

## 🎨 Step 9: Content Best Practices

### Writing Guidelines

1. **Consistent Tone**:

   - Professional but friendly
   - Technical but accessible
   - Focus on customer benefits

2. **SEO Optimization**:

   - Include target keywords naturally
   - Write compelling meta descriptions
   - Use heading hierarchy properly

3. **Content Structure**:
   - Use bullet points for features
   - Keep paragraphs short
   - Include call-to-action phrases

### Image Guidelines

1. **Optimization**:

   - Use WebP format when possible
   - Compress images before upload
   - Include alt text for accessibility

2. **Consistency**:
   - Maintain brand colors and style
   - Use consistent aspect ratios
   - High-quality, professional images

## 🔧 Step 10: Troubleshooting

### Common Issues

1. **Content Not Loading**:

   - Check environment variables
   - Verify API token permissions
   - Check browser console for errors

2. **Slow Loading**:

   - Optimize images in Strapi
   - Use pagination for large datasets
   - Enable caching headers

3. **Permission Errors**:
   - Verify Public role permissions
   - Check API token scope
   - Ensure content is published

### Getting Help

1. **Check Logs**:

   - Browser developer console
   - Strapi admin panel logs
   - Server deployment logs

2. **Resources**:
   - [Strapi Documentation](https://docs.strapi.io)
   - [Strapi Community Discord](https://discord.strapi.io)
   - Contact Vortex PCs development team

## 🎯 Next Steps

### Phase 1: Content Population

- [ ] Add all FAQ items (20-30 questions)
- [ ] Create service item entries
- [ ] Upload team member photos and bios
- [ ] Configure all page content

### Phase 2: Advanced Features

- [ ] Set up multilingual content (if needed)
- [ ] Add blog/news content type
- [ ] Implement content scheduling
- [ ] Add customer testimonial collection

### Phase 3: Optimization

- [ ] Set up content delivery network (CDN)
- [ ] Implement advanced caching
- [ ] Add search functionality
- [ ] Monitor content performance

## 🎉 Success!

You now have a fully functional CMS that allows editing every part of your website without touching code. Your team can:

- ✅ Update FAQ questions instantly
- ✅ Modify hero section content
- ✅ Add new services and pricing
- ✅ Update company information
- ✅ Manage team member profiles
- ✅ Control site-wide settings

The website will automatically pull the latest content from Strapi, making content management completely non-technical!
