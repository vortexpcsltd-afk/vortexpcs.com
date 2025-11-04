import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Zap,
  Shield,
  Users,
  Settings as SettingsIcon,
  Wrench,
  Star,
  Search,
} from "lucide-react";
import {
  type Settings,
  type Testimonial,
  type FeatureItem,
  type CompanyStats,
  type PageContent,
} from "../services/cms";

interface HomePageProps {
  setCurrentView: (view: string) => void;
}

export function HomePage({ setCurrentView }: HomePageProps) {
  console.log("🏠 HomePage component rendered");

  const cmsDisabled = (import.meta.env as any)?.VITE_CMS_DISABLED === "true";
  const [, setSettings] = useState<Settings | null>(null);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [heroFeatures, setHeroFeatures] = useState<FeatureItem[]>([]);
  const [mainFeatures, setMainFeatures] = useState<FeatureItem[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const heroBackground = "/gaming-keyboard.jpeg";

  useEffect(() => {
    console.log("🔄 HomePage useEffect running, cmsDisabled:", cmsDisabled);

    const loadContent = async () => {
      // Optional dev escape hatch: force fallback content to preview local hero edits
      if (cmsDisabled) {
        console.warn(
          "CMS disabled via VITE_CMS_DISABLED, using fallback content"
        );
        setPageContent({
          id: 1,
          pageSlug: "home",
          pageTitle: "Vortex PCs - Premium Custom PC Builds",
          heroTitle: "PERFORMANCE THAT DOESN'T WAIT",
          heroSubtitle: "Custom PCs built for speed, power, and precision.",
          heroDescription:
            "Experience unparalleled performance with our cutting-edge custom PC builds. From budget-friendly builds to extreme gaming rigs, we deliver excellence in every component.",
        });
        setLoading(false);
        return;
      }

      try {
        console.log("🚀 Loading Contentful CMS content...");

        // Import CMS services dynamically
        const {
          fetchSettings,
          fetchPageContent,
          fetchTestimonials,
          fetchFeatureItems,
          fetchCompanyStats,
        } = await import("../services/cms");

        // Load all content from Contentful CMS
        const [
          contentfulSettings,
          contentfulPageContent,
          contentfulTestimonials,
          contentfulHeroFeatures,
          contentfulMainFeatures,
          contentfulCompanyStats,
        ] = await Promise.allSettled([
          fetchSettings(),
          fetchPageContent("home"),
          fetchTestimonials(),
          fetchFeatureItems({ showOnHomepage: true }),
          fetchFeatureItems({ category: "why-choose-us" }),
          fetchCompanyStats(),
        ]);

        console.log("📊 Contentful API Results:", {
          settings: contentfulSettings.status,
          pageContent: contentfulPageContent.status,
          testimonials: contentfulTestimonials.status,
          heroFeatures: contentfulHeroFeatures.status,
          mainFeatures: contentfulMainFeatures.status,
          stats: contentfulCompanyStats.status,
        });

        if (
          contentfulSettings.status === "fulfilled" &&
          contentfulSettings.value
        ) {
          setSettings(contentfulSettings.value);
          console.log(
            "✅ Contentful settings loaded:",
            contentfulSettings.value
          );
        }

        if (
          contentfulPageContent.status === "fulfilled" &&
          contentfulPageContent.value
        ) {
          setPageContent(contentfulPageContent.value);
          console.log(
            "✅ Contentful page content loaded:",
            contentfulPageContent.value
          );
          console.log(
            "🎉 Hero title from Contentful:",
            contentfulPageContent.value.heroTitle
          );
        } else {
          console.log("⚠️ FALLBACK: Using hardcoded hero content");
          setPageContent({
            id: 1,
            pageSlug: "home",
            pageTitle: "Vortex PCs - Premium Custom PC Builds",
            heroTitle: "PERFORMANCE THAT DOESN'T WAIT",
            heroSubtitle: "Custom PCs built for speed, power, and precision.",
            heroDescription:
              "Experience unparalleled performance with our cutting-edge custom PC builds. From budget-friendly builds to extreme gaming rigs, we deliver excellence in every component.",
          });
        }

        if (
          contentfulTestimonials.status === "fulfilled" &&
          contentfulTestimonials.value
        ) {
          setTestimonials(contentfulTestimonials.value);
          console.log(
            "✅ Contentful testimonials loaded:",
            contentfulTestimonials.value
          );
        }

        if (
          contentfulHeroFeatures.status === "fulfilled" &&
          contentfulHeroFeatures.value
        ) {
          setHeroFeatures(contentfulHeroFeatures.value);
          console.log(
            "✅ Contentful hero features loaded:",
            contentfulHeroFeatures.value
          );
        }

        if (
          contentfulMainFeatures.status === "fulfilled" &&
          contentfulMainFeatures.value
        ) {
          setMainFeatures(contentfulMainFeatures.value);
          console.log(
            "✅ Contentful main features loaded:",
            contentfulMainFeatures.value
          );
        }

        if (
          contentfulCompanyStats.status === "fulfilled" &&
          contentfulCompanyStats.value
        ) {
          setCompanyStats(contentfulCompanyStats.value);
          console.log(
            "✅ Contentful company stats loaded:",
            contentfulCompanyStats.value
          );
        }

        console.log("🎉 All Contentful content loaded successfully!");
      } catch (error) {
        console.error("❌ Failed to load Contentful content:", error);
        console.log("🔄 Using fallback content...");

        // Fallback data when Contentful is unavailable
        setPageContent({
          id: 1,
          pageSlug: "home",
          pageTitle: "Vortex PCs - Premium Custom PC Builds",
          heroTitle: "PERFORMANCE THAT DOESN'T WAIT",
          heroSubtitle: "Custom PCs built for speed, power, and precision.",
          heroDescription:
            "Experience unparalleled performance with our cutting-edge custom PC builds. From budget-friendly builds to extreme gaming rigs, we deliver excellence in every component.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-500 mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  const defaultHeroFeatures = [
    {
      icon: "Zap",
      title: "Lightning Fast",
      description: "Cutting-edge components for maximum performance",
    },
    {
      icon: "Shield",
      title: "Built to Last",
      description: "Premium quality with comprehensive warranties",
    },
    {
      icon: "Users",
      title: "Expert Support",
      description: "Dedicated team to help with any questions",
    },
  ];

  const defaultTestimonials = [
    {
      customerName: "Alex Thompson",
      review:
        "Absolutely incredible build quality! My gaming performance has never been better.",
      rating: 5,
      productName: "London, UK",
    },
    {
      customerName: "Sarah Mitchell",
      review:
        "Professional service from start to finish. The team really knows their stuff.",
      rating: 5,
      productName: "Manchester, UK",
    },
    {
      customerName: "James Wilson",
      review:
        "Best investment I've made for my streaming setup. Handles everything flawlessly.",
      rating: 5,
      productName: "Birmingham, UK",
    },
  ];

  const defaultMainFeatures = [
    {
      icon: "CheckCircle",
      title: "Quality Guaranteed",
      description:
        "Every component is carefully selected and tested for optimal performance and reliability.",
    },
    {
      icon: "Wrench",
      title: "Expert Assembly",
      description:
        "Our certified technicians ensure every build meets the highest standards.",
    },
    {
      icon: "Shield",
      title: "Comprehensive Warranty",
      description:
        "All builds come with full warranty coverage and dedicated technical support.",
    },
    {
      icon: "Zap",
      title: "Maximum Performance",
      description:
        "Optimized configurations to get the most out of every component.",
    },
    {
      icon: "Users",
      title: "Personal Service",
      description:
        "One-on-one consultation to ensure your PC meets your exact needs.",
    },
    {
      icon: "Settings",
      title: "Custom Solutions",
      description:
        "Tailored builds for gaming, content creation, and professional workloads.",
    },
  ];

  const currentHeroFeatures =
    heroFeatures.length > 0 ? heroFeatures : defaultHeroFeatures;
  const currentTestimonials =
    testimonials.length > 0 ? testimonials : defaultTestimonials;
  const currentMainFeatures =
    mainFeatures.length > 0 ? mainFeatures : defaultMainFeatures;

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Zap,
      Shield,
      Users,
      Settings: SettingsIcon,
      Wrench,
    };
    const IconComponent = iconMap[iconName] || Zap;
    return (
      <div className="flex items-center justify-center mb-4">
        <IconComponent className="h-8 w-8 text-sky-400" />
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-sky-900/20 animate-gradient"></div>
      <div
        className="fixed inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 safe-px">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroBackground})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-2">
          <Badge className="mb-6 sm:mb-12 lg:mb-32 bg-transparent border-sky-500/40 text-sky-400 px-3 sm:px-4 py-2 text-sm sm:text-base font-normal inline-flex items-center gap-2 animate-fade-in">
            <Star
              className="fill-transparent stroke-yellow-500 border-yellow-500"
              style={{ width: "18px", height: "18px" }}
              strokeWidth={1.5}
            />
            {pageContent?.heroBadgeText ||
              "Custom PCs built for speed, power, and precision"}
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 animate-float break-words">
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              {pageContent?.heroTitle || "Build Your Dream PC with Vortex"}
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6 sm:mb-8 text-gray-300 max-w-4xl mx-auto animate-float animation-delay-200">
            {pageContent?.heroSubtitle ||
              "Custom PCs built for speed, power, and precision."}
          </p>

          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-gray-400 max-w-3xl mx-auto animate-fade-in animation-delay-400 px-4">
            {pageContent?.heroDescription ||
              "Experience unparalleled performance with our cutting-edge custom PC builds. From budget-friendly builds to extreme gaming rigs, we deliver excellence in every component."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 animate-fade-in animation-delay-600 px-4">
            <Button
              onClick={() => setCurrentView("pc-finder")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-sky-500/25"
            >
              <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Find Your Perfect PC
            </Button>
            <Button
              onClick={() => setCurrentView("pc-builder")}
              variant="outline"
              className="border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <SettingsIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Custom Builder
            </Button>
          </div>

          {/* Hero Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
            {currentHeroFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-sky-500/10 animate-fade-in"
                style={{ animationDelay: `${800 + index * 200}ms` }}
              >
                <div className="p-6 text-center">
                  {getIconComponent(feature.icon)}
                  <h3 className="text-xl font-semibold mb-3 text-sky-400">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                {pageContent?.featuresTitle || "Why Choose Vortex PCs?"}
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {pageContent?.featuresDescription ||
                "We combine cutting-edge technology with expert craftsmanship to deliver the ultimate computing experience"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentMainFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    {getIconComponent(feature.icon)}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-sky-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Track Record Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                Our Track Record
              </span>
            </h2>
            <p className="text-lg text-gray-400">
              Real numbers that reflect our commitment to quality and service
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {/* Years Experience */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 text-center p-4 sm:p-6">
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-sky-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                {companyStats?.yearsExperience ?? 0}+
              </div>
              <div className="mt-1 text-sm sm:text-base text-gray-400">
                Years Experience
              </div>
            </Card>

            {/* Customers Served */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 text-center p-4 sm:p-6">
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-sky-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                {(() => {
                  const n = companyStats?.customersServed ?? 0;
                  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
                  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
                  return n;
                })()}
              </div>
              <div className="mt-1 text-sm sm:text-base text-gray-400">
                Customers Served
              </div>
            </Card>

            {/* PC Builds Completed */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 text-center p-4 sm:p-6">
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <Wrench className="h-6 w-6 sm:h-7 sm:w-7 text-sky-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                {(() => {
                  const n = companyStats?.pcBuildsCompleted ?? 0;
                  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
                  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
                  return n;
                })()}
              </div>
              <div className="mt-1 text-sm sm:text-base text-gray-400">
                PC Builds Completed
              </div>
            </Card>

            {/* Satisfaction Rate */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 text-center p-4 sm:p-6">
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <Star className="h-6 w-6 sm:h-7 sm:w-7 text-sky-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                {companyStats?.satisfactionRate ?? 0}%
              </div>
              <div className="mt-1 text-sm sm:text-base text-gray-400">
                Customer Satisfaction
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                What Our Customers Say
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Don't just take our word for it - hear from satisfied customers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {currentTestimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">
                    "{testimonial.review}"
                  </p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full flex items-center justify-center mr-3">
                      <span className="text-black font-semibold">
                        {testimonial.customerName?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {testimonial.customerName || "User"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {testimonial.productName || "Customer"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <Card className="relative bg-gradient-to-br from-blue-950/50 to-sky-950/30 backdrop-blur-xl border-2 border-sky-500/30 hover:border-sky-400/50 transition-all duration-500 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.2)] hover:shadow-[0_0_70px_rgba(56,189,248,0.3)] group">
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

            {/* Content */}
            <div className="relative px-6 py-12 sm:px-8 sm:py-16 md:px-16 md:py-20 text-center">
              {/* Badge */}
              {pageContent?.ctaBadgeText && (
                <div className="flex justify-center mb-6 sm:mb-8">
                  <Badge className="bg-sky-500/20 border border-sky-400/50 text-sky-300 px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-bold uppercase tracking-wider">
                    {pageContent.ctaBadgeText}
                  </Badge>
                </div>
              )}

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white leading-tight">
                {pageContent?.ctaTitle || "Ready to Build Your Dream PC?"}
              </h2>

              {/* Description */}
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
                {pageContent?.ctaDescription ||
                  "Get started with our AI-powered PC finder or dive into our custom builder"}
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center">
                <Button
                  onClick={() => setCurrentView("pc-finder")}
                  className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40"
                >
                  <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Start PC Finder
                </Button>

                <Button
                  onClick={() => setCurrentView("pc-builder")}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40"
                >
                  <SettingsIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Open Builder
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
