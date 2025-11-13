/**
 * Business Solutions Page
 * Pre-configured workstations and service packages for small businesses
 */

import { useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Building2,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Shield,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HeadphonesIcon,
  Settings,
  TrendingUp,
  Award,
  Wrench,
  MessageSquare,
  Calendar,
} from "lucide-react";

interface BusinessSolutionsProps {
  setCurrentView: (view: string) => void;
}

interface WorkstationConfig {
  id: string;
  name: string;
  tagline: string;
  price: number;
  image: string;
  recommended?: boolean;
  specs: {
    processor: string;
    ram: string;
    storage: string;
    graphics: string;
    warranty: string;
  };
  features: string[];
  idealFor: string[];
  performance: {
    office: number;
    creative: number;
    data: number;
  };
}

interface ServiceTier {
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
  popular?: boolean;
  tagline: string;
  features: string[];
  responseTime: string;
  icon: ReactNode;
  savings?: string;
}

export function BusinessSolutions({ setCurrentView }: BusinessSolutionsProps) {
  const [_selectedWorkstation, setSelectedWorkstation] = useState<
    string | null
  >(null);
  const [_selectedService, setSelectedService] = useState<string | null>(null);

  const workstations: WorkstationConfig[] = [
    {
      id: "essential-office",
      name: "Essential Office",
      tagline: "Perfect for everyday business tasks",
      price: 599,
      image: "💼",
      specs: {
        processor: "Intel Core i5-13400 (10-Core)",
        ram: "16GB DDR4 3200MHz",
        storage: "512GB NVMe SSD",
        graphics: "Intel UHD Graphics 730",
        warranty: "3-Year Business Warranty",
      },
      features: [
        "Microsoft Office ready",
        "Multi-monitor support (up to 3 displays)",
        "Quiet operation for office environments",
        "Energy efficient design",
        "Tool-less chassis for easy upgrades",
      ],
      idealFor: [
        "Email & web browsing",
        "Office productivity",
        "Video conferencing",
        "Document management",
      ],
      performance: {
        office: 95,
        creative: 45,
        data: 50,
      },
    },
    {
      id: "productivity-pro",
      name: "Productivity Pro",
      tagline: "Enhanced performance for demanding workflows",
      price: 899,
      image: "⚡",
      recommended: true,
      specs: {
        processor: "Intel Core i7-13700 (16-Core)",
        ram: "32GB DDR4 3200MHz",
        storage: "1TB NVMe SSD",
        graphics: "NVIDIA T400 4GB",
        warranty: "3-Year Business Warranty",
      },
      features: [
        "Accelerated multitasking",
        "Professional graphics for CAD/Design",
        "Dual drive bays for expansion",
        "Advanced cooling system",
        "Remote management capable",
      ],
      idealFor: [
        "Advanced spreadsheets",
        "Light CAD work",
        "Photo editing",
        "Database management",
      ],
      performance: {
        office: 100,
        creative: 75,
        data: 80,
      },
    },
    {
      id: "creative-powerhouse",
      name: "Creative Powerhouse",
      tagline: "Built for design, media, and content creation",
      price: 1399,
      image: "🎨",
      specs: {
        processor: "AMD Ryzen 9 7900X (12-Core)",
        ram: "64GB DDR5 5600MHz",
        storage: "2TB NVMe SSD",
        graphics: "NVIDIA RTX 4060 8GB",
        warranty: "3-Year Business Warranty",
      },
      features: [
        "Colour-accurate workflow support",
        "Hardware-accelerated rendering",
        "Massive storage for projects",
        "Quiet precision cooling",
        "Thunderbolt 4 connectivity",
      ],
      idealFor: [
        "Video editing (4K)",
        "3D modeling & rendering",
        "Graphic design",
        "Photography workflows",
      ],
      performance: {
        office: 100,
        creative: 95,
        data: 85,
      },
    },
    {
      id: "data-cruncher",
      name: "Data Cruncher",
      tagline: "Engineered for analytics and processing",
      price: 1199,
      image: "📊",
      specs: {
        processor: "AMD Ryzen 9 7950X (16-Core)",
        ram: "64GB DDR5 5600MHz",
        storage: "1TB NVMe SSD + 4TB HDD",
        graphics: "NVIDIA T1000 8GB",
        warranty: "3-Year Business Warranty",
      },
      features: [
        "High core count for parallel processing",
        "ECC memory option available",
        "Massive data storage capacity",
        "Virtualization ready",
        "RAID configuration support",
      ],
      idealFor: [
        "Data analysis & BI",
        "Financial modeling",
        "Scientific computing",
        "Virtual machines",
      ],
      performance: {
        office: 100,
        creative: 70,
        data: 100,
      },
    },
    {
      id: "engineering-station",
      name: "Engineering Station",
      tagline: "Professional workstation for engineering",
      price: 1899,
      image: "🔧",
      specs: {
        processor: "Intel Xeon W-2245 (8-Core)",
        ram: "128GB DDR4 ECC",
        storage: "2TB NVMe SSD + 2TB HDD",
        graphics: "NVIDIA RTX A2000 12GB",
        warranty: "5-Year Business Warranty",
      },
      features: [
        "ISV certified for CAD applications",
        "Error-correcting memory",
        "Professional GPU for precision",
        "Tool-free serviceability",
        "24/7 reliability rated",
      ],
      idealFor: [
        "CAD/CAM/CAE",
        "Simulation & analysis",
        "BIM workflows",
        "Complex assemblies",
      ],
      performance: {
        office: 100,
        creative: 90,
        data: 95,
      },
    },
    {
      id: "enterprise-elite",
      name: "Enterprise Elite",
      tagline: "Ultimate performance for critical workloads",
      price: 2799,
      image: "👑",
      specs: {
        processor: "AMD Threadripper PRO 5965WX (24-Core)",
        ram: "256GB DDR4 ECC",
        storage: "4TB NVMe SSD (RAID 0) + 8TB HDD",
        graphics: "NVIDIA RTX A4000 16GB",
        warranty: "5-Year Business Warranty",
      },
      features: [
        "Extreme multi-threaded performance",
        "Professional visualisation",
        "Enterprise-grade reliability",
        "Advanced security features",
        "Dedicated support line",
      ],
      idealFor: [
        "Server-level workloads",
        "AI/ML development",
        "Advanced rendering",
        "Mission-critical applications",
      ],
      performance: {
        office: 100,
        creative: 100,
        data: 100,
      },
    },
  ];

  const serviceTiers: ServiceTier[] = [
    {
      id: "essential-care",
      name: "Essential Care",
      price: 299,
      billing: "annual",
      tagline: "Annual maintenance for peace of mind",
      responseTime: "48-72 hours",
      icon: <Shield className="h-8 w-8" />,
      features: [
        "Annual on-site health check",
        "Hardware diagnostics & cleaning",
        "Software updates & security patches",
        "Performance optimisation",
        "Email support (business hours)",
        "Remote assistance available",
        "Health report & recommendations",
        "10% discount on repairs",
      ],
    },
    {
      id: "priority-support",
      name: "Priority Support",
      price: 49,
      billing: "monthly",
      popular: true,
      tagline: "Proactive care with priority response",
      responseTime: "4-8 hours",
      savings: "Save £289/year vs Essential",
      icon: <Zap className="h-8 w-8" />,
      features: [
        "Quarterly on-site maintenance",
        "Priority ticket queue",
        "Phone & email support (extended hours)",
        "Remote monitoring & alerts",
        "Proactive issue detection",
        "Same-day remote fixes",
        "Free hardware loan during repairs",
        "20% discount on upgrades & parts",
        "Dedicated account manager",
      ],
    },
    {
      id: "business-premium",
      name: "Business Premium",
      price: 99,
      billing: "monthly",
      tagline: "Complete coverage with guaranteed uptime",
      responseTime: "2-4 hours",
      savings: "Includes £500 protection coverage",
      icon: <Award className="h-8 w-8" />,
      features: [
        "Monthly on-site visits",
        "24/7 emergency support hotline",
        "Next business day on-site repairs",
        "Advanced hardware replacement",
        "Free annual upgrades (up to £200)",
        "Business continuity planning",
        "Data backup consultation",
        "Cybersecurity health checks",
        "30% discount on all parts & labour",
        "VIP direct support line",
        "Guaranteed 99% uptime SLA",
      ],
    },
  ];

  const handleAddToCart = (workstation: WorkstationConfig) => {
    setSelectedWorkstation(workstation.id);
    // Add to cart logic here
  };

  const handleSelectService = (tier: ServiceTier) => {
    setSelectedService(tier.id);
    // Service selection logic here
  };

  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <Badge className="bg-sky-500/20 border-sky-500 text-white px-6 py-2 text-sm mb-6 font-semibold">
            <Building2 className="w-4 h-4 inline mr-2" />
            Business Solutions
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Power Your Business
            </span>
            <br />
            <span className="text-white">With Professional Workstations</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Pre-configured workstations designed for productivity, backed by
            comprehensive support packages to keep your business running
            smoothly.
          </p>

          <div className="flex flex-wrap gap-8 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>3-5 Year Warranties</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Business-Grade Components</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Volume Discounts Available</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Expert UK Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workstations Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pre-Configured{" "}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                Workstations
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Expertly configured systems ready to deploy. Each workstation is
              optimised for stability, performance, and business reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workstations.map((workstation) => (
              <Card
                key={workstation.id}
                className={`group bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/50 transition-all duration-300 overflow-hidden relative ${
                  workstation.recommended ? "ring-2 ring-sky-500/50" : ""
                }`}
              >
                {workstation.recommended && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    RECOMMENDED
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">{workstation.image}</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {workstation.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {workstation.tagline}
                    </p>
                    <div className="text-3xl font-bold text-sky-400">
                      £{workstation.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm">
                      <Cpu className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        {workstation.specs.processor}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        {workstation.specs.ram}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <HardDrive className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        {workstation.specs.storage}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Monitor className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        {workstation.specs.graphics}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        {workstation.specs.warranty}
                      </span>
                    </div>
                  </div>

                  {/* Performance Bars */}
                  <div className="space-y-2 mb-6">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Office Tasks</span>
                        <span>{workstation.performance.office}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                          style={{
                            width: `${workstation.performance.office}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Creative Work</span>
                        <span>{workstation.performance.creative}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                          style={{
                            width: `${workstation.performance.creative}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Data Processing</span>
                        <span>{workstation.performance.data}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-blue-400"
                          style={{ width: `${workstation.performance.data}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Ideal For */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                      Ideal For:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {workstation.idealFor.map((use, idx) => (
                        <Badge
                          key={idx}
                          className="bg-sky-500/10 border-sky-500/30 text-sky-400 text-xs"
                        >
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => handleAddToCart(workstation)}
                    className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
                  >
                    Request Quote
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Features (Expandable) */}
                  <details className="mt-4">
                    <summary className="text-sm text-sky-400 cursor-pointer hover:text-sky-300">
                      View all features
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {workstation.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-400"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </Card>
            ))}
          </div>

          {/* Volume Discount CTA */}
          <Card className="mt-12 bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/30 p-8 text-center">
            <Users className="w-12 h-12 text-sky-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              Need Multiple Workstations?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get volume discounts on orders of 5+ workstations. We'll work with
              you to configure the perfect fleet for your business needs.
            </p>
            <Button
              onClick={() => setCurrentView("contact")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Sales Team
            </Button>
          </Card>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Business{" "}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                Support Packages
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Keep your business running smoothly with proactive maintenance and
              priority support. Choose the service level that matches your
              needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {serviceTiers.map((tier) => (
              <Card
                key={tier.id}
                className={`group bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/50 transition-all duration-300 relative ${
                  tier.popular ? "ring-2 ring-sky-500 scale-105" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-1 text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="text-sky-400 mb-4">{tier.icon}</div>

                  {/* Header */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">{tier.tagline}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        £{tier.price}
                      </span>
                      <span className="text-gray-400">
                        /{tier.billing === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    {tier.savings && (
                      <p className="text-sm text-green-400 mt-2">
                        {tier.savings}
                      </p>
                    )}
                  </div>

                  {/* Response Time */}
                  <div className="flex items-center gap-2 mb-6 p-3 bg-sky-500/10 rounded-lg border border-sky-500/20">
                    <Clock className="w-5 h-5 text-sky-400" />
                    <div>
                      <div className="text-xs text-gray-400">Response Time</div>
                      <div className="text-sm font-semibold text-white">
                        {tier.responseTime}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => handleSelectService(tier)}
                    className={`w-full ${
                      tier.popular
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                        : "bg-white/10 hover:bg-white/20 border border-white/20"
                    }`}
                  >
                    {tier.billing === "monthly"
                      ? "Subscribe Now"
                      : "Purchase Annual Plan"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 text-center">
              <Calendar className="w-8 h-8 text-sky-400 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Flexible Scheduling</h4>
              <p className="text-sm text-gray-400">
                Choose maintenance windows that work for your business hours
              </p>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 text-center">
              <HeadphonesIcon className="w-8 h-8 text-sky-400 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">UK-Based Support</h4>
              <p className="text-sm text-gray-400">
                All support handled by our expert technicians based in the UK
              </p>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 text-center">
              <Wrench className="w-8 h-8 text-sky-400 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">On-Site Service</h4>
              <p className="text-sm text-gray-400">
                We come to you - minimal disruption to your operations
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Businesses{" "}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                Choose Vortex
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <TrendingUp className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Proven Reliability</h3>
              <p className="text-sm text-gray-400">
                Business-grade components tested for 24/7 operation and
                long-term stability
              </p>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <Settings className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Easy Serviceability</h3>
              <p className="text-sm text-gray-400">
                Tool-less designs and modular components for quick repairs and
                upgrades
              </p>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <Shield className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Extended Warranties</h3>
              <p className="text-sm text-gray-400">
                Up to 5-year warranties included, with optional extensions
                available
              </p>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <Users className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Dedicated Support</h3>
              <p className="text-sm text-gray-400">
                Account managers who understand your business and technical
                needs
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Upgrade Your{" "}
            <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              Business Technology?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's discuss your requirements and create a custom solution that
            fits your business perfectly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setCurrentView("contact")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-lg px-8 py-6"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Schedule Consultation
            </Button>
            <Button
              onClick={() => setCurrentView("pc-builder")}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-lg px-8 py-6"
            >
              <Settings className="w-5 h-5 mr-2" />
              Build Custom Configuration
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
