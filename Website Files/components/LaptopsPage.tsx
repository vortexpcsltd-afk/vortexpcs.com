import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Laptop2, Rocket, Trophy, Sparkles } from "lucide-react";
import { PageHero } from "./PageHero";
import { ComponentCard } from "./PCBuilder/cards/ComponentCard";
import type { PCBuilderComponent } from "./PCBuilder/types";
import { fetchLaptops } from "../services/cms";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { Document } from "@contentful/rich-text-types";
import DOMPurify from "dompurify";
import type { CartItem } from "../types";
import { logger } from "../services/logger";

const richTextRenderOptions = {
  renderNode: {
    paragraph: (_node: unknown, children: ReactNode) => (
      <p className="mb-3 leading-relaxed text-gray-200 last:mb-0">{children}</p>
    ),
    hyperlink: (
      node: { data?: { uri?: string } } | undefined,
      children: ReactNode
    ) => (
      <a
        href={node?.data?.uri || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-400 hover:underline"
      >
        {children}
      </a>
    ),
  },
  renderText: (text: string) =>
    text.split("\n").reduce<ReactNode[]>((acc, segment, index) => {
      return [...acc, index > 0 && <br key={index} />, segment];
    }, []),
};

function renderRichText(content?: string | Document) {
  if (!content) return null;

  if (
    typeof content === "object" &&
    "nodeType" in content &&
    (content as Document).nodeType === "document"
  ) {
    return documentToReactComponents(
      content as Document,
      richTextRenderOptions
    );
  }

  if (typeof content === "string") {
    const withLinks = content.replace(
      /\[([^\]]+)\]\((https?:[^)]+)\)/g,
      (_m, text, url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline">${text}</a>`
    );

    const sanitized = DOMPurify.sanitize(withLinks, {
      ALLOWED_TAGS: ["a", "br", "p", "strong", "em", "span"],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
      ALLOW_DATA_ATTR: false,
    });

    return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }

  return null;
}

interface LaptopsPageProps {
  onAddToCart?: (item: CartItem) => void;
  onOpenCart?: () => void;
}

export function LaptopsPage({ onAddToCart, onOpenCart }: LaptopsPageProps) {
  const [laptops, setLaptops] = useState<PCBuilderComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        logger.info("🔍 LaptopsPage: Starting to fetch laptops...");
        const items = await fetchLaptops();
        logger.info("✅ LaptopsPage: Fetched laptops", {
          count: items.length,
        });
        setLaptops(items);
      } catch (error) {
        logger.error("❌ LaptopsPage: Error fetching laptops", { error });
        setLaptops([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featured = useMemo(
    () => laptops.filter((l) => !!l.featured),
    [laptops]
  );
  const regular = useMemo(() => laptops.filter((l) => !l.featured), [laptops]);

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <PageHero
          badge="Gaming Laptops"
          badgeIcon={<Laptop2 className="w-4 h-4" />}
          title="Portable Power, Zero Compromise"
          description="Top-end gaming behemoths with desktop-class GPUs, ultra-fast displays, and thermal engineering worthy of a flagship build."
        />

        {/* Featured Row */}
        {featured.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-bold">
                Featured Laptops
              </h2>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {featured.map((item) => (
                <ComponentCard
                  key={item.id}
                  component={item}
                  category="laptop"
                  isSelected={false}
                  onSelect={() => {}}
                  renderRichText={renderRichText}
                  onAddToCart={(cartItem) => {
                    onAddToCart?.(cartItem);
                    onOpenCart?.();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Laptops */}
        <div className="mb-6 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl md:text-2xl font-bold">All Gaming Laptops</h2>
        </div>
        {loading ? (
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-white/10 rounded w-64"></div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-white/10 rounded"></div>
                ))}
              </div>
            </div>
          </Card>
        ) : laptops.length === 0 ? (
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Laptop2 className="w-16 h-16 text-gray-500 mx-auto" />
              <h3 className="text-xl font-semibold text-white">
                No Gaming Laptops Available
              </h3>
              <p className="text-gray-400">
                We're currently updating our gaming laptop inventory. Please
                check back soon or contact us for custom laptop solutions.
              </p>
              <div className="text-sm text-gray-500 mt-4">
                <p>
                  💡 Tip: Make sure laptop products are published in Contentful
                </p>
                <p className="mt-1">
                  Content type should be one of: laptop, gamingLaptop, laptops,
                  or pcLaptop
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {regular.map((item) => (
              <ComponentCard
                key={item.id}
                component={item}
                category="laptop"
                isSelected={false}
                onSelect={() => {}}
                renderRichText={renderRichText}
                onAddToCart={(cartItem) => {
                  onAddToCart?.(cartItem);
                  onOpenCart?.();
                }}
              />
            ))}
          </div>
        )}

        {/* Closing Banner */}
        <div className="mt-12">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-semibold">
                  Need advice on the perfect mobile setup?
                </span>
              </div>
              <div className="md:ml-auto">
                <Button className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500">
                  Contact Our Specialists
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
