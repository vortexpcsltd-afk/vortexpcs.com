import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { PCFinder } from "./components/PCFinder";
import { PCBuilder } from "./components/PCBuilder";
import { MemberArea } from "./components/MemberArea";
import { AdminPanel } from "./components/AdminPanel";
import { RepairService } from "./components/RepairService";
import { AboutUs } from "./components/AboutUs";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { LoginDialog } from "./components/LoginDialog";
import { ShoppingCartModal } from "./components/ShoppingCartModal";
import {
  Cpu,
  Shield,
  Clock,
  Users,
  Settings,
  MessageCircle,
  Wrench,
  Star,
  ArrowRight,
  Menu,
  X,
  User,
  ShoppingCart as ShoppingCartIcon,
  Search,
  LogIn,
  UserPlus,
  Info,
  Phone,
} from "lucide-react";

interface RecommendedBuild {
  budget?: number;
  useCase?: string;
  [key: string]: any;
}

const vortexLogo = "/vortexpcs-logo.png";
<img src={vortexLogo} alt="Vortex PCs" />;
const heroBackground = "/gaming-keyboard.jpeg";

// HomePage Component
function HomePage({
  setCurrentView,
}: {
  setCurrentView: (view: string) => void;
}) {
  const features = [
    {
      icon: Cpu,
      title: "Premium Components",
      description: "Only the highest quality components from trusted brands",
      color: "from-sky-500 to-cyan-500",
    },
    {
      icon: Clock,
      title: "5-Day Build Time",
      description: "Your custom PC built and tested within 5 working days",
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: Shield,
      title: "3-Year Warranty",
      description: "Comprehensive warranty covering all components and labour",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Expert Support",
      description:
        "Dedicated support team with decades of PC building experience",
      color: "from-orange-500 to-red-500",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Gaming Enthusiast",
      content:
        "Absolutely incredible build quality. My gaming PC runs everything on ultra settings flawlessly!",
      rating: 5,
      avatar: "SJ",
    },
    {
      name: "Mike Chen",
      role: "Content Creator",
      content:
        "The workstation build exceeded my expectations. Render times are lightning fast!",
      rating: 5,
      avatar: "MC",
    },
    {
      name: "Emma Williams",
      role: "Software Developer",
      content:
        "Perfect development machine. The support team helped me choose the ideal specs.",
      rating: 5,
      avatar: "EW",
    },
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-32">
        {/* Hero background effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* RGB Keyboard Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: `url(${heroBackground})` }}
          ></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Premium badge */}
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-cyan-500/10 border border-sky-500/30 mb-12 backdrop-blur-xl shadow-2xl shadow-sky-500/20 hover:shadow-sky-500/40 transition-all duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Star className="w-5 h-5 text-yellow-400 mr-3 animate-pulse relative z-10" />
              <span className="text-sm font-medium bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent relative z-10">
                Premium Custom PC Builds
              </span>
            </div>

            {/* Main heading with enhanced gradient */}
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="inline-block bg-gradient-to-r from-white via-sky-200 to-blue-300 bg-clip-text text-transparent animate-gradient">
                Built to Perfection
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience ultimate performance with our custom-built PCs. Premium
              components, expert craftsmanship, and comprehensive warranty - all
              delivered in just 5 days.
            </p>

            {/* Enhanced CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                onClick={() => setCurrentView("pc-finder")}
                className="relative bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-10 py-6 rounded-2xl text-lg shadow-2xl shadow-sky-500/50 hover:shadow-sky-500/80 transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                <div className="relative z-10 flex items-center">
                  <Search className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  Find Your Perfect PC
                </div>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView("pc-builder")}
                className="relative border-2 border-sky-500/30 bg-sky-500/5 backdrop-blur-xl text-white hover:bg-sky-500/10 hover:border-sky-400/50 px-10 py-6 rounded-2xl text-lg shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex items-center">
                  <Settings className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
                  Custom Build
                </div>
              </Button>
            </div>

            {/* Stats badges */}
            <div className="grid grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto">
              {[
                { label: "5-Day Builds", icon: Clock },
                { label: "3-Year Warranty", icon: Shield },
                { label: "Premium Parts", icon: Cpu },
              ].map((stat, i) => (
                <div key={i} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                    <stat.icon className="w-6 h-6 text-sky-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-300">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced floating elements */}
        <div className="absolute top-40 -left-20 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-60 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm uppercase tracking-wider text-sky-400 font-medium">
                Our Advantages
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
              Why Choose Vortex PCs?
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto">
              We're not just another PC builder. We're craftsmen dedicated to
              delivering the ultimate computing experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="relative group">
                {/* Animated RGB border glow - always visible */}
                <div className="absolute -inset-[2px] bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 rounded-lg opacity-50 group-hover:opacity-100 blur-md transition-all duration-500 animate-gradient"></div>

                {/* Solid RGB border */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 rounded-lg opacity-60 group-hover:opacity-100 transition-all duration-500 animate-gradient"></div>

                {/* Glass morphism card */}
                <Card className="relative bg-slate-900/90 backdrop-blur-xl border-0 p-6 hover:bg-slate-900/95 transition-all duration-500">
                  <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-sky-400" />
                  </div>
                  <h3 className="mb-2 text-white">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm uppercase tracking-wider text-sky-400 font-medium">
                Testimonials
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
              What Our Customers Say
            </h2>
            <p className="text-gray-400 text-xl">
              Join thousands of satisfied customers worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="relative group">
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 rounded-3xl"></div>

                <Card className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-2xl p-8 hover:border-sky-500/50 transition-all duration-500 group-hover:translate-y-[-4px] shadow-xl hover:shadow-2xl hover:shadow-sky-500/20 rounded-3xl">
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>

                  <div className="flex items-center mb-6">
                    <Avatar className="w-14 h-14 mr-4 ring-2 ring-sky-500/30 ring-offset-2 ring-offset-transparent">
                      <AvatarFallback className="bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-white text-lg">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-sky-400">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="flex mb-6 gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-lg"
                      />
                    ))}
                  </div>

                  <p className="text-gray-300 leading-relaxed text-lg">
                    "{testimonial.content}"
                  </p>

                  {/* Quote mark decoration */}
                  <div className="absolute top-6 right-6 text-6xl text-sky-500/10 font-serif leading-none">
                    "
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="relative group">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-600/30 via-blue-600/30 to-cyan-600/30 blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 rounded-3xl"></div>

            <Card className="relative bg-gradient-to-br from-sky-600/10 via-blue-600/10 to-cyan-600/10 border-2 border-sky-500/30 backdrop-blur-2xl p-16 text-center overflow-hidden rounded-3xl shadow-2xl">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="inline-block mb-6">
                  <div className="px-6 py-2 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/30 backdrop-blur-xl">
                    <span className="text-sm uppercase tracking-wider text-sky-300 font-medium">
                      Get Started Today
                    </span>
                  </div>
                </div>

                <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                  Ready to Build Your Dream PC?
                </h2>

                <p className="text-gray-300 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                  Get started with our AI-powered PC finder or dive into our
                  custom builder
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button
                    size="lg"
                    onClick={() => setCurrentView("pc-finder")}
                    className="relative bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-10 py-6 rounded-2xl shadow-2xl shadow-sky-500/50 hover:shadow-sky-500/80 transition-all duration-300 group/btn overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex items-center text-lg">
                      <Search className="w-5 h-5 mr-3" />
                      Start PC Finder
                      <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </Button>

                  <Button
                    size="lg"
                    onClick={() => setCurrentView("pc-builder")}
                    className="relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-10 py-6 rounded-2xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/80 transition-all duration-300 group/btn overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex items-center text-lg">
                      <Settings className="w-5 h-5 mr-3 group-hover/btn:rotate-90 transition-transform duration-500" />
                      Open Builder
                      <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </Button>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-sky-500/20 to-transparent rounded-br-full"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-500/20 to-transparent rounded-tl-full"></div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

// Cookie Consent Banner
function CookieConsentBanner({
  onAccept,
  onDecline,
  onSettings,
}: {
  onAccept: () => void;
  onDecline: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-6 w-full max-w-md z-50 animate-in slide-in-from-bottom-8 duration-700">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>

      {/* Main card */}
      <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-2xl border border-sky-500/30 rounded-2xl p-6 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-500/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-2xl"></div>

        <div className="relative space-y-4">
          {/* Header with animated cookie icon */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full blur opacity-60 animate-pulse"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-sky-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="currentColor"
                      opacity="0.2"
                    />
                    <circle cx="8" cy="9" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="10" r="1.2" fill="currentColor" />
                    <circle cx="10" cy="14" r="1.3" fill="currentColor" />
                    <circle cx="16" cy="15" r="1.4" fill="currentColor" />
                    <circle cx="12" cy="7" r="1" fill="currentColor" />
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                      fill="currentColor"
                      opacity="0.6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                Cookie Settings
                <span className="text-xs px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 rounded-full text-sky-400">
                  GDPR Compliant
                </span>
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                We use cookies to power up your experience! Our cookies help us
                remember your PC configurations, analyse performance, and serve
                you the best content.
                <button
                  onClick={onSettings}
                  className="text-sky-400 hover:text-sky-300 underline decoration-sky-500/50 underline-offset-2 transition-colors ml-1"
                >
                  Learn more
                </button>
              </p>
            </div>
          </div>

          {/* Cookie types quick view */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center hover:border-sky-500/30 transition-colors">
              <div className="text-xs text-gray-400">Essential</div>
              <div className="text-xs text-green-400 font-bold mt-1">
                ✓ Active
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center hover:border-sky-500/30 transition-colors">
              <div className="text-xs text-gray-400">Analytics</div>
              <div className="text-xs text-sky-400 font-bold mt-1">
                Optional
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center hover:border-sky-500/30 transition-colors">
              <div className="text-xs text-gray-400">Marketing</div>
              <div className="text-xs text-sky-400 font-bold mt-1">
                Optional
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDecline}
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
            >
              Essential Only
            </Button>
            <Button
              size="sm"
              onClick={onAccept}
              className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
            >
              Accept All 🚀
            </Button>
          </div>

          {/* Settings link */}
          <button
            onClick={onSettings}
            className="w-full text-xs text-gray-400 hover:text-sky-400 transition-colors text-center py-1"
          >
            ⚙️ Customise Cookie Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

// Legal Pages
function TermsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
          Terms of Service
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing and using Vortex PCs Ltd services, you accept and
              agree to be bound by the terms and provision of this agreement.
              These terms apply to all visitors, users and others who access or
              use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              2. Custom PC Building Services
            </h2>
            <p>
              Vortex PCs Ltd provides custom PC building services with a
              standard 5-day build time from order confirmation. Build times may
              vary during peak periods or for specialised configurations. All
              custom builds come with a comprehensive 3-year warranty covering
              parts and labour.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              3. Warranty Terms
            </h2>
            <p>
              Our 3-year warranty covers manufacturing defects and component
              failures under normal use. The warranty does not cover damage due
              to misuse, accidents, modifications, or normal wear and tear.
              Warranty claims require proof of purchase and must be reported
              within the warranty period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              4. Payment and Pricing
            </h2>
            <p>
              All prices are listed in GBP and include VAT where applicable.
              Payment is required before build commencement. We accept major
              credit cards, debit cards, and bank transfers. Prices are subject
              to change without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              5. Returns and Refunds
            </h2>
            <p>
              Custom-built PCs can be returned within 14 days of delivery if
              unopened and in original condition. Opened systems can only be
              returned if defective. Return shipping costs are the
              responsibility of the customer unless the return is due to our
              error.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              6. Contact Information
            </h2>
            <p>
              For questions about these Terms of Service, please contact us at
              legal@vortexpcs.com or call +44 123 456 789.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function PrivacyPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us, such as when
              you create an account, make a purchase, or contact us. This
              includes your name, email address, phone number, shipping address,
              and payment information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfil your orders</li>
              <li>Provide customer support</li>
              <li>Send you updates about your orders</li>
              <li>Improve our services and website</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              3. Information Sharing
            </h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal
              information to third parties without your consent, except as
              described in this privacy policy. We may share information with
              trusted partners who assist us in operating our website and
              conducting our business.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              4. Data Security
            </h2>
            <p>
              We implement appropriate security measures to protect your
              personal information against unauthorised access, alteration,
              disclosure, or destruction. However, no method of transmission
              over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              5. Your Rights
            </h2>
            <p>
              You have the right to access, update, or delete your personal
              information. You can also opt out of marketing communications at
              any time. Contact us at privacy@vortexpcs.com to exercise these
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              6. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify you of any changes by posting the new privacy policy on
              this page and updating the "last updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
          Cookie Policy
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              1. What Are Cookies
            </h2>
            <p>
              Cookies are small text files that are placed on your computer or
              mobile device when you visit a website. They are widely used to
              make websites work more efficiently and provide information to
              website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              2. Types of Cookies We Use
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  Essential Cookies
                </h3>
                <p>
                  These cookies are necessary for the website to function
                  properly. They enable basic functions like page navigation,
                  access to secure areas, and shopping cart functionality.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  Performance Cookies
                </h3>
                <p>
                  These cookies collect information about how visitors use our
                  website, such as which pages are visited most often. This data
                  helps us improve how our website works.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  Functional Cookies
                </h3>
                <p>
                  These cookies allow the website to remember choices you make
                  and provide enhanced, more personal features such as
                  remembering your preferences.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  Marketing Cookies
                </h3>
                <p>
                  These cookies are used to deliver advertisements more relevant
                  to you and your interests. They also help limit the number of
                  times you see an advertisement.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              3. Managing Cookies
            </h2>
            <p>
              You can control and manage cookies in various ways. Please note
              that removing or blocking cookies can impact your user experience
              and parts of our website may no longer be fully accessible.
            </p>

            <div className="mt-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
              <h4 className="font-bold text-sky-400 mb-2">Browser Settings</h4>
              <p className="text-sm">
                Most browsers allow you to refuse cookies or alert you when
                cookies are being sent. Check your browser's help section for
                instructions on how to manage cookies.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              4. Third-Party Cookies
            </h2>
            <p>
              Some cookies on our website are set by third-party services. We
              use these services for analytics, advertising, and social media
              features. These third parties may use cookies to collect
              information about your online activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              5. Updates to This Policy
            </h2>
            <p>
              We may update this cookie policy from time to time to reflect
              changes in technology, legislation, or our business practices.
              Please check this page regularly for updates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              6. Contact Us
            </h2>
            <p>
              If you have any questions about our use of cookies, please contact
              us at privacy@vortexpcs.com or call +44 123 456 789.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import { Navigation } from "./components/Navigation";
import { PCConfigurator } from "./components/PCConfigurator";

interface BuildConfig {
  budget?: string;
  useCase?: string;
  [key: string]: any;
}
import { ContactPage } from "./components/ContactPage";
import { MembersDashboard } from "./components/MembersDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoginPage } from "./components/LoginPage";
import { ShoppingCart } from "./components/ShoppingCart";
import { CookieBar } from "./components/CookieBar";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { AIAssistant } from "./components/AIAssistant";
import { Toaster } from "./components/ui/sonner";
const logoImage = "/vortexpcs-logo-light.png";

type Page =
  | "home"
  | "finder"
  | "configurator"
  | "repair"
  | "contact"
  | "dashboard"
  | "admin"
  | "login"
  | "privacy"
  | "terms"
  | "cart";
type UserRole = "customer" | "admin" | null;

interface CartItem {
  id: string;
  type: "build" | "addon";
  name: string;
  components?: any;
  addOns?: any[];
  price: number;
  quantity: number;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [recommendedBuild, setRecommendedBuild] = useState<
    Partial<BuildConfig> | undefined
  >();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    if (role === "admin") {
      setCurrentPage("admin");
    } else {
      setCurrentPage("dashboard");
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentPage("home");
  };

  const handlePCFinderComplete = (build: BuildConfig) => {
    setRecommendedBuild(build);
    setCurrentPage("configurator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (item: Omit<CartItem, "id" | "quantity">) => {
    const newItem: CartItem = {
      ...item,
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: 1,
    };
    setCartItems([...cartItems, newItem]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(
      cartItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative">
      {/* Premium Background Effects */}
      <BackgroundEffects />

      {/* Navigation - hide on login page */}
      {currentPage !== "login" && (
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userRole={userRole}
          cartItemCount={cartItems.length}
        />
      )}

      {/* Page Content */}
      {currentPage === "home" && <HomePage setCurrentView={handleNavigate} />}

      {currentPage === "finder" && (
        <PCFinder
          onNavigate={handleNavigate}
          onComplete={handlePCFinderComplete}
        />
      )}

      {currentPage === "configurator" && (
        <PCConfigurator
          initialBuild={recommendedBuild}
          onNavigate={handleNavigate}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentPage === "repair" && (
        <RepairService onNavigate={(page: Page) => setCurrentPage(page)} />
      )}

      {currentPage === "cart" && (
        <ShoppingCart
          cartItems={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === "contact" && <ContactPage onNavigate={handleNavigate} />}

      {currentPage === "dashboard" && userRole === "customer" && (
        <MembersDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
      )}

      {currentPage === "admin" && userRole === "admin" && (
        <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
      )}

      {currentPage === "login" && (
        <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />
      )}

      {currentPage === "privacy" && <PrivacyPage onNavigate={handleNavigate} />}

      {currentPage === "terms" && <TermsPage onNavigate={handleNavigate} />}

      {/* Cookie Bar */}
      <CookieBar onNavigate={handleNavigate} />

      {/* AI Assistant - hide on login page */}
      {currentPage !== "login" && (
        <AIAssistant
          currentPage={currentPage}
          userContext={{
            budget:
              recommendedBuild?.budget !== undefined
                ? Number(recommendedBuild.budget)
                : undefined,
            useCase: recommendedBuild?.useCase,
          }}
        />
      )}

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />

      {/* Footer */}
      <footer className="border-t border-white/10 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img
                  src={logoImage}
                  alt="VortexPCs Logo"
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-gray-400">
                UK's premier custom PC builder. Every PC is built to order with
                premium components and lifetime support.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm">Products</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => handleNavigate("finder")}
                    className="hover:text-white transition-colors"
                  >
                    PC Finder
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate("configurator")}
                    className="hover:text-white transition-colors"
                  >
                    Build Your PC
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate("repair")}
                    className="hover:text-white transition-colors"
                  >
                    Collect & Return
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => handleNavigate("dashboard")}
                    className="hover:text-white transition-colors"
                  >
                    My Account
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate("contact")}
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    FAQ
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    Warranty
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button className="hover:text-white transition-colors">
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate("terms")}
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate("privacy")}
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>© Copyright 2025 Vortex PCs Ltd. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Made with precision in the UK</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
