import { useEffect, useMemo, useState } from "react";
import type { ReactNode, ReactElement } from "react";
import {
  fetchBlogPostBySlug,
  fetchBlogPosts,
  type BlogPostDetail,
  type BlogPostSummary,
} from "../services/cms";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { logger } from "../services/logger";
import { BlogPostingSchema } from "./seo/BlogPostingSchema";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import {
  BLOCKS,
  INLINES,
  MARKS,
  type Block,
  type Inline,
  type Document as RichDocument,
  type Text as RichTextNode,
} from "@contentful/rich-text-types";
import { ShareBar } from "./ShareBar";
import { CTAInline } from "./CTAInline";
import { useRef } from "react";

// Utilities to generate stable heading IDs and a TOC
const getNodeText = (
  node:
    | RichDocument
    | Block
    | Inline
    | RichTextNode
    | Array<Block | Inline | RichTextNode>
    | unknown
): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (typeof node === "object" && node !== null) {
    const n = node as RichDocument | Block | Inline | RichTextNode;
    if ((n as RichTextNode).nodeType === "text") {
      return (n as RichTextNode).value || "";
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyNode = n as any;
    if (Array.isArray(anyNode.content)) {
      return (anyNode.content as Array<Block | Inline | RichTextNode>)
        .map(getNodeText)
        .join("");
    }
  }
  return "";
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

type TocHeading = { id: string; text: string; level: 1 | 2 | 3 | 4 };

const extractHeadings = (doc: RichDocument): TocHeading[] => {
  const result: TocHeading[] = [];
  const counts = new Map<string, number>();

  const visit = (nodes: Array<Block | Inline | RichTextNode>) => {
    for (const n of nodes) {
      if (!n) continue;
      if (
        n.nodeType === BLOCKS.HEADING_1 ||
        n.nodeType === BLOCKS.HEADING_2 ||
        n.nodeType === BLOCKS.HEADING_3 ||
        n.nodeType === BLOCKS.HEADING_4
      ) {
        const text = getNodeText(n);
        let base = slugify(text);
        let id = base;
        const prev = counts.get(base) || 0;
        if (prev > 0) id = `${base}-${prev + 1}`;
        counts.set(base, prev + 1);
        const level =
          n.nodeType === BLOCKS.HEADING_1
            ? 1
            : n.nodeType === BLOCKS.HEADING_2
            ? 2
            : n.nodeType === BLOCKS.HEADING_3
            ? 3
            : 4;
        result.push({ id, text, level });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyNode = n as any;
      if (Array.isArray(anyNode.content)) visit(anyNode.content);
    }
  };

  visit(doc.content as Array<Block | Inline | RichTextNode>);
  return result;
};

export function BlogPost({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [related, setRelated] = useState<BlogPostSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchBlogPostBySlug(slug);
        if (!mounted) return;
        if (!res) {
          setError("Post not found");
        } else {
          setPost(res);
          // Load related posts by first tag
          if (res.tags && res.tags.length > 0) {
            try {
              const rel = await fetchBlogPosts({
                page: 1,
                pageSize: 3,
                tag: res.tags[0],
              });
              const items = rel.items
                .filter((p) => p.slug !== res.slug)
                .slice(0, 3);
              setRelated(items);
            } catch {
              // best effort
            }
          } else {
            setRelated([]);
          }
        }
      } catch (e) {
        logger.error("Failed to load blog post", e);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  // Derive category via tags (supports optional "category:" prefix)
  const CATEGORY_PREFIX = "category:";
  const stripCategoryPrefix = (tag: string): string =>
    tag.toLowerCase().startsWith(CATEGORY_PREFIX)
      ? tag.slice(CATEGORY_PREFIX.length).trim()
      : tag;
  const deriveCategory = (tags?: string[] | null): string | null => {
    if (!tags || tags.length === 0) return null;
    const preferred = tags.find((t) =>
      t.toLowerCase().startsWith(CATEGORY_PREFIX)
    );
    return preferred
      ? stripCategoryPrefix(preferred)
      : stripCategoryPrefix(tags[0]);
  };

  const articleRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) {
        setProgress(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || 0;
      const total = rect.height + viewport;
      const scrolled = Math.min(Math.max(viewport - rect.top, 0), total);
      const pct = Math.max(
        0,
        Math.min(100, Math.round((scrolled / total) * 100))
      );
      setProgress(pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Build a Table of Contents (exclude H1)
  const toc = useMemo(() => {
    if (!post?.contentRich) return [] as TocHeading[];
    try {
      const doc = post.contentRich as unknown as RichDocument;
      return extractHeadings(doc).filter((h) => h.level !== 1);
    } catch {
      return [] as TocHeading[];
    }
  }, [post]);

  // Prepare rich text renderers with stable heading ids
  const richTextOptions = useMemo(() => {
    const counts = new Map<string, number>();
    const makeId = (node: Block | Inline) => {
      const text = getNodeText(node as unknown);
      const base = slugify(text);
      const prev = counts.get(base) || 0;
      const id = prev > 0 ? `${base}-${prev + 1}` : base;
      counts.set(base, prev + 1);
      return id;
    };
    return {
      renderText: (text: string): ReactNode => {
        const parts = text.split("\n");
        return parts.flatMap((part, i) =>
          i === 0 ? [part] : [<br key={i} />, part]
        );
      },
      renderMark: {
        [MARKS.BOLD]: (text: ReactNode) => (
          <strong className="font-semibold text-white">{text}</strong>
        ),
        [MARKS.ITALIC]: (text: ReactNode) => <em className="italic">{text}</em>,
        [MARKS.UNDERLINE]: (text: ReactNode) => (
          <span className="underline decoration-sky-500/50 underline-offset-4">
            {text}
          </span>
        ),
        [MARKS.CODE]: (text: ReactNode) => (
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-sky-300">
            {text}
          </code>
        ),
      },
      renderNode: {
        [BLOCKS.PARAGRAPH]: (_node: Block | Inline, children: ReactNode) => (
          <p className="mb-4 leading-relaxed text-gray-300">{children}</p>
        ),
        [BLOCKS.HEADING_1]: (node: Block | Inline, children: ReactNode) => (
          <h1
            id={makeId(node)}
            className="text-3xl font-bold mt-8 mb-4 text-white"
          >
            {children}
          </h1>
        ),
        [BLOCKS.HEADING_2]: (node: Block | Inline, children: ReactNode) => (
          <h2
            id={makeId(node)}
            className="text-2xl font-bold mt-6 mb-3 text-white"
          >
            {children}
          </h2>
        ),
        [BLOCKS.HEADING_3]: (node: Block | Inline, children: ReactNode) => (
          <h3
            id={makeId(node)}
            className="text-xl font-semibold mt-4 mb-2 text-white"
          >
            {children}
          </h3>
        ),
        [BLOCKS.HEADING_4]: (node: Block | Inline, children: ReactNode) => (
          <h4
            id={makeId(node)}
            className="text-lg font-semibold mt-3 mb-2 text-white"
          >
            {children}
          </h4>
        ),
        [BLOCKS.UL_LIST]: (_node: Block | Inline, children: ReactNode) => (
          <ul className="list-disc mb-4 space-y-2 text-gray-300 pl-6">
            {children}
          </ul>
        ),
        [BLOCKS.OL_LIST]: (_node: Block | Inline, children: ReactNode) => (
          <ol className="list-decimal mb-4 space-y-2 text-gray-300 pl-6">
            {children}
          </ol>
        ),
        [BLOCKS.LIST_ITEM]: (_node: Block | Inline, children: ReactNode) => {
          const isParagraphElement = (
            node: ReactNode
          ): node is ReactElement<{ children?: ReactNode }> => {
            return (
              !!node &&
              typeof node === "object" &&
              (node as ReactElement).type === "p"
            );
          };
          const flatten = (nodes: ReactNode): ReactNode => {
            if (!Array.isArray(nodes)) return nodes;
            return nodes.map((child, idx: number) => {
              if (isParagraphElement(child)) {
                return <span key={idx}>{child.props.children}</span>;
              }
              return <span key={idx}>{child}</span>;
            });
          };
          return <li className="">{flatten(children)}</li>;
        },
        [BLOCKS.QUOTE]: (_node: Block | Inline, children: ReactNode) => (
          <blockquote className="border-l-4 border-sky-500 pl-4 italic my-4 text-gray-400">
            {children}
          </blockquote>
        ),
        [BLOCKS.HR]: () => <hr className="my-8 border-white/10" />,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [INLINES.HYPERLINK]: (node: any, children: ReactNode) => (
          <a
            href={node.data.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 underline"
          >
            {children}
          </a>
        ),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <section className="py-10 md:py-16">
        {/* Reading progress bar */}
        {!loading && post && (
          <div className="h-1 w-full bg-white/10 rounded mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-600 to-blue-600 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {loading && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <Skeleton className="w-full h-56 rounded-lg mb-6" />
            <Skeleton className="w-2/3 h-8 mb-3" />
            <Skeleton className="w-1/3 h-4 mb-6" />
            <Skeleton className="w-full h-24" />
          </Card>
        )}

        {!loading && error && (
          <div className="text-center">
            <p className="text-red-400 mb-6">{error}</p>
            <Button
              onClick={() => navigate("/blog")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              Back to Blog
            </Button>
          </div>
        )}

        {!loading && post && (
          <article ref={articleRef}>
            <BlogPostingSchema
              post={{
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                heroImage: post.heroImage,
                authorName: post.authorName,
                publishedDate: post.publishedDate,
                updatedAt: post.updatedAt,
              }}
            />

            {post.heroImage && (
              <div className="relative h-60 md:h-80 w-full overflow-hidden rounded-xl mb-8 border border-white/10">
                <img
                  src={post.heroImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {deriveCategory(post.tags) && (
                  <span className="absolute top-3 left-3 text-[11px] px-2 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 backdrop-blur-md">
                    {deriveCategory(post.tags)}
                  </span>
                )}
              </div>
            )}

            <header className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {post.title}
              </h1>
              <div className="text-gray-400 text-sm flex flex-wrap gap-4">
                {post.authorName && <span>By {post.authorName}</span>}
                {post.publishedDate && (
                  <span>
                    {new Date(post.publishedDate).toLocaleDateString()}
                  </span>
                )}
                {post.readingTimeMinutes && (
                  <span>{post.readingTimeMinutes} min read</span>
                )}
              </div>
              <div className="mt-4">
                <ShareBar title={post.title} />
              </div>
              {toc.length >= 2 && (
                <Card className="mt-4 bg-white/5 backdrop-blur-xl border-white/10 p-4">
                  <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                    On this page
                  </div>
                  <nav>
                    <ul className="text-sm space-y-1">
                      {toc.map((h) => (
                        <li
                          key={h.id}
                          className={
                            h.level === 2
                              ? "pl-0"
                              : h.level === 3
                              ? "pl-3"
                              : "pl-6"
                          }
                        >
                          <a
                            href={`#${h.id}`}
                            className="text-sky-300 hover:text-sky-200 underline decoration-sky-500/40"
                          >
                            {h.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </Card>
              )}
            </header>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 md:p-8">
              {post.contentRich ? (
                <div className="prose-blog">
                  {documentToReactComponents(
                    post.contentRich as unknown as import("@contentful/rich-text-types").Document,
                    richTextOptions
                  )}
                </div>
              ) : (
                <div
                  className="prose-blog"
                  dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
                />
              )}
            </Card>
            <CTAInline className="mt-8" />
            {/* Related posts */}
            {related.length > 0 && (
              <section className="mt-10">
                <h2 className="text-2xl font-semibold mb-4">Related posts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {related.map((rp) => (
                    <Card
                      key={rp.id}
                      className="group bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 overflow-hidden"
                    >
                      {rp.heroImage && (
                        <div className="relative h-36 overflow-hidden">
                          <img
                            src={rp.heroImage}
                            alt={rp.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-base font-semibold mb-2 group-hover:text-sky-400 transition-colors">
                          {rp.title}
                        </h3>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/blog/${rp.slug}`)}
                          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                        >
                          Read
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-8">
              <Button
                variant="outline"
                onClick={() => navigate("/blog")}
                className="border-white/20 hover:bg-white/10"
              >
                ← Back to Blog
              </Button>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

export default BlogPost;
