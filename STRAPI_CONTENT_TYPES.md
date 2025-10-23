# Strapi Content Types for Full CMS Integration

This document outlines all the content types needed in Strapi to make every part of the Vortex PCs website editable through the CMS.

## 🎯 Overview

To enable full website editing through Strapi CMS, we need the following content types:

1. **Site Settings** - Global site configuration
2. **Page Content** - Individual page content
3. **FAQ Items** - Frequently Asked Questions
4. **Service Items** - Repair services offered
5. **Feature Items** - Company features/benefits
6. **Team Members** - About us team section
7. **Testimonials** - Customer reviews
8. **Products** - Individual PC components
9. **PC Builds** - Pre-configured builds
10. **Components** - PC building components
11. **Blog Posts** - News and articles
12. **Contact Info** - Contact details

---

## 📝 Content Type Specifications

### 1. Site Settings (Single Type)

**Purpose**: Global website settings and configuration

**Fields**:

- `siteName` (Text) - Website name
- `logoUrl` (Text) - Logo image URL
- `tagline` (Text) - Site tagline/slogan
- `metaDescription` (Text) - Default meta description
- `socialLinks` (JSON) - Social media links
- `businessHours` (Rich Text) - Operating hours
- `enableMaintenance` (Boolean) - Maintenance mode toggle
- `maintenanceMessage` (Rich Text) - Maintenance page message
- `announcementBar` (Rich Text) - Top announcement bar
- `enableAnnouncementBar` (Boolean) - Show/hide announcement

### 2. Page Content (Collection Type)

**Purpose**: Content for individual pages

**Fields**:

- `pageSlug` (Text, Unique) - Page identifier (home, about, contact, etc.)
- `pageTitle` (Text) - Page title
- `metaDescription` (Text) - Page meta description
- `heroTitle` (Text) - Main hero title
- `heroSubtitle` (Text) - Hero subtitle
- `heroDescription` (Rich Text) - Hero description
- `heroBackgroundImage` (Media) - Hero background image
- `heroButtons` (JSON) - Hero call-to-action buttons
- `sections` (JSON) - Page content sections
- `seo` (JSON) - SEO metadata

### 3. FAQ Items (Collection Type)

**Purpose**: Frequently Asked Questions

**Fields**:

- `question` (Text) - The question
- `answer` (Rich Text) - The answer
- `category` (Text) - FAQ category
- `order` (Number) - Display order
- `featured` (Boolean) - Show in featured section
- `keywords` (Text) - Search keywords
- `lastUpdated` (DateTime) - Last update timestamp

### 4. Service Items (Collection Type)

**Purpose**: Repair and services offered

**Fields**:

- `serviceName` (Text) - Service name
- `description` (Rich Text) - Service description
- `price` (Number) - Service price
- `duration` (Text) - Estimated duration
- `category` (Text) - Service category
- `features` (JSON) - Service features list
- `icon` (Text) - Lucide icon name
- `popular` (Boolean) - Mark as popular service
- `available` (Boolean) - Service availability

### 5. Feature Items (Collection Type)

**Purpose**: Company features and benefits

**Fields**:

- `title` (Text) - Feature title
- `description` (Rich Text) - Feature description
- `icon` (Text) - Lucide icon name
- `category` (Text) - Feature category
- `order` (Number) - Display order
- `highlighted` (Boolean) - Highlight feature
- `link` (Text) - Optional link URL

### 6. Team Members (Collection Type)

**Purpose**: Team/staff information

**Fields**:

- `name` (Text) - Person's name
- `position` (Text) - Job title
- `bio` (Rich Text) - Biography
- `image` (Media) - Profile photo
- `email` (Email) - Contact email
- `specialties` (JSON) - Areas of expertise
- `order` (Number) - Display order
- `featured` (Boolean) - Show on homepage

### 7. Company Stats (Single Type)

**Purpose**: Homepage statistics section

**Fields**:

- `yearsExperience` (Number) - Years in business
- `customersServed` (Number) - Total customers
- `pcBuildsCompleted` (Number) - Total builds
- `warrantyYears` (Number) - Warranty period
- `supportResponse` (Text) - Support response time
- `satisfactionRate` (Number) - Customer satisfaction %

### 8. Navigation Menu (Single Type)

**Purpose**: Website navigation structure

**Fields**:

- `primaryMenu` (JSON) - Main navigation items
- `footerMenu` (JSON) - Footer navigation
- `mobileMenu` (JSON) - Mobile-specific menu
- `ctaButton` (JSON) - Header CTA button

### 9. Contact Information (Single Type)

**Purpose**: Contact details and locations

**Fields**:

- `companyName` (Text) - Full company name
- `email` (Email) - Primary email
- `phone` (Text) - Primary phone
- `whatsapp` (Text) - WhatsApp number
- `address` (Rich Text) - Physical address
- `mapEmbedUrl` (Text) - Google Maps embed URL
- `businessHours` (JSON) - Operating hours
- `emergencyContact` (Text) - Emergency contact info

### 10. Legal Pages (Collection Type)

**Purpose**: Terms, Privacy, Cookie Policy content

**Fields**:

- `pageType` (Text) - terms, privacy, cookies
- `title` (Text) - Page title
- `content` (Rich Text) - Legal content
- `lastUpdated` (DateTime) - Last update
- `effectiveDate` (Date) - When terms take effect
- `version` (Text) - Policy version

### 11. Pricing Tiers (Collection Type)

**Purpose**: Service pricing structure

**Fields**:

- `tierName` (Text) - Pricing tier name
- `price` (Number) - Price amount
- `currency` (Text) - Currency code
- `interval` (Text) - billing interval
- `features` (JSON) - Included features
- `popular` (Boolean) - Mark as popular
- `order` (Number) - Display order
- `ctaText` (Text) - Call-to-action text

---

## 🔧 JSON Schemas for Import

### Site Settings Schema

```json
{
  "kind": "singleType",
  "collectionName": "site_setting",
  "info": {
    "singularName": "site-setting",
    "pluralName": "site-settings",
    "displayName": "Site Settings"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "siteName": {
      "type": "string",
      "required": true,
      "default": "Vortex PCs"
    },
    "logoUrl": {
      "type": "string"
    },
    "tagline": {
      "type": "string",
      "default": "Premium Custom PC Builds"
    },
    "metaDescription": {
      "type": "text"
    },
    "socialLinks": {
      "type": "json"
    },
    "businessHours": {
      "type": "richtext"
    },
    "enableMaintenance": {
      "type": "boolean",
      "default": false
    },
    "maintenanceMessage": {
      "type": "richtext"
    },
    "announcementBar": {
      "type": "richtext"
    },
    "enableAnnouncementBar": {
      "type": "boolean",
      "default": false
    }
  }
}
```

### Page Content Schema

```json
{
  "kind": "collectionType",
  "collectionName": "page_contents",
  "info": {
    "singularName": "page-content",
    "pluralName": "page-contents",
    "displayName": "Page Content"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "pageSlug": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "pageTitle": {
      "type": "string",
      "required": true
    },
    "metaDescription": {
      "type": "text"
    },
    "heroTitle": {
      "type": "string"
    },
    "heroSubtitle": {
      "type": "string"
    },
    "heroDescription": {
      "type": "richtext"
    },
    "heroBackgroundImage": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["images"]
    },
    "heroButtons": {
      "type": "json"
    },
    "sections": {
      "type": "json"
    },
    "seo": {
      "type": "json"
    }
  }
}
```

### FAQ Items Schema

```json
{
  "kind": "collectionType",
  "collectionName": "faq_items",
  "info": {
    "singularName": "faq-item",
    "pluralName": "faq-items",
    "displayName": "FAQ Items"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "question": {
      "type": "string",
      "required": true
    },
    "answer": {
      "type": "richtext",
      "required": true
    },
    "category": {
      "type": "string",
      "required": true
    },
    "order": {
      "type": "integer",
      "default": 0
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "keywords": {
      "type": "text"
    },
    "lastUpdated": {
      "type": "datetime"
    }
  }
}
```

---

## 🚀 Implementation Steps

### Step 1: Set Up Strapi Instance

1. **Deploy Strapi** (Strapi Cloud recommended)
2. **Create admin account**
3. **Install required plugins** (if any)

### Step 2: Create Content Types

1. Import JSON schemas above or create manually in Strapi admin
2. Configure permissions for public access
3. Set up relationships between content types

### Step 3: Add Initial Content

1. **Site Settings**: Configure global settings
2. **Page Content**: Add content for each page
3. **FAQ Items**: Import existing FAQ content
4. **Service Items**: Add repair services
5. **Feature Items**: Add company features
6. **Contact Info**: Set up contact details

### Step 4: Frontend Integration

1. Update `services/cms.ts` with new fetch functions
2. Modify components to use Strapi data
3. Add loading states and error handling
4. Test all integrations

### Step 5: Content Management

1. Train team on Strapi admin interface
2. Set up content review workflow
3. Configure permissions and roles
4. Schedule regular content audits

---

## 📋 Content Management Workflow

### For Site Admins:

1. **Login to Strapi Admin**: Access your Strapi dashboard
2. **Navigate to Content Manager**: Select the content type to edit
3. **Edit Content**: Make changes using the rich editor
4. **Preview Changes**: Use draft mode to preview
5. **Publish**: Publish changes to make them live

### For Developers:

1. **Add New Content Types**: Define schema and relationships
2. **Update Frontend**: Add fetch functions and integrate components
3. **Deploy Changes**: Push code changes to production
4. **Test Integration**: Verify CMS changes appear correctly

---

## 🔒 Permissions Setup

### Public Role Permissions:

- **Read access** to published content
- **No write access** to any content types

### Editor Role Permissions:

- **Full access** to all content types
- **Publish/unpublish** permissions
- **Media library** access

### Admin Role Permissions:

- **Full access** to everything
- **User management**
- **System settings**

---

## 🎯 Benefits of Full CMS Integration

1. **Non-technical editing**: Team can edit without code changes
2. **Real-time updates**: Content changes go live immediately
3. **Version control**: Strapi tracks content changes
4. **Multi-user support**: Multiple editors with role-based access
5. **API-first**: Content available for future mobile apps
6. **SEO optimization**: Easy meta tag and content management
7. **Consistency**: Centralized content management ensures consistency

---

This structure enables complete website content management through Strapi, making the entire site editable without touching code!
