# Strapi Integration Quick Setup Checklist

## ✅ Immediate Tasks

### 1. Strapi Admin Setup

- [ ] Access Strapi admin: http://localhost:1337/admin
- [ ] Create admin account (if not done)
- [ ] Verify admin login works

### 2. Create Essential Content Types

#### Site Settings (Single Type):

- [ ] Create "Site Settings" single type
- [ ] Add fields: siteName, tagline, contactEmail, contactPhone, metaDescription
- [ ] Add content and publish

#### FAQ Items (Collection Type):

- [ ] Create "FAQ Item" collection type
- [ ] Add fields: question, answer, category (enumeration), order, featured, keywords
- [ ] Add 5-10 FAQ entries and publish them

#### Page Content (Collection Type):

- [ ] Create "Page Content" collection type
- [ ] Add fields: pageSlug (unique), pageTitle, heroTitle, heroSubtitle, heroDescription
- [ ] Create entries for "home" and "faq" pages

#### Company Stats (Single Type):

- [ ] Create "Company Stats" single type
- [ ] Add fields: yearsExperience, customersServed, pcBuildsCompleted, satisfactionRate
- [ ] Add your company stats and publish

### 3. Configure Permissions

- [ ] Go to Settings → Roles → Public
- [ ] Enable "find" and "findOne" for ALL content types
- [ ] Save permissions

### 4. Create API Token

- [ ] Go to Settings → API Tokens
- [ ] Create "Frontend Read Token" (Read-only)
- [ ] Copy the token
- [ ] Update .env file with: VITE_STRAPI_API_TOKEN=your_actual_token

### 5. Update Environment Variables

```env
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=your_actual_token_here
```

### 6. Test Integration

- [ ] Development server running (http://localhost:3001)
- [ ] Check browser console for Strapi messages
- [ ] Verify content loads from Strapi (not hardcoded)
- [ ] Test FAQ page shows CMS content
- [ ] Test homepage shows CMS hero content

## 🚨 Common Issues & Solutions

### "Cannot find content"

- Check if content is published in Strapi
- Verify API permissions are set for Public role
- Check API token is correct in .env

### "CORS errors"

- Strapi should allow localhost by default
- Check Strapi config/middlewares.js if needed

### "No content loading"

- Check browser console for 401/403 errors
- Verify .env file is in project root
- Restart dev server after .env changes

### "Strapi not accessible"

- Make sure Strapi is running: npm run develop (in Strapi folder)
- Check http://localhost:1337/admin loads

## 📋 Sample Content to Add

### FAQ Items:

1. Q: "How long does it take to build my custom PC?"
   A: "All custom PCs are built and tested within 5 working days from order confirmation and payment receipt."
   Category: "Building Process"
   Featured: Yes

2. Q: "What warranty do you provide?"
   A: "All custom builds include our comprehensive 3-year warranty covering parts, labor, and system functionality."
   Category: "Warranty"
   Featured: Yes

3. Q: "What payment methods do you accept?"
   A: "We accept all major credit/debit cards, PayPal, Apple Pay, Google Pay, and bank transfers."
   Category: "Payment"
   Featured: No

### Page Content:

1. Home Page:

   - pageSlug: "home"
   - heroTitle: "Build Your Ultimate Gaming Rig"
   - heroSubtitle: "Premium Custom PC Builds & Components"
   - heroDescription: "Experience unparalleled performance with our cutting-edge custom PC builds..."

2. FAQ Page:
   - pageSlug: "faq"
   - heroTitle: "Frequently Asked Questions"
   - heroDescription: "Find instant answers to common questions about our custom PC builds, services, warranty, and support."

## 🎯 Success Indicators

✅ **Working correctly when:**

- Homepage shows CMS hero content (not hardcoded)
- FAQ page loads questions from Strapi
- Company stats show your numbers
- No console errors about Strapi
- Content updates in Strapi appear on website immediately

## 📞 Need Help?

If you get stuck:

1. Check the browser console for specific error messages
2. Verify Strapi admin panel is accessible
3. Ensure all content is published (not just saved as draft)
4. Make sure API permissions are set correctly
5. Try restarting both Strapi and the dev server
