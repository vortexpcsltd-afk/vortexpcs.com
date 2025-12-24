import { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  HelpCircle,
  Search,
  Clock,
  Shield,
  CreditCard,
  Truck,
  Wrench,
  Monitor,
  Cpu,
  Zap,
} from "lucide-react";
import {
  fetchFAQItems,
  fetchPageContent,
  type FAQItem,
  type PageContent,
} from "../services/cms";
import { logger } from "../services/logger";
import { FAQItemSkeleton, PageHeaderSkeleton } from "./SkeletonComponents";
import { HtmlContent } from "./cms/HtmlContent";
import { LoadingState } from "./util/LoadingComponents";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface FAQPageProps {
  onNavigate?: (view: string) => void;
}

export function FAQPage({ onNavigate }: FAQPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [faqData, pageData] = await Promise.all([
        fetchFAQItems(),
        fetchPageContent("faq"),
      ]);

      setFaqItems(faqData);
      setPageContent(pageData);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error("Failed to load FAQ content:", e);
      setError(e);
      setFaqItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Convert CMS FAQ items to component format
  const faqData: FAQ[] = faqItems.map((item) => ({
    id: item.id.toString(),
    question: item.question,
    answer: item.answer,
    category: item.category,
    tags: item.keywords
      ? item.keywords.split(",").map((tag) => tag.trim())
      : [],
  }));

  // Update categories to match CMS data
  const categories = [
    { id: "all", name: "All FAQs", icon: HelpCircle },
    { id: "Building Process", name: "Building Process", icon: Cpu },
    { id: "Payment", name: "Payment", icon: CreditCard },
    { id: "Warranty", name: "Warranty", icon: Shield },
    { id: "Shipping", name: "Shipping", icon: Truck },
    { id: "General", name: "General", icon: Monitor },
    { id: "Support", name: "Support", icon: Wrench },
    { id: "Customisation", name: "Customisation", icon: Zap },
    { id: "Components", name: "Components", icon: Clock },
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Animated Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-sky-900/20 animate-gradient"></div>
        <div
          className="fixed inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        <div className="relative z-10 py-24 px-4">
          <div className="container mx-auto max-w-[1300px]">
            <PageHeaderSkeleton />

            {/* Search skeleton */}
            <div className="mb-12">
              <div className="h-14 bg-white/10 rounded-lg"></div>
            </div>

            {/* Category filters skeleton */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-32 bg-white/10 rounded-full flex-shrink-0"
                ></div>
              ))}
            </div>

            {/* FAQ items skeleton */}
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <FAQItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        {/* Animated Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-sky-900/20 animate-gradient"></div>
        <div
          className="fixed inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        ></div>
        <div className="relative z-10 py-24 px-4">
          <div className="container mx-auto max-w-[1300px]">
            <LoadingState
              isLoading={false}
              error={error}
              onRetry={loadContent}
              loadingMessage="Loading FAQs..."
            >
              {/* Fallback content could go here if needed */}
              <div className="text-center text-gray-400">
                Retry to load FAQs
              </div>
            </LoadingState>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-sky-900/20 animate-gradient"></div>
      <div
        className="fixed inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10">
        {/* Hero Section - Redesigned */}
        <section className="pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-[1300px] mx-auto text-center">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-cyan-500/20 border border-sky-500/30 backdrop-blur-xl mb-8 animate-fade-in">
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></div>
                <span className="text-sky-400 font-semibold text-base md:text-lg">
                  Knowledge Base
                </span>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse animation-delay-200"></div>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 leading-tight">
                <span className="bg-gradient-to-r from-white via-sky-200 to-cyan-200 bg-clip-text text-transparent">
                  Questions?
                </span>
                <br />
                <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  We've Got Answers
                </span>
              </h1>

              <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                {pageContent?.heroDescription ||
                  "Everything you need to know about building your dream PC"}
              </p>

              {/* Enhanced Search Bar */}
              <div className="max-w-3xl mx-auto mb-16">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-sky-400 z-10" />
                    <Input
                      type="text"
                      placeholder="Ask us anything..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-16 pr-6 py-7 text-lg md:text-xl bg-white/5 backdrop-blur-xl border-2 border-white/10 text-white placeholder:text-gray-400 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/20 rounded-2xl transition-all duration-300"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        <span className="text-xl">✕</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid - Premium Design */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-[1300px] mx-auto">
                {[
                  { label: "FAQs", value: faqData.length, icon: "📚" },
                  {
                    label: "Categories",
                    value: categories.length - 1,
                    icon: "🗂️",
                  },
                  { label: "Avg. Time", value: "<1min", icon: "⚡" },
                  { label: "Support", value: "24/7", icon: "💬" },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className="relative group animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 hover:border-sky-500/30 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="text-4xl mb-3">{stat.icon}</div>
                      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm md:text-base text-gray-400 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Browse by Topic
              </h2>
              <p className="text-lg md:text-xl text-gray-400">
                Select a category to narrow down your search
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center max-w-[1300px] mx-auto">
              {categories.map((category, index) => {
                const isActive = selectedCategory === category.id;
                const count =
                  category.id === "all"
                    ? faqData.length
                    : faqData.filter((faq) => faq.category === category.id)
                        .length;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`
                      group relative overflow-hidden rounded-2xl px-6 py-4 transition-all duration-300
                      ${
                        isActive
                          ? "bg-gradient-to-r from-sky-600 to-blue-600 shadow-lg shadow-sky-500/30 scale-105"
                          : "bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 hover:bg-white/10"
                      }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Shimmer effect for active */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    )}

                    <div className="relative flex items-center gap-3">
                      <category.icon
                        className={`w-5 h-5 ${
                          isActive ? "text-white" : "text-sky-400"
                        }`}
                      />
                      <span
                        className={`font-semibold text-base md:text-lg ${
                          isActive ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {category.name}
                      </span>
                      <span
                        className={`
                        px-2.5 py-1 rounded-full text-sm font-bold
                        ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-sky-500/10 text-sky-400"
                        }
                      `}
                      >
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ List */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1300px]">
            {/* Results Header */}
            <div className="mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <HelpCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                      {selectedCategory === "all"
                        ? "All Questions"
                        : categories.find((c) => c.id === selectedCategory)
                            ?.name}
                    </h2>
                    <p className="text-base md:text-lg text-gray-400 mt-1">
                      {filteredFAQs.length} answer
                      {filteredFAQs.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                </div>
              </div>

              {searchTerm && (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <Search className="w-5 h-5 text-sky-400" />
                  <span className="text-gray-300 text-base md:text-lg">
                    Results for{" "}
                    <span className="text-sky-400 font-semibold">
                      "{searchTerm}"
                    </span>
                  </span>
                </div>
              )}
            </div>

            {filteredFAQs.length > 0 ? (
              <Accordion type="multiple" className="space-y-5">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem
                    key={`faq-${faq.category}-${index}`}
                    value={`faq-${faq.category}-${index}`}
                    className="relative group border-0 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/10 to-cyan-500/0 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>

                    <div className="relative bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-3xl overflow-hidden hover:border-sky-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                      <AccordionTrigger className="px-6 md:px-8 py-6 md:py-8 text-left hover:no-underline group/trigger [&[data-state=open]]:bg-white/5">
                        <div className="flex-1 pr-4">
                          {/* Question Number Badge */}
                          <div className="inline-flex items-center gap-3 mb-4">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white text-sm font-bold shadow-lg">
                              {index + 1}
                            </span>
                            <div className="h-1 w-12 bg-gradient-to-r from-sky-500 to-transparent rounded-full"></div>
                          </div>

                          {/* Question Text */}
                          <div className="text-xl md:text-2xl font-bold text-white group-hover/trigger:text-sky-400 transition-colors duration-300 mb-4 leading-snug">
                            {faq.question}
                          </div>

                          {/* Tags */}
                          {faq.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {faq.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-6 md:px-8 pb-6 md:pb-8">
                        <div className="pt-4 border-t border-white/10">
                          <div className="text-lg md:text-xl text-gray-300 leading-relaxed prose prose-invert prose-lg max-w-none">
                            {/* Sanitize FAQ HTML answers */}
                            <HtmlContent html={faq.answer} />
                          </div>
                        </div>
                      </AccordionContent>
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Card className="relative overflow-hidden bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-3xl p-12 md:p-16 text-center">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-cyan-500/5"></div>

                <div className="relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10">
                    <HelpCircle className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    No Results Found
                  </h3>
                  <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-md mx-auto">
                    We couldn't find any questions matching your search. Try
                    different keywords or browse all categories.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => setSearchTerm("")}
                      variant="primary"
                      size="lg"
                    >
                      Clear Search
                    </Button>
                    <Button
                      onClick={() => setSelectedCategory("all")}
                      variant="outline"
                      size="lg"
                    >
                      View All FAQs
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* Contact Section - Premium Design */}
        <section className="py-20 md:py-28 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>

          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-[1300px] mx-auto">
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-950/50 to-sky-950/30 backdrop-blur-xl border-2 border-sky-500/30 rounded-3xl p-10 md:p-16 shadow-2xl shadow-sky-500/20">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-500/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl"></div>

                <div className="relative text-center">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl shadow-sky-500/30 mb-8">
                    <HelpCircle className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  </div>

                  {/* Heading */}
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
                      Still Need Help?
                    </span>
                  </h2>

                  <p className="text-lg md:text-xl lg:text-2xl text-gray-300 max-w-5xl mx-auto mb-10 leading-relaxed">
                    Can't find the answer you're looking for? Our expert support
                    team is here to help with any questions about custom PC
                    builds, components, or services.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => onNavigate?.("contact")}
                      variant="primary"
                      size="xl"
                      className="group"
                    >
                      <span className="flex items-center gap-2">
                        Contact Support
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                          →
                        </span>
                      </span>
                    </Button>
                    <Button
                      onClick={() => onNavigate?.("contact")}
                      variant="outline"
                      size="xl"
                    >
                      Live Chat
                    </Button>
                  </div>

                  {/* Additional info */}
                  <div className="mt-10 pt-8 border-t border-white/10">
                    <p className="text-base md:text-lg text-gray-400">
                      Average response time:{" "}
                      <span className="text-sky-400 font-semibold">
                        &lt; 2 hours
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FAQPage;
