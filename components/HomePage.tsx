import React from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Cpu,
  Shield,
  Clock,
  Users,
  Settings,
  Star,
  Search,
  ArrowRight,
} from "lucide-react";

const heroBackground = "https://vortexpcs.com/gaming-keyboard.jpeg";

interface HomePageProps {
  setCurrentView: (page: string) => void;
}

export function HomePage({ setCurrentView }: HomePageProps) {
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
