import React from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  Cpu,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Shield,
  Clock,
  Award,
  Users,
} from "lucide-react";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Services",
      links: [
        { label: "PC Finder", id: "pc-finder" },
        { label: "PC Builder", id: "pc-builder" },
        { label: "PC Configurator", id: "configurator" },
        { label: "Repair Service", id: "repair" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", id: "about" },
        { label: "Contact", id: "contact" },
        { label: "Privacy Policy", id: "privacy" },
        { label: "Terms of Service", id: "terms" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", id: "help" },
        { label: "Warranty", id: "warranty" },
        { label: "Returns", id: "returns" },
        { label: "Technical Support", id: "tech-support" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
  ];

  const trustSignals = [
    { icon: Shield, label: "3-Year Warranty", desc: "Comprehensive coverage" },
    { icon: Clock, label: "5-Day Builds", desc: "Fast turnaround" },
    { icon: Award, label: "Premium Parts", desc: "Top-tier components" },
    { icon: Users, label: "Expert Support", desc: "Dedicated team" },
  ];

  return (
    <footer className="relative bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 overflow-hidden">
      {/* Premium gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent"></div>

      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-30"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Trust Signals Section */}
        <div className="py-16 border-b border-white/5">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent mb-4">
              Why Choose Vortex PCs?
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We're committed to delivering the ultimate PC building experience
              with unmatched quality and service.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustSignals.map((signal, index) => (
              <div key={index} className="relative group">
                {/* Hover glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-sky-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 rounded-2xl"></div>

                <div className="relative bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 text-center hover:border-sky-500/30 transition-all duration-500 group-hover:translate-y-[-2px]">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl flex items-center justify-center group-hover:from-sky-500/30 group-hover:to-blue-500/30 transition-all duration-300">
                    <signal.icon className="w-6 h-6 text-sky-400" />
                  </div>
                  <h4 className="font-bold text-white mb-2">{signal.label}</h4>
                  <p className="text-sm text-gray-400">{signal.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-sky-600/20 to-blue-600/20 backdrop-blur-xl border border-sky-500/30 rounded-xl p-3 mr-3">
                  <Cpu className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-sky-200 to-blue-300 bg-clip-text text-transparent">
                    Vortex PCs
                  </h2>
                  <p className="text-xs text-sky-400/80 font-medium uppercase tracking-wider">
                    Premium Custom Builds
                  </p>
                </div>
              </div>

              <p className="text-gray-400 mb-8 leading-relaxed max-w-md">
                Building premium custom PCs with the highest quality components,
                expert craftsmanship, and comprehensive support. Your dream PC
                awaits.
              </p>

              {/* Contact Info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-sm text-gray-400 hover:text-sky-400 transition-colors">
                  <Mail className="w-4 h-4 mr-3 text-sky-500" />
                  <span>hello@vortexpcs.co.uk</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 hover:text-sky-400 transition-colors">
                  <Phone className="w-4 h-4 mr-3 text-sky-500" />
                  <span>+44 (0) 20 1234 5678</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 hover:text-sky-400 transition-colors">
                  <MapPin className="w-4 h-4 mr-3 text-sky-500" />
                  <span>London, United Kingdom</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="relative p-3 bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-xl hover:border-sky-400/40 transition-all duration-300 group"
                    aria-label={social.label}
                  >
                    {/* Hover glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/0 via-sky-500/30 to-blue-500/0 opacity-0 group-hover:opacity-100 blur transition-all duration-300 rounded-xl"></div>

                    <social.icon className="w-5 h-5 text-sky-400 group-hover:text-sky-300 relative z-10" />
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            {footerSections.map((section, index) => (
              <div key={index}>
                <h3 className="font-bold text-white mb-6 text-lg">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Button
                        variant="ghost"
                        onClick={() => onNavigate(link.id)}
                        className="h-auto p-0 text-gray-400 hover:text-sky-400 font-normal justify-start transition-colors duration-200"
                      >
                        {link.label}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Bottom Section */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              <span>© {currentYear} Vortex PCs. All rights reserved.</span>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <Button
                variant="ghost"
                onClick={() => onNavigate("privacy")}
                className="h-auto p-0 text-gray-400 hover:text-sky-400 font-normal transition-colors duration-200"
              >
                Privacy Policy
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate("terms")}
                className="h-auto p-0 text-gray-400 hover:text-sky-400 font-normal transition-colors duration-200"
              >
                Terms of Service
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate("cookies")}
                className="h-auto p-0 text-gray-400 hover:text-sky-400 font-normal transition-colors duration-200"
              >
                Cookie Policy
              </Button>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Built with</span>
              <span className="text-red-400">♥</span>
              <span>in the UK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent"></div>
    </footer>
  );
}
