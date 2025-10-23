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
  CheckCircle,
  ArrowRight,
  Search,
} from "lucide-react";
import {
  type Settings,
  type Testimonial,
  type PCBuild,
  type FeatureItem,
  type CompanyStats,
  type PageContent,
} from "../services/cms";

interface HomePageProps {
  setCurrentView: (view: string) => void;
}

export function HomePage({ setCurrentView }: HomePageProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [featuredBuilds, setFeaturedBuilds] = useState<PCBuild[]>([]);
  const [heroFeatures, setHeroFeatures] = useState<FeatureItem[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const heroBackground = "https://vortexpcs.com/gaming-keyboard.jpeg";

  useEffect(() => {
    const loadContent = async () => {
      try {
        console.log("🚀 Loading Strapi CMS content...");

        // Import Strapi services dynamically
        const {
          fetchSettings,
          fetchPageContent,
          fetchTestimonials,
          fetchPCBuilds,
          fetchFeatureItems,
          fetchCompanyStats,
        } = await import("../services/cms");

        // Load all content from Strapi CMS
        const [
          strapiSettings,
          strapiPageContent,
          strapiTestimonials,
          strapiFeaturedBuilds,
          strapiHeroFeatures,
          strapiCompanyStats,
        ] = await Promise.allSettled([
          fetchSettings(),
          fetchPageContent("home"),
          fetchTestimonials(),
          fetchPCBuilds({ featured: true }),
          fetchFeatureItems({ showOnHomepage: true }),
          fetchCompanyStats(),
        ]);

        // Set data with proper fallbacks
        if (strapiSettings.status === "fulfilled" && strapiSettings.value) {
          setSettings(strapiSettings.value);
          console.log("✅ Strapi settings loaded:", strapiSettings.value);
        }

        if (
          strapiPageContent.status === "fulfilled" &&
          strapiPageContent.value
        ) {
          setPageContent(strapiPageContent.value);
          console.log(
            "✅ Strapi page content loaded:",
            strapiPageContent.value
          );
          console.log(
            "🎉 Hero title from Strapi:",
            strapiPageContent.value.heroTitle
          );
        } else {
          // TEMPORARY FIX: Hardcode the hero content to test the display path
          console.log("⚠️ TEMP FIX: Using hardcoded hero content");
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
          strapiTestimonials.status === "fulfilled" &&
          strapiTestimonials.value
        ) {
          setTestimonials(strapiTestimonials.value);
          console.log(
            "✅ Strapi testimonials loaded:",
            strapiTestimonials.value
          );
        }

        if (
          strapiFeaturedBuilds.status === "fulfilled" &&
          strapiFeaturedBuilds.value
        ) {
          setFeaturedBuilds(strapiFeaturedBuilds.value);
          console.log(
            "✅ Strapi featured builds loaded:",
            strapiFeaturedBuilds.value
          );
        }

        if (
          strapiHeroFeatures.status === "fulfilled" &&
          strapiHeroFeatures.value
        ) {
          setHeroFeatures(strapiHeroFeatures.value);
          console.log(
            "✅ Strapi hero features loaded:",
            strapiHeroFeatures.value
          );
        }

        if (
          strapiCompanyStats.status === "fulfilled" &&
          strapiCompanyStats.value
        ) {
          setCompanyStats(strapiCompanyStats.value);
          console.log(
            "✅ Strapi company stats loaded:",
            strapiCompanyStats.value
          );
        }

        console.log("🎉 All Strapi content loaded successfully!");
      } catch (error) {
        console.error("❌ Failed to load Strapi content:", error);
        console.log("🔄 Using fallback content...");

        // Fallback data when Strapi is unavailable
        setSettings({
          id: 1,
          siteName: "Vortex PCs Ltd",
          tagline: "Custom PCs Built to Order",
          metaDescription:
            "Premium custom PC builds for any use delivered within 5 days",
          contactEmail: "info@vortexpcs.com",
          contactPhone: "01603 975440",
          enableMaintenance: false,
          enableAnnouncementBar: false,
        });

        setCompanyStats({
          id: 1,
          yearsExperience: 9,
          customersServed: 150,
          pcBuildsCompleted: 300,
          warrantyYears: 1,
          supportResponseTime: "24 hours",
          satisfactionRate: 98,
          partsInStock: 1000,
        });

        // Set empty arrays for other content
        setPageContent(null);
        setTestimonials([]);
        setFeaturedBuilds([]);
        setHeroFeatures([]);
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
          <div className="w-16 h-16 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  // Map icon names to actual icon components
  const iconMap: Record<string, any> = {
    Zap,
    Shield,
    Users,
    CheckCircle,
    Settings: SettingsIcon,
    Wrench,
    Star,
    ArrowRight,
  };

  // Get features with fallback to hardcoded data
  const displayFeatures =
    heroFeatures.length > 0
      ? heroFeatures.map((feature) => ({
          icon: iconMap[feature.icon] || Star,
          title: feature.title,
          description: feature.description,
          color: feature.highlighted
            ? "from-sky-500 to-blue-500"
            : "from-gray-500 to-gray-600",
        }))
      : [
          {
            icon: Zap,
            title: "5-Day Build Time",
            description:
              "Express service with your custom PC built and tested within 5 working days.",
            color: "from-yellow-500 to-orange-500",
          },
          {
            icon: Shield,
            title: "3-Year Warranty",
            description:
              "Industry-leading coverage on all components with comprehensive support.",
            color: "from-sky-500 to-blue-500",
          },
          {
            icon: Users,
            title: "Expert Consultation",
            description:
              "Work directly with experienced PC builders to design your perfect system.",
            color: "from-purple-500 to-pink-500",
          },
          {
            icon: CheckCircle,
            title: "Quality Assurance",
            description:
              "Rigorous testing and burn-in process ensures reliability and performance.",
            color: "from-green-500 to-emerald-500",
          },
        ];

  const services = [
    {
      icon: SettingsIcon,
      title: "Custom PC Builder",
      description:
        "Design your dream PC with our intelligent component selector and compatibility checker.",
      action: "Start Building",
      view: "pc-builder",
      gradient: "from-sky-500/20 to-blue-500/20",
      iconColor: "text-sky-400",
    },
    {
      icon: Search,
      title: "PC Finder",
      description:
        "Answer a few questions and get personalized PC recommendations matched to your needs.",
      action: "Find Your PC",
      view: "pc-finder",
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: Wrench,
      title: "Repair Service",
      description:
        "UK-wide collect & return PC repair service from certified technicians.",
      action: "Learn More",
      view: "repair",
      gradient: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBackground})` }}
          ></div>
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-blue-500/20 z-10"></div>
        </div>

        {/* Content */}
        <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-4">
              <p className="text-lg sm:text-xl text-gray-300 font-light leading-relaxed">
                {pageContent?.heroSubtitle ||
                  settings?.tagline ||
                  "Premium Custom PC Builds"}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                {pageContent?.heroTitle || "Build Your Dream PC with Vortex"}
              </h1>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed mb-8">
                {pageContent?.heroDescription ||
                  "Experience unparalleled performance with our cutting-edge custom PC builds. From budget-friendly builds to extreme gaming rigs, we've got you covered."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => setCurrentView("pc-builder")}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
              >
                <SettingsIcon className="w-5 h-5 mr-2" />
                Build Your PC
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView("pc-finder")}
                className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/60"
              >
                <Search className="w-5 h-5 mr-2" />
                Find My Perfect PC
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-sky-400" />
                </div>
                <div className="text-left">
                  <div className="text-white">3-Year Warranty</div>
                  <div className="text-sm text-gray-400">Industry Leading</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-sky-400" />
                </div>
                <div className="text-left">
                  <div className="text-white">5-Day Build</div>
                  <div className="text-sm text-gray-400">Express Service</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center">
                  <Star className="w-6 h-6 text-sky-400" />
                </div>
                <div className="text-left">
                  <div className="text-white">Premium Parts</div>
                  <div className="text-sm text-gray-400">Top Brands Only</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="w-6 h-10 border-2 border-sky-400/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-sky-400 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Featured Builds */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-4">
              Configuration Examples
            </Badge>
            <h2 className="text-white mb-4">Custom Build Inspiration</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Expert-recommended specifications designed for specific use cases.
              All built to order and fully customisable to your requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBuilds.map((build) => (
              <Card
                key={build.id}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 group overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                  <img
                    src={build.images?.[0] || "/placeholder-pc.jpg"}
                    alt={build.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {build.featured && (
                    <Badge className="absolute top-4 right-4 z-20 bg-sky-500 border-0 text-white">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-white mb-1">{build.name}</h3>
                    <p className="text-sm text-gray-400">{build.description}</p>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(build.components)
                      .filter(([_, value]) => value)
                      .slice(0, 4)
                      .map(([, value], index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-300"
                        >
                          <CheckCircle className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                          <span>{value}</span>
                        </div>
                      ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <div className="text-sm text-gray-400">Starting from</div>
                      <div className="text-white">{build.price}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setCurrentView("pc-builder")}
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                    >
                      Customise
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-4">
              Why Choose Vortex
            </Badge>
            <h2 className="text-white mb-4">Premium Service Guaranteed</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We deliver excellence at every stage, from consultation to
              after-sales support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 group p-8 text-center"
              >
                <div className="mb-6">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${feature.color} opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-24 relative bg-gradient-to-b from-white/5 to-transparent">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-4">
              Our Track Record
            </Badge>
            <h2 className="text-white mb-4">Trusted by Thousands</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Years of experience delivering premium custom PC builds and
              exceptional customer service.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {companyStats?.yearsExperience || 9}+
              </div>
              <div className="text-sky-400 font-medium">
                Years Experience [CUSTOM]
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {companyStats?.customersServed || 150}+
              </div>
              <div className="text-sky-400 font-medium">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {companyStats?.pcBuildsCompleted || 300}+
              </div>
              <div className="text-sky-400 font-medium">PCs Built</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {companyStats?.satisfactionRate || 98}%
              </div>
              <div className="text-sky-400 font-medium">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-4">
              Our Services
            </Badge>
            <h2 className="text-white mb-4">How We Can Help</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 group p-8"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} border border-white/10 flex items-center justify-center mb-6`}
                >
                  <service.icon className={`w-8 h-8 ${service.iconColor}`} />
                </div>
                <h3 className="text-white mb-3">{service.title}</h3>
                <p className="text-sm text-gray-400 mb-6">
                  {service.description}
                </p>
                <Button
                  onClick={() => setCurrentView(service.view)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/30 text-white"
                >
                  {service.action}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative bg-gradient-to-b from-white/5 to-transparent">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-4">
              Testimonials
            </Badge>
            <h2 className="text-white mb-4">What Our Customers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">
                  "{testimonial.review}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.customerImage || "/placeholder-avatar.jpg"}
                    alt={testimonial.customerName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-white">{testimonial.customerName}</div>
                    <div className="text-sm text-gray-400">Customer</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-sky-500/30 p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-blue-500/10"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-white mb-4">Ready to Build Your Dream PC?</h2>
              <p className="text-gray-300 mb-8">
                Start your journey with Vortex today. Our expert team is ready
                to help you create the perfect system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => setCurrentView("pc-builder")}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50"
                >
                  <SettingsIcon className="w-5 h-5 mr-2" />
                  Start Building
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setCurrentView("contact")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Contact Us
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
