import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Zap,
  Timer,
  Wrench,
  Cpu,
  Gauge,
  ShieldCheck,
  ClipboardCheck,
  Truck,
  Package,
  Mail,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

interface OurProcessPageProps {
  onNavigate?: (view: string) => void;
}

export function OurProcessPage({ onNavigate }: OurProcessPageProps) {
  const steps = [
    {
      icon: CalendarDays,
      title: "Order Confirmed",
      day: "Day 0",
      desc: "We review your configuration, verify compatibility, and reserve parts.",
    },
    {
      icon: Package,
      title: "Parts Pick & QC",
      day: "Day 1",
      desc: "Components are hand-picked and inspected for any visible defects.",
    },
    {
      icon: Wrench,
      title: "Precision Assembly",
      day: "Day 2",
      desc: "Careful build with premium cable management and airflow planning.",
    },
    {
      icon: Gauge,
      title: "Burn-in & Stress Tests",
      day: "Day 3",
      desc: "Multi-hour CPU, GPU, and memory validation under load for stability.",
    },
    {
      icon: Cpu,
      title: "OS, Drivers & Optimisation",
      day: "Day 4",
      desc: "Latest drivers, BIOS checks, performance tuning, and benchmarks.",
    },
    {
      icon: ShieldCheck,
      title: "Final QA & Dispatch",
      day: "Day 5",
      desc: "Comprehensive quality checks, secure packing, and courier handoff.",
    },
  ];

  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute -top-24 -left-16 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute -top-16 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

      {/* Hero */}
      <section className="relative container mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 mb-4">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Built fast, built right</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Our Build Process
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We aim for a 5-day turnaround on new builds. While not guaranteed,
            our process is engineered to deliver your PC quickly without ever
            compromising on quality.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
              <Timer className="w-3.5 h-3.5 mr-1" /> Target: 5-Day Turnaround
            </Badge>
            <Badge className="bg-white/5 border-white/10 text-gray-300">
              Not guaranteed — quality first
            </Badge>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => onNavigate?.("pc-builder")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              Start Building <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.("pc-finder")}
              className="border-white/20 hover:border-white/40"
            >
              Use PC Finder <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, idx) => (
            <Card
              key={idx}
              className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <s.icon className="w-5 h-5 text-sky-400" />
                    <CardTitle className="text-white text-lg">
                      {s.title}
                    </CardTitle>
                  </div>
                  <span className="text-xs text-gray-400">{s.day}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What can affect timelines */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-5 h-5 text-sky-400" />
              <CardTitle className="text-white">
                What Can Affect Turnaround
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-sky-400">•</span> Stock availability or
                special-order components
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-400">•</span> Complex builds, custom
                loops, or unique requests
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-400">•</span> Extensive data
                migrations or software configuration
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-400">•</span> Seasonal demand peaks
                and courier delays
              </li>
            </ul>
            <div className="mt-4 text-xs text-gray-400">
              We always communicate clearly and set expectations at each stage.
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Communication & shipping */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-white">
                  Communication & Updates
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <p>
                We keep you informed at key milestones and provide tracking on
                dispatch.
              </p>
              <ul className="space-y-2">
                <li>Milestone emails for assembly, testing, and shipping</li>
                <li>
                  Build status available in your{" "}
                  <button
                    onClick={() => onNavigate?.("member")}
                    className="text-sky-400 hover:text-sky-300 underline decoration-sky-500/50 underline-offset-2"
                  >
                    Member Area
                  </button>
                </li>
                <li>Friendly UK-based support to answer questions anytime</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-white">
                  Protection & Shipping
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <p>
                Systems are packed with anti-tamper fittings and internal
                transport supports where needed.
              </p>
              <ul className="space-y-2">
                <li>Drop-tested packaging with foam inserts</li>
                <li>Courier tracking and insured delivery</li>
                <li>Setup guide included for a smooth first boot</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onNavigate?.("pc-builder")}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
          >
            Start Your Build <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate?.("contact")}
            className="border-white/20 hover:border-white/40"
          >
            Questions? Contact Us <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default OurProcessPage;
