/**
 * Schema.org Structured Data Components
 *
 * Provides rich snippets for Google Search, Shopping, and other search engines.
 * Improves SEO, click-through rates, and enables enhanced search features.
 */

import { useMemo } from "react";

// ===== ORGANIZATION SCHEMA =====

export function OrganizationSchema() {
  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Vortex PCs Ltd",
      alternateName: "Vortex PCs",
      url: "https://vortexpcs.com",
      logo: "https://vortexpcs.com/vortexpcs-logo.png",
      description:
        "Premium custom PC builder specializing in gaming PCs, workstations, and enthusiast builds. Expert PC assembly, repairs, and upgrades in the UK.",
      foundingDate: "2024",
      address: {
        "@type": "PostalAddress",
        addressCountry: "GB",
        addressRegion: "England",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer Service",
        email: "support@vortexpcs.com",
        areaServed: "GB",
        availableLanguage: "English",
      },
      brand: {
        "@type": "Brand",
        name: "Vortex PCs",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: 500,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    []
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ===== WEBSITE SCHEMA =====

export function WebsiteSchema() {
  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Vortex PCs",
      url: "https://vortexpcs.com",
      description:
        "Custom PC builder, gaming PCs, workstations, and PC repairs in the UK",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://vortexpcs.com/pc-finder?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      publisher: {
        "@type": "Organization",
        name: "Vortex PCs Ltd",
      },
    }),
    []
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ===== SERVICE SCHEMA =====

export function ServiceSchema() {
  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Computer Repair and Custom PC Building",
      provider: {
        "@type": "Organization",
        name: "Vortex PCs Ltd",
      },
      areaServed: {
        "@type": "Country",
        name: "United Kingdom",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "PC Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Custom PC Build",
              description:
                "Professional custom PC building service with premium components",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "PC Repair",
              description: "Expert PC repair and diagnostics service",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "PC Upgrade",
              description: "Component upgrades and system optimization",
            },
          },
        ],
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: 500,
        bestRating: 5,
      },
    }),
    []
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
