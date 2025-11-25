import React from "react";

type HtmlContentProps = {
  html: string;
  className?: string;
};

// Very lightweight sanitizer to keep styling safe while preventing obvious script injection.
// For fully untrusted content consider a dedicated sanitizer like DOMPurify.
function sanitize(html: string): string {
  if (!html) return "";
  // Remove script/style tags entirely
  let cleaned = html
    .replace(/<\/(?:script|style)>/gi, "")
    .replace(/<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)>/gi, "");
  // Remove on* event handlers
  cleaned = cleaned
    .replace(/ on[a-zA-Z]+\s*=\s*"[^"]*"/g, "")
    .replace(/ on[a-zA-Z]+\s*=\s*'[^']*'/g, "")
    .replace(/ on[a-zA-Z]+\s*=\s*[^\s>]+/g, "");
  // Neutralize javascript: urls in href/src attributes
  cleaned = cleaned.replace(
    /(href|src)\s*=\s*(['"])\s*javascript:[^"']*\2/gi,
    '$1="#"'
  );
  return cleaned;
}

export function HtmlContent({ html, className = "" }: HtmlContentProps) {
  const safe = React.useMemo(() => sanitize(html), [html]);
  return (
    <div
      className={[
        // Typography tuned for legal pages while respecting site theme
        "prose prose-invert max-w-none",
        // Headings
        "[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-white",
        "[&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-white",
        "[&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-white",
        // Text + links
        "[&>p]:text-gray-300 [&_a]:text-sky-400 hover:[&_a]:text-sky-300",
        // Lists
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
        // Quotes
        "[&_blockquote]:border-l-4 [&_blockquote]:border-sky-600 [&_blockquote]:pl-4 [&_blockquote]:text-gray-300",
        // Tables
        "[&_table]:w-full [&_th]:text-left [&_th]:text-gray-200 [&_td]:text-gray-300",
        className,
      ].join(" ")}
      // We intentionally use sanitized HTML to preserve rich structure from CMS
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export default HtmlContent;
