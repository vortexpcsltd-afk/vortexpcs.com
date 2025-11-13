# FAQ Contentful Integration - Visual Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENTFUL CMS DASHBOARD                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Content Type: faqItem                                     │ │
│  │                                                           │ │
│  │  Fields:                                                  │ │
│  │  • question (Short text) - Required                       │ │
│  │  • answer (Long text) - Required                          │ │
│  │  • category (Short text) - Required                       │ │
│  │  • order (Integer)                                        │ │
│  │  • featured (Boolean)                                     │ │
│  │  • keywords (Short text)                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ FAQ Entry #1    │  │ FAQ Entry #2    │  │ FAQ Entry #3    ││
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤│
│  │ Build Time      │  │ Customization   │  │ Warranty        ││
│  │ Order: 1        │  │ Order: 2        │  │ Order: 3        ││
│  │ Featured: ✅    │  │ Featured: ✅    │  │ Featured: ✅    ││
│  │ Status: 🟢 Pub  │  │ Status: 🟢 Pub  │  │ Status: 🟢 Pub  ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Content Delivery API
                            │ (VITE_CONTENTFUL_ACCESS_TOKEN)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VORTEX PCS APPLICATION                        │
│                                                                 │
│  config/contentful.ts                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ import { createClient } from 'contentful';                │ │
│  │                                                           │ │
│  │ export const contentfulClient = createClient({           │ │
│  │   space: VITE_CONTENTFUL_SPACE_ID,                       │ │
│  │   accessToken: VITE_CONTENTFUL_ACCESS_TOKEN              │ │
│  │ });                                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  services/cms.ts                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ export const fetchFAQItems = async () => {               │ │
│  │   const response = await contentfulClient.getEntries({   │ │
│  │     content_type: 'faqItem',                             │ │
│  │     order: ['fields.order']                              │ │
│  │   });                                                     │ │
│  │   return response.items.map(...)                         │ │
│  │ }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  components/FAQPage.tsx                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ useEffect(() => {                                         │ │
│  │   const loadContent = async () => {                       │ │
│  │     const faqData = await fetchFAQItems();               │ │
│  │     setFaqItems(faqData);                                │ │
│  │   };                                                      │ │
│  │   loadContent();                                          │ │
│  │ }, []);                                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PREMIUM FAQ PAGE UI                        │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                    HERO SECTION                           ║ │
│  ║   ┌─────────────────────────────────────────────────┐     ║ │
│  ║   │ 🔵 Knowledge Base                               │     ║ │
│  ║   └─────────────────────────────────────────────────┘     ║ │
│  ║                                                           ║ │
│  ║   Questions?                                              ║ │
│  ║   We've Got Answers                                       ║ │
│  ║   (text-5xl → text-8xl gradient)                          ║ │
│  ║                                                           ║ │
│  ║   ┌─────────────────────────────────────────────────┐     ║ │
│  ║   │ 🔍 Search FAQs...                               │     ║ │
│  ║   └─────────────────────────────────────────────────┘     ║ │
│  ║                                                           ║ │
│  ║   📚 {faqItems.length}  🗂️ {categories}  ⚡< 2 hours     ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                 CATEGORY FILTERS                          ║ │
│  ║   ┌────┐ ┌──────────┐ ┌──────────┐ ┌────────┐            ║ │
│  ║   │All │ │Building  │ │Warranty  │ │Payment │ ...        ║ │
│  ║   │ 8  │ │ Process  │ │    2     │ │   1    │            ║ │
│  ║   └────┘ └──────────┘ └──────────┘ └────────┘            ║ │
│  ║   (Custom shimmer pills with badge counts)                ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                     FAQ LIST                              ║ │
│  ║                                                           ║ │
│  ║   ┌─────────────────────────────────────────────────┐     ║ │
│  ║   │ 1️⃣  How long does it take to build my PC?      │ ▼   ║ │
│  ║   ├─────────────────────────────────────────────────┤     ║ │
│  ║   │ All custom PCs are built within 5 working days  │     ║ │
│  ║   │ from order confirmation...                      │     ║ │
│  ║   └─────────────────────────────────────────────────┘     ║ │
│  ║                                                           ║ │
│  ║   ┌─────────────────────────────────────────────────┐     ║ │
│  ║   │ 2️⃣  Can I customize any component?             │ ▶   ║ │
│  ║   └─────────────────────────────────────────────────┘     ║ │
│  ║                                                           ║ │
│  ║   (Numbered badges, large text, glow hover)               ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                PREMIUM CONTACT SECTION                    ║ │
│  ║   ┌─────────────────────────────────────────────────┐     ║ │
│  ║   │              Still Need Help?                   │     ║ │
│  ║   │                                                 │     ║ │
│  ║   │  [📞 Contact Support]  [💬 Live Chat]          │     ║ │
│  ║   │                                                 │     ║ │
│  ║   │  Average response time: < 2 hours               │     ║ │
│  ║   └─────────────────────────────────────────────────┘     ║ │
│  ║   (Gradient card with decorative elements)                ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│ 1. Editor   │ Creates/edits FAQ in Contentful dashboard
│   Action    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 2. Publish  │ FAQ entry published (green badge)
│   Button    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 3. API      │ Contentful Content Delivery API
│   Request   │ GET /entries?content_type=faqItem
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 4. Service  │ fetchFAQItems() processes response
│   Layer     │ Maps fields to FAQItem interface
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 5. React    │ useEffect triggers on component mount
│   Hook      │ Updates state with FAQ data
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 6. State    │ faqItems state updated
│   Update    │ Re-render triggered
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 7. UI       │ Premium FAQ cards rendered
│   Render    │ Search/filter applied
└─────────────┘
```

## Search & Filter Flow

```
User Types in Search Box
         │
         ▼
┌────────────────────┐
│ searchTerm state   │ Updated in real-time
│ updated            │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Filter logic runs  │ Checks question, answer, keywords
│ on faqItems        │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ filteredFaqs       │ Only matching FAQs
│ computed           │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ UI re-renders      │ Shows filtered results
│                    │ Or "No results" message
└────────────────────┘
```

## Category Filter Flow

```
User Clicks Category Button
         │
         ▼
┌────────────────────┐
│ selectedCategory   │ State updated to category name
│ state updated      │ (or "all")
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Filter logic runs  │ Checks category field
│ on faqItems        │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Active button      │ Visual feedback with gradient
│ styling applied    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Filtered FAQs      │ Shows only selected category
│ displayed          │ Badge count updates
└────────────────────┘
```

## Fallback System

```
fetchFAQItems() called
         │
         ▼
┌────────────────────┐
│ Check Contentful   │ Is contentfulClient defined?
│ enabled            │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│ API    │ │ Return     │
│ Call   │ │ Mock Data  │
└───┬────┘ └────────────┘
    │
    ▼
┌────────────────────┐
│ Try/Catch block    │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
SUCCESS   ERROR
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│ Return │ │ Catch &    │
│ CMS    │ │ Return     │
│ Data   │ │ Mock Data  │
└────────┘ └────────────┘
```

## File Structure

```
vortex-pcs/
├── .env                          # Contentful credentials
│
├── config/
│   └── contentful.ts             # Contentful client setup
│
├── services/
│   └── cms.ts                    # FAQ fetch logic
│
├── components/
│   ├── FAQPage.tsx               # Premium FAQ UI
│   └── ui/
│       ├── accordion.tsx         # FAQ accordion component
│       ├── button.tsx            # Premium button system
│       ├── card.tsx              # Glass cards
│       └── input.tsx             # Search input
│
└── docs/
    ├── CONTENTFUL_FAQ_QUICKSTART.md     # 15-min setup guide
    ├── CONTENTFUL_FAQ_SETUP.md          # Complete reference
    ├── FAQ_CONTENTFUL_COMPLETE.md       # Integration summary
    └── CONTENTFUL_SETUP.md              # Main CMS guide
```

## Environment Variables Flow

```
.env file
   │
   ├─ VITE_CONTENTFUL_SPACE_ID ──────┐
   │                                  │
   └─ VITE_CONTENTFUL_ACCESS_TOKEN ──┤
                                      │
                                      ▼
                              config/contentful.ts
                                      │
                              createClient({...})
                                      │
                                      ▼
                              contentfulClient
                                      │
                              ┌───────┴───────┐
                              │               │
                         services/cms.ts   Other services
                              │
                      fetchFAQItems()
                              │
                              ▼
                      FAQPage.tsx uses data
```

## Premium Design Features

```
┌─────────────────────────────────────────────────────────┐
│ HERO SECTION                                            │
│ • Animated gradient background (blue → cyan → sky)     │
│ • Giant responsive headings (text-5xl → text-8xl)      │
│ • Premium badge with pulse animation                   │
│ • Large search bar with glow effect on focus           │
│ • Live statistics with emojis                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CATEGORY FILTERS                                        │
│ • Custom-styled button pills                           │
│ • Shimmer effect on hover                              │
│ • Active state with gradient background                │
│ • Auto-counted badges (FAQs per category)              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FAQ CARDS                                               │
│ • Numbered gradient badges (1, 2, 3...)                │
│ • Large question text (text-xl → text-2xl)             │
│ • Large answer text (text-lg → text-xl)                │
│ • Smooth accordion animations                          │
│ • Glow effect on hover                                 │
│ • Premium glassmorphism cards                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CONTACT SECTION                                         │
│ • Gradient background card                             │
│ • Decorative blur elements                             │
│ • Extra-large CTA buttons                              │
│ • Response time information                            │
└─────────────────────────────────────────────────────────┘
```

---

**Quick Start:** Open `CONTENTFUL_FAQ_QUICKSTART.md` to get started in 15 minutes!
