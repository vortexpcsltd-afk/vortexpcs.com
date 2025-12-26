import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Shield,
  Award,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  fetchContactInformation,
  fetchSettings,
  type ContactInformation,
  type Settings,
} from "../services/cms";
import { useNavigation } from "../contexts/NavigationContext";
const vortexLogo = "/vortexpcs-logo.png";

export function Footer() {
  const { navigate } = useNavigation();
  const currentYear = new Date().getFullYear();
  const [contactInfo, setContactInfo] = useState<ContactInformation | null>(
    null
  );
  const [settings, setSettings] = useState<Settings | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [ci, s] = await Promise.all([
        fetchContactInformation(),
        fetchSettings(),
      ]);
      setContactInfo(ci);
      setSettings(s);

      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { version?: string };
          if (data?.version) setAppVersion(String(data.version));
        }
      } catch {
        // ignore version fetch errors
      }
    };
    load();
  }, []);

  const productLinks = [
    { label: "PC Finder", view: "pc-finder" },
    { label: "Custom PC Builder", view: "pc-builder" },
    { label: "3D Builder", view: "visual-configurator" },
    { label: "Gaming Laptops", view: "laptops" },
    { label: "Business Solutions", view: "business-solutions" },
  ];

  const supportLinks = [
    { label: "Repair Service", view: "repair" },
    { label: "Warranty Information", view: "warranty" },
    { label: "Technical Support", view: "support" },
    { label: "FAQs", view: "faq" },
    { label: "Build Status", view: "member" },
  ];

  const companyLinks = [
    { label: "About Us", view: "about" },
    { label: "Our Process", view: "process" },
    { label: "Quality Standards", view: "quality" },
    { label: "Vacancies", view: "vacancies" },
    { label: "Member Area", view: "member" },
    { label: "Blog", view: "blog" },
  ];

  const legalLinks = [
    { label: "Terms of Service", view: "terms" },
    { label: "Privacy Policy", view: "privacy" },
    { label: "Cookie Policy", view: "cookies" },
    { label: "Returns & Refunds", view: "returns" },
  ];

  return (
    <footer className="relative mt-32 overflow-hidden backdrop-blur-xl bg-black/40">
      {/* Premium gradient background with layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent"></div>

      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>

      <div className="relative z-10">
        {/* Premium hero section */}
        <div className="border-b border-white/5">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Logo */}
              <div className="flex justify-center mb-0.5">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-3xl group-hover:blur-[64px] transition-all duration-500"></div>
                  <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-60 lg:h-60 transition-transform duration-500 group-hover:scale-110">
                    <img
                      src={vortexLogo}
                      alt="Vortex PCs"
                      width="240"
                      height="240"
                      loading="lazy"
                      className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(14,165,233,0.7)]"
                    />
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Premium custom-built PCs engineered for peak performance.
                  5-day builds, 3-year warranties, and uncompromising quality
                  across the UK.
                </p>
              </div>

              {/* Premium trust badges */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:border-sky-500/30 transition-all">
                    <Shield className="w-5 h-5 text-sky-400" />
                    <div className="text-left">
                      <div className="text-xs text-gray-500">
                        Industry Leading
                      </div>
                      <div className="text-sm text-white">3-Year Warranty</div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:border-sky-500/30 transition-all">
                    <Zap className="w-5 h-5 text-sky-400" />
                    <div className="text-left">
                      <div className="text-xs text-gray-500">Express</div>
                      <div className="text-sm text-white">5-Day Build</div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:border-sky-500/30 transition-all">
                    <Award className="w-5 h-5 text-sky-400" />
                    <div className="text-left">
                      <div className="text-xs text-gray-500">Certified</div>
                      <div className="text-sm text-white">Premium Parts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Security Badges */}
              <div className="flex flex-wrap justify-center items-center gap-3 pt-6 pb-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">SSL Secure</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                    alt="Stripe"
                    className="h-3 opacity-70"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
                  <span className="text-xs text-gray-400">
                    Visa • Mastercard • Amex
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                    alt="PayPal"
                    className="h-3 opacity-70"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main footer content */}
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-16">
            {/* Products */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-white tracking-wide relative inline-block text-sm sm:text-base">
                  Products
                </h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-sky-400 to-transparent"></div>
              </div>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="group flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-sky-400 transition-all duration-300"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      <span>{link.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-white tracking-wide relative inline-block text-sm sm:text-base">
                  Support
                </h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-sky-400 to-transparent"></div>
              </div>
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="group flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-sky-400 transition-all duration-300"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      <span>{link.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-white tracking-wide relative inline-block text-sm sm:text-base">
                  Company
                </h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-sky-400 to-transparent"></div>
              </div>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="group flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-sky-400 transition-all duration-300"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      <span>{link.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-white tracking-wide relative inline-block text-sm sm:text-base">
                  Get in Touch
                </h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-sky-400 to-transparent"></div>
              </div>
              <ul className="space-y-4">
                <li>
                  <a
                    href={`mailto:${
                      contactInfo?.email || "info@vortexpcs.com"
                    }`}
                    className="group flex items-start gap-3 text-xs sm:text-sm text-gray-400 hover:text-sky-400 transition-colors"
                  >
                    <Mail className="w-4 h-4 mt-0.5 text-sky-400 flex-shrink-0" />
                    <span>{contactInfo?.email || "info@vortexpcs.com"}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${(contactInfo?.phone || "01603 975440").replace(
                      /\s+/g,
                      ""
                    )}`}
                    className="group flex items-start gap-3 text-xs sm:text-sm text-gray-400 hover:text-sky-400 transition-colors"
                  >
                    <Phone className="w-4 h-4 mt-0.5 text-sky-400 flex-shrink-0" />
                    <span>{contactInfo?.phone || "01603 975440"}</span>
                  </a>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-400">
                  <Clock className="w-4 h-4 mt-0.5 text-sky-400 flex-shrink-0" />
                  <div>
                    {contactInfo?.businessHours ? (
                      (() => {
                        // Group consecutive days with same hours
                        const hours = contactInfo.businessHours!;
                        const grouped: Array<{ label: string; hours: string }> =
                          [];

                        // Check Mon-Fri
                        const weekdayHours = hours.monday;
                        const allWeekdaysSame = [
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                        ].every((day) => hours[day] === weekdayHours);

                        if (allWeekdaysSame && weekdayHours) {
                          grouped.push({
                            label: "Mon-Fri",
                            hours: weekdayHours,
                          });
                        } else {
                          // List individually if different
                          [
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                          ].forEach((day) => {
                            if (hours[day]) {
                              grouped.push({
                                label:
                                  day.charAt(0).toUpperCase() + day.slice(1, 3),
                                hours: hours[day],
                              });
                            }
                          });
                        }

                        // Add Saturday
                        if (hours.saturday) {
                          grouped.push({ label: "Sat", hours: hours.saturday });
                        }

                        // Add Sunday
                        if (hours.sunday) {
                          grouped.push({ label: "Sun", hours: hours.sunday });
                        }

                        return grouped.map((item, index) => (
                          <div key={index}>
                            {item.label}: {item.hours}
                          </div>
                        ));
                      })()
                    ) : (
                      <>
                        <div>Mon-Fri: 08:30-18:00</div>
                        <div>Sat: 09:00-16:00</div>
                        <div>Sun: Closed</div>
                      </>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-400">
                  <MapPin className="w-4 h-4 mt-0.5 text-sky-400 flex-shrink-0" />
                  <span>
                    {contactInfo?.address || "London, United Kingdom"}
                  </span>
                </li>
              </ul>

              {/* Social Media */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <a
                    href={settings?.socialLinks?.facebook || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Facebook"
                    className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-sky-500/10 hover:border-sky-500/30 hover:scale-110 transition-all duration-300 group"
                  >
                    <Facebook className="w-4 h-4 text-gray-400 group-hover:text-sky-400 transition-colors" />
                  </a>
                  <a
                    href={settings?.socialLinks?.twitter || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Twitter"
                    className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-sky-500/10 hover:border-sky-500/30 hover:scale-110 transition-all duration-300 group"
                  >
                    <Twitter className="w-4 h-4 text-gray-400 group-hover:text-sky-400 transition-colors" />
                  </a>
                  <a
                    href={settings?.socialLinks?.instagram || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Instagram"
                    className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-sky-500/10 hover:border-sky-500/30 hover:scale-110 transition-all duration-300 group"
                  >
                    <Instagram className="w-4 h-4 text-gray-400 group-hover:text-sky-400 transition-colors" />
                  </a>
                  <a
                    href={settings?.socialLinks?.linkedin || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on LinkedIn"
                    className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-sky-500/10 hover:border-sky-500/30 hover:scale-110 transition-all duration-300 group"
                  >
                    <Linkedin className="w-4 h-4 text-gray-400 group-hover:text-sky-400 transition-colors" />
                  </a>
                  <a
                    href={settings?.socialLinks?.youtube || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Subscribe to our YouTube channel"
                    className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-sky-500/10 hover:border-sky-500/30 hover:scale-110 transition-all duration-300 group"
                  >
                    <Youtube className="w-4 h-4 text-gray-400 group-hover:text-sky-400 transition-colors" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider with gradient */}
          <div className="relative mb-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="space-y-6">
            {/* Legal links */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
              {legalLinks.map((link, index) => (
                <React.Fragment key={link.label}>
                  <button
                    onClick={() => navigate(link.view)}
                    className="text-xs text-gray-500 hover:text-sky-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm px-1"
                  >
                    {link.label}
                  </button>
                  {index < legalLinks.length - 1 && (
                    <span className="text-gray-700">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Copyright and badges */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-xs text-gray-500 text-center md:text-left">
                <p>
                  {contactInfo?.copyrightText ||
                    `© ${currentYear} Vortex PCs Ltd. All rights reserved.`}
                </p>
                <p className="mt-1 text-gray-600">
                  {contactInfo?.companyRegistrationNumber &&
                    `Company Registration No. ${contactInfo.companyRegistrationNumber}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {appVersion && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 backdrop-blur-xl border border-sky-500/30 rounded-full">
                    <span className="text-xs text-sky-400 font-medium">
                      v{appVersion}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
                  <span className="text-xs text-gray-400">
                    Designed & Built in the UK
                  </span>
                  <img
                    src="/union-jack.svg"
                    alt="Union Jack"
                    className="w-5 h-3 rounded-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
