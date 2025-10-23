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
    // TEMPORARY: Force hardcoded content for Vercel testing
    console.log("🚀 VERCEL TEST: Using hardcoded hero content");
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
    // Note: All Strapi CMS logic temporarily disabled for Vercel testing
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
      name: "Alex Thompson",
      review:
        "Absolutely incredible build quality! My gaming performance has never been better.",
      rating: 5,
      location: "London, UK",
    },
    {
      name: "Sarah Mitchell",
      review:
        "Professional service from start to finish. The team really knows their stuff.",
      rating: 5,
      location: "Manchester, UK",
    },
    {
      name: "James Wilson",
      review:
        "Best investment I've made for my streaming setup. Handles everything flawlessly.",
      rating: 5,
      location: "Birmingham, UK",
    },
  ];

  const defaultFeaturedBuilds = [
    {
      name: "Gaming Beast",
      description: "Ultimate 4K gaming powerhouse",
      price: "£2,499",
      specs: {
        cpu: "Intel i7-13700K",
        gpu: "RTX 4080 Super",
        ram: "32GB DDR5",
        storage: "1TB NVMe SSD",
      },
      image: "https://vortexpcs.com/gaming-pc.jpg",
    },
    {
      name: "Workstation Pro",
      description: "Professional content creation",
      price: "£3,299",
      specs: {
        cpu: "Intel i9-13900K",
        gpu: "RTX 4090",
        ram: "64GB DDR5",
        storage: "2TB NVMe SSD",
      },
      image: "https://vortexpcs.com/workstation-pc.jpg",
    },
  ];

  const currentHeroFeatures = heroFeatures.length > 0 ? heroFeatures : defaultHeroFeatures;
  const currentTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;
  const currentFeaturedBuilds = featuredBuilds.length > 0 ? featuredBuilds : defaultFeaturedBuilds;

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Zap,
      Shield,
      Users,
      Settings: SettingsIcon,
      Wrench,
    };
    const IconComponent = iconMap[iconName] || Zap;
    return <IconComponent className="h-8 w-8 mb-4 text-sky-400" />;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-sky-900/20 animate-gradient"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroBackground})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-float">
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              {pageContent?.heroTitle || "Build Your Dream PC with Vortex"}
            </span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl mb-8 text-gray-300 max-w-4xl mx-auto animate-float animation-delay-200">
            {pageContent?.heroSubtitle || "Custom PCs built for speed, power, and precision."}
          </p>

          <p className="text-lg sm:text-xl mb-12 text-gray-400 max-w-3xl mx-auto animate-fade-in animation-delay-400">
            {pageContent?.heroDescription ||
              "Experience unparalleled performance with our cutting-edge custom PC builds. From budget-friendly builds to extreme gaming rigs, we deliver excellence in every component."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in animation-delay-600">
            <Button
              onClick={() => setCurrentView("pc-finder")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-sky-500/25"
            >
              <Search className="mr-2 h-5 w-5" />
              Find Your Perfect PC
            </Button>
            <Button
              onClick={() => setCurrentView("pc-builder")}
              variant="outline"
              className="border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <SettingsIcon className="mr-2 h-5 w-5" />
              Custom Builder
            </Button>
          </div>

          {/* Hero Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
                Why Choose Vortex PCs?
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We combine cutting-edge technology with expert craftsmanship to deliver
              the ultimate computing experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Quality Guaranteed",
                description:
                  "Every component is carefully selected and tested for optimal performance and reliability.",
              },
              {
                icon: Wrench,
                title: "Expert Assembly",
                description:
                  "Our certified technicians ensure every build meets the highest standards.",
              },
              {
                icon: Shield,
                title: "Comprehensive Warranty",
                description:
                  "All builds come with full warranty coverage and dedicated technical support.",
              },
              {
                icon: Zap,
                title: "Maximum Performance",
                description:
                  "Optimized configurations to get the most out of every component.",
              },
              {
                icon: Users,
                title: "Personal Service",
                description:
                  "One-on-one consultation to ensure your PC meets your exact needs.",
              },
              {
                icon: SettingsIcon,
                title: "Custom Solutions",
                description:
                  "Tailored builds for gaming, content creation, and professional workloads.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="p-6">
                  <feature.icon className="h-10 w-10 mb-4 text-sky-400 group-hover:text-cyan-400 transition-colors" />
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

      {/* Featured Builds Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                Featured Builds
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Discover our most popular configurations, carefully crafted for different
              use cases
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {currentFeaturedBuilds.map((build, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 group overflow-hidden"
              >
                <div className="aspect-video bg-gradient-to-br from-sky-900/30 to-blue-900/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-cyan-400/20"></div>
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
                      Featured
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-sky-400 transition-colors">
                      {build.name}
                    </h3>
                    <span className="text-2xl font-bold text-sky-400">
                      {build.price}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-6">{build.description}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">CPU:</span>
                      <span className="text-white">{build.specs.cpu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GPU:</span>
                      <span className="text-white">{build.specs.gpu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RAM:</span>
                      <span className="text-white">{build.specs.ram}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage:</span>
                      <span className="text-white">{build.specs.storage}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCurrentView("pc-builder")}
                    className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
                  >
                    Customize This Build
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => setCurrentView("pc-finder")}
              variant="outline"
              className="border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-white px-8 py-3 text-lg"
            >
              View All Builds
            </Button>
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
                  <p className="text-gray-300 mb-4 italic">"{testimonial.review}"</p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full flex items-center justify-center mr-3">
                      <span className="text-black font-semibold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 backdrop-blur-xl border border-sky-500/20 rounded-2xl p-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                Ready to Build?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Let's create the perfect PC for your needs. Whether you're gaming,
              creating content, or need a powerful workstation, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setCurrentView("pc-finder")}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Start Building Now
              </Button>
              <Button
                onClick={() => setCurrentView("contact")}
                variant="outline"
                className="border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-white px-8 py-4 text-lg"
              >
                Get Expert Advice
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}