import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { logger } from "../services/logger";
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
  type PageContent,
} from "../services/cms";
import {
  HeroSkeleton,
  FeaturedBuildSkeleton,
  TestimonialSkeleton,
  ProductCardSkeleton,
  GridSkeleton,
} from "./SkeletonComponents";
import { useNavigation } from "../contexts/NavigationContext";

export function HomePage() {
  logger.debug("🏠 HomePage component rendered");
  const { navigate } = useNavigation();

  const cmsDisabled =
    (import.meta.env as { VITE_CMS_DISABLED?: string })?.VITE_CMS_DISABLED ===
    "true";
  const [, setSettings] = useState<Settings | null>(null);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [heroFeatures, setHeroFeatures] = useState<FeatureItem[]>([]);
  const [mainFeatures, setMainFeatures] = useState<FeatureItem[]>([]);
  // Removed companyStats state (no longer used)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logger.debug("HomePage useEffect running", { cmsDisabled });

    const loadContent = async () => {
      // Optional dev escape hatch: force fallback content to preview local hero edits
      if (cmsDisabled) {
        logger.warn(
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
        logger.debug("🚀 Loading Contentful CMS content...");

        // Import CMS services dynamically
        const {
          fetchSettings,
          fetchPageContent,
          fetchTestimonials,
          fetchFeatureItems,
        } = await import("../services/cms");

        // Load all content from Contentful CMS
        const [
          contentfulSettings,
          contentfulPageContent,
          contentfulTestimonials,
          contentfulHeroFeatures,
          contentfulMainFeatures,
        ] = await Promise.allSettled([
          fetchSettings(),
          fetchPageContent("home"),
          fetchTestimonials(),
          fetchFeatureItems({ showOnHomepage: true }),
          fetchFeatureItems({ category: "why-choose-us" }),
        ]);

        logger.debug("📊 Contentful API Results:", {
          settings: contentfulSettings.status,
          pageContent: contentfulPageContent.status,
          testimonials: contentfulTestimonials.status,
          heroFeatures: contentfulHeroFeatures.status,
          mainFeatures: contentfulMainFeatures.status,
        });

        if (
          contentfulSettings.status === "fulfilled" &&
          contentfulSettings.value
        ) {
          setSettings(contentfulSettings.value);
          logger.debug("Contentful settings loaded", {
            settings: contentfulSettings.value,
          });
        }

        if (
          contentfulPageContent.status === "fulfilled" &&
          contentfulPageContent.value
        ) {
          setPageContent(contentfulPageContent.value);
          logger.debug("Contentful page content loaded", {
            pageContent: contentfulPageContent.value,
          });
          logger.debug("Hero title from Contentful", {
            heroTitle: contentfulPageContent.value.heroTitle,
          });
        } else {
          logger.debug("⚠️ FALLBACK: Using hardcoded hero content");
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
          logger.debug("Contentful testimonials loaded", {
            count: contentfulTestimonials.value.length,
          });
        }

        if (
          contentfulHeroFeatures.status === "fulfilled" &&
          contentfulHeroFeatures.value
        ) {
          setHeroFeatures(contentfulHeroFeatures.value);
          logger.debug("Contentful hero features loaded", {
            count: contentfulHeroFeatures.value.length,
          });
        }

        if (
          contentfulMainFeatures.status === "fulfilled" &&
          contentfulMainFeatures.value
        ) {
          setMainFeatures(contentfulMainFeatures.value);
          logger.debug("Contentful main features loaded", {
            count: contentfulMainFeatures.value.length,
          });
        }

        // Removed company stats logic

        logger.debug("🎉 All Contentful content loaded successfully!");
      } catch (error) {
        logger.error("❌ Failed to load Contentful content:", error);
        logger.debug("🔄 Using fallback content...");

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
  }, [cmsDisabled]);

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
      customerName: "Sarah Chen",
      review:
        "The support team was amazing throughout the entire process. Couldn't be happier!",
      rating: 5,
      productName: "Toronto, Canada",
    },
    {
      customerName: "Mike Rodriguez",
      review:
        "Best investment I've made for gaming. The performance is off the charts!",
      rating: 5,
      productName: "Austin, Texas",
    },
  ];

  const defaultMainFeatures = [
    {
      icon: "Zap",
      title: "Lightning Fast Performance",
      description:
        "Experience unparalleled speed with cutting-edge processors and lightning-fast SSDs.",
    },
    {
      icon: "Shield",
      title: "Built to Last",
      description:
        "Premium components and rigorous testing ensure your PC stands the test of time.",
    },
    {
      icon: "Users",
      title: "Expert Support",
      description:
        "Our dedicated team of experts is here to help you every step of the way.",
    },
  ];

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-black to-sky-950 animate-gradient"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-black to-black"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Hero Skeleton */}
          <HeroSkeleton />

          {/* Featured Builds Section Skeleton */}
          <section className="py-20 px-4">
            <div className="max-w-[1300px] mx-auto">
              <div className="text-center mb-12 space-y-4">
                <div className="h-12 w-64 bg-white/10 rounded mx-auto"></div>
                <div className="h-6 w-96 bg-white/10 rounded mx-auto"></div>
              </div>
              <GridSkeleton
                count={3}
                columns={3}
                SkeletonComponent={FeaturedBuildSkeleton}
              />
            </div>
          </section>

          {/* Features Section Skeleton */}
          <section className="py-20 px-4 bg-white/5">
            <div className="max-w-[1300px] mx-auto">
              <div className="text-center mb-12 space-y-4">
                <div className="h-12 w-48 bg-white/10 rounded mx-auto"></div>
                <div className="h-6 w-80 bg-white/10 rounded mx-auto"></div>
              </div>
              <GridSkeleton
                count={6}
                columns={3}
                SkeletonComponent={ProductCardSkeleton}
              />
            </div>
          </section>

          {/* Testimonials Section Skeleton */}
          <section className="py-20 px-4">
            <div className="max-w-[1300px] mx-auto">
              <div className="text-center mb-12 space-y-4">
                <div className="h-12 w-56 bg-white/10 rounded mx-auto"></div>
                <div className="h-6 w-72 bg-white/10 rounded mx-auto"></div>
              </div>
              <GridSkeleton
                count={3}
                columns={3}
                SkeletonComponent={TestimonialSkeleton}
              />
            </div>
          </section>
        </div>
      </div>
    );
  }
  const currentHeroFeatures =
    heroFeatures.length > 0 ? heroFeatures : defaultHeroFeatures;
  const currentTestimonials =
    testimonials.length > 0 ? testimonials : defaultTestimonials;
  const currentMainFeatures =
    mainFeatures.length > 0 ? mainFeatures : defaultMainFeatures;

  const getIconComponent = (iconName: string) => {
    type IconComponentType = typeof Zap;
    const iconMap: { [key: string]: IconComponentType } = {
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
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-sky-900/20 animate-gradient pointer-events-none"></div>
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 safe-px py-12 sm:py-16 pt-32 md:pt-36">
        {/* Hero background image */}
        <img
          src="/gaming-keyboard.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-20"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

        <div className="relative z-10 text-center max-w-[1300px] mx-auto px-4 sm:px-6 w-full mb-0 sm:mb-[100px]">
          <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 w-full px-2">
            <Badge className="bg-transparent border-sky-500/40 text-sky-400 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[9px] sm:text-xs md:text-sm lg:text-base font-normal flex flex-wrap items-center justify-center gap-1 sm:gap-2 animate-fade-in max-w-[calc(100%-16px)] sm:max-w-full text-center leading-snug">
              <Star
                className="fill-transparent stroke-yellow-500 border-yellow-500 flex-shrink-0"
                style={{ minWidth: "12px", width: "12px", height: "12px" }}
                strokeWidth={1.5}
              />
              <span className="text-center">
                {pageContent?.heroBadgeText ||
                  "Custom PCs built for speed, power, and precision"}
              </span>
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 break-words leading-tight px-2">
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              {pageContent?.heroTitle || "Build Your Dream PC with Vortex"}
            </span>
          </h1>

          <div className="mb-4 sm:mb-6">
            {/* Responsive subtitle with delivery promise */}
            <div className="flex flex-col items-center w-full">
              <span
                className="block text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 w-full max-w-xs sm:max-w-lg md:max-w-3xl lg:max-w-5xl px-2 sm:px-0 break-words text-center"
                style={{ wordBreak: "break-word", whiteSpace: "normal" }}
              >
                {pageContent?.heroSubtitle ||
                  "Custom PCs built for speed, power, and precision."}
              </span>
              <span
                className="block text-base sm:text-lg md:text-xl lg:text-2xl text-cyan-300 w-full max-w-xs sm:max-w-lg md:max-w-3xl lg:max-w-5xl px-2 sm:px-0 break-words mt-1 text-center"
                style={{ wordBreak: "break-word", whiteSpace: "normal" }}
              >
                Delivered within 5 days.
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-10 text-gray-400 max-w-5xl mx-auto animate-fade-in animation-delay-400 px-4 leading-relaxed">
            {pageContent?.heroDescription ||
              "Experience unparalleled performance with our cutting-edge custom PC builds. From budget-friendly builds to extreme gaming rigs, we deliver excellence in every component."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 md:mb-16 animate-fade-in animation-delay-600 px-4 max-w-[1300px] mx-auto">
            <Button
              onClick={() => navigate("pc-finder")}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base md:text-lg"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              Find Your Perfect PC
            </Button>
            <Button
              onClick={() => navigate("visual-configurator")}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base md:text-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/40 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30"
            >
              <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              3D Configurator
            </Button>
            <Button
              onClick={() => navigate("pc-builder")}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base md:text-lg"
            >
              <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Custom Builder
            </Button>
          </div>

          {/* Hero Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-[1300px] mx-auto px-4">
            {currentHeroFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-sky-500/10 animate-fade-in"
                style={{ animationDelay: `${800 + index * 200}ms` }}
              >
                <div className="p-4 sm:p-6 text-center">
                  {getIconComponent(feature.icon)}
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-sky-400">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                {pageContent?.featuresTitle || "Why Choose Vortex PCs?"}
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-5xl mx-auto px-4">
              {pageContent?.featuresDescription ||
                "We combine cutting-edge technology with expert craftsmanship to deliver the ultimate computing experience"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {currentMainFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="p-4 sm:p-6 text-center">
                  <div className="flex justify-center mb-3 sm:mb-4">
                    {getIconComponent(feature.icon)}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-white group-hover:text-sky-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                What Our Customers Say
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 px-4">
              Don't just take our word for it - hear from satisfied customers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {currentTestimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex mb-3 sm:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4 italic leading-relaxed">
                    "{testimonial.review}"
                  </p>
                  <div className="flex items-center">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full flex items-center justify-center mr-3">
                      <span className="text-black font-semibold text-sm sm:text-base">
                        {testimonial.customerName?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">
                        {testimonial.customerName || "User"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
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
        <div className="max-w-[1300px] mx-auto">
          <Card className="relative bg-gradient-to-br from-blue-950/50 to-sky-950/30 backdrop-blur-xl border-2 border-sky-500/30 hover:border-sky-400/50 transition-all duration-500 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.2)] hover:shadow-[0_0_70px_rgba(56,189,248,0.3)] group">
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

            {/* Content */}
            <div className="relative px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16 lg:px-16 lg:py-20 text-center">
              {/* Badge */}
              {pageContent?.ctaBadgeText && (
                <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
                  <Badge className="bg-sky-500/20 border border-sky-400/50 text-sky-300 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider">
                    {pageContent.ctaBadgeText}
                  </Badge>
                </div>
              )}

              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 text-white leading-tight px-2">
                {pageContent?.ctaTitle || "Ready to Build Your Dream PC?"}
              </h2>

              {/* Description */}
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 md:mb-12 max-w-5xl mx-auto leading-relaxed px-4">
                {pageContent?.ctaDescription ||
                  "Get started with our AI-powered PC finder or dive into our custom builder"}
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center items-center max-w-[1300px] mx-auto">
                <Button
                  onClick={() => navigate("pc-finder")}
                  variant="primary"
                  size="xl"
                  className="w-full sm:w-auto text-sm sm:text-base md:text-lg"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  Start PC Finder
                </Button>

                <Button
                  onClick={() => navigate("visual-configurator")}
                  size="xl"
                  className="w-full sm:w-auto text-sm sm:text-base md:text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                >
                  <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  3D Configurator
                </Button>

                <Button
                  onClick={() => navigate("pc-builder")}
                  variant="secondary"
                  size="xl"
                  className="w-full sm:w-auto text-sm sm:text-base md:text-lg"
                >
                  <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
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
