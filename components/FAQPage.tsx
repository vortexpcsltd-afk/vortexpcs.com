import { useState } from "react";
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
  Filter,
  CreditCard,
  Truck,
  Wrench,
  Monitor,
  Cpu,
  Zap,
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const faqData: FAQ[] = [
  // Custom PC Building
  {
    id: "1",
    question: "How long does it take to build my custom PC?",
    answer:
      "All custom PCs are built and tested within 5 working days from order confirmation and payment receipt. We provide build updates via email and you can track progress through your member area. Express builds may be available for urgent requirements - please contact us to discuss.",
    category: "Building",
    tags: ["build time", "delivery", "express"],
  },
  {
    id: "2",
    question: "Can I customize any component in my PC build?",
    answer:
      "Absolutely! Every component can be customized to your exact requirements. Use our PC Builder to select from premium components, or contact us for specialized parts not listed. We source from top manufacturers including ASUS, MSI, Corsair, NZXT, and more.",
    category: "Building",
    tags: ["customization", "components", "brands"],
  },
  {
    id: "3",
    question: "Do you provide compatibility checking?",
    answer:
      "Yes, our PC Builder includes intelligent compatibility checking to prevent incompatible combinations. Our system checks CPU socket compatibility, RAM support, GPU clearance, power requirements, and cooling requirements. We also manually verify every build before assembly.",
    category: "Building",
    tags: ["compatibility", "validation", "safety"],
  },
  {
    id: "4",
    question: "What if a component becomes unavailable after I order?",
    answer:
      "If any component becomes unavailable, we'll contact you immediately to offer suitable alternatives of equal or better specification. If no acceptable alternative exists, we'll issue a full refund for that component or the entire order at your discretion.",
    category: "Building",
    tags: ["availability", "alternatives", "refund"],
  },

  // Pricing & Payment
  {
    id: "5",
    question: "Are there any hidden fees or build charges?",
    answer:
      "No hidden fees whatsoever. Our transparent pricing includes all components, professional assembly, cable management, testing, and 3-year warranty. The only additional costs are optional express delivery or premium support packages.",
    category: "Pricing",
    tags: ["pricing", "fees", "transparent", "warranty"],
  },
  {
    id: "6",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through Stripe with full PCI compliance.",
    category: "Pricing",
    tags: ["payment", "cards", "paypal", "secure"],
  },
  {
    id: "7",
    question: "Do you offer financing options?",
    answer:
      "Yes, we offer flexible finance options through our partners for builds over £500. Options include 0% APR for 6-12 months and extended payment plans. Finance is subject to credit approval and terms apply.",
    category: "Pricing",
    tags: ["finance", "credit", "0% apr", "payment plans"],
  },

  // Warranty & Support
  {
    id: "8",
    question: "What warranty do you provide?",
    answer:
      "All custom builds include our comprehensive 3-year warranty covering parts, labor, and system functionality. Individual components retain their manufacturer warranties (typically 2-5 years). We also offer optional extended warranties up to 5 years.",
    category: "Warranty",
    tags: ["warranty", "3 year", "coverage", "extended"],
  },
  {
    id: "9",
    question: "What does your warranty cover exactly?",
    answer:
      "Our warranty covers component failures, system instability, and any build-related issues. It includes free diagnostics, replacement parts, and labor. Damage from misuse, modifications, or accidents isn't covered. Full terms available in our warranty policy.",
    category: "Warranty",
    tags: ["warranty coverage", "exclusions", "terms"],
  },
  {
    id: "10",
    question: "How do I claim warranty support?",
    answer:
      "Contact our support team via email, phone, or member area. We'll diagnose the issue remotely first, then arrange collection if hardware replacement is needed. Most issues are resolved within 48 hours, with full system returns within 5-7 working days.",
    category: "Warranty",
    tags: ["warranty claim", "support", "collection", "turnaround"],
  },

  // Delivery & Collection
  {
    id: "11",
    question: "How is my PC delivered safely?",
    answer:
      "All PCs are professionally packaged in custom foam inserts and anti-static materials. We use tracked, insured courier services with signature required delivery. Optional white-glove delivery service includes setup and configuration at your location.",
    category: "Delivery",
    tags: ["delivery", "packaging", "insurance", "white-glove"],
  },
  {
    id: "12",
    question: "Can I collect my PC instead of delivery?",
    answer:
      "Yes, collection is available from our facility by appointment. We'll demonstrate your new system, answer any questions, and provide a complete handover. Collection appointments are available Monday-Friday 9am-5pm.",
    category: "Delivery",
    tags: ["collection", "pickup", "demonstration", "appointment"],
  },
  {
    id: "13",
    question: "Do you deliver internationally?",
    answer:
      "Currently we deliver throughout the UK mainland. International delivery to Europe is available for premium builds over £2000. Please contact us for international shipping quotes and customs information.",
    category: "Delivery",
    tags: ["international", "shipping", "europe", "customs"],
  },

  // PC Finder & Configuration
  {
    id: "14",
    question: "How accurate is the PC Finder recommendation system?",
    answer:
      "Our PC Finder uses advanced algorithms considering your specific use case, budget, performance requirements, and preferences. Recommendations are based on real-world benchmarks and optimized component combinations. Over 95% of customers are satisfied with their recommended builds.",
    category: "PC Finder",
    tags: ["pc finder", "accuracy", "algorithm", "recommendations"],
  },
  {
    id: "15",
    question: "Can I modify the PC Finder recommendations?",
    answer:
      "Absolutely! PC Finder recommendations are starting points that you can fully customize. Use our PC Builder to modify any component while maintaining compatibility. Our system will highlight any potential issues and suggest alternatives.",
    category: "PC Finder",
    tags: ["modify", "customize", "recommendations", "pc builder"],
  },

  // Repair Services
  {
    id: "16",
    question: "Do you repair PCs not built by you?",
    answer:
      "Yes, our UK-wide repair service covers all PC brands and builds. We provide free diagnostics, competitive repair quotes, and collect-and-return service. Common repairs include component replacement, system optimization, virus removal, and upgrade installations.",
    category: "Repairs",
    tags: ["repair service", "all brands", "diagnostics", "collection"],
  },
  {
    id: "17",
    question: "What's included in your PC health check?",
    answer:
      "Our comprehensive health check includes hardware diagnostics, thermal testing, performance benchmarking, driver updates, system optimization, security scan, and cleaning. We provide a detailed report with recommendations for improvements or upgrades.",
    category: "Repairs",
    tags: ["health check", "diagnostics", "optimization", "report"],
  },

  // Technical Support
  {
    id: "18",
    question: "Do you provide technical support after purchase?",
    answer:
      "Yes, all customers receive lifetime technical support via email and phone. This includes setup assistance, software guidance, upgrade advice, and troubleshooting. Premium support packages offer priority response and remote desktop assistance.",
    category: "Support",
    tags: ["technical support", "lifetime", "setup", "troubleshooting"],
  },
  {
    id: "19",
    question: "Can you help with software installation and setup?",
    answer:
      "Absolutely! We can pre-install Windows, drivers, essential software, and games before delivery. Post-delivery, our support team can guide you through additional software installation, system optimization, and configuration via phone or remote assistance.",
    category: "Support",
    tags: ["software", "installation", "windows", "remote assistance"],
  },

  // Performance & Upgrades
  {
    id: "20",
    question: "How do I know if my PC needs upgrading?",
    answer:
      "Signs include slow performance, long loading times, low frame rates in games, or inability to run new software. Our free performance analysis service can evaluate your system and recommend cost-effective upgrades to extend its lifespan.",
    category: "Upgrades",
    tags: ["upgrade", "performance", "analysis", "cost-effective"],
  },
];

const categories = [
  { id: "all", name: "All FAQs", icon: HelpCircle },
  { id: "Building", name: "PC Building", icon: Cpu },
  { id: "Pricing", name: "Pricing & Payment", icon: CreditCard },
  { id: "Warranty", name: "Warranty & Support", icon: Shield },
  { id: "Delivery", name: "Delivery", icon: Truck },
  { id: "PC Finder", name: "PC Finder", icon: Monitor },
  { id: "Repairs", name: "Repair Services", icon: Wrench },
  { id: "Support", name: "Technical Support", icon: Zap },
  { id: "Upgrades", name: "Upgrades", icon: Clock },
];

export const FAQPage = ({
  onNavigate,
}: {
  onNavigate?: (view: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openItems, setOpenItems] = useState<string[]>([]);

  // Filter FAQs based on search and category
  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setOpenItems([]); // Close all open items when changing category
  };

  return (
    <div className="min-h-screen py-20">
      {/* Hero Section */}
      <div className="relative py-20 sm:py-32">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-400/30 backdrop-blur-xl mb-8 shadow-lg shadow-sky-500/20">
              <HelpCircle className="w-5 h-5 text-sky-400 mr-3" />
              <span className="text-sky-300 font-medium">
                Frequently Asked Questions
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent leading-tight">
              How Can We Help?
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              Find answers to common questions about our custom PC building
              services, warranties, delivery, and technical support.
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-lg transition-all duration-300" />
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-sky-400 w-6 h-6" />
                <Input
                  type="text"
                  placeholder="Search for answers... (e.g., 'warranty', 'delivery time', 'payment')"
                  className="pl-16 pr-6 py-6 text-lg bg-black/40 backdrop-blur-xl border-sky-400/30 text-white placeholder-gray-400 rounded-2xl focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Enhanced Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-3xl blur-xl group-hover:blur-lg transition-all duration-300" />
              <Card className="relative bg-black/40 backdrop-blur-xl border-sky-400/20 p-8 rounded-3xl shadow-2xl sticky top-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg mr-3 flex items-center justify-center">
                    <Filter className="w-4 h-4 text-white" />
                  </div>
                  Categories
                </h3>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    const count =
                      category.id === "all"
                        ? faqData.length
                        : faqData.filter((faq) => faq.category === category.id)
                            .length;

                    return (
                      <Button
                        key={category.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start text-left p-4 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-500/30 scale-105"
                            : "text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20"
                        }`}
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        <Icon className="w-5 h-5 mr-4 flex-shrink-0" />
                        <span className="flex-1 font-medium">
                          {category.name}
                        </span>
                        <Badge
                          variant={isActive ? "secondary" : "outline"}
                          className={`ml-3 ${
                            isActive
                              ? "bg-white/20 text-white border-white/30"
                              : "border-sky-400/50 text-sky-400"
                          }`}
                        >
                          {count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>

          {/* Enhanced FAQ Content */}
          <div className="lg:col-span-3">
            {/* Enhanced Results Header */}
            <div className="mb-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-blue-500/5 rounded-2xl blur-xl transition-all duration-300" />
                <div className="relative bg-black/20 backdrop-blur-sm border border-sky-400/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-white flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl mr-4 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-white" />
                      </div>
                      {selectedCategory === "all"
                        ? "All Questions"
                        : categories.find((c) => c.id === selectedCategory)
                            ?.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className="text-sky-400 border-sky-400/50 bg-sky-400/10 text-lg px-4 py-2"
                    >
                      {filteredFAQs.length} result
                      {filteredFAQs.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {searchQuery && (
                    <p className="text-gray-300 mt-4 text-lg">
                      Showing results for "
                      <span className="text-sky-400 font-semibold">
                        {searchQuery}
                      </span>
                      "
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced FAQ List */}
            {filteredFAQs.length > 0 ? (
              <div className="space-y-6">
                <Accordion
                  type="multiple"
                  value={openItems}
                  onValueChange={setOpenItems}
                  className="space-y-4"
                >
                  {filteredFAQs.map((faq, index) => (
                    <div key={faq.id} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-blue-500/5 rounded-2xl blur-lg group-hover:blur-md transition-all duration-300" />
                      <AccordionItem
                        value={faq.id}
                        className="relative bg-black/30 backdrop-blur-xl border border-sky-400/20 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-sky-500/20 hover:border-sky-400/40 transition-all duration-300 overflow-hidden"
                      >
                        <AccordionTrigger className="text-left hover:text-sky-400 transition-all duration-300 px-8 py-6 hover:no-underline">
                          <div className="flex items-start gap-6 w-full">
                            <div className="w-10 h-10 bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-400/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-sky-500/30 group-hover:to-blue-500/30 transition-all duration-300">
                              <span className="text-sky-400 font-bold text-lg">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-white mb-3 text-xl leading-relaxed">
                                {faq.question}
                              </h3>
                              <div className="flex flex-wrap gap-3">
                                <Badge
                                  variant="outline"
                                  className="text-sm text-sky-400 border-sky-400/50 bg-sky-400/10 px-3 py-1"
                                >
                                  {faq.category}
                                </Badge>
                                {faq.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-sm text-gray-400 border-gray-400/50 bg-gray-400/10 px-3 py-1"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-8 pb-8">
                          <div className="ml-16 pl-6 border-l border-sky-400/30">
                            <p className="text-gray-300 leading-relaxed text-lg">
                              {faq.answer}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </div>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl blur-xl transition-all duration-300" />
                <Card className="relative bg-black/30 backdrop-blur-xl border border-red-400/20 p-16 text-center rounded-2xl">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <HelpCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    No results found
                  </h3>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-md mx-auto">
                    Try adjusting your search terms or selecting a different
                    category to find what you're looking for.
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-sky-500/30"
                  >
                    Show All FAQs
                  </Button>
                </Card>
              </div>
            )}

            {/* Enhanced Contact Section */}
            <div className="relative group mt-12">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-3xl blur-xl transition-all duration-300" />
              <Card className="relative bg-black/40 backdrop-blur-xl border border-sky-400/30 p-10 rounded-3xl shadow-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <HelpCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Still have questions?
                  </h3>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                    Our expert team is here to help with any questions about
                    custom PC builds, technical support, or our services.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Button
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-sky-500/30"
                      onClick={() => onNavigate?.("contact")}
                    >
                      Contact Support
                    </Button>
                    <Button
                      variant="outline"
                      className="border-sky-400/50 text-sky-400 hover:bg-sky-500/10 hover:border-sky-400 px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300"
                      onClick={() => onNavigate?.("contact")}
                    >
                      Live Chat
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
