import { BreadcrumbItem } from "../components/Breadcrumbs";

// Helper function to generate breadcrumbs based on current view
export function getBreadcrumbs(currentView: string): BreadcrumbItem[] {
  const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
    "pc-finder": [{ label: "PC Finder", current: true }],
    "pc-builder": [{ label: "PC Builder", current: true }],
    "visual-configurator": [{ label: "Visual Configurator", current: true }],
    repair: [
      { label: "Services", href: "about" },
      { label: "Repair Service", current: true },
    ],
    about: [{ label: "About Us", current: true }],
    faq: [{ label: "FAQ", current: true }],
    contact: [{ label: "Contact Us", current: true }],
    member: [{ label: "Member Area", current: true }],
    admin: [{ label: "Admin Panel", current: true }],
    "order-success": [
      { label: "Checkout", href: "checkout" },
      { label: "Order Success", current: true },
    ],
    checkout: [{ label: "Checkout", current: true }],
    terms: [
      { label: "Legal", href: "terms" },
      { label: "Terms & Conditions", current: true },
    ],
    warranty: [
      { label: "Support", href: "support" },
      { label: "Warranty Information", current: true },
    ],
    process: [
      { label: "About", href: "about" },
      { label: "Our Process", current: true },
    ],
    support: [{ label: "Technical Support", current: true }],
    quality: [
      { label: "About", href: "about" },
      { label: "Quality Standards", current: true },
    ],
    returns: [
      { label: "Support", href: "support" },
      { label: "Returns & Refunds", current: true },
    ],
    privacy: [
      { label: "Legal", href: "terms" },
      { label: "Privacy Policy", current: true },
    ],
    cookies: [
      { label: "Legal", href: "terms" },
      { label: "Cookie Policy", current: true },
    ],
    "cms-diagnostics": [
      { label: "Admin", href: "admin" },
      { label: "CMS Diagnostics", current: true },
    ],
    "business-solutions": [{ label: "Business Solutions", current: true }],
    "business-dashboard": [{ label: "Business Dashboard", current: true }],
  };

  // Blog list
  if (currentView === "blog") {
    return [{ label: "Blog", current: true }];
  }

  // Blog post detail: blog/:slug
  if (currentView.startsWith("blog/")) {
    const slug = currentView.slice(5);
    const label = slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    return [
      { label: "Blog", href: "blog" },
      { label, current: true },
    ];
  }

  // Author page: author/:slug
  if (currentView.startsWith("author/")) {
    const slug = currentView.slice(7);
    const name = slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    return [
      { label: "Blog", href: "blog" },
      { label: `Author: ${name}`, current: true },
    ];
  }

  return breadcrumbMap[currentView] || [];
}
