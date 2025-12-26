import { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Laptop2, Rocket, Trophy, Sparkles } from "lucide-react";
import { ComponentCard } from "./PCBuilder/cards/ComponentCard";
import type { PCBuilderComponent } from "./PCBuilder/types";
import { fetchLaptops } from "../services/cms";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { Document } from "@contentful/rich-text-types";

function renderRichText(content?: string | Document) {
  if (!content) return null;
  if (typeof content === "string") {
    return <span>{content}</span>;
  }
  return <>{documentToReactComponents(content)}</>;
}

export function LaptopsPage() {
  const [laptops, setLaptops] = useState<PCBuilderComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const items = await fetchLaptops();
      setLaptops(items);
      setLoading(false);
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
        <div className="relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-slate-950 to-black">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(1200px_600px_at_20%_20%,rgba(14,165,233,0.35)_0%,transparent_60%),radial-gradient(800px_400px_at_80%_10%,rgba(59,130,246,0.35)_0%,transparent_60%)]"></div>
          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-transparent border border-cyan-500/40">
                <Laptop2 className="w-4 h-4 text-cyan-400 mr-2" />
                <span className="text-xs font-semibold text-cyan-300 tracking-wide">
                  GAMING LAPTOPS
                </span>
              </div>
              <Badge className="bg-cyan-500/20 border-cyan-500/40 text-cyan-200">
                New
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
              <span className="block bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                Portable Power, Zero Compromise
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl">
              Top-end gaming behemoths with desktop-class GPUs, ultra-fast
              displays, and thermal engineering worthy of a flagship build.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                RTX 4080/4090
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                QHD/4K • 240Hz
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                Advanced Cooling
              </span>
            </div>
          </div>
        </div>

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
                  category="laptops"
                  isSelected={false}
                  onSelect={() => {}}
                  renderRichText={renderRichText}
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
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {regular.map((item) => (
              <ComponentCard
                key={item.id}
                component={item}
                category="laptops"
                isSelected={false}
                onSelect={() => {}}
                renderRichText={renderRichText}
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
