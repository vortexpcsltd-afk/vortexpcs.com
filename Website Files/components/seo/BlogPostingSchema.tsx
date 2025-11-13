export interface BlogSchemaPostLike {
  title: string;
  slug: string;
  excerpt?: string;
  heroImage?: string;
  authorName?: string;
  publishedDate?: string; // ISO
  updatedAt?: string; // ISO
}

export function BlogPostingSchema({ post }: { post: BlogSchemaPostLike }) {
  if (!post?.title || !post?.slug) return null;

  const url = typeof window !== "undefined" ? window.location.href : undefined;
  const image = post.heroImage;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    name: post.title,
    description: post.excerpt || undefined,
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : undefined,
    image: image ? [image] : undefined,
    datePublished: post.publishedDate || undefined,
    dateModified: post.updatedAt || post.publishedDate || undefined,
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
  };

  const json = JSON.stringify(schema);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default BlogPostingSchema;
