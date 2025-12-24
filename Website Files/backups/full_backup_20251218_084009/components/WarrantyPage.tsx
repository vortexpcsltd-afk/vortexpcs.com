import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wrench,
  Phone,
  Clock,
  Package,
  ChevronRight,
} from "lucide-react";

interface WarrantyPageProps {
  onNavigate?: (view: string) => void;
}

export function WarrantyPage({ onNavigate }: WarrantyPageProps) {
  return (
    <div className="relative">
      {/* Top gradient accents */}
      <div className="absolute -top-32 -left-16 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -top-20 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>

      {/* Hero */}
      <section className="relative container mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs">Peace of mind guaranteed</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            3-Year Warranty for Custom PCs
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Every Vortex PC is covered by our comprehensive 3-year warranty in
            the UK, with lifetime technical support. We build to last—if
            something goes wrong, we&apos;ll help make it right quickly and
            fairly.
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
              onClick={() => onNavigate?.("terms")}
              className="border-white/20 hover:border-white/40"
            >
              <FileText className="w-4 h-4 mr-2" /> Read Full Terms
            </Button>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: ShieldCheck,
              title: "3 Years Cover",
              desc: "Hardware warranty with UK-based service & support.",
            },
            {
              icon: Clock,
              title: "Fast Turnaround",
              desc: "Swift assessments and repairs to minimise downtime.",
            },
            {
              icon: Wrench,
              title: "Lifetime Support",
              desc: "Free technical help for the lifetime of your system.",
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
                <p className="text-gray-300 text-sm">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What&apos;s covered / not covered */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">
                  What&apos;s Covered
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  Manufacturer defects in components supplied with your PC
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  System assembly quality and workmanship issues
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  Faulty parts within the warranty period (repair or replace)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  Remote diagnostics and troubleshooting support
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-white">
                  What&apos;s Not Covered
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Damage from misuse, liquid ingress, electrical surges, or
                  unauthorised repairs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Software issues, viruses, or data loss (we can advise on best
                  practices)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Wear-and-tear items like thermal paste beyond service
                  intervals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Accidental or cosmetic damage not affecting function
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How to make a claim */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-sky-400" />
              <CardTitle className="text-white">How to Make a Claim</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal ml-5 space-y-3 text-gray-300 text-sm">
              <li>
                Contact our team via the{" "}
                <button
                  onClick={() => onNavigate?.("contact")}
                  className="text-sky-400 hover:text-sky-300 underline decoration-sky-500/50 underline-offset-2"
                >
                  contact page
                </button>{" "}
                with a brief description of the issue.
              </li>
              <li>
                We&apos;ll perform remote diagnostics. If hardware repair is
                needed, we&apos;ll arrange return or on-site options where
                applicable.
              </li>
              <li>
                Package the PC securely. We&apos;ll advise on shipping labels
                and insurance.
              </li>
              <li>
                We repair or replace faulty parts and return the system
                promptly.
              </li>
            </ol>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
                Proof of purchase required
              </Badge>
              <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
                Data backup recommended
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* UK consumer rights */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-16">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-sky-400" />
              <CardTitle className="text-white">
                Your Consumer Rights (UK)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300 text-sm">
            <p>
              Our warranty works alongside your statutory rights under UK law
              (Consumer Rights Act 2015). If a fault develops, you may be
              entitled to a repair, replacement, or refund depending on
              circumstances and time since purchase.
            </p>
            <p>
              We aim to resolve issues quickly and fairly. If you believe your
              rights have been affected, speak to us first—we&apos;re here to
              help.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => onNavigate?.("faq")}
                className="border-white/20 hover:border-white/40"
              >
                View Support FAQs <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => onNavigate?.("contact")}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                Get Help Now <Phone className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default WarrantyPage;
