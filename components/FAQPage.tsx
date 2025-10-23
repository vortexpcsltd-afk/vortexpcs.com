import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
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

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [faqData, pageData] = await Promise.all([
          fetchFAQItems(),
          fetchPageContent("faq"),
        ]);

        setFaqItems(faqData);
        setPageContent(pageData);
      } catch (error) {
        console.error("Failed to load FAQ content:", error);
        // Fallback to hardcoded data if CMS fails
        setFaqItems(getMockFAQData());
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Fallback function for mock FAQ data
  function getMockFAQData(): FAQItem[] {
    return [
      {
        id: 1,
        question: "How long does it take to build my custom PC?",
        answer:
          "All custom PCs are built and tested within 5 working days from order confirmation and payment receipt. We provide build updates via email and you can track progress through your member area. Express builds may be available for urgent requirements - please contact us to discuss.",
        category: "Building Process",
        order: 1,
        featured: true,
        keywords: "build time, delivery, express",
      },
      {
        id: 2,
        question: "Can I customize any component in my PC build?",
        answer:
          "Absolutely! Every component can be customized to your exact requirements. Use our PC Builder to select from premium components, or contact us for specialized parts not listed. We source from top manufacturers including ASUS, MSI, Corsair, NZXT, and more.",
        category: "Customization",
        order: 2,
        featured: true,
        keywords: "customization, components, brands",
      },
      {
        id: 3,
        question: "What warranty do you provide?",
        answer:
          "All custom builds include our comprehensive 3-year warranty covering parts, labor, and system functionality. Individual components retain their manufacturer warranties (typically 2-5 years). We also offer optional extended warranties up to 5 years.",
        category: "Warranty",
        order: 3,
        featured: true,
        keywords: "warranty, 3 year, coverage, extended",
      },
      {
        id: 4,
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through Stripe with full PCI compliance.",
        category: "Payment",
        order: 4,
        featured: false,
        keywords: "payment, cards, paypal, secure",
      },
      {
        id: 5,
        question: "How is my PC delivered safely?",
        answer:
          "All PCs are professionally packaged in custom foam inserts and anti-static materials. We use tracked, insured courier services with signature required delivery. Optional white-glove delivery service includes setup and configuration at your location.",
        category: "Shipping",
        order: 5,
        featured: false,
        keywords: "delivery, packaging, insurance, white-glove",
      },
      {
        id: 6,
        question: "Do you provide compatibility checking?",
        answer:
          "Yes, our PC Builder includes intelligent compatibility checking to prevent incompatible combinations. Our system checks CPU socket compatibility, RAM support, GPU clearance, power requirements, and cooling requirements. We also manually verify every build before assembly.",
        category: "Building Process",
        order: 6,
        featured: false,
        keywords: "compatibility, validation, safety",
      },
      {
        id: 7,
        question: "Do you repair PCs not built by you?",
        answer:
          "Yes, our UK-wide repair service covers all PC brands and builds. We provide free diagnostics, competitive repair quotes, and collect-and-return service. Common repairs include component replacement, system optimization, virus removal, and upgrade installations.",
        category: "Support",
        order: 7,
        featured: false,
        keywords: "repair service, all brands, diagnostics, collection",
      },
      {
        id: 8,
        question: "What technical support do you provide?",
        answer:
          "We provide lifetime technical support for all customers. This includes setup assistance, software installation help, troubleshooting guidance, and upgrade advice. Premium support packages offer priority response and remote assistance.",
        category: "Support",
        order: 8,
        featured: false,
        keywords: "technical support, lifetime, setup, troubleshooting",
      },
    ];
  }

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
    { id: "Customization", name: "Customization", icon: Zap },
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading FAQ content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-6 text-lg px-6 py-2">
            Help Center
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {pageContent?.heroTitle || "Frequently Asked Questions"}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            {pageContent?.heroDescription ||
              "Find instant answers to common questions about our custom PC builds, services, warranty, and support. Can't find what you're looking for? Contact our expert team."}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-2xl font-bold text-white mb-1">
                {faqData.length}
              </div>
              <div className="text-sm text-gray-400">Total FAQs</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-2xl font-bold text-white mb-1">
                {categories.length - 1}
              </div>
              <div className="text-sm text-gray-400">Categories</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-2xl font-bold text-white mb-1">&lt;1min</div>
              <div className="text-sm text-gray-400">Avg. Read Time</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-2xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                className={`
                  ${
                    selectedCategory === category.id
                      ? "bg-sky-500 hover:bg-sky-600 text-white border-sky-500"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white hover:border-sky-500/30"
                  }
                  transition-all duration-300 px-6 py-3
                `}
              >
                <category.icon className="w-4 h-4 mr-2" />
                {category.name}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.id === "all"
                    ? faqData.length
                    : faqData.filter((faq) => faq.category === category.id)
                        .length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl mr-4 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                {selectedCategory === "all"
                  ? "All Questions"
                  : categories.find((c) => c.id === selectedCategory)?.name}
              </h2>
              <Badge
                variant="outline"
                className="text-sky-400 border-sky-400/50 bg-sky-400/10 text-lg px-4 py-2"
              >
                {filteredFAQs.length} result
                {filteredFAQs.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {searchTerm && (
              <p className="text-gray-300 mt-4 text-lg">
                Showing results for "
                <span className="text-sky-400 font-semibold">{searchTerm}</span>
                "
              </p>
            )}
          </div>

          {filteredFAQs.length > 0 ? (
            <Accordion type="multiple" className="space-y-4">
              {filteredFAQs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-sky-500/30 transition-all duration-300"
                >
                  <AccordionTrigger className="px-8 py-6 text-left hover:no-underline group">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-white group-hover:text-sky-400 transition-colors duration-300 mb-2">
                        {faq.question}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {faq.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs bg-sky-500/10 text-sky-400 border-sky-500/20"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-6">
                    <div
                      className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                No FAQs Found
              </h3>
              <p className="text-gray-400 mb-6">
                We couldn't find any questions matching your search. Try
                different keywords or browse all categories.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => setSearchTerm("")}
                  className="bg-sky-500 hover:bg-sky-600 text-white mr-4"
                >
                  Clear Search
                </Button>
                <Button
                  onClick={() => setSelectedCategory("all")}
                  variant="outline"
                  className="bg-white/5 hover:bg-white/10 border-white/10 text-white hover:border-sky-500/30"
                >
                  View All FAQs
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-b from-white/5 to-transparent">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Still Need Help?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Can't find the answer you're looking for? Our expert support team is
            here to help with any questions about custom PC builds, components,
            or services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => onNavigate?.("contact")}
              className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 text-lg"
            >
              Contact Support
            </Button>
            <Button
              onClick={() => onNavigate?.("contact")}
              variant="outline"
              className="bg-white/5 hover:bg-white/10 border-white/10 text-white hover:border-sky-500/30 px-8 py-4 text-lg"
            >
              Live Chat
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
