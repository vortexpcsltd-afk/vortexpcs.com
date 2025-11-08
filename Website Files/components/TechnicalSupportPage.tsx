import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  LifeBuoy,
  Phone,
  Mail,
  MessageCircle,
  Wrench,
  Shield,
  HelpCircle,
  Settings,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface TechnicalSupportPageProps {
  onNavigate?: (view: string) => void;
}

export function TechnicalSupportPage({
  onNavigate,
}: TechnicalSupportPageProps) {
  return (
    <div className="relative">
      {/* Glow accents */}
      <div className="absolute -top-24 -left-12 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute -top-16 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

      {/* Hero */}
      <section className="relative container mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 mb-4">
            <LifeBuoy className="w-4 h-4" />
            <span className="text-xs">We’re here to help</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Technical Support
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
            UK-based experts ready to assist with diagnostics, repairs, and
            performance tuning. Fast responses, clear steps, and lifetime
            guidance for your Vortex PC.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => onNavigate?.("contact")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              <Phone className="w-4 h-4 mr-2" /> Contact Support
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.("faq")}
              className="border-white/20 hover:border-white/40"
            >
              <HelpCircle className="w-4 h-4 mr-2" /> View FAQs
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Phone,
              title: "Contact Support",
              desc: "Speak to a specialist for quick help.",
              action: () => onNavigate?.("contact"),
              cta: "Get in touch",
            },
            {
              icon: HelpCircle,
              title: "Troubleshooting Guides",
              desc: "Find answers to common issues.",
              action: () => onNavigate?.("faq"),
              cta: "Open FAQs",
            },
            {
              icon: Wrench,
              title: "Book a Repair",
              desc: "Hardware fault? We’ll arrange service.",
              action: () => onNavigate?.("repair"),
              cta: "Start repair",
            },
            {
              icon: Shield,
              title: "Warranty Info",
              desc: "3-year UK warranty coverage.",
              action: () => onNavigate?.("warranty"),
              cta: "View warranty",
            },
            {
              icon: Settings,
              title: "Drivers & Updates",
              desc: "We’ll advise best sources and versions.",
              action: () => onNavigate?.("contact"),
              cta: "Ask for help",
            },
            {
              icon: MessageCircle,
              title: "Live Chat",
              desc: "Use the chat button bottom-right.",
              action: () => onNavigate?.("contact"),
              cta: "Chat or message",
            },
          ].map((item, idx) => (
            <Card
              key={idx}
              className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-sky-400" />
                  <CardTitle className="text-white text-lg">
                    {item.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">{item.desc}</p>
                <Button
                  onClick={item.action}
                  variant="outline"
                  className="border-white/20 hover:border-white/40"
                >
                  {item.cta} <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Troubleshooting Essentials */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-white">Quick Checks</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal ml-5 space-y-3 text-gray-300 text-sm">
                <li>Power cycle your PC and peripherals, reseat cables.</li>
                <li>Update GPU drivers (NVIDIA/AMD) and Windows Update.</li>
                <li>Test with minimal peripherals to isolate issues.</li>
                <li>Check thermals and fan curves; ensure airflow.</li>
                <li>Note error messages and recent changes.</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
                  Keep proof of purchase
                </Badge>
                <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
                  Back up data first
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">What We’ll Ask</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <p>
                When you contact support, having these details ready helps us
                resolve your issue faster:
              </p>
              <ul className="space-y-2">
                <li>Order number or serial, purchase date</li>
                <li>Windows version, GPU driver version</li>
                <li>Exact symptoms and steps to reproduce</li>
                <li>Any recent hardware/software changes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Phone,
              title: "Phone",
              desc: "Mon–Fri 9–6, Sat 10–4 (UK)",
              href: "tel:+441603975440",
              cta: "+44 1603 975440",
            },
            {
              icon: Mail,
              title: "Email",
              desc: "We aim to respond within 1 business day",
              href: "mailto:info@vortexpcs.com",
              cta: "info@vortexpcs.com",
            },
            {
              icon: MessageCircle,
              title: "Live Chat",
              desc: "Use the chat bubble bottom-right",
              href: undefined,
              cta: "Open chat",
            },
          ].map((ch, idx) => (
            <Card
              key={idx}
              className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ch.icon className="w-5 h-5 text-sky-400" />
                  <CardTitle className="text-white text-lg">
                    {ch.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">{ch.desc}</p>
                {ch.href ? (
                  <a
                    href={ch.href}
                    className="inline-flex items-center px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 text-gray-200 hover:text-white transition-colors"
                  >
                    {ch.cta}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => onNavigate?.("contact")}
                    className="border-white/20 hover:border-white/40"
                  >
                    {ch.cta}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TechnicalSupportPage;
