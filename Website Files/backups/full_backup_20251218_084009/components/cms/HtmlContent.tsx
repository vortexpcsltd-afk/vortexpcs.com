import DOMPurify from "dompurify";

type HtmlContentProps = {
  html: string;
  className?: string;
};

export function HtmlContent({ html, className = "" }: HtmlContentProps) {
  // Sanitize HTML to prevent XSS attacks while preserving safe formatting
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "code",
      "pre",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "title", "target", "rel"],
    ALLOW_DATA_ATTR: false,
    // Add hooks to enforce security attributes
    HOOK_AFTER_SANITIZE_ELEMENTS: function (node: Element) {
      // Ensure external links have proper security attributes
      if (
        node.tagName === "A" &&
        node.getAttribute("href")?.startsWith("http")
      ) {
        node.setAttribute("rel", "noopener noreferrer");
        node.setAttribute("target", "_blank");
      }
    },
  });

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
      // HTML is sanitized by DOMPurify to prevent XSS attacks
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export default HtmlContent;
