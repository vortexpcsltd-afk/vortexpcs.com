# FAQ Contentful Quick Start

⚡ **Fast Track:** Get your FAQ page live in 15 minutes

## Prerequisites

✅ Contentful account created  
✅ Space ID and Access Token in `.env` file  
✅ Dev server running (`npm run dev`)

## 5-Step Setup

### 1️⃣ Create Content Type (2 min)

1. Contentful → **Content model** → **Add content type**
2. Name: `FAQ Item`, API ID: `faqItem`
3. Add these fields:

| Field    | Type       | Required |
| -------- | ---------- | -------- |
| question | Short text | ✅       |
| answer   | Long text  | ✅       |
| category | Short text | ✅       |
| order    | Integer    | ❌       |
| featured | Boolean    | ❌       |
| keywords | Short text | ❌       |

4. **Save** content type

### 2️⃣ Configure Category Field (1 min)

1. Click on `category` field in content model
2. **Settings** → **Appearance** → **Dropdown**
3. **Validation** → **Accept only specified values**
4. Add these values:
   - Building Process
   - Customization
   - Warranty
   - Payment
   - Shipping
   - Support
   - General
5. **Confirm**

### 3️⃣ Add First FAQ (1 min)

1. **Content** → **Add entry** → **FAQ Item**
2. Fill in:
   - Question: `How long does it take to build my custom PC?`
   - Answer: `All custom PCs are built and tested within 5 working days from order confirmation and payment receipt.`
   - Category: `Building Process`
   - Order: `1`
   - Featured: ✅ (checked)
   - Keywords: `build time, delivery, express`
3. **Publish** (top right)

### 4️⃣ Test Integration (1 min)

1. Open http://localhost:3000 in browser
2. Navigate to FAQ page
3. Open browser console (F12)
4. Look for: `✅ FAQ items fetched: [...]`
5. Your FAQ should appear on the page!

### 5️⃣ Add Remaining FAQs (10 min)

Copy/paste these 7 more FAQs from the table below:

| Order | Question                                      | Answer                                                                                                                                                                                                                                         | Category         | Featured | Keywords                       |
| ----- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------- | ------------------------------ |
| 2     | Can I customize any component in my PC build? | Absolutely! Every component can be customized to your exact requirements. Use our PC Builder to select from premium components, or contact us for specialized parts not listed.                                                                | Customization    | ✅       | customization, components      |
| 3     | What warranty do you provide?                 | All custom builds include our comprehensive 3-year warranty covering parts, labor, and system functionality. Individual components retain their manufacturer warranties (typically 2-5 years).                                                 | Warranty         | ✅       | warranty, 3 year, coverage     |
| 4     | What payment methods do you accept?           | We accept all major credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through Stripe with full PCI compliance.                                   | Payment          | ❌       | payment, cards, paypal         |
| 5     | How is my PC delivered safely?                | All PCs are professionally packaged in custom foam inserts and anti-static materials. We use tracked, insured courier services with signature required delivery. Optional white-glove delivery service includes setup and configuration.       | Shipping         | ❌       | delivery, packaging, insurance |
| 6     | Do you provide compatibility checking?        | Yes, our PC Builder includes intelligent compatibility checking to prevent incompatible combinations. Our system checks CPU socket compatibility, RAM support, GPU clearance, power requirements, and cooling requirements.                    | Building Process | ❌       | compatibility, validation      |
| 7     | Do you repair PCs not built by you?           | Yes, our UK-wide repair service covers all PC brands and builds. We provide free diagnostics, competitive repair quotes, and collect-and-return service. Common repairs include component replacement, system optimization, and virus removal. | Support          | ❌       | repair service, all brands     |
| 8     | What technical support do you provide?        | We provide lifetime technical support for all customers. This includes setup assistance, software installation help, troubleshooting guidance, and upgrade advice. Premium support packages offer priority response and remote assistance.     | Support          | ❌       | tech support, lifetime, help   |

**Remember:** Click **Publish** after creating each entry!

---

## ✅ Done!

Your FAQ page now:

- ✨ Shows all 8 FAQs with premium design
- 🔍 Has working search functionality
- 🏷️ Has category filters with badge counts
- 📱 Is fully responsive on all devices
- 🎨 Features giant headings and premium styling

## What's Next?

### Add More FAQs

Just create new entries in Contentful and publish!

### Edit Existing FAQs

Edit the entry → Make changes → Publish again

### Reorder FAQs

Change the `order` field numbers and republish

### Delete FAQs

Unpublish → Delete

---

## Full Documentation

📖 **Complete Guide:** [CONTENTFUL_FAQ_SETUP.md](./CONTENTFUL_FAQ_SETUP.md)

- Best practices for writing FAQs
- Advanced search optimization
- Category management
- Troubleshooting
- Optional enhancements

📖 **Main Contentful Guide:** [CONTENTFUL_SETUP.md](./CONTENTFUL_SETUP.md)

- Other content types (testimonials, page content, etc.)
- API configuration
- Migration notes

---

## Common Issues

**FAQs not showing?**

- Check content type ID is exactly `faqItem` (case-sensitive)
- Ensure FAQs are Published (green badge), not Drafts
- Verify `.env` has correct Contentful credentials

**Search not working?**

- Add keywords to FAQ entries for better search results
- Clear browser cache and refresh

**Categories missing?**

- Ensure category field has predefined values set up
- Check category names match exactly (case-sensitive)

---

**🎉 Your FAQ page is live and ready to manage!**
