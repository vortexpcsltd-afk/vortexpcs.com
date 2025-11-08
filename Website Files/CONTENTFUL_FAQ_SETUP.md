# Contentful FAQ Integration Guide

## Overview

The FAQ page is now fully integrated with Contentful CMS, allowing you to easily manage FAQ content without touching any code. This guide will walk you through setting up the FAQ content type and adding/managing FAQ items.

---

## Step 1: Create FAQ Content Type in Contentful

1. Log into your Contentful dashboard
2. Navigate to **Content model** → **Add content type**
3. Create a new content type with these details:

**Content Type Settings:**

- **Name:** FAQ Item
- **API Identifier:** `faqItem` ⚠️ IMPORTANT: Must be exactly `faqItem` (case-sensitive)
- **Description:** FAQ questions and answers for the help center

---

## Step 2: Add Fields to FAQ Content Type

Add the following fields in this order:

### Field 1: Question

- **Field Name:** Question
- **Field ID:** `question` (auto-generated)
- **Type:** Short text
- **Required:** ✅ Yes
- **Validations:**
  - Max length: 200 characters
  - Required field
- **Help text:** The FAQ question (e.g., "How long does it take to build my custom PC?")

### Field 2: Answer

- **Field Name:** Answer
- **Field ID:** `answer` (auto-generated)
- **Type:** Long text
- **Required:** ✅ Yes
- **Appearance:** Markdown editor (optional) or plain text area
- **Validations:**
  - Required field
- **Help text:** The detailed answer to the question. Can include line breaks and formatting.

### Field 3: Category

- **Field Name:** Category
- **Field ID:** `category` (auto-generated)
- **Type:** Short text
- **Required:** ✅ Yes
- **Validations:**
  - Required field
  - Predefined values (List):
    - Building Process
    - Customization
    - Warranty
    - Payment
    - Shipping
    - Support
    - General
- **Help text:** Category for organizing FAQs. Used for filtering on the FAQ page.

### Field 4: Order

- **Field Name:** Order
- **Field ID:** `order` (auto-generated)
- **Type:** Integer
- **Required:** No
- **Default value:** 0
- **Help text:** Display order (lower numbers appear first). Use 1, 2, 3, etc.

### Field 5: Featured

- **Field Name:** Featured
- **Field ID:** `featured` (auto-generated)
- **Type:** Boolean
- **Required:** No
- **Default value:** false
- **Help text:** Mark as featured to highlight this FAQ

### Field 6: Keywords

- **Field Name:** Keywords
- **Field ID:** `keywords` (auto-generated)
- **Type:** Short text
- **Required:** No
- **Help text:** Comma-separated keywords for search (e.g., "build time, delivery, express")

---

## Step 3: Configure Entry Display

In the content type settings:

1. **Entry title:** Set to use the `question` field
2. **Entry display:** Show `category` as additional info
3. **Save** the content type

---

## Step 4: Add FAQ Content

Now you can start adding FAQ entries! Here are 8 pre-configured FAQs matching the premium design:

### FAQ 1: Build Time

- **Question:** How long does it take to build my custom PC?
- **Answer:** All custom PCs are built and tested within 5 working days from order confirmation and payment receipt. We provide build updates via email and you can track progress through your member area. Express builds may be available for urgent requirements - please contact us to discuss.
- **Category:** Building Process
- **Order:** 1
- **Featured:** ✅ true
- **Keywords:** build time, delivery, express

### FAQ 2: Customization

- **Question:** Can I customize any component in my PC build?
- **Answer:** Absolutely! Every component can be customized to your exact requirements. Use our PC Builder to select from premium components, or contact us for specialized parts not listed. We source from top manufacturers including ASUS, MSI, Corsair, NZXT, and more.
- **Category:** Customization
- **Order:** 2
- **Featured:** ✅ true
- **Keywords:** customization, components, brands

### FAQ 3: Warranty

- **Question:** What warranty do you provide?
- **Answer:** All custom builds include our comprehensive 3-year warranty covering parts, labor, and system functionality. Individual components retain their manufacturer warranties (typically 2-5 years). We also offer optional extended warranties up to 5 years.
- **Category:** Warranty
- **Order:** 3
- **Featured:** ✅ true
- **Keywords:** warranty, 3 year, coverage, extended

### FAQ 4: Payment Methods

- **Question:** What payment methods do you accept?
- **Answer:** We accept all major credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through Stripe with full PCI compliance.
- **Category:** Payment
- **Order:** 4
- **Featured:** false
- **Keywords:** payment, cards, paypal, secure

### FAQ 5: Delivery

- **Question:** How is my PC delivered safely?
- **Answer:** All PCs are professionally packaged in custom foam inserts and anti-static materials. We use tracked, insured courier services with signature required delivery. Optional white-glove delivery service includes setup and configuration at your location.
- **Category:** Shipping
- **Order:** 5
- **Featured:** false
- **Keywords:** delivery, packaging, insurance, white-glove

### FAQ 6: Compatibility

- **Question:** Do you provide compatibility checking?
- **Answer:** Yes, our PC Builder includes intelligent compatibility checking to prevent incompatible combinations. Our system checks CPU socket compatibility, RAM support, GPU clearance, power requirements, and cooling requirements. We also manually verify every build before assembly.
- **Category:** Building Process
- **Order:** 6
- **Featured:** false
- **Keywords:** compatibility, validation, safety

### FAQ 7: Repair Service

- **Question:** Do you repair PCs not built by you?
- **Answer:** Yes, our UK-wide repair service covers all PC brands and builds. We provide free diagnostics, competitive repair quotes, and collect-and-return service. Common repairs include component replacement, system optimization, virus removal, and upgrade installations.
- **Category:** Support
- **Order:** 7
- **Featured:** false
- **Keywords:** repair service, all brands, diagnostics, collection

### FAQ 8: Technical Support

- **Question:** What technical support do you provide?
- **Answer:** We provide lifetime technical support for all customers. This includes setup assistance, software installation help, troubleshooting guidance, and upgrade advice. Premium support packages offer priority response and remote assistance.
- **Category:** Support
- **Order:** 8
- **Featured:** false
- **Keywords:** tech support, lifetime, help, assistance

---

## Step 5: Publish Your FAQs

After creating each FAQ entry:

1. Click **Publish** in the top right
2. The FAQ will immediately appear on your website
3. Categories will automatically populate in the filter buttons

---

## Managing FAQs

### Adding New FAQs

1. Go to **Content** → **Add entry** → **FAQ Item**
2. Fill in all required fields
3. Set the **Order** number (higher than existing FAQs to add at the end)
4. Click **Publish**

### Editing Existing FAQs

1. Go to **Content** → Find the FAQ entry
2. Click to edit
3. Make your changes
4. Click **Publish** again (this updates the live version)
5. Changes appear on the website within seconds

### Reordering FAQs

1. Edit each FAQ entry
2. Change the **Order** field to desired position
3. FAQs are sorted automatically by Order (ascending)
4. Example: Order 1 appears first, Order 2 second, etc.

### Deleting FAQs

1. Go to **Content** → Find the FAQ entry
2. Click **...** menu → **Unpublish**
3. Once unpublished, click **...** menu → **Delete**
4. Confirm deletion

---

## Premium Features on FAQ Page

Your FAQ page includes these premium design features:

✨ **Giant Premium Headings**

- Hero text scales from `text-5xl` to `text-8xl`
- Gradient text effects
- Animated badges with pulse effects

🔍 **Enhanced Search**

- Large search bar with glow effect on focus
- Real-time filtering as you type
- Searches questions, answers, and keywords

🏷️ **Category Filtering**

- Custom-designed category pills with shimmer effects
- Badge counts showing FAQs per category
- Active state with blue gradient background

🎯 **Numbered FAQ Cards**

- Each FAQ has a numbered badge (1-8)
- Large question text (`text-xl md:text-2xl`)
- Large answer text (`text-lg md:text-xl`)
- Smooth accordion animations
- Glow effect on hover

💬 **Premium Contact Section**

- Gradient card with decorative blur elements
- Large CTA buttons
- Response time information
- Direct links to contact page

---

## Category Configuration

The FAQ page automatically creates filter buttons based on your FAQ categories. The current categories are:

| Category             | Icon | Description                     |
| -------------------- | ---- | ------------------------------- |
| **All**              | -    | Shows all FAQs                  |
| **Building Process** | ⚙️   | PC build timing and process     |
| **Customization**    | 🎨   | Component customization options |
| **Warranty**         | 🛡️   | Warranty coverage and support   |
| **Payment**          | 💳   | Payment methods and security    |
| **Shipping**         | 🚚   | Delivery and packaging          |
| **Support**          | 💬   | Technical support and help      |
| **General**          | ℹ️   | General questions               |

To add a new category:

1. Add it to the Category field's predefined values in Contentful
2. Create at least one FAQ with that category
3. The filter button will appear automatically

---

## Search Functionality

The search feature searches across three fields:

1. **Question text** - Primary search target
2. **Answer text** - Finds FAQs by answer content
3. **Keywords** - Hidden metadata for better discoverability

**Best Practices for Keywords:**

- Use 3-5 relevant terms per FAQ
- Include synonyms (e.g., "PC, computer, desktop")
- Add common misspellings
- Include abbreviations (e.g., "GPU, graphics card")

---

## Statistics Display

The FAQ page hero shows these live stats:

- **📚 Total FAQs** - Auto-counted from your entries
- **🗂️ Categories** - Number of unique categories
- **⚡ Avg Response** - Static "< 2 hours" (can be made dynamic)
- **💬 Support Rating** - Static "4.9/5" (can be linked to reviews)

---

## Testing Your Integration

### 1. Verify Contentful Connection

Open your browser console (F12) and look for:

```
🔍 Fetching FAQ items from Contentful...
✅ FAQ items fetched: [array of FAQs]
```

### 2. Test Search

- Type in the search bar
- Results should filter in real-time
- Try searching keywords like "warranty" or "delivery"

### 3. Test Category Filters

- Click each category button
- Only FAQs from that category should show
- Badge counts should update

### 4. Test Featured FAQs

- Set some FAQs as Featured in Contentful
- These could be highlighted differently (optional enhancement)

---

## Troubleshooting

### No FAQs Showing

**Check 1: Content Type ID**

- Must be exactly `faqItem` (case-sensitive)
- Go to Settings → Content type → Check API Identifier

**Check 2: Published Status**

- All FAQ entries must be **Published** (green badge)
- Drafts don't appear on the website

**Check 3: Environment Variables**

```bash
# Verify in PowerShell:
Get-Content .env | Select-String CONTENTFUL
```

Should show:

```
VITE_CONTENTFUL_SPACE_ID=your-space-id
VITE_CONTENTFUL_ACCESS_TOKEN=your-token
```

### FAQs in Wrong Order

- Check the **Order** field on each FAQ
- Lower numbers appear first (1, 2, 3, etc.)
- Update and republish to fix

### Categories Not Showing

- Ensure at least one FAQ exists for each category
- Category buttons only show if FAQs exist
- Check category spelling matches exactly

### Search Not Working

- Keywords field is optional but helps search
- Search is case-insensitive
- Searches question, answer, and keywords fields

---

## Optional Enhancements

Want to take your FAQ page further? Here are some ideas:

### 1. FAQ Analytics

Track which FAQs are most viewed (requires custom code)

### 2. Helpful Voting

Add "Was this helpful?" buttons (requires backend)

### 3. Related FAQs

Show related questions at the end of each answer

### 4. Video Answers

Add video field to FAQs for visual explanations

### 5. Multi-language Support

Use Contentful's localization for translated FAQs

### 6. AI Search

Implement semantic search for better results

---

## Content Best Practices

### Writing Great FAQ Questions

✅ **DO:**

- Start with question words (How, What, Can, Do, Why)
- Keep under 15 words
- Use customer language, not jargon
- Be specific ("How long does delivery take?" not "Delivery?")

❌ **DON'T:**

- Use internal terminology
- Make questions too vague
- Write questions longer than 2 lines
- Duplicate similar questions

### Writing Great FAQ Answers

✅ **DO:**

- Answer directly in the first sentence
- Provide specific details (numbers, timeframes)
- Include relevant links or next steps
- Keep paragraphs short (2-3 sentences)
- Use bullet points for lists

❌ **DON'T:**

- Bury the answer in long paragraphs
- Use overly technical language
- Leave customers with more questions
- Exceed 150 words per answer

### Organizing Categories

✅ **DO:**

- Use 5-8 clear categories maximum
- Group related questions together
- Order by customer journey (pre-purchase → post-purchase)
- Use consistent category names

---

## Page Content Integration (Optional)

You can also customize the FAQ page hero text via Contentful:

### Create FAQ Page Content Entry

1. Go to **Content** → **Add entry** → **Page Content**
2. Set these fields:
   - **Page Slug:** `faq`
   - **Page Title:** `FAQ - Vortex PCs`
   - **Hero Title:** `Questions?\nWe've Got Answers`
   - **Hero Description:** `Your custom text here`
   - **Meta Description:** For SEO

This will override the hardcoded hero content.

---

## Support

If you encounter issues:

1. Check browser console for error messages (F12)
2. Verify all field IDs match exactly (case-sensitive)
3. Ensure content is Published, not just Saved
4. Check Contentful API keys in `.env` file
5. Review the main `CONTENTFUL_SETUP.md` guide

---

## Summary Checklist

- [ ] Created `faqItem` content type in Contentful
- [ ] Added all 6 required fields (question, answer, category, order, featured, keywords)
- [ ] Set up category predefined values
- [ ] Added at least 8 FAQ entries
- [ ] Published all FAQ entries
- [ ] Tested on localhost - FAQs appearing
- [ ] Tested search functionality
- [ ] Tested category filtering
- [ ] Verified responsive design on mobile

**🎉 Your FAQ page is now fully CMS-powered and ready to manage!**
