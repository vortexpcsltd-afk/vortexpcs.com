import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBlogPosts, type BlogPostsResult } from "../services/cms";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { logger } from "../services/logger";

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function BlogAuthor({ authorSlug }: { authorSlug: string }) {
  const authorName = useMemo(() => slugToName(authorSlug), [authorSlug]);
  const [result, setResult] = useState<BlogPostsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchBlogPosts({
          page,
          pageSize,
          authorName,
        });
        if (!mounted) return;
        setResult(res);
      } catch (e) {
        logger.error("Failed to load author posts", e);
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, pageSize, authorName]);

  const items = result?.items || [];
  const total = result?.total || 0;
  const totalPages = Math.max(
    1,
    Math.ceil(total / (result?.pageSize || pageSize))
  );

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

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <section className="py-10 md:py-16">
        <header className="mb-8 md:mb-10 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs uppercase tracking-wider">
            Author
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">
            Posts by {authorName}
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl mx-auto">
            Articles written by {authorName}.
          </p>
        </header>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="bg-white/5 backdrop-blur-xl border-white/10 p-4"
              >
                <Skeleton className="w-full h-40 rounded-lg mb-4" />
                <Skeleton className="w-3/4 h-6 mb-2" />
                <Skeleton className="w-1/2 h-4" />
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-red-400">{error}</div>
        )}

        {!loading && items && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((post) => (
              <Card
                key={post.id}
                className="group bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 overflow-hidden"
              >
                {post.heroImage && (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={post.heroImage}
                      alt={post.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {deriveCategory(post.tags) && (
                      <span className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 backdrop-blur-md">
                        {deriveCategory(post.tags)}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-sky-400 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {post.publishedDate
                        ? new Date(post.publishedDate).toLocaleDateString()
                        : ""}
                    </span>
                    <span>
                      {post.readingTimeMinutes
                        ? `${post.readingTimeMinutes} min read`
                        : ""}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => navigate(`/blog/${post.slug}`)}
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                    >
                      Read more
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className="text-gray-300 hover:text-white"
                  />
                </PaginationItem>
                {Array.from({ length: totalPages })
                  .slice(0, 6)
                  .map((_, i) => {
                    const p = i + 1;
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(p);
                          }}
                          className="text-gray-300 hover:text-white"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className="text-gray-300 hover:text-white"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>
    </div>
  );
}

export default BlogAuthor;
