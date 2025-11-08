import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  ShieldCheck,
  CheckCircle2,
  Gauge,
  Thermometer,
  Cpu,
  Wrench,
  ClipboardCheck,
  Package,
  Zap,
  ChevronRight,
} from "lucide-react";

interface QualityStandardsPageProps {
  onNavigate?: (view: string) => void;
}

export function QualityStandardsPage({
  onNavigate,
}: QualityStandardsPageProps) {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute -top-24 -left-16 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute -top-16 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

      {/* Hero */}
      <section className="relative container mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs">Engineered. Validated. Guaranteed.</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Quality Standards
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Every Vortex PC is meticulously assembled and thoroughly tested to
            ensure it operates exactly as designed. Performance, stability,
            thermals, and acoustics are validated before dispatch.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
              <Zap className="w-3.5 h-3.5 mr-1" /> Burn‑in Tested
            </Badge>
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
              <Gauge className="w-3.5 h-3.5 mr-1" /> Benchmark Verified
            </Badge>
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> QA Signed‑Off
            </Badge>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => onNavigate?.("pc-builder")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              Start Your Build <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.("faq")}
              className="border-white/20 hover:border-white/40"
            >
              Read FAQs <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testing regimen */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Cpu,
              title: "Stability & Burn‑in",
              desc: "Sustained CPU/GPU/RAM load tests validate long‑term stability under real workloads.",
            },
            {
              icon: Thermometer,
              title: "Thermals & Acoustics",
              desc: "We verify safe operating temps and tune fan curves for balanced noise and cooling.",
            },
            {
              icon: Gauge,
              title: "Benchmarks & Validation",
              desc: "We record baseline performance so you know your system is operating to spec.",
            },
          ].map((c, i) => (
            <Card
              key={i}
              className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <c.icon className="w-5 h-5 text-sky-400" />
                  <CardTitle className="text-white text-lg">
                    {c.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* QA checklist & build craft */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-white">
                  Quality Assurance Checklist
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-sky-400">•</span> Component
                  compatibility verified (BIOS/firmware up to date)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-400">•</span> Cable management
                  optimised for airflow and serviceability
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-400">•</span> Memory profiles
                  validated (EXPO/XMP) and stress‑tested
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-400">•</span> Storage health
                  S.M.A.R.T. checks and performance verification
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-400">•</span> System drivers,
                  updates, and telemetry sanity checks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-400">•</span> Final QA sign‑off
                  sheet included with your build
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-white">
                  Build Craft & Handling
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <p>
                ESD‑safe assembly, torque‑controlled fittings, and paste
                application best practices come as standard.
              </p>
              <ul className="space-y-2">
                <li>ESD precautions and clean bench workflow</li>
                <li>Premium thermal paste and proper contact pressure</li>
                <li>Aligned cable channels and solid anchoring</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Packaging & documentation */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-white">Secure Packaging</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <p>
                Systems are braced internally where needed and shipped with
                drop‑tested, foam‑protected packaging.
              </p>
              <ul className="space-y-2">
                <li>Transport supports for GPUs/coolers where applicable</li>
                <li>Insured courier service with tracking</li>
                <li>Clear setup guide for first power‑on</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">
                  What You’ll Receive
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <ul className="space-y-2">
                <li>QA sign‑off sheet and benchmark snapshot</li>
                <li>All original manufacturer accessories and documentation</li>
                <li>Lifetime technical support details and warranty info</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={() => onNavigate?.("contact")}
                  variant="outline"
                  className="border-white/20 hover:border-white/40"
                >
                  Questions? Contact Us
                </Button>
                <Button
                  onClick={() => onNavigate?.("pc-finder")}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                >
                  Find Your PC
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default QualityStandardsPage;
