import React from "react";
import {
  Cpu,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";

interface FooterCleanProps {
  onNavigate: (page: string) => void;
}

export function FooterClean({ onNavigate }: FooterCleanProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-slate-950 to-black border-t border-white/5 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-sky-600/20 to-blue-600/20 backdrop-blur-xl border border-sky-500/30 rounded-xl p-3 mr-3">
                  <Cpu className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Vortex PCs</h3>
                  <p className="text-xs text-sky-400 uppercase tracking-wider">Premium Custom Builds</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Building premium custom PCs with the highest quality components, expert craftsmanship, and comprehensive support. Your dream PC awaits.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-400">
                  <Mail className="w-4 h-4 mr-3 text-sky-400" />
                  <a href="mailto:hello@vortexpcs.co.uk" className="hover:text-sky-400 transition-colors">
                    hello@vortexpcs.co.uk
                  </a>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Phone className="w-4 h-4 mr-3 text-sky-400" />
                  <a href="tel:+442012345678" className="hover:text-sky-400 transition-colors">
                    +44 (0) 20 1234 5678
                  </a>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <MapPin className="w-4 h-4 mr-3 text-sky-400" />
                  <span>London, United Kingdom</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-6">Services</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => onNavigate('pc-finder')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    PC Finder
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('pc-builder')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    PC Builder
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('configurator')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    PC Configurator
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('repair')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    Repair Service
                  </button>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => onNavigate('about')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('contact')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('member-area')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    Member Area
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal & Social */}
            <div>
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-3 mb-6">
                <li>
                  <button 
                    onClick={() => onNavigate('privacy')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('terms')}
                    className="text-gray-400 hover:text-sky-400 transition-colors text-sm"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>

              {/* Social Media */}
              <div>
                <h5 className="text-white font-semibold mb-4">Follow Us</h5>
                <div className="flex gap-3">
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-sky-500/20 hover:border-sky-500/30 transition-all group"
                  >
                    <Facebook className="w-4 h-4 text-gray-400 group-hover:text-sky-400" />
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-sky-500/20 hover:border-sky-500/30 transition-all group"
                  >
                    <Twitter className="w-4 h-4 text-gray-400 group-hover:text-sky-400" />
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-sky-500/20 hover:border-sky-500/30 transition-all group"
                  >
                    <Instagram className="w-4 h-4 text-gray-400 group-hover:text-sky-400" />
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-sky-500/20 hover:border-sky-500/30 transition-all group"
                  >
                    <Youtube className="w-4 h-4 text-gray-400 group-hover:text-sky-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} Vortex PCs Ltd. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Premium Custom PCs • Expert Craftsmanship • UK Based
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}