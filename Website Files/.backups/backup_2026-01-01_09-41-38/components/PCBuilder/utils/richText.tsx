/**
 * Rich Text Rendering Utilities for PCBuilder
 * Handles Contentful rich text and markdown-style text rendering
 */

import { Document } from "@contentful/rich-text-types";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import DOMPurify from "dompurify";
import React from "react";
import { logger } from "../../../services/logger";

/**
 * Render rich text content (Contentful Rich Text or plain markdown-style string)
 * Handles both Contentful Document objects and plain text with markdown links
 */
export const renderRichText = (
  content?: string | Document
): React.ReactNode => {
  if (!content) return null;

  try {
    // Handle Contentful Rich Text Document object
    if (
      typeof content === "object" &&
      "nodeType" in content &&
      content.nodeType === "document"
    ) {
      try {
        // Validate document doesn't contain dangerous patterns
        const contentStr = JSON.stringify(content);
        if (contentStr.includes("javascript:") || contentStr.includes("on")) {
          logger.warn("Potentially dangerous content detected in rich text", {
            context: "PCBuilder rich text rendering",
          });
          return <p>Content validation failed. Please contact support.</p>;
        }

        const richTextRenderOptions = {
          renderNode: {},
          renderMark: {},
        };
        return documentToReactComponents(
          content as Document,
          richTextRenderOptions
        );
      } catch (error) {
        logger.error("Error rendering rich text content", {
          error: error instanceof Error ? error.message : String(error),
          context: "PCBuilder rich text",
        });
        return <p>Error loading content. Please try refreshing the page.</p>;
      }
    }

    // Handle plain text with markdown-style links
    if (typeof content === "string") {
      // Convert markdown-style links to HTML
      const withLinks = content.replace(
        /\[([^\]]+)\]\((https?:[^)]+)\)/g,
        (_m, text, url) => {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline">${text}</a>`;
        }
      );

      // Sanitize with DOMPurify (allows only safe tags and links)
      const sanitized = DOMPurify.sanitize(withLinks, {
        ALLOWED_TAGS: ["a", "br", "p", "strong", "em", "span"],
        ALLOWED_ATTR: ["href", "target", "rel", "class"],
        ALLOW_DATA_ATTR: false,
      });

      return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
    }

    return null;
  } catch (error) {
    logger.error("Error in renderRichText", {
      error: error instanceof Error ? error.message : String(error),
    });
    return <p>Error rendering content</p>;
  }
};

/**
 * Sanitize HTML content using DOMPurify with strict configuration
 */
export const sanitizeHtml = (html: string): string => {
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "img"],
      ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
      KEEP_CONTENT: true,
      FORCE_BODY: false,
    });
  } catch (error) {
    logger.error("Error sanitizing HTML", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "";
  }
};

/**
 * Strip HTML tags and return plain text
 */
export const stripHtmlTags = (html: string): string => {
  try {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  } catch (error) {
    logger.error("Error stripping HTML tags", {
      error: error instanceof Error ? error.message : String(error),
    });
    return html;
  }
};
